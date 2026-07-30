<?php

namespace Tests\Feature;

use App\Models\DiagnosticResult;
use App\Models\DiagnosticRun;
use App\Services\Diagnostics\CheckCatalog;
use App\Services\Diagnostics\CheckResult;
use App\Services\Diagnostics\DiagnosticsRunner;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DiagnosticsRunnerTest extends TestCase
{
    use RefreshDatabase;

    private function passing(string $message = 'fine'): callable
    {
        return fn () => ['status' => 'passed', 'message' => $message, 'time_ms' => 1];
    }

    private function failing(string $message = 'broken'): callable
    {
        return fn () => ['status' => 'failed', 'message' => $message, 'time_ms' => 1];
    }

    #[Test]
    public function a_check_that_throws_becomes_one_failed_row_not_a_dead_run(): void
    {
        $payload = (new DiagnosticsRunner([
            'database' => fn () => throw new \RuntimeException('exploded'),
            'cache' => $this->passing(),
        ]))->run(['persist' => false]);

        $this->assertSame('failed', $payload['status']);
        $this->assertCount(2, $payload['results']);

        $database = collect($payload['results'])->firstWhere('key', 'database');
        $this->assertSame('failed', $database['status']);
        $this->assertStringContainsString('exploded', $database['message']);
    }

    #[Test]
    public function results_are_ordered_failed_first_then_by_severity(): void
    {
        $payload = (new DiagnosticsRunner([
            'intercom' => $this->passing(),
            // warning, non-critical
            'disk_space' => fn () => ['status' => 'warning', 'message' => 'full'],
            // failed, critical — must lead
            'database' => $this->failing(),
            // failed, but a lower-severity check
            'social_flow' => $this->failing(),
        ]))->run(['persist' => false]);

        $order = array_column($payload['results'], 'key');

        $this->assertSame(['database', 'social_flow', 'disk_space', 'intercom'], $order);
    }

    #[Test]
    public function a_mutating_check_is_skipped_unless_the_run_is_deep(): void
    {
        $called = false;
        $checks = ['stripe_payments' => function () use (&$called) {
            $called = true;

            return ['status' => 'passed', 'message' => 'ok'];
        }];

        $shallow = (new DiagnosticsRunner($checks))->run(['persist' => false]);

        $this->assertFalse($called, 'A standard run must not create real objects at Stripe.');
        $this->assertSame(CheckResult::SKIPPED, $shallow['results'][0]['status']);

        $deep = (new DiagnosticsRunner($checks))->run(['persist' => false, 'deep' => true]);

        $this->assertTrue($called);
        $this->assertSame('passed', $deep['results'][0]['status']);
    }

    #[Test]
    public function a_skipped_check_never_counts_as_passed(): void
    {
        $payload = (new DiagnosticsRunner([
            'stripe_payments' => $this->passing(),
        ]))->run(['persist' => false]);

        $this->assertSame(0, $payload['counts']['passed']);
        $this->assertSame(1, $payload['counts']['skipped']);
        // Skipped alone is not a problem — the overall status stays green.
        $this->assertSame('passed', $payload['status']);
    }

    #[Test]
    public function an_unknown_status_from_a_check_is_treated_as_failed(): void
    {
        $payload = (new DiagnosticsRunner([
            'cache' => fn () => ['status' => 'probably fine?', 'message' => 'hmm'],
        ]))->run(['persist' => false]);

        $this->assertSame('failed', $payload['results'][0]['status']);
    }

    #[Test]
    public function the_first_run_has_no_deltas_and_the_second_reports_change(): void
    {
        $first = (new DiagnosticsRunner(['cache' => $this->passing()]))->run([]);
        $this->assertNull($first['results'][0]['delta'], 'Nothing to compare against on a first run.');

        $second = (new DiagnosticsRunner(['cache' => $this->failing()]))->run([]);
        $this->assertSame('new', $second['results'][0]['delta']);

        $third = (new DiagnosticsRunner(['cache' => $this->passing()]))->run([]);
        $this->assertSame('resolved', $third['results'][0]['delta']);
    }

    #[Test]
    public function a_check_missing_from_the_previous_run_has_no_delta(): void
    {
        // A scoped run is persisted, so the next full run finds checks the previous one never
        // measured. Those used to come back as 'new' regardless of status, which put a red
        // "New" chip on perfectly healthy rows.
        (new DiagnosticsRunner(['cache' => $this->passing()]))->run([]);

        $next = (new DiagnosticsRunner([
            'cache' => $this->passing(),
            'intercom' => $this->passing(),
            'disk_space' => fn () => ['status' => 'warning', 'message' => 'filling'],
        ]))->run([]);

        $byKey = array_column($next['results'], null, 'key');

        $this->assertSame('same', $byKey['cache']['delta'], 'A measured check still reports.');
        $this->assertNull($byKey['intercom']['delta'], 'Unmeasured and healthy is not "new".');
        $this->assertNull($byKey['disk_space']['delta'], 'Unmeasured is unknown, even when it is a problem.');
    }

    #[Test]
    public function a_run_never_persists_without_its_results(): void
    {
        // A run row with zero results would leave the next run with an empty status map and
        // nothing to compare, silently breaking every delta from that point on.
        (new DiagnosticsRunner([
            'cache' => $this->passing(),
            'database' => $this->failing(),
        ]))->run([]);

        DiagnosticRun::all()->each(function (DiagnosticRun $run) {
            $this->assertGreaterThan(
                0,
                DiagnosticResult::where('diagnostic_run_id', $run->id)->count(),
                "Run {$run->id} was recorded with no results."
            );
        });
    }

    #[Test]
    public function a_warning_becoming_a_failure_is_reported_as_worse(): void
    {
        (new DiagnosticsRunner(['disk_space' => fn () => ['status' => 'warning', 'message' => 'filling']]))->run([]);

        $next = (new DiagnosticsRunner(['disk_space' => fn () => ['status' => 'failed', 'message' => 'full']]))->run([]);

        $this->assertSame('worse', $next['results'][0]['delta']);
    }

    #[Test]
    public function a_deep_run_is_compared_against_the_previous_deep_run(): void
    {
        // A standard run skips the mutating checks. Diffing a deep run against it would report
        // every one of them as newly broken.
        (new DiagnosticsRunner(['stripe_payments' => $this->passing()]))->run(['deep' => true]);
        (new DiagnosticsRunner(['stripe_payments' => $this->passing()]))->run(['deep' => false]);

        $deep = (new DiagnosticsRunner(['stripe_payments' => $this->passing()]))->run(['deep' => true]);

        $this->assertSame('same', $deep['results'][0]['delta']);
    }

    #[Test]
    public function a_run_is_persisted_with_its_results(): void
    {
        (new DiagnosticsRunner([
            'cache' => $this->passing(),
            'database' => $this->failing(),
        ]))->run(['trigger' => 'scheduled']);

        $run = DiagnosticRun::latest('id')->first();

        $this->assertNotNull($run);
        $this->assertSame('failed', $run->status);
        $this->assertSame('scheduled', $run->trigger);
        $this->assertSame(1, $run->passed_count);
        $this->assertSame(1, $run->failed_count);
        $this->assertSame(2, DiagnosticResult::where('diagnostic_run_id', $run->id)->count());
    }

    #[Test]
    public function persist_false_records_nothing(): void
    {
        (new DiagnosticsRunner(['cache' => $this->passing()]))->run(['persist' => false]);

        $this->assertSame(0, DiagnosticRun::count());
    }

    #[Test]
    public function only_limits_which_checks_run(): void
    {
        $payload = (new DiagnosticsRunner([
            'cache' => $this->passing(),
            'database' => fn () => throw new \RuntimeException('should never run'),
        ]))->run(['persist' => false, 'only' => ['cache']]);

        $this->assertCount(1, $payload['results']);
        $this->assertSame('cache', $payload['results'][0]['key']);
    }

    #[Test]
    public function critical_problems_are_counted_separately(): void
    {
        $payload = (new DiagnosticsRunner([
            'database' => $this->failing(),   // critical
            'social_flow' => $this->failing(), // info severity
        ]))->run(['persist' => false]);

        $this->assertSame(2, $payload['counts']['failed']);
        $this->assertSame(1, $payload['counts']['critical']);
    }

    #[Test]
    public function a_passing_check_carries_no_remediation(): void
    {
        $payload = (new DiagnosticsRunner(['database' => $this->passing()]))->run(['persist' => false]);

        $this->assertNull($payload['results'][0]['remediation']);
        $this->assertSame(CheckCatalog::SEVERITY_INFO, $payload['results'][0]['severity']);
    }

    #[Test]
    public function the_summary_text_leads_with_the_environment_and_lists_only_problems(): void
    {
        $payload = (new DiagnosticsRunner([
            'database' => $this->failing('DB unreachable'),
            'cache' => $this->passing('fine'),
        ]))->run(['persist' => false]);

        $summary = $payload['summary_text'];

        $this->assertStringContainsString('[TESTING]', $summary);
        $this->assertStringContainsString('[CRITICAL]', $summary);
        $this->assertStringContainsString('DB unreachable', $summary);
        $this->assertStringNotContainsString('fine', $summary);
    }

    #[Test]
    public function prune_deletes_old_runs_and_cascades_their_results(): void
    {
        (new DiagnosticsRunner(['cache' => $this->passing()]))->run([]);

        DiagnosticRun::query()->update(['created_at' => now()->subDays(200)]);

        DiagnosticsRunner::prune();

        $this->assertSame(0, DiagnosticRun::count());
        $this->assertSame(0, DiagnosticResult::count());
    }
}
