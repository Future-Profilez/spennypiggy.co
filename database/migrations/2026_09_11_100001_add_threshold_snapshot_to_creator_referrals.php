<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * The creator referral keeps the numbers it was made under.
 *
 * 🚨 THE THRESHOLD MOVED FROM £1,000 TO £2,000 ON 11 Sep 2026, AND MOVING IT
 * ON A REFERRAL ALREADY IN FLIGHT IS THE TRAP THIS MIGRATION EXISTS TO AVOID.
 * Somebody who referred a creator under the old terms and is part-way to
 * qualifying must not silently have the goalposts moved — the retirement plan
 * names this explicitly (§Scheme 4: "treat it like D8 and write the decision
 * down").
 *
 * So the threshold and the reward are STAMPED ON THE ROW, and every existing
 * row is backfilled with the OLD figures. From here, `config/referral.php`
 * decides what a NEW referral is stamped with; nothing reads it to judge an
 * old one.
 *
 * ⚠️ Backfilled from `config('referral.legacy_qualifying_gmv')`, not from a
 * literal, so the recorded decision and the number it wrote are the same fact.
 *
 * ⚠️ Every column is guarded: a fresh database built by `migrate:fresh` may
 * already carry them from a later consolidated migration, and an unguarded
 * `ADD COLUMN` on an existing name is a hard error that takes the deploy down.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('creator_referrals')) {
            return;
        }

        Schema::table('creator_referrals', function (Blueprint $table) {
            if (! Schema::hasColumn('creator_referrals', 'qualifying_threshold')) {
                $table->decimal('qualifying_threshold', 12, 2)->nullable()->after('lifetime_gmv');
            }

            if (! Schema::hasColumn('creator_referrals', 'reward_amount')) {
                $table->decimal('reward_amount', 12, 2)->nullable()->after('qualifying_threshold');
            }

            /*
             * 🚨 A FRAUD BLOCK IS A REASON, NOT A DELETED ROW. A shared signup
             * IP or an account that is not genuinely new stops the AUTOMATIC
             * qualification and leaves the referral for a person to judge — a
             * household, an office and a mobile carrier's NAT all produce a
             * shared IP, so it is a signal and never proof.
             */
            if (! Schema::hasColumn('creator_referrals', 'blocked_reason')) {
                $table->string('blocked_reason', 40)->nullable()->after('status');
            }

            if (! Schema::hasColumn('creator_referrals', 'blocked_at')) {
                $table->timestamp('blocked_at')->nullable()->after('blocked_reason');
            }

            /*
             * When the referred creator first earned anything at all. It is
             * what separates "Signed up" from "Earning" on the referrer's own
             * status list, and it cannot be derived later — a refund can take
             * the running total back to zero.
             */
            if (! Schema::hasColumn('creator_referrals', 'first_earned_at')) {
                $table->timestamp('first_earned_at')->nullable()->after('qualified_at');
            }
        });

        /*
         * 🚨 THE BACKFILL IS THE RECORDED DECISION. Existing referrals are
         * honoured at the threshold in force when they were made.
         *
         * ⚠️ Only rows with no value, so a re-run cannot overwrite a threshold
         * an admin has since adjusted on a single referral.
         */
        DB::table('creator_referrals')
            ->whereNull('qualifying_threshold')
            ->update([
                'qualifying_threshold' => (float) config('referral.legacy_qualifying_gmv', 1000),
                'reward_amount' => (float) config('referral.reward_amount', 50),
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('creator_referrals')) {
            return;
        }

        Schema::table('creator_referrals', function (Blueprint $table) {
            foreach (['qualifying_threshold', 'reward_amount', 'blocked_reason', 'blocked_at', 'first_earned_at'] as $column) {
                if (Schema::hasColumn('creator_referrals', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
