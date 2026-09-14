<?php

namespace Tests\Feature;

use App\Mail\PayoutConnectionLost;
use App\Models\User;
use App\StripeControl;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\PermissionException;
use Tests\TestCase;

/**
 * A creator Stripe will not let us reach cannot be paid, and only they can fix
 * it — so somebody has to be told.
 *
 * 🚨 The detection has always existed (`payout:enforce-manual` logs it once a
 * day). What did not was any record a person reads: the log line names an
 * `acct_…` and no person, it is on no screen, and the creator never hears.
 * Measured on production 12 Sep 2026: two creators unreachable since at least
 * 26 August, earning and unable to be paid.
 */
class PayoutConnectionCheckTest extends TestCase
{
    use RefreshDatabase;

    private function creator(string $account = 'acct_TEST123'): User
    {
        return User::factory()->create([
            'role' => 1,
            'account_id' => $account,
            'suspended_account' => 0,
        ]);
    }

    /**
     * 🚨 ONE CLASSIFIER, AND IT IS STRIPE'S OWN.
     *
     * The ten-minute sweep and this weekly check must agree on what "permanent"
     * means. A second copy is how one of them starts telling a creator to
     * reconnect because our request timed out — sending them to undo something
     * that was never broken.
     */
    public function test_only_a_permanent_refusal_counts(): void
    {
        $revoked = new PermissionException(
            "The provided key 'sk_live_xxx' does not have access to account 'acct_1QHzEN2RsYS7cGKq' "
            .'(or that account does not exist). Application access may have been revoked.'
        );

        $this->assertTrue(StripeControl::accountIsUnreachable($revoked));

        $this->assertFalse(
            StripeControl::accountIsUnreachable(new ApiConnectionException('Could not connect to Stripe.')),
            'A network blip is a failure of this run, not a fact about the account.'
        );
    }

    /**
     * ⚠️ The flag type has to exist in config or `UserFlagger` renders it
     * unlabelled — and the config is mirrored by hand into the admin app, which
     * is the panel that actually shows it.
     */
    public function test_the_flag_type_is_declared_and_mirrored(): void
    {
        $type = config('user_flags.types.payout_connection_lost');

        $this->assertIsArray($type, 'The website must declare the flag type.');
        $this->assertSame('critical', $type['severity']);
        $this->assertNotEmpty($type['label']);

        $mirror = base_path('../admin.spennypiggy.co/config/user_flags.php');

        if (! is_file($mirror)) {
            $this->markTestSkipped('The admin app is not checked out beside this one.');
        }

        $this->assertStringContainsString(
            "'payout_connection_lost'",
            (string) file_get_contents($mirror),
            'A flag the admin app does not know renders unlabelled on the one screen that shows it.'
        );
    }

    /**
     * 🚨 THE DRY RUN WRITES NOTHING AND SENDS NOTHING. This command mails
     * creators about their own money; a report mode that quietly sent would be
     * the worst possible way to find that out.
     */
    public function test_a_dry_run_neither_flags_nor_sends(): void
    {
        Mail::fake();

        $this->creator();

        $this->artisan('payouts:check-connections --dry-run')->assertSuccessful();

        if (Schema::hasTable('user_flags')) {
            $this->assertSame(0, DB::table('user_flags')->count());
        }

        Mail::assertNothingQueued();
        Mail::assertNothingSent();
    }

    /**
     * ⚠️ A creator with no connected account is not a lost connection — they
     * never had one. Including them would flag most of the platform.
     */
    public function test_a_creator_with_no_connected_account_is_not_checked(): void
    {
        User::factory()->create(['role' => 1, 'account_id' => null]);
        User::factory()->create(['role' => 1, 'account_id' => 'cus_NOTANACCOUNT']);

        $this->artisan('payouts:check-connections --dry-run')
            ->expectsOutputToContain('Checked 0.')
            ->assertSuccessful();
    }

    /** The notice is transactional — no opt-out may silence it. */
    public function test_the_notice_is_not_marketing(): void
    {
        $source = file_get_contents(app_path('Console/Commands/CheckPayoutConnections.php'));

        /*
         * ⚠️ Whitespace-insensitive on purpose. Asserting the literal two-line
         * form made this test a hostage to `pint` — a reformat would have turned
         * a compliance guard red for a reason that has nothing to do with
         * compliance, and the cheapest way out of that is to delete the guard.
         */
        $this->assertMatchesRegularExpression(
            '/ALL_CHANNELS,\s*false,/',
            $source,
            'It tells a creator the platform cannot pay them money they earned; that is never marketing.'
        );

        $this->assertStringNotContainsString(
            'unsubscribe',
            (string) file_get_contents(resource_path('views/email/payout-connection-lost.blade.php'))
        );
    }

    /** The mailable renders, and its CTA is never an empty href. */
    public function test_the_mail_renders_with_a_real_link(): void
    {
        $html = (new PayoutConnectionLost('Jo'))->render();

        $this->assertStringContainsString('Reconnect Stripe', $html);
        $this->assertStringNotContainsString('href=""', $html);
    }
}
