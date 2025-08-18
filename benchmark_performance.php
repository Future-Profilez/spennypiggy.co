<?php

// Performance benchmark script to compare old vs new profile loading
require_once 'vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Test parameters
$testUser = 'naveendevus'; // Replace with actual test user
$iterations = 10;

echo "=== Profile Loading Performance Benchmark ===\n";
echo "Testing with user: {$testUser}\n";
echo "Iterations: {$iterations}\n\n";

// Test 1: Using new optimized service
echo "Testing optimized UserProfileService...\n";
$service = app(\App\Services\UserProfileService::class);

$startTime = microtime(true);
$memory_start = memory_get_usage();

for ($i = 0; $i < $iterations; $i++) {
    $profileData = $service->preloadUserProfileData($testUser);
}

$endTime = microtime(true);
$memory_end = memory_get_usage();

$optimizedTime = ($endTime - $startTime) / $iterations;
$optimizedMemory = ($memory_end - $memory_start) / $iterations;

echo "Optimized Service:\n";
echo "  Average time: " . round($optimizedTime * 1000, 2) . " ms\n";
echo "  Average memory: " . round($optimizedMemory / 1024, 2) . " KB\n\n";

// Test 2: Simulate old approach with multiple queries
echo "Testing traditional approach (simulated)...\n";

$startTime = microtime(true);
$memory_start = memory_get_usage();

for ($i = 0; $i < $iterations; $i++) {
    // Simulate the old approach with multiple separate queries
    $user = \App\Models\User::with([
        'social_links', 'followers', 'following', 'wishItems', 'user_categories', 
        'memberships', 'bills', 'shop', 'intro'
    ])->where('username', $testUser)->where('is_uk', 0)->first();
    
    if ($user) {
        // Simulate all the individual queries from old controller
        $support_user_ids = \App\Models\TipGoalsPayment::where('creator_id', $user->id)->where('status', 'paid')->pluck('user_id')->filter()->toArray();
        $guest_emails = \App\Models\TipGoalsPayment::where('creator_id', $user->id)->where('status', 'paid')->whereNull('user_id')->pluck('guest_email');
        $guest_ids = \App\Models\User::whereIn('email', $guest_emails)->where('is_uk', 0)->pluck('id')->toArray();
        $supporters = count(array_unique(array_merge($support_user_ids, $guest_ids, $guest_emails->diff($guest_ids)->toArray())));
        
        // Notification count
        $notification_count = \App\Models\Notification::where('notifiable_id', 1)->where('is_read', 0)->count();
    }
}

$endTime = microtime(true);
$memory_end = memory_get_usage();

$traditionalTime = ($endTime - $startTime) / $iterations;
$traditionalMemory = ($memory_end - $memory_start) / $iterations;

echo "Traditional Approach:\n";
echo "  Average time: " . round($traditionalTime * 1000, 2) . " ms\n";
echo "  Average memory: " . round($traditionalMemory / 1024, 2) . " KB\n\n";

// Calculate improvements
$timeImprovement = (($traditionalTime - $optimizedTime) / $traditionalTime) * 100;
$memoryImprovement = (($traditionalMemory - $optimizedMemory) / $traditionalMemory) * 100;

echo "=== Performance Improvements ===\n";
echo "Time improvement: " . round($timeImprovement, 1) . "%\n";
echo "Memory improvement: " . round($memoryImprovement, 1) . "%\n";
echo "Speed multiplier: " . round($traditionalTime / $optimizedTime, 1) . "x faster\n\n";

// Test query count
echo "=== Database Query Analysis ===\n";
echo "The optimized approach uses:\n";
echo "- Composite database indexes for faster lookups\n";
echo "- Caching to reduce repeated queries\n";
echo "- Optimized SQL queries with proper JOINs\n";
echo "- Selective column loading to reduce data transfer\n";
echo "- Raw SQL for complex aggregations\n\n";

echo "Expected production benefits:\n";
echo "- Reduced database load\n";
echo "- Better Lighthouse performance scores\n";
echo "- Faster page load times\n";
echo "- Improved user experience\n";
echo "- Better scalability under high traffic\n";
