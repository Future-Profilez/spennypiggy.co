<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creator Growth Bonus (brief 25 Aug 2026). Two tables:
 *
 *  - growth_bonus_profiles — ONE row per creator in the scheme: the eligibility
 *    record the brief's §5 asks for. Status walks pending → active (seat
 *    claimed) → expired, or pending → missed (window over / seats full).
 *    A claimed seat stays consumed after expiry — seats count activations,
 *    not currently-active creators.
 *
 *  - growth_bonus_rewards — one row per milestone rung crossed. Immutable
 *    record of what was promised; states per brief §5: pending_validation →
 *    approved → paid, or → reversed. `qualifying_transaction_id` is the
 *    ledger row that took the creator over the threshold — the payout rule
 *    (client, 26 Aug 2026) is that the bonus rides the SAME payout run as
 *    that transaction, so the link is load-bearing, not decoration.
 *
 * Lives in spennypiggy.co only (owning app). The admin app reads the same
 * tables through its own mirror models — do NOT run this migration there.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('growth_bonus_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('creator_id')->unique()->constrained('users')->cascadeOnDelete();

            // pending | active | missed | expired
            $table->string('status', 20)->default('pending')->index();

            // Why a pending creator became `missed` — earnings_below_threshold
            // or seats_full. Same split as users.founder_missed_at messaging.
            $table->string('missed_reason', 40)->nullable();

            // stripe_connected_at + activation window. Fixed at creation so a
            // later config change never moves a live deadline.
            $table->dateTime('activation_deadline');

            $table->dateTime('activated_at')->nullable();

            // Set atomically when one of the 150 places is taken. The seat
            // COUNT is `whereNotNull('seat_claimed_at')` — never a status
            // filter, because expiry must not free a seat.
            $table->dateTime('seat_claimed_at')->nullable();

            // activation + expiry_months. NULL = no expiry. Admin-adjustable
            // per creator (client requirement).
            $table->dateTime('expires_at')->nullable();

            // Cached result of the last evaluation, for dashboards/admin lists.
            // The evaluator always recomputes from the ledger — this is display
            // state, never an input.
            $table->decimal('qualifying_gmv', 12, 2)->default(0);

            // Admin "amend qualifying GMV" control (brief §5): a signed manual
            // correction ADDED to the computed figure, so a recompute never
            // silently undoes an admin decision.
            $table->decimal('gmv_adjustment', 12, 2)->default(0);

            // Highest ladder threshold reached (display state).
            $table->decimal('current_milestone', 12, 2)->nullable();

            // Rows the evaluator could not convert to GBP (no frozen rate).
            // Non-zero = this creator's GMV is understated and needs a human.
            $table->unsignedInteger('unconverted_rows')->default(0);

            $table->dateTime('last_evaluated_at')->nullable();
            $table->timestamps();
        });

        Schema::create('growth_bonus_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('profile_id')->constrained('growth_bonus_profiles')->cascadeOnDelete();

            // Denormalised so admin/finance queries never join through profiles.
            $table->foreignId('creator_id')->constrained('users')->cascadeOnDelete();

            // The ladder rung this reward is for (cumulative GMV threshold) and
            // the INCREMENTAL amount unlocked at it, copied from config at
            // creation — a later ladder change must not rewrite history.
            $table->decimal('milestone_gmv', 12, 2);
            $table->decimal('amount', 8, 2);

            // pending_validation | approved | paid | reversed
            $table->string('status', 20)->default('pending_validation')->index();

            // The FT row whose arrival crossed the threshold. Payout rule: this
            // bonus is paid in the payout run that carries this transaction.
            $table->foreignId('qualifying_transaction_id')->nullable()
                ->constrained('financial_transactions')->nullOnDelete();

            // A refund/chargeback pulled GMV back under the threshold AFTER
            // this reward was paid. Unpaid rewards are reversed automatically;
            // paid ones are flagged for admin review / offset (brief §4).
            $table->boolean('needs_review')->default(false);

            $table->dateTime('approved_at')->nullable();
            $table->dateTime('paid_at')->nullable();
            $table->dateTime('reversed_at')->nullable();

            // Manual payout reference (Phase 1) or Stripe transfer id (Phase 3).
            $table->string('payout_reference')->nullable();
            $table->text('admin_note')->nullable();

            $table->timestamps();

            // One reward per rung per creator, ever. firstOrCreate races on the
            // daily evaluator resolve here instead of double-paying.
            $table->unique(['profile_id', 'milestone_gmv']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('growth_bonus_rewards');
        Schema::dropIfExists('growth_bonus_profiles');
    }
};
