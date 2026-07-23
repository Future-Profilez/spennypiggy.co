<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bills + Memberships are the only recurring products on the platform, but their
 * payment rows never stored the Stripe subscription state locally. Every access
 * check therefore had to call Stripe (slow, and it fails closed), and the creator
 * dashboards filtered on `cancel_at_period_end` / `subscription_status` columns
 * that did not exist — so cancelled supporters were still counted as active.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('membership_payments')) {
            Schema::table('membership_payments', function (Blueprint $table) {
                if (! Schema::hasColumn('membership_payments', 'current_period_start')) {
                    $table->timestamp('current_period_start')->nullable();
                }
                if (! Schema::hasColumn('membership_payments', 'current_period_end')) {
                    $table->timestamp('current_period_end')->nullable();
                }
                if (! Schema::hasColumn('membership_payments', 'stripe_status')) {
                    $table->string('stripe_status', 50)->nullable();
                }
            });
        }

        foreach (['bill_payments', 'membership_payments'] as $tableName) {
            if (! Schema::hasTable($tableName) || Schema::hasColumn($tableName, 'cancel_at_period_end')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->boolean('cancel_at_period_end')->default(false);
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('membership_payments')) {
            Schema::table('membership_payments', function (Blueprint $table) {
                $table->dropColumn(['current_period_start', 'current_period_end', 'stripe_status']);
            });
        }

        foreach (['bill_payments', 'membership_payments'] as $tableName) {
            if (! Schema::hasTable($tableName) || ! Schema::hasColumn($tableName, 'cancel_at_period_end')) {
                continue;
            }

            Schema::table($tableName, function (Blueprint $table) {
                $table->dropColumn('cancel_at_period_end');
            });
        }
    }
};
