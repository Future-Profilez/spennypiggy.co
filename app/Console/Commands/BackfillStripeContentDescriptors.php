<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;

class BackfillStripeContentDescriptors extends Command
{
    protected $signature = 'stripe:backfill-descriptors {--dry-run} {--limit=0}';

    protected $description = 'Set connected accounts\' default statement descriptor to "<USERNAME> CONTENT" and business name to the creator (merchant of record).';

    public function handle(): int
    {
        $limit = (int) $this->option('limit');
        $dryRun = (bool) $this->option('dry-run');

        $query = User::query()
            ->whereNotNull('account_id')
            ->where('stripe_details_submitted', 1)
            ->whereNotNull('username')
            ->orderBy('id');

        if ($limit > 0) {
            $query->limit($limit);
        }

        $users = $query->get(['id', 'name', 'username', 'account_id']);

        $updated = 0;
        $failed = 0;

        foreach ($users as $user) {
            $descriptor = StripeControl::buildContentDescriptor($user->username);

            if ($dryRun) {
                $this->line($user->id.' '.$user->account_id.' descriptor='.$descriptor);

                continue;
            }

            try {
                StripeControl::updateAccount($user->account_id, [
                    'settings' => ['payments' => ['statement_descriptor' => $descriptor]],
                    'business_profile' => ['name' => $user->name ?: $user->username],
                ]);
                $updated++;
            } catch (\Throwable $e) {
                $failed++;
                $this->warn('Failed '.$user->id.' ('.$user->account_id.'): '.$e->getMessage());
            }
        }

        $this->info('Matched users: '.$users->count());
        $this->info('Updated: '.$updated);
        $this->info('Failed: '.$failed);

        return self::SUCCESS;
    }
}
