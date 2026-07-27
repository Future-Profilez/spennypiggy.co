<?php

namespace Database\Seeders;

use App\Models\SubscriptionEvent;
use App\Models\WishItemSubscription;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class UpdateExistingSubscriptionsSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        $this->command->info('Updating existing subscription data...');

        // Get all existing subscriptions
        $subscriptions = WishItemSubscription::all();

        foreach ($subscriptions as $subscription) {
            // Determine Stripe status based on existing data
            $stripeStatus = 'active';
            if ($subscription->status !== 'paid') {
                $stripeStatus = 'incomplete';
            } elseif ($subscription->recurring_for === 'onetime') {
                // Check if one-time subscription is still within 30-day period
                if ($subscription->created_at->lessThan(Carbon::now()->subDays(30))) {
                    $stripeStatus = 'canceled';
                }
            } elseif ($subscription->upcoming_payment && $subscription->upcoming_payment->lessThan(Carbon::now())) {
                // If upcoming payment is in the past, might be past due
                $stripeStatus = 'past_due';
            }

            // Set period dates
            $currentPeriodStart = $subscription->created_at;
            $currentPeriodEnd = $subscription->upcoming_payment ?: Carbon::parse($subscription->created_at)->addMonth();

            // Update subscription with new fields
            $subscription->update([
                'stripe_status' => $stripeStatus,
                'cancel_at_period_end' => false,
                'current_period_start' => $currentPeriodStart,
                'current_period_end' => $currentPeriodEnd,
                'canceled_at' => null,
                'ended_at' => $stripeStatus === 'canceled' ? $currentPeriodEnd : null,
                'stripe_metadata' => [],
                'trial_start' => null,
                'trial_end' => null,
            ]);

            // Create initial subscription event
            SubscriptionEvent::create([
                'subscription_type' => 'wish_item',
                'subscription_id' => $subscription->id,
                'stripe_subscription_id' => $subscription->stripe_id,
                'event_type' => 'created',
                'event_status' => 'processed',
                'amount' => $subscription->amount,
                'currency' => $subscription->currency,
                'event_date' => $subscription->created_at,
                'notes' => 'Initial subscription creation event',
            ]);

            // If subscription is paid, add a payment success event
            if ($subscription->status === 'paid') {
                SubscriptionEvent::create([
                    'subscription_type' => 'wish_item',
                    'subscription_id' => $subscription->id,
                    'stripe_subscription_id' => $subscription->stripe_id,
                    'event_type' => 'payment_succeeded',
                    'event_status' => 'processed',
                    'amount' => $subscription->amount,
                    'currency' => $subscription->currency,
                    'event_date' => $subscription->created_at->addMinutes(1),
                    'notes' => 'Initial payment for subscription',
                ]);
            }

            $itemName = $subscription->wish_item ? $subscription->wish_item->wishname : 'Unknown Item';
            $this->command->info("Updated subscription {$subscription->id} for {$itemName}");
        }

        $this->command->info("Updated {$subscriptions->count()} subscriptions with new tracking data.");
    }
}
