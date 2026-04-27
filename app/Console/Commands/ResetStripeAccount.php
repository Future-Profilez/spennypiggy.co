<?php

namespace App\Console\Commands;

use App\Models\User;
use App\StripeControl;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ResetStripeAccount extends Command
{
    protected $signature = 'stripe:reset-account
                            {identifier : User ID, email, or username}
                            {--delete-stripe : Also delete the Stripe account (cannot be undone)}
                            {--force : Skip confirmation prompt}';

    protected $description = 'Reset a user\'s Stripe account connection so they can reconnect with the correct country';

    public function handle()
    {
        $identifier = $this->argument('identifier');

        // Find user by ID, email, or username
        $user = User::where('id', $identifier)
            ->orWhere('email', $identifier)
            ->orWhere('username', $identifier)
            ->first();

        if (!$user) {
            $this->error("No user found for: {$identifier}");
            return 1;
        }

        $this->info("Found user: {$user->username} (ID: {$user->id}, Email: {$user->email})");
        $this->info("Current account_id: " . ($user->account_id ?? 'none'));
        $this->info("Current country:    " . ($user->country ?? 'none'));
        $this->info("stripe_details_submitted: " . $user->stripe_details_submitted);

        if (empty($user->account_id)) {
            $this->warn("This user has no Stripe account_id set. Nothing to reset.");
            return 0;
        }

        if (!$this->option('force') && !$this->confirm("Reset this user's Stripe connection? They will need to reconnect with the correct country.")) {
            $this->info("Aborted.");
            return 0;
        }

        $oldAccountId = $user->account_id;

        // Optionally delete the Stripe account
        if ($this->option('delete-stripe')) {
            if (!$this->option('force') && !$this->confirm("Also DELETE the Stripe account {$oldAccountId}? This cannot be undone.")) {
                $this->info("Skipping Stripe account deletion.");
            } else {
                try {
                    $stripeClient = StripeControl::getClient();
                    $stripeClient->accounts->delete($oldAccountId);
                    $this->info("Stripe account {$oldAccountId} deleted.");
                    Log::info('Stripe account deleted via admin command', [
                        'user_id' => $user->id,
                        'account_id' => $oldAccountId,
                    ]);
                } catch (\Exception $e) {
                    $this->warn("Could not delete Stripe account: " . $e->getMessage());
                    $this->warn("Continuing with DB reset anyway.");
                }
            }
        }

        // Clear the Stripe fields from the user record
        $user->account_id = null;
        $user->country = null;
        $user->stripe_details_submitted = 0;
        $user->save();

        Log::info('Stripe account reset via admin command', [
            'user_id' => $user->id,
            'username' => $user->username,
            'old_account_id' => $oldAccountId,
        ]);

        $this->info("Done. User's Stripe connection has been reset.");
        $this->info("They can now visit /stripe/authorize and select the correct country.");

        return 0;
    }
}
