<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\MembershipPayment;
use App\Models\Deliverable;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class CreateMembershipDeliverables extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'membership:create-deliverables {--force : Force creation even if deliverables exist} {--limit= : Limit number of payments to process}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create deliverables for existing membership payments that don\'t have them yet';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $this->info('🎯 Creating deliverables for existing membership payments...');
        
        $force = $this->option('force');
        $limit = $this->option('limit') ? (int)$this->option('limit') : null;
        
        // Get membership payments that don't have deliverables yet
        $query = MembershipPayment::with('membership')
            ->where('status', 'paid')
            ->whereDoesntHave('deliverables', function ($q) {
                $q->where('product_type', 'membership');
            });
            
        if ($limit) {
            $query->limit($limit);
        }
            
        $membershipPayments = $query->get();
        
        if ($membershipPayments->isEmpty()) {
            $this->info('✅ No membership payments found that need deliverables.');
            return 0;
        }
        
        $this->info("📦 Found {$membershipPayments->count()} membership payments without deliverables.");
        
        $created = 0;
        $skipped = 0;
        $errors = 0;
        
        foreach ($membershipPayments as $membershipPayment) {
            try {
                $this->line("Processing payment {$membershipPayment->id} (Level: {$membershipPayment->membership->level})...");
                
                $deliverable = $this->createMembershipDeliverable($membershipPayment);
                
                if ($deliverable) {
                    $this->info("✅ Created deliverable {$deliverable->id} for payment {$membershipPayment->id}");
                    $created++;
                    
                    // Dispatch certificate generation job
                    \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable);
                    $this->line("   📜 Certificate generation job dispatched");
                } else {
                    $this->warn("⚠️  Failed to create deliverable for payment {$membershipPayment->id}");
                    $skipped++;
                }
                
            } catch (\Exception $e) {
                $this->error("❌ Error processing payment {$membershipPayment->id}: {$e->getMessage()}");
                $errors++;
                
                Log::error('CreateMembershipDeliverables: Failed to process payment', [
                    'payment_id' => $membershipPayment->id,
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        $this->info("\n🎉 Summary:");
        $this->info("   Created: {$created}");
        $this->info("   Skipped: {$skipped}");
        $this->info("   Errors: {$errors}");
        
        return 0;
    }
    
    /**
     * Create deliverable for membership payment (same logic as controller)
     */
    private function createMembershipDeliverable(MembershipPayment $membershipPayment)
    {
        try {
            $membership = $membershipPayment->membership;
            
            if (!$membership) {
                $this->warn("   No membership found for payment {$membershipPayment->id}");
                return null;
            }
            
            // Create deliverable entry for tracking (exactly like bills)
            $deliverable = Deliverable::create([
                'uuid' => Uuid::uuid4(),
                'product_id' => $membership->product_id ?? 'membership_' . $membership->id,
                'price_id' => $membership->price_id,
                'item_id' => $membership->id, // Add item_id for membership lookup
                'creator_id' => $membership->user_id,
                'gifter_id' => $membershipPayment->user_id,
                'payment_intent_id' => null, // We don't have original payment intent for existing payments
                'session_id' => $membershipPayment->session_id,
                'deliverable_type' => 'access', // Membership provides access, not a file
                'product_type' => 'membership',
                'transaction_amount' => $membershipPayment->amount,
                'customer_email' => $membershipPayment->guest_email,
                'customer_name' => $membershipPayment->guest_name,
                'payment_currency' => strtoupper($membershipPayment->currency ?? 'GBP'),
                'anonymous' => $membershipPayment->anonymous ?? false,
                'message' => $membershipPayment->surprise_message,
                'deliverable_url' => null, // Memberships don't have downloadable content
                'metadata' => json_encode([
                    'product_type' => 'membership',
                    'membership_id' => $membership->id,
                    'membership_name' => $membership->level . ' Membership Access',
                    'membership_level' => $membership->level,
                    'amount' => $membershipPayment->amount,
                    'currency' => $membershipPayment->currency,
                    'subscription_id' => $membershipPayment->stripe_id,
                    'recurring_type' => $membershipPayment->recurring_type,
                    'recurring_for' => $membershipPayment->recurring_for,
                    'anonymous' => $membershipPayment->anonymous,
                    'message' => $membershipPayment->surprise_message,
                    'guest_email' => $membershipPayment->guest_email,
                    'guest_name' => $membershipPayment->guest_name,
                    'members_only_access' => true, // Flag indicating this grants membership access
                    'subscription_active' => true,
                    'retroactive_creation' => true // Mark as retroactively created
                ]),
                'status' => 'delivered',
                'delivered_at' => $membershipPayment->created_at // Use original payment date
            ]);

            Log::info('Membership deliverable created retroactively', [
                'deliverable_id' => $deliverable->id,
                'membership_payment_id' => $membershipPayment->id,
                'membership_id' => $membership->id,
                'membership_level' => $membership->level
            ]);

            return $deliverable;

        } catch (\Exception $e) {
            Log::error('Failed to create retroactive membership deliverable', [
                'error' => $e->getMessage(),
                'membership_payment_id' => $membershipPayment->id ?? 'unknown',
                'membership_id' => $membershipPayment->membership->id ?? 'unknown'
            ]);
            
            throw $e;
        }
    }
}