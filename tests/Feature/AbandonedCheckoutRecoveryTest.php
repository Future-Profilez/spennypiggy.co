<?php

namespace Tests\Feature;

use App\Http\Controllers\EmailPreferenceController;
use App\Mail\AbandonedCheckoutReminder;
use App\Models\AbandonedCheckout;
use App\Models\ShopPayment;
use App\Models\User;
use App\Services\AbandonedCheckoutService;
use App\Services\CreatorOpportunityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AbandonedCheckoutRecoveryTest extends TestCase
{
    use RefreshDatabase;

    /** A stand-in for the Stripe Checkout Session object the controllers hand to record(). */
    private function stripeSession(string $id = 'cs_test_1', ?int $expiresAt = null): object
    {
        return (object) [
            'id' => $id,
            'url' => 'https://checkout.stripe.com/c/pay/'.$id,
            'expires_at' => $expiresAt ?? now()->addDay()->timestamp,
            'amount_total' => 1999,
            'currency' => 'gbp',
        ];
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
    }

    /**
     * An open row with a matching unpaid shop payment behind it.
     *
     * `session_id` is unique and record() upserts on it, so a test needing two distinct
     * checkouts must pass distinct ids — otherwise the second call silently rewrites
     * the first row rather than creating one.
     */
    private function openShopCheckout(
        array $overrides = [],
        string $paymentStatus = 'pending',
        string $sessionId = 'cs_test_1'
    ): AbandonedCheckout {
        $creator = $this->creator();

        ShopPayment::create([
            'session_id' => $sessionId,
            'shop_id' => 1,
            'amount' => 19.99,
            'currency' => 'gbp',
            'payment_status' => $paymentStatus,
        ]);

        AbandonedCheckoutService::record(
            $this->stripeSession($sessionId),
            'shop',
            $creator,
            // No item_id: the buyability check is exercised separately, and a missing
            // listing would otherwise mask the guard under test.
            null,
            null,
            'guest@example.com',
            1999,
            'gbp',
            'card'
        );

        $row = AbandonedCheckout::firstWhere('session_id', $sessionId);
        $row->forceFill($overrides)->save();

        return $row->fresh();
    }

    public function test_record_stores_the_session_and_its_resume_link(): void
    {
        $creator = $this->creator();

        AbandonedCheckoutService::record($this->stripeSession(), 'shop', $creator, 7, null, 'guest@example.com', 1999, 'gbp', 'card');

        $row = AbandonedCheckout::firstWhere('session_id', 'cs_test_1');

        $this->assertNotNull($row);
        $this->assertSame('shop', $row->product_type);
        $this->assertSame('7', $row->item_id);
        $this->assertSame('guest@example.com', $row->guest_email);
        $this->assertSame(1999, $row->amount_minor);
        $this->assertStringStartsWith('https://checkout.stripe.com/', $row->checkout_url);
        $this->assertNotNull($row->expires_at);
    }

    public function test_record_never_throws_and_never_records_an_unusable_row(): void
    {
        $creator = $this->creator();

        // No session, an unknown product type, and a session with no URL: all three are
        // recorded as nothing rather than blowing up the checkout that called them.
        AbandonedCheckoutService::record(null, 'shop', $creator);
        AbandonedCheckoutService::record($this->stripeSession('cs_x'), 'not_a_module', $creator);
        AbandonedCheckoutService::record((object) ['id' => 'cs_y'], 'shop', $creator);

        $this->assertSame(0, AbandonedCheckout::count());
    }

    public function test_recording_the_same_session_twice_updates_rather_than_duplicates(): void
    {
        $creator = $this->creator();

        AbandonedCheckoutService::record($this->stripeSession(), 'shop', $creator, 1);
        AbandonedCheckoutService::record($this->stripeSession(), 'shop', $creator, 2);

        $this->assertSame(1, AbandonedCheckout::count());
        $this->assertSame('2', AbandonedCheckout::first()->item_id);
    }

    public function test_a_paid_checkout_is_closed_and_can_never_be_chased(): void
    {
        $row = $this->openShopCheckout();

        AbandonedCheckoutService::markRecovered('cs_test_1');

        $row->refresh();
        $this->assertNotNull($row->recovered_at);
        $this->assertSame('paid', $row->closed_reason);
        $this->assertSame(0, app(AbandonedCheckoutService::class)->dueForReminder()->count());
    }

    public function test_a_reminder_is_not_due_until_the_first_scheduled_hour_has_passed(): void
    {
        $service = app(AbandonedCheckoutService::class);

        $row = $this->openShopCheckout(['created_at' => now()->subMinutes(20)]);
        $this->assertFalse($service->isDue($row));

        $row = $this->openShopCheckout(['created_at' => now()->subHours(2)], 'pending', 'cs_due');
        $this->assertTrue($service->isDue($row));
    }

    public function test_the_schedule_is_config_driven_so_it_can_be_shortened_for_testing(): void
    {
        config(['checkout_recovery.schedule_minutes' => [1, 2]]);

        $service = app(AbandonedCheckoutService::class);

        $row = $this->openShopCheckout(['created_at' => now()->subSeconds(30)]);
        $this->assertFalse($service->isDue($row));

        $row->forceFill(['created_at' => now()->subMinutes(2)])->save();
        $this->assertTrue($service->isDue($row->fresh()));
    }

    public function test_an_empty_schedule_config_falls_back_rather_than_silencing_every_reminder(): void
    {
        // A blank env value must not be read as "send nothing" — that would stop the
        // whole feature with no error anywhere.
        config(['checkout_recovery.schedule_minutes' => []]);

        $this->assertSame([60, 1200], AbandonedCheckoutService::schedule());
    }

    public function test_a_guest_gets_one_reminder_and_an_account_holder_gets_two(): void
    {
        $service = app(AbandonedCheckoutService::class);

        $guestRow = $this->openShopCheckout([
            'created_at' => now()->subHours(21),
            'reminder_count' => 1,
        ]);
        $this->assertFalse($service->isDue($guestRow), 'A guest must never receive a second reminder.');

        $user = User::factory()->create();
        $guestRow->forceFill(['user_id' => $user->id])->save();

        $this->assertTrue($service->isDue($guestRow->fresh()));
    }

    public function test_money_already_in_flight_is_never_chased_and_never_closed(): void
    {
        // `processing` is a bank/SEPA/ACH debit the supporter has already authorised.
        $row = $this->openShopCheckout(['created_at' => now()->subHours(2)], 'processing');

        $service = app(AbandonedCheckoutService::class);
        $reason = 'unset';

        $this->assertFalse($service->isStillRecoverable($row, $reason));
        // No close reason: the row is left open until the bank resolves it.
        $this->assertNull($reason);
    }

    public function test_a_settled_payment_is_not_recoverable(): void
    {
        $row = $this->openShopCheckout(['created_at' => now()->subHours(2)], 'paid');

        $reason = null;
        $this->assertFalse(app(AbandonedCheckoutService::class)->isStillRecoverable($row, $reason));
        $this->assertSame('unrecoverable', $reason);
    }

    public function test_an_expired_session_is_closed_rather_than_emailed(): void
    {
        $row = $this->openShopCheckout([
            'created_at' => now()->subHours(2),
            'expires_at' => now()->subMinute(),
        ]);

        $reason = null;
        $this->assertFalse(app(AbandonedCheckoutService::class)->isStillRecoverable($row, $reason));
        $this->assertSame('expired', $reason);
    }

    public function test_a_checkout_with_nobody_to_write_to_is_not_chased(): void
    {
        $row = $this->openShopCheckout([
            'created_at' => now()->subHours(2),
            'guest_email' => null,
        ]);

        $reason = null;
        $this->assertFalse(app(AbandonedCheckoutService::class)->isStillRecoverable($row, $reason));
        $this->assertSame('unrecoverable', $reason);
    }

    public function test_a_row_with_no_creator_is_closed_rather_than_retried_forever(): void
    {
        // The reminder copy names the creator, so a row without one can never be sent.
        // Left open it would fail inside the sender and be re-picked every hour.
        $row = $this->openShopCheckout([
            'created_at' => now()->subHours(2),
            'creator_id' => null,
        ]);

        $reason = null;
        $this->assertFalse(app(AbandonedCheckoutService::class)->isStillRecoverable($row, $reason));
        $this->assertSame('unrecoverable', $reason);
    }

    public function test_a_suspended_creator_is_never_chased(): void
    {
        $row = $this->openShopCheckout(['created_at' => now()->subHours(2)]);
        $row->creator->forceFill(['suspended_account' => 1])->save();

        $reason = null;
        $this->assertFalse(app(AbandonedCheckoutService::class)->isStillRecoverable($row->fresh(), $reason));
        $this->assertSame('unrecoverable', $reason);
    }

    public function test_the_reminder_claim_is_atomic(): void
    {
        $service = app(AbandonedCheckoutService::class);
        $row = $this->openShopCheckout(['created_at' => now()->subHours(2)]);

        // Two workers holding the same stale model: only one can move the counter.
        $first = clone $row;
        $second = clone $row;

        $this->assertTrue($service->claimReminder($first));
        $this->assertFalse($service->claimReminder($second));
        $this->assertSame(1, $row->fresh()->reminder_count);
    }

    public function test_the_command_emails_a_guest_once_and_then_stops(): void
    {
        Mail::fake();

        $this->openShopCheckout(['created_at' => now()->subHours(2)]);

        $this->artisan('checkout:recover')->assertSuccessful();
        Mail::assertSent(AbandonedCheckoutReminder::class, 1);

        // Second run: the claim already moved, and a guest gets only one reminder.
        $this->artisan('checkout:recover')->assertSuccessful();
        Mail::assertSent(AbandonedCheckoutReminder::class, 1);
    }

    public function test_dry_run_sends_nothing_and_claims_nothing(): void
    {
        Mail::fake();

        $row = $this->openShopCheckout(['created_at' => now()->subHours(2)]);

        $this->artisan('checkout:recover --dry-run')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertSame(0, $row->fresh()->reminder_count);
    }

    public function test_prune_deletes_only_long_closed_rows(): void
    {
        $service = app(AbandonedCheckoutService::class);

        $old = $this->openShopCheckout();
        $old->forceFill(['closed_at' => now()->subDays(400), 'closed_reason' => 'expired'])->save();

        $recentlyClosed = $this->openShopCheckout([], 'pending', 'cs_recent');
        $recentlyClosed->forceFill([
            'closed_at' => now()->subDay(),
            'closed_reason' => 'expired',
        ])->save();

        $stillOpen = AbandonedCheckout::create([
            'session_id' => 'cs_open',
            'checkout_url' => 'https://checkout.stripe.com/c/pay/cs_open',
            'product_type' => 'shop',
        ]);

        $this->assertSame(1, $service->prune());

        $this->assertNull(AbandonedCheckout::find($old->id));
        $this->assertNotNull(AbandonedCheckout::find($recentlyClosed->id));
        $this->assertNotNull(AbandonedCheckout::find($stillOpen->id));
    }

    public function test_prune_dry_run_counts_without_deleting(): void
    {
        $row = $this->openShopCheckout();
        $row->forceFill(['closed_at' => now()->subDays(400), 'closed_reason' => 'expired'])->save();

        $this->assertSame(1, app(AbandonedCheckoutService::class)->prune(180, true));
        $this->assertNotNull(AbandonedCheckout::find($row->id));
    }

    public function test_a_guest_who_unsubscribes_is_never_emailed_again(): void
    {
        Mail::fake();

        $service = app(AbandonedCheckoutService::class);

        // They opted out from a previous checkout's email footer.
        $first = $this->openShopCheckout();
        $first->forceFill(['closed_at' => now(), 'closed_reason' => 'opted_out'])->save();

        $this->assertTrue($service->isSuppressed('guest@example.com'));

        // A later checkout from the same address is closed, not chased.
        $second = $this->openShopCheckout(['created_at' => now()->subHours(2)], 'pending', 'cs_second');

        $this->artisan('checkout:recover')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertSame('opted_out', $second->fresh()->closed_reason);
    }

    public function test_the_guest_unsubscribe_link_closes_every_open_checkout_for_that_address(): void
    {
        $row = $this->openShopCheckout();

        $url = EmailPreferenceController::generateCheckoutReminderOptOut($row->id);

        $this->get($url)->assertRedirect('/');

        $this->assertSame('opted_out', $row->fresh()->closed_reason);
        $this->assertTrue(app(AbandonedCheckoutService::class)->isSuppressed('guest@example.com'));
    }

    public function test_an_unsigned_unsubscribe_link_changes_nothing(): void
    {
        $row = $this->openShopCheckout();

        $this->get(route('checkout-reminders.stop', ['checkout' => $row->id]))->assertRedirect('/');

        $this->assertNull($row->fresh()->closed_at);
    }

    public function test_the_reminder_renders_a_real_at_sign_and_never_the_reward_body(): void
    {
        $html = (new AbandonedCheckoutReminder(
            checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_x',
            creatorName: 'Test Creator',
            creatorUsername: 'testcreator',
            itemTitle: 'Studio Setup',
            rewardTitle: 'Studio Setup',
            amountLabel: '£33.68',
        ))->render();

        // `&commat;` is an HTML5-only named entity: several mail clients printed it
        // literally, so the handle read "&commat;testcreator" in the inbox.
        $this->assertStringNotContainsString('commat', $html);
        $this->assertStringNotContainsString('amp;#64', $html, 'The entity must not be double-escaped.');
        $this->assertStringContainsString('@testcreator', html_entity_decode($html));

        $this->assertStringContainsString('https://checkout.stripe.com/c/pay/cs_x', $html);
    }

    public function test_the_creator_panel_reports_totals_and_never_names_a_supporter(): void
    {
        $row = $this->openShopCheckout();

        $panel = app(CreatorOpportunityService::class)
            ->abandonedCheckouts($row->creator, 'GBP');

        $this->assertSame(1, $panel['count']);
        $this->assertSame(19.99, $panel['value']);
        $this->assertSame(0, $panel['recovered']);
        $this->assertSame(0.0, $panel['recovery_rate']);

        // The whole payload must be free of supporter identity.
        $encoded = json_encode($panel);
        $this->assertStringNotContainsString('guest@example.com', $encoded);
        $this->assertStringNotContainsString('user_id', $encoded);
        $this->assertStringNotContainsString('guest_email', $encoded);
    }

    public function test_the_creator_panel_reports_no_rate_when_nothing_was_started(): void
    {
        $creator = $this->creator();

        $panel = app(CreatorOpportunityService::class)->abandonedCheckouts($creator, 'GBP');

        $this->assertSame(0, $panel['count']);
        // Null, not 0 — "nobody started" is not "nobody completed".
        $this->assertNull($panel['recovery_rate']);
    }

    public function test_an_opted_out_supporter_is_closed_out_rather_than_emailed(): void
    {
        Mail::fake();

        $user = User::factory()->create(['abandoned_checkout_emails_enabled' => false]);

        $row = $this->openShopCheckout([
            'created_at' => now()->subHours(2),
            'user_id' => $user->id,
        ]);

        $this->artisan('checkout:recover')->assertSuccessful();

        Mail::assertNothingSent();
        $this->assertSame('opted_out', $row->fresh()->closed_reason);
    }
}
