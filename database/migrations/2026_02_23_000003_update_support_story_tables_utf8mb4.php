<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::connection()->getDriverName() === 'sqlite') {
            return;
        }

        try {
            DB::statement('ALTER TABLE support_story_reactions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        } catch (Throwable $e) {
        }
        try {
            DB::statement('ALTER TABLE support_story_replies CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
        } catch (Throwable $e) {
        }
    }

    public function down(): void
    {
        //
    }
};
