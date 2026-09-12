<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * What a reviewer asked a creator to change, on the creator's own screen.
 *
 * The Daily Review feed's "Request edit" told the creator by bell, push and
 * email and left NOTHING anywhere they would look afterwards — so a missed
 * email (or, right now, a push provider suspended over billing) meant the
 * instruction reached nobody and the reviewer was waiting on somebody who had
 * never heard.
 *
 * 🚨 THESE ARE NOT `moderation_reason`, AND MUST NOT BE FOLDED INTO IT. That
 * column means "a check pulled this back and it is NOT on sale"; every screen
 * and query in both apps reads it that way. An edit request leaves the listing
 * SELLING while the creator fixes it — writing the instruction into the hold
 * column would take live listings off sale as a side effect of asking a
 * question.
 *
 * 🚨 NOR ARE THEY THE OLD `edited_reason`/`edited_status` PAIR. That mechanism
 * is driven by `logs` rows and `app:edit-content-auto-delete` DELETES the
 * content 24 hours later if the creator has not answered — the opposite of this
 * feature's own rule ("nothing is deleted"). It is also absent from `tasks`,
 * `piggy_pots` and `tip_goals`, three of the nine things this feed can act on.
 *
 * ⚠️ `edit_requested_at` is not decoration: without it "no request" and "a
 * request with no words" are the same row, and the second is what a reviewer
 * who typed only whitespace produces.
 *
 * 🚨 DEPLOY THIS BEHIND THE MAINTENANCE WALL. It is `Schema::table` on `posts`
 * and five other live tables — the 7 Sep 2026 outage was exactly that, an
 * ALTER waiting on a metadata lock while every later reader queued behind it.
 * MySQL 8 does these INSTANT, which is why they are all ADD COLUMN and nothing
 * else, but the wall costs two minutes and the alternative cost seven.
 */
return new class extends Migration
{
    /**
     * Every table the daily review feed can ask for an edit on.
     *
     * ⚠️ `tip_goals` is here even though it has no approval column at all — a
     * Tip Jar goal is content a reviewer can legitimately ask to be reworded,
     * and it is the one source whose only takedown is a soft delete.
     */
    private const TABLES = [
        'wish_items', 'shops', 'tasks', 'bills', 'memberships',
        'piggy_pots', 'posts', 'tip_goals', 'users',
    ];

    public function up(): void
    {
        foreach (self::TABLES as $table) {
            if (! Schema::hasTable($table)) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) use ($table) {
                // Guarded per column, not per table: a half-applied migration on
                // a shared database is a normal state to recover from, and an
                // unguarded ADD on an existing column is a hard error that takes
                // the deploy down.
                if (! Schema::hasColumn($table, 'edit_requested_reason')) {
                    $t->text('edit_requested_reason')->nullable();
                }

                if (! Schema::hasColumn($table, 'edit_requested_at')) {
                    $t->timestamp('edit_requested_at')->nullable();
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

            Schema::table($table, function (Blueprint $t) use ($table) {
                foreach (['edit_requested_reason', 'edit_requested_at'] as $column) {
                    if (Schema::hasColumn($table, $column)) {
                        $t->dropColumn($column);
                    }
                }
            });
        }
    }
};
