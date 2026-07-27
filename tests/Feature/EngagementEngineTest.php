<?php

namespace Tests\Feature;

use App\Jobs\SendEngagementNotification;
use App\Mail\ReactivationReminder;
use App\Models\Currency;
use App\Models\EngagementNotification;
use App\Models\FinancialTransaction;
use App\Models\Follow;
use App\Models\Notification;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Services\CreatorEventNotifier;
use App\Services\NotificationDispatcher;
use App\Services\SupporterLapseService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Str;
use Tests\TestCase;

class EngagementEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);
    }

    private function makeUser(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'uuid' => (string) Str::uuid(),
            'default_currency' => 'GBP',
        ], $attrs));
    }

    /** A tip goal is required as the FK target for tip payments. */
    private function tipGoalFor(User $creator): int
    {
        return DB::table('tip_goals')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test Goal',
            'user_id' => $creator->id,
            'target' => 100.00,
            'default_price' => 5.00,
            'tax_amount' => 0,
            'currency' => 'GBP',
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /** Record a completed purchase by $supporter on $daysAgo. */
    private function purchase(User $creator, User $supporter, int $daysAgo, float $gross = 20.00, string $status = 'completed'): void
    {
        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalFor($creator),
            'user_id' => $supporter->id,
            'session_id' => 'cs_'.Str::random(8),
            'currency' => 'GBP',
            'amount' => $gross,
            'tax' => 0,
            'status' => 'paid',
        ]);

        FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => $tip->id,
            'type' => 'income',
            'gross_amount' => $gross,
            'platform_fee' => 0,
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => $gross,
            'currency' => 'GBP',
            'status' => $status,
            'transaction_date' => now()->subDays($daysAgo),
        ]);
    }

    // ---------------------------------------------------------------- dedup

    public function test_claim_allows_first_send_and_blocks_repeat(): void
    {
        $user = $this->makeUser();

        $this->assertTrue(NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_REACTIVATION, '2026-07-01|7'));
        $this->assertFalse(NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_REACTIVATION, '2026-07-01|7'));

        // A different key (new lapse cycle) is allowed again.
        $this->assertTrue(NotificationDispatcher::claim($user->id, EngagementNotification::TYPE_REACTIVATION, '2026-08-01|7'));
    }

    // ------------------------------------------------------------- lapse math

    public function test_lapse_service_matches_exact_day_and_ignores_refunds(): void
    {
        $creator = $this->makeUser();
        $lapsed = $this->makeUser();
        $refunded = $this->makeUser();
        $active = $this->makeUser();

        $this->purchase($creator, $lapsed, 7);
        $this->purchase($creator, $refunded, 7, 20.00, 'refunded'); // must not count as a purchase
        $this->purchase($creator, $active, 2);

        $ids = app(SupporterLapseService::class)->lapsedExactlyDaysAgo(7)->pluck('supporter_id')->all();

        $this->assertContains($lapsed->id, $ids);
        $this->assertNotContains($active->id, $ids);
        $this->assertNotContains($refunded->id, $ids, 'A refunded transaction must not count as a purchase.');
    }

    // ------------------------------------------------------- reactivation cmd

    public function test_reactivation_command_queues_once_per_stage(): void
    {
        Queue::fake();

        $creator = $this->makeUser();
        $supporter = $this->makeUser();
        $this->purchase($creator, $supporter, 7);

        $this->artisan('reactivation:notify')->assertExitCode(0);
        Queue::assertPushed(SendEngagementNotification::class, 1);

        // Re-running the same day must not send a second reminder.
        $this->artisan('reactivation:notify')->assertExitCode(0);
        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    public function test_reactivation_reminder_includes_the_email_channel(): void
    {
        Queue::fake();

        $creator = $this->makeUser(['name' => 'Creator One', 'username' => 'creatorone']);
        $supporter = $this->makeUser();
        $this->purchase($creator, $supporter, 7);

        $this->artisan('reactivation:notify')->assertExitCode(0);

        // Email was the missing third channel: the engine wrote bell and push
        // only, so the reactivation email nobody could opt out of also never
        // arrived. Assert the channel AND the mailable are on the payload.
        Queue::assertPushed(SendEngagementNotification::class, function ($job) use ($creator) {
            return in_array(NotificationDispatcher::CHANNEL_EMAIL, $job->channels, true)
                && ($job->payload['mailable'] ?? null) === ReactivationReminder::class
                && collect($job->payload['mailable_args']['creators'] ?? [])
                    ->pluck('username')->contains($creator->username);
        });
    }

    public function test_reactivation_email_is_not_sent_to_an_opted_out_supporter(): void
    {
        Mail::fake();

        $creator = $this->makeUser();
        $supporter = $this->makeUser(['reactivation_emails_enabled' => false]);

        app(NotificationDispatcher::class)->send(
            $supporter,
            'reactivation',
            [
                'title' => 'New content',
                'body' => 'Come see',
                'mailable' => ReactivationReminder::class,
                'mailable_args' => ['userId' => $supporter->id, 'days' => 7, 'creators' => []],
            ],
            [NotificationDispatcher::CHANNEL_EMAIL],
            true,
        );

        Mail::assertNothingSent();
    }

    public function test_reactivation_email_renders_with_the_creators_they_support(): void
    {
        $supporter = $this->makeUser(['name' => 'Sam Taylor']);

        $html = (new ReactivationReminder($supporter->id, 7, [
            ['name' => 'Creator One', 'username' => 'creatorone', 'avatar' => 'https://example.test/a.jpg'],
        ]))->render();

        $this->assertStringContainsString('Sam', $html);
        $this->assertStringContainsString('Creator One', $html);
        $this->assertStringContainsString('creatorone', $html);
        // Content-first copy: no gift/tip/donation/fundraising wording.
        foreach (['donation', 'donate', 'tip us', 'fundraise'] as $banned) {
            $this->assertStringNotContainsStringIgnoringCase($banned, $html);
        }
    }

    public function test_reactivation_dry_run_sends_and_records_nothing(): void
    {
        Queue::fake();

        $creator = $this->makeUser();
        $supporter = $this->makeUser();
        $this->purchase($creator, $supporter, 14);

        $this->artisan('reactivation:notify --dry-run')->assertExitCode(0);

        Queue::assertNothingPushed();
        $this->assertDatabaseCount('engagement_notifications', 0);
    }

    public function test_a_new_purchase_resets_the_reminder_cycle(): void
    {
        Queue::fake();

        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        // Lapsed at 7 days → reminded.
        $this->purchase($creator, $supporter, 7);
        $this->artisan('reactivation:notify --stage=7')->assertExitCode(0);
        $this->assertDatabaseCount('engagement_notifications', 1);

        // They buy again today, then lapse to 7 days later on: a different
        // last-purchase date means a different dedup key, so it may remind again.
        $this->purchase($creator, $supporter, 0);
        $latest = app(SupporterLapseService::class)->lastPurchaseDate($supporter->id);

        $this->assertTrue(
            NotificationDispatcher::claim($supporter->id, EngagementNotification::TYPE_REACTIVATION, substr($latest, 0, 10).'|7'),
            'A purchase should start a fresh reminder cycle.'
        );
    }

    // ------------------------------------------------------------- consent

    public function test_marketing_send_respects_push_opt_out_but_transactional_does_not(): void
    {
        $optedOut = $this->makeUser(['push_notifications_enabled' => false]);

        $dispatcher = app(NotificationDispatcher::class);

        $dispatcher->send($optedOut, 'reactivation', ['title' => 'Hi', 'body' => 'Body'], [NotificationDispatcher::CHANNEL_BELL], true);
        $this->assertSame(0, Notification::where('notifiable_id', $optedOut->id)->count(), 'Marketing bell entry must respect the opt-out.');

        $dispatcher->send($optedOut, 'system', ['title' => 'Hi', 'body' => 'Body'], [NotificationDispatcher::CHANNEL_BELL], false);
        $this->assertSame(1, Notification::where('notifiable_id', $optedOut->id)->count(), 'Transactional messages bypass marketing consent.');
    }

    public function test_bell_entry_is_written_for_consenting_user(): void
    {
        $user = $this->makeUser();

        app(NotificationDispatcher::class)->send(
            $user,
            'reactivation',
            ['title' => 'New content', 'body' => 'Come see', 'module' => 'reactivation'],
            [NotificationDispatcher::CHANNEL_BELL],
        );

        $this->assertDatabaseHas('notifications', [
            'notifiable_id' => $user->id,
            'module' => 'reactivation',
        ]);
    }

    // ------------------------------------------------------- creator events

    public function test_creator_event_notifies_followers_once(): void
    {
        Queue::fake();

        $creator = $this->makeUser();
        $follower = $this->makeUser();
        Follow::create(['follower_id' => $follower->id, 'followed_id' => $creator->id]);

        $notifier = app(CreatorEventNotifier::class);
        $notifier->notifyFollowers($creator->id, 'wish', 4321, 'Summer set');
        Queue::assertPushed(SendEngagementNotification::class, 1);

        // Same item again (e.g. edit, or approve after create) must not re-notify.
        $notifier->notifyFollowers($creator->id, 'wish', 4321, 'Summer set');
        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    public function test_creator_with_no_followers_is_a_noop(): void
    {
        Queue::fake();

        $creator = $this->makeUser();
        app(CreatorEventNotifier::class)->notifyFollowers($creator->id, 'shop', 1, 'Thing');

        Queue::assertNothingPushed();
    }

    // ----------------------------------------------------------- milestones

    public function test_birthday_message_sends_once_and_skips_users_without_dob(): void
    {
        Queue::fake();

        $withDob = $this->makeUser(['date_of_birth' => now()->subYears(30)->toDateString()]);
        $withoutDob = $this->makeUser(['date_of_birth' => null]);

        $this->artisan('milestones:notify')->assertExitCode(0);

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $withDob->id,
            'type' => EngagementNotification::TYPE_MILESTONE,
        ]);
        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $withoutDob->id,
            'type' => EngagementNotification::TYPE_MILESTONE,
            'dedup_key' => 'birthday|'.now()->year,
        ]);

        // Re-running the same day must not duplicate.
        $before = EngagementNotification::count();
        $this->artisan('milestones:notify')->assertExitCode(0);
        $this->assertSame($before, EngagementNotification::count());
    }

    // ---------------------------------------------------------- whale alerts

    public function test_whale_alert_fires_for_lapsed_high_value_supporter_only(): void
    {
        $creator = $this->makeUser();
        $whale = $this->makeUser();
        $smallSpender = $this->makeUser();

        $this->purchase($creator, $whale, 31, 5000.00);
        $this->purchase($creator, $smallSpender, 31, 10.00);

        $this->artisan('whale:retention-alerts')->assertExitCode(0);

        $this->assertDatabaseHas('engagement_notifications', [
            'user_id' => $whale->id,
            'type' => EngagementNotification::TYPE_WHALE_RISK,
        ]);
        $this->assertDatabaseMissing('engagement_notifications', [
            'user_id' => $smallSpender->id,
            'type' => EngagementNotification::TYPE_WHALE_RISK,
        ]);
    }

    public function test_whale_alert_is_not_repeated_for_the_same_risk_episode(): void
    {
        $creator = $this->makeUser();
        $whale = $this->makeUser();
        $this->purchase($creator, $whale, 31, 5000.00);

        $this->artisan('whale:retention-alerts')->assertExitCode(0);
        $count = EngagementNotification::where('type', EngagementNotification::TYPE_WHALE_RISK)->count();

        $this->artisan('whale:retention-alerts')->assertExitCode(0);

        $this->assertSame($count, EngagementNotification::where('type', EngagementNotification::TYPE_WHALE_RISK)->count());
    }
}
