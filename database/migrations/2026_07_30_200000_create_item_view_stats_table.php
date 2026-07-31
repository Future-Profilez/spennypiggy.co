<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-listing view counters.
 *
 * A creator could see that something sold, and nothing else. "Nobody looked at it" and
 * "lots looked and nobody bought" are completely different problems — one is a
 * distribution problem, the other is a price or description problem — and until now they
 * were indistinguishable.
 *
 * ⚠️ **Aggregate only, exactly like `site_visit_stats`.** One row per item per day per
 * source. No per-visitor row, no IP, no cookie id is stored — which is what keeps this
 * out of personal-data territory: nothing to consent to and nothing to erase.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('item_view_stats')) {
            return;
        }

        Schema::create('item_view_stats', function (Blueprint $table) {
            $table->id();

            // `shop` | `task` — mirrors ItemShareService::TYPES, which is the list of
            // items that actually have a public page to be viewed.
            $table->string('item_type', 20);
            $table->unsignedBigInteger('item_id');

            $table->date('date');
            $table->string('source', 40)->default('direct');

            $table->unsignedBigInteger('views')->default(0);
            $table->unsignedBigInteger('unique_views')->default(0);

            $table->timestamps();

            $table->unique(['item_type', 'item_id', 'date', 'source'], 'item_view_stats_unique_bucket');
            // The creator-facing lookup: this item, over a window.
            $table->index(['item_type', 'item_id', 'date'], 'item_view_stats_item_idx');
            // The prune's query.
            $table->index('date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('item_view_stats');
    }
};
