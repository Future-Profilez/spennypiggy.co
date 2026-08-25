<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * 🚨 `memberships` GREW TWELVE COLUMNS THAT NO MIGRATION DECLARES.
 *
 * Measured 23 Aug 2026: the live table has 38 columns; the migrations account
 * for 26.
 *
 * ⚠️ CORRECTED 24 Aug 2026: an earlier version of this note said three of the
 * twelve are NOT NULL on live and therefore "the application cannot insert
 * into" the table. The constraint is not the mechanism — on a fresh build the
 * column is **absent**, so a query naming it fails outright (`Unknown column`)
 * and a model carrying it in `$fillable` cannot insert. A full audit of every
 * table found **zero** missing columns that are required-without-a-default on
 * live, so nobody ever meets a NOT NULL error; they meet a missing column.
 *
 * Nothing has failed in production, because every deployed database already has
 * them. What it broke is TESTING: a membership fixture cannot be created, which
 * is why the membership paths have no feature coverage — they could not run. It
 * was found writing a test for a supporter-facing redirect that happened to need
 * one.
 *
 * This is the THIRD table with this fault. `shops` had seventeen such columns
 * (migration `2026_08_04_000000`) and `wish_items` two (`2026_08_20_300000`);
 * both were closed the same way and for the same reason.
 *
 * ⚠️ GUARDED AND ADDITIVE. Every column is added only where it is absent, so
 * this is a no-op on every environment that already has them — which is all of
 * them. It must never redefine or drop anything.
 *
 * ⚠️ `down()` IS DELIBERATELY EMPTY. Dropping these would take real columns off
 * a production table this migration did not create. Same decision as the two
 * migrations above.
 *
 * ⚠️ Types are transcribed from the live table, not guessed:
 * `SHOW COLUMNS FROM memberships`. A type that disagrees with production is
 * worse than an absent column, because it passes tests and fails on deploy.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('memberships')) {
            return;
        }

        Schema::table('memberships', function (Blueprint $table) {
            /*
             * ⚠️ The three NOT NULL ones carry a DEFAULT here even though the
             * live table has none. Adding a NOT NULL column with no default to a
             * table that already holds rows fails outright — and on a fresh
             * database a default is what lets a fixture be created at all, which
             * is the whole point of this migration.
             */
            if (! Schema::hasColumn('memberships', 'level')) {
                $table->string('level')->default('');
            }

            if (! Schema::hasColumn('memberships', 'rewards')) {
                $table->longText('rewards')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'gift_frequency')) {
                $table->enum('gift_frequency', ['daily', 'weekly', 'monthly', 'rarely'])
                    ->default('rarely');
            }

            if (! Schema::hasColumn('memberships', 'engagement_level')) {
                $table->enum('engagement_level', ['low', 'medium', 'high', 'viral'])
                    ->default('low');
            }

            if (! Schema::hasColumn('memberships', 'price')) {
                $table->double('price', 8, 2)->nullable();
            }

            if (! Schema::hasColumn('memberships', 'tax_amount')) {
                $table->double('tax_amount', 10, 2)->default(0);
            }

            if (! Schema::hasColumn('memberships', 'product_id')) {
                $table->string('product_id')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'price_id')) {
                $table->string('price_id')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'edited_reason')) {
                $table->longText('edited_reason')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'edited_status')) {
                $table->tinyInteger('edited_status')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'publish_at')) {
                $table->dateTime('publish_at')->nullable();
            }

            if (! Schema::hasColumn('memberships', 'schedule_released_at')) {
                $table->dateTime('schedule_released_at')->nullable();
            }
        });
    }

    /** Deliberately empty — see the note above. */
    public function down(): void {}
};
