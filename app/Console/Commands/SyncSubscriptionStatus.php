<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\MonthlyCharge;
use App\Services\UserProfileService;
use Illuminate\Console\Command;
use Stripe\Stripe;
use Stripe\Subscription;
use Stripe\Invoice;
use Carbon\Carbon;

class SyncSubscriptionStatus extends Command
{
    protected $signature = 'subscription:sync {--user_id=} {--all} {--dry-run}';
    protected $description = 'Sync subscription status from Stripe to local database';

    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        parent::__construct();
        $this->userProfileService = $userProfileService;
    }

    public function handle()
    {
        $this->info('🔄 Starting subscription sync...');
        
        $stripeKey = env('STRIPE_SECRET_KEY');
        if (!$stripeKey) {
            $this->error('STRIPE_SECRET_KEY is not set.');
            return 1;
        }
        Stripe::setApiKey($stripeKey);
        
        $query = User::where('role', 1); // Only creators
        
        if ($this->option('user_id')) {
            $query->where('id', $this->option('user_id'));
        } elseif (!$this->option('all')) {
            // OPTIMIZATION: Instead of syncing everyone every time, 
            // focus on users who actually have something to check.
            $query->where(function($q) {
                // 1. Users with active local records that might need renewal/expiry check
                $q->whereHas('creatorMonthlySubscription', function($sq) {
                    $sq->whereIn('status', ['paid', 'active', 'renew', 'trialing']);
                })
                // 2. OR users who were recently active on the platform (last 2 days)
                ->orWhere('updated_at', '>=', now()->subDays(2))
                // 3. OR users with a stripe_id but NO local record (missing data fix)
                ->orWhere(function($sq) {
                    $sq->whereNotNull('stripe_id')
                       ->whereDoesntHave('creatorMonthlySubscription');
                });
            });
        }
        
        $users = $query->with('creatorMonthlySubscription')->get();
        
        $this->info("📊 Found {$users->count()} creators to sync");
        
        $updated = 0;
        $errors = 0;
        
        foreach ($users as $user) {
            try {
                if ($this->option('dry-run')) {
                    $this->line("🔍 Dry-run: checking {$user->username} (ID: {$user->id})");
                    continue;
                }

                $stripeSub = $this->userProfileService->syncUserSubscription($user);
                
                if ($stripeSub) {
                    $updated++;
                    $this->line("✅ {$user->username} (ID: {$user->id}) - Synced (Status: {$stripeSub->status})");
                } else {
                    $this->line("⚪ {$user->username} (ID: {$user->id}) - No active subscription found or synced");
                }
            } catch (\Exception $e) {
                $errors++;
                $this->error("❌ {$user->username} (ID: {$user->id}) - Error: {$e->getMessage()}");
            }
        }
        
        $this->info("🎯 Sync complete: {$updated} processed, {$errors} errors");
        return 0;
    }
}
