<?php

namespace App\Services;

use App\Models\SiteVisitStat;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Counts anonymous visits so the funnels can start at "Visit".
 *
 * Three properties this class exists to guarantee:
 *
 *  1. **No personal data.** Counters only — day, source, page type. Nothing that
 *     identifies a person is stored anywhere, which is why this needs no consent
 *     banner and has nothing to erase on a deletion request.
 *  2. **No write per request.** Increments land in the cache; `visits:flush`
 *     moves them to the database on a schedule. A page view must never wait on a
 *     database write for analytics.
 *  3. **It can never break a page.** Every entry point is wrapped — if tracking
 *     throws, the visitor still gets their page.
 *
 * Sources are normalised to a KNOWN SET on purpose. An unbounded utm_source
 * would leave the flush job unable to enumerate which counters exist, and would
 * let anyone create rows in the table by editing a query string.
 */
class VisitTracker
{
    /** Traffic sources we report on. Anything else becomes `other`. */
    public const SOURCES = [
        'direct', 'reddit', 'x', 'google', 'facebook', 'instagram',
        'tiktok', 'youtube', 'linkedin', 'whatsapp', 'telegram',
        'snapchat', 'discord', 'pinterest', 'twitch', 'threads',
        'referral', 'creator_invite', 'email', 'other',
        // A creator sharing one of their own listings from the in-app share sheet.
        // Distinct from `creator_invite` (which recruits a creator) — this one sells
        // a specific item. Written by ItemShareService::SHARE_SOURCE; the list is
        // fixed on purpose, so a source missing from here is silently counted as
        // `direct` and the whole share channel disappears from the funnels.
        'creator_share',
    ];

    /**
     * The paid-ads landing pages, route name => page type.
     *
     * These six URLs are the ONLY destinations the Google Ads campaigns send
     * traffic to, so they get a counter each rather than sharing `landing` with
     * the home page — "which advert is working" is not answerable from a single
     * bucket.
     *
     * ⚠️ The key is the ROUTE NAME, never the path. `/{username}/{page?}` is a
     * catch-all declared later in `web.php`, so path matching cannot tell
     * `/creators` from a creator called "creators".
     *
     * ⚠️ The values are also written to `users.signup_landing_page`, and the
     * admin funnel joins on them. Renaming one orphans every signup already
     * attributed to it — add a new key instead.
     */
    public const AD_LANDING_ROUTES = [
        'creators' => 'ad_creators',
        'creators.features' => 'ad_features',
        'creators.stripe-safe' => 'ad_stripe_safe',
        'creators.disputes' => 'ad_disputes',
        'creators.founder-bonus' => 'ad_founder_bonus',
        'creators.keep-100' => 'ad_keep_100',
        'creators.discovery' => 'ad_discovery',
        'creators.link-in-bio' => 'ad_link_in_bio',
    ];

    /**
     * Page kinds. The two funnels start in different places.
     *
     * ⚠️ Written out rather than derived from `AD_LANDING_ROUTES` — a constant
     * expression cannot contain a function call, so `array_values()` here is a
     * fatal parse error, not a tidier spelling. `flush()` enumerates this list,
     * so a page type missing from it is a counter that is written and never
     * collected. `AdLandingPageTypesTest` asserts the two stay in step.
     */
    public const PAGE_TYPES = [
        'landing',
        'creator_profile',
        'other',
        'ad_creators',
        'ad_features',
        'ad_stripe_safe',
        'ad_disputes',
        'ad_founder_bonus',
        'ad_keep_100',
        'ad_discovery',
        'ad_link_in_bio',
    ];

    /**
     * Cookie holding the FIRST ad landing page a visitor arrived on.
     *
     * Separate from the source cookie because they answer different questions:
     * the source is the channel that paid for the click, this is the argument
     * that earned it. Both are first-touch and share the same window.
     */
    public const LANDING_COOKIE = 'sp_lp';

    /** The creator profile page — a catch-all route, so name-matching is the
     * only exact way to tell a profile from an app page. */
    public const PROFILE_ROUTE = 'user.show';

    /** Cookie that marks a visitor as already counted today. */
    public const VISITOR_COOKIE = 'sp_v';

    /** Cookie holding the FIRST source a visitor arrived from. */
    public const ATTRIBUTION_COOKIE = 'sp_src';

    /**
     * The X (Twitter) Ads click id, kept so a server-reported conversion can be
     * attributed to the ad click that produced it.
     *
     * 🚨 First touch, never overwritten, and 30 days — X's own click-through
     * attribution window. Overwriting on a later visit would credit the click
     * the visitor happened to make LAST, and the last click before a checkout
     * is almost never the advert that started it.
     *
     * ⚠️ This is X's identifier for their own click, not ours for the person:
     * it is the one identifier X accepts that requires sending them no personal
     * data at all. Hashed email and IP+user-agent are the alternatives, and
     * both are personal data going to a third party — a decision for the client
     * and their legal advice, not a default.
     */
    public const TWCLID_COOKIE = 'sp_twclid';

    /** Days a `twclid` is remembered — X's click-through attribution window. */
    public const TWCLID_DAYS = 30;

    /** Days the first-touch source is remembered. */
    public const ATTRIBUTION_DAYS = 30;

    /** How long an uncollected counter survives. Must outlive the flush's
     * three-day lookback, or a scheduler outage loses the days it covers. */
    private const BUFFER_TTL_MINUTES = 60 * 24 * 4;

    /**
     * Record one page view. Returns the source it was attributed to, so the
     * middleware can set the first-touch cookie without resolving it twice.
     */
    public function record(Request $request, bool $isNewVisitor): ?string
    {
        try {
            if ($this->isBot($request)) {
                return null;
            }

            $source = $this->resolveSource($request);
            $pageType = $this->resolvePageType($request);
            $date = Carbon::now()->toDateString();

            $this->bump($this->key($date, $source, $pageType, 'visits'));

            if ($isNewVisitor) {
                $this->bump($this->key($date, $source, $pageType, 'unique'));
            }

            return $source;
        } catch (\Throwable $e) {
            Log::warning('VisitTracker: record failed', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * Move buffered counters into the database.
     *
     * Enumerates every source × page-type combination rather than tracking which
     * keys exist: the sets are small and fixed, so this cannot miss a counter
     * because a key list lost a race.
     *
     * @return int rows written
     */
    public function flush(?string $date = null): int
    {
        $dates = $date ? [$date] : [
            Carbon::now()->toDateString(),
            // Two days of history as well: a flush just after midnight must not
            // strand the previous day, and if the scheduler was down for a day
            // the counters are still sitting in the cache waiting.
            Carbon::yesterday()->toDateString(),
            Carbon::now()->subDays(2)->toDateString(),
        ];

        $written = 0;

        foreach ($dates as $day) {
            foreach (self::SOURCES as $source) {
                foreach (self::PAGE_TYPES as $pageType) {
                    $visits = (int) (Cache::pull($this->key($day, $source, $pageType, 'visits')) ?? 0);
                    $uniques = (int) (Cache::pull($this->key($day, $source, $pageType, 'unique')) ?? 0);

                    if ($visits === 0 && $uniques === 0) {
                        continue;
                    }

                    $row = SiteVisitStat::firstOrNew([
                        'date' => $day,
                        'source' => $source,
                        'page_type' => $pageType,
                    ]);

                    // Add, never overwrite: the row already holds earlier flushes
                    // from the same day.
                    $row->visits = (int) $row->visits + $visits;
                    $row->unique_visitors = (int) $row->unique_visitors + $uniques;
                    $row->save();

                    $written++;
                }
            }
        }

        return $written;
    }

    /**
     * Where this visit came from.
     *
     * Order matters: an explicit utm_source wins, then a creator invite code,
     * then the referring domain, then direct.
     */
    public function resolveSource(Request $request): string
    {
        $utm = strtolower(trim((string) $request->query('utm_source', '')));

        if ($utm !== '') {
            return self::normaliseSource($utm);
        }

        if ($request->query('invite') || $request->query('ref')) {
            return 'creator_invite';
        }

        $referer = (string) $request->headers->get('referer', '');

        if ($referer !== '') {
            $host = strtolower((string) parse_url($referer, PHP_URL_HOST));

            // A referer on our own domain is not a traffic source — it is the
            // visitor moving around the site.
            if ($host !== '' && ! str_contains($host, (string) parse_url(config('app.url'), PHP_URL_HOST))) {
                return self::normaliseSource($host);
            }
        }

        // Nothing on this request itself — fall back to the source they FIRST
        // arrived from. Without this, someone who lands from Reddit and then
        // browses to a creator profile has that second page counted as
        // "direct", and every page except the landing one collapses into
        // direct, making the source column useless. It also keeps visit
        // attribution and signup attribution on the same first-touch rule, so
        // "reddit: 50 visits → 3 signups" compares like with like.
        $firstTouch = (string) $request->cookie(self::ATTRIBUTION_COOKIE, '');

        if ($firstTouch !== '') {
            return self::normaliseSource($firstTouch);
        }

        return 'direct';
    }

    /**
     * Map a raw source or hostname onto the known set.
     *
     * Public and static: registration and the admin funnel service need the
     * SAME mapping, or a signup tagged `twitter` never matches spend recorded
     * against the `x` channel.
     */
    public static function normaliseSource(string $raw): string
    {
        $raw = strtolower(trim($raw));

        if ($raw === '') {
            return 'direct';
        }

        // Domains are matched as whole hosts, never substrings — "netflix.com"
        // contains "x.com" and used to be attributed to Twitter/X.
        $domains = [
            'x.com' => 'x', 't.co' => 'x', 'twitter.com' => 'x',
            'fb.com' => 'facebook', 'facebook.com' => 'facebook',
            'youtu.be' => 'youtube', 'youtube.com' => 'youtube',
            'reddit.com' => 'reddit',
            'instagram.com' => 'instagram',
            'tiktok.com' => 'tiktok',
            'linkedin.com' => 'linkedin', 'lnkd.in' => 'linkedin',
            // Chat apps send no referer, so these only fire on tagged links —
            // but the buckets must exist for the tags to land in.
            'wa.me' => 'whatsapp', 'whatsapp.com' => 'whatsapp',
            't.me' => 'telegram', 'telegram.org' => 'telegram',
            'snapchat.com' => 'snapchat',
            'discord.com' => 'discord', 'discord.gg' => 'discord',
            'pinterest.com' => 'pinterest', 'pin.it' => 'pinterest',
            'twitch.tv' => 'twitch',
            'threads.net' => 'threads',
        ];

        foreach ($domains as $domain => $source) {
            if ($raw === $domain || str_ends_with($raw, '.'.$domain)) {
                return $source;
            }
        }

        // Keywords are for utm values and search hosts, where a substring is
        // the right test ("google.co.uk", "newsletter-june").
        $keywords = [
            'reddit' => 'reddit',
            'twitter' => 'x',
            'google' => 'google',
            'facebook' => 'facebook',
            'instagram' => 'instagram',
            'tiktok' => 'tiktok',
            'youtube' => 'youtube',
            'linkedin' => 'linkedin',
            'whatsapp' => 'whatsapp',
            'telegram' => 'telegram',
            'snapchat' => 'snapchat',
            'discord' => 'discord',
            'pinterest' => 'pinterest',
            'twitch' => 'twitch',
            'threads' => 'threads',
            'newsletter' => 'email', 'mailchimp' => 'email', 'sendgrid' => 'email',
        ];

        foreach ($keywords as $needle => $source) {
            if (str_contains($raw, $needle)) {
                return $source;
            }
        }

        if (in_array($raw, self::SOURCES, true)) {
            return $raw;
        }

        // A known external site we have no bucket for is still a referral.
        return str_contains($raw, '.') ? 'referral' : 'other';
    }

    /**
     * Which funnel this page belongs to.
     *
     * The creator funnel starts with a landing view; the supporter funnel starts
     * with a creator profile view. One shared counter could not serve both.
     */
    public function resolvePageType(Request $request): string
    {
        $path = trim($request->path(), '/');

        if ($path === '' || $path === 'home') {
            return 'landing';
        }

        // Ask the router which route actually matched, rather than guessing from
        // the path. A hand-maintained list of "reserved" top-level paths was
        // wrong the day it was written — /creators, /earnings, /account and a
        // hundred others were being counted as creator profiles, inflating the
        // supporter funnel's first stage. The profile page is a catch-all
        // ({username}/{page?}), so the route name is the only exact test.
        $routeName = $request->route()?->getName();

        if ($routeName !== null) {
            if (isset(self::AD_LANDING_ROUTES[$routeName])) {
                return self::AD_LANDING_ROUTES[$routeName];
            }

            return $routeName === self::PROFILE_ROUTE ? 'creator_profile' : 'other';
        }

        // No matched route (called outside the request lifecycle, e.g. a test):
        // fall back to shape, single segment = probably a username.
        return str_contains($path, '/') ? 'other' : 'creator_profile';
    }

    /**
     * The ad landing page this request is on, or null if it is not one.
     *
     * Used by the middleware to set the first-touch landing cookie, and by
     * registration to validate whatever that cookie holds. A cookie is
     * visitor-supplied, so its value is only ever accepted when it appears in
     * `AD_LANDING_ROUTES` — otherwise anyone could write an arbitrary string
     * into `users.signup_landing_page`.
     */
    public function resolveAdLanding(Request $request): ?string
    {
        $routeName = $request->route()?->getName();

        return $routeName !== null
            ? (self::AD_LANDING_ROUTES[$routeName] ?? null)
            : null;
    }

    /** Whether a value is one of the known ad landing page types. */
    public static function isAdLanding(?string $value): bool
    {
        return $value !== null && in_array($value, self::AD_LANDING_ROUTES, true);
    }

    /**
     * Obvious crawlers. Not exhaustive by design — a false negative inflates a
     * count slightly, a false positive silently loses real visitors.
     */
    public function isBot(Request $request): bool
    {
        $agent = strtolower((string) $request->userAgent());

        if ($agent === '') {
            return true;
        }

        foreach (['bot', 'crawl', 'spider', 'slurp', 'facebookexternalhit', 'preview', 'monitor', 'headless', 'curl', 'wget', 'python-requests'] as $needle) {
            if (str_contains($agent, $needle)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Increment a counter that expires on its own.
     *
     * `increment()` sets no lifetime, so a counter the flush never collects —
     * the scheduler was down for days — would sit in Redis forever. Seeding the
     * key with `add()` (which only writes when missing) attaches a TTL that the
     * subsequent increments preserve.
     */
    private function bump(string $key): void
    {
        Cache::add($key, 0, now()->addMinutes(self::BUFFER_TTL_MINUTES));
        Cache::increment($key);
    }

    private function key(string $date, string $source, string $pageType, string $metric): string
    {
        return "visit_stat:{$date}:{$source}:{$pageType}:{$metric}";
    }
}
