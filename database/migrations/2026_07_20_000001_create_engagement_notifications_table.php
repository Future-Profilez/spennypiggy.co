<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Dedup ledger for engagement notifications.
 *
 * One row per (user, type, dedup_key) that has been sent. The engine checks this
 * before sending, so a daily command re-running — or a supporter sitting at the
 * same lapsed stage for a week — can never produce a second message.
 *
 * `dedup_key` is what makes a send unique for that type:
 *   reactivation  -> the last purchase date + stage, e.g. "2026-07-01|7"
 *   milestone     -> "birthday|2026" / "anniversary|2026"
 *   whale_risk    -> the risk episode start, e.g. "2026-07-01"
 *   creator_event -> "wish|1234" (per item, per recipient)
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('engagement_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->index();
            $table->string('type', 40);
            $table->string('dedup_key', 120);
            $table->timestamp('sent_at')->useCurrent();

            $table->unique(['user_id', 'type', 'dedup_key'], 'engagement_notifications_unique');
            $table->index(['type', 'sent_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('engagement_notifications');
    }
};
