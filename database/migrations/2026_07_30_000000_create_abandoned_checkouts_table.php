<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Abandoned checkout tracking.
 *
 * A supporter who opens Stripe Checkout and never completes it leaves a stale row in
 * whichever module payment table the flow uses (shop_payments, piggy_pot_contributions,
 * ...) and a risk-ledger Payment stuck at 'initiated'. Nothing ever followed up.
 *
 * This table is written once per checkout session, by ONE service, so the six payment
 * tables stay untouched and the recovery funnel (abandoned -> reminded -> recovered)
 * is measurable in a single place.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('abandoned_checkouts')) {
            return;
        }

        Schema::create('abandoned_checkouts', function (Blueprint $table) {
            $table->id();

            // The Stripe Checkout session. Unique so a re-run/retry can never double-record.
            $table->string('session_id')->unique();

            // The live Stripe-hosted payment page. Valid until expires_at, then dead.
            $table->text('checkout_url')->nullable();
            $table->timestamp('expires_at')->nullable();

            // What was being bought. item_id is a string because some modules key on a
            // numeric id and others on a uuid.
            $table->string('product_type', 40);
            $table->string('item_id', 64)->nullable();

            // Who was buying, and from whom.
            $table->unsignedBigInteger('creator_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('guest_email')->nullable();

            // What it was worth, as charged (minor units of `currency`).
            $table->unsignedBigInteger('amount_minor')->default(0);
            $table->string('currency', 10)->default('gbp');
            $table->string('fee_profile', 10)->nullable();

            // Recovery funnel.
            $table->unsignedTinyInteger('reminder_count')->default(0);
            $table->timestamp('last_reminded_at')->nullable();
            $table->timestamp('recovered_at')->nullable();

            // Terminal state: 'paid' | 'expired' | 'unrecoverable'. NULL = still open.
            $table->timestamp('closed_at')->nullable();
            $table->string('closed_reason', 40)->nullable();

            $table->timestamps();

            // The command's candidate query: still open, not yet fully reminded, oldest first.
            $table->index(['closed_at', 'recovered_at', 'reminder_count'], 'abandoned_open_idx');
            $table->index('creator_id');
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('abandoned_checkouts');
    }
};
