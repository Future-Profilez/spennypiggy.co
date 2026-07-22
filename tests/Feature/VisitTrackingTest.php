<?php

namespace Tests\Feature;

use App\Http\Middleware\TrackSiteVisit;
use App\Models\SiteVisitStat;
use App\Services\VisitTracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
use Tests\TestCase;

/**
 * Visit counting is the input to the Visit stage on both funnels. It has to be
 * cheap, bot-free, and impossible to double-count.
 */
class VisitTrackingTest extends TestCase
{
    use RefreshDatabase;

    private VisitTracker $tracker;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->tracker = app(VisitTracker::class);
    }

    private function request(string $path = '', array $query = [], ?string $referer = null, string $agent = 'Mozilla/5.0 Chrome/120'): Request
    {
        $request = Request::create('/'.$path, 'GET', $query);
        $request->headers->set('User-Agent', $agent);

        if ($referer) {
            $request->headers->set('referer', $referer);
        }

        return $request;
    }

    public function test_source_comes_from_utm_then_invite_then_referer_then_direct(): void
    {
        $this->assertSame('reddit', $this->tracker->resolveSource($this->request('', ['utm_source' => 'reddit'])));
        $this->assertSame('x', $this->tracker->resolveSource($this->request('', ['utm_source' => 'twitter'])));
        $this->assertSame('creator_invite', $this->tracker->resolveSource($this->request('', ['invite' => 'abc'])));
        $this->assertSame('google', $this->tracker->resolveSource($this->request('', [], 'https://www.google.com/search')));
        $this->assertSame('referral', $this->tracker->resolveSource($this->request('', [], 'https://someblog.dev/post')));
        $this->assertSame('direct', $this->tracker->resolveSource($this->request()));
    }

    public function test_an_internal_referer_is_not_a_traffic_source(): void
    {
        // Someone moving from the home page to the leaderboard has not arrived
        // from anywhere — counting that as a referral would invent traffic.
        $source = $this->tracker->resolveSource(
            $this->request('leaderboard', [], config('app.url').'/home')
        );

        $this->assertSame('direct', $source);
    }

    public function test_page_type_separates_the_two_funnels(): void
    {
        $this->assertSame('landing', $this->tracker->resolvePageType($this->request()));
        // No matched route on a hand-built Request — falls back to shape.
        $this->assertSame('creator_profile', $this->tracker->resolvePageType($this->request('someusername')));
        $this->assertSame('other', $this->tracker->resolvePageType($this->request('wish/123')));
    }

    public function test_real_app_routes_are_never_counted_as_creator_profiles(): void
    {
        // The page type used to be guessed from a hand-maintained list of
        // "reserved" paths, which missed a hundred real routes — /creators,
        // /earnings, /account — and inflated the supporter funnel's first stage.
        // Now the matched route name decides, so this can never drift again.
        foreach (['leaderboard', 'creators', 'earnings', 'account', 'login'] as $path) {
            $request = $this->request($path);
            $route = app('router')->getRoutes()->match(
                Request::create('/'.$path, 'GET')
            );
            $request->setRouteResolver(fn () => $route);

            $this->assertSame(
                'other',
                $this->tracker->resolvePageType($request),
                "/{$path} is an app route, not a creator profile."
            );
        }
    }

    public function test_the_profile_route_is_recognised_by_name(): void
    {
        $request = $this->request('someusername');
        $route = app('router')->getRoutes()->match(Request::create('/someusername', 'GET'));
        $request->setRouteResolver(fn () => $route);

        $this->assertSame(VisitTracker::PROFILE_ROUTE, $route->getName());
        $this->assertSame('creator_profile', $this->tracker->resolvePageType($request));
    }

    public function test_a_page_view_with_no_signal_falls_back_to_the_first_touch_source(): void
    {
        // Someone lands from Reddit then browses on. Without the fallback every
        // page after the first is "direct" and the source column is useless.
        $request = $this->request('someusername');
        $request->cookies->set(VisitTracker::ATTRIBUTION_COOKIE, 'reddit');

        $this->assertSame('reddit', $this->tracker->resolveSource($request));
    }

    public function test_bots_are_not_counted(): void
    {
        $this->tracker->record($this->request('', [], null, 'Mozilla/5.0 (compatible; Googlebot/2.1)'), true);
        $this->tracker->record($this->request('', [], null, 'curl/8.1'), true);
        // An empty user agent is a script, not a person.
        $this->tracker->record($this->request('', [], null, ''), true);

        $this->assertSame(0, $this->tracker->flush());
        $this->assertSame(0, SiteVisitStat::count());
    }

    public function test_visits_and_unique_visitors_are_counted_separately(): void
    {
        $this->tracker->record($this->request('', ['utm_source' => 'reddit']), true);
        $this->tracker->record($this->request('', ['utm_source' => 'reddit']), true);
        $this->tracker->record($this->request('', ['utm_source' => 'reddit']), false);

        $this->tracker->flush();

        $row = SiteVisitStat::where('source', 'reddit')->where('page_type', 'landing')->first();

        $this->assertNotNull($row);
        $this->assertSame(3, $row->visits);
        $this->assertSame(2, $row->unique_visitors);
    }

    public function test_flushing_twice_does_not_double_count(): void
    {
        $this->tracker->record($this->request(), true);

        $this->tracker->flush();
        $this->tracker->flush();

        $this->assertSame(1, (int) SiteVisitStat::sum('visits'));
    }

    public function test_a_later_flush_adds_to_the_same_day_rather_than_replacing_it(): void
    {
        // Counters are flushed every few minutes; the second flush of the day
        // must not overwrite what the first one already wrote.
        $this->tracker->record($this->request(), true);
        $this->tracker->flush();

        $this->tracker->record($this->request(), false);
        $this->tracker->flush();

        $this->assertSame(2, (int) SiteVisitStat::sum('visits'));
        $this->assertSame(1, SiteVisitStat::count(), 'One bucket per day, source and page type.');
    }

    public function test_domains_are_matched_as_whole_hosts_not_substrings(): void
    {
        // netflix.com contains the substring "x.com" and used to be credited to
        // Twitter/X. Only x.com itself and its subdomains may map there.
        $this->assertSame('referral', $this->tracker->resolveSource($this->request('', [], 'https://netflix.com/browse')));
        $this->assertSame('referral', $this->tracker->resolveSource($this->request('', [], 'https://fedex.com/track')));
        $this->assertSame('x', $this->tracker->resolveSource($this->request('', [], 'https://x.com/somepost')));
        $this->assertSame('x', $this->tracker->resolveSource($this->request('', [], 'https://mobile.x.com/somepost')));
    }

    public function test_inertia_navigations_count_but_partial_reloads_and_plain_ajax_do_not(): void
    {
        $middleware = app(TrackSiteVisit::class);
        $method = new \ReflectionMethod($middleware, 'shouldCount');
        $method->setAccessible(true);
        $ok = new Response('', 200);

        // The site is an SPA: after the first load, every navigation is an
        // Inertia XHR. Dropping those starved the funnels of page views.
        $spaNav = $this->request('someusername');
        $spaNav->headers->set('X-Inertia', 'true');
        $spaNav->headers->set('X-Requested-With', 'XMLHttpRequest');
        $this->assertTrue($method->invoke($middleware, $spaNav, $ok), 'An Inertia navigation is a page view.');

        $partial = $this->request('someusername');
        $partial->headers->set('X-Inertia', 'true');
        $partial->headers->set('X-Inertia-Partial-Data', 'posts');
        $this->assertFalse($method->invoke($middleware, $partial, $ok), 'A partial reload refreshes a page already counted.');

        $polling = $this->request('get-notification');
        $polling->headers->set('X-Requested-With', 'XMLHttpRequest');
        $this->assertFalse($method->invoke($middleware, $polling, $ok), 'Plain AJAX (polling, autocomplete) is not a page view.');
    }

    public function test_redirects_errors_and_prefetches_are_not_visits(): void
    {
        $middleware = app(TrackSiteVisit::class);
        $method = new \ReflectionMethod($middleware, 'shouldCount');
        $method->setAccessible(true);

        $redirect = new Response('', 302);
        $this->assertFalse($method->invoke($middleware, $this->request('dashboard'), $redirect), 'The page a redirect lands on will count; the redirect itself must not.');

        $notFound = new Response('', 404);
        $this->assertFalse($method->invoke($middleware, $this->request('nope'), $notFound));

        $ok = new Response('', 200);
        $prefetch = $this->request('someusername');
        $prefetch->headers->set('Sec-Purpose', 'prefetch');
        $this->assertFalse($method->invoke($middleware, $prefetch, $ok), 'A prefetched link may never be clicked.');
    }

    public function test_an_unknown_source_never_creates_an_unbounded_bucket(): void
    {
        // Anything can be put in a query string; the table must not grow a row
        // per made-up value.
        $this->tracker->record($this->request('', ['utm_source' => 'made-up-source-'.uniqid()]), true);
        $this->tracker->flush();

        $this->assertContains(
            SiteVisitStat::first()?->source,
            VisitTracker::SOURCES,
            'Sources must be normalised onto the known set.'
        );
    }
}
