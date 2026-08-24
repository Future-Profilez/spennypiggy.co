<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Proof of marketing consent — UK direct-marketing compliance brief, 23 Aug 2026.
 *
 * `marketing_emails_enabled` already says whether we may send. It does NOT say
 * whether the person ever agreed, when, on which screen, or against which
 * wording — and under UK PECR/GDPR the burden is on us to demonstrate exactly
 * that. A boolean alone is not evidence of consent.
 *
 * 🚨 EXISTING ROWS ARE DELIBERATELY NOT BACKFILLED. `marketing_email_consent`
 * lands `false` for every existing account, which is the honest reading: those
 * users were never shown a consent checkbox, so there is no consent to record.
 * The client's brief (§8) forbids manufacturing a historic consent record.
 *
 * ⚠️ This does NOT silence mail to existing users. The send gate is still
 * `marketing_emails_enabled`, which those rows keep at `true` (client decision,
 * option B — the live population is small). This column records provenance; it
 * is not yet a second gate. Do not wire it into the send path without deciding
 * what happens to the accounts that predate it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Did this person affirmatively opt in? Default false: consent is
            // given, never assumed. Contrast `marketing_emails_enabled`, whose
            // default(true) is the very thing this column exists to correct.
            $table->boolean('marketing_email_consent')->default(false);

            // The three provenance fields. All nullable and all NULL when
            // consent was never given — "never said yes" and "said yes then
            // withdrew" must stay distinguishable, so withdrawal clears the
            // boolean and stamps marketing_unsubscribed_at, it does not wipe
            // these.
            $table->timestamp('marketing_consent_timestamp')->nullable();

            // Which screen it was given on: creator_signup, gifter_signup,
            // settings_page, preference_centre_link, checkout_opt_in.
            $table->string('marketing_consent_source', 50)->nullable();

            // Which wording they were shown — the key, not the prose. The prose
            // lives in config/marketing_consent.php so a superseded version is
            // still readable after the copy changes.
            $table->string('marketing_consent_version', 20)->nullable();

            // Filters the admin list runs: "consent = yes" and "consent = no".
            $table->index('marketing_email_consent', 'users_marketing_consent_idx');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_marketing_consent_idx');
            $table->dropColumn([
                'marketing_email_consent',
                'marketing_consent_timestamp',
                'marketing_consent_source',
                'marketing_consent_version',
            ]);
        });
    }
};
