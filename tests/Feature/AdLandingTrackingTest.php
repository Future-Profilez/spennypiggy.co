<?php

namespace Tests\Feature;

use App\Services\VisitTracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * The six paid-ads landing pages, and the first-touch attribution that ties a
 * signup back to the one that earned it.
 *
 * Two failure modes this covers, both of which are SILENT in production:
 *
 *  - A page type written by `record()` but missing from `PAGE_TYPES` is a
 *    counter the flush never enumerates, so it is incremented in the cache,
 *    never written to the database, and expires unread. The page reports zero
 *    visits forever and nothing errors.
 *  - A landing cookie accepted without validation lets any visitor write an
 *    arbitrary string into `users.signup_landing_page`, which the admin report
 *    then displays.
 */
class AdLandingTrackingTest extends TestCase
{
    // The shared Inertia payload reads the `currencies` table on every page, so
    // hitting any route at all needs the schema.
    use RefreshDatabase;

    /** @test */
    public function every_ad_landing_page_type_is_collectable_by_the_flush(): void
    {
        foreach (VisitTracker::AD_LANDING_ROUTES as $route => $pageType) {
            $this->assertContains(
                $pageType,
                VisitTracker::PAGE_TYPES,
                "Page type '{$pageType}' (route {$route}) is missing from PAGE_TYPES, so flush() would never collect its counters."
            );
        }
    }

    /** @test */
    public function each_ad_landing_route_exists_and_answers_get(): void
    {
        foreach (array_keys(VisitTracker::AD_LANDING_ROUTES) as $name) {
            $route = collect(app('router')->getRoutes())
                ->first(fn ($r) => $r->getName() === $name);

            $this->assertNotNull($route, "Route '{$name}' does not exist.");
            $this->assertContains('GET', $route->methods(), "Route '{$name}' does not answer GET.");
        }
    }

    /** @test */
    public function page_type_is_resolved_from_the_route_name(): void
    {
        $tracker = app(VisitTracker::class);

        foreach (VisitTracker::AD_LANDING_ROUTES as $name => $expected) {
            $route = collect(app('router')->getRoutes())
                ->first(fn ($r) => $r->getName() === $name);

            $request = Request::create('/'.ltrim($route->uri(), '/'));

            // `getRoutes()->match()` returns the route but does not attach it to
            // the request, and `resolvePageType()` reads `$request->route()`.
            $request->setRouteResolver(fn () => $route);

            $this->assertSame($expected, $tracker->resolvePageType($request));
            $this->assertSame($expected, $tracker->resolveAdLanding($request));
        }
    }

    /** @test */
    public function a_page_that_is_not_an_ad_landing_page_resolves_to_null(): void
    {
        $tracker = app(VisitTracker::class);

        $request = Request::create('/');
        app('router')->getRoutes()->match($request);

        $this->assertNull($tracker->resolveAdLanding($request));
    }

    /** @test */
    public function only_known_page_types_are_accepted_from_the_cookie(): void
    {
        // The cookie is visitor-supplied. Anything not in the known set must be
        // refused, or the admin report prints whatever somebody typed.
        $this->assertTrue(VisitTracker::isAdLanding('ad_founder_bonus'));
        $this->assertFalse(VisitTracker::isAdLanding('landing'));
        $this->assertFalse(VisitTracker::isAdLanding('creators.founder-bonus'));
        $this->assertFalse(VisitTracker::isAdLanding('<script>alert(1)</script>'));
        $this->assertFalse(VisitTracker::isAdLanding(''));
        $this->assertFalse(VisitTracker::isAdLanding(null));
    }

    /** @test */
    public function visiting_an_ad_page_sets_the_first_touch_landing_cookie(): void
    {
        $response = $this->withHeaders(['User-Agent' => 'Mozilla/5.0 (Macintosh)'])
            ->get('/creators/founder-bonus');

        $response->assertOk();
        $response->assertCookie(VisitTracker::LANDING_COOKIE, 'ad_founder_bonus');
    }

    /** @test */
    public function the_first_ad_page_wins_not_the_last(): void
    {
        // Someone clicks the Founder Bonus advert, reads Keep 100%, then signs
        // up. The credit belongs to the page that earned the click.
        $response = $this->withHeaders(['User-Agent' => 'Mozilla/5.0 (Macintosh)'])
            ->withCookie(VisitTracker::LANDING_COOKIE, 'ad_founder_bonus')
            ->get('/creators/keep-100');

        $response->assertOk();
        $response->assertCookieMissing(VisitTracker::LANDING_COOKIE);
    }
}
