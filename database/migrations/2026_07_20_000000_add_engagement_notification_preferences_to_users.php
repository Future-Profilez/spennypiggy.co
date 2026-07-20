<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-channel consent for engagement (marketing-class) notifications.
 *
 * `users.marketing_emails_enabled` already gates marketing EMAIL. These add the
 * two missing switches so reactivation reminders, creator-content alerts and
 * milestone messages can be turned off per channel without touching
 * transactional mail (receipts, password resets), which never checks these.
 *
 * `date_of_birth` powers birthday messages — optional, and birthday
 * notifications simply don't fire for users who leave it empty.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'push_notifications_enabled')) {
                $table->boolean('push_notifications_enabled')->default(true)->after('marketing_unsubscribed_at');
            }

            if (! Schema::hasColumn('users', 'reactivation_emails_enabled')) {
                $table->boolean('reactivation_emails_enabled')->default(true)->after('push_notifications_enabled');
            }

            if (! Schema::hasColumn('users', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('reactivation_emails_enabled');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['push_notifications_enabled', 'reactivation_emails_enabled', 'date_of_birth'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
