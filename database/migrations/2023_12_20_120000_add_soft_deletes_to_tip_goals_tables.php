<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('tip_goals') && !Schema::hasColumn('tip_goals', 'deleted_at')) {
            Schema::table('tip_goals', function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        if (Schema::hasTable('tip_goals_payments') && !Schema::hasColumn('tip_goals_payments', 'deleted_at')) {
            Schema::table('tip_goals_payments', function (Blueprint $table) {
                $table->softDeletes();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('tip_goals') && Schema::hasColumn('tip_goals', 'deleted_at')) {
            Schema::table('tip_goals', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }

        if (Schema::hasTable('tip_goals_payments') && Schema::hasColumn('tip_goals_payments', 'deleted_at')) {
            Schema::table('tip_goals_payments', function (Blueprint $table) {
                $table->dropSoftDeletes();
            });
        }
    }
};
