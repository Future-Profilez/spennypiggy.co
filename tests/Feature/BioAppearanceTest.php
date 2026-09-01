<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\BioAppearance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The bio page's appearance choices — a curated theme key and a list/grid
 * layout, saved by the creator, rendered on the public page.
 *
 * 🚨 The value is a KEY into App\Support\BioAppearance, never a colour. These
 * tests pin that the server refuses anything outside the set — a free value
 * here would be an unmoderated, un-contrast-checked surface on the one page a
 * creator shares everywhere. The colour side (every preset clearing AA) is
 * pinned by tests/javascript/bioThemes.test.js.
 */
class BioAppearanceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'username' => 'creator'.Str::random(6),
        ], $attributes));
    }

    public function test_a_creator_saves_a_theme_and_layout(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post('/bio-links/appearance', ['theme' => 'ink', 'item_layout' => 'grid'])
            ->assertRedirect();

        $creator->refresh();
        $this->assertSame('ink', $creator->bio_theme);
        $this->assertSame('grid', $creator->bio_item_layout);
    }

    public function test_an_unknown_theme_key_is_refused_and_nothing_is_written(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->from('/bio-links')
            ->post('/bio-links/appearance', ['theme' => '#FF0000', 'item_layout' => 'grid'])
            ->assertSessionHasErrors('theme');

        $creator->refresh();
        $this->assertNull($creator->bio_theme);
        $this->assertNull($creator->bio_item_layout);
    }

    public function test_an_unknown_layout_is_refused(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->from('/bio-links')
            ->post('/bio-links/appearance', ['theme' => 'mint', 'item_layout' => 'masonry'])
            ->assertSessionHasErrors('item_layout');

        $this->assertNull($creator->fresh()->bio_theme);
    }

    public function test_null_resets_to_the_default(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'ink', 'bio_item_layout' => 'grid'])->save();

        $this->actingAs($creator)
            ->post('/bio-links/appearance', ['theme' => null, 'item_layout' => null])
            ->assertRedirect();

        $creator->refresh();
        $this->assertNull($creator->bio_theme);
        $this->assertNull($creator->bio_item_layout);
    }

    public function test_a_partial_post_leaves_the_other_column_alone(): void
    {
        // Both columns are nullable, so "not mentioned" and "reset me" cannot be
        // told apart by a `?? null` — a caller posting one field would silently
        // clear the other.
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'ink', 'bio_item_layout' => 'grid'])->save();

        $this->actingAs($creator)
            ->post('/bio-links/appearance', ['theme' => 'mint'])
            ->assertRedirect();

        $creator->refresh();
        $this->assertSame('mint', $creator->bio_theme);
        $this->assertSame('grid', $creator->bio_item_layout);
    }

    public function test_saving_does_not_flash_a_toast(): void
    {
        // The picker saves on every tap; BrandToaster turns flash.success into a
        // toast app-wide, so a message here stacks one per swatch.
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post('/bio-links/appearance', ['theme' => 'ink', 'item_layout' => 'list'])
            ->assertRedirect()
            ->assertSessionMissing('success');
    }

    public function test_a_supporter_cannot_save_an_appearance(): void
    {
        $supporter = User::factory()->create(['role' => 0]);

        $this->actingAs($supporter)
            ->post('/bio-links/appearance', ['theme' => 'ink'])
            ->assertRedirect(route('dashboard'));

        $this->assertNull($supporter->fresh()->bio_theme);
    }

    public function test_a_guest_is_sent_to_login(): void
    {
        $location = $this->post('/bio-links/appearance', ['theme' => 'ink'])
            ->assertRedirect()
            ->headers->get('Location');

        // The redirect carries a ?message= param, so match the path only.
        $this->assertStringContainsString('/login', $location);
    }

    public function test_the_public_page_carries_the_saved_appearance(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'butter', 'bio_item_layout' => 'grid'])->save();

        $response = $this->get("/{$creator->username}/bio");

        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertSame('butter', $page['props']['theme']);
        $this->assertSame('grid', $page['props']['itemLayout']);
    }

    public function test_an_unset_appearance_ships_null_so_the_client_draws_the_default(): void
    {
        $creator = $this->creator();

        $response = $this->get("/{$creator->username}/bio");

        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertNull($page['props']['theme']);
        $this->assertNull($page['props']['itemLayout']);
    }

    public function test_the_editor_payload_carries_the_current_appearance(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'blush'])->save();

        $response = $this->actingAs($creator)->get('/bio-links');

        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertSame('blush', $page['props']['appearance']['theme']);
        $this->assertNull($page['props']['appearance']['item_layout']);
    }

    public function test_a_posted_theme_cannot_arrive_via_profile_mass_assignment(): void
    {
        // bio_theme is deliberately NOT $fillable — the dedicated endpoint with
        // its Rule::in is the only writer. A mass-assigned fill must drop it.
        $creator = $this->creator();

        $creator->fill(['bio_theme' => 'ink'])->save();

        $this->assertNull($creator->fresh()->bio_theme);
    }

    public function test_the_owner_previews_a_theme_via_query_params(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'mint'])->save();

        $response = $this->actingAs($creator)
            ->get("/{$creator->username}/bio?preview_theme=ink&preview_layout=grid");

        $response->assertOk();
        $page = $response->viewData('page');
        $this->assertSame('ink', $page['props']['theme']);
        $this->assertSame('grid', $page['props']['itemLayout']);

        // The preview never writes anything.
        $this->assertSame('mint', $creator->fresh()->bio_theme);
    }

    public function test_a_visitor_cannot_restyle_the_page_via_query_params(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'mint'])->save();

        $response = $this->get("/{$creator->username}/bio?preview_theme=ink");

        $response->assertOk();
        $this->assertSame('mint', $response->viewData('page')['props']['theme']);
    }

    public function test_an_invalid_preview_value_falls_back_to_the_stored_theme(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['bio_theme' => 'butter'])->save();

        $response = $this->actingAs($creator)
            ->get("/{$creator->username}/bio?preview_theme=%23FF0000");

        $response->assertOk();
        $this->assertSame('butter', $response->viewData('page')['props']['theme']);
    }

    public function test_a_preview_load_does_not_count_a_view(): void
    {
        $creator = $this->creator();
        $before = (int) ($creator->fresh()->bio_page_views ?? 0);

        $this->actingAs($creator)
            ->get("/{$creator->username}/bio?preview_theme=ink")
            ->assertOk();

        $this->assertSame($before, (int) $creator->fresh()->bio_page_views);
    }

    public function test_a_preview_render_may_be_framed_by_this_origin_only(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->get("/{$creator->username}/bio?preview_theme=ink")
            ->assertOk()
            ->assertHeader('X-Frame-Options', 'SAMEORIGIN');

        // Every other render of the page — the owner's own included — stays DENY.
        $this->actingAs($creator)
            ->get("/{$creator->username}/bio")
            ->assertOk()
            ->assertHeader('X-Frame-Options', 'DENY');

        // actingAs persists for the rest of the test — sign out first, or this
        // "guest" request is still the owner and the assertion tests nothing.
        auth()->logout();
        $this->flushSession();

        $this->get("/{$creator->username}/bio?preview_theme=ink")
            ->assertOk()
            ->assertHeader('X-Frame-Options', 'DENY');
    }

    /**
     * ⚠️ The CSP is skipped in `local`/`testing`, so the environment must be
     * forced or this asserts nothing — the same device
     * SystemDiagnosticsAccessTest uses.
     */
    public function test_frame_ancestors_follows_the_frame_options_header(): void
    {
        $this->app['env'] = 'production';
        config(['security.csp.skip_environments' => []]);

        $creator = $this->creator();

        $preview = $this->actingAs($creator)
            ->get("/{$creator->username}/bio?preview_theme=ink")
            ->assertOk();

        $this->assertStringContainsString(
            "frame-ancestors 'self'",
            $preview->headers->get('Content-Security-Policy-Report-Only') ?? '',
        );

        $normal = $this->actingAs($creator)
            ->get("/{$creator->username}/bio")
            ->assertOk();

        $this->assertStringContainsString(
            "frame-ancestors 'none'",
            $normal->headers->get('Content-Security-Policy-Report-Only') ?? '',
        );
    }

    public function test_the_php_theme_list_matches_the_js_constants(): void
    {
        // The two halves are in different languages and nothing else can see
        // that they agree — a key on one side only is either a theme nobody can
        // save or a saved value the page cannot draw.
        $js = file_get_contents(resource_path('js/constants/bioThemes.js'));

        foreach (BioAppearance::THEMES as $key) {
            $this->assertMatchesRegularExpression(
                '/^\s{4}'.preg_quote($key, '/').': \{/m',
                $js,
                "Theme '{$key}' is accepted by the server but missing from bioThemes.js",
            );
        }

        preg_match_all('/^\s{4}([a-z_]+): \{/m', $js, $m);
        $this->assertEqualsCanonicalizing(BioAppearance::THEMES, $m[1]);
    }
}
