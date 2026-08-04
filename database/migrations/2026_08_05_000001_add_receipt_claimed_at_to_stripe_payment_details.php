<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Claim column for the wish/cart purchase receipt.
 *
 * The redirect handler and the webhook race for every one-off payment. Card
 * payments always finished at the redirect, so the webhook's receipt dispatch
 * was commented out to stop duplicates — which left BANK payments (where the
 * redirect returns before the debit clears and bails) with no buyer receipt and
 * no creator email at all.
 *
 * Both paths now claim this column before dispatching, so whichever gets there
 * first sends and the other stands down. Atomic (`whereNull(...)->update(...)`),
 * so two workers cannot both win, and it works for guest buyers who have no
 * account to key a claim on.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('stripe_payment_details')) {
            return;
        }

        if (Schema::hasColumn('stripe_payment_details', 'receipt_claimed_at')) {
            return;
        }

        Schema::table('stripe_payment_details', function (Blueprint $table) {
            $table->timestamp('receipt_claimed_at')->nullable();
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('stripe_payment_details') && Schema::hasColumn('stripe_payment_details', 'receipt_claimed_at')) {
            Schema::table('stripe_payment_details', function (Blueprint $table) {
                $table->dropColumn('receipt_claimed_at');
            });
        }
    }
};
