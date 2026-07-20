<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;

/**
 * Backfill: request Pay by Bank / SEPA / ACH capabilities on existing connected
 * accounts.
 *
 * Stripe's dashboard "on by default" setting only reaches accounts with Stripe
 * Dashboard access — Express/Custom connected accounts need the capability
 * requested via the API. Without it, checkout refuses bank with
 * "Bank payment is not available for this creator yet".
 *
 * New accounts get these at onboarding (StripeController); this covers creators
 * who connected before that change.
 */
class RequestBankCapabilities extends Command
{
    protected $signature = 'stripe:request-bank-capabilities
                            {--dry-run : List what would be requested, change nothing}
                            {--user= : Only this user id or username}';

    protected $description = 'Request bank payment capabilities (Pay by Bank / SEPA / ACH) on connected accounts';

    public function handle(): int
    {
        $query = User::whereNotNull('account_id')->where('account_id', '!=', '');

        if ($only = $this->option('user')) {
            $query->where(function ($q) use ($only) {
                $q->where('id', $only)->orWhere('username', $only);
            });
        }

        $creators = $query->get(['id', 'username', 'account_id', 'country']);

        if ($creators->isEmpty()) {
            $this->warn('No connected accounts found.');

            return self::SUCCESS;
        }

        $this->info("Checking {$creators->count()} connected account(s)…");
        $requested = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($creators as $creator) {
            try {
                StripeControl::setClient();
                $account = StripeControl::getClient()->accounts->retrieve($creator->account_id);
            } catch (\Throwable $e) {
                $this->line("  <fg=red>✗</> {$creator->username}: cannot retrieve account — ".$e->getMessage());
                $failed++;

                continue;
            }

            $country = $account->country ?? $creator->country;
            $wanted = StripeControl::bankCapabilitiesForCountry($country);

            if (empty($wanted)) {
                $this->line("  <fg=gray>–</> {$creator->username} ({$country}): no bank method supported for this country");
                $skipped++;

                continue;
            }

            $current = StripeControl::capabilitiesMap($account);
            $missing = array_values(array_filter($wanted, fn ($c) => ($current[$c] ?? null) !== 'active'));

            if (empty($missing)) {
                $this->line("  <fg=green>✓</> {$creator->username} ({$country}): already active — ".implode(', ', $wanted));
                $skipped++;

                continue;
            }

            if ($this->option('dry-run')) {
                $this->line("  <fg=yellow>→</> {$creator->username} ({$country}): would request ".implode(', ', $missing));
                $requested++;

                continue;
            }

            $granted = StripeControl::requestBankCapabilities($creator->account_id, $country);

            if (empty($granted)) {
                $this->line("  <fg=red>✗</> {$creator->username} ({$country}): request failed (see logs)");
                $failed++;

                continue;
            }

            $this->line("  <fg=green>✓</> {$creator->username} ({$country}): requested ".implode(', ', $granted));
            $requested++;
        }

        $this->newLine();
        $this->info("Done. requested={$requested} skipped={$skipped} failed={$failed}");
        $this->line('Capabilities may sit in "pending" until the creator completes Stripe onboarding.');

        return self::SUCCESS;
    }
}
