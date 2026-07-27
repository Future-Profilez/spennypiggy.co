<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('piggy_pot_contributions', function (Blueprint $table) {
            $table->timestamp('creator_notified_at')->nullable()->after('status');
            $table->timestamp('supporter_notified_at')->nullable()->after('creator_notified_at');
        });
    }

    public function down(): void
    {
        Schema::table('piggy_pot_contributions', function (Blueprint $table) {
            $table->dropColumn(['creator_notified_at', 'supporter_notified_at']);
        });
    }
};
