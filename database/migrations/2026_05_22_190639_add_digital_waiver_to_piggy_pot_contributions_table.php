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
        Schema::table('piggy_pot_contributions', function (Blueprint $table) {
            $table->timestamp('digital_waiver_confirmed_at')->nullable();
            $table->text('digital_waiver_text')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('piggy_pot_contributions', function (Blueprint $table) {
            $table->dropColumn(['digital_waiver_confirmed_at', 'digital_waiver_text']);
        });
    }
};
