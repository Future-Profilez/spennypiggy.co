<?php

namespace App\Console\Commands;

use App\Support\AlertRouter;
use Aws\Rds\RdsClient;
use Aws\S3\S3Client;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Process\Process;
use Throwable;

/**
 * Assert every day that the disaster-recovery posture has not drifted.
 *
 * 🚨 CONFIGURATION DRIFT IS THE NORMAL WAY A DR PLAN DIES. Nobody switches it off on
 * purpose. Somebody restores an instance during an incident, or rebuilds one after a
 * failed upgrade, and the replacement comes back with AWS defaults — one-day
 * retention, no deletion protection, no cross-region copy, publicly accessible — and
 * on every screen it looks exactly like the instance it replaced. The plan is then
 * a document describing infrastructure that no longer exists, and nothing says so
 * until the day it is needed.
 *
 * ⚠️ THIS CHECKS THE POSTURE, IT DOES NOT TEST THE RESTORE. Only a restore drill
 * proves a backup is restorable, and that is a human exercise on a scratch instance
 * (see docs/infrastructure/DISASTER_RECOVERY_ASSESSMENT.md §9, item 1.6). A green
 * run here means "the safety net is still strung up", never "the safety net holds".
 *
 * ⚠️ READ-ONLY. It describes; it never repairs. A command that quietly fixed a
 * setting would hide the fact that something un-set it, which is usually the more
 * important finding.
 */
class CheckDisasterRecoveryPosture extends Command
{
    protected $signature = 'infra:dr-check
        {--no-alert : Print the findings and send nothing}';

    protected $description = 'Assert the disaster-recovery posture (backups, retention, offsite copy) has not drifted';

    /** @var array<int, array{severity: string, message: string}> */
    private array $findings = [];

    public function handle(): int
    {
        $this->checkDumpBinary();
        $this->checkOffsiteConfiguration();
        $this->checkRdsPosture();
        $this->checkLatestOffsiteBackup();

        if ($this->findings === []) {
            $this->info('DR posture OK — every check passed.');

            return self::SUCCESS;
        }

        foreach ($this->findings as $finding) {
            $finding['severity'] === 'critical'
                ? $this->error('[CRITICAL] '.$finding['message'])
                : $this->warn('[WARNING]  '.$finding['message']);
        }

        $critical = array_values(array_filter(
            $this->findings,
            static fn (array $f): bool => $f['severity'] === 'critical'
        ));

        if (! $this->option('no-alert')) {
            $this->alert_($critical !== []);
        }

        // ⚠️ A warning is not a failing exit code. This runs on the scheduler, and a
        // command that exits non-zero for an advisory finding trains whoever reads
        // the run history to ignore it.
        return $critical === [] ? self::SUCCESS : self::FAILURE;
    }

    /**
     * 🚨 Vapor's PHP runtime is a minimal Amazon Linux image and is NOT guaranteed to
     * ship a MySQL client. Without one `db:backup-offsite` cannot produce anything,
     * and it would fail at 03:10 every night — which is a fault that only surfaces
     * on the day somebody reaches for the file. Probed here rather than assumed,
     * because the answer differs between a laptop, the EC2 host and the Lambda.
     */
    private function checkDumpBinary(): void
    {
        $binary = (string) config('disaster_recovery.mysqldump', 'mysqldump');

        $probe = new Process(['sh', '-c', 'command -v '.escapeshellarg($binary)]);
        $probe->run();

        if ($probe->isSuccessful() && trim($probe->getOutput()) !== '') {
            $this->line('mysqldump: '.trim($probe->getOutput()));

            return;
        }

        $this->add('critical', sprintf(
            'The dump binary "%s" is not on this host. db:backup-offsite cannot produce a backup here.',
            $binary
        ));
    }

    private function checkOffsiteConfiguration(): void
    {
        if (! config('disaster_recovery.enabled')) {
            $this->add('critical', 'Offsite backups are DISABLED (disaster_recovery.enabled is false).');

            return;
        }

        $bucket = (string) config('disaster_recovery.bucket');
        $region = (string) config('disaster_recovery.region');
        $primary = (string) config('disaster_recovery.primary_region');

        if ($bucket === '') {
            $this->add('critical', 'DR_BACKUP_BUCKET is not set — nothing is being copied out of the region.');
        }

        // 🚨 The check the whole file exists for. Everything else can be right and
        // the backup still be worthless if it lives in the region it is protecting
        // against.
        if ($region === $primary) {
            $this->add('critical', "The offsite bucket region ({$region}) IS the primary region. That is not offsite.");
        }
    }

    private function checkRdsPosture(): void
    {
        $identifier = (string) config('disaster_recovery.checks.db_instance');

        if ($identifier === '') {
            return;
        }

        try {
            $client = new RdsClient($this->awsConfig((string) config('disaster_recovery.primary_region')));

            $result = $client->describeDBInstances(['DBInstanceIdentifier' => $identifier]);
            $db = $result['DBInstances'][0] ?? null;

            if ($db === null) {
                $this->add('critical', "RDS instance {$identifier} was not found in the primary region.");

                return;
            }

            $checks = config('disaster_recovery.checks');

            $retention = (int) ($db['BackupRetentionPeriod'] ?? 0);
            if ($retention < $checks['min_retention_days']) {
                $this->add('critical', sprintf(
                    'RDS backup retention is %d day(s); the minimum is %d. Point-in-time recovery is limited to the same window.',
                    $retention,
                    $checks['min_retention_days']
                ));
            }

            if ($checks['require_deletion_protection'] && ! ($db['DeletionProtection'] ?? false)) {
                $this->add('critical', 'RDS deletion protection is OFF. One command can destroy the production database.');
            }

            if ($checks['require_storage_encrypted'] && ! ($db['StorageEncrypted'] ?? false)) {
                $this->add('critical', 'RDS storage is NOT encrypted at rest.');
            }

            if ($checks['require_multi_az'] && ! ($db['MultiAZ'] ?? false)) {
                $this->add('critical', sprintf(
                    'RDS is Single-AZ (%s). Losing that one availability zone takes the platform down.',
                    $db['AvailabilityZone'] ?? 'unknown'
                ));
            }

            if ($checks['require_private'] && ($db['PubliclyAccessible'] ?? false)) {
                $this->add('warning', 'RDS is publicly accessible. The app reaches it through the VPC and the RDS Proxy; the public endpoint is avoidable exposure.');
            }

            // Cross-region automated backup replication — the AWS-native half of the
            // offsite story, and the half this codebase cannot create.
            $this->checkReplicatedBackups($client, $identifier);
        } catch (Throwable $e) {
            // ⚠️ NOT silent. A DR check that cannot see the infrastructure has not
            // passed; it has failed to run, and the two must not look alike.
            $this->add('warning', 'Could not read the RDS posture: '.$e->getMessage());
        }
    }

    private function checkReplicatedBackups(RdsClient $client, string $identifier): void
    {
        try {
            $replicated = $client->describeDBInstanceAutomatedBackups([
                'DBInstanceIdentifier' => $identifier,
            ]);

            $regions = [];
            foreach ($replicated['DBInstanceAutomatedBackups'] ?? [] as $backup) {
                if (! empty($backup['Region'])) {
                    $regions[] = $backup['Region'];
                }
            }

            $primary = (string) config('disaster_recovery.primary_region');
            $offsite = array_values(array_unique(array_filter(
                $regions,
                static fn (string $r): bool => $r !== $primary
            )));

            if ($offsite === []) {
                $this->add('critical', 'RDS automated backups are NOT replicated to any other region — every snapshot shares the primary region.');
            } else {
                $this->line('Automated backups replicated to: '.implode(', ', $offsite));
            }
        } catch (Throwable $e) {
            $this->add('warning', 'Could not confirm cross-region backup replication: '.$e->getMessage());
        }
    }

    private function checkLatestOffsiteBackup(): void
    {
        $bucket = (string) config('disaster_recovery.bucket');

        if ($bucket === '' || ! config('disaster_recovery.enabled')) {
            return;
        }

        try {
            $client = new S3Client($this->awsConfig((string) config('disaster_recovery.region')));

            $prefix = trim((string) config('disaster_recovery.prefix'), '/').'/';
            $newest = null;

            // ⚠️ Paginated and scanned in full rather than trusting the key order:
            // S3 lists lexicographically, and the newest key is only also the last
            // key while the naming convention holds.
            foreach ($client->getPaginator('ListObjectsV2', ['Bucket' => $bucket, 'Prefix' => $prefix]) as $page) {
                foreach ($page['Contents'] ?? [] as $object) {
                    $at = Carbon::instance($object['LastModified']);
                    if ($newest === null || $at->greaterThan($newest['at'])) {
                        $newest = ['at' => $at, 'key' => $object['Key'], 'size' => (int) $object['Size']];
                    }
                }
            }

            if ($newest === null) {
                $this->add('critical', "No offsite backup exists in s3://{$bucket}/{$prefix}.");

                return;
            }

            $ageHours = $newest['at']->diffInHours(Carbon::now());
            $maxAge = (int) config('disaster_recovery.checks.max_backup_age_hours');

            if ($ageHours > $maxAge) {
                $this->add('critical', sprintf(
                    'The newest offsite backup is %d hours old (limit %d): %s',
                    $ageHours,
                    $maxAge,
                    $newest['key']
                ));
            }

            // The size floor again, on the stored object this time. The backup command
            // refuses to upload a short dump; this catches one that got there another
            // way, and a database that has quietly stopped being dumped in full.
            $floor = (int) config('disaster_recovery.min_bytes');
            if ($newest['size'] < $floor) {
                $this->add('critical', sprintf(
                    'The newest offsite backup is %d bytes, under the %d floor — treat it as truncated: %s',
                    $newest['size'],
                    $floor,
                    $newest['key']
                ));
            }

            $this->line(sprintf(
                'Newest offsite backup: %s (%d h old, %d bytes)',
                $newest['key'],
                $ageHours,
                $newest['size']
            ));
        } catch (Throwable $e) {
            $this->add('warning', 'Could not read the offsite bucket: '.$e->getMessage());
        }
    }

    private function alert_(bool $critical): void
    {
        // ⚠️ CRITICAL log level, so the `sentry` channel carries it. A caught
        // condition that only writes at info level is written where nobody is
        // alerted — the fault this whole file guards against, one level up.
        Log::critical('DR posture check found problems', [
            'findings' => $this->findings,
        ]);

        if (! $critical) {
            return;
        }

        // ⚠️ Once per day at most. A posture fault is a standing condition, not an
        // event — it is still true tomorrow, and mailing it hourly is how the alert
        // stops being read. Cache::add, not has()+put(): two concurrent runs would
        // both pass a has() check and both send.
        if (! Cache::add('dr-check:alerted', true, now()->addHours(20))) {
            return;
        }

        try {
            $recipients = AlertRouter::recipients('disaster_recovery');

            if ($recipients === []) {
                return;
            }

            $lines = array_map(
                static fn (array $f): string => strtoupper($f['severity']).': '.$f['message'],
                $this->findings
            );

            $body = "The daily disaster-recovery posture check found problems.\n\n"
                .implode("\n", $lines)
                ."\n\nThis is a standing condition, not an event — it will still be true tomorrow.\n"
                ."Reference: docs/infrastructure/DISASTER_RECOVERY_ASSESSMENT.md\n";

            // Transactional internal alert: Mail::raw direct, never the marketing
            // sender, and it must never gain an unsubscribe.
            Mail::raw($body, static function ($message) use ($recipients): void {
                $message->to($recipients)->subject('[Spenny Piggy] Disaster recovery posture FAILED');
            });
        } catch (Throwable $e) {
            // Never throw out of an alert path.
            Log::warning('DR posture alert could not be mailed', ['error' => $e->getMessage()]);
        }
    }

    private function awsConfig(string $region): array
    {
        $config = ['version' => 'latest', 'region' => $region];

        $key = (string) env('AWS_ACCESS_KEY_ID');
        $secret = (string) env('AWS_SECRET_ACCESS_KEY');

        if ($key !== '' && $secret !== '') {
            $config['credentials'] = ['key' => $key, 'secret' => $secret];
        }

        return $config;
    }

    private function add(string $severity, string $message): void
    {
        $this->findings[] = ['severity' => $severity, 'message' => $message];
    }
}
