<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\BlockedPaymentAlert;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * The dashboard card must report the gate that is actually stopping the money.
 *
 * A creator with no platform subscription read a green "Payments running" plate
 * while every supporter who tried to buy from them was turned away — the card
 * covered the two CONTENT rules and the subscription was not on it at all.
 */
class CreatorPaymentStatusTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    public function test_the_status_endpoint_reports_the_subscription_gate(): void
    {
        $creator = $this->creator();

        $response = $this->actingAs($creator)->getJson('/creator/activity/status');

        $response->assertOk()
            ->assertJsonStructure([
                'subscription' => ['eligible', 'status'],
                'lost_sales' => ['count', 'window_days', 'totals'],
                'links' => ['activity', 'activate_subscription'],
            ]);

        // No monthly_charges row at all is exactly the state the live creator was
        // in: never subscribed, so every purchase from them is refused.
        $response->assertJsonPath('subscription.eligible', false)
            ->assertJsonPath('subscription.status', 'no_subscription');
    }

    /**
     * ⚠️ The card builds its links from these, so a rename is a button that
     * navigates nowhere — and the fallback paths in the component would hide it.
     */
    public function test_the_links_are_real_routes(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)->getJson('/creator/activity/status')
            ->assertJsonPath('links.activity', route('creator.activity'))
            ->assertJsonPath('links.activate_subscription', route('activate-subscription'));
    }

    /**
     * 🚨 Two currencies are never summed into one figure. A creator pricing in
     * two currencies would otherwise be shown a number that is true in neither,
     * on the card whose whole job is to be believed.
     */
    public function test_lost_sales_are_totalled_per_currency(): void
    {
        $creator = $this->creator();

        BlockedPaymentAlert::record($creator, 25, 'GBP', 'no_subscription');
        BlockedPaymentAlert::record($creator, 25, 'GBP', 'no_subscription');
        BlockedPaymentAlert::record($creator, 40, 'USD', 'no_subscription');

        $lost = BlockedPaymentAlert::lostSalesInWindow($creator);

        $this->assertSame(3, $lost['count']);
        $this->assertSame(BlockedPaymentAlert::WINDOW_DAYS, $lost['window_days']);
        $this->assertEqualsCanonicalizing(
            [
                ['currency' => 'GBP', 'amount' => 50.0],
                ['currency' => 'USD', 'amount' => 40.0],
            ],
            $lost['totals']
        );
    }

    /**
     * ⚠️ Every row written before the checkout gates started passing a currency
     * has none. It still counts as a lost sale — the count is what the sentence
     * is about — but its amount cannot be named, and guessing GBP would restate
     * a yen sale as pounds.
     */
    public function test_a_row_with_no_currency_is_counted_but_never_totalled(): void
    {
        $creator = $this->creator();

        DB::table('blocked_payment_attempts')->insert([
            'creator_id' => $creator->id,
            'amount' => 25,
            'currency' => null,
            'reason' => null,
            'created_at' => now(),
        ]);

        $lost = BlockedPaymentAlert::lostSalesInWindow($creator);

        $this->assertSame(1, $lost['count']);
        $this->assertSame([], $lost['totals']);
    }

    /** A blocked attempt older than the window is not this week's news. */
    public function test_the_window_is_bounded(): void
    {
        $creator = $this->creator();

        DB::table('blocked_payment_attempts')->insert([
            'creator_id' => $creator->id,
            'amount' => 25,
            'currency' => 'GBP',
            'reason' => 'no_subscription',
            'created_at' => now()->subDays(BlockedPaymentAlert::WINDOW_DAYS + 1),
        ]);

        $lost = BlockedPaymentAlert::lostSalesInWindow($creator);

        $this->assertSame(0, $lost['count']);
        $this->assertSame([], $lost['totals']);
    }
}
