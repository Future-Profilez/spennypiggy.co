<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The opt-out that outlives the account — UK brief §6.
 *
 * 🚨 KEYED ON THE EMAIL ADDRESS, NOT ON A USER ID, AND THAT IS THE ENTIRE POINT.
 * A per-user flag dies with the row it sits on: delete the account, sign up
 * again with the same address, and the person is silently opted back in to the
 * mail they explicitly refused. Same hole for a guest, who has no user row to
 * carry a flag at all. An opt-out is a statement about an ADDRESS.
 *
 * ⚠️ NO FOREIGN KEY, deliberately — same reasoning as `security_events`. A
 * suppression must survive the deletion of the account it came from, which is
 * the only case where it does any work.
 *
 * ⚠️ `email` is unique and stored lower-cased by the model. `Naveen@x.com` and
 * `naveen@x.com` are one inbox; two rows would let one of them through.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_suppressions', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            /*
             * 🚨 NULLABLE ON PURPOSE, AND IT IS NOT ABOUT ALLOWING NULLS.
             *
             * A NOT NULL `timestamp` with no default is given
             * `DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` implicitly
             * by MySQL/MariaDB (the first such column in a table, when
             * explicit_defaults_for_timestamp is off) — verified on a scratch
             * database, not assumed. `ON UPDATE` would mean any later write to
             * this row silently rewrites WHEN the person opted out, which is
             * the one fact the row exists to record. Nullable columns get no
             * implicit clause. The value is always written explicitly by
             * App\Support\MarketingConsent.
             */
            $table->timestamp('suppressed_at')->nullable();
            // Where the opt-out came from: unsubscribe_link, settings_page,
            // preference_centre_link, admin, complaint, bounce.
            $table->string('source', 50)->nullable();
            // Kept for the audit trail only. The address is authoritative — this
            // is which account it was holding at the time, and it is nullable
            // because a guest never had one.
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_suppressions');
    }
};
