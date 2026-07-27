<?php

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;

Route::get('/test-cache', function () {
    $startTime = microtime(true);

    $value = Cache::remember('test_cache_key', 60, function () {
        return 'Cached Value - '.now()->toDateTimeString();
    });

    $endTime = microtime(true);
    $executionTime = ($endTime - $startTime) * 1000;

    return response()->json([
        'status' => 'success',
        'value' => $value,
        'driver' => config('cache.default'),
        'execution_time_ms' => $executionTime,
        'message' => 'If the timestamp above does not change on refresh, caching is working.',
    ]);
});
