<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\PayoutEligibility;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * Who is being paid on the grandfather window rather than on a real sign-off?
 *
 * 🚨 THIS IS THE COMMAND THAT LETS THE WINDOW BE CLOSED. `config/payout_identity.php`
 * grandfathers every creator verified before a cutoff, because until 4 Sep 2026 a Stripe
 * pass auto-wrote the admin sign-off and everyone verified between then and 10 Sep sits
 * at admin-pending through no fault of their own. Without that date they would have
 * stopped being paid on the next Friday run.
 *
 * It is a bounded, shrinking set and it is meant to go. This lists it by name so an
 * admin can work the queue; once it is empty, set `grandfather_verified_before` to null
 * and the gate is whole. Left set for ever it is a window of creators nobody checked.
 *
 * ⚠️ READ ONLY. It changes nothing and never will — a command that quietly signed people
 * off would be doing the exact thing the sign-off exists to prevent.
 */
class IdentitySignoffBacklog extends Command
{
    protected $signature = 'identity:signoff-backlog {--all : Include creators who are correctly blocked, not just the grandfathered}';

    protected $description = 'List creators being paid on the identity grandfather window, so the window can be closed';

    public function handle(): int
    {
        $cutoff = config('payout_identity.grandfather_verified_before');

        if (blank($cutoff)) {
            $this->info('No grandfather window is configured — every creator needs a real sign-off. Nothing to report.');

            return self::SUCCESS;
        }

        $this->line('Grandfather cutoff: <comment>'.$cutoff.'</comment>');
        $this->newLine();

        $creators = User::query()
            ->where('role', 1)
            ->where('identity_status', PayoutEligibility::IDENTITY_VERIFIED)
            ->whereNull('deleted_at')
            ->orderBy('identity_verified_at')
            ->get(['id', 'uuid', 'username', 'email', 'identity_status', 'identity_admin_status', 'identity_verified_at']);

        $grandfathered = [];
        $blocked = [];

        foreach ($creators as $creator) {
            if ((int) ($creator->identity_admin_status ?? 0) === PayoutEligibility::ADMIN_APPROVED) {
                continue;
            }

            $row = [
                $creator->id,
                $creator->username ?: '—',
                $creator->identity_verified_at
                    ? Carbon::parse($creator->identity_verified_at)->toDateString()
                    : '—',
                $creator->identity_verified_at
                    ? Carbon::parse($creator->identity_verified_at)->diffInDays(now()).' days'
                    : '—',
            ];

            if (PayoutEligibility::isGrandfathered($creator)) {
                $grandfathered[] = $row;
            } else {
                $blocked[] = $row;
            }
        }

        $headers = ['ID', 'Username', 'Verified', 'Age'];

        $this->line('<options=bold>Being paid WITHOUT a sign-off (the window):</>');

        if ($grandfathered === []) {
            $this->info('  None. 🎉 Set `grandfather_verified_before` to null and the gate is whole.');
        } else {
            $this->table($headers, $grandfathered);
            $this->warn(sprintf(
                '  %d creator(s) are being paid on the date alone. Sign these off, then clear the config value.',
                count($grandfathered)
            ));
        }

        if ($this->option('all')) {
            $this->newLine();
            $this->line('<options=bold>Correctly blocked (Stripe passed, awaiting a person):</>');

            if ($blocked === []) {
                $this->info('  None.');
            } else {
                $this->table($headers, $blocked);
                // 🚨 These are creators who cannot be paid. An old row here is not a
                // queue item, it is somebody waiting on us for their money.
                $this->warn(sprintf('  %d creator(s) cannot be paid until somebody looks.', count($blocked)));
            }
        }

        return self::SUCCESS;
    }
}
