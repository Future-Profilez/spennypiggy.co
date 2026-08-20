<?php

namespace App\Http\Controllers;

use App\Models\CreatorBioItem;
use App\Models\CreatorBioLink;
use App\Models\User;
use App\SeoMeta;
use App\Services\Bio\BioTipService;
use App\Services\BioPageService;
use App\Services\Discovery\AttributionService;
use App\Services\UserProfileService;
use App\Support\DiscoverySources;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

/**
 * The public link-in-bio page at `/{username}/bio`.
 *
 * 🚨 THIS PAGE NOW SELLS (B stream, Developer Master Plan 19 Aug 2026 §B), AND
 * IT STILL CONTAINS NO CHECKOUT. Those two statements are only compatible one
 * way, and it is the whole design: a card is a link to a buying path that
 * already exists on the main site — `wishItemSubscribe`, `buyShopItem`,
 * `TaskController::purchase`, `buyBill`, `buyLevel`, the Piggy Pot widget's
 * `piggy-pot.pay` — reached through a server-side redirect that rebuilds the
 * destination from the stored row. Nothing here creates a payment intent,
 * prices anything, or decides who may buy.
 *
 * 🚨 EVERY RULE THE MAIN SITE ENFORCES STILL RUNS, BECAUSE IT RUNS WHERE IT
 * ALWAYS DID — on arrival at the buy path. `CheckoutMethodResolver`, the risk
 * engine, `Helpers::priceWithinLimits`, the supporter-account requirement for
 * Bills / Memberships / Paid Tasks / Shop, the £1 card-verification gate, the
 * creator subscription and activity gates, `fee_profile` threading, and the
 * Deliverable every payment must produce. The brief lists "let the bio page
 * bypass any rule the main site enforces" under Do not; the way to keep that
 * true is to never let this controller answer a question a buy path already
 * answers.
 *
 * 🚨 NOTHING UNMODERATED IS RENDERED. A card exists only while its listing
 * passes the same approval filter the profile uses, so an item held by
 * `CheckMediaModeration`, refused in review, suspended or sold out simply has no
 * card — with no editing and no cron. Link labels, the only free text on the
 * page, already go through `NoExpenseOrBrandName` and `Helpers::checkBlockText`
 * in `BioLinkController`.
 *
 * ⚠️ It deliberately does NOT touch the profile controller. The profile is a
 * separate screen with its own payload, and this route was added ABOVE the
 * `/{username}/{page?}` catch-all rather than as another `{page}` value so that
 * neither can break the other.
 */
class BioPageController extends Controller
{
    public function __construct(
        private readonly UserProfileService $profileService,
        private readonly BioPageService $bioService,
        private readonly AttributionService $attribution,
    ) {}

    public function show(Request $request, string $username)
    {
        $user = $this->profileService->getUserWithRelations($username);

        if (! $user) {
            // 404, never a 200 — a soft-404 is indexed as a real page and
            // re-crawled forever. Same reasoning as the profile.
            SeoMeta::setRobots('noindex,follow');

            return Inertia::render('NotFound')->toResponse($request)->setStatusCode(404);
        }

        if ($user->suspended_account == 1) {
            SeoMeta::setRobots('noindex,follow');

            // 410 Gone: the page existed and was withdrawn.
            return Inertia::render('Suspanded')->toResponse($request)->setStatusCode(410);
        }

        // A supporter has nothing to list, so a bio page for them would be an
        // empty screen on a URL they may well have shared. Send them to the
        // profile, which is the page that does have something to show.
        if ((int) $user->role !== 1) {
            return redirect()->route('user.show', ['username' => $user->username]);
        }

        $isOwner = Auth::check() && (string) Auth::id() === (string) $user->id;

        $this->bioService->recordView(
            $user,
            Auth::id(),
            $request->ip().'|'.$request->userAgent()
        );

        // 🚨 Attribution starts HERE, not at the checkout. A sale from this page is
        // the CREATOR's own traffic and must be recorded as such — see rememberSource().
        $attributed = $this->rememberSource($request, $user);

        $this->setSeo($user);

        $response = Inertia::render('Bio/Show', [
            'creator' => [
                'uuid' => $user->uuid,
                'name' => $user->name,
                'username' => $user->username,
                // Accessors already apply the approval gate — an unreviewed
                // upload is visible to its owner and to nobody else.
                'avatar_url' => $user->avatar_url,
                'bio' => $user->bio_approved == 1 || $isOwner ? $user->bio : null,
                'verified_badge' => $user->verified_badge,
                'is_founder' => (bool) $user->is_founder,
                // ⚠️ Tagged `bio-link`, which is a CREATOR-generated key, not an
                // SP one. The brief is explicit that sales from a creator's own
                // link are their traffic — tagging it records that fact
                // explicitly instead of leaving the visit sourceless, and it
                // can never inflate the number Discovery publishes.
                'profile_url' => DiscoverySources::profileUrl($user->username, 'bio-link'),
            ],
            'links' => $this->bioService->linksFor($user, $isOwner),
            // The listings the creator chose to sell from here. Rendered from the
            // live listing every time — never from a stored price.
            'items' => $this->bioService->items($user, $isOwner),
            'featured' => $this->bioService->featured($user),
            // 🚨 Amounts, limits and the on/off switch come from the server, so the
            // flag is a config change with no deploy (Master Plan §F) and the numbers
            // cannot drift from the ones the endpoint enforces.
            'tip' => BioTipService::payload(),
            'isOwner' => $isOwner,
            // The QR encodes this exact URL, built server-side so it can never
            // disagree with the address the visitor is on.
            'bioUrl' => route('bio.show', ['username' => $user->username]),
            // Owner-only: a visitor has no business reading a creator's reach.
            'stats' => $isOwner ? [
                'views' => (int) (User::whereKey($user->id)->value('bio_page_views') ?? 0),
            ] : null,
        ]);

        // 🚨 A RESPONSE THAT SETS A COOKIE IS NEVER SHARED-CACHEABLE. `sp_disc` is a
        // per-visitor map of creator => source; a CDN holding a response with that
        // Set-Cookie on it would hand one visitor's attribution to the next hundred.
        // `rememberSource()` only queues the cookie when this visitor's map does not
        // already say `bio-link` for this creator, so the common repeat view is still
        // served from the edge — the first view, which is the one that has to be
        // correct, is not.
        if (app()->environment('production') && ! Auth::check() && ! $attributed) {
            // Inertia\Response is Responsable, not a Response — convert first.
            return $response->toResponse($request)->withHeaders([
                'Cache-Control' => 'public, max-age=60, s-maxage=300, must-revalidate',
            ]);
        }

        return $response;
    }

    /**
     * Count a card click, stamp the visitor as `bio-link`, and forward to the
     * listing's EXISTING checkout.
     *
     * 🚨 THE DESTINATION IS REBUILT FROM THE ROW, NEVER TAKEN FROM THE REQUEST. The
     * only input is a uuid; the URL comes from `App\Support\BioSellableItems` via the
     * stored type and the listing it names. There is nothing here to inject, and a
     * listing that has since been deleted, suspended, closed or pulled for moderation
     * resolves to null and is refused rather than sold.
     *
     * 🚨 THIS IS ALSO THE LOAD-BEARING ATTRIBUTION MOMENT. The page above it may be
     * served from a CDN with its Set-Cookie stripped; this redirect never is. Stamping
     * `bio-link` here is what guarantees the purchase that follows carries the
     * creator's own source — `AttributionService::sourceForCreator()` reads exactly
     * this cookie inside every buy path, and writes it to the payment row and the
     * ledger. There is no backfill for a click nobody marked.
     *
     * ⚠️ It creates no payment and answers no eligibility question. Everything the
     * checkout refuses, it refuses on arrival, exactly as it does from the profile.
     */
    public function buy(Request $request, string $item)
    {
        $row = CreatorBioItem::with('user:id,username,role,suspended_account')
            ->where('uuid', $item)
            ->first();

        if (! $row || ! $row->is_active || ! $row->user || $row->user->suspended_account == 1) {
            return redirect()->route('home');
        }

        $url = $this->bioService->checkoutUrlFor($row, $row->user);

        if ($url === null) {
            // The listing is gone or is no longer sellable. Send them to the page
            // they came from rather than to a 404 — the creator has other cards.
            return redirect()
                ->route('bio.show', ['username' => $row->user->username])
                ->with('error', 'That item is not available right now.');
        }

        $this->bioService->recordItemClick($row);
        $this->rememberSource($request, $row->user, true);

        return redirect()->to($url);
    }

    /**
     * Record this visitor as having arrived through the creator's OWN link.
     *
     * ⚠️ `bio-link` is a CREATOR-generated key, never an SP one. The brief is
     * explicit — "Sales from your link are yours and always recorded as your own
     * traffic" — and counting it as ours would inflate the one number the whole
     * Discovery argument rests on.
     *
     * ⚠️ The cookie is queued on the RESPONSE, so it is not on the request the
     * attribution service is about to read. It is written onto the request by hand
     * for the same reason `TrackDiscoveryVisit` does it: without that, the very first
     * visit — the one that matters most — records with no source.
     *
     * ⚠️ Wrapped. Attribution is analytics; it must never be why a creator's link
     * fails to open.
     *
     * @param  bool  $force  the redirect stamps unconditionally (it is never cached);
     *                       the page only stamps when the map would actually change
     * @return bool whether a cookie was queued
     */
    private function rememberSource(Request $request, User $creator, bool $force = false): bool
    {
        try {
            $already = $this->attribution->cookieSourceFor($request, (int) $creator->id) === 'bio-link';

            if ($already && ! $force) {
                // Still worth a visit row — recordVisit de-duplicates per day itself.
                $this->attribution->recordVisit($request, $creator);

                return false;
            }

            $map = $this->attribution->withSource($request, (int) $creator->id, 'bio-link');
            $encoded = json_encode($map);

            Cookie::queue(Cookie::make(
                DiscoverySources::COOKIE,
                $encoded,
                60 * 24 * DiscoverySources::WINDOW_DAYS,
                null,
                null,
                (bool) config('session.secure'),
                true,   // httpOnly — nothing in the browser needs to read it
                false,
                'lax'
            ));

            $request->cookies->set(DiscoverySources::COOKIE, $encoded);

            $this->attribution->recordVisit($request, $creator);

            return true;
        } catch (\Throwable $e) {
            Log::warning('Bio page attribution failed', [
                'creator_id' => $creator->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Count a click and forward.
     *
     * 🚨 THE DESTINATION IS REBUILT FROM THE ROW, NEVER TAKEN FROM THE REQUEST.
     * The only input is a uuid; the URL comes from App\Support\BioLinkPlatforms
     * via the stored platform and handle. There is nothing here to inject, and
     * a platform since removed from the whitelist resolves to null and is
     * refused rather than followed.
     */
    public function go(string $link)
    {
        $row = CreatorBioLink::with('user:id,username,suspended_account')
            ->where('uuid', $link)
            ->first();

        if (! $row || ! $row->is_active || ! $row->user || $row->user->suspended_account == 1) {
            return redirect()->route('home');
        }

        $url = $row->resolvedUrl($row->user->username);

        if ($url === null) {
            return redirect()->route('user.show', ['username' => $row->user->username]);
        }

        $this->bioService->recordClick($row);

        // `away()` for an off-platform host: `redirect()->to()` would resolve a
        // non-absolute value against our own domain, and the destination here
        // is always another site.
        return $row->isExternal()
            ? redirect()->away($url)
            : redirect()->to($url);
    }

    /**
     * ⚠️ Canonical points at the PROFILE, not at this page. The two describe
     * the same creator with much of the same content, and without this the bio
     * page and the profile compete for the same result — usually leaving the
     * lighter page to win, which is the wrong one to rank.
     */
    private function setSeo(User $user): void
    {
        $canonical = SeoMeta::getPageCanonical('user.show', ['username' => $user->username]);

        $title = ($user->name ?: $user->username).' — links';
        $description = 'Everything from '.($user->name ?: $user->username).' in one place.';

        SeoMeta::setCanonical($canonical);
        SeoMeta::setOgData(
            'profile',
            $title,
            $description,
            // ⚠️ Gated on the approval flag directly, NOT on the accessor.
            // `avatar_url` shows an owner their own pending upload, which is
            // right on their screen and wrong in a tag whose entire purpose is
            // to be read by someone else. Same rule as SeoTemplateService.
            $user->avatar_approved == 1 ? $user->avatar_url : null,
            $canonical
        );
    }
}
