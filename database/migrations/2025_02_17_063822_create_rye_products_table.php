<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rye_products', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->bigInteger('creator_id');
            $table->string('product_id');
            $table->longText('details')->comment("all the product details in json");
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rye_products');
    }
};
