<?php

namespace App\Console\Commands;

use App\Mail\CreatorAccountNotice;
use App\Models\Logs;
use App\Models\MonthlyCharge;
use App\Models\User;
use App\Support\RiskMessages;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AutoSuspendAccount extends Command
{
    protected $signature = 'app:auto-suspend-account {--dry-run} {--max=}';

    protected $description = 'Suspend creators whose platform subscription lapsed AFTER they were actually billed';

    /**
     * ⚠️ ALLOW-LIST of subscription states that mean "this creator may keep selling".
     *
     * This mirrors User::computeSubscriptionStatus() and the eight supporter
     * checkout gates — 2 IS the free period, not a lapsed subscription.
     *
     * The old rule was "no monthly_charges row with status = 'paid' → suspend".
     * That was survivable while the platform charged the card three days after
     * signup, because the row became 'paid' almost immediately. Under
     * free-until-first-sale (31 July 2026) a creator's row sits on 'trialing'
     * for up to two years by design and is NEVER 'paid' until they make a sale,
     * so this daily command suspended every creator in their free period —
     * which is exactly the cohort that has just connected Stripe.
     */
    private const ELIGIBLE_SUBSCRIPTION_STATUSES = [1, 2];

    /**
     * A row proving the creator entered real billing. Suspension is for a
     * subscription that lapsed, so a creator who has never been charged owes
     * nothing and must not be locked out of their own account — the
     * subscription gate on Stripe Connect and the checkout gates already stop
     * them selling.
     */
    private const BILLED_STATUSES = ['paid', 'active', 'renew', 'failed'];

    /**
     * Written into the suspension log line so a later audit (and the
     * subscription:restore-wrongly-suspended backfill) can tell an automatic
     * suspension apart from an admin one. The old command left no trace at all.
     */
    public const LOG_MARKER = '[auto-suspend:subscription]';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $max = $this->option('max') !== null ? max(1, (int) $this->option('max')) : null;

        $suspended = 0;
        $examined = 0;
        $skippedEligible = 0;
        $skippedNeverBilled = 0;

        User::query()
            ->where('role', 1)
            ->where(function ($q) {
                $q->whereNull('suspended_account')->orWhere('suspended_account', 0);
            })
            ->whereIn('id', MonthlyCharge::query()->select('user_id'))
            ->orderBy('id')
            ->chunkById(200, function ($users) use (&$suspended, &$examined, &$skippedEligible, &$skippedNeverBilled, $dryRun, $max) {
                foreach ($users as $user) {
                    if ($max !== null && $suspended >= $max) {
                        return false;
                    }

                    $examined++;

                    if (in_array((int) $user->subscription_status, self::ELIGIBLE_SUBSCRIPTION_STATUSES, true)) {
                        $skippedEligible++;

                        continue;
                    }

                    if (! $this->hasEverBeenBilled($user->id)) {
                        $skippedNeverBilled++;

                        continue;
                    }

                    if ($dryRun) {
                        $suspended++;
                        $this->line("would suspend: {$user->username} <{$user->email}> (subscription_status={$user->subscription_status})");

                        continue;
                    }

                    try {
                        $this->suspend($user);
                        $suspended++;
                    } catch (\Throwable $e) {
                        Log::error('Auto-suspend failed for creator', [
                            'user_id' => $user->id,
                            'username' => $user->username,
                            'error' => $e->getMessage(),
                        ]);
                    }
                }

                return true;
            });

        $this->info("Examined: {$examined}. Suspended: {$suspended}. Skipped (eligible): {$skippedEligible}. Skipped (never billed): {$skippedNeverBilled}.".($dryRun ? ' [dry run]' : ''));

        return self::SUCCESS;
    }

    private function hasEverBeenBilled(int $userId): bool
    {
        return MonthlyCharge::where('user_id', $userId)
            ->where(function ($q) {
                $q->whereIn('status', self::BILLED_STATUSES)
                    ->orWhereNotNull('current_start_subscription_date');
            })
            ->exists();
    }

    private function suspend(User $user): void
    {
        $user->suspended_account = 1;
        $user->save();

        Log::warning(self::LOG_MARKER.' creator suspended for lapsed platform subscription', [
            'user_id' => $user->id,
            'username' => $user->username,
            'subscription_status' => $user->subscription_status,
        ]);

        // A suspension with no trace cannot be audited or reversed in bulk.
        // It must never be the reason the suspension itself fails.
        try {
            Logs::create([
                'suspended_user_id' => $user->id,
                'message' => self::LOG_MARKER.' Suspended automatically — platform subscription is not active.',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Auto-suspend log row failed: '.$e->getMessage(), ['user_id' => $user->id]);
        }

        // 🚨 This email was BROKEN and failing silently. The old mailable
        // rendered `email.account-suspend`, a view that does not exist in this
        // repository — so every send threw "View [email.account-suspend] not
        // found", the throw was swallowed by this very try/catch, and the
        // creator was locked out of their account and never told. The only
        // trace was one warning line.
        //
        // ⚠️ And its whole message was the subject: "Your account is
        // suspended!" with no reason at all. That is precisely what the 9 Aug
        // messaging brief singles out — "Account status issue on its own is
        // exactly what we're trying to get away from" — so the reason is now
        // required by the message itself, not optional.
        try {
            $ui = RiskMessages::get('CREATOR_ACCOUNT_ISSUE', RiskMessages::AUDIENCE_CREATOR, [
                'reason' => 'Your platform subscription is not active, so payments cannot come through.',
            ]);

            Mail::to($user->email)->send(new CreatorAccountNotice(
                ui: $ui,
                firstName: self::firstNameOf($user),
            ));
        } catch (\Throwable $e) {
            Log::warning('Auto-suspend email failed: '.$e->getMessage(), ['user_id' => $user->id]);
        }
    }

    /**
     * `users.name` is a DISPLAY name and may be a stage or shop name, so it is
     * used only as a greeting.
     */
    private static function firstNameOf($user): ?string
    {
        $name = trim((string) ($user->name ?? ''));

        return $name === '' ? null : explode(' ', $name)[0];
    }
}
