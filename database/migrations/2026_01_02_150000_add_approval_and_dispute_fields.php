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
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('is_approved')->default(false)->after('status');
        });

        Schema::table('task_purchases', function (Blueprint $table) {
            $table->integer('rejection_count')->default(0)->after('status');
            $table->string('refund_status')->nullable()->after('transfer_amount');
            $table->timestamp('refunded_at')->nullable()->after('refund_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('is_approved');
        });

        Schema::table('task_purchases', function (Blueprint $table) {
            $table->dropColumn(['rejection_count', 'refund_status', 'refunded_at']);
        });
    }
};
