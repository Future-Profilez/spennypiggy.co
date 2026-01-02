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
            // Change deliverable_type from ENUM to STRING to support new types like 'digital_task'
            $table->string('deliverable_type', 100)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('deliverables', function (Blueprint $table) {
            // Reverting back to ENUM is risky if data contains values not in the ENUM list.
            // We will leave it as string for safety in down(), or we could try to revert if we knew all values.
            // For now, let's keep it as string to avoid data loss on rollback.
            // $table->string('deliverable_type', 100)->change();
        });
    }
};
