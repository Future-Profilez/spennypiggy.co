<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The `logs` table, declared here ONLY so a database built from this app's own
 * migrations can run.
 *
 * ⚠️ This table is OWNED BY `admin.spennypiggy.co` (`create_logs_table` +
 * `add_missing_columns_to_logs_table`). The two apps share one database, so in
 * every real environment it already exists and this migration does nothing. But
 * the website reads it — `PostsController::editPost` clears a pending edit
 * request on every save — so without it `migrate:fresh` produces a schema where
 * editing a post is a 500, which is why that endpoint has never had a test.
 *
 * Same pattern, and the same warning, as the admin app's `2026_07_31_000001`
 * mirror of website-owned columns: **do not grow this into a second source of
 * truth.** Add a column here only when the website genuinely reads it, and add
 * it in the admin app first. `down()` is intentionally empty — a rollback must
 * never drop a table the other app owns.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('logs')) {
            Schema::create('logs', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('remove_wish_id')->nullable();
                $table->unsignedBigInteger('remove_bill_id')->nullable();
                $table->unsignedBigInteger('remove_post_id')->nullable();
                $table->unsignedBigInteger('remove_membership_id')->nullable();
                $table->unsignedBigInteger('remove_shop_id')->nullable();
                $table->unsignedBigInteger('edited_wish_id')->nullable();
                $table->unsignedBigInteger('edited_post_id')->nullable();
                $table->unsignedBigInteger('deleted_user_id')->nullable();
                $table->unsignedBigInteger('suspended_user_id')->nullable();
                $table->string('status')->nullable();
                $table->text('message')->nullable();
                $table->timestamps();
                $table->softDeletes();
            });

            return;
        }

        // Table exists but predates the columns the website reads.
        Schema::table('logs', function (Blueprint $table) {
            if (! Schema::hasColumn('logs', 'edited_post_id')) {
                $table->unsignedBigInteger('edited_post_id')->nullable();
            }

            if (! Schema::hasColumn('logs', 'status')) {
                $table->string('status')->nullable();
            }
        });
    }

    public function down(): void
    {
        // Intentionally empty — this table belongs to the admin app.
    }
};
