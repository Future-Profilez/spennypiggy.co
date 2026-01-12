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
        if (config('database.default') === 'sqlite') {
            return;
        }

        // Add index to memberships.approved
        Schema::table('memberships', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes('memberships');
            if (!array_key_exists('memberships_approved_index', $indexes)) {
                 $table->index('approved');
            }
        });

        // Add index to bills.approved
        Schema::table('bills', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes('bills');
            if (!array_key_exists('bills_approved_index', $indexes)) {
                $table->index('approved');
            }
        });

        // Add index to shops.approved
        Schema::table('shops', function (Blueprint $table) {
             $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes('shops');
            if (!array_key_exists('shops_approved_index', $indexes)) {
                $table->index('approved');
            }
        });

        // Add index to user_intros.approved
        Schema::table('user_intros', function (Blueprint $table) {
            $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes('user_intros');
            if (!array_key_exists('user_intros_approved_index', $indexes)) {
                $table->index('approved');
            }
        });

        // Add index to posts.approved
        Schema::table('posts', function (Blueprint $table) {
             $sm = Schema::getConnection()->getDoctrineSchemaManager();
            $indexes = $sm->listTableIndexes('posts');
            if (!array_key_exists('posts_approved_index', $indexes)) {
                $table->index('approved');
            }
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
