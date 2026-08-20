<?php

namespace Tests\Feature;

use App\Mail\PlatformRiskAlert;
use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\SecurityEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * "Unusual refund volume" — Security Checklist §3.
 *
 * The audit found the number computed (`RiskService::refund_rate_30d` against
 * `high_refund_rate`) and reported only to the CREATOR. This pins the admin
 * half: the platform floor, the creator-cluster route, and the cooldown.
 *
 * ⚠️ Only `checkRefundVolume` is exercised, not the whole command — the state
 * machine's own metrics are raw MySQL (`NOW() - INTERVAL 30 DAY`) that no
 * sqlite suite can execute, which is the documented reason `PlatformGmvTrigger`
 * exists as a separate testable class.
 */
class RefundVolumeAlertTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Cache::flush();
    }

    private function runCheck(): void
    {
        $command = app(\App\Console\Commands\MonitorPlatformRiskState::class);
        $command->setLaravel(app());

        $method = new \ReflectionMethod($command, 'checkRefundVolume');
        $method->setAccessible(true);

        // ⚠️ BOTH `input` and `output` have to be planted. `checkRefundVolume`
        // reads `$this->option('dry-run')`, which goes through `$this->input` —
        // with only the output set it throws "Call to a member function
        // getOption() on null", the check's own try/catch swallows it, and the
        // test fails looking like a threshold bug.
        $output = new \Symfony\Component\Console\Output\BufferedOutput;
        $input = new \Symfony\Component\Console\Input\ArrayInput([], $command->getDefinition());

        foreach (['input' => $input, 'output' => new \Illuminate\Console\OutputStyle($input, $output)] as $name => $value) {
            $property = new \ReflectionProperty(\Illuminate\Console\Command::class, $name);
            $property->setAccessible(true);
            $property->setValue($command, $value);
        }

        $method->invoke($command);
    }

    private function payments(int $succeeded, int $refunded): void
    {
        for ($i = 0; $i < $succeeded; $i++) {
            Payment::create(['creator_id' => 1, 'amount' => 1000, 'currency' => 'gbp', 'status' => 'succeeded']);
        }
        for ($i = 0; $i < $refunded; $i++) {
            Payment::create(['creator_id' => 1, 'amount' => 1000, 'currency' => 'gbp', 'status' => 'refunded']);
        }
    }

    /**
     * 🚨 THE FLOOR IS THE POINT. A 100% refund rate over three payments is a
     * creator having a bad week, and mailing about it teaches the reader to
     * ignore the mail.
     */
    public function test_a_high_rate_under_the_transaction_floor_does_not_alert(): void
    {
        $this->payments(2, 3);   // 60% refund rate, 5 transactions

        $this->runCheck();

        Mail::assertNothingSent();
        $this->assertDatabaseMissing('security_events', ['event_type' => SecurityEvent::REFUND_VOLUME]);
    }

    /** Over the floor and over the rate: reported. */
    public function test_a_high_rate_over_the_floor_alerts_admins(): void
    {
        $this->payments(50, 10); // ~16.7% over 60 transactions

        $this->runCheck();

        Mail::assertSent(PlatformRiskAlert::class, function (PlatformRiskAlert $mail) {
            // ⚠️ The subject must NOT claim a state change — nothing about the
            // platform state moved, and refund rate is deliberately not a state
            // trigger.
            return str_contains((string) $mail->headline, 'refund volume')
                && ! str_contains((string) $mail->headline, 'State changed');
        });

        $this->assertDatabaseHas('security_events', ['event_type' => SecurityEvent::REFUND_VOLUME]);
    }

    /** A normal refund rate over plenty of volume says nothing. */
    public function test_a_normal_refund_rate_does_not_alert(): void
    {
        $this->payments(100, 1);

        $this->runCheck();

        Mail::assertNothingSent();
    }

    /**
     * A cluster of individual creators is a signal even when the platform
     * average is healthy — mirrors the risk engine's own dispute-cluster rule.
     */
    public function test_a_cluster_of_creators_over_the_threshold_alerts(): void
    {
        $this->payments(100, 1); // platform average fine

        for ($i = 1; $i <= 5; $i++) {
            CreatorMetric::create([
                'creator_id' => 'creator-'.$i,
                'tx_30d' => 20,
                'refunds_30d' => 5,
                'refund_rate_30d' => 0.25,
            ]);
        }

        $this->runCheck();

        Mail::assertSent(PlatformRiskAlert::class);
        $event = SecurityEvent::where('event_type', SecurityEvent::REFUND_VOLUME)->firstOrFail();
        $this->assertContains('CREATOR_REFUND_CLUSTER', $event->context['reasons']);
    }

    /**
     * 🚨 A 30-day rolling window barely moves between scheduler ticks. Without
     * the cooldown this mails the same number dozens of times a day.
     */
    public function test_the_alert_is_sent_once_per_cooldown(): void
    {
        $this->payments(50, 10);

        $this->runCheck();
        $this->runCheck();
        $this->runCheck();

        Mail::assertSentCount(1);
    }

    /**
     * The state machine's own transition mail is untouched — no headline, so
     * the original "State changed to X" subject still applies.
     */
    public function test_the_original_transition_subject_is_unchanged(): void
    {
        $mail = new PlatformRiskAlert('FREEZE', ['X'], []);

        $this->assertNull($mail->headline);
        $this->assertStringContainsString('State changed to FREEZE', $mail->envelope()->subject);
    }
}
