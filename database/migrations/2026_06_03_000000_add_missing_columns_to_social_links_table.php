<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('social_links')) {
            return;
        }

        Schema::table('social_links', function (Blueprint $table) {
            if (! Schema::hasColumn('social_links', 'facebook')) {
                $table->string('facebook')->nullable()->after('instagram');
            }
            if (! Schema::hasColumn('social_links', 'youtube')) {
                $table->string('youtube')->nullable()->after('facebook');
            }
            if (! Schema::hasColumn('social_links', 'twitch')) {
                $table->string('twitch')->nullable()->after('youtube');
            }
            if (! Schema::hasColumn('social_links', 'tumblr')) {
                $table->string('tumblr')->nullable()->after('twitch');
            }
            if (! Schema::hasColumn('social_links', 'reason')) {
                $table->longText('reason')->nullable()->after('other');
            }
            if (! Schema::hasColumn('social_links', 'status')) {
                $table->bigInteger('status')->default(0)->after('reason');
            }
            if (! Schema::hasColumn('social_links', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('social_links')) {
            return;
        }

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
            if (Schema::hasColumn('social_links', 'reason')) {
                $table->dropColumn('reason');
            }
            if (Schema::hasColumn('social_links', 'status')) {
                $table->dropColumn('status');
            }
            if (Schema::hasColumn('social_links', 'deleted_at')) {
                $table->dropSoftDeletes();
            }
        });
    }
};
