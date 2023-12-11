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
            $table->string("session_id")->nullable()->after("stripe_id")->comment("Stripe Session Id");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_item_subscriptions', function (Blueprint $table) {
            $table->dropColumn("session_id");
        });
    }
};
