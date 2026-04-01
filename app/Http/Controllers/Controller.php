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
        // ALWAYS use config() instead of env() to support Vapor's config:cache
        $turnstileSecret = config('services.turnstile.secret_key');
        if (empty($turnstileSecret)) {
            return;
        }

        $host = strtolower((string) $request->getHost());
        if (app()->environment('local') && in_array($host, ['localhost', '127.0.0.1'], true)) {
            return;
        }

        if (session()->has('step_up_verified_log_id')) {
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
            \Illuminate\Support\Facades\Log::error('Turnstile verification failed', [
                'response' => $verifyJson,
                'status' => $verifyResponse->status(),
                'ip' => $request->ip(),
                'token_length' => strlen($token),
                'secret_set' => !empty($turnstileSecret),
            ]);
            throw ValidationException::withMessages([
                'cf_turnstile_response' => 'Captcha verification failed. Please try again.',
            ]);
        }
    }
}
