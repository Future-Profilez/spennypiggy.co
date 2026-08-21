<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Creator-controlled push — Developer Master Plan, 19 Aug 2026, §E:
 * "Supporter re-engagement & push: creator-controlled push with rate limits,
 * settings, unsubscribe, moderation, admin controls."
 *
 * 🚨 THIS TABLE IS THE RATE LIMIT AND THE AUDIT TRAIL, NOT A LOG. A creator
 * writing a message that lands on their supporters' phones is the most direct
 * channel this platform has, and the only feature where one user can push
 * unsolicited text to many others. Every send is recorded BEFORE it is
 * dispatched, so:
 *   · the limit is computed from what was actually sent, not from a cache that
 *     a flush would reset to zero at the moment it matters most;
 *   · an admin answering "what did this creator send my supporters?" has an
 *     answer that survives the creator deleting their account;
 *   · a message that was refused is recorded WITH ITS REASON, because "this
 *     creator keeps trying to send phone numbers" is the signal that matters.
 *
 * ⚠️ `status` carries `sent` / `blocked`. A blocked row still counts as an
 * attempt for review purposes but NOT against the send limit — refusing someone
 * and then also charging them a slot punishes a person who may simply have typed
 * a URL by accident.
 *
 * ⚠️ NO FOREIGN KEY ON `creator_id` by choice, matching `security_events`: the
 * record of what somebody sent has to outlive the account that sent it.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('creator_push_messages')) {
            return;
        }

        Schema::create('creator_push_messages', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();

            $table->unsignedBigInteger('creator_id')->index();

            // The message as the creator typed it — stored even when refused, so
            // a moderator can see what was attempted rather than a summary of it.
            $table->string('body', 300);

            $table->string('status', 20)->default('sent')->index();

            // Why it was refused. Null on a successful send.
            $table->string('blocked_reason', 200)->nullable();

            /*
             * How many supporters it actually reached. Recorded rather than
             * recomputed: consent changes, people unsubscribe, and "how many saw
             * this" must mean how many it went to AT THE TIME.
             */
            $table->unsignedInteger('recipients')->default(0);

            // Set when an admin decides the message should not have gone out.
            // The push cannot be recalled; this marks the record and the creator.
            $table->timestamp('flagged_at')->nullable();
            $table->string('flagged_reason', 300)->nullable();
            $table->unsignedBigInteger('flagged_by_admin_id')->nullable();

            $table->timestamps();

            // The rate-limit query: this creator's sends since a moment.
            $table->index(['creator_id', 'status', 'created_at'], 'cpm_creator_status_date_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('creator_push_messages');
    }
};
