<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Save-for-later: a supporter's wishlist of items they intend to buy.
 * Distinct from Follow (social) — this is "remind me to purchase this".
 * product_type/item_id mirror the Deliverable polymorphic shape.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saved_items', function (Blueprint $t) {
            $t->id();
            $t->unsignedBigInteger('user_id');
            $t->string('product_type'); // wish | shop | membership | bill | piggypot | task
            $t->unsignedBigInteger('item_id');
            $t->timestamps();

            $t->unique(['user_id', 'product_type', 'item_id']);
            $t->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saved_items');
    }
};
