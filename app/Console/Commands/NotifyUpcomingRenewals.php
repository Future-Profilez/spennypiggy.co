<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Pre-renewal heads-up: notify a supporter a few days before a recurring
 * Bill / Membership subscription auto-renews, so a charge never surprises them.
 * The existing flow only mails AFTER the charge (SendRenewMail on webhook); this
 * fills the "warn me first" gap surfaced on the My Purchases hub.
 *
 * Dedup: each row stores `renewal_reminded_for` = the upcoming_payment it was last
 * reminded about, so each renewal window fires exactly one reminder. When the
 * subscription renews, upcoming_payment advances and the next window reminds again.
 */
class NotifyUpcomingRenewals extends Command
{
    protected $signature = 'renewals:notify {--days=3 : Remind when renewal is within this many days} {--dry-run : Log only, send nothing}';
    protected $description = 'Notify supporters before a recurring subscription auto-renews';

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $dry = (bool) $this->option('dry-run');
        $now = Carbon::now();
        $until = (clone $now)->addDays($days);

        $sent = 0;

        $sent += $this->process(
            $this->dueQuery(BillPayment::with(['bill.user', 'user']), $now, $until)->get(),
            fn ($p) => [
                'creator' => $p->bill?->user,
                'title'   => $p->bill?->name ?: 'your subscription',
            ],
            $dry
        );

        $sent += $this->process(
            $this->dueQuery(MembershipPayment::with(['membership.user', 'user']), $now, $until)->get(),
            fn ($p) => [
                'creator' => $p->membership?->user,
                'title'   => $p->membership?->level ? ($p->membership->level . ' membership') : 'your membership',
            ],
            $dry
        );

        $this->info(($dry ? '[dry-run] ' : '') . "Renewal reminders: {$sent}");

        return self::SUCCESS;
    }

    /** Active recurring rows renewing inside the window, not yet reminded for this cycle. */
    private function dueQuery($query, Carbon $now, Carbon $until)
    {
        return $query
            ->where('status', 'paid')
            ->where('recurring_for', 'continue')
            ->whereNotNull('stripe_id')
            ->whereNotNull('upcoming_payment')
            ->whereBetween('upcoming_payment', [$now, $until])
            ->where(function ($q) use ($now) {
                $q->whereNull('end')->orWhere('end', '>=', $now);
            });
    }

    private function process($rows, callable $resolve, bool $dry): int
    {
        $sent = 0;

        foreach ($rows as $p) {
            // Already reminded for this exact renewal date?
            if ($p->renewal_reminded_for && Carbon::parse($p->renewal_reminded_for)->equalTo(Carbon::parse($p->upcoming_payment))) {
                continue;
            }

            $email = $p->user?->email ?: $p->guest_email;
            if (!$email) {
                continue;
            }

            $meta = $resolve($p);
            $when = Carbon::parse($p->upcoming_payment)->format('M j');
            $amount = strtoupper($p->currency ?: 'GBP') . ' ' . number_format((float) ($p->total_paid ?: $p->amount ?: 0), 2);
            $content = "{$meta['title']} renews on {$when} for {$amount}. Manage or cancel anytime in My Purchases.";

            if ($dry) {
                $this->line("  would remind {$email} — {$content}");
            } else {
                try {
                    Helpers::sendNotification('Subscription renews soon', $content, $email);
                } catch (\Throwable $e) {
                    Log::error('Renewal reminder push failed', ['email' => $email, 'error' => $e->getMessage()]);
                }
                $p->forceFill(['renewal_reminded_for' => $p->upcoming_payment])->save();
            }

            $sent++;
        }

        return $sent;
    }
}
