<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Stop assuming consent for accounts created from here on.
 *
 * `marketing_emails_enabled` was created `default(true)`, so every account the
 * platform has ever made was marked "yes, mail me" by the database rather than
 * by the person. That is implied consent, which UK PECR does not accept, and it
 * is the specific thing §1 and §8 of the client's 23 Aug brief rule out.
 *
 * 🚨 THIS CHANGES THE DEFAULT ONLY. `ALTER … SET DEFAULT` rewrites the column
 * definition and does not touch a single existing row — which is exactly the
 * intent. The existing population keeps `true` (client decision: the live
 * population is small and the marketing list would otherwise go to zero). Never
 * add an UPDATE here; flipping existing rows is a business decision that was
 * taken the other way, and it is not reversible from the audit trail.
 *
 * ⚠️ THE DEFAULT IS DEFENCE IN DEPTH, NOT THE MECHANISM. Registration writes the
 * column explicitly from the signup checkbox
 * (RegisteredUserController::store), so consent does not depend on a DB default
 * that a driver may ignore — which matters, because the line below is a no-op
 * on SQLite and the test suite runs on SQLite.
 */
return new class extends Migration
{
    public function up(): void
    {
        $this->setDefault(0);
    }

    public function down(): void
    {
        $this->setDefault(1);
    }

    /**
     * ⚠️ Raw ALTER rather than `$table->boolean(...)->default(...)->change()`.
     *
     * A dbal `change()` restates the WHOLE column definition from what dbal
     * infers, and on SQLite it rebuilds the table by copying it — on a `users`
     * table this wide that is a needless risk for a one-word change. The raw
     * form touches the default and nothing else.
     */
    private function setDefault(int $value): void
    {
        if (! Schema::hasColumn('users', 'marketing_emails_enabled')) {
            return;
        }

        // SQLite cannot alter a column default in place, and the test suite
        // runs there. Skipped rather than emulated: registration writes the
        // value explicitly, so nothing depends on the default being right.
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }

        DB::statement("ALTER TABLE `users` ALTER COLUMN `marketing_emails_enabled` SET DEFAULT {$value}");
    }
};
