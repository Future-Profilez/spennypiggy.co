<?php

namespace Tests\Feature;

use App\Jobs\EvaluateGrowthBonusForCreator;
use App\Jobs\SendEngagementNotification;
use App\Mail\GrowthBonusMilestoneReached;
use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Models\User;
use App\Services\GrowthBonusService;
use App\Support\GrowthBonusPanelPayload;
use Carbon\Carbon;
use Illuminate\Contracts\Queue\ShouldBeUnique;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The creator being TOLD they crossed a milestone, and the dashboard widget
 * that shows it — the Phase 2 half of the brief.
 *
 * 🚨 THE DEDUP IS THE POINT. The evaluator runs daily and is idempotent, so
 * without a claim keyed on (creator, rung) a creator would be told about the
 * same £25 every morning for as long as they stayed above the threshold.
 */
class GrowthBonusNotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'growth_bonus.enabled' => true,
            'growth_bonus.launch_cutoff' => '2026-08-26',
        ]);

        Carbon::setTestNow('2026-09-10');
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function creator(): User
    {
        return User::factory()->create([
            'role' => 1,
            'default_currency' => 'GBP',
            'stripe_connected_at' => Carbon::parse('2026-09-01 10:00:00'),
            'stripe_details_submitted' => 1,
            'account_id' => 'acct_'.uniqid(),
        ]);
    }

    /** ⚠️ `$listed` is the creator's listed price — see GrowthBonusTest. */
    private function income(User $creator, float $listed, ?string $date = null): FinancialTransaction
    {
        $gross = round($listed * 1.3055, 2);

        return FinancialTransaction::create([
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
            'transaction_date' => Carbon::parse($date ?? '2026-09-03'),
        ]);
    }

    private function evaluate(User $creator): ?GrowthBonusProfile
    {
        return app(GrowthBonusService::class)->evaluateCreator($creator->fresh());
    }

    // ── The notification ─────────────────────────────────────────────────

    public function test_crossing_a_milestone_queues_a_notification(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->userId === $creator->id,
        );
    }

    /**
     * 🚨 QUEUED, NEVER SENT INLINE — the dispatcher makes a synchronous HTTP
     * call per channel and this runs in a loop over every creator, on a Lambda
     * with a 60-second budget.
     */
    public function test_the_notification_is_queued_rather_than_sent_inline(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    public function test_the_same_milestone_is_never_announced_twice(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);

        $this->evaluate($creator);
        $this->evaluate($creator);
        $this->evaluate($creator);

        Queue::assertPushed(SendEngagementNotification::class, 1);
        $this->assertSame(1, EngagementNotification::where('type', 'growth_bonus_milestone')->count());
    }

    public function test_each_rung_gets_its_own_announcement(): void
    {
        Queue::fake();

        $creator = $this->creator();
        // £300 crosses both £100 and £250 in one pass.
        $this->income($creator, 300);
        $this->evaluate($creator);

        Queue::assertPushed(SendEngagementNotification::class, 2);
    }

    /**
     * ⚠️ A reward restored after a refund is the SAME milestone the creator was
     * already told about — announcing it again reads as a second payment.
     */
    public function test_a_restored_milestone_is_not_announced_again(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $tx = $this->income($creator, 120);
        $this->evaluate($creator);

        $tx->forceFill(['status' => 'refunded'])->save();
        $this->evaluate($creator);

        $this->income($creator, 130, '2026-09-08');
        $this->evaluate($creator);

        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    /**
     * 🚨 Transactional, not marketing: it tells a creator about money they have
     * earned, so a marketing opt-out must not silence it.
     */
    public function test_the_notification_is_transactional(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->marketing === false,
        );
    }

    public function test_the_notification_carries_the_milestone_mailable(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => ($job->payload['mailable'] ?? null) === GrowthBonusMilestoneReached::class
                && ($job->payload['url'] ?? null) === '/growth-bonus',
        );
    }

    /**
     * ⚠️ The rung is the creator's listed sale value, so the body uses the
     * terms' defined term. It lands on a lock screen where there is no room to
     * qualify a figure later, so it must name what the threshold measures — a
     * bare "you passed £100" invites the creator to read it as the charge.
     */
    public function test_the_push_body_names_qualifying_earnings(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Queue::assertPushed(SendEngagementNotification::class, function ($job) {
            $body = strtolower($job->payload['body'] ?? '');

            return str_contains($body, 'qualifying earnings')
                && ! str_contains($body, 'customer spend');
        });
    }

    /**
     * ⚠️ The mail must never name a payout day: the bonus rides the payout run
     * carrying the qualifying sale, so it lands 7–13 days after crossing.
     */
    public function test_the_mail_never_promises_a_named_day(): void
    {
        $creator = $this->creator();

        $rendered = (new GrowthBonusMilestoneReached($creator, 100, 25, 25, 250, 25))->render();

        $this->assertStringContainsString('same payout as the sales that qualified you', $rendered);

        foreach (['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as $day) {
            $this->assertStringNotContainsString($day, $rendered);
        }
    }

    /*
     * ⚠️ NO BESPOKE "are its properties protected?" TEST HERE, DELIBERATELY.
     * `tests/Feature/MailableViewDataCollisionTest.php` is the house guard and
     * it already scans EVERY class in `app/Mail`, including this one — a second
     * copy scoped to one mailable is the version that rots, and reflection
     * reports trait- and base-class properties as the using class's own, which
     * makes a hand-rolled one fail for reasons unrelated to the rule.
     */

    // ── Instant evaluation on a sale ─────────────────────────────────────

    /**
     * 🚨 A CREATOR WHO CROSSES A MILESTONE AT LUNCHTIME MUST NOT WAIT UNTIL THE
     * NEXT MORNING TO SEE IT. The money moved and the ledger already knows; the
     * daily pass stays the source of truth, this only removes the lag.
     */
    public function test_a_sale_queues_an_immediate_re_evaluation(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);

        Queue::assertPushed(
            EvaluateGrowthBonusForCreator::class,
            fn ($job) => $job->creatorId === $creator->id,
        );
    }

    /**
     * ⚠️ A basket spanning several items writes several ledger rows within a
     * second, and each would otherwise recompute the same creator's whole
     * history. The job is unique per creator.
     */
    public function test_the_instant_evaluation_is_unique_per_creator(): void
    {
        $this->assertTrue(
            is_a(EvaluateGrowthBonusForCreator::class, ShouldBeUnique::class, true),
            'A basket must not queue one full recompute per line item.',
        );
    }

    /** Nothing is queued while the programme is switched off. */
    public function test_no_instant_evaluation_while_the_scheme_is_dark(): void
    {
        config(['growth_bonus.enabled' => false]);
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 120);

        Queue::assertNotPushed(EvaluateGrowthBonusForCreator::class);
    }

    /** ⚠️ Expenditure and refunds are not sales — only income rows trigger it. */
    public function test_a_non_income_row_queues_nothing(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $tx = $this->income($creator, 120);
        $tx->forceFill(['type' => 'expense'])->save();

        // The income row above queued one; the update must not queue a second.
        Queue::assertPushed(EvaluateGrowthBonusForCreator::class, 1);
    }

    // ── The outcomes that are not a milestone ────────────────────────────

    /**
     * 🚨 THE WORST GAP THIS FEATURE HAD. A creator who reached the target in
     * time and lost the last place was told NOTHING — they would find out only
     * by opening the bonus page themselves.
     */
    public function test_a_creator_who_loses_the_last_place_is_told(): void
    {
        config(['growth_bonus.limits.max_seats' => 1]);
        Queue::fake();

        $first = $this->creator();
        $this->income($first, 120, '2026-09-02');
        $this->evaluate($first);

        $second = $this->creator();
        $this->income($second, 120, '2026-09-03');
        $this->evaluate($second);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->userId === $second->id
                && $job->type === 'growth_bonus_outcome'
                && str_contains(strtolower($job->payload['title'] ?? ''), 'places have gone'),
        );
    }

    public function test_a_closed_window_is_explained(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 40);

        // Past the 1 Sep + 30 day deadline.
        Carbon::setTestNow('2026-10-15');
        $this->evaluate($creator);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->type === 'growth_bonus_outcome'
                && str_contains(strtolower($job->payload['title'] ?? ''), 'window has closed'),
        );
    }

    /**
     * ⚠️ The warning is the only one that arrives while the creator can still
     * act, so it must carry BOTH how long is left and how much more is needed.
     */
    public function test_a_creator_is_warned_before_the_window_closes(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 60);

        // Deadline is 1 Oct; five days out.
        Carbon::setTestNow('2026-09-26');
        $this->evaluate($creator);

        Queue::assertPushed(SendEngagementNotification::class, function ($job) {
            if ($job->type !== 'growth_bonus_outcome') {
                return false;
            }

            // £40 still needed, 5 days left.
            return str_contains($job->payload['title'] ?? '', '40')
                && str_contains($job->payload['body'] ?? '', '5 day');
        });
    }

    public function test_no_warning_while_the_deadline_is_far_off(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 40);
        $this->evaluate($creator);

        Queue::assertNotPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->type === 'growth_bonus_outcome',
        );
    }

    public function test_an_outcome_is_never_announced_twice(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 60);

        Carbon::setTestNow('2026-09-26');
        $this->evaluate($creator);
        $this->evaluate($creator);
        $this->evaluate($creator);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->type === 'growth_bonus_outcome',
            1,
        );
    }

    /** It is about their own account, so a marketing opt-out must not silence it. */
    public function test_outcome_notifications_are_transactional(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 60);

        Carbon::setTestNow('2026-09-26');
        $this->evaluate($creator);

        Queue::assertPushed(
            SendEngagementNotification::class,
            fn ($job) => $job->type !== 'growth_bonus_outcome' || $job->marketing === false,
        );
    }

    // ── The dashboard payload ────────────────────────────────────────────

    public function test_the_dashboard_payload_is_null_while_the_scheme_is_dark(): void
    {
        config(['growth_bonus.enabled' => false]);

        $creator = $this->creator();
        $this->income($creator, 120);

        $this->assertNull(GrowthBonusPanelPayload::forDashboard($creator));
    }

    public function test_the_dashboard_payload_is_null_for_a_creator_not_in_the_programme(): void
    {
        $this->assertNull(GrowthBonusPanelPayload::forDashboard($this->creator()));
    }

    /**
     * 🚨 The bar measures the CURRENT LEG, not the whole ladder. £700 sits
     * between the £500 and £1,000 rungs, so it is 40% of that leg — measured
     * from zero it would read 70% and then appear to fall backwards on crossing.
     */
    public function test_the_progress_bar_measures_the_current_leg(): void
    {
        $creator = $this->creator();
        $this->income($creator, 700);
        $profile = $this->evaluate($creator);

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame(500.0, (float) $profile->current_milestone);
        $this->assertSame(1000.0, $panel['next_milestone']);
        $this->assertSame(40, $panel['progress_pct']);
    }

    public function test_the_payload_reports_days_left_only_while_pending(): void
    {
        $creator = $this->creator();
        $this->income($creator, 40);
        $this->evaluate($creator);

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame('pending', $panel['status']);
        // Connected 1 Sep, 30-day window, "today" is 10 Sep → 21 days left.
        $this->assertSame(21, $panel['days_left']);
    }

    public function test_days_left_is_never_negative(): void
    {
        $creator = $this->creator();
        $this->income($creator, 40);
        $this->evaluate($creator);

        // Past the deadline but before the evaluator has recorded the miss.
        Carbon::setTestNow('2026-10-15');
        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame(0, $panel['days_left']);
    }

    /**
     * The widget and the `/growth-bonus` page must never disagree on the
     * creator's own screen — both read this one shape.
     */
    /**
     * 🚨 "Unlocked" tells a creator they SOLD enough. This tells them where the
     * money is — without it the page shows "£25 earned / £0 paid" and no way to
     * tell whether the platform has forgotten.
     */
    public function test_each_milestone_carries_its_payment_state(): void
    {
        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());
        $first = $panel['milestones'][0];

        $this->assertSame(100.0, $first['gmv']);
        $this->assertSame('pending_validation', $first['status']);
        $this->assertNull($first['paid_at']);
        $this->assertNotNull($first['expected_payout']);
    }

    /**
     * 🚨 THE EXPECTED DATE IS THE PAYOUT RUN'S OWN RULE, NOT A GUESS. The run
     * goes out every Friday and pays transactions completed on or before the
     * PREVIOUS Friday — so a sale on Saturday 5 Sep waits past the 11th (six
     * days old) and lands on Friday 18 September.
     */
    public function test_the_expected_payout_is_the_first_friday_seven_days_on(): void
    {
        $creator = $this->creator();
        // 5 Sep 2026 is a Saturday.
        $this->income($creator, 120, '2026-09-05');
        $this->evaluate($creator);

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame('2026-09-18', $panel['milestones'][0]['expected_payout']);
    }

    /** A paid reward states when, and stops advertising an expectation. */
    public function test_a_paid_reward_reports_the_date_it_was_paid(): void
    {
        $creator = $this->creator();
        $this->income($creator, 120);
        $profile = $this->evaluate($creator);

        $profile->rewards()->first()->forceFill([
            'status' => GrowthBonusReward::STATUS_PAID,
            'paid_at' => Carbon::parse('2026-09-18'),
        ])->save();

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());
        $first = $panel['milestones'][0];

        $this->assertSame('paid', $first['status']);
        $this->assertSame('2026-09-18', $first['paid_at']);
        $this->assertNull($first['expected_payout']);
    }

    /** The celebration fires for a fresh unlock… */
    public function test_a_fresh_milestone_is_offered_for_celebration(): void
    {
        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame(100.0, $panel['just_unlocked']['gmv']);
        $this->assertSame(25.0, $panel['just_unlocked']['amount']);
    }

    /** …and not for one the creator was told about weeks ago. */
    public function test_an_old_milestone_is_not_celebrated_again(): void
    {
        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Carbon::setTestNow('2026-09-30');

        $this->assertNull(
            GrowthBonusPanelPayload::forDashboard($creator->fresh())['just_unlocked'],
        );
    }

    /**
     * 🚨 THE CREATOR'S FIGURE IS COMPUTED LIVE, NOT READ FROM THE SNAPSHOT.
     * The stored `qualifying_gmv` is only as fresh as the last evaluation, so a
     * creator who sold twenty minutes ago was shown a number that disagreed
     * with the Total Earned card beside it — while the ledger both of them read
     * was already correct.
     */
    /**
     * 🚨 The card must not name a target the creator has already passed. The
     * figure is live and the status is not, so between a sale and the evaluator
     * the widget read "Earn £100 to unlock £25" to a creator at £108 — directly
     * above a "To go" measured to the NEXT rung.
     */
    /**
     * 🚨 "Bonus earned" summed the reward ROWS while the figure beside it was
     * computed live, so a creator at £385 — two rungs behind them — read £25.
     */
    public function test_a_crossed_rung_counts_as_earned_before_its_row_exists(): void
    {
        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        Queue::fake();
        $this->income($creator, 265, '2026-09-08'); // £385 total: rungs 1 and 2

        $shown = GrowthBonusPanelPayload::forDashboard($creator->fresh());
        $ladder = config('growth_bonus.ladder');

        $this->assertSame(1, GrowthBonusReward::where('creator_id', $creator->id)->count());
        $this->assertSame(
            (float) $ladder[0]['amount'] + (float) $ladder[1]['amount'],
            $shown['earned_total'],
        );
        $this->assertSame(0.0, $shown['paid_total']);
    }

    /**
     * ⚠️ The other direction: a PAID reward is never auto-clawed back, so its
     * rung stays earned even after a refund drops the live figure below it.
     */
    public function test_a_paid_reward_stays_earned_when_gmv_falls_back(): void
    {
        $creator = $this->creator();
        $this->income($creator, 120);
        $this->evaluate($creator);

        GrowthBonusReward::where('creator_id', $creator->id)
            ->update(['status' => GrowthBonusReward::STATUS_PAID, 'paid_at' => now()]);

        // The ladder alone would no longer count this rung.
        $profile = GrowthBonusProfile::where('creator_id', $creator->id)->first();
        $shown = GrowthBonusPanelPayload::shape($profile->fresh(), ['total' => 10.0, 'unconverted' => 0]);

        $this->assertSame(10.0, $shown['qualifying_gmv']);
        $this->assertSame((float) config('growth_bonus.ladder')[0]['amount'], $shown['earned_total']);
    }

    public function test_the_activation_reward_is_the_first_rung_not_the_next_one(): void
    {
        $creator = $this->creator();
        $this->income($creator, 60);
        $this->evaluate($creator);

        // ⚠️ Faked only NOW: the profile row is the evaluator's to create, so a
        // fake from the start leaves nothing for the dashboard to read at all.
        Queue::fake();
        $this->income($creator, 48, '2026-09-08');

        $shown = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame(GrowthBonusProfile::STATUS_PENDING, $shown['status']);
        $this->assertGreaterThanOrEqual($shown['activation_gmv'], $shown['qualifying_gmv']);

        $ladder = config('growth_bonus.ladder');
        $this->assertSame((float) $ladder[0]['amount'], $shown['first_reward']);
    }

    public function test_the_dashboard_figure_does_not_wait_for_the_evaluator(): void
    {
        // ⚠️ The suite runs the queue SYNC, so the ledger hook's job would
        // refresh the snapshot the instant the sale is written — which is the
        // very lag this test exists to reproduce.
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 60);
        $this->evaluate($creator);

        // A sale AFTER the last evaluation. Nothing is run.
        $this->income($creator, 25, '2026-09-08');

        $stored = (float) GrowthBonusProfile::where('creator_id', $creator->id)
            ->value('qualifying_gmv');
        $shown = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $this->assertSame(60.0, $stored, 'The snapshot is deliberately stale.');
        $this->assertSame(85.0, $shown['qualifying_gmv'], 'The creator must see the sale.');
        $this->assertTrue($shown['awaiting_evaluation']);
    }

    /**
     * ⚠️ …but the page must NEVER mint money records. Activation, seats and
     * rewards belong to the evaluator: a GET that claims one of the 150 places
     * would claim it again on a refresh.
     */
    public function test_rendering_the_dashboard_never_activates_or_claims_a_seat(): void
    {
        // Same reason: without this the hook's job activates them, and the test
        // could never tell a page render apart from an evaluation.
        Queue::fake();

        $creator = $this->creator();
        $this->income($creator, 60);
        $this->evaluate($creator);

        // Enough to cross £100, but only the page is rendered.
        $this->income($creator, 80, '2026-09-08');
        GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $profile = GrowthBonusProfile::where('creator_id', $creator->id)->first();

        $this->assertSame(GrowthBonusProfile::STATUS_PENDING, $profile->status);
        $this->assertNull($profile->seat_claimed_at);
        $this->assertSame(0, GrowthBonusProfile::seatsClaimed());
        $this->assertSame(0, $profile->rewards()->count());
    }

    public function test_the_widget_and_the_page_report_the_same_figures(): void
    {
        $creator = $this->creator();
        $this->income($creator, 300);
        $this->evaluate($creator);

        $panel = GrowthBonusPanelPayload::forDashboard($creator->fresh());

        $page = $this->actingAs($creator)->get('/growth-bonus')
            ->viewData('page')['props']['progress'];

        $this->assertSame((float) $panel['qualifying_gmv'], (float) $page['qualifying_gmv']);
        $this->assertSame((float) $panel['earned_total'], (float) $page['earned_total']);
        $this->assertSame((float) $panel['next_milestone'], (float) $page['next_milestone']);
    }
}
