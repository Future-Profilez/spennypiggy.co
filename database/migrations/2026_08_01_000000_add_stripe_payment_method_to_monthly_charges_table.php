<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The saved card, held from checkout until the creator's first sale.
 *
 * Under setup-mode checkout there is no Stripe subscription yet — that is the
 * whole point — so `stripe_id` is null and this column is the only thing linking
 * the row to a chargeable card. `SubscriptionActivationService` reads it when it
 * creates the subscription.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('monthly_charges') || Schema::hasColumn('monthly_charges', 'stripe_payment_method')) {
            return;
        }

        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->string('stripe_payment_method')->nullable()->after('stripe_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('monthly_charges') || ! Schema::hasColumn('monthly_charges', 'stripe_payment_method')) {
            return;
        }

        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->dropColumn('stripe_payment_method');
        });
    }
};
