<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Models\CreatorBioLink;
use App\Models\User;
use App\Rules\NoExpenseOrBrandName;
use App\Services\BioPageService;
use App\Services\CatalogueService;
use App\Support\BioAppearance;
use App\Support\BioLinkPlatforms;
use App\Support\BioSellableItems;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

/**
 * The creator's editor for their own `/{username}/bio` page.
 *
 * 🚨 A CREATOR SUBMITS A PLATFORM AND A HANDLE, NEVER A URL. The destination is
 * rebuilt by App\Support\BioLinkPlatforms at render and at click time — see that
 * class for why (open redirect, and a shortened link that changes where it points
 * after it was reviewed). There is deliberately no free-URL field, and adding one
 * reopens both.
 *
 * ⚠️ Ownership is expressed by scoping every query to `Auth::id()`, never by
 * reading an id from the request and checking it afterwards. A uuid is a public
 * identifier on this platform.
 */
class BioLinkController extends Controller
{
    public function __construct(
        private readonly BioPageService $bioService,
        private readonly CatalogueService $catalogue,
    ) {}

    public function index(Request $request)
    {
        $user = $request->user();

        if ((int) $user->role !== 1) {
            return redirect()->route('dashboard');
        }

        // Materialise a row per derived internal button so they can be reordered,
        // renamed and hidden. Deliberately here and not on the public page — see
        // BioPageService::ensureEditableRows().
        $this->bioService->ensureEditableRows($user);

        return Inertia::render('Bio/Edit', [
            'links' => $this->bioService->linksFor($user, true),
            // The creator's own selections, live-filtered exactly as the public
            // page renders them, so the editor and the page cannot disagree about
            // what is on it. Owner view: hidden cards are included.
            'items' => $this->bioService->items($user, true),
            // 🚨 The picker reads `CatalogueService` — the SAME list the My
            // Listings screen shows — rather than a seventh idea of what a creator
            // sells. `status: live` because a card the supporter cannot buy is not
            // a card; a scheduled or in-review listing is added from My Listings
            // once it goes live.
            'catalogue' => $this->catalogue->for($user, ['status' => 'live', 'sort' => 'newest'])['listings']['data'] ?? [],
            'platforms' => BioLinkPlatforms::pickerOptions(),
            'bioUrl' => route('bio.show', ['username' => $user->username]),
            'maxExternal' => BioLinkPlatforms::MAX_EXTERNAL_LINKS,
            'maxItems' => BioSellableItems::MAX_ITEMS,
            'externalCount' => $this->externalCount($user->id),
            'stats' => [
                'views' => (int) ($user->bio_page_views ?? 0),
            ],
            // The creator's saved look. NULL = the default; the client maps an
            // unknown key to the default too, so a removed preset can never
            // blank the editor's picker.
            'appearance' => [
                'theme' => $user->bio_theme,
                'item_layout' => $user->bio_item_layout,
            ],
        ]);
    }

    /**
     * Save the creator's chosen theme and item layout for their bio page.
     *
     * 🚨 THE VALUE IS A KEY INTO A CURATED SET, NEVER A COLOUR. `Rule::in`
     * against App\Support\BioAppearance is the whole moderation story: there is
     * nothing free-text here to scan, and no hex a creator can supply — every
     * preset's contrast was checked at design time.
     *
     * ⚠️ `forceFill`, not $fillable — same pattern as `signup_landing_page` and
     * `promo_code_id`: a column written by exactly one endpoint stays out of
     * mass assignment so no other update path can carry it by accident.
     *
     * 🚨 ONLY A COLUMN THE REQUEST ACTUALLY SENT IS WRITTEN. Both are nullable,
     * so `$data['theme'] ?? null` cannot tell "reset me to the default" from
     * "I did not mention this field" — and a caller posting one of the two
     * would silently reset the other. Same rule, for the same reason, as
     * `EmailPreferenceController::applyPreferences`' `sometimes`. An explicit
     * `null` IS a value here: it is how the editor stores "the default".
     */
    public function appearance(Request $request)
    {
        $user = $request->user();

        if ((int) $user->role !== 1) {
            return redirect()->route('dashboard');
        }

        $data = $request->validate([
            'theme' => ['sometimes', 'nullable', 'string', Rule::in(BioAppearance::THEMES)],
            'item_layout' => ['sometimes', 'nullable', 'string', Rule::in(BioAppearance::LAYOUTS)],
        ]);

        $changes = [];

        if (array_key_exists('theme', $data)) {
            $changes['bio_theme'] = $data['theme'];
        }

        if (array_key_exists('item_layout', $data)) {
            $changes['bio_item_layout'] = $data['item_layout'];
        }

        if ($changes !== []) {
            $user->forceFill($changes)->save();
        }

        /*
         * ⚠️ NO FLASH MESSAGE. `BrandToaster` bridges `flash.success` to a toast
         * app-wide, and this endpoint fires on every swatch tap — a creator
         * trying five themes would stack five toasts over the preview they are
         * trying to look at. The preview updating IS the confirmation, and the
         * section prints "Saving…" while the request is in flight.
         */
        return back();
    }

    public function store(Request $request)
    {
        $user = $this->creator($request);

        $validated = $request->validate([
            'platform' => ['required', 'string', Rule::in(array_keys(BioLinkPlatforms::PLATFORMS))],
            'handle' => ['required', 'string', 'max:191'],
            'label' => [
                'nullable', 'string', 'max:40',
                // The button may name the platform it points at, and nothing else.
                new NoExpenseOrBrandName(
                    BioLinkPlatforms::ownBrandTokens($request->input('platform'))
                ),
            ],
        ]);

        if ($this->externalCount($user->id) >= BioLinkPlatforms::MAX_EXTERNAL_LINKS) {
            return back()->with('error', 'You have reached the maximum number of links.');
        }

        // Normalise BEFORE validating, never to force a value into passing — a
        // creator pastes a full profile URL far more often than a bare handle.
        $handle = BioLinkPlatforms::normaliseHandle($validated['handle']);

        if (! BioLinkPlatforms::handleIsValid($validated['platform'], $handle)) {
            return back()->withErrors([
                'handle' => 'That does not look like a valid '
                    .BioLinkPlatforms::platform($validated['platform'])['label'].' username.',
            ]);
        }

        if ($error = $this->labelError($validated['label'] ?? null)) {
            return back()->withErrors(['label' => $error]);
        }

        // One row per creator+platform, so a double submit cannot render the same
        // link twice. Re-adding a platform reuses (and reactivates) its row.
        $link = CreatorBioLink::firstOrNew([
            'user_id' => $user->id,
            'kind' => BioLinkPlatforms::KIND_EXTERNAL,
            'platform' => $validated['platform'],
            'target_type' => null,
        ]);

        $link->handle = $handle;
        $link->label = $validated['label'] ?? null;
        $link->is_active = true;
        $link->moderation_reason = null;

        if (! $link->exists) {
            $link->sort_order = $this->nextSortOrder($user->id);
        }

        try {
            $link->save();
        } catch (QueryException $e) {
            // ⚠️ `firstOrNew` is check-then-act, so two submits can both reach
            // the insert. Now that `target_key` gives the unique index something
            // it can actually enforce (see migration 2026_08_16_000003), the
            // loser lands here — and the creator's link IS saved, by the winner.
            // Reporting a failure would send them to add it a second time.
            if (! $this->isDuplicateKey($e)) {
                throw $e;
            }
        }

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Link added.');
    }

    public function update(Request $request, string $link)
    {
        $user = $this->creator($request);
        $row = $this->ownedLink($user->id, $link);

        $validated = $request->validate([
            'label' => [
                'sometimes', 'nullable', 'string', 'max:40',
                // The platform comes from the stored row — an edit cannot change it.
                new NoExpenseOrBrandName(BioLinkPlatforms::ownBrandTokens($row->platform)),
            ],
            'handle' => ['sometimes', 'required', 'string', 'max:191'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        // ⚠️ Only fields the request CARRIED are written. Treating an absent field
        // as "the creator cleared it" is what wipes a label on an unrelated toggle
        // — the same trap columnsWithFile() documents for a paid reward file.
        if ($request->has('label')) {
            if ($error = $this->labelError($validated['label'] ?? null)) {
                return back()->withErrors(['label' => $error]);
            }

            // ⚠️ An explicit empty check, never `?:` — a label of literally "0"
            // is falsy and would be stored as NULL, silently reverting the
            // button to its default wording.
            $row->label = ($validated['label'] ?? '') === '' ? null : $validated['label'];
        }

        if ($request->has('handle')) {
            if (! $row->isExternal()) {
                return back()->with('error', 'This link has no username to change.');
            }

            $handle = BioLinkPlatforms::normaliseHandle($validated['handle']);

            if (! BioLinkPlatforms::handleIsValid($row->platform, $handle)) {
                return back()->withErrors([
                    'handle' => 'That does not look like a valid '
                        .BioLinkPlatforms::platform($row->platform)['label'].' username.',
                ]);
            }

            $row->handle = $handle;
        }

        if ($request->has('is_active')) {
            $row->is_active = (bool) $validated['is_active'];
        }

        $row->save();

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Saved.');
    }

    public function reorder(Request $request)
    {
        $user = $this->creator($request);

        $validated = $request->validate([
            'order' => ['required', 'array', 'max:60'],
            'order.*' => ['required', 'string'],
        ]);

        // Scoped to this creator's own rows, so a uuid belonging to someone else
        // simply matches nothing rather than being reordered.
        $owned = CreatorBioLink::where('user_id', $user->id)
            ->whereIn('uuid', $validated['order'])
            ->pluck('id', 'uuid');

        foreach ($validated['order'] as $position => $uuid) {
            if (! isset($owned[$uuid])) {
                continue;
            }

            CreatorBioLink::whereKey($owned[$uuid])->update(['sort_order' => $position]);
        }

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Order saved.');
    }

    public function destroy(Request $request, string $link)
    {
        $user = $this->creator($request);
        $row = $this->ownedLink($user->id, $link);

        // ⚠️ An internal button is DERIVED from what the creator sells — deleting
        // its row would only make the button reappear on the next render with its
        // defaults restored. Hiding it is the only thing "remove" can mean here.
        if ($row->isInternal()) {
            $row->is_active = false;
            $row->save();
        } else {
            $row->delete();
        }

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Removed.');
    }

    /**
     * ⚠️ Every write goes through here, not just `index()`.
     *
     * A supporter has no bio page — `BioPageController` redirects them to their
     * profile — so a row they create can never render. But an endpoint that
     * accepts writes it will never honour is an unvalidated write path, and the
     * rows accumulate silently.
     */
    private function creator(Request $request): User
    {
        $user = $request->user();

        abort_unless($user && (int) $user->role === 1, 403);

        return $user;
    }

    /**
     * ⚠️ Scoped by user id, so this 404s rather than 403s for another creator's
     * link — the endpoint never confirms that a uuid exists.
     */
    private function ownedLink(int $userId, string $uuid): CreatorBioLink
    {
        return CreatorBioLink::where('user_id', $userId)
            ->where('uuid', $uuid)
            ->firstOrFail();
    }

    /** MySQL 1062 / SQLSTATE 23000 — the row already exists, which is the answer. */
    private function isDuplicateKey(QueryException $e): bool
    {
        return ($e->errorInfo[1] ?? null) === 1062 || $e->getCode() === '23000';
    }

    private function externalCount(int $userId): int
    {
        return CreatorBioLink::where('user_id', $userId)
            ->where('kind', BioLinkPlatforms::KIND_EXTERNAL)
            ->count();
    }

    /**
     * ⚠️ Floored at the size of the derived internal block.
     *
     * The internal buttons fall back to their `DEFAULT_ORDER` INDEX when they
     * have no row yet, so a creator who has never opened the editor has a max of
     * 0 and the first external link would land on 1 — tying with `wishes` and
     * leaving the order to PHP's sort stability rather than to intent.
     */
    private function nextSortOrder(int $userId): int
    {
        $highest = (int) CreatorBioLink::where('user_id', $userId)->max('sort_order');

        return max($highest + 1, count(BioLinkPlatforms::DEFAULT_ORDER));
    }

    /**
     * The label is the only free text on this page. It renders on a public page
     * that also sells, so it goes through the same blocked-word list every
     * sellable item's title does — `NoExpenseOrBrandName` runs as a validation
     * rule alongside it.
     */
    private function labelError(?string $label): ?string
    {
        if (! filled($label)) {
            return null;
        }

        $blocked = Helpers::checkBlockText($label);

        if ($blocked !== false) {
            return 'Please remove "'.$blocked.'" from the label.';
        }

        return null;
    }
}
