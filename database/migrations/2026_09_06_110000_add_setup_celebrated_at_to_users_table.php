<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When the creator was shown "your setup is done" — once, and never again.
 *
 * 🚨 THIS IS A DATABASE COLUMN AND NOT localStorage, DELIBERATELY. The celebration
 * fires on the single most emotional moment of onboarding and it must fire EXACTLY
 * once: browser storage is per-device (a creator who finishes the ID check on their
 * phone and opens the laptop gets it twice), and reading it can THROW outright when
 * the browser refuses site data — the documented `safeStorage` fault that once blanked
 * the whole SPA. An account-level fact belongs on the account.
 *
 * ⚠️ WRITE-ONCE, exactly like `journey_completed_at` beside it. A creator who finishes
 * setup, sees the popup and then regresses — deletes their only listing, has their
 * profile demoted back to review — has still been told, and telling them again reads as
 * the platform having forgotten. Nothing clears this column.
 *
 * ⚠️ Cast on the model in BOTH apps (the two share one database); in `$fillable` in
 * NEITHER. It is a record of something the platform did, not a field anybody submits,
 * and a mass-assignable copy is a route by which a posted form silences the one
 * celebration a creator ever gets.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'setup_celebrated_at')) {
                $table->timestamp('setup_celebrated_at')->nullable()->after('journey_completed_at');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'setup_celebrated_at')) {
                $table->dropColumn('setup_celebrated_at');
            }
        });
    }
};
