<?php

namespace App\Http\Controllers\WebAuthn;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

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

            return response()->json([
                'has_passkey' => $hasPasskey,
                'user_exists' => true,
                'user_id' => $user->id
            ]);
        } catch (\Exception $e) {
            \Log::error('WebAuthn check error: ' . $e->getMessage());
            return response()->json([
                'has_passkey' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function delete(Request $request)
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            // Delete all WebAuthn credentials for the user
            $deleted = $user->webAuthnCredentials()->delete();

            if ($deleted) {
                \Log::info('WebAuthn credentials deleted', [
                    'user_id' => $user->id,
                    'count' => $deleted
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Passkey(s) removed successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'No passkeys found to delete'
            ], 404);
        } catch (\Exception $e) {
            \Log::error('WebAuthn delete error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete passkey: ' . $e->getMessage()
            ], 500);
        }
    }
}
