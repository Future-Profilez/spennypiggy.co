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
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('ISO', 10)->comment("ISO Code");
            $table->string('conversion_rate', 20)->nullable()->comment("Base is GBP");
            $table->string('name', 100);
            $table->string('demonym', 100)->nullable();
            $table->string('majorSingle', 100)->nullable();
            $table->string('majorPlural', 100)->nullable();
            $table->integer('ISOnum')->nullable();
            $table->string('symbol', 10)->nullable();
            $table->string('symbolNative', 10)->nullable();
            $table->string('minorSingle', 100)->nullable();
            $table->string('minorPlural', 100)->nullable();
            $table->integer('ISOdigits')->nullable()->default(2);
            $table->integer('numToBasic')->nullable()->default(100);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('currencies');
    }
};
