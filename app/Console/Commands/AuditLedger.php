<?php

namespace App\Console\Commands;

use App\Models\BillPayment;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentItems;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Reconcile the payment tables against the ledger and report every disagreement.
 *
 * The earnings dashboard, Support History, the Purchase Hub and the payout engine all
 * read FinancialTransaction. A payment that never produced a ledger row is therefore
 * money the creator is not shown, not paid, and cannot be asked about — and nothing
 * errors, so it stays invisible. This command is what makes that visible.
 *
 * Read-only by design. It reports; `finance:sync-transactions` and
 * `finance:backfill-ledger-gross` are what repair.
 */
class AuditLedger extends Command
{
    protected $signature = 'finance:audit-ledger
                            {--days=90 : Only examine payments created in the last N days (0 = all time)}
                            {--user= : Restrict to one creator id}
                            {--sample=10 : How many example ids to print per finding}
                            {--json : Emit the findings as JSON instead of a table}';

    protected $description = 'Report payments missing from the ledger, impossible amounts, and ledger rows whose source has gone';

    /**
     * Every payment table that must produce a ledger row, with the column its
     * paid-state is read from and the creator column used for --user.
     *
     * @var array<class-string, array{label: string, status: string, creator: ?string}>
     */
    private const SOURCES = [
        StripePaymentItems::class => ['label' => 'Wish / cart', 'status' => null, 'creator' => null],
        ShopPayment::class => ['label' => 'Shop', 'status' => 'payment_status', 'creator' => null],
        TaskPurchase::class => ['label' => 'Paid task', 'status' => 'status', 'creator' => 'creator_id'],
        PiggyPotContribution::class => ['label' => 'Piggy Pot', 'status' => 'status', 'creator' => 'creator_id'],
        MembershipPayment::class => ['label' => 'Membership', 'status' => 'status', 'creator' => null],
        BillPayment::class => ['label' => 'Bill', 'status' => 'status', 'creator' => null],
        TipGoalsPayment::class => ['label' => 'Piggy Bank', 'status' => 'status', 'creator' => null],
    ];

    /** A payment in any of these states is not expected to have earned anything. */
    private const UNPAID_STATUSES = [
        'refunded', 'failed', 'cancelled', 'canceled', 'disputed', 'expired',
        'pending', 'initiated', 'processing', 'created', 'unpaid', 'requires_payment',
    ];

    public function handle(): int
    {
        $days = (int) $this->option('days');
        $sample = max(1, (int) $this->option('sample'));
        $userId = $this->option('user');
        $since = $days > 0 ? now()->subDays($days) : null;

        $findings = [];

        foreach (self::SOURCES as $class => $meta) {
            $findings[] = $this->missingLedgerRows($class, $meta, $since, $userId, $sample);
        }

        $findings[] = $this->impossibleAmounts($since, $userId, $sample);
        $findings[] = $this->orphanedLedgerRows($since, $userId, $sample);

        $findings = array_values(array_filter($findings));

        if ($this->option('json')) {
            $this->line(json_encode($findings, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            return $findings === [] ? self::SUCCESS : self::FAILURE;
        }

        if ($findings === []) {
            $this->info('Ledger is consistent — every settled payment has a ledger row and every ledger row adds up.');

            return self::SUCCESS;
        }

        $this->table(
            ['Finding', 'Rows', 'Example ids'],
            array_map(fn ($f) => [
                $f['finding'],
                $f['count'],
                implode(', ', $f['sample']),
            ], $findings)
        );

        $total = array_sum(array_column($findings, 'count'));
        $this->warn("{$total} row(s) need attention.");
        $this->line('Repair with: php artisan finance:sync-transactions   (missing rows)');
        $this->line('             php artisan finance:backfill-ledger-gross   (impossible amounts)');

        // A non-zero exit is what lets this be wired into a monitor later without
        // anyone having to parse the table.
        Log::info('finance:audit-ledger found ledger inconsistencies', ['findings' => $findings]);

        return self::FAILURE;
    }

    /**
     * Settled payments with no ledger row at all — the creator is not shown this money
     * and the payout run will never pay it.
     */
    private function missingLedgerRows(string $class, array $meta, $since, $userId, int $sample): ?array
    {
        $query = $class::query();

        if ($since) {
            $query->where('created_at', '>=', $since);
        }

        if ($userId && $meta['creator']) {
            $query->where($meta['creator'], $userId);
        }

        if ($meta['status']) {
            $query->whereNotIn($meta['status'], self::UNPAID_STATUSES);
        } elseif ($class === StripePaymentItems::class) {
            // A cart line item carries no status of its own — the checkout it belongs
            // to does. Without this every unpaid basket would be reported as missing.
            $query->whereHas('payment', fn ($p) => $p->where('payment_status', 'paid'));
        }

        // A ledger row is keyed on (source_type, source_id); anything without one is the
        // finding. Done as a NOT EXISTS so the comparison stays in the database rather
        // than pulling both tables into memory.
        $query->whereNotExists(function ($sub) use ($class) {
            $sub->selectRaw('1')
                ->from('financial_transactions')
                ->whereColumn('financial_transactions.source_id', (new $class)->getTable().'.id')
                ->where('financial_transactions.source_type', $class)
                ->whereNull('financial_transactions.deleted_at');
        });

        $count = (clone $query)->count();
        if ($count === 0) {
            return null;
        }

        return [
            'finding' => $meta['label'].' payments with no ledger row',
            'source' => $class,
            'count' => $count,
            'sample' => (clone $query)->orderByDesc('id')->limit($sample)->pluck('id')->all(),
        ];
    }

    /**
     * Ledger rows recording a supporter charge BELOW the creator's own gross.
     *
     * Arithmetically impossible — the supporter price is the creator's gross plus every
     * fee — so it can only mean the row was priced wrongly. It understates the buyer's
     * spend everywhere the buyer's own record is shown.
     */
    private function impossibleAmounts($since, $userId, int $sample): ?array
    {
        $query = FinancialTransaction::where('type', 'income')
            ->whereRaw('gross_amount + 0.01 < (COALESCE(net_amount, 0) + COALESCE(vat_amount, 0))')
            ->where(function ($q) {
                $q->where('net_amount', '>', 0)->orWhere('vat_amount', '>', 0);
            });

        if ($since) {
            $query->where('transaction_date', '>=', $since);
        }
        if ($userId) {
            $query->where('user_id', $userId);
        }

        $count = (clone $query)->count();
        if ($count === 0) {
            return null;
        }

        return [
            'finding' => 'Ledger rows where the supporter is recorded paying less than the creator earned',
            'source' => FinancialTransaction::class,
            'count' => $count,
            'sample' => (clone $query)->orderByDesc('id')->limit($sample)->pluck('id')->all(),
        ];
    }

    /**
     * Ledger rows whose payment row has been deleted.
     *
     * These still count toward a creator's totals while nothing can explain them, and a
     * task row in this state fails the fulfilment gate silently.
     */
    private function orphanedLedgerRows($since, $userId, int $sample): ?array
    {
        $orphans = [];

        foreach (array_keys(self::SOURCES) as $class) {
            $query = FinancialTransaction::where('type', 'income')
                ->where('source_type', $class)
                ->whereNotExists(function ($sub) use ($class) {
                    $sub->selectRaw('1')
                        ->from((new $class)->getTable())
                        ->whereColumn((new $class)->getTable().'.id', 'financial_transactions.source_id');
                });

            if ($since) {
                $query->where('transaction_date', '>=', $since);
            }
            if ($userId) {
                $query->where('user_id', $userId);
            }

            $orphans = array_merge($orphans, $query->orderByDesc('id')->limit($sample)->pluck('id')->all());
        }

        if ($orphans === []) {
            return null;
        }

        return [
            'finding' => 'Ledger rows whose payment record no longer exists',
            'source' => FinancialTransaction::class,
            'count' => count($orphans),
            'sample' => array_slice($orphans, 0, $sample),
        ];
    }
}
