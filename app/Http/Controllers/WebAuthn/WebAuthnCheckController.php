<?php

namespace App\Http\Controllers\WebAuthn;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebAuthnCheckController extends Controller
{
    public function check(Request $request)
    {
        try {
            $request->validate([
                'email' => 'required|email|string'
            ]);

            $user = User::where('email', $request->email)->first();

            if (!$user) {
                return response()->json([
                    'has_passkey' => false,
                    'user_exists' => false
                ]);
            }

            $hasPasskey = $user->webAuthnCredentials()->exists();
            $passkeys = $user->webAuthnCredentials()
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

            return response()->json([
                'has_passkey' => $hasPasskey,
                'passkeys' => $passkeys,
                'user_exists' => true,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            Log::error('WebAuthn check error: ' . $e->getMessage());
            return response()->json([
                'has_passkey' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function delete(Request $request, $id = null)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
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
                    'count' => $deleted
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Passkey removed successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No passkeys found to delete'
            ], 404);
        } catch (\Exception $e) {
            Log::error('WebAuthn delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete passkey: ' . $e->getMessage()
            ], 500);
        }
    }
}
