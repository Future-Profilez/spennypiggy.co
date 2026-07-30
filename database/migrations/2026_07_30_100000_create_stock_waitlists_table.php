<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Tell me when it's back" for a sold-out shop item.
 *
 * A limited-stock listing that sells out goes dead: the card says "Sold out", the buy
 * button is disabled, and everyone who arrives after that simply leaves. The creator
 * never learns the demand existed, so they never restock.
 *
 * One row per (item, person) waiting. `notified_at` is both the state and the claim —
 * a row with it set is done and is never chased again.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('stock_waitlists')) {
            return;
        }

        Schema::create('stock_waitlists', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('shop_id')->index();
            $table->unsignedBigInteger('creator_id')->nullable()->index();

            // A guest has no account. Requiring one on a sold-out page would throw away
            // the demand this table exists to capture, so either column may be the identity.
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('email')->nullable();

            // Set the moment the restock notice is claimed. NULL = still waiting.
            $table->timestamp('notified_at')->nullable();
            // Stock at the moment we told them, kept for audit — the notice states a
            // number, and it needs to be answerable later.
            $table->unsignedInteger('notified_stock')->nullable();

            $table->timestamps();

            // One entry per person per item. Two uniques rather than one composite:
            // a logged-in buyer and a guest are identified by different columns, and
            // MySQL treats NULLs as distinct so neither blocks the other.
            $table->unique(['shop_id', 'user_id'], 'stock_waitlist_user_unique');
            $table->unique(['shop_id', 'email'], 'stock_waitlist_email_unique');

            // The sweep's query: everyone still waiting on a given item.
            $table->index(['shop_id', 'notified_at'], 'stock_waitlist_pending_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_waitlists');
    }
};
