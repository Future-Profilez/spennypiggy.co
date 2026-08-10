<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Delivery log for every outbound message the platform sends — email, push and
 * the in-app bell.
 *
 * Why: a bank-settled wish purchase created its deliverable but never sent the
 * buyer or creator their mail (the webhook's CheckoutMailToUser dispatch was
 * commented out), and nothing anywhere recorded that fact. "Did this person get
 * their receipt?" was unanswerable — for support, for a dispute, and for the
 * creator looking at their own sale.
 *
 * One row per delivery ATTEMPT per recipient per channel. `skipped` is a real
 * status: consent off / no address on file is not a send and is not a failure.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('notification_logs')) {
            return;
        }

        Schema::create('notification_logs', function (Blueprint $table) {
            $table->id();

            // email | push | bell
            $table->string('channel', 16);

            // queued | sent | failed | skipped
            $table->string('status', 16)->default('queued');

            // buyer | creator | admin | other — who this recipient was in the
            // transaction, so a surface can show a person only their own rows.
            $table->string('role', 16)->nullable();

            $table->unsignedBigInteger('recipient_user_id')->nullable();
            $table->string('recipient_email')->nullable();

            // Mailable FQCN for email; a stable slug for push/bell.
            $table->string('type')->nullable();
            $table->string('subject', 512)->nullable();

            // What the message was about: wish | cart | shop | task | piggy_pot |
            // tip | bill | membership | payout | subscription | ...
            $table->string('context_type', 40)->nullable();
            $table->string('context_id', 64)->nullable();

            // The transaction keys. These are what let an admin open a payment
            // and see exactly which messages it produced.
            $table->string('stripe_session_id')->nullable();
            $table->string('stripe_payment_intent_id')->nullable();
            $table->unsignedBigInteger('financial_transaction_id')->nullable();

            // Set for bulk campaign sends so they can be filtered out of (or
            // reported on separately from) transactional traffic.
            $table->unsignedBigInteger('campaign_id')->nullable();

            // Why a send was skipped, or how it failed.
            $table->string('reason', 512)->nullable();

            $table->json('meta')->nullable();

            $table->timestamp('sent_at')->nullable();
            // Reserved for a future provider webhook (SES/Postmark bounce+open).
            // Phase 1 records that we handed the message to the mailer, nothing more.
            $table->timestamp('delivered_at')->nullable();

            $table->timestamps();

            $table->index('stripe_session_id');
            $table->index('stripe_payment_intent_id');
            $table->index(['recipient_user_id', 'created_at']);
            $table->index(['context_type', 'context_id']);
            $table->index(['channel', 'status']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notification_logs');
    }
};
