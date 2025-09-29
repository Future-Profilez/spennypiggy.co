<?php

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WebVitalsController;
use App\Http\Controllers\Api\DeliverableController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\StripeWebhookController;
use App\Http\Controllers\WishtenderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/products', [ProductController::class, 'index']);
Route::post('/create-product', [ProductController::class, 'store']);
Route::put('/products/{id}', [ProductController::class, 'update']);

// Cart API routes - using web middleware to maintain session authentication
Route::middleware('web')->group(function () {
    Route::get('/remove-from-cart/{uuid}/{device_id?}', [WishitemController::class, 'removeSurpriseFromCart'])->name('api.remove-from-cart');
});

// Web Vitals Analytics & Monitoring
Route::prefix('analytics')->group(function () {
    Route::post('/web-vitals', [WebVitalsController::class, 'store']);
    Route::get('/web-vitals', [WebVitalsController::class, 'index']);
    Route::get('/web-vitals/trends', [WebVitalsController::class, 'trends']);
});

// Performance Alerts (for monitoring services)
Route::post('/alerts/performance', function (Request $request) {
    // This endpoint receives performance alerts from the frontend
    // and can forward them to external monitoring services
    \Log::channel('performance')->critical('Performance alert received', $request->all());
    return response()->json(['status' => 'received'], 200);
});

// Deliverables API (requires authentication)
Route::middleware('auth:sanctum')->prefix('deliverables')->group(function () {
    Route::get('/', [DeliverableController::class, 'index'])->name('api.deliverables.index');
    Route::get('/{uuid}', [DeliverableController::class, 'show'])->name('api.deliverables.show');
    Route::get('/{uuid}/certificate/download', [DeliverableController::class, 'downloadCertificate'])->name('api.deliverables.certificate');
});

// Log viewer routes - these bypass Inertia.js frontend routing
Route::get('/simple-test', function() {
    return response()->json([
        'status' => 'success', 
        'message' => 'API routing is working!',
        'time' => now()->toDateTimeString(),
    ]);
})->name('api.simple.test');

// Simple log viewer routes that return JSON responses
Route::get('/test-logs', function() {
    $logPath = storage_path('logs/laravel.log');
    
    if (!\Illuminate\Support\Facades\File::exists($logPath)) {
        return response()->json([
            'status' => 'error',
            'message' => 'Log file not found.',
            'logs' => [],
        ]);
    }
    
    $logs = \Illuminate\Support\Facades\File::get($logPath);
    $logLines = array_slice(explode("\n", $logs), -50); // Get last 50 lines
    
    return response()->json([
        'status' => 'success',
        'message' => 'Log file loaded successfully',
        'logs' => array_filter($logLines), // Remove empty lines
        'total_lines' => count(array_filter($logLines)),
    ]);
})->name('api.test.logs');

// Main log viewer routes with API authentication for JSON responses
Route::middleware(['can.view.logs'])->prefix('debug')->name('api.logs.')->group(function () {
    Route::get('/logs', function(\Illuminate\Http\Request $request) {
        $logPath = storage_path('logs/laravel.log');
        
        if (!\Illuminate\Support\Facades\File::exists($logPath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Log file not found.',
                'logs' => [],
            ]);
        }
        
        $search = $request->get('search', '');
        $lines = $request->get('lines', 100); // Default to 100 lines
        
        $logs = \Illuminate\Support\Facades\File::get($logPath);
        $logLines = explode("\n", $logs);
        
        // Get the last N lines
        $logLines = array_slice($logLines, -$lines);
        
        // Apply search filter if provided
        if (!empty($search)) {
            $logLines = array_filter($logLines, function($line) use ($search) {
                return stripos($line, $search) !== false;
            });
        }
        
        return response()->json([
            'status' => 'success',
            'message' => 'Log file loaded successfully',
            'logs' => array_values(array_filter($logLines)), // Remove empty lines and reindex
            'total_lines' => count(array_filter($logLines)),
            'search' => $search,
            'lines_requested' => $lines,
        ]);
    })->name('index');
    
    Route::get('/logs/download', function() {
        $logPath = storage_path('logs/laravel.log');
        
        if (!\Illuminate\Support\Facades\File::exists($logPath)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Log file not found.',
            ], 404);
        }
        
        return response()->download($logPath, 'laravel-logs-' . date('Y-m-d') . '.log');
    })->name('download');
    
    Route::post('/logs/clear', function() {
        $logPath = storage_path('logs/laravel.log');
        
        if (\Illuminate\Support\Facades\File::exists($logPath)) {
            \Illuminate\Support\Facades\File::put($logPath, '');
            return response()->json([
                'status' => 'success',
                'message' => 'Log file cleared successfully.',
            ]);
        }
        
        return response()->json([
            'status' => 'error', 
            'message' => 'Log file not found.',
        ], 404);
    })->name('clear');
});

