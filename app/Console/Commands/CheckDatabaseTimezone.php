<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Does this environment's MySQL agree with PHP about what time it is?
 *
 * 🚨 A `TIMESTAMP` column is CONVERTED on every read and write using the
 * connection's session time zone; a `DATETIME` column is stored and returned
 * verbatim. This schema mixes both — `blocked_payment_attempts.created_at` and
 * `users.created_at` are TIMESTAMP, `platform_activities.occurred_at` is
 * DATETIME — so on a server whose time zone is not UTC, copying one into the
 * other shifts it by the offset and NOTHING errors. The admin activity feed
 * reads every one of its timestamps from that DATETIME column.
 *
 * ⚠️ Neither app sets `'timezone'` in `config/database.php`, so the session is
 * whatever the SERVER is (`SYSTEM`). That makes the app's timestamps a property
 * of the host rather than of the code, and it is why this has to be MEASURED per
 * environment rather than reasoned about — a local copy of a production database
 * answers for the local MySQL, not for RDS.
 *
 * Read-only. Run it on every environment, production included, before changing
 * anything about timestamps.
 */
class CheckDatabaseTimezone extends Command
{
    protected $signature = 'db:timezone-check';

    protected $description = 'Report whether MySQL and PHP agree on the time, and by how much they do not.';

    public function handle(): int
    {
        if (DB::getDriverName() !== 'mysql') {
            $this->warn('Not MySQL — nothing to check.');

            return self::SUCCESS;
        }

        $row = DB::selectOne('select now() as db_now, @@session.time_zone as session_tz, @@global.time_zone as global_tz');

        $dbNow = strtotime($row->db_now);
        $phpNow = time();
        $offsetMinutes = (int) round(($dbNow - $phpNow) / 60);

        $this->line('PHP     : '.now()->toDateTimeString().'  (app.timezone = '.config('app.timezone').')');
        $this->line('MySQL   : '.$row->db_now.'  (session = '.$row->session_tz.', global = '.$row->global_tz.')');
        $this->line('config/database.php timezone: '.(config('database.connections.mysql.timezone') ?: 'not set — session follows the server'));
        $this->newLine();

        if (abs($offsetMinutes) <= 1) {
            $this->info('✅ MySQL and PHP agree. TIMESTAMP and DATETIME columns cannot drift apart here.');

            return self::SUCCESS;
        }

        $this->error(sprintf(
            '🚨 MySQL is %s%d minutes from PHP. Every TIMESTAMP column is converted by that '
            .'amount on read and write; every DATETIME column is not.',
            $offsetMinutes > 0 ? '+' : '', $offsetMinutes
        ));

        // The one place in this schema where the two kinds are copied into each
        // other — a TIMESTAMP source read into the feed's DATETIME column.
        if (Schema::hasTable('platform_activities') && Schema::hasTable('blocked_payment_attempts')) {
            $sample = DB::selectOne(
                'select a.occurred_at, b.created_at
                   from platform_activities a
                   join blocked_payment_attempts b on a.source_key = concat("blocked_payment:", b.id)
                  order by a.id desc limit 1'
            );

            if ($sample) {
                $this->newLine();
                $this->line('Newest projected activity row vs the row it was copied from:');
                $this->line('  source blocked_payment_attempts.created_at (TIMESTAMP): '.$sample->created_at);
                $this->line('  platform_activities.occurred_at            (DATETIME) : '.$sample->occurred_at);
                $this->line('  gap: '.((int) round((strtotime($sample->created_at) - strtotime($sample->occurred_at)) / 60)).' minutes');
            }
        }

        $this->newLine();
        $this->warn('Do not "fix" this by editing stored timestamps. Pinning the session to UTC');
        $this->warn('(config/database.php → \'timezone\' => \'+00:00\') changes how EVERY existing');
        $this->warn('TIMESTAMP row reads, across both apps, on every screen. Decide with the');
        $this->warn('production numbers in front of you.');

        return self::FAILURE;
    }
}
