<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\Ledger\LedgerRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * VAT collected from a supporter now leaves with the creator's payout
 * (client decision, 11 Aug 2026).
 *
 * 🚨 What this replaces: the payout run summed `net_amount`, which is the listed
 * price EXCLUDING VAT. The VAT had already been charged to the supporter and had
 * already landed in the creator's connected-account balance — and then nothing
 * released it. It was never "handled separately"; it was stranded, accumulating
 * in Stripe for every VAT-registered creator with no code path anywhere paying
 * it out.
 *
 * It also made two of our own screens disagree: `creatorGross()` (net + VAT) is
 * what the earnings dashboard shows, so a creator's dashboard could never match
 * their bank statement.
 */
class VatInPayoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Helpers::clearCurrencyCache();
        Currency::updateOrCreate(
            ['ISO' => 'GBP'],
            ['name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']
        );
    }

    private function row(array $overrides = []): FinancialTransaction
    {
        $creator = User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);

        return FinancialTransaction::create(array_merge([
            'user_id' => $creator->id,
            'source_type' => 'App\\Models\\ShopPayment',
            'source_id' => random_int(1, 100000),
            'type' => 'income',
            'gross_amount' => 156.66,
            'platform_fee' => 30.00,
            'stripe_fee' => 6.00,
            'vat_amount' => 20.00,
            'net_amount' => 100.00,
            'reserve_amount' => 0.00,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'test',
            'transaction_date' => now(),
        ], $overrides));
    }

    public function test_the_payable_amount_is_the_creator_net_plus_their_vat(): void
    {
        $ft = $this->row();

        $this->assertSame(100.00, LedgerRules::creatorNet($ft), 'net is the creator\'s own earnings');
        $this->assertSame(120.00, LedgerRules::payable($ft), 'the payout owes net + VAT');
    }

    public function test_a_creator_with_no_vat_is_unaffected(): void
    {
        // The overwhelming majority of creators. Their payable figure must be
        // byte-identical to what it was before this change.
        $ft = $this->row(['vat_amount' => 0.00]);

        $this->assertSame(100.00, LedgerRules::payable($ft));
        $this->assertSame(LedgerRules::creatorNet($ft), LedgerRules::payable($ft));
    }

    public function test_the_dashboard_and_the_payout_quote_the_same_figure(): void
    {
        // The whole point of the change: what a creator reads on their earnings
        // screen and what reaches their bank must be the same number.
        $ft = $this->row();

        $this->assertSame(LedgerRules::creatorGross($ft), LedgerRules::payable($ft));
    }

    /**
     * ⚠️ Reserve is withheld from the creator's OWN earnings, never from tax
     * they are holding on HMRC's behalf. A reserve taken on a VAT-inclusive base
     * would leave a creator unable to remit in full through no fault of theirs.
     */
    public function test_reserve_is_still_calculated_on_net_and_never_on_vat(): void
    {
        $breakdown = Helpers::calculateStripeDirectChargeFlow(100, 'GBP', 10);

        // 10% of the listed price, not of the price plus VAT.
        $this->assertSame(10.00, $breakdown['reserve_amount']);

        // And the payout subtracts that reserve from the payable figure rather
        // than recomputing one against it.
        $ft = $this->row(['reserve_amount' => 10.00]);
        $this->assertSame(120.00, LedgerRules::payable($ft));
        $this->assertSame(110.00, round(LedgerRules::payable($ft) - (float) $ft->reserve_amount, 2));
    }

    public function test_an_unset_vat_attribute_is_treated_as_zero_not_as_an_error(): void
    {
        // `vat_amount` is NOT NULL in the database, so this cannot come from a
        // stored row — but the payout also reads transactions built by a resync
        // and by tests, and a missing attribute must read as "no VAT" rather
        // than fatal partway through a creator's run.
        $ft = new FinancialTransaction;
        $ft->net_amount = 100.00;

        $this->assertSame(100.00, LedgerRules::payable($ft));
    }

    public function test_the_breakdown_shown_to_both_sides_still_separates_vat(): void
    {
        // Paying the VAT out does not merge it into earnings: the creator must
        // still see what portion is tax, because they are the one remitting it.
        $ft = $this->row();
        $breakdown = LedgerRules::breakdown($ft, []);

        $this->assertSame(20.00, $breakdown['vat']);
        $this->assertSame(100.00, $breakdown['creator_net']);
        $this->assertSame(120.00, $breakdown['creator_gross']);
    }
}
