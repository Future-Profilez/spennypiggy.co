<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The creator's link-in-bio page (`/{username}/bio`).
 *
 * 🚨 THIS TABLE HOLDS OVERRIDES, NOT THE PAGE. The internal buttons (wishlist,
 * shop, pots, memberships, bills, Piggy Bank) are DERIVED at render time from
 * what the creator actually sells — see BioPageService::defaults(). A row here
 * only exists to change one of those defaults (hide it, move it, rename it) or
 * to add an external link, which has no default to derive from.
 *
 * Deriving rather than seeding is what makes the feature work on day one for
 * every creator already on the platform, with no backfill: a creator who has
 * never opened the editor still gets a complete page, and a module they add
 * next month appears on it without anyone touching this table.
 *
 * 🚨 AN EXTERNAL LINK STORES A PLATFORM AND A HANDLE, NEVER A URL. The URL is
 * rebuilt server-side from App\Support\BioLinkPlatforms. A creator-supplied URL
 * would make the click redirect an open redirect, and would let a link pass
 * review as `bit.ly/x` and resolve to anywhere afterwards — the destination
 * being unreadable at review time is the whole problem. There is deliberately
 * no free-URL option in v1.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('creator_bio_links')) {
            Schema::create('creator_bio_links', function (Blueprint $table) {
                $table->id();
                $table->uuid('uuid')->unique();
                $table->unsignedBigInteger('user_id')->index();

                // internal — a section or item already sold on this platform.
                // external — an off-platform profile on a whitelisted network.
                // stablecoin — the single coming-soon tip button.
                $table->string('kind', 20);

                // External only. A key of App\Support\BioLinkPlatforms::PLATFORMS.
                $table->string('platform', 32)->nullable();
                // External only. The handle alone — no scheme, no host, no '@'.
                $table->string('handle', 191)->nullable();

                // Internal only. A key of BioLinkPlatforms::INTERNAL_TARGETS.
                $table->string('target_type', 32)->nullable();

                // Creator's own wording. NULL keeps the platform/section default,
                // which is what most rows carry — a default that follows a later
                // copy change is better than a copy frozen at the moment a
                // creator happened to open the editor.
                $table->string('label', 40)->nullable();

                $table->unsignedInteger('sort_order')->default(0);
                $table->boolean('is_active')->default(true);

                // Counted by the /bio/go/{uuid} redirect. A derived link with no
                // row is not counted — click history starts when the creator
                // sets the page up, which is also when the number starts meaning
                // anything to them.
                $table->unsignedBigInteger('click_count')->default(0);
                $table->timestamp('last_clicked_at')->nullable();

                // Set when a label is refused by NoExpenseOrBrandName or
                // Helpers::checkBlockText. Mirrors the moderation_reason column
                // every sellable module already carries.
                $table->string('moderation_reason')->nullable();

                $table->timestamps();

                // One row per thing a creator can override. Without this a
                // double-submit leaves two rows for the same button and the
                // page renders it twice, ordered arbitrarily.
                $table->unique(
                    ['user_id', 'kind', 'platform', 'target_type'],
                    'creator_bio_links_unique_target'
                );

                $table->index(['user_id', 'is_active', 'sort_order'], 'creator_bio_links_render');
            });
        }

        if (Schema::hasTable('users') && ! Schema::hasColumn('users', 'bio_page_views')) {
            Schema::table('users', function (Blueprint $table) {
                // Lifetime view count for the bio page. Deliberately a counter
                // on `users` and not a per-visit row: this is a vanity figure
                // for the creator's own dashboard, and a row per view on a page
                // built to be linked from every social bio the creator owns is
                // the fastest-growing table on the platform for the least value.
                $table->unsignedBigInteger('bio_page_views')->default(0);
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_bio_links');

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'bio_page_views')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('bio_page_views');
            });
        }
    }
};
