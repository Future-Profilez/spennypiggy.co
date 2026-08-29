<?php

namespace Tests\Feature;

use App\Jobs\SendEngagementNotification;
use App\Models\User;
use App\Support\BlockedPaymentAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The gate ABOVE the subscription check recorded nothing.
 *
 * `StripeControl::hasCardPaymentsCapability()` refuses a purchase before the
 * subscription check ever runs, and every one of those call sites returned a
 * message to the supporter and wrote no row — so a sale lost to a creator's own
 * Stripe account was invisible to the creator, to the admin feed and to the
 * lost-sales count on the dashboard card.
 */
class StripeDisabledBlockedSaleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        // ⚠️ Queue::fake() rather than mocking the dispatcher: `queue()` is a
        // plain static that dispatches a job, so the payload the creator would
        // actually be sent is on the job, and asserting there survives the
        // dispatcher being refactored.
        Queue::fake();
    }

    /** The body of the one notification this recording produced. */
    private function noticeBody(): string
    {
        $bodies = [];

        foreach (Queue::pushedJobs()[SendEngagementNotification::class] ?? [] as $pushed) {
            $bodies[] = (string) ($pushed['job']->payload['body'] ?? '');
        }

        $this->assertNotEmpty($bodies, 'No blocked-payment notice was queued.');

        return $bodies[0];
    }

    /**
     * 🚨 THE POINT OF THIS FILE. A source scan, because the fault is an ABSENCE:
     * nothing errors when a refusal records nothing, and no test of the recorder
     * can see a call site that never calls it.
     */
    public function test_every_refusing_capability_gate_records_the_lost_sale(): void
    {
        // 🚨 THE MARKER IS `stripe_disabled`, NOT the capability call. Most of the
        // hasCardPaymentsCapability() reads in app/ are display flags handed to a
        // view, and a scan keyed on the call flags those as faults. Every gate
        // that actually REFUSES a purchase builds this status for
        // CreatorAvailabilityMessageService — so a new refusal is written the
        // same way and is caught, and a read is not.
        $silent = [];

        foreach ($this->controllerFiles() as $file) {
            $source = file_get_contents($file);
            $relative = str_replace(base_path().'/', '', $file);
            $offset = 0;

            while (($pos = strpos($source, "'status' => 'stripe_disabled'", $offset)) !== false) {
                $offset = $pos + 10;

                // The refusal and its recording sit in one short block; look back
                // as well as forward, because the record() call comes first.
                $block = substr($source, max(0, $pos - 900), 1200);

                if (! str_contains($block, 'BlockedPaymentAlert::record')) {
                    $line = substr_count($source, "\n", 0, $pos) + 1;
                    $silent[] = "{$relative}:{$line}";
                }
            }
        }

        $this->assertSame(
            [],
            $silent,
            "A capability gate refuses a purchase and records nothing:\n  ".implode("\n  ", $silent)
        );
    }

    /** @return list<string> */
    private function controllerFiles(): array
    {
        $files = [];
        $it = new \RecursiveIteratorIterator(new \RecursiveDirectoryIterator(app_path('Http/Controllers')));

        foreach ($it as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        sort($files);

        return $files;
    }

    /**
     * 🚨 THE MESSAGE USED TO NAME THE WRONG FIX. Every refusal said "because your
     * subscription is not active", so a creator whose Stripe account had lost
     * card payments was sent to renew a subscription that was already fine.
     */
    public function test_the_notice_names_the_reason_it_was_given(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        BlockedPaymentAlert::record($creator, 25, 'GBP', 'stripe_disabled');

        $body = $this->noticeBody();

        $this->assertStringContainsString('Stripe account', $body);
        $this->assertStringNotContainsString('subscription', $body);
    }

    public function test_a_subscription_refusal_still_names_the_subscription(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        BlockedPaymentAlert::record($creator, 25, 'GBP', 'no_subscription');

        $this->assertStringContainsString('subscription is not active', $this->noticeBody());
    }

    /**
     * ⚠️ An unrecognised reason says what IS known. Guessing a cause is how the
     * previous copy sent creators to fix the wrong thing.
     */
    public function test_an_unknown_reason_is_never_given_a_cause(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        BlockedPaymentAlert::record($creator, 25, 'GBP', null);

        $body = $this->noticeBody();

        $this->assertStringNotContainsString('subscription', $body);
        $this->assertStringNotContainsString('Stripe', $body);
    }

    /** The row itself carries the code, so the admin feed can name it too. */
    public function test_the_row_records_the_stripe_reason(): void
    {
        $creator = User::factory()->create(['role' => 1]);

        BlockedPaymentAlert::record($creator, 25, 'GBP', 'stripe_disabled');

        $this->assertSame(
            'stripe_disabled',
            DB::table('blocked_payment_attempts')->where('creator_id', $creator->id)->value('reason')
        );
    }
}
