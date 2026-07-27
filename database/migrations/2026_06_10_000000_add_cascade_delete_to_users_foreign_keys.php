<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // FK cascade rebuilding relies on MySQL information_schema and DDL semantics.
        // SQLite (used by the test suite) handles FKs differently and lacks
        // information_schema, so this migration is a no-op on non-MySQL drivers.
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        // ── 1. Fix existing FK constraints that are missing onDelete ──────────

        // creator_referrals: RESTRICT → CASCADE
        if (! $this->fkHasCascade('creator_referrals', 'creator_referrals_referrer_creator_id_foreign')) {
            Schema::table('creator_referrals', function (Blueprint $table) {
                $table->dropForeign(['referrer_creator_id']);
                $table->dropForeign(['referred_creator_id']);
            });
            Schema::table('creator_referrals', function (Blueprint $table) {
                $table->foreign('referrer_creator_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('referred_creator_id')->references('id')->on('users')->onDelete('cascade');
            });
        }

        // creator_referral_payouts: creator_id → CASCADE; approved_by_admin_id → SET NULL
        if (! $this->fkHasCascade('creator_referral_payouts', 'creator_referral_payouts_creator_id_foreign')) {
            Schema::table('creator_referral_payouts', function (Blueprint $table) {
                $table->dropForeign(['creator_id']);
                $table->dropForeign(['approved_by_admin_id']);
            });
            Schema::table('creator_referral_payouts', function (Blueprint $table) {
                $table->foreign('creator_id')->references('id')->on('users')->onDelete('cascade');
                $table->foreign('approved_by_admin_id')->references('id')->on('users')->onDelete('set null');
            });
        }

        // ── 2. Fix column types that don't match users.id (BIGINT UNSIGNED) ───

        // rye_product_payments.user_id is signed BIGINT — FK needs exact type match
        DB::statement('ALTER TABLE rye_product_payments MODIFY user_id BIGINT UNSIGNED NOT NULL');

        // ── 3. Creator content tables — CASCADE ───────────────────────────────

        $this->addUserFk('posts', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('memberships', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('shops', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('tip_goals', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('social_links', 'user_id', 'cascade', nullable: true);
        $this->addUserFk('wish_items', 'user_id', 'cascade', nullable: true);

        // ── 4. Fan relationship / session tables — CASCADE ───────────────────

        $this->addUserFk('subscriptions', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('subscriptions', 'owner_id', 'cascade', nullable: false);
        $this->addUserFk('user_carts', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('user_carts', 'owner_id', 'cascade', nullable: false);
        $this->addUserFk('wish_item_subscriptions', 'user_id', 'set null', nullable: true);
        $this->addUserFk('tip_goals_payments', 'user_id', 'cascade', nullable: false);

        // ── 5. Verification / identity tables — CASCADE ──────────────────────

        $this->addUserFk('gifter_card_verifications', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('user_verification_status', 'user_id', 'cascade', nullable: false);

        // ── 6. Payment tables — SET NULL (keep financial history) ─────────────

        $this->addUserFk('stripe_payment_details', 'user_id', 'set null', nullable: true);
        $this->addUserFk('stripe_payment_details', 'owner_id', 'set null', nullable: true);
        $this->addUserFk('shop_payments', 'user_id', 'set null', nullable: true);
        $this->addUserFk('bill_payments', 'user_id', 'set null', nullable: true);
        $this->addUserFk('membership_payments', 'user_id', 'set null', nullable: true);
        $this->addUserFk('rye_product_payments', 'user_id', 'cascade', nullable: false);

        // ── 7. Support / engagement tables ───────────────────────────────────

        $this->addUserFk('support_story_reactions', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('support_story_reactions', 'creator_id', 'cascade', nullable: false);
        $this->addUserFk('support_story_replies', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('support_story_replies', 'creator_id', 'cascade', nullable: false);
        $this->addUserFk('support_tickets', 'creator_id', 'cascade', nullable: false);
        $this->addUserFk('support_tickets', 'supporter_id', 'set null', nullable: true);
        $this->addUserFk('support_ticket_messages', 'sender_user_id', 'set null', nullable: true);
        $this->addUserFk('notifications', 'user_id', 'cascade', nullable: true);

        // ── 8. Post comments / likes (tables may predate migrations) ─────────

        $this->addUserFk('post_comments', 'user_id', 'cascade', nullable: false);
        $this->addUserFk('post_likes', 'user_id', 'cascade', nullable: false);
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        // Revert creator_referrals and creator_referral_payouts to plain FKs
        if ($this->fkHasCascade('creator_referrals', 'creator_referrals_referrer_creator_id_foreign')) {
            Schema::table('creator_referrals', function (Blueprint $table) {
                $table->dropForeign(['referrer_creator_id']);
                $table->dropForeign(['referred_creator_id']);
            });
            Schema::table('creator_referrals', function (Blueprint $table) {
                $table->foreign('referrer_creator_id')->references('id')->on('users');
                $table->foreign('referred_creator_id')->references('id')->on('users');
            });
        }

        if ($this->fkHasCascade('creator_referral_payouts', 'creator_referral_payouts_creator_id_foreign')) {
            Schema::table('creator_referral_payouts', function (Blueprint $table) {
                $table->dropForeign(['creator_id']);
                $table->dropForeign(['approved_by_admin_id']);
            });
            Schema::table('creator_referral_payouts', function (Blueprint $table) {
                $table->foreign('creator_id')->references('id')->on('users');
                $table->foreign('approved_by_admin_id')->references('id')->on('users');
            });
        }

        // Drop all newly-added FK constraints
        $added = [
            ['posts', 'user_id'],
            ['memberships', 'user_id'],
            ['shops', 'user_id'],
            ['tip_goals', 'user_id'],
            ['tip_goals_payments', 'user_id'],
            ['social_links', 'user_id'],
            ['wish_items', 'user_id'],
            ['subscriptions', 'user_id'],
            ['subscriptions', 'owner_id'],
            ['user_carts', 'user_id'],
            ['user_carts', 'owner_id'],
            ['wish_item_subscriptions', 'user_id'],
            ['gifter_card_verifications', 'user_id'],
            ['user_verification_status', 'user_id'],
            ['stripe_payment_details', 'user_id'],
            ['stripe_payment_details', 'owner_id'],
            ['shop_payments', 'user_id'],
            ['bill_payments', 'user_id'],
            ['membership_payments', 'user_id'],
            ['rye_product_payments', 'user_id'],
            ['support_story_reactions', 'user_id'],
            ['support_story_reactions', 'creator_id'],
            ['support_story_replies', 'user_id'],
            ['support_story_replies', 'creator_id'],
            ['support_tickets', 'creator_id'],
            ['support_tickets', 'supporter_id'],
            ['support_ticket_messages', 'sender_user_id'],
            ['notifications', 'user_id'],
            ['post_comments', 'user_id'],
            ['post_likes', 'user_id'],
        ];

        foreach ($added as [$tbl, $col]) {
            $fkName = "{$tbl}_{$col}_foreign";
            if (Schema::hasTable($tbl) && $this->hasForeignKey($tbl, $fkName)) {
                Schema::table($tbl, function (Blueprint $table) use ($col) {
                    $table->dropForeign([$col]);
                });
            }
        }
    }

    /**
     * Clean orphans then add a FK to users.id — skips if the table is missing
     * or the constraint already exists (safe to re-run after a partial failure).
     */
    private function addUserFk(string $tbl, string $col, string $onDelete, bool $nullable): void
    {
        if (! Schema::hasTable($tbl) || $this->hasForeignKey($tbl, "{$tbl}_{$col}_foreign")) {
            return;
        }

        if ($nullable) {
            DB::statement("UPDATE `$tbl` SET `$col` = NULL WHERE `$col` IS NOT NULL AND `$col` NOT IN (SELECT id FROM users)");
        } else {
            DB::statement("DELETE FROM `$tbl` WHERE `$col` NOT IN (SELECT id FROM users)");
        }

        Schema::table($tbl, function (Blueprint $table) use ($col, $onDelete) {
            $table->foreign($col)->references('id')->on('users')->onDelete($onDelete);
        });
    }

    private function hasForeignKey(string $table, string $fkName): bool
    {
        $fks = DB::select("
            SELECT CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND CONSTRAINT_TYPE = 'FOREIGN KEY'
              AND CONSTRAINT_NAME = ?
        ", [$table, $fkName]);

        return count($fks) > 0;
    }

    private function fkHasCascade(string $table, string $fkName): bool
    {
        $rules = DB::select('
            SELECT DELETE_RULE
            FROM information_schema.REFERENTIAL_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = ?
              AND CONSTRAINT_NAME = ?
        ', [$table, $fkName]);

        return count($rules) > 0 && in_array($rules[0]->DELETE_RULE, ['CASCADE', 'SET NULL']);
    }
};
