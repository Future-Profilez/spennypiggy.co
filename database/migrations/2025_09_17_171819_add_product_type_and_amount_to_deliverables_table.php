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
        Schema::table('deliverables', function (Blueprint $table) {
            $table->string('product_type')->nullable()->after('deliverable_type')->comment('Type of product: wish, bill, membership, etc.');
            $table->decimal('transaction_amount', 10, 2)->nullable()->after('product_type')->comment('Amount of the transaction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropColumn('product_type');
            $table->dropColumn('transaction_amount');
        });
    }
};
