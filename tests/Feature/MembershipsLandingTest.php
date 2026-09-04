<?php

namespace Tests\Feature;

use App\Support\MonetisationPillars;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Tests\TestCase;

/**
 * /creators/memberships and the three-pillar block it shares with the home
 * page and /creators.
 *
 * 🚨 THE THINGS PINNED HERE ARE THE ONES NO SCANNER AND NO BUILD CAN SEE:
 * a marketing page advertising a benefit the membership form does not offer,
 * a pillar linking to a route that was never registered, and a page dropping
 * out of the `ssr` group — which costs nothing visible and everything to a
 * crawler, since the page is what the paid ads point at.
 */
class MembershipsLandingTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_page_renders(): void
    {
        $this->get('/creators/memberships')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('creators/Memberships'));
    }

    /**
     * 🚨 The benefits are `config/rewards.php`, not words typed into the page.
     * A retyped list advertises perks the form may not offer, and nothing
     * anywhere would report it.
     */
    public function test_the_benefits_are_the_ones_the_membership_form_offers(): void
    {
        $expected = array_keys((array) config('rewards.perks'));

        $this->get('/creators/memberships')->assertInertia(
            fn ($page) => $page->where(
                'perks',
                fn ($perks) => collect($perks)->pluck('key')->all() === $expected
            )
        );
    }

    /**
     * The on-platform content rule is what `MembershipController` enforces, and
     * the page states it. If the config's rule moved and the page did not, it
     * would be describing a requirement the platform no longer has.
     */
    public function test_the_always_included_benefits_are_the_on_platform_rule(): void
    {
        $onPlatform = (array) config('rewards.on_platform_perks');

        $this->get('/creators/memberships')->assertInertia(
            fn ($page) => $page->where(
                'perks',
                fn ($perks) => collect($perks)
                    ->where('onPlatform', true)
                    ->pluck('key')
                    ->values()
                    ->all() === array_values($onPlatform)
            )
        );
    }

    /**
     * 🚨 `MonetisationPillars` nulls a route name it cannot resolve rather than
     * letting `route()` throw — that payload is built on the HOME PAGE, so a
     * typo in config would 500 the front door to render a link. This asserts
     * the fallback works AND that no live pillar is silently linkless.
     */
    public function test_a_pillar_never_links_to_an_unregistered_route(): void
    {
        config(['monetisation.pillars' => [
            ['key' => 'real', 'name' => 'Real', 'shape' => 's', 'line' => 'l', 'products' => 'p', 'accent' => '#000', 'route' => 'creators.memberships'],
            ['key' => 'fake', 'name' => 'Fake', 'shape' => 's', 'line' => 'l', 'products' => 'p', 'accent' => '#000', 'route' => 'no.such.route'],
        ]]);

        $pillars = MonetisationPillars::forInertia();

        $this->assertSame('/creators/memberships', $pillars[0]['href']);
        $this->assertNull($pillars[1]['href']);
    }

    /** Every configured pillar route must actually exist. */
    public function test_every_configured_pillar_route_resolves(): void
    {
        foreach (config('monetisation.pillars') as $pillar) {
            if ($pillar['route'] === null) {
                continue;
            }

            $this->assertTrue(
                Route::has($pillar['route']),
                "Pillar {$pillar['key']} names an unregistered route: {$pillar['route']}"
            );
        }
    }

    /** The home page and /creators draw the same block from the same payload. */
    public function test_the_home_page_and_the_creators_index_receive_the_pillars(): void
    {
        $keys = array_column(config('monetisation.pillars'), 'key');

        foreach (['/', '/creators'] as $url) {
            $this->get($url)->assertInertia(
                fn ($page) => $page->where(
                    'pillars',
                    fn ($pillars) => collect($pillars)->pluck('key')->all() === $keys
                )
            );
        }
    }

    /**
     * 🚨 SSR is what puts this page in view-source. Outside the group it is an
     * empty shell to a crawler and to a link preview, and nothing errors — the
     * page renders perfectly for a signed-in human either way.
     */
    public function test_the_page_is_inside_the_ssr_group(): void
    {
        $route = Route::getRoutes()
            ->getByName('creators.memberships');

        $this->assertNotNull($route);
        $this->assertContains('ssr', $route->gatherMiddleware());
    }

    /**
     * The <title> must be set SERVER-SIDE. `SeoMeta` always renders its own
     * default and its output sits above `@inertiaHead`, so a page relying on
     * the Inertia title alone ships two <title> tags with the generic one
     * first — and that is the one a crawler takes.
     */
    public function test_the_title_is_set_server_side(): void
    {
        $this->get('/creators/memberships')
            ->assertSee('Creator memberships', false);
    }

    /**
     * ⚠️ A SOURCE SCAN, because these are compliance rules about words and no
     * scanner reads JSX for them. Comments are blanked first — the file's own
     * notes quote the banned terms in order to prohibit them.
     */
    public function test_the_page_carries_no_banned_vocabulary(): void
    {
        $source = file_get_contents(resource_path('js/Pages/creators/Memberships.jsx'));
        $source = preg_replace('#/\*.*?\*/|//[^\n]*#s', '', $source);

        foreach (['donation', 'fundrais', 'buy me a coffee', 'pesky bill'] as $banned) {
            $this->assertStringNotContainsStringIgnoringCase(
                $banned,
                $source,
                "Banned vocabulary on a Stripe-facing marketing page: {$banned}"
            );
        }
    }
}
