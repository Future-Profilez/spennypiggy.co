<?php

namespace App\Console\Commands;

use App\Services\Help\HelpAiKeyPool;
use Illuminate\Console\Command;

/**
 * Which AI keys are usable right now, and how often each has been stood down.
 *
 * The one question this answers is the one that decides whether to add
 * another account: is a key hitting its quota once a week, or thirty times a
 * day? Everything else on the table is context for reading that number.
 */
class HelpAiStatus extends Command
{
    protected $signature = 'help:ai-status
        {--reset : Bring every key back into rotation now, ignoring any cooldown}';

    protected $description = 'Show the health of each Help Centre AI key (cooldowns, reasons, counts for today)';

    public function handle(): int
    {
        if (! (bool) config('help.ai.enabled')) {
            $this->warn('Help AI is off (HELP_AI_ENABLED is not true). The pool is shown anyway.');
        }

        if (! HelpAiKeyPool::configured()) {
            $this->error('No AI key configured. Set HELP_AI_API_KEYS (comma-separated) or HELP_AI_API_KEY.');

            return self::FAILURE;
        }

        if ($this->option('reset')) {
            HelpAiKeyPool::reset();
            $this->info('Every key is back in rotation.');
        }

        $this->line('Host    '.config('help.ai.base_url'));
        $this->line('Answer  '.config('help.ai.answer_model'));
        $this->line('Embed   '.config('help.ai.embedding_model'));
        $this->line('Keys    '.HelpAiKeyPool::count().' (quota is per provider ACCOUNT — one account, several keys, one quota)');
        $this->newLine();

        $status = HelpAiKeyPool::status();

        $rows = array_map(function (array $row) {
            return [
                $row['label'],
                $row['model'],
                $row['healthy'] ? '<info>healthy</info>' : '<comment>standing down</comment>',
                $row['healthy'] ? '—' : $this->remaining($row['seconds_remaining']),
                $row['reason'] ?? '—',
                (string) $row['cooldowns_today'],
            ];
        }, $status);

        // ⚠️ A row per key PER MODEL — the providers meter chat and embeddings
        // separately, so an account can be out of one and fine on the other.
        $this->table(['Key', 'Model', 'State', 'Back in', 'Why', 'Stood down today'], $rows);

        foreach (HelpAiKeyPool::scopes() as $model) {
            $forModel = array_filter($status, fn ($r) => $r['model'] === $model);

            if ($forModel !== [] && ! array_filter($forModel, fn ($r) => $r['healthy'])) {
                $this->newLine();
                $this->warn("Every key is standing down for {$model}.");

                if ($model === config('help.ai.answer_model')) {
                    $this->line('  Ask AI is answering with search results until one frees up.');
                } else {
                    $this->line('  New articles are not being embedded until one frees up.');
                }
            }
        }

        return self::SUCCESS;
    }

    private function remaining(int $seconds): string
    {
        if ($seconds >= 3600) {
            return sprintf('%dh %02dm', intdiv($seconds, 3600), intdiv($seconds % 3600, 60));
        }

        if ($seconds >= 60) {
            return sprintf('%dm %02ds', intdiv($seconds, 60), $seconds % 60);
        }

        return $seconds.'s';
    }
}
