<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Links each referral row to the specific payout batch it was requested under.
 *
 * Without this, approving ONE payout marked EVERY PAYOUT_REQUESTED referral for that creator
 * as PAID — including referrals from a later, still-unpaid batch — because nothing tied a
 * referral to its payout. This column scopes the approve/reject update to the exact batch.
 *
 * Added in the website app only (it owns referral-request creation); the admin app shares the
 * same DB and only needs the column in its CreatorReferral $fillable.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('creator_referrals', 'payout_id')) {
            Schema::table('creator_referrals', function (Blueprint $table) {
                $table->unsignedBigInteger('payout_id')->nullable()->after('referrer_creator_id')->index();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('creator_referrals', 'payout_id')) {
            Schema::table('creator_referrals', function (Blueprint $table) {
                $table->dropColumn('payout_id');
            });
        }
    }
};
