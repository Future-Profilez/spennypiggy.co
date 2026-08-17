<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * "Tell me when I can sign up" — the lead we used to throw away.
 *
 * When the platform risk state is FREEZE, `RegisteredUserController::store()`
 * refuses a creator registration outright. Until this table existed the person
 * received a sentence and nothing else: no waitlist, no email captured, no way
 * back. Every one of those is a click the ads were paid for.
 *
 * ONE ROW PER EMAIL, ever. An account can only exist once per address, so a
 * lead that converts is closed rather than deleted — the row is the record of
 * where the person came from and how long they waited.
 *
 * ⚠️ This is a PII row for someone who has NO account and never agreed to
 * anything beyond "tell me when it opens". `signup-leads:prune` is what keeps
 * it from becoming a permanent shadow mailing list; nothing else removes a row.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('signup_leads')) {
            return;
        }

        Schema::create('signup_leads', function (Blueprint $table) {
            $table->id();

            // The identity. Lowercased before write — the address typed on the
            // refused form and the one typed on the retry are the same address
            // whatever the capitals, and two rows for one person would email
            // them twice.
            $table->string('email')->unique();

            // 0 = fan, 1 = creator. Only creator registration is refused today,
            // but the column costs nothing and a fan-side gate would otherwise
            // need a second table.
            $table->unsignedTinyInteger('role')->default(1);

            // Why we refused. NOT free text — see SignupLead::REASONS.
            $table->string('reason', 40)->index();

            // Which platform state was live at capture, for the admin answering
            // "why was I turned away in July?".
            $table->string('platform_state', 20)->nullable();

            // Attribution, first-touch, read from the cookies TrackSiteVisit
            // already sets. Without it a lead cannot be credited to the advert
            // that produced it, which is the whole reason this is worth having.
            $table->string('source', 40)->nullable();
            $table->string('landing_page', 40)->nullable();

            // Set the moment the "you can sign up now" notice is CLAIMED, not
            // when it is delivered — the update IS the claim, so two workers
            // cannot both email the same person. A failed send releases it.
            $table->timestamp('notified_at')->nullable();

            // Set when an account is actually created on this address. A closed
            // lead is never chased again, and a converted one must never be
            // told "registration is open" — they are already in.
            $table->timestamp('converted_at')->nullable();

            $table->timestamps();

            // The notify sweep's query: everyone still waiting.
            $table->index(['notified_at', 'converted_at'], 'signup_leads_pending_idx');
            // The prune's query.
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signup_leads');
    }
};
