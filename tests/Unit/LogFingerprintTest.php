<?php

namespace Tests\Unit;

use App\Support\LogFingerprint;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * The redaction assertions are the important half of this file. These exact shapes were being
 * printed verbatim onto an admin page that gets pasted into tickets and chat.
 */
class LogFingerprintTest extends TestCase
{
    #[Test]
    public function it_redacts_stripe_secret_keys(): void
    {
        // Assembled at runtime so the literal never appears in the repository — GitHub's push
        // protection rejects a contiguous sk_test_ string even in a fixture.
        $key = 'sk_'.'test_'.'51ABCdefGHIjklMNOpqrsTUV';

        $out = LogFingerprint::redact("local.ERROR: The provided key '{$key}' does not have access.");

        $this->assertStringNotContainsString($key, $out);
        $this->assertStringContainsString('[stripe-secret-key]', $out);
    }

    #[Test]
    public function it_redacts_a_partially_masked_key(): void
    {
        // Stripe's own error message masks the middle but leaves both ends — still a secret.
        $out = LogFingerprint::redact("key 'sk_test_*********************iinahX' denied");

        $this->assertStringNotContainsString('iinahX', $out);
    }

    #[Test]
    public function it_redacts_stripe_object_ids_and_emails(): void
    {
        $out = LogFingerprint::redact(
            'account acct_1OFCFCQHkKp3rKJU customer cus_Sa28dH5G6qQTJi buyer someone@example.com'
        );

        $this->assertStringNotContainsString('acct_1OFCFCQHkKp3rKJU', $out);
        $this->assertStringNotContainsString('cus_Sa28dH5G6qQTJi', $out);
        $this->assertStringNotContainsString('someone@example.com', $out);
        $this->assertStringContainsString('[email]', $out);
    }

    #[Test]
    public function it_redacts_sentry_project_keys_and_absolute_paths(): void
    {
        $out = LogFingerprint::redact(
            'sentry-public_key=14cda094324469c174a7e04a2298502d at /Users/someone/Office/app.php'
        );

        $this->assertStringNotContainsString('14cda094324469c174a7e04a2298502d', $out);
        $this->assertStringNotContainsString('/Users/someone', $out);
    }

    #[Test]
    public function it_drops_serialized_queue_payloads(): void
    {
        $line = 'local.ERROR: heartbeat failed {"uuid":"7f02e1bc","displayName":"Closure","command":"O:34:..."}';

        $out = LogFingerprint::stripPayload($line);

        $this->assertStringNotContainsString('displayName', $out);
        $this->assertStringContainsString('serialized job payload omitted', $out);
        $this->assertStringContainsString('heartbeat failed', $out);
    }

    #[Test]
    public function the_same_error_at_different_times_shares_a_signature(): void
    {
        $a = '[2026-07-30 04:51:00] local.ERROR: Scheduler heartbeat failed to write cache';
        $b = '[2026-07-30 04:52:00] local.ERROR: Scheduler heartbeat failed to write cache';

        // The old dedup keyed on the first 100 characters, which start with the timestamp, so
        // these counted as two distinct errors.
        $this->assertSame(LogFingerprint::signature($a), LogFingerprint::signature($b));
    }

    #[Test]
    public function errors_differing_only_by_id_share_a_signature(): void
    {
        $a = "local.ERROR: no access to account 'acct_1OFCFCQHkKp3rKJU'";
        $b = "local.ERROR: no access to account 'acct_1REsI5CkibUzZMEq'";

        $this->assertSame(LogFingerprint::signature($a), LogFingerprint::signature($b));
    }

    #[Test]
    public function genuinely_different_errors_do_not_collide(): void
    {
        $this->assertNotSame(
            LogFingerprint::signature('local.ERROR: Connection refused'),
            LogFingerprint::signature('local.ERROR: Disk is full')
        );
    }

    #[Test]
    public function grouping_counts_occurrences_and_orders_by_frequency(): void
    {
        $lines = [
            '[2026-07-30 01:00:00] local.ERROR: Rare problem',
            '[2026-07-30 02:00:00] local.ERROR: Common problem',
            '[2026-07-30 03:00:00] local.ERROR: Common problem',
            '[2026-07-30 04:00:00] local.ERROR: Common problem',
        ];

        $groups = LogFingerprint::group($lines);

        $this->assertCount(2, $groups);
        $this->assertSame(3, $groups[0]['count'], 'Most frequent must sort first.');
        $this->assertSame('2026-07-30 02:00:00', $groups[0]['first_seen']);
        $this->assertSame('2026-07-30 04:00:00', $groups[0]['last_seen']);
    }

    #[Test]
    public function lines_differing_only_by_a_number_are_one_signature(): void
    {
        // "Failed: 4, Pending: 13" and "Failed: 9, Pending: 40" are the same fault, not two.
        $lines = array_map(
            fn ($i) => "[2026-07-30 01:00:00] local.ERROR: Queue issues detected. Failed: {$i}",
            range(1, 30)
        );

        $this->assertCount(1, LogFingerprint::group($lines));
        $this->assertSame(30, LogFingerprint::group($lines)[0]['count']);
    }

    #[Test]
    public function grouping_respects_the_limit_and_ignores_blank_lines(): void
    {
        $words = ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot'];
        $lines = array_map(fn ($w) => "[2026-07-30 01:00:00] local.ERROR: The {$w} subsystem is unwell", $words);
        $lines[] = '   ';

        $this->assertCount(3, LogFingerprint::group($lines, 3));
        $this->assertCount(6, LogFingerprint::group($lines, 50), 'The blank line must not become a group.');
    }

    #[Test]
    public function presentable_output_is_redacted_and_truncated(): void
    {
        $out = LogFingerprint::presentable('ERROR: key sk_live_ABCDEFGHIJKLMNOP failed '.str_repeat('x', 900));

        $this->assertStringNotContainsString('sk_live_ABCDEFGHIJKLMNOP', $out);
        $this->assertLessThanOrEqual(410, strlen($out));
    }
}
