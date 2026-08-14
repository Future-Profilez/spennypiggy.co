<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * users.show_piggy_bank governs whether a creator's earnings figures are public.
 *
 * The column shipped defaulting to 0 while the only surface honouring it was
 * MyGoal — the newer profile milestone bar and the right-rail row published the
 * figure regardless, so the stored value never described what visitors saw.
 * Honouring it as-is would therefore hide the figure on most creator profiles
 * overnight, which is a platform-wide change nobody asked for.
 *
 * Client decision (14 Aug 2026): backfill existing creators to visible and
 * default new ones to visible, so nothing visibly changes on deploy and a
 * creator opts OUT deliberately from account settings.
 *
 * Supporters (role 0) are untouched — they have no earnings and the column does
 * nothing for them.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('users', 'show_piggy_bank')) {
            return;
        }

        // 🚨 NOT `$table->tinyInteger(...)->change()`. `change()` routes through
        // Doctrine DBAL, which has no `tinyinteger` type registered, so it throws
        // *Unknown column type "tinyinteger" requested* — and because this runs
        // inside every `RefreshDatabase` boot it took the WHOLE test suite down,
        // not just this migration. Raw ALTER, MySQL-guarded, is the house pattern
        // (see 2026_07_13_000003) — sqlite has no MODIFY and needs no default
        // change for the tests to pass.
        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `users` MODIFY `show_piggy_bank` TINYINT(1) NOT NULL DEFAULT 1');
        }

        DB::table('users')
            ->where('role', 1)
            ->where(function ($q) {
                $q->where('show_piggy_bank', 0)->orWhereNull('show_piggy_bank');
            })
            ->update(['show_piggy_bank' => 1]);
    }

    /**
     * Only the default is reversed. The backfilled rows are left alone — a
     * creator who has since turned the toggle off must stay off, and this
     * migration cannot tell those rows apart from the ones it wrote.
     */
    public function down(): void
    {
        if (! Schema::hasColumn('users', 'show_piggy_bank')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement('ALTER TABLE `users` MODIFY `show_piggy_bank` TINYINT(1) NOT NULL DEFAULT 0');
        }
    }
};
