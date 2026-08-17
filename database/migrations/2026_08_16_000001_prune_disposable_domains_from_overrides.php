<?php

use App\Support\EmailDomainPolicy;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * 🚨 `allowed_domains` changes MEANING with this release, so its rows have to be
 * re-read before they are trusted.
 *
 * It used to be the gate — a domain listed there was permitted and everything
 * else refused. It is now an always-allow OVERRIDE that beats the disposable
 * blocklist. The live list contains `yopmail.com`, added back when the table
 * merely meant "usable for testing"; carried across unchanged it would become
 * an explicit instruction to permit a throwaway service, which is the exact
 * opposite of what this release is for.
 *
 * Removes only rows that appear in the baseline blocklist. Everything else —
 * including the internal domains — stays, because an override is what those
 * rows now legitimately are.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('allowed_domains')) {
            return;
        }

        DB::table('allowed_domains')
            ->whereIn(DB::raw('LOWER(name)'), EmailDomainPolicy::BASELINE_BLOCKED)
            ->delete();
    }

    /**
     * Deliberately empty: it cannot tell a row it deleted from one that was
     * never there, and re-adding a disposable service to the override list is
     * not something a rollback should do on its own.
     */
    public function down(): void {}
};
