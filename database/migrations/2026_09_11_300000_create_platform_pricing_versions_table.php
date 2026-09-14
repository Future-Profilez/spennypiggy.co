<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Platform pricing, published from the back office instead of deployed.
 *
 * 🚨 THE SHIPPING COPY LIVES HERE. `admin.spennypiggy.co` carries a guarded
 * DECLARATION of the same table for its own test database (the `security_events`
 * pattern) — the apps share one database, so this must run in exactly one of them.
 *
 * 🚨 APPEND-ONLY. A published version is never edited and never deleted: a rate
 * change is a new row, a rollback is a new row copying an old one, and cancelling a
 * scheduled change stamps `cancelled_at` rather than removing it. That is what makes
 * "what were we charging in March, who set it, and why" answerable — and every
 * historic transaction already froze its own rates (`platform_fee_rate`,
 * `stripe_fee_rate`, `fee_model`, `supporter_rate`), so a pricing change is
 * FORWARD-ONLY and needs no migration of history.
 *
 * ⚠️ NO FOREIGN KEYS, deliberately. The admin who published a rate may be deleted
 * long before the rate stops being the one that priced a row somebody is auditing;
 * `published_by_admin_name` is a snapshot for the same reason.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('platform_pricing_versions')) {
            return;
        }

        Schema::create('platform_pricing_versions', function (Blueprint $table) {
            $table->id();

            $table->string('label', 120);
            // 'standard' runs until something supersedes it. 'campaign' carries an
            // `ends_at`, after which the version underneath it resumes by itself —
            // no scheduler, no reinstate step, nothing to forget to switch back.
            $table->string('kind', 20)->default('standard');
            $table->string('fee_model', 20)->default('all_in');

            // 🚨 decimal, never float: a rate is money-shaped and 9.05 must survive
            // a round trip exactly. 3dp so a basis-point deal is expressible.
            $table->decimal('rate_card', 6, 3);
            $table->decimal('rate_bank', 6, 3);

            $table->boolean('fixed_fee_enabled')->default(false);
            $table->decimal('fixed_fee_gbp', 8, 2)->default(0);

            // The instant this version starts pricing charges. In the future for a
            // scheduled change; `now()` for an immediate one.
            $table->dateTime('effective_at');
            // Campaigns only. NULL means "until superseded".
            $table->dateTime('ends_at')->nullable();

            /*
             * Grandfathering: creators who existed before `effective_at` keep the
             * rates of `grandfathered_from_id` instead of this version's.
             *
             * ⚠️ The pinned version is read BY ID and ignores its own window — it is
             * a snapshot of terms somebody was given, not a version that is still
             * live. Cancelling or superseding it must not silently reprice the
             * creators who were promised it.
             */
            $table->boolean('grandfather_existing')->default(false);
            $table->unsignedBigInteger('grandfathered_from_id')->nullable();

            // A rollback is a new version copying an old one; this says which.
            $table->unsignedBigInteger('rolled_back_from_id')->nullable();

            $table->dateTime('cancelled_at')->nullable();
            $table->unsignedBigInteger('cancelled_by_admin_id')->nullable();

            $table->unsignedBigInteger('published_by_admin_id')->nullable();
            $table->string('published_by_admin_name', 120)->nullable();
            $table->text('note')->nullable();

            $table->timestamps();

            // The resolver's one query: not cancelled, due, not expired, newest first.
            $table->index(['cancelled_at', 'effective_at'], 'ppv_live_idx');
            $table->index('ends_at', 'ppv_ends_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_pricing_versions');
    }
};
