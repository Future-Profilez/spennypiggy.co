<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Consent for "back in stock" notices.
 *
 * Default TRUE like every other preference column, and a missing/null value always
 * means opted IN (a just-created in-memory model does not carry the DB default, so
 * every read path uses `?? true`).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'restock_emails_enabled')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('restock_emails_enabled')->default(true);
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'restock_emails_enabled')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('restock_emails_enabled');
        });
    }
};
