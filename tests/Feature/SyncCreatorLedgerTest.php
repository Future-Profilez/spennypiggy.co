<?php

namespace Tests\Feature;

use App\Jobs\SyncCreatorLedger;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Bus;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SyncCreatorLedgerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_a_sale_schedules_a_ledger_sync_for_that_creator(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule(42);

        Bus::assertDispatched(SyncCreatorLedger::class, fn ($job) => $job->creatorId === 42);
    }

    /**
     * The command reads every payment table for the creator, so a creator taking
     * several sales in a minute must not queue one full scan per sale.
     */
    public function test_several_sales_in_the_window_queue_only_one_sync(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule(7);
        SyncCreatorLedger::schedule(7);
        SyncCreatorLedger::schedule(7);

        Bus::assertDispatchedTimes(SyncCreatorLedger::class, 1);
    }

    /** Two creators selling at the same time are unrelated and both get a sync. */
    public function test_the_debounce_is_per_creator(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule(1);
        SyncCreatorLedger::schedule(2);

        Bus::assertDispatchedTimes(SyncCreatorLedger::class, 2);
    }

    /**
     * ⚠️ The lock is released when the run STARTS, not when it ends. A sale
     * landing after that point must re-arm a fresh sync rather than being
     * swallowed by a window the previous run already covered.
     */
    public function test_a_sale_after_the_run_begins_arms_a_new_sync(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule(9);
        Bus::assertDispatchedTimes(SyncCreatorLedger::class, 1);

        // The run releases the lock before doing its work.
        Cache::forget('creator_ledger_sync:9');

        SyncCreatorLedger::schedule(9);
        Bus::assertDispatchedTimes(SyncCreatorLedger::class, 2);
    }

    /** A payment with no resolvable creator must not queue a sync for nobody. */
    public function test_a_missing_creator_id_schedules_nothing(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule(null);
        SyncCreatorLedger::schedule(0);

        Bus::assertNotDispatched(SyncCreatorLedger::class);
    }

    /**
     * 🚨 The webhook passes payments.creator_id, which is the creator's UUID —
     * not users.id. The old ?int signature raised a TypeError at argument
     * coercion, OUTSIDE schedule()'s own try and past the caller's
     * catch (\Exception), so every checkout.session.completed event failed
     * before its module fan-out (deliverable, ledger, emails) ever ran.
     */
    public function test_a_creator_uuid_resolves_to_the_users_id(): void
    {
        Bus::fake();

        $creator = User::factory()->create();

        SyncCreatorLedger::schedule($creator->uuid);

        Bus::assertDispatched(SyncCreatorLedger::class, fn ($job) => $job->creatorId === $creator->id);
    }

    /** An unknown UUID is a data fault, never a crash and never a sync for nobody. */
    public function test_an_unknown_uuid_schedules_nothing_and_does_not_throw(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule('cus_notAnAccountId');
        SyncCreatorLedger::schedule('11111111-2222-3333-4444-555555555555');

        Bus::assertNotDispatched(SyncCreatorLedger::class);
    }

    /** Stripe metadata carries the numeric users.id as a string. */
    public function test_a_numeric_string_id_is_accepted(): void
    {
        Bus::fake();

        SyncCreatorLedger::schedule('42');

        Bus::assertDispatched(SyncCreatorLedger::class, fn ($job) => $job->creatorId === 42);
    }

    /** Scheduling sits on the payment path and must never be able to break it. */
    public function test_scheduling_never_throws(): void
    {
        Cache::shouldReceive('add')->andThrow(new \RuntimeException('cache down'));

        SyncCreatorLedger::schedule(5);

        $this->assertTrue(true, 'A cache failure must not propagate into the payment path.');
    }
}
