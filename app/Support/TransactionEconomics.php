<?php

namespace App\Support;

use App\Helpers;
use App\Models\FinancialTransaction;

/**
 * §15 — everything one transaction cost and earned, read off the ledger row.
 *
 * 🚨 THE ONE PLACE THE ECONOMICS OF A ROW ARE WORKED OUT. Before this, each
 * screen re-derived them: the creator's history, the admin revenue tabs and the
 * finance CSV each summed their own idea of "our fee", and they did not agree —
 * `platform_fee` IS the Stripe application fee (what the platform actually
 * receives, compliance and the old £1 already inside it), so adding
 * `compliance_fee` and `admin_fee` to it double-counts, which is exactly what a
 * reader who has only seen the column names will do.
 *
 * 🚨 EVERY FIGURE SAYS WHETHER IT IS MEASURED OR ESTIMATED, and that is the
 * whole point of the class. The processor cost stored against a charge until
 * 11 Sep 2026 was never Stripe's real fee — it was the ESTIMATE the supporter's
 * price was grossed up from (`config/payments.php` → `fee_profiles.*`). The two
 * differ, and they differ in the direction that costs the creator: a £15
 * listing charged £19.05 where Stripe took a flat £0.30 against an assumed
 * £0.19 paid the creator £14.89. So "SP net contribution after processing" is
 * either a fact or a guess, and a caller that cannot tell them apart will
 * publish the guess. `netContributionIsEstimated()` is not optional colour.
 *
 * ⚠️ NOTHING HERE CONVERTS A CURRENCY OR SUMS ACROSS ONE. Every figure is in
 * the row's own currency; `gbp_amount`/`gbp_rate` are the frozen conversion and
 * are the caller's to use. Same rule as `BlockedPaymentAlert::lostSalesInWindow`.
 */
class TransactionEconomics
{
    public const ALL_IN = 'all_in';

    public const LEGACY = 'legacy_markup';

    public function __construct(private readonly FinancialTransaction $row) {}

    public static function for(FinancialTransaction $row): self
    {
        return new self($row);
    }

    /* ── what the creator sold ─────────────────────────────────────────── */

    /**
     * The creator's LISTED amount — the price on the card, VAT included.
     *
     * ⚠️ `net_amount` is the creator's payout and EXCLUDES VAT, which is
     * collected on top and remitted. A caller printing `net_amount` as "your
     * price" shows a VAT-registered creator a figure lower than the one they
     * typed, and only them.
     */
    public function listedAmount(): float
    {
        return round((float) $this->row->net_amount + (float) $this->row->vat_amount, 2);
    }

    /** What the creator is paid, before reserve and before payout. */
    public function payoutAmount(): float
    {
        return (float) $this->row->net_amount;
    }

    /* ── what the supporter paid ───────────────────────────────────────── */

    /** The total charged to the card. */
    public function checkoutTotal(): float
    {
        return (float) $this->row->gross_amount;
    }

    /** The fee the supporter paid on top of the listed price, in money. */
    public function supporterFee(): float
    {
        return round($this->checkoutTotal() - $this->listedAmount(), 2);
    }

    /**
     * The supporter fee as a percentage of the listed price.
     *
     * ⚠️ DERIVED, never the advertised figure. It is a measurement of the row,
     * not a statement of what the supporter was promised: the total is ceiled
     * and a zero-decimal currency rounds harder, so on a small sale this reads
     * a tenth of a point off the rate on the button. Print the rate from
     * `FeeModel`/the `fees` prop when telling somebody what they WILL pay; use
     * this only to describe a charge that already happened.
     *
     * 🚨 The advertised rate is not stored. See the migration's note on
     * `supporter_rate`: nothing can write it truthfully until a payment row can
     * say which model priced it.
     */
    public function supporterRate(): ?float
    {
        $listed = $this->listedAmount();

        return $listed > 0 ? round(($this->supporterFee() / $listed) * 100, 3) : null;
    }

    /* ── which rules priced it ─────────────────────────────────────────── */

    /**
     * 🚨 A HISTORIC CHARGE IS RE-COST ON THE MODEL THAT PRICED IT, never on
     * today's config. Reading the global switch reported the whole back
     * catalogue as £1-per-transaction adrift from the ledger once.
     *
     * ⚠️ INFERRED, and `feeModelIsRecorded()` says so. Legacy is the answer
     * because every row this app has written was priced that way, and it is the
     * same fallback `resources/js/utils/pricing.js` and the rate-card estimate
     * take. It stops being right the moment an all-in charge lands, which is
     * why the flag beside it is not optional.
     */
    public function feeModel(): string
    {
        return self::LEGACY;
    }

    /**
     * 🚨 ALWAYS FALSE TODAY, AND THE CALLER MUST RENDER THAT.
     *
     * No row records which model priced it, so `feeModel()` is an inference,
     * not a fact — right for every row written before 11 Sep 2026 and wrong for
     * every all-in charge after it. A screen that prints the model without this
     * flag is presenting a guess about the platform's own commercial terms.
     */
    public function feeModelIsRecorded(): bool
    {
        return false;
    }

    /** `card` | `bank` — the rail the money came in on. */
    public function paymentRail(): string
    {
        $rail = (string) ($this->row->fee_profile ?? '');

        return $rail !== '' ? $rail : 'card';
    }

    /* ── what it cost and what we kept ─────────────────────────────────── */

    /**
     * SP GROSS FEE REVENUE — the Stripe application fee, i.e. the money that
     * actually reaches the platform.
     *
     * ⚠️ It is `platform_fee` ALONE. `SyncFinancialTransactions` writes
     * `$breakdown['application_fee']` into that column, and under the legacy
     * model the application fee already contains the compliance fee and the £1
     * administration fee — those two columns are the breakdown OF it, not
     * additions TO it. Summing all three overstates platform revenue on every
     * legacy row on the platform.
     */
    public function grossFeeRevenue(): float
    {
        return (float) $this->row->platform_fee;
    }

    /**
     * What the processor really took, in the row's currency — or NULL.
     *
     * 🚨 NULL IS AN ANSWER AND MUST BE RENDERED AS ONE. It means nobody has
     * asked Stripe yet (`finance:record-processor-cost` has not reached this
     * row), not that processing was free.
     */
    public function processorCost(): ?float
    {
        return is_numeric($this->row->processor_cost)
            ? (float) $this->row->processor_cost
            : null;
    }

    /** The estimate the supporter's price was grossed up from. Always present. */
    public function processorCostEstimate(): float
    {
        return (float) $this->row->stripe_fee;
    }

    public function processorCostIsMeasured(): bool
    {
        return $this->processorCost() !== null;
    }

    /** Where the measured cost came from — `balance_transaction`, or NULL. */
    public function processorCostSource(): ?string
    {
        $source = $this->row->processor_cost_source;

        return is_string($source) && $source !== '' ? $source : null;
    }

    /**
     * SP NET CONTRIBUTION AFTER PROCESSING — the platform's fee less what the
     * processor actually charged.
     *
     * ⚠️ Falls back to the estimate rather than returning NULL, because a
     * revenue report with a hole in it is a report nobody can total. The
     * fallback is only safe BECAUSE it is declared: always read
     * `netContributionIsEstimated()` beside it, and never publish the figure as
     * measured margin without it.
     *
     * ⚠️ It can be NEGATIVE and is deliberately not clamped. Below the
     * break-even price Stripe's fixed component exceeds the whole fee, and the
     * platform genuinely loses money on that sale — flooring it at zero would
     * hide the one number `FeeModel::minimumSellable()` exists to argue about.
     */
    public function netContribution(): float
    {
        return round($this->grossFeeRevenue() - ($this->processorCost() ?? $this->processorCostEstimate()), 2);
    }

    public function netContributionIsEstimated(): bool
    {
        return ! $this->processorCostIsMeasured();
    }

    /* ── what came back out ────────────────────────────────────────────── */

    /**
     * Refunds against the charge, in the row's currency.
     *
     * ⚠️ This is a refund of the supporter's GROSS. It is NOT the creator's
     * net coming back, and subtracting it from a net figure removes more than
     * the sale ever added — the same trap the Growth Bonus engine handles
     * proportionally.
     */
    public function refunded(): float
    {
        return (float) $this->row->refunded_amount;
    }

    public function isFullyRefunded(): bool
    {
        $gross = $this->checkoutTotal();

        return $gross > 0 && $this->refunded() >= $gross;
    }

    /* ── the whole §15 row ─────────────────────────────────────────────── */

    /**
     * Every §15 field for one transaction, with its provenance.
     *
     * Keys ending `_is_estimated` / `_is_recorded` are not decoration: a caller
     * that drops them is publishing a guess as a measurement.
     */
    public function toArray(): array
    {
        return [
            'currency' => (string) $this->row->currency,
            'payment_rail' => $this->paymentRail(),
            'fee_model' => $this->feeModel(),
            'fee_model_is_recorded' => $this->feeModelIsRecorded(),

            'listed_amount' => $this->listedAmount(),
            'payout_amount' => $this->payoutAmount(),
            'vat_amount' => (float) $this->row->vat_amount,

            'checkout_total' => $this->checkoutTotal(),
            'supporter_fee' => $this->supporterFee(),
            // Derived from the row, not the advertised figure — see supporterRate().
            'supporter_rate_derived' => $this->supporterRate(),

            'gross_fee_revenue' => $this->grossFeeRevenue(),
            'processor_cost' => $this->processorCost(),
            'processor_cost_estimate' => $this->processorCostEstimate(),
            'processor_cost_source' => $this->processorCostSource(),
            'net_contribution' => $this->netContribution(),
            'net_contribution_is_estimated' => $this->netContributionIsEstimated(),

            'refunded_amount' => $this->refunded(),
            'reserve_amount' => (float) $this->row->reserve_amount,
            'reserve_status' => (string) $this->row->reserve_status,
        ];
    }

    /**
     * Money formatted for a screen, in the row's own currency.
     *
     * ⚠️ Zero-decimal currencies (JPY, KRW …) print with no decimals — a
     * fractional yen is meaningless and reads as a bug to the person holding
     * the receipt.
     */
    public function format(?float $amount): ?string
    {
        if ($amount === null) {
            return null;
        }

        $currency = (string) $this->row->currency;

        return Helpers::isZeroDecimalCurrency($currency)
            ? number_format($amount, 0)
            : number_format($amount, 2);
    }
}
