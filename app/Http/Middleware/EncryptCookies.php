<?php

namespace App\Http\Middleware;

use App\Support\MaintenanceMode;
use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    /**
     * The names of the cookies that should not be encrypted.
     *
     * @var array<int, string>
     */
    protected $except = [
        /*
         * The maintenance bypass token.
         *
         * ⚠️ Load-bearing. EnsureSiteAvailable runs in the GLOBAL stack — before
         * this middleware, which lives in the `web` group — so it reads the raw
         * cookie. Encrypted, the value it compares would be ciphertext and the
         * bypass would never match, silently locking out the one person who needs
         * in. Encryption buys nothing here: the value is a random bearer token
         * that is compared, not personal data that is read.
         */
        MaintenanceMode::BYPASS_COOKIE,
    ];
}
