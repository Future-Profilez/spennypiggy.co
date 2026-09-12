<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\User;
use App\Models\UserPayment;
use App\Support\VerifiedBadge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

/**
 * The £500 lifetime spend milestone.
 *
 * 🚨 IT IS A BADGE NOW, NOT A GATE (client direction, 12 Sep 2026). Until that
 * day a buyer past £500 was REFUSED every further purchase until they paid a
 * verification charge and an admin compared the address they gave us with the
 * one their bank holds — and the admin screen that took that decision was
 * deleted the same day, so the gate had become a permanent block with nobody
 * able to lift it. Measured then: 15 supporters over the threshold, all already
 * cleared, so nobody was stuck — but the next one to cross would have been, for
 * ever.
 *
 * ⚠️ THIS CLASS WAS NOT DELETED WITH THE GATE, AND THE FILE NAME IS UNCHANGED
 * ON PURPOSE. Two things it always guarded are still true and still matter:
 * the flag is WRITTEN, and a person's own spending never demotes their account.
 * The flag is now load-bearing for a different reason — it is the whole basis
 * of the supporter's grey badge — so a silent regression in the WRITE would now
 * take every supporter badge off the platform instead of opening a payment gate.
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

    /**
     * 🚨 THE FLAG IS STILL WRITTEN, AND THAT IS THE POINT OF THIS FILE NOW.
     *
     * The method reads as a gate and answers `false` for everybody; the work it
     * still does is the lines ABOVE that return. Deleting it as "dead" would
     * stop anybody ever earning the supporter badge, with nothing failing.
     */
    public function test_passing_the_threshold_still_records_it(): void
    {
        foreach ([0, 1] as $role) {
            $user = $this->spender($role, 750);

            $this->evaluate($user);

            $this->assertSame(
                1,
                (int) $user->refresh()->is_500_limit_exceeded,
                'Role '.$role.': the milestone must be recorded — it is the supporter badge.'
            );
        }
    }

    public function test_spending_under_the_threshold_records_nothing(): void
    {
        $user = $this->spender(0, 200);

        $this->evaluate($user);

        $this->assertSame(0, (int) $user->refresh()->is_500_limit_exceeded);
    }

    /**
     * 🚨 NOBODY IS EVER REFUSED. This asserted the exact opposite until 12 Sep
     * 2026 — a true statement then, and the single most expensive thing to leave
     * behind, because the screen that released people no longer exists.
     */
    public function test_no_purchase_is_ever_blocked_by_spending(): void
    {
        foreach ([0, 1] as $role) {
            $user = $this->spender($role, 750);

            $this->assertFalse($this->evaluate($user), 'Role '.$role.' crossing the threshold.');
            $this->assertFalse($this->evaluate($user->refresh()), 'Role '.$role.' on the purchase after it.');
        }
    }

    /**
     * ⚠️ The rule that made extending the old gate to creators safe at all, and
     * it now covers BOTH roles.
     *
     * `profile_status_lock = 1` takes the verified badge, removes a creator from
     * Discover, search, trending and top-earners — delisting every item they
     * sell — and nothing on the website ever sets it back. For a supporter it
     * used to be how they reached an admin; that queue is gone, so writing it
     * would strand them with nothing able to clear it.
     */
    public function test_spending_never_moves_anybodys_profile_lock(): void
    {
        foreach ([0, 1] as $role) {
            $user = $this->spender($role, 750);

            $this->evaluate($user);

            $this->assertSame(
                2,
                (int) $user->refresh()->profile_status_lock,
                'Role '.$role.": a person's own spending must not demote their account."
            );
        }
    }

    /** The milestone earns the grey badge — the one thing it is now for. */
    public function test_the_milestone_earns_a_supporter_the_badge(): void
    {
        $supporter = $this->spender(0, 750);

        $this->assertNull(VerifiedBadge::tierFor($supporter), 'Nothing is earned before the threshold is recorded.');

        $this->evaluate($supporter);

        $this->assertSame(VerifiedBadge::BASIC, VerifiedBadge::tierFor($supporter->refresh()));
    }
}
