<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Unified reward contract (24 July 2026).
 *
 * Every paid item now states, in the same shape, WHAT the supporter receives:
 *
 *   reward_title        headline shown on the card, checkout, receipt and
 *                       thank-you page ("Weekly studio drops")
 *   reward_type         file | message | link | bundle
 *   reward_body         the message text, or the link URL
 *   reward_description  optional supporting line
 *
 * The existing per-module file columns (wish_items.content_file,
 * shops.reward_file, tasks.deliverable_content, piggy_pots.content_file …)
 * stay exactly as they are — this is a layer on top, not a replacement, so
 * nothing that reads them today changes behaviour.
 *
 * Recurring items (bills, memberships) additionally gain the pieces they were
 * missing entirely: bills had no perks list and memberships had no content
 * file, which is why neither had anything to show a supporter at the moment
 * of purchase.
 *
 * Existing rows are backfilled with "Exclusive reward" so no legacy listing
 * renders an empty reward block. App\Services\RewardService applies the same
 * fallback at read time as a second line of defence.
 */
return new class extends Migration
{
    /** Tables that receive the four shared reward columns, with their anchor column. */
    private const TABLES = [
        'wish_items' => 'content_file_size',
        'bills' => 'content_file',
        'memberships' => 'rewards',
        'shops' => 'reward_file',
        'tasks' => 'deliverable_note',
        'piggy_pots' => 'content_description',
        'tip_goals' => 'description',
    ];

    private const SHARED_COLUMNS = ['reward_title', 'reward_type', 'reward_body', 'reward_description'];

    public function up(): void
    {
        foreach (self::TABLES as $table => $after) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $after) {
                $anchor = Schema::hasColumn($table, $after) ? $after : null;

                if (! Schema::hasColumn($table, 'reward_title')) {
                    $column = $blueprint->string('reward_title', 60)->nullable();
                    if ($anchor) {
                        $column->after($anchor);
                    }
                }

                if (! Schema::hasColumn($table, 'reward_type')) {
                    $blueprint->string('reward_type', 20)->nullable();
                }

                if (! Schema::hasColumn($table, 'reward_body')) {
                    $blueprint->text('reward_body')->nullable();
                }

                if (! Schema::hasColumn($table, 'reward_description')) {
                    $blueprint->text('reward_description')->nullable();
                }
            });
        }

        // A Bill sells ONE recurring content stream, so it gains the file
        // metadata for its welcome reward but deliberately NO perks list — the
        // perks bundle is what makes a Membership a different product.
        if (Schema::hasTable('bills')) {
            Schema::table('bills', function (Blueprint $table) {
                $this->addFileMetaColumns($table, 'bills');
            });
        }

        // Memberships had no content file whatsoever — only perk checkboxes.
        if (Schema::hasTable('memberships')) {
            Schema::table('memberships', function (Blueprint $table) {
                if (! Schema::hasColumn('memberships', 'content_file')) {
                    $table->string('content_file')->nullable();
                }
                $this->addFileMetaColumns($table, 'memberships');
            });
        }

        $this->backfillTitles();
    }

    public function down(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table) {
                foreach (self::SHARED_COLUMNS as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $blueprint->dropColumn($column);
                    }
                }
            });
        }

        foreach (['bills' => [], 'memberships' => ['content_file']] as $table => $extra) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $blueprint) use ($table, $extra) {
                foreach (array_merge($extra, ['content_file_type', 'content_file_name', 'content_file_size']) as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $blueprint->dropColumn($column);
                    }
                }
            });
        }
    }

    private function addFileMetaColumns(Blueprint $table, string $name): void
    {
        if (! Schema::hasColumn($name, 'content_file_type')) {
            $table->string('content_file_type')->nullable();
        }

        if (! Schema::hasColumn($name, 'content_file_name')) {
            $table->string('content_file_name')->nullable();
        }

        if (! Schema::hasColumn($name, 'content_file_size')) {
            $table->bigInteger('content_file_size')->nullable();
        }
    }

    private function backfillTitles(): void
    {
        foreach (array_keys(self::TABLES) as $table) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, 'reward_title')) {
                continue;
            }

            DB::table($table)
                ->whereNull('reward_title')
                ->orWhere('reward_title', '')
                ->update(['reward_title' => 'Exclusive reward']);
        }
    }
};
