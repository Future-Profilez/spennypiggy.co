<?php

use App\Support\EmailDomainPolicy;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Uuid;

/**
 * Fills `blocked_domains` on deploy.
 *
 * 🚨 A MIGRATION, not only a seeder, because **Vapor's deploy hooks run
 * `migrate --force` and never run a seeder**. Left to `BlockedDomainSeeder`
 * alone, production would come up with the table CREATED AND EMPTY until
 * somebody remembered to run it by hand.
 *
 * The blocking itself would still work — `EmailDomainPolicy::BASELINE_BLOCKED`
 * refuses these in code whatever the table holds — which is exactly what makes
 * the omission dangerous: nothing breaks, so nobody notices. The admin screen
 * would simply read "No domains blocked yet" while signups were being refused,
 * and there would be no list for an admin to extend.
 *
 * ⚠️ Idempotent: only inserts what is missing, so it is safe beside the seeder
 * and safe to re-run. It never deletes — a domain an admin has unblocked
 * deliberately must stay unblocked.
 */
return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('blocked_domains')) {
            return;
        }

        $existing = DB::table('blocked_domains')
            ->pluck('name')
            ->map(fn ($n) => strtolower(trim((string) $n)))
            ->all();

        $rows = [];

        foreach (EmailDomainPolicy::BASELINE_BLOCKED as $domain) {
            $domain = strtolower(trim($domain));

            if ($domain === '' || in_array($domain, $existing, true)) {
                continue;
            }

            $rows[] = [
                'uuid' => (string) Uuid::uuid4(),
                'name' => $domain,
                'note' => 'Disposable email service',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        foreach (array_chunk($rows, 100) as $chunk) {
            DB::table('blocked_domains')->insert($chunk);
        }

        // 🚨 The override list BEATS the blocklist, so a disposable service
        // sitting there is an instruction to permit it. `2026_08_16_000001`
        // pruned the list as it stood; the baseline has grown since, so prune
        // again against the current one.
        if (Schema::hasTable('allowed_domains')) {
            DB::table('allowed_domains')
                ->whereIn(DB::raw('LOWER(name)'), EmailDomainPolicy::BASELINE_BLOCKED)
                ->delete();
        }
    }

    /**
     * Deliberately empty. It cannot tell a row it inserted from one an admin
     * added, and emptying the blocklist on a rollback is the one outcome this
     * migration must never produce.
     */
    public function down(): void {}
};
