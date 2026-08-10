<?php

namespace App\Console\Commands;

use App\Models\NotificationLog;
use App\Models\Payment;
use App\Models\StripePaymentDetail;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Schema;

/**
 * Reports settled payments that produced no buyer receipt.
 *
 * This is the check that would have caught the bank-payment bug on its own: a
 * wish purchase settled, created its deliverable, and silently emailed nobody,
 * because the webhook's receipt dispatch was commented out. Nothing errored,
 * nothing was logged as a failure, and it was found only because a creator
 * happened to notice.
 *
 * Read-only. Exits non-zero when it finds anything, so it can be watched.
 */
class AuditMissingNotifications extends Command
{
    protected $signature = 'notifications:audit-missing
        {--days=7 : How far back to look}
        {--limit=50 : Most rows to name in the output}
        {--json : Machine-readable output}';

    protected $description = 'Find settled payments with no recorded buyer receipt';

    /** Payment statuses that mean money actually moved. */
    private const SETTLED = ['succeeded', 'review_hold'];

    public function handle(): int
    {
        $days = max(1, (int) $this->option('days'));
        $limit = max(1, (int) $this->option('limit'));

        // The table is created by a migration that may not have reached this
        // environment yet. This command is scheduled HOURLY, so without the
        // guard a pending migration would throw into the logs (and Sentry)
        // every hour, for a condition that is not a fault.
        if (! Schema::hasTable('notification_logs')) {
            $this->warn('Delivery logging is not set up on this database yet — nothing to audit.');

            return self::SUCCESS;
        }

        // Delivery logging only exists from the day it was switched on, so a
        // payment older than the first row cannot be judged. Reporting those
        // would bury the real findings under every historical purchase —
        // "we were not recording yet" is not the same as "nothing was sent".
        $loggingSince = NotificationLog::min('created_at');

        if (! $loggingSince) {
            $this->warn('No delivery logs recorded yet — nothing can be audited.');

            return self::SUCCESS;
        }

        $since = now()->subDays($days);
        $loggingSince = Carbon::parse($loggingSince);

        if ($loggingSince->gt($since)) {
            $since = $loggingSince;
            $this->line('Window shortened to when delivery logging began: '.$since->toDateTimeString());
        }

        $payments = Payment::query()
            ->whereIn('status', self::SETTLED)
            ->whereNotNull('stripe_session_id')
            ->where('created_at', '>=', $since)
            ->orderBy('id')
            ->get(['id', 'stripe_session_id', 'creator_id', 'amount', 'currency', 'created_at']);

        if ($payments->isEmpty()) {
            $this->info('No settled payments in the window.');

            return self::SUCCESS;
        }

        // One query for the whole window rather than one per payment.
        $sessionsWithEmail = NotificationLog::query()
            ->whereIn('stripe_session_id', $payments->pluck('stripe_session_id')->filter()->unique()->all())
            ->where('channel', NotificationLog::CHANNEL_EMAIL)
            ->whereIn('status', [NotificationLog::STATUS_SENT, NotificationLog::STATUS_QUEUED])
            ->pluck('stripe_session_id')
            ->unique()
            ->flip();

        $missing = $payments->filter(
            fn ($p) => ! isset($sessionsWithEmail[$p->stripe_session_id])
        )->values();

        // Two different faults wear the same symptom, and they need opposite
        // fixes. A receipt whose claim was taken WAS dispatched — so the job is
        // sitting in the queue and `queue:work` is not running. One with no
        // claim was never dispatched at all, which is a code path that does not
        // send. Reporting them as one number sends people to the wrong place.
        $dispatched = StripePaymentDetail::whereIn('session_id', $missing->pluck('stripe_session_id')->filter()->all())
            ->whereNotNull('receipt_claimed_at')
            ->pluck('session_id')
            ->flip();

        $stuck = $missing->filter(fn ($p) => isset($dispatched[$p->stripe_session_id]))->values();
        $neverSent = $missing->filter(fn ($p) => ! isset($dispatched[$p->stripe_session_id]))->values();

        if ($this->option('json')) {
            $this->line(json_encode([
                'window_start' => $since->toIso8601String(),
                'settled' => $payments->count(),
                'missing_receipt' => $missing->count(),
                'dispatched_but_not_sent' => $stuck->count(),
                'never_dispatched' => $neverSent->count(),
                'sessions' => $missing->take($limit)->pluck('stripe_session_id')->all(),
            ], JSON_PRETTY_PRINT));

            return $missing->isEmpty() ? self::SUCCESS : self::FAILURE;
        }

        if ($missing->isEmpty()) {
            $this->info("All {$payments->count()} settled payment(s) since {$since->toDateTimeString()} produced a receipt.");

            return self::SUCCESS;
        }

        $this->error("{$missing->count()} of {$payments->count()} settled payment(s) have NO recorded buyer receipt:");

        if ($stuck->isNotEmpty()) {
            $this->warn("  {$stuck->count()} were DISPATCHED but never sent — the queue worker is not running (check `queue:work` and failed_jobs).");
        }

        if ($neverSent->isNotEmpty()) {
            $this->warn("  {$neverSent->count()} were NEVER DISPATCHED — a fulfilment path is not sending at all.");
        }

        $this->table(
            ['Payment', 'Session', 'Creator', 'Amount', 'When'],
            $missing->take($limit)->map(fn ($p) => [
                $p->id,
                $p->stripe_session_id,
                $p->creator_id,
                $p->amount.' '.strtoupper((string) $p->currency),
                (string) $p->created_at,
            ])->all(),
        );

        if ($missing->count() > $limit) {
            $this->line('… and '.($missing->count() - $limit).' more (raise --limit to see them).');
        }

        return self::FAILURE;
    }
}
