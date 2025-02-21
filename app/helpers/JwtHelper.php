<?php

namespace App\Helpers;

use Tymon\JWTAuth\Facades\JWTAuth;
use Carbon\Carbon;

class JwtHelper
{
    public static function generateToken()
    {
        $payload = [
            'iss' => env('JWT_ISSUER', 'your-issuer-id'), // Replace with your Rye issuer ID
            'sub' => auth()->id() ?? 'guest',
            'iat' => Carbon::now()->timestamp,
            'exp' => Carbon::now()->addMinutes(60)->timestamp,
        ];

        return JWTAuth::encode($payload);
    }
}
