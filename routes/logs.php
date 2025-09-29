<?php

use App\Http\Controllers\LogViewerController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Log Viewer Routes
|--------------------------------------------------------------------------
|
| These routes are for the Laravel log viewer functionality. 
| They are defined separately to bypass Inertia.js frontend routing.
|
*/

// Simple test route to verify routing works
Route::get('/simple-test', function() {
    return response()->json([
        'status' => 'success',
        'message' => 'Log viewer routing is working!',
        'time' => now()->toDateTimeString(),
    ]);
})->name('simple.test');

// Test route without middleware
Route::get('/test-logs', [LogViewerController::class, 'index'])->name('test.logs');

// Main log viewer routes with authentication and authorization
Route::middleware(['auth', 'can.view.logs'])->prefix('debug')->name('logs.')->group(function () {
    Route::get('/logs', [LogViewerController::class, 'index'])->name('index');
    Route::get('/logs/download', [LogViewerController::class, 'download'])->name('download');
    Route::post('/logs/clear', [LogViewerController::class, 'clear'])->name('clear');
});