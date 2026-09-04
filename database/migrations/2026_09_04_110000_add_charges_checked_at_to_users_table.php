<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * When Stripe last told us whether this account can take a card payment.
 *
 * 🚨 WITHOUT IT, `charges_enabled = 0` MEANS TWO DIFFERENT THINGS AND THE ADMIN
 * CONSOLE CANNOT TELL THEM APART: "Stripe says this creator cannot sell" and
 * "nothing has ever written this column". Until 4 Sep 2026 it was always the
 * second — nothing in either app wrote the column, so every creator on the
 * platform carried a red "Stripe charges disabled — supporters cannot buy from
 * this creator" alert. A false accusation on every row is worse than no alert,
 * because the one creator it is true of looks exactly like the rest.
 *
 * NULL here means "not reported yet" and the console says exactly that.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('users') || Schema::hasColumn('users', 'charges_checked_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('charges_checked_at')->nullable()->after('charges_enabled');
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'charges_checked_at')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('charges_checked_at');
        });
    }
};
