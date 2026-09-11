<?php

namespace App\Console\Commands;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\WishItem;
use App\Support\ListingPublication;
use Illuminate\Console\Command;

/**
 * Which listings are held, and what would release each one.
 *
 * 🚨 READ ONLY, AND THAT IS A DECISION, NOT A GAP. The same rule the client set for
 * profiles (`profiles:activation-report`): a listing is published when the CREATOR
 * saves it, never by a sweep. A command that released every held listing would also
 * release the ones a person deliberately held and the ones whose flagged file is
 * still attached — and neither could be told apart afterwards.
 *
 * What it exists for: with the review queue gone, a listing held before this change
 * has nothing left to work it. This says how many there are, why each is held, and
 * which of them an ordinary edit would free — so the residue is a number somebody
 * can act on rather than an invisible backlog.
 */
class HeldListingsReport extends Command
{
    protected $signature = 'listings:held-report {--limit=200}';

    protected $description = 'List every held listing, why it is held, and what would release it';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $rows = [];
        $totals = ['releasable_by_edit' => 0, 'needs_a_person' => 0];

        foreach ([Task::class, Shop::class, WishItem::class, Bills::class, Membership::class, PiggyPot::class] as $model) {
            $held = ListingPublication::HELD[$model];

            $query = $model::query();

            foreach ($held as $column => $value) {
                $query->where($column, $value);
            }

            // ⚠️ `withScheduled()` where the model has it — a scheduled listing is still
            // a held listing, and leaving it out reports a smaller backlog than exists.
            if (method_exists($model, 'scopeWithScheduled')) {
                $query->withScheduled();
            }

            foreach ($query->limit($limit)->get() as $item) {
                $asset = trim((string) ($item->getAttribute('moderation_asset') ?? ''));

                /*
                 * An asset key means a CHECK held it, and replacing that asset (or, for
                 * text, editing the wording) republishes on save. No key means a person
                 * did it, or it predates the reason columns — either way only a person
                 * can decide, which is what makes this the number worth reporting.
                 */
                $route = match (true) {
                    $asset === 'reward_text' => 'creator edits the wording',
                    $asset !== '' => 'creator replaces the '.str_replace('_', ' ', $asset),
                    default => 'nobody — no recorded cause',
                };

                $totals[$asset === '' ? 'needs_a_person' : 'releasable_by_edit']++;

                $rows[] = [
                    class_basename($model),
                    $item->getKey(),
                    $item->getAttribute('user_id') ?? $item->getAttribute('creator_id'),
                    $asset !== '' ? $asset : '—',
                    $route,
                ];
            }
        }

        if ($rows === []) {
            $this->info('Nothing is held.');

            return self::SUCCESS;
        }

        $this->table(['Module', 'Id', 'Creator', 'Held on', 'Released by'], $rows);

        $this->newLine();
        $this->line('Held: '.count($rows));
        $this->line('  released by the creator editing it: '.$totals['releasable_by_edit']);
        $this->line('  no recorded cause, needs a person:  '.$totals['needs_a_person']);

        return self::SUCCESS;
    }
}
