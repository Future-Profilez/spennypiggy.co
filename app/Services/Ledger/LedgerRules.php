<?php

namespace App\Services\Ledger;

use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\ShopPayment;
use App\Models\TaskPurchase;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/**
 * The ONE definition of how a ledger row is read.
 *
 * Before this class the same four questions — "is this money earned?", "is this
 * item fulfilled?", "what did the supporter actually pay?", "what did the creator
 * keep?" — were answered by four separate implementations (FinancialService,
 * ProfileController's /history feed, GifterHubController and PayoutService), and
 * they disagreed. A creator's Support History showed more received income than the
 * earnings dashboard, which in turn showed a different figure to what the payout
 * run would actually pay. Every surface now reads from here.
 *
 * The fulfilment gate mirrors PayoutService deliberately: the payout engine is
 * what actually moves the money, so anything a creator is SHOWN as earned must be
 * something the payout run agrees to pay.
 */
final class LedgerRules
{
    /**
     * A Paid Task's money is earned once the buyer has accepted (or auto-confirm
     * has run). 'delivered' is NOT here — that is still escrow.
     */
    public const EARNED_TASK_STATUSES = ['completed', 'completed_accepted', 'paid_out'];

    /** Only a completed row counts toward a total. */
    public const COUNTED_STATUSES = ['completed'];

    /**
     * Rows a person is allowed to SEE. A refunded or disputed transaction is
     * excluded from every total but must still be listed — money that arrived and
     * then left is a fact the buyer and the creator both need, and hiding it reads
     * as the transaction never having existed.
     */
    public const VISIBLE_STATUSES = ['completed', 'review_hold', 'disputed', 'refunded', 'processing', 'pending'];

    /** Statuses that mean the money is not (or no longer) the creator's. */
    public const REVERSED_STATUSES = ['refunded', 'disputed', 'failed'];

    /** Statuses that mean the money has not settled yet. */
    public const IN_FLIGHT_STATUSES = ['processing', 'pending', 'review_hold'];

    /**
     * The SQL form of `creatorGross()` — what the sale is worth to the creator.
     *
     * 🚨 SQL TWIN OF A PHP READER. An aggregate screen cannot hydrate ten thousand
     * rows to call `creatorGross()` on each one, so it needs the expression — and
     * a hand-typed copy of that expression in a service is exactly how the four
     * surfaces this class was written to reconcile drifted apart in the first
     * place. Keep these two constants and their PHP twins in step: change one,
     * change the other, in the same commit.
     */
    public const CREATOR_GROSS_SQL = '(net_amount + COALESCE(vat_amount, 0))';

    /**
     * The SQL form of `buyerPaid()` — what the SUPPORTER was charged.
     *
     * ⚠️ Includes the same legacy fallback the PHP reader has: a row written
     * before `gross_amount` was populated is rebuilt from its own parts rather
     * than reported as a £0 purchase. `NULLIF(...,0)` is what makes both NULL and
     * a stored zero fall through to the rebuild.
     */
    public const BUYER_PAID_SQL =
        '(COALESCE(NULLIF(gross_amount, 0), '
        .'net_amount + COALESCE(vat_amount, 0) + COALESCE(platform_fee, 0) + COALESCE(stripe_fee, 0)'
        .'))';

    /**
     * The SQL form of `countsTowardTotals()`: constrain a `financial_transactions`
     * query to the rows a total is allowed to include.
     *
     * 🚨 This is `COUNTED_STATUSES` **plus the fulfilment gate**, and the second
     * half is the one that gets forgotten. A `whereNotIn('status', [...refunded,
     * disputed...])` filter looks like it does the job and does not: it lets
     * `processing` (bank money that has not settled) through, and it counts a
     * physical shop order nobody has posted and a timed task nobody has accepted.
     * A screen filtering that way reports MORE than the earnings dashboard and
     * more than the payout run will pay — three numbers, one pot of money.
     *
     * The two exclusions mirror `resolveFulfilment()` exactly, including its
     * deliberate inclusiveness: an orphaned task purchase, a task whose row is
     * gone, a shop payment with no shop, and any non-physical shop item all stay
     * counted, because the payout engine pays them and showing the creator less
     * than they are paid is the same bug in the other direction.
     *
     * @param  Builder|\Illuminate\Database\Query\Builder  $query
     */
    public static function countedScope($query)
    {
        // Inlined rather than bound: the list is a class constant of literals, and
        // a variable-length IN list cannot be expressed as a single placeholder.
        $earned = "'".implode("','", self::EARNED_TASK_STATUSES)."'";

        return $query
            ->whereIn('status', self::COUNTED_STATUSES)
            // A TIMED paid task is still escrow until the buyer accepts it. An
            // INSTANT task is fulfilled on payment and is deliberately NOT gated
            // — the earnings screens used to exclude it, so creators were paid
            // money their own dashboard never showed.
            ->whereRaw(
                // ⚠️ COALESCE, because `source` is a NULLABLE morph. `NULL = ?` is
                // NULL, and `NOT (NULL AND TRUE)` is NULL — which SQL treats as
                // false, silently DROPPING a row whose source_type is null and
                // whose source_id happens to collide with a task_purchases id.
                // The comparison has to yield a real boolean before the NOT.
                "NOT (COALESCE(financial_transactions.source_type, '') = ? AND EXISTS ("
                .' SELECT 1 FROM task_purchases tp'
                .' LEFT JOIN tasks t ON t.id = tp.task_id'
                .' WHERE tp.id = financial_transactions.source_id'
                ."   AND COALESCE(t.type, 'timed') = 'timed'"
                ."   AND tp.status NOT IN ({$earned})"
                .'))',
                [TaskPurchase::class]
            )
            // A PHYSICAL shop item is earned when the parcel is marked delivered.
            // The deliverable is picked by lowest id, matching `fulfilmentMap()`'s
            // `orderBy('id')->first()` — `hasOne()` on session_id has no
            // deterministic order and the two must not disagree.
            ->whereRaw(
                // Same null-safety as the task branch above.
                "NOT (COALESCE(financial_transactions.source_type, '') = ? AND EXISTS ("
                .' SELECT 1 FROM shop_payments sp'
                .' JOIN shops s ON s.id = sp.shop_id'
                .' WHERE sp.id = financial_transactions.source_id'
                ."   AND s.type = 'physical'"
                .'   AND COALESCE(('
                .'     SELECT d.status FROM deliverables d'
                .'     WHERE d.session_id = sp.session_id ORDER BY d.id LIMIT 1'
                ."   ), '') <> 'delivered'"
                .'))',
                [ShopPayment::class]
            );
    }

    /**
     * Resolve the fulfilment state of a whole set of ledger rows in a fixed number
     * of queries.
     *
     * Two product types are only earned once they have been delivered:
     *   - a PHYSICAL shop item (the parcel has to arrive), and
     *   - a TIMED paid task (custom work sitting in escrow until accepted).
     *
     * An INSTANT task is deliberately fulfilled on payment — its deliverable is
     * handed over the moment the buyer pays, and the payout engine has always paid
     * it. The earnings screens used to exclude it, so the creator was paid money
     * their own dashboard never showed.
     *
     * @param  Collection<int, FinancialTransaction>  $transactions
     * @return array<int, bool> keyed by FinancialTransaction id
     */
    public static function fulfilmentMap(Collection $transactions): array
    {
        $map = [];

        $taskIds = [];
        $shopIds = [];
        foreach ($transactions as $ft) {
            if ($ft->source_type === TaskPurchase::class) {
                $taskIds[] = $ft->source_id;
            } elseif ($ft->source_type === ShopPayment::class) {
                $shopIds[] = $ft->source_id;
            }
        }

        $taskPurchases = empty($taskIds)
            ? collect()
            : TaskPurchase::with('task:id,type')
                ->whereIn('id', array_unique($taskIds))
                ->get(['id', 'task_id', 'status'])
                ->keyBy('id');

        $shopPayments = empty($shopIds)
            ? collect()
            : ShopPayment::with('shop:id,type')
                ->whereIn('id', array_unique($shopIds))
                ->get(['id', 'shop_id', 'session_id'])
                ->keyBy('id');

        // Deliverable status per session in one query. hasOne() on session_id has no
        // deterministic order, so the row is picked by id like FinancialService did.
        $sessionIds = $shopPayments->pluck('session_id')->filter()->unique()->values()->all();
        $deliverableStatus = empty($sessionIds)
            ? []
            : Deliverable::whereIn('session_id', $sessionIds)
                ->orderBy('id')
                ->get(['session_id', 'status'])
                ->groupBy('session_id')
                ->map(fn ($rows) => $rows->first()->status)
                ->all();

        foreach ($transactions as $ft) {
            $map[$ft->id] = self::resolveFulfilment($ft, $taskPurchases, $shopPayments, $deliverableStatus);
        }

        return $map;
    }

    /**
     * Single-row convenience. Prefer fulfilmentMap() for a list — this issues its
     * own queries and will N+1 in a loop.
     */
    public static function isFulfilled(FinancialTransaction $ft): bool
    {
        return self::fulfilmentMap(collect([$ft]))[$ft->id] ?? true;
    }

    /**
     * Does this row count toward an earnings/spend total?
     *
     * Settled AND fulfilled. Anything else is shown with a state instead of being
     * silently dropped.
     *
     * @param  array<int, bool>  $fulfilmentMap  from fulfilmentMap()
     */
    public static function countsTowardTotals(FinancialTransaction $ft, array $fulfilmentMap): bool
    {
        if (! in_array((string) $ft->status, self::COUNTED_STATUSES, true)) {
            return false;
        }

        return $fulfilmentMap[$ft->id] ?? true;
    }

    /**
     * What the supporter was actually charged.
     *
     * gross_amount is written from the payment row's total_paid wherever one
     * exists, so it is the charged figure and NOT the creator's gross.
     */
    public static function buyerPaid(FinancialTransaction $ft): float
    {
        $gross = (float) ($ft->gross_amount ?? 0);
        if ($gross > 0) {
            return $gross;
        }

        // A legacy row with no gross recorded: rebuild it from its own parts rather
        // than reporting the purchase as £0.
        return self::creatorGross($ft) + self::fees($ft);
    }

    /**
     * The creator's gross — what the sale is worth to them before fees they never
     * paid. Net already includes shipping on a shop row.
     */
    public static function creatorGross(FinancialTransaction $ft): float
    {
        return (float) ($ft->net_amount ?? 0) + (float) ($ft->vat_amount ?? 0);
    }

    /** Every fee deducted between the supporter's charge and the creator's net. */
    public static function fees(FinancialTransaction $ft): float
    {
        return (float) ($ft->platform_fee ?? 0) + (float) ($ft->stripe_fee ?? 0);
    }

    /** The creator's net — their own earnings, before any VAT they collected. */
    public static function creatorNet(FinancialTransaction $ft): float
    {
        return (float) ($ft->net_amount ?? 0);
    }

    /**
     * What a payout run owes for this row: the creator's net PLUS the VAT they
     * charged and must remit themselves.
     *
     * 🚨 The payout used to pay `net_amount` alone (client decision reversed it
     * on 11 Aug 2026). VAT was charged to the supporter, landed in the creator's
     * connected-account balance — and then nothing released it. It was not
     * separated, it was stranded: no code path anywhere paid it out, so it
     * simply accumulated in Stripe for every VAT-registered creator.
     *
     * It also put two of our own screens in disagreement. `creatorGross()` is
     * `net + VAT` and is what the earnings dashboard shows, while the run paid
     * the figure without it — so a creator's dashboard and their bank statement
     * could never match. Deliberately the same number as `creatorGross()` for
     * exactly that reason; the two names exist so the payout's intent is
     * readable at its call site, not so they can drift apart.
     *
     * ⚠️ RESERVE IS NOT TAKEN ON VAT. A reserve is withheld from the creator's
     * own earnings; VAT is tax they hold on HMRC's behalf, and holding a
     * percentage of it back would leave them unable to remit in full through no
     * fault of their own. `reserve_amount` stays computed on `net_amount`, and
     * the payout subtracts it from this figure rather than from a VAT-inclusive
     * base. The same reasoning keeps VAT out of every bonus base — those read
     * `net_amount` directly and are untouched by this.
     */
    public static function payable(FinancialTransaction $ft): float
    {
        return self::creatorGross($ft);
    }

    /**
     * A single word for what is happening to this money, for display.
     *
     * Deliberately distinct from the raw DB status: "delivered but not yet
     * accepted" and "waiting on the bank" are different things to the person
     * reading the row, and both were previously rendered as nothing at all.
     */
    public static function state(FinancialTransaction $ft, array $fulfilmentMap): string
    {
        $status = (string) $ft->status;

        if (in_array($status, self::REVERSED_STATUSES, true)) {
            return $status === 'failed' ? 'failed' : $status;
        }

        if (in_array($status, self::IN_FLIGHT_STATUSES, true)) {
            return $status === 'review_hold' ? 'on_hold' : 'awaiting_settlement';
        }

        if (! ($fulfilmentMap[$ft->id] ?? true)) {
            return 'awaiting_delivery';
        }

        return 'settled';
    }

    /**
     * Human wording for state(). Kept beside the state so two surfaces cannot
     * describe the same row differently.
     */
    public const STATE_LABELS = [
        'settled' => 'Completed',
        'awaiting_delivery' => 'Awaiting delivery',
        'awaiting_settlement' => 'Awaiting bank confirmation',
        'on_hold' => 'Under review',
        'refunded' => 'Refunded',
        'disputed' => 'Disputed',
        'failed' => 'Failed',
    ];

    /**
     * The full money breakdown for one row, in its own currency.
     *
     * Every transactional surface renders this, so the buyer and the creator are
     * shown the same arithmetic for the same payment.
     *
     * @param  array<int, bool>  $fulfilmentMap
     */
    public static function breakdown(FinancialTransaction $ft, array $fulfilmentMap): array
    {
        $state = self::state($ft, $fulfilmentMap);
        $counts = self::countsTowardTotals($ft, $fulfilmentMap);

        return [
            'currency' => strtoupper((string) ($ft->currency ?: 'GBP')),
            'buyer_paid' => round(self::buyerPaid($ft), 2),
            'creator_gross' => round(self::creatorGross($ft), 2),
            'platform_fee' => round((float) ($ft->platform_fee ?? 0), 2),
            'compliance_fee' => $ft->compliance_fee !== null ? round((float) $ft->compliance_fee, 2) : null,
            'admin_fee' => $ft->admin_fee !== null ? round((float) $ft->admin_fee, 2) : null,
            'stripe_fee' => round((float) ($ft->stripe_fee ?? 0), 2),
            'total_fees' => round(self::fees($ft), 2),
            'vat' => round((float) ($ft->vat_amount ?? 0), 2),
            'creator_net' => round(self::creatorNet($ft), 2),
            'reserve_amount' => round((float) ($ft->reserve_amount ?? 0), 2),
            'reserve_status' => $ft->reserve_status ?: 'none',
            'reserve_released_at' => optional($ft->reserve_released_at)->toIso8601String(),
            'fee_profile' => $ft->fee_profile ?: 'card',
            'payout_run_id' => $ft->payout_run_id,
            'state' => $state,
            'state_label' => self::STATE_LABELS[$state] ?? 'Completed',
            'counts_toward_totals' => $counts,
        ];
    }

    /**
     * @param  Collection<int, TaskPurchase>  $taskPurchases
     * @param  Collection<int, ShopPayment>  $shopPayments
     * @param  array<string, string>  $deliverableStatus
     */
    private static function resolveFulfilment(
        FinancialTransaction $ft,
        Collection $taskPurchases,
        Collection $shopPayments,
        array $deliverableStatus
    ): bool {
        if ($ft->source_type === TaskPurchase::class) {
            $purchase = $taskPurchases->get($ft->source_id);
            if (! $purchase) {
                // The purchase row is gone. The payout engine pays these (its own gate
                // can only exclude a task it can actually find), so excluding them here
                // would show the creator LESS than they are paid — the exact class of
                // disagreement this class exists to remove. `finance:audit-ledger`
                // reports the orphan instead.
                return true;
            }

            // Default to 'timed' when the task is missing — the stricter branch.
            $type = $purchase->task->type ?? 'timed';
            if ($type !== 'timed') {
                return true;
            }

            return in_array((string) $purchase->status, self::EARNED_TASK_STATUSES, true);
        }

        if ($ft->source_type === ShopPayment::class) {
            $payment = $shopPayments->get($ft->source_id);
            if (! $payment || ! $payment->shop) {
                // Unknown product type — a digital sale is the common case and is
                // fulfilled on payment, so this stays inclusive rather than hiding
                // real income behind a missing relation.
                return true;
            }

            if ($payment->shop->type !== 'physical') {
                return true;
            }

            return ($deliverableStatus[$payment->session_id] ?? null) === 'delivered';
        }

        return true;
    }
}
