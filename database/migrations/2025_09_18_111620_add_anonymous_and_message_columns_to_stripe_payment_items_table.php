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
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            if (!Schema::hasColumn('stripe_payment_items', 'anonymous')) {
                $table->boolean('anonymous')->default(false)->after('quantity');
            }
            if (!Schema::hasColumn('stripe_payment_items', 'message')) {
                $table->text('message')->nullable()->after('anonymous');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            $table->dropColumn(['anonymous', 'message']);
        });
    }
};
