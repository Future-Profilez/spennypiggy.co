<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\CheckMediaModeration;
use App\Models\PiggyPot;
use App\Rules\NoBlockedSymbols;
use App\Rules\NoExpenseOrBrandName;
use App\Services\ItemTextModeration;
use App\Services\PiggyPotStatusService;
use App\Services\RewardService;
use App\Services\UserProfileService;
use App\Support\ListingPublication;
use App\Support\RewardFileScan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;

class PiggyPotController extends Controller
{
    /**
     * Restrict this controller to creator users only.
     *
     * The Piggy Pot area is only available for creators with role === 1,
     * so any authenticated user without creator privileges must be blocked.
     */
    /**
     * Platform-owned default cover art (the pink piggy illustration) that the
     * frontend submits when the creator uploads nothing. It is a known-safe
     * asset — never send it to the Rekognition moderation scan.
     */
    private const DEFAULT_COVER_UUID = '6d5506b2-7361-4c58-8f1b-dfe1e196885a';

    /** Recent supporters shown per pot on the creator dashboard. */
    private const DASHBOARD_CONTRIBUTIONS_LIMIT = 25;

    public function __construct()
    {
        $this->middleware('auth');
        $this->middleware(function ($request, $next) {
            if (Auth::user()?->role !== 1) {
                abort(403, 'Unauthorized access.');
            }

            return $next($request);
        });
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = PiggyPot::withScheduled()->where('user_id', Auth::id())
            ->withSum(['contributions as total_raised' => function ($q) {
                $q->where('status', 'paid');
            }], 'amount')
            ->withCount(['contributions as contributions_count' => function ($q) {
                $q->where('status', 'paid');
            }])
            ->orderBy('created_at', 'desc');

        if ($request->has('pot_id') && $request->pot_id) {
            $query->where('id', $request->pot_id);
        }

        $piggyPots = $query->get();

        // Which pot the creator's PUBLIC profile is actually showing. Resolved
        // once for the page, not per row.
        //
        // ⚠️ Without this the dashboard could only report a status chip, and a
        // chip cannot answer the one question a creator has when their pot stops
        // selling: why is it gone from my profile, and what puts it back? A
        // deadline that lapsed, a pot still under review and a pot that simply
        // is not the featured one all read as "not on my profile" and each needs
        // a different action.
        $featuredPotId = PiggyPotStatusService::featuredPotId(Auth::id());

        $piggyPots->each(function ($pot) use ($featuredPotId) {
            $pot->setAttribute('visibility', PiggyPotStatusService::visibility($pot, $featuredPotId));
        });

        // Only the most recent supporters are rendered — eager-loading every
        // paid contribution pulled a long-running pot's whole history into
        // memory on each dashboard view.
        $piggyPots->each(function ($pot) {
            $pot->setRelation('contributions', $pot->contributions()
                ->where('status', 'paid')
                ->with('user:id,name,username,avatar,avatar_cdn_modifier,avatar_approved')
                ->orderByDesc('created_at')
                ->limit(self::DASHBOARD_CONTRIBUTIONS_LIMIT)
                ->get());
        });

        $allPotsList = PiggyPot::withScheduled()->where('user_id', Auth::id())
            ->orderBy('created_at', 'desc')
            ->get(['id', 'title']);

        return Inertia::render('PiggyPots/Index', [
            'piggyPots' => $piggyPots,
            'allPotsList' => $allPotsList,
            'filter_pot_id' => $request->pot_id,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // A purchasable listing needs a payment destination. Without it the pot
        // still publishes and the first supporter hits a TypeError at checkout
        // (hasCardPaymentsCapability takes a non-nullable string), so the crash
        // lands on the buyer instead of the creator who can fix it.
        if (empty(Auth::user()->account_id)) {
            return redirect()->back()->with('error', 'Please connect your Stripe account before creating a Piggy Pot.');
        }

        // Default the reward headline from the pot title so a missing field
        // never blocks creation (the pot's content IS the deliverable).
        if (! filled($request->reward_title)) {
            $request->merge(['reward_title' => (string) $request->title]);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255', new NoExpenseOrBrandName, new NoBlockedSymbols],
            'description' => 'nullable|string',
            'target_amount' => [
                'required',
                'numeric',
                function ($attribute, $value, $fail) {
                    $err = Helpers::priceWithinLimits($value, Auth::user()->default_currency ?? 'gbp', 4.99, 500);
                    if ($err) {
                        $fail($err);
                    }
                },
            ],
            'currency' => 'required|string|max:3',
            'cover_media' => 'nullable|string',
            'content_file' => RewardService::fileRule(),
            'content_description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_pinned' => 'boolean',
            'enable_leaderboard' => 'boolean',
            'allow_anonymous' => 'boolean',
        ] + RewardService::validationRules());

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        if ($linkError = RewardService::submittedLinkError($request->all())) {
            return redirect()->back()->withErrors(['reward_body' => $linkError])->withInput();
        }

        $data = $validator->validated();
        // Normalised in one place so a link is stored https-prefixed and a file
        // reward never keeps a leftover message body.
        $data = array_merge($data, RewardService::columnsWithFile($request->all()));
        $data['user_id'] = Auth::id();
        $data['payment_methods_accepted'] = in_array($request->payment_methods_accepted, ['card', 'bank', 'both'], true) ? $request->payment_methods_accepted : 'both';

        /* 🚨 LIVE ON CREATE, and the scans below retract it — see `ListingPublication`.
           This was `moderation_hold` on the reasoning that a pot must not be buyable
           for the ~20 seconds a scan takes. The simplification plan (§9) takes the
           other side of that trade for every module, because nothing could release
           the hold afterwards: there is no queue left to work it.
           ⚠️ The residual risk is unchanged in kind — with no queue worker running,
           nothing scans and nothing retracts. **Needs `queue:work`.** */
        $data['status'] = 'active';

        /* ⚠️ STILL NOT PINNED AT CREATION. The original reason (a held pot must not
           take the featured slot) is gone now that it is live immediately — but
           pinning here silently UNPINS whatever the creator had featured, which is
           a change to a different listing they did not ask for. The edit form pins. */
        $data['is_pinned'] = false;

        $piggyPot = PiggyPot::create($data);

        // Text half of the gate — on create and on update this is what holds a
        // live pot when the wording is the problem.
        ItemTextModeration::apply(
            $piggyPot,
            ['reward_title', 'reward_body', 'reward_description', 'title', 'content_description'],
            ListingPublication::heldAttributes($piggyPot)
        );

        // SFW gate: scan the cover image; record a reason if it fails moderation
        // so the reviewer knows which rows to look at hardest.
        // Skip the platform default cover — known-safe, nothing user-uploaded.
        if (! empty($piggyPot->cover_media) && ! str_contains($piggyPot->cover_media, self::DEFAULT_COVER_UUID)) {
            CheckMediaModeration::dispatch(
                PiggyPot::class,
                $piggyPot->id,
                $piggyPot->cover_media,
                ListingPublication::heldAttributes($piggyPot),
                'cover_image'
            );
        }

        /*
         * The pot's CONTENT is the product — the cover is only its shop front — and
         * the content file was the one thing here nothing ever scanned.
         */
        RewardFileScan::dispatch($piggyPot, ListingPublication::heldAttributes($piggyPot));

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot created — it is live on your page now.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $piggyPot = PiggyPot::withScheduled()->where('user_id', Auth::id())->findOrFail($id);

        // Captured before `update()` mutates the model — the scan below has to be
        // able to tell a replaced content file from an untouched one, or a re-scan
        // re-produces a false positive on a pot an admin has already released.
        $previousRewardFile = (string) RewardFileScan::currentFile($piggyPot);
        $previousCover = (string) $piggyPot->cover_media;

        // Default the reward headline from the pot title so a missing field
        // never blocks creation (the pot's content IS the deliverable).
        if (! filled($request->reward_title)) {
            $request->merge(['reward_title' => (string) $request->title]);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:255', new NoExpenseOrBrandName, new NoBlockedSymbols],
            'description' => 'nullable|string',
            'target_amount' => [
                'required',
                'numeric',
                function ($attribute, $value, $fail) {
                    $err = Helpers::priceWithinLimits($value, Auth::user()->default_currency ?? 'gbp', 4.99, 500);
                    if ($err) {
                        $fail($err);
                    }
                },
            ],
            'currency' => 'required|string|max:3',
            'cover_media' => 'nullable|string',
            'content_file' => RewardService::fileRule(),
            'content_description' => 'nullable|string',
            'deadline' => 'nullable|date',
            'is_pinned' => 'boolean',
            'enable_leaderboard' => 'boolean',
            'allow_anonymous' => 'boolean',
            'status' => 'in:active,completed,expired,archived,moderation_hold',
        ] + RewardService::validationRules());

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator)->withInput();
        }

        if ($linkError = RewardService::submittedLinkError($request->all())) {
            return redirect()->back()->withErrors(['reward_body' => $linkError])->withInput();
        }

        $data = $validator->validated();
        $data = array_merge($data, RewardService::columnsWithFile($request->all()));

        /* 🚨 THE CREATOR STILL CANNOT TYPE THEIR WAY OUT OF A HOLD. `status` is a
           field on this form, so accepting it would let a held pot be released by
           re-submitting the form with `active` — the release is decided below by
           `ListingPublication::republish`, on what this save actually changed. */
        if ($piggyPot->status === 'moderation_hold') {
            unset($data['status']);
        }

        // Giving a closed pot a future deadline reopens it.
        //
        // ⚠️ Without this the fix the dashboard tells the creator to make does not
        // work: they set a new date, the form still posts `status = expired`
        // (that IS the pot's status, so the select is showing the truth), and the
        // pot stays hidden with no indication why. The only reason a pot is
        // `expired` is that its date passed, so a date that has not is proof it
        // should be open. Deliberately does NOT touch `completed` (a reached goal
        // is not undone by a date) or `moderation_hold` (admin-only, above).
        if (($piggyPot->status === 'expired' || ($data['status'] ?? null) === 'expired')
            && array_key_exists('deadline', $data)
            && ! PiggyPotStatusService::deadlinePassed(
                $data['deadline'] ? Carbon::parse($data['deadline']) : null
            )
        ) {
            $data['status'] = 'active';
        }

        // A HELD pot cannot take the featured slot — the profile would show a
        // pinned pot nobody but the owner can see.
        if ($piggyPot->status === 'moderation_hold') {
            $data['is_pinned'] = false;
        } elseif (! empty($data['is_pinned']) && $data['is_pinned']) {
            // Unpin others
            PiggyPot::withScheduled()->where('user_id', Auth::id())->where('id', '!=', $id)->update(['is_pinned' => false]);
        }

        $piggyPot->update($data);

        /* An edit lifts a hold only where this save could have fixed it — see
           `ListingPublication::republish`. */
        ListingPublication::republish($piggyPot->refresh(), array_filter([
            (string) $piggyPot->cover_media !== $previousCover ? 'cover_image' : null,
            (string) RewardFileScan::currentFile($piggyPot) !== $previousRewardFile ? 'reward_file' : null,
        ]));

        ItemTextModeration::apply(
            $piggyPot->refresh(),
            ['reward_title', 'reward_body', 'reward_description', 'title', 'content_description'],
            ListingPublication::heldAttributes($piggyPot)
        );

        // SFW gate: re-scan the cover image on update.
        // Skip the platform default cover — known-safe, nothing user-uploaded.
        if (! empty($piggyPot->cover_media) && ! str_contains($piggyPot->cover_media, self::DEFAULT_COVER_UUID)) {
            CheckMediaModeration::dispatch(
                PiggyPot::class,
                $piggyPot->id,
                $piggyPot->cover_media,
                ListingPublication::heldAttributes($piggyPot),
                'cover_image'
            );
        }

        RewardFileScan::dispatch($piggyPot, ListingPublication::heldAttributes($piggyPot), $previousRewardFile);

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $piggyPot = PiggyPot::withScheduled()->where('user_id', Auth::id())->findOrFail($id);
        $piggyPot->delete();

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot deleted successfully');
    }
}
