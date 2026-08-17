<?php

namespace App\Console\Commands;

use App\Mail\SignupWaitlistOpen;
use App\Models\SignupLead;
use App\Services\SignupLeadService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

/**
 * Tell everyone who was turned away that sign-ups are open again.
 *
 * A lead nobody contacts is not a lead, it is a row. This command is the entire
 * point of capturing the address.
 */
class NotifySignupLeads extends Command
{
    protected $signature = 'signup-leads:notify
                            {--max=500 : Cap on leads EMAILED this run, not leads examined}
                            {--dry-run : Report who would be emailed and claim nothing}';

    protected $description = 'Email captured sign-up leads once creator registration reopens';

    public function handle(SignupLeadService $leads): int
    {
        // Scheduled, so a missing migration must be a quiet no-op rather than a
        // daily throw into Sentry for a condition that is not a fault.
        if (! Schema::hasTable('signup_leads')) {
            $this->info('signup_leads table not present — nothing to do.');

            return self::SUCCESS;
        }

        // 🚨 Never write to somebody while the wall is still up. The mail says
        // "you can sign up now" and links straight at the form that would refuse
        // them again — one wrong send here and the next one is ignored.
        if (! $leads->registrationOpen()) {
            $this->info('Registration is still paused — holding every lead.');

            return self::SUCCESS;
        }

        $max = max(1, (int) $this->option('max'));
        $dryRun = (bool) $this->option('dry-run');
        $registerUrl = rtrim((string) config('app.url'), '/').'/register';

        $sent = 0;
        $failed = 0;

        // ⚠️ `--max` caps SENDS, not rows read. Capping the query means a run
        // whose first N rows were all ineligible reaches nobody while the rest
        // wait forever, and that gap grows with the table — the same trap the
        // first-listing nudge documents.
        foreach (SignupLead::query()->pending()->orderBy('id')->cursor() as $lead) {
            if ($sent >= $max) {
                break;
            }

            if ($dryRun) {
                $this->line("DRY RUN: would email {$lead->email}");
                $sent++;

                continue;
            }

            // The UPDATE *is* the claim, so two workers cannot both send.
            if (! $lead->claimNotification()) {
                continue;
            }

            try {
                // queue(), never send(): this loop can run over thousands of rows
                // and a synchronous SMTP call each would hold the scheduler for as
                // long as the mail server takes. Needs `queue:work`.
                Mail::to($lead->email)->queue(new SignupWaitlistOpen($registerUrl));
                $sent++;
            } catch (\Throwable $e) {
                // Hand the claim back, or one blip costs that person their notice
                // permanently — the row would read "told" and never be seen again.
                $lead->releaseNotification();
                $failed++;

                Log::warning('Signup lead notification failed', [
                    'lead_id' => $lead->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $remaining = SignupLead::query()->pending()->count();

        // ⚠️ A dry run must not say "Emailed". An operator reading that line after
        // `--dry-run` reasonably concludes the mail went out, and then does not
        // run it for real — which is the whole feature silently not happening.
        $verb = $dryRun ? 'Would email' : 'Emailed';

        $this->info("{$verb}: {$sent} · failed: {$failed} · still waiting: {$remaining}");

        // Re-running is the intended way to finish a capped run.
        if ($remaining > 0 && ! $dryRun) {
            $this->comment("Run again to continue — {$remaining} lead(s) left.");
        }

        return self::SUCCESS;
    }
}
