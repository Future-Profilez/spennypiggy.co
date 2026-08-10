<?php

namespace App\Console\Commands;

use App\Mail\FinishAddingYourCard;
use App\Models\EngagementNotification;
use App\Models\MonthlyCharge;
use App\Services\NotificationDispatcher;
use App\Services\SubscriptionCheckoutService;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\InvalidRequestException;

/**
 * The backstop for a subscription checkout that was started and never resolved.
 *
 * 🚨 Nothing used to look at these rows again, ever. `initiated` means the creator
 * reached Stripe's page; whether they finished was decided by a single browser
 * redirect, and if that redirect never arrived the row stayed `initiated` for
 * good — card saved on Stripe, nothing on our side, no retry, no reminder, and a
 * creator who cannot sell anything until they work out they must do it again.
 *
 * One sweep, three outcomes, because they are the same question asked of Stripe:
 *
 *   session complete  → record the card (recovers a redirect that was lost)
 *   session dead      → close the row (it sat `initiated` forever otherwise)
 *   session still open → remind the creator, once
 */
class ReconcileSubscriptionCheckouts extends Command
{
    protected $signature = 'subscription:reconcile-checkouts
        {--max=200 : Maximum rows to examine in this run}
        {--remind-after=45 : Minutes before an unfinished checkout earns a reminder}
        {--dry-run : Report what would happen without writing, sending or claiming}';

    protected $description = 'Resolve platform-subscription checkouts left at "initiated"';

    /**
     * ⚠️ Give the redirect a moment to win first. Both paths finishing the same row
     * is safe (the claim is atomic), but a sweep that fetches every session the
     * instant it is created is a Stripe call per checkout for nothing.
     */
    private const SETTLE_MINUTES = 3;

    public function handle(SubscriptionCheckoutService $checkout): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = max(1, (int) $this->option('max'));
        $remindAfter = max(1, (int) $this->option('remind-after'));

        $recovered = 0;
        $closed = 0;
        $reminded = 0;
        $waiting = 0;

        $rows = MonthlyCharge::with('user')
            ->where('status', SubscriptionCheckoutService::STATUS_STARTED)
            ->whereNotNull('session_id')
            ->where('created_at', '<=', now()->subMinutes(self::SETTLE_MINUTES))
            ->orderBy('id')
            ->limit($max)
            ->get();

        foreach ($rows as $sub) {
            [$session, $gone] = $this->session($sub);

            if ($session === null) {
                // ⚠️ "Stripe has no record of this" and "Stripe did not answer" are
                // different answers and only the first is a decision. Closing a row
                // on a transient API failure writes off a checkout the creator may
                // be completing at that very moment.
                if ($gone) {
                    $closed += $this->close($checkout, $sub, 'session_not_found', $dryRun);
                }

                continue;
            }

            $status = $session->status ?? null;

            if ($status === 'complete') {
                $recovered += $this->recover($checkout, $sub, $session, $dryRun);

                continue;
            }

            if ($status === 'expired') {
                $closed += $this->close($checkout, $sub, 'session_expired', $dryRun);

                continue;
            }

            // Still open: the link works, so the creator can still finish it.
            if ($sub->created_at && $sub->created_at->lte(now()->subMinutes($remindAfter))) {
                $reminded += $this->remind($sub, $session, $dryRun);

                continue;
            }

            $waiting++;
        }

        $this->info(sprintf(
            '%sExamined %d · recovered %d · closed %d · reminded %d · still waiting %d',
            $dryRun ? '[dry run] ' : '',
            $rows->count(),
            $recovered,
            $closed,
            $reminded,
            $waiting
        ));

        return self::SUCCESS;
    }

    /**
     * The live session, plus whether Stripe positively denied knowing it.
     *
     * ⚠️ One call, not two. An earlier form asked again to tell "missing" from
     * "unreachable", which doubled the Stripe traffic of every failed lookup on a
     * sweep whose whole job is asking Stripe about rows.
     *
     * @return array{0: mixed, 1: bool} [session|null, definitelyGone]
     */
    private function session(MonthlyCharge $sub): array
    {
        try {
            return [StripeControl::getCheckoutSession($sub->session_id), false];
        } catch (InvalidRequestException $e) {
            // Stripe answered: there is no such session. It can never complete.
            Log::info('ReconcileSubscriptionCheckouts: session no longer exists', [
                'monthly_charge_id' => $sub->id,
                'session_id' => $sub->session_id,
            ]);

            return [null, true];
        } catch (\Throwable $e) {
            Log::warning('ReconcileSubscriptionCheckouts: could not read session: '.$e->getMessage(), [
                'monthly_charge_id' => $sub->id,
                'session_id' => $sub->session_id,
            ]);

            return [null, false];
        }
    }

    private function recover(SubscriptionCheckoutService $checkout, MonthlyCharge $sub, $session, bool $dryRun): int
    {
        if ($dryRun) {
            $this->line("  would recover #{$sub->id} (user {$sub->user_id}) — session completed");

            return 1;
        }

        if (($session->mode ?? null) !== 'setup') {
            // A subscription-mode session is finished by the MonthlyCharge webhook
            // handlers keyed on `stripe_id`; this sweep has no business in it.
            return 0;
        }

        if (! $checkout->completeSetupCheckout($sub, $session, 'reconcile')) {
            return 0;
        }

        if ($sub->user) {
            $checkout->activateIfAlreadySelling($sub->user, $sub->fresh());
        }

        Log::warning('ReconcileSubscriptionCheckouts: recovered a card the redirect never recorded', [
            'monthly_charge_id' => $sub->id,
            'user_id' => $sub->user_id,
        ]);

        return 1;
    }

    private function close(SubscriptionCheckoutService $checkout, MonthlyCharge $sub, string $reason, bool $dryRun): int
    {
        if ($dryRun) {
            $this->line("  would close #{$sub->id} (user {$sub->user_id}) — {$reason}");

            return 1;
        }

        return $checkout->markDead($sub, $reason) ? 1 : 0;
    }

    /**
     * One reminder per checkout, claimed on the row id.
     *
     * ⚠️ Keyed on the CHECKOUT, not on the creator. A creator who abandons twice has
     * two different unfinished checkouts and should hear about the second one; a
     * per-creator key would silence it forever after the first.
     */
    private function remind(MonthlyCharge $sub, $session, bool $dryRun): int
    {
        $user = $sub->user;
        $url = $session->url ?? null;

        // Nothing to send them back to, and nobody to send it to.
        if (! $user || empty($url)) {
            return 0;
        }

        if ($dryRun) {
            $this->line("  would remind user {$user->id} about checkout #{$sub->id}");

            return 1;
        }

        if (! NotificationDispatcher::claim($user->id, 'subscription_checkout', "checkout:{$sub->id}")) {
            return 0;
        }

        try {
            NotificationDispatcher::queue(
                $user,
                'subscription_checkout',
                [
                    'title' => FinishAddingYourCard::subjectLine(),
                    'body' => 'Your card was not saved, so your account cannot take payments yet. Nothing is charged today.',
                    'url' => $url,
                    'module' => 'subscription',
                    'mailable' => FinishAddingYourCard::class,
                    'mailable_args' => [
                        'userId' => $user->id,
                        'creatorName' => $user->name ?: ($user->username ?? 'there'),
                        'checkoutUrl' => (string) $url,
                    ],
                ],
                $this->channelsFor($user),
                // Operational: this is the state of the creator's own account and the
                // thing blocking them from selling, so it does not go through the
                // marketing consent gate. The email channel is still dropped below
                // when they have opted out of creator updates.
                false
            );

            return 1;
        } catch (\Throwable $e) {
            // Release the claim, or one transient blip permanently drops this
            // creator's only reminder about this checkout — silently.
            EngagementNotification::where('user_id', $user->id)
                ->where('type', 'subscription_checkout')
                ->where('dedup_key', "checkout:{$sub->id}")
                ->delete();

            Log::warning('ReconcileSubscriptionCheckouts: reminder failed: '.$e->getMessage(), [
                'monthly_charge_id' => $sub->id,
            ]);

            return 0;
        }
    }

    /** @return array<int, string> */
    private function channelsFor($user): array
    {
        $channels = [NotificationDispatcher::CHANNEL_BELL, NotificationDispatcher::CHANNEL_PUSH];

        // Missing or null always means opted IN, as everywhere else on the platform.
        if ($user->creator_updates_enabled ?? true) {
            $channels[] = NotificationDispatcher::CHANNEL_EMAIL;
        }

        return $channels;
    }
}
