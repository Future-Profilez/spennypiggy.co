<?php

namespace App\Console\Commands;

use App\Models\MembershipOfferDismissal;
use App\Services\MembershipUpsellService;
use Illuminate\Console\Command;

/**
 * Delete membership offer dismissals older than the dismissal window (90 days).
 */
class PruneMembershipOfferDismissals extends Command
{
    protected $signature = 'membership-offer:prune-dismissals';

    protected $description = 'Delete membership offer dismissals older than the dismissal window (90 days)';

    public function handle(): int
    {
        $days = MembershipUpsellService::DISMISSAL_DAYS;
        $cutoff = now()->subDays($days);

        $deleted = MembershipOfferDismissal::query()
            ->where('dismissed_at', '<', $cutoff)
            ->delete();

        $this->info("Deleted {$deleted} membership offer dismissal(s) older than {$days} days.");

        return self::SUCCESS;
    }
}
