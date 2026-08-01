<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\GoogleController;
use App\Models\AllowedDomain;
use App\Models\GifterAddress;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\GoogleProvider;
use Tests\TestCase;

/**
 * The Google path posts the same registration form as the password path and must clear the same
 * gates. These tests exist because a second sign-up route is the classic place for a fraud check
 * to be quietly skipped — nothing errors when one is missed, a door just opens.
 */
class GoogleSignInTest extends TestCase
{
    use RefreshDatabase;

    private function googleSession(array $overrides = []): array
    {
        return [GoogleController::SESSION_KEY => array_merge([
            'email' => 'verified@gmail.com',
            'name' => 'Verified Person',
            'avatar' => null,
            'google_id' => '1234567890',
            'verified_at' => now()->toIso8601String(),
        ], $overrides)];
    }

    private function form(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Verified Person',
            'username' => 'verifiedperson',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
        ], $overrides);
    }

    public function test_a_google_signup_creates_an_account_without_a_password(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form());

        $user = User::where('email', 'verified@gmail.com')->first();

        $this->assertNotNull($user, 'The Google signup did not create an account.');
        $this->assertNotEmpty($user->password, 'The password column must never be left empty.');
        $this->assertNotNull(
            $user->email_verified_at,
            'Google has already verified the address, so the account should not be sent to the verification screen.'
        );
    }

    /**
     * 🚨 The one that matters most. The session copy of the email was written only after Google
     * reported it verified; the posted copy is whatever the browser sent. If the request won,
     * anyone holding a Google session could claim somebody else's address AND have it marked
     * verified.
     */
    public function test_the_posted_email_cannot_override_the_verified_one(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form(['email' => 'victim@gmail.com']));

        $this->assertDatabaseHas('users', ['email' => 'verified@gmail.com']);
        $this->assertDatabaseMissing('users', ['email' => 'victim@gmail.com']);
    }

    /** A spent profile must not be able to mint a second verified account. */
    public function test_the_google_session_is_cleared_after_signup(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form());

        $this->assertNull(session(GoogleController::SESSION_KEY));
    }

    /**
     * The domain allowlist holds six providers, so enforcing it on the Google path would refuse
     * every Google Workspace address. Google has already proved the mailbox receives mail.
     */
    public function test_a_workspace_domain_is_accepted_on_the_google_path(): void
    {
        AllowedDomain::query()->delete();
        AllowedDomain::create(['name' => 'gmail.com']);

        $this->withSession($this->googleSession(['email' => 'priya@somecompany.com']))
            ->post('/register', $this->form(['username' => 'priyaworks']));

        $this->assertDatabaseHas('users', ['email' => 'priya@somecompany.com']);
    }

    /** …but the password path still enforces it. */
    public function test_the_domain_allowlist_still_applies_without_google(): void
    {
        AllowedDomain::query()->delete();
        AllowedDomain::create(['name' => 'gmail.com']);

        $this->post('/register', $this->form([
            'email' => 'priya@somecompany.com',
            'password' => 'Spenny!2026x',
            'password_confirmation' => 'Spenny!2026x',
            'username' => 'priyaworks',
        ]))->assertSessionHasErrors('email');

        $this->assertDatabaseMissing('users', ['email' => 'priya@somecompany.com']);
    }

    /**
     * `role` is mass-assigned into User::create() and the admin gate reads role === '2'. The
     * Google path must not become the way around that.
     */
    public function test_role_two_is_still_rejected_on_the_google_path(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form(['role' => 2]))
            ->assertSessionHasErrors('role');

        $this->assertDatabaseMissing('users', ['email' => 'verified@gmail.com']);
    }

    /** The creator receipts acknowledgement is a consent and cannot be assumed from a redirect. */
    public function test_a_creator_still_has_to_acknowledge_the_receipts_notice(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form(['creator_email_receipt_ack' => false]))
            ->assertSessionHasErrors('creator_email_receipt_ack');
    }

    /** A supporter's country is what sets their currency, and the server requires it. */
    public function test_a_supporter_still_has_to_supply_a_country(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form([
                'role' => 0,
                'creator_email_receipt_ack' => false,
            ]))
            ->assertSessionHasErrors('country');
    }

    public function test_a_google_supporter_with_a_country_is_created(): void
    {
        $this->withSession($this->googleSession())
            ->post('/register', $this->form([
                'role' => 0,
                'creator_email_receipt_ack' => false,
                'country' => 'United Kingdom',
                'country_code' => 'GB',
            ]));

        $user = User::where('email', 'verified@gmail.com')->first();

        $this->assertNotNull($user);
        $this->assertSame('GB', $user->country);
        $this->assertDatabaseHas('gifter_addresses', ['user_id' => $user->id]);

        // The address row carries country only; the rest arrives from Stripe at first purchase,
        // and reading those NULL encrypted columns must not throw.
        $address = GifterAddress::where('user_id', $user->id)->first();
        $this->assertSame('United Kingdom', $address->country);
        $this->assertNull($address->street_address);
    }

    /** A duplicate username is still a duplicate, however the person arrived. */
    public function test_a_taken_username_is_still_refused(): void
    {
        User::factory()->create(['username' => 'verifiedperson']);

        $this->withSession($this->googleSession())
            ->post('/register', $this->form())
            ->assertSessionHasErrors('username');
    }

    /** With no session, /register is the ordinary form and still demands a password. */
    public function test_without_a_google_session_a_password_is_still_required(): void
    {
        $this->post('/register', $this->form(['email' => 'someone@gmail.com']))
            ->assertSessionHasErrors('password');
    }

    public function test_the_register_page_exposes_the_google_profile_but_never_the_google_id(): void
    {
        $response = $this->withSession($this->googleSession())->get('/register');

        $response->assertInertia(fn ($page) => $page
            ->where('googleProfile.email', 'verified@gmail.com')
            ->where('googleProfile.name', 'Verified Person')
            ->missing('googleProfile.google_id')
        );
    }

    public function test_the_callback_is_unavailable_when_credentials_are_missing(): void
    {
        config(['services.google.client_id' => null, 'services.google.client_secret' => null]);

        $this->get('/auth/google')->assertRedirect(route('register'));
        $this->get('/auth/google/callback')->assertRedirect(route('login'));
    }

    public function test_redirect_stashes_context_and_redirects_to_google(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $responseMock = redirect()->away('https://accounts.google.com/o/oauth2/auth');

        $provider = \Mockery::mock(GoogleProvider::class);
        $provider->shouldReceive('redirect')->andReturn($responseMock);

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn($provider);

        $response = $this->get('/auth/google?ref=creatorscode&redirect=/dashboard');

        $response->assertRedirect('https://accounts.google.com/o/oauth2/auth');
        $this->assertEquals([
            'ref' => 'creatorscode',
            'redirect' => '/dashboard',
            'auth_origin' => 'login',
        ], session('google_signup_context'));
    }

    public function test_callback_with_new_verified_google_user_redirects_to_register_with_context(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $this->mockSocialiteGoogle([
            'email' => 'newuser@gmail.com',
            'name' => 'New User',
        ]);

        $response = $this->withSession([
            'google_signup_context' => [
                'ref' => 'creatorscode',
                'redirect' => '/dashboard',
            ],
        ])->get('/auth/google/callback');

        $response->assertRedirect(route('register', ['ref' => 'creatorscode']));

        $googleSession = session(GoogleController::SESSION_KEY);
        $this->assertNotNull($googleSession);
        $this->assertEquals('newuser@gmail.com', $googleSession['email']);
        $this->assertEquals('New User', $googleSession['name']);
        $this->assertEquals('/dashboard', session('url.intended'));
    }

    public function test_callback_with_existing_user_authenticates_and_redirects_to_intended(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $user = User::factory()->create([
            'email' => 'existing@gmail.com',
            'username' => 'existinguser',
        ]);

        $this->mockSocialiteGoogle([
            'email' => 'existing@gmail.com',
        ]);

        $response = $this->withSession([
            'google_signup_context' => [
                'redirect' => '/dashboard',
            ],
        ])->get('/auth/google/callback');

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_callback_on_socialite_failure_redirects_to_origin(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $this->mockSocialiteGoogle([], new \Exception('OAuth error'));

        $response = $this->withSession([
            'google_signup_context' => [
                'auth_origin' => 'register',
            ],
        ])->get('/auth/google/callback');

        $response->assertRedirect(route('register'));
        $response->assertSessionHas('error', 'We could not complete Google sign-in. Please try again.');
    }

    public function test_callback_refuses_unverified_email(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $this->mockSocialiteGoogle([
            'raw' => [
                'email_verified' => false,
            ],
        ]);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error');
    }

    public function test_callback_refuses_suspended_user(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        User::factory()->create([
            'email' => 'suspended@gmail.com',
            'suspended_account' => 1,
        ]);

        $this->mockSocialiteGoogle([
            'email' => 'suspended@gmail.com',
        ]);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error', 'Your account is suspended. Please contact support.');
    }

    public function test_callback_with_2fa_user_redirects_to_login_with_pending_email(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        User::factory()->create([
            'email' => 'twofa@gmail.com',
            'is_2fa' => 1,
        ]);

        $this->mockSocialiteGoogle([
            'email' => 'twofa@gmail.com',
        ]);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('login'));
        $this->assertEquals('twofa@gmail.com', session('google_2fa_pending_email'));
    }

    public function test_verify_2fa_authenticates_google_user_without_password(): void
    {
        $user = User::factory()->create([
            'email' => 'twofa@gmail.com',
            'is_2fa' => 1,
            'tfa_key' => 'secretkey',
        ]);

        $google2faMock = \Mockery::mock(\PragmaRX\Google2FALaravel\Google2FA::class);
        $google2faMock->shouldReceive('verifyKey')->with('secretkey', '123456')->andReturn(true);
        $this->app->instance(\PragmaRX\Google2FALaravel\Google2FA::class, $google2faMock);

        $response = $this->withSession(['google_2fa_pending_email' => 'twofa@gmail.com'])
            ->postJson(route('verify2FA'), [
                'email' => 'twofa@gmail.com',
                'otp' => '123456',
            ]);

        $response->assertJson(['status' => true]);
        $this->assertAuthenticatedAs($user);
        $this->assertNull(session('google_2fa_pending_email'));
    }

    public function test_callback_links_existing_user_by_verified_email(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $user = User::factory()->create([
            'email' => 'linkme@gmail.com',
            'google_id' => null,
        ]);

        $this->mockSocialiteGoogle([
            'email' => 'linkme@gmail.com',
            'id' => 'google-user-id-xyz',
        ]);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('user.show', $user->username));
        $this->assertAuthenticatedAs($user);
        $this->assertEquals('google-user-id-xyz', $user->fresh()->google_id);
    }

    public function test_callback_authenticates_by_google_id_even_if_email_changed(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $user = User::factory()->create([
            'email' => 'new-email@gmail.com',
            'google_id' => 'google-user-id-xyz',
        ]);

        $this->mockSocialiteGoogle([
            'email' => 'old-email@gmail.com',
            'id' => 'google-user-id-xyz',
        ]);

        $response = $this->get('/auth/google/callback');

        $response->assertRedirect(route('user.show', $user->username));
        $this->assertAuthenticatedAs($user);
    }

    public function test_cancel_clears_google_session(): void
    {
        $response = $this->withSession([
            GoogleController::SESSION_KEY => ['email' => 'brandnew@gmail.com'],
            'google_signup_utm' => ['utm_source' => 'google'],
        ])->post('/auth/google/cancel');

        $response->assertRedirect(route('register'));
        $this->assertNull(session(GoogleController::SESSION_KEY));
        $this->assertNull(session('google_signup_utm'));
    }

    private function mockSocialiteGoogle(array $userAttrs = [], ?\Throwable $exception = null): void
    {
        $provider = \Mockery::mock(GoogleProvider::class);

        if ($exception) {
            $provider->shouldReceive('user')->andThrow($exception);
        } else {
            $googleUser = \Mockery::mock(\Laravel\Socialite\Two\User::class);
            $googleUser->shouldReceive('getEmail')->andReturn($userAttrs['email'] ?? 'verified@gmail.com');
            $googleUser->shouldReceive('getName')->andReturn($userAttrs['name'] ?? 'Verified Person');
            $googleUser->shouldReceive('getAvatar')->andReturn($userAttrs['avatar'] ?? null);
            $googleUser->shouldReceive('getId')->andReturn($userAttrs['id'] ?? '1234567890');

            $googleUser->user = array_merge([
                'email_verified' => true,
            ], $userAttrs['raw'] ?? []);

            $provider->shouldReceive('user')->andReturn($googleUser);
        }

        Socialite::shouldReceive('driver')
            ->with('google')
            ->andReturn($provider);
    }

    /**
     * 🚨 `?redirect=` is attacker-controlled. Unvalidated it sent the person to another host
     * immediately after a genuine Google sign-in on the real domain — an open redirect on an
     * authentication callback, which carries the trust of the sign-in that just succeeded.
     *
     * @dataProvider hostileRedirects
     */
    public function test_a_hostile_redirect_target_is_ignored_for_an_existing_user(string $hostile): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $user = User::factory()->create([
            'email' => 'existing@gmail.com',
            'username' => 'existinguser',
            'suspended_account' => 0,
            'is_2fa' => 0,
        ]);

        $this->mockSocialiteGoogle(['email' => 'existing@gmail.com', 'name' => 'Existing User']);

        $response = $this->withSession([
            'google_signup_context' => ['redirect' => $hostile],
        ])->get('/auth/google/callback');

        $response->assertRedirect(route('user.show', $user->username));
        $this->assertStringNotContainsString('evil.example.com', $response->headers->get('Location'));
    }

    /** The same value must not survive into `url.intended` on the signup path either. */
    public function test_a_hostile_redirect_target_is_ignored_for_a_new_user(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $this->mockSocialiteGoogle(['email' => 'brandnew@gmail.com', 'name' => 'Brand New']);

        $this->withSession([
            'google_signup_context' => ['redirect' => 'https://evil.example.com/steal'],
        ])->get('/auth/google/callback');

        $this->assertNull(session('url.intended'));
    }

    /** A genuine same-site path still works — the guard must not break the feature it protects. */
    public function test_a_same_site_redirect_target_is_kept(): void
    {
        config(['services.google.client_id' => 'client_id', 'services.google.client_secret' => 'client_secret']);

        $this->mockSocialiteGoogle(['email' => 'brandnew@gmail.com', 'name' => 'Brand New']);

        $this->withSession([
            'google_signup_context' => ['redirect' => '/dashboard'],
        ])->get('/auth/google/callback');

        $this->assertSame('/dashboard', session('url.intended'));
    }

    public static function hostileRedirects(): array
    {
        return [
            'absolute https' => ['https://evil.example.com/fake-login'],
            'absolute http' => ['http://evil.example.com'],
            // Starts with "/" so a leading-slash test alone lets it through, but browsers read
            // "//host" as protocol-relative and leave the site.
            'protocol relative' => ['//evil.example.com'],
            // Some browsers normalise the backslash to a slash, making this "//evil.example.com".
            'backslash variant' => ['/\\evil.example.com'],
            'javascript scheme' => ['javascript:alert(1)'],
            'whitespace padded' => ['  https://evil.example.com  '],
        ];
    }
}
