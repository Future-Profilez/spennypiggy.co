<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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

        if (Schema::hasTable('support_story_reactions')) {
            Schema::table('support_story_reactions', function (Blueprint $table) {
                $table->string('emoji', 32)->charset('utf8mb4')->collation('utf8mb4_unicode_ci')->change();
            });
        }
        if (Schema::hasTable('support_story_replies')) {
            Schema::table('support_story_replies', function (Blueprint $table) {
                $table->text('message')->charset('utf8mb4')->collation('utf8mb4_unicode_ci')->change();
            });
        }
    }

    public function down(): void {}
};
