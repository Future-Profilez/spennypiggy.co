<?php

namespace App\Console\Commands;

use App\Mail\AbandonedCheckoutReminder;
use App\Models\AbandonedCheckout;
use App\Services\AbandonedCheckoutService;
use App\Services\NotificationDispatcher;
use App\Services\RewardService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Chases checkouts the supporter opened but never paid.
 *
 * Runs HOURLY, not daily: the first reminder is worth most about an hour after the
 * tab was closed, and a Stripe Checkout session only lives ~24 hours, so a daily pass
 * would send most reminders to a dead link.
 *
 * Ordering matters — this must run AFTER `payments:sweep-stuck`. The sweep replays
 * fulfilment for payments whose webhook was dropped; running this first would chase
 * supporters who had actually paid.
 *
 * Registered supporters get bell + email (no push — a push about an unfinished
 * purchase reads as pressure). Guests get a single email and are never contacted again.
 */
class RecoverAbandonedCheckouts extends Command
{
    protected $signature = 'checkout:recover
        {--max=200 : Maximum rows to consider in one run}
        {--dry-run : Report only, send nothing, claim nothing}';

    protected $description = 'Remind supporters who opened a checkout and never completed it';

    /** Minimal symbol map for the amount line. Unknown codes fall back to the ISO code. */
    private const SYMBOLS = ['gbp' => '£', 'usd' => '$', 'eur' => '€', 'aud' => 'A$', 'cad' => 'C$', 'inr' => '₹', 'jpy' => '¥'];

    /** Stripe's zero-decimal currencies: the amount is already in whole units. */
    private const ZERO_DECIMAL = ['jpy', 'krw', 'vnd', 'clp', 'isk', 'ugx', 'xaf', 'xof', 'xpf', 'bif', 'djf', 'gnf', 'kmf', 'mga', 'pyg', 'rwf', 'vuv'];

    public function handle(AbandonedCheckoutService $service): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $rows = $service->dueForReminder($max);

        if ($rows->isEmpty()) {
            $this->info('No abandoned checkouts due for a reminder.');

            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;
        $closed = 0;

        foreach ($rows as $row) {
            $reason = null;

            if (! $service->isStillRecoverable($row, $reason)) {
                if ($reason) {
                    // A settled, expired or withdrawn checkout is not coming back —
                    // close it so it stops being re-examined every hour.
                    AbandonedCheckoutService::markClosed($row->session_id, $reason);
                    $closed++;
                } else {
                    // No reason means "not now" (bank debit in flight, or a transient
                    // lookup failure). Leave it open and try again next run.
                    $skipped++;
                }

                continue;
            }

            $user = $row->user;

            // An admin/automated send is not an override: the supporter's own preference
            // decides. A guest has no preference row, and gets exactly one email.
            if ($user && ! ($user->abandoned_checkout_emails_enabled ?? true)) {
                AbandonedCheckoutService::markClosed($row->session_id, 'opted_out');
                $closed++;

                continue;
            }

            // A guest has no preference column — their opt-out is the marker the
            // unsubscribe link left on a previous checkout from the same address.
            if (! $user && $service->isSuppressed($row->guest_email)) {
                AbandonedCheckoutService::markClosed($row->session_id, 'opted_out');
                $closed++;

                continue;
            }

            $email = $row->recipientEmail();
            $reminderNumber = (int) $row->reminder_count + 1;

            if ($dryRun) {
                $this->line(sprintf(
                    '[dry-run] #%d %s → %s (reminder %d) %s',
                    $row->id,
                    $row->product_type,
                    $email,
                    $reminderNumber,
                    $this->amountLabel($row) ?? ''
                ));
                $sent++;

                continue;
            }

            // Atomic claim. Only one worker can move reminder_count from N to N+1, so a
            // concurrent run (or an overlapping schedule tick) cannot double-send.
            $previousCount = (int) $row->reminder_count;
            if (! $service->claimReminder($row)) {
                $skipped++;

                continue;
            }

            try {
                $this->deliver($service, $row, $reminderNumber);
                $sent++;
            } catch (\Throwable $e) {
                // Hand the reminder back so the next run can retry it.
                $service->releaseReminder($row, $previousCount);
                $skipped++;

                Log::error('checkout:recover — failed to send reminder', [
                    'abandoned_checkout_id' => $row->id,
                    'session_id' => $row->session_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $pruned = $service->prune(null, $dryRun);

        $this->info(sprintf(
            '%sChecked %d · reminded %d · skipped %d · closed %d · pruned %d',
            $dryRun ? '[dry-run] ' : '',
            $rows->count(),
            $sent,
            $skipped,
            $closed,
            $pruned
        ));

        return self::SUCCESS;
    }

    /** Bell + email for an account holder, email only for a guest. */
    private function deliver(AbandonedCheckoutService $service, AbandonedCheckout $row, int $reminderNumber): void
    {
        $creator = $row->creator;
        $creatorName = $creator->name ?: ($creator->username ?? 'the creator');
        $item = $service->itemFor($row);

        $mailArgs = [
            'checkoutUrl' => (string) $row->checkout_url,
            'creatorName' => $creatorName,
            'creatorUsername' => $creator->username ?? null,
            'itemTitle' => $this->itemTitle($item),
            // Reward HEADLINE only. The body is the paid content and never leaves the platform.
            'rewardTitle' => $this->rewardTitle($item),
            'amountLabel' => $this->amountLabel($row),
            'userId' => $row->user_id,
            'reminderNumber' => $reminderNumber,
            'firstName' => $row->user?->name ?? null,
            // Carries the guest's signed opt-out link. Ignored for account holders,
            // who unsubscribe by preference column instead.
            'abandonedCheckoutId' => $row->id,
        ];

        // Only take the account-holder path when that account can actually receive mail.
        // `recipientEmail()` falls back to guest_email, so a row whose user row has no
        // address would otherwise pass the recipient check and then send to nobody.
        $user = $row->user && $row->user->email ? $row->user : null;

        if ($user) {
            NotificationDispatcher::queue(
                $user,
                'abandoned_checkout',
                [
                    'title' => $reminderNumber >= 2 ? 'Your checkout link expires soon' : 'You did not finish your purchase',
                    'body' => "Your purchase from {$creatorName} is still waiting. Nothing has been charged.",
                    'url' => (string) $row->checkout_url,
                    'module' => 'checkout',
                    'mailable' => AbandonedCheckoutReminder::class,
                    'mailable_args' => $mailArgs,
                ],
                // No push: an unfinished purchase is not worth a phone buzz.
                [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_EMAIL],
                // Transactional-adjacent: it is about a purchase the supporter started.
                // Their category preference was already checked above.
                false
            );

            return;
        }

        Mail::to($row->guest_email)->send(new AbandonedCheckoutReminder(...$mailArgs));
    }

    /** The listing's own name, whichever column the module happens to use. */
    private function itemTitle($item): ?string
    {
        if (! $item) {
            return null;
        }

        foreach (['wishname', 'name', 'title'] as $column) {
            $value = trim((string) ($item->{$column} ?? ''));

            if ($value !== '') {
                return $value;
            }
        }

        return null;
    }

    private function rewardTitle($item): ?string
    {
        if (! $item) {
            return null;
        }

        try {
            return RewardService::for($item)['title'] ?? null;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function amountLabel(AbandonedCheckout $row): ?string
    {
        if ((int) $row->amount_minor <= 0) {
            return null;
        }

        $currency = strtolower((string) $row->currency);
        $symbol = self::SYMBOLS[$currency] ?? (strtoupper($currency).' ');

        // Zero-decimal currencies have no minor unit — dividing by 100 would print
        // ¥5,000 as ¥50.00.
        if (in_array($currency, self::ZERO_DECIMAL, true)) {
            return $symbol.number_format($row->amount_minor);
        }

        return $symbol.number_format($row->amount_minor / 100, 2);
    }
}
