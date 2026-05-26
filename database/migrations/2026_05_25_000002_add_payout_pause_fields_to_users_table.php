<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasPausedAt = Schema::hasColumn('users', 'payout_paused_at');
        $hasReason = Schema::hasColumn('users', 'payout_pause_reason');

        if ($hasPausedAt && $hasReason) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($hasPausedAt, $hasReason) {
            if (! $hasPausedAt) {
                $table->timestamp('payout_paused_at')->nullable()->index()->after('suspended_account');
            }

            if (! $hasReason) {
                $table->text('payout_pause_reason')->nullable()->after('payout_paused_at');
            }
        });
    }

    public function down(): void
    {
        $hasPausedAt = Schema::hasColumn('users', 'payout_paused_at');
        $hasReason = Schema::hasColumn('users', 'payout_pause_reason');

        if (! $hasPausedAt && ! $hasReason) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use ($hasPausedAt, $hasReason) {
            if ($hasReason) {
                $table->dropColumn('payout_pause_reason');
            }

            if ($hasPausedAt) {
                $table->dropColumn('payout_paused_at');
            }
        });
    }
};
