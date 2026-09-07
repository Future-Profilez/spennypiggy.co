<?php

namespace Tests\Feature;

use App\Console\Commands\NudgeRejectedProfiles;
use App\Jobs\SendEngagementNotification;
use App\Models\EngagementNotification;
use App\Models\User;
use App\Support\MarketingConsent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * Rejected-profile re-engagement — every two months ×3, then yearly.
 * See App\Console\Commands\NudgeRejectedProfiles and config/profile_rejection.php.
 */
class NudgeRejectedProfilesTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'email_verified_at' => now(),
            'profile_status_lock' => 0,
            'profile_reject_reason' => 'Profile photo: does not show your face',
            'avatar' => 'https://ucarecdn.com/avatar/',
            'bio' => 'Hello',
        ], $attributes));

        // The rejection must be old enough — `updated_at` is the fallback age.
        User::query()->whereKey($user->id)->update(['updated_at' => now()->subDays(90)]);

        return $user->fresh();
    }

    /** 🚨 Reason-gated, never lock-gated: lock 0 is also every draft on the platform. */
    public function test_a_draft_at_lock_zero_with_no_reason_is_never_mailed(): void
    {
        Queue::fake();
        $this->creator(['profile_reject_reason' => null]);

        $this->artisan('profiles:nudge-rejected')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_a_rejected_creator_is_reminded_and_the_claim_is_recorded(): void
    {
        Queue::fake();
        $user = $this->creator();

        $this->artisan('profiles:nudge-rejected')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 1);
        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $user->id,
            'type' => NudgeRejectedProfiles::TYPE,
            'dedup_key' => '1',
        ]);
    }

    /** A rejection from this morning is not "lapsed". */
    public function test_a_fresh_rejection_waits_for_the_first_window(): void
    {
        Queue::fake();
        $user = $this->creator();
        User::query()->whereKey($user->id)->update(['updated_at' => now()->subDays(3)]);

        $this->artisan('profiles:nudge-rejected')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_a_second_run_inside_the_two_month_wait_sends_nothing(): void
    {
        Queue::fake();
        $user = $this->creator();

        $this->artisan('profiles:nudge-rejected')->assertSuccessful();
        $this->artisan('profiles:nudge-rejected')->assertSuccessful();

        $this->assertSame(1, EngagementNotification::where('user_id', $user->id)->where('type', NudgeRejectedProfiles::TYPE)->count());
    }

    /** The ladder slows down and never stops — the rule, not the numbers. */
    public function test_the_ladder_slows_down_and_never_stops(): void
    {
        $command = app(NudgeRejectedProfiles::class);

        $this->assertLessThan($command->waitDaysAfter(5), $command->waitDaysAfter(1));
        $this->assertGreaterThan(0, $command->waitDaysAfter(40));
    }

    /** Re-engagement is marketing by the client's own brief: a suppressed address is never mailed. */
    public function test_a_suppressed_address_is_never_mailed(): void
    {
        Queue::fake();
        $user = $this->creator();
        MarketingConsent::suppress($user->email, 'test');

        $this->artisan('profiles:nudge-rejected')->assertSuccessful();

        Queue::assertNothingPushed();
    }

    public function test_the_mail_never_quotes_an_earnings_figure(): void
    {
        $blade = file_get_contents(resource_path('views/email/come-back-and-finish.blade.php'));
        $code = preg_replace('/\{\{--.*?--\}\}/s', '', $blade);

        $this->assertDoesNotMatchRegularExpression('/£\s?\d|\$\s?\d|per month earn|earn £/i', $code);
        $this->assertStringContainsString('{{ $rejectReason }}', $blade);
    }
}
