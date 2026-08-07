<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\GifterCardVerification;
use App\Models\User;
use App\Models\UserPayment;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

/**
 * The £500 lifetime spend gate.
 *
 * Past it, a buyer must verify the card that paid before spending further, and
 * an admin compares the address they gave us with the one their bank holds.
 *
 * It used to return early for anything but `role = 0`, so a CREATOR could spend
 * past £500 with no verification at all while a gifter was stopped at exactly
 * the same figure. The threshold is about the spend, not about which kind of
 * account is doing it.
 */
class SpendMilestoneVerificationTest extends TestCase
{
    use RefreshDatabase;

    private function spender(int $role, float $spent): User
    {
        $user = User::factory()->create([
            'role' => $role,
            'profile_status_lock' => 2,
            'is_500_limit_exceeded' => 0,
        ]);

        UserPayment::create([
            'from_user_id' => $user->id,
            'to_user_id' => User::factory()->create(['role' => 1])->id,
            'amount' => $spent,
            'currency' => 'GBP',
            'status' => 'paid',
        ]);

        return $user->refresh();
    }

    private function evaluate(User $user): bool
    {
        Auth::login($user);

        return Helpers::checkGifterCardVerificationStatus();
    }

    public function test_a_creator_past_the_threshold_is_stopped_for_verification(): void
    {
        $creator = $this->spender(1, 750);

        $this->assertTrue($this->evaluate($creator));
        $this->assertSame(1, (int) $creator->refresh()->is_500_limit_exceeded);
    }

    /**
     * 🚨 The rule that makes extending this to creators safe at all.
     *
     * `profile_status_lock = 1` takes the verified badge, removes the creator
     * from Discover, search, trending and top-earners — delisting every item they
     * sell — and blocks Stripe onboarding, and nothing on the website ever sets it
     * back. Spending £500 as a BUYER must not take a creator's shop off the
     * platform.
     */
    public function test_a_creator_is_never_demoted_by_their_own_spending(): void
    {
        $creator = $this->spender(1, 750);

        $this->evaluate($creator);

        $this->assertSame(2, (int) $creator->refresh()->profile_status_lock);
    }

    public function test_a_gifter_still_enters_the_review_queue(): void
    {
        // For a gifter the flag costs nothing and is how they reach an admin.
        $gifter = $this->spender(0, 750);

        $this->assertTrue($this->evaluate($gifter));

        $gifter->refresh();

        $this->assertSame(1, (int) $gifter->is_500_limit_exceeded);
        $this->assertSame(1, (int) $gifter->profile_status_lock);
    }

    public function test_spending_under_the_threshold_changes_nothing(): void
    {
        $creator = $this->spender(1, 200);

        $this->assertFalse($this->evaluate($creator));
        $this->assertSame(0, (int) $creator->refresh()->is_500_limit_exceeded);
    }

    /**
     * 🚨 The hole this closes.
     *
     * The check used to return true only on the single request that flipped the
     * flag from 0 to 1, and false on every one after it — so a buyer was bounced
     * once and then spent freely. On Shop, Paid Tasks, Piggy Pot and the Piggy
     * Bank, which carried no middleware, that inline call WAS the enforcement.
     */
    public function test_the_block_holds_on_every_purchase_not_just_the_first(): void
    {
        $creator = $this->spender(1, 750);

        $this->assertTrue($this->evaluate($creator));
        $this->assertTrue($this->evaluate($creator->refresh()), 'The second purchase must be stopped too.');
        $this->assertTrue($this->evaluate($creator->refresh()));
    }

    private function verify(User $user, string $status = 'success'): void
    {
        GifterCardVerification::create([
            'user_id' => $user->id,
            'amount' => 1,
            'currency' => 'GBP',
            'status' => $status,
        ]);
    }

    public function test_a_creator_is_released_by_paying_the_charge(): void
    {
        // ⚠️ A creator has no admin step. Their account is already approved as a
        // creator, and `profile_status_lock` for them means "your profile was
        // reviewed" — a state they usually reached long before they spent
        // anything, so it cannot stand in for the address verdict.
        $creator = $this->spender(1, 750);
        $this->evaluate($creator);

        $this->verify($creator);

        $this->assertFalse($this->evaluate($creator->refresh()));
    }

    public function test_a_gifter_still_waits_for_the_admin_after_paying(): void
    {
        $gifter = $this->spender(0, 750);
        $this->evaluate($gifter);

        $this->verify($gifter);

        // Paid, but the address has not been compared with the card yet.
        $this->assertSame(1, (int) $gifter->refresh()->profile_status_lock);
        $this->assertTrue($this->evaluate($gifter->refresh()));

        $gifter->forceFill(['profile_status_lock' => 2])->saveQuietly();

        $this->assertFalse($this->evaluate($gifter->refresh()));
    }

    public function test_a_failed_charge_does_not_release_anybody(): void
    {
        $creator = $this->spender(1, 750);
        $this->evaluate($creator);

        $this->verify($creator, 'failed');

        $this->assertTrue($this->evaluate($creator->refresh()));
    }
}
