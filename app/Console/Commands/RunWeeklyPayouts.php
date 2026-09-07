<?php

namespace App\Console\Commands;

use App\Helpers;
use App\Mail\CommandFailed;
use App\Models\Payment;
use App\Models\User;
use App\Services\Risk\PayoutService;
use App\Support\PayoutCycle;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class RunWeeklyPayouts extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payout:run-weekly
        {--force : Force run even if not Friday}
        {--dry-run : Calculate and print the eligible payouts without paying anyone}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Execute the weekly payout run for all eligible creators';

    /**
     * Execute the console command.
     */
    public function handle(PayoutService $payoutService)
    {
        $dryRun = (bool) $this->option('dry-run');

        $this->info($dryRun ? 'Weekly Payout Run — DRY RUN (nothing will be paid)...' : 'Starting Weekly Payout Run...');

        // A dry run pays nobody and writes nothing, so the Friday gate would only
        // stop the one thing it is safe to do on any day: look.
        if (! $dryRun && ! $this->option('force') && ! now()->isFriday()) {
            $this->error('Today is not Friday. Use --force to run anyway.');

            return;
        }

        try {
            // 1. Calculate Payouts (Preview)
            $this->info('Calculating payouts...');
            $preview = $payoutService->calculatePayouts();

            $count = $preview['creator_count'];
            $total = $preview['platform_total'];

            $this->info("Found {$count} eligible creators. Total Net Payout: {$total}");

            if ($count === 0) {
                // A run that pays nobody used to return in silence — no row, no log,
                // no email — which is indistinguishable from the scheduler never
                // firing at all. Say so, and say why nobody qualified.
                $this->warn('No payouts to process.');
                $reasons = $this->explainEmptyRun();
                $this->line($reasons);

                Log::info('Weekly Payout Run found no eligible creators.', ['diagnosis' => $reasons]);

                if (! $dryRun) {
                    $this->notify(
                        'Weekly Payout Job: NOTHING TO PAY',
                        'Weekly payout job ran at '.now()->toDateTimeString()
                            .' and found 0 eligible creators, so no payout run was created.'
                            .PHP_EOL.PHP_EOL.$reasons
                    );
                }

                return;
            }

            if ($dryRun) {
                $this->printPreview($preview);
                $this->warn('DRY RUN — no Stripe payout was created and no record was written.');

                return;
            }

            // 2. Execute Payouts
            // In a real scenario, we might want a confirmation step or separate command.
            // But for "Automatic Payout Engine", we execute.

            $this->info('Executing payouts...');
            $run = $payoutService->executePayouts($preview);

            $this->info("Payout Run Completed. Run ID: {$run->id}");

            // Log Success
            Log::info('Weekly Payout Run executed successfully.', ['run_id' => $run->id, 'count' => $count, 'total' => $total]);

            $this->notify(
                'Weekly Payout Job: SUCCESS (Run '.$run->id.')',
                'Weekly payout job executed successfully at '.now()->toDateTimeString()
                    .'. Run ID: '.$run->id
                    .'. Eligible creators: '.$count
                    .'. Total net payout: '.$total
            );

        } catch (\Throwable $e) {
            // \Throwable: a TypeError anywhere in the run must still alert ops, not vanish.
            $this->error('Payout Run Failed: '.$e->getMessage());
            Log::error('Weekly Payout Run Failed', ['error' => $e->getMessage()]);

            // A dry run touches nothing, so a failure in one is a reporting problem,
            // not an ops incident — do not page anybody for it.
            if (! $dryRun) {
                $this->notify(
                    'Weekly Payout Job: FAILED',
                    'Weekly payout job failed at '.now()->toDateTimeString().'. Error: '.$e->getMessage()
                );
            }
        }
    }

    /**
     * Ops notification. Never lets a mail failure change the outcome of a run
     * that has already moved real money.
     */
    private function notify(string $subject, string $body): void
    {
        $to = config('services.payout_notifications.weekly_job_email');

        if (! $to) {
            return;
        }

        try {
            Mail::to($to)->send(new CommandFailed(
                '['.strtoupper(app()->environment()).'] '.$subject,
                $body
            ));
        } catch (\Throwable $e) {
            Log::error('Weekly Payout Run: notification email failed', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Print what the run WOULD pay, per creator.
     *
     * A creator can appear here with a net payout of zero — held in reserve,
     * under the £1 threshold, or waiting on a delivery — and that is the answer
     * to "why did nobody get paid" far more often than an empty list is.
     */
    private function printPreview(array $preview): void
    {
        $rows = [];

        foreach ($preview['payouts'] as $uuid => $p) {
            $currency = $p['currency'];
            $money = fn ($minor) => number_format(Helpers::toMajorUnits((int) $minor, $currency), 2);

            $notes = [];
            if (! empty($p['is_below_threshold'])) {
                $notes[] = 'below £1 minimum';
            }
            if ((int) $p['pending_amount'] > 0) {
                $notes[] = 'awaiting delivery';
            }
            if ((int) $p['review_hold_amount'] > 0) {
                $notes[] = 'review hold';
            }
            if ((int) $p['negative_balance_before'] > 0) {
                $notes[] = 'negative balance';
            }
            if ((int) $p['net_payout'] === 0 && $notes === []) {
                $notes[] = 'nothing payable';
            }

            $rows[] = [
                $p['creator_name'],
                $currency,
                $money($p['net_payout']),
                $money($p['reserve_amount']),
                $money($p['reserve_release_amount']),
                $money($p['pending_amount']),
                $p['payment_count'],
                $p['cutoff_date'],
                implode(', ', $notes),
            ];
        }

        $this->table(
            ['Creator', 'Cur', 'Net payout', 'Reserve held', 'Reserve release', 'Pending', 'Payments', 'Cutoff', 'Notes'],
            $rows
        );

        $this->info('Run date: '.$preview['run_date'].' · platform total (GBP minor): '.$preview['platform_total']);
    }

    /**
     * Why did the run find nobody?
     *
     * "0 eligible creators" reads as a broken scheduler. Almost always it is one
     * of a small number of ordinary reasons, and each is one cheap read-only
     * count — the alternative is a hand-written tinker query every Friday.
     */
    private function explainEmptyRun(): string
    {
        try {
            $unpaid = Payment::whereNull('payout_run_id')
                ->whereIn('status', ['succeeded', 'review_hold'])
                ->count();

            // ⚠️ The SAME cut-off the run just used, not a rolling 7 days — this line
            // explains why the run paid nobody, so a different rule here explains the
            // wrong thing and sends whoever reads it looking in the wrong place.
            $insideHold = Payment::whereNull('payout_run_id')
                ->where('status', 'succeeded')
                ->where('created_at', '>', PayoutCycle::cutoffFor(PayoutCycle::nextPayoutDate()))
                ->count();

            $paused = User::whereNotNull('payout_paused_at')->count();

            if ($unpaid === 0) {
                return 'Nothing is waiting to be paid: 0 unpaid succeeded/review_hold payments exist. '
                    .'Either everything has already been paid out, or no sales have settled.';
            }

            return "There are {$unpaid} unpaid payment(s), but none qualified. "
                ."Of those, {$insideHold} are still inside an earning week that has not closed and been held. "
                ."{$paused} creator(s) have payouts paused. "
                .'Remaining reasons are per-payment: a physical shop order not yet delivered, '
                .'a timed task not yet accepted, or a net below the £1 minimum.';
        } catch (\Throwable $e) {
            // Diagnostics must never be why the command reports a failure.
            return 'Could not build a diagnosis: '.$e->getMessage();
        }
    }
}
