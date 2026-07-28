<?php

return [
    // The address a creator or supporter is pointed at when a flow cannot be
    // self-served (e.g. an identity check flagged by the security review).
    'contact_email' => env('SUPPORT_CONTACT_EMAIL', 'support@spennypiggy.co'),

    'ticket_admin_recipients' => env('APP_ENV') === 'production'
        ? ['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com']
        : ['naveen@internetbusinesssolutionsindia.com'],
];
