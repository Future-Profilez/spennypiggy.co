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
        Schema::create('tip_goals', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->string('name');
            $table->string('product_id');
            $table->foreignId('user_id');
            $table->string('price_id');
            $table->double('target');
            $table->double('default_price')->nullable();
            $table->double('tax_amount')->nullable();
            $table->string('currency')->default('GBP');
            $table->double('fullfilled')->default(0.00);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tip_goals');
    }
};
