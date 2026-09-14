<?php

namespace Tests\Feature;

use App\Models\CreatorReferral;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\CreatorReferralService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

/**
 * Creator referral — a referred creator reaching £2,000 settled earns the referrer £50
 * (client §5).
 *
 * 🚨 REAL CASH, ONCE, PER REFERRED CREATOR. Every rule below exists because getting it
 * wrong either pays somebody twice or moves the goalposts under somebody part-way there.
 */
class CreatorReferralRewardTest extends TestCase
{
    use RefreshDatabase;

    private CreatorReferralService $referrals;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'referral.qualifying_gmv' => 2000,
            'referral.reward_amount' => 50,
            'referral.fraud.min_referred_account_age_days' => 0,
            'referral.fraud.block_shared_signup_ip' => false,
        ]);

        $this->referrals = app(CreatorReferralService::class);
    }

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'default_currency' => 'GBP',
            'stripe_connected_at' => now()->subMonth(),
        ], $overrides));
    }

    private function referral(User $referrer, User $referred, array $overrides = []): CreatorReferral
    {
        return CreatorReferral::create(array_merge([
            'referrer_creator_id' => $referrer->id,
            'referred_creator_id' => $referred->id,
            'lifetime_gmv' => 0,
            'status' => CreatorReferralService::STATUS_IN_PROGRESS,
            'qualifying_threshold' => 2000,
        ], $overrides));
    }

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
     | Qualifying
     | ----------------------------------------------------------------- */

    public function test_reaching_the_threshold_qualifies_the_referral(): void
    {
        $referrer = $this->creator();
        $referred = $this->creator();
        $r = $this->referral($referrer, $referred);

        $this->earn($referred, 1999);
        $this->referrals->recalculate($referred->id);
        $this->assertSame(CreatorReferralService::STATUS_IN_PROGRESS, $r->fresh()->status);

        $this->earn($referred, 1);
        $this->referrals->recalculate($referred->id);
        $this->assertSame(CreatorReferralService::STATUS_QUALIFIED, $r->fresh()->status);
    }

    public function test_a_refund_below_the_threshold_un_qualifies_an_unpaid_referral(): void
    {
        // Client §5: refunds and chargebacks reduce progress.
        $referrer = $this->creator();
        $referred = $this->creator();
        $r = $this->referral($referrer, $referred);

        $tx = $this->earn($referred, 2000);
        $this->referrals->recalculate($referred->id);
        $this->assertSame(CreatorReferralService::STATUS_QUALIFIED, $r->fresh()->status);

        $tx->forceFill(['refunded_amount' => 500])->save();
        $this->referrals->recalculate($referred->id);

        $this->assertSame(CreatorReferralService::STATUS_IN_PROGRESS, $r->fresh()->status);
        $this->assertNull($r->fresh()->qualified_at);
    }

    /* -----------------------------------------------------------------
     | The rules that stop it paying twice
     | ----------------------------------------------------------------- */

    public function test_a_paid_referral_is_never_recalculated(): void
    {
        /*
         * 🚨 THE £50 HAS ALREADY GONE OUT. Re-qualifying a paid referral is how the
         * same reward is paid a second time, and nothing downstream would notice — the
         * row would simply look freshly qualified again.
         */
        $referrer = $this->creator();
        $referred = $this->creator();
        $r = $this->referral($referrer, $referred, [
            'status' => CreatorReferralService::STATUS_PAID,
            'lifetime_gmv' => 2000,
            'qualified_at' => now()->subWeek(),
        ]);

        /*
         * ⚠️ EARNINGS STAY ABOVE THE THRESHOLD, DELIBERATELY. An earlier version of
         * this test refunded the lot — which made earnings £0, so the recalculation
         * bailed out on "below threshold" and never reached the status guard at all.
         * It passed with BOTH guards removed: a test that cannot fail proves nothing.
         *
         * Above the threshold is the only state where re-qualifying is what the code
         * would otherwise do, so it is the only state that tests the guard.
         */
        $this->earn($referred, 2500);

        $this->referrals->recalculate($referred->id);

        $fresh = $r->fresh();
        $this->assertSame(CreatorReferralService::STATUS_PAID, $fresh->status,
            'a paid referral must not be reopened by anything');
        $this->assertTrue(
            $fresh->qualified_at->equalTo($r->qualified_at),
            'and its qualifying date must not be restamped'
        );
    }

    public function test_a_referral_already_queued_for_payout_is_left_alone(): void
    {
        // Same reasoning one step earlier: the money is in flight.
        $referrer = $this->creator();
        $referred = $this->creator();
        $r = $this->referral($referrer, $referred, [
            'status' => CreatorReferralService::STATUS_PAYOUT_REQUESTED,
            'lifetime_gmv' => 2000,
        ]);

        // Above threshold for the same reason as above — otherwise the guard is never
        // the thing that stops it.
        $this->earn($referred, 2500);

        $this->referrals->recalculate($referred->id);

        $this->assertSame(CreatorReferralService::STATUS_PAYOUT_REQUESTED, $r->fresh()->status);
    }

    /* -----------------------------------------------------------------
     | The goalposts
     | ----------------------------------------------------------------- */

    public function test_an_in_flight_referral_keeps_the_threshold_it_was_made_under(): void
    {
        /*
         * 🚨 THE THRESHOLD MOVED FROM £1,000 TO £2,000 ON 11 Sep 2026. Somebody
         * part-way to qualifying must not silently have the goalposts moved — the
         * figure is stamped on the row at creation and read from there, never from
         * today's config.
         */
        $referrer = $this->creator();
        $referred = $this->creator();
        $r = $this->referral($referrer, $referred, ['qualifying_threshold' => 1000]);

        $this->earn($referred, 1000);
        $this->referrals->recalculate($referred->id);

        $this->assertSame(CreatorReferralService::STATUS_QUALIFIED, $r->fresh()->status,
            'judged at its own stamped £1,000, not at today\'s £2,000');
    }

    public function test_a_new_referral_is_made_under_the_current_threshold(): void
    {
        $referrer = $this->creator();
        $referred = $this->creator();
        $r = $this->referral($referrer, $referred);

        $this->earn($referred, 1000);
        $this->referrals->recalculate($referred->id);

        $this->assertSame(CreatorReferralService::STATUS_IN_PROGRESS, $r->fresh()->status);
    }

    /* -----------------------------------------------------------------
     | Fraud
     | ----------------------------------------------------------------- */

    public function test_self_referral_is_blocked(): void
    {
        $creator = $this->creator();
        $r = $this->referral($creator, $creator);

        $this->assertSame(
            CreatorReferralService::BLOCK_SELF_REFERRAL,
            $this->referrals->blockReasonFor($r->fresh())
        );
    }

    public function test_a_referred_account_younger_than_the_minimum_is_blocked(): void
    {
        config(['referral.fraud.min_referred_account_age_days' => 7]);

        $referrer = $this->creator();
        $referred = $this->creator(['created_at' => now()->subDay()]);
        $r = $this->referral($referrer, $referred);

        $this->assertSame(
            CreatorReferralService::BLOCK_ACCOUNT_TOO_NEW,
            $this->referrals->blockReasonFor($r->fresh())
        );
    }

    /* -----------------------------------------------------------------
     | What the referrer is shown
     | ----------------------------------------------------------------- */

    public function test_the_five_stages_read_in_order(): void
    {
        $referrer = $this->creator();

        // "Active" means they CAN sell — telling a referrer their referral is active
        // while nothing can be bought from them is untrue.
        $notConnected = $this->creator(['stripe_connected_at' => null]);
        $this->assertSame('signed_up', $this->referrals->stageFor($this->referral($referrer, $notConnected)));

        $connected = $this->creator();
        $this->assertSame('active', $this->referrals->stageFor($this->referral($referrer, $connected)));

        $earning = $this->creator();
        $this->assertSame('earning', $this->referrals->stageFor(
            $this->referral($referrer, $earning, ['lifetime_gmv' => 250])
        ));

        $qualified = $this->creator();
        $this->assertSame('qualified', $this->referrals->stageFor(
            $this->referral($referrer, $qualified, ['status' => CreatorReferralService::STATUS_QUALIFIED])
        ));

        $paid = $this->creator();
        $this->assertSame('paid', $this->referrals->stageFor(
            $this->referral($referrer, $paid, ['status' => CreatorReferralService::STATUS_PAID])
        ));
    }
}
