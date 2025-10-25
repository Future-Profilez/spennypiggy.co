<?php

use App\Http\Controllers\PurchasesController;
use Illuminate\Support\Facades\Route;

// Purchases route
Route::middleware(['web', 'auth'])->group(function () {
    Route::get('/purchases', [PurchasesController::class, 'index'])->name('purchases');
});