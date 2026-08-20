<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The security observation log — Security Checklist §3 "See what's happening".
 *
 * Both apps write here (they share one database and no code), so the table
 * carries an `app` column saying which side recorded the row.
 *
 * 🚨 NO FOREIGN KEYS, deliberately. `discovery_events` cascades on user delete
 * because it is analytics about a living account; this table is the opposite —
 * "who signed in, from where, and what did they change" has to survive the
 * deletion of the account it is about, or the record disappears exactly when
 * somebody has a reason to want it gone. `admin_id` also points at a table the
 * website app has no model for, so a constraint here would couple the two
 * deployments.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('security_events')) {
            return;
        }

        Schema::create('security_events', function (Blueprint $table) {
            $table->id();

            // What happened. Kept as a string rather than an enum: both apps
            // write these, and an enum would need a migration in one app before
            // the other could record a new kind of event.
            $table->string('event_type', 40);
            $table->string('severity', 10)->default('info');   // info | warning | critical
            $table->string('app', 16)->default('website');     // website | admin

            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('admin_id')->nullable();

            // What the event is about, when it is not a person — a task uuid, a
            // masked Stripe account id, a listing id.
            $table->string('subject_type', 40)->nullable();
            $table->string('subject_id', 64)->nullable();

            // ⚠️ Always stored MASKED (see App\Support\SecurityRedactor). This
            // table is read by admins and pasted into tickets.
            $table->string('email', 255)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->boolean('is_new_ip')->nullable();

            $table->string('description', 500)->nullable();
            $table->json('context')->nullable();

            // Null = recorded but never alerted on (below threshold, or inside a
            // cooldown). The difference between "nothing happened" and "we chose
            // not to shout" has to be readable after the fact.
            $table->timestamp('alerted_at')->nullable();

            $table->timestamps();

            $table->index(['event_type', 'created_at']);
            $table->index(['ip_address', 'created_at']);
            $table->index(['admin_id', 'created_at']);
            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_events');
    }
};
