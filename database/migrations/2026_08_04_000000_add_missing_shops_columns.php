<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `shops` was created with six columns and then grew ~17 more that no migration ever
 * declared. Every deployed database has them, so nothing failed in production — but a
 * database built from these migrations comes out with a `shops` table the application
 * cannot insert into, which is why the shop paths had no feature test: they could not
 * run. Same class of gap as `users.role`, `users.cover_approved` and the fourteen
 * missing `users` columns.
 *
 * Every statement is guarded, so this is a no-op on any real environment, and `down()`
 * is intentionally empty — a rollback must never drop live columns.
 *
 * `shops.status` is deliberately NOT added. Several call sites guard on
 * `Schema::hasColumn('shops', 'status')` precisely because it is absent here, and
 * creating it NULL for every row would make those filters start excluding listings.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('shops')) {
            return;
        }

        Schema::table('shops', function (Blueprint $table) {
            // Product shape. 'physical' is what gates the delivered-before-earned rule
            // in LedgerRules, so its absence broke the fulfilment gate outright.
            if (! Schema::hasColumn('shops', 'type')) {
                $table->string('type')->nullable()->index();
            }

            if (! Schema::hasColumn('shops', 'stripe_product_id')) {
                $table->string('stripe_product_id')->nullable();
            }
            if (! Schema::hasColumn('shops', 'price_id')) {
                $table->string('price_id')->nullable();
            }
            if (! Schema::hasColumn('shops', 'price')) {
                $table->decimal('price', 12, 2)->nullable();
            }
            if (! Schema::hasColumn('shops', 'currency')) {
                $table->string('currency', 10)->nullable();
            }
            if (! Schema::hasColumn('shops', 'special_member_price')) {
                $table->decimal('special_member_price', 12, 2)->nullable();
            }

            if (! Schema::hasColumn('shops', 'image')) {
                $table->string('image')->nullable();
            }

            // Legacy deliverable pair, still derived from the reward contract.
            if (! Schema::hasColumn('shops', 'success_page_type')) {
                $table->string('success_page_type')->nullable();
            }
            if (! Schema::hasColumn('shops', 'success_page_value')) {
                $table->text('success_page_value')->nullable();
            }
            if (! Schema::hasColumn('shops', 'reward_file_type')) {
                $table->string('reward_file_type')->nullable();
            }
            if (! Schema::hasColumn('shops', 'reward_file')) {
                $table->text('reward_file')->nullable();
            }

            if (! Schema::hasColumn('shops', 'ai_generated')) {
                $table->boolean('ai_generated')->default(0);
            }
            if (! Schema::hasColumn('shops', 'ask_question')) {
                $table->text('ask_question')->nullable();
            }

            // Remaining stock — the server decrements this per sale.
            if (! Schema::hasColumn('shops', 'slot_limitation')) {
                $table->integer('slot_limitation')->nullable();
            }
            if (! Schema::hasColumn('shops', 'quantity_allow')) {
                $table->boolean('quantity_allow')->default(0);
            }
            if (! Schema::hasColumn('shops', 'shipping_information')) {
                $table->text('shipping_information')->nullable();
            }
            if (! Schema::hasColumn('shops', 'vat_applicable')) {
                $table->boolean('vat_applicable')->default(0);
            }
        });
    }

    public function down(): void
    {
        // Intentionally empty: these columns hold live product data on every deployed
        // database, and this migration only ever declares what is already there.
    }
};
