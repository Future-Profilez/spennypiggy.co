<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Services\CreatorOpportunityService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class CreatorOpportunityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Currency::create(['ISO' => 'GBP', 'name' => 'Pound Sterling', 'conversion_rate' => 1, 'ISOdigits' => 2, 'symbol' => '£']);
    }

    private function makeUser(array $attrs = []): User
    {
        return User::factory()->create(array_merge([
            'uuid' => (string) Str::uuid(),
            'default_currency' => 'GBP',
        ], $attrs));
    }

    private function tipGoalFor(User $creator): int
    {
        return DB::table('tip_goals')->insertGetId([
            'uuid' => (string) Str::uuid(),
            'name' => 'Goal',
            'user_id' => $creator->id,
            'target' => 100,
            'default_price' => 5,
            'tax_amount' => 0,
            'currency' => 'GBP',
            'status' => 0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function purchase(User $creator, User $supporter, int $daysAgo, float $net = 50.00, string $status = 'completed'): void
    {
        $tip = TipGoalsPayment::create([
            'tip_goal_id' => $this->tipGoalFor($creator),
            'user_id' => $supporter->id,
            'session_id' => 'cs_'.Str::random(8),
            'currency' => 'GBP',
            'amount' => $net,
            'tax' => 0,
            'status' => 'paid',
        ]);

        FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'source_type' => TipGoalsPayment::class,
            'source_id' => $tip->id,
            'type' => 'income',
            'gross_amount' => $net,
            'platform_fee' => 0,
            'stripe_fee' => 0,
            'vat_amount' => 0,
            'net_amount' => $net,
            'currency' => 'GBP',
            'status' => $status,
            'transaction_date' => now()->subDays($daysAgo),
        ]);
    }

    private function service(): CreatorOpportunityService
    {
        return app(CreatorOpportunityService::class);
    }

    public function test_supporters_are_ranked_by_lifetime_spend_with_purchase_stats(): void
    {
        $creator = $this->makeUser();
        $big = $this->makeUser(['name' => 'Big Spender']);
        $small = $this->makeUser(['name' => 'Small Spender']);

        $this->purchase($creator, $big, 5, 200.00);
        $this->purchase($creator, $big, 2, 100.00);
        $this->purchase($creator, $small, 3, 10.00);

        $supporters = $this->service()->supporters($creator);

        $this->assertSame($big->id, $supporters[0]['supporter_id']);
        $this->assertEqualsWithDelta(300.00, $supporters[0]['lifetime_spent'], 0.01);
        $this->assertSame(2, $supporters[0]['purchases']);
        $this->assertEqualsWithDelta(150.00, $supporters[0]['average_order_value'], 0.01);
    }

    public function test_refunded_purchases_do_not_count_toward_supporter_value(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        $this->purchase($creator, $supporter, 5, 100.00);
        $this->purchase($creator, $supporter, 4, 500.00, 'refunded');

        $supporters = $this->service()->supporters($creator);

        $this->assertEqualsWithDelta(100.00, $supporters[0]['lifetime_spent'], 0.01);
        $this->assertSame(1, $supporters[0]['purchases']);
    }

    public function test_a_repeat_supporter_who_has_gone_quiet_is_flagged_at_risk(): void
    {
        $creator = $this->makeUser();
        $lapsed = $this->makeUser();
        $recent = $this->makeUser();

        // Two purchases, both long ago → an established supporter who stopped.
        $this->purchase($creator, $lapsed, 90, 50.00);
        $this->purchase($creator, $lapsed, 45, 50.00);

        $this->purchase($creator, $recent, 2, 50.00);

        $supporters = $this->service()->supporters($creator)->keyBy('supporter_id');

        $this->assertTrue($supporters[$lapsed->id]['at_risk']);
        $this->assertFalse($supporters[$recent->id]['at_risk']);
    }

    public function test_a_one_time_buyer_is_not_flagged_at_risk(): void
    {
        // Someone who bought once and left was never a regular — flagging them
        // as "at risk" would bury the supporters actually worth chasing.
        $creator = $this->makeUser();
        $oneOff = $this->makeUser();

        $this->purchase($creator, $oneOff, 90, 50.00);

        $supporters = $this->service()->supporters($creator);

        $this->assertFalse($supporters[0]['at_risk']);
    }

    public function test_retention_separates_new_returning_reactivated_and_lost(): void
    {
        $creator = $this->makeUser();

        $new = $this->makeUser();
        $this->purchase($creator, $new, 3);

        $returning = $this->makeUser();
        $this->purchase($creator, $returning, 40);
        $this->purchase($creator, $returning, 2);

        $reactivated = $this->makeUser();
        $this->purchase($creator, $reactivated, 120);
        $this->purchase($creator, $reactivated, 1);

        $lost = $this->makeUser();
        $this->purchase($creator, $lost, 100);

        $retention = $this->service()->retention($creator);

        $this->assertSame(1, $retention['new']);
        $this->assertSame(2, $retention['returning'], 'Both returning and reactivated also count as returning.');
        $this->assertSame(1, $retention['reactivated']);
        $this->assertSame(1, $retention['lost']);
    }

    public function test_suggested_actions_include_publishing_what_is_missing(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();
        $this->purchase($creator, $supporter, 3, 20.00);

        $data = $this->service()->for($creator);
        $keys = array_column($data['actions'], 'key');

        // This creator has only ever sold tips, so both suggestions apply.
        $this->assertContains('publish_membership', $keys);
        $this->assertContains('publish_wish', $keys);
    }

    public function test_a_creator_with_no_sales_gets_an_empty_but_valid_payload(): void
    {
        $creator = $this->makeUser();

        $data = $this->service()->for($creator);

        $this->assertSame(0, $data['totals']['supporters']);
        $this->assertSame(0.0, $data['totals']['average_supporter_value']);
        $this->assertIsArray($data['alerts']);
        $this->assertIsArray($data['actions']);
    }

    public function test_opportunities_route_requires_login_and_renders_for_creator(): void
    {
        $this->get(route('financial.opportunities'))->assertRedirect();

        $creator = $this->makeUser();
        $this->actingAs($creator)->getJson(route('financial.opportunities'))
            ->assertOk()
            ->assertJsonStructure(['currency', 'supporters', 'retention', 'alerts', 'actions', 'totals']);
    }
}
