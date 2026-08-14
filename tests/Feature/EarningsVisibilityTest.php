<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * users.show_piggy_bank decides whether a creator's lifetime earnings figure is
 * public. The milestone bar and the right-rail row render it, but the number is
 * served by GET /user/tip/goal/{username} — a PUBLIC, unauthenticated endpoint.
 *
 * These tests exist because hiding it in the component alone hides nothing: the
 * figure stays one curl away. What is asserted here is the server contract.
 */
class EarningsVisibilityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // getUserEarnings() and getUserWithRelations() cache per user id, and
        // RefreshDatabase resets the database without touching the cache — every
        // test here starts from an empty table, so its creator is id 1 and would
        // otherwise be served the previous test's payload.
        Cache::flush();
    }

    private function creator(int $showPiggyBank): User
    {
        $creator = User::factory()->create([
            'role' => 1,
            'username' => 'creator'.Str::random(6),
            'default_currency' => 'GBP',
            'show_piggy_bank' => $showPiggyBank,
        ]);

        // £250 earned against the ladder's £1,000 rung = 25%. The amount and the
        // percentage are deliberately different numbers, so a whole-body search
        // for the amount cannot be satisfied by the percentage.
        DB::table('tip_goals_payments')->insert([
            'uuid' => (string) Str::uuid(),
            'tip_goal_id' => 1,
            'user_id' => null,
            'creator_id' => $creator->id,
            'currency' => 'GBP',
            'amount' => 250,
            'status' => 'paid',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $creator;
    }

    public function test_a_stranger_never_receives_the_figure_when_it_is_hidden(): void
    {
        $creator = $this->creator(showPiggyBank: 0);

        $response = $this->getJson('/user/tip/goal/'.$creator->username);

        $response->assertOk()
            ->assertJsonPath('goal.hidden', true)
            ->assertJsonMissingPath('goal.fullfilled')
            ->assertJsonMissingPath('goal.target')
            ->assertJsonMissingPath('goal.currency');

        // The whole body, not just the goal object — the amount must not reach
        // the response by any other key.
        $this->assertStringNotContainsString('250', $response->getContent());
    }

    public function test_the_progress_percentage_survives_when_the_money_does_not(): void
    {
        $creator = $this->creator(showPiggyBank: 0);

        $this->getJson('/user/tip/goal/'.$creator->username)
            ->assertOk()
            ->assertJsonPath('goal.percent', 25);
    }

    public function test_a_stranger_receives_the_figure_when_it_is_visible(): void
    {
        $creator = $this->creator(showPiggyBank: 1);

        $this->getJson('/user/tip/goal/'.$creator->username)
            ->assertOk()
            ->assertJsonPath('goal.fullfilled', 250)
            ->assertJsonPath('goal.target', 1000)
            ->assertJsonPath('goal.currency', 'GBP')
            ->assertJsonMissingPath('goal.hidden');
    }

    public function test_the_owner_always_sees_their_own_figure_even_while_hidden(): void
    {
        $creator = $this->creator(showPiggyBank: 0);

        // A placeholder on the creator's own screen reads as "the data failed to
        // load", which is why the gate exempts them.
        $this->actingAs($creator)
            ->getJson('/user/tip/goal/'.$creator->username)
            ->assertOk()
            ->assertJsonPath('goal.fullfilled', 250)
            ->assertJsonMissingPath('goal.hidden');
    }

    public function test_one_creator_hiding_earnings_does_not_hide_anothers(): void
    {
        $hidden = $this->creator(showPiggyBank: 0);
        $visible = $this->creator(showPiggyBank: 1);

        $this->getJson('/user/tip/goal/'.$hidden->username)
            ->assertJsonPath('goal.hidden', true);

        $this->getJson('/user/tip/goal/'.$visible->username)
            ->assertJsonPath('goal.fullfilled', 250);
    }

    public function test_the_account_setting_toggles_the_column(): void
    {
        $creator = $this->creator(showPiggyBank: 1);

        $this->actingAs($creator)->post(route('piggy-bank-setting'))->assertOk();
        $this->assertSame(0, (int) $creator->fresh()->show_piggy_bank);

        $this->actingAs($creator)->post(route('piggy-bank-setting'))->assertOk();
        $this->assertSame(1, (int) $creator->fresh()->show_piggy_bank);
    }
}
