<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A suspension the creator can be TOLD about.
 *
 * `suspended_account` has existed since Dec 2023 and carried one bit: locked out,
 * no reason, no date, no author. The admin app has always collected a
 * `suspend_reason` — it went into the e-mail and the audit trail and was then
 * thrown away, so nothing on the creator's own screen could ever name it.
 *
 * 🚨 `suspension_reason_code` IS A CODE, NOT PROSE. The creator-facing sentence
 * lives in `config/suspension.php`; the admin's free-text sits in
 * `suspension_note` and is NEVER rendered to the user — admin prose written for
 * an internal case file is not copy we can stand behind on the account holder's
 * own dashboard.
 *
 * `suspension_enforced_at` is the marker the website's `suspension:enforce`
 * sweep claims. The flag is written by the ADMIN app, which has no queue worker
 * and must not make Stripe calls inside an admin request — same split as
 * `payout_paused_at` / `NotifyPayoutHolds`. Null with the flag set means
 * "consequences not applied yet"; the sweep is what makes it true.
 */
return new class extends Migration
{
    /** column => closure adding it */
    private function columns(): array
    {
        return [
            'suspension_reason_code' => fn (Blueprint $t) => $t->string('suspension_reason_code', 60)->nullable()->after('suspended_account'),
            'suspension_note' => fn (Blueprint $t) => $t->text('suspension_note')->nullable()->after('suspension_reason_code'),
            'suspended_at' => fn (Blueprint $t) => $t->timestamp('suspended_at')->nullable()->after('suspension_note'),
            'suspended_by_admin_id' => fn (Blueprint $t) => $t->unsignedBigInteger('suspended_by_admin_id')->nullable()->after('suspended_at'),
            // Indexed: the sweep's whole query is "flag set, marker null" and the
            // reverse. Without it that is a full users scan every five minutes.
            'suspension_enforced_at' => fn (Blueprint $t) => $t->timestamp('suspension_enforced_at')->nullable()->index()->after('suspended_by_admin_id'),
        ];
    }

    public function up(): void
    {
        $missing = array_filter(
            $this->columns(),
            fn ($_, $name) => ! Schema::hasColumn('users', $name),
            ARRAY_FILTER_USE_BOTH
        );

        if (empty($missing)) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($missing) {
            foreach ($missing as $add) {
                $add($table);
            }
        });
    }

    public function down(): void
    {
        $present = array_keys(array_filter(
            $this->columns(),
            fn ($_, $name) => Schema::hasColumn('users', $name),
            ARRAY_FILTER_USE_BOTH
        ));

        if (empty($present)) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($present) {
            $table->dropColumn($present);
        });
    }
};
