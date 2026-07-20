<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Completes the communication-preference model.
 *
 * `marketing_emails_enabled` already covered promotional mail, and the
 * engagement columns covered push and reactivation reminders. These add the two
 * remaining categories the roadmap asks for, so a user can turn off promotions
 * without losing product announcements (or the reverse).
 *
 * Security, legal and transactional mail is deliberately NOT represented here —
 * it must always send, so there is no switch to turn off.
 */
return new class extends Migration
{
    private array $columns = [
        'product_updates_enabled',
        'creator_updates_enabled',
    ];

    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ($this->columns as $column) {
                if (! Schema::hasColumn('users', $column)) {
                    $table->boolean($column)->default(true);
                }
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach ($this->columns as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
