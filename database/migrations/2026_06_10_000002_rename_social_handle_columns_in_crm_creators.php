<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        if (Schema::hasColumn('crm_creators', 'x_handle')) {
            DB::statement('ALTER TABLE crm_creators CHANGE x_handle twitter VARCHAR(255) NULL');
        }
        if (Schema::hasColumn('crm_creators', 'instagram_handle')) {
            DB::statement('ALTER TABLE crm_creators CHANGE instagram_handle instagram VARCHAR(255) NULL');
        }
        if (Schema::hasColumn('crm_creators', 'youtube_handle')) {
            DB::statement('ALTER TABLE crm_creators CHANGE youtube_handle youtube VARCHAR(255) NULL');
        }
        if (Schema::hasColumn('crm_creators', 'twitch_handle')) {
            DB::statement('ALTER TABLE crm_creators CHANGE twitch_handle twitch VARCHAR(255) NULL');
        }
    }

    public function down(): void
    {
        if (DB::connection()->getDriverName() !== 'mysql') {
            return;
        }
        if (Schema::hasColumn('crm_creators', 'twitter')) {
            DB::statement('ALTER TABLE crm_creators CHANGE twitter x_handle VARCHAR(255) NULL');
        }
        if (Schema::hasColumn('crm_creators', 'instagram')) {
            DB::statement('ALTER TABLE crm_creators CHANGE instagram instagram_handle VARCHAR(255) NULL');
        }
        if (Schema::hasColumn('crm_creators', 'youtube')) {
            DB::statement('ALTER TABLE crm_creators CHANGE youtube youtube_handle VARCHAR(255) NULL');
        }
        if (Schema::hasColumn('crm_creators', 'twitch')) {
            DB::statement('ALTER TABLE crm_creators CHANGE twitch twitch_handle VARCHAR(255) NULL');
        }
    }
};
