<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * TikTok is one of the three platforms a creator may verify against — and it was
 * the only one of the three with no column to store it in.
 *
 * The documented rule has been "Instagram, X or TikTok only" for some time. The
 * form meanwhile offered thirteen platforms including Facebook and YouTube, both
 * of which the rule excludes, and offered no TikTok field at all. A creator who
 * read the rule and came to comply with it literally could not.
 *
 * Nullable, like every other platform column: a creator supplies one of the
 * three, not all of them.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('social_links') || Schema::hasColumn('social_links', 'tiktok')) {
            return;
        }

        Schema::table('social_links', function (Blueprint $table) {
            // Beside the other two accepted platforms rather than at the end of
            // the table, so the three that matter read together.
            $table->string('tiktok')->nullable()->after('instagram');
        });
    }

    public function down(): void
    {
        if (Schema::hasTable('social_links') && Schema::hasColumn('social_links', 'tiktok')) {
            Schema::table('social_links', function (Blueprint $table) {
                $table->dropColumn('tiktok');
            });
        }
    }
};
