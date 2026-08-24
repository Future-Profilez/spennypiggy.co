<?php

namespace App\Http\Controllers;

use App\Services\CreatorPushService;
use Illuminate\Http\Request;

/**
 * The creator's own "tell my supporters" control.
 * Developer Master Plan, 19 Aug 2026, §E — supporter re-engagement & push.
 *
 * 🚨 EVERY RULE LIVES IN `CreatorPushService`, NOT HERE. Rate limit, moderation,
 * consent and the record are all decided there, because this endpoint will not
 * be the only caller for long (a scheduled nudge, an admin-triggered resend) and
 * a rule enforced at one entry point is a rule with a way round it.
 *
 * 🚨 ONLY A CREATOR MAY SEND, AND ONLY TO THEIR OWN SUPPORTERS. The service
 * resolves recipients from the ledger by `user_id = this creator`; there is no
 * parameter for who receives it, so there is nothing here to tamper with.
 */
class CreatorPushController extends Controller
{
    public function __construct(private CreatorPushService $push) {}

    /**
     * What the composer needs to draw itself: whether they may send, and how
     * much of their allowance is left.
     */
    public function status(Request $request)
    {
        $user = $request->user();

        if (! $user || (int) $user->role !== 1) {
            return response()->json(['allowed' => false], 403);
        }

        return response()->json($this->push->allowance($user) + [
            'max_length' => CreatorPushService::MAX_LENGTH,
            'max_per_day' => CreatorPushService::MAX_PER_DAY,
            'max_per_month' => CreatorPushService::MAX_PER_MONTH,
        ]);
    }

    public function send(Request $request)
    {
        $user = $request->user();

        if (! $user || (int) $user->role !== 1) {
            return back()->with('error', 'Only creators can send notifications.');
        }

        /*
         * ⚠️ The length bounds are validated HERE as well as in the service.
         * Validation gives the creator a field-level error as they type; the
         * service's copy is what protects every other caller. Neither replaces
         * the other.
         */
        $validated = $request->validate([
            'body' => [
                'required',
                'string',
                'min:'.CreatorPushService::MIN_LENGTH,
                'max:'.CreatorPushService::MAX_LENGTH,
            ],
        ]);

        $result = $this->push->send($user, $validated['body']);

        if (! $result['sent']) {
            return back()->withErrors(['body' => $result['reason']]);
        }

        return back()->with(
            'success',
            $result['recipients'] === 0
                ? 'Sent. None of your supporters have notifications switched on yet.'
                : 'Sent to '.$result['recipients'].' supporter'.($result['recipients'] === 1 ? '' : 's').'.'
        );
    }
}
