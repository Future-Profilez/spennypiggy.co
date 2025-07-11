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
        Schema::table('connected_account_customers', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable()->change();
            $table->string('stripe_customer_id')->nullable()->change();
        });

        Schema::table('user_payments', function (Blueprint $table) {
            $table->unsignedBigInteger('from_user_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('connected_account_customers', function (Blueprint $table) {
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            $table->string('stripe_customer_id')->nullable(false)->change();
        });

        Schema::table('user_payments', function (Blueprint $table) {
            $table->unsignedBigInteger('from_user_id')->nullable(false)->change();
        });
    }
};
