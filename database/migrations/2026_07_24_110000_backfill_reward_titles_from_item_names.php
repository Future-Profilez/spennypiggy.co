<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

/**
 * Give every existing listing a reward headline that means something.
 *
 * The reward contract migration backfilled "Exclusive reward" so nothing
 * rendered blank, but that is a placeholder: with it, every legacy listing on
 * the platform tells a buyer the same non-answer at checkout, on the receipt
 * and in the Stripe record.
 *
 * The item's own name is a far better description of what is being sold, and
 * it is what the creator already wrote. Only rows still carrying the
 * placeholder are touched — anything a creator has since filled in is left
 * alone.
 *
 * The rewrite runs in PHP rather than SQL: LEFT()/CONCAT()/SUBSTRING() are
 * MySQL spellings that do not exist in the sqlite test database, and a
 * migration that only runs on one driver breaks every test that touches the
 * schema.
 */
return new class extends Migration
{
    private const PLACEHOLDER = 'Exclusive reward';

    /** table => column holding the creator's own name for the item. */
    private const SOURCES = [
        'wish_items' => 'wishname',
        'bills' => 'name',
        'shops' => 'name',
        'tasks' => 'title',
        'piggy_pots' => 'title',
        'tip_goals' => 'name',
        // A membership's `level` is 'gold'/'lifetime' — a tier, not a
        // description — so it is expanded into a sentence below.
        'memberships' => 'level',
    ];

    public function up(): void
    {
        foreach (self::SOURCES as $table => $column) {
            if (! Schema::hasTable($table)
                || ! Schema::hasColumn($table, 'reward_title')
                || ! Schema::hasColumn($table, $column)) {
                continue;
            }

            DB::table($table)
                ->select(['id', $column])
                ->where('reward_title', self::PLACEHOLDER)
                ->orderBy('id')
                ->chunkById(500, function ($rows) use ($table, $column) {
                    foreach ($rows as $row) {
                        $name = trim((string) ($row->{$column} ?? ''));

                        if ($name === '') {
                            continue;
                        }

                        if ($table === 'memberships') {
                            $name = Str::ucfirst($name).' membership';
                        }

                        DB::table($table)
                            ->where('id', $row->id)
                            ->update(['reward_title' => Str::limit($name, 60, '')]);
                    }
                });
        }
    }

    public function down(): void
    {
        // Restoring the placeholder would be a worse description than the name
        // now stored, and the original value is not recoverable per row.
    }
};
