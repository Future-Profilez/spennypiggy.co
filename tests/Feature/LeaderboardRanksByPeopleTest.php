<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\LeaderBoardController;
use App\Models\FinancialTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 THE PUBLIC BOARD RANKS BY PEOPLE, NEVER BY MONEY.
 *
 * Stripe content-first rule, and the platform's own definition everywhere else:
 * `CollectionService`'s "Popular" counts DISTINCT supporters and the Piggy Pot
 * wall ranks on purchase count. A board ordered by revenue publishes what each
 * creator earns by implication.
 *
 * What it used to do: `combined_score = engagement_score > 0 ? engagement_score :
 * total_amount`, where engagement_score was FOLLOWERS × 2. So a creator with one
 * follower was ranked by followers and a creator with none was ranked by
 * REVENUE — two ladders in one list, under a heading reading "Ranked by
 * supporters".
 */
class LeaderboardRanksByPeopleTest extends TestCase
{
    use RefreshDatabase;

    private function creator(string $username): User
    {
        return User::factory()->create([
            'username' => $username,
            'role' => 1,
            'stripe_details_submitted' => 1,
            'suspended_account' => 0,
            'leaderboard_opt_out' => 0,
        ]);
    }

    /** One counted purchase from one supporter. FinancialTransaction has no factory. */
    private function purchase(User $creator, User $supporter, float $gross): void
    {
        FinancialTransaction::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'type' => 'income',
            'gross_amount' => $gross,
            'net_amount' => $gross,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => now()->subDay(),
        ]);
    }

    private function board(): array
    {
        return collect(app(LeaderBoardController::class)->calc(null))
            ->pluck('username')
            ->all();
    }

    /**
     * 🚨 THE WHOLE RULE IN ONE ASSERTION: more people beats more money.
     */
    public function test_more_supporters_outranks_more_money(): void
    {
        $big = $this->creator('one_big_spender');
        $many = $this->creator('three_small_buyers');

        // £5,000 from a single person.
        $this->purchase($big, $this->creator('whale'), 5000);

        // £15 total, from three different people.
        foreach (range(1, 3) as $i) {
            $this->purchase($many, $this->creator('buyer'.$i), 5);
        }

        $order = $this->board();

        $this->assertLessThan(
            array_search('one_big_spender', $order, true),
            array_search('three_small_buyers', $order, true),
            'Three supporters must outrank one, whatever the amounts.'
        );
    }

    /** ⚠️ One person buying ten times is ONE supporter, not ten. */
    public function test_repeat_purchases_by_one_person_count_once(): void
    {
        $repeat = $this->creator('one_loyal_buyer');
        $two = $this->creator('two_different_buyers');

        $loyal = $this->creator('loyal');
        foreach (range(1, 10) as $i) {
            $this->purchase($repeat, $loyal, 20);
        }

        foreach (range(1, 2) as $i) {
            $this->purchase($two, $this->creator('other'.$i), 1);
        }

        $order = $this->board();

        $this->assertLessThan(
            array_search('one_loyal_buyer', $order, true),
            array_search('two_different_buyers', $order, true),
            'Ten purchases by one person is one supporter.'
        );
    }

    /**
     * ⚠️ A refunded purchase does not make somebody a supporter — the board uses
     * `LedgerRules::countedScope()`, the same gate the payout engine uses, so it
     * cannot disagree with the earnings screens about who counts.
     */
    public function test_a_refunded_purchase_does_not_count(): void
    {
        $creator = $this->creator('refunded_only');
        $supporter = $this->creator('a_buyer');

        FinancialTransaction::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'type' => 'income',
            'gross_amount' => 900,
            'net_amount' => 900,
            'currency' => 'GBP',
            'status' => 'refunded',
            'transaction_date' => now()->subDay(),
        ]);

        $row = collect(app(LeaderBoardController::class)->calc(null))
            ->firstWhere('username', 'refunded_only');

        $this->assertSame(0, (int) $row->paying_supporters);
    }
}
