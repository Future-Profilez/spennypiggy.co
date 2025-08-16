<?php

return [
    'production' => [
        'domains' => ['https://spennypiggy.co'],
        'emails'  => ['jack@socialvortex.io', 'naveen@internetbusinesssolutionsindia.com'],
        'schedule' => 'everyThirtyMinutes', // How often to run in production
    ],
    'development' => [
        'domains' => ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'],
        'emails'  => ['naveen@internetbusinesssolutionsindia.com', 'prem@futureprofilez.com'],
        'schedule' => 'daily', // How often to run in development
    ],
    
    // Icon mapping for different item types in email template
    'icons' => [
        'Wish Items' => '🎁',
        'Memberships' => '👥',
        'Bills' => '🧾',
        'Shops' => '🏪',
        'User Intros' => '👋',
        'User Avatars' => '🖼️',
        'User Profiles' => '👤',
        'Posts' => '📝',
    ],
];
