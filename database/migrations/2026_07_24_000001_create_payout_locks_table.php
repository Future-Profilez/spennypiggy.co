<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A durable, cross-application mutex for payout execution.
 *
 * The earlier lock used MySQL GET_LOCK, which is session-scoped: a mid-run connection drop +
 * Laravel auto-reconnect silently releases it, letting a concurrent run start. A row in a
 * shared table (both apps share this DB) with an owner token and an expiry survives reconnects
 * and self-heals if a holder crashes.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('payout_locks')) {
            Schema::create('payout_locks', function (Blueprint $table) {
                $table->string('name')->primary();
                $table->string('token', 64);
                $table->unsignedBigInteger('expires_at')->index(); // unix seconds
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('payout_locks');
    }
};
