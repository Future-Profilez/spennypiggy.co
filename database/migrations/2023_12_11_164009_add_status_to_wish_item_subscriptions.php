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
            $table->string('status', 50)->nullable()->default('initiated')->after('upcoming_payment')->comment('Stripe Subscription Message');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_item_subscriptions', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
