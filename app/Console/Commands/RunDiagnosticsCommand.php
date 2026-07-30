<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\SystemDiagnosticsController;
use App\Mail\DiagnosticsAlertMail;
use App\Services\Diagnostics\CheckCatalog;
use App\Services\Diagnostics\DiagnosticsRunner;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class RunDiagnosticsCommand extends Command
{
    protected $signature = 'diagnostics:run
        {--force : Send the email even if every check passes}
        {--deep : Include the checks that create real objects at Stripe}
        {--only=* : Run only these check keys}
        {--dry-run : Run and print, but send no email and record no run}
        {--prune : Delete stored runs older than the retention window}';

    protected $description = 'Run system diagnostics, record the run, and email alerts when something is wrong';

    public function handle(): int
    {
        if ($this->option('prune')) {
            $deleted = DiagnosticsRunner::prune();
            $this->info("Pruned {$deleted} diagnostic run(s) older than ".DiagnosticsRunner::RETENTION_DAYS.' days.');
        }

        $dryRun = (bool) $this->option('dry-run');
        $only = array_values(array_filter((array) $this->option('only')));

        $this->info('Running system diagnostics'.($this->option('deep') ? ' (deep)' : '').'...');

        $controller = new SystemDiagnosticsController;

        $data = (new DiagnosticsRunner($controller->checks()))->run([
            'deep' => (bool) $this->option('deep'),
            'only' => $only !== [] ? $only : null,
            // A dry run must not become the baseline the next run diffs against.
            'persist' => ! $dryRun,
            'trigger' => 'scheduled',
        ]);

        $overallStatus = $data['status'];
        $counts = $data['counts'];

        $this->newLine();
        $this->line($data['summary_text']);
        $this->newLine();

        foreach ($data['results'] as $result) {
            $icon = match ($result['status']) {
                'passed' => '<fg=green>✓</>',
                'failed' => '<fg=red>✗</>',
                'warning' => '<fg=yellow>!</>',
                'skipped' => '<fg=gray>–</>',
                default => '?',
            };

            $delta = match ($result['delta'] ?? null) {
                'new' => ' <fg=red>[NEW]</>',
                'worse' => ' <fg=red>[WORSE]</>',
                'resolved' => ' <fg=green>[RESOLVED]</>',
                'improved' => ' <fg=green>[IMPROVED]</>',
                default => '',
            };

            $this->line("  {$icon} {$result['label']}{$delta}: {$result['message']}");
        }

        if ($dryRun) {
            $this->newLine();
            $this->comment('Dry run — no email sent, run not recorded.');

            return $overallStatus === 'failed' ? self::FAILURE : self::SUCCESS;
        }

        // Alert on a real problem, or when explicitly forced. A run that is only "skipped" checks
        // is not a problem worth an inbox.
        $shouldAlert = $overallStatus !== 'passed' || $this->option('force');

        if (! $shouldAlert) {
            $this->info('All checks passed. No alert needed.');

            return self::SUCCESS;
        }

        $recipients = $this->recipients();

        if ($recipients === []) {
            $this->warn('Issues found but no alert recipients are configured (services.diagnostics.alert_emails).');

            return $overallStatus === 'failed' ? self::FAILURE : self::SUCCESS;
        }

        // The mail template iterates `$results as $key => $result`, so hand it the keyed shape.
        $keyed = array_column($data['results'], null, 'key');

        foreach ($recipients as $email) {
            try {
                Mail::to($email)->send(new DiagnosticsAlertMail(
                    overallStatus: $overallStatus,
                    results: $keyed,
                    timestamp: $data['timestamp'],
                    failedCount: $counts['failed'],
                    warningCount: $counts['warning'],
                ));
            } catch (\Throwable $e) {
                // One bad address must not stop the rest of the team being told.
                $this->error("Could not send to {$email}: ".$e->getMessage());
            }
        }

        $this->info('Alert sent to: '.implode(', ', $recipients));

        return $overallStatus === 'failed' ? self::FAILURE : self::SUCCESS;
    }

    /**
     * Recipients come from config, not a hardcoded array — the old list was two personal
     * addresses baked into the class, which meant changing who gets alerted was a code deploy.
     */
    private function recipients(): array
    {
        $configured = config('services.diagnostics.alert_emails');

        if (is_string($configured)) {
            $configured = explode(',', $configured);
        }

        return array_values(array_filter(
            array_map('trim', (array) $configured),
            static fn ($e) => filter_var($e, FILTER_VALIDATE_EMAIL) !== false
        ));
    }

    /** Exposed for the scheduler/tests so the severity vocabulary stays in one place. */
    public function criticalCount(array $data): int
    {
        return collect($data['results'] ?? [])
            ->filter(fn ($r) => in_array($r['status'] ?? '', ['failed', 'warning'], true)
                && ($r['severity'] ?? '') === CheckCatalog::SEVERITY_CRITICAL)
            ->count();
    }
}
