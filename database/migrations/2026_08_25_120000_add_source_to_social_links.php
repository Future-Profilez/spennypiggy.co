<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Where a social handle came from.
 *
 * ⚠️ PROVENANCE ONLY — it changes no behaviour anywhere. `signup` means the creator typed
 * the handle on the registration form, answering their social onboarding step early;
 * NULL means they submitted it from Creator Studio. Both land at `status = 0` and are
 * reviewed identically.
 *
 * It exists because the two are worth telling apart when JUDGING a handle: one platform
 * entered in seconds, before the creator had seen the product, is likelier to be a typo
 * or a pasted URL than a deliberate Creator Studio submission. Surfaced on the admin
 * handles screen as a "From signup" badge.
 *
 * 🚨 DO NOT MAKE THIS COLUMN GATE ANYTHING. An earlier version of this feature used it to
 * hide signup handles from the review queue; that was reversed on the client's
 * instruction, because a handle nobody reviews can never be approved — and an unapproved
 * handle leaves the creator's own "Submit for review" locked
 * (`Profile/CreatorVerification.jsx`), which is the opposite of finishing a step early.
 *
 * ⚠️ Guarded, and `down()` drops only what it added — the shared database is written by
 * both apps and this table predates every migration in either repo.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('social_links') || Schema::hasColumn('social_links', 'source')) {
            return;
        }

        Schema::table('social_links', function (Blueprint $table) {
            // NULL = submitted from Creator Studio, i.e. every row that already exists.
            // Never backfilled: nothing knows how those handles were entered, and a
            // guess recorded as a fact is worse than an honest blank.
            $table->string('source', 20)->nullable()->after('whoyouinto');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('social_links') || ! Schema::hasColumn('social_links', 'source')) {
            return;
        }

        Schema::table('social_links', function (Blueprint $table) {
            $table->dropColumn('source');
        });
    }
};
