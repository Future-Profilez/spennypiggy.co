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
use App\Services\CreatorSetupService;
use App\Services\IntercomService;
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
                'default_currency' => $user->default_currency,
                'monthly_charge_enabled' => $user->monthly_charge_enabled,
                'is_subscribed' => $user->is_subscribed,
                'subscription_status' => $user->subscription_status,
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
            ];

            // If the user is an admin or we are on a specific route that needs more, we could add them,
            // but for "Quick Wins", this lean object covers 95% of use cases.
        }

        // Cache the followed user lookup if username is present
        $followedUser = null;
        if ($request->username) {
            $followedUser = Cache::remember('user_basic_'.$request->username, 600, function () use ($request) {
                return User::where('username', $request->username)->first();
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
                // Read on every Inertia navigation, so it uses the single-query form. The
                // role guard stays as a cheap early-out for the majority of visitors, who
                // are not creators; the service checks it again for anything else.
                'needs_first_listing' => $user && (int) $user->role === 1
                    ? app(CreatorSetupService::class)->needsFirstListingFast($user)
                    : false,

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
            'symbols' => Cache::remember('currency_symbols', 86400, fn () => Currency::symbols()),
            'rates' => Cache::remember('currency_rates', 86400, fn () => Currency::rates()),
            'currencies' => Cache::remember('all_currencies_iso', 86400, fn () => Currency::select('ISO', 'ISOdigits', 'symbol')->get()->keyBy('ISO')),
            'global_currency' => Cookie::get('currency'),
            'platform_fee_percentage' => config('app.platform_fee_percentage', 17),
            'transaction_fee_percentage' => config('app.transaction_fee_percentage', 2),
            'turnstileSiteKey' => $this->resolveTurnstileSiteKey($request),
            'intercom' => app(IntercomService::class)->buildSettings($user),
            'last_terms_update' => Setting::where('key', 'last_terms_update')->value('value') ?? '2026-04-23 00:00:00',
            'updated_terms_list' => json_decode(Setting::where('key', 'updated_terms_list')->value('value') ?? '[]', true),
        ];
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
