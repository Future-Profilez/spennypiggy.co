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
            $table->boolean('is_overdue')->default(false)->after('status');
            $table->integer('system_reminder_count')->default(0)->after('is_overdue');
            $table->timestamp('last_system_reminder_at')->nullable()->after('system_reminder_count');
            $table->boolean('needs_admin_review')->default(false)->after('last_system_reminder_at');
            $table->timestamp('admin_reminder_sent_at')->nullable()->after('needs_admin_review');
            $table->integer('admin_reminder_count')->default(0)->after('admin_reminder_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropColumn([
                'is_overdue',
                'system_reminder_count',
                'last_system_reminder_at',
                'needs_admin_review',
                'admin_reminder_sent_at',
                'admin_reminder_count',
            ]);
        });
    }
};
