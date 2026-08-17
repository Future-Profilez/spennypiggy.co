<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Support\PushReachability;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * The browser telling the server what it knows about this user's push.
 *
 * Push is registered entirely client-side (MagicBell's `WebPushClient`), so the
 * browser is the only party that can answer "is there a live subscription here?".
 * Before this endpoint the server never asked, which is why a creator could stop
 * receiving push and nothing anywhere could tell.
 */
class PushSubscriptionController extends Controller
{
    /**
     * Record what the browser reports.
     *
     * ⚠️ `subscribed` is the ONLY thing that stamps `push_verified_at`. A browser
     * that has granted permission but never completed `subscribe()` has no device
     * registered at MagicBell and receives nothing — treating `granted` alone as
     * confirmation is exactly the false-positive that would email people whose
     * push works while staying silent about those it does not.
     */
    public function heartbeat(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['ok' => false], 401);
        }

        $data = $request->validate([
            'subscribed' => ['required', 'boolean'],
            'permission' => ['nullable', 'string', 'in:'.implode(',', PushReachability::PERMISSION_STATES)],
        ]);

        $attributes = [
            // An unrecognised or absent value is stored as null, never guessed at.
            'push_permission_state' => $data['permission'] ?? null,
        ];

        if ($data['subscribed']) {
            $attributes['push_verified_at'] = now();
            // A confirmed subscription closes any open reminder cycle. Leaving the
            // claim in place would mean a creator who fixed it in week one could
            // not be told again until week five if it lapsed the following day.
            $attributes['push_reminded_at'] = null;
        }

        try {
            // 🚨 A direct UPDATE, deliberately — NOT forceFill()->save().
            //
            // Two reasons, and the first is a real bug this replaced. Eloquent
            // only writes DIRTY attributes, and the resolved user is whatever the
            // guard is holding: setting `push_reminded_at` to null against an
            // instance whose in-memory copy is ALREADY null is not a change, so
            // the clear was silently dropped and the row kept its claim. That
            // would leave a creator who has just reconnected still marked as
            // reminded, and therefore unable to be told for another 30 days if it
            // lapsed the next day — the exact failure this endpoint exists to end.
            //
            // Second, it fires no model events. `User::updated` re-renders the
            // creator's attribution watermark, and that has no business running on
            // an ordinary page load.
            //
            // These columns are deliberately not in $fillable, so nothing here
            // depends on mass assignment either.
            User::query()->whereKey($user->id)->update($attributes);
        } catch (\Throwable $e) {
            // This runs on ordinary page loads. A telemetry write must never be
            // why someone's navigation errors.
            Log::warning('Push heartbeat failed to save', ['user_id' => $user->id, 'error' => $e->getMessage()]);

            return response()->json(['ok' => false], 200);
        }

        return response()->json([
            'ok' => true,
            // What the client caches against, so it can skip the next N hours.
            'throttle_hours' => PushReachability::HEARTBEAT_THROTTLE_HOURS,
        ]);
    }
}
