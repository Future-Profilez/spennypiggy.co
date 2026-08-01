<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "I have seen this offer and I do not want it."
 *
 * The membership upsell renders after every qualifying purchase. Without a record of a
 * refusal, somebody who buys from the same creator ten times is asked ten times — which is
 * how a prompt stops being read at all, including the ones that matter.
 *
 * ⚠️ Stored server-side rather than in localStorage on purpose: the offer appears on the
 * thank-you page AND inside receipt emails, and a browser-only dismissal cannot silence an
 * email. It is also per CREATOR, not global — refusing one creator's membership says nothing
 * about another's.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('membership_offer_dismissals', function (Blueprint $table) {
            $table->id();

            // A buyer is identified by account when they have one and by email when they do
            // not — guest checkout is allowed on Piggy Pot and Wishes, and those buyers get
            // the offer too, so an email-only refusal has to be recordable.
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('email')->nullable();
            $table->unsignedBigInteger('creator_id');
            $table->timestamp('dismissed_at');
            $table->timestamps();

            // Two uniques rather than one: the two ways of identifying the same person are
            // independent, and a row may legitimately carry only one of them.
            $table->unique(['user_id', 'creator_id'], 'mod_user_creator_unique');
            $table->unique(['email', 'creator_id'], 'mod_email_creator_unique');
            $table->index('creator_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('membership_offer_dismissals');
    }
};
