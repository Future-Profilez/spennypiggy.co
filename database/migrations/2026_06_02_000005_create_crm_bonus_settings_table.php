<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('crm_bonus_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('bonus_new_2k', 12, 2)->default(50);
            $table->decimal('bonus_new_5k', 12, 2)->default(100);
            $table->decimal('bonus_new_10k', 12, 2)->default(250);
            $table->decimal('retention_bonus_2k', 12, 2)->default(25);
            $table->decimal('retention_bonus_5k', 12, 2)->default(50);
            $table->decimal('retention_bonus_10k', 12, 2)->default(100);
            $table->unsignedInteger('retention_months')->default(3);
            $table->timestamps();
        });

        DB::table('crm_bonus_settings')->insert([
            'bonus_new_2k' => 50,
            'bonus_new_5k' => 100,
            'bonus_new_10k' => 250,
            'retention_bonus_2k' => 25,
            'retention_bonus_5k' => 50,
            'retention_bonus_10k' => 100,
            'retention_months' => 3,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('crm_bonus_settings');
    }
};

