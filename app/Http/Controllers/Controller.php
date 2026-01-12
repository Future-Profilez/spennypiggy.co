<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    protected function ensureTurnstileVerified(Request $request): void
    {
        $turnstileSecret = config('services.turnstile.secret_key') ?: env('TRUNSTILE_SECRET_KEY') ?: env('TURNSTILE_SECRET_KEY');
        if (empty($turnstileSecret)) {
            return;
        }

        $token = $request->input('cf_turnstile_response');
        if (empty($token)) {
            throw ValidationException::withMessages([
                'cf_turnstile_response' => 'Please verify you are not a robot.',
            ]);
        }

        $verifyResponse = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
            'secret' => $turnstileSecret,
            'response' => $token,
            'remoteip' => $request->ip(),
        ]);

        $verifyJson = $verifyResponse->json();
        if (!$verifyResponse->ok() || empty($verifyJson['success'])) {
            throw ValidationException::withMessages([
                'cf_turnstile_response' => 'Captcha verification failed. Please try again.',
            ]);
        }
    }
}
