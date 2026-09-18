<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

/**
 * Sentry JAVASCRIPT-REACT-CH (17 Sep 2026) — "Error saving user category",
 * `log_context.error` = "The category field must only contain letters, numbers,
 * dashes, and underscores."
 *
 * A creator typed a category with a space. `catch (Exception)` swallowed the
 * ValidationException, logged it at ERROR (which the `sentry` channel carries)
 * and answered with Laravel's own sentence prefixed "Error saving category:".
 */
class UserCategoryValidationTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create([
            'role' => 1,
            'email_verified_at' => now(),
        ]);
    }

    public function test_a_refused_category_is_not_logged_as_an_error(): void
    {
        Log::spy();

        $this->actingAs($this->creator())
            ->postJson('/user/save-category', ['category' => 'art supplies'])
            ->assertOk()
            ->assertJson(['status' => false]);

        Log::shouldNotHaveReceived('error');
    }

    public function test_the_creator_is_told_what_to_type_instead(): void
    {
        $response = $this->actingAs($this->creator())
            ->postJson('/user/save-category', ['category' => 'art supplies']);

        $msg = $response->json('msg');

        $this->assertStringContainsString('art-supplies', $msg);
        $this->assertStringNotContainsString(
            'Error saving category',
            $msg,
            'The refusal must not read as the site breaking.'
        );
        $this->assertStringNotContainsString(
            'must only contain letters, numbers, dashes, and underscores',
            $msg,
            "Laravel's own sentence describes the rule, not what to do about it."
        );
    }

    /** ⚠️ The caller reads `res.data.msg` — a bare 422 would show the creator nothing. */
    public function test_the_response_shape_the_page_reads_is_unchanged(): void
    {
        $this->actingAs($this->creator())
            ->postJson('/user/save-category', ['category' => 'art supplies'])
            ->assertOk()
            ->assertJsonStructure(['status', 'msg']);
    }

    /** CONTROL: a legal category still saves. */
    public function test_a_legal_category_is_still_saved(): void
    {
        $user = $this->creator();

        $this->actingAs($user)
            ->postJson('/user/save-category', ['category' => 'art-supplies'])
            ->assertOk()
            ->assertJson(['status' => true]);

        $this->assertDatabaseHas('user_categories', [
            'user_id' => $user->id,
            'category' => 'art-supplies',
        ]);
    }
}
