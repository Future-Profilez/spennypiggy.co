<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Scheduled posts.
 *
 * `scheduled_at` is the creator's INTENT — the moment the post should become
 * visible. It is also written to `created_at`, deliberately: every feed, sitemap
 * and cadence window on this platform orders and filters posts by `created_at`,
 * so a post whose creation date is the day it was drafted would go live buried
 * three days down its own creator's feed. Making the two equal from the start
 * means nothing downstream has to learn about scheduling to order it correctly,
 * and no row has to be mutated at publish time.
 *
 * `schedule_released_at` is the publisher's idempotency claim, not an audit
 * field — it is what stops a scheduled post being announced twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            if (! Schema::hasColumn('posts', 'scheduled_at')) {
                // Indexed: the publisher sweeps on it every few minutes, and the
                // global visibility scope reads it on every post query there is.
                $table->dateTime('scheduled_at')->nullable()->index()->after('approved_at');
            }

            if (! Schema::hasColumn('posts', 'schedule_released_at')) {
                $table->dateTime('schedule_released_at')->nullable()->after('scheduled_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            foreach (['schedule_released_at', 'scheduled_at'] as $column) {
                if (Schema::hasColumn('posts', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
