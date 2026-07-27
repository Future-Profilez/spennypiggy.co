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
        if (Schema::hasTable('monthly_charges')) {

            Schema::table('monthly_charges', function (Blueprint $table) {

                if (! Schema::hasColumn('monthly_charges', 'cancelled_at')) {

                    $table->timestamp('cancelled_at')
                        ->nullable()
                        ->after('status');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (
            Schema::hasTable('monthly_charges') &&
            Schema::hasColumn('monthly_charges', 'cancelled_at')
        ) {

            Schema::table('monthly_charges', function (Blueprint $table) {

                $table->dropColumn('cancelled_at');
            });
        }
    }
};
