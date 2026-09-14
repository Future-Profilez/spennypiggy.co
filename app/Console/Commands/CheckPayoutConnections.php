<?php

namespace App\Console\Commands;

use App\Mail\PayoutConnectionLost;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\StripeControl;
use App\Support\UserFlagger;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Find the creators Stripe will not let us reach, and tell somebody.
 *
 * 🚨 THE GAP THIS CLOSES. `StripeControl::ensureManualPayoutSchedule()` already
 * detects an unreachable connected account and logs it at ERROR once per
 * account per 24 hours. That is correct and it is not enough: the log line
 * carries an `acct_…` and no person, nothing on any screen says it, and the
 * creator — the only party who can put it back — is never told. Measured on
 * production 12 Sep 2026: TWO creators unreachable since at least 26 August,
 * earning and unable to be paid, with no record anywhere a human reads.
 *
 * ⚠️ THIS MOVES NO MONEY AND REFUSES NOTHING. It raises a flag an admin can see
 * and sends the creator one notice. The payout run's own behaviour is unchanged
 * — a transfer to an unreachable account already fails on its own.
 *
 * ⚠️ One `accounts->retrieve` per connected creator, so it is weekly, not
 * hourly. `--dry-run` reports without writing or sending.
 *
 * **Needs `queue:work`** — the notice is queued, so with no worker the flag is
 * raised and the creator hears nothing.
 */
class CheckPayoutConnections extends Command
{
    protected $signature = 'payouts:check-connections {--dry-run} {--user=} {--limit=}';

    protected $description = 'Find connected accounts Stripe refuses, flag them for an admin and tell the creator';

    /** Notification type, and the dedup namespace inside the dispatcher. */
    private const TYPE = 'payout_connection_lost';

    public function handle(): int
    {
        $dry = (bool) $this->option('dry-run');

        $query = User::query()
            ->where('account_id', 'like', 'acct_%')
            ->whereNull('deleted_at')
            ->orderBy('id');

        if ($user = $this->option('user')) {
            $query->where(fn ($q) => $q->where('username', $user)->orWhere('uuid', $user)->orWhere('id', $user));
        }

        if ($limit = $this->option('limit')) {
            $query->limit(max(1, (int) $limit));
        }

        $checked = 0;
        $lost = 0;
        $told = 0;

        foreach ($query->cursor() as $creator) {
            $checked++;

            try {
                StripeControl::getAccount($creator->account_id);

                continue;
            } catch (\Throwable $e) {
                /*
                 * 🚨 ONLY A PERMANENT REFUSAL COUNTS. A network blip, a rate
                 * limit or a Stripe outage is a failure of THIS run, not a fact
                 * about the account — telling a creator to reconnect because our
                 * request timed out sends them to undo something that is fine.
                 * The classifier is Stripe's own, shared with the sweep that
                 * already logs this.
                 */
                if (! StripeControl::accountIsUnreachable($e)) {
                    $this->warn(sprintf('  ? @%s (#%d) — not conclusive: %s', $creator->username ?? '—', $creator->id, $e->getMessage()));

                    continue;
                }
            }

            $lost++;
            $this->line(sprintf(
                '  %s @%s (#%d) — %s',
                $dry ? 'would flag' : 'flagging',
                $creator->username ?? '—',
                $creator->id,
                $creator->account_id
            ));

            if ($dry) {
                continue;
            }

            /*
             * ⚠️ The flag first: it is the durable record and it never throws.
             * The notice can fail (a bad address, a dead provider) and the
             * account must still appear in `/user-flags` when it does.
             */
            UserFlagger::raise(
                $creator,
                'payout_connection_lost',
                'Stripe refuses this connected account to our key — no payout can succeed until the creator reconnects.',
                ['account_id' => $creator->account_id],
                'payout_connection_check',
            );

            if ($this->tell($creator)) {
                $told++;
            }
        }

        $this->info(sprintf(
            '%sChecked %d. Unreachable: %d. Creators told: %d.',
            $dry ? 'Dry run. ' : '',
            $checked,
            $lost,
            $told
        ));

        return self::SUCCESS;
    }

    /**
     * 🚨 CLAIMED ON THE ACCOUNT ID, NOT THE DAY. The check is weekly and the
     * condition persists until the creator acts, so a per-run claim would mail
     * the same person every week for ever. Keying on the account means a creator
     * who reconnects and later loses a DIFFERENT account is told again.
     *
     * ⚠️ The claim is taken BEFORE the queue push and given back on failure —
     * the house rule. Claiming afterwards leaves a window in which a crash loses
     * the notice permanently.
     *
     * ⚠️ `$marketing = false`: this says the platform cannot pay them money they
     * have already earned, and no opt-out may silence it.
     */
    private function tell(User $creator): bool
    {
        $key = 'account:'.$creator->account_id;

        if (! NotificationDispatcher::claim((int) $creator->id, self::TYPE, $key)) {
            return false;
        }

        try {
            NotificationDispatcher::queue(
                $creator,
                self::TYPE,
                [
                    'title' => 'Reconnect Stripe to receive your payouts',
                    'body' => 'Stripe is no longer letting us reach your payout account, so we cannot send you money you have earned. Everything else is working — only the payout is stopped.',
                    'module' => 'payouts',
                    'mailable' => PayoutConnectionLost::class,
                    'mailable_args' => [
                        'creatorName' => (string) ($creator->name ?? ''),
                        'reconnectUrl' => rtrim((string) config('app.url'), '/').'/stripe-connect',
                    ],
                ],
                NotificationDispatcher::ALL_CHANNELS,
                false,
            );

            return true;
        } catch (\Throwable $e) {
            NotificationDispatcher::releaseClaim((int) $creator->id, self::TYPE, $key);
            Log::warning('Could not queue the payout-connection notice', [
                'user_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
