<?php

namespace Tests\Feature;

use App\Http\Controllers\Admin\SystemDiagnosticsController;
use Illuminate\Support\Facades\Cache;
use ReflectionMethod;
use Tests\TestCase;

/**
 * 🚨 A CACHE THAT CANNOT ANSWER IS NOT A CRON JOB THAT IS NOT RUNNING.
 *
 * Both halves of the scheduler tile are cache keys, and `Cache::get` returns
 * null for a missing key and for an unreachable store alike. So a Redis blip
 * produced the exact reading a dead scheduler does, and the tile told an admin
 * "the cron job may not be running" — sending the investigation at the one
 * subsystem the evidence says nothing about. The writing side filed the mirror
 * of the same misattribution at error level (Sentry JAVASCRIPT-REACT-CA).
 */
class SchedulerHeartbeatReadingTest extends TestCase
{
    private function tile(): array
    {
        $method = new ReflectionMethod(SystemDiagnosticsController::class, 'testScheduledTasks');
        $method->setAccessible(true);

        return $method->invoke(app(SystemDiagnosticsController::class));
    }

    private function errors(array $result): string
    {
        return implode(' | ', $result['errors'] ?? []);
    }

    /**
     * 🚨 THE CASE. With the store refusing every call, the tile must say it
     * cannot judge — and must NOT name cron or the queue worker.
     */
    public function test_an_unreadable_cache_is_not_reported_as_a_stopped_scheduler(): void
    {
        Cache::shouldReceive('put')->andThrow(new \RuntimeException("Can't communicate with any node in the cluster"));
        Cache::shouldReceive('get')->andThrow(new \RuntimeException("Can't communicate with any node in the cluster"));
        Cache::shouldReceive('forget')->andReturn(true);

        $errors = $this->errors($this->tile());

        $this->assertStringContainsString(
            'cache is not answering',
            $errors,
            'An unreachable cache must be reported as an unreadable heartbeat, not as a scheduler fault.'
        );
        $this->assertStringNotContainsString(
            'cron job may not be running',
            $errors,
            'A cache fault was blamed on cron — the reading proves nothing about the scheduler.'
        );
        $this->assertStringNotContainsString(
            'No queue worker heartbeat',
            $errors,
            'A cache fault was also blamed on the queue worker; one broken store must not produce two false findings.'
        );
    }

    /**
     * ⚠️ THE CONTROL. A working cache with no heartbeat in it is a genuine
     * finding and must still be reported — the round-trip probe must not become
     * a way of excusing a scheduler that really has stopped.
     */
    public function test_a_working_cache_with_no_heartbeat_still_accuses_cron(): void
    {
        Cache::flush();

        $errors = $this->errors($this->tile());

        $this->assertStringContainsString(
            'cron job may not be running',
            $errors,
            'A readable but empty cache is a real scheduler finding and must survive.'
        );
    }

    /** ⚠️ The other control: a fresh heartbeat in a working cache reports healthy. */
    public function test_a_fresh_heartbeat_passes(): void
    {
        Cache::flush();
        Cache::put('scheduler_heartbeat', time(), 600);
        Cache::put('queue_worker_heartbeat', time(), 600);

        $this->assertSame('passed', $this->tile()['status']);
    }

    /**
     * 🚨 The probe must leave nothing behind. A diagnostic that writes a key and
     * forgets to remove it changes what the next check reads.
     */
    public function test_the_probe_does_not_leave_its_own_key_behind(): void
    {
        Cache::flush();
        $this->tile();

        $this->assertNull(Cache::get('diagnostics_cache_probe'));
    }
}
