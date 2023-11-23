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
        Schema::table('wish_items', function (Blueprint $table) {
            $table->bigInteger('fullfill_amount')->after('category')->default(0);
            $table->bigInteger('tax_amount')->after('fullfill_amount')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_items', function (Blueprint $table) {
            $table->dropColumn('fullfill_amount');
            $table->dropColumn('tax_amount');
        });
    }
};
