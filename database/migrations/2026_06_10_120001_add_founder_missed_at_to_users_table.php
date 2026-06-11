<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'founder_missed_at')) {
                // Set once when a creator's 30-day founder window ends without qualifying;
                // drives the one-time "you missed it" notification and the missed banner.
                $table->timestamp('founder_missed_at')->nullable()->after('is_founder');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'founder_missed_at')) {
                $table->dropColumn('founder_missed_at');
            }
        });
    }
};
