<?php

namespace Tests\Feature;

use App\Models\SecurityEvent;
use App\Models\User;
use App\Models\UserFlag;
use App\Support\BlockedPaymentAlert;
use App\Support\SecurityEventLog;
use App\Support\UserFlagger;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Admin flags — the raise side (this app owns it).
 *
 * 🚨 The point of nearly every test here is a NEGATIVE: the cases where a flag
 * must NOT be raised. A system that flags too much is one nobody reads, and the
 * failure is silent — the list keeps filling up and admins stop opening it.
 */
class UserFlagsTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    public function test_a_flag_is_raised_and_snapshots_the_role(): void
    {
        $creator = $this->creator();

        $flag = UserFlagger::raise($creator, 'manual', 'Looks off.', [], 'manual');

        $this->assertNotNull($flag);
        $this->assertSame('open', $flag->status);
        $this->assertSame(1, $flag->user_role, 'The role must be snapshotted — the user row can be deleted.');
        $this->assertSame(1, $flag->occurrences);
    }

    public function test_a_repeat_absorbs_into_the_open_flag_instead_of_opening_a_second(): void
    {
        $creator = $this->creator();

        UserFlagger::raise($creator, 'payout_schedule_reverted', 'First.');
        UserFlagger::raise($creator, 'payout_schedule_reverted', 'Second.');
        UserFlagger::raise($creator, 'payout_schedule_reverted', 'Third.');

        $this->assertSame(1, UserFlag::where('user_id', $creator->id)->count());

        $flag = UserFlag::where('user_id', $creator->id)->first();
        $this->assertSame(3, $flag->occurrences);
        $this->assertSame('Third.', $flag->reason, 'The newest occurrence is the one an admin needs.');
    }

    /**
     * 🚨 The one that matters. If a repeat could reopen a resolved flag, an
     * admin's "looked at this" would silently swallow the next recurrence —
     * exactly the case where a recurrence means most.
     */
    public function test_a_resolved_flag_is_never_reopened_a_recurrence_opens_a_new_row(): void
    {
        $creator = $this->creator();

        $first = UserFlagger::raise($creator, 'payout_destination_change', 'Bank changed.');
        $first->forceFill(['status' => UserFlag::STATUS_REVIEWED, 'resolved_at' => now()])->save();

        UserFlagger::raise($creator, 'payout_destination_change', 'Bank changed again.');

        $this->assertSame(2, UserFlag::where('user_id', $creator->id)->count());
        $this->assertSame(1, UserFlag::where('user_id', $creator->id)->where('status', 'open')->count());
    }

    public function test_the_severity_comes_from_config_when_the_caller_does_not_say(): void
    {
        $flag = UserFlagger::raise($this->creator(), 'payout_destination_change', 'Bank changed.');

        $this->assertSame('critical', $flag->severity);
    }

    /**
     * 🚨 `info` rows are the noise half of every pair — every paid download,
     * every wrong password, and a creator's FIRST bank connection. Flagging
     * them would raise a flag for every creator who ever onboards.
     */
    public function test_an_info_security_event_never_becomes_a_flag(): void
    {
        $user = $this->creator();

        SecurityEventLog::record('payout_destination_change', [
            'severity' => 'info',
            'user_id' => $user->id,
            'description' => 'First bank connection.',
        ]);

        $this->assertSame(0, UserFlag::count());
    }

    public function test_a_critical_security_event_becomes_a_flag(): void
    {
        $user = $this->creator();

        SecurityEventLog::record('payout_destination_change', [
            'severity' => 'critical',
            'user_id' => $user->id,
            'description' => 'Bank account changed.',
        ]);

        $flag = UserFlag::where('user_id', $user->id)->first();

        $this->assertNotNull($flag, 'A critical payout-destination change must reach the back office.');
        $this->assertSame('payout_destination_change', $flag->flag_type);
        $this->assertSame('security_event', $flag->source);
    }

    /**
     * ⚠️ An event type that is not in the map stays a log line. The security log
     * is the record of everything; the flag list is the subset a person acts on,
     * and merging the two makes the second useless.
     */
    public function test_an_unmapped_security_event_type_is_not_flagged(): void
    {
        $user = $this->creator();

        SecurityEventLog::record(SecurityEvent::REFUND_VOLUME, [
            'severity' => 'critical',
            'user_id' => $user->id,
            'description' => 'Platform refund rate.',
        ]);

        $this->assertSame(0, UserFlag::count());
    }

    public function test_a_security_event_with_no_user_is_not_flagged(): void
    {
        SecurityEventLog::record('login_failed_burst', [
            'severity' => 'warning',
            'ip_address' => '203.0.113.5',
            'description' => 'Five failures.',
        ]);

        $this->assertSame(0, UserFlag::count());
    }

    /**
     * 🚨 The switch takes every raise path down at once and DELETES nothing —
     * switching back on resumes rather than restarts.
     */
    public function test_the_master_switch_stops_every_raise(): void
    {
        config(['user_flags.enabled' => false]);

        $this->assertNull(UserFlagger::raise($this->creator(), 'manual', 'Nope.'));
        $this->assertSame(0, UserFlag::count());
    }

    /**
     * 🚨 Every entry point sits inside a payout sweep, a sign-in or a webhook.
     * An observation must never be able to break the thing it observes.
     */
    public function test_a_raise_with_no_user_returns_null_rather_than_throwing(): void
    {
        $this->assertNull(UserFlagger::raise(null, 'manual', 'Nobody.'));
        $this->assertSame(0, UserFlag::count());
    }

    /**
     * 🚨 The reason is rendered to admins who are NOT behind `can:view-pii`, so
     * it is scrubbed on the way IN — never on the way out, where one template
     * change puts a raw value on a screen.
     */
    public function test_the_reason_and_context_are_redacted_on_the_way_in(): void
    {
        $flag = UserFlagger::raise(
            $this->creator(),
            'manual',
            'Contact was jane.doe@example.com about it.',
            ['api_token' => 'sk_live_should_never_be_stored', 'account_id' => 'acct_1234567890ABCD'],
        );

        $this->assertStringNotContainsString('jane.doe@example.com', (string) $flag->reason);
        $this->assertArrayNotHasKey('api_token', (array) $flag->context, 'A key whose NAME says secret is dropped whole.');
    }

    /**
     * 🚨 THE INCIDENT THIS WHOLE FEATURE CAME FROM. When Stripe was found paying
     * a creator AUTOMATICALLY, `ensureManualPayoutSchedule` put the account back
     * on manual and returned `true` with nothing written anywhere — the command
     * printed `Updated: 1` to stdout, which on Vapor no person reads. So the
     * platform could correct this daily and nobody would know it had happened,
     * to whom, or how often.
     *
     * ⚠️ A SOURCE SCAN, not a behaviour test. Reaching that branch needs a live
     * Stripe account reporting a non-manual schedule; what has to be pinned is
     * that the branch still TELLS somebody, and that is visible in the source.
     */
    public function test_the_payout_schedule_revert_still_records_a_flag_and_an_error(): void
    {
        $source = file_get_contents(app_path('StripeControl.php'));

        $start = strpos($source, 'function ensureManualPayoutSchedule');
        $this->assertNotFalse($start, 'ensureManualPayoutSchedule has been renamed — update this guard.');

        // The method body up to the next method declaration.
        $body = substr($source, $start, 6000);

        $this->assertStringContainsString(
            "flagType: 'payout_schedule_reverted'",
            $body,
            'A schedule put back on manual must raise a flag — a silent correction is how this went unnoticed for months.'
        );
        $this->assertStringContainsString(
            'Log::error(',
            $body,
            'It must also reach Sentry: the flag is for the back office, the log line is for whoever reads alerts.'
        );
    }

    /**
     * ⚠️ Not on the FIRST refusal. One blocked purchase is usually a
     * subscription somebody renews the same afternoon; flagging it would put
     * half the creator base on the list.
     */
    public function test_repeated_blocked_purchases_flag_the_creator_only_at_the_threshold(): void
    {
        $creator = $this->creator();
        $threshold = (int) config('user_flags.thresholds.blocked_payment_repeat_count', 5);

        for ($i = 1; $i <= $threshold; $i++) {
            BlockedPaymentAlert::record($creator, 10.0, 'GBP', 'no_subscription');

            $flag = UserFlag::where('user_id', $creator->id)
                ->where('flag_type', 'blocked_payment_repeat')
                ->first();

            if ($i < $threshold) {
                $this->assertNull($flag, "Refusal {$i} of {$threshold} must not flag yet.");
            } else {
                $this->assertNotNull($flag, 'The threshold refusal must flag the creator.');
                // 🚨 The creator is the SELLER here. Reading this table the other
                // way round is what once sent an investigation at a supporter who
                // had done nothing.
                $this->assertStringContainsString('buy from this creator', (string) $flag->reason);
            }
        }
    }
}
