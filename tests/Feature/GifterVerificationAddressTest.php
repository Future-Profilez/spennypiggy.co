<?php

namespace Tests\Feature;

use App\Helpers;
use App\Http\Middleware\CheckStripeIdentityVerification;
use App\Http\Middleware\UserEmailVerify;
use App\Models\GifterAddress;
use App\Models\GifterCardVerification;
use App\Models\User;
use App\Support\GifterVerificationCharge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The gifter's own billing address, collected once at the £500 verification gate.
 *
 * The property that matters: the £1 verification charge must not be creatable
 * without it. Stripe hands back the address the gifter types into Checkout, and an
 * admin compares the two — with nothing on our side every field reads `unknown`,
 * the mismatch count is always 0, and the review before letting somebody spend past
 * £500 decides nothing.
 */
class GifterVerificationAddressTest extends TestCase
{
    use RefreshDatabase;

    private function gifter(array $attributes = []): User
    {
        $user = User::factory()->create(array_merge([
            'role' => 0,
            'is_500_limit_exceeded' => 1,
            'profile_status_lock' => 0,
            'suspended_account' => 0,
        ], $attributes));

        // Signup writes the row with country only.
        GifterAddress::create([
            'user_id' => $user->id,
            'country' => 'GB',
        ]);

        return $user->fresh();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'street_address' => '12 High Street',
            'city' => 'London',
            'state' => '',
            'postal_code' => 'SW1A 1AA',
            'country' => 'GB',
        ], $overrides);
    }

    public function test_a_country_only_row_is_not_a_complete_address(): void
    {
        $user = $this->gifter();

        $this->assertFalse($user->gifterAddress->isComplete());
    }

    public function test_the_gifter_saves_their_address(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload())
            ->assertOk()
            ->assertJson(['status' => true]);

        $address = $user->fresh()->gifterAddress;

        $this->assertTrue($address->isComplete());
        $this->assertSame('12 High Street', $address->street_address);
        $this->assertSame('London', $address->city);
        $this->assertSame('SW1A 1AA', $address->postal_code);
    }

    /**
     * 🚨 The signup form once wrote "United Kingdom" into this column, so the admin
     * comparison put "India" against Stripe's "IN" and flagged every gifter in the
     * queue — a red chip on all of them being the same as no signal at all.
     */
    public function test_the_country_is_stored_as_an_iso_code_not_a_label(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload([
                'country' => 'United Kingdom',
            ]))
            ->assertStatus(422);

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload([
                'country' => 'gb',
            ]))
            ->assertOk();

        $this->assertSame('GB', $user->fresh()->gifterAddress->country);
    }

    /**
     * The signup form it replaces had `min:20` on the street and refused a genuine
     * short address — "12 High St" is eleven characters.
     */
    public function test_a_short_street_address_is_accepted(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload([
                'street_address' => '12 High St',
            ]))
            ->assertOk();

        $this->assertSame('12 High St', $user->fresh()->gifterAddress->street_address);
    }

    /**
     * Several countries have no postcode and many have no state. This is the gate
     * standing between a gifter and their ability to spend, so a field they cannot
     * fill must never trap them behind it.
     */
    public function test_state_and_postcode_are_optional(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload([
                'state' => '',
                'postal_code' => '',
                'country' => 'HK',
            ]))
            ->assertOk();

        $address = $user->fresh()->gifterAddress;

        $this->assertTrue($address->isComplete());
        $this->assertNull($address->state);
        $this->assertNull($address->postal_code);
    }

    public function test_the_street_and_city_are_required(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload(['street_address' => '']))
            ->assertStatus(422);

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload(['city' => '']))
            ->assertStatus(422);

        $this->assertFalse($user->fresh()->gifterAddress->isComplete());
    }

    /**
     * A gifter whose role changed, or any legacy account, may have no row at all.
     * Failing at the gate with "address not found" would give them nothing to do.
     */
    public function test_an_address_is_created_when_no_row_exists(): void
    {
        $user = User::factory()->create([
            'role' => 0,
            'is_500_limit_exceeded' => 1,
            'profile_status_lock' => 0,
        ]);

        $this->assertNull($user->gifterAddress);

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload())
            ->assertOk();

        $this->assertTrue($user->fresh()->gifterAddress->isComplete());
    }

    /**
     * 🚨 `stripe_address` is the SECOND, independent record — what the gifter types
     * into Stripe Checkout moments later. Both being entered separately is the entire
     * value of the comparison; letting this endpoint touch it would make the check a
     * copy of itself.
     */
    public function test_saving_an_address_never_touches_the_stripe_copy(): void
    {
        $user = $this->gifter();

        $stripeCopy = json_encode(['line1' => '99 Other Road', 'city' => 'Leeds']);
        $user->gifterAddress->forceFill(['stripe_address' => $stripeCopy])->save();

        $this->actingAs($user)
            ->postJson(route('gifter.verification.address'), $this->payload())
            ->assertOk();

        $this->assertSame($stripeCopy, $user->fresh()->gifterAddress->stripe_address);
    }

    /**
     * 🚨 THE test. The button is one `axios.get` away for anyone who opens a console,
     * so the refusal has to live on the server: no address, no Stripe session, no
     * charge. Checked before the Stripe client is even constructed, so this runs
     * without touching Stripe at all.
     */
    public function test_the_verification_charge_is_refused_without_an_address(): void
    {
        $user = $this->gifter();

        $this->actingAs($user)
            ->withoutMiddleware([
                CheckStripeIdentityVerification::class,
                UserEmailVerify::class,
            ])
            ->getJson(route('gifter.card.verification'), ['X-Requested-With' => 'XMLHttpRequest'])
            ->assertStatus(422)
            ->assertJson([
                'status' => false,
                'needs_address' => true,
            ]);
    }

    /**
     * 🚨 An undecryptable row must not be able to take a page down.
     *
     * `toFormArray()` feeds the SHARED Inertia payload, so a throw there is every page
     * broken for that gifter with no way to reach the form and fix it; `isComplete()`
     * is the server gate, where a throw is a 500 rather than a refusal. Unreadable
     * counts as absent — the gate refuses and the gifter simply retypes.
     */
    public function test_an_undecryptable_address_is_treated_as_absent(): void
    {
        $user = $this->gifter();

        // ⚠️ Raw DB write, not `forceFill` — the setter encrypts whatever it is given,
        // so a "corrupt" value assigned through the model comes back out perfectly
        // readable and the test proves nothing.
        DB::table('gifter_addresses')
            ->where('user_id', $user->id)
            ->update([
                'street_address' => 'not-an-encrypted-payload',
                'city' => 'not-an-encrypted-payload',
            ]);

        $address = $user->fresh()->gifterAddress;

        $this->assertFalse($address->isComplete());
        $this->assertNull($address->toFormArray()['city']);
        $this->assertFalse($address->toFormArray()['is_complete']);
    }

    /**
     * 🚨 A uuid is a PUBLIC identifier on this platform — it travels in profile
     * payloads and item URLs. `cardVerificationSuccess` guards on ownership;
     * `cardVerificationFailed` did not, so any signed-in account could flip another
     * gifter's latest verification to `failed` by visiting their uuid, and a gifter
     * who had just paid would be shown "Payment Failed or Canceled".
     */
    public function test_one_gifter_cannot_fail_anothers_verification(): void
    {
        $mine = $this->gifter();
        $victim = $this->gifter();

        GifterCardVerification::create([
            'user_id' => $victim->id,
            'status' => 'success',
            'amount' => 1,
            'currency' => 'GBP',
            'payment_method' => 'Card',
        ]);

        $this->actingAs($mine)
            ->withoutMiddleware([
                CheckStripeIdentityVerification::class,
                UserEmailVerify::class,
            ])
            ->get(route('card.verification.failed', $victim->uuid))
            ->assertForbidden();

        $this->assertSame(
            'success',
            GifterCardVerification::where('user_id', $victim->id)->latest()->first()->status
        );
    }

    /**
     * 🚨 The verification is a FLAT charge and must never be run through
     * `calculateStripeDirectChargeFlow`.
     *
     * That formula prices a supporter buying from a creator, and against a £1
     * verification it returned £2.95 — reporting `net_to_creator: 1` for a charge with
     * no creator, because the platform was billing itself a 17% platform fee, a 2%
     * compliance fee and a flat £1 admin fee and passing it to the gifter. The screen
     * meanwhile promised "£1", so the card was charged three times the quoted figure
     * on the one payment meant to establish trust.
     */
    public function test_the_verification_is_a_flat_charge(): void
    {
        $quote = GifterVerificationCharge::quote('GBP');

        $this->assertSame(GifterVerificationCharge::AMOUNT_GBP, $quote['amount']);
        $this->assertSame(100, $quote['minor']);
        $this->assertStringContainsString('1.00', $quote['formatted']);

        // The marked-up figure must not reappear by any route.
        $grossedUp = Helpers::calculateStripeDirectChargeFlow(
            GifterVerificationCharge::AMOUNT_GBP,
            'GBP'
        )['total_supporter_pays'];

        $this->assertGreaterThan($quote['amount'], $grossedUp);
        $this->assertNotSame((int) round($grossedUp * 100), $quote['minor']);
    }

    /**
     * ⚠️ Stripe rejects a zero-amount charge outright, so a missing conversion rate
     * would stop the gate working for that currency with nothing on screen saying why.
     */
    public function test_an_unusable_conversion_falls_back_to_gbp(): void
    {
        $quote = GifterVerificationCharge::quote('ZZZ');

        $this->assertGreaterThan(0, $quote['amount']);
        $this->assertGreaterThan(0, $quote['minor']);
    }

    /**
     * ⚠️ The charge is taken in the visitor's own currency, so a hardcoded pound sign
     * is wrong for everybody outside the UK — and a bare number on a charge screen is
     * worse than a wrong symbol.
     */
    public function test_the_quote_always_carries_a_currency_marker(): void
    {
        foreach (['GBP', 'USD', 'EUR'] as $currency) {
            $quote = GifterVerificationCharge::quote($currency);

            $this->assertSame($currency, $quote['currency']);
            $this->assertNotSame('', trim(preg_replace('/[\d.,\s]/', '', $quote['formatted'])));
        }
    }

    public function test_a_creator_cannot_use_this_endpoint(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        $this->actingAs($creator)
            ->postJson(route('gifter.verification.address'), $this->payload())
            ->assertStatus(403);
    }

    public function test_a_guest_cannot_use_this_endpoint(): void
    {
        $this->postJson(route('gifter.verification.address'), $this->payload())
            ->assertStatus(401);
    }

    /**
     * One gifter must never be able to write over another's address — the endpoint
     * takes the account from the session and accepts no user id at all.
     */
    public function test_the_address_is_written_to_the_signed_in_account_only(): void
    {
        $mine = $this->gifter();
        $theirs = $this->gifter();

        $this->actingAs($mine)
            ->postJson(route('gifter.verification.address'), $this->payload([
                'user_id' => $theirs->id,
                'city' => 'Bristol',
            ]))
            ->assertOk();

        $this->assertSame('Bristol', $mine->fresh()->gifterAddress->city);
        $this->assertFalse($theirs->fresh()->gifterAddress->isComplete());
    }
}
