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
     * 🚨 THE BACKFILL COMMAND MUST NOT RE-IMPLEMENT THE WRITER'S SKIP RULE.
     *
     * `SyncChargesEnabled` used to `continue` whenever the stored value already
     * matched Stripe. Every row on the live database was 0, so the run wrote the
     * 15 healthy creators and stepped over the 12 Stripe genuinely reports as
     * FALSE — leaving `charges_checked_at` null on exactly the accounts the
     * column exists to identify, and the admin console reading them as "Stripe
     * has not told us" rather than "Stripe says this creator cannot sell".
     *
     * ⚠️ A SOURCE SCAN, not a behavioural test. Reaching that branch needs
     * `StripeControl::getAccount` to answer for a live connected account, and
     * the suite's Stripe client is deliberately offline — so a functional test
     * would report every row as unreachable and assert nothing. What has to be
     * pinned is that the command still hands every checked account to the
     * writer. Comments are blanked first: the note at the call site explains the
     * bug by describing the shape being searched for.
     */
    public function test_the_backfill_hands_every_checked_account_to_the_writer(): void
    {
        $source = file_get_contents(app_path('Console/Commands/SyncChargesEnabled.php'));

        $code = preg_replace('#/\*.*?\*/#s', '', $source);
        $code = preg_replace('#//[^\n]*#', '', (string) $code);

        $this->assertStringContainsString(
            'StripeChargesFlag::sync(',
            (string) $code,
            'The backfill no longer calls the one writer.'
        );

        $this->assertDoesNotMatchRegularExpression(
            '#===\s*\$enabled\s*\)\s*\{\s*continue;#',
            (string) $code,
            'The backfill skips an unchanged value again, so a creator Stripe reports as '
            .'disabled never gets charges_checked_at and reads as "not reported".'
        );
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
