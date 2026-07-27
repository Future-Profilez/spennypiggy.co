<?php

namespace App\Jobs\Concerns;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Retry + failure policy for one-shot jobs whose loss is permanent.
 *
 * A queue worker started without `--tries` attempts a job exactly ONCE, so a job
 * that is dispatched a single time — a purchase deliverable, a certificate, a
 * moderation scan, a verification email — is lost for good on the first transient
 * failure. Scheduled batch jobs re-run the next day and do not need this; jobs
 * dispatched once per purchase or per signup do.
 *
 * Only apply to a job whose `handle()` is safe to run twice. A job that INSERTS a
 * row (a deliverable, a post, a bell notification) is not, until that write is
 * idempotent (`firstOrCreate` on a natural key).
 */
trait RetriesCriticalWork
{
    /** Three attempts covers a transient Stripe/SMTP/S3 blip without hammering a real outage. */
    public $tries = 3;

    /** Seconds between attempts: 30s, 2m, 5m. */
    public $backoff = [30, 120, 300];

    /**
     * Runs after the final attempt fails. Without it the job dies into `failed_jobs`
     * with a stack trace and no indication of which purchase, user, or item was lost.
     */
    public function failed(Throwable $e): void
    {
        Log::critical('Critical job failed after all retries', [
            'job' => static::class,
            'error' => $e->getMessage(),
            'context' => method_exists($this, 'failureContext') ? $this->failureContext() : [],
        ]);

        if (app()->bound('sentry') && ! app()->environment('local', 'testing')) {
            app('sentry')->captureException($e);
        }
    }
}
