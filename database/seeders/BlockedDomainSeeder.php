<?php

namespace Database\Seeders;

use App\Models\BlockedDomain;
use App\Support\EmailDomainPolicy;
use Illuminate\Database\Seeder;

/**
 * Seeds the disposable-email blocklist into the table an admin can edit.
 *
 * ⚠️ `EmailDomainPolicy::BASELINE_BLOCKED` already blocks these in code, so
 * this is not what makes them work — it exists so the list is VISIBLE and
 * extendable from the back office rather than being an invisible constant.
 * Idempotent: safe to re-run.
 */
class BlockedDomainSeeder extends Seeder
{
    public function run(): void
    {
        foreach (EmailDomainPolicy::BASELINE_BLOCKED as $domain) {
            BlockedDomain::firstOrCreate(
                ['name' => $domain],
                ['note' => 'Disposable email service']
            );
        }

        EmailDomainPolicy::forgetLists();
    }
}
