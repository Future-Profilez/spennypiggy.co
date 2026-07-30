<?php

namespace Tests\Feature;

use App\Mail\AbandonedCheckoutReminder;
use App\Models\AbandonedCheckout;
use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\Services\AbandonedCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Every sellable module must be recoverable, end to end.
 *
 * `AbandonedCheckoutService::SOURCES` maps each product type to a payment model, its
 * session column and its status column. A wrong entry there fails SILENTLY — the row is
 * simply never found, `isStillRecoverable()` fails closed, and that module's reminders
 * quietly never send. Nothing errors, nothing logs. This test is the only thing that
 * would catch it.
 *
 * The sister test (AbandonedCheckoutRecoveryTest) covers the rules; this one covers the
 * coverage.
 */
class AbandonedCheckoutAllModulesTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
    }

    /**
     * One unpaid payment row per module, keyed the way that module's checkout writes it.
     *
     * Deliberately mirrors the real column names rather than a shared shape — the whole
     * point is that these differ (`stripe_session_id` vs `session_id`, `payment_status`
     * vs `status`) and the map has to get each one right.
     */
    private function unpaidPaymentRow(string $productType, string $sessionId, User $creator): void
    {
        match ($productType) {
            'wish' => StripePaymentDetail::create([
                'session_id' => $sessionId,
                'amount_total' => 19.99,
                'currency' => 'gbp',
            ]),
            'wish_subscription' => WishItemSubscription::create([
                'session_id' => $sessionId,
                'wish_item_id' => 1,
                'amount' => 19.99,
                'tax' => 0,
                'currency' => 'gbp',
                'status' => 'initiated',
            ]),
            'shop' => ShopPayment::create([
                'session_id' => $sessionId,
                'shop_id' => 1,
                'amount' => 19.99,
                'currency' => 'gbp',
            ]),
            // Paid Tasks write NO TaskPurchase row until fulfilment — its absence is the
            // proof of non-payment, which is exactly what the map's last flag encodes.
            'task' => null,
            'piggy_pot' => PiggyPotContribution::create([
                'session_id' => $sessionId,
                'piggy_pot_id' => $this->piggyPot($creator)->id,
                'creator_id' => $creator->id,
                'amount' => 19.99,
                'currency' => 'gbp',
                'status' => 'pending',
            ]),
            'tip' => TipGoalsPayment::create([
                'session_id' => $sessionId,
                'tip_goal_id' => $this->tipGoal($creator)->id,
                'creator_id' => $creator->id,
                'amount' => 19.99,
                'currency' => 'gbp',
                'status' => 'pending',
            ]),
            'bill' => BillPayment::create([
                'session_id' => $sessionId,
                'bills_id' => 1,
                'amount' => 19.99,
                'currency' => 'gbp',
                'status' => 'initiated',
            ]),
            'membership' => MembershipPayment::create([
                'session_id' => $sessionId,
                'membership_id' => 1,
                'amount' => 19.99,
                'currency' => 'gbp',
                'status' => 'initiated',
            ]),
        };
    }

    private function piggyPot(User $creator): PiggyPot
    {
        return PiggyPot::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Studio content',
            'description' => 'Behind the scenes',
            'target_amount' => 500,
            'currency' => 'gbp',
            'status' => 'active',
        ]);
    }

    private function tipGoal(User $creator): TipGoal
    {
        // forceCreate, not create: TipGoal's monetary columns were deprecated in the model
        // (the Piggy Bank is a content purchase, not a fundraising target) but are still
        // NOT NULL in the schema, so mass assignment alone cannot satisfy the insert.
        return TipGoal::forceCreate([
            'user_id' => $creator->id,
            'name' => 'Exclusive content',
            'target' => 0,
            'status' => 1,
        ]);
    }

    /** @return array<string, array{0: string}> */
    public static function moduleProvider(): array
    {
        return [
            'wish / basket' => ['wish'],
            'wish subscription' => ['wish_subscription'],
            'shop' => ['shop'],
            'paid task' => ['task'],
            'piggy pot' => ['piggy_pot'],
            'tip / piggy bank' => ['tip'],
            'bill' => ['bill'],
            'membership' => ['membership'],
        ];
    }

    /**
     * @dataProvider moduleProvider
     */
    public function test_every_module_records_and_sends_a_reminder(string $productType): void
    {
        Mail::fake();

        $creator = $this->creator();
        $sessionId = 'cs_'.$productType;

        $this->unpaidPaymentRow($productType, $sessionId, $creator);

        AbandonedCheckoutService::record(
            (object) [
                'id' => $sessionId,
                'url' => 'https://checkout.stripe.com/c/pay/'.$sessionId,
                'expires_at' => now()->addHours(20)->timestamp,
                'amount_total' => 1999,
                'currency' => 'gbp',
            ],
            $productType,
            $creator,
            null,
            null,
            'guest@example.com',
            1999,
            'gbp',
            'card'
        );

        $row = AbandonedCheckout::firstWhere('session_id', $sessionId);
        $this->assertNotNull($row, "[{$productType}] the checkout was not recorded at all.");

        $row->forceFill(['created_at' => now()->subHours(2)])->save();
        $row = $row->fresh();

        $service = app(AbandonedCheckoutService::class);

        $this->assertTrue($service->isDue($row), "[{$productType}] the reminder never became due.");

        $reason = null;
        $this->assertTrue(
            $service->isStillRecoverable($row, $reason),
            "[{$productType}] not recoverable (reason: ".($reason ?? 'none').') — check the SOURCES entry.'
        );

        $this->artisan('checkout:recover')->assertSuccessful();

        Mail::assertQueued(AbandonedCheckoutReminder::class, 1);
        $this->assertSame(1, $row->fresh()->reminder_count, "[{$productType}] the reminder was not claimed.");
    }

    /**
     * @dataProvider moduleProvider
     */
    public function test_every_module_stops_chasing_once_the_payment_settles(string $productType): void
    {
        Mail::fake();

        $creator = $this->creator();
        $sessionId = 'cs_paid_'.$productType;

        AbandonedCheckoutService::record(
            (object) [
                'id' => $sessionId,
                'url' => 'https://checkout.stripe.com/c/pay/'.$sessionId,
                'expires_at' => now()->addHours(20)->timestamp,
                'amount_total' => 1999,
                'currency' => 'gbp',
            ],
            $productType,
            $creator,
            null,
            null,
            'guest@example.com',
            1999,
            'gbp',
            'card'
        );

        // Whatever the module, the webhook closes the row the moment the supporter
        // completes the flow — this is the guard that stops a paying supporter being
        // told their purchase failed.
        AbandonedCheckoutService::markRecovered($sessionId);

        AbandonedCheckout::where('session_id', $sessionId)
            ->update(['created_at' => now()->subHours(2)]);

        $this->artisan('checkout:recover')->assertSuccessful();

        Mail::assertNothingSent();
    }
}
