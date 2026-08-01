<?php

namespace App\Console\Commands;

use App\Models\FinancialTransaction;
use App\Models\MonthlyCharge;
use App\Models\User;
use App\Services\CreatorJourneyService;
use App\Services\SubscriptionActivationService;
use App\StripeControl;
use App\Support\SubscriptionPlan;
use Illuminate\Console\Command;

/**
 * Puts a creator account into a named state for testing the free-until-first-sale
 * flow and the identity-before-listing gate.
 *
 * Both features need the account reset repeatedly — subscribe, check, wipe, repeat —
 * and doing that by hand across `users`, `monthly_charges` and `financial_transactions`
 * is where a mis-set flag quietly invalidates the whole test.
 *
 * ⚠️ local/testing only. It writes states the real flow would never produce (a
 * subscription with no Stripe object behind it, a sale with no payment), which is
 * exactly why it must never be reachable anywhere else.
 */
class PrepareCreatorTestState extends Command
{
    protected $signature = 'creator:test-state
        {email : The creator account to prepare}
        {state=fresh : fresh|subscribed|sold|unverified|reset}
        {--show : Print the resulting state and change nothing}
        {--force : Skip the confirmation before deleting existing subscription rows}';

    protected $description = '[local only] Put a creator account into a known state for testing';

    /** Tags rows this command created so a reset removes only its own. */
    private const MARKER = 'creator-test-state';

    private const STATES = ['fresh', 'subscribed', 'sold', 'unverified', 'reset'];

    public function handle(): int
    {
        if (! app()->environment('local', 'testing')) {
            $this->error('Refusing to run outside local/testing.');

            return self::FAILURE;
        }

        $creator = User::where('email', $this->argument('email'))->first();

        if (! $creator) {
            $this->error("No account found for {$this->argument('email')}.");

            return self::FAILURE;
        }

        $state = $this->argument('state');

        if (! in_array($state, self::STATES, true)) {
            $this->error('Unknown state. Use one of: '.implode(', ', self::STATES));

            return self::FAILURE;
        }

        if ($this->option('show')) {
            $this->report($creator);

            return self::SUCCESS;
        }

        // ⚠️ This HARD-DELETES the account's subscription history, and the local
        // database is routinely a dump of real data — a mistyped email would
        // destroy a genuine creator's monthly_charges rows with nothing to undo
        // it. Say what is about to go and make the operator confirm.
        $chargeCount = MonthlyCharge::where('user_id', $creator->id)->count();

        if ($chargeCount > 0 && ! $this->option('force')) {
            $this->warn("This will permanently delete {$chargeCount} monthly_charges row(s) for {$creator->email} (#{$creator->id}).");

            if (! $this->confirm('Continue?', false)) {
                $this->info('Aborted; nothing changed.');

                return self::SUCCESS;
            }
        }

        // ⚠️ Cancel on STRIPE first, not just locally.
        //
        // UserProfileService::syncUserSubscription searches Stripe by customer id
        // and by email, so a subscription left alive there is found again on the
        // next checkout attempt and the flow returns "Your subscription was
        // synchronized" without ever reaching the new checkout. Deleting the local
        // row alone makes the account look reset while it is not.
        $this->cancelOnStripe($creator);

        // Every state starts from a clean slate so a previous run cannot leak into
        // the next one — a leftover monthly_charges row is the difference between
        // "free period" and "already billing".
        MonthlyCharge::where('user_id', $creator->id)->forceDelete();

        // Only rows this command created. A creator's real earnings are never
        // touched, so a reset cannot silently change what they are owed.
        FinancialTransaction::where('user_id', $creator->id)
            ->where('description', self::MARKER)
            ->forceDelete();

        // Common baseline: an approved creator who can reach the subscription screen.
        // Without profile approval the flow stops long before anything under test.
        $creator->forceFill([
            'role' => 1,
            'avatar_approved' => 1,
            'bio_approved' => 1,
            'profile_status_lock' => 2,
            'suspended_account' => 0,
            'is_subscribed' => 0,
            'identity_status' => 1,
        ]);

        // Written as plain branches, not a match expression. The match arms here
        // exist for their side effects, and an earlier `?? $this->recordSale()`
        // arm combined with the follow-up `if` recorded the sale TWICE — two
        // income rows for one "first sale", which is exactly the sort of thing a
        // test fixture must not quietly invent.
        if ($state === 'subscribed' || $state === 'sold') {
            // Card on file, parked free period: they should be able to list and
            // take payments while being charged nothing.
            $this->parkSubscription($creator);
        }

        if ($state === 'sold') {
            // `subscription:activate-on-sale` should pick this creator up next run.
            $this->recordSale($creator);
        }

        if ($state === 'unverified') {
            // The six item-create routes should refuse.
            $creator->forceFill(['identity_status' => 0]);
        }

        if ($state === 'reset') {
            // A genuinely untouched creator — including the avatar flag the shared
            // baseline above sets, which an earlier version left approved and so
            // never actually returned the account to its starting state.
            $creator->forceFill([
                'identity_status' => 0,
                'profile_status_lock' => 0,
                'bio_approved' => 0,
                'avatar_approved' => 0,
            ]);
        }

        // 'fresh' needs nothing beyond the baseline: approved, no subscription,
        // no sales — the "add your card, pay nothing" screen.

        $creator->save();

        $this->info("Set {$creator->email} to '{$state}'.");
        $this->report($creator->fresh());

        return self::SUCCESS;
    }

    /**
     * Cancel any platform subscription this creator has on Stripe.
     *
     * Test-only, and deliberately noisy about failures rather than silent: an
     * account that looks reset but is not wastes far more time than an error here.
     */
    private function cancelOnStripe(User $creator): void
    {
        $ids = MonthlyCharge::where('user_id', $creator->id)
            ->whereNotNull('stripe_id')
            ->pluck('stripe_id')
            ->unique()
            ->filter(fn ($id) => str_starts_with((string) $id, 'sub_'))
            // Rows this command itself created carry a fake id that Stripe has
            // never heard of.
            ->reject(fn ($id) => str_contains((string) $id, 'localtest'));

        foreach ($ids as $id) {
            try {
                StripeControl::cancelSubscription($id, false);
                $this->line("  cancelled {$id} on Stripe");
            } catch (\Throwable $e) {
                // Already gone is the common case and is fine.
                $this->warn("  could not cancel {$id}: {$e->getMessage()}");
            }
        }
    }

    private function parkSubscription(User $creator): null
    {
        MonthlyCharge::create([
            'user_id' => $creator->id,
            'name' => $creator->name,
            'email' => $creator->email,
            'currency' => SubscriptionPlan::currency(),
            'amount' => SubscriptionPlan::price(),
            'tax' => SubscriptionPlan::vat(),
            'status' => 'trialing',
            // ⚠️ Not a real Stripe subscription. Everything up to the Stripe call
            // behaves correctly; `subscription:activate-on-sale` will select this
            // creator and then fail at Stripe, which is the expected outcome here.
            'stripe_id' => 'sub_localtest_'.$creator->id,
            'current_start_trial_date' => now(),
            'current_end_trial_date' => now()->addDays(SubscriptionPlan::freePeriodDays()),
        ]);

        return null;
    }

    private function recordSale(User $creator): null
    {
        FinancialTransaction::create([
            'user_id' => $creator->id,
            'type' => 'income',
            'status' => 'completed',
            'gross_amount' => 20,
            'net_amount' => 16,
            'currency' => 'GBP',
            'transaction_date' => now(),
            'description' => self::MARKER,
        ]);

        return null;
    }

    private function report(User $creator): void
    {
        $service = app(SubscriptionActivationService::class);
        $subscription = $service->pendingSubscription($creator);

        $this->table(['Field', 'Value'], [
            ['email', $creator->email],
            ['username', $creator->username],
            ['profile approved', $creator->profile_status_lock == 2 ? 'yes' : 'NO'],
            ['identity_status', $creator->identity_status.($creator->identity_status == 1 ? ' (verified)' : ' (can NOT list)')],
            ['stripe_details_submitted', $creator->stripe_details_submitted],
            ['subscription_status', $creator->subscription_status],
            ['free period row', $subscription ? "#{$subscription->id} ({$subscription->stripe_id})" : 'none'],
            ['has ever sold', $service->hasEverMadeSale($creator) ? 'yes' : 'no'],
            ['due for activation', $service->shouldActivate($creator) ? 'YES' : 'no'],
            ['journey step', app(CreatorJourneyService::class)->currentStep($creator)],
        ]);
    }
}
