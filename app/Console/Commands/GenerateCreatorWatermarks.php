<?php

namespace App\Console\Commands;

use App\Jobs\GenerateCreatorWatermark;
use App\Models\User;
use App\Services\CreatorWatermarkService;
use App\Support\MediaUrl;
use Illuminate\Console\Command;

/**
 * Backfill / repair the per-creator watermark PNGs.
 *
 * Dry run by DEFAULT is not used here — this only ever creates a small PNG and
 * writes two derived columns, so `--dry-run` is opt-in like the other sweeps.
 */
class GenerateCreatorWatermarks extends Command
{
    protected $signature = 'watermarks:generate
        {--user= : A single user id or username}
        {--max=0 : Cap creators QUEUED, not creators examined}
        {--force : Re-render even when the stored watermark still matches the handle}
        {--sync : Render inline instead of queueing (needed when no worker is running)}
        {--dry-run : Report what would be generated and change nothing}';

    protected $description = 'Render and store the profile-URL watermark PNG for creators';

    public function handle(CreatorWatermarkService $watermarks): int
    {
        $dry = (bool) $this->option('dry-run');
        $force = (bool) $this->option('force');
        $sync = (bool) $this->option('sync');
        $max = max(0, (int) $this->option('max'));

        // 🚨 Scheduled daily. Rendering uploads a file to Uploadcare per creator,
        // so with the feature off this must do nothing at all — otherwise the
        // day this deploys it spends against the account for images nothing will
        // stamp, which is exactly what shipping the feature dark exists to
        // avoid. `--force` is the deliberate pre-warm: populate every creator
        // first, THEN switch the flag on so nobody sees a half-stamped site.
        if (! MediaUrl::enabled() && ! $force) {
            $this->info('Watermarking is off (MEDIA_WATERMARK_ENABLED). Nothing rendered.');
            $this->line('Pre-warm before switching it on with: watermarks:generate --force --sync');

            return self::SUCCESS;
        }

        $queued = 0;
        $skipped = 0;
        $failed = 0;

        $query = User::query()->where('role', 1)->whereNotNull('username');

        if ($user = $this->option('user')) {
            $query->where(function ($q) use ($user) {
                $q->where('username', $user);

                if (ctype_digit((string) $user)) {
                    $q->orWhere('id', (int) $user);
                }
            });
        }

        // cursor() so a large creator table is not held in memory, and the cap
        // counts creators QUEUED rather than rows read — capping the query would
        // mean creators past the cap are never reached on ANY run.
        foreach ($query->cursor() as $creator) {
            if (! $force && ! $watermarks->needsGeneration($creator)) {
                $skipped++;

                continue;
            }

            if ($dry) {
                $this->line("would generate: {$creator->username} (#{$creator->id})");
                $queued++;
            } elseif ($sync) {
                if ($watermarks->generate($creator)) {
                    $queued++;
                } else {
                    $failed++;
                    $this->warn("failed: {$creator->username} (#{$creator->id})");
                }
            } else {
                GenerateCreatorWatermark::dispatch($creator->id, $force);
                $queued++;
            }

            if ($max > 0 && $queued >= $max) {
                break;
            }
        }

        $verb = $dry ? 'would generate' : ($sync ? 'generated' : 'queued');
        $this->info("{$verb}: {$queued} · up to date: {$skipped} · failed: {$failed}");

        if (! $dry && ! $sync) {
            $this->line('Requires `queue:work` — nothing is rendered without a worker.');
        }

        return self::SUCCESS;
    }
}
