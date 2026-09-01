<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The creator's chosen look for their own `/{username}/bio` page.
 *
 * Two columns, one decision each:
 * - `bio_theme` — a key into the CURATED palette set (App\Support\BioAppearance).
 *   Never free colours: every preset's text/ground pairs are contrast-checked at
 *   design time, which a colour picker cannot promise (pink-on-pink is the
 *   documented house failure).
 * - `bio_item_layout` — how the sellable cards render: `list` (the product-row
 *   default) or `grid`.
 *
 * NULL means "the default look" for both, which is the state every existing
 * creator is in — nothing changes for anyone until they choose.
 *
 * ⚠️ Shared database: this migration ships from spennypiggy.co ONLY. The admin
 * app neither reads nor writes these columns, so its User model needs no
 * mirror entry ($fillable/$casts) — they are deliberately not fillable in
 * either app (written via forceFill in one dedicated endpoint).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'bio_theme')) {
                $table->string('bio_theme', 30)->nullable()->after('bio_page_views');
            }
            if (! Schema::hasColumn('users', 'bio_item_layout')) {
                $table->string('bio_item_layout', 10)->nullable()->after('bio_theme');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'bio_item_layout')) {
                $table->dropColumn('bio_item_layout');
            }
            if (Schema::hasColumn('users', 'bio_theme')) {
                $table->dropColumn('bio_theme');
            }
        });
    }
};
