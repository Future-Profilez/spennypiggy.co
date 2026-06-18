<?php

use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\WebVitalsController;
use App\Http\Controllers\Api\DeliverableController;
use App\Http\Controllers\Api\RiskController;
use App\Http\Controllers\Auth\StripeController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\FounderBonusController;
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
    Illuminate\Support\Facades\Log::channel('performance')->critical('Performance alert received', $request->all());
    return response()->json(['status' => 'received'], 200);
});

// Founder Bonus API Routes
Route::get('/founder/qualify-winners', [FounderBonusController::class, 'qualifyWinners']);

// Deliverables API (requires authentication)
Route::middleware('auth:sanctum')->prefix('deliverables')->group(function () {
    Route::get('/', [DeliverableController::class, 'index'])->name('api.deliverables.index');
    Route::get('/{uuid}', [DeliverableController::class, 'show'])->name('api.deliverables.show');
    Route::get('/{uuid}/certificate/download', [DeliverableController::class, 'downloadCertificate'])->name('api.deliverables.certificate');
});

// Profile Posts API (supports pagination and filtering) 
Route::middleware('web')->group(function () {
    Route::get('/profile/{user}/posts', [\App\Http\Controllers\ProfilePostController::class, 'index'])
        ->name('api.profile.posts');
});

// Risk Engine Routes
// These are intentionally unauthenticated — guest checkout (PiggyPot/Wishes) must
// be able to evaluate risk and create a PaymentIntent without logging in. Rate limit
// to stop anonymous probing of limits / RiskIdentity creation / PaymentIntent spam.
Route::prefix('risk')->group(function () {
    Route::post('/evaluate', [RiskController::class, 'evaluate'])->middleware('throttle:60,1');
    Route::post('/step-up/verify', [RiskController::class, 'verifyStepUp'])->middleware('web');
    Route::post('/step-up/resend',[RiskController::class, 'resendStepUpOtp'])->middleware('web');
    Route::post('/step-up/verify-passkey', [RiskController::class, 'verifyStepUpPasskey'])->middleware('web');
    Route::get('/limits', [RiskController::class, 'getEffectiveLimits'])->middleware('throttle:60,1');
});

Route::prefix('payments')->group(function () {
    Route::post('/create-intent', [RiskController::class, 'createPaymentIntent'])->middleware('throttle:30,1');
});

// Creator Risk Dashboard moved to web.php for session auth
// Route::prefix('creator')->middleware(['auth:sanctum'])->group(function () {
//     Route::get('/risk-status', [\App\Http\Controllers\Api\CreatorRiskController::class, 'getRiskStatus']);
// });

// Internal Sync Routes
Route::post('/internal/sync-financials', [\App\Http\Controllers\Api\InternalSyncController::class, 'syncFinancials']);

// Admin Dashboard & Exports — require an authenticated ADMIN (role 2), not just any
// authenticated token. Previously any valid Sanctum token could reach these.
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/dashboard', [\App\Http\Controllers\Admin\DashboardController::class, 'index']);
    Route::get('/export/audit-pack', [\App\Http\Controllers\Admin\AuditExportController::class, 'export']);

    // Risk Management Routes
    Route::post('/risk/override', [\App\Http\Controllers\Admin\RiskController::class, 'override']);
    Route::post('/risk/reset', [\App\Http\Controllers\Admin\RiskController::class, 'reset']);
    Route::get('/risk/creators/{id}/disputes', [\App\Http\Controllers\Admin\RiskController::class, 'disputes']);
    Route::get('/risk/creators/{id}/reserves', [\App\Http\Controllers\Admin\RiskController::class, 'reserves']);
    Route::post('/risk/recalculate/{id}', [\App\Http\Controllers\Admin\RiskController::class, 'recalculate']);

    // Payout Routes
    Route::prefix('payout')->group(function () {
        Route::post('/preview', [\App\Http\Controllers\Admin\PayoutController::class, 'preview']);
        Route::post('/execute', [\App\Http\Controllers\Admin\PayoutController::class, 'execute']);
    });
});
