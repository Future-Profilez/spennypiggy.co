<?php

namespace Tests\Feature;

use App\Services\Diagnostics\DiagnosticsRunner;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * 🚨 HOUSEKEEPING MUST NOT GATE THE HEALTH CHECK.
 *
 * `diagnostics:run --prune` is the scheduled form, and `--prune` runs FIRST — so a
 * transient database failure inside the prune threw before a single check had run,
 * and the sweep that exists to REPORT a database problem was killed by one
 * (JAVASCRIPT-REACT-AQ: "[2002] Cannot connect to MySQL using SSL" at 00:03, and no
 * diagnostics that night).
 */
class DiagnosticsPruneFailureTest extends TestCase
{
    public function test_a_failing_prune_does_not_stop_the_checks(): void
    {
        // Stand in for the connection failure: hasTable() is what prune() calls first,
        // and it is what actually connects.
        Schema::shouldReceive('hasTable')
            ->andThrow(new \RuntimeException('SQLSTATE[HY000] [2002] Cannot connect to MySQL using SSL'));

        $this->artisan('diagnostics:run', ['--prune' => true, '--dry-run' => true, '--only' => ['queue']])
            ->expectsOutputToContain('Could not prune old diagnostic runs')
            ->expectsOutputToContain('Running system diagnostics')
            ->assertExitCode(0);
    }

    public function test_the_retention_window_is_still_a_real_number(): void
    {
        // A prune that silently pruned nothing for ever would look identical to one
        // that works, so the window itself is worth pinning.
        $this->assertGreaterThan(0, DiagnosticsRunner::RETENTION_DAYS);
    }
}
