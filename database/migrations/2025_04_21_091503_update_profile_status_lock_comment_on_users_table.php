<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            // Modify the column with new comment
            $table->smallInteger('profile_status_lock')
                ->default(0)
                ->comment('0: locked, 1: pending, 2: unlocked')
                ->change();
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Revert to old comment
            // $table->tinyInteger('profile_status_lock')
            //     ->default(0)
            //     ->comment('0: locked, 1: unlocked')
            //     ->change();
        });
    }
};
