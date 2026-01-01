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
            $table->unsignedBigInteger('order_id')->nullable()->index()->after('id'); // Links to task_purchases or other order tables
            $table->integer('sla_hours')->default(0)->after('status');
            $table->timestamp('due_at')->nullable()->after('sla_hours');
            $table->boolean('refund_eligible')->default(false)->after('due_at');
        });

        Schema::table('task_purchases', function (Blueprint $table) {
            $table->enum('dispute_status', ['none', 'open', 'won', 'lost'])->default('none')->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropColumn(['order_id', 'sla_hours', 'due_at', 'refund_eligible']);
        });

        Schema::table('task_purchases', function (Blueprint $table) {
            $table->dropColumn('dispute_status');
        });
    }
};
