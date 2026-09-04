<?php

namespace Tests\Feature;

use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\Membership;
use App\Models\MembershipPayment;
use App\Models\User;
use App\Support\StripeCheckoutSources;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Stripe\ApiRequestor;
use Stripe\HttpClient\ClientInterface;
use Tests\TestCase;

/**
 * 🚨 THE GAP THIS PINS. Fulfilment for a bill or a membership hangs off
 * `checkout.session.completed`, which dispatches `FulfilSubscriptionCheckout`. If that
 * webhook is dropped, the job is never dispatched — and NEITHER recovery path could see
 * it: `SweepStuckPayments` (the daily safety net) and `ReconcileStripeSession` (the
 * by-hand repair) each carried their own six-table list, both missing these two. So the
 * supporter was charged, the subscription sat at `initiated` with no deliverable, no
 * ledger row and no emails, and the tool built to repair exactly that answered
 * "No payment row found".
 */
class StuckCheckoutSourcesTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        ApiRequestor::setHttpClient(null);

        parent::tearDown();
    }

    /** Every product that can be bought through a Checkout Session must be in the map. */
    public function test_the_map_covers_memberships_and_bills(): void
    {
        $models = array_map(fn ($source) => $source[1], StripeCheckoutSources::map());

        $this->assertContains(MembershipPayment::class, $models);
        $this->assertContains(BillPayment::class, $models);
        $this->assertCount(8, $models, 'A source was added or removed — update the recovery paths that read this map.');
    }

    public function test_a_bill_payment_is_found_by_its_session_and_carries_its_creators_account(): void
    {
        $creator = User::factory()->create(['role' => 1, 'account_id' => 'acct_bill_creator']);
        $supporter = User::factory()->create(['role' => 0]);

        $bill = Bills::create([
            'user_id' => $creator->id,
            'name' => 'Weekly bundle',
            'amount' => 10,
        ]);

        $payment = BillPayment::create([
            'user_id' => $supporter->id,
            'bills_id' => $bill->id,
            'session_id' => 'cs_test_bill_stuck',
            'amount' => 10,
            'status' => 'initiated',
        ]);

        [$label, $row, $account] = StripeCheckoutSources::locate('cs_test_bill_stuck');

        $this->assertSame('Bill payment', $label);
        $this->assertSame($payment->id, $row->id);
        // ⚠️ The creator is reached through the LISTING — `user_id` on the payment row is
        // the supporter who paid. Resolving it from there would retrieve the session on
        // the wrong account, which fails as "no such session".
        $this->assertSame('acct_bill_creator', $account);
    }

    public function test_a_membership_payment_is_found_by_its_session(): void
    {
        $creator = User::factory()->create(['role' => 1, 'account_id' => 'acct_member_creator']);
        $supporter = User::factory()->create(['role' => 0]);

        $membership = Membership::create([
            'user_id' => $creator->id,
            'name' => 'Inner circle',
            'amount' => 20,
        ]);

        MembershipPayment::create([
            'user_id' => $supporter->id,
            'membership_id' => $membership->id,
            'session_id' => 'cs_test_membership_stuck',
            'amount' => 20,
            'status' => 'initiated',
        ]);

        [$label, $row, $account] = StripeCheckoutSources::locate('cs_test_membership_stuck');

        $this->assertSame('Membership payment', $label);
        $this->assertNotNull($row);
        $this->assertSame('acct_member_creator', $account);
    }

    /**
     * End to end: the DAILY SWEEP now looks at bills. Before the shared map it walked six
     * tables and this row was in none of them, so a paid-but-unfulfilled bill was never
     * even questioned at Stripe.
     */
    public function test_the_daily_sweep_questions_a_stuck_bill_payment(): void
    {
        config(['services.stripe.secret' => 'sk_test_sweep']);

        ApiRequestor::setHttpClient(new class implements ClientInterface
        {
            public function request($method, $absUrl, $headers, $params, $hasFile, $apiMode = 'v1')
            {
                return [
                    json_encode([
                        'id' => basename(parse_url($absUrl, PHP_URL_PATH)),
                        'object' => 'checkout.session',
                        'payment_status' => 'paid',
                    ]),
                    200,
                    [],
                ];
            }
        });

        $creator = User::factory()->create(['role' => 1, 'account_id' => 'acct_sweep_creator']);
        $supporter = User::factory()->create(['role' => 0]);

        $bill = Bills::create(['user_id' => $creator->id, 'name' => 'Weekly bundle', 'amount' => 10]);

        $payment = BillPayment::create([
            'user_id' => $supporter->id,
            'bills_id' => $bill->id,
            'session_id' => 'cs_test_bill_sweep',
            'amount' => 10,
            'status' => 'initiated',
        ]);

        // ⚠️ Older than the sweep's default settle window — a bank debit legitimately
        // takes a day or two, so a fresh row is not yet evidence of anything.
        $payment->forceFill(['created_at' => now()->subDays(3)])->save();

        // Dry run: the assertion is that it is SEEN and questioned, not that fulfilment
        // replays — the replay path is the webhook's own and is covered by its tests.
        $this->artisan('payments:sweep-stuck', ['--dry-run' => true, '--days' => 2])
            ->expectsOutputToContain('Bill payment')
            ->assertSuccessful();
    }

    /** An unknown session must answer "nothing", never a wrong row. */
    public function test_an_unknown_session_matches_nothing(): void
    {
        [$label, $row, $account] = StripeCheckoutSources::locate('cs_test_never_existed');

        $this->assertSame('', $label);
        $this->assertNull($row);
        $this->assertNull($account);
    }
}
