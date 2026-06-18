<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Base CREATE for monthly_charges. The repo previously had only ALTER migrations
 * for this table (each guarded with `if (!Schema::hasTable(...)) return;`), so a
 * fresh database (CI/tests, new deploys) never created the table and every
 * authenticated request hit "no such table: monthly_charges" via
 * User::getMonthlyChargeEnabledAttribute().
 *
 * Guarded with hasTable so existing environments (where the table was created
 * out-of-band) are untouched; only fresh databases get it. Columns added later
 * by ALTER migrations (trial/subscription dates, cancelled_at, last_email_type,
 * digital_waiver_*) are intentionally NOT included here — those run afterwards.
 * `end` IS included because the 2025_06_25 drop_end migration drops it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('monthly_charges')) {
            return;
        }

        Schema::create('monthly_charges', function (Blueprint $table) {
            $table->id();
            $table->string('uuid')->nullable();
            $table->string('stripe_id')->nullable();
            $table->string('session_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('currency')->nullable();
            $table->double('amount', 10, 2)->nullable();
            $table->double('tax', 10, 2)->nullable();
            $table->string('status')->nullable();
            $table->timestamp('upcoming_payment')->nullable();
            $table->date('end')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        // No-op: this table predates the repo's migration history. Dropping it
        // here would be destructive on environments that owned it before.
    }
};
