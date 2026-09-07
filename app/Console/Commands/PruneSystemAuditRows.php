<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Retention for the OBSERVER-written half of `audit_logs`.
 *
 * Two kinds of row share the table and they are not the same kind of fact:
 *
 *  - A DECISION — `actor = admin:N` or an explicit code (`RISK_DECISION`,
 *    `PLATFORM_STATE_CHANGE`, `EARLY_FRAUD_WARNING`…). Somebody or something
 *    chose to do a thing, and the row is the only record of the choice.
 *    **Kept for ever.** Nothing here touches them.
 *
 *  - A MODEL SAVE — `actor = system`, code `{MODEL}_{CREATED|UPDATED|DELETED|RESTORED}`,
 *    written by `ActivityObserver` on every save. It says what changed and
 *    never why; the row it describes still exists and carries the same value.
 *    98% of the table (150k `MONTHLYCHARGE_UPDATED` rows from a cron) was this.
 *    **Pruned after `--days` (default 180).**
 *
 * 🚨 DRY RUN BY DEFAULT. It deletes audit rows, which is the one table that is
 * supposed to be append-only, so it prints what it would remove and stops
 * unless `--apply` is passed. Goes through the query builder deliberately: the
 * model refuses `delete()` (immutability guard), and that guard is the point —
 * a prune is a retention POLICY run on a schedule, not an edit somebody makes.
 *
 * ⚠️ The pattern is the whole safety: `actor = 'system'` AND the observer's `{MODEL}_{EVENT}` shape. An explicit system code such as
 * `RISK_DECISION` does not match the shape and is never a candidate; an
 * observer row that a signed-in user or admin triggered carries their actor
 * string and is kept.
 */
class PruneSystemAuditRows extends Command
{
    protected $signature = 'audit:prune-system {--days=180} {--apply} {--chunk=5000}';

    protected $description = 'Delete observer-written system rows from audit_logs older than N days (dry run unless --apply)';

    /** The observer's shape — and ONLY that shape. */
    private const OBSERVER_CODE = '^[A-Z]+_(CREATED|UPDATED|DELETED|RESTORED)$';

    public function handle(): int
    {
        $days = max(30, (int) $this->option('days'));
        $cutoff = now()->subDays($days);
        $chunk = max(100, (int) $this->option('chunk'));

        // The shape test runs in PHP over the DISTINCT codes (≈90), not as a SQL
        // REGEXP — the test database is sqlite, which has none, and a retention
        // rule that only works on one engine is one that is never exercised.
        $codes = DB::table('audit_logs')
            ->where('actor', 'system')
            ->where('created_at', '<', $cutoff)
            ->distinct()
            ->pluck('action_type')
            ->filter(fn ($code) => preg_match('/'.self::OBSERVER_CODE.'/', (string) $code) === 1)
            ->values()
            ->all();

        $base = fn () => DB::table('audit_logs')
            ->where('actor', 'system')
            ->whereIn('action_type', $codes ?: ['__none__'])
            ->where('created_at', '<', $cutoff);

        $total = $base()->count();
        $this->line("Observer rows older than {$days} days (before {$cutoff->toDateString()}): {$total}");

        if ($total === 0) {
            return self::SUCCESS;
        }

        foreach ($base()->select('action_type', DB::raw('count(*) c'))->groupBy('action_type')->orderByDesc('c')->limit(15)->get() as $row) {
            $this->line(sprintf('  %-45s %d', $row->action_type, $row->c));
        }

        if (! $this->option('apply')) {
            $this->warn('Dry run — nothing deleted. Re-run with --apply.');

            return self::SUCCESS;
        }

        $deleted = 0;
        do {
            $ids = $base()->orderBy('created_at')->limit($chunk)->pluck('id');
            if ($ids->isEmpty()) {
                break;
            }
            $deleted += DB::table('audit_logs')->whereIn('id', $ids)->delete();
        } while ($ids->count() === $chunk);

        $this->info("Deleted {$deleted} observer rows.");

        return self::SUCCESS;
    }
}
