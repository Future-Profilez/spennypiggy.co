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
        if (Schema::hasTable('wish_item_subscriptions') && !Schema::hasColumn('wish_item_subscriptions', 'total_paid')) {
            Schema::table('wish_item_subscriptions', function (Blueprint $table) {
                $table->double('total_paid', 15, 2)->default(0.00)->after('amount');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('wish_item_subscriptions') && Schema::hasColumn('wish_item_subscriptions', 'total_paid')) {
            Schema::table('wish_item_subscriptions', function (Blueprint $table) {
                $table->dropColumn('total_paid');
            });
        }
    }
};
