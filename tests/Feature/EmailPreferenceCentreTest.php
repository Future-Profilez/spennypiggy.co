<?php

namespace Tests\Feature;

use App\Console\Commands\SendBirthdayReminders;
use App\Console\Commands\SendBirthdaysThisWeek;
use App\EmailService;
use App\Http\Controllers\EmailPreferenceController;
use App\Mail\BirthdayReminder;
use App\Mail\BirthdaysThisWeek;
use App\Mail\CommandFailed;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

/**
 * Email Preferences & Contact Management Centre (Developer Master Plan, 19 Aug
 * 2026, §E).
 *
 * Three things are asserted here and none of them may regress:
 *  1. birthday email has its own switch, and it is an ADDITIONAL gate;
 *  2. somebody who cannot sign in can still manage every preference;
 *  3. security / legal / transactional mail has no switch anywhere.
 */
class EmailPreferenceCentreTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ⚠️ The two preference-centre routes live in `routes/web.php`, which this
     * change was not permitted to edit — the exact lines are reported alongside
     * it. They are registered here so the controller is genuinely exercised;
     * delete this method the moment the real lines land, NOT the tests.
     */
    protected function setUp(): void
    {
        parent::setUp();

        /*
         * 🚨 THIS ASSERTS THE ROUTES EXIST; IT NO LONGER CREATES THEM.
         *
         * While the real lines were still pending, this registered them at
         * runtime so the tests could be written first. They landed in
         * `routes/web.php` on 20 Aug 2026, and the scaffolding was replaced
         * rather than left in place: a self-registering `setUp` would go on
         * quietly healing the suite if someone ever deleted the route, and a
         * missing route here does not mean a failing test — it means every
         * preference link in every e-mail silently loses its destination
         * (`generateManageToken()` returns null rather than throwing, by
         * design).
         *
         * So the absence has to be loud, and this is where it is made loud.
         */
        $this->assertTrue(
            Route::has('email.preferences.manage'),
            'Route [email.preferences.manage] is missing. Every preference link in '
            .'every e-mail footer is silently dropped without it — see '
            .'EmailPreferenceController::generateManageToken().'
        );

        $this->assertTrue(
            Route::has('email.preferences.manage.update'),
            'Route [email.preferences.manage.update] is missing, so the preference '
            .'centre renders but cannot save.'
        );
    }

    // ---------------------------------------------------------------- birthday

    public function test_birthday_is_its_own_category_and_defaults_to_opted_in(): void
    {
        $this->assertContains('birthday_emails_enabled', EmailPreferenceController::CATEGORIES);

        // refresh() because column defaults are applied by the database.
        $user = User::factory()->create()->refresh();

        $this->assertTrue((bool) $user->birthday_emails_enabled);
        $this->assertTrue(EmailPreferenceController::preferencesFor($user)['birthday_emails_enabled']);
    }

    public function test_a_row_predating_the_birthday_column_is_treated_as_opted_in(): void
    {
        Mail::fake();

        // Null in memory is exactly what a just-created (or pre-migration) row
        // looks like. A strict check would read it as opted OUT and silently
        // stop the mail.
        $user = User::factory()->create();
        $user->birthday_emails_enabled = null;

        $this->assertTrue(EmailPreferenceController::preferencesFor($user)['birthday_emails_enabled']);

        EmailService::sendCategoryEmail($user, new CommandFailed('S', 'B'), 'birthday_emails_enabled');
        Mail::assertSentCount(1);
    }

    public function test_turning_off_birthday_email_leaves_marketing_and_creator_updates_on(): void
    {
        $user = User::factory()->create()->refresh();

        $this->get(EmailPreferenceController::generateUnsubscribeToken($user, 'birthday_emails_enabled'))
            ->assertRedirect();

        $user->refresh();

        $this->assertFalse((bool) $user->birthday_emails_enabled);
        $this->assertTrue((bool) $user->marketing_emails_enabled, 'A birthday opt-out must not stop every promotion.');
        $this->assertTrue((bool) $user->creator_updates_enabled, 'A birthday opt-out must not stop every creator update.');

        $this->assertDatabaseHas('email_preference_logs', [
            'user_id' => $user->id,
            'source' => 'unsubscribe_link:birthday_emails_enabled',
        ]);
    }

    public function test_the_birthday_reminder_needs_both_its_own_switch_and_creator_updates(): void
    {
        Mail::fake();

        $categories = SendBirthdayReminders::CATEGORY;

        $this->assertSame(['birthday_emails_enabled', 'creator_updates_enabled'], $categories);

        $both = User::factory()->create()->refresh();
        EmailService::sendCategoryEmail($both, new BirthdayReminder($both->id, 0, []), $categories);
        Mail::assertSentCount(1);

        // The new switch off — no birthday mail.
        $noBirthday = User::factory()->create(['birthday_emails_enabled' => false])->refresh();
        EmailService::sendCategoryEmail($noBirthday, new BirthdayReminder($noBirthday->id, 0, []), $categories);
        Mail::assertSentCount(1);

        // 🚨 The parent switch off — an existing opt-out is NOT overturned by
        // the arrival of a new, defaulted-on column.
        $noCreator = User::factory()->create(['creator_updates_enabled' => false])->refresh();
        EmailService::sendCategoryEmail($noCreator, new BirthdayReminder($noCreator->id, 0, []), $categories);
        Mail::assertSentCount(1);
    }

    public function test_the_weekly_campaign_needs_both_marketing_and_the_birthday_switch(): void
    {
        Mail::fake();

        $extra = SendBirthdaysThisWeek::CATEGORY;

        $this->assertSame('birthday_emails_enabled', $extra);

        $both = User::factory()->create()->refresh();
        EmailService::sendMarketingEmail($both, new BirthdaysThisWeek($both->id, [], '1 Sep – 7 Sep'), $extra);
        Mail::assertSentCount(1);

        $noBirthday = User::factory()->create(['birthday_emails_enabled' => false])->refresh();
        EmailService::sendMarketingEmail($noBirthday, new BirthdaysThisWeek($noBirthday->id, [], '1 Sep – 7 Sep'), $extra);
        Mail::assertSentCount(1);

        $noMarketing = User::factory()->create(['marketing_emails_enabled' => false])->refresh();
        EmailService::sendMarketingEmail($noMarketing, new BirthdaysThisWeek($noMarketing->id, [], '1 Sep – 7 Sep'), $extra);
        Mail::assertSentCount(1);
    }

    public function test_marketing_mail_still_sends_when_the_column_is_null(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $user->marketing_emails_enabled = null;

        EmailService::sendMarketingEmail($user, new CommandFailed('S', 'B'));

        Mail::assertSentCount(1);
    }

    public function test_the_birthday_emails_carry_a_working_birthday_opt_out(): void
    {
        $user = User::factory()->create()->refresh();

        // A `BirthdayDiscoveryService::card()`-shaped array — the view reads
        // these keys directly.
        $card = [
            'id' => 99,
            'name' => 'A Creator',
            'username' => 'acreator',
            'avatar_url' => 'https://example.test/a.jpg',
            'cover_url' => null,
            'line' => 'Makes things',
            'birthday_label' => '12 March',
            'birthday_day' => 12,
            'birthday_month' => 3,
        ];

        $reminder = (new BirthdayReminder($user->id, 0, $card))->render();
        $weekly = (new BirthdaysThisWeek($user->id, [$card], '1 Sep – 7 Sep'))->render();

        foreach ([$reminder, $weekly] as $html) {
            $this->assertStringContainsString('category=birthday_emails_enabled', html_entity_decode($html));
            $this->assertStringContainsString('Turn off birthday emails', $html);
            $this->assertStringContainsString('Choose what you hear from us', $html);
        }
    }

    // ----------------------------------------- the person who cannot sign in

    public function test_a_suspended_creator_cannot_reach_the_authenticated_page(): void
    {
        // This is the blocker the brief names. `/email-preferences` is behind
        // `auth`, and `CheckSuspendedUser` (web group) logs a suspended account
        // out on every request — so it can never get there.
        $user = User::factory()->create(['suspended_account' => 1]);

        $this->actingAs($user)
            ->get(route('email.preferences'))
            ->assertRedirect(route('login'));
    }

    public function test_a_suspended_creator_can_open_and_save_the_signed_centre(): void
    {
        $user = User::factory()->create([
            'suspended_account' => 1,
            'marketing_emails_enabled' => true,
        ])->refresh();

        $url = EmailPreferenceController::generateManageToken($user);
        $this->assertNotNull($url, 'The preference centre route must be registered.');

        $this->get($url)
            ->assertOk()
            ->assertHeader('Referrer-Policy', 'no-referrer');

        $post = URL::temporarySignedRoute(
            'email.preferences.manage.update',
            now()->addDay(),
            ['user' => $user->id]
        );

        $this->post($post, [
            'marketing_emails_enabled' => false,
            'birthday_emails_enabled' => false,
        ])->assertRedirect();

        $user->refresh();

        $this->assertFalse((bool) $user->marketing_emails_enabled);
        $this->assertNotNull($user->marketing_unsubscribed_at);
        $this->assertFalse((bool) $user->birthday_emails_enabled);
        // Untouched fields are untouched — every rule is `sometimes`.
        $this->assertTrue((bool) $user->product_updates_enabled);

        $this->assertDatabaseHas('email_preference_logs', [
            'user_id' => $user->id,
            'source' => 'preference_centre_link',
        ]);
    }

    public function test_the_signed_centre_refuses_an_unsigned_request(): void
    {
        $user = User::factory()->create()->refresh();

        $this->get(route('email.preferences.manage', ['user' => $user->id]))
            ->assertRedirect('/');

        $this->post(route('email.preferences.manage.update', ['user' => $user->id]), [
            'marketing_emails_enabled' => false,
        ])->assertRedirect('/');

        $this->assertTrue((bool) $user->fresh()->marketing_emails_enabled);
    }

    public function test_an_emailed_preference_link_outlives_the_old_24_hour_window(): void
    {
        // The old TTL meant an email opened two days later had a dead
        // unsubscribe link — and for an account that cannot sign in that was
        // the end of the road.
        $this->assertSame(30, EmailPreferenceController::LINK_TTL_DAYS);

        $user = User::factory()->create()->refresh();
        $url = EmailPreferenceController::generateUnsubscribeToken($user, 'birthday_emails_enabled');

        $this->travel(7)->days();

        $this->get($url)->assertRedirect();

        $this->assertFalse((bool) $user->fresh()->birthday_emails_enabled);
    }

    public function test_the_signed_centre_never_exposes_the_user_model(): void
    {
        $user = User::factory()->create(['email' => 'naveen@example.com'])->refresh();

        $response = $this->get(EmailPreferenceController::generateManageToken($user));

        $props = $response->viewData('page')['props'];

        $this->assertArrayNotHasKey('user', $props);
        $this->assertSame('na****@example.com', $props['account']['email']);
        $this->assertTrue($props['signed']);
    }

    // ------------------------------------------------- the unswitchable rule

    public function test_no_preference_column_exists_for_transactional_mail(): void
    {
        // 🚨 The catalogue is what the page renders. If a security, legal or
        // transactional switch ever appears, it appears here first.
        $keys = array_column(EmailPreferenceController::catalogue(), 'key');

        foreach ($keys as $key) {
            $this->assertTrue(
                $key === 'marketing_emails_enabled' || in_array($key, EmailPreferenceController::CATEGORIES, true),
                "{$key} is rendered as a switch but is not a known preference column."
            );
        }

        foreach (['receipt', 'transactional', 'security', 'legal', 'password', 'payout', 'verification', 'dispute', 'refund'] as $banned) {
            foreach (array_merge($keys, EmailPreferenceController::CATEGORIES) as $key) {
                $this->assertStringNotContainsString($banned, $key, "No switch may exist for {$banned} mail.");
            }
        }
    }

    public function test_turning_everything_off_does_not_stop_a_transactional_email(): void
    {
        Mail::fake();

        $user = User::factory()->create()->refresh();

        $payload = ['marketing_emails_enabled' => false];
        foreach (EmailPreferenceController::CATEGORIES as $column) {
            $payload[$column] = false;
        }

        $this->actingAs($user)->post(route('email.preferences.update'), $payload);

        $user->refresh();

        $this->assertFalse((bool) $user->marketing_emails_enabled);
        foreach (EmailPreferenceController::CATEGORIES as $column) {
            $this->assertFalse((bool) $user->{$column}, "{$column} should be off");
        }

        // 🚨 Transactional mail goes through Mail::to() and consults nothing.
        Mail::to($user->email)->send(new CommandFailed('Your receipt', 'Body'));

        Mail::assertSentCount(1);
    }

    public function test_the_centre_cannot_write_a_column_outside_the_catalogue(): void
    {
        $user = User::factory()->create()->refresh();

        $this->actingAs($user)->post(route('email.preferences.update'), [
            'marketing_emails_enabled' => true,
            'suspended_account' => 1,
            'role' => 2,
            'is_founder' => 1,
        ]);

        $user->refresh();

        $this->assertSame(0, (int) $user->suspended_account);
        $this->assertNotSame('2', (string) $user->role);
    }
}
