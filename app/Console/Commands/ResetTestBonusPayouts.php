<?php

namespace App\Console\Commands;

use App\Models\FastStartBonusPayout;
use App\Models\FounderBonus;
use App\Models\PayoutRecord;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;

/**
 * Reset "fake-paid" / testing bonus payouts so they can be re-processed cleanly.
 *
 * A fake-paid bonus is one whose status is `paid` but which has NO real Stripe payout
 * behind it (no PayoutRecord / no stripe_payout_id) — i.e. it was marked paid by old
 * buggy tooling or during testing, with no money actually moved. This command flips
 * those back to a re-runnable state. Rows backed by a real Stripe payout are never
 * touched.
 */
class ResetTestBonusPayouts extends Command
{
    protected $signature = 'bonus:reset-test-payouts
        {--type=all : Which bonus to reset: founder | fast_start | all}
        {--creator= : Limit to a single creator (username or uuid)}
        {--dry-run : Show what would change without writing}
        {--force : Skip the confirmation prompt}';

    protected $description = 'Reset fake-paid / testing founder & fast-start bonus payouts so they can be re-run';

    public function handle(): int
    {
        $type = strtolower((string) $this->option('type'));
        $creatorFilter = trim((string) $this->option('creator'));
        $dryRun = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');

        if (!in_array($type, ['all', 'founder', 'fast_start'], true)) {
            $this->error("Invalid --type. Use founder | fast_start | all.");
            return self::FAILURE;
        }

        // Resolve optional creator filter to ids/uuids.
        $creator = null;
        if ($creatorFilter !== '') {
            $creator = User::where('uuid', $creatorFilter)->orWhere('username', $creatorFilter)->first();
            if (!$creator) {
                $this->error("Creator not found: {$creatorFilter}");
                return self::FAILURE;
            }
            $this->line("Filtering to creator: {$creator->username} (id={$creator->id})");
        }

        $founderTargets = collect();
        $fastStartTargets = collect();

        if ($type === 'all' || $type === 'founder') {
            $founderTargets = $this->findFakeFounder($creator);
        }
        if ($type === 'all' || $type === 'fast_start') {
            $fastStartTargets = $this->findFakeFastStart($creator);
        }

        $this->info("Fake-paid founder bonuses: {$founderTargets->count()}");
        foreach ($founderTargets as $b) {
            $this->line("  - founder #{$b->id} creator_id={$b->creator_id} bonus={$b->bonus_amount} status={$b->payout_status}");
        }
        $this->info("Fake-paid fast-start bonuses: {$fastStartTargets->count()}");
        foreach ($fastStartTargets as $b) {
            $this->line("  - fast_start #{$b->id} creator_uuid={$b->creator_uuid} bonus_minor={$b->bonus_minor} status={$b->status}");
        }

        if ($founderTargets->isEmpty() && $fastStartTargets->isEmpty()) {
            $this->info('Nothing to reset.');
            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn('Dry run — no changes written.');
            return self::SUCCESS;
        }

        if (!$force && !$this->confirm('Reset these bonus payouts to a re-runnable state?')) {
            $this->line('Aborted.');
            return self::SUCCESS;
        }

        $founderReset = 0;
        foreach ($founderTargets as $b) {
            $fields = ['payout_status' => FounderBonus::STATUS_PENDING, 'paid_date' => null];
            if (Schema::hasColumn('founder_bonuses', 'stripe_payout_id')) $fields['stripe_payout_id'] = null;
            if (Schema::hasColumn('founder_bonuses', 'stripe_transfer_id')) $fields['stripe_transfer_id'] = null;
            if (Schema::hasColumn('founder_bonuses', 'payout_record_uuid')) $fields['payout_record_uuid'] = null;
            FounderBonus::whereKey($b->id)->update($fields);
            $founderReset++;
        }

        $fastStartReset = 0;
        foreach ($fastStartTargets as $b) {
            $b->stripe_transfer_id = null;
            $b->stripe_payout_id = null;
            if (Schema::hasColumn('fast_start_bonus_payouts', 'paid_at')) {
                $b->paid_at = null;
            }
            // 'ready' is re-processed on the next run (it is NOT in the command's skip set).
            $b->status = 'ready';
            $b->save();
            $fastStartReset++;
        }

        $this->info("Reset complete. Founder: {$founderReset}, Fast Start: {$fastStartReset}.");
        $this->line('Re-run payouts: `php artisan bonus:process-fast-start` and the founder payout job / admin button.');

        return self::SUCCESS;
    }

    /**
     * Founder bonuses marked paid with no real Stripe payout behind them.
     */
    private function findFakeFounder(?User $creator)
    {
        if (!Schema::hasTable('founder_bonuses')) {
            return collect();
        }

        return FounderBonus::query()
            ->where('payout_status', FounderBonus::STATUS_PAID)
            ->where(fn ($q) => $q->whereNull('payout_record_uuid')->orWhere('payout_record_uuid', ''))
            ->where(fn ($q) => $q->whereNull('stripe_payout_id')->orWhere('stripe_payout_id', ''))
            ->when($creator, fn ($q) => $q->where('creator_id', $creator->id))
            ->get();
    }

    /**
     * Fast start bonuses in a "paid-ish" state with no real Stripe payout id.
     */
    private function findFakeFastStart(?User $creator)
    {
        if (!Schema::hasTable('fast_start_bonus_payouts')) {
            return collect();
        }

        return FastStartBonusPayout::query()
            ->whereIn('status', ['paid', 'processing', 'in_transit'])
            ->where(fn ($q) => $q->whereNull('stripe_payout_id')->orWhere('stripe_payout_id', ''))
            ->when($creator, fn ($q) => $q->where('creator_uuid', $creator->uuid))
            ->get();
    }
}
