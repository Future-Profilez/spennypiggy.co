<?php
// app/Http/Controllers/WebAuthn/GuestWebAuthnController.php

namespace App\Http\Controllers\WebAuthn;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laragear\WebAuthn\Models\WebAuthnCredential;

class GuestWebAuthnController extends Controller
{
    public function __construct()
    {
        $this->middleware('web');
    }

    /**
     * Check if user has passkey registered
     */
    public function check(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['has_passkey' => false]);
        }

        $hasPasskey = WebAuthnCredential::where('authenticatable_id', $user->id)
            ->where('authenticatable_type', get_class($user))
            ->exists();

        return response()->json(['has_passkey' => $hasPasskey]);
    }

    /**
     * Get registration options - NO authentication needed here
     * The browser will handle user verification
     */
    public function registerOptions(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        // Create WebAuthn challenge without authenticating the user
        // The challenge will include user verification requirements
        $webAuthn = app(\Laragear\WebAuthn\WebAuthn::class);

        $options = $webAuthn->generateAttestation(
            $user,  // Pass the user model
            [
                'timeout' => 60000,
                'authenticatorSelection' => [
                    'authenticatorAttachment' => 'platform', // Use device's built-in authenticator
                    'userVerification' => 'required', // Require biometric verification
                    'residentKey' => 'required', // Store passkey on device
                ],
                'attestation' => 'none'
            ]
        );

        // Store challenge in session for verification
        session(['webauthn.register_challenge' => $options->challenge]);

        return response()->json($options);
    }

    /**
     * Register the passkey - Verify and save
     */
    public function register(Request $request)
    {
        $email = $request->input('email');

        if (!$email) {
            return response()->json(['success' => false, 'message' => 'Email required'], 400);
        }

        $user = \App\Models\User::where('email', $email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        try {
            $webAuthn = app(\Laragear\WebAuthn\WebAuthn::class);

            // Verify the attestation response
            $credential = $webAuthn->verifyAttestation(
                $request->all(),
                session('webauthn.register_challenge')
            );

            // Save the credential to the user
            $user->webAuthnCredentials()->create([
                'credential_id' => $credential->id,
                'public_key' => $credential->publicKey,
                'counter' => $credential->counter,
                'device_name' => $request->userAgent() ?? 'Unknown Device',
                'transports' => json_encode($credential->transports ?? ['internal']),
                'aaguid' => $credential->aaguid,
                'origin' => $request->getSchemeAndHttpHost(),
            ]);

            // Clear challenge from session
            session()->forget('webauthn.register_challenge');

            return response()->json([
                'success' => true,
                'message' => 'Passkey registered successfully! You can now login with your fingerprint/face ID.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to register passkey: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get login options - Challenge for authentication
     */
    public function loginOptions(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User not found'], 404);
        }

        $credentials = WebAuthnCredential::where('authenticatable_id', $user->id)
            ->where('authenticatable_type', get_class($user))
            ->get();

        if ($credentials->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'No passkey found. Please register a passkey first.'
            ], 404);
        }

        $webAuthn = app(\Laragear\WebAuthn\WebAuthn::class);

        $options = $webAuthn->generateAssertion(
            $user,
            $credentials->toArray(),
            [
                'timeout' => 60000,
                'userVerification' => 'required', // Require biometric verification
            ]
        );

        // Store challenge in session
        session(['webauthn.login_challenge' => $options->challenge]);

        return response()->json($options);
    }

    /**
     * Verify login with passkey
     */
    public function login(Request $request)
    {
        try {
            $webAuthn = app(\Laragear\WebAuthn\WebAuthn::class);

            // Verify the assertion
            $assertion = $webAuthn->verifyAssertion(
                $request->all(),
                session('webauthn.login_challenge')
            );

            // Get the credential and user
            $credential = WebAuthnCredential::where('credential_id', $assertion->id)->first();

            if (!$credential) {
                return response()->json(['success' => false, 'message' => 'Credential not found'], 404);
            }

            $user = $credential->authenticatable;

            // Update counter
            $credential->counter = $assertion->counter;
            $credential->last_used_at = now();
            $credential->save();

            // Login the user
            Auth::login($user, true);
            $request->session()->regenerate();

            // Clear challenge
            session()->forget('webauthn.login_challenge');

            return response()->json([
                'success' => true,
                'redirect_url' => session()->pull('url.intended', url('/dashboard'))
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login failed: ' . $e->getMessage()
            ], 500);
        }
    }
}
