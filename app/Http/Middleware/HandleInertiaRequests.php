<?php

namespace App\Http\Middleware;

use App\Models\Currency;
use App\Models\Notification;
use App\Models\UserCart;
use App\Models\WishItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Session;
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

    public function share(Request $request): array {

        $user = $request->user();
        $items = UserCart::where('user_id', $user->id ?? null)->where('status',1)->count();
        $notification_count = Notification::where('notifiable_id',$user->id ?? null)->where('is_read',0)->count();
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
            ],
            'notification_count' => $notification_count,
            'ziggy' => fn () => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            "flash" => function() use($request){
                return [
                    "success" => $request->session()->get("success"),
                    "error" => $request->session()->get("error"),
                    "warning" => $request->session()->get("warning"),
                    "info" => $request->session()->get("info"),
                ];
            },
            'cart_count'=>  $items,
            // 'symbols'   =>  Currency::symbols(),
            'rates'     =>  Currency::rates(),
            'global_currency'   =>  Cookie::get('currency'),
            'hcaptchakey'   =>  env('HCAPTCHA')
        ];
    }
}
