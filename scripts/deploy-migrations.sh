#!/bin/bash

# Deployment migration script for Laravel Vapor
# This script fixes migration state issues before running migrations

echo "🚀 Starting migration deployment process..."

# Check if bills table exists but migration is not recorded
echo "🔍 Checking migration state..."

# Use PHP to check and fix migration state
php artisan tinker --execute="
// Get existing tables
\$tables = Schema::getConnection()->getDoctrineSchemaManager()->listTableNames();

// Define problematic migrations
\$migrations_to_fix = [
    'bills' => '2024_01_01_000000_create_bills_table',
    'memberships' => '2024_01_02_000000_create_memberships_table',
    'shops' => '2024_01_03_000000_create_shops_table',
    'user_intros' => '2024_01_04_000000_create_user_intros_table',
    'posts' => '2024_01_05_000000_create_posts_table'
];

\$next_batch = DB::table('migrations')->max('batch') + 1;
\$fixed_count = 0;

foreach(\$migrations_to_fix as \$table => \$migration) {
    // If table exists but migration is not recorded
    if(in_array(\$table, \$tables)) {
        \$exists = DB::table('migrations')->where('migration', \$migration)->exists();
        if(!\$exists) {
            DB::table('migrations')->insert([
                'migration' => \$migration,
                'batch' => \$next_batch
            ]);
            echo \"Fixed migration state for: \$migration\n\";
            \$fixed_count++;
        }
    }
}

echo \"Fixed \$fixed_count migrations\n\";
"

echo "✅ Migration state check completed"

# Now run the regular migrations
echo "📦 Running migrations..."
php artisan migrate --force

echo "🎉 Deployment migration process completed!"
