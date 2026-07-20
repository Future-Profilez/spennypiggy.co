<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class EmulationLoginController extends Controller
{
    /**
     * Handle the signed emulation login request from the admin dashboard.
     */
    public function login(Request $request, $userId)
    {
        $adminId = $request->query('admin_id');
        $expires = $request->query('expires');
        $signature = $request->query('signature');

        // Verify the manual signature
        $appKey = config('app.key');
        if (str_starts_with($appKey, 'base64:')) {
            $appKey = base64_decode(substr($appKey, 7));
        }

        $signatureData = "user={$userId}&admin={$adminId}&expires={$expires}";
        $expectedSignature = hash_hmac('sha256', $signatureData, $appKey);

        if (! hash_equals($expectedSignature, (string) $signature)) {
            Log::warning("Invalid emulation signature attempt for User ID {$userId}");
            abort(403, 'Invalid signature.');
        }

        if (now()->timestamp > (int) $expires) {
            Log::warning("Expired emulation signature attempt for User ID {$userId}");
            abort(403, 'Link expired.');
        }

        // Prevent replay attacks — each signed URL is one-time-use
        $nonceKey = 'emulation_nonce_'.$signature;
        if (Cache::has($nonceKey)) {
            Log::warning("Replayed emulation link attempt for User ID {$userId} by Admin ID {$adminId}");
            abort(403, 'Link already used.');
        }
        Cache::put($nonceKey, true, 300); // lock for 5 minutes (matches link expiry)

        $user = User::findOrFail($userId);

        // Log in as the user
        Auth::login($user);

        // Store emulation info in session.
        // `emulation_started_at` time-boxes the session — EnforceEmulationTimeBox
        // ends it automatically once the window passes.
        $request->session()->put('emulated_by_admin', true);
        $request->session()->put('emulation_admin_id', $adminId);
        $request->session()->put('emulation_started_at', now()->timestamp);

        Log::info("User ID {$user->id} is being emulated by Admin ID {$adminId} via signed link.");

        // Redirect to the dashboard or home
        return redirect()->intended('/dashboard')->with('success', 'You are now emulating '.$user->username);
    }

    /**
     * Stop emulation and logout.
     */
    public function stop(Request $request)
    {
        if (! $request->session()->get('emulated_by_admin')) {
            return redirect('/');
        }

        self::recordStop(
            $request->session()->get('emulation_admin_id'),
            Auth::id(),
            'manual'
        );

        Auth::logout();

        $request->session()->forget(['emulated_by_admin', 'emulation_admin_id', 'emulation_started_at']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // Redirect back to admin dashboard — flash messages can't cross domains
        $adminDashboardUrl = env('ADMIN_SITE_URL', 'http://localhost:8001');

        return redirect($adminDashboardUrl.'/admin/users/list');
    }

    /**
     * Write the EMULATION_STOPPED audit row.
     *
     * Lives here (and is static) so the time-box middleware can log an automatic
     * end the same way a manual "stop" does. The admin app writes EMULATION_STARTED;
     * both rows land in the shared `audit_logs` table its viewer reads.
     */
    public static function recordStop($adminId, $userId, string $endedBy = 'manual'): void
    {
        try {
            AuditLog::create([
                'actor' => $adminId ? 'admin:'.$adminId : 'system',
                'admin_id' => $adminId ?: null,
                'action_type' => 'EMULATION_STOPPED',
                'entity_type' => 'user',
                'entity_id' => $userId ? (string) $userId : null,
                'correlation_id' => (string) Str::uuid(),
                'metadata_json' => [
                    'target_user_id' => $userId,
                    'ended_by' => $endedBy, // manual | timeout
                ],
                'created_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to write EMULATION_STOPPED audit log', [
                'admin_id' => $adminId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
