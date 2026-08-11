<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Two things the delivery log needed once admins could act on it:
 *
 * 1. `resent_at` / `resend_count` — the resend action left the original row at
 *    `failed` forever, so the Resend button reappeared on every reopen and each
 *    click mailed the recipient again. The stamp is what makes the action
 *    once-only and visible.
 *
 * 2. A `(status, created_at)` index — `notifications:delivery-alert` runs every
 *    five minutes asking "how many FAILED in the last 15 minutes". The existing
 *    `(channel, status)` index leads on `channel` so it cannot serve that, and
 *    the standalone `created_at` index forces a status filter over every row in
 *    the window. This table gains a row per message across both apps.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('notification_logs')) {
            return;
        }

        Schema::table('notification_logs', function (Blueprint $table) {
            if (! Schema::hasColumn('notification_logs', 'resent_at')) {
                $table->timestamp('resent_at')->nullable();
            }

            if (! Schema::hasColumn('notification_logs', 'resend_count')) {
                $table->unsignedSmallInteger('resend_count')->default(0);
            }
        });

        // Wrapped: re-running against a database that already has the index
        // must not be an error.
        try {
            Schema::table('notification_logs', function (Blueprint $table) {
                $table->index(['status', 'created_at'], 'notification_logs_status_created_idx');
            });
        } catch (Throwable $e) {
            // Index already present.
        }
    }

    public function down(): void
    {
        if (! Schema::hasTable('notification_logs')) {
            return;
        }

        try {
            Schema::table('notification_logs', function (Blueprint $table) {
                $table->dropIndex('notification_logs_status_created_idx');
            });
        } catch (Throwable $e) {
            // Not present.
        }

        Schema::table('notification_logs', function (Blueprint $table) {
            foreach (['resent_at', 'resend_count'] as $column) {
                if (Schema::hasColumn('notification_logs', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
