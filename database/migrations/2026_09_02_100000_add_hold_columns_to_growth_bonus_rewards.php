<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A Growth Bonus can be HELD on the day it was due to be sent.
 *
 * 🚨 A HOLD IS NOT A STATUS — IT IS A SEPARATE FACT, WHICH IS WHY IT IS ITS OWN
 * COLUMN. `status = approved` records that an ADMIN said yes; the hold records
 * that the PLATFORM is not sending it today. Collapsing the two would make
 * "approved" stop meaning "a person approved this", and an admin looking at a
 * held bonus could no longer tell whether their own decision still stood.
 *
 * 🚨 `payout_hold_reason` STORES A CODE, NEVER PROSE. The creator-facing
 * sentence is derived from it (`GrowthBonusService::holdMessage()`), the same
 * rule the moderation queue follows: a stored English string cannot be reworded,
 * translated or reasoned about, and it invites writing a cause nobody verified.
 *
 * ⚠️ `held_at` is when the hold STARTED, and it is not cleared and re-set on a
 * later run. A creator asking "how long has this been stuck" needs the first
 * date, not the most recent check.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('growth_bonus_rewards')) {
            return;
        }

        Schema::table('growth_bonus_rewards', function (Blueprint $table) {
            if (! Schema::hasColumn('growth_bonus_rewards', 'payout_hold_reason')) {
                $table->string('payout_hold_reason', 40)->nullable()->after('payout_failure_message');
            }

            if (! Schema::hasColumn('growth_bonus_rewards', 'held_at')) {
                $table->timestamp('held_at')->nullable()->after('payout_hold_reason');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('growth_bonus_rewards')) {
            return;
        }

        foreach (['payout_hold_reason', 'held_at'] as $column) {
            if (Schema::hasColumn('growth_bonus_rewards', $column)) {
                Schema::table('growth_bonus_rewards', fn (Blueprint $t) => $t->dropColumn($column));
            }
        }
    }
};
