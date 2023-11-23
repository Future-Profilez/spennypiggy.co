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
        Schema::table('stripe_payment_details', function (Blueprint $table) {
            $table->string('name')->nullable()->after('payment_status');
            $table->text('message')->nullable()->after('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_payment_details', function (Blueprint $table) {
            $table->dropColumn('name');
            $table->dropColumn('message');
        });
    }
};
