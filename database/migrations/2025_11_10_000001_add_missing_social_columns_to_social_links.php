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
        Schema::table('social_links', function (Blueprint $table) {
            if (!Schema::hasColumn('social_links', 'facebook')) {
                $table->string('facebook')->nullable()->after('instagram');
            }
            if (!Schema::hasColumn('social_links', 'youtube')) {
                $table->string('youtube')->nullable()->after('facebook');
            }
            if (!Schema::hasColumn('social_links', 'twitch')) {
                $table->string('twitch')->nullable()->after('youtube');
            }
            if (!Schema::hasColumn('social_links', 'tumblr')) {
                $table->string('tumblr')->nullable()->after('twitch');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('social_links', function (Blueprint $table) {
            if (Schema::hasColumn('social_links', 'facebook')) {
                $table->dropColumn('facebook');
            }
            if (Schema::hasColumn('social_links', 'youtube')) {
                $table->dropColumn('youtube');
            }
            if (Schema::hasColumn('social_links', 'twitch')) {
                $table->dropColumn('twitch');
            }
            if (Schema::hasColumn('social_links', 'tumblr')) {
                $table->dropColumn('tumblr');
            }
        });
    }
};