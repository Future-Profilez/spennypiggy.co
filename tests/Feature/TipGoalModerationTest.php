<?php

namespace Tests\Feature;

use App\Http\Middleware\UserEmailVerify;
use App\Models\TipGoal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Piggy Bank / Tip Jar — the one sellable surface with no automated check at all.
 *
 * 🚨 The failure this pins: `addTipGoal` took `name` and `description` as free
 * text. No naming rule, no blocked-word list, no symbol rule — while the same two
 * strings appear on the creator's public profile and on a payment-facing screen.
 * Every other module had at least one check; this had none, and nothing anywhere
 * said so.
 *
 * ⚠️ These are REFUSALS, not holds, and that is the whole design decision. The
 * admin Content Review queue is driven by a module map with no tip-goal row, and
 * `tip_goals` has no approval column for a reviewer to clear — so a hold here would
 * be a listing nobody could ever release. See the docblock on `addTipGoal`.
 */
class TipGoalModerationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Not under test: this is about what the endpoint accepts, not who reaches it.
        $this->withoutMiddleware([UserEmailVerify::class]);
    }

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    private function payload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Behind the scenes photo set',
            'description' => 'A monthly drop of unreleased shots.',
            'target' => 200,
            'duration' => 30,
        ], $overrides);
    }

    public function test_a_clean_goal_passes_every_check(): void
    {
        $this->actingAs($this->creator())->post('/add-goal', $this->payload())
            ->assertSessionHasNoErrors();
    }

    /**
     * 🚨 FOUND WHILE WRITING THESE TESTS, DELIBERATELY NOT FIXED: THIS ENDPOINT
     * CANNOT CREATE A TIP GOAL AT ALL.
     *
     * `tip_goals.target` is `NOT NULL` with no default and `'target'` is commented
     * out of `TipGoal::$fillable` ("Deprecated monetary fields"), so `create()`
     * drops it and the insert violates the constraint. `product_id` and `price_id`
     * are the same shape and are never set either — the Stripe block that used to
     * set them is commented out a few lines below. On MySQL in strict mode, which
     * is what production runs, every one of those is an error.
     *
     * ⚠️ It is recorded here rather than repaired because the repair is a
     * monetisation create path (what a deprecated target column should now hold,
     * and whether a tip goal still needs a Stripe product), not a moderation
     * decision — and a test that quietly skipped the insert would hide it again.
     * **This assertion is expected to FAIL the day somebody fixes it, and that is
     * the point: delete it then.**
     */
    /**
     * 🚨 THIS ASSERTED THE OPPOSITE UNTIL 12 Sep 2026, AND IT WAS RIGHT TO.
     *
     * It expected a `QueryException` naming `target`, with a note saying to
     * delete it the day somebody fixed the save. That day is today. The fault
     * was that the 2023 migration declares `target` NOT NULL while the column is
     * commented out of `TipGoal::$fillable`, so `create()` dropped it and the
     * insert failed under strict mode.
     *
     * ⚠️ WHY IT SURVIVED SO LONG: `target` is `double(8,2) NULL` on production
     * and on the development copy — altered at some point without a migration —
     * so `/add-goal` worked everywhere anybody looked. It only failed where the
     * schema is built from migrations: CI, `migrate:fresh`, and any RESTORE. A
     * disaster-recovery rebuild would have come back missing a feature
     * production had.
     */
    public function test_a_clean_goal_is_actually_saved(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertSame(1, TipGoal::count(), 'The save has to reach the database, not only pass validation.');
    }

    public function test_expense_wording_in_the_name_is_refused(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload(['name' => 'Help with my rent this month']))
            ->assertSessionHasErrors('name');

        $this->assertSame(0, TipGoal::count());
    }

    public function test_expense_wording_in_the_description_is_refused(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload(['description' => 'This covers my phone bill.']))
            ->assertSessionHasErrors('description');

        $this->assertSame(0, TipGoal::count());
    }

    public function test_a_blocked_symbol_is_refused(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload(['name' => 'Late night 🍆 set']))
            ->assertSessionHasErrors('name');

        $this->assertSame(0, TipGoal::count());
    }

    /**
     * 🚨 A zero-width space inside a banned word defeats the naming rule AND the
     * blocked-word list at once — both read words, and neither can see this.
     */
    public function test_a_hidden_character_is_refused(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload(['name' => "Studio re\u{200B}nt fund"]))
            ->assertSessionHasErrors('name');

        $this->assertSame(0, TipGoal::count());
    }

    /**
     * The blocked-word list every other module runs through `ItemTextModeration`,
     * landing beside the field rather than as a flashed banner — a creator has to
     * know WHICH of the two fields to change.
     */
    public function test_a_blocked_word_is_refused_against_its_own_field(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload(['description' => 'Includes a private session.']))
            ->assertSessionHasErrors('description');

        $this->assertSame(0, TipGoal::count());
    }

    /**
     * ⚠️ The refusal must not be broader than the rule. A goal that reads as
     * content passes, or creators simply stop using the feature.
     */
    public function test_ordinary_wording_still_passes(): void
    {
        $this->actingAs($this->creator())
            ->post('/add-goal', $this->payload([
                'name' => 'New studio lighting series 🎉',
                'description' => 'Twelve edited shots, delivered here on the platform.',
            ]))
            ->assertSessionHasNoErrors();
    }
}
