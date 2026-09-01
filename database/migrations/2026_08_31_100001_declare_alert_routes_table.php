<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Declares `alert_routes` for THIS app's test database only.
 *
 * 🚨 The table is OWNED by admin.spennypiggy.co
 * (`2026_08_31_100000_create_alert_routes_table.php`) and the two apps share one
 * database, so this must never create it twice. It is guarded, and `down()` is
 * deliberately empty — dropping a table this app does not own would take the
 * back office's routing with it.
 *
 * Same cross-app pattern as `security_events` and `marketing_suppressions`.
 * Keep the columns identical to the owning migration.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('alert_routes')) {
            return;
        }

        Schema::create('alert_routes', function (Blueprint $table) {
            $table->id();
            $table->string('channel', 64);
            $table->string('environment', 32);
            $table->json('emails')->nullable();
            $table->json('roles')->nullable();
            $table->boolean('enabled')->default(true);
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->unique(['channel', 'environment'], 'alert_routes_channel_env_unique');
        });
    }

    public function down(): void
    {
        // Intentionally empty — this app does not own the table.
    }
};
