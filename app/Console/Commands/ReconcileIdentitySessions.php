<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\IdentityCheckState;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Stripe\Identity\VerificationSession;
use Stripe\Stripe;

/**
 * Ask Stripe what each open ID check is actually doing, and record the answer.
 *
 * 🚨 WHY THIS EXISTS. `users.identity_status = 2` is written when the Stripe Identity
 * SESSION IS CREATED, not when a document is submitted — and Stripe sends no event at
 * all for a creator who opens the check and closes the tab. So a creator could sit on
 * 2 forever while every screen told them "your ID check is being processed": a wait
 * with no end, on a step that was theirs to finish. The `processing` webhook now
 * separates the two going forward; this command is what settles the rows that already
 * exist, and the safety net for a webhook that never arrives.
 *
 * ⚠️ Retrieving a session is a plain read — it is NOT a billable verification. Only
 * creating one is.
 *
 * It also repairs a MISSED `verified` webhook: if Stripe says the check passed, the
 * creator is marked verified here rather than being left waiting on an event that has
 * already been and gone. The reverse — inventing a failure — is deliberately NOT done:
 * `requires_input` is recorded as a session state only, because the creator-facing
 * failure reason belongs to the webhook payload (`IdentityFailureReason`) and guessing
 * one would tell somebody their passport was rejected when it was never submitted.
 */
class ReconcileIdentitySessions extends Command
{
    protected $signature = 'identity:reconcile
        {--dry-run : Report what would change and write nothing}
        {--max=500 : Stop after this many creators}';

    protected $description = 'Read the real Stripe status of every open identity session and record it';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));

        $secret = config('services.stripe.secret');

        if (blank($secret)) {
            $this->error('No Stripe secret configured — nothing read.');

            return self::FAILURE;
        }

        Stripe::setApiKey($secret);

        $examined = 0;
        $changed = 0;
        $verified = 0;
        $failed = 0;

        $candidates = User::query()
            ->where('role', 1)
            ->where('identity_status', IdentityCheckState::STATUS_OPEN)
            ->whereNotNull('stripe_user_id')
            ->orderBy('id')
            ->limit($max)
            ->get(['id', 'username', 'stripe_user_id', 'identity_status', 'identity_session_status']);

        foreach ($candidates as $user) {
            $examined++;

            try {
                $session = VerificationSession::retrieve($user->stripe_user_id);
            } catch (\Throwable $e) {
                // An unknown or redacted session id is a fact about that row, not a
                // reason to stop the sweep for everyone behind it.
                $failed++;
                Log::warning('identity:reconcile — could not read session', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);

                continue;
            }

            $status = (string) $session->status;

            if ($status === $user->identity_session_status) {
                continue;
            }

            $changed++;

            $this->line(sprintf(
                '#%d (%s): %s → %s',
                $user->id,
                $user->username ?? '—',
                $user->identity_session_status ?? 'unknown',
                $status
            ));

            if ($dryRun) {
                continue;
            }

            $attributes = IdentityCheckState::attributes($status);

            // A verified session whose webhook never landed. Recording the state alone
            // would leave the creator on step 2 with a passed check, still unable to
            // list anything.
            if ($status === IdentityCheckState::VERIFIED) {
                // ⚠️ The passport-only rule is enforced by the `verified` WEBHOOK, which
                // also tells the creator why a different document was refused. This
                // command never decides against anybody — it records the session state
                // and leaves the rejection to the path that can explain it.
                if (! IdentityCheckState::documentTypeAllowed($session)) {
                    Log::warning('identity:reconcile — verified session carries a non-passport document, left for the webhook', [
                        'user_id' => $user->id,
                    ]);
                } else {
                    // 🚨 The FULL set, not just identity_status: a creator repaired here
                    // with a stale `identity_admin_status = 2` would read as verified on
                    // their own page and as rejected in the admin queue.
                    $attributes = IdentityCheckState::verifiedAttributes();
                    $verified++;
                }
            }

            $user->update($attributes);
        }

        $this->info(sprintf(
            '%sExamined %d · updated %d · repaired %d verified · unreadable %d',
            $dryRun ? '[dry-run] ' : '',
            $examined,
            $changed,
            $verified,
            $failed
        ));

        return self::SUCCESS;
    }
}
