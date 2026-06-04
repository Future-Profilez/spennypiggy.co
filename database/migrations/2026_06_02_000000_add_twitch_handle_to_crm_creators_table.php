<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('crm_creators', 'twitch_handle')) {
            Schema::table('crm_creators', function (Blueprint $table) {
                $table->string('twitch_handle')->nullable()->after('youtube_handle');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('crm_creators', 'twitch_handle')) {
            Schema::table('crm_creators', function (Blueprint $table) {
                $table->dropColumn('twitch_handle');
            });
        }
    }
};
