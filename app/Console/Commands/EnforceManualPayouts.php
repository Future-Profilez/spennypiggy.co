<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class EnforceManualPayouts extends Command
{
    protected $signature = 'payout:enforce-manual {--limit=500}';

    protected $description = 'Ensure all connected accounts are set to manual payouts';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');

        $users = User::query()
            ->whereNotNull('account_id')
            ->limit($limit)
            ->get(['id', 'uuid', 'account_id', 'email', 'username']);

        $updated = 0;
        $checked = 0;

        foreach ($users as $user) {
            $checked++;
            try {
                if (StripeControl::ensureManualPayoutSchedule((string) $user->account_id)) {
                    $updated++;
                }
            } catch (\Throwable $e) {
                Log::warning('Failed to enforce manual payouts for connected account', [
                    'user_id' => $user->id,
                    'uuid' => $user->uuid,
                    'account_id' => $user->account_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->info("Checked: {$checked}. Updated: {$updated}.");
        return 0;
    }
}

