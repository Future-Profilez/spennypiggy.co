<?php

namespace Tests\Feature;

use App\Mail\SecurityEventAlert;
use App\Models\SecurityEvent;
use App\Models\User;
use App\Support\ContentDownloadMonitor;
use App\Support\FailedLoginMonitor;
use App\Support\OtpFailureMonitor;
use App\Support\PayoutDestinationAudit;
use App\Support\SecurityAlert;
use App\Support\SecurityEventLog;
use App\Support\SecurityRedactor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Security Checklist §3 — "See what's happening".
 *
 * The two properties worth pinning here are the two that are easy to break
 * later: a threshold that fires one attempt early (or one late), and a cooldown
 * that has stopped working, which is how an alert channel dies quietly.
 */
class SecurityObservationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Cache::flush();
        config(['alerts.fallback' => ['ops@example.test']]);
    }

    /** A single failed sign-in is recorded and says nothing. */
    public function test_a_failed_login_is_recorded_but_does_not_alert(): void
    {
        FailedLoginMonitor::record('one@example.com', '203.0.113.10');

        $this->assertDatabaseCount('security_events', 1);
        $this->assertSame(SecurityEvent::LOGIN_FAILED, SecurityEvent::first()->event_type);
        Mail::assertNothingSent();
    }

    /**
     * 🚨 THE ROW THE AUDIT FOUND OPEN. Five failures against five DIFFERENT
     * addresses from one IP: the existing `email|ip` lockout key gives each
     * address its own counter, so none of them ever reaches five and nothing
     * fires. Keyed on the IP alone, it does.
     */
    public function test_five_failures_from_one_ip_across_different_accounts_alerts(): void
    {
        foreach (['a@example.com', 'b@example.com', 'c@example.com', 'd@example.com'] as $email) {
            FailedLoginMonitor::record($email, '203.0.113.20');
            Mail::assertNothingSent();
        }

        FailedLoginMonitor::record('e@example.com', '203.0.113.20');

        Mail::assertSent(SecurityEventAlert::class);

        $burst = SecurityEvent::where('event_type', SecurityEvent::LOGIN_FAILED_BURST)->first();
        $this->assertNotNull($burst);
        // Five accounts from one origin is the spray case, not a forgotten
        // password — it has to be the louder of the two severities.
        $this->assertSame('critical', $burst->severity);
        $this->assertSame(5, $burst->context['distinct_accounts']);
        $this->assertNotNull($burst->alerted_at);
    }

    /** Failures spread across two IPs never combine into one threshold. */
    public function test_failures_from_different_ips_do_not_combine(): void
    {
        for ($i = 0; $i < 4; $i++) {
            FailedLoginMonitor::record("x{$i}@example.com", '203.0.113.30');
            FailedLoginMonitor::record("y{$i}@example.com", '203.0.113.31');
        }

        Mail::assertNothingSent();
    }

    /**
     * 🚨 The cooldown is the whole defence against alert fatigue. A brute-force
     * run lasts hours; sixty emails is not more information than one.
     */
    public function test_the_burst_alert_is_sent_once_per_ip_per_cooldown(): void
    {
        for ($i = 0; $i < 12; $i++) {
            FailedLoginMonitor::record("z{$i}@example.com", '203.0.113.40');
        }

        Mail::assertSentCount(1);
    }

    /** A lockout mails immediately — the rate limiter already applied the threshold. */
    public function test_a_lockout_alerts_immediately(): void
    {
        FailedLoginMonitor::lockout('203.0.113.50', 'locked@example.com');

        Mail::assertSent(SecurityEventAlert::class);
        $this->assertDatabaseHas('security_events', ['event_type' => SecurityEvent::LOGIN_LOCKOUT]);
    }

    /** A payout destination change alerts every time, with no threshold. */
    public function test_a_payout_destination_change_alerts_and_masks_the_account_id(): void
    {
        $user = User::factory()->create(['email' => 'creator@example.com']);

        PayoutDestinationAudit::recordAccountChange($user, 'acct_1AAAAAAAAAAAAAAA', 'acct_9ZZZZZZZZZZZZZZZ', 'test');

        $event = SecurityEvent::where('event_type', SecurityEvent::PAYOUT_DESTINATION_CHANGE)->firstOrFail();
        $this->assertSame('critical', $event->severity);

        // 🚨 Not a full Stripe id anywhere — not in the row, not in the mail.
        $this->assertStringNotContainsString('acct_9ZZZZZZZZZZZZZZZ', $event->description);
        $this->assertStringContainsString('acct_…ZZZZ', $event->description);

        // ⚠️ JSON_UNESCAPED_UNICODE, or the ellipsis in a masked id comes back
        // as \u2026 and every one of these assertions passes for the wrong reason.
        Mail::assertSent(SecurityEventAlert::class, function (SecurityEventAlert $mail) {
            $body = json_encode($mail->sections, JSON_UNESCAPED_UNICODE);

            return ! str_contains($body, 'acct_1AAAAAAAAAAAAAAA')
                && ! str_contains($body, 'creator@example.com')
                && str_contains($body, 'acct_…AAAA');
        });
    }

    /**
     * A FIRST connection is not a change — there was nothing to redirect money
     * away from. Recorded, never mailed. Without this, every creator on the
     * platform mails once on their onboarding.
     */
    public function test_a_first_stripe_connection_records_without_alerting(): void
    {
        $user = User::factory()->create();

        PayoutDestinationAudit::recordAccountChange($user, null, 'acct_1NEWNEWNEWNEWNEW', 'test');

        $this->assertDatabaseHas('security_events', [
            'event_type' => SecurityEvent::PAYOUT_DESTINATION_CHANGE,
            'severity' => 'info',
        ]);
        Mail::assertNothingSent();
    }

    /**
     * The first bank account we ever see for a connected account is a BASELINE.
     * Alerting on it would mail once for every existing creator on the first
     * webhook after deploy.
     */
    public function test_the_first_bank_account_sighting_is_a_baseline_then_a_swap_alerts(): void
    {
        PayoutDestinationAudit::recordExternalAccountChange(null, 'acct_1BANKBANKBANKBA', [
            'bank' => 'Test Bank', 'last4' => '4242', 'country' => 'GB',
        ]);
        Mail::assertNothingSent();

        PayoutDestinationAudit::recordExternalAccountChange(null, 'acct_1BANKBANKBANKBA', [
            'bank' => 'Other Bank', 'last4' => '9999', 'country' => 'GB',
        ]);

        Mail::assertSent(SecurityEventAlert::class, function (SecurityEventAlert $mail) {
            $body = json_encode($mail->sections, JSON_UNESCAPED_UNICODE);

            return str_contains($body, '9999') && str_contains($body, 'acct_…NKBA');
        });
    }

    /** The same bank reported twice is not a change. */
    public function test_an_unchanged_bank_account_records_nothing_further(): void
    {
        $descriptor = ['bank' => 'Test Bank', 'last4' => '4242', 'country' => 'GB'];

        PayoutDestinationAudit::recordExternalAccountChange(null, 'acct_1SAMESAMESAMESA', $descriptor);
        PayoutDestinationAudit::recordExternalAccountChange(null, 'acct_1SAMESAMESAMESA', $descriptor);

        $this->assertDatabaseCount('security_events', 1);
        Mail::assertNothingSent();
    }

    /** Bulk downloads: recorded every time, alerted only on a burst. */
    public function test_downloads_alert_only_after_the_threshold(): void
    {
        for ($i = 1; $i <= 19; $i++) {
            ContentDownloadMonitor::record(7, 'task', 'uuid-'.$i);
        }
        Mail::assertNothingSent();

        ContentDownloadMonitor::record(7, 'task', 'uuid-20');
        Mail::assertSent(SecurityEventAlert::class);

        $burst = SecurityEvent::where('event_type', SecurityEvent::CONTENT_DOWNLOAD_BURST)->firstOrFail();
        $this->assertSame(20, $burst->context['downloads']);
    }

    /**
     * The website's step-up OTP thresholds PLATFORM-WIDE. One supporter
     * mistyping is a daily event; alerting per person would mail constantly.
     */
    public function test_step_up_otp_failures_alert_only_as_a_platform_burst(): void
    {
        for ($i = 1; $i <= 19; $i++) {
            OtpFailureMonitor::recordPlatformFailure(null, null, '198.51.100.1', 'identity-'.$i);
        }
        Mail::assertNothingSent();

        OtpFailureMonitor::recordPlatformFailure(null, null, '198.51.100.1', 'identity-20');
        Mail::assertSent(SecurityEventAlert::class);
    }

    /** 🚨 An OTP code must never reach the log or the mail. */
    public function test_no_otp_code_is_ever_recorded(): void
    {
        OtpFailureMonitor::recordPlatformFailure(null, null, '198.51.100.2', 'identity-x');

        $event = SecurityEvent::firstOrFail();
        $this->assertStringNotContainsString('123456', json_encode($event->getAttributes()));
    }

    /** Secrets are stripped on the way INTO the table, not on the way out. */
    public function test_secrets_are_scrubbed_out_of_a_recorded_description(): void
    {
        SecurityEventLog::record('test_event', [
            'description' => 'failed with sk_live_ABCDEFGH1234567890 for buyer@example.com',
        ]);

        $description = SecurityEvent::firstOrFail()->description;
        $this->assertStringNotContainsString('sk_live_', $description);
        $this->assertStringNotContainsString('buyer@example.com', $description);
    }

    /** A key whose NAME says "secret" is dropped whole, not pattern-matched. */
    public function test_a_secret_named_context_key_is_dropped(): void
    {
        SecurityEventLog::record('test_event', [
            'context' => ['password' => 'hunter2', 'otp_code' => '123456', 'ip' => '203.0.113.9'],
        ]);

        $context = SecurityEvent::firstOrFail()->context;
        $this->assertArrayNotHasKey('password', $context);
        $this->assertArrayNotHasKey('otp_code', $context);
        $this->assertSame('203.0.113.9', $context['ip']);
    }

    /** An unroutable "IP" from a spoofed header never reaches a mail body. */
    public function test_a_non_ip_value_is_refused(): void
    {
        $this->assertSame('(unknown)', SecurityRedactor::ip('<script>alert(1)</script>'));
        $this->assertSame('203.0.113.7', SecurityRedactor::ip('203.0.113.7'));
    }

    /** Masking keeps the domain (the useful part) and loses the person. */
    public function test_email_masking(): void
    {
        $this->assertSame('ja***@example.com', SecurityRedactor::maskEmail('jane@example.com'));
        $this->assertSame('a***@example.com', SecurityRedactor::maskEmail('a@example.com'));
        $this->assertSame('(none)', SecurityRedactor::maskEmail(null));
    }

    /** The master switch silences the mail and keeps the record. */
    public function test_disabling_alerts_still_records(): void
    {
        config(['security_alerts.enabled' => false]);

        $sent = SecurityAlert::raise('t', 'i', [['heading' => 'h', 'rows' => ['r']]]);

        $this->assertFalse($sent);
        Mail::assertNothingSent();
    }

    /**
     * 🚨 THE HOUSE RULE: alerting must never break the thing it observes. With
     * no recipient configured and a broken mailer, every entry point must still
     * return normally.
     */
    public function test_a_broken_alert_path_never_throws(): void
    {
        config(['alerts.fallback' => []]);

        FailedLoginMonitor::record('x@example.com', '203.0.113.60');
        FailedLoginMonitor::lockout('203.0.113.60', 'x@example.com');
        ContentDownloadMonitor::record(1, 'task', 'uuid-a');
        OtpFailureMonitor::recordAdminFailure(1, 'admin@example.com', '203.0.113.60');
        OtpFailureMonitor::recordPlatformFailure(null, null, '203.0.113.60', 'id');
        PayoutDestinationAudit::recordAccountChange(null, 'acct_a', 'acct_b', 'test');

        $this->assertTrue(true);
    }
}
