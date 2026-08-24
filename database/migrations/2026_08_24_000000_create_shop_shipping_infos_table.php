<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 🚨 `shop_shipping_infos` EXISTED ONLY ON DEPLOYED DATABASES. No migration in
 * this repository declared it, so a database built from migrations came out
 * without it — and `Shop::shippingInfo()` is eager-loaded by shop discovery, so
 * every shop query threw "no such table" there. That is why the shop paths had
 * no feature test: they could not run. Same class of gap as `shops`,
 * `wish_items` and `user_documents`.
 *
 * ⚠️ GUARDED, and `down()` is a deliberate NO-OP: this migration did not create
 * the table on any environment that already has it, and must never drop one.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('shop_shipping_infos')) {
            return;
        }

        Schema::create('shop_shipping_infos', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid');
            $table->unsignedBigInteger('shop_id')->index();
            $table->string('country');
            $table->double('shipping_price', 10, 2);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        // Deliberately empty — see the docblock.
    }
};
