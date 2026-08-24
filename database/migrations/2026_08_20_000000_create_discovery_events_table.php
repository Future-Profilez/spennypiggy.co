<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Discovery Phase 1 — the attribution record.
 *
 * One row per thing that happened to a creator because of a Discovery surface:
 * a profile visit, a follow, a purchase. Reference: Developer Master Plan,
 * 19 Aug 2026, §C Phase 1.
 *
 * 🚨 THIS TABLE HOLDS PERSONAL DATA AND `site_visit_stats` DELIBERATELY DOES
 * NOT. `VisitTracker`'s docblock is explicit that it stores counters only, so it
 * "needs no consent banner and has nothing to erase on a deletion request" —
 * that property is load-bearing and this table must not be mistaken for it.
 * Here we record WHICH visitor saw WHICH creator, because "428 people
 * discovered your profile" cannot be derived from an aggregate counter. So:
 *   - `user_id` is nullable and cascades on delete, and
 *   - `visitor_id` is the existing anonymous `sp_v` cookie uuid, never an IP or
 *     a fingerprint, and
 *   - nothing here identifies a person by name, email or address.
 * A deletion request clears the signed-in rows by cascade; anonymous rows carry
 * no identity to erase.
 *
 * ⚠️ SHARED DATABASE. The admin app reads the same schema — if it grows a
 * Discovery report, it needs its own model pointed at this table. The migration
 * belongs to this app only; do not add a second copy there.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discovery_events', function (Blueprint $table) {
            $table->id();

            // The creator who was promoted. Every row belongs to exactly one.
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();

            /*
             * The reserved source key (`App\Support\DiscoverySources::KEYS`) and
             * the class it resolves to. The class is DENORMALISED on purpose:
             * the monthly report groups by it on every read, and a key moving
             * class later must not silently rewrite history.
             */
            $table->string('source', 40);
            $table->string('traffic_class', 10)->index();

            // A named collection or campaign, where one drove the placement.
            $table->string('campaign', 60)->nullable();

            /*
             * Who. Exactly one of these is set for a given visitor: a signed-in
             * supporter has `user_id`; a logged-out one is the anonymous `sp_v`
             * cookie uuid. Both nullable, because a purchase can arrive from a
             * guest checkout with neither still attached.
             */
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->uuid('visitor_id')->nullable();

            // visit | follow | purchase — what the supporter actually did.
            $table->string('event_type', 20);

            /*
             * The purchase, when this row is one. Morph rather than a foreign
             * key: seven different payment tables can produce a transaction, and
             * the ledger row is the thing the money report joins on.
             */
            $table->nullableMorphs('transactable');
            $table->foreignId('financial_transaction_id')->nullable()
                ->constrained('financial_transactions')->nullOnDelete();

            /*
             * Value in GBP, mirroring `financial_transactions.gbp_amount`. The
             * report sums a single currency; converting at read time would make
             * a creator's historical figures move with today's exchange rate.
             */
            $table->decimal('value_gbp', 15, 2)->nullable();

            /*
             * "New to this creator" — no prior follow, support or transaction at
             * the moment this event happened (the brief's definition). Frozen at
             * write time: it is a fact about that moment, and recomputing it
             * later would make every supporter look not-new forever.
             */
            $table->boolean('is_new_to_creator')->default(false);

            $table->timestamp('occurred_at');
            $table->timestamps();

            // The monthly report: one creator, one date range, grouped by source.
            $table->index(['creator_id', 'occurred_at']);
            $table->index(['creator_id', 'event_type', 'occurred_at'], 'disc_creator_type_date_idx');
            $table->index(['source', 'occurred_at']);

            /*
             * De-duplicating a repeat visit needs to find "has this visitor been
             * counted for this creator recently", which is a lookup on both
             * identity columns.
             */
            $table->index(['creator_id', 'visitor_id']);
            $table->index(['creator_id', 'user_id']);
        });

        Schema::table('financial_transactions', function (Blueprint $table) {
            /*
             * 🚨 THE BRIEF REQUIRES THE SOURCE ON THE TRANSACTION RECORD ITSELF
             * ("Source stored on the transaction record itself"), not only on the
             * event. The ledger is the single source of truth for money, and a
             * revenue figure that has to join a second table to know where it
             * came from is one join away from being reported wrong.
             */
            $table->string('discovery_source', 40)->nullable()->after('fee_profile');
            $table->string('discovery_class', 10)->nullable()->after('discovery_source');

            $table->index(['user_id', 'discovery_class', 'transaction_date'], 'ft_creator_disc_date_idx');
        });
    }

    public function down(): void
    {
        Schema::table('financial_transactions', function (Blueprint $table) {
            $table->dropIndex('ft_creator_disc_date_idx');
            $table->dropColumn(['discovery_source', 'discovery_class']);
        });

        Schema::dropIfExists('discovery_events');
    }
};
