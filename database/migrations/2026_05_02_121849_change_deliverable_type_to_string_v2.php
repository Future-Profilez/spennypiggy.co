<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('deliverables')) {
            if (DB::getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type VARCHAR(100)");
            } else {
                Schema::table('deliverables', function (Blueprint $table) {
                    $table->string('deliverable_type', 100)->change();
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('deliverables')) {
            if (DB::getDriverName() === 'mysql') {
                // Revert to original enum if possible, or just keep as string
                DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type ENUM('digital_file','pdf_receipt','badge','cert','access','post','media_bundle','email','shipping','platform_access','content_file')");
            }
        }
    }
};
