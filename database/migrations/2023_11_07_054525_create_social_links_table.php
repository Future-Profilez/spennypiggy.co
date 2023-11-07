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
        Schema::create('social_links', function (Blueprint $table) {
            $table->id();
            $table->uuid();
            $table->foreignId('user_id')->nullable();
            $table->string('whoyouinto')->nullable();
            $table->string('twitter')->nullable();
            $table->string('instagram')->nullable();
            $table->string('reddit')->nullable();
            $table->string('discord')->nullable();
            $table->string('onlyfans')->nullable();
            $table->string('loyalfans')->nullable();
            $table->string('fansly')->nullable();
            $table->string('manyvids')->nullable();
            $table->string('other')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('social_links');
    }
};
