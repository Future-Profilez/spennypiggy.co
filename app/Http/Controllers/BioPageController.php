<?php

namespace App\Http\Controllers;

use App\Models\CreatorBioLink;
use App\Models\User;
use App\SeoMeta;
use App\Services\BioPageService;
use App\Services\UserProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * The public link-in-bio page at `/{username}/bio`.
 *
 * 🚨 THIS CONTROLLER ADDS NO NEW WAY TO PAY FOR ANYTHING. Every button either
 * leaves the platform to a whitelisted network or lands on a profile page that
 * already exists and is already gated. Keeping it that way is what makes this
 * page a layout change rather than a new Stripe surface — do not add a checkout
 * call, a price or a payment method here.
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
                'profile_url' => route('user.show', ['username' => $user->username]),
            ],
            'links' => $this->bioService->linksFor($user, $isOwner),
            'featured' => $this->bioService->featured($user),
            'isOwner' => $isOwner,
            // The QR encodes this exact URL, built server-side so it can never
            // disagree with the address the visitor is on.
            'bioUrl' => route('bio.show', ['username' => $user->username]),
            // Owner-only: a visitor has no business reading a creator's reach.
            'stats' => $isOwner ? [
                'views' => (int) (User::whereKey($user->id)->value('bio_page_views') ?? 0),
            ] : null,
        ]);

        if (app()->environment('production') && ! Auth::check()) {
            // Inertia\Response is Responsable, not a Response — convert first.
            return $response->toResponse($request)->withHeaders([
                'Cache-Control' => 'public, max-age=60, s-maxage=300, must-revalidate',
            ]);
        }

        return $response;
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
