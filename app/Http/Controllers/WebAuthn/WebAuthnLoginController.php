<?php

namespace App\Http\Controllers\WebAuthn;

use App\Http\Controllers\Controller;
use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\Response;
use Illuminate\Http\JsonResponse;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Http\Requests\AssertionRequest;
use Laragear\WebAuthn\Models\WebAuthnCredential;
use Illuminate\Support\Facades\Log;

class WebAuthnLoginController extends Controller
{
    /**
     * Generate login options for email-based login
     */
    public function options(AssertionRequest $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'email' => 'nullable|email'
            ]);

            // The correct way to set user verification
            $options = $request->toVerify($validated);

            return response()->json($options);
        } catch (\Exception $e) {
            Log::error('WebAuthn options error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate login options: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Generate login options for userless (passkey) login
     */
    public function optionsUserless(AssertionRequest $request): JsonResponse
    {
        try {
            Log::info('Userless WebAuthn login options requested');

            // For userless login, don't pass any user data
            $options = $request->toVerify();

            return response()->json($options);
        } catch (\Exception $e) {
            Log::error('Userless WebAuthn options error: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Handle the login assertion
     */
    public function login(AssertedRequest $request): JsonResponse
    {
        try {
            Log::info('WebAuthn login attempt', [
                'credential_id' => $request->input('id'),
                'user_agent' => $request->userAgent()
            ]);

            // Attempt to login the user 
            $user = $request->login();

            if (!$user) {
                Log::warning('WebAuthn login failed - authentication rejected');
                return response()->json([
                    'success' => false,
                    'message' => 'Passkey authentication failed. The device may not be registered or verification failed.'
                ], 422);
            }

            // Update credential with last used info 
            $credentialId = $request->input('id');

            // Try to find by credential_id first (since you added this column) 
            $credential = WebAuthnCredential::where('credential_id', $credentialId)->first();

            // If not found by credential_id, try by id 
            if (!$credential) {
                $credential = WebAuthnCredential::where('id', $credentialId)->first();
            }

            if ($credential) {
                $credential->update([
                    'last_used_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                Log::info('Credential updated', ['credential_id' => $credential->credential_id ?? $credential->id]);
            } else {
                Log::warning('Credential not found for update', ['credential_id' => $credentialId]);
            }

            // Regenerate session to prevent session fixation 
            $request->session()->regenerate();

            Log::info('WebAuthn login successful', [
                'user_id' => $user->getAuthIdentifier(),
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'redirect_url' => $this->getRedirectUrl($user)
            ]);
        } catch (\Exception $e) {
            Log::error('WebAuthn login error: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json([
                'success' => false,
                'message' => 'Login error: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get redirect URL after login
     */
    protected function getRedirectUrl($user): string
    {
        if (session()->has('url.intended')) {
            return session()->pull('url.intended');
        }

        return route('dashboard');
    }
}
