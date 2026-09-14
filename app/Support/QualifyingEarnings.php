<?php

namespace App\Support;

use App\Models\FinancialTransaction;
use App\Models\User;
use Carbon\Carbon;

/**
 * "Qualifying settled earnings" — ONE definition, for every scheme that pays a
 * creator for reaching a figure.
 *
 * 🚨 THIS IS NOT A NEW DEFINITION. It is `GrowthBonusService::computeGmv()`
 * lifted out unchanged (11 Sep 2026) so that the Growth Bonus engine, the
 * membership-credit ladder and the creator referral all read the same rows,
 * apply the same exclusions and answer the same number. `computeGmv()` now
 * delegates here and behaves identically — verified by the Growth Bonus suite,
 * which was not touched.
 *
 * 🚨 WHY THIS ONE AND NOT `FounderBonus::calculateCompletedNetEarnings()`.
 * The two deliberately differ and both are correct for their own scheme:
 *
 *   - `calculateCompletedNetEarnings` is `net_amount`, NET OF VAT, converted at
 *     TODAY's rates, over a date window. It does NOT subtract refunds and does
 *     NOT exclude self-payments.
 *   - this is the LISTED SALE VALUE (`net_amount + vat_amount`) converted at the
 *     row's own FROZEN `gbp_rate`, with the refunded portion removed
 *     proportionally and self-payments excluded.
 *
 * The two new schemes are specified as "only settled eligible earnings count;
 * refunds and chargebacks reduce qualifying progress" — which is this one and
 * only this one. A disputed transaction is not `completed` (see
 * `SyncFinancialTransactions`), so chargebacks fall out through the same filter
 * that removes refunds; that is not a second rule written on top.
 *
 * ⚠️ IT IS NOT "WHAT THE CREATOR KEEPS" AND NO COPY MAY SAY SO. Where VAT
 * applies, part of this figure is money the creator passes to HMRC. It is the
 * listed sale value — which is why the Growth Bonus terms define it as
 * "Qualifying Earnings" rather than as earnings in the take-home sense, and why
 * the same words are used on every surface reading this class.
 *
 * ⚠️ Rows with no frozen GBP rate are COUNTED AND REPORTED (`unconverted`),
 * never silently dropped into the total — same reasoning as FreezesLedgerFx.
 * A caller showing a creator their progress must surface a non-zero count
 * rather than presenting an understated figure as complete.
 */
class QualifyingEarnings
{
    /**
     * Qualifying settled earnings in GBP for one creator, as an ordered list of
     * per-transaction contributions.
     *
     * The list, not just the sum, because a milestone engine needs to know
     * WHICH row crossed each threshold — the Growth Bonus pays a bonus in the
     * payout run that carries that row, and the referral records the date the
     * threshold was actually reached rather than the date a sweep noticed.
     *
     * @param  Carbon|null  $from  inclusive lower bound on `transaction_date`
     * @param  Carbon|null  $until  inclusive upper bound on `transaction_date`
     * @return array{total: float, unconverted: int, contributions: array<int, array{id: int, date: mixed, gbp: float, cumulative: float}>}
     */
    public static function forCreator(User $creator, ?Carbon $from = null, ?Carbon $until = null): array
    {
        $rows = FinancialTransaction::query()
            ->where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->when($from, fn ($q) => $q->where('transaction_date', '>=', $from))
            ->when($until, fn ($q) => $q->where('transaction_date', '<=', $until))
            // Self-payment exclusion. NULL supporter = guest checkout, which
            // stays in — a manual payout approval is the control for disguised
            // self-purchases, not a filter that would drop every guest sale.
            ->where(fn ($q) => $q->whereNull('supporter_id')->orWhereColumn('supporter_id', '!=', 'user_id'))
            // Full source, not column-constrained: this is a morphTo and some
            // source types (ShopPayment, StripePaymentItems) have no `status`
            // column, so `source:id,status` would error on them.
            ->with('source')
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get(['id', 'gross_amount', 'net_amount', 'vat_amount', 'refunded_amount', 'gbp_amount', 'gbp_rate', 'currency', 'source_type', 'source_id', 'transaction_date']);

        $contributions = [];
        $running = 0.0;
        $unconverted = 0;

        foreach ($rows as $tx) {
            // Task escrow gate: paid but not yet accepted = still refundable,
            // so not yet a genuine settled sale. An FT flips to `completed`
            // when the buyer PAYS, and a timed task is refundable until they
            // accept — counting it would let a creator earn a real cash reward
            // on money that can still go back.
            if ($tx->source_type === 'App\Models\TaskPurchase'
                && isset($tx->source->status)
                && ! in_array($tx->source->status, ['completed', 'completed_accepted', 'paid_out'], true)) {
                continue;
            }

            $gbp = self::rowGbp($tx);

            if ($gbp === null) {
                $unconverted++;

                continue;
            }

            if ($gbp <= 0) {
                continue;
            }

            $running += $gbp;
            $contributions[] = [
                'id' => (int) $tx->id,
                'date' => $tx->transaction_date,
                'gbp' => $gbp,
                'cumulative' => $running,
            ];
        }

        return [
            'total' => round($running, 2),
            'unconverted' => $unconverted,
            'contributions' => $contributions,
        ];
    }

    /** The sum alone, for a caller that does not need to know which row crossed. */
    public static function totalFor(User $creator, ?Carbon $from = null, ?Carbon $until = null): float
    {
        return (float) self::forCreator($creator, $from, $until)['total'];
    }

    /**
     * The first contribution whose cumulative total (plus any admin adjustment)
     * reaches $threshold, or null if it never does.
     *
     * ⚠️ Returns the ROW, not the date, so a caller can follow that transaction
     * through the payout cycle — which is what the Growth Bonus payout rule
     * needs and what a referral's `qualified_at` should be stamped from.
     *
     * @param  array<int, array{id: int, date: mixed, gbp: float, cumulative: float}>  $contributions
     * @return array{id: int, date: mixed, gbp: float, cumulative: float}|null
     */
    public static function crossing(array $contributions, float $threshold, float $adjustment = 0.0): ?array
    {
        foreach ($contributions as $row) {
            if (($row['cumulative'] + $adjustment) + 0.001 >= $threshold) {
                return $row;
            }
        }

        return null;
    }

    /**
     * One row's contribution: the LISTED SALE VALUE in GBP, less any refunded
     * portion. NULL = cannot be converted (the caller counts it rather than
     * guessing at a rate).
     *
     * 🚨 `net_amount + vat_amount`, NOT `net_amount` ALONE. The listed price is
     * what the creator typed, and for a VAT-registered creator part of it is VAT
     * they collect and pass on — so `net_amount` alone would make that creator
     * climb more slowly than a non-registered creator selling the identical
     * listing. £100 listed = £100 qualifying, whatever the VAT status.
     *
     * 🚨 `gbp_amount` IS THE GROSS AND IS DELIBERATELY NOT USED FOR THE TOTAL.
     * It is still read for its FROZEN RATE (`gbp_rate`), so the figure converts
     * at the rate in force when the money moved rather than at today's.
     *
     * ⚠️ A partial refund is applied PROPORTIONALLY. `refunded_amount` is a
     * refund of the supporter's GROSS, so subtracting it whole would remove more
     * than the sale ever added — on a £100 listing a £130.55 full refund would
     * take the creator to −£30. It is scaled by the row's own listed/gross ratio
     * instead, and floored at zero so one refunded sale can never eat into other
     * genuine earnings.
     */
    private static function rowGbp(FinancialTransaction $tx): ?float
    {
        $listed = (float) ($tx->net_amount ?? 0) + (float) ($tx->vat_amount ?? 0);
        $gross = (float) ($tx->gross_amount ?? 0);
        $refunded = (float) ($tx->refunded_amount ?? 0);

        $refundedShare = ($refunded > 0 && $gross > 0)
            ? $refunded * ($listed / $gross)
            : 0.0;

        $value = max(0.0, $listed - $refundedShare);

        if ((float) $tx->gbp_rate > 0) {
            return $value / (float) $tx->gbp_rate;
        }

        if (strtoupper((string) ($tx->currency ?? 'GBP')) === 'GBP') {
            return $value;
        }

        return null;
    }
}
