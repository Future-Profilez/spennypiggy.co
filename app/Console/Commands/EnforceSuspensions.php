<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Services\SuspensionService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Applies (and undoes) the consequences of a suspension.
 *
 * 🚨 A SWEEP, NOT A MODEL EVENT, BECAUSE THE FLAG IS WRITTEN BY THE OTHER APP.
 * `admin.spennypiggy.co` shares this database and none of this code: it has no
 * queue worker, no platform Stripe client, and a 60-second request in which an
 * admin is waiting. So it writes the state and this reconciles it, exactly as
 * `NotifyPayoutHolds` does for `payout_paused_at`.
 *
 * ⚠️ WHAT IS *NOT* WAITING ON THIS RUN: the account is hidden, its writes are
 * refused, and every checkout gate refuses it the instant the flag is written —
 * all three read the column live. This sweep only does the things that need a
 * Stripe round trip (pausing supporters' subscriptions, cancelling the
 * account's own outgoing ones, stopping its platform renewal), none of which
 * can bill inside the few minutes before the next run.
 *
 * `suspension_enforced_at` is the claim: set when consequences are applied,
 * cleared when they are undone. It is what makes a re-run cost nothing.
 */
class EnforceSuspensions extends Command
{
    protected $signature = 'suspension:enforce {--dry-run : List what would change and touch nothing} {--max= : Override the per-run batch size}';

    protected $description = 'Apply suspension consequences (pause supporters, cancel outgoing subs, stop platform renewal) and undo them on unsuspend';

    public function handle(SuspensionService $suspensions): int
    {
        $dry = (bool) $this->option('dry-run');
        $max = (int) ($this->option('max') ?: config('suspension.enforce_batch', 25));

        // One run at a time. Two overlapping runs would both read the same
        // unclaimed rows and issue every Stripe call twice.
        $lock = Cache::lock('suspension:enforce', 600);

        if (! $dry && ! $lock->get()) {
            $this->warn('Another suspension:enforce run holds the lock — skipping.');

            return self::SUCCESS;
        }

        try {
            $applied = $this->applyPending($suspensions, $max, $dry);
            $lifted = $this->liftReinstated($suspensions, $max, $dry);

            $this->info(($dry ? '[dry run] ' : '')."enforced: {$applied}, lifted: {$lifted}");
        } finally {
            if (! $dry) {
                optional($lock)->release();
            }
        }

        return self::SUCCESS;
    }

    private function applyPending(SuspensionService $suspensions, int $max, bool $dry): int
    {
        $pending = User::query()
            ->where('suspended_account', 1)
            ->whereNull('suspension_enforced_at')
            ->orderBy('id')
            ->limit($max)
            ->get();

        foreach ($pending as $user) {
            if ($dry) {
                $this->line("would enforce: {$user->username} (#{$user->id})");

                continue;
            }

            try {
                $result = $suspensions->enforce($user);
                $this->line("enforced {$user->username}: paused {$result['paused']}, cancelled {$result['cancelled']}");
            } catch (\Throwable $e) {
                // 🚨 Never claimed on failure. The row keeps its null marker and
                // the next run retries — a swallowed error that also claimed the
                // account would leave every supporter subscription billing a
                // creator we have suspended, with nothing left to notice it.
                Log::error('suspension:enforce failed for a user', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $this->error("failed {$user->username}: {$e->getMessage()}");
            }
        }

        return $pending->count();
    }

    private function liftReinstated(SuspensionService $suspensions, int $max, bool $dry): int
    {
        $reinstated = User::query()
            ->where('suspended_account', 0)
            ->whereNotNull('suspension_enforced_at')
            ->orderBy('id')
            ->limit($max)
            ->get();

        foreach ($reinstated as $user) {
            if ($dry) {
                $this->line("would lift: {$user->username} (#{$user->id})");

                continue;
            }

            try {
                $result = $suspensions->lift($user);
                $this->line("lifted {$user->username}: resumed {$result['resumed']}");
            } catch (\Throwable $e) {
                Log::error('suspension:enforce could not lift a user', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
                $this->error("failed {$user->username}: {$e->getMessage()}");
            }
        }

        return $reinstated->count();
    }
}
