<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A retracted post has to be able to say WHY.
 *
 * Posts publish themselves from 11 Sep 2026 and a check pulls one back — but `posts`
 * carried only `approved`, so a retraction would make the post disappear from the
 * creator's audience with nothing on screen explaining it and nothing for them to fix.
 * Every other moderated table has carried these two since 27 July 2026
 * (`2026_07_27_000000` / `_000001`); posts were the module that never got them because
 * nothing ever scanned a post.
 *
 * ⚠️ Guarded and additive: a deployed database may already carry them, and this must be
 * a no-op there rather than an error that takes the deploy down.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('posts')) {
            return;
        }

        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasColumn('posts', 'moderation_reason')) {
                // Creator-facing and category-only — never a raw Rekognition label.
                $table->text('moderation_reason')->nullable()->after('approved_at');
            }

            if (! Schema::hasColumn('posts', 'moderation_asset')) {
                // Which asset was flagged, so `ListingPublication::republish()` can tell
                // "the creator replaced the thing that was wrong" from "they edited the
                // caption and left it in place".
                $table->string('moderation_asset', 32)->nullable()->after('moderation_reason');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('posts')) {
            return;
        }

        Schema::table('posts', function (Blueprint $table) {
            foreach (['moderation_asset', 'moderation_reason'] as $column) {
                if (Schema::hasColumn('posts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
