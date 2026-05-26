<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('payout_paused_at')->nullable()->index()->after('suspended_account');
            $table->text('payout_pause_reason')->nullable()->after('payout_paused_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['payout_paused_at', 'payout_pause_reason']);
        });
    }
};

