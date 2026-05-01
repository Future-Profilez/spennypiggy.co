<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN status ENUM('pending', 'processing', 'shipped', 'delivered', 'failed') DEFAULT 'pending'");
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type ENUM('digital_file', 'pdf_receipt', 'badge', 'cert', 'access', 'post', 'media_bundle', 'email', 'shipping', 'platform_access', 'content_file')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN status ENUM('pending', 'delivered', 'failed') DEFAULT 'pending'");
        DB::statement("ALTER TABLE deliverables MODIFY COLUMN deliverable_type VARCHAR(100)");
    }
};
