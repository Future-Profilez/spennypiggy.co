<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Every human decision on a creator's ID check, kept for ever.
 *
 * 🚨 `users.identity_admin_notes` IS ONE COLUMN AND IS OVERWRITTEN ON EVERY
 * DECISION, so the moment a creator re-verifies, what they were told last time
 * is gone. That is precisely the thing a reviewer needs on the second look:
 * "I asked for X — did they do X?" Without it the second review is the first
 * review again, and somebody re-using another person's passport simply submits
 * the same document until a different admin waves it through.
 *
 * ⚠️ NO FOREIGN KEY, and the username is snapshot: the review record is
 * evidence about a decision, and it has to survive the account being deleted.
 * Same rule as `security_events` and `account_deletion_feedback`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('identity_reviews')) {
            return;
        }

        Schema::create('identity_reviews', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->index();
            $table->string('username')->nullable();
            // 'approved' | 'rejected'
            $table->string('decision', 20)->index();
            /*
             * Why it was refused, as a CODE. The admin's own sentence lives in
             * `notes`; this decides what the creator is told to DO.
             *
             * 🚨 `document_problem` and `identity_mismatch` are different
             * instructions, and getting them the wrong way round is the loop
             * this feature exists to break: telling somebody whose ID is not
             * their own to "send the ID again" gets the same ID again, and
             * Stripe passes it again, for ever.
             */
            $table->string('reason_type', 40)->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('identity_reviews');
    }
};
