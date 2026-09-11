<?php

namespace App\Http\Controllers;

use App\Models\MembershipCredit;
use App\Services\MembershipCreditService;
use App\Support\Incentives;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The creator's own "earn your membership back" surface.
 *
 * 🚨 THERE IS NO PAGE OF ITS OWN, DELIBERATELY. The credit is spent against
 * the creator's platform subscription, so it belongs on the screen about that
 * subscription — a second page describing money that only exists as a discount
 * on a bill is the "two surfaces, one message" fault the promo deck was built
 * to end.
 */
class MembershipCreditController extends Controller
{
    public function __construct(private MembershipCreditService $service) {}

    /**
     * The creator's own progress, as JSON.
     *
     * ⚠️ `axios`, not an Inertia visit, at the call site: this answers JSON and
     * Inertia's visitor treats a non-Inertia response as an error.
     */
    public function status(Request $request): JsonResponse
    {
        $panel = $this->service->panelFor($request->user());

        return response()->json([
            'status' => (bool) $panel,
            'credits' => $panel,
        ]);
    }

    /**
     * Spend one earned month against the next bill.
     *
     * 🚨 THIS IS THE MANUAL HALF OF D11, AND IT RUNS THE SAME CODE AS THE
     * AUTOMATIC ONE. The client has not decided whether a credit is applied
     * automatically or held until the creator asks, so both exist and
     * `membership_credits.spend_mode` chooses. Whichever is set, the money
     * moves through `MembershipCreditService::apply()` — one claim, one
     * idempotency key, one reversal path.
     *
     * ⚠️ Refused in automatic mode rather than quietly allowed: with the sweep
     * also pushing credit, a creator pressing this would be racing it, and the
     * only thing that saves them from a double credit is the claim. It is
     * simpler and more honest to say the platform is doing it for them.
     */
    public function apply(Request $request)
    {
        $creator = $request->user();

        abort_unless($creator && (int) $creator->role === 1, 403);
        abort_unless(Incentives::membershipCreditsEnabled(), 404);

        if ($this->service->spendMode() !== 'manual') {
            return back()->with('info', 'Your free months are applied to your bill automatically — there is nothing to do.');
        }

        /*
         * 🚨 THE CREDIT IS RESOLVED HERE, NEVER TAKEN FROM THE REQUEST. An id
         * in the payload is a creator applying somebody else's free month; the
         * oldest spendable row of their own is the only correct answer and
         * there is no reason to let them choose.
         */
        $credit = MembershipCredit::query()
            ->where('creator_id', $creator->id)
            ->available()
            ->orderBy('rung')
            ->orderBy('sequence')
            ->first();

        if (! $credit) {
            return back()->with('error', 'You do not have a free month to use yet.');
        }

        if (! $this->service->apply($creator, $credit)) {
            return back()->with('error', 'We could not apply your free month just now. It is still yours — try again shortly.');
        }

        return back()->with('success', 'A free month has been applied to your next membership bill.');
    }
}
