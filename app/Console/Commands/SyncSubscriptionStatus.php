<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\MonthlyCharge;
use Illuminate\Console\Command;
use Stripe\Stripe;
use Stripe\Subscription;
use Stripe\Invoice;
use Carbon\Carbon;

class SyncSubscriptionStatus extends Command
{
    protected $signature = 'subscription:sync {--user_id=} {--all} {--dry-run}';
    protected $description = 'Sync subscription status from Stripe to local database';

    public function handle()
    {
        $this->info('🔄 Starting subscription sync...');
        
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
        
        $query = User::where('role', 1); // Only creators
        
        if ($this->option('user_id')) {
            $query->where('id', $this->option('user_id'));
        } elseif (!$this->option('all')) {
            // Default: sync users with MonthlyCharge records
            $query->whereHas('creatorMonthlySubscription');
        }
        
        $users = $query->with('creatorMonthlySubscription')->get();
        
        $this->info("📊 Found {$users->count()} creators to sync");
        
        $updated = 0;
        $errors = 0;
        
        foreach ($users as $user) {
            try {
                $result = $this->syncUserSubscription($user);
                if ($result) {
                    $updated++;
                    $this->line("✅ {$user->username} (ID: {$user->id}) - {$result}");
                } else {
                    $this->line("⚪ {$user->username} (ID: {$user->id}) - No changes needed");
                }
            } catch (\Exception $e) {
                $errors++;
                $this->error("❌ {$user->username} (ID: {$user->id}) - Error: {$e->getMessage()}");
            }
        }
        
        $this->info("🎯 Sync complete: {$updated} updated, {$errors} errors");
        return 0;
    }
    
    private function syncUserSubscription(User $user): ?string
    {
        $subscription = $user->creatorMonthlySubscription;
        
        if (!$subscription || !$subscription->stripe_id) {
            // No Stripe subscription, ensure user is marked as unsubscribed
            if ($user->is_subscribed == 1) {
                if (!$this->option('dry-run')) {
                    $user->update(['is_subscribed' => 0]);
                }
                return 'Marked as unsubscribed (no Stripe subscription)';
            }
            return null;
        }
        
        try {
            // Fetch from Stripe
            $stripeSubscription = Subscription::retrieve($subscription->stripe_id);
            
            // First, sync historical records from invoices
            $historicalChanges = $this->syncHistoricalRecords($user, $stripeSubscription);
            
            $now = Carbon::now();
            $isActive = false;
            $newStatus = 'inactive';
            $subscriptionStart = null;
            $subscriptionEnd = null;
            
            // Determine current status based on Stripe data
            switch ($stripeSubscription->status) {
                case 'active':
                    $isActive = true;
                    $newStatus = 'paid';
                    $subscriptionStart = Carbon::createFromTimestamp($stripeSubscription->current_period_start);
                    $subscriptionEnd = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
                    break;
                    
                case 'trialing':
                    $isActive = true;
                    $newStatus = 'trialing';
                    if ($stripeSubscription->trial_start && $stripeSubscription->trial_end) {
                        $subscriptionStart = Carbon::createFromTimestamp($stripeSubscription->trial_start);
                        $subscriptionEnd = Carbon::createFromTimestamp($stripeSubscription->trial_end);
                    }
                    break;
                    
                case 'canceled':
                case 'unpaid':
                case 'past_due':
                case 'incomplete':
                case 'incomplete_expired':
                    $isActive = false;
                    $newStatus = 'canceled';
                    break;
            }
            
            $changes = $historicalChanges;
            
            // Update user's is_subscribed field
            $shouldBeSubscribed = $isActive ? 1 : 0;
            if ($user->is_subscribed != $shouldBeSubscribed) {
                if (!$this->option('dry-run')) {
                    $user->update(['is_subscribed' => $shouldBeSubscribed]);
                }
                $changes[] = "is_subscribed: {$user->is_subscribed} → {$shouldBeSubscribed}";
            }
            
            // Check if we need to create/update current period record
            if ($subscriptionStart && $subscriptionEnd) {
                $currentPeriodChanges = $this->syncCurrentPeriod($user, $stripeSubscription, $newStatus, $subscriptionStart, $subscriptionEnd);
                $changes = array_merge($changes, $currentPeriodChanges);
            }
            
            if (!empty($changes)) {
                return implode(', ', $changes) . " (Stripe: {$stripeSubscription->status})";
            }
            
            return null;
            
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            if (strpos($e->getMessage(), 'No such subscription') !== false) {
                // Subscription doesn't exist in Stripe anymore
                if ($user->is_subscribed == 1) {
                    if (!$this->option('dry-run')) {
                        $user->update(['is_subscribed' => 0]);
                        $subscription->update(['status' => 'canceled']);
                    }
                    return 'Subscription not found in Stripe, marked as canceled';
                }
            }
            throw $e;
        }
    }
    
    /**
     * Sync historical records from Stripe invoices
     */
    private function syncHistoricalRecords(User $user, $stripeSubscription): array
    {
        $changes = [];
        
        try {
            // Get all invoices for this subscription
            $invoices = Invoice::all([
                'subscription' => $stripeSubscription->id,
                'limit' => 100
            ]);
            
            foreach ($invoices->data as $invoice) {
                if ($invoice->status === 'paid' && $invoice->period_start && $invoice->period_end) {
                    $periodStart = Carbon::createFromTimestamp($invoice->period_start);
                    $periodEnd = Carbon::createFromTimestamp($invoice->period_end);
                    
                    // Check if we already have a record for this period (more flexible date matching)
                    $existingRecord = MonthlyCharge::where('user_id', $user->id)
                        ->where('stripe_id', $stripeSubscription->id)
                        ->where('current_start_subscription_date', 'LIKE', $periodStart->toDateString() . '%')
                        ->where('current_end_subscription_date', 'LIKE', $periodEnd->toDateString() . '%')
                        ->first();
                    
                    if (!$existingRecord) {
                        // Create new record for this billing period
                        if (!$this->option('dry-run')) {
                            MonthlyCharge::create([
                                'user_id' => $user->id,
                                'stripe_id' => $stripeSubscription->id,
                                'amount' => $invoice->amount_paid / 100, // Convert from cents
                                'currency' => strtoupper($invoice->currency),
                                'status' => 'paid',
                                'current_start_subscription_date' => $periodStart,
                                'current_end_subscription_date' => $periodEnd,
                                'created_at' => Carbon::createFromTimestamp($invoice->created),
                                'updated_at' => Carbon::now()
                            ]);
                        }
                        
                        $changes[] = "Created record for period {$periodStart->format('M j')} - {$periodEnd->format('M j, Y')}";
                    }
                }
            }
            
        } catch (\Exception $e) {
            $this->warn("Could not fetch invoice history for {$user->username}: {$e->getMessage()}");
        }
        
        return $changes;
    }
    
    /**
     * Sync current subscription period
     */
    private function syncCurrentPeriod(User $user, $stripeSubscription, string $status, Carbon $periodStart, Carbon $periodEnd): array
    {
        $changes = [];
        
        // Find or create record for current period (more flexible date matching)
        $currentRecord = MonthlyCharge::where('user_id', $user->id)
            ->where('stripe_id', $stripeSubscription->id)
            ->where('current_start_subscription_date', 'LIKE', $periodStart->toDateString() . '%')
            ->where('current_end_subscription_date', 'LIKE', $periodEnd->toDateString() . '%')
            ->first();
        
        if (!$currentRecord) {
            // Create new record for current period
            if (!$this->option('dry-run')) {
                MonthlyCharge::create([
                    'user_id' => $user->id,
                    'stripe_id' => $stripeSubscription->id,
                    'amount' => 8.99, 
                    'tax' => 1.80, // 20% VAT
                    'currency' => 'GBP',
                    'status' => $status,
                    'current_start_subscription_date' => $periodStart,
                    'current_end_subscription_date' => $periodEnd,
                    'created_at' => $periodStart,
                    'updated_at' => Carbon::now()
                ]);
            }
            
            $changes[] = "Created current period record ({$periodStart->format('M j')} - {$periodEnd->format('M j, Y')})";
        } else {
            // Update existing record if status changed
            if ($currentRecord->status !== $status) {
                if (!$this->option('dry-run')) {
                    $currentRecord->update(['status' => $status]);
                }
                $changes[] = "Updated current period status: {$currentRecord->status} → {$status}";
            }
        }
        
        return $changes;
    }
}
