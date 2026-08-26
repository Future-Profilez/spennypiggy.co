<?php

namespace Tests\Feature;

use App\Jobs\SendEngagementNotification;
use App\Mail\GrowthBonusMilestoneReached;
use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\GrowthBonusProfile;
use App\Models\User;
use App\Services\GrowthBonusService;
use App\Support\GrowthBonusPanelPayload;
use Carbon\Carbon;
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
