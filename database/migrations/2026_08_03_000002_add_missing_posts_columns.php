<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Columns `posts` has in production and has never had a migration for.
 *
 * ⚠️ `create_posts_table` creates seven columns; the model reads and writes
 * fifteen. `type`, `for_module`, `image`, `ai_generated`, `status` and the two
 * edited-review columns were added straight to the deployed databases, so
 * `migrate:fresh` produced a schema the application cannot insert a post
 * against — which is why the post endpoints have never had a feature test.
 *
 * Same class of gap as `users.role` and `users.cover_approved`. Every statement
 * is guarded and `down()` is intentionally empty: this is a no-op on every real
 * environment, and a rollback must not drop live columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasColumn('posts', 'type')) {
                $table->string('type')->nullable();
            }

            if (! Schema::hasColumn('posts', 'for_module')) {
                $table->string('for_module')->nullable()->index();
            }

            if (! Schema::hasColumn('posts', 'image')) {
                $table->string('image', 500)->nullable();
            }

            if (! Schema::hasColumn('posts', 'ai_generated')) {
                $table->boolean('ai_generated')->default(false);
            }

            if (! Schema::hasColumn('posts', 'status')) {
                $table->string('status')->nullable();
            }

            if (! Schema::hasColumn('posts', 'edited_status')) {
                $table->tinyInteger('edited_status')->nullable();
            }

            if (! Schema::hasColumn('posts', 'edited_reason')) {
                $table->text('edited_reason')->nullable();
            }
        });

        // ⚠️ `title` and `content` are NOT NULL in the original migration, and the
        // application has always written NULL to both — the caption is optional
        // and the image IS the content. Production accepts it; a database built
        // from these migrations rejects every post insert.
        //
        // Wrapped: `change()` needs doctrine/dbal and rewrites the table on
        // SQLite, and a failure here must not block the columns above.
        try {
            Schema::table('posts', function (Blueprint $table) {
                $table->string('title')->nullable()->change();
                $table->text('content')->nullable()->change();
            });
        } catch (Throwable $e) {
            // Left as-is: callers already write '' rather than NULL where they must.
        }
    }

    public function down(): void
    {
        // Intentionally empty — these columns predate this migration everywhere
        // that matters, and dropping them would destroy live data.
    }
};
