<?php

namespace App\Http\Middleware;

use App\Models\Currency;
use App\Models\Follow;
use App\Models\Notification;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserVerificationStatus;
use App\Models\WishItem;
use App\Services\IntercomService;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Session;
use Illuminate\Support\Facades\Cache;
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
    public function version(Request $request): string|null
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
        if ($user) {
            $user->append(['monthly_charge_enabled']);
            $user->load('gifterCardVerification');
        }

        // Cache the followed user lookup if username is present
        $followedUser = null;
        if ($request->username) {
            $followedUser = Cache::remember('user_basic_' . $request->username, 600, function () use ($request) {
                return User::where('username', $request->username)->first();
            });
        }

        $follow_status = false;
        if ($followedUser) {
            // This query depends on the logged-in user, so we keep it uncached or cache per user pair
            $follow_status = Follow::where('follower_id', $user->id ?? null)
                ->where('followed_id', $followedUser->id ?? null)
                ->exists();
        }
        $userBioStatus = UserVerificationStatus::where('user_id', $user->id ?? null)->first();
        $items = UserCart::where('user_id', $user->id ?? null)->where('status', 1)->count();
        $notification_count = Notification::where('notifiable_id', $user->id ?? null)->where('is_read', 0)->count();
        
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'opposite_user' => $followedUser,
                'verification_status' => $userBioStatus,
                'is_emulated' => $request->session()->get('emulated_by_admin', false),
                // Expose admin identity review status explicitly for frontend gating/UI
                'admin_identity' => $user ? [
                    'status' => $user->identity_admin_status,
                    'reviewed_at' => $user->identity_admin_reviewed_at,
                    'notes' => $user->identity_admin_notes,
                ] : null,
            ],
            'follow_status' => $follow_status,
            'notification_count' => $notification_count,
            'ziggy' => fn() => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            "flash" => function () use ($request) {
                return [
                    "success" => $request->session()->pull("success"),
                    "error" => $request->session()->pull("error"),
                    "warning" => $request->session()->pull("warning"),
                    "info" => $request->session()->pull("info"),
                    "step_up_required" => $request->session()->pull("step_up_required"),
                    "step_up_data" => $request->session()->pull("step_up_data"),
                    "step_up_context" => $request->session()->pull("step_up_context"),
                ];
            },
            'cart_count' =>  $items,
            'symbols'   =>  Cache::remember('currency_symbols', 86400, fn() => Currency::symbols()),
            'rates'     =>  Cache::remember('currency_rates', 86400, fn() => Currency::rates()),
            'currencies' => Cache::remember('all_currencies_iso', 86400, fn() => Currency::select('ISO', 'ISOdigits', 'symbol')->get()->keyBy('ISO')),
            'global_currency'   =>  Cookie::get('currency'),
            'platform_fee_percentage' => config('app.platform_fee_percentage', 20),
            'transaction_fee_percentage' => config('app.transaction_fee_percentage', 2),
            'turnstileSiteKey' => $this->resolveTurnstileSiteKey($request),
            'intercom' => app(IntercomService::class)->buildSettings($user),
            'last_terms_update' => Setting::getValue('last_terms_update', '2026-04-23 00:00:00'),
            'updated_terms_list' => json_decode(Setting::getValue('updated_terms_list', '[]'), true),
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
