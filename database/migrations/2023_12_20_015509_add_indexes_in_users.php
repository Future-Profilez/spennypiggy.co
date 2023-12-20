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
            $table->index('id', 'users_id_index');
            $table->index('username', 'users_username_index');
            $table->index('email', 'users_email_index');
            $table->index(['email', 'password'], 'users_email_password_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('users_id_index');
            $table->dropIndex('users_username_index');
            $table->dropIndex('users_email_index');
            $table->dropIndex('users_email_password_index');
        });
    }
};
