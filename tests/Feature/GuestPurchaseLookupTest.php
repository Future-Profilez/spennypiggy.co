<?php

namespace Tests\Feature;

use App\Mail\GuestPurchaseLink;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\User;
use App\Services\GuestPurchaseLookup;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Guest purchase lookup.
 *
 * Two properties carry this feature: the form must never confirm whether an address is
 * on the platform, and paid content must never be handed over on money that has not
 * cleared.
 */
class GuestPurchaseLookupTest extends TestCase
{
    use RefreshDatabase;

    private const GUEST = 'guest@example.com';

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'account_id' => 'acct_test']);
    }

    private function pot(User $creator, array $attributes = []): PiggyPot
    {
        return PiggyPot::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Behind the scenes bundle',
            'description' => 'A new photo set',
            'target_amount' => 100,
            'currency' => 'gbp',
            'status' => 'active',
            'reward_title' => 'The bundle',
            'reward_type' => 'message',
            'reward_body' => 'SECRET-PAID-CONTENT',
        ], $attributes));
    }

    private function contribution(PiggyPot $pot, array $attributes = []): PiggyPotContribution
    {
        return PiggyPotContribution::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'piggy_pot_id' => $pot->id,
            'creator_id' => $pot->user_id,
            'guest_email' => self::GUEST,
            'amount' => 20,
            'total_paid' => 24,
            'currency' => 'gbp',
            'status' => 'paid',
        ], $attributes));
    }

    private function signedUrl(string $email): string
    {
        return URL::temporarySignedRoute('guest-purchases.show', now()->addDays(7), ['email' => $email]);
    }

    public function test_a_settled_purchase_hands_over_its_content(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        $rows = app(GuestPurchaseLookup::class)->for(self::GUEST);

        $this->assertCount(1, $rows);
        $this->assertTrue($rows[0]['settled']);
        $this->assertSame('SECRET-PAID-CONTENT', $rows[0]['reward']['text']);
    }

    public function test_content_is_withheld_until_the_money_clears(): void
    {
        $pot = $this->pot($this->creator());
        // ⚠️ `pending`, not `processing`. Migration 2026_07_13_000003 widened this
        // column for bank payments but is MySQL-guarded, so on the sqlite test database
        // the original tight enum (pending/paid/refunded/disputed) still applies and
        // `processing` is a CHECK violation. Both mean "authorised, not yet cleared".
        $this->contribution($pot, ['status' => 'pending']);

        $rows = app(GuestPurchaseLookup::class)->for(self::GUEST);

        $this->assertFalse($rows[0]['settled']);
        $this->assertTrue($rows[0]['awaiting_settlement']);

        // 🚨 Never hand over paid content on money that has not settled. The headline
        // still renders — it describes the purchase and is not the purchase.
        $this->assertNull($rows[0]['reward']['text']);
        $this->assertSame('The bundle', $rows[0]['reward']['title']);
    }

    public function test_a_failed_payment_is_not_awaiting_settlement(): void
    {
        $pot = $this->pot($this->creator());
        // Terminal, and not a state anyone is waiting on. (`failed` is the live
        // equivalent; it is outside the sqlite enum — see the note above.)
        $this->contribution($pot, ['status' => 'refunded']);

        $rows = app(GuestPurchaseLookup::class)->for(self::GUEST);

        // "Your bank is still confirming" and "this did not go through" are different
        // findings with different fixes, and only one is the supporter's problem.
        $this->assertFalse($rows[0]['settled']);
        $this->assertFalse($rows[0]['awaiting_settlement']);
        $this->assertNull($rows[0]['reward']['text']);
    }

    public function test_one_guests_purchases_never_reach_another(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        $this->assertSame([], app(GuestPurchaseLookup::class)->for('someone-else@example.com'));
    }

    public function test_the_address_is_matched_whatever_the_capitals(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot, ['guest_email' => 'Guest@Example.COM']);

        // The address typed at checkout and the address typed into the form are the
        // same address whatever the capitals.
        $this->assertCount(1, app(GuestPurchaseLookup::class)->for(self::GUEST));
    }

    public function test_the_response_is_identical_whether_or_not_the_email_has_purchases(): void
    {
        Mail::fake();

        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        $withPurchases = $this->from(route('guest-purchases.form'))
            ->post(route('guest-purchases.send'), ['email' => self::GUEST]);

        $withNone = $this->from(route('guest-purchases.form'))
            ->post(route('guest-purchases.send'), ['email' => 'nobody@example.com']);

        // 🚨 The whole point. A different answer here turns this form into a way to ask
        // "is this person on Spenny Piggy?" of any address a stranger cares to type.
        $this->assertSame(
            session()->get('success'),
            $withNone->getSession()->get('success')
        );
        $this->assertSame($withPurchases->getStatusCode(), $withNone->getStatusCode());

        // The difference is only in what is SENT, never in what is said.
        Mail::assertQueued(GuestPurchaseLink::class, 1);
    }

    public function test_no_link_is_sent_to_an_address_with_nothing(): void
    {
        Mail::fake();

        $this->post(route('guest-purchases.send'), ['email' => 'nobody@example.com']);

        Mail::assertNothingQueued();
    }

    public function test_an_unsigned_link_shows_nothing(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        // The URL IS the credential here — without a valid signature it must buy
        // nothing at all, however well-formed the email in it.
        $this->get(route('guest-purchases.show', ['email' => self::GUEST]))
            ->assertRedirect(route('guest-purchases.form'));
    }

    public function test_a_tampered_signed_link_shows_nothing(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        $url = $this->signedUrl('someone-else@example.com');
        $tampered = str_replace('someone-else%40example.com', 'guest%40example.com', $url);

        $this->get($tampered)->assertRedirect(route('guest-purchases.form'));
    }

    public function test_an_expired_link_is_refused_with_a_way_forward(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        $url = URL::temporarySignedRoute('guest-purchases.show', now()->subMinute(), ['email' => self::GUEST]);

        $this->get($url)
            ->assertRedirect(route('guest-purchases.form'))
            ->assertSessionHas('error');
    }

    public function test_a_valid_link_renders_the_purchases(): void
    {
        $pot = $this->pot($this->creator());
        $this->contribution($pot);

        $this->get($this->signedUrl(self::GUEST))
            ->assertOk()
            // The URL is the credential, so it must never be indexed and must not leak
            // through a referrer.
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive')
            ->assertHeader('Referrer-Policy', 'no-referrer');
    }
}
