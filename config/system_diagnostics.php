<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Admin-app hand-off secret
    |--------------------------------------------------------------------------
    |
    | The diagnostics screen lives on this app but is only reachable by clicking
    | through from admin.spennypiggy.co, which is the only surface that actually
    | authenticates administrators (this app's `admin` middleware checks
    | users.role === '2' and no row in the database has that role).
    |
    | The two apps share a database but NOT a codebase or an APP_KEY, so the
    | hand-off is a plain HMAC over a timestamp rather than a Laravel signed
    | route. This value must be IDENTICAL in both apps' .env files.
    |
    | Empty means the door is shut: an unset secret refuses every hand-off
    | rather than accepting an unsigned one.
    |
    */

    'link_secret' => env('SYSDIAG_LINK_SECRET', ''),

    /*
     * How long a hand-off link stays usable, in seconds. Short on purpose — the
     * link only has to survive the redirect that follows the click, so anything
     * longer is just a window for a copied URL out of a browser history or a
     * proxy log.
     */
    'link_ttl' => (int) env('SYSDIAG_LINK_TTL', 120),

    /*
     * How long the unlocked session lasts, in seconds. The page re-runs its own
     * sweep and polls history, so this has to outlive a working session at the
     * screen, not just the first request.
     */
    'session_ttl' => (int) env('SYSDIAG_SESSION_TTL', 1800),

];
