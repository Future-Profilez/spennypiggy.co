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
            $table->boolean('is_deliverable')->default(true)->after('status')
                  ->comment('Whether this item should be marked as deliverable in admin interface');
            $table->index('is_deliverable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            $table->dropIndex(['is_deliverable']);
            $table->dropColumn('is_deliverable');
        });
    }
};
