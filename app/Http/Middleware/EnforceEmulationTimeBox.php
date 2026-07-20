<?php

namespace App\Http\Middleware;

use App\Http\Controllers\Admin\EmulationLoginController;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ends an admin's impersonation session automatically once the time-box expires.
 *
 * Without this, an admin who forgets to press "stop" stays logged in as the user
 * for as long as the session lives (7 days) — every action in that window looks
 * like the user did it. The window is deliberately short; support work is minutes.
 */
class EnforceEmulationTimeBox
{
    /** Minutes an impersonation session may last before it is force-ended. */
    public const MAX_MINUTES = 30;

    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->session()->get('emulated_by_admin')) {
            return $next($request);
        }

        $startedAt = $request->session()->get('emulation_started_at');

        // Sessions started before this middleware existed have no timestamp —
        // stamp them now rather than ending them mid-request.
        if (! $startedAt) {
            $request->session()->put('emulation_started_at', now()->timestamp);

            return $next($request);
        }

        if (now()->timestamp - (int) $startedAt < self::MAX_MINUTES * 60) {
            return $next($request);
        }

        $adminId = $request->session()->get('emulation_admin_id');
        $userId = Auth::id();

        EmulationLoginController::recordStop($adminId, $userId, 'timeout');

        Auth::logout();
        $request->session()->forget(['emulated_by_admin', 'emulation_admin_id', 'emulation_started_at']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        Log::info('Emulation session auto-ended after time-box', [
            'admin_id' => $adminId,
            'user_id' => $userId,
            'minutes' => self::MAX_MINUTES,
        ]);

        $adminDashboardUrl = env('ADMIN_SITE_URL', 'http://localhost:8001');

        return redirect($adminDashboardUrl.'/admin/users/list');
    }
}
