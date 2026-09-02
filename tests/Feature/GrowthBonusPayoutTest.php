<?php

namespace Tests\Feature;

use App\Http\Controllers\CreatorFinancialController;
use App\Http\Controllers\StripeWebhookController;
use App\Models\EngagementNotification;
use App\Models\GrowthBonusProfile;
use App\Models\GrowthBonusReward;
use App\Models\PayoutRecord;
use App\Models\User;
use App\Services\GrowthBonusService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Growth Bonus Phase 3 — approval reaches the creator, and the money follows.
 *
 * 🚨 THE ONE RULE THESE TESTS EXIST FOR: the day the creator is TOLD and the day
 * the payer ACTS ON must be the same day. It is stored once, at approval, and
 * every other surface reads the column. A second calculation anywhere is a
 * broken promise about money, in writing, that nothing downstream would catch.
 *
 * ⚠️ These do not exercise a real Stripe payment — `OfflineStripeHttpClient` is
 * bound in `testing` and answers every Stripe call with an error, deliberately.
 * What is tested is the SELECTION and the BOOKKEEPING either side of it, which
 * is where a double payment or a silent skip would come from.
 */
class GrowthBonusPayoutTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'growth_bonus.enabled' => true,
            'growth_bonus.payout.enabled' => true,
            'growth_bonus.payout.payout_day' => Carbon::FRIDAY,
            'growth_bonus.payout.min_days_notice' => 1,
        ]);

        Carbon::setTestNow(Carbon::parse('2026-09-01 09:00:00')); // a Tuesday
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'default_currency' => 'GBP',
            'stripe_connected_at' => Carbon::parse('2026-08-27'),
            'stripe_details_submitted' => 1,
            'account_id' => 'acct_'.uniqid(),
        ], $overrides));
    }

    private function reward(User $creator, array $overrides = []): GrowthBonusReward
    {
        $profile = GrowthBonusProfile::create([
            'creator_id' => $creator->id,
            'status' => GrowthBonusProfile::STATUS_ACTIVE,
            'activation_deadline' => Carbon::parse('2026-09-26'),
            'activated_at' => Carbon::parse('2026-08-28'),
            'seat_claimed_at' => Carbon::parse('2026-08-28'),
            'expires_at' => Carbon::parse('2027-08-28'),
            'qualifying_gmv' => 120,
        ]);

        return GrowthBonusReward::create(array_merge([
            'profile_id' => $profile->id,
            'creator_id' => $creator->id,
            'milestone_gmv' => 100,
            'amount' => 25,
            'status' => GrowthBonusReward::STATUS_APPROVED,
            'approved_at' => now(),
        ], $overrides));
    }

    // ── The date ────────────────────────────────────────────────────────

    public function test_the_payout_date_is_the_next_payout_day(): void
    {
        $service = app(GrowthBonusService::class);

        // Tuesday → that Friday.
        $this->assertSame(
            '2026-09-04',
            $service->nextPayoutDate(Carbon::parse('2026-09-01'))->toDateString(),
        );
    }

    /**
     * 🚨 A bonus approved ON the payout day waits for the next one. The command
     * fires at a fixed time, so announcing "today" for an approval made after it
     * ran would name a date that had already passed.
     */
    public function test_an_approval_on_the_payout_day_waits_a_week(): void
    {
        $this->assertSame(
            '2026-09-11',
            app(GrowthBonusService::class)
                ->nextPayoutDate(Carbon::parse('2026-09-04')) // a Friday
                ->toDateString(),
        );
    }

    // ── Announcing ──────────────────────────────────────────────────────

    public function test_announcing_stores_the_date_and_tells_the_creator(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $reward = $this->reward($creator);

        $this->artisan('growth-bonus:announce')->assertSuccessful();

        $this->assertSame('2026-09-04', $reward->fresh()->scheduled_payout_date?->toDateString());
        // ⚠️ The CLAIM is what proves the announcement was made. It lands in
        // `engagement_notifications`; `notification_logs` is written by the
        // dispatcher's own queued delivery, which Queue::fake() never runs.
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'growth_bonus_approved',
        ]);
    }

    /**
     * 🚨 The row's null date is the claim on the work. Without it a second sweep
     * re-dates a bonus whose day the creator has already been told.
     */
    public function test_a_second_run_does_not_re_date_an_announced_bonus(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $reward = $this->reward($creator);

        $this->artisan('growth-bonus:announce')->assertSuccessful();
        $first = $reward->fresh()->scheduled_payout_date?->toDateString();

        // A week later, the same reward must keep the date it was given.
        Carbon::setTestNow(Carbon::parse('2026-09-08 09:00:00'));
        $this->artisan('growth-bonus:announce')->assertSuccessful();

        $this->assertSame($first, $reward->fresh()->scheduled_payout_date?->toDateString());
    }

    /**
     * 🚨 An announced-but-undated reward must not churn the sweep forever: it is
     * claimed by `announced_at`, skipped while unpayable, and DATED (with a
     * second, dated message) once the creator can receive. The dedup key carries
     * the date, so the first announcement's claim cannot suppress the one whose
     * whole point is naming the day.
     */
    public function test_an_undated_reward_is_dated_once_the_creator_can_receive(): void
    {
        Queue::fake();

        $creator = $this->creator(['account_id' => null, 'stripe_details_submitted' => 0]);
        $reward = $this->reward($creator);

        $this->artisan('growth-bonus:announce')->assertSuccessful();
        $this->assertNotNull($reward->fresh()->announced_at);
        $this->assertNull($reward->fresh()->scheduled_payout_date);

        // Still unpayable: the sweep passes it by without re-announcing.
        $this->artisan('growth-bonus:announce')->assertSuccessful();
        $this->assertSame(1, DB::table('engagement_notifications')
            ->where('user_id', $creator->id)->where('type', 'growth_bonus_approved')->count());

        // Stripe connects; the next sweep fixes the day and says so.
        $creator->forceFill(['account_id' => 'acct_'.uniqid(), 'stripe_details_submitted' => 1])->save();
        $this->artisan('growth-bonus:announce')->assertSuccessful();

        $this->assertNotNull($reward->fresh()->scheduled_payout_date);
        $this->assertSame(2, DB::table('engagement_notifications')
            ->where('user_id', $creator->id)->where('type', 'growth_bonus_approved')->count());
    }

    /**
     * 🚨 A bank-refused payout returns the money to the CONNECTED account, so
     * the webhook revert keeps `stripe_transfer_id` — the retry must re-issue
     * only the payout, never the transfer. Clearing the id would move the bonus
     * from the platform a second time once the idempotency key expired.
     */
    public function test_the_bank_refusal_revert_keeps_the_transfer_id(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $reward = $this->reward($creator, [
            'status' => GrowthBonusReward::STATUS_PAID,
            'paid_at' => now(),
            'scheduled_payout_date' => now()->toDateString(),
            'announced_at' => now(),
            'stripe_transfer_id' => 'tr_kept123',
            'stripe_payout_id' => 'po_failed123',
            'payout_record_uuid' => 'pr-uuid',
            'payout_reference' => 'po_failed123',
        ]);

        $record = PayoutRecord::create([
            'creator_id' => $creator->uuid,
            'stripe_payout_id' => 'po_failed123',
            'amount_minor' => 2500,
            'currency' => 'gbp',
            'status' => 'failed',
            'failure_message' => 'account_closed',
            'metadata' => [
                'bonus_type' => 'growth_bonus',
                'growth_bonus_reward_id' => $reward->id,
            ],
        ]);

        $controller = app(StripeWebhookController::class);
        $revert = new \ReflectionMethod($controller, 'revertFailedGrowthBonusPayout');
        $revert->setAccessible(true);
        $revert->invoke($controller, $record);

        $fresh = $reward->fresh();
        $this->assertSame(GrowthBonusReward::STATUS_APPROVED, $fresh->status);
        $this->assertNull($fresh->paid_at);
        $this->assertNull($fresh->scheduled_payout_date);
        $this->assertNull($fresh->stripe_payout_id);
        $this->assertSame('tr_kept123', $fresh->stripe_transfer_id, 'the transfer leg is already settled and must be kept');
    }

    /**
     * ⚠️ A creator who cannot be paid yet is still TOLD their bonus is approved —
     * with no date. Silence would leave them believing nothing had happened.
     */
    public function test_a_creator_with_no_stripe_account_is_announced_without_a_date(): void
    {
        Queue::fake();

        $creator = $this->creator(['account_id' => null, 'stripe_details_submitted' => 0]);
        $reward = $this->reward($creator);

        $this->artisan('growth-bonus:announce')->assertSuccessful();

        $this->assertNull($reward->fresh()->scheduled_payout_date);
        // ⚠️ The CLAIM is what proves the announcement was made. It lands in
        // `engagement_notifications`; `notification_logs` is written by the
        // dispatcher's own queued delivery, which Queue::fake() never runs.
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'growth_bonus_approved',
        ]);
    }

    public function test_an_unapproved_bonus_is_never_announced(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $reward = $this->reward($creator, [
            'status' => GrowthBonusReward::STATUS_PENDING_VALIDATION,
            'approved_at' => null,
        ]);

        $this->artisan('growth-bonus:announce')->assertSuccessful();

        $this->assertNull($reward->fresh()->scheduled_payout_date);
        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'growth_bonus_approved',
        ]);
    }

    // ── Paying ──────────────────────────────────────────────────────────

    /**
     * 🚨 The payer acts on the STORED date. A bonus dated Friday must not be
     * picked up on the Tuesday before it.
     */
    public function test_nothing_is_paid_before_its_stored_date(): void
    {
        $creator = $this->creator();
        $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        $this->artisan('growth-bonus:pay --dry-run')
            ->expectsOutputToContain('Nothing due.')
            ->assertSuccessful();
    }

    public function test_a_dated_bonus_is_due_on_the_day(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator();
        $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        $this->artisan('growth-bonus:pay --dry-run')
            ->expectsOutputToContain('1 bonus(es) due.')
            ->assertSuccessful();
    }

    /**
     * 🚨 A row already carrying Stripe ids is done, whatever its status says.
     * That guard is what stops a reverted-then-retried reward being paid twice.
     */
    public function test_a_reward_with_a_stripe_payout_is_never_selected(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator();
        $this->reward($creator, [
            'scheduled_payout_date' => '2026-09-04',
            'stripe_payout_id' => 'po_already',
        ]);

        $this->artisan('growth-bonus:pay --dry-run')
            ->expectsOutputToContain('Nothing due.')
            ->assertSuccessful();
    }

    public function test_a_paid_reward_is_never_selected(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator();
        $this->reward($creator, [
            'scheduled_payout_date' => '2026-09-04',
            'status' => GrowthBonusReward::STATUS_PAID,
            'paid_at' => now(),
        ]);

        $this->artisan('growth-bonus:pay --dry-run')
            ->expectsOutputToContain('Nothing due.')
            ->assertSuccessful();
    }

    /**
     * 🚨 Turning the payout off must be a safe retreat to the Phase 1 behaviour,
     * not a half-state. Nothing is sent and nothing is dated.
     */
    public function test_the_payout_switch_stops_both_commands_sending_money(): void
    {
        Queue::fake();
        config(['growth_bonus.payout.enabled' => false]);

        $creator = $this->creator();
        $reward = $this->reward($creator);

        $this->artisan('growth-bonus:announce')->assertSuccessful();
        $this->artisan('growth-bonus:pay')
            ->expectsOutputToContain('switched off')
            ->assertSuccessful();

        // Still told, still owed — just not dated.
        $this->assertNull($reward->fresh()->scheduled_payout_date);
        // ⚠️ The CLAIM is what proves the announcement was made. It lands in
        // `engagement_notifications`; `notification_logs` is written by the
        // dispatcher's own queued delivery, which Queue::fake() never runs.
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => 'growth_bonus_approved',
        ]);
    }

    // ── The hold ────────────────────────────────────────────────────────

    /**
     * 🚨 The whole point of the re-validation: an approval can be weeks old, and
     * a refund or chargeback since then means the milestone is no longer covered.
     * Paying anyway sends money the creator has not earned.
     */
    public function test_a_refund_below_the_milestone_holds_the_transfer(): void
    {
        Queue::fake();
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator();
        $reward = $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        // The profile says £120, but the LEDGER has nothing — exactly the shape a
        // fully refunded sale leaves behind.
        $this->artisan('growth-bonus:pay')->assertSuccessful();

        $reward->refresh();

        $this->assertSame(GrowthBonusReward::HOLD_MILESTONE_NOT_COVERED, $reward->payout_hold_reason);
        $this->assertNotNull($reward->held_at);
        $this->assertNull($reward->paid_at);
        // 🚨 The promised day is void — every screen must stop naming it.
        $this->assertNull($reward->scheduled_payout_date);
        // The admin's decision survives; only the sending is held.
        $this->assertSame(GrowthBonusReward::STATUS_APPROVED, $reward->status);
    }

    public function test_a_suspended_creator_is_held_for_that_reason_not_the_milestone(): void
    {
        Queue::fake();
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator(['suspended_account' => 1]);
        $reward = $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        $this->artisan('growth-bonus:pay')->assertSuccessful();

        // ⚠️ Order matters: a suspended account must not be told its milestone is
        // short. That names the wrong problem.
        $this->assertSame(
            GrowthBonusReward::HOLD_ACCOUNT_SUSPENDED,
            $reward->fresh()->payout_hold_reason,
        );
    }

    public function test_the_creator_is_told_once_per_reason_however_many_fridays_pass(): void
    {
        Queue::fake();
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator();
        $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        $this->artisan('growth-bonus:pay')->assertSuccessful();

        // A second, and a third Friday.
        Carbon::setTestNow(Carbon::parse('2026-09-11 10:45:00'));
        $this->artisan('growth-bonus:pay')->assertSuccessful();
        Carbon::setTestNow(Carbon::parse('2026-09-18 10:45:00'));
        $this->artisan('growth-bonus:pay')->assertSuccessful();

        // 🚨 ONE message. Repeating the same bad news every week is how people
        // stop reading the receipts and payout notices too (client, 2 Sep 2026).
        $this->assertSame(
            1,
            EngagementNotification::where('user_id', $creator->id)
                ->where('type', 'growth_bonus_held')
                ->count(),
        );
    }

    /**
     * 🚨 A HELD ROW MUST STAY SELECTABLE. `applyHold()` clears the date, so a
     * date-only filter would drop it out of every future run and it would never
     * be re-checked — the weekly retry the hold promises would silently not exist.
     */
    public function test_a_held_bonus_is_re_checked_the_following_week(): void
    {
        Queue::fake();
        Carbon::setTestNow(Carbon::parse('2026-09-04 10:45:00'));

        $creator = $this->creator();
        $reward = $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        $this->artisan('growth-bonus:pay')->assertSuccessful();
        $this->assertNotNull($reward->fresh()->payout_hold_reason);

        Carbon::setTestNow(Carbon::parse('2026-09-11 10:45:00'));

        $this->artisan('growth-bonus:pay')
            ->expectsOutputToContain('1 bonus(es) due.')
            ->assertSuccessful();
    }

    /**
     * ⚠️ `growth-bonus:announce` must not re-date a held bonus — that would
     * promise a day while the reason for the hold still stands.
     */
    public function test_announce_never_re_dates_a_held_bonus(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $reward = $this->reward($creator, [
            'announced_at' => now(),
            'payout_hold_reason' => GrowthBonusReward::HOLD_MILESTONE_NOT_COVERED,
            'held_at' => now(),
        ]);

        $this->artisan('growth-bonus:announce')->assertSuccessful();

        $this->assertNull($reward->fresh()->scheduled_payout_date);
    }

    /**
     * ⚠️ The creator's own screens carry the reason as a SENTENCE, never the
     * stored code — `milestone_not_covered` is jargon on a dashboard.
     */
    public function test_the_creator_sees_a_sentence_not_the_stored_code(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->reward($creator, [
            'payout_hold_reason' => GrowthBonusReward::HOLD_MILESTONE_NOT_COVERED,
            'held_at' => now(),
        ]);

        $rows = $this->invokeUpcoming($creator);

        $this->assertNotNull($rows[0]['hold_reason']);
        $this->assertStringNotContainsString('milestone_not_covered', $rows[0]['hold_reason']);
        $this->assertStringContainsString('refunded or disputed', $rows[0]['hold_reason']);
    }

    // ── What the creator sees ───────────────────────────────────────────

    /**
     * 🚨 The two-language pin: the finance page reads `growth_bonus_upcoming`,
     * and neither the build nor any scanner can see that the server key and the
     * JSX agree. A rename leaves the block silently absent.
     */
    public function test_the_finance_page_prop_is_read_by_the_component(): void
    {
        $jsx = file_get_contents(resource_path('js/Pages/Creator/Financial/Dashboard.jsx'));

        $this->assertStringContainsString('growth_bonus_upcoming', $jsx);
    }

    public function test_an_owed_bonus_is_listed_for_the_creator(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->reward($creator, ['scheduled_payout_date' => '2026-09-04']);

        $rows = $this->invokeUpcoming($creator);

        $this->assertCount(1, $rows);
        $this->assertSame('2026-09-04', $rows[0]['scheduled_payout_date']);
        $this->assertSame(25.0, $rows[0]['amount']);
    }

    /**
     * ⚠️ Once it is paid it belongs to payout history, not to "on the way" —
     * the block empties itself rather than needing to be cleared.
     */
    public function test_a_paid_bonus_leaves_the_owed_list(): void
    {
        Queue::fake();

        $creator = $this->creator();
        $this->reward($creator, [
            'status' => GrowthBonusReward::STATUS_PAID,
            'paid_at' => now(),
        ]);

        $this->assertSame([], $this->invokeUpcoming($creator));
    }

    /** @return array<int, array<string, mixed>> */
    private function invokeUpcoming(User $creator): array
    {
        $controller = app(CreatorFinancialController::class);
        $method = new \ReflectionMethod($controller, 'growthBonusUpcoming');
        $method->setAccessible(true);

        return $method->invoke($controller, $creator);
    }
}
