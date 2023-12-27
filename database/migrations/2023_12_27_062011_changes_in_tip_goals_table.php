<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tip_goals', function (Blueprint $table) {
            $table->string('price_id')->nullable()->change();
            $table->tinyInteger('completed')->default(0)->after('currency');
            $table->timestamp('completed_at')->nullable()->after('completed');
            $table->tinyInteger('status')->default(0)->after('currency')->comment("0 => Until Acheived, 1 => Days set, 2 => Manually");
            $table->smallInteger('days')->nullable()->after('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tip_goals', function (Blueprint $table) {
            //
        });
    }
};
