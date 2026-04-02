<?php

namespace App\Http\Controllers\WebAuthn;

use Laragear\WebAuthn\Http\Requests\AttestationRequest;
use Laragear\WebAuthn\Http\Requests\AttestedRequest;

class WebAuthnRegisterController
{

    public function options(AttestationRequest $request)
    {
    
        return $request
            ->fastRegistration()
            ->userless()
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
