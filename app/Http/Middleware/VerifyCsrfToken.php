<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // RFC 8058 one-click unsubscribe: the mail client POSTs with no session.
        'outreach/unsubscribe/*',
        '/stripe/webhook',
        '/rye-webhook',
        '/mandatory-status',
        '/webhook/payment',
        '/webhook/connect',
        '/subs-status',
        '/magicbell/*',
        'webauthn/*',
    ];
}
