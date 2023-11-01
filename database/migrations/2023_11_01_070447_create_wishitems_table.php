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
        Schema::create('wishitems', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->string('wishname');
            $table->double('price', 10, 2)->default(0.00);
            $table->string('item_url')->nullable();
            $table->string('thumbnail')->nullable();
            $table->tinyInteger('subcription')->comment("0-single, 1-subs, 2-crowdfund"); // single, subcription, crowdfund
            $table->string('subcription_period')->nullable(); 
            $table->tinyInteger('repeat_purchase')->default(0); 
            $table->longText('category')->nullable(); 
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('wishitems');
    }
};
