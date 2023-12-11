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
        Schema::table('wish_item_subscriptions', function (Blueprint $table) {
            $table->longText('surprise_message')->nullable()->after('recurring_type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_item_subscriptions', function (Blueprint $table) {
            $table->dropColumn('surprise_message');
        });
    }
};
