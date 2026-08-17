<?php

namespace App\Console\Commands;

use App\Models\HelpArticle;
use App\Services\Help\HelpEmbeddings;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Builds the vectors that let someone ask a question in ordinary language.
 *
 * ⚠️ Only re-embeds articles whose TEXT has changed (`embedding_hash`). Without
 * that check every run would re-pay for the whole corpus, and this is scheduled.
 *
 * ⚠️ Runs against DRAFTS too. An article published five minutes before someone
 * searches for it would otherwise be invisible to semantic search until the next
 * scheduled run.
 */
class EmbedHelpArticles extends Command
{
    /** OpenAI accepts batched input; this keeps a request comfortably small. */
    private const BATCH = 20;

    protected $signature = 'help:embed
        {--all : Re-embed every article, even unchanged ones}
        {--max= : Stop after this many articles}
        {--dry-run : Report what would be embedded and call nothing}';

    protected $description = 'Generate semantic search embeddings for help centre articles';

    public function handle(): int
    {
        if (! Schema::hasTable('help_articles') || ! Schema::hasColumn('help_articles', 'embedding')) {
            $this->warn('Help centre embedding columns not present — nothing to do.');

            return self::SUCCESS;
        }

        if (! HelpEmbeddings::enabled()) {
            // ⚠️ Name WHICH prerequisite is missing. "AI is disabled" is true of
            // two completely different situations — a flag nobody set and a key
            // nobody added — and someone who has just set the flag reads the
            // vague form as the flag not having taken effect.
            //
            // Not a failure: AI answers are off by default and the help centre
            // works without them. A scheduled run must not report red for a
            // feature nobody switched on.
            $this->warn('Help AI is off — nothing embedded.');

            if (! config('help.ai.enabled')) {
                $this->line('  · HELP_AI_ENABLED is not true (config: help.ai.enabled)');
            }

            if (! config('help.ai.api_key')) {
                $this->line('  · No OpenAI key (set OPENAI_API_KEY, or the legacy DALLE_SECRET_KEY)');
                $this->line('    One OpenAI key covers images, chat and embeddings — there is no separate key.');
            }

            $this->line('  Set both in .env, then run `php artisan config:clear`.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');
        $all = (bool) $this->option('all');
        $max = (int) ($this->option('max') ?: 0);

        $pending = [];

        HelpArticle::query()
            ->orderBy('id')
            ->chunkById(200, function ($articles) use (&$pending, $all, $max) {
                foreach ($articles as $article) {
                    if ($max > 0 && count($pending) >= $max) {
                        return false;
                    }

                    $hash = HelpEmbeddings::hashFor($article);

                    if (! $all && $article->embedding_hash === $hash && is_array($article->embedding) && $article->embedding) {
                        continue;
                    }

                    $pending[] = ['article' => $article, 'hash' => $hash];
                }

                return true;
            });

        if (empty($pending)) {
            $this->info('Every article is already embedded and unchanged.');

            return self::SUCCESS;
        }

        $this->line(count($pending).' article(s) need embedding.');

        if ($dryRun) {
            foreach ($pending as $row) {
                $this->line('  · '.$row['article']->slug);
            }
            $this->info('Dry run — nothing called, nothing written.');

            return self::SUCCESS;
        }

        $done = 0;
        $failed = 0;

        foreach (array_chunk($pending, self::BATCH) as $batch) {
            $inputs = array_map(fn ($row) => HelpEmbeddings::textFor($row['article']), $batch);

            $vectors = HelpEmbeddings::embed($inputs);

            if ($vectors === null) {
                // Stop rather than hammer a failing API for every remaining
                // batch. Re-running picks up exactly where this left off,
                // because the hash of what succeeded is already stored.
                $failed += count($batch);

                // ⚠️ SURFACE THE REASON. Reporting only "request failed" and
                // logging the cause meant re-running the same broken thing was
                // the obvious next move — which is what happened with a
                // truncated API key and a 401 nobody could see.
                $this->error('Embedding request failed — stopping.');

                if ($reason = HelpEmbeddings::lastError()) {
                    $this->line('  '.$reason);
                }

                $this->line('  Fix the cause, then re-run — completed articles are not re-embedded.');
                break;
            }

            foreach ($batch as $i => $row) {
                $vector = $vectors[$i] ?? null;

                if (! is_array($vector) || empty($vector)) {
                    $failed++;

                    continue;
                }

                // saveQuietly: writing an embedding is not a content change, and
                // the saved hook would drop the whole cached help tree once per
                // article for no reason.
                $row['article']->forceFill([
                    'embedding' => $vector,
                    'embedding_hash' => $row['hash'],
                    'embedded_at' => now(),
                ])->saveQuietly();

                $done++;
            }
        }

        $this->info("Embedded {$done} article(s)".($failed ? ", {$failed} failed." : '.'));

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
