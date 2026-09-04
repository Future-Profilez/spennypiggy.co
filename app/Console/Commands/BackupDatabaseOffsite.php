<?php

namespace App\Console\Commands;

use Aws\S3\S3Client;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * Take a logical dump of the shared database and put it in a bucket OUTSIDE the
 * primary region.
 *
 * 🚨 WHY THIS EXISTS. Until 4 September 2026 every backup Spenny Piggy held was an
 * RDS automated snapshot in eu-west-2 — the same region, the same availability zone
 * and the same AWS account as the database it was backing up, with three days of
 * retention and no copy anywhere else. A region loss took the primary and the backup
 * together, and with them the only record of the LEDGER: fee splits, reserve amounts
 * and their release dates, payout run assignments, VAT splits, Growth Bonus rungs.
 * Stripe holds the money and can say a supporter paid £130.55 to a connected account.
 * It cannot say what of that was the creator's, what was held in reserve, or which
 * payout run it belonged to. That is not "hard to reconstruct" — it is not
 * reconstructable.
 *
 * ⚠️ THIS DOES NOT REPLACE THE RDS SNAPSHOTS, AND THEY DO NOT REPLACE IT. Each covers
 * what the other cannot:
 *   - A snapshot replicates a bad migration or a bad DELETE faithfully into every
 *     copy. A dated dump from before it does not.
 *   - A snapshot is restorable only by AWS, into AWS, in a working account. A dump
 *     restores into any MySQL, anywhere, including a laptop.
 *   - A dump is a point in time and can be hours stale. Point-in-time recovery is not.
 * Cross-region automated backup replication is the other half of this and is an AWS
 * console change, not code — see the assessment doc.
 *
 * 🚨 A TRUNCATED DUMP IS THE FAILURE MODE THAT MATTERS. mysqldump can exit 0 having
 * written a partial file — a dropped connection, a full /tmp, an OOM kill — and that
 * partial file then becomes the NEWEST backup and pushes a good one out of retention.
 * So the size floor (`disaster_recovery.min_bytes`) is checked before upload, and a
 * dump under it is discarded rather than stored.
 *
 * ⚠️ Failure is logged at CRITICAL, deliberately. The `sentry` channel carries error
 * and above, so anything quieter is written where nobody is alerted, which is how a
 * broken backup stays broken for months and is discovered on the day it is needed.
 */
class BackupDatabaseOffsite extends Command
{
    protected $signature = 'db:backup-offsite
        {--dry-run : Build the dump and report, but upload nothing and prune nothing}
        {--keep-local : Leave the dump file on disk after upload (debugging only)}';

    protected $description = 'Dump the database and store it in a bucket outside the primary region';

    public function handle(): int
    {
        if (! config('disaster_recovery.enabled')) {
            $this->info('Offsite backup is disabled (disaster_recovery.enabled). Nothing to do.');

            return self::SUCCESS;
        }

        $dryRun = (bool) $this->option('dry-run');

        $bucket = (string) config('disaster_recovery.bucket');
        $region = (string) config('disaster_recovery.region');
        $primary = (string) config('disaster_recovery.primary_region');

        if ($bucket === '') {
            return $this->fail('DR_BACKUP_BUCKET is not set — there is nowhere to put the backup.');
        }

        // 🚨 The one assertion this command exists for. A bucket in the primary
        // region is a second copy inside the same blast radius, not an offsite
        // backup, and it would pass every other check in here.
        if ($region === $primary) {
            return $this->fail(
                "DR_BACKUP_REGION ({$region}) is the primary region. That is not an offsite backup."
            );
        }

        $path = null;

        try {
            [$path, $key] = $this->createDump();

            $bytes = (int) filesize($path);
            $floor = (int) config('disaster_recovery.min_bytes');

            $this->info(sprintf('Dump: %s (%s)', $key, $this->human($bytes)));

            if ($bytes < $floor) {
                // Discarded, not uploaded. See the class docblock.
                return $this->fail(sprintf(
                    'Dump is %s, under the %s floor — treating it as truncated and discarding it.',
                    $this->human($bytes),
                    $this->human($floor)
                ));
            }

            if ($dryRun) {
                $this->warn("Dry run — not uploading to s3://{$bucket}/{$key} and not pruning.");

                return self::SUCCESS;
            }

            $client = $this->client($region);

            $client->putObject([
                'Bucket' => $bucket,
                'Key' => $key,
                'SourceFile' => $path,
                'ServerSideEncryption' => 'AES256',
                'Metadata' => [
                    'database' => (string) config('database.connections.mysql.database'),
                    'primary-region' => $primary,
                    'taken-at' => Carbon::now()->toIso8601String(),
                ],
            ]);

            $this->info("Uploaded to s3://{$bucket}/{$key} ({$region}).");

            $pruned = $this->prune($client, $bucket);
            if ($pruned > 0) {
                $this->line("Pruned {$pruned} expired backup(s).");
            }

            Log::info('Offsite database backup stored', [
                'bucket' => $bucket,
                'region' => $region,
                'key' => $key,
                'bytes' => $bytes,
                'pruned' => $pruned,
            ]);

            return self::SUCCESS;
        } catch (Throwable $e) {
            return $this->fail('Offsite backup failed: '.$e->getMessage(), $e);
        } finally {
            if ($path !== null && ! $this->option('keep-local') && is_file($path)) {
                @unlink($path);
            }
        }
    }

    /**
     * Run mysqldump, streamed straight through gzip.
     *
     * ⚠️ Streamed rather than written raw and compressed after: on Vapor only /tmp is
     * writable and it is capped (512 MB by default), so a raw dump can outgrow the
     * disk long before the gzipped one would.
     *
     * @return array{0: string, 1: string} [local path, object key]
     */
    private function createDump(): array
    {
        $db = config('database.connections.mysql');

        $stamp = Carbon::now()->utc()->format('Y-m-d_His');
        $name = "{$db['database']}_{$stamp}.sql.gz";
        $path = rtrim((string) config('disaster_recovery.work_dir'), '/')."/{$name}";
        $key = trim((string) config('disaster_recovery.prefix'), '/')
            .'/'.Carbon::now()->utc()->format('Y/m')."/{$name}";

        // ⚠️ Credentials go through the environment, never the command line —
        // an argv password is readable by any process on the host via /proc.
        $env = ['MYSQL_PWD' => (string) ($db['password'] ?? '')];

        $base = [
            (string) config('disaster_recovery.mysqldump', 'mysqldump'),
            '--host='.$db['host'],
            '--port='.$db['port'],
            '--user='.$db['username'],
            // --single-transaction takes a consistent snapshot WITHOUT locking the
            // tables, so the dump cannot block a live checkout. It relies on InnoDB,
            // which every table here uses.
            '--single-transaction',
            '--quick',
            '--routines',
            '--triggers',
            '--events',
            // ⚠️ OFF deliberately. GTID state belongs to the instance the dump came
            // from; restoring it into a fresh instance makes replication refuse to
            // start, which is exactly the situation this file is meant to rescue.
            '--set-gtid-purged=OFF',
            '--default-character-set=utf8mb4',
        ];

        $excluded = (array) config('disaster_recovery.exclude_data_tables', []);

        // 🚨 Schema for every table, data for the ones worth restoring. A restore
        // missing a table DEFINITION fails on the first write that touches it, so
        // this is two passes with --no-data rather than --ignore-table.
        $schemaOnly = array_merge($base, ['--no-data', $db['database']]);
        $withData = array_merge($base, ['--no-create-info'], array_map(
            static fn (string $t): string => "--ignore-table={$db['database']}.{$t}",
            $excluded
        ), [$db['database']]);

        /*
         * 🚨 `set -o pipefail` IS LOAD-BEARING. A shell pipeline reports the exit
         * status of its LAST command, so without it `mysqldump | gzip` exits 0
         * whenever gzip succeeds — including when mysqldump was never found, was
         * killed, or died on a dropped connection halfway through. The process then
         * looks successful and a truncated file goes offsite as the newest backup.
         * Verified: with mysqldump absent from PATH this pipeline exited 0 and
         * produced a valid 20-byte gzip of nothing.
         *
         * The `2>/dev/null` tolerates a /bin/sh with no pipefail (it is a bash and
         * zsh builtin, not POSIX). The size floor below is the second line of
         * defence for exactly that case — it is what caught this one.
         */
        $script = sprintf(
            'set -o pipefail 2>/dev/null; ( %s && %s ) | gzip -9 > %s',
            $this->quote($schemaOnly),
            $this->quote($withData),
            escapeshellarg($path)
        );

        $process = Process::fromShellCommandline($script, null, $env, null, 900);
        $process->run();

        if (! $process->isSuccessful()) {
            // ⚠️ Only stderr — stdout is the dump itself and would put the database
            // into the exception message and from there into Sentry.
            throw new \RuntimeException('mysqldump failed: '.trim($process->getErrorOutput()));
        }

        if (! is_file($path)) {
            throw new \RuntimeException("mysqldump produced no file at {$path}.");
        }

        return [$path, $key];
    }

    /**
     * Delete offsite backups past the retention window.
     *
     * ⚠️ Keyed on the object's own LastModified, not on the date in its name — a
     * re-uploaded or back-filled object is judged by when it actually arrived.
     */
    private function prune(S3Client $client, string $bucket): int
    {
        $cutoff = Carbon::now()->subDays((int) config('disaster_recovery.retention_days'));
        $prefix = trim((string) config('disaster_recovery.prefix'), '/').'/';
        $deleted = 0;

        $pages = $client->getPaginator('ListObjectsV2', [
            'Bucket' => $bucket,
            'Prefix' => $prefix,
        ]);

        foreach ($pages as $page) {
            foreach ($page['Contents'] ?? [] as $object) {
                if (Carbon::instance($object['LastModified'])->greaterThanOrEqualTo($cutoff)) {
                    continue;
                }

                $client->deleteObject(['Bucket' => $bucket, 'Key' => $object['Key']]);
                $deleted++;
            }
        }

        return $deleted;
    }

    private function client(string $region): S3Client
    {
        $config = [
            'version' => 'latest',
            'region' => $region,
        ];

        // On Lambda the execution role supplies credentials and an explicit empty
        // key/secret pair would override it with nothing.
        $key = (string) env('AWS_ACCESS_KEY_ID');
        $secret = (string) env('AWS_SECRET_ACCESS_KEY');

        if ($key !== '' && $secret !== '') {
            $config['credentials'] = ['key' => $key, 'secret' => $secret];
        }

        return new S3Client($config);
    }

    private function quote(array $parts): string
    {
        return implode(' ', array_map('escapeshellarg', $parts));
    }

    private function human(int $bytes): string
    {
        foreach (['B', 'KB', 'MB', 'GB'] as $i => $unit) {
            if ($bytes < 1024 ** ($i + 1) || $unit === 'GB') {
                return round($bytes / (1024 ** $i), 1)." {$unit}";
            }
        }

        return $bytes.' B';
    }

    private function fail(string $message, ?Throwable $e = null): int
    {
        $this->error($message);

        // CRITICAL, not error: this is the backup of a payments platform, and the
        // whole class of fault it guards against is one that stays silent until the
        // day somebody needs the file.
        Log::critical('Offsite database backup FAILED', [
            'message' => $message,
            'exception' => $e?->getMessage(),
        ]);

        return self::FAILURE;
    }
}
