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
            $table->longText('edited_reason')->after('delete_reason')->nullable();
            $table->integer('edited_status')->after('edited_reason')->nullable()->comment('0 = edited request is in pending, 1 = edited , null = not get any request ');
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
