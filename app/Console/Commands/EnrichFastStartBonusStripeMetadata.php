<?php

namespace App\Console\Commands;

use App\Models\FastStartBonusPayout;
use App\Models\User;
use Illuminate\Console\Command;

class EnrichFastStartBonusStripeMetadata extends Command
{
    protected $signature = 'bonus:enrich-fast-start-metadata {--dry-run} {--limit=0} {--creator=}';

    protected $description = 'Update Stripe transfer/payout metadata for Fast Start bonus payouts';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');
        $creatorFilter = trim((string) $this->option('creator'));

        $query = FastStartBonusPayout::query()
            ->where(function ($q) {
                $q->whereNotNull('stripe_transfer_id')
                    ->orWhereNotNull('stripe_payout_id');
            })
            ->orderByDesc('id');

        if ($creatorFilter !== '') {
            $creator = User::query()
                ->where('uuid', $creatorFilter)
                ->orWhere('username', $creatorFilter)
                ->first();

            if (!$creator) {
                $this->error('Creator not found');
                return self::FAILURE;
            }

            $query->where('creator_uuid', $creator->uuid);
        }

        if ($limit > 0) {
            $query->limit($limit);
        }

        $rows = $query->get();
        $updated = 0;
        $skipped = 0;

        foreach ($rows as $row) {
            $creator = User::where('uuid', $row->creator_uuid)->first();
            if (!$creator) {
                $skipped++;
                continue;
            }

            $currency = strtolower((string) ($row->currency ?: ($creator->default_currency ?? 'gbp')));

            $metadataBase = [
                'bonus_type' => 'fast_start',
                'reason' => 'fast_start_bonus',
                'source' => 'bonus:enrich-fast-start-metadata',
                'bonus_payout_id' => (string) $row->id,
                'creator_id' => (string) $creator->uuid,
                'creator_username' => (string) $creator->username,
                'creator_email' => (string) $creator->email,
                'window_start' => $row->window_start ? $row->window_start->toISOString() : null,
                'window_end' => $row->window_end ? $row->window_end->toISOString() : null,
                'eligible_at' => $row->eligible_at ? $row->eligible_at->toISOString() : null,
                'earnings_minor' => (string) ((int) ($row->earnings_minor ?? 0)),
                'bonus_minor' => (string) ((int) ($row->bonus_minor ?? 0)),
                'currency' => $currency,
                'env' => (string) config('app.env'),
            ];

            $metadataBase = array_filter($metadataBase, fn ($v) => $v !== null);
            $transferDescription = 'Fast Start Bonus' . (!empty($creator->username) ? (' - ' . $creator->username) : '');

            if ($dryRun) {
                $this->line($creator->uuid . ' transfer=' . ($row->stripe_transfer_id ?: '-') . ' payout=' . ($row->stripe_payout_id ?: '-') . ' ' . strtoupper($currency));
                $updated++;
                continue;
            }

            if (!empty($row->stripe_transfer_id)) {
                \App\StripeControl::updateTransferMinor((string) $row->stripe_transfer_id, $currency, array_merge($metadataBase, [
                    'stripe_payout_id' => (string) ($row->stripe_payout_id ?? ''),
                ]), $transferDescription);
            }

            if (!empty($row->stripe_payout_id) && !empty($creator->account_id)) {
                \App\StripeControl::updatePayoutMetadata((string) $row->stripe_payout_id, (string) $creator->account_id, $currency, array_merge($metadataBase, [
                    'transfer_id' => (string) ($row->stripe_transfer_id ?? ''),
                ]));
            }

            $updated++;
        }

        $this->info('Updated: ' . $updated);
        $this->info('Skipped: ' . $skipped);

        return self::SUCCESS;
    }
}

