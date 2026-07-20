<?php

/*
|--------------------------------------------------------------------------
| DEV HELPER — refresh the logged-in creator's content dates to "now"
|--------------------------------------------------------------------------
| GET /dev/refresh-my-dates (auth). Controller-backed (not a closure) so it
| survives route:cache on Vapor. See DevRefreshDatesController.
*/

use App\Http\Controllers\DevRefreshDatesController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')
    ->get('/dev/refresh-my-dates', DevRefreshDatesController::class)
    ->name('dev.refresh-my-dates');
