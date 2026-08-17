<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Help Centre — website-owned schema.
 *
 * The admin app shares this database but not this code; when the admin CMS is
 * built it declares these tables with its own guarded declaration migration
 * (the pattern used by 2026_07_31_000001 / 2026_08_04_000000 over there).
 * Do NOT add a second create migration on that side.
 *
 * ⚠️ The FULLTEXT index is MySQL-only and is added in its own guarded statement.
 * The test database is sqlite, which has no FULLTEXT — HelpSearch falls back to
 * LIKE scoring there. Putting the index inside the Blueprint would break every
 * test run on a driver that cannot express it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('help_categories')) {
            Schema::create('help_categories', function (Blueprint $table) {
                $table->id();
                $table->string('slug')->unique();
                $table->string('title');
                $table->string('summary', 500)->nullable();
                // Emoji, not an icon-set name: the rest of the site draws category
                // marks the same way and it ships nothing extra to the browser.
                $table->string('icon', 16)->nullable();
                // creator | supporter | both. A DEFAULT FILTER, never a gate —
                // a supporter following a link to a creator article still reads it.
                $table->string('audience', 16)->default('both');
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->boolean('is_published')->default(true);
                $table->timestamps();

                $table->index(['is_published', 'sort_order']);
            });
        }

        if (! Schema::hasTable('help_articles')) {
            Schema::create('help_articles', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->foreignId('help_category_id')->constrained('help_categories')->cascadeOnDelete();
                $table->string('slug')->unique();
                $table->string('title');
                // Doubles as the card blurb AND the meta description, so it is
                // written once and can never disagree with itself.
                $table->string('summary', 500);
                $table->longText('body');
                // Curated search terms. FULLTEXT over a ~100-article corpus is
                // mediocre on body alone; these are what make "why is my thing
                // held" find the moderation article.
                $table->text('keywords')->nullable();
                $table->string('audience', 16)->default('both');
                $table->unsignedSmallInteger('sort_order')->default(0);
                $table->string('status', 16)->default('draft');
                $table->dateTime('published_at')->nullable();
                // ⚠️ dateTime, never timestamp. A TIMESTAMP NOT NULL column with no
                // explicit default is silently promoted by MySQL to
                // ON UPDATE CURRENT_TIMESTAMP — the trap platform_activities.occurred_at
                // and the scheduled-listing columns already document.
                $table->dateTime('edited_at')->nullable();
                // Config key (e.g. services.rye.enabled). Set → the article is
                // hidden while that feature is switched off, so the help centre
                // can never document something nobody can reach.
                $table->string('feature_flag')->nullable();
                $table->json('related_slugs')->nullable();
                $table->timestamps();
                $table->softDeletes();

                $table->index(['status', 'published_at']);
                $table->index(['help_category_id', 'sort_order']);
                $table->index('audience');
            });
        }

        // Retitling an article changes its URL. Without this, every link already
        // shared and everything already indexed 404s — the same reason
        // post_slug_history exists.
        if (! Schema::hasTable('help_article_slug_history')) {
            Schema::create('help_article_slug_history', function (Blueprint $table) {
                $table->id();
                $table->foreignId('help_article_id')->constrained('help_articles')->cascadeOnDelete();
                $table->string('slug')->unique();
                $table->timestamps();
            });
        }

        // AGGREGATE ONLY — one row per article per day. No IP, no cookie id, no
        // per-visitor row, exactly like site_visit_stats and item_view_stats.
        if (! Schema::hasTable('help_article_stats')) {
            Schema::create('help_article_stats', function (Blueprint $table) {
                $table->id();
                $table->foreignId('help_article_id')->constrained('help_articles')->cascadeOnDelete();
                // ⚠️ No `date` cast on the model. With one, Eloquent writes
                // Y-m-d H:i:s; MySQL truncates it but SQLite keeps the time, so the
                // unique bucket stops matching and each day fragments into rows
                // that can never be found again.
                $table->date('date');
                $table->unsignedInteger('views')->default(0);
                $table->unsignedInteger('helpful_yes')->default(0);
                $table->unsignedInteger('helpful_no')->default(0);
                // Read from inside a support form and marked as answering the
                // question — a ticket that was not opened.
                $table->unsignedInteger('deflected')->default(0);
                // Read, did not answer it, went on to open a ticket.
                $table->unsignedInteger('escalated')->default(0);
                $table->timestamps();

                $table->unique(['help_article_id', 'date']);
                $table->index('date');
            });
        }

        // The single most valuable table here: searches that found nothing IS the
        // list of articles to write next.
        if (! Schema::hasTable('help_search_misses')) {
            Schema::create('help_search_misses', function (Blueprint $table) {
                $table->id();
                // Lowercased, punctuation stripped, whitespace collapsed — so
                // "Where's my payout?" and "wheres my payout" are one row.
                $table->string('query_normalised', 191)->unique();
                // The last raw form a human actually typed, for reading back.
                $table->string('query_sample', 255);
                $table->unsignedInteger('hits')->default(0);
                $table->dateTime('last_seen_at')->nullable();
                $table->timestamps();

                $table->index('hits');
                $table->index('last_seen_at');
            });
        }

        $this->addFullTextIndex();
    }

    /**
     * MySQL/MariaDB only. Guarded and swallowed: an environment that cannot
     * build it still gets a working help centre through the LIKE fallback, and a
     * migration failing here would block the whole deploy for a search
     * optimisation.
     */
    private function addFullTextIndex(): void
    {
        if (! in_array(DB::getDriverName(), ['mysql', 'mariadb'], true)) {
            return;
        }

        try {
            $exists = DB::selectOne(
                'SELECT COUNT(*) AS c FROM information_schema.statistics
                 WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?',
                ['help_articles', 'help_articles_fulltext']
            );

            if ((int) ($exists->c ?? 0) > 0) {
                return;
            }

            DB::statement(
                'ALTER TABLE `help_articles`
                 ADD FULLTEXT `help_articles_fulltext` (`title`, `summary`, `keywords`, `body`)'
            );
        } catch (Throwable $e) {
            Log::warning('Help centre FULLTEXT index not created: '.$e->getMessage());
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('help_search_misses');
        Schema::dropIfExists('help_article_stats');
        Schema::dropIfExists('help_article_slug_history');
        Schema::dropIfExists('help_articles');
        Schema::dropIfExists('help_categories');
    }
};
