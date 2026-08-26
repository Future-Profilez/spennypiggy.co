<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use App\Support\StripeCurrencySync;
use Illuminate\Console\Command;

/**
 * Bring `users.default_currency` back into line with each connected account's
 * real `default_currency` on Stripe.
 *
 * 🚨 IT NEVER GUESSES. Every value is read off the live Stripe Account — the
 * country, the creator's own listings and the column's 'GBP' default are all
 * ignored. A creator Stripe cannot be asked about is REPORTED and skipped, never
 * defaulted.
 *
 * Run `--dry-run` first: this changes the currency supporters are charged in and
 * the currency payouts are issued in.
 */
class SyncStripeDefaultCurrencies extends Command
{
    protected $signature = 'stripe:sync-currencies {--dry-run} {--limit=0} {--user=}';

    protected $description = 'Sync users.default_currency from each connected Stripe account\'s real default_currency.';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $query = User::query()
            ->whereNotNull('account_id')
            ->where('account_id', 'like', 'acct_%')
            ->orderBy('id');

        if ($userId = $this->option('user')) {
            $query->whereKey($userId);
        }

        if ($limit > 0) {
            $query->limit($limit);
        }

        $users = $query->get(['id', 'username', 'account_id', 'default_currency', 'country']);

        $changed = 0;
        $matched = 0;
        $failed = 0;

        foreach ($users as $user) {
            try {
                $account = StripeControl::getAccount($user->account_id);
            } catch (\Throwable $e) {
                // A creator we cannot ask about keeps whatever they have. Reported,
                // never defaulted — a guessed currency is how this fault started.
                $failed++;
                $this->warn(sprintf('user %d (%s): could not read %s — %s', $user->id, $user->username, $user->account_id, $e->getMessage()));

                continue;
            }

            $stripeCurrency = strtoupper((string) ($account->default_currency ?? ''));
            $current = strtoupper((string) $user->default_currency);

            if ($stripeCurrency === '' || strlen($stripeCurrency) !== 3) {
                $failed++;
                $this->warn(sprintf('user %d (%s): Stripe reports no default_currency yet', $user->id, $user->username));

                continue;
            }

            if ($current === $stripeCurrency) {
                $matched++;

                continue;
            }

            $this->line(sprintf(
                '%s user %d (%s) %s: %s -> %s',
                $dryRun ? 'WOULD change' : 'changed',
                $user->id,
                $user->username,
                $user->account_id,
                $current !== '' ? $current : '(none)',
                $stripeCurrency
            ));

            if (! $dryRun) {
                StripeCurrencySync::apply($user, $account, 'stripe:sync-currencies');
            }

            $changed++;
        }

        $this->newLine();
        $this->info('Connected creators checked: '.$users->count());
        $this->info('Already correct: '.$matched);
        $this->info(($dryRun ? 'Would change: ' : 'Changed: ').$changed);
        $this->info('Could not read: '.$failed);

        if ($dryRun && $changed > 0) {
            $this->newLine();
            $this->warn('Dry run. Re-run without --dry-run to write these.');
            $this->warn('⚠️ This changes the charge currency at checkout and the payout currency. Existing');
            $this->warn('   listings keep their own `currency` column and are NOT re-priced by this command.');
        }

        return self::SUCCESS;
    }
}
