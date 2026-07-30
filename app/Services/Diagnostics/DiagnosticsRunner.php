<?php

namespace App\Services\Diagnostics;

use App\Models\DiagnosticResult;
use App\Models\DiagnosticRun;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Runs the checks, ranks them, remembers them, and says what CHANGED.
 *
 * The change is the point. A snapshot saying "4 failed jobs" is unreadable without knowing it was
 * 0 an hour ago; the same number trending down needs no action at all. Everything else here —
 * per-check isolation, severity ordering, persistence — exists to make that one comparison
 * trustworthy.
 */
class DiagnosticsRunner
{
    /** Runs older than this are pruned by the command. */
    public const RETENTION_DAYS = 90;

    /**
     * @param  array<string,callable():array>  $checks  key => thunk returning a legacy result array
     */
    public function __construct(private array $checks) {}

    /**
     * @param  array{deep?:bool, only?:string[], persist?:bool, trigger?:string}  $options
     */
    public function run(array $options = []): array
    {
        $deep = (bool) ($options['deep'] ?? false);
        $only = $options['only'] ?? null;
        $persist = (bool) ($options['persist'] ?? true);
        $trigger = $options['trigger'] ?? 'manual';

        $startedAt = microtime(true);

        /** @var CheckResult[] $results */
        $results = [];

        foreach ($this->checks as $key => $thunk) {
            if ($only !== null && ! in_array($key, $only, true)) {
                continue;
            }

            // A mutating check creates a real Stripe account / PaymentIntent. Opt-in only.
            if (! $deep && CheckCatalog::isMutating($key)) {
                $results[$key] = CheckResult::skipped(
                    $key,
                    'Skipped on a standard run — this check creates real objects at Stripe. Use "Deep run" to include it.'
                );

                continue;
            }

            try {
                $results[$key] = CheckResult::fromLegacy($key, ($thunk)());
            } catch (\Throwable $e) {
                // One broken check is one red row, never a dead page.
                Log::warning('Diagnostic check threw', ['check' => $key, 'error' => $e->getMessage()]);
                $results[$key] = CheckResult::threw($key, $e);
            }
        }

        $durationMs = (int) round((microtime(true) - $startedAt) * 1000);

        $counts = $this->counts($results);
        $overall = $this->overallStatus($results);

        $previous = $this->previousResults($deep);

        $ordered = $this->sorted($results);

        $payload = [
            'status' => $overall,
            'counts' => $counts,
            'duration_ms' => $durationMs,
            'deep' => $deep,
            'environment' => app()->environment(),
            'timestamp' => now()->toDateTimeString(),
            'results' => array_map(
                fn (CheckResult $r) => $r->toArray() + ['delta' => $this->delta($r, $previous)],
                $ordered
            ),
            'group_order' => CheckCatalog::groupOrder(),
            'previous_run_at' => $previous['run_at'],
            'summary_text' => null, // filled below, needs the deltas
        ];

        $payload['summary_text'] = $this->summaryText($payload);

        if ($persist) {
            $this->persist($payload, $results, $trigger);
        }

        return $payload;
    }

    /** @param CheckResult[] $results */
    private function counts(array $results): array
    {
        $counts = ['passed' => 0, 'warning' => 0, 'failed' => 0, 'skipped' => 0, 'critical' => 0];

        foreach ($results as $r) {
            if (isset($counts[$r->status])) {
                $counts[$r->status]++;
            }

            if ($r->isProblem() && $r->severity === CheckCatalog::SEVERITY_CRITICAL) {
                $counts['critical']++;
            }
        }

        return $counts;
    }

    /** @param CheckResult[] $results */
    private function overallStatus(array $results): string
    {
        $status = CheckResult::PASSED;

        foreach ($results as $r) {
            if ($r->status === CheckResult::FAILED) {
                return CheckResult::FAILED;
            }

            if ($r->status === CheckResult::WARNING) {
                $status = CheckResult::WARNING;
            }
        }

        return $status;
    }

    /**
     * @param  CheckResult[]  $results
     * @return CheckResult[]
     */
    private function sorted(array $results): array
    {
        $ordered = array_values($results);

        usort($ordered, static fn (CheckResult $a, CheckResult $b) => $a->sortKey() <=> $b->sortKey());

        return $ordered;
    }

    /**
     * The previous run's status per check, so this run can be described as a change.
     *
     * Compared against a run of the SAME depth: a standard run skips the mutating checks, so
     * diffing it against a deep run would report every one of them as newly broken.
     *
     * Returns `['statuses' => [key => status], 'run_at' => ?string]`. The run timestamp used to
     * be smuggled into the status map under a `__run_at` key, which made "was this check
     * measured last time?" indistinguishable from "was the map non-empty?".
     *
     * @return array{statuses: array<string,string>, run_at: ?string}
     */
    private function previousResults(bool $deep): array
    {
        $empty = ['statuses' => [], 'run_at' => null];

        if (! $this->tablesReady()) {
            return $empty;
        }

        try {
            $run = DiagnosticRun::query()
                ->where('deep', $deep)
                ->latest('id')
                ->first();

            if (! $run) {
                return $empty;
            }

            return [
                'statuses' => DiagnosticResult::query()
                    ->where('diagnostic_run_id', $run->id)
                    ->pluck('status', 'check_key')
                    ->all(),
                'run_at' => $run->created_at?->toDateTimeString(),
            ];
        } catch (\Throwable $e) {
            // History is a nice-to-have. Never let it break the run that produces it.
            Log::warning('Could not load previous diagnostic run', ['error' => $e->getMessage()]);

            return $empty;
        }
    }

    /**
     * new       — was healthy last time, is a problem now. The row to look at.
     * resolved  — was a problem, now healthy.
     * worse     — warning became failed.
     * improved  — failed became warning.
     * same      — unchanged.
     * null      — this check was not measured in the previous run, so there is nothing to say.
     *
     * ⚠️ A check MISSING from the previous run returns null, never 'new'. It used to return
     * 'new' for any absent key regardless of status, so every healthy check wore a red "New"
     * chip after any `--only` run — and because `--only` runs are persisted, one scoped run
     * made the next full run flag ~30 passing checks as newly broken. Absent is unknown, and
     * unknown is not a change.
     */
    private function delta(CheckResult $result, array $previous): ?string
    {
        $statuses = $previous['statuses'];

        if (! array_key_exists($result->key, $statuses)) {
            return null;
        }

        $was = $statuses[$result->key];
        $now = $result->status;

        if ($was === $now) {
            return 'same';
        }

        $wasProblem = in_array($was, [CheckResult::FAILED, CheckResult::WARNING], true);
        $isProblem = $result->isProblem();

        return match (true) {
            ! $wasProblem && $isProblem => 'new',
            $wasProblem && ! $isProblem => 'resolved',
            $was === CheckResult::WARNING && $now === CheckResult::FAILED => 'worse',
            $was === CheckResult::FAILED && $now === CheckResult::WARNING => 'improved',
            default => 'same',
        };
    }

    /**
     * A plain-text block for pasting into a ticket or chat. This is what actually gets shared,
     * so it is generated rather than left to whoever is copying rows out of a table.
     */
    private function summaryText(array $payload): string
    {
        $c = $payload['counts'];

        $lines = [
            sprintf(
                '[%s] Diagnostics %s — %d failed, %d warning, %d passed, %d skipped (%s, %.1fs)',
                strtoupper($payload['environment']),
                strtoupper($payload['status']),
                $c['failed'],
                $c['warning'],
                $c['passed'],
                $c['skipped'],
                $payload['timestamp'],
                $payload['duration_ms'] / 1000
            ),
        ];

        foreach ($payload['results'] as $r) {
            if (! in_array($r['status'], [CheckResult::FAILED, CheckResult::WARNING], true)) {
                continue;
            }

            $delta = in_array($r['delta'], ['new', 'worse'], true) ? ' ['.strtoupper($r['delta']).']' : '';

            $lines[] = sprintf(
                '  %s %s%s — %s',
                $r['severity'] === CheckCatalog::SEVERITY_CRITICAL ? '[CRITICAL]' : '[warning] ',
                $r['label'],
                $delta,
                $r['message']
            );
        }

        if (count($lines) === 1) {
            $lines[] = '  All checks healthy.';
        }

        return implode("\n", $lines);
    }

    /** @param CheckResult[] $results */
    private function persist(array $payload, array $results, string $trigger): void
    {
        if (! $this->tablesReady()) {
            return;
        }

        try {
            /*
             * Both writes or neither.
             *
             * Without the transaction, a failure between the run row and its results left a run
             * with ZERO results — and the next run would then find a previous run whose status
             * map was empty, so nothing could be compared and the whole history was quietly
             * wrong from that point on.
             */
            DB::transaction(function () use ($payload, $results, $trigger) {
                $run = DiagnosticRun::create([
                    'status' => $payload['status'],
                    'environment' => $payload['environment'],
                    'trigger' => $trigger,
                    'deep' => $payload['deep'],
                    'passed_count' => $payload['counts']['passed'],
                    'warning_count' => $payload['counts']['warning'],
                    'failed_count' => $payload['counts']['failed'],
                    'skipped_count' => $payload['counts']['skipped'],
                    'duration_ms' => $payload['duration_ms'],
                ]);

                $now = now();

                DiagnosticResult::insert(array_map(static fn (CheckResult $r) => [
                    'diagnostic_run_id' => $run->id,
                    'check_key' => $r->key,
                    'status' => $r->status,
                    'severity' => $r->severity,
                    // Messages are already redacted upstream; truncate so one runaway line
                    // cannot bloat the table.
                    'message' => mb_substr($r->message, 0, 1000),
                    'meta' => json_encode($r->meta),
                    'duration_ms' => (int) round($r->durationMs),
                    'created_at' => $now,
                    'updated_at' => $now,
                ], array_values($results)));
            });
        } catch (\Throwable $e) {
            // Recording the run must never be why the run fails.
            Log::warning('Could not persist diagnostic run', ['error' => $e->getMessage()]);
        }
    }

    /** Prune old runs. Results cascade. */
    public static function prune(int $days = self::RETENTION_DAYS): int
    {
        if (! Schema::hasTable('diagnostic_runs')) {
            return 0;
        }

        return DiagnosticRun::where('created_at', '<', now()->subDays($days))->delete();
    }

    private function tablesReady(): bool
    {
        try {
            return Schema::hasTable('diagnostic_runs') && Schema::hasTable('diagnostic_results');
        } catch (\Throwable) {
            // The database check is itself one of the checks — if the DB is down we still want a
            // report, just without history.
            return false;
        }
    }
}
