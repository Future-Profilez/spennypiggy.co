<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\CheckMediaModeration;
use App\Models\PiggyPot;
use App\Services\ItemTextModeration;
use App\Services\PiggyPotStatusService;
use App\Services\RewardService;
use App\Services\UserProfileService;
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
        $query = PiggyPot::where('user_id', Auth::id())
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

        $allPotsList = PiggyPot::where('user_id', Auth::id())
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
            'title' => 'required|string|max:255',
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

        // Held until an admin releases it, exactly like a shop listing or a paid
        // task. A pot used to be created `active`, so it was public and buyable
        // for the ~20 seconds the scan takes — and permanently public whenever
        // the queue worker was not running. The owner still sees it on their own
        // page (getOptimizedPiggyPots includes moderation_hold for the owner).
        $data['status'] = 'moderation_hold';

        // A pot nobody can see cannot be the pinned one. Pinning at creation
        // used to unpin the creator's current live pot immediately, so the
        // featured slot on their profile went EMPTY for as long as the new pot
        // sat in review. The creator can pin it from the edit form once it is
        // live.
        $data['is_pinned'] = false;

        $piggyPot = PiggyPot::create($data);

        // Text half of the gate. A pot is already held on create, so this only
        // records WHY — but on update it is what re-holds a live pot.
        ItemTextModeration::apply(
            $piggyPot,
            ['reward_title', 'reward_body', 'reward_description', 'title', 'content_description'],
            ['status' => 'moderation_hold']
        );

        // SFW gate: scan the cover image; record a reason if it fails moderation
        // so the reviewer knows which rows to look at hardest.
        // Skip the platform default cover — known-safe, nothing user-uploaded.
        if (! empty($piggyPot->cover_media) && ! str_contains($piggyPot->cover_media, self::DEFAULT_COVER_UUID)) {
            CheckMediaModeration::dispatch(
                PiggyPot::class,
                $piggyPot->id,
                $piggyPot->cover_media,
                ['status' => 'moderation_hold'],
                'cover_image'
            );
        }

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot created — it goes live once our team has reviewed it.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $piggyPot = PiggyPot::where('user_id', Auth::id())->findOrFail($id);

        // Default the reward headline from the pot title so a missing field
        // never blocks creation (the pot's content IS the deliverable).
        if (! filled($request->reward_title)) {
            $request->merge(['reward_title' => (string) $request->title]);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
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

        // A held pot can only be released by admin approval (Content Review in
        // the admin app) — never by the creator re-submitting status=active.
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

        // Same rule as creation: a pot still in review cannot take the featured
        // slot, or the creator's profile shows nothing pinned until it clears.
        if ($piggyPot->status === 'moderation_hold') {
            $data['is_pinned'] = false;
        } elseif (! empty($data['is_pinned']) && $data['is_pinned']) {
            // Unpin others
            PiggyPot::where('user_id', Auth::id())->where('id', '!=', $id)->update(['is_pinned' => false]);
        }

        $piggyPot->update($data);

        ItemTextModeration::apply(
            $piggyPot->refresh(),
            ['reward_title', 'reward_body', 'reward_description', 'title', 'content_description'],
            ['status' => 'moderation_hold']
        );

        // SFW gate: re-scan the cover image on update.
        // Skip the platform default cover — known-safe, nothing user-uploaded.
        if (! empty($piggyPot->cover_media) && ! str_contains($piggyPot->cover_media, self::DEFAULT_COVER_UUID)) {
            CheckMediaModeration::dispatch(
                PiggyPot::class,
                $piggyPot->id,
                $piggyPot->cover_media,
                ['status' => 'moderation_hold'],
                'cover_image'
            );
        }

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot updated successfully');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $piggyPot = PiggyPot::where('user_id', Auth::id())->findOrFail($id);
        $piggyPot->delete();

        app(UserProfileService::class)->clearUserCaches(Auth::user()->username, Auth::user()->id);

        return redirect()->back()->with('success', 'Piggy Pot deleted successfully');
    }
}
