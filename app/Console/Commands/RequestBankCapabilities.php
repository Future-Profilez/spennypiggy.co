<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Backfill: request Pay by Bank / SEPA / ACH capabilities on existing connected
 * accounts.
 *
 * Stripe's dashboard "on by default" setting only reaches accounts with Stripe
 * Dashboard access — Express/Custom connected accounts need the capability
 * requested via the API. Without it, checkout refuses bank with
 * "Bank payment is not available for this creator yet".
 *
 * New accounts get these at onboarding (StripeController), and every `account.updated`
 * tops them up (`StripeWebhookController::ensureBankCapabilities`) — that webhook reads
 * STRIPE'S OWN `account->country`, so it is immune to `users.country` being null.
 *
 * 🚨 SO WHY SCHEDULE THIS AT ALL? Because `account.updated` only fires when the account
 * CHANGES. A creator who connected before the self-heal shipped, and has changed nothing
 * since, never triggers it — measured on production 12 Sep 2026: 11 creators already
 * active, **17 never asked**. And a dropped webhook (Stripe retries for three days, then
 * stops) leaves that creator silently without the capability for ever. The symptom is a
 * SUPPORTER refused at checkout, which is the worst place to find out. Same reasoning as
 * `identity:reconcile` and `payments:sweep-stuck`: the webhook is the fast path, the
 * sweep is what makes it reliable.
 *
 * ⚠️ `--unchecked-only` + `--max` are what make it schedulable. Without them this
 * retrieves EVERY connected account on every run — one Stripe round trip per creator per
 * day, for a question whose answer almost never changes.
 */
class RequestBankCapabilities extends Command
{
    protected $signature = 'stripe:request-bank-capabilities
                            {--dry-run : List what would be requested, change nothing}
                            {--user= : Only this user id or username}
                            {--unchecked-only : Only accounts never confirmed before (the scheduled pass)}
                            {--max= : Stop after this many accounts}';

    protected $description = 'Request bank payment capabilities (Pay by Bank / SEPA / ACH) on connected accounts';

    public function handle(): int
    {
        $query = User::whereNotNull('account_id')->where('account_id', '!=', '');

        /*
         * ⚠️ The marker is only consulted for the SCHEDULED pass. A hand-run — with or
         * without --user — still examines everybody, because that is what somebody
         * reaches for when they want to know the real state rather than drain a backlog.
         */
        if ($this->option('unchecked-only')) {
            $query->whereNull('bank_capability_checked_at');
        }

        if ($max = (int) $this->option('max')) {
            $query->limit($max);
        }

        if ($only = $this->option('user')) {
            $query->where(function ($q) use ($only) {
                $q->where('id', $only)->orWhere('username', $only);
            });
        }

        $creators = $query->orderBy('id')->get(['id', 'username', 'account_id', 'country']);

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
                $this->markChecked($creator);
                $skipped++;

                continue;
            }

            /*
             * ⚠️ ASKED ALREADY, JUST NOT ACTIVE YET. `$missing` is everything not
             * `active`, so it also catches `pending` and `requested` — which Stripe and
             * the creator are finishing between them. Re-requesting does not move that,
             * so the marker is stamped and the scheduled pass stops asking; a hand-run
             * without --unchecked-only still reports the real status.
             */
            $awaited = array_values(array_filter($missing, fn ($c) => array_key_exists($c, $current)));

            if (count($awaited) === count($missing)) {
                $this->line("  <fg=gray>…</> {$creator->username} ({$country}): already requested, awaiting Stripe — ".implode(', ', $awaited));
                $this->markChecked($creator);
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
            $this->markChecked($creator);
            $requested++;
        }

        $this->newLine();
        $this->info("Done. requested={$requested} skipped={$skipped} failed={$failed}");
        $this->line('Capabilities may sit in "pending" until the creator completes Stripe onboarding.');

        return self::SUCCESS;
    }

    /**
     * Record that Stripe has been asked about this creator.
     *
     * 🚨 `DB::table`, NEVER `save()` OR `User::query()->update()`. Both stamp
     * `updated_at`, and that column keys the public profile cache AND orders the admin
     * creator-review queue — so a nightly sweep would expire every connected creator's
     * cache and reshuffle a reviewer's list, every night, for a bookkeeping write nobody
     * asked for. Same rule as `StripeChargesFlag::sync()` and the setup-celebration
     * marker.
     *
     * ⚠️ NOT stamped when the account could not be retrieved. That creator is the one
     * case that must come back on the next run: an unreachable account cannot be paid
     * out either, and writing the marker would hide it for good.
     */
    private function markChecked(User $creator): void
    {
        if ($this->option('dry-run')) {
            return;
        }

        DB::table('users')
            ->where('id', $creator->id)
            ->update(['bank_capability_checked_at' => now()]);
    }
}
