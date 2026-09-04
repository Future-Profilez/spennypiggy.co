<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use App\Support\StripeChargesFlag;
use Illuminate\Console\Command;

/**
 * Fill in `users.charges_enabled` from the connected accounts themselves.
 *
 * 🚨 THE WEBHOOK ONLY MOVES THE COLUMN WHEN STRIPE NEXT CHANGES SOMETHING.
 * `StripeChargesFlag` is now wired into `account.updated` and the Connect
 * return, so from here the column stays right — but every account that
 * connected before that shipped sits at the migration default of 0, and the
 * admin console renders a red "Stripe charges disabled" alert from it. Without
 * this backfill those creators keep carrying that accusation until Stripe
 * happens to send an event about them, which for a healthy account may be
 * months.
 *
 * ⚠️ One `accounts->retrieve` per creator, so run it deliberately rather than
 * on a schedule. `--dry-run` first.
 */
class SyncChargesEnabled extends Command
{
    protected $signature = 'stripe:sync-charges-enabled {--dry-run} {--user=} {--limit=}';

    protected $description = 'Read charges_enabled from Stripe for connected creators and record it locally';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $query = User::query()
            ->where('account_id', 'like', 'acct_%')
            ->orderBy('id');

        if ($this->option('user')) {
            $query->where(function ($q) {
                $q->where('username', $this->option('user'))
                    ->orWhere('uuid', $this->option('user'))
                    ->orWhere('id', $this->option('user'));
            });
        }

        if ($this->option('limit')) {
            $query->limit(max(1, (int) $this->option('limit')));
        }

        $changed = 0;
        $checked = 0;
        $failed = 0;

        foreach ($query->cursor() as $user) {
            $checked++;

            try {
                $account = StripeControl::getAccount($user->account_id);
            } catch (\Throwable $e) {
                /*
                 * A creator Stripe cannot be asked about is REPORTED and skipped,
                 * never guessed at. Writing 0 here would say "this creator cannot
                 * sell" on the strength of a connection error.
                 */
                $failed++;
                $this->warn(sprintf('  ? @%s (#%d) — %s', $user->username ?? '—', $user->id, $e->getMessage()));

                continue;
            }

            $enabled = ($account->charges_enabled ?? false) ? 1 : 0;

            if ((int) $user->charges_enabled === $enabled) {
                continue;
            }

            $this->line(sprintf(
                '  %s @%s (#%d) %d → %d',
                $dry ? 'would update' : 'updating',
                $user->username ?? '—',
                $user->id,
                (int) $user->charges_enabled,
                $enabled
            ));

            if (! $dry) {
                StripeChargesFlag::sync($user, $account);
            }

            $changed++;
        }

        $this->newLine();
        $this->info(sprintf(
            'Checked %d account(s). %s %d. Unreachable: %d.',
            $checked,
            $dry ? 'Would update' : 'Updated',
            $changed,
            $failed
        ));

        if ($dry && $changed > 0) {
            $this->comment('Re-run without --dry-run to write the changes.');
        }

        return self::SUCCESS;
    }
}
