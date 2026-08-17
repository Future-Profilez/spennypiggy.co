<?php

namespace Tests\Feature;

use App\Models\CreatorBioLink;
use App\Models\PiggyPot;
use App\Models\User;
use App\Services\BioPageService;
use App\Support\BioLinkPlatforms;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The link-in-bio page.
 *
 * 🚨 Two properties everything else rests on:
 *
 *   1. `/{username}/bio` reaches its own controller and NOT the profile
 *      catch-all. Declared below it the segment is read as a page name and
 *      answered with an empty profile — and `route:list` shows the route either
 *      way, so nothing but a resolution test catches it.
 *   2. `/bio/go/{uuid}` can never be pointed anywhere. The destination is
 *      rebuilt from a stored platform key, so there is no URL in the request.
 */
class BioPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // ⚠️ The profile payload and its version token are both cached under the
        // creator's id, and every test here starts from an empty table — so its
        // creator is id 1 and one test can be served the previous test's entry
        // for a user that no longer exists. An artefact of ids repeating, which
        // cannot happen in production.
        Cache::flush();
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'username' => 'creator'.Str::random(6),
        ], $attributes));
    }

    private function pot(User $creator, array $attributes = []): PiggyPot
    {
        return PiggyPot::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'title' => 'Studio Setup',
            'description' => 'Behind the scenes',
            'target_amount' => 500,
            'currency' => 'gbp',
            'status' => 'active',
        ], $attributes));
    }

    private function externalLink(User $creator, array $attributes = []): CreatorBioLink
    {
        return CreatorBioLink::create(array_merge([
            'user_id' => $creator->id,
            'kind' => BioLinkPlatforms::KIND_EXTERNAL,
            'platform' => 'twitch',
            'handle' => 'creatorhandle',
            'is_active' => true,
        ], $attributes));
    }

    // ---------------------------------------------------------------- routing

    public function test_the_bio_route_resolves_above_the_profile_catch_all(): void
    {
        $creator = $this->creator();

        $route = app('router')->getRoutes()->match(
            Request::create("/{$creator->username}/bio", 'GET')
        );

        $this->assertSame('bio.show', $route->getName());
        $this->assertStringContainsString('BioPageController', $route->getActionName());
    }

    public function test_the_profile_catch_all_still_works(): void
    {
        $creator = $this->creator();

        $route = app('router')->getRoutes()->match(
            Request::create("/{$creator->username}/wishes", 'GET')
        );

        $this->assertSame('user.show', $route->getName());
    }

    public function test_an_unknown_username_is_a_real_404(): void
    {
        // A soft-404 answered 200 is indexed as a real page and re-crawled.
        $this->get('/nobody-here/bio')->assertStatus(404);
    }

    public function test_a_suspended_creator_is_gone_not_missing(): void
    {
        $creator = $this->creator();
        $creator->forceFill(['suspended_account' => 1])->saveQuietly();

        // 410, not 404: the page existed and was withdrawn.
        $this->get("/{$creator->username}/bio")->assertStatus(410);
    }

    public function test_a_supporter_is_sent_to_their_profile(): void
    {
        // A supporter has nothing to list, so a bio page for them is an empty
        // screen on a URL they may well have shared.
        User::factory()->create(['role' => 0, 'username' => 'agifter']);

        $this->get('/agifter/bio')->assertRedirect(route('user.show', ['username' => 'agifter']));
    }

    // ----------------------------------------------------------- availability

    public function test_a_held_pot_produces_no_button(): void
    {
        $creator = $this->creator();
        $this->pot($creator, ['status' => 'moderation_hold']);

        $availability = app(BioPageService::class)->availability($creator);

        $this->assertFalse($availability['piggyPots']);
    }

    public function test_a_live_pot_produces_a_button_and_a_featured_tile(): void
    {
        $creator = $this->creator();
        $this->pot($creator);

        $service = app(BioPageService::class);

        $this->assertTrue($service->availability($creator)['piggyPots']);

        $labels = collect($service->linksFor($creator))->pluck('target_type');
        $this->assertTrue($labels->contains('piggy-pots'));

        $featured = $service->featured($creator);
        $this->assertSame('Studio Setup', $featured['title']);
    }

    public function test_a_pot_with_no_target_reports_a_null_percent_not_zero(): void
    {
        // "No goal set" and "nobody has bought yet" are different things, and a
        // 0% bar states the second.
        $creator = $this->creator();
        $this->pot($creator, ['target_amount' => 0]);

        $this->assertNull(app(BioPageService::class)->featured($creator)['percent']);
    }

    // -------------------------------------------------------------- whitelist

    public function test_an_off_whitelist_platform_is_refused_by_the_server(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post(route('bio.links.store'), [
                'platform' => 'onlyfans',
                'handle' => 'someone',
            ])
            ->assertSessionHasErrors('platform');

        $this->assertDatabaseCount('creator_bio_links', 0);
    }

    public function test_a_pasted_profile_url_is_reduced_to_its_handle(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)->post(route('bio.links.store'), [
            'platform' => 'twitch',
            'handle' => 'https://twitch.tv/mychannel/',
        ]);

        $this->assertDatabaseHas('creator_bio_links', [
            'user_id' => $creator->id,
            'platform' => 'twitch',
            'handle' => 'mychannel',
        ]);
    }

    public function test_a_handle_that_fails_its_pattern_is_refused(): void
    {
        $creator = $this->creator();

        // Twitch handles are 4–25 of [A-Za-z0-9_]; a space is not one of them
        // and there is no separator for the normaliser to reduce.
        $this->actingAs($creator)
            ->post(route('bio.links.store'), [
                'platform' => 'twitch',
                'handle' => 'bad handle!',
            ])
            ->assertSessionHasErrors('handle');

        // Too short for this network, whatever else is true of it.
        $this->actingAs($creator)
            ->post(route('bio.links.store'), [
                'platform' => 'twitch',
                'handle' => 'ab',
            ])
            ->assertSessionHasErrors('handle');

        $this->assertDatabaseCount('creator_bio_links', 0);
    }

    /**
     * ⚠️ A traversal-shaped handle is NOT refused — it is REDUCED. The
     * normaliser takes the last path segment of anything containing a
     * separator, because a creator pastes a whole profile URL far more often
     * than a bare handle, so `…/../evil` resolves to the ordinary handle
     * `evil`.
     *
     * That is safe for the reason the whole design rests on: the HOST is fixed
     * by the platform key and never comes from the request, so the worst a
     * crafted handle can produce is a different page on the same whitelisted
     * network. Asserted here so nobody "hardens" the normaliser into rejecting
     * pasted URLs, which is the case it exists for.
     */
    public function test_a_traversal_shaped_handle_resolves_to_a_safe_url_on_the_same_host(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)->post(route('bio.links.store'), [
            'platform' => 'twitch',
            'handle' => 'bad/../evil',
        ]);

        $link = CreatorBioLink::where('user_id', $creator->id)->firstOrFail();

        $this->assertSame('evil', $link->handle);
        $this->assertSame('https://twitch.tv/evil', $link->resolvedUrl());
    }

    public function test_a_blocked_word_in_a_label_is_refused(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post(route('bio.links.store'), [
                'platform' => 'twitch',
                'handle' => 'mychannel',
                'label' => 'my rent money',
            ])
            ->assertSessionHasErrors('label');
    }

    public function test_a_word_from_the_shared_blocked_list_is_refused(): void
    {
        // Two rules screen this field and they catch different things:
        // NoExpenseOrBrandName (brands, expense wording) runs as a validation
        // rule, Helpers::checkBlockText is the platform-wide list. Without a
        // case only the second can catch, removing it would pass the suite.
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post(route('bio.links.store'), [
                'platform' => 'twitch',
                'handle' => 'mychannel',
                'label' => 'nude pics',
            ])
            ->assertSessionHasErrors('label');

        $this->assertDatabaseCount('creator_bio_links', 0);
    }

    // ------------------------------------------------------------- uniqueness

    public function test_the_unique_index_prevents_a_duplicate_button(): void
    {
        // 🚨 The original composite index could never fire: exactly one of
        // `platform` / `target_type` is populated on any row and MySQL treats
        // NULLs in a unique index as distinct. `target_key` collapses them into
        // one non-null string so a plain unique can do its job.
        $creator = $this->creator();
        $this->externalLink($creator, ['handle' => 'aaaa']);

        $this->expectException(QueryException::class);

        $this->externalLink($creator, ['handle' => 'bbbb']);
    }

    public function test_the_target_key_is_derived_and_never_supplied(): void
    {
        $creator = $this->creator();

        $external = $this->externalLink($creator);
        $this->assertSame('external:twitch', $external->target_key);

        $internal = CreatorBioLink::create([
            'user_id' => $creator->id,
            'kind' => BioLinkPlatforms::KIND_INTERNAL,
            'target_type' => 'piggy-pots',
        ]);
        $this->assertSame('internal:piggy-pots', $internal->target_key);
    }

    public function test_re_adding_the_same_platform_is_not_reported_as_a_failure(): void
    {
        // `firstOrNew` is check-then-act, so a double submit reaches the insert
        // twice. The creator's link IS saved by the winner — telling them it
        // failed sends them to add it again.
        $creator = $this->creator();

        foreach (['mychannel', 'mychannel'] as $handle) {
            $this->actingAs($creator)
                ->post(route('bio.links.store'), ['platform' => 'twitch', 'handle' => $handle])
                ->assertSessionHasNoErrors();
        }

        $this->assertDatabaseCount('creator_bio_links', 1);
    }

    // -------------------------------------------------------------- redirect

    public function test_the_redirect_rebuilds_its_destination_from_the_stored_key(): void
    {
        $creator = $this->creator();
        $link = $this->externalLink($creator, ['handle' => 'mychannel']);

        $this->get(route('bio.go', ['link' => $link->uuid]))
            ->assertRedirect('https://twitch.tv/mychannel');
    }

    public function test_the_redirect_counts_the_click(): void
    {
        $creator = $this->creator();
        $link = $this->externalLink($creator);

        $this->get(route('bio.go', ['link' => $link->uuid]));

        $this->assertSame(1, $link->fresh()->click_count);
    }

    public function test_a_link_whose_platform_left_the_whitelist_is_never_followed(): void
    {
        // Rows are kept — narrowing a list is not a reason to delete a creator's
        // link silently — but there is no destination to send anyone to.
        $creator = $this->creator();
        $link = $this->externalLink($creator, ['platform' => 'retired_network']);

        $this->get(route('bio.go', ['link' => $link->uuid]))
            ->assertRedirect(route('user.show', ['username' => $creator->username]));

        $this->assertSame(0, $link->fresh()->click_count);

        $labels = collect(app(BioPageService::class)->linksFor($creator))->pluck('platform');
        $this->assertFalse($labels->contains('retired_network'));
    }

    public function test_an_unknown_link_uuid_goes_home_rather_than_erroring(): void
    {
        $this->get(route('bio.go', ['link' => (string) Str::uuid()]))
            ->assertRedirect(route('home'));
    }

    // -------------------------------------------------------------- ownership

    public function test_a_creator_cannot_edit_another_creators_link(): void
    {
        $owner = $this->creator();
        $other = $this->creator();
        $link = $this->externalLink($owner, ['label' => 'Mine']);

        $this->actingAs($other)
            ->post(route('bio.links.update', ['link' => $link->uuid]), ['label' => 'Theirs'])
            ->assertStatus(404);

        $this->assertSame('Mine', $link->fresh()->label);
    }

    public function test_removing_an_internal_button_hides_it_rather_than_deleting_it(): void
    {
        // It is derived from what the creator sells, so a deleted row simply
        // comes back with its defaults on the next render.
        $creator = $this->creator();
        $this->pot($creator);

        $service = app(BioPageService::class);
        $service->ensureEditableRows($creator);

        $row = CreatorBioLink::where('user_id', $creator->id)
            ->where('target_type', 'piggy-pots')
            ->firstOrFail();

        $this->actingAs($creator)->post(route('bio.links.destroy', ['link' => $row->uuid]));

        $this->assertDatabaseHas('creator_bio_links', ['id' => $row->id, 'is_active' => false]);

        $public = collect($service->linksFor($creator, false))->pluck('target_type');
        $this->assertFalse($public->contains('piggy-pots'));

        $owner = collect($service->linksFor($creator, true))->pluck('target_type');
        $this->assertTrue($owner->contains('piggy-pots'));
    }

    // ------------------------------------------------------------------- page

    public function test_the_page_canonicalises_to_the_profile(): void
    {
        // The two describe the same creator with much of the same content;
        // without this they compete and the lighter page usually wins.
        $creator = $this->creator();
        $this->pot($creator);

        $this->get("/{$creator->username}/bio")
            ->assertOk()
            ->assertSee(route('user.show', ['username' => $creator->username]), false);
    }

    // ----------------------------------------------------------------- editor

    public function test_the_editor_renders_and_materialises_the_derived_buttons(): void
    {
        // Rows are created HERE and never on the public page — an anonymous GET
        // that writes turns every crawler sweeping bio links into a write storm.
        $creator = $this->creator();
        $this->pot($creator);

        $this->assertDatabaseCount('creator_bio_links', 0);

        $this->actingAs($creator)
            ->get(route('bio.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Bio/Edit')->has('platforms'));

        $this->assertDatabaseHas('creator_bio_links', [
            'user_id' => $creator->id,
            'kind' => BioLinkPlatforms::KIND_INTERNAL,
            'target_type' => 'piggy-pots',
        ]);
    }

    public function test_the_public_page_writes_no_rows(): void
    {
        $creator = $this->creator();
        $this->pot($creator);

        $this->get("/{$creator->username}/bio")->assertOk();

        $this->assertDatabaseCount('creator_bio_links', 0);
    }

    public function test_a_supporter_cannot_open_the_editor(): void
    {
        $gifter = User::factory()->create(['role' => 0]);

        $this->actingAs($gifter)
            ->get(route('bio.edit'))
            ->assertRedirect(route('dashboard'));
    }

    public function test_a_supporter_cannot_write_links(): void
    {
        // A supporter's rows could never render — BioPageController sends them
        // to their profile — but an endpoint accepting writes it will never
        // honour is an unvalidated write path, and the rows pile up in silence.
        $gifter = User::factory()->create(['role' => 0]);

        $this->actingAs($gifter)
            ->post(route('bio.links.store'), ['platform' => 'twitch', 'handle' => 'mychannel'])
            ->assertStatus(403);

        $this->assertDatabaseCount('creator_bio_links', 0);
    }

    public function test_reach_is_owner_only(): void
    {
        $creator = $this->creator();
        $this->pot($creator);

        $this->get("/{$creator->username}/bio")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('stats', null));

        $this->actingAs($creator)
            ->get("/{$creator->username}/bio")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->has('stats.views'));
    }
}
