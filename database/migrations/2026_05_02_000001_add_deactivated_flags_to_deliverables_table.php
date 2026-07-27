<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->boolean('is_deactivated')->default(false)->after('status');
            $table->boolean('hidden_from_gifter')->default(false)->after('is_deactivated');
            $table->timestamp('deactivated_at')->nullable()->after('hidden_from_gifter');
            $table->string('deactivated_by', 50)->nullable()->after('deactivated_at');
            $table->text('deactivated_reason')->nullable()->after('deactivated_by');
        });
    }

    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropColumn([
                'is_deactivated',
                'hidden_from_gifter',
                'deactivated_at',
                'deactivated_by',
                'deactivated_reason',
            ]);
        });
    }
};
