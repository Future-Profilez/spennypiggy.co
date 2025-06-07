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
        Schema::table('creator_shipping_addresses', function (Blueprint $table) {
            $table->string('phone')->change()->nullable();
            $table->string('postal_code')->change()->nullable();
            $table->string('province_code')->change()->nullable();
            $table->string('country_code')->change()->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('creator_shipping_addresses', function (Blueprint $table) {
            //
        });
    }
};
