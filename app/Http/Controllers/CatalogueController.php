<?php

namespace App\Http\Controllers;

use App\Services\CatalogueService;
use App\Services\ListingDuplicator;
use App\Support\CatalogueRegistry;
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
