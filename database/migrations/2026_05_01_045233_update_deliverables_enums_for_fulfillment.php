<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('deliverables')) {
            DB::table('deliverables')->whereNull('status')->update(['status' => 'pending']);
            DB::table('deliverables')->where('status', 'completed')->update(['status' => 'delivered']);

            // ENUM modification is MySQL-only; SQLite uses TEXT columns so no change needed there
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE deliverables MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'failed', 'refunded') DEFAULT 'pending'");
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE deliverables MODIFY COLUMN status ENUM('pending', 'delivered', 'failed', 'refunded') DEFAULT 'pending'");
            DB::statement('ALTER TABLE deliverables MODIFY COLUMN deliverable_type VARCHAR(100)');
        }
    }
};
