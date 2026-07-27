<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Uploadcare returns the crop/resize operations chosen in the uploader widget
 * (`cdnUrlModifiers`, e.g. "-/crop/1:1/center/") separately from the file uuid.
 * User::getAvatarUrlAttribute()/getCoverUrlAttribute() read these columns to
 * rebuild the CDN URL, and several queries select them explicitly — but no
 * migration ever created them, so a fresh database 500s on any select that
 * names them (Discover, leaderboards, profile).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'avatar_cdn_modifier')) {
                $table->string('avatar_cdn_modifier', 255)->nullable()->after('avatar');
            }
            if (! Schema::hasColumn('users', 'cover_cdn_modifier')) {
                $table->string('cover_cdn_modifier', 255)->nullable()->after('cover');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            foreach (['avatar_cdn_modifier', 'cover_cdn_modifier'] as $column) {
                if (Schema::hasColumn('users', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
