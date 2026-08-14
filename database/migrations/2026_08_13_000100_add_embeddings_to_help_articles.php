<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Semantic search for the help centre.
 *
 * ⚠️ NO VECTOR DATABASE, deliberately. The corpus is ~100 articles, so cosine
 * similarity over a JSON array in PHP is milliseconds and needs no extra
 * infrastructure, no extra bill and no second copy of the content to keep in
 * step. Revisit only if the corpus reaches thousands.
 *
 * `embedding_hash` is what makes re-embedding cheap: it is a hash of the exact
 * text that was embedded, so a run only pays for articles whose words actually
 * changed. Without it, every run would re-embed the whole corpus.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('help_articles')) {
            return;
        }

        Schema::table('help_articles', function (Blueprint $table) {
            if (! Schema::hasColumn('help_articles', 'embedding')) {
                $table->json('embedding')->nullable()->after('related_slugs');
            }

            if (! Schema::hasColumn('help_articles', 'embedding_hash')) {
                $table->string('embedding_hash', 64)->nullable()->after('embedding');
            }

            if (! Schema::hasColumn('help_articles', 'embedded_at')) {
                // dateTime, never timestamp — see the note in the create migration.
                $table->dateTime('embedded_at')->nullable()->after('embedding_hash');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('help_articles')) {
            return;
        }

        Schema::table('help_articles', function (Blueprint $table) {
            foreach (['embedding', 'embedding_hash', 'embedded_at'] as $column) {
                if (Schema::hasColumn('help_articles', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
