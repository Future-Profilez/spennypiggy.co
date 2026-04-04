<?php

return [

    'relying_party' => [
        'name' => config('app.name'),
        'id' => env('WEBAUTHN_RPID', 'localhost'),
    ],

    'origins' => [
        env('WEBAUTHN_ORIGIN', 'http://localhost:8000'),
    ],

    'challenge' => [
        'bytes' => 32,
        'timeout' => 60000,
        'key' => '_webauthn',
    ],

    'authenticator_selection' => [

        // Use device biometrics (Windows Hello)
        'authenticator_attachment' => 'platform',

        // REQUIRED for login without email
        'resident_key' => 'required',

        // Require PIN / fingerprint
        'user_verification' => 'required',
    ],

    'timeout' => 60000,

];
