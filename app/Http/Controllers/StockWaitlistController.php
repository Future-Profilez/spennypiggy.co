<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\StockWaitlist;
use App\Services\StockWaitlistService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\URL;

/**
 * "Tell me when it's back" for a sold-out shop item.
 *
 * Guests may join: requiring an account on a sold-out page throws away the demand this
 * feature exists to capture. That makes these endpoints public, so they are throttled
 * and carry the same bot gate as the other guest-facing writes.
 */
class StockWaitlistController extends Controller
{
    public function join(Request $request, StockWaitlistService $service)
    {
        $validated = $request->validate([
            'shop_uuid' => ['required', 'string'],
            'email' => ['nullable', 'email', 'max:255'],
        ]);

        // Bot gate — self-gating, a no-op when no Turnstile secret is configured.
        // Same treatment as the other endpoints a logged-out visitor can POST to.
        $this->ensureTurnstileVerified($request);

        $shop = Shop::where('uuid', $validated['shop_uuid'])->first();

        if (! $shop) {
            return response()->json(['status' => false, 'msg' => 'Item not found.'], 404);
        }

        $result = $service->join($shop, Auth::user(), $validated['email'] ?? null);

        return response()->json([
            'status' => $result['ok'],
            'msg' => $result['message'],
            'waiting' => $result['ok'],
        ], $result['ok'] ? 200 : 422);
    }

    /**
     * Leave a waitlist.
     *
     * ⚠️ **Signed-in only, and it never accepts an email.** `join` is public because the
     * worst a stranger can do is add an address that then receives one notice it can
     * unsubscribe from. Leaving is the opposite: taking an email from the request would
     * let anyone remove anyone else from a list by guessing their address, with no
     * authentication at all. A guest leaves through the signed link in their email.
     */
    public function leave(Request $request, StockWaitlistService $service)
    {
        $validated = $request->validate([
            'shop_uuid' => ['required', 'string'],
        ]);

        $user = Auth::user();

        if (! $user) {
            return response()->json([
                'status' => false,
                'msg' => 'Use the link in the email we sent you to stop these notices.',
            ], 401);
        }

        $shop = Shop::where('uuid', $validated['shop_uuid'])->first();

        if (! $shop) {
            return response()->json(['status' => false, 'msg' => 'Item not found.'], 404);
        }

        $service->leave($shop, $user);

        return response()->json(['status' => true, 'waiting' => false]);
    }

    /**
     * One-click "stop telling me about this item" from a guest's email footer.
     *
     * A guest has no account, so there is no preference column to turn off — leaving
     * that item's list IS the opt-out. They can rejoin later if they change their mind,
     * which is the honest behaviour: they only ever hear about items they asked about.
     *
     * Signature is validated here rather than by the `signed` middleware so a stale link
     * redirects home with a message instead of a bare 403, matching /unsubscribe/{user}.
     */
    public function leaveViaLink(Request $request, $waitlist)
    {
        if (! $request->hasValidSignature()) {
            return redirect('/')->with('error', 'Invalid or expired link. Please contact support if you need help.');
        }

        $entry = StockWaitlist::find($waitlist);

        if ($entry) {
            $entry->delete();
        }

        return redirect('/')->with('success', 'You will not receive any more notices about that item.');
    }

    /**
     * Signed opt-out link for a guest's back-in-stock email.
     *
     * 30 days, not the 24 hours the marketing links use — this notice may sit unread
     * for a while, and a dead unsubscribe link is worse than no link at all.
     */
    public static function generateLeaveLink(int $waitlistId): string
    {
        return URL::temporarySignedRoute(
            'waitlist.leave-link',
            now()->addDays(30),
            ['waitlist' => $waitlistId]
        );
    }
}
