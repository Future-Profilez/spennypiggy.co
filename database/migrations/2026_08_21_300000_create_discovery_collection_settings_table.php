<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 5/6 — which collections are switched on.
 *
 * Developer Master Plan, 19 Aug 2026, §E: "Admin Discovery controls:
 * enable/disable collections, feature/remove creators, eligibility,
 * preview/re-run selections, history, performance + attribution, exclude
 * accounts."
 *
 * 🚨 A MISSING ROW MEANS ENABLED. The table ships EMPTY and every collection
 * works; turning one off is what writes a row. The alternative — seed ten rows
 * and read them — means a collection silently disappears the day a deploy
 * reaches a database the seeder never ran on, and Vapor's deploy hooks run
 * `migrate --force` and never a seeder. Same reasoning as "a missing e-mail
 * preference means opted IN".
 *
 * 🚨 THIS IS WHY THE SWITCH IS IN THE DATABASE AND NOT IN CONFIG. Section F
 * requires that turning something off is a config change with NO DEPLOY — and
 * on Vapor a config file edit IS a deploy, and so is an environment variable
 * change. Only a database-backed switch actually satisfies that rule. The
 * marketing label map in `config/discovery.php` does not, and that gap is
 * recorded there.
 *
 * ⚠️ NO FOREIGN KEY ON `updated_by_admin_id`, deliberately. `admins` lives in
 * the admin app's half of this shared database and the website has no guard for
 * it; more importantly, "who turned this off and why" has to survive the
 * deletion of the account that did it. Same rule the `security_events` table
 * follows.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('discovery_collection_settings')) {
            return;
        }

        Schema::create('discovery_collection_settings', function (Blueprint $table) {
            $table->id();

            // The key from `CollectionService::COLLECTIONS`. Unique: one row
            // decides one collection, and a second would make the answer depend
            // on which one was read first.
            $table->string('collection_key', 40)->unique();

            $table->boolean('is_enabled')->default(true);

            // Where it sits when a surface draws several. Ties break on key, so
            // the order is stable rather than whatever the database returns.
            $table->unsignedSmallInteger('sort_order')->default(0);

            /*
             * ⚠️ WHY, not just what. A collection switched off with no reason is
             * one nobody dares switch back on — six months later the only person
             * who knows is gone. The admin screen requires this on a disable.
             */
            $table->string('note', 500)->nullable();

            $table->unsignedBigInteger('updated_by_admin_id')->nullable();
            $table->string('updated_by_name', 120)->nullable();

            $table->timestamps();
        });
    }

    /**
     * ⚠️ Dropping this table re-enables every collection, which is the safe
     * direction — a rollback must never leave a surface silently switched off
     * with no record of why.
     */
    public function down(): void
    {
        Schema::dropIfExists('discovery_collection_settings');
    }
};
