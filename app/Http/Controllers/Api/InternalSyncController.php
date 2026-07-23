<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

class InternalSyncController extends Controller
{
    /**
     * Trigger financial transaction sync from an internal request.
     */
    public function syncFinancials(Request $request)
    {
        // config(), not env(): env() returns null once config is cached, which
        // would make this fail closed (safe, but silently breaks the sync).
        $token = (string) config('services.internal_sync.token');
        $providedToken = (string) ($request->header('X-Internal-Sync-Token') ?? $request->input('token') ?? '');

        // hash_equals: this is the one unauthenticated route that mutates the
        // financial ledger, so its secret check must not be a byte-by-byte
        // compare that leaks length/prefix via timing.
        if ($token === '' || ! hash_equals($token, $providedToken)) {
            Log::warning('InternalSyncController: Unauthorized sync attempt.', [
                'ip' => $request->ip(),
            ]);

            return response()->json(['error' => 'Unauthorized'], 401);
        }

        try {
            $userId = $request->input('user_id');
            $params = [];
            if ($userId) {
                $params['--user_id'] = $userId;
            }

            Artisan::call('finance:sync-transactions', $params);

            return response()->json([
                'success' => true,
                'message' => 'Financial sync completed successfully.',
                'output' => Artisan::output(),
            ]);
        } catch (\Exception $e) {
            Log::error('InternalSyncController: Sync failed.', [
                'error' => $e->getMessage(),
            ]);

            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
