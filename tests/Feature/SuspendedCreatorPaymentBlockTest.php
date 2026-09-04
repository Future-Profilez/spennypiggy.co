<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\CreatorAvailabilityMessageService;
use App\Services\CreatorSubscriptionService;
use App\Support\SuspendedAccount;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * A suspended account takes no money in, and sends none out.
 *
 * 🚨 THE IN SIDE IS ENFORCED IN ONE PLACE ON PURPOSE.
 * `CreatorSubscriptionService::validateCreatorSubscription` is called by every
 * checkout on the platform — ten call sites, including the two GUEST ones
 * (Piggy Pot and Wish), which have no session for the suspension middleware to
 * read. Refusing there is what makes "no money by any route" true, rather than
 * a line added to ten controllers and forgotten in the eleventh.
 *
 * The OUT side is a separate guard in each checkout, because some purchases
 * start on a GET that the middleware deliberately lets through.
 */
class SuspendedCreatorPaymentBlockTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function suspend(User $user): User
    {
        $user->forceFill([
            'suspended_account' => 1,
            'suspension_reason_code' => 'policy_violation',
            'suspended_at' => now(),
        ])->save();

        return $user->refresh();
    }

    public function test_a_suspended_creator_cannot_be_paid(): void
    {
        $creator = $this->suspend(User::factory()->create(['role' => 1]));

        $check = app(CreatorSubscriptionService::class)->validateCreatorSubscription($creator);

        $this->assertFalse($check['eligible']);
        $this->assertSame(SuspendedAccount::REASON, $check['status']);
    }

    public function test_the_refusal_outranks_the_role_check(): void
    {
        // 🚨 The suspension test sits ABOVE `role !== 1`, which returns eligible.
        // A suspended row is not to be paid whatever its role.
        $fan = $this->suspend(User::factory()->create(['role' => 0]));

        $check = app(CreatorSubscriptionService::class)->validateCreatorSubscription($fan);

        $this->assertFalse($check['eligible']);
        $this->assertSame(SuspendedAccount::REASON, $check['status']);
    }

    public function test_the_supporter_is_never_told_the_account_is_suspended(): void
    {
        // The suspension is the account holder's business. A stranger gets the
        // generic "this page is paused" copy, exactly as for every other gate.
        $creator = $this->suspend(User::factory()->create(['role' => 1]));

        $check = app(CreatorSubscriptionService::class)->validateCreatorSubscription($creator);

        $message = app(CreatorAvailabilityMessageService::class)
            ->supporterMessage($check, null);

        $this->assertStringNotContainsStringIgnoringCase('suspend', $message);
    }

    public function test_a_suspended_account_may_not_pay_anybody(): void
    {
        $payer = $this->suspend(User::factory()->create(['role' => 1]));

        $this->assertTrue(SuspendedAccount::blocksPayer($payer));
        $this->assertFalse(SuspendedAccount::blocksPayer(User::factory()->create(['role' => 0])));
        // A guest has no row, so nothing to block — the payee-side gate covers them.
        $this->assertFalse(SuspendedAccount::blocksPayer(null));
    }

    public function test_every_checkout_gate_carries_the_payer_guard(): void
    {
        /*
         * 🚨 A SCAN, NOT A ROUTE TEST. Each of these controllers refuses with a
         * different response shape (Inertia redirect, `awayFrom`, three
         * different JSON envelopes), so exercising them end to end needs a live
         * Stripe session and a listing per module — and the failure this guards
         * against is a NEW checkout that copy-pastes the payee gate and forgets
         * the payer one, which no per-route test would ever see.
         */
        $files = [
            'app/Http/Controllers/PiggyPotPaymentController.php',
            'app/Http/Controllers/TaskController.php',
            'app/Http/Controllers/Auth/CheckoutController.php',
            'app/Http/Controllers/Auth/WishitemController.php',
            'app/Http/Controllers/Auth/MembershipController.php',
            'app/Http/Controllers/Auth/ShopsController.php',
            'app/Http/Controllers/Auth/StripeController.php',
            'app/Http/Controllers/Auth/BillsController.php',
        ];

        foreach ($files as $file) {
            $source = file_get_contents(base_path($file));

            $payee = substr_count($source, 'validateCreatorSubscription(');
            $payer = substr_count($source, 'SuspendedAccount::blocksPayer(');

            $this->assertGreaterThanOrEqual(
                $payee,
                $payer,
                "{$file} refuses money coming IN but not going OUT — every checkout needs both."
            );
        }
    }
}
