<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Records the moment a creator's first sale ended their free period.
 *
 * This column IS the idempotency claim, not just an audit field:
 * SubscriptionActivationService claims it with `whereNull(...)->update(...)`
 * BEFORE it calls Stripe, so two sales landing in the same second — or the
 * hourly sweep racing a webhook — cannot both end the trial and bill the
 * creator twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('monthly_charges')) {
            return;
        }

        if (Schema::hasColumn('monthly_charges', 'first_sale_activated_at')) {
            return;
        }

        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->timestamp('first_sale_activated_at')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('monthly_charges')) {
            return;
        }

        if (! Schema::hasColumn('monthly_charges', 'first_sale_activated_at')) {
            return;
        }

        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->dropColumn('first_sale_activated_at');
        });
    }
};
