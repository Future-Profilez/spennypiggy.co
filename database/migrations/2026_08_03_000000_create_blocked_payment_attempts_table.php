<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every purchase a creator lost because their subscription was not active.
 *
 * The alert on its own does not move a creator — a warning is easy to dismiss. The
 * COUNT is what moves them: "six people tried to buy from you this week" is a
 * number they can feel, and it is impossible to produce without recording each
 * attempt.
 *
 * ⚠️ No supporter identity is stored. A creator never receives supporter contact
 * details anywhere else on this platform, and a purchase that did not happen is a
 * weaker relationship than one that did, not a stronger one.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('blocked_payment_attempts')) {
            return;
        }

        Schema::create('blocked_payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('creator_id');
            $table->decimal('amount', 12, 2)->nullable();
            $table->string('currency', 8)->nullable();
            // Why the sale was refused, for the creator's own message.
            $table->string('reason', 60)->nullable();
            $table->timestamp('created_at')->nullable();

            // The creator-facing count is `creator_id = ? AND created_at >= ?`, and it
            // runs on EVERY refused checkout across seven gates. On a creator_id index
            // alone the date is a row filter, so the cost grows with that creator's
            // lifetime attempts instead of with the 7-day window — and a repeatedly
            // blocked creator is precisely the row that grows.
            $table->index(['creator_id', 'created_at']);
            // The prune scans on the date alone; the composite above cannot serve it.
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blocked_payment_attempts');
    }
};
