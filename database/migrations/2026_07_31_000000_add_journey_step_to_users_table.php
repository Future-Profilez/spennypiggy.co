<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a creator has actually got to, as one value.
 *
 * The two apps share this database but no code. The journey is computed in the website
 * (every signal it reads — listings, posts, identity, Stripe, sales — lives there), while
 * the onboarding drip that emails creators runs in the admin app. Rather than reimplement
 * the "what has this creator done" logic on the admin side — the cross-app drift trap that
 * has already bitten this codebase — the website writes its answer here and the admin app
 * only reads it.
 *
 * This is also what stops the drip emailing "add your first item" to someone who set
 * everything up on day one: it sends against the step, not against a calendar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'journey_step')) {
                // Nullable, never defaulted to the first step: NULL means "not computed
                // yet", which is different from "at the beginning" and must not be
                // mistaken for it by the drip.
                $table->string('journey_step', 40)->nullable()->index();
            }

            if (! Schema::hasColumn('users', 'journey_step_at')) {
                // When the creator ENTERED the current step, not when it was last written.
                // A creator stuck on the same step for three weeks is the signal worth
                // acting on, and a plain updated-at timestamp cannot express it.
                $table->timestamp('journey_step_at')->nullable();
            }

            if (! Schema::hasColumn('users', 'journey_completed_at')) {
                $table->timestamp('journey_completed_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['journey_step', 'journey_step_at', 'journey_completed_at'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
