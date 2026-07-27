<?php

namespace App\Console\Commands;

use App\Http\Controllers\Auth\StripeController;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MigrateStripeServiceAgreements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stripe:migrate-service-agreements 
                          {--dry-run : Show what would be migrated without making changes}
                          {--country= : Only migrate accounts from specific country (e.g., IT)}
                          {--user-id= : Only migrate specific user ID}
                          {--limit=50 : Maximum number of accounts to process in one run}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migrate existing Stripe accounts from full to recipient service agreement for cross-border payment compatibility';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $countryFilter = $this->option('country');
        $userIdFilter = $this->option('user-id');
        $limit = (int) $this->option('limit');

        $this->info('🔄 Starting Stripe Service Agreement Migration');
        $this->info('============================================');

        if ($dryRun) {
            $this->warn('🧪 DRY RUN MODE - No changes will be made');
        }

        // Build query
        $query = User::whereNotNull('account_id')
            ->whereNotNull('country');

        if ($countryFilter) {
            $query->where('country', strtoupper($countryFilter));
            $this->info("📍 Filtering by country: {$countryFilter}");
        }

        if ($userIdFilter) {
            $query->where('id', $userIdFilter);
            $this->info("👤 Processing specific user ID: {$userIdFilter}");
        }

        $users = $query->limit($limit)->get();

        $this->info("📊 Found {$users->count()} users with Stripe accounts to check");
        $this->newLine();

        $stats = [
            'checked' => 0,
            'needs_migration' => 0,
            'migrated_successfully' => 0,
            'migration_failed' => 0,
            'no_migration_needed' => 0,
            'errors' => 0,
        ];

        $needsMigrationAccounts = [];

        // First pass: Check which accounts need migration
        $this->info('🔍 Phase 1: Checking accounts for migration needs...');
        $progressBar = $this->output->createProgressBar($users->count());

        foreach ($users as $user) {
            $stats['checked']++;

            try {
                $migrationCheck = StripeController::checkAccountMigrationNeeds($user);

                if ($migrationCheck['needs_migration']) {
                    $stats['needs_migration']++;
                    $needsMigrationAccounts[] = [
                        'user' => $user,
                        'check_result' => $migrationCheck,
                    ];
                } else {
                    $stats['no_migration_needed']++;
                }

            } catch (\Exception $e) {
                $stats['errors']++;
                $this->error("❌ Error checking user {$user->id}: ".$e->getMessage());
                Log::error('Migration check failed', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Show summary of what needs migration
        $this->info('📋 Migration Assessment Summary:');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Accounts Checked', $stats['checked']],
                ['Need Migration', $stats['needs_migration']],
                ['Already Correct', $stats['no_migration_needed']],
                ['Check Errors', $stats['errors']],
            ]
        );

        if (empty($needsMigrationAccounts)) {
            $this->info('✅ No accounts need migration!');

            return;
        }

        // Show details of accounts that need migration
        $this->info('🎯 Accounts requiring migration:');
        $migrationTable = [];
        foreach ($needsMigrationAccounts as $item) {
            $user = $item['user'];
            $check = $item['check_result'];
            $migrationTable[] = [
                $user->id,
                $user->username ?? 'N/A',
                $check['country'] ?? 'N/A',
                $check['current_agreement'] ?? 'N/A',
                $check['required_agreement'] ?? 'N/A',
                $check['charges_enabled'] ? '✅' : '❌',
            ];
        }

        $this->table(
            ['User ID', 'Username', 'Country', 'Current', 'Required', 'Charges OK'],
            $migrationTable
        );

        if ($dryRun) {
            $this->info('🧪 DRY RUN: Would migrate '.count($needsMigrationAccounts).' accounts');

            return;
        }

        // Ask for confirmation unless it's a single user
        if (! $userIdFilter && ! $this->confirm('🚀 Proceed with migrating '.count($needsMigrationAccounts).' accounts?')) {
            $this->info('❌ Migration cancelled');

            return;
        }

        // Phase 2: Perform migrations
        $this->info('⚡ Phase 2: Performing migrations...');
        $migrationBar = $this->output->createProgressBar(count($needsMigrationAccounts));

        foreach ($needsMigrationAccounts as $item) {
            $user = $item['user'];

            try {
                $result = StripeController::migrateExistingAccount($user);

                if ($result['success']) {
                    $stats['migrated_successfully']++;
                    $this->line("✅ User {$user->id} ({$user->username}): {$result['message']}");
                } else {
                    $stats['migration_failed']++;
                    $this->error("❌ User {$user->id} ({$user->username}): {$result['message']}");
                }

            } catch (\Exception $e) {
                $stats['migration_failed']++;
                $this->error("💥 User {$user->id} migration exception: ".$e->getMessage());
                Log::error('Account migration exception', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }

            $migrationBar->advance();
        }

        $migrationBar->finish();
        $this->newLine(2);

        // Final summary
        $this->info('🎉 Migration Complete!');
        $this->table(
            ['Result', 'Count'],
            [
                ['Successfully Migrated', $stats['migrated_successfully']],
                ['Migration Failed', $stats['migration_failed']],
                ['Total Processed', count($needsMigrationAccounts)],
            ]
        );

        if ($stats['migrated_successfully'] > 0) {
            $this->warn('⚠️  Important: Migrated users will need to complete Stripe onboarding again');
            $this->info('💡 Tip: Notify affected creators about the account update');
        }
    }
}
