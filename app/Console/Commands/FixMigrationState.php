<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class FixMigrationState extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'migrations:fix-state';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix migration state for tables that already exist but are not recorded';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Checking for existing tables that need migration state fixes...');

        // Get all existing table names
        $tables = Schema::getConnection()->getDoctrineSchemaManager()->listTableNames();
        
        // Define migrations that correspond to existing tables
        $problematic_migrations = [
            'bills' => '2024_01_01_000000_create_bills_table',
            'memberships' => '2024_01_02_000000_create_memberships_table',
            'shops' => '2024_01_03_000000_create_shops_table',
            'user_intros' => '2024_01_04_000000_create_user_intros_table',
            'posts' => '2024_01_05_000000_create_posts_table'
        ];

        // Get the next batch number
        $nextBatch = DB::table('migrations')->max('batch') + 1;
        
        $fixed = [];
        $skipped = [];

        foreach ($problematic_migrations as $tableName => $migrationName) {
            // Check if table exists
            if (in_array($tableName, $tables)) {
                // Check if migration is already recorded
                $exists = DB::table('migrations')
                    ->where('migration', $migrationName)
                    ->exists();
                
                if (!$exists) {
                    // Mark migration as completed
                    DB::table('migrations')->insert([
                        'migration' => $migrationName,
                        'batch' => $nextBatch
                    ]);
                    
                    $this->info("✓ Marked '{$migrationName}' as completed for existing table '{$tableName}'");
                    $fixed[] = $migrationName;
                } else {
                    $this->comment("- Migration '{$migrationName}' already recorded");
                    $skipped[] = $migrationName;
                }
            } else {
                $this->comment("- Table '{$tableName}' does not exist, skipping '{$migrationName}'");
                $skipped[] = $migrationName;
            }
        }

        if (count($fixed) > 0) {
            $this->info("\nFixed " . count($fixed) . " migration(s):");
            foreach ($fixed as $migration) {
                $this->line("  - {$migration}");
            }
        }

        if (count($skipped) > 0) {
            $this->comment("\nSkipped " . count($skipped) . " migration(s) (already recorded or table doesn't exist):");
            foreach ($skipped as $migration) {
                $this->line("  - {$migration}");
            }
        }

        $this->info("\nMigration state fix completed!");
        return 0;
    }
}
