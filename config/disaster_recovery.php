<?php

/*
|--------------------------------------------------------------------------
| Disaster recovery — the offsite copy and the drift check
|--------------------------------------------------------------------------
|
| Assessed 4 September 2026 (docs/infrastructure/DISASTER_RECOVERY_ASSESSMENT.md):
| every piece of Spenny Piggy infrastructure sat in eu-west-2, INCLUDING every
| backup of it. A region loss took the primary and its backup together, and the
| ledger — fee splits, reserve amounts, payout runs, bonus rungs — exists
| nowhere else. Stripe holds the money; it does not hold any of that.
|
| 🚨 THIS FILE CONTROLS THE COPY THAT LEAVES THE REGION. Two commands read it:
|
|   db:backup-offsite  — nightly mysqldump -> gzip -> a bucket in `region`.
|   infra:dr-check     — asserts the posture has not drifted since.
|
| ⚠️ AN RDS SNAPSHOT IS NOT A SUBSTITUTE FOR THIS, AND THIS IS NOT A SUBSTITUTE
| FOR AN RDS SNAPSHOT. They fail differently, which is the whole point of having
| both:
|
|   - A snapshot replicates a bad migration or a bad DELETE perfectly into every
|     copy. A dated logical dump does not.
|   - A snapshot is restorable only by AWS, into AWS, in an account that is
|     working. A dump restores into any MySQL anywhere, including a laptop.
|   - A dump is a point in time and can be hours stale. PITR is not.
|
*/

return [

    /*
     * Master switch. OFF everywhere but production by default — a laptop and
     * the dev environment must not be dumping the shared database to S3 on a
     * schedule, and dev shares its host with nothing worth protecting.
     *
     * ⚠️ Config is cached on deploy, so a change here lands on the next deploy.
     */
    'enabled' => (bool) env('DR_BACKUP_ENABLED', env('APP_ENV') === 'production'),

    /*
     * 🚨 THE WHOLE POINT IS THAT THIS IS NOT eu-west-2. A bucket in the primary
     * region is not an offsite backup; it is a second copy inside the same
     * blast radius.
     *
     * eu-central-1 (Frankfurt) is the default: separate country, separate grid,
     * separate fibre landfall, still EU/GDPR-adequate so no international
     * transfer assessment is needed. `infra:dr-check` FAILS if this ever equals
     * the primary region.
     */
    'region' => env('DR_BACKUP_REGION', 'eu-central-1'),
    'primary_region' => env('AWS_DEFAULT_REGION', 'eu-west-2'),

    /*
     * The offsite bucket. Deliberately NOT one of the Vapor buckets — those are
     * created, versioned and emptied by the deploy tooling, and a backup that a
     * deploy can delete is not a backup.
     */
    'bucket' => env('DR_BACKUP_BUCKET'),
    'prefix' => env('DR_BACKUP_PREFIX', 'db'),

    /*
     * How many daily dumps to keep offsite. Storage is pennies at this data
     * size (~745 MB raw, far less gzipped), and the failure this guards against
     * — a corruption nobody notices for a fortnight — is exactly the one a
     * short window cannot answer.
     */
    'retention_days' => (int) env('DR_BACKUP_RETENTION_DAYS', 35),

    /*
     * 🚨 A TRUNCATED DUMP THAT "SUCCEEDS" IS WORSE THAN NO DUMP, because it
     * silently becomes the newest copy and pushes a good one out of retention.
     * mysqldump can exit 0 having written a partial file (a killed connection,
     * a full disk, an OOM), so the size floor is the only structural check that
     * catches it. Raise it as the database grows; never remove it.
     */
    'min_bytes' => (int) env('DR_BACKUP_MIN_BYTES', 2 * 1024 * 1024),

    /*
     * Where mysqldump writes before upload. On Vapor only /tmp is writable, and
     * it is capped (512 MB by default) — which is another reason the dump is
     * streamed through gzip rather than written raw and compressed after.
     */
    'work_dir' => env('DR_BACKUP_WORK_DIR', '/tmp'),

    /*
     * 🚨 VAPOR'S PHP RUNTIME IS A MINIMAL AMAZON LINUX IMAGE AND IS NOT GUARANTEED
     * TO CARRY A MYSQL CLIENT. `infra:dr-check` probes for this binary and reports
     * it as a CRITICAL finding when it is absent, because the backup command cannot
     * work without it and would otherwise fail silently every night at 03:10.
     *
     * If the runtime turns out not to have it, the options in order of preference
     * are: (1) AWS-native cross-region automated backup replication, which needs no
     * binary at all and is Phase 0 of the assessment anyway; (2) run this command
     * from the existing EC2 SSR host, which has a real OS and already sits in the
     * VPC; (3) ship a statically-linked mysqldump and point this at it.
     */
    'mysqldump' => env('DR_MYSQLDUMP_PATH', 'mysqldump'),

    /*
     * Tables whose CONTENT is noise in a recovery and bulk in the file. The
     * SCHEMA is still dumped for every one of them — a restore missing a table
     * definition fails on the first write, so `--no-data` is used rather than
     * `--ignore-table`.
     *
     * ⚠️ Nothing that records money, consent or moderation may go on this list.
     */
    'exclude_data_tables' => [
        'sessions',
        'cache',
        'cache_locks',
        'jobs',
        'job_batches',
        'failed_jobs',
        'telescope_entries',
        'telescope_entries_tags',
        'telescope_monitoring',
    ],

    /*
     * infra:dr-check — the posture we assert has not drifted.
     *
     * 🚨 CONFIGURATION DRIFT IS THE NORMAL WAY A DR PLAN DIES. Nobody switches
     * it off on purpose; somebody restores an instance during an incident and
     * the replacement comes back with AWS defaults — 1-day retention, no
     * deletion protection, no cross-region copy — and it looks exactly like the
     * instance it replaced. Something has to notice, on a schedule, out loud.
     */
    'checks' => [
        'db_instance' => env('DR_DB_INSTANCE', 'spennypiggy-db'),

        // RDS default is 7 and Vapor left this at 3. 35 is the RDS maximum for
        // automated backups and the same window as the offsite retention.
        'min_retention_days' => (int) env('DR_MIN_RETENTION_DAYS', 35),

        'require_deletion_protection' => (bool) env('DR_REQUIRE_DELETION_PROTECTION', true),
        'require_storage_encrypted' => (bool) env('DR_REQUIRE_STORAGE_ENCRYPTED', true),
        'require_multi_az' => (bool) env('DR_REQUIRE_MULTI_AZ', true),

        // PubliclyAccessible on the money database is an exposure, not a DR
        // fault — but the DR check is the thing that runs every day, so it is
        // the thing that will notice.
        'require_private' => (bool) env('DR_REQUIRE_PRIVATE', true),

        // The offsite dump must be newer than this. 26h, not 24h, so an
        // ordinary few-minutes drift in the schedule is not an alert.
        'max_backup_age_hours' => (int) env('DR_MAX_BACKUP_AGE_HOURS', 26),
    ],
];
