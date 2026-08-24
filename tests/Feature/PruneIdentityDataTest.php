<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Covers `identity:prune`.
 *
 * Two things are being defended here, and the second matters more than the
 * first: that data past the window IS released, and that data belonging to an
 * open dispute, an unsettled payout or a suspended account is NEVER released no
 * matter how old it is. Deleting identity evidence during a live dispute is
 * worse than keeping it too long, so every exclusion rule gets its own test.
 */
class PruneIdentityDataTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('identity_retention.enabled', true);
        config()->set('identity_retention.retention_days', 365);
    }

    /**
     * A user carrying both an aged `user_documents` row and an aged identity
     * payload, with no financial history of any kind.
     */
    private function agedUser(int $daysAgo = 800, array $overrides = []): object
    {
        $uuid = (string) Str::uuid();

        $id = DB::table('users')->insertGetId(array_merge([
            'uuid' => $uuid,
            'name' => 'Aged',
            'username' => 'aged'.Str::random(8),
            'email' => Str::random(10).'@example.test',
            'password' => 'x',
            'identity_admin_reviewed_at' => now()->subDays($daysAgo),
            'identity_verified_at' => now()->subDays($daysAgo),
            'identity_status' => 1,
            'identity_admin_status' => 1,
            'identity_verification_details' => '{"document":"passport"}',
            'identity_admin_notes' => 'Looked fine to me',
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now(),
        ], $overrides));

        DB::table('user_documents')->insert([
            'uuid' => (string) Str::uuid(),
            'user_id' => $id,
            'doc_type' => 'ID_CARD',
            'front' => (string) Str::uuid(),
            'back' => (string) Str::uuid(),
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now()->subDays($daysAgo),
        ]);

        return (object) ['id' => $id, 'uuid' => $uuid];
    }

    private function docCountFor(int $userId): int
    {
        return DB::table('user_documents')->where('user_id', $userId)->count();
    }

    private function payloadIntact(int $userId): bool
    {
        $user = DB::table('users')->where('id', $userId)->first();

        return $user->identity_verification_details !== null
            && $user->identity_admin_notes !== null;
    }

    // ── The window ──────────────────────────────────────────────────────────

    public function test_it_releases_identity_data_past_the_window(): void
    {
        $user = $this->agedUser(800);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(0, $this->docCountFor($user->id));
        $this->assertFalse($this->payloadIntact($user->id));
    }

    public function test_it_leaves_identity_data_inside_the_window_alone(): void
    {
        $user = $this->agedUser(10);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
        $this->assertTrue($this->payloadIntact($user->id));
    }

    /**
     * The status columns are the OUTCOME of a check, not evidence from it.
     * Clearing them would silently un-verify a live creator.
     */
    public function test_it_keeps_the_verification_outcome_columns(): void
    {
        $user = $this->agedUser(800);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $row = DB::table('users')->where('id', $user->id)->first();

        $this->assertSame(1, (int) $row->identity_status);
        $this->assertSame(1, (int) $row->identity_admin_status);
        $this->assertNotNull($row->identity_verified_at);
        $this->assertNotNull($row->identity_admin_reviewed_at);
    }

    /** A mistyped `--days=0` must not be able to empty the table. */
    public function test_the_retention_floor_cannot_be_undercut(): void
    {
        $user = $this->agedUser(30);

        $this->artisan('identity:prune', ['--days' => 0])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
    }

    // ── Arming ──────────────────────────────────────────────────────────────

    public function test_dry_run_deletes_nothing(): void
    {
        $user = $this->agedUser(800);

        $this->artisan('identity:prune', ['--days' => 365, '--dry-run' => true])
            ->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
        $this->assertTrue($this->payloadIntact($user->id));
    }

    public function test_it_is_report_only_until_armed(): void
    {
        config()->set('identity_retention.enabled', false);

        $user = $this->agedUser(800);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
        $this->assertTrue($this->payloadIntact($user->id));
    }

    // ── Exclusions ──────────────────────────────────────────────────────────

    public function test_it_never_touches_a_suspended_account(): void
    {
        $user = $this->agedUser(800, ['suspended_account' => 1]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
        $this->assertTrue($this->payloadIntact($user->id));
    }

    public function test_it_never_touches_a_creator_with_an_open_dispute(): void
    {
        $user = $this->agedUser(800);

        DB::table('disputes')->insert([
            'id' => (string) Str::uuid(),
            'creator_id' => $user->uuid,
            'stripe_dispute_id' => 'dp_open',
            'amount' => 1000,
            'currency' => 'gbp',
            'reason' => 'fraudulent',
            'status' => 'needs_response',
            'resolved_at' => null,
            'created_at' => now()->subDays(700),
        ]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
        $this->assertTrue($this->payloadIntact($user->id));
    }

    public function test_a_closed_dispute_does_not_hold_the_data(): void
    {
        $user = $this->agedUser(800);

        DB::table('disputes')->insert([
            'id' => (string) Str::uuid(),
            'creator_id' => $user->uuid,
            'stripe_dispute_id' => 'dp_closed',
            'amount' => 1000,
            'currency' => 'gbp',
            'reason' => 'fraudulent',
            'status' => 'lost',
            'resolved_at' => now()->subDays(600),
            'created_at' => now()->subDays(700),
        ]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(0, $this->docCountFor($user->id));
    }

    public function test_it_never_touches_a_creator_with_an_open_fraud_warning(): void
    {
        $user = $this->agedUser(800);

        $paymentId = (string) Str::uuid();

        DB::table('payments')->insert([
            'id' => $paymentId,
            'creator_id' => $user->uuid,
            'amount' => 1000,
            'currency' => 'gbp',
            'status' => 'succeeded',
            'created_at' => now()->subDays(700),
            'updated_at' => now()->subDays(700),
        ]);

        DB::table('early_fraud_warnings')->insert([
            'id' => (string) Str::uuid(),
            'payment_id' => $paymentId,
            'stripe_efw_id' => 'issfr_1',
            'stripe_charge_id' => 'ch_1',
            'fraud_type' => 'made_with_stolen_card',
            'closed_at' => null,
            'created_at' => now()->subDays(700),
        ]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
    }

    public function test_it_never_touches_a_creator_with_an_unsettled_payment(): void
    {
        $user = $this->agedUser(800);

        DB::table('payments')->insert([
            'id' => (string) Str::uuid(),
            'creator_id' => $user->uuid,
            'amount' => 1000,
            'currency' => 'gbp',
            'status' => 'review_hold',
            'created_at' => now()->subDays(700),
            'updated_at' => now()->subDays(700),
        ]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
    }

    /**
     * `failed` is not settled: the payout.failed webhook requeues the payment
     * into the next run, so the money is still owed.
     */
    public function test_it_never_touches_a_creator_with_an_unsettled_payout(): void
    {
        $user = $this->agedUser(800);

        DB::table('payout_records')->insert([
            'uuid' => (string) Str::uuid(),
            'creator_id' => $user->uuid,
            'stripe_payout_id' => 'po_1',
            'amount_minor' => 1000,
            'currency' => 'GBP',
            'status' => 'failed',
            'created_at' => now()->subDays(700),
            'updated_at' => now()->subDays(700),
        ]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
    }

    public function test_it_never_touches_a_creator_with_earnings_not_yet_paid_out(): void
    {
        $user = $this->agedUser(800);

        $this->ledgerRow($user->id, ['payout_run_id' => null, 'reserve_status' => 'none']);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
    }

    public function test_it_never_touches_a_creator_with_a_reserve_still_held(): void
    {
        $user = $this->agedUser(800);

        $this->ledgerRow($user->id, ['payout_run_id' => 'run_1', 'reserve_status' => 'held']);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(1, $this->docCountFor($user->id));
    }

    public function test_a_fully_settled_ledger_does_not_hold_the_data(): void
    {
        $user = $this->agedUser(800);

        $this->ledgerRow($user->id, ['payout_run_id' => 'run_1', 'reserve_status' => 'released']);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(0, $this->docCountFor($user->id));
    }

    /**
     * An orphan row — a `user_id` with no `users` row — is releasable, because
     * every exclusion is a property of a user who no longer exists.
     */
    public function test_it_releases_an_orphan_document_row(): void
    {
        DB::table('user_documents')->insert([
            'uuid' => (string) Str::uuid(),
            'user_id' => 999999,
            'doc_type' => 'ID_CARD',
            'front' => (string) Str::uuid(),
            'back' => (string) Str::uuid(),
            'created_at' => now()->subDays(800),
            'updated_at' => now()->subDays(800),
        ]);

        $this->artisan('identity:prune', ['--days' => 365])->assertSuccessful();

        $this->assertSame(0, $this->docCountFor(999999));
    }

    /**
     * 🚨 The row is not the document. `--keep-files` (and the config switch the
     * test suite runs under) removes the row while the photo ID stays on a
     * public ucarecdn.com URL — and now with nothing in the database pointing at
     * it. That is a debugging escape hatch, so it must SAY SO on every run.
     */
    public function test_keeping_the_files_is_warned_about_loudly(): void
    {
        DB::table('user_documents')->insert([
            'uuid' => (string) Str::uuid(),
            'user_id' => 888888,
            'doc_type' => 'ID_CARD',
            'front' => (string) Str::uuid(),
            'back' => (string) Str::uuid(),
            'created_at' => now()->subDays(800),
            'updated_at' => now()->subDays(800),
        ]);

        $this->artisan('identity:prune', ['--days' => 365, '--keep-files' => true])
            ->expectsOutputToContain('the photo IDs stay public')
            ->assertSuccessful();

        $this->assertSame(0, $this->docCountFor(888888));
    }

    private function ledgerRow(int $userId, array $overrides = []): void
    {
        DB::table('financial_transactions')->insert(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $userId,
            'source_type' => 'wish',
            'source_id' => 1,
            'type' => 'income',
            'gross_amount' => 10,
            'platform_fee' => 1,
            'stripe_fee' => 1,
            'net_amount' => 8,
            'reserve_amount' => 0,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => now()->subDays(700),
            'created_at' => now()->subDays(700),
            'updated_at' => now()->subDays(700),
        ], $overrides));
    }
}
