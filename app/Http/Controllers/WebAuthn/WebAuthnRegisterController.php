<?php

namespace App\Http\Controllers\WebAuthn;

use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;  // Add this line!
use Laragear\WebAuthn\Http\Requests\AttestationRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;
use Illuminate\Support\Facades\Log;

class WebAuthnRegisterController
{
    public function options(AttestationRequest $request)
    {
        $options = $request
            ->secureRegistration()
            ->toCreate();
            
        Log::info('WebAuthn registration options generated', [
            'options' => $options,
            'user_id' => $request->user()?->id
        ]);
        
        return $options;
    }

    public function register(AttestedRequest $request): JsonResponse
    {
        try {
            // Get the credential ID from the request
            $credentialId = $request->input('id');
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'error' => 'User not authenticated'
                ], 401);
            }

            // Try to save (it might return a string even on success)
            $saveResult = $request->save();

            // Look for the credential in the database
            $credential = $user->webAuthnCredentials()
                ->where('id', $credentialId)
                ->first();

            // If found in database, consider it a success
            if ($credential) {
                $userAgent = request()->userAgent();

                // Update with browser info
                $credential->update([
                    'browser' => $this->detectBrowser($userAgent),
                    'platform' => $this->detectPlatform($userAgent),
                    'ip_address' => request()->ip(),
                    'user_agent' => $userAgent,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'WebAuthn credential registered successfully',
                    'credential_id' => $credential->id
                ]);
            }

            // If not found in DB and save returned a string, it's an error
            if (is_string($saveResult)) {
                return response()->json([
                    'success' => false,
                    'error' => $saveResult,
                    'message' => 'Registration failed - credential not saved'
                ], 400);
            }

            // If save returned an object, use it
            if (is_object($saveResult)) {
                $userAgent = request()->userAgent();
                $saveResult->update([
                    'browser' => $this->detectBrowser($userAgent),
                    'platform' => $this->detectPlatform($userAgent),
                    'ip_address' => request()->ip(),
                    'user_agent' => $userAgent,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'WebAuthn credential registered successfully'
                ]);
            }

            return response()->json([
                'success' => false,
                'error' => 'Unknown error occurred'
            ], 400);
        } catch (\Exception $e) {
            Log::error('WebAuthn registration error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Registration failed: ' . $e->getMessage()
            ], 500);
        }
    }

    private function detectBrowser($agent)
    {
        if (str_contains($agent, 'Chrome')) return 'Chrome';
        if (str_contains($agent, 'Firefox')) return 'Firefox';
        if (str_contains($agent, 'Safari')) return 'Safari';
        if (str_contains($agent, 'Edge')) return 'Edge';

        return 'Unknown';
    }

    private function detectPlatform($agent)
    {
        if (str_contains($agent, 'Windows')) return 'Windows';
        if (str_contains($agent, 'Mac')) return 'MacOS';
        if (str_contains($agent, 'Android')) return 'Android';
        if (str_contains($agent, 'iPhone')) return 'iOS';

        return 'Unknown';
    }
}
