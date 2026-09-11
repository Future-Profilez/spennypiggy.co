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
 * "Signup started" — the one activation-funnel stage nothing already records.
 *
 * The fourteen stages of §20 are, with one exception, columns or rows somebody
 * already writes: `users.created_at`, `email_verified_at`, avatar + bio, a
 * `social_links` row, each listing table, `account_id`,
 * `stripe_details_submitted`, the ledger. **Opening the registration form is
 * the exception** — the person has no account yet, so abandoning the form
 * leaves nothing behind at all, and the 2 → 3 conversion (form opened → account
 * created) is precisely the friction number the simplification programme is
 * being judged on.
 *
 * It is an anonymous counter rather than a row because of the guarantee at the
 * top of `VisitTracker`: day, source and page type, never a person. A per-visitor
 * "started signing up" record would forfeit that for a number only ever read in
 * aggregate.
 */
class SignupFunnelStageTest extends TestCase
{
    use RefreshDatabase;

    private VisitTracker $tracker;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
        $this->tracker = app(VisitTracker::class);
    }

    private function request(string $path, string $agent = 'Mozilla/5.0 Chrome/120'): Request
    {
        $request = Request::create('/'.$path, 'GET');
        $request->headers->set('User-Agent', $agent);

        return $request;
    }

    /** Runs the real middleware, so the cookie decision under test is the one that ships. */
    private function pageView(Request $request): void
    {
        app(TrackSiteVisit::class)->handle($request, fn () => new Response('', 200));
    }

    public function test_the_registration_form_is_its_own_page_type(): void
    {
        $request = $this->request('register');
        $route = app('router')->getRoutes()->match(Request::create('/register', 'GET'));
        $request->setRouteResolver(fn () => $route);

        $this->assertSame(VisitTracker::SIGNUP_ROUTE, $route->getName());
        $this->assertSame(
            VisitTracker::SIGNUP_PAGE_TYPE,
            $this->tracker->resolvePageType($request),
            'Without its own bucket the form is counted as `other`, alongside every app page.'
        );
    }

    public function test_the_path_fallback_does_not_read_the_form_as_a_creator_profile(): void
    {
        // `register` is a single segment, and the no-matched-route fallback reads
        // a single segment as a username. Left alone, every view arriving without
        // a resolved route lands in `creator_profile` and inflates the supporter
        // funnel's first stage — the exact bug the route-name lookup was written
        // to fix.
        $this->assertSame(
            VisitTracker::SIGNUP_PAGE_TYPE,
            $this->tracker->resolvePageType($this->request('register'))
        );
    }

    public function test_the_signup_counter_is_actually_collected_by_the_flush(): void
    {
        // 🚨 `flush()` ENUMERATES `PAGE_TYPES` rather than tracking which keys
        // exist, so a page type missing from that list is a counter written on
        // every page view and collected by nothing. It never errors and the
        // stage reads zero for ever.
        $this->assertContains(VisitTracker::SIGNUP_PAGE_TYPE, VisitTracker::PAGE_TYPES);

        $this->pageView($this->request('register'));
        $this->tracker->flush();

        $row = SiteVisitStat::where('page_type', VisitTracker::SIGNUP_PAGE_TYPE)->first();

        $this->assertNotNull($row, 'The signup counter never reached the database.');
        $this->assertSame(1, $row->visits);
    }

    public function test_a_visitor_already_counted_elsewhere_today_still_counts_on_the_form(): void
    {
        /*
         * 🚨 THE WHOLE REASON THE SECOND MARKER EXISTS. `sp_v` is set on a
         * visitor's FIRST page of the day, so with one shared marker every page
         * type they reach afterwards records zero uniques — and nobody's first
         * page of the day is the registration form. Measured live on the day
         * this was written: `ad_link_in_bio` carried 4 visits and 0 uniques.
         *
         * A funnel stage that reads zero for ever is worse than no stage.
         */
        $landing = $this->request('');
        $this->pageView($landing);

        $form = $this->request('register');
        $form->cookies->set(VisitTracker::VISITOR_COOKIE, 'seen-earlier-today');
        $this->pageView($form);

        $this->tracker->flush();

        $row = SiteVisitStat::where('page_type', VisitTracker::SIGNUP_PAGE_TYPE)->first();

        $this->assertNotNull($row);
        $this->assertSame(1, $row->unique_visitors, 'The form view was counted as a visit but not as a person.');
    }

    public function test_reopening_the_form_the_same_day_is_not_a_second_person(): void
    {
        $first = $this->request('register');
        $this->pageView($first);

        $again = $this->request('register');
        $again->cookies->set(VisitTracker::VISITOR_COOKIE, 'seen');
        $again->cookies->set(VisitTracker::SIGNUP_COOKIE, 'form-seen');
        $this->pageView($again);

        $this->tracker->flush();

        $row = SiteVisitStat::where('page_type', VisitTracker::SIGNUP_PAGE_TYPE)->first();

        $this->assertSame(2, $row->visits);
        $this->assertSame(1, $row->unique_visitors, 'A funnel counts people; one person re-reading the form is not two candidates.');
    }

    public function test_every_other_page_type_still_uses_the_original_marker(): void
    {
        /*
         * The control, and the point of the change being additive. A funnel
         * whose earlier stages move when you extend it cannot be used to judge
         * anything — the baseline taken before the fee change has to still mean
         * the same thing afterwards.
         */
        $this->assertSame(VisitTracker::VISITOR_COOKIE, VisitTracker::uniqueCookieFor('landing'));
        $this->assertSame(VisitTracker::VISITOR_COOKIE, VisitTracker::uniqueCookieFor('creator_profile'));
        $this->assertSame(VisitTracker::VISITOR_COOKIE, VisitTracker::uniqueCookieFor('ad_creators'));
        $this->assertSame(VisitTracker::SIGNUP_COOKIE, VisitTracker::uniqueCookieFor(VisitTracker::SIGNUP_PAGE_TYPE));

        $landing = $this->request('');
        $landing->cookies->set(VisitTracker::VISITOR_COOKIE, 'seen-earlier-today');
        $this->pageView($landing);

        $this->tracker->flush();

        $row = SiteVisitStat::where('page_type', 'landing')->first();

        $this->assertSame(1, $row->visits);
        $this->assertSame(0, $row->unique_visitors, 'Landing uniques must report exactly what they reported before the signup stage existed.');
    }
}
