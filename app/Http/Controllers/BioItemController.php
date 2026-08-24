<?php

namespace App\Http\Controllers;

use App\Models\CreatorBioItem;
use App\Models\User;
use App\Services\BioPageService;
use App\Support\BioSellableItems;
use App\Support\CatalogueRegistry;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * The creator chooses WHICH of their earning items sell from their bio page,
 * and in what order (Developer Master Plan, 19 Aug 2026, §B — "You control the
 * page").
 *
 * 🚨 A CREATOR SUBMITS A TYPE AND ONE OF THEIR OWN LISTING UUIDs, NEVER A URL,
 * A PRICE OR A TITLE. Everything the card shows is read from the live listing at
 * render, and the checkout it links to is rebuilt server-side by
 * `App\Support\BioSellableItems`. There is deliberately no free-text field on
 * this screen at all: a bio page that could name its own card would be a new
 * moderated surface, and the listing's own title has already been through
 * `NoExpenseOrBrandName` and the media scan.
 *
 * 🚨 OWNERSHIP IS PROVEN AGAINST THE MODULE'S OWN TABLE, NOT ASSUMED. A uuid is
 * a public identifier on this platform — it is in share links and in checkout
 * URLs — so `resolveOwnedListing()` looks the listing up scoped to the caller's
 * id and refuses anything it does not find. Without that, any creator could put
 * another creator's item on their own page and take the traffic.
 *
 * ⚠️ Ownership of the SELECTION is expressed the same way `BioLinkController`
 * does it: every query is scoped to `Auth::id()`, so another creator's row 404s
 * rather than 403s and the endpoint never confirms a uuid exists.
 */
class BioItemController extends Controller
{
    public function __construct(private readonly BioPageService $bioService) {}

    /**
     * Put one of the creator's own listings on their bio page.
     */
    public function store(Request $request)
    {
        $user = $this->creator($request);

        $validated = $request->validate([
            // ⚠️ The type set is `CatalogueRegistry` — the ONE definition of what a
            // creator sells. Never a literal list; that is how six modules drifted
            // apart in the first place.
            'type' => ['required', 'string', Rule::in(CatalogueRegistry::typeKeys())],
            'uuid' => ['required', 'string', 'max:64'],
        ]);

        $listing = $this->resolveOwnedListing($user, $validated['type'], $validated['uuid']);

        if ($listing === null) {
            return back()->with('error', 'That item could not be found on your account.');
        }

        // ⚠️ Counted BEFORE the insert and excluding this listing, so re-adding an
        // item already on the page cannot be refused for being over the cap.
        $existing = CreatorBioItem::where('user_id', $user->id)->count();

        if ($existing >= BioSellableItems::MAX_ITEMS
            && ! CreatorBioItem::where('user_id', $user->id)
                ->where('item_type', $validated['type'])
                ->where('item_id', $listing->id)
                ->exists()
        ) {
            return back()->with('error', 'You can show up to '.BioSellableItems::MAX_ITEMS.' items. Remove one to add another.');
        }

        try {
            $row = CreatorBioItem::firstOrNew([
                'user_id' => $user->id,
                'item_type' => $validated['type'],
                'item_id' => (int) $listing->id,
            ]);

            // Re-adding an item reactivates it rather than duplicating it, and keeps
            // the position the creator already gave it.
            $row->is_active = true;

            if (! $row->exists) {
                $row->sort_order = $this->nextSortOrder($user->id);
            }

            $row->save();
        } catch (QueryException $e) {
            // ⚠️ `firstOrNew` is check-then-act, so two submits can both reach the
            // insert and the unique index refuses the loser — whose row exists,
            // written by the winner. Reporting a failure would send the creator to
            // add it a second time.
            if (! $this->isDuplicateKey($e)) {
                throw $e;
            }
        }

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Added to your page.');
    }

    /** Show or hide a card without losing its position. */
    public function update(Request $request, string $item)
    {
        $user = $this->creator($request);
        $row = $this->ownedSelection($user->id, $item);

        $validated = $request->validate([
            'is_active' => ['required', 'boolean'],
        ]);

        $row->is_active = (bool) $validated['is_active'];
        $row->save();

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Saved.');
    }

    public function reorder(Request $request)
    {
        $user = $this->creator($request);

        $validated = $request->validate([
            'order' => ['required', 'array', 'max:'.BioSellableItems::MAX_ITEMS],
            'order.*' => ['required', 'string'],
        ]);

        // Scoped to this creator's own rows, so a uuid belonging to someone else
        // simply matches nothing rather than being reordered.
        $owned = CreatorBioItem::where('user_id', $user->id)
            ->whereIn('uuid', $validated['order'])
            ->pluck('id', 'uuid');

        foreach ($validated['order'] as $position => $uuid) {
            if (! isset($owned[$uuid])) {
                continue;
            }

            CreatorBioItem::whereKey($owned[$uuid])->update(['sort_order' => $position]);
        }

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Order saved.');
    }

    /**
     * ⚠️ A selection IS deletable, unlike an internal link button. A link is
     * DERIVED from what the creator sells, so deleting its row only brings the
     * button back on the next render; a selection is the creator's own choice and
     * removing it is the whole point. The listing itself is untouched.
     */
    public function destroy(Request $request, string $item)
    {
        $user = $this->creator($request);

        $this->ownedSelection($user->id, $item)->delete();

        $this->bioService->forgetCaches($user);

        return back()->with('success', 'Removed from your page.');
    }

    /**
     * The listing, proven to belong to the caller.
     *
     * ⚠️ `withScheduled()`: a creator may put a listing they have scheduled onto
     * the page before it goes live. It simply has no card until it does — the
     * public render applies the same approval filter as the profile — which is
     * better than making them come back and add it on the day.
     */
    private function resolveOwnedListing(User $user, string $type, string $uuid): ?Model
    {
        $config = CatalogueRegistry::config($type);

        if (! $config) {
            return null;
        }

        /** @var class-string<Model> $model */
        $model = $config['model'];

        return $model::withScheduled()
            ->where($config['owner'], $user->id)
            ->where('uuid', $uuid)
            ->first(['id', 'uuid']);
    }

    /**
     * ⚠️ Every write goes through here. A supporter has no bio page, so a row they
     * created could never render — but an endpoint that accepts writes it will
     * never honour is an unvalidated write path, and the rows accumulate silently.
     */
    private function creator(Request $request): User
    {
        $user = $request->user();

        abort_unless($user && (int) $user->role === 1, 403);

        return $user;
    }

    /**
     * ⚠️ Scoped by user id, so this 404s rather than 403s for another creator's
     * selection — the endpoint never confirms that a uuid exists.
     */
    private function ownedSelection(int $userId, string $uuid): CreatorBioItem
    {
        return CreatorBioItem::where('user_id', $userId)
            ->where('uuid', $uuid)
            ->firstOrFail();
    }

    /** MySQL 1062 / SQLSTATE 23000 — the row already exists, which is the answer. */
    private function isDuplicateKey(QueryException $e): bool
    {
        return ($e->errorInfo[1] ?? null) === 1062 || $e->getCode() === '23000';
    }

    private function nextSortOrder(int $userId): int
    {
        return (int) CreatorBioItem::where('user_id', $userId)->max('sort_order') + 1;
    }
}
