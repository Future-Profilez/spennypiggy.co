<?php

namespace App\Http\Middleware;

use App\Models\Currency;
use App\Models\Follow;
use App\Models\Post;
use App\Models\Setting;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserVerificationStatus;
use App\Services\CreatorJourneyService;
use App\Services\IntercomService;
use App\Services\Pricing\CreatorFeeResolver;
use App\Services\PromoBannerService;
use App\Services\SubscriptionActivationService;
use App\Support\AnalyticsEvent;
use App\Support\GifterVerificationCharge;
use App\Support\MaintenanceMode;
use App\Support\SubscriptionPlan;
use App\Support\VerifiedBadge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Cookie;
use Inertia\Middleware;
use Tightenco\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {

        $user = $request->user();
        $leanUser = null;

        if ($user) {
            // Lean User Serialization: Only send what's needed for the layout/navbar
            // This prevents heavy model appends from running on every request.
            $leanUser = [
                'id' => $user->id,
                'uuid' => $user->uuid,
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role,
                'avatar' => $user->avatar,
                'avatar_url' => $user->avatar_url,
                'avatar_approved' => $user->avatar_approved,
                'cover' => $user->cover,
                'cover_url' => $user->cover_url,
                'cover_approved' => $user->cover_approved,
                'is_founder' => $user->is_founder,
                'identity_status' => $user->identity_status,
                'identity_verified_at' => $user->identity_verified_at,
                'identity_admin_status' => $user->identity_admin_status,
                'identity_admin_notes' => $user->identity_admin_notes,
                'identity_admin_reviewed_at' => $user->identity_admin_reviewed_at,
                'profile_status_lock' => $user->profile_status_lock,
                'verified_badge' => VerifiedBadge::tierFor($user),
                'default_currency' => $user->default_currency,
                'monthly_charge_enabled' => $user->monthly_charge_enabled,
                'is_subscribed' => $user->is_subscribed,
                'subscription_status' => $user->subscription_status,
                // ⚠️ Creators only. This is a ledger query and the shared payload is
                // sent with EVERY Inertia navigation, so running it for fans — who
                // can never have creator income — was a query per page view for a
                // value that is always false. Same reason `needs_first_listing`
                // uses its fast form.
                'has_ever_sold' => (int) $user->role === 1
                    && app(SubscriptionActivationService::class)->hasEverMadeSale($user),
                'email_verified_at' => $user->email_verified_at,
                'stripe_details_submitted' => $user->stripe_details_submitted,
                'stripe_connected_at' => $user->stripe_connected_at,
                'country' => $user->country,
                'bio' => $user->bio,
                'bio_approved' => $user->bio_approved,
                'edit_bio_reason' => $user->edit_bio_reason,
                'notification_send' => $user->notification_send,
                'show_piggy_bank' => $user->show_piggy_bank,
                'vat_amount_percentage' => $user->vat_amount_percentage,
                'twitter_username' => $user->twitter_username,
                'is_2fa' => $user->is_2fa,
                'creator_category' => $user->creator_category,
                'is_creator_address_found' => $user->is_creator_address_found,
                'referral_code' => $user->referral_code,
                'is_500_limit_exceeded' => $user->is_500_limit_exceeded,
                'suspended_account' => $user->suspended_account,
                'payout_paused_at' => $user->payout_paused_at,
                'payout_pause_reason' => $user->payout_pause_reason,
                'social_image' => $user->social_image,
                'social_url' => $user->social_url,
                'auto_tweet' => $user->auto_tweet,
                'profile_reject_reason' => $user->profile_reject_reason,
                'is_subscription_cancelled' => $user->is_subscription_cancelled,
                'upcoming_payment_date' => $user->upcoming_payment_date,
                'subscription_end' => $user->subscription_end,
                'is_site_subscription_active' => $user->is_site_subscription_active,
                'display_subscription_status' => $user->display_subscription_status,
                'social_links' => $user->social_links,
                'avatar_cdn_modifier' => $user->avatar_cdn_modifier,
                'cover_cdn_modifier' => $user->cover_cdn_modifier,
                'twitter_token' => $user->twitter_token,
                'gifter_card_verification' => $user->gifterCardVerification,
                // ⚠️ Loaded ONLY for the gifter sitting at the £500 gate — the exact
                // condition under which `ActivateCard` renders at all. The shared
                // payload goes out with every Inertia navigation, so an ungated read
                // would be a query per page view, for every user, to answer a question
                // that only a handful of accounts are ever asked. Same rule as
                // `has_ever_sold` and `needs_first_listing`.
                //
                // ⚠️ It MUST mirror `ActivateCard`'s own `needsVerification`, which is
                // reached by a rejection as well as by the £500 milestone. Gating on
                // the milestone alone left a rejected gifter looking at an empty form
                // for an address they had already given us — and retyping it is the
                // one thing that turns two independent records into one.
                //
                // Carries the price too, so the button quotes the number the card is
                // actually charged — see `GifterVerificationCharge`.
                'verification_gate' => ((int) $user->role === 0
                    && (int) $user->profile_status_lock !== 2
                    && ((int) $user->is_500_limit_exceeded === 1 || filled($user->profile_reject_reason)))
                        ? [
                            'address' => $user->gifterAddress?->toFormArray(),
                            'charge' => GifterVerificationCharge::quote($request->cookie('currency', 'GBP')),
                        ]
                        : null,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'terms_accepted_at' => $user->terms_accepted_at,
                'gender' => $user->gender,
                'ip_address' => $user->ip_address,
                'identity_verification_error' => $user->identity_verification_error,
                'grace_period_started_at' => $user->grace_period_started_at,
                'grace_period_ends_at' => $user->grace_period_ends_at,
                'is_in_grace_period' => $user->is_in_grace_period,
                'financial_profile' => $user->financialProfile,
                'date_of_birth' => $user->date_of_birth,
                /*
                 * Discovery Phase 4 — the creator's own Birthday Discovery
                 * switch, so the profile settings form can render its current
                 * state.
                 *
                 * ⚠️ This is the SIGNED-IN user's own row, which is why the full
                 * `date_of_birth` above is acceptable here and is not on any
                 * public payload. 🚨 The birth year is never published: no
                 * public surface, e-mail or collection card carries it — see
                 * `App\Services\Discovery\BirthdayDiscoveryService`, which
                 * reads `birthday_day` / `birthday_month` instead.
                 */
                'birthday_discovery_opt_in' => (bool) ($user->birthday_discovery_opt_in ?? false),
            ];

            // If the user is an admin or we are on a specific route that needs more, we could add them,
            // but for "Quick Wins", this lean object covers 95% of use cases.
        }

        /*
         * 🚨 SELECT TWO COLUMNS — THIS USED TO SHARE THE WHOLE USER ROW WITH EVERY
         * VISITOR TO EVERY PROFILE.
         *
         * `User::where('username', …)->first()` returns the entire model, it was
         * cached for ten minutes under a per-username key, and it was handed to
         * Inertia as `auth.opposite_user` — which means it was serialised into the
         * `data-page` attribute of the HTML on every `/{username}` route, readable
         * by anyone with View Source and no account at all.
         *
         * `App\Models\User` declares no `$hidden`, so that payload carried ~125
         * columns per creator. Confirmed on a live profile: `date_of_birth`,
         * `email`, `ip_address`, `stripe_user_id`, `stripe_connected_at`,
         * `identity_status`, `identity_admin_status`, `identity_admin_notes`,
         * `suspended_account` and the marketing-consent columns.
         *
         * ⚠️ It also defeated Birthday Discovery's central rule one hop later: the
         * collection card is careful to publish only "26 August", and the profile it
         * links to published `1998-07-13`.
         *
         * ⚠️ The FRONTEND USES EXACTLY ONE FIELD of it — `opponantUser?.id`, in
         * `wishlist/Userprofile.jsx`, as the follow button's target — and nothing on
         * the server reads it at all. So the fix is not `$hidden` (which would only
         * hide these columns here while leaving every other serialisation of a User
         * unchanged); it is to stop selecting them. Username is already in the URL.
         *
         * ⚠️ The cache key is versioned. The old key holds full rows written before
         * this change, and they would keep being served for their remaining TTL.
         */
        $followedUser = null;
        if ($request->username) {
            $followedUser = Cache::remember('user_basic_v2_'.$request->username, 600, function () use ($request) {
                return User::where('username', $request->username)
                    ->first(['id', 'username']);
            });
        }

        $follow_status = false;
        if ($followedUser && $user) {
            $follow_status = Follow::where('follower_id', $user->id)
                ->where('followed_id', $followedUser->id)
                ->exists();
        }

        $userBioStatus = $user ? UserVerificationStatus::where('user_id', $user->id)->first() : null;

        // Cached Cart Count with revalidation strategy
        $cart_count = 0;
        $subscriber_only_posts_count = 0;
        $member_only_posts_count = 0;
        if ($user) {
            $cart_count = Cache::remember("user_cart_count_{$user->id}", 3600, function () use ($user) {
                return UserCart::where('user_id', $user->id)->where('status', 1)->count();
            });

            $subscriber_only_posts_count = Cache::remember("user_sub_posts_count_{$user->id}", 600, function () use ($user) {
                return Post::where('user_id', $user->id)->where('for_module', 'subscription')->count();
            });

            $member_only_posts_count = Cache::remember("user_mem_posts_count_{$user->id}", 600, function () use ($user) {
                return Post::where('user_id', $user->id)->where('for_module', 'membership')->count();
            });
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $leanUser,
                'opposite_user' => $followedUser,
                'verification_status' => $userBioStatus,
                'is_emulated' => $request->session()->get('emulated_by_admin', false),
                'admin_identity' => $user ? [
                    'status' => $user->identity_admin_status,
                    'reviewed_at' => $user->identity_admin_reviewed_at,
                    'notes' => $user->identity_admin_notes,
                ] : null,
                'subscriber_only_posts_count' => $subscriber_only_posts_count,
                'member_only_posts_count' => $member_only_posts_count,
                // The single "what do I do next" answer, rendered by every creator-facing
                // surface so none of them can contradict another. Null once the journey is
                // finished — from then on CreatorOpportunityService owns that question.
                //
                // Cost is bounded and falls in the creator's favour: currentStep() stops at
                // the first unfinished step, and the early ones (profile, identity, payouts)
                // are plain column reads costing no query at all — which is where most
                // creators are.
                'journey' => $user && (int) $user->role === 1
                    ? app(CreatorJourneyService::class)->nextStep($user)
                    : null,
            ],
            'follow_status' => $follow_status,
            'cart_count' => $cart_count,
            /*
             * The promo deck — one slider replaces the five always-on banners that
             * used to stack on the profile page.
             *
             * ⚠️ Deferred behind a closure, so it is only built when a page
             * actually renders it, not on every partial reload.
             *
             * ⚠️ `has_ever_sold` and `free_until_first_sale` are PASSED IN rather
             * than looked up again. Both are already resolved above for the lean
             * user payload, and `hasEverMadeSale` is a ledger query — resolving it
             * twice per request to decide whether to show a card would cost more
             * than the card is worth.
             */
            'promos' => fn () => app(PromoBannerService::class)->for($user, [
                'is_creator' => $user && (int) $user->role === 1,
                'has_ever_sold' => (bool) ($leanUser['has_ever_sold'] ?? false),
                'free_until_first_sale' => (bool) SubscriptionPlan::freeUntilFirstSale(),
            ]),
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'flash' => function () use ($request) {
                return [
                    'success' => $request->session()->pull('success'),
                    'error' => $request->session()->pull('error'),
                    'warning' => $request->session()->pull('warning'),
                    'info' => $request->session()->pull('info'),
                    'step_up_required' => $request->session()->pull('step_up_required'),
                    'step_up_data' => $request->session()->pull('step_up_data'),
                    'step_up_context' => $request->session()->pull('step_up_context'),
                ];
            },
            /*
             * Server-emitted GA4 events, delivered exactly once.
             *
             * Every funnel milestone on this site ends in a redirect, so the
             * controller is the only place that knows one happened. See
             * App\Support\AnalyticsEvent — pulled here, forwarded by
             * resources/js/lib/analytics.js, then gone.
             *
             * ⚠️ A plain closure, deliberately, exactly like `flash` above:
             * Inertia evaluates these on every render, so the events cannot be
             * stranded in the session waiting for a page that asked for them.
             */
            'analytics' => fn () => AnalyticsEvent::pull(),
            'symbols' => Cache::remember('currency_symbols', 86400, fn () => Currency::symbols()),
            'rates' => Cache::remember('currency_rates', 86400, fn () => Currency::rates()),
            'currencies' => Cache::remember('all_currencies_iso', 86400, fn () => Currency::select('ISO', 'ISOdigits', 'symbol')->get()->keyBy('ISO')),
            'global_currency' => Cookie::get('currency'),
            'platform_fee_percentage' => config('app.platform_fee_percentage', 17),
            'transaction_fee_percentage' => config('app.transaction_fee_percentage', 2),

            // Creators on a negotiated platform rate, keyed by user id.
            //
            // ⚠️ The two props above are GLOBAL and cannot express a per-creator
            // rate, so every screen that computes a supporter price client-side
            // quoted the standard figure while checkout charged the bespoke one.
            // This map is what lets those screens resolve the right rate. It is
            // cached and empty for almost every deployment — see
            // CreatorFeeResolver::publicRateMap() for why it is a map rather than
            // a field on each item payload.
            'custom_fee_rates' => CreatorFeeResolver::publicRateMap(),
            'turnstileSiteKey' => $this->resolveTurnstileSiteKey($request),

            /*
             * Pre-flight / bypass notice.
             *
             * NULL for almost every request, and reads the same cached state
             * EnsureSiteAvailable has already resolved, so it costs nothing extra.
             *
             * Two cases, both worth a strip at the top of the page:
             *  - `scheduled` — the window has not started, so warn people BEFORE
             *    their checkout disappears mid-flow. This is what stops the
             *    "my payment vanished" tickets.
             *  - `bypassing` — the site IS down for everyone else and this viewer
             *    is only through on a bypass token. Without it, whoever is doing
             *    the maintenance believes the wall never went up.
             */
            'maintenance_notice' => $this->maintenanceNotice($request),

            // ⚠️ Shared because two components read the plan at MODULE level, where
            // they cannot take a prop — and with nothing to merge they fell back to
            // the hardcoded client constants. `free_until_first_sale` is the one
            // that matters: it is a config switch, and the client copy is a literal
            // `true`, so with the policy turned off both screens still promised
            // "no charge until your first sale" while creators were billed on day
            // one. Config reads only — no queries — so it is safe on every request.
            'subscriptionPlan' => SubscriptionPlan::forFrontend(),
            'intercom' => app(IntercomService::class)->buildSettings($user),
            'last_terms_update' => Setting::where('key', 'last_terms_update')->value('value') ?? '2026-04-23 00:00:00',
            'updated_terms_list' => json_decode(Setting::where('key', 'updated_terms_list')->value('value') ?? '[]', true),
        ];
    }

    /**
     * The strip shown at the top of the app when maintenance is imminent, or when
     * this viewer is only seeing the site because they hold a bypass token.
     *
     * @return array{mode: string, headline: string, message: string, starts_at: ?string, ends_at: ?string}|null
     */
    private function maintenanceNotice(Request $request): ?array
    {
        $state = MaintenanceMode::state();

        if (! $state['enabled']) {
            return null;
        }

        if (MaintenanceMode::isDown($state)) {
            // Reaching here at all means the wall let this request past, which can
            // only be a bypass — EnsureSiteAvailable refuses everything else long
            // before Inertia builds props.
            return [
                'mode' => 'bypassing',
                'headline' => 'The site is offline for everyone else',
                'message' => 'You are viewing it on a maintenance bypass link.',
                'starts_at' => $state['starts_at'],
                'ends_at' => $state['ends_at'],
            ];
        }

        if (MaintenanceMode::isScheduled($state)) {
            return [
                'mode' => 'scheduled',
                'headline' => 'Scheduled maintenance',
                'message' => $state['message'],
                'starts_at' => $state['starts_at'],
                'ends_at' => $state['ends_at'],
            ];
        }

        return null;
    }

    private function resolveTurnstileSiteKey(Request $request): ?string
    {
        $host = strtolower((string) $request->getHost());
        if (app()->environment('local') && in_array($host, ['localhost', '127.0.0.1'], true)) {
            return '1x00000000000000000000AA';
        }

        return config('services.turnstile.site_key') ?: env('TRUNSTILE_SITE_KEY') ?: env('TURNSTILE_SITE_KEY');
    }
}
