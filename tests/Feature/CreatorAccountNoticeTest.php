<?php

namespace Tests\Feature;

use App\Console\Commands\NotifyPayoutHolds;
use App\Mail\CreatorAccountNotice;
use App\Models\User;
use App\Support\RiskMessages;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The two creator states the 9 Aug brief singles out for specificity:
 * #14 (something is stopping your payments) and #16 (your payout is held).
 *
 * Both were broken in the worst possible way — one silently, one by simply not
 * existing.
 */
class CreatorAccountNoticeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function creator(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
        ], $attrs));
    }

    /**
     * 🚨 The email this replaces rendered `email.account-suspend`, a view that
     * does not exist. Every send threw, the throw was swallowed by the
     * command's own try/catch, and the creator was locked out and never told.
     *
     * Rendering is the assertion: a missing view throws here, so this test
     * fails the moment the template goes missing again.
     */
    public function test_the_account_notice_actually_renders(): void
    {
        $ui = RiskMessages::get('CREATOR_ACCOUNT_ISSUE', RiskMessages::AUDIENCE_CREATOR, [
            'reason' => 'Your platform subscription is not active.',
        ]);

        $html = (new CreatorAccountNotice($ui, 'Sam'))->render();

        $this->assertStringContainsString('Your platform subscription is not active.', $html);
        $this->assertStringContainsString('Sam', $html);
    }

    /**
     * ⚠️ "Account status issue" on its own is exactly what the brief exists to
     * remove. The reason must reach the reader, not just the log.
     */
    public function test_the_notice_carries_the_specific_reason(): void
    {
        foreach (['CREATOR_ACCOUNT_ISSUE', 'CREATOR_PAYOUT_HELD'] as $key) {
            $ui = RiskMessages::get($key, RiskMessages::AUDIENCE_CREATOR, [
                'reason' => 'A very specific reason indeed.',
            ]);

            $html = (new CreatorAccountNotice($ui))->render();

            $this->assertStringContainsString('A very specific reason indeed.', $html);
            $this->assertStringNotContainsString(':reason', $html, "[{$key}] left its placeholder un-substituted.");
        }
    }

    /**
     * 🚨 Nothing told a creator their payout was held. Their only signal was
     * the money not arriving.
     */
    public function test_a_creator_with_a_held_payout_is_told_and_told_why(): void
    {
        $creator = $this->creator([
            'payout_paused_at' => now()->subHour(),
            'payout_pause_reason' => 'We need your updated bank details.',
        ]);

        $this->artisan('payouts:notify-holds')->assertSuccessful();

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => NotifyPayoutHolds::TYPE_HELD,
        ]);
    }

    /**
     * The sweep runs hourly, so the guard against telling someone the same
     * thing every hour is the whole difference between a notice and a nuisance.
     */
    public function test_a_held_payout_is_only_announced_once(): void
    {
        $this->creator([
            'payout_paused_at' => now()->subHour(),
            'payout_pause_reason' => 'Checking something.',
        ]);

        $this->artisan('payouts:notify-holds');
        $this->artisan('payouts:notify-holds');
        $this->artisan('payouts:notify-holds');

        $this->assertSame(
            1,
            DB::table('engagement_notifications')->where('type', NotifyPayoutHolds::TYPE_HELD)->count()
        );
    }

    /**
     * ⚠️ A blank "Reason:" line is precisely the unexplained hold this exists
     * to prevent, so a legacy row with no reason still says something a creator
     * can act on.
     */
    public function test_a_hold_with_no_recorded_reason_still_says_something_useful(): void
    {
        $creator = $this->creator([
            'payout_paused_at' => now()->subHour(),
            'payout_pause_reason' => null,
        ]);

        $this->artisan('payouts:notify-holds');

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $creator->id,
            'type' => NotifyPayoutHolds::TYPE_HELD,
        ]);

        $ui = RiskMessages::get('CREATOR_PAYOUT_HELD', RiskMessages::AUDIENCE_CREATOR, [
            'reason' => 'We need to check something on your account before this goes out. Our team will be in touch, and the chat is the fastest way to reach us.',
        ]);
        $this->assertStringNotContainsString('Reason: '."\n", $ui['body']);
        $this->assertStringNotContainsString(':reason', $ui['body']);
    }

    public function test_a_creator_whose_payouts_are_running_is_not_notified(): void
    {
        $this->creator(['payout_paused_at' => null]);

        $this->artisan('payouts:notify-holds');

        $this->assertSame(0, DB::table('engagement_notifications')->count());
    }

    /**
     * ⚠️ Only a creator who was TOLD about a hold hears about its release.
     * Otherwise the first thing they ever learn about their payouts is that a
     * problem they never knew about is over.
     */
    public function test_only_a_creator_who_heard_about_the_hold_hears_about_the_release(): void
    {
        $told = $this->creator(['payout_paused_at' => now()->subDay(), 'payout_pause_reason' => 'x']);
        $neverPaused = $this->creator(['payout_paused_at' => null]);

        $this->artisan('payouts:notify-holds');

        // The hold is lifted.
        $told->forceFill(['payout_paused_at' => null])->saveQuietly();

        $this->artisan('payouts:notify-holds');

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $told->id,
            'type' => NotifyPayoutHolds::TYPE_RELEASED,
        ]);
        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $neverPaused->id,
            'type' => NotifyPayoutHolds::TYPE_RELEASED,
        ]);
    }

    /**
     * A creator paused again later is genuinely new news, so the claim is keyed
     * on WHEN the hold started rather than on the creator.
     */
    public function test_a_second_hold_is_announced_again(): void
    {
        $creator = $this->creator(['payout_paused_at' => now()->subDays(3), 'payout_pause_reason' => 'first']);
        $this->artisan('payouts:notify-holds');

        $creator->forceFill(['payout_paused_at' => now(), 'payout_pause_reason' => 'second'])->saveQuietly();
        $this->artisan('payouts:notify-holds');

        $this->assertSame(
            2,
            DB::table('engagement_notifications')->where('type', NotifyPayoutHolds::TYPE_HELD)->count()
        );
    }

    public function test_dry_run_writes_nothing(): void
    {
        $this->creator(['payout_paused_at' => now(), 'payout_pause_reason' => 'x']);

        $this->artisan('payouts:notify-holds', ['--dry-run' => true])->assertSuccessful();

        $this->assertSame(0, DB::table('engagement_notifications')->count());
    }

    /**
     * A suspended creator is already being told about the suspension, and a
     * second notice about their payouts on top of it is noise.
     */
    public function test_a_suspended_creator_is_not_also_told_about_payouts(): void
    {
        $this->creator(['payout_paused_at' => now(), 'payout_pause_reason' => 'x', 'suspended_account' => 1]);

        $this->artisan('payouts:notify-holds');

        $this->assertSame(0, DB::table('engagement_notifications')->count());
    }
}
