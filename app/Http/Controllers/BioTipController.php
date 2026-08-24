<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\Bio\BioTipService;
use App\Services\Bio\BioTipUnavailableException;
use App\Support\BioTipRail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

/**
 * The Tip button's endpoints.
 *
 * 🚨 BOTH REFUSE WHILE THE RAIL IS OFF, AND THE UI IS GREYED IN FRONT OF THEM.
 * A disabled button is a rendering decision and anyone can post past it, so the
 * switch is enforced on the server as well — `BioTipRail::enabled()` is checked
 * here, not only in React. While it is off, `quote` answers 503 and `store`
 * answers 503; nothing is written and nothing is charged.
 *
 * 🚨 THIS IS NOT A STRIPE SURFACE. A tip is voluntary, nothing is exchanged, and
 * no `Deliverable` is created — so none of the content-purchase machinery
 * applies and none of it is called. See `BioTipService` for why that is
 * deliberate rather than an omission.
 *
 * ⚠️ Public and unauthenticated by design (a tip is not a purchase and creates
 * no order to track), which is exactly why both routes must carry a throttle.
 */
class BioTipController extends Controller
{
    public function __construct(private readonly BioTipService $tips) {}

    /**
     * Price a tip and freeze the rate.
     *
     * ⚠️ Amount-only, and it takes no email and runs no buyer lookup — the same
     * rule `POST /payments/price-preview` follows and for the same reason: an
     * unauthenticated endpoint that accepted an identifier would let a caller
     * enumerate one.
     */
    public function quote(Request $request): JsonResponse
    {
        if (! BioTipRail::enabled()) {
            return $this->unavailable();
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric'],
            // Three letters or nothing. This only chooses the indicative line's
            // currency; an unknown code falls back inside the service.
            'display_currency' => ['nullable', 'string', 'size:3'],
        ]);

        try {
            return response()->json([
                'status' => true,
                'quote' => $this->tips->quote(
                    (float) $validated['amount'],
                    $validated['display_currency'] ?? null
                ),
            ]);
        } catch (RuntimeException $e) {
            // An out-of-range amount is the supporter's to correct, so it answers
            // 422 with the published limits in the message.
            return response()->json(['status' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * Send a tip.
     *
     * ⚠️ The quote is RE-PRICED here rather than accepted from the request. A
     * client-supplied total is a client-supplied price, which is the one thing no
     * payment path in this codebase permits.
     */
    public function store(Request $request, string $username): JsonResponse
    {
        if (! BioTipRail::enabled()) {
            return $this->unavailable();
        }

        $validated = $request->validate([
            'amount' => ['required', 'numeric'],
            'display_currency' => ['nullable', 'string', 'size:3'],
        ]);

        $creator = User::query()
            ->where('username', $username)
            ->where('suspended_account', '!=', 1)
            ->first();

        // A tip is for a creator. A supporter has no bio page and nothing to tip.
        if (! $creator || (int) $creator->role !== 1) {
            return response()->json(['status' => false, 'message' => 'Creator not found.'], 404);
        }

        try {
            $quote = $this->tips->quote(
                (float) $validated['amount'],
                $validated['display_currency'] ?? null
            );
        } catch (RuntimeException $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 422);
        }

        try {
            // ⚠️ Idempotency key built from the tipper, the creator and the frozen
            // quote — the same rule every payout in this codebase follows, so a
            // double-tap or a retry can never send twice.
            $this->tips->send($creator, $quote, hash('sha256', implode('|', [
                $request->user()?->id ?? $request->ip(),
                $creator->id,
                $quote['total'],
                $quote['frozen_at'],
            ])));
        } catch (BioTipUnavailableException $e) {
            return response()->json(['status' => false, 'message' => $e->getMessage()], 503);
        }

        // 🚨 Unreachable while `send()` always throws, and deliberately a REFUSAL
        // rather than a fabricated success. When the rail lands this is where the
        // confirmation is built from what `send()` returns; until then a
        // half-wired rail must never be able to thank a supporter whose money
        // never moved.
        return $this->unavailable();
    }

    /**
     * ⚠️ Says only that it is not available yet. It names no provider, gives no
     * date and describes no settlement speed — all three are prohibited, and the
     * third has never been confirmed by anyone.
     */
    private function unavailable(): JsonResponse
    {
        return response()->json([
            'status' => false,
            'message' => 'Tips are not available yet.',
        ], 503);
    }
}
