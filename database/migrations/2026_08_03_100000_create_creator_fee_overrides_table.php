<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Bespoke commercial rates for individual creators (client decision, 3 Aug 2026).
 *
 * Standard pricing is untouched and remains the default for every creator: a row
 * here exists ONLY for the handful of creators we have negotiated a separate deal
 * with. No row (or an ended row) means the global config rates apply.
 *
 * Only the PLATFORM rate is negotiable. The 2% compliance fee is fixed and always
 * read from config/payments.php — it is deliberately not a column here, so a
 * bespoke deal can never accidentally waive it.
 *
 * Rates are stored per payment method because the two methods carry different
 * processing costs: the standard spread is bank 15% / card 19%, and a deal that
 * collapsed both to one number would hand away far more on card than intended.
 * NULL on either column means "use the standard rate for that method", so a deal
 * can be struck on bank alone.
 *
 * This is a VERSIONED record, not a settings row. Ending a deal sets
 * `effective_to` rather than deleting, so "what rate were we on with this creator
 * in March" stays answerable, and every transaction can point at the exact
 * agreement that priced it (`*.fee_override_id`).
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('creator_fee_overrides')) {
            return;
        }

        Schema::create('creator_fee_overrides', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');

            // Percentages, e.g. 8.00 = 8%. NULL = that method keeps the standard rate.
            $table->decimal('platform_rate_card', 5, 2)->nullable();
            $table->decimal('platform_rate_bank', 5, 2)->nullable();

            $table->timestamp('effective_from')->nullable();
            // NULL = this is the live agreement for the creator.
            $table->timestamp('effective_to')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('ended_by')->nullable();
            $table->text('note')->nullable();

            $table->timestamps();

            // Resolver looks up the live row per creator on every checkout.
            $table->index(['user_id', 'effective_to']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_fee_overrides');
    }
};
