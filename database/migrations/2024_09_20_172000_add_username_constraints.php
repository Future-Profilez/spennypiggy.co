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
        Schema::table('users', function (Blueprint $table) {
            // Add NOT NULL constraint to username column if it doesn't already exist
            // and add a unique constraint (if not already present)
            $table->string('username')->nullable(false)->change();
            
            // Note: If the unique constraint doesn't exist, uncomment the line below
            // $table->unique('username');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Reverse the NOT NULL constraint if needed
            $table->string('username')->nullable()->change();
        });
    }
};