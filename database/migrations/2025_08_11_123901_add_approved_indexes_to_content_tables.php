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
        // Add index to memberships.approved
        Schema::table('memberships', function (Blueprint $table) {
            $table->index('approved');
        });

        // Add index to bills.approved
        Schema::table('bills', function (Blueprint $table) {
            $table->index('approved');
        });

        // Add index to shops.approved
        Schema::table('shops', function (Blueprint $table) {
            $table->index('approved');
        });

        // Add index to user_intros.approved
        Schema::table('user_intros', function (Blueprint $table) {
            $table->index('approved');
        });

        // Add index to posts.approved
        Schema::table('posts', function (Blueprint $table) {
            $table->index('approved');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove index from memberships.approved
        Schema::table('memberships', function (Blueprint $table) {
            $table->dropIndex(['approved']);
        });

        // Remove index from bills.approved
        Schema::table('bills', function (Blueprint $table) {
            $table->dropIndex(['approved']);
        });

        // Remove index from shops.approved
        Schema::table('shops', function (Blueprint $table) {
            $table->dropIndex(['approved']);
        });

        // Remove index from user_intros.approved
        Schema::table('user_intros', function (Blueprint $table) {
            $table->dropIndex(['approved']);
        });

        // Remove index from posts.approved
        Schema::table('posts', function (Blueprint $table) {
            $table->dropIndex(['approved']);
        });
    }
};
