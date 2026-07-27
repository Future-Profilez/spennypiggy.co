<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A leaderboard with no memory cannot show movement, and movement is the
     * only reason anyone comes back to look at it twice. One row per
     * creator per period per capture; the daily command writes them.
     */
    public function up(): void
    {
        if (! Schema::hasTable('leaderboard_snapshots')) {
            Schema::create('leaderboard_snapshots', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('user_id');
                $table->string('period', 20);
                $table->unsignedInteger('rank');
                $table->decimal('score', 14, 2)->default(0);
                $table->unsignedInteger('supporters')->default(0);
                $table->date('captured_on');
                $table->timestamps();

                // One capture per creator per period per day — the command is
                // safe to re-run, and a retry cannot double a rank history.
                $table->unique(['user_id', 'period', 'captured_on'], 'leaderboard_snapshot_unique');
                $table->index(['period', 'captured_on'], 'leaderboard_snapshot_lookup');
            });
        }

        if (! Schema::hasColumn('users', 'leaderboard_opt_out')) {
            Schema::table('users', function (Blueprint $table) {
                $table->boolean('leaderboard_opt_out')->default(false)->after('suspended_account');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('leaderboard_snapshots');

        if (Schema::hasColumn('users', 'leaderboard_opt_out')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('leaderboard_opt_out');
            });
        }
    }
};
