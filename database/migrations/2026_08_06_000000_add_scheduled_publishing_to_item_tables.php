<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scheduled publishing for the six sellable types.
 *
 * A creator could publish a listing now or not at all. There was no way to prepare a
 * product drop and have it appear at a set time, so a launch meant being at a keyboard
 * at the right minute.
 *
 *   publish_at            NULL = behave exactly as before (live as soon as approved).
 *                         A future timestamp = not visible to anyone but the owner yet.
 *   schedule_released_at  The publisher's idempotency claim, NOT an audit field — it is
 *                         what stops two runners both clearing caches and both telling
 *                         the creator their listing went live.
 *
 * ⚠️ `dateTime`, never `timestamp`. A TIMESTAMP NOT NULL column with no explicit default
 * is silently promoted by MySQL/MariaDB to `ON UPDATE CURRENT_TIMESTAMP`, so any later
 * UPDATE would rewrite the creator's chosen publish time to now. Same trap
 * `platform_activities.occurred_at` documents.
 */
return new class extends Migration
{
    /**
     * ⚠️ Task keys on `creator_id` and the rest on `user_id`, but that does not matter
     * here — every one of these tables gets the same two columns.
     */
    private const TABLES = ['wish_items', 'shops', 'tasks', 'piggy_pots', 'bills', 'memberships'];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                if (! Schema::hasColumn($table, 'publish_at')) {
                    // Indexed: the publisher sweeps on it every five minutes, and every
                    // public read of these tables now filters on it.
                    $blueprint->dateTime('publish_at')->nullable()->index();
                }

                if (! Schema::hasColumn($table, 'schedule_released_at')) {
                    $blueprint->dateTime('schedule_released_at')->nullable();
                }
            });
        }
    }

    public function down(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                foreach (['publish_at', 'schedule_released_at'] as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $blueprint->dropColumn($column);
                    }
                }
            });
        }
    }
};
