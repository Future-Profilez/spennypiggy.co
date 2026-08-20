<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A dedicated switch for birthday email.
 *
 * Discovery Phase 4 shipped with the weekly "Birthdays This Week" campaign riding
 * `marketing_emails_enabled` and the per-creator reminder riding
 * `creator_updates_enabled`. Neither column MEANS "birthday emails", so someone who
 * wanted the birthday round-up to stop had to silence every promotion, or every piece
 * of news about every creator they support. This column is the one they actually want.
 *
 * 🚨 It is an ADDITIONAL gate, never a replacement — the birthday sends still honour
 * the parent category as well, so an existing opt-out is not quietly overturned by the
 * arrival of a new column. See `EmailService::sendCategoryEmail`/`sendMarketingEmail`.
 *
 * Default TRUE like every other preference column, and a missing/null value always
 * means opted IN (a just-created in-memory model does not carry the DB default, so
 * every read path uses `?? true`).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'birthday_emails_enabled')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('birthday_emails_enabled')->default(true);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'birthday_emails_enabled')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('birthday_emails_enabled');
        });
    }
};
