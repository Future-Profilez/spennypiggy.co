<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Mail\PayoutInitiated;
use App\Models\EngagementNotification;
use App\Models\PayoutRecord;
use App\Models\User;
use App\Services\NotificationDispatcher;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

/**
 * Send the "your payout is on the way" email for payouts that already went out
 * without one.
 *
 * WHY THIS EXISTS: `PayoutInitiated` is sent by the WEBSITE's PayoutService, in
 * `executePayouts()`. A payout executed from the ADMIN panel
 * (`/finance/payout/execute`) runs the admin app's OWN copy of PayoutService,
 * and that copy only pushes a notification — it sends no email at all. So every
 * manually-executed run leaves creators with money in flight and nothing in
 * their inbox. This is the repair, and it is a repair only: the real fix is for
 * the admin app to send the same mail.
 *
 * Idempotent. The claim is taken BEFORE the send and released if the send fails,
 * so re-running is safe and a transient SMTP failure is not silently swallowed.
 */
class SendPayoutInitiatedMails extends Command
{
    protected $signature = 'payout:send-initiated-mails
        {--date= : Payout records created on this date (Y-m-d). Defaults to today.}
        {--run= : Only records belonging to this payout run id}
        {--creator= : Only this creator (uuid)}
        {--max=0 : Stop after this many emails (0 = no limit)}
        {--dry-run : List who would be emailed without sending anything}';

    protected $description = 'Send the payout-initiated email for payouts that were executed without one';

    /**
     * The dedup namespace. One claim per payout record, so a creator paid twice
     * in one day is told twice — which is correct, they were paid twice.
     */
    private const NOTIFICATION_TYPE = 'payout_initiated_backfill';

    /**
     * A payout that failed or was cancelled must never produce "your payout is
     * on the way". Only states where the money is genuinely moving qualify.
     */
    private const SENDABLE_STATUSES = ['in_transit', 'paid', 'pending'];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = (int) $this->option('max');

        $date = $this->option('date') ?: now()->toDateString();

        $query = PayoutRecord::query()
            ->whereIn('status', self::SENDABLE_STATUSES)
            ->when($this->option('run'), fn ($q, $run) => $q->where('payout_run_id', $run))
            ->when($this->option('creator'), fn ($q, $c) => $q->where('creator_id', $c))
            ->when(! $this->option('run'), fn ($q) => $q->whereDate('created_at', $date))
            ->orderBy('id');

        $records = $query->get();

        if ($records->isEmpty()) {
            $this->warn('No payout records found for '.($this->option('run') ? 'run '.$this->option('run') : $date).'.');

            return self::SUCCESS;
        }

        $this->info($records->count().' payout record(s) found.');

        // One lookup for the whole set rather than a query per record.
        $creators = User::whereIn('uuid', $records->pluck('creator_id')->filter()->unique())
            ->get()
            ->keyBy('uuid');

        $sent = 0;
        $skipped = 0;
        $failed = 0;
        $rows = [];

        foreach ($records as $record) {
            if ($max > 0 && $sent >= $max) {
                $this->warn("Reached --max={$max}. ".($records->count() - $sent - $skipped - $failed).' record(s) left — re-run to continue.');
                break;
            }

            $creator = $creators->get($record->creator_id);

            // A bonus payout has its own email (FounderBonusPayoutInitiated /
            // FastStartBonusPayoutInitiated). Sending the standard one on top
            // would tell the creator about the same money twice.
            $bonusType = (string) ($record->metadata['bonus_type'] ?? '');

            if (! $creator || ! $creator->email || $bonusType !== '') {
                $skipped++;
                $rows[] = [$record->id, $creator->name ?? '—', '—', 'skipped', $bonusType !== '' ? 'bonus payout ('.$bonusType.')' : 'no creator or no email'];

                continue;
            }

            $currency = strtoupper($record->currency ?: 'GBP');
            $amountMajor = Helpers::toMajorUnits((int) $record->amount_minor, $currency);

            if ($dryRun) {
                $rows[] = [$record->id, $creator->name, $creator->email, 'would send', $currency.' '.number_format($amountMajor, 2)];
                $sent++;

                continue;
            }

            // Claim BEFORE sending. The claim IS the insert, so two workers
            // cannot both win and a re-run cannot double-mail.
            if (! NotificationDispatcher::claim($creator->id, self::NOTIFICATION_TYPE, 'payout_record:'.$record->id)) {
                $skipped++;
                $rows[] = [$record->id, $creator->name, $creator->email, 'skipped', 'already emailed'];

                continue;
            }

            try {
                Mail::to($creator->email)->send(new PayoutInitiated(
                    creator: $creator,
                    amount: (float) $amountMajor,
                    currency: $currency,
                    sentAt: optional($record->created_at)->format('d M Y') ?? now()->format('d M Y'),
                    destination: $creator->account_id ? 'Connected account '.$creator->account_id : null,
                    reference: $record->stripe_payout_id,
                    arrivalDate: optional($record->arrival_date)->format('d M Y'),
                ));

                $sent++;
                $rows[] = [$record->id, $creator->name, $creator->email, 'sent', $currency.' '.number_format($amountMajor, 2)];
            } catch (\Throwable $e) {
                // Release the claim, or a transient SMTP blip means this creator
                // is never told about their payout by any later run.
                EngagementNotification::where('user_id', $creator->id)
                    ->where('type', self::NOTIFICATION_TYPE)
                    ->where('dedup_key', 'payout_record:'.$record->id)
                    ->delete();

                $failed++;
                $rows[] = [$record->id, $creator->name, $creator->email, 'FAILED', $e->getMessage()];

                Log::error('payout:send-initiated-mails — send failed', [
                    'payout_record_id' => $record->id,
                    'creator_id' => $record->creator_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $this->table(['Record', 'Creator', 'Email', 'Result', 'Detail'], $rows);

        if ($dryRun) {
            $this->warn("DRY RUN — nothing was sent. {$sent} email(s) would go out, {$skipped} skipped.");

            return self::SUCCESS;
        }

        $this->info("Sent: {$sent} · Skipped: {$skipped} · Failed: {$failed}");

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }
}
