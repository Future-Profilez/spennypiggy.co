<?php

use App\Http\Controllers\Admin\AuditExportController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\PayoutController;
use App\Http\Controllers\Api\DeliverableController;
use App\Http\Controllers\Api\InternalSyncController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\RiskController;
use App\Http\Controllers\Api\WebVitalsController;
use App\Http\Controllers\Auth\WishitemController;
use App\Http\Controllers\ProfilePostController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
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

// Stripe product CRUD. These hit the platform Stripe secret key (list every
// product, create a product, rename any product by id), so they MUST be gated —
// they were previously public on `[api]` only, which let an unauthenticated
// caller read/create/tamper with Stripe products. Behind the same admin guard
// as the /admin API group below.
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/products', [ProductController::class, 'index']);
    Route::post('/create-product', [ProductController::class, 'store']);
    Route::put('/products/{id}', [ProductController::class, 'update']);
});

// Cart API routes - using web middleware to maintain session authentication
Route::middleware('web')->group(function () {
    Route::get('/remove-from-cart/{uuid}/{device_id?}', [WishitemController::class, 'removeSurpriseFromCart'])->name('api.remove-from-cart');
});

// Web Vitals Analytics & Monitoring
Route::prefix('analytics')->group(function () {
    // Collection is necessarily open — it is beacon traffic from every visitor,
    // signed-in or not — but it is a public write, so it is rate limited.
    Route::post('/web-vitals', [WebVitalsController::class, 'store'])
        ->middleware('throttle:60,1');

    // The read endpoints are an internal performance dashboard. They were public,
    // unauthenticated and unthrottled: each one sorts the whole matching window to
    // compute percentiles, so anyone could load the database from a script. They
    // need the session, hence the 'web' group ('auth' cannot see a session in the
    // stateless api group).
    Route::middleware(['web', 'auth', 'admin', 'throttle:30,1'])->group(function () {
        Route::get('/web-vitals', [WebVitalsController::class, 'index']);
        Route::get('/web-vitals/trends', [WebVitalsController::class, 'trends']);
    });
});

// Performance Alerts (for monitoring services)
Route::post('/alerts/performance', function (Request $request) {
    // This endpoint receives performance alerts from the frontend
    // and can forward them to external monitoring services
    Log::channel('performance')->critical('Performance alert received', $request->all());

    return response()->json(['status' => 'received'], 200);
});

// REMOVED: GET /api/founder/qualify-winners.
//
// It had no auth of any kind, while the identical web route is admin-gated
// (routes/auth.php). qualifyWinners() sets users.is_founder, inserts
// founder_bonuses rows with a real bonus_amount and payout_status = pending,
// and emails the creator — and ProcessFounderPayouts then pays those pending
// rows out over Stripe on its daily run. An anonymous GET therefore created
// real, self-paying financial liability and consumed founder seats.
// Use the admin route, or `php artisan` on the server.

// Deliverables API (requires authentication)
Route::middleware('auth:sanctum')->prefix('deliverables')->group(function () {
    Route::get('/', [DeliverableController::class, 'index'])->name('api.deliverables.index');
    Route::get('/{uuid}', [DeliverableController::class, 'show'])->name('api.deliverables.show');
    Route::get('/{uuid}/certificate/download', [DeliverableController::class, 'downloadCertificate'])->name('api.deliverables.certificate');
});

// Profile Posts API (supports pagination and filtering)
Route::middleware('web')->group(function () {
    Route::get('/profile/{user}/posts', [ProfilePostController::class, 'index'])
        ->name('api.profile.posts');
});

// Risk Engine Routes
// These are intentionally unauthenticated — guest checkout (PiggyPot/Wishes) must
// be able to evaluate risk and create a PaymentIntent without logging in. Rate limit
// to stop anonymous probing of limits / RiskIdentity creation / PaymentIntent spam.
Route::prefix('risk')->group(function () {
    Route::post('/evaluate', [RiskController::class, 'evaluate'])->middleware('throttle:60,1');
    Route::post('/step-up/verify', [RiskController::class, 'verifyStepUp'])->middleware('web');
    Route::post('/step-up/resend', [RiskController::class, 'resendStepUpOtp'])->middleware('web');
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
Route::post('/internal/sync-financials', [InternalSyncController::class, 'syncFinancials']);

// Admin Dashboard & Exports — require an authenticated ADMIN (role 2), not just any
// authenticated token. Previously any valid Sanctum token could reach these.
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/export/audit-pack', [AuditExportController::class, 'export']);

    // Risk Management Routes
    Route::post('/risk/override', [App\Http\Controllers\Admin\RiskController::class, 'override']);
    Route::post('/risk/reset', [App\Http\Controllers\Admin\RiskController::class, 'reset']);
    Route::get('/risk/creators/{id}/disputes', [App\Http\Controllers\Admin\RiskController::class, 'disputes']);
    Route::get('/risk/creators/{id}/reserves', [App\Http\Controllers\Admin\RiskController::class, 'reserves']);
    Route::post('/risk/recalculate/{id}', [App\Http\Controllers\Admin\RiskController::class, 'recalculate']);

    // Payout Routes
    Route::prefix('payout')->group(function () {
        Route::post('/preview', [PayoutController::class, 'preview']);
        Route::post('/execute', [PayoutController::class, 'execute']);
    });
});
