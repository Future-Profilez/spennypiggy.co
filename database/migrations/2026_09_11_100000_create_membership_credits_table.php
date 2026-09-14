<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Earn your membership back" — the subscription-credit ledger.
 *
 * 🚨 ONE ROW = ONE FREE MONTH. A rung awarding N months writes N rows, so
 * "available" is a COUNT and spending one month never has to divide a row.
 * The alternative — a `months` column decremented as credit is used — makes
 * every read a sum and every spend a read-modify-write on a money record.
 *
 * 🚨 IT IS A CREDIT AND NEVER CASH. Nothing here carries a payable amount, a
 * currency or a Stripe transfer id, deliberately: a credit is spent against the
 * creator's own platform bill and against nothing else. `applied_value_minor`
 * records what the credit was WORTH when it was applied, for the finance
 * reports, and is written only after the credit has been used.
 *
 * ⚠️ NO FOREIGN KEY ON `creator_id`, and `username` is a SNAPSHOT. The record
 * of what a creator earned outlives the account it is about — the same rule
 * `account_deletion_feedback`, `security_events`, `user_flags` and
 * `profile_rejections` all follow.
 *
 * ⚠️ THIS IS THE SHIPPING MIGRATION. admin.spennypiggy.co declares the same
 * table for its own test database in a guarded migration with an empty
 * `down()`; keep the columns identical.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('membership_credits')) {
            return;
        }

        Schema::create('membership_credits', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('creator_id')->index();
            $table->string('username')->nullable();

            /*
             * 🚨 THE RUNG AND ITS SEQUENCE ARE WHAT MAKE A CREDIT UNIQUE.
             * `rung` is the Nth threshold crossed (1 = the first
             * `threshold_gbp`); `sequence` separates the months of one rung
             * where the config awards more than one. Together with the creator
             * they are UNIQUE, so a re-run of the evaluator, two workers racing
             * or a retried job can never award the same month twice.
             */
            $table->unsignedInteger('rung');
            $table->unsignedInteger('sequence')->default(1);

            /*
             * Snapshots of the rule this credit was awarded under. A config
             * change must never rewrite what a creator was already told they
             * had earned — the same reason `growth_bonus_rewards` snapshots its
             * ladder amount.
             */
            $table->decimal('threshold_gbp', 12, 2);
            $table->decimal('qualifying_earnings_gbp', 12, 2)->default(0);

            /*
             * earned    — available to spend
             * applied   — spent against a bill; `applied_at` says when
             * reversed  — a refund took qualifying earnings back below the rung
             *             before it was spent
             * expired   — went unused past `expires_at` (only ever set when
             *             `membership_credits.expiry_months` is configured)
             */
            $table->string('status', 20)->default('earned')->index();

            $table->timestamp('earned_at')->nullable();
            $table->timestamp('applied_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('reversed_at')->nullable();

            /*
             * What the month was worth in minor units when it was applied, and
             * in which currency. Written at APPLICATION, never at award: the
             * membership price can change between the two, and the figure that
             * matters to finance is what was actually credited.
             */
            $table->unsignedInteger('applied_value_minor')->nullable();
            $table->string('applied_currency', 3)->nullable();

            /*
             * Stripe's own customer-balance transaction id. The credit is
             * pushed onto the creator's customer balance and Stripe applies it
             * to their next invoice; this is the receipt. Unique so a retry
             * cannot double-credit even if the local claim were lost.
             */
            $table->string('stripe_balance_transaction_id')->nullable()->unique();

            /*
             * 🚨 A CREDIT ALREADY SPENT IS NEVER CLAWED BACK — it is FLAGGED.
             * The same rule as a paid Growth Bonus reward: the engine does not
             * reverse what has already been given, it asks a person to look.
             */
            $table->boolean('needs_review')->default(false)->index();

            $table->text('note')->nullable();

            $table->timestamps();

            $table->unique(['creator_id', 'rung', 'sequence'], 'membership_credits_rung_unique');
            $table->index(['creator_id', 'status'], 'membership_credits_creator_status_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_credits');
    }
};
