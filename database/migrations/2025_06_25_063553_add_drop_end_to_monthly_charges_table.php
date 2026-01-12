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
        if (!Schema::hasTable('monthly_charges')) {
            return;
        }

        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->dropColumn('end');
        });
    }

    public function down(): void
    {
        Schema::table('monthly_charges', function (Blueprint $table) {
            $table->date('end')->nullable(); // or use the original type if known
        });
    }
};
