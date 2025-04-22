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
        Schema::table('gifter_addresses', function (Blueprint $table) {
            $table->dropColumn('address');
            $table->text('country')->nullable()->after('user_id');
            $table->text('street_address')->nullable()->after('country');
            $table->text('city')->nullable()->after('street_address');
            $table->text('state')->nullable()->after('city');
            $table->text('postal_code')->nullable()->after('state');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('gifter_addresses', function (Blueprint $table) {
           //
        });
    }
};
