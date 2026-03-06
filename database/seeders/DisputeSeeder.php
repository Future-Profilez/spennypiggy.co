<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Dispute;
use App\Models\User;
use App\Models\Payment;
use App\Models\RiskIdentity;
use Illuminate\Support\Str;

class DisputeSeeder extends Seeder
{
    public function run(): void
    {
        // Find a test creator user (e.g., the one logged in)
        // Adjust the email to match your logged-in user if known, or pick the first creator
        $creator = User::where('email', 'creator_test@spennypiggy.co')->first() ?? User::where('role', 1)->first();

        if (!$creator) {
            $this->command->error("No creator found to seed disputes for.");
            return;
        }

        $this->command->info("Seeding disputes for creator: {$creator->email} ({$creator->uuid})");

        // Create a dummy RiskIdentity
        $riskIdentity = RiskIdentity::create([
            'card_fingerprint' => 'test_card_' . Str::random(10),
            'email_hash' => hash('sha256', 'test@example.com'),
            'ip_hash' => hash('sha256', '127.0.0.1'),
            'is_guest' => true,
            'trust_tier' => 1, // Using integer 1 for 'trusted'
        ]);

        // Create a dummy payment if none exist
        $payment = Payment::create([
            'creator_id' => $creator->uuid, // Using UUID as per schema
            'risk_identity_id' => $riskIdentity->id,
            'amount' => 5000, // £50.00
            'currency' => 'gbp',
            'status' => 'succeeded',
            'stripe_payment_intent_id' => 'pi_test_' . Str::random(10),
        ]);

        // 1. Action Required Dispute
        Dispute::create([
            'id' => Str::uuid(),
            'creator_id' => $creator->uuid,
            'payment_id' => $payment->id,
            'stripe_dispute_id' => 'dp_test_' . Str::random(10),
            'amount' => 5000,
            'currency' => 'gbp',
            'reason' => 'product_not_received',
            'status' => 'needs_response',
            'evidence_due_by' => now()->addDays(7),
            'evidence_status' => 'missing',
            'created_at' => now()->subDays(2),
        ]);

        // 2. Under Review Dispute
        Dispute::create([
            'id' => Str::uuid(),
            'creator_id' => $creator->uuid,
            'payment_id' => $payment->id,
            'stripe_dispute_id' => 'dp_test_' . Str::random(10),
            'amount' => 2500,
            'currency' => 'gbp',
            'reason' => 'fraudulent',
            'status' => 'under_review',
            'evidence_due_by' => now()->subDays(1),
            'evidence_status' => 'submitted',
            'evidence_details' => ['explanation' => 'User logged in from known IP.'],
            'created_at' => now()->subDays(10),
        ]);

        // 3. Won Dispute
        Dispute::create([
            'id' => Str::uuid(),
            'creator_id' => $creator->uuid,
            'payment_id' => $payment->id,
            'stripe_dispute_id' => 'dp_test_' . Str::random(10),
            'amount' => 1000,
            'currency' => 'usd',
            'reason' => 'subscription_canceled',
            'status' => 'won',
            'evidence_status' => 'submitted',
            'resolved_at' => now()->subDays(5),
            'created_at' => now()->subDays(30),
        ]);

        $this->command->info("Seeded 3 disputes.");
    }
}
