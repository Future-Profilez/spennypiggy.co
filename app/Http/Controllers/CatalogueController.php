<?php

namespace App\Http\Controllers;

use App\Services\CatalogueService;
use App\Services\ListingDuplicator;
use App\Support\CatalogueRegistry;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * "My Listings" — every sellable thing a creator has, in one place.
 *
 * Read-only. Editing still happens on each module's own screen; this answers the
 * question none of those six screens can, which is what the whole catalogue looks like
 * at once.
 */
class CatalogueController extends Controller
{
    /** How far ahead a listing may be scheduled. Matches the posts composer. */
    public const MAX_SCHEDULE_DAYS = 90;

    public function __construct(private CatalogueService $catalogue) {}

    public function index(Request $request)
    {
        $user = Auth::user();

        // A fan has nothing to list. Sending them to an empty catalogue reads as a
        // broken page rather than as a screen that is not for them.
        if (! $user || (int) $user->role !== 1) {
            return redirect()->route('home');
        }

        // Validated, not trusted. An unrecognised type or status would otherwise reach
        // the service as a filter that matches nothing, and the page would report an
        // empty catalogue to a creator who has listings.
        $validated = $request->validate([
            'type' => ['nullable', 'string', 'in:'.implode(',', CatalogueRegistry::typeKeys())],
            'status' => ['nullable', 'string', 'in:all,attention,'.implode(',', array_keys(CatalogueRegistry::STATUSES))],
            'q' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'string', 'in:attention,newest,sales'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $payload = $this->catalogue->for($user, $validated);

        if ($request->wantsJson()) {
            return response()->json($payload);
        }

        return Inertia::render('Creator/Catalogue/Index', $payload);
    }

    /**
     * Set or clear a listing's scheduled publish time.
     *
     * ⚠️ Lives here, not on the six create forms. A schedule is a property of the
     * catalogue ("launch this on Friday"), and adding a picker to six differently-shaped
     * forms is six places for it to drift. The catalogue already knows every listing.
     */
    public function schedule(Request $request, string $type, int $id)
    {
        $user = Auth::user();

        if (! $user || (int) $user->role !== 1) {
            return redirect()->route('home');
        }

        $config = CatalogueRegistry::config($type);

        if (! $config) {
            return back()->with('error', 'That kind of listing cannot be scheduled.');
        }

        $validated = $request->validate([
            // ⚠️ Capped. A date years out is almost always a typo, and a listing nobody
            // can see for three years is indistinguishable from one that was lost.
            'publish_at' => ['nullable', 'date', 'before_or_equal:'.now()->addDays(self::MAX_SCHEDULE_DAYS)->toDateTimeString()],
        ]);

        $model = $config['model'];

        // withScheduled(): the listing being rescheduled is, by definition, one the
        // global scope is currently hiding.
        $listing = $model::withScheduled()->where($config['owner'], $user->id)->find($id);

        if (! $listing) {
            return back()->with('error', 'That listing could not be found.');
        }

        $when = $validated['publish_at'] ?? null;
        $publishAt = $when ? Carbon::parse($when) : null;

        // ⚠️ A past date publishes NOW rather than failing. The creator's intent is
        // plainly "this should be live"; refusing on a stale value in a form they left
        // open for ten minutes would be pedantry.
        if ($publishAt && $publishAt->isPast()) {
            $publishAt = null;
        }

        $listing->forceFill([
            'publish_at' => $publishAt,
            // Clearing or moving a schedule re-arms the announcement — otherwise a
            // listing rescheduled after its first release would go live in silence.
            'schedule_released_at' => null,
        ])->save();

        return back()->with(
            'success',
            $publishAt
                ? 'This listing will go on sale on '.$publishAt->format('j M Y, H:i').'.'
                : 'Schedule removed — this listing is live as soon as it is approved.'
        );
    }

    /**
     * Relist something almost identical without retyping the form.
     *
     * The copy is created by the module's OWN store method (see ListingDuplicator), so
     * it is created unapproved, priced by the same rules, and given its own Stripe
     * product — never the original's.
     */
    public function duplicate(Request $request, ListingDuplicator $duplicator, string $type, int $id)
    {
        $user = Auth::user();

        if (! $user || (int) $user->role !== 1) {
            return redirect()->route('home');
        }

        $result = $duplicator->duplicate($user, $type, $id);

        if ($request->wantsJson()) {
            return response()->json($result, $result['ok'] ? 200 : 422);
        }

        return back()->with($result['ok'] ? 'success' : 'error', $result['message']);
    }
}
