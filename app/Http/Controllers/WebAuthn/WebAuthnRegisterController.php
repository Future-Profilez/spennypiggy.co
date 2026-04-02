<?php

namespace App\Http\Controllers\WebAuthn;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Laragear\WebAuthn\Http\Requests\AttestationRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;

class WebAuthnRegisterController
{

    public function options(AttestationRequest $request)
    {

        /*
        email from frontend
        */
        $email = request()->input('email');

        $user = User::where('email', $email)->first();

        if (!$user) {

            return response()->json([
                'message' => 'User not found'
            ], 404);
        }

        /*
        IMPORTANT
        login BEFORE validation continues
        */
        Auth::login($user);

        return $request
            ->fastRegistration()
            ->toCreate();
    }


    public function register(AttestedRequest $request)
    {

        $request->save();

        return response()->json([
            'success' => true
        ]);
    }
}
