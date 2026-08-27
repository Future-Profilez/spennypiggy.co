<?php

namespace Tests\Feature;

use App\Models\FinancialTransaction;
use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Models\User;
use App\Services\GrowthBonusService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Creator Growth Bonus (brief 25 Aug 2026, client-confirmed 26 Aug 2026).
 *
 * Pins the rules that money depends on: the launch cutoff, the 30-day
 * activation window judged on transaction date, Qualifying Earnings measured on
 * the creator's LISTED SALE VALUE with the self-payment/refund/escrow
 * exclusions, the atomic 150-seat cap, milestone crossing transactions, and
 * refund-driven reversal vs needs_review.
 */
class GrowthBonusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'growth_bonus.enabled' => true,
            'growth_bonus.launch_cutoff' => '2026-08-26',
        ]);
    }

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'default_currency' => 'GBP',
            'stripe_connected_at' => Carbon::parse('2026-09-01 10:00:00'),
            'stripe_details_submitted' => 1,
            'account_id' => 'acct_'.uniqid(),
        ], $overrides));
    }

    /**
     * A completed sale.
     *
     * 🚨 `$listed` IS THE CREATOR'S LISTED PRICE, WHICH IS WHAT QUALIFIES —
     * `net_amount`, per terms clause 2.1. The supporter's charge is grossed up
     * ON TOP of it (roughly 30% on the card profile), so the fixture derives
     * `gross_amount` from the listed value rather than the other way round.
     * Writing these the other way round is what made every threshold in this
     * file mean something different from the threshold a creator sees.
     */
    private function income(User $creator, float $listed, array $overrides = []): FinancialTransaction
    {
        $gross = round($listed * 1.3055, 2);

        return FinancialTransaction::create(array_merge([
            'user_id' => $creator->id,
            'supporter_id' => null,
            'source_type' => 'App\Models\ShopPayment',
            'source_id' => random_int(100000, 999999),
            'type' => 'income',
            'gross_amount' => $gross,
            'platform_fee' => round($gross - $listed, 2),
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => $listed,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'test sale',
            'transaction_date' => Carbon::parse('2026-09-05 12:00:00'),
        ], $overrides));
    }

    private function evaluate(User $creator): ?GrowthBonusProfile
    {
        return app(GrowthBonusService::class)->evaluateCreator($creator->fresh());
    }

    // ── Scheme membership ────────────────────────────────────────────────

    public function test_a_creator_connected_before_the_cutoff_is_not_enrolled(): void
    {
        $creator = $this->creator(['stripe_connected_at' => Carbon::parse('2026-08-20')]);
        $this->income($creator, 150);

        $this->assertNull($this->evaluate($creator));
        $this->assertDatabaseCount('growth_bonus_profiles', 0);
    }

    public function test_a_creator_connected_on_the_cutoff_day_is_enrolled(): void
    {
        $creator = $this->creator(['stripe_connected_at' => Carbon::parse('2026-08-26 09:00:00')]);

        $profile = $this->evaluate($creator);

        $this->assertNotNull($profile);
        $this->assertSame(GrowthBonusProfile::STATUS_PENDING, $profile->status);
        // Deadline fixed from stripe_connected_at + 30 days.
        $this->assertTrue($profile->activation_deadline->eq(Carbon::parse('2026-09-25 09:00:00')));
    }

    public function test_a_bonus_excluded_creator_is_not_enrolled(): void
    {
        $creator = $this->creator(['bonus_scheme_eligible' => 0]);
        $this->assertNull($this->evaluate($creator));
    }

    // ── Activation ───────────────────────────────────────────────────────

    public function test_reaching_the_threshold_inside_the_window_activates_and_claims_a_seat(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 60, ['transaction_date' => Carbon::parse('2026-09-03')]);
        $crossing = $this->income($creator, 45, ['transaction_date' => Carbon::parse('2026-09-06')]);

        $profile = $this->evaluate($creator);

        $this->assertSame(GrowthBonusProfile::STATUS_ACTIVE, $profile->status);
        $this->assertNotNull($profile->seat_claimed_at);
        // 12 months from the CROSSING transaction's date, not from evaluation.
        $this->assertTrue($profile->activated_at->eq(Carbon::parse('2026-09-06')));
        $this->assertTrue($profile->expires_at->eq(Carbon::parse('2027-09-06')));

        // First rung reward exists, tied to the crossing transaction.
        $reward = GrowthBonusReward::where('profile_id', $profile->id)->where('milestone_gmv', 100)->first();
        $this->assertNotNull($reward);
        $this->assertSame(GrowthBonusReward::STATUS_PENDING_VALIDATION, $reward->status);
        $this->assertSame('25.00', (string) $reward->amount);
        $this->assertSame($crossing->id, $reward->qualifying_transaction_id);
        Carbon::setTestNow();
    }

    public function test_missing_the_window_records_the_miss_and_consumes_no_seat(): void
    {
        Carbon::setTestNow('2026-10-15'); // window (1 Sep + 30d) long closed
        $creator = $this->creator();
        $this->income($creator, 60, ['transaction_date' => Carbon::parse('2026-09-10')]);

        $profile = $this->evaluate($creator);

        $this->assertSame(GrowthBonusProfile::STATUS_MISSED, $profile->status);
        $this->assertSame('earnings_below_threshold', $profile->missed_reason);
        $this->assertNull($profile->seat_claimed_at);
        $this->assertSame(0, GrowthBonusProfile::seatsClaimed());
        Carbon::setTestNow();
    }

    public function test_earnings_dated_after_the_deadline_do_not_activate(): void
    {
        Carbon::setTestNow('2026-10-20');
        $creator = $this->creator();
        $this->income($creator, 60, ['transaction_date' => Carbon::parse('2026-09-10')]);
        // Crosses £100 only via a sale AFTER the 1 Oct deadline.
        $this->income($creator, 60, ['transaction_date' => Carbon::parse('2026-10-10')]);

        $profile = $this->evaluate($creator);

        $this->assertSame(GrowthBonusProfile::STATUS_MISSED, $profile->status);
        Carbon::setTestNow();
    }

    public function test_seats_full_records_a_seats_full_miss(): void
    {
        config(['growth_bonus.limits.max_seats' => 1]);
        Carbon::setTestNow('2026-09-10');

        $first = $this->creator();
        $this->income($first, 120, ['transaction_date' => Carbon::parse('2026-09-03')]);
        $this->evaluate($first);

        $second = $this->creator();
        $this->income($second, 120, ['transaction_date' => Carbon::parse('2026-09-04')]);
        $profile = $this->evaluate($second);

        $this->assertSame(GrowthBonusProfile::STATUS_MISSED, $profile->status);
        $this->assertSame('seats_full', $profile->missed_reason);
        $this->assertSame(1, GrowthBonusProfile::seatsClaimed());
        Carbon::setTestNow();
    }

    // ── GMV exclusions ───────────────────────────────────────────────────

    public function test_self_payments_and_non_completed_rows_are_excluded(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        // Self-payment: supporter is the creator.
        $this->income($creator, 200, ['supporter_id' => $creator->id]);
        // Refunded / disputed / held rows.
        $this->income($creator, 200, ['status' => 'refunded']);
        $this->income($creator, 200, ['status' => 'disputed']);
        $this->income($creator, 200, ['status' => 'review_hold']);

        $gmv = app(GrowthBonusService::class)->computeGmv($creator->fresh());

        $this->assertSame(0.0, $gmv['total']);
        Carbon::setTestNow();
    }

    /**
     * 🚨 A REFUND IS OF THE SUPPORTER'S GROSS; QUALIFYING EARNINGS ARE THE
     * CREATOR'S LISTED VALUE. Subtracting one from the other would remove more
     * than the sale ever added — here a £60 refund would take a £150 listing to
     * £90 when the creator only ever earned £150 of a £195.83 charge. It is
     * scaled by the row's own net/gross ratio instead: 150 − 60 × (150/195.83).
     */
    public function test_a_partial_refund_is_removed_in_proportion(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        // Listed £150 → supporter charged £195.83. £60 of that is refunded.
        $this->income($creator, 150, ['refunded_amount' => 60]);

        $gmv = app(GrowthBonusService::class)->computeGmv($creator->fresh());

        $this->assertSame(104.04, $gmv['total']);
        Carbon::setTestNow();
    }

    /**
     * ⚠️ The proportional rule must not be able to push a row NEGATIVE — a full
     * refund takes the sale to zero, never below it, or one refunded sale would
     * eat into a creator's other genuine earnings.
     */
    public function test_a_full_refund_takes_a_row_to_zero_not_below(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        // Listed £150, the whole £195.83 charge refunded.
        $this->income($creator, 150, ['refunded_amount' => 195.83]);
        $this->income($creator, 40);

        $gmv = app(GrowthBonusService::class)->computeGmv($creator->fresh());

        $this->assertSame(40.0, $gmv['total']);
        Carbon::setTestNow();
    }

    /**
     * 🚨 THE BASE IS THE LISTED PRICE, NOT THE CHARGE (terms clause 2.1, client
     * decision 26 Aug 2026). A single £100 listing reaches the first rung
     * exactly — counting the £130.55 the supporter pays would have reached it
     * on a £77 listing, i.e. every creator climbing ~30% faster than the terms
     * promise.
     */
    public function test_qualifying_earnings_are_the_listed_price_not_the_supporter_charge(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $tx = $this->income($creator, 100, ['transaction_date' => Carbon::parse('2026-09-03')]);

        // The fixture really does charge the supporter more than the listing.
        $this->assertSame('130.55', (string) $tx->gross_amount);

        $gmv = app(GrowthBonusService::class)->computeGmv($creator->fresh());
        $this->assertSame(100.0, $gmv['total']);

        // And it is exactly enough to activate — no more, no less.
        $profile = $this->evaluate($creator);
        $this->assertSame(GrowthBonusProfile::STATUS_ACTIVE, $profile->status);
        $this->assertSame(1, GrowthBonusReward::count());
        Carbon::setTestNow();
    }

    /**
     * ⚠️ A creator whose listed sales fall just short does NOT activate, even
     * though the supporters between them paid well over £100.
     */
    public function test_a_supporter_charge_over_the_threshold_does_not_activate(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        // Listed £90 → supporter charged £117.50, over the £100 rung.
        $this->income($creator, 90, ['transaction_date' => Carbon::parse('2026-09-03')]);

        $profile = $this->evaluate($creator);

        $this->assertSame(GrowthBonusProfile::STATUS_PENDING, $profile->status);
        $this->assertSame(0, GrowthBonusReward::count());
        Carbon::setTestNow();
    }

    public function test_an_unconvertible_currency_row_is_counted_not_guessed(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        // Foreign-currency row with no frozen GBP conversion available.
        $this->income($creator, 5000, ['currency' => 'XXX', 'gbp_amount' => null, 'gbp_rate' => null]);
        $this->income($creator, 50);

        $gmv = app(GrowthBonusService::class)->computeGmv($creator->fresh());

        $this->assertSame(50.0, $gmv['total']);
        $this->assertSame(1, $gmv['unconverted']);
        Carbon::setTestNow();
    }

    // ── Milestones ───────────────────────────────────────────────────────

    public function test_crossing_multiple_rungs_creates_a_reward_per_rung(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 300, ['transaction_date' => Carbon::parse('2026-09-03')]);

        $profile = $this->evaluate($creator);

        $rewards = GrowthBonusReward::where('profile_id', $profile->id)->orderBy('milestone_gmv')->get();
        $this->assertSame([100.0, 250.0], $rewards->pluck('milestone_gmv')->map(fn ($v) => (float) $v)->all());
        $this->assertSame([25.0, 25.0], $rewards->pluck('amount')->map(fn ($v) => (float) $v)->all());
        $this->assertSame('250.00', (string) $profile->fresh()->current_milestone);
        Carbon::setTestNow();
    }

    public function test_re_running_the_evaluator_never_duplicates_rewards(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 300);

        $this->evaluate($creator);
        $this->evaluate($creator);

        $this->assertSame(2, GrowthBonusReward::count());
        Carbon::setTestNow();
    }

    // ── Refund recalculation (brief §4) ──────────────────────────────────

    public function test_a_refund_reverses_an_unpaid_reward_and_a_new_sale_restores_it(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $tx = $this->income($creator, 120);
        $this->evaluate($creator);

        // Full refund pulls GMV to £0 — unpaid £25 reward reverses.
        $tx->forceFill(['status' => 'refunded'])->save();
        $this->evaluate($creator);

        $reward = GrowthBonusReward::where('milestone_gmv', 100)->first();
        $this->assertSame(GrowthBonusReward::STATUS_REVERSED, $reward->status);

        // New genuine sale re-crosses the rung — the same row is restored.
        $this->income($creator, 130, ['transaction_date' => Carbon::parse('2026-09-08')]);
        $this->evaluate($creator);

        $this->assertSame(GrowthBonusReward::STATUS_PENDING_VALIDATION, $reward->fresh()->status);
        $this->assertSame(1, GrowthBonusReward::count());
        Carbon::setTestNow();
    }

    /**
     * 🚨 A MILESTONE IS PAID ONCE, EVER (client rule, 26 Aug 2026). The engine
     * never reverses a PAID reward — it flags it — but an ADMIN can, and without
     * the `paid_at` guard in `syncRewards` a recovery in earnings afterwards
     * would flip that reward back to payable and it could be paid a second time.
     */
    public function test_an_admin_reversed_reward_that_was_paid_is_never_restored(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 120, ['transaction_date' => Carbon::parse('2026-09-03')]);
        $this->evaluate($creator);

        $reward = GrowthBonusReward::where('milestone_gmv', 100)->first();
        $reward->forceFill([
            'status' => GrowthBonusReward::STATUS_PAID,
            'paid_at' => now(),
        ])->save();

        // An admin reverses it after payment.
        $reward->forceFill([
            'status' => GrowthBonusReward::STATUS_REVERSED,
            'reversed_at' => now(),
        ])->save();

        // More genuine sales arrive; the rung is comfortably met again.
        $this->income($creator, 200, ['transaction_date' => Carbon::parse('2026-09-08')]);
        $this->evaluate($creator);

        // It stays reversed — a paid milestone cannot become payable again.
        $this->assertSame(GrowthBonusReward::STATUS_REVERSED, $reward->fresh()->status);
        Carbon::setTestNow();
    }

    public function test_a_refund_flags_a_paid_reward_for_review_instead_of_reversing(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $tx = $this->income($creator, 120);
        $this->evaluate($creator);

        GrowthBonusReward::where('milestone_gmv', 100)->first()
            ->forceFill(['status' => GrowthBonusReward::STATUS_PAID, 'paid_at' => now()])->save();

        $tx->forceFill(['status' => 'refunded'])->save();
        $this->evaluate($creator);

        $reward = GrowthBonusReward::where('milestone_gmv', 100)->first();
        $this->assertSame(GrowthBonusReward::STATUS_PAID, $reward->status);
        $this->assertTrue($reward->needs_review);
        Carbon::setTestNow();
    }

    // ── Expiry ───────────────────────────────────────────────────────────

    public function test_sales_after_expiry_earn_no_further_milestones(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 120, ['transaction_date' => Carbon::parse('2026-09-03')]);
        $this->evaluate($creator); // activates; expires 3 Sep 2027

        // 13 months on: a big sale lands after expiry.
        Carbon::setTestNow('2027-10-10');
        $this->income($creator, 500, ['transaction_date' => Carbon::parse('2027-10-01')]);
        $profile = $this->evaluate($creator);

        $this->assertSame(GrowthBonusProfile::STATUS_EXPIRED, $profile->status);
        // Only the pre-expiry £120 counts — no £250 rung.
        $this->assertSame(1, GrowthBonusReward::count());
        // Seat stays consumed after expiry.
        $this->assertSame(1, GrowthBonusProfile::seatsClaimed());
        Carbon::setTestNow();
    }

    // ── Admin adjustment ─────────────────────────────────────────────────

    public function test_an_admin_gmv_adjustment_counts_toward_milestones(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 80, ['transaction_date' => Carbon::parse('2026-09-03')]);
        $profile = $this->evaluate($creator);
        $this->assertSame(GrowthBonusProfile::STATUS_PENDING, $profile->status);

        $profile->forceFill(['gmv_adjustment' => 30])->save();
        $profile = $this->evaluate($creator);

        $this->assertSame(GrowthBonusProfile::STATUS_ACTIVE, $profile->status);
        $this->assertSame(1, GrowthBonusReward::count());
        Carbon::setTestNow();
    }

    // ── Command gating ───────────────────────────────────────────────────

    public function test_the_command_is_a_no_op_when_disabled(): void
    {
        config(['growth_bonus.enabled' => false]);
        $creator = $this->creator();
        $this->income($creator, 500);

        $this->artisan('growth-bonus:evaluate')->assertSuccessful();

        $this->assertDatabaseCount('growth_bonus_profiles', 0);
    }

    public function test_the_command_evaluates_eligible_creators(): void
    {
        Carbon::setTestNow('2026-09-10');
        $creator = $this->creator();
        $this->income($creator, 120, ['transaction_date' => Carbon::parse('2026-09-03')]);

        $this->artisan('growth-bonus:evaluate')->assertSuccessful();

        $this->assertSame(GrowthBonusProfile::STATUS_ACTIVE, $creator->fresh()->growthBonusProfile->status);
        Carbon::setTestNow();
    }
}
