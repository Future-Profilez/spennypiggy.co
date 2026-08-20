<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 4 — Birthday Discovery.
 *
 * 🚨 THE BIRTH YEAR IS NEVER DISPLAYED PUBLICLY ANYWHERE. The plan repeats that
 * prohibition three times, so it is enforced by the SHAPE OF THE DATA rather
 * than by every reader remembering: `birthday_day` and `birthday_month` are the
 * only columns any public or e-mail surface selects, and neither of them can
 * carry a year. `users.date_of_birth` (which already existed, powers the Stripe
 * Connect dob prefill and `milestones:notify`) stays exactly where it is and is
 * never read by this feature.
 *
 * That is also why these are real columns rather than a `whereMonth`/`whereDay`
 * pair over `date_of_birth`: those two conditions cannot use an index, so the
 * daily reminder sweep and the Monday campaign would both table-scan `users`,
 * and — more importantly — every query would have `date_of_birth` in scope for
 * somebody to select "just this once".
 *
 * `birthday_discovery_opt_in` is the creator's own switch, default FALSE. A
 * birthday already on file is NOT consent to publish it: the plan asks for an
 * explicit opt-in, and back-filling it as true would put creators into a
 * campaign they never joined.
 */
return new class extends Migration
{
    private const INDEX = 'users_birthday_discovery_index';

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'birthday_discovery_opt_in')) {
                $table->boolean('birthday_discovery_opt_in')->default(false);
            }

            // Unsigned tinyints: 1–31 and 1–12. Nullable, because most users
            // have no birthday on file and "no birthday" is not day 0.
            if (! Schema::hasColumn('users', 'birthday_day')) {
                $table->unsignedTinyInteger('birthday_day')->nullable();
            }

            if (! Schema::hasColumn('users', 'birthday_month')) {
                $table->unsignedTinyInteger('birthday_month')->nullable();
            }
        });

        // Separate call: the columns must exist before they can be indexed, and
        // a re-run of a partially-applied migration must not try to add the
        // index twice.
        if (! $this->hasIndex(self::INDEX)) {
            Schema::table('users', function (Blueprint $table) {
                $table->index(
                    ['birthday_month', 'birthday_day', 'birthday_discovery_opt_in'],
                    self::INDEX
                );
            });
        }

        /*
         * Backfill day/month from the birthday already on file.
         *
         * ⚠️ This copies only the two components that are safe to publish, and
         * it does NOT set the opt-in — see the class note. A creator with a
         * birthday on file still has to say yes before they appear anywhere.
         *
         * Guarded to MySQL: the expression form differs on sqlite, which is what
         * the test database runs on, and there is nothing to backfill there.
         */
        if (DB::getDriverName() === 'mysql') {
            DB::statement('
                UPDATE users
                   SET birthday_day = DAY(date_of_birth),
                       birthday_month = MONTH(date_of_birth)
                 WHERE date_of_birth IS NOT NULL
                   AND (birthday_day IS NULL OR birthday_month IS NULL)
            ');
        }
    }

    public function down(): void
    {
        if ($this->hasIndex(self::INDEX)) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropIndex(self::INDEX);
            });
        }

        Schema::table('users', function (Blueprint $table) {
            foreach (['birthday_discovery_opt_in', 'birthday_day', 'birthday_month'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }

    /**
     * ⚠️ `Schema::hasIndex()` LANDED IN LARAVEL 11 AND THIS APP IS ON 10, so the
     * check is done by hand. `SHOW INDEX` is MySQL-only; on the sqlite test
     * database the index is simply created once by a fresh migrate and there is
     * no partially-applied state to defend against, so reporting "absent" is
     * both true and safe.
     *
     * Wrapped, because a migration that cannot ANSWER this question must not be
     * the thing that fails a deploy.
     */
    private function hasIndex(string $name): bool
    {
        if (DB::getDriverName() !== 'mysql') {
            return false;
        }

        try {
            return ! empty(DB::select('SHOW INDEX FROM `users` WHERE Key_name = ?', [$name]));
        } catch (Throwable $e) {
            return false;
        }
    }
};
