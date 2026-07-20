<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Composite indexes for the public discovery / homepage queries.
 *
 * DiscoveryService filters creators by (role, suspended_account, profile_status_lock)
 * and orders by id on every cache-miss + on every uncached search page. Eager-loaded
 * wishes filter by (user_id, is_approved). Without composites these do range scans;
 * the composites turn them into index seeks.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! $this->indexExists('users', 'idx_discovery_creators')) {
                $table->index(
                    ['role', 'suspended_account', 'profile_status_lock', 'id'],
                    'idx_discovery_creators'
                );
            }
        });

        Schema::table('wish_items', function (Blueprint $table) {
            if (! $this->indexExists('wish_items', 'idx_wishes_user_approved')) {
                $table->index(
                    ['user_id', 'is_approved', 'id'],
                    'idx_wishes_user_approved'
                );
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if ($this->indexExists('users', 'idx_discovery_creators')) {
                $table->dropIndex('idx_discovery_creators');
            }
        });

        Schema::table('wish_items', function (Blueprint $table) {
            if ($this->indexExists('wish_items', 'idx_wishes_user_approved')) {
                $table->dropIndex('idx_wishes_user_approved');
            }
        });
    }

    private function indexExists(string $table, string $index): bool
    {
        $connection = Schema::getConnection();

        // information_schema.statistics is MySQL-only; on sqlite (the test database)
        // query the sqlite_master catalog instead so the whole test suite can migrate.
        if ($connection->getDriverName() === 'sqlite') {
            return (bool) $connection->selectOne(
                "SELECT 1 FROM sqlite_master WHERE type = 'index' AND name = ? LIMIT 1",
                [$index]
            );
        }

        $dbName = $connection->getDatabaseName();

        return (bool) $connection->selectOne(
            'SELECT 1 FROM information_schema.statistics WHERE table_schema = ? AND table_name = ? AND index_name = ? LIMIT 1',
            [$dbName, $table, $index]
        );
    }
};
