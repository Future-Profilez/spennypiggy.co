<?php

namespace App\Console\Commands;

use App\Models\Logs;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Releases the creators that `app:auto-suspend-account` had taken.
 *
 * That command was deleted on 14 Sep 2026 (client direction): an unpaid platform
 * subscription is no longer a reason to suspend an account. Deleting it stops
 * NEW suspensions and releases nobody — the flag it wrote is still on every
 * account it reached, and there has never been an automatic path back out.
 *
 * 🚨 THE FLAG IS ALL THIS TOUCHES. `suspension:enforce` runs every five minutes
 * over `suspended_account = 0 AND suspension_enforced_at IS NOT NULL` and is
 * what actually resumes the supporters' subscriptions and releases the payout
 * hold. Reversing those here as well would be a second definition of "lift",
 * and the two would disagree the first time either changed.
 *
 * ⚠️ `suspension_enforced_at` IS DELIBERATELY NOT CLEARED. It is the marker that
 * sweep looks for; clearing it leaves every paused supporter subscription paused
 * with nothing left to notice.
 */
class ReleaseSubscriptionSuspensions extends Command
{
    protected $signature = 'subscription:release-auto-suspended
        {--apply : Write the change (dry run without it)}
        {--user= : Limit to one username, uuid or email}
        {--max= : Stop after this many releases}';

    protected $description = 'Un-suspend creators the deleted subscription auto-suspend rule locked out (dry run unless --apply)';

    /**
     * The string `app:auto-suspend-account` wrote into `logs.message`. The
     * command is gone; the rows it wrote are permanent, so the marker has to
     * outlive it — this is the only thing that can say WHICH suspensions were
     * the cron's rather than a person's.
     */
    public const LOG_MARKER = '[auto-suspend:subscription]';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $query = User::query()
            ->where('suspended_account', 1)
            ->orderBy('id');

        if ($this->option('user')) {
            $needle = (string) $this->option('user');
            $query->where(function ($q) use ($needle) {
                $q->where('username', $needle)
                    ->orWhere('uuid', $needle)
                    ->orWhere('email', $needle);
            });
        }

        $released = 0;
        $skippedHuman = 0;
        $unknown = [];

        $query->chunkById(200, function ($users) use (&$released, &$skippedHuman, &$unknown, $apply, $max) {
            foreach ($users as $user) {
                if ($max !== null && $released >= $max) {
                    return false;
                }

                $latest = $this->latestSuspensionLog($user->id);

                if ($latest === null) {
                    // Suspended with no log at all. The cron only started
                    // writing one part-way through its life, so this is
                    // genuinely ambiguous — and releasing an account a person
                    // deliberately removed is far costlier than leaving one
                    // suspended. Named in the summary for a human to decide.
                    $unknown[] = "{$user->username} (#{$user->id})";

                    continue;
                }

                if (! str_contains($latest, self::LOG_MARKER)) {
                    // The most recent thing that happened to this account was
                    // not the cron, so a person is why it is suspended today.
                    $skippedHuman++;

                    continue;
                }

                $released++;
                $this->line(($apply ? 'released: ' : 'would release: ')."{$user->username} <{$user->email}> (#{$user->id})");

                if ($apply) {
                    $this->release($user);
                }
            }

            return true;
        });

        $this->info(($apply ? 'Released: ' : 'Would release: ')."{$released}. Skipped (a person suspended them): {$skippedHuman}.");

        if ($unknown !== []) {
            $this->warn('Suspended with no log — NOT touched, decide by hand: '.implode(', ', $unknown));
        }

        if (! $apply) {
            $this->comment('[dry run — pass --apply to write]');
        }

        return self::SUCCESS;
    }

    /**
     * The newest `logs` row about this account's suspension state, or null if
     * it has none. Newest, not "any": an account the cron took and a person
     * later re-suspended must read as the person's.
     */
    private function latestSuspensionLog(int $userId): ?string
    {
        $row = Logs::withTrashed()
            ->where('suspended_user_id', $userId)
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->first(['message']);

        return $row?->message;
    }

    /**
     * ⚠️ `DB::table`, never `save()` — Eloquent stamps `updated_at`, which keys
     * the public profile cache and ORDERS the admin creator-review queue, so a
     * backfill over every affected account would reshuffle that queue in one
     * command. Same rule as `StripeChargesFlag::sync()`.
     */
    private function release(User $user): void
    {
        $columns = ['suspended_account' => 0];

        foreach (['suspension_reason_code', 'suspension_note', 'suspended_at', 'suspended_by_admin_id'] as $column) {
            if (Schema::hasColumn('users', $column)) {
                $columns[$column] = null;
            }
        }

        DB::table('users')->where('id', $user->id)->update($columns);

        Log::warning('Released a creator suspended by the deleted subscription auto-suspend rule', [
            'user_id' => $user->id,
            'username' => $user->username,
        ]);

        // The release must leave a trace of its own, or the next person reading
        // this account sees a suspension that ended for no recorded reason.
        // It must never be the reason the release itself fails.
        try {
            Logs::create([
                'suspended_user_id' => $user->id,
                'message' => 'Suspension removed — an unpaid platform subscription is no longer a reason to suspend an account.',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Release log row failed: '.$e->getMessage(), ['user_id' => $user->id]);
        }
    }
}
