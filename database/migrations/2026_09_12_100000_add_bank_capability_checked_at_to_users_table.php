<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When Stripe was last confirmed to KNOW about this creator's bank capability.
 *
 * 🚨 WITHOUT THIS COLUMN THE SWEEP CANNOT BE BOUNDED. `stripe:request-bank-capabilities`
 * retrieves every connected account on every run — fine at 30 creators, one Stripe round
 * trip per creator per day at 2,000, for a question whose answer almost never changes.
 * The marker is what lets the scheduled pass read only the accounts nobody has
 * successfully asked about yet.
 *
 * ⚠️ NULL MEANS "NEVER CONFIRMED", NOT "HAS NO CAPABILITY". Every row predating this
 * migration is NULL, which is correct: we have not checked them under the new sweep.
 * Nothing may read NULL as a statement about the creator.
 *
 * ⚠️ Stamped only when every capability the creator's country supports is PRESENT in
 * Stripe's capabilities map — at any status, including pending. "Pending" is Stripe and
 * the creator finishing onboarding between them; re-requesting does not move it, so a
 * sweep that kept retrying would be asking a question already answered.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'bank_capability_checked_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('bank_capability_checked_at')->nullable()->after('account_id');
        });
    }

    public function down(): void
    {
        if (! Schema::hasColumn('users', 'bank_capability_checked_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('bank_capability_checked_at');
        });
    }
};
