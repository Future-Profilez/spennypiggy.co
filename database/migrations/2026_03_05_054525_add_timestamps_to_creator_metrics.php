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
        Schema::table('creator_metrics', function (Blueprint $table) {
            // Check if created_at exists, if not add it.
            // Also check if updated_at exists (it was in previous migration but might be different type)
            // But we specifically need created_at.

            if (! Schema::hasColumn('creator_metrics', 'created_at')) {
                $table->timestamp('created_at')->useCurrent()->after('updated_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('creator_metrics', function (Blueprint $table) {
            $table->dropColumn('created_at');
        });
    }
};
