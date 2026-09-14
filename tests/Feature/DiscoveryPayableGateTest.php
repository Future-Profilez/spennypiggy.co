<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\DiscoveryService;
use App\Support\DiscoveryEligibility;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * 🚨 A DISCOVERY CARD IS A PROMISE THAT THE UNLOCK BUTTON WORKS.
 *
 * The gate lives in one place (`DiscoveryEligibility::payable`) and is applied
 * at twenty call sites in `DiscoveryService`. Nothing errors when one is
 * missed — the surface advertises a creator nobody can buy from, and the card
 * renders perfectly — so the source scan below is the only thing that can see
 * a new query written without it.
 */
class DiscoveryPayableGateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function creator(array $overrides = []): User
    {
        static $n = 0;
        $n++;

        return User::factory()->create(array_merge([
            'name' => 'Creator '.$n,
            'username' => 'creator'.$n,
            'email' => 'creator'.$n.'@example.test',
            'role' => 1,
            'suspended_account' => 0,
            'profile_status_lock' => 2,
            'avatar' => 'uuid-'.$n,
            'avatar_approved' => 1,
            'account_id' => 'acct_'.$n,
            'stripe_details_submitted' => 1,
            'charges_enabled' => 1,
            'charges_checked_at' => now(),
        ], $overrides));
    }

    private function passes(User $user): bool
    {
        return DiscoveryEligibility::payable(User::query()->whereKey($user->id))->exists();
    }

    public function test_a_connected_creator_passes(): void
    {
        $this->assertTrue($this->passes($this->creator()));
    }

    public function test_a_creator_with_no_connected_account_is_refused(): void
    {
        $this->assertFalse($this->passes($this->creator(['account_id' => null])));
    }

    /**
     * ⚠️ The prefix is the point. `users.account_id` has been found holding a
     * Stripe CUSTOMER id, and a bare whereNotNull would pass that row.
     */
    public function test_a_customer_id_in_the_account_column_is_refused(): void
    {
        $this->assertFalse($this->passes($this->creator(['account_id' => 'cus_livecustomer'])));
    }

    public function test_an_unfinished_onboarding_is_refused(): void
    {
        $this->assertFalse($this->passes($this->creator(['stripe_details_submitted' => 0])));
    }

    public function test_a_creator_stripe_reports_as_charges_disabled_is_refused(): void
    {
        $this->assertFalse($this->passes($this->creator([
            'charges_enabled' => 0,
            'charges_checked_at' => now(),
        ])));
    }

    /**
     * 🚨 THE LOAD-BEARING CASE. `charges_enabled` defaults to 0 and was written
     * by nothing for years, so an unstamped 0 means "nobody asked", not "Stripe
     * says no". Reading it as a refusal hides healthy creators on the strength
     * of a column nobody filled in.
     */
    public function test_a_creator_stripe_has_never_been_asked_about_still_passes(): void
    {
        $this->assertTrue($this->passes($this->creator([
            'charges_enabled' => 0,
            'charges_checked_at' => null,
        ])));
    }

    public function test_the_shared_eligibility_scope_carries_the_gate(): void
    {
        $unconnected = $this->creator(['account_id' => null]);
        $connected = $this->creator();

        $ids = DiscoveryEligibility::scope(User::query())->pluck('id')->all();

        $this->assertContains($connected->id, $ids);
        $this->assertNotContains($unconnected->id, $ids);
    }

    public function test_the_creator_rails_exclude_an_unconnected_creator(): void
    {
        $unconnected = $this->creator(['account_id' => null, 'created_at' => now()]);
        $connected = $this->creator(['created_at' => now()]);

        $usernames = collect(app(DiscoveryService::class)->getNewVerifiedCreators(50))
            ->pluck('username')
            ->all();

        $this->assertContains($connected->username, $usernames);
        $this->assertNotContains($unconnected->username, $usernames);
    }

    /**
     * 🚨 THE GUARD THAT CATCHES THE NEXT ONE.
     *
     * The fault this closes was twelve hand-written copies of
     * `suspended_account = 0 AND profile_status_lock = 2` with no payability
     * clause. A behavioural test of one rail passes while the other nineteen
     * stay open, which is exactly how it survived — so the assertion is that
     * every creator gate in the file carries the shared rule.
     */
    public function test_every_creator_gate_in_the_service_applies_the_payable_rule(): void
    {
        $source = file_get_contents(app_path('Services/DiscoveryService.php'));

        // Comments quote the clause while explaining it; a raw scan would read
        // its own prose as a call site.
        $code = preg_replace('#/\*.*?\*/#s', '', $source);
        $code = preg_replace('#//[^\n]*#', '', (string) $code);

        $gates = substr_count((string) $code, "profile_status_lock', 2");
        $payable = substr_count((string) $code, 'DiscoveryEligibility::payable');

        $this->assertGreaterThan(0, $gates, 'The scan found no creator gate at all — the pattern has changed.');
        $this->assertSame(
            $gates,
            $payable,
            'A creator gate in DiscoveryService does not apply DiscoveryEligibility::payable(). '
            .'Every query that picks a creator, or a listing by its creator, must carry it — '
            .'without it that surface advertises someone no supporter can buy from, and nothing errors.'
        );
    }
}
