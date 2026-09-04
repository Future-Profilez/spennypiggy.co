<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `identity_status = 2` answered two different questions with one number.
 *
 * It is written when the Stripe Identity SESSION IS CREATED, not when the creator
 * submits a document — so "opened the passport check and closed the tab" and
 * "uploaded everything, Stripe is deciding" were the same value. Every surface
 * therefore told an abandoned creator "Your ID check is being processed", which is
 * a wait with no end: Stripe emits no event for a closed tab, so nothing would ever
 * move them off it.
 *
 * Stripe DOES emit `identity.verification_session.processing` the moment a document
 * is actually submitted. This column stores the session's own status verbatim
 * (`requires_input` | `processing` | `verified` | `canceled`) so the two states are
 * distinguishable, and `CreatorJourneyService` can put the unfinished one back in
 * the creator's own list instead of the "with our team" list.
 *
 * ⚠️ Shared database: the admin app reads `users` too. Its `User` model casts the
 * column (read-only — it is a Stripe fact, not something a back office may set).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('identity_session_status', 32)->nullable()->after('identity_status');
            $table->timestamp('identity_session_updated_at')->nullable()->after('identity_session_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['identity_session_status', 'identity_session_updated_at']);
        });
    }
};
