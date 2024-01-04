<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\IpTracker;
use App\Jobs\CreateStripeCustomer;
use App\Models\User;
use App\Providers\RouteServiceProvider;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;
use Ramsey\Uuid\Uuid;
use App\Jobs\WelcomeUser;
use App\Models\PromoCode;
use Carbon\Carbon;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request)
    {
        $locale = $request->cookie('locale') ? json_decode($request->cookie('locale'), true) : null;
        if(!$locale AND !in_array($request->getHttpHost(), ['::1:8000', 'localhost:8000', '127.0.0.1:8000', 'uk.spennypiggy.co'])) {
            IpTracker::getIpInfo();
            if(IpTracker::$ipInfo->country == "GB" || IpTracker::$ipInfo->country == "UK") {
                return Inertia::location("https://uk.spennypiggy.co/register");
            }
        } else if($locale AND in_array($request->getHttpHost(), ['::1:8000', 'localhost:8000', '127.0.0.1:8000', 'uk.spennypiggy.co'])){
            if($locale['country'] == "GB" || $locale["country"]=="GB"){
                return Inertia::location("https://uk.spennypiggy.co/register");
            }
        }
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => [
                'required',
                'string',
                'max:255'
            ],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'username' => ['required', 'string', 'lowercase', 'max:20', 'unique:users,username'],
        ]);

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. Paypig, Findom, Worship, Unlock, Unblock, Receive,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {
            $user = User::create([
                'name' => $request->name,
                'email' => strtolower($request->email),
                'username' => $request->username,
                'gender' => $request->gender ?? null,
                'password' => Hash::make($request->password),
            ]);
            $user->refresh();

            if(!empty($request->promo)){
                $promocode = PromoCode::whereCode($request->promo)->first();
                $user->promo_code_id = $promocode->id;
                $user->save();
            }

            Auth::login($user);

            //send email
            WelcomeUser::dispatch($user);

            $checkemailverify = User::whereId(Auth::id())->first();

            if ($checkemailverify->email_verified_at != NUll) {
                return redirect(route("user.show", [$user->username]))->with("success", "Registration successful.");
            } else {
                return redirect(route('verification.notice'));
            }
        }
    }


    // public function verification()
    // {
    //     $checkemailverify = User::whereId(Auth::id())->first();
    //     return Inertia::render('Auth/VerifyEmail', [
    //         "user" => $checkemailverify,
    //     ]);
    // }
    /**
     * Check if username available
     *
     * @param Request $request
     * @return Response
     */

    public function checkUsername(Request $request)
    {
        $request->validate([
            "username" => [
                "required",
                "string",
                "min:5",
                "max:20"
            ]
        ]);
        $exist = User::whereUsername($request->username)->first();
        return response()->json([
            "available" => empty($exist)
        ]);
    }
}
