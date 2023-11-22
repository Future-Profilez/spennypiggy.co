<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
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
use Carbon\Carbon;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
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
        \Log::info($checkdata);
        die;
        // print_r()die;
        $user = User::create([
            'name' => $request->name,
            'email' => strtolower($request->email),
            'username' => $request->username,
            'password' => Hash::make($request->password),
        ]);

        // $user->refresh();
        // CreateStripeCustomer::dispatch($user);
        event(new Registered($user));

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
