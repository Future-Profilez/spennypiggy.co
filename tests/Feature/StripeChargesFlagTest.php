<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\StripeChargesFlag;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `users.charges_enabled` was written by NOTHING until 4 Sep 2026 — 570 of 570
 * live rows read 0 while 28 creators held a real `acct_…`, and the admin
 * console renders a red "supporters cannot buy from this creator" alert off it.
 */
class StripeChargesFlagTest extends TestCase
{
    use RefreshDatabase;

    private function account(string $id, bool $enabled): object
    {
        return (object) ['id' => $id, 'charges_enabled' => $enabled];
    }

    public function test_it_records_what_stripe_reports(): void
    {
        $user = User::factory()->create([
            'account_id' => 'acct_live',
            'charges_enabled' => 0,
        ]);

        StripeChargesFlag::sync($user, $this->account('acct_live', true));

        $user->refresh();

        $this->assertSame(1, (int) $user->charges_enabled);
        $this->assertNotNull($user->charges_checked_at);
    }

    /**
     * 🚨 The timestamp answers a DIFFERENT question — "has Stripe ever told
     * us?" — so it is written even when the value has not moved. Without it,
     * a healthy account reported as healthy is indistinguishable from one
     * nobody has ever asked about, which is the whole fault being closed.
     */
    public function test_an_unchanged_value_still_records_that_stripe_was_asked(): void
    {
        $user = User::factory()->create([
            'account_id' => 'acct_live',
            'charges_enabled' => 0,
            'charges_checked_at' => null,
        ]);

        StripeChargesFlag::sync($user, $this->account('acct_live', false));

        $this->assertNotNull($user->fresh()->charges_checked_at);
    }

    /**
     * An account object for somebody else must never write this row — a wrong
     * `true` says a creator can sell when they cannot.
     */
    public function test_an_account_belonging_to_another_creator_is_ignored(): void
    {
        $user = User::factory()->create([
            'account_id' => 'acct_mine',
            'charges_enabled' => 0,
        ]);

        StripeChargesFlag::sync($user, $this->account('acct_someone_else', true));

        $user->refresh();

        $this->assertSame(0, (int) $user->charges_enabled);
        $this->assertNull($user->charges_checked_at);
    }

    /**
     * ⚠️ It must not touch `users.updated_at`: the public profile cache is
     * keyed off that column and the creator-review queue ORDERS by it, so a
     * routine webhook would reshuffle the admin's list for no reason.
     */
    public function test_it_does_not_touch_the_row_timestamp(): void
    {
        $user = User::factory()->create([
            'account_id' => 'acct_live',
            'charges_enabled' => 0,
        ]);

        $before = $user->fresh()->updated_at;

        StripeChargesFlag::sync($user, $this->account('acct_live', true));

        $this->assertEquals($before, $user->fresh()->updated_at);
    }
}
