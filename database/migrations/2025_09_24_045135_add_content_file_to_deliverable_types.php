<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        if (config('database.default') === 'sqlite') {
            return;
        }

        // Add 'content_file' to the deliverable_type enum
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type ENUM('digital_file','pdf_receipt','badge','cert','access','post','media_bundle','email','content_file') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        // Remove 'content_file' from the deliverable_type enum
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type ENUM('digital_file','pdf_receipt','badge','cert','access','post','media_bundle','email') NOT NULL");
    }
};
