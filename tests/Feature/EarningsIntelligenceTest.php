<?php

namespace Tests\Feature;

use App\Models\Currency;
use App\Models\FinancialTransaction;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Services\CreatorOpportunityService;
use App\Services\Ledger\LedgerRules;
use App\Support\OpportunityPanelPayload;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Enhanced Creator Earnings Dashboard + Revenue Opportunity Centre.
 *
 * Client brief: "Spenny Piggy · Developer Master Plan", 19 Aug 2026, §C.
 *
 * These pin the three things that are easy to break and expensive to notice:
 * the money gate (does this screen agree with the earnings dashboard and the
 * payout run), the two-figure rule (supporter spend is not creator earnings),
 * and the nine rows always being present even when one is switched off.
 *
 * `CreatorOpportunityTest` already covers ranking, refunds, at-risk flagging and
 * retention — not repeated here.
 */
class EarningsIntelligenceTest extends TestCase
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

    /**
     * One purchase.
     *
     * ⚠️ `$gross` and `$net` are deliberately DIFFERENT by default — that gap is
     * the fee stack, and it is the whole point of the buyerPaid/creatorGross
     * distinction. A fixture where they are equal cannot fail the test that
     * matters.
     */
    private function purchase(
        User $creator,
        User $supporter,
        int $daysAgo,
        float $gross = 120.00,
        float $net = 100.00,
        string $status = 'completed',
        ?float $platformFee = null
    ): void {
        // ⚠️ Derived from the gap by default, but OVERRIDABLE — the legacy-row
        // case needs a real fee sitting beside a zero gross, and deriving it
        // there would produce a negative fee and quietly make that test pass for
        // the wrong reason.
        $platformFee = $platformFee ?? round($gross - $net, 2);

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
            'gross_amount' => $gross,
            'platform_fee' => $platformFee,
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

    // ---------------------------------------------------------------- money

    public function test_supporter_spend_and_creator_earnings_are_two_different_figures(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        // Charged £120, creator keeps £100.
        $this->purchase($creator, $supporter, 3, 120.00, 100.00);

        $row = $this->service()->supporters($creator)->first();

        $this->assertEqualsWithDelta(120.00, $row['lifetime_spent'], 0.01, 'lifetime_spent must be LedgerRules::buyerPaid — what the supporter was charged.');
        $this->assertEqualsWithDelta(100.00, $row['lifetime_earned'], 0.01, 'lifetime_earned must be LedgerRules::creatorGross — the creator\'s share.');
    }

    public function test_a_legacy_row_with_no_gross_is_rebuilt_rather_than_reported_as_zero(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        // gross_amount 0 is the legacy shape LedgerRules::buyerPaid() has a
        // fallback for. Reporting a real purchase as £0 is the failure mode.
        $this->purchase($creator, $supporter, 3, 0.00, 100.00, 'completed', 20.00);

        $row = $this->service()->supporters($creator)->first();

        $this->assertEqualsWithDelta(120.00, $row['lifetime_spent'], 0.01);
    }

    public function test_money_that_has_not_settled_does_not_count(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        $this->purchase($creator, $supporter, 3, 120.00, 100.00);
        // A bank payment still in flight. The old local status list let this
        // through, so this screen reported more than the earnings dashboard.
        $this->purchase($creator, $supporter, 2, 500.00, 400.00, 'processing');

        $row = $this->service()->supporters($creator)->first();

        $this->assertEqualsWithDelta(120.00, $row['lifetime_spent'], 0.01);
        $this->assertSame(1, $row['purchases']);
    }

    public function test_the_counted_scope_matches_counts_toward_totals_row_by_row(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();

        foreach (['completed', 'processing', 'refunded', 'review_hold', 'pending'] as $i => $status) {
            $this->purchase($creator, $supporter, $i + 1, 120.00, 100.00, $status);
        }

        $all = FinancialTransaction::where('user_id', $creator->id)->get();
        $map = LedgerRules::fulfilmentMap($all);

        $expected = $all
            ->filter(fn ($ft) => LedgerRules::countsTowardTotals($ft, $map))
            ->pluck('id')
            ->sort()
            ->values()
            ->all();

        $actual = LedgerRules::countedScope(
            FinancialTransaction::query()->where('user_id', $creator->id)
        )->pluck('id')->sort()->values()->all();

        // 🚨 The SQL scope and the PHP reader are twins. If they can disagree,
        // an aggregate and a row list built from the same ledger will disagree,
        // which is the whole reason LedgerRules exists.
        $this->assertSame($expected, $actual);
    }

    // ---------------------------------------------------------------- labels

    public function test_revenue_by_feature_uses_the_briefs_current_feature_names(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser();
        $this->purchase($creator, $supporter, 3, 60.00, 50.00);

        $byLabel = collect($this->service()->revenueByType($creator, 'GBP'))->keyBy('label');

        foreach ([
            'Memberships',
            'Recurring Content',
            'Sell Exclusive Content',
            'Paid Tasks',
            'Shop',
            'Content Goals',
        ] as $label) {
            $this->assertArrayHasKey($label, $byLabel->all(), "Brief row 2 names '{$label}'.");
        }

        // 🚨 The brief's seventh name is "Tips", and tip/donation vocabulary is
        // banned outright on every user-facing surface by the Stripe
        // content-first rule. The product's own name wins.
        $this->assertArrayHasKey('Piggy Bank', $byLabel->all());
        $this->assertArrayNotHasKey('Tips', $byLabel->all());

        // The in-product name rides along wherever it differs, so a creator whose
        // menu says "Bills" can find "Recurring Content".
        $this->assertSame('Bills', $byLabel['Recurring Content']['product']);
        $this->assertNull($byLabel['Memberships']['product']);
    }

    public function test_the_social_channels_prompt_is_the_briefs_wording(): void
    {
        $this->assertSame(
            'Consider contacting this supporter through your social channels if appropriate.',
            CreatorOpportunityService::SOCIAL_CHANNELS_PROMPT
        );
    }

    // ------------------------------------------------------- dashboard panel

    public function test_all_nine_rows_are_present_even_for_a_creator_with_no_sales(): void
    {
        $creator = $this->makeUser();

        $panel = OpportunityPanelPayload::forDashboard($creator, 'GBP');

        $this->assertIsArray($panel);
        $this->assertCount(9, $panel['rows'], 'The brief asks for all nine rows on the dashboard, greyed rather than missing.');
        $this->assertSame(0, $panel['totals']['supporters']);
        // Zero is a state, not an absence — the payload is real, not null.
        $this->assertSame(0.0, $panel['totals']['lifetime_value']);
    }

    public function test_a_row_switched_off_greys_rather_than_disappearing(): void
    {
        config()->set('earnings_intelligence.rows.retention', false);

        $creator = $this->makeUser();
        $panel = OpportunityPanelPayload::forDashboard($creator, 'GBP');

        $retention = collect($panel['rows'])->firstWhere('key', 'retention');

        $this->assertNotNull($retention, 'A switched-off row must still be listed.');
        $this->assertFalse($retention['live']);
        $this->assertNull($panel['retention'], 'A greyed row sends no figures.');
        $this->assertCount(9, $panel['rows']);
    }

    public function test_an_unknown_row_key_is_treated_as_coming_soon(): void
    {
        $this->assertFalse(OpportunityPanelPayload::rowIsLive('a_row_nobody_configured'));
    }

    public function test_the_dashboard_panel_never_carries_a_supporter_identifier_or_email(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser(['name' => 'Jo Buyer', 'country' => 'GB']);
        $this->purchase($creator, $supporter, 3, 120.00, 100.00);

        $panel = OpportunityPanelPayload::forDashboard($creator, 'GBP');
        $card = $panel['supporters'][0];

        // 🚨 Supporter privacy: display name (or Anonymous), amount, country.
        $this->assertSame('Jo Buyer', $card['name']);
        $this->assertSame('GB', $card['country']);
        $this->assertArrayNotHasKey('supporter_id', $card);
        $this->assertArrayNotHasKey('username', $card);
        $this->assertArrayNotHasKey('email', $card);

        // Belt and braces: the address must not be reachable anywhere in the payload.
        $this->assertStringNotContainsString(
            $supporter->email,
            json_encode($panel),
            'A supporter\'s email address must never reach a creator\'s dashboard.'
        );
    }

    public function test_a_supporter_with_no_name_reads_as_anonymous(): void
    {
        $creator = $this->makeUser();
        $supporter = $this->makeUser(['name' => '']);
        $this->purchase($creator, $supporter, 3, 120.00, 100.00);

        $panel = OpportunityPanelPayload::forDashboard($creator, 'GBP');

        $this->assertSame('Anonymous', $panel['supporters'][0]['name']);
    }

    public function test_row_nine_switched_off_removes_the_module_from_the_dashboard(): void
    {
        config()->set('earnings_intelligence.rows.on_dashboard', false);

        $this->assertNull(OpportunityPanelPayload::forDashboard($this->makeUser(), 'GBP'));
    }
}
