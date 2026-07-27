<?php

namespace App\Console\Commands;

use App\Models\CrmCreator;
use App\Models\CrmCreatorStageHistory;
use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SyncCrmCreatorStages extends Command
{
    protected $signature = 'crm:sync-creator-stages {--dry-run}';

    protected $description = 'Sync CRM creator stages based on profile activation and earnings milestones.';

    private array $excludedStatuses = ['disputed', 'refunded', 'review_hold', 'pending', 'failed'];

    public function handle(): int
    {
        // Retired, not deleted: this version writes the OLD stage keys
        // (signed_up, activated, milestone_*) with month-scoped earnings, so a
        // single manual run silently reverts the July 2026 pipeline rebuild in
        // the shared database. The replacement is the admin app's
        // `php artisan crm:sync-stages`. Unscheduling was not enough — the
        // command itself has to refuse.
        $this->error('Retired: this wrote legacy stage keys and would corrupt the rebuilt pipeline.');
        $this->line('Use `php artisan crm:sync-stages` on admin.spennypiggy.co instead.');

        return self::FAILURE;

        // @phpstan-ignore-next-line -- kept for reference until the next cleanup
        $dryRun = (bool) $this->option('dry-run');

        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth();
        $endOfMonth = $now->copy()->endOfMonth();

        $rates = [];
        foreach (Currency::rates() as $iso => $rate) {
            $rates[strtoupper((string) $iso)] = (float) $rate;
        }

        $convertToGbp = function (float $amount, ?string $currency) use ($rates) {
            $currency = strtoupper($currency ?: 'GBP');
            if ($currency === 'GBP') {
                return $amount;
            }

            $rate = (float) ($rates[$currency] ?? 0);
            if ($rate <= 0) {
                return null;
            }

            return $amount / $rate;
        };

        $creatorIds = CrmCreator::query()
            ->whereNull('deleted_at')
            ->whereNotNull('user_id')
            ->where('status', 'active')
            ->pluck('user_id')
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        if (count($creatorIds) === 0) {
            $this->info('No linked CRM creators found.');

            return self::SUCCESS;
        }

        $users = User::query()
            ->whereIn('id', $creatorIds)
            ->get(['id', 'role', 'profile_status_lock'])
            ->keyBy('id');

        $monthEarnings = FinancialTransaction::query()
            ->where('type', 'income')
            ->whereNotIn('status', $this->excludedStatuses)
            ->whereIn('user_id', $creatorIds)
            ->whereBetween('transaction_date', [$startOfMonth, $endOfMonth])
            ->select('user_id', 'currency', DB::raw('SUM(net_amount + vat_amount) as total'))
            ->groupBy('user_id', 'currency')
            ->get();

        $monthEarningsGbp = [];
        foreach ($monthEarnings as $row) {
            $userId = (int) $row->user_id;
            $converted = $convertToGbp((float) $row->total, (string) $row->currency);
            if ($converted === null) {
                continue;
            }
            $monthEarningsGbp[$userId] = ($monthEarningsGbp[$userId] ?? 0) + (float) $converted;
        }

        $firstSaleCounts = FinancialTransaction::query()
            ->where('type', 'income')
            ->whereNotIn('status', $this->excludedStatuses)
            ->whereIn('user_id', $creatorIds)
            ->select('user_id', DB::raw('COUNT(*) as c'))
            ->groupBy('user_id')
            ->pluck('c', 'user_id')
            ->toArray();

        $updated = 0;

        $crmCreators = CrmCreator::query()
            ->whereNull('deleted_at')
            ->whereNotNull('user_id')
            ->where('status', 'active')
            ->get();

        DB::beginTransaction();
        try {
            foreach ($crmCreators as $crmCreator) {
                $userId = (int) $crmCreator->user_id;
                $user = $users[$userId] ?? null;
                if (! $user) {
                    continue;
                }

                if ($crmCreator->crm_stage === 'vip_managed') {
                    continue;
                }

                $fromStage = (string) $crmCreator->crm_stage;
                $toStage = $fromStage;

                if (in_array($fromStage, ['prospect', 'outreach_sent', 'in_conversation'], true)) {
                    $toStage = 'signed_up';
                }

                if ((int) $user->role === 1 && (int) $user->profile_status_lock === 2) {
                    if ($this->stageRank($toStage) < $this->stageRank('activated')) {
                        $toStage = 'activated';
                    }
                }

                $hasFirstSale = ((int) ($firstSaleCounts[$userId] ?? 0)) > 0;
                if ($hasFirstSale) {
                    if ($this->stageRank($toStage) < $this->stageRank('first_sale')) {
                        $toStage = 'first_sale';
                    }
                }

                $earnings = (float) ($monthEarningsGbp[$userId] ?? 0);
                $milestoneStage = $this->milestoneStageForMonthlyEarnings($earnings);
                if ($milestoneStage && $this->stageRank($toStage) < $this->stageRank($milestoneStage)) {
                    $toStage = $milestoneStage;
                }

                if ($fromStage !== $toStage) {
                    if (! $dryRun) {
                        $crmCreator->crm_stage = $toStage;
                        $crmCreator->save();

                        CrmCreatorStageHistory::create([
                            'crm_creator_id' => $crmCreator->id,
                            'from_stage' => $fromStage,
                            'to_stage' => $toStage,
                            'trigger_source' => 'auto_sync',
                            'triggered_by' => null,
                        ]);

                        // Notify assigned CSM when creator hits a milestone
                        if (
                            in_array($toStage, ['milestone_2k', 'milestone_5k', 'milestone_10k'], true)
                            && $crmCreator->assigned_team_member_id
                        ) {
                            $adminEmail = DB::table('admins')
                                ->where('id', $crmCreator->assigned_team_member_id)
                                ->whereNull('deleted_at')
                                ->value('email');

                            if ($adminEmail) {
                                $adminName = DB::table('admins')
                                    ->where('id', $crmCreator->assigned_team_member_id)
                                    ->value('name') ?? 'Team';
                                $stageLabelMap = ['milestone_2k' => '£2k', 'milestone_5k' => '£5k', 'milestone_10k' => '£10k'];
                                $stageLabel = $stageLabelMap[$toStage] ?? $toStage;
                                $creatorName = $crmCreator->full_name ?: $crmCreator->email ?: "Creator #{$crmCreator->id}";
                                $adminUrl = config('app.url');

                                $html = "<!DOCTYPE html><html><body style='margin:0;padding:24px;background:#0a0a0b;font-family:sans-serif'>".
                                    "<div style='max-width:560px;margin:0 auto;background:#151618;border-radius:16px;padding:28px;border:1px solid rgba(255,255,255,0.06)'>".
                                    "<div style='font-size:32px;margin-bottom:12px'>🎉</div>".
                                    "<h2 style='color:#fff;font-size:18px;margin:0 0 8px'>Milestone Reached: {$stageLabel}</h2>".
                                    "<p style='color:#9ca3af;font-size:14px;margin:0 0 20px'>Hi {$adminName}, your creator <strong style='color:#fff'>{$creatorName}</strong> has reached the <strong style='color:#8C52FF'>{$stageLabel}</strong> monthly earnings milestone.</p>".
                                    "<a href='{$adminUrl}/crm/creators/{$crmCreator->id}' style='display:inline-block;background:#8C52FF;color:#fff;text-decoration:none;font-weight:700;padding:10px 22px;border-radius:9999px;font-size:13px'>View Creator →</a>".
                                    "<p style='color:#374151;font-size:11px;margin-top:20px'>SpennPiggy Admin · CRM Alerts</p>".
                                    '</div></body></html>';

                                try {
                                    Mail::html($html, function ($message) use ($adminEmail, $adminName, $creatorName, $stageLabel) {
                                        $message->to($adminEmail, $adminName)
                                            ->subject("🎉 {$creatorName} hit the {$stageLabel} milestone!");
                                    });
                                } catch (\Throwable $e) {
                                    // Non-fatal — log and continue
                                    Log::warning("CRM milestone email failed for creator #{$crmCreator->id}: ".$e->getMessage());
                                }
                            }
                        }
                    }
                    $updated++;
                }
            }

            if ($dryRun) {
                DB::rollBack();
            } else {
                DB::commit();
            }
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }

        $this->info("Synced CRM creator stages. Updated: {$updated}".($dryRun ? ' (dry-run)' : ''));

        return self::SUCCESS;
    }

    private function milestoneStageForMonthlyEarnings(float $earningsGbp): ?string
    {
        if ($earningsGbp >= 10000) {
            return 'milestone_10k';
        }
        if ($earningsGbp >= 5000) {
            return 'milestone_5k';
        }
        if ($earningsGbp >= 2000) {
            return 'milestone_2k';
        }
        if ($earningsGbp >= 500) {
            return 'milestone_500';
        }

        return null;
    }

    private function stageRank(string $stage): int
    {
        return match ($stage) {
            'prospect' => 10,
            'outreach_sent' => 20,
            'in_conversation' => 30,
            'signed_up' => 40,
            'activated' => 50,
            'first_sale' => 60,
            'milestone_500' => 70,
            'milestone_2k' => 80,
            'milestone_5k' => 90,
            'milestone_10k' => 100,
            'vip_managed' => 110,
            default => 0,
        };
    }
}
