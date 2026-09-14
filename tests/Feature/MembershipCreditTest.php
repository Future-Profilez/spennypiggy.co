<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\MembershipCredit;
use App\Models\User;
use App\Services\MembershipCreditService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * "Earn your membership back" — £500 of settled earnings buys a free month (client §5).
 *
 * 🚨 A CREDIT IS NOT CASH AND MUST NEVER BECOME CASH. It is a month of the creator's own
 * subscription, recorded in a ledger, never convertible and never paid out. The one
 * structural rule underneath it: **an incentive may not create an income transaction**,
 * or it feeds its own qualifying total and the ladder pays for itself.
 */
class MembershipCreditTest extends TestCase
{
    use RefreshDatabase;

    private MembershipCreditService $credits;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'membership_credits.enabled' => true,
            'membership_credits.threshold_gbp' => 500.00,
            'membership_credits.months_per_threshold' => 1,
            'membership_credits.max_months_per_creator' => null,
            'membership_credits.earnings_from' => '2026-01-01',
            'membership_credits.expiry_months' => null,
        ]);

        $this->credits = app(MembershipCreditService::class);
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'default_currency' => 'GBP']);
    }

    /** A settled, qualifying sale. */
    private function earn(User $creator, float $net, array $overrides = []): FinancialTransaction
    {
        return FinancialTransaction::create(array_merge([
            'user_id' => $creator->id,
            'supporter_id' => null,
            'type' => 'income',
            'status' => 'completed',
            'currency' => 'GBP',
            'gross_amount' => $net,
            'net_amount' => $net,
            'vat_amount' => 0,
            'refunded_amount' => 0,
            'gbp_amount' => $net,
            'gbp_rate' => 1,
            'transaction_date' => Carbon::parse('2026-06-01'),
        ], $overrides));
    }

    /* -----------------------------------------------------------------
     | The ladder
     | ----------------------------------------------------------------- */

    public function test_the_ladder_awards_one_month_per_five_hundred(): void
    {
        foreach ([[499.99, 0], [500, 1], [999, 1], [1000, 2], [3000, 6]] as [$earnings, $expected]) {
            $creator = $this->creator();
            $this->earn($creator, $earnings);

            $this->credits->evaluate($creator);

            $this->assertSame(
                $expected,
                MembershipCredit::where('creator_id', $creator->id)
                    ->where('status', MembershipCredit::STATUS_EARNED)->count(),
                "£{$earnings} should award {$expected} month(s)"
            );
        }
    }

    public function test_evaluating_twice_awards_once(): void
    {
        // 🚨 The command runs daily. Without idempotence a creator on £500 collects a
        // free month every morning for ever.
        $creator = $this->creator();
        $this->earn($creator, 500);

        $this->credits->evaluate($creator);
        $this->credits->evaluate($creator);
        $this->credits->evaluate($creator);

        $this->assertSame(1, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    /* -----------------------------------------------------------------
     | The rule that stops it paying for itself
     | ----------------------------------------------------------------- */

    public function test_awarding_a_credit_creates_no_income_transaction(): void
    {
        /*
         * 🚨 THE LOOP. An incentive that writes an income row feeds its own qualifying
         * total — the creator's earnings rise because they were rewarded, which earns
         * another reward. Fast Start and Referral already follow this rule and it is
         * the reason a credit is a subscription month rather than money.
         */
        $creator = $this->creator();
        $this->earn($creator, 1000);

        $before = FinancialTransaction::where('user_id', $creator->id)->count();
        $this->credits->evaluate($creator);

        $this->assertSame($before, FinancialTransaction::where('user_id', $creator->id)->count());
        $this->assertSame(2, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    /* -----------------------------------------------------------------
     | Refunds
     | ----------------------------------------------------------------- */

    public function test_a_refund_reverses_a_credit_that_has_not_been_used(): void
    {
        // Client §5: refunds and chargebacks reduce qualifying progress.
        $creator = $this->creator();
        $tx = $this->earn($creator, 1000);

        $this->credits->evaluate($creator);
        $this->assertSame(2, MembershipCredit::where('creator_id', $creator->id)
            ->where('status', MembershipCredit::STATUS_EARNED)->count());

        // ⚠️ £300 back leaves £700 — one rung still cleared, so exactly ONE credit
        // reverses. A £600 refund would drop them to £400 and reverse both, which is
        // also correct and is asserted below.
        $tx->forceFill(['refunded_amount' => 300])->save();
        $this->credits->evaluate($creator);

        $this->assertSame(1, MembershipCredit::where('creator_id', $creator->id)
            ->where('status', MembershipCredit::STATUS_EARNED)->count());
        $this->assertSame(1, MembershipCredit::where('creator_id', $creator->id)
            ->where('status', MembershipCredit::STATUS_REVERSED)->count());

        // Below the first rung, nothing is left standing.
        $tx->forceFill(['refunded_amount' => 600])->save();
        $this->credits->evaluate($creator);

        $this->assertSame(0, MembershipCredit::where('creator_id', $creator->id)
            ->where('status', MembershipCredit::STATUS_EARNED)->count());
    }

    public function test_a_credit_already_spent_is_never_clawed_back(): void
    {
        /*
         * 🚨 THE MONTH HAS ALREADY BEEN GIVEN. Reversing a spent credit would either
         * bill a creator for a month they were told was free, or leave the ledger
         * claiming they still owe it. Same rule the Growth Bonus follows for a reward
         * with `paid_at` set: what has been handed over stays handed over.
         */
        $creator = $this->creator();
        $tx = $this->earn($creator, 1000);
        $this->credits->evaluate($creator);

        MembershipCredit::where('creator_id', $creator->id)
            ->orderBy('id')->first()
            ->forceFill(['status' => MembershipCredit::STATUS_APPLIED, 'applied_at' => now()])->save();

        $tx->forceFill(['refunded_amount' => 1000])->save();
        $this->credits->evaluate($creator);

        $this->assertSame(1, MembershipCredit::where('creator_id', $creator->id)
            ->where('status', MembershipCredit::STATUS_APPLIED)->count(),
            'a spent credit must survive a full refund');
    }

    /* -----------------------------------------------------------------
     | What does and does not count
     | ----------------------------------------------------------------- */

    public function test_a_self_payment_does_not_earn_a_free_month(): void
    {
        // Buying from yourself to earn a reward is the cheapest fraud available.
        $creator = $this->creator();
        $this->earn($creator, 1000, ['supporter_id' => $creator->id]);

        $this->credits->evaluate($creator);

        $this->assertSame(0, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    public function test_unsettled_money_does_not_count(): void
    {
        $creator = $this->creator();
        $this->earn($creator, 1000, ['status' => 'pending']);

        $this->credits->evaluate($creator);

        $this->assertSame(0, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    public function test_earnings_before_the_scheme_started_do_not_count(): void
    {
        // ⚠️ Otherwise the whole back-catalogue pays out on day one, to creators who
        // earned it under no such offer.
        config(['membership_credits.earnings_from' => '2026-09-11']);

        $creator = $this->creator();
        $this->earn($creator, 1000, ['transaction_date' => Carbon::parse('2026-06-01')]);

        $this->credits->evaluate($creator);

        $this->assertSame(0, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    /* -----------------------------------------------------------------
     | Switches and caps
     | ----------------------------------------------------------------- */

    public function test_the_scheme_switch_stops_awards_and_deletes_nothing(): void
    {
        $creator = $this->creator();
        $this->earn($creator, 1000);
        $this->credits->evaluate($creator);

        config(['membership_credits.enabled' => false]);
        $this->credits->evaluate($creator);

        // Switched off, never deleted — client §4.
        $this->assertSame(2, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    public function test_the_stored_balance_can_be_capped(): void
    {
        // ⚠️ Unbounded accumulation is an open-ended liability: a creator earning
        // steadily banks more free months than they will ever use.
        config(['membership_credits.max_months_per_creator' => 3]);

        $creator = $this->creator();
        $this->earn($creator, 10000);

        $this->credits->evaluate($creator);

        $this->assertSame(3, MembershipCredit::where('creator_id', $creator->id)->count());
    }

    public function test_the_creator_sees_progress_to_the_next_threshold(): void
    {
        $creator = $this->creator();
        $this->earn($creator, 620);

        $progress = $this->credits->progressFor($creator);

        $this->assertSame(1, $progress['rungs_reached']);
        $this->assertEqualsWithDelta(380.0, $progress['to_next'], 0.01);
    }
}
