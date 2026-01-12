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
        Schema::table('wish_items', function (Blueprint $table) {
            $table->string('content_file')->nullable()->comment('Single file upload for wish item content (image, video, audio, pdf, doc)');
            $table->string('content_file_type')->nullable()->after('content_file')->comment('MIME type of the uploaded content file');
            $table->string('content_file_name')->nullable()->after('content_file_type')->comment('Original filename of the uploaded content');
            $table->bigInteger('content_file_size')->nullable()->after('content_file_name')->comment('File size in bytes of the uploaded content');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('wish_items', function (Blueprint $table) {
            $table->dropColumn(['content_file', 'content_file_type', 'content_file_name', 'content_file_size']);
        });
    }
};
