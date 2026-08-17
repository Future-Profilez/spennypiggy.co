<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `user_intros` was created with six columns (2024_01_04_000000) and then grew five
 * more that NO migration declares — `poster`, `poster_token`, `height`, `width` and
 * `duration` are all read and written by `UserIntro` and `ProfileController`. Every
 * deployed database has them, so nothing failed in production; a database built from
 * these migrations alone comes out with a table the app cannot insert into, which is
 * why the intro paths had no test — they could not run.
 *
 * Same class of gap as `users.role`, `users.cover_approved`, `shops.status` and
 * `posts.type`. Every statement is guarded and `down()` is empty: a rollback must not
 * be able to drop live columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('user_intros')) {
            return;
        }

        Schema::table('user_intros', function (Blueprint $table) {
            // The generated poster still (thumbnails-group uuid) and the conversion
            // job token that produced it. The token is cleared once the job reports
            // success, so a row carrying a poster and no token is the settled state.
            if (! Schema::hasColumn('user_intros', 'poster')) {
                $table->string('poster')->nullable();
            }

            if (! Schema::hasColumn('user_intros', 'poster_token')) {
                $table->string('poster_token')->nullable();
            }

            // Written as 1280x720 defaults by ProfileController on every save.
            if (! Schema::hasColumn('user_intros', 'width')) {
                $table->unsignedInteger('width')->nullable();
            }

            if (! Schema::hasColumn('user_intros', 'height')) {
                $table->unsignedInteger('height')->nullable();
            }

            // Read by getPosterUrlAttribute() when asking Uploadcare for a still.
            if (! Schema::hasColumn('user_intros', 'duration')) {
                $table->unsignedInteger('duration')->nullable();
            }
        });

        // Separate Schema::table call on purpose: SQLite has no ALTER TABLE for this,
        // so Laravel rebuilds the table from its existing definition and DISCARDS
        // columns added in the same Blueprint — the documented trap that left
        // `gifter_addresses` missing five columns on SQLite only.
        $this->makeContentNullable();
    }

    /**
     * `content` was declared NOT NULL and nothing has ever written it — the two intro
     * save paths set only uuid/user_id/height/width. Production therefore already
     * accepts those inserts, and this brings a freshly migrated database in line.
     *
     * Guarded on the column actually being NOT NULL so an environment that is already
     * correct takes no ALTER at all, rather than rewriting a live column definition
     * to the value it already holds.
     */
    private function makeContentNullable(): void
    {
        if (! Schema::hasColumn('user_intros', 'content')) {
            return;
        }

        try {
            $column = Schema::getConnection()
                ->getDoctrineColumn('user_intros', 'content');

            if (! $column->getNotnull()) {
                return;
            }
        } catch (Throwable $e) {
            // Unable to inspect the column: leave a working table alone rather than
            // guessing. A fresh database will surface this loudly on its first insert.
            return;
        }

        Schema::table('user_intros', function (Blueprint $table) {
            $table->text('content')->nullable()->change();
        });
    }

    /**
     * Intentionally empty — these columns hold live data on every deployed database.
     */
    public function down(): void {}
};
