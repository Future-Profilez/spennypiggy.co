<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The featured tile on `/{username}/bio` is the page's biggest, most-tapped
 * element and it was the only one counting nothing: every item card goes
 * through `/bio/buy/{uuid}` and increments `creator_bio_items.click_count`, but
 * the hero pot is picked automatically (pinned, or newest open) and usually has
 * no `creator_bio_items` row to count on.
 *
 * ⚠️ Shared database. `App\Models\PiggyPot` exists in BOTH apps and both were
 * updated; the migration is added here only, never run twice.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('piggy_pots', function (Blueprint $table) {
            $table->unsignedInteger('bio_click_count')->default(0)->after('is_pinned');
            $table->timestamp('bio_last_clicked_at')->nullable()->after('bio_click_count');
        });
    }

    public function down(): void
    {
        Schema::table('piggy_pots', function (Blueprint $table) {
            $table->dropColumn(['bio_click_count', 'bio_last_clicked_at']);
        });
    }
};
