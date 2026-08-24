<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Which of a creator's EARNING ITEMS appear on their `/{username}/bio` page,
 * and in what order (Developer Master Plan, 19 Aug 2026, §B).
 *
 * 🚨 THIS TABLE IS A SELECTION, NOT A COPY. It stores a type and the listing's
 * own id and NOTHING ELSE — no title, no price, no image, no currency. The card
 * is rendered from the live listing every time, so a price the creator edits, a
 * pot that closes, an item an admin pulls for moderation and a listing that
 * sells out all take effect on the bio page with no editing, no backfill and no
 * cron. A denormalised price on a page whose entire job is to sell is a price
 * that will eventually disagree with the checkout it links to.
 *
 * 🚨 SEPARATE FROM `creator_bio_links`, deliberately. That table holds LINK
 * overrides — a row, a label, a destination. These are CARDS with a picture, a
 * price and a checkout, they are ordered independently of the link block, and
 * they are the only rows on this page that lead to money. Folding them into one
 * table would mean one `sort_order` sequence spanning two visually separate
 * blocks and a `target_key` that has to encode an item id.
 *
 * ⚠️ `item_type` is a key of `App\Support\CatalogueRegistry::TYPES` — the ONE
 * definition of what a creator sells. It is not an enum column: adding a seventh
 * sellable type must not require a migration on this table.
 *
 * ⚠️ There is NO foreign key. `item_id` points into one of six different tables
 * depending on `item_type`, so no single FK can express it. A selection whose
 * listing has been deleted resolves to nothing and is skipped at render — see
 * `BioPageService::items()`.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('creator_bio_items')) {
            return;
        }

        Schema::create('creator_bio_items', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->unsignedBigInteger('user_id')->index();

            // A key of CatalogueRegistry::TYPES — wish / shop / task /
            // piggy_pot / bill / membership.
            $table->string('item_type', 32);
            $table->unsignedBigInteger('item_id');

            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);

            // Counted by the /bio/buy/{uuid} redirect, which is also what tags
            // the purchase as `bio-link`. A card the creator has never had
            // clicked reads 0 rather than nothing.
            $table->unsignedBigInteger('click_count')->default(0);
            $table->timestamp('last_clicked_at')->nullable();

            $table->timestamps();

            // One row per listing per creator. Without it a double-submit puts
            // the same card on the page twice, ordered arbitrarily.
            $table->unique(['user_id', 'item_type', 'item_id'], 'creator_bio_items_unique_item');

            // The public page reads "this creator's active selections, in
            // order" on every view; this is that query.
            $table->index(['user_id', 'is_active', 'sort_order'], 'creator_bio_items_render_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_bio_items');
    }
};
