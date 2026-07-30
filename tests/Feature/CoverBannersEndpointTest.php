<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\PresetCovers;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * `/cover-banners` is a single-segment path, and `routes/auth.php` ends with the
 * `/{username}/{page?}` profile catch-all. Laravel matches in registration
 * order, so declaring this route after that require made every request 404 as an
 * unknown username — the picker reported "could not be loaded" and no amount of
 * reading the closure explained why.
 *
 * These tests fail if the route is ever moved back below the catch-all.
 */
class CoverBannersEndpointTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_returns_the_catalogue_rather_than_the_profile_404(): void
    {
        $response = $this->actingAs(User::factory()->create())->getJson('/cover-banners');

        $response->assertOk()
            ->assertJsonStructure([
                'covers' => [['value', 'label', 'category', 'url']],
                'categories',
            ]);

        $this->assertCount(
            count(PresetCovers::COVERS) + count(PresetCovers::LEGACY_UPLOADED),
            $response->json('covers')
        );
    }

    public function test_the_named_route_resolves_to_the_expected_path(): void
    {
        // Ziggy mirrors this name into the frontend; the picker asks for it by
        // name and falls back to the literal path.
        $this->assertSame(url('/cover-banners'), route('cover-banners'));
    }

    public function test_a_guest_is_sent_to_login(): void
    {
        // The app's auth middleware appends its own explanatory message.
        $this->get('/cover-banners')->assertRedirectContains(route('login'));
    }
}
