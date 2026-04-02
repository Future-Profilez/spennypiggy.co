<?php
// app/Http/Controllers/WebAuthn/WebAuthnCheckController.php

namespace App\Http\Controllers\WebAuthn;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Laragear\WebAuthn\Models\WebAuthnCredential;

class WebAuthnCheckController extends Controller
{
    public function check(Request $request)
    {
        $request->validate([
            'email' => 'required|email'
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json([
                'has_passkey' => false
            ]);
        }

        $hasPasskey = WebAuthnCredential::where('user_id', $user->id)->exists();

        return response()->json([
            'has_passkey' => $hasPasskey
        ]);
    }
}
