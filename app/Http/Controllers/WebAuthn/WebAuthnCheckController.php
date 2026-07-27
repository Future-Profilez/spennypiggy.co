<?php

namespace App\Http\Controllers\WebAuthn;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Jenssegers\Agent\Agent;

class WebAuthnCheckController extends Controller
{
    public function check(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|string',
            ]);

            $user = User::where('email', $request->email)->first();

            if (! $user) {
                return response()->json([
                    'has_passkey' => false,
                    'user_exists' => false,
                ]);
            }

            // Get passkeys specific to the current device (using browser/platform approximation)
            // or just return all passkeys and let the frontend figure it out
            $passkeysQuery = $user->webAuthnCredentials();
            $hasPasskey = $passkeysQuery->exists();
            $passkeys = $passkeysQuery
                ->select('id', 'platform', 'browser', 'created_at', 'last_used_at')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($pk) {
                    return [
                        'id' => $pk->id,
                        'platform' => $pk->platform,
                        'browser' => $pk->browser,
                        'created_at' => $pk->created_at,
                        'last_used_at' => $pk->last_used_at,
                    ];
                });

            // Also check if there's a passkey specifically for this exact device
            $agent = request()->userAgent();
            $ip = request()->ip();

            // This is a rough heuristic - WebAuthn doesn't provide a guaranteed way
            // to link a specific browser instance to a credential before the challenge
            // so we rely on the browser/platform fingerprint
            $parsedAgent = new Agent;
            $parsedAgent->setUserAgent($agent);

            $browser = $parsedAgent->browser().' '.$parsedAgent->version($parsedAgent->browser());
            $platform = $parsedAgent->platform().' '.$parsedAgent->version($parsedAgent->platform());

            $hasDevicePasskey = $user->webAuthnCredentials()
                ->where(function ($query) use ($browser, $platform) {
                    $query->where('browser', 'like', explode(' ', $browser)[0].'%')
                        ->where('platform', 'like', explode(' ', $platform)[0].'%');
                })
                ->exists();

            // If we have ANY passkey, we can suggest using it
            // The frontend uses 'has_passkey' to decide whether to prompt for setup
            // and whether to attempt passkey login.
            $canUsePasskey = $hasPasskey;

            return response()->json([
                'has_passkey' => $canUsePasskey,
                'has_any_passkey' => $hasPasskey,
                'has_device_passkey' => $hasDevicePasskey,
                'passkeys' => $passkeys,
                'user_exists' => true,
                'user_id' => $user->id,
            ]);
        } catch (\Exception $e) {
            Log::error('WebAuthn check error: '.$e->getMessage());

            return response()->json([
                'has_passkey' => false,
                'has_any_passkey' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function delete(Request $request, $id = null)
    {
        try {
            $user = $request->user();

            if (! $user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $query = $user->webAuthnCredentials();

            if ($id) {
                $query->where('id', $id);
            }

            $deleted = $query->delete();

            if ($deleted) {
                Log::info('WebAuthn credential(s) deleted', [
                    'user_id' => $user->id,
                    'credential_id' => $id,
                    'count' => $deleted,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Passkey removed successfully',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No passkeys found to delete',
            ], 404);
        } catch (\Exception $e) {
            Log::error('WebAuthn delete error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete passkey: '.$e->getMessage(),
            ], 500);
        }
    }
}
