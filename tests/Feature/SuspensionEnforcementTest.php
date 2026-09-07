<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\Services\PostingCadenceService;
use App\Services\SuspensionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The consequences of a suspension, and the sweep that applies them.
 *
 * 🚨 THE FLAG IS WRITTEN BY THE ADMIN APP, WHICH SHARES THIS DATABASE AND NONE
 * OF THIS CODE — no queue worker, no platform Stripe client, and an admin
 * waiting on a 60-second request. So `suspension:enforce` reconciles what the
 * back office wrote, claiming each account with `suspension_enforced_at`. Same
 * split, and the same reasoning, as `payout_paused_at` / `payouts:notify-holds`.
 *
 * ⚠️ Stripe is offline in `testing` (`OfflineStripeHttpClient`), so every
 * subscription call here fails and is swallowed per subscription, by design —
 * what these tests pin is the DB state and the claim, which is what decides
 * whether the sweep runs again.
 */
class SuspensionEnforcementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_suspending_records_the_reason_and_freezes_payouts(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $applied = app(SuspensionService::class)->suspend($creator, 'payment_risk', 'internal note', 7);

        $creator->refresh();

        $this->assertTrue($applied);
        $this->assertSame(1, (int) $creator->suspended_account);
        $this->assertSame('payment_risk', $creator->suspension_reason_code);
        $this->assertSame('internal note', $creator->suspension_note);
        $this->assertSame(7, (int) $creator->suspended_by_admin_id);
        $this->assertNotNull($creator->suspended_at);
        // Every outbound payment path already gates on this one column.
        $this->assertNotNull($creator->payout_paused_at);
        $this->assertSame(SuspensionService::PAYOUT_HOLD_REASON, $creator->payout_pause_reason);
        // Consequences pending — this is what the sweep claims.
        $this->assertNull($creator->suspension_enforced_at);
    }

    public function test_suspending_twice_does_not_overwrite_the_original_reason(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $service = app(SuspensionService::class);

        $service->suspend($creator, 'policy_violation');
        $again = $service->suspend($creator->refresh(), 'chargebacks');

        $this->assertFalse($again, 'A second suspend must be a no-op.');
        $this->assertSame('policy_violation', $creator->refresh()->suspension_reason_code);
    }

    public function test_the_sweep_claims_a_pending_suspension_and_does_not_repeat_it(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        // Exactly what the ADMIN app writes: the flag, no marker.
        $creator->forceFill([
            'suspended_account' => 1,
            'suspension_reason_code' => 'admin_action',
            'suspended_at' => now(),
        ])->save();

        $this->artisan('suspension:enforce')->assertSuccessful();

        $creator->refresh();
        $this->assertNotNull($creator->suspension_enforced_at, 'The sweep must claim the account.');
        // The sweep also applies the payout hold, because the admin app never did.
        $this->assertNotNull($creator->payout_paused_at);

        $claimedAt = $creator->suspension_enforced_at;

        $this->artisan('suspension:enforce')->assertSuccessful();

        $this->assertEquals(
            $claimedAt->toDateTimeString(),
            $creator->refresh()->suspension_enforced_at->toDateTimeString(),
            'A claimed account must not be enforced a second time.'
        );
    }

    public function test_lifting_a_suspension_releases_only_the_hold_it_put_on(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $service = app(SuspensionService::class);

        $service->suspend($creator, 'admin_action');
        $service->enforce($creator->refresh());
        $service->unsuspend($creator->refresh());
        $service->lift($creator->refresh());

        $creator->refresh();
        $this->assertSame(0, (int) $creator->suspended_account);
        $this->assertNull($creator->suspension_reason_code);
        $this->assertNull($creator->payout_paused_at);
        $this->assertNull($creator->suspension_enforced_at);
    }

    public function test_an_unrelated_payout_hold_survives_the_unsuspend(): void
    {
        // 🚨 An admin may have paused this creator's payouts for a reason of
        // their own. Lifting a suspension must not quietly pay out money
        // somebody else decided to hold.
        $creator = User::factory()->create(['role' => 1]);
        $creator->forceFill([
            'payout_paused_at' => now(),
            'payout_pause_reason' => 'Manual finance review',
        ])->save();

        $service = app(SuspensionService::class);
        $service->suspend($creator->refresh(), 'admin_action');
        $service->unsuspend($creator->refresh());

        $creator->refresh();
        $this->assertNotNull($creator->payout_paused_at);
        $this->assertSame('Manual finance review', $creator->payout_pause_reason);
    }

    public function test_the_sweep_undoes_the_consequences_after_an_unsuspend(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        // What the admin app leaves behind: flag off, marker still set.
        $creator->forceFill([
            'suspended_account' => 0,
            'suspension_enforced_at' => now()->subHour(),
        ])->save();

        $this->artisan('suspension:enforce')->assertSuccessful();

        $this->assertNull(
            $creator->refresh()->suspension_enforced_at,
            'Lifting must clear the marker, or the sweep runs for ever.'
        );
    }

    public function test_a_dry_run_changes_nothing(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $creator->forceFill(['suspended_account' => 1, 'suspended_at' => now()])->save();

        $this->artisan('suspension:enforce', ['--dry-run' => true])->assertSuccessful();

        $this->assertNull($creator->refresh()->suspension_enforced_at);
    }

    public function test_the_posting_cadence_job_never_resumes_a_suspended_creator(): void
    {
        /*
         * 🚨 Suspension and the posting-cadence pause use the SAME Stripe field.
         * A creator who was meeting the cadence when they were suspended would
         * otherwise have every supporter charged again by the next nightly run —
         * the one thing a suspension is supposed to stop.
         */
        $creator = User::factory()->create(['role' => 1]);
        $creator->forceFill([
            'suspended_account' => 1,
            'content_posting_paused_at' => now(),
        ])->save();

        $resumed = app(PostingCadenceService::class)->resumeCreator($creator->refresh());

        $this->assertSame(0, $resumed);
        $this->assertNotNull(
            $creator->refresh()->content_posting_paused_at,
            'The cadence flag must stay set while the account is suspended.'
        );
    }

    public function test_a_recurring_wish_is_stopped_alongside_bills_and_memberships(): void
    {
        /*
         * 🚨 RECURRING WISHES WERE MISSING FROM THE PAUSE LIST until 4 Sep 2026,
         * so a suspended creator went on being paid every month by every
         * recurring-wish supporter while their bills and memberships were
         * correctly stopped. Nothing errored — the money simply kept arriving
         * for an account that could not sell.
         */
        $creator = User::factory()->create(['role' => 1]);
        $supporter = User::factory()->create(['role' => 0]);

        $wish = WishItem::factory()->create(['user_id' => $creator->id]);

        WishItemSubscription::create([
            'uuid' => (string) Str::uuid(),
            'wish_item_id' => $wish->id,
            'user_id' => $supporter->id,
            'stripe_id' => 'sub_wish_recurring',
            'status' => 'paid',
            'recurring_for' => 'continue',
            'amount' => 10,
            'total_paid' => 10,
            'tax' => 0,
            'currency' => 'GBP',
        ]);

        $ids = app(SuspensionService::class)->incomingSubscriptionIds($creator);

        $this->assertContains('sub_wish_recurring', $ids);
    }

    public function test_a_one_off_wish_is_not_treated_as_a_subscription(): void
    {
        // ⚠️ The control. A one-time wish has no renewal to stop, and pausing a
        // finished payment at Stripe is a call that can only fail.
        $creator = User::factory()->create(['role' => 1]);
        $wish = WishItem::factory()->create(['user_id' => $creator->id]);

        WishItemSubscription::create([
            'uuid' => (string) Str::uuid(),
            'wish_item_id' => $wish->id,
            'stripe_id' => 'pi_one_off',
            'status' => 'paid',
            'recurring_for' => 'onetime',
            'amount' => 10,
            'total_paid' => 10,
            'tax' => 0,
            'currency' => 'GBP',
        ]);

        $this->assertNotContains('pi_one_off', app(SuspensionService::class)->incomingSubscriptionIds($creator));
    }
}
