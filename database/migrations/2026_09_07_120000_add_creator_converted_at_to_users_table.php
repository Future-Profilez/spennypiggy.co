<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When a GIFTER account became a CREATOR account.
 *
 * 🚨 THIS IS THE ONLY THING THAT CAN EVER SAY "this creator did not start as one".
 * `role` holds today's answer and nothing holds yesterday's: after the flip a
 * converted account is byte-identical to one that signed up as a creator, so an
 * admin looking at a profile whose photo was auto-approved months ago as a fan has
 * no way to know why. `created_at` cannot stand in for it either — it is the day
 * they joined as a supporter, which is exactly what makes every day-counter read
 * the wrong number (the journey nudge's "dormant" window is measured off
 * `journey_step_at` for the same reason).
 *
 * ⚠️ WRITE-ONCE. A creator cannot convert twice, and the column doubles as the
 * idempotency marker in `App\Support\GifterToCreator::convert()` — a second POST
 * finds it set and does nothing rather than re-resetting approvals and stamping a
 * second consent.
 *
 * ⚠️ Cast on the model in BOTH apps (the two share one database); in `$fillable` in
 * NEITHER. It states something the platform did on a person's instruction, and a
 * mass-assignable copy is a route by which a posted form claims a conversion that
 * never happened — or, worse, clears the one marker that says the assets on this
 * account were reviewed as a fan's and not as a creator's.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'creator_converted_at')) {
                $table->timestamp('creator_converted_at')->nullable()->after('setup_celebrated_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'creator_converted_at')) {
                $table->dropColumn('creator_converted_at');
            }
        });
    }
};
