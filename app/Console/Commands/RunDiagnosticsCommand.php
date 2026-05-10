<?php

namespace App\Console\Commands;

use App\Http\Controllers\Admin\SystemDiagnosticsController;
use App\Mail\DiagnosticsAlertMail;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class RunDiagnosticsCommand extends Command
{
    protected $signature = 'diagnostics:run {--force : Send email even if all checks pass}';

    protected $description = 'Run system diagnostics and email alerts if issues are found';

    private array $alertRecipients = [
        'naveen@internetbusinesssolutionsindia.com',
        'prem@futureprofilez.com',
    ];

    public function handle(): int
    {
        $this->info('Running system diagnostics...');

        $controller = new SystemDiagnosticsController();
        $response   = $controller->run();
        $data       = json_decode($response->getContent(), true);

        $overallStatus = $data['status'];
        $results       = $data['results'];
        $timestamp     = $data['timestamp'];

        // Count failures and warnings
        $failed   = collect($results)->filter(fn($r) => ($r['status'] ?? '') === 'failed')->count();
        $warnings = collect($results)->filter(fn($r) => ($r['status'] ?? '') === 'warning')->count();

        $this->line("Overall: {$overallStatus} | Failed: {$failed} | Warnings: {$warnings}");

        // Print summary to console
        foreach ($results as $key => $result) {
            $status = $result['status'] ?? 'unknown';
            $icon = match ($status) {
                'passed'  => '<fg=green>✓</>',
                'failed'  => '<fg=red>✗</>',
                'warning' => '<fg=yellow>!</>',
                default   => '?',
            };
            $this->line("  {$icon} {$key}: " . ($result['message'] ?? ''));
        }

        // Send email alert if there are failures/warnings or --force flag
        $shouldAlert = $overallStatus !== 'passed' || $this->option('force');

        if ($shouldAlert) {
            $this->info('Sending alert email...');
            foreach ($this->alertRecipients as $email) {
                Mail::to($email)->send(new DiagnosticsAlertMail(
                    overallStatus: $overallStatus,
                    results: $results,
                    timestamp: $timestamp,
                    failedCount: $failed,
                    warningCount: $warnings,
                ));
            }
            $this->info('Alert sent to: ' . implode(', ', $this->alertRecipients));
        } else {
            $this->info('All checks passed. No alert needed.');
        }

        return $overallStatus === 'failed' ? self::FAILURE : self::SUCCESS;
    }
}
