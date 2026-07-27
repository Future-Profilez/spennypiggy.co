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
        if (Schema::hasTable('post_comments') && ! Schema::hasColumn('post_comments', 'is_approved')) {
            Schema::table('post_comments', function (Blueprint $table) {
                $table->boolean('is_approved')->default(false)->after('comment');
            });
        }

        if (Schema::hasTable('post_comment_replies') && ! Schema::hasColumn('post_comment_replies', 'is_approved')) {
            Schema::table('post_comment_replies', function (Blueprint $table) {
                $table->boolean('is_approved')->default(false)->after('reply');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('post_comments') && Schema::hasColumn('post_comments', 'is_approved')) {
            Schema::table('post_comments', function (Blueprint $table) {
                $table->dropColumn('is_approved');
            });
        }

        if (Schema::hasTable('post_comment_replies') && Schema::hasColumn('post_comment_replies', 'is_approved')) {
            Schema::table('post_comment_replies', function (Blueprint $table) {
                $table->dropColumn('is_approved');
            });
        }
    }
};
