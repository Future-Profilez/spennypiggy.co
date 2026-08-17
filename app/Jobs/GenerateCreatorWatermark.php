<?php

namespace App\Jobs;

use App\Jobs\Concerns\RetriesCriticalWork;
use App\Models\User;
use App\Services\CreatorWatermarkService;
use App\Support\MediaUrl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Renders and stores a creator's watermark PNG.
 *
 * Dispatched once per creator (on signup completion, on a username change, and
 * from the backfill command), so it carries the one-shot retry policy — a
 * worker started without --tries would otherwise lose it to a single transient
 * Uploadcare blip and that creator would silently never be watermarked.
 *
 * Safe to run twice: it overwrites the same two columns and any orphaned upload
 * is one ~4KB PNG.
 */
class GenerateCreatorWatermark implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, RetriesCriticalWork, SerializesModels;

    public function __construct(
        public int $userId,
        public bool $force = false,
    ) {}

    public function handle(CreatorWatermarkService $watermarks): void
    {
        // 🚨 Rendering uploads a file to Uploadcare. With the feature off that is
        // spend against an account this platform has already had one runaway
        // bill on, for images nothing will stamp — so the daily sweep must be
        // inert until someone deliberately switches the feature on. `force` is
        // the pre-warm escape hatch (`watermarks:generate --force`), which is
        // how you populate creators BEFORE flipping the flag.
        if (! MediaUrl::enabled() && ! $this->force) {
            return;
        }

        $user = User::withTrashed()->find($this->userId);

        if (! $user || $user->trashed()) {
            return;
        }

        if (! $this->force && ! $watermarks->needsGeneration($user)) {
            return;
        }

        $watermarks->generate($user);
    }

    public function failureContext(): array
    {
        return ['user_id' => $this->userId];
    }
}
