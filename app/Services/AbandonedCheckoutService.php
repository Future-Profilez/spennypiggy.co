<?php

namespace App\Services;

use App\Models\AbandonedCheckout;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Services\Analytics\MeasurementProtocol;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

/**
 * Abandoned checkout recovery.
 *
 * A supporter opens Stripe Checkout, the module writes its payment row, and then they
 * close the tab. Nothing followed up — the row simply went stale and the sale was lost.
 * This service records every checkout, decides which ones are still worth (and safe to)
 * chase, and closes them out when they settle.
 *
 * TWO RULES ABOVE ALL OTHERS:
 *
 *  1. **Recording must never break a checkout.** record() is called from the money path,
 *     so every entry point is wrapped and swallows its own errors. A lost recovery row
 *     costs one reminder; a thrown exception costs the sale.
 *
 *  2. **Never chase money that is already moving.** `processing` is a bank/SEPA/ACH debit
 *     in flight — the supporter HAS paid and is waiting on their bank. Telling them their
 *     purchase "didn't go through" is the single worst thing this feature could do, so the
 *     unpaid set below deliberately excludes it and every check fails CLOSED.
 */
class AbandonedCheckoutService
{
    /**
     * Statuses that mean "the supporter has not paid".
     *
     * NULL/'' are in here on purpose: several payment tables leave their status column
     * unset until the webhook lands, so a strict string comparison would treat a fresh
     * row as settled and never chase it.
     *
     * `processing` is NOT here — see rule 2 above.
     */
    public const UNPAID_STATUSES = [null, '', 'pending', 'initiated', 'unpaid', 'created', 'requires_payment'];

    /**
     * product_type => [payment model, session column, status column, item model, row created upfront?].
     *
     * Mirrors the table map in SweepStuckPayments — when a new one-off checkout is added,
     * it belongs in both.
     *
     * The last flag matters. Most modules write their payment row BEFORE redirecting to
     * Stripe, so a missing row means something went wrong and we must not chase it. Paid
     * Tasks are the exception: the TaskPurchase row is only created on fulfilment, so for
     * a task a MISSING row is positive proof the supporter never paid.
     */
    private const SOURCES = [
        'wish' => [StripePaymentDetail::class, 'session_id', 'payment_status', null, true],
        'wish_subscription' => [WishItemSubscription::class, 'session_id', 'status', WishItem::class, true],
        'shop' => [ShopPayment::class, 'session_id', 'payment_status', Shop::class, true],
        'task' => [TaskPurchase::class, 'stripe_session_id', 'status', Task::class, false],
        'piggy_pot' => [PiggyPotContribution::class, 'session_id', 'status', PiggyPot::class, true],
        'tip' => [TipGoalsPayment::class, 'session_id', 'status', null, true],
        'bill' => [BillPayment::class, 'session_id', 'status', Bills::class, true],
        'membership' => [MembershipPayment::class, 'session_id', 'status', Membership::class, true],
    ];

    /**
     * Minutes after abandonment at which each reminder is sent.
     *
     * Config-driven (`config/checkout_recovery.php`) so a local environment can run the
     * whole flow in two minutes instead of two hours — testing a 1h/20h schedule by
     * waiting is not testing it. Falls back to the production 1h + 20h if the config is
     * missing or empty, never to "no schedule", which would silently stop all reminders.
     *
     * @return array<int, int>
     */
    public static function schedule(): array
    {
        $minutes = (array) config('checkout_recovery.schedule_minutes', []);

        return empty($minutes) ? [60, 1200] : array_values($minutes);
    }

    /** A guest has no account and no consent record, so they get fewer reminders. */
    public static function guestMaxReminders(): int
    {
        return max(0, (int) config('checkout_recovery.guest_max_reminders', 1));
    }

    /** How long a closed row is kept before prune() deletes it. */
    public static function retentionDays(): int
    {
        return max(1, (int) config('checkout_recovery.retention_days', 180));
    }

    /**
     * Record a checkout session so it can be chased if it is never paid.
     *
     * Called from the checkout controllers immediately after the Stripe session is
     * created. NEVER throws — see rule 1.
     *
     * @param  object  $session  the Stripe Checkout Session
     */
    public static function record(
        $session,
        string $productType,
        ?User $creator,
        $itemId = null,
        ?int $userId = null,
        ?string $guestEmail = null,
        ?int $amountMinor = null,
        ?string $currency = null,
        ?string $feeProfile = null
    ): void {
        try {
            $sessionId = is_object($session) ? ($session->id ?? null) : (string) $session;

            if (empty($sessionId) || ! array_key_exists($productType, self::SOURCES)) {
                return;
            }

            // The session URL is the whole point of the reminder — without it there is
            // nothing to send the supporter back to, so do not record a row we cannot act on.
            $url = is_object($session) ? ($session->url ?? null) : null;
            if (empty($url)) {
                return;
            }

            $expiresAt = null;
            if (is_object($session) && ! empty($session->expires_at)) {
                $expiresAt = Carbon::createFromTimestamp((int) $session->expires_at);
            }

            $email = $guestEmail ?: null;
            if ($email && ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                $email = null;
            }

            // Resolved once, so the recovery row and the analytics event below
            // can never disagree about what this checkout was worth.
            $minor = max(0, (int) ($amountMinor ?? (is_object($session) ? ($session->amount_total ?? 0) : 0)));
            $iso = strtolower($currency ?: (is_object($session) ? ($session->currency ?? 'gbp') : 'gbp'));

            AbandonedCheckout::updateOrCreate(
                ['session_id' => $sessionId],
                [
                    'checkout_url' => $url,
                    'expires_at' => $expiresAt,
                    'product_type' => $productType,
                    'item_id' => $itemId !== null ? (string) $itemId : null,
                    'creator_id' => $creator?->id,
                    'user_id' => $userId,
                    'guest_email' => $email,
                    'amount_minor' => $minor,
                    'currency' => $iso,
                    'fee_profile' => $feeProfile,
                ]
            );
            // GA4 `begin_checkout` — the stage the whole funnel was blind at.
            //
            // Every one of the nine checkout paths calls this method right after
            // creating its Stripe session, which makes it the one place that
            // sees a checkout START. `purchase` alone gave a funnel that read
            // "visited → bought" with nothing in between, so the largest drop in
            // the business — started paying, did not finish — was unmeasurable.
            //
            // 🚨 Sent server-side, not flashed for the browser: the next thing
            // that happens is a redirect to Stripe, and the visitor who
            // abandons never comes back to render anything.
            MeasurementProtocol::send('begin_checkout', [
                'currency' => strtoupper($iso),
                'value' => round($minor / 100, 2),
                'product_type' => $productType,
                'guest' => $userId === null,
            ]);
        } catch (\Throwable $e) {
            // A recovery row is worth strictly less than the checkout it is attached to.
            Log::warning('AbandonedCheckout: failed to record', [
                'product_type' => $productType,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /** The supporter paid. Close the row so it can never be chased. Never throws. */
    public static function markRecovered(?string $sessionId): void
    {
        if (empty($sessionId)) {
            return;
        }

        try {
            AbandonedCheckout::where('session_id', $sessionId)
                ->whereNull('recovered_at')
                ->update([
                    'recovered_at' => now(),
                    'closed_at' => now(),
                    'closed_reason' => 'paid',
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('AbandonedCheckout: failed to mark recovered', [
                'session_id' => $sessionId, 'error' => $e->getMessage(),
            ]);
        }
    }

    /** Close without a sale (session expired, item withdrawn). Never throws. */
    public static function markClosed(?string $sessionId, string $reason): void
    {
        if (empty($sessionId)) {
            return;
        }

        try {
            AbandonedCheckout::where('session_id', $sessionId)
                ->whereNull('closed_at')
                ->update([
                    'closed_at' => now(),
                    'closed_reason' => $reason,
                    'updated_at' => now(),
                ]);
        } catch (\Throwable $e) {
            Log::warning('AbandonedCheckout: failed to close', [
                'session_id' => $sessionId, 'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Open rows whose next reminder is due.
     *
     * Due = enough hours have passed for the NEXT reminder in the schedule, and the row
     * has not already had every reminder it is entitled to.
     */
    public function dueForReminder(int $limit = 100): Collection
    {
        $schedule = self::schedule();
        $guestMax = self::guestMaxReminders();

        return AbandonedCheckout::query()
            ->open()
            ->where(function ($query) use ($schedule, $guestMax) {
                foreach ($schedule as $index => $minutes) {
                    $query->orWhere(function ($q) use ($index, $minutes, $guestMax) {
                        $q->where('reminder_count', $index)
                            ->where('created_at', '<=', now()->subMinutes($minutes));

                        if ($index >= $guestMax) {
                            $q->whereNotNull('user_id');
                        }
                    });
                }
            })
            // Ignore anything older than the longest Stripe session lifetime plus slack —
            // the link is dead and re-chasing ancient rows forever is noise.
            ->where('created_at', '>=', now()->subDays(max(1, (int) config('checkout_recovery.lookback_days', 3))))
            ->orderBy('created_at')
            ->limit($limit)
            ->get();
    }

    /**
     * Delete closed rows past the retention window.
     *
     * One row is written per checkout ATTEMPT, so this table grows faster than any
     * payment table — without a prune it is unbounded. Only closed rows go: an open
     * one is still live work, and the recent window keeps the recovery-rate figures
     * on the creator's dashboard meaningful.
     */
    public function prune(?int $days = null, bool $dryRun = false): int
    {
        $cutoff = now()->subDays(max(1, $days ?? self::retentionDays()));

        $query = AbandonedCheckout::whereNotNull('closed_at')->where('closed_at', '<', $cutoff);

        if ($dryRun) {
            return $query->count();
        }

        // Chunked so a first run over a large backlog cannot lock the table.
        $deleted = 0;
        do {
            $batch = AbandonedCheckout::whereNotNull('closed_at')
                ->where('closed_at', '<', $cutoff)
                ->limit(1000)
                ->delete();

            $deleted += $batch;
        } while ($batch > 0);

        return $deleted;
    }

    /**
     * Has this guest asked to stop receiving checkout reminders?
     *
     * A guest has no account, so there is no preference column to read. Their opt-out
     * IS the closed row the unsubscribe link wrote, which keeps the whole feature in
     * one table rather than adding a suppression list nothing else would use.
     */
    public function isSuppressed(?string $email): bool
    {
        if (empty($email)) {
            return false;
        }

        return AbandonedCheckout::where('guest_email', $email)
            ->where('closed_reason', 'opted_out')
            ->exists();
    }

    /**
     * Honour a guest's unsubscribe: close every open checkout for that address so no
     * further reminder can be claimed, and leave the marker isSuppressed() reads.
     */
    public function suppressGuest(string $email): int
    {
        return AbandonedCheckout::where('guest_email', $email)
            ->whereNull('closed_at')
            ->update([
                'closed_at' => now(),
                'closed_reason' => 'opted_out',
                'updated_at' => now(),
            ]);
    }

    /** Has the wait for this row's next reminder elapsed? */
    public function isDue(AbandonedCheckout $row): bool
    {
        $index = (int) $row->reminder_count;

        $schedule = self::schedule();

        if (! isset($schedule[$index])) {
            return false;
        }

        // A guest only ever gets the first reminder.
        if (! $row->user_id && $index >= self::guestMaxReminders()) {
            return false;
        }

        return $row->created_at
            && $row->created_at->copy()->addMinutes($schedule[$index])->isPast();
    }

    /**
     * Is it still safe AND useful to chase this checkout?
     *
     * Fails CLOSED: anything we cannot positively verify returns false. It is always
     * better to skip a reminder than to tell a paying supporter their money did not go through.
     *
     * @param  string|null  $reason  set to the close reason when the row should be closed out
     */
    public function isStillRecoverable(AbandonedCheckout $row, ?string &$reason = null): bool
    {
        $reason = null;

        try {
            // 1. Dead link. Nothing to send them back to.
            if ($row->expires_at && $row->expires_at->isPast()) {
                $reason = 'expired';

                return false;
            }

            if (empty($row->checkout_url)) {
                $reason = 'unrecoverable';

                return false;
            }

            // 2. Somebody to send it to.
            if (empty($row->recipientEmail())) {
                $reason = 'unrecoverable';

                return false;
            }

            $source = self::SOURCES[$row->product_type] ?? null;
            if (! $source) {
                $reason = 'unrecoverable';

                return false;
            }

            [$paymentModel, $sessionColumn, $statusColumn, $itemModel, $rowCreatedUpfront] = $source;

            // 3. The payment row must still be unpaid. This is the settlement guard —
            //    `processing` (bank debit in flight) is NOT in UNPAID_STATUSES, so a
            //    supporter waiting on their bank is never told the purchase failed.
            $payment = $paymentModel::where($sessionColumn, $row->session_id)->first();

            if (! $payment) {
                // For a module that writes its row upfront, a missing row means we cannot
                // prove the checkout is unpaid — so we do not chase it. For Paid Tasks the
                // row only appears on fulfilment, so its absence proves the opposite.
                if ($rowCreatedUpfront) {
                    $reason = 'unrecoverable';

                    return false;
                }
            } else {
                $status = $payment->{$statusColumn} ?? null;

                if (! in_array($status === null ? null : (string) $status, self::UNPAID_STATUSES, true)) {
                    // Settled (or failed/refunded). Either way it is not an abandoned checkout.
                    // `processing` gets no close reason: the money is in flight and the row
                    // should simply be left alone until it resolves.
                    $reason = $status === 'processing' ? null : 'unrecoverable';

                    return false;
                }
            }

            // 4. The thing they were buying must still be buyable.
            if ($itemModel && $row->item_id) {
                $item = $itemModel::find($row->item_id);

                if (! $item || ! $this->itemBuyable($item)) {
                    $reason = 'unrecoverable';

                    return false;
                }
            }

            // 5. The creator must still be able to take money. A row with no creator at
            //    all cannot be turned into a reminder (the copy names them), and would
            //    otherwise fail inside the sender and be retried every hour forever.
            $creator = $row->creator;
            if (! $creator || ($creator->suspended_account ?? 0) || empty($creator->account_id)) {
                $reason = 'unrecoverable';

                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning('AbandonedCheckout: recoverability check failed', [
                'id' => $row->id, 'error' => $e->getMessage(),
            ]);

            // Fail closed, but do not close the row — the failure may be transient.
            $reason = null;

            return false;
        }
    }

    /**
     * Generic "can this still be bought" check.
     *
     * Reads only the flags the row actually carries, so one method covers six item
     * models without needing to know which one it was handed.
     */
    public function itemBuyable($item): bool
    {
        $attributes = $item->getAttributes();

        $isFalsey = function (string $key) use ($attributes) {
            return array_key_exists($key, $attributes) && ! $attributes[$key];
        };

        $isTruthy = function (string $key) use ($attributes) {
            return array_key_exists($key, $attributes) && $attributes[$key];
        };

        // Moderation / publication gates.
        if ($isFalsey('approved') || $isFalsey('is_approved')) {
            return false;
        }

        if ($isTruthy('is_suspended')) {
            return false;
        }

        // `status` means different things per module, so read it by shape rather than by
        // a single list of strings: Shop stores 1/0, Piggy Pot stores a lifecycle word.
        if (array_key_exists('status', $attributes) && $attributes['status'] !== null) {
            $status = $attributes['status'];

            if (is_numeric($status)) {
                if ((int) $status === 0) {
                    return false;
                }
            } elseif (in_array((string) $status, ['moderation_hold', 'archived', 'completed', 'inactive', 'deleted'], true)) {
                return false;
            }
        }

        // Shop stock. `slot_limitation` IS the remaining count.
        if (array_key_exists('slot_limitation', $attributes)
            && $attributes['slot_limitation'] !== null
            && (int) $attributes['slot_limitation'] <= 0) {
            return false;
        }

        return true;
    }

    /**
     * Atomically claim the next reminder for a row.
     *
     * The claim IS the update — two workers racing cannot both win, because only one
     * UPDATE can match the current reminder_count.
     */
    public function claimReminder(AbandonedCheckout $row): bool
    {
        $current = (int) $row->reminder_count;

        $claimed = AbandonedCheckout::where('id', $row->id)
            ->where('reminder_count', $current)
            ->whereNull('recovered_at')
            ->whereNull('closed_at')
            ->update([
                'reminder_count' => $current + 1,
                'last_reminded_at' => now(),
                'updated_at' => now(),
            ]);

        if ($claimed) {
            $row->reminder_count = $current + 1;
            $row->last_reminded_at = now();
        }

        return (bool) $claimed;
    }

    /** Release a claim when the send failed, so the next run can retry it. */
    public function releaseReminder(AbandonedCheckout $row, int $previousCount): void
    {
        try {
            AbandonedCheckout::where('id', $row->id)->update([
                'reminder_count' => $previousCount,
                'updated_at' => now(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('AbandonedCheckout: failed to release claim', [
                'id' => $row->id, 'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * The item being bought, for the reminder's headline.
     *
     * Read from the recovery row's own `item_id`, not from the payment row — a Paid Task
     * has no payment row until it is fulfilled, and a basket has no single item at all.
     */
    public function itemFor(AbandonedCheckout $row)
    {
        try {
            $itemModel = self::SOURCES[$row->product_type][3] ?? null;

            if (! $itemModel || ! $row->item_id) {
                return null;
            }

            return $itemModel::find($row->item_id);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /** Human label for the module, used in copy. Content-first wording only. */
    public static function moduleLabel(string $productType): string
    {
        return [
            'wish' => 'content',
            'wish_subscription' => 'content subscription',
            'shop' => 'item',
            'task' => 'creator service',
            'piggy_pot' => 'content',
            'tip' => 'content',
            'bill' => 'content subscription',
            'membership' => 'membership',
        ][$productType] ?? 'purchase';
    }
}
