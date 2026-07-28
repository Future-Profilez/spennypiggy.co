<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Keep the dispute's own Stripe identifiers so the payment link can never be lost.
 *
 * `disputes.payment_id` is set once, at webhook time. Stripe delivers dispute and
 * fraud events for a charge BEFORE `checkout.session.completed`, so the Payment row
 * frequently does not exist yet — the dispute is then stored with a NULL payment_id
 * and nothing ever back-fills it. Every dispute in the local database is in exactly
 * that state, which means the evidence pack for those disputes contains no purchase,
 * no delivery record and no timeline: the pack is empty for the disputes that matter.
 *
 * Storing the payment intent and charge id on the dispute itself lets the pack
 * resolve (and repair) the link at generation time, from data we already receive.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('disputes', function (Blueprint $table) {
            if (! Schema::hasColumn('disputes', 'stripe_payment_intent_id')) {
                $table->string('stripe_payment_intent_id')->nullable()->after('stripe_dispute_id');
                $table->index('stripe_payment_intent_id');
            }

            if (! Schema::hasColumn('disputes', 'stripe_charge_id')) {
                $table->string('stripe_charge_id')->nullable()->after('stripe_payment_intent_id');
                $table->index('stripe_charge_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('disputes', function (Blueprint $table) {
            if (Schema::hasColumn('disputes', 'stripe_payment_intent_id')) {
                $table->dropIndex(['stripe_payment_intent_id']);
                $table->dropColumn('stripe_payment_intent_id');
            }

            if (Schema::hasColumn('disputes', 'stripe_charge_id')) {
                $table->dropIndex(['stripe_charge_id']);
                $table->dropColumn('stripe_charge_id');
            }
        });
    }
};
