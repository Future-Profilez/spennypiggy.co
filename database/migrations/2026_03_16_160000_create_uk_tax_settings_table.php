<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uk_tax_settings', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('tax_year_start')->unique();
            $table->string('tax_year_label')->nullable();

            $table->double('personal_allowance', 12, 2)->default(12570.00);
            $table->double('basic_rate_limit', 12, 2)->default(50270.00);
            $table->double('higher_rate_limit', 12, 2)->default(125140.00);

            $table->double('basic_rate', 6, 4)->default(0.2000);
            $table->double('higher_rate', 6, 4)->default(0.4000);
            $table->double('additional_rate', 6, 4)->default(0.4500);

            $table->timestamps();
        });

        DB::table('uk_tax_settings')->insert([
            'tax_year_start' => 2024,
            'tax_year_label' => '2024/25',
            'personal_allowance' => 12570.00,
            'basic_rate_limit' => 50270.00,
            'higher_rate_limit' => 125140.00,
            'basic_rate' => 0.2000,
            'higher_rate' => 0.4000,
            'additional_rate' => 0.4500,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('uk_tax_settings');
    }
};

