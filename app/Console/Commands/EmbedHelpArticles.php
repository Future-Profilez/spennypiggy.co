<?php

namespace App\Console\Commands;

use App\Models\HelpArticle;
use App\Services\Help\HelpAiKeyPool;
use App\Services\Help\HelpAnswer;
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

        if (HelpAnswer::retriever() === 'keyword') {
            // Not a failure and not a warning: on this retriever there is
            // nothing to embed, by design. Scheduled hourly, so it must be
            // quiet about it.
            $this->info('Retriever is `keyword` — Ask AI uses the help centre search, nothing to embed.');

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

            if (! HelpAiKeyPool::configured()) {
                $host = parse_url((string) config('help.ai.base_url'), PHP_URL_HOST) ?: 'the AI provider';

                if (str_contains($host, 'api.openai.com')) {
                    $this->line('  · No OpenAI key (set OPENAI_API_KEY, or the legacy DALLE_SECRET_KEY)');
                    $this->line('    One OpenAI key covers images, chat and embeddings — there is no separate key.');
                } else {
                    $this->line("  · No key for {$host} (set HELP_AI_API_KEYS, comma-separated, or HELP_AI_API_KEY — the OpenAI keys are not used against another host)");
                }
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

        // ⚠️ Said BEFORE the first request. The provider's 401 for a key sent
        // to the wrong host is "Incorrect API key provided" — true, and it sends
        // somebody to re-paste a key that was fine.
        foreach (HelpAiKeyPool::hostMismatches() as $problem) {
            $this->error('  '.$problem);
        }

        if (HelpAiKeyPool::hostMismatches() !== []) {
            $this->line('  Set HELP_AI_BASE_URL, HELP_AI_ANSWER_MODEL and HELP_AI_EMBEDDING_MODEL together, then `php artisan config:clear`.');

            return self::FAILURE;
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
        $quotaSpent = false;

        foreach (array_chunk($pending, self::BATCH) as $batch) {
            $inputs = array_map(fn ($row) => HelpEmbeddings::textFor($row['article']), $batch);

            $vectors = HelpEmbeddings::embed($inputs);

            if ($vectors === null) {
                // Stop rather than hammer a failing API for every remaining
                // batch. Re-running picks up exactly where this left off,
                // because the hash of what succeeded is already stored.
                $failed += count($batch);
                $quotaSpent = HelpEmbeddings::lastReason() === 'rate_limited';

                // ⚠️ SURFACE THE REASON. Reporting only "request failed" and
                // logging the cause meant re-running the same broken thing was
                // the obvious next move — which is what happened with a
                // truncated API key and a 401 nobody could see.
                if ($quotaSpent) {
                    $this->warn('Every AI key is out of quota for the embedding model — stopping.');
                } else {
                    $this->error('Embedding request failed — stopping.');
                }

                if ($reason = HelpEmbeddings::lastError()) {
                    $this->line('  '.$reason);
                }

                $this->line($quotaSpent
                    ? '  Nothing to fix — the next scheduled run picks these up when a key frees up.'
                    : '  Fix the cause, then re-run — completed articles are not re-embedded.');
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

        /*
         * 🚨 A SPENT FREE-TIER QUOTA IS NOT A RED RUN. This is scheduled hourly,
         * and a run that exits FAILURE every hour until midnight is how a
         * genuinely broken embed run stops being noticed. Same reasoning as the
         * AI-off branch above, which returns SUCCESS for exactly this reason.
         *
         * `auth`, `bad_request` and an unexpected response shape still fail —
         * none of those clears on its own.
         */
        if ($quotaSpent) {
            return self::SUCCESS;
        }

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
