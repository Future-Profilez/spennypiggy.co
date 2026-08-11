<?php

namespace App\Console\Commands;

use App\EmailService;
use App\Mail\SubscriptionPolicyChanged;
use App\Models\EngagementNotification;
use App\Models\User;
use App\Services\NotificationDispatcher;
use App\Support\SubscriptionPlan;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * One-off announcement: the creator subscription is no longer charged until the
 * creator's first sale.
 *
 * Run by hand, never scheduled — it is an announcement, not a recurring job.
 */
class AnnounceSubscriptionPolicy extends Command
{
    protected $signature = 'creators:announce-subscription-policy
        {--max= : Stop after sending this many emails}
        {--user= : Send to one creator only (id, username or email) — ignores the dedup claim}
        {--resend= : Send again to everyone as a NEW round (blank = today\'s date as the label)}
        {--preview= : Write the rendered email to this path and send nothing}
        {--force : Send even to creators who already received an earlier round}
        {--dry-run : List who would receive it and send nothing}';

    protected $description = 'Tell creators the subscription is no longer charged until their first sale';

    /**
     * The dedup key. Fixed, so re-running the command is a no-op rather than a
     * second copy landing in every creator's inbox — the failure mode that makes
     * an announcement look like spam.
     */
    private const CLAIM_TYPE = 'subscription_policy_2026_07_31';

    /** Dedup key for the original send. */
    private const FIRST_ROUND = 'announcement';

    /**
     * 🚨 A creator who received ANY round within this many days is skipped.
     *
     * The atomic claim alone is not enough, because it relies on the unique index
     * on `engagement_notifications` rejecting the duplicate insert. Where that
     * index is absent the insert simply succeeds, `claim()` returns true every
     * time, and a re-run mails the same people again — with `--max` and the id
     * ordering, it is the SAME first N creators on every run. Reported live: one
     * creator received this announcement three times.
     *
     * This guard is an explicit lookup, so it holds whatever the schema looks like.
     * A genuine resend months later still goes out; an accidental re-run this week
     * does not. `--force` overrides.
     */
    private const RECENT_DAYS = 30;

    public function handle(): int
    {
        if ($path = $this->option('preview')) {
            return $this->preview($path);
        }

        $dryRun = (bool) $this->option('dry-run');
        $round = $this->roundKey();

        // ⚠️ A resend goes to people who have already had this email. That is a
        // deliberate act, never a default — confirm it, and default to no so a
        // scripted or --no-interaction run cannot blast a second copy by accident.
        if ($round !== self::FIRST_ROUND && ! $dryRun) {
            $this->warn("Resend round '{$round}'. Everyone eligible receives this email again, including creators who already had it.");

            if (! $this->confirm('Send it again?', false)) {
                $this->info('Aborted; nothing sent.');

                return self::SUCCESS;
            }
        }

        if ($round !== self::FIRST_ROUND) {
            $this->line("Round: {$round}");
        }
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $query = User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->whereNotNull('email')
            ->orderBy('id');

        if ($only = $this->option('user')) {
            $query->where(function ($q) use ($only) {
                $q->where('username', $only)->orWhere('email', $only);
                if (ctype_digit((string) $only)) {
                    $q->orWhere('id', (int) $only);
                }
            });
        }

        $sent = 0;
        $failed = 0;
        // Kept apart from $failed on purpose: on a second batch run almost every
        // creator is already-sent, and reporting that under the same heading as a
        // genuine failure makes a normal run look like a broken one.
        $alreadySent = 0;
        $optedOut = 0;
        $examined = 0;

        foreach ($query->cursor() as $creator) {
            $examined++;

            // ⚠️ Consent is checked BEFORE the claim. EmailService::sendCategoryEmail
            // returns silently when a creator has opted out, so claiming first
            // counted them as "sent" and burned their claim — they could never
            // receive the announcement even if they opted back in.
            if (! ($creator->creator_updates_enabled ?? true)) {
                $optedOut++;

                continue;
            }

            // ⚠️ Checked BEFORE the claim and independently of it — see RECENT_DAYS.
            // Covers every round, so a second `--resend` in the same month cannot
            // reach someone who already has the message.
            if (! $this->option('user') && ! $this->option('force')) {
                $recent = EngagementNotification::where('user_id', $creator->id)
                    ->where('type', self::CLAIM_TYPE)
                    ->where('sent_at', '>=', now()->subDays(self::RECENT_DAYS))
                    ->exists();

                if ($recent) {
                    $alreadySent++;

                    continue;
                }
            }

            // The claim IS the insert, so two runs racing cannot both win. Skipped
            // for --user so a single creator can be re-sent while testing.
            if (! $this->option('user') && ! $dryRun) {
                if (! NotificationDispatcher::claim($creator->id, self::CLAIM_TYPE, $round)) {
                    $alreadySent++;

                    continue;
                }
            }

            // Three cohorts, three messages. Telling a creator who is already
            // billing "you won't be charged", or showing "add your card" to one
            // who added theirs months ago, is how an announcement becomes a
            // support ticket.
            $variant = match ((int) $creator->subscription_status) {
                1 => SubscriptionPolicyChanged::VARIANT_BILLING,
                2 => SubscriptionPolicyChanged::VARIANT_FREE_PERIOD,
                default => SubscriptionPolicyChanged::VARIANT_NONE,
            };

            if ($dryRun) {
                $this->line(sprintf(
                    '[dry-run] %s <%s> — %s',
                    $creator->username,
                    $creator->email,
                    $variant,
                ));
                $sent++;

                if ($max !== null && $sent >= $max) {
                    break;
                }

                continue;
            }

            try {
                // ⚠️ sendCategoryEmail, not Mail::to(). This is a product
                // announcement, so a creator who turned off creator updates must
                // not receive it — the unsubscribe link in the footer has to mean
                // something the next time we send one.
                EmailService::sendCategoryEmail(
                    $creator,
                    new SubscriptionPolicyChanged(
                        userId: $creator->id,
                        creatorName: $creator->name ?? '',
                        variant: $variant,
                    ),
                    'creator_updates_enabled',
                );

                $sent++;
                $this->line("Sent to {$creator->username} <{$creator->email}>");
            } catch (\Throwable $e) {
                // Release the claim so a re-run reaches them. Leaving it set means
                // one transient SMTP blip permanently drops that creator from the
                // announcement, silently.
                EngagementNotification::where('user_id', $creator->id)
                    ->where('type', self::CLAIM_TYPE)
                    ->where('dedup_key', $round)
                    ->delete();

                $failed++;
                $this->warn("Failed for {$creator->username}: {$e->getMessage()}");
                Log::warning('creators:announce-subscription-policy send failed', [
                    'creator_id' => $creator->id,
                    'error' => $e->getMessage(),
                ]);
            }

            if ($max !== null && $sent >= $max) {
                $this->info("Reached --max={$max}; stopping.");
                break;
            }
        }

        $this->info(sprintf(
            '%sExamined %d · sent %d · already sent %d · opted out %d · failed %d.',
            $dryRun ? '[dry-run] ' : '',
            $examined,
            $sent,
            $alreadySent,
            $optedOut,
            $failed,
        ));

        // The operator's next question after a capped run is always "who is left?".
        // Answering it here avoids them guessing, or re-running blind.
        if ($max !== null && $sent >= $max && ! $this->option('user')) {
            $remaining = $this->remainingCount($round);

            $this->newLine();
            $this->info($remaining > 0
                ? "{$remaining} creator(s) still to go — run the command again to continue."
                : 'Everyone has now received it.');
        }

        return self::SUCCESS;
    }

    /**
     * Which send round this run belongs to.
     *
     * A resend is modelled as a NEW round with its own dedup key rather than as
     * a switch that ignores the claim. It stays idempotent (running the resend
     * twice sends once), it stays resumable with --max, and the history of who
     * received which round survives.
     *
     * `--resend` with no value uses today's date, so two runs on the same day are
     * one round and a run next week is naturally a new one.
     */
    private function roundKey(): string
    {
        // ⚠️ Presence is read off the raw input, not from option('resend').
        // A bare `--resend` (no value) resolves to null, which is
        // indistinguishable from the flag being absent — so the resend silently
        // ran as a normal top-up instead.
        $passed = $this->input->hasParameterOption('--resend')
            || $this->input->hasParameterOption('--resend=');

        if (! $passed) {
            return self::FIRST_ROUND;
        }

        $label = trim((string) $this->option('resend')) ?: now()->toDateString();

        // The dedup_key column is shared with every other engagement notification;
        // keep the value short and recognisable.
        return 'resend:'.Str::limit(Str::slug($label) ?: now()->toDateString(), 40, '');
    }

    /**
     * How many eligible creators have not been claimed yet.
     *
     * The same answer for a real run and a dry run: a dry run claims nothing, so
     * what is left is whatever a previous REAL run has not already taken.
     */
    private function remainingCount(string $round): int
    {
        return User::query()
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->whereNotNull('email')
            ->whereNotExists(function ($q) use ($round) {
                $q->select(DB::raw(1))
                    ->from('engagement_notifications')
                    ->whereColumn('engagement_notifications.user_id', 'users.id')
                    ->where('engagement_notifications.type', self::CLAIM_TYPE)
                    // ⚠️ Scoped to the ROUND, not just the type. Filtering on type
                    // alone would report a fresh resend round as already complete,
                    // because everyone still carries their first-round claim.
                    ->where('engagement_notifications.dedup_key', $round);
            })
            // ⚠️ …but the RECENT_DAYS guard skips people across every round, so the
            // headline number has to apply it too. A count that does not match what
            // the run actually sends is worse than no count.
            ->when(! $this->option('force'), function ($query) {
                $query->whereNotExists(function ($q) {
                    $q->select(DB::raw(1))
                        ->from('engagement_notifications')
                        ->whereColumn('engagement_notifications.user_id', 'users.id')
                        ->where('engagement_notifications.type', self::CLAIM_TYPE)
                        ->where('engagement_notifications.sent_at', '>=', now()->subDays(self::RECENT_DAYS));
                });
            })
            ->count();
    }

    /**
     * Render the email to a file so it can be opened in a browser and signed off
     * before a single message goes out.
     */
    private function preview(string $path): int
    {
        $creator = User::where('role', 1)->orderBy('id')->first();

        if (! $creator) {
            $this->error('No creator account to render a preview from.');

            return self::FAILURE;
        }

        $html = view('email.subscription-policy-changed', [
            'user' => $creator,
            'creatorName' => $creator->name ?: 'Alex',
            'alreadySubscribed' => false,
            'plan' => SubscriptionPlan::forFrontend(),
            'ctaUrl' => route('activate-subscription'),
            'unsubscribeUrl' => '#',
        ])->render();

        file_put_contents($path, $html);

        $this->info("Preview written to {$path}");
        $this->line('Open it in a browser to review before sending.');

        return self::SUCCESS;
    }
}
