<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupUnpaidFinancialTransactions extends Command
{
    protected $signature = 'finance:cleanup-unpaid {--user_id= : Limit to creator user_id (integer)} {--apply : Apply changes (default is dry-run)}';

    protected $description = 'Soft delete financial_transactions created for unpaid / not-captured payments';

    public function handle(): int
    {
        $apply = (bool) $this->option('apply');
        $userId = $this->option('user_id') ? (int) $this->option('user_id') : null;

        $this->line($apply ? 'Mode: APPLY' : 'Mode: DRY-RUN');
        if ($userId) {
            $this->line('Filter: user_id=' . $userId);
        }

        $total = 0;
        $total += $this->cleanupBills($userId, $apply);
        $total += $this->cleanupMemberships($userId, $apply);
        $total += $this->cleanupShops($userId, $apply);
        $total += $this->cleanupWishes($userId, $apply);
        $total += $this->cleanupTips($userId, $apply);
        $total += $this->cleanupPiggyPots($userId, $apply);
        $total += $this->cleanupTasks($userId, $apply);

        $this->newLine();
        $this->info('Total affected rows: ' . $total);

        return self::SUCCESS;
    }

    private function softDeleteIds(array $ids, bool $apply): int
    {
        if (empty($ids)) {
            return 0;
        }

        if (!$apply) {
            return count($ids);
        }

        $now = now();
        return DB::table('financial_transactions')
            ->whereIn('id', $ids)
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => $now,
                'updated_at' => $now,
            ]);
    }

    private function cleanupBills(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'refunded', 'disputed', 'review_hold', 'succeeded'];

        $q = DB::table('financial_transactions as ft')
            ->join('bill_payments as bp', 'bp.id', '=', 'ft.source_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\BillPayment')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('bp.status')
                    ->orWhereNotIn('bp.status', $allowed);
            })
            ->where(function ($w) {
                $w->whereNull('bp.total_paid')
                    ->orWhere('bp.total_paid', '<=', 0);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Bills unpaid: ' . $count);
        return $count;
    }

    private function cleanupMemberships(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'refunded', 'disputed', 'review_hold', 'succeeded'];

        $q = DB::table('financial_transactions as ft')
            ->join('membership_payments as mp', 'mp.id', '=', 'ft.source_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\MembershipPayment')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('mp.status')
                    ->orWhereNotIn('mp.status', $allowed);
            })
            ->where(function ($w) {
                $w->whereNull('mp.total_paid')
                    ->orWhere('mp.total_paid', '<=', 0);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Memberships unpaid: ' . $count);
        return $count;
    }

    private function cleanupShops(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'refunded', 'disputed', 'review_hold', 'succeeded'];

        $q = DB::table('financial_transactions as ft')
            ->join('shop_payments as sp', 'sp.id', '=', 'ft.source_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\ShopPayment')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('sp.payment_status')
                    ->orWhereNotIn('sp.payment_status', $allowed);
            })
            ->where(function ($w) {
                $w->whereNull('sp.total_paid')
                    ->orWhere('sp.total_paid', '<=', 0);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Shops unpaid: ' . $count);
        return $count;
    }

    private function cleanupWishes(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'refunded', 'disputed', 'review_hold'];

        $q = DB::table('financial_transactions as ft')
            ->join('stripe_payment_items as spi', 'spi.id', '=', 'ft.source_id')
            ->join('stripe_payment_details as spd', 'spd.id', '=', 'spi.stripe_payment_detail_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\StripePaymentItems')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('spd.payment_status')
                    ->orWhereNotIn('spd.payment_status', $allowed);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Wishes unpaid: ' . $count);
        return $count;
    }

    private function cleanupTips(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'refunded', 'disputed', 'review_hold', 'succeeded'];

        $q = DB::table('financial_transactions as ft')
            ->join('tip_goals_payments as tp', 'tp.id', '=', 'ft.source_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\TipGoalsPayment')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('tp.status')
                    ->orWhereNotIn('tp.status', $allowed);
            })
            ->where(function ($w) {
                $w->whereNull('tp.total_paid')
                    ->orWhere('tp.total_paid', '<=', 0);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Tips unpaid: ' . $count);
        return $count;
    }

    private function cleanupPiggyPots(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'succeeded', 'refunded', 'disputed', 'review_hold'];

        $q = DB::table('financial_transactions as ft')
            ->join('piggy_pot_contributions as pc', 'pc.id', '=', 'ft.source_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\PiggyPotContribution')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('pc.status')
                    ->orWhereNotIn('pc.status', $allowed);
            })
            ->where(function ($w) {
                $w->whereNull('pc.total_paid')
                    ->orWhere('pc.total_paid', '<=', 0);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Piggy pots unpaid: ' . $count);
        return $count;
    }

    private function cleanupTasks(?int $userId, bool $apply): int
    {
        $allowed = ['paid', 'completed', 'completed_accepted', 'paid_out', 'disputed', 'refunded'];

        $q = DB::table('financial_transactions as ft')
            ->join('task_purchases as tp', 'tp.id', '=', 'ft.source_id')
            ->whereNull('ft.deleted_at')
            ->where('ft.type', 'income')
            ->where('ft.source_type', 'App\\Models\\TaskPurchase')
            ->where(function ($w) use ($allowed) {
                $w->whereNull('tp.status')
                    ->orWhereNotIn('tp.status', $allowed);
            })
            ->where(function ($w) {
                $w->whereNull('tp.total_paid')
                    ->orWhere('tp.total_paid', '<=', 0);
            });

        if ($userId) {
            $q->where('ft.user_id', $userId);
        }

        $ids = $q->pluck('ft.id')->all();
        $count = $this->softDeleteIds($ids, $apply);
        $this->line('Tasks unpaid: ' . $count);
        return $count;
    }
}

