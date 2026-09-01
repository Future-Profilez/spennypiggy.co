<?php

namespace Tests\Feature;

use App\Models\AllowedDomain;
use App\Models\BlockedDomain;
use App\Models\User;
use App\Support\EmailDomainPolicy as Policy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * 🚨 The approved-list gate is gone. It could not do the job it was written for
 * — it permitted `yopmail.com` while refusing Outlook, Hotmail, Proton and every
 * creator on their own business domain, and `gmail.com` was on it, so it stopped
 * no spammer who wanted in.
 *
 * ⚠️ Every test pre-seeds the mail-server verdict in the cache. `canReceiveMail`
 * does a real DNS lookup, and a suite whose result depends on the network (or on
 * whether a third party's domain is up today) is a suite that fails for reasons
 * that have nothing to do with this code.
 */
class EmailDomainPolicyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        AllowedDomain::query()->delete();
        BlockedDomain::query()->delete();
    }

    private function mailServer(string $domain, bool $exists): void
    {
        Cache::put('email_mx_ok:'.$domain, $exists, now()->addDay());
    }

    /** The blocklist works on a database that has never been seeded. */
    public function test_a_baseline_disposable_domain_is_refused_with_no_rows_at_all(): void
    {
        $this->assertSame(Policy::REASON_DISPOSABLE, Policy::reject('someone@yopmail.com'));
    }

    public function test_an_admin_added_domain_is_refused(): void
    {
        BlockedDomain::create(['name' => 'Burner.test']);
        $this->mailServer('burner.test', true);

        $this->assertSame(Policy::REASON_DISPOSABLE, Policy::reject('someone@burner.test'));
    }

    /**
     * 🚨 The override beats the blocklist by design — an admin vouching for a
     * partner domain must win over an automated list. That is also why
     * `allowed_domains` had to be pruned of disposable services on release:
     * carried across unchanged, `yopmail.com` sitting there would have become
     * an instruction to permit it.
     */
    public function test_an_override_beats_the_blocklist(): void
    {
        BlockedDomain::create(['name' => 'partner.test']);
        AllowedDomain::create(['name' => 'partner.test']);

        $this->assertNull(Policy::reject('someone@partner.test'));
    }

    public function test_an_override_beats_a_missing_mail_server(): void
    {
        AllowedDomain::create(['name' => 'partner.test']);
        $this->mailServer('partner.test', false);

        $this->assertNull(Policy::reject('someone@partner.test'));
    }

    public function test_a_domain_with_no_mail_server_is_refused(): void
    {
        $this->mailServer('gmial-typo.test', false);

        $this->assertSame(Policy::REASON_NO_MAIL_SERVER, Policy::reject('someone@gmial-typo.test'));
    }

    /** The whole point: a creator on their own brand domain gets in. */
    public function test_a_business_domain_with_a_mail_server_is_accepted(): void
    {
        $this->mailServer('janestudio.test', true);

        $this->assertNull(Policy::reject('jane@janestudio.test'));
    }

    public function test_a_malformed_address_is_refused(): void
    {
        $this->assertSame(Policy::REASON_MALFORMED, Policy::reject('not-an-address'));
        $this->assertSame(Policy::REASON_MALFORMED, Policy::reject(null));
    }

    /** Three cases, three answers — the old gate answered all of them "Invalid Email Id." */
    public function test_each_refusal_says_something_different(): void
    {
        $disposable = Policy::message(Policy::REASON_DISPOSABLE);
        $noServer = Policy::message(Policy::REASON_NO_MAIL_SERVER, 'gmial.test');
        $malformed = Policy::message(Policy::REASON_MALFORMED);

        $this->assertNotSame($disposable, $noServer);
        $this->assertNotSame($noServer, $malformed);
        $this->assertStringContainsString('gmial.test', $noServer);
    }

    public function test_gmail_dots_and_tags_normalise_to_one_mailbox(): void
    {
        $this->assertSame('jane@gmail.com', Policy::normalise('J.a.Ne+spam@googlemail.com'));
        $this->assertSame('jane@gmail.com', Policy::normalise('jane+1@gmail.com'));
        $this->assertSame('jane@gmail.com', Policy::normalise('j.ane@gmail.com'));
    }

    /**
     * ⚠️ Dot-stripping is Gmail-only. Elsewhere a dot is a literal character and
     * two addresses differing by one belong to two different people.
     */
    public function test_dots_are_significant_outside_gmail(): void
    {
        $this->assertSame('j.ane@outlook.test', Policy::normalise('J.ane@outlook.test'));
        $this->assertSame('jane@outlook.test', Policy::normalise('jane+tag@outlook.test'));
    }

    public function test_a_gmail_alias_of_an_existing_account_is_detected(): void
    {
        User::factory()->create(['email' => 'jane@gmail.com']);

        $this->assertTrue(Policy::aliasOfExistingAccount('j.a.ne+promo@gmail.com'));
        $this->assertTrue(Policy::aliasOfExistingAccount('jane@googlemail.com'));
    }

    public function test_a_different_person_is_not_reported_as_an_alias(): void
    {
        User::factory()->create(['email' => 'jane@gmail.com']);

        $this->assertFalse(Policy::aliasOfExistingAccount('janet@gmail.com'));
        $this->assertFalse(Policy::aliasOfExistingAccount('jane@yahoo.test'));
    }

    /** A creator editing their own address must not be flagged against themselves. */
    public function test_the_ignored_user_is_excluded(): void
    {
        $user = User::factory()->create(['email' => 'jane@gmail.com']);

        $this->assertFalse(Policy::aliasOfExistingAccount('j.ane@gmail.com', $user->id));
    }

    public function test_registration_refuses_a_disposable_address(): void
    {
        $this->post('/register', [
            'name' => 'Spam Bot',
            'username' => 'spambotone',
            'email' => 'throwaway@mailinator.com',
            'password' => 'Str0ng-Passw0rd!',
            'password_confirmation' => 'Str0ng-Passw0rd!',
            // Required for creators since 31 Aug 2026.
            'country' => 'GB',
            'country_code' => 'GB',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ])->assertSessionHasErrors('email');

        $this->assertNull(User::where('email', 'throwaway@mailinator.com')->first());
    }

    /**
     * 🚨 The regression that matters most. Outlook was DELETED from the approved
     * list, so every Outlook user was refused. Nothing about that address should
     * have been a problem.
     */
    public function test_registration_accepts_an_address_the_old_list_refused(): void
    {
        $this->mailServer('outlook.test', true);

        $this->post('/register', [
            'name' => 'Real Creator',
            'username' => 'realcreator',
            'email' => 'real@outlook.test',
            'password' => 'Str0ng-Passw0rd!',
            'password_confirmation' => 'Str0ng-Passw0rd!',
            // Required for creators since 31 Aug 2026.
            'country' => 'GB',
            'country_code' => 'GB',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ]);

        $this->assertNotNull(User::where('email', 'real@outlook.test')->first());
    }

    public function test_registration_refuses_a_gmail_alias_of_an_existing_account(): void
    {
        User::factory()->create(['email' => 'jane@gmail.com']);

        $this->post('/register', [
            'name' => 'Jane Again',
            'username' => 'janeagain',
            'email' => 'j.ane+2@gmail.com',
            'password' => 'Str0ng-Passw0rd!',
            'password_confirmation' => 'Str0ng-Passw0rd!',
            // Required for creators since 31 Aug 2026.
            'country' => 'GB',
            'country_code' => 'GB',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ])->assertSessionHasErrors('email');

        $this->assertNull(User::where('email', 'j.ane+2@gmail.com')->first());
    }

    /** The change-email endpoint must not be a way around the signup gate. */
    public function test_changing_an_email_refuses_a_disposable_address(): void
    {
        $user = User::factory()->create([
            'email' => 'creator@gmail.com',
            'email_verified_at' => null,
            'role' => 1,
        ]);

        $this->actingAs($user)
            ->post(route('verification.change-email'), ['email' => 'throwaway@yopmail.com'])
            ->assertSessionHasErrors('email');

        $this->assertSame('creator@gmail.com', $user->fresh()->email);
    }

    public function test_changing_an_email_accepts_a_business_domain(): void
    {
        $this->mailServer('janestudio.test', true);

        $user = User::factory()->create([
            'email' => 'creator@gmail.com',
            'email_verified_at' => null,
            'role' => 1,
        ]);

        $this->actingAs($user)
            ->post(route('verification.change-email'), ['email' => 'jane@janestudio.test'])
            ->assertSessionHasNoErrors();

        $this->assertSame('jane@janestudio.test', $user->fresh()->email);
    }

    /**
     * Rate limiting is the control that actually stops someone hammering the
     * endpoint — the domain list never could, and this route had no throttle at
     * all.
     */
    public function test_the_registration_endpoint_is_rate_limited(): void
    {
        $route = collect(Route::getRoutes()->getRoutes())
            ->first(fn ($r) => $r->uri() === 'register' && in_array('POST', $r->methods(), true));

        $this->assertNotNull($route, 'POST /register no longer exists.');

        $this->assertTrue(
            collect($route->gatherMiddleware())->contains(fn ($m) => str_starts_with((string) $m, 'throttle:')),
            'POST /register must carry a throttle.'
        );
    }
}
