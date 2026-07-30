<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-category consent for "you didn't finish your purchase" reminders.
 *
 * Default TRUE like every other preference column. A missing/null value always means
 * opted IN (see EmailPreferenceController) — a just-created in-memory model does not
 * carry the DB default, so every read path uses `?? true`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'abandoned_checkout_emails_enabled')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('abandoned_checkout_emails_enabled')->default(true);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'abandoned_checkout_emails_enabled')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('abandoned_checkout_emails_enabled');
        });
    }
};
