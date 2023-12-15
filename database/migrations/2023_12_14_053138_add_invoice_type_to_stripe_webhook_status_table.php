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
        Schema::table('stripe_webhook_status', function (Blueprint $table) {
            $table->foreignId('subscription_id')->nullable()->after('id');
            $table->string('invoice_type')->nullable()->after('subscription_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_webhook_status', function (Blueprint $table) {
            //
        });
    }
};
