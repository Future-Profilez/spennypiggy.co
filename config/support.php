<?php

return [
    'ticket_admin_recipients' => env('APP_ENV') === 'production'
        ? ['support@spennypiggy.co', 'naveen@internetbusinesssolutionsindia.com']
        : ['naveen@internetbusinesssolutionsindia.com'],
];

