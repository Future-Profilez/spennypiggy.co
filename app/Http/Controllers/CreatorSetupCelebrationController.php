<?php

namespace App\Http\Controllers;

use App\Services\CreatorJourneyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * "I have seen it" — the one write behind the setup celebration.
 *
 * 🚨 IDEMPOTENT, AND THAT IS NOT DEFENSIVENESS. The popup marks itself seen when it OPENS
 * rather than when it closes, so a creator with the dashboard open in two tabs, or one who
 * double-taps, sends this twice within a second. It must be a no-op the second time and
 * must never overwrite the original timestamp — the column records when the creator was
 * first told, and that is the only thing anybody would ever ask it.
 */
class CreatorSetupCelebrationController extends Controller
{
    public function seen(Request $request): JsonResponse
    {
        $user = $request->user();

        // ⚠️ Creators only, and never while an admin is emulating. The payload already
        // refuses to offer the celebration in either case, so reaching here means the
        // request did not come from the component — spend nothing.
        if (! $user
            || (int) ($user->role ?? 0) !== 1
            || $request->session()->get('emulated_by_admin', false)) {
            return response()->json(['ok' => false]);
        }

        // Already told. Not an error, and deliberately not re-stamped.
        if ($user->setup_celebrated_at !== null) {
            return response()->json(['ok' => true]);
        }

        // 🚨 The state is re-checked SERVER-SIDE. Trusting the client here would let any
        // signed-in creator burn their own celebration with a bare POST — harmless on its
        // own, but it also means a creator who is still mid-setup could permanently
        // silence a message they have not been shown yet.
        if (! app(CreatorJourneyService::class)->setupComplete($user)) {
            return response()->json(['ok' => false]);
        }

        try {
            // 🚨 `DB::table`, NOT `save()`, `saveQuietly()` OR `User::query()->update()`.
            // All three stamp `updated_at` — `saveQuietly` only suppresses model EVENTS, and
            // Eloquent's BUILDER adds the timestamp to an update on its own — and that column
            // is read as "when did this profile last change": the public profile cache is
            // keyed on it and the admin creator-review queue ORDERS by it. A creator opening
            // a popup would otherwise expire their own cache and jump that queue. The same
            // rule `StripeChargesFlag::sync()` already follows, and it was caught here by a
            // test rather than in production.
            //
            // ⚠️ The column is deliberately not $fillable, so this is the write path either
            // way; see the migration.
            $written = DB::table('users')
                ->where('id', $user->getKey())
                ->whereNull('setup_celebrated_at')
                ->update(['setup_celebrated_at' => now()]);

            if ($written > 0) {
                // Keep the in-memory model honest for anything later in this request.
                $user->setAttribute('setup_celebrated_at', now());
            }
        } catch (\Throwable $e) {
            // ⚠️ Never throws. The worst case of a failed write is that the creator sees the
            // celebration once more; the worst case of a 500 is an error page on top of the
            // moment this feature exists to make good. Same house rule as VisitTracker.
            Log::warning('Setup celebration: failed to record seen', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return response()->json(['ok' => false]);
        }

        return response()->json(['ok' => true]);
    }
}
