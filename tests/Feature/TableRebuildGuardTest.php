<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * 🚨 `performance:optimize --optimize-db` REBUILT EVERY TABLE IN THE SCHEMA.
 *
 * `OPTIMIZE TABLE` on InnoDB is `ALTER TABLE … FORCE` — a full rebuild holding an
 * exclusive metadata lock — and this command ran it in a loop over `SHOW TABLES`,
 * i.e. all 169 of them including `sessions`. `SESSION_DRIVER=database`, so every
 * page load writes to `sessions`: a metadata lock on that path does not slow the
 * site, it stops it. That is the 7 Sep 2026 outage mechanism (one `Schema::table`
 * on `users`, ~7 minutes, 100% of requests) with 169 of them queued up.
 *
 * ⚠️ A SOURCE SCAN. Proving it takes the site down needs a busy production
 * database; what has to hold is that the sweep cannot be started by accident.
 */
class TableRebuildGuardTest extends TestCase
{
    private function source(): string
    {
        return (string) file_get_contents(
            base_path('app/Console/Commands/OptimizePerformance.php')
        );
    }

    public function test_it_never_rebuilds_every_table_it_can_find(): void
    {
        $source = $this->source();

        // The loop that did it read its list straight out of SHOW TABLES.
        $this->assertDoesNotMatchRegularExpression(
            '/foreach \(\$tables as \$table\)\s*\{[^}]*OPTIMIZE TABLE/s',
            $source,
            'OPTIMIZE TABLE is being run over every table SHOW TABLES reports again. '
            .'A rebuild locks each table out while it runs, and `sessions` is written '
            .'on every page load.'
        );
    }

    public function test_a_rebuild_must_be_asked_for_by_name(): void
    {
        $this->assertStringContainsString('--tables=', $this->source());
    }

    /**
     * 🚨 AND REFUSED ON PRODUCTION WITHOUT `--force`, so it cannot be run
     * without the maintenance wall by somebody who has not read this.
     */
    public function test_production_refuses_a_rebuild_unless_forced(): void
    {
        $this->assertMatchesRegularExpression(
            '/isProduction\(\).*!\s*\$this->option\(.force.\)/s',
            $this->source()
        );
    }

    /**
     * ⚠️ THE CONTROL — the table name is interpolated into DDL, so it may only
     * ever be one the database itself reported, never the raw option value.
     */
    public function test_the_table_name_is_checked_against_the_live_schema(): void
    {
        $this->assertStringContainsString('in_array($tableName, $known, true)', $this->source());
    }
}
