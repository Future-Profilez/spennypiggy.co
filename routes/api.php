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

