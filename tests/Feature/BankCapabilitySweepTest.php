<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The scheduled top-up behind `account.updated`.
 *
 * 🚨 WHAT THIS GUARDS IS THE SHAPE, NOT STRIPE. Every Stripe call is refused in
 * `testing` by `OfflineStripeHttpClient`, deliberately — so the success path cannot be
 * exercised here and is not what goes wrong. What goes wrong is the sweep reading the
 * wrong rows, running unbounded on a schedule, or writing a marker that hides a creator
 * nobody can reach.
 */
class BankCapabilitySweepTest extends TestCase
{
    use RefreshDatabase;

    private function connected(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'account_id' => 'acct_'.uniqid(),
            'country' => 'GB',
            'bank_capability_checked_at' => null,
        ], $attributes));
    }

    public function test_the_scheduled_pass_reads_only_accounts_nobody_has_asked_about(): void
    {
        $fresh = $this->connected(['username' => 'neverasked']);
        $done = $this->connected(['username' => 'alreadyasked', 'bank_capability_checked_at' => now()->subDay()]);

        $this->artisan('stripe:request-bank-capabilities --unchecked-only --dry-run')
            ->expectsOutputToContain('neverasked')
            ->doesntExpectOutputToContain('alreadyasked')
            ->assertSuccessful();
    }

    public function test_a_hand_run_still_examines_everybody(): void
    {
        /*
         * ⚠️ The marker is for the SCHEDULE. Somebody running this by hand wants the real
         * state, not the backlog — if the marker applied there too, the one command that
         * answers "who can take a bank payment" would answer "nobody, they are all done".
         */
        $this->connected(['username' => 'alreadyasked', 'bank_capability_checked_at' => now()->subDay()]);

        $this->artisan('stripe:request-bank-capabilities --dry-run')
            ->expectsOutputToContain('alreadyasked')
            ->assertSuccessful();
    }

    public function test_max_bounds_the_run(): void
    {
        // The first real run has the whole backlog in front of it and a CLI timeout.
        foreach (range(1, 3) as $i) {
            $this->connected(['username' => 'creator'.$i]);
        }

        $this->artisan('stripe:request-bank-capabilities --unchecked-only --max=1 --dry-run')
            ->expectsOutputToContain('Checking 1 connected account')
            ->assertSuccessful();
    }

    public function test_an_unreachable_account_is_never_marked_checked(): void
    {
        /*
         * 🚨 THE ONE ROW THAT MUST COME BACK NEXT RUN. Stripe is offline in `testing`, so
         * every retrieve fails here — which is exactly the production case of a revoked
         * or deleted connected account (measured 12 Sep 2026: `birkin` and `jamesu`).
         * Such a creator cannot be paid out either, so a marker written over the failure
         * would hide them for good.
         */
        $creator = $this->connected(['username' => 'unreachable']);

        $this->artisan('stripe:request-bank-capabilities --unchecked-only')->assertSuccessful();

        $this->assertNull(
            $creator->fresh()->bank_capability_checked_at,
            'An account the platform could not retrieve was marked as checked.'
        );
    }

    public function test_a_dry_run_writes_no_marker(): void
    {
        $creator = $this->connected(['username' => 'dryrun']);

        $this->artisan('stripe:request-bank-capabilities --dry-run')->assertSuccessful();

        $this->assertNull($creator->fresh()->bank_capability_checked_at);
    }

    public function test_the_marker_never_re_dates_the_creator(): void
    {
        /*
         * 🚨 `users.updated_at` KEYS THE PUBLIC PROFILE CACHE AND ORDERS THE ADMIN
         * CREATOR-REVIEW QUEUE. A nightly bookkeeping write through `save()` would expire
         * every connected creator's cache and reshuffle a reviewer's list, every night.
         * A SOURCE SCAN, because the success path needs a live Stripe account — and what
         * has to hold is structural, not incidental to today's data.
         */
        $source = file_get_contents(base_path('app/Console/Commands/RequestBankCapabilities.php'));
        $source = preg_replace('#/\*.*?\*/#s', '', $source);
        $source = preg_replace('#//.*#', '', $source);

        $this->assertStringContainsString(
            "DB::table('users')",
            $source,
            'The marker must be written through the query builder.'
        );
        $this->assertStringNotContainsString(
            '->save()',
            $source,
            'save() stamps updated_at — the profile cache key and the review queue order.'
        );
    }

    public function test_the_schedule_never_runs_an_unbounded_pass(): void
    {
        // Without --unchecked-only this is one Stripe round trip per connected creator,
        // every day, for an answer that almost never changes.
        $kernel = file_get_contents(base_path('app/Console/Kernel.php'));
        $kernel = preg_replace('#/\*.*?\*/#s', '', $kernel);

        $this->assertMatchesRegularExpression(
            '/command\(\s*[\'"]stripe:request-bank-capabilities[^\'"]*--unchecked-only/',
            $kernel,
            'The scheduled bank-capability pass must carry --unchecked-only.'
        );
    }
}
