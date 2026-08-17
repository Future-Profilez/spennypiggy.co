<?php

namespace App\Console\Commands;

use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Models\User;
use Illuminate\Console\Command;

/**
 * Clear the backlog of accounts stuck at email verification.
 *
 * 🚨 Registration never dispatched the verification email — it was sent only by
 * a mount effect on the verification page, gated by a per-device localStorage
 * timestamp. So an account whose owner never loaded that page with working
 * JavaScript was created and never mailed. That is fixed forward; this command
 * is what reaches the accounts already sitting in that state.
 *
 * 🚨 DRY RUN BY DEFAULT. It mails real people, so `--apply` is required before
 * anything is sent.
 */
class ResendVerificationEmails extends Command
{
    protected $signature = 'users:resend-verification
        {--apply : Actually send. Without this nothing is dispatched.}
        {--days= : Only accounts created within this many days. Omit for all.}
        {--role= : Restrict to a role (1 = creator, 0 = supporter).}
        {--min-gap-hours=24 : Skip anyone who has been sent a link this recently.}
        {--max=200 : Cap on emails SENT, not accounts examined.}
        {--user= : A single user id, for testing.}';

    protected $description = 'Resend the verification link to accounts stuck unverified.';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $max = max(1, (int) $this->option('max'));
        $minGapHours = max(0, (int) $this->option('min-gap-hours'));

        $query = User::query()
            ->whereNull('email_verified_at')
            ->whereNotNull('email')
            ->where('email', '!=', '')
            ->where('suspended_account', 0)
            ->orderBy('id');

        if ($days = $this->option('days')) {
            $query->where('created_at', '>=', now()->subDays((int) $days));
        }

        if (($role = $this->option('role')) !== null && $role !== '') {
            $query->where('role', (int) $role);
        }

        if ($userId = $this->option('user')) {
            $query->where('id', (int) $userId);
        }

        $sent = 0;
        $skippedRecent = 0;
        $failed = 0;
        $examined = 0;
        $rows = [];

        // ⚠️ `--max` caps SENDS, not rows read. Capping the query instead means
        // a run whose first N candidates were all recently mailed reaches
        // nobody, and everyone past the cap is never reached on ANY run.
        foreach ($query->cursor() as $user) {
            if ($sent >= $max) {
                break;
            }

            $examined++;

            $lastSent = EmailVerificationNotificationController::lastSentAt($user->id);

            if ($minGapHours > 0 && $lastSent && (now()->timestamp - $lastSent) < $minGapHours * 3600) {
                $skippedRecent++;

                continue;
            }

            $rows[] = [
                $user->id,
                $user->email,
                $user->role == 1 ? 'creator' : 'supporter',
                optional($user->created_at)->toDateString(),
            ];

            if (! $apply) {
                $sent++;

                continue;
            }

            try {
                EmailVerificationNotificationController::dispatchLink($user);
                $sent++;
            } catch (\Throwable $e) {
                $failed++;
                $this->error("User {$user->id}: {$e->getMessage()}");
            }
        }

        if ($rows) {
            $this->table(['id', 'email', 'role', 'registered'], array_slice($rows, 0, 50));

            if (count($rows) > 50) {
                $this->line('… and '.(count($rows) - 50).' more.');
            }
        }

        $this->newLine();
        $this->line($apply
            ? "Sent: {$sent} · skipped (mailed recently): {$skippedRecent} · failed: {$failed} · examined: {$examined}"
            : "DRY RUN — would send: {$sent} · would skip (mailed recently): {$skippedRecent} · examined: {$examined}");

        if (! $apply) {
            $this->comment('Nothing was sent. Re-run with --apply to send for real.');
        }

        // Needs a queue worker: VerifyEmail is a queued job.
        if ($apply && $sent > 0) {
            $this->comment('Queued. These only leave the building while `queue:work` is running.');
        }

        return self::SUCCESS;
    }
}
