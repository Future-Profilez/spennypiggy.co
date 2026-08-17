<?php

namespace Tests\Feature;

use App\Jobs\SendEngagementNotification;
use App\Mail\PushAlertsNeedChecking;
use App\Models\NotificationLog;
use App\Models\User;
use App\Support\PushReachability;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

class PushReachabilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        PushReachability::flushCache();
    }

    private function creator(array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
            'push_notifications_enabled' => true,
        ], $attributes));

        // These are deliberately not fillable — same route the heartbeat takes.
        return $user->forceFill($attributes)->saveQuietly() ? $user->fresh() : $user->fresh();
    }

    /** A push we attempted while the creator was stale, so there is something to miss. */
    private function pushAttempt(User $user, $at): void
    {
        NotificationLog::query()->create([
            'channel' => NotificationLog::CHANNEL_PUSH,
            'status' => NotificationLog::STATUS_SENT,
            'recipient_user_id' => $user->id,
            'recipient_email' => $user->email,
            'type' => 'test_push',
            'subject' => 'You made a sale',
        ]);

        // ⚠️ Eloquent stamps its own created_at and silently discards one passed to
        // create(), so a "backdated" row must be written AFTER the insert.
        NotificationLog::query()
            ->where('recipient_user_id', $user->id)
            ->update(['created_at' => $at]);
    }

    public function test_a_confirmed_subscription_is_live_and_a_stale_one_is_not(): void
    {
        $fresh = $this->creator(['push_verified_at' => now()->subDay()]);
        $stale = $this->creator(['push_verified_at' => now()->subDays(PushReachability::STALE_DAYS + 1)]);

        $this->assertTrue(PushReachability::isLive($fresh));
        $this->assertTrue(PushReachability::isStale($stale));
        $this->assertSame('stale', PushReachability::reason($stale));
    }

    public function test_an_unselected_column_is_treated_as_unknown_not_as_stale(): void
    {
        $creator = $this->creator(['push_verified_at' => null]);

        // Exactly how a payload builder that forgot the column would arrive. The
        // documented trap: null reads as "never confirmed", and this service must
        // not nag someone on the strength of a column nobody asked for.
        $partial = User::query()->select('id', 'email')->find($creator->id);

        $this->assertTrue(PushReachability::isLive($partial));
        $this->assertNull(PushReachability::reason($partial));
    }

    public function test_denied_and_unsupported_outrank_staleness_and_are_never_swept(): void
    {
        $denied = $this->creator([
            'push_verified_at' => null,
            'push_permission_state' => PushReachability::DENIED,
        ]);
        $unsupported = $this->creator([
            'push_verified_at' => null,
            'push_permission_state' => PushReachability::UNSUPPORTED,
        ]);

        $this->assertSame(PushReachability::DENIED, PushReachability::reason($denied));
        $this->assertSame(PushReachability::UNSUPPORTED, PushReachability::reason($unsupported));

        $swept = PushReachability::staleCreatorQuery()->pluck('id');
        $this->assertNotContains($denied->id, $swept);
        $this->assertNotContains($unsupported->id, $swept);
    }

    public function test_the_sweep_skips_supporters_the_opted_out_and_the_suspended(): void
    {
        $supporter = $this->creator(['role' => 0, 'push_verified_at' => null]);
        $optedOut = $this->creator(['push_verified_at' => null, 'push_notifications_enabled' => false]);
        $suspended = $this->creator(['push_verified_at' => null, 'suspended_account' => 1]);
        $eligible = $this->creator(['push_verified_at' => null]);

        $swept = PushReachability::staleCreatorQuery()->pluck('id');

        $this->assertNotContains($supporter->id, $swept);
        $this->assertNotContains($optedOut->id, $swept);
        $this->assertNotContains($suspended->id, $swept);
        $this->assertContains($eligible->id, $swept);
    }

    public function test_the_opted_in_branch_reads_a_null_preference_as_opted_in(): void
    {
        // ⚠️ `push_notifications_enabled` is `boolean default(true)` and NOT NULL
        // (migration 2026_07_20_000000), so a NULL cannot actually be stored — an earlier
        // version of this test wrote one and died on the constraint. The whereNull branch
        // in staleCreatorQuery() is therefore defensive only, and what is worth asserting
        // is that it is still THERE: every other preference on this platform treats a
        // missing value as opted IN, and a future migration making this column nullable
        // must not silently drop those creators out of the sweep.
        $sql = PushReachability::staleCreatorQuery()->toSql();

        $this->assertStringContainsString('"push_notifications_enabled" is null', $sql);
    }

    public function test_the_reminder_claim_is_atomic_and_releasable(): void
    {
        $creator = $this->creator(['push_verified_at' => null]);

        $this->assertTrue(PushReachability::claimReminder($creator));
        // A second caller — the racing worker — must lose.
        $this->assertFalse(PushReachability::claimReminder($creator->fresh()));

        PushReachability::releaseReminder($creator, null);
        $this->assertNull($creator->fresh()->push_reminded_at);
        $this->assertTrue(PushReachability::claimReminder($creator->fresh()));
    }

    public function test_the_command_emails_a_stale_creator_who_missed_a_push(): void
    {
        Queue::fake();

        $creator = $this->creator(['push_verified_at' => now()->subDays(PushReachability::STALE_DAYS + 1)]);
        $this->pushAttempt($creator, now()->subDays(2));

        $this->artisan('push:remind-stale')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, function ($job) use ($creator) {
            $payload = (array) $job->payload;

            return $job->userId === $creator->id
                && $payload['mailable'] === PushAlertsNeedChecking::class
                // Email only: pushing about push is circular, and the bell is read
                // by someone already in the app, which is what fixes this anyway.
                && $job->channels === ['email']
                && $job->marketing === false;
        });

        $this->assertNotNull($creator->fresh()->push_reminded_at);
    }

    public function test_a_stale_creator_who_missed_nothing_is_left_alone(): void
    {
        Queue::fake();

        $creator = $this->creator(['push_verified_at' => now()->subDays(PushReachability::STALE_DAYS + 1)]);
        // No push attempted in the window — they have lost nothing, so telling them
        // their alerts might be off is the message that trains people to ignore us.

        $this->artisan('push:remind-stale')->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertNull($creator->fresh()->push_reminded_at);
    }

    public function test_a_creator_is_not_reminded_twice_inside_the_window(): void
    {
        Queue::fake();

        $creator = $this->creator(['push_verified_at' => now()->subDays(PushReachability::STALE_DAYS + 1)]);
        $this->pushAttempt($creator, now()->subDays(2));

        $this->artisan('push:remind-stale')->assertSuccessful();
        $this->artisan('push:remind-stale')->assertSuccessful();

        Queue::assertPushed(SendEngagementNotification::class, 1);
    }

    public function test_dry_run_sends_nothing_and_claims_nothing(): void
    {
        Queue::fake();

        $creator = $this->creator(['push_verified_at' => now()->subDays(PushReachability::STALE_DAYS + 1)]);
        $this->pushAttempt($creator, now()->subDays(2));

        $this->artisan('push:remind-stale --dry-run')->assertSuccessful();

        Queue::assertNothingPushed();
        $this->assertNull($creator->fresh()->push_reminded_at);
    }

    public function test_the_heartbeat_records_a_subscription_and_clears_an_open_reminder(): void
    {
        $creator = $this->creator(['push_verified_at' => null]);

        // ⚠️ Written THROUGH the model, not with a query-builder update. `actingAs()` hands
        // the controller this exact instance, so a value written behind its back leaves the
        // in-memory attribute null — clearing it is then not a change, Eloquent omits it
        // from the UPDATE, and the test fails against a controller that is correct.
        $creator->forceFill(['push_reminded_at' => now()->subDay()])->saveQuietly();

        $this->actingAs($creator)
            ->postJson(route('push.heartbeat'), ['subscribed' => true, 'permission' => 'granted'])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $fresh = $creator->fresh();
        $this->assertNotNull($fresh->push_verified_at);
        $this->assertSame('granted', $fresh->push_permission_state);
        // A creator who has just fixed it must be able to be told again if it lapses
        // tomorrow, rather than being locked out of the cohort for the full window.
        $this->assertNull($fresh->push_reminded_at);
    }

    public function test_permission_granted_without_a_subscription_confirms_nothing(): void
    {
        $creator = $this->creator(['push_verified_at' => null]);

        // 🚨 The false positive the whole design turns on: a browser can report
        // `granted` and never have completed subscribe(), in which case MagicBell
        // has no device and delivers nothing.
        $this->actingAs($creator)
            ->postJson(route('push.heartbeat'), ['subscribed' => false, 'permission' => 'granted'])
            ->assertOk();

        $fresh = $creator->fresh();
        $this->assertNull($fresh->push_verified_at);
        $this->assertSame('granted', $fresh->push_permission_state);
        $this->assertTrue(PushReachability::isStale($fresh));
    }

    public function test_the_heartbeat_rejects_an_unknown_permission(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->postJson(route('push.heartbeat'), ['subscribed' => true, 'permission' => 'whatever'])
            ->assertStatus(422);
    }

    public function test_the_heartbeat_refuses_a_guest(): void
    {
        // ⚠️ Its own test, deliberately. `actingAs()` persists for every later request in
        // the same method, so a guest assertion sharing a test with an authenticated one
        // silently runs authenticated and passes for the wrong reason.
        $this->postJson(route('push.heartbeat'), ['subscribed' => true])
            ->assertStatus(401);
    }

    public function test_the_delivery_log_note_says_what_could_not_be_confirmed(): void
    {
        $stale = $this->creator(['push_verified_at' => now()->subDays(PushReachability::STALE_DAYS + 1)]);
        $never = $this->creator(['push_verified_at' => null]);
        $live = $this->creator(['push_verified_at' => now()]);

        $this->assertStringContainsString('last confirmed', PushReachability::logNoteFor($stale->email));
        PushReachability::flushCache();
        $this->assertStringContainsString('has ever been confirmed', PushReachability::logNoteFor($never->email));
        PushReachability::flushCache();
        // Nothing to say when we can confirm it — a note on every row is noise.
        $this->assertNull(PushReachability::logNoteFor($live->email));
    }
}
