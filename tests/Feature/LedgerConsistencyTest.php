<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Shop;
use App\Models\ShopPayment;
use App\Models\Task;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Services\FinancialService;
use App\Services\Ledger\LedgerRules;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The four money surfaces — the creator's earnings dashboard, Support History, the
 * Purchase Hub and the payout engine — must answer the same question the same way.
 *
 * Before LedgerRules they each had their own implementation and disagreed: Support
 * History had no physical-shop gate at all, and the earnings dashboard excluded every
 * unfinished task while the payout engine paid instant ones. These tests pin the shared
 * definition down.
 */
class LedgerConsistencyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Helpers::clearCurrencyCache();
        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);
    }

    private function creator(): User
    {
        return User::factory()->create(['default_currency' => 'GBP', 'role' => 1]);
    }

    private function ledgerRow(User $creator, string $sourceType, int $sourceId, array $overrides = []): FinancialTransaction
    {
        return FinancialTransaction::create(array_merge([
            'user_id' => $creator->id,
            'supporter_id' => null,
            'source_type' => $sourceType,
            'source_id' => $sourceId,
            'type' => 'income',
            'gross_amount' => 120.00,
            'platform_fee' => 18.00,
            'stripe_fee' => 2.00,
            'vat_amount' => 0.00,
            'net_amount' => 100.00,
            'currency' => 'GBP',
            'status' => 'completed',
            'description' => 'test',
            'transaction_date' => now(),
        ], $overrides));
    }

    private function taskPurchase(User $creator, string $taskType, string $status): TaskPurchase
    {
        $task = Task::create([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $creator->id,
            'title' => 'A task',
            'price' => 100,
            'type' => $taskType,
            'is_approved' => 1,
        ]);

        // task_purchases.supporter_id is NOT NULL — a Paid Task is one of the four
        // checkouts that force login, so there is never a guest buyer.
        return TaskPurchase::create([
            'uuid' => (string) Str::uuid(),
            'task_id' => $task->id,
            'creator_id' => $creator->id,
            'supporter_id' => User::factory()->create()->id,
            'amount' => 100,
            'total_paid' => 120,
            'currency' => 'GBP',
            'status' => $status,
        ]);
    }

    private function shopPayment(User $creator, string $shopType, ?string $deliverableStatus): ShopPayment
    {
        $shop = Shop::factory()->create(['user_id' => $creator->id, 'type' => $shopType]);

        $payment = ShopPayment::create([
            'uuid' => (string) Str::uuid(),
            'session_id' => 'cs_'.Str::random(20),
            'shop_id' => $shop->id,
            'user_id' => null,
            'amount' => 100,
            'total_paid' => 120,
            'currency' => 'GBP',
            'payment_status' => 'paid',
        ]);

        if ($deliverableStatus) {
            Deliverable::create([
                'session_id' => $payment->session_id,
                'creator_id' => $creator->id,
                'gifter_id' => User::factory()->create()->id,
                'product_type' => 'shop',
                'product_id' => $shop->id,
                'item_id' => $shop->id,
                'deliverable_type' => 'shipping',
                'status' => $deliverableStatus,
            ]);
        }

        return $payment;
    }

    /**
     * The regression that started this: the payout engine pays an instant task the
     * moment it is bought, but the earnings dashboard excluded every task that was not
     * 'completed'. A creator was paid money their own dashboard never showed.
     */
    public function test_instant_task_is_earned_even_when_not_marked_completed(): void
    {
        $creator = $this->creator();
        $purchase = $this->taskPurchase($creator, 'instant', 'paid');
        $ft = $this->ledgerRow($creator, TaskPurchase::class, $purchase->id);

        $map = LedgerRules::fulfilmentMap(collect([$ft]));

        $this->assertTrue($map[$ft->id], 'An instant task is fulfilled on payment.');
        $this->assertTrue(LedgerRules::countsTowardTotals($ft, $map));
    }

    /** A timed task sits in escrow until the buyer accepts — 'delivered' is not earned. */
    public function test_timed_task_delivered_but_not_accepted_is_not_earned(): void
    {
        $creator = $this->creator();
        $purchase = $this->taskPurchase($creator, 'timed', 'delivered');
        $ft = $this->ledgerRow($creator, TaskPurchase::class, $purchase->id);

        $map = LedgerRules::fulfilmentMap(collect([$ft]));

        $this->assertFalse($map[$ft->id]);
        $this->assertSame('awaiting_delivery', LedgerRules::state($ft, $map));
    }

    public function test_timed_task_counts_once_accepted(): void
    {
        $creator = $this->creator();
        $purchase = $this->taskPurchase($creator, 'timed', 'completed_accepted');
        $ft = $this->ledgerRow($creator, TaskPurchase::class, $purchase->id);

        $map = LedgerRules::fulfilmentMap(collect([$ft]));

        $this->assertTrue(LedgerRules::countsTowardTotals($ft, $map));
    }

    /**
     * Support History had NO physical-shop gate, so its "Received" total was higher
     * than both the dashboard and the payout run for the same money.
     */
    public function test_undelivered_physical_shop_order_is_not_earned(): void
    {
        $creator = $this->creator();
        $payment = $this->shopPayment($creator, 'physical', 'processing');
        $ft = $this->ledgerRow($creator, ShopPayment::class, $payment->id);

        $map = LedgerRules::fulfilmentMap(collect([$ft]));

        $this->assertFalse($map[$ft->id]);
    }

    public function test_delivered_physical_shop_order_is_earned(): void
    {
        $creator = $this->creator();
        $payment = $this->shopPayment($creator, 'physical', 'delivered');
        $ft = $this->ledgerRow($creator, ShopPayment::class, $payment->id);

        $this->assertTrue(LedgerRules::fulfilmentMap(collect([$ft]))[$ft->id]);
    }

    /** A digital sale is fulfilled on payment — it has no parcel to wait for. */
    public function test_digital_shop_order_is_earned_without_a_deliverable(): void
    {
        $creator = $this->creator();
        $payment = $this->shopPayment($creator, 'digital', null);
        $ft = $this->ledgerRow($creator, ShopPayment::class, $payment->id);

        $this->assertTrue(LedgerRules::fulfilmentMap(collect([$ft]))[$ft->id]);
    }

    /**
     * An orphaned task row must stay INCLUDED. The payout engine pays it (its gate can
     * only exclude a task it can find), so excluding it here would show the creator
     * less than they are paid — the same class of bug, in the other direction.
     */
    public function test_orphaned_task_row_still_counts_so_it_cannot_undercut_the_payout(): void
    {
        $creator = $this->creator();
        $ft = $this->ledgerRow($creator, TaskPurchase::class, 999999);

        $this->assertTrue(LedgerRules::fulfilmentMap(collect([$ft]))[$ft->id]);
    }

    /** A refunded row is visible but never counted. */
    public function test_refunded_row_is_visible_but_not_counted(): void
    {
        $creator = $this->creator();
        $ft = $this->ledgerRow($creator, TipGoalsPayment::class, 1, ['status' => 'refunded']);

        $map = LedgerRules::fulfilmentMap(collect([$ft]));

        $this->assertFalse(LedgerRules::countsTowardTotals($ft, $map));
        $this->assertSame('refunded', LedgerRules::state($ft, $map));
        $this->assertContains('refunded', LedgerRules::VISIBLE_STATUSES);
    }

    /** Bank/SEPA money still clearing is neither earned nor a failure. */
    public function test_processing_row_reads_as_awaiting_settlement(): void
    {
        $creator = $this->creator();
        $ft = $this->ledgerRow($creator, TipGoalsPayment::class, 2, ['status' => 'processing']);

        $map = LedgerRules::fulfilmentMap(collect([$ft]));

        $this->assertSame('awaiting_settlement', LedgerRules::state($ft, $map));
        $this->assertFalse(LedgerRules::countsTowardTotals($ft, $map));
    }

    /**
     * gross_amount is the SUPPORTER's charge and net+vat is the creator's gross — the
     * two are different numbers and were repeatedly confused.
     */
    public function test_buyer_paid_and_creator_gross_are_distinct(): void
    {
        $creator = $this->creator();
        $ft = $this->ledgerRow($creator, TipGoalsPayment::class, 3, [
            'gross_amount' => 121.00,
            'net_amount' => 100.00,
            'vat_amount' => 5.00,
        ]);

        $this->assertSame(121.00, LedgerRules::buyerPaid($ft));
        $this->assertSame(105.00, LedgerRules::creatorGross($ft));
        $this->assertSame(100.00, LedgerRules::creatorNet($ft));
    }

    /** A legacy row with no gross reports the purchase, never £0. */
    public function test_buyer_paid_falls_back_when_gross_was_never_written(): void
    {
        $creator = $this->creator();
        $ft = $this->ledgerRow($creator, TipGoalsPayment::class, 4, [
            'gross_amount' => 0,
            'net_amount' => 100.00,
            'vat_amount' => 0,
            'platform_fee' => 18.00,
            'stripe_fee' => 2.00,
        ]);

        $this->assertSame(120.00, LedgerRules::buyerPaid($ft));
    }

    /** A supporter is never handed the creator's fee split or reserve. */
    public function test_breakdown_carries_the_full_arithmetic(): void
    {
        $creator = $this->creator();
        $ft = $this->ledgerRow($creator, TipGoalsPayment::class, 5, [
            'reserve_amount' => 10.00,
            'reserve_status' => 'held',
        ]);

        $breakdown = LedgerRules::breakdown($ft, LedgerRules::fulfilmentMap(collect([$ft])));

        $this->assertSame(120.00, $breakdown['buyer_paid']);
        $this->assertSame(20.00, $breakdown['total_fees']);
        $this->assertSame(100.00, $breakdown['creator_net']);
        $this->assertSame(10.00, $breakdown['reserve_amount']);
        $this->assertSame('settled', $breakdown['state']);
        $this->assertTrue($breakdown['counts_toward_totals']);
    }

    /**
     * The end-to-end property: what the dashboard reports as net income must be exactly
     * the sum of the rows LedgerRules says are earned. An undelivered physical order and
     * a delivered-but-unaccepted task are both excluded; an instant task is not.
     */
    public function test_dashboard_net_income_equals_the_earned_rows(): void
    {
        $creator = $this->creator();

        // Earned: instant task + delivered physical order.
        $this->ledgerRow($creator, TaskPurchase::class, $this->taskPurchase($creator, 'instant', 'paid')->id);
        $this->ledgerRow($creator, ShopPayment::class, $this->shopPayment($creator, 'physical', 'delivered')->id);

        // Not earned: undelivered parcel, unaccepted task, refunded tip.
        $this->ledgerRow($creator, ShopPayment::class, $this->shopPayment($creator, 'physical', 'processing')->id);
        $this->ledgerRow($creator, TaskPurchase::class, $this->taskPurchase($creator, 'timed', 'delivered')->id);
        $this->ledgerRow($creator, TipGoalsPayment::class, 77, ['status' => 'refunded']);

        $summary = app(FinancialService::class)->getSummary(
            $creator,
            now()->subYear(),
            now()->addDay(),
            'GBP'
        );

        $this->assertSame(200.0, round($summary['net_income'], 2), 'Only the two earned rows count.');
    }

    /**
     * The supporter's spend and the creator's earnings are different figures drawn from
     * the same row, and both surfaces must read them from LedgerRules rather than
     * picking a column each.
     */
    public function test_supporter_spend_reads_the_charge_not_the_creator_net(): void
    {
        $creator = $this->creator();
        $buyer = User::factory()->create(['default_currency' => 'GBP']);

        $ft = $this->ledgerRow($creator, TipGoalsPayment::class, 8, [
            'supporter_id' => $buyer->id,
            'gross_amount' => 120.00,
            'net_amount' => 100.00,
        ]);

        $this->assertSame(120.00, LedgerRules::buyerPaid($ft));
        $this->assertSame(100.00, LedgerRules::creatorNet($ft));
        $this->assertNotSame(LedgerRules::buyerPaid($ft), LedgerRules::creatorNet($ft));
    }
}
