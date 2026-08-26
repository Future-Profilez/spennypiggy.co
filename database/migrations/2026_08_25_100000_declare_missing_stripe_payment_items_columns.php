<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Schema-drift closure (see docs/guides/SCHEMA_DRIFT_AUDIT.md): three
 * `stripe_payment_items` columns existed on every deployed database and in NO
 * migration, so a database built from this repo could not INSERT the row the
 * cart fulfilment writes — which is why the cart paths had no feature test.
 *
 * Types transcribed from the live `SHOW COLUMNS` (25 Aug 2026), never guessed:
 *   thank_you_approved  tinyint(4) NOT NULL default 0
 *   thank_you_at        timestamp NULL
 *   twitter_response    longtext NULL
 *
 * Guarded per column — a no-op everywhere the columns already exist.
 * down() is deliberately empty: it must never drop production columns this
 * migration did not create.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stripe_payment_items', function (Blueprint $table) {
            if (! Schema::hasColumn('stripe_payment_items', 'thank_you_approved')) {
                $table->tinyInteger('thank_you_approved')->default(0);
            }

            if (! Schema::hasColumn('stripe_payment_items', 'thank_you_at')) {
                $table->timestamp('thank_you_at')->nullable();
            }

            if (! Schema::hasColumn('stripe_payment_items', 'twitter_response')) {
                $table->longText('twitter_response')->nullable();
            }
        });
    }

    public function down(): void
    {
        // Deliberate no-op — see the class docblock.
    }
};
