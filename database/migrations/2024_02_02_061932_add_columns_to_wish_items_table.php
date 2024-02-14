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
            $table->longText('edited_reason')->nullable()->after('delete_reason');
            $table->integer('edited_status')->nullable()->after('edited_reason')->comment('0 = edited request is in pending, 1 = edited , null = not get any request');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_items', function (Blueprint $table) {
            $table->dropColumn('edited_reason');
            $table->dropColumn('edited_status');
        });
    }
};
