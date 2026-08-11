<?php

namespace App\Console\Commands;

use App\Models\Logs;
use App\Models\MonthlyCharge;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * One-off repair for creators suspended by the old app:auto-suspend-account
 * rule, which locked out every creator sitting in their free period because
 * their monthly_charges row is 'trialing' and never 'paid'.
 *
 * ⚠️ Dry run by DEFAULT. Un-suspending the wrong account puts someone back on
 * the platform an admin deliberately removed, so this only touches creators
 * whose subscription is currently eligible AND who carry no admin suspension
 * log — never a blanket "un-suspend everyone".
 */
class RestoreWronglySuspendedCreators extends Command
{
    protected $signature = 'subscription:restore-wrongly-suspended {--apply} {--user=} {--max=}';

    protected $description = 'Un-suspend creators locked out by the old subscription auto-suspend rule (dry run unless --apply)';

    /** Same allow-list as AutoSuspendAccount — 2 IS the free period. */
    private const ELIGIBLE_SUBSCRIPTION_STATUSES = [1, 2];

    /**
     * Any suspension log NOT written by the automatic rule is treated as a
     * human decision and left alone. An admin suspension carries a Logs row
     * (admin UserController) — the old cron carried none, so "no log" is the
     * strongest available signal that this was the cron.
     */
    private function suspendedByAdmin(int $userId): bool
    {
        return Logs::withTrashed()
            ->where('suspended_user_id', $userId)
            ->where(function ($q) {
                $q->whereNull('message')
                    ->orWhere('message', 'not like', '%'.AutoSuspendAccount::LOG_MARKER.'%');
            })
            ->exists();
    }

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $query = User::query()
            ->where('role', 1)
            ->where('suspended_account', 1)
            ->whereIn('id', MonthlyCharge::query()->select('user_id'))
            ->orderBy('id');

        if ($this->option('user')) {
            $query->where(function ($q) {
                $q->where('username', $this->option('user'))
                    ->orWhere('uuid', $this->option('user'))
                    ->orWhere('email', $this->option('user'));
            });
        }

        $restored = 0;
        $skippedIneligible = 0;
        $skippedAdmin = 0;

        $query->chunkById(200, function ($users) use (&$restored, &$skippedIneligible, &$skippedAdmin, $apply, $max) {
            foreach ($users as $user) {
                if ($max !== null && $restored >= $max) {
                    return false;
                }

                if (! in_array((int) $user->subscription_status, self::ELIGIBLE_SUBSCRIPTION_STATUSES, true)) {
                    $skippedIneligible++;

                    continue;
                }

                if ($this->suspendedByAdmin($user->id)) {
                    $skippedAdmin++;

                    continue;
                }

                $restored++;
                $this->line(($apply ? 'restored: ' : 'would restore: ')."{$user->username} <{$user->email}> (subscription_status={$user->subscription_status})");

                if (! $apply) {
                    continue;
                }

                $user->suspended_account = 0;
                $user->save();

                Log::warning('Restored creator wrongly suspended by the subscription auto-suspend rule', [
                    'user_id' => $user->id,
                    'username' => $user->username,
                    'subscription_status' => $user->subscription_status,
                ]);

                try {
                    Logs::create([
                        'suspended_user_id' => $user->id,
                        'message' => 'Suspension removed automatically — creator is in their free period and was never billed.',
                    ]);
                } catch (\Throwable $e) {
                    Log::warning('Restore log row failed: '.$e->getMessage(), ['user_id' => $user->id]);
                }
            }

            return true;
        });

        $this->info(($apply ? 'Restored: ' : 'Would restore: ')."{$restored}. Skipped (not eligible): {$skippedIneligible}. Skipped (admin suspension): {$skippedAdmin}.".($apply ? '' : ' [dry run — pass --apply to write]'));

        return self::SUCCESS;
    }
}
