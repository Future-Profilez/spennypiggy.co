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
        // Chunk over EVERY connected account, not an unordered first-N slice. With a plain
        // limit(500) the same arbitrary 500 accounts were re-checked every 10 minutes forever
        // and every account past them kept Stripe's AUTOMATIC schedule — meaning Stripe swept
        // their whole balance, held reserves included, straight to their bank.
        $chunkSize = max(1, (int) $this->option('limit'));

        $updated = 0;
        $checked = 0;

        User::query()
            ->whereNotNull('account_id')
            ->select(['id', 'uuid', 'account_id', 'email', 'username'])
            ->chunkById($chunkSize, function ($users) use (&$updated, &$checked) {
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
            });

        $this->info("Checked: {$checked}. Updated: {$updated}.");

        return 0;
    }
}
