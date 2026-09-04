<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Admin flags — one row per "somebody should look at this account".
 *
 * 🚨 A FLAG BLOCKS NOTHING. Nothing reads this table to decide whether a payout
 * runs, a login succeeds or a purchase completes. It exists so that a thing the
 * platform already noticed reaches a person. Suspension stays a deliberate human
 * action on the user's own page.
 *
 * ⚠️ SHARED DATABASE, ONE MIGRATION. This ships in spennypiggy.co only — the two
 * apps share `spenny_piggy`, and adding the migration to both would try to create
 * one table twice. `App\Models\UserFlag` and `App\Support\UserFlagger` exist in
 * BOTH repositories and are kept in step by hand, the same arrangement as
 * `security_events`.
 *
 * ⚠️ NO FOREIGN KEYS, deliberately — same reasoning as `security_events` and
 * `marketing_suppressions`. "This account did something worth looking at" has to
 * survive the deletion of the account it is about; a cascading delete would erase
 * exactly the history somebody would go looking for afterwards. `user_role` is a
 * SNAPSHOT for the same reason: once the user row is gone, nothing else can say
 * whether the flag was about a creator or a gifter.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('user_flags')) {
            return;
        }

        Schema::create('user_flags', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('user_id');
            // Snapshot of users.role at raise time (1 = creator, 0 = gifter).
            // Nullable because a flag raised from a path with no loaded user
            // should still be recorded rather than dropped.
            $table->unsignedTinyInteger('user_role')->nullable();

            // Free string, not an enum column — either app must be able to record
            // a new kind without a migration the other has not run yet. The
            // labels live in config/user_flags.php.
            $table->string('flag_type', 60);
            $table->string('severity', 20)->default('warning');

            // open -> reviewed (looked at, no action needed) | actioned (a person
            // did something). Never deleted: the resolution IS the audit trail.
            $table->string('status', 20)->default('open');

            // Where it came from: security_event | risk | moderation | payment | manual.
            $table->string('source', 30)->default('security_event');

            /*
             * 🚨 ALREADY REDACTED ON THE WAY IN. This string is rendered in the
             * back office to admins who are NOT behind `can:view-pii`, so it
             * passes through SecurityRedactor before it is written — masked
             * email, Stripe id prefix plus last four, validated IP. Never write a
             * raw value here on the assumption the view will handle it.
             */
            $table->string('reason', 500)->nullable();
            $table->json('context')->nullable();

            // Repeats inside the dedupe window bump these rather than opening a
            // second row — twelve rows saying the same thing is how a list stops
            // being read.
            $table->unsignedInteger('occurrences')->default(1);
            $table->timestamp('first_seen_at')->nullable();
            $table->timestamp('last_seen_at')->nullable();

            // Set only for a hand-raised flag.
            $table->unsignedBigInteger('raised_by_admin_id')->nullable();

            $table->unsignedBigInteger('resolved_by_admin_id')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->string('resolution_note', 500)->nullable();

            $table->timestamps();

            // The list query: open flags for a user, and the back office's
            // "everything still open, worst first".
            $table->index(['user_id', 'status'], 'user_flags_user_status_idx');
            $table->index(['status', 'severity'], 'user_flags_status_severity_idx');
            // The dedupe lookup — (user, type, status) narrowed by last_seen_at.
            $table->index(['user_id', 'flag_type', 'status'], 'user_flags_dedupe_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_flags');
    }
};
