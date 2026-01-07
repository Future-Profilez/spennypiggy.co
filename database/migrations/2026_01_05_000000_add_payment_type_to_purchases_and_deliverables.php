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
        Schema::table('task_purchases', function (Blueprint $table) {
            // payment_type: 'PAID_TASK', 'STANDARD'
            // PAID_TASK: Funds routed after completion/review
            // STANDARD: Immediate or standard routing
            if (!Schema::hasColumn('task_purchases', 'payment_type')) {
                $table->string('payment_type')->default('STANDARD')->after('status');
            }
        });

        Schema::table('deliverables', function (Blueprint $table) {
            if (!Schema::hasColumn('deliverables', 'payment_type')) {
                $table->string('payment_type')->default('STANDARD')->after('payment_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('task_purchases', function (Blueprint $table) {
            if (Schema::hasColumn('task_purchases', 'payment_type')) {
                $table->dropColumn('payment_type');
            }
        });

        Schema::table('deliverables', function (Blueprint $table) {
            if (Schema::hasColumn('deliverables', 'payment_type')) {
                $table->dropColumn('payment_type');
            }
        });
    }
};
