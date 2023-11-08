<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\StripeControl;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StripeController extends Controller
{

    /**
     * Landing Page for Stripe Connect
     *
     * @return Inertia
     */
    public function index()
    {
        $user = User::find(Auth::id());
        if (!empty($user->account_id)) {

            try {
                $account = StripeControl::getAccount($user->account_id);
                if ($account->charges_enabled) {
                    return redirect(route("user.show"))->with("success", "Already Connected!");
                }
            } catch (Exception $e) {
                return redirect(route("user.show"))->with("error", $e->getMessage());
            }
        }

        // return Inertia::render("Stripe/Index");

        return Inertia::render("stripe/Stripe");
    }



    /**
     * Init Connect Account Start
     *
     * @param Request $request
     * @param string $step Connection Current Step
     * @return mixed
     */
    public function initConnect(Request $request, $step = "init")
    {

        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            if (!$request->isMethod("POST")) {
                return redirect()->back()->with("error", "Invalid request!");
            }

            try {
                $payload = [
                    "country" => "US",
                    "type" => "express",
                    'email' => $user->email,
                    'capabilities' => [
                        'card_payments' => ['requested' => true],
                        'transfers' => ['requested' => true],
                    ],
                    // 'business_type' => 'individual',
                    // 'business_profile' => ['url' => route("user.show", ["username" => $user->username])],
                ];


                $account = StripeControl::createAccount($payload);
                $user->account_id = $account->id;
                $user->save();
            } catch (Exception $e) {
                return redirect(route("stripe.index"))->with("error", $e->getMessage());
            }
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if ($account->charges_enabled) {
                return redirect(route("user.show"))->with("success", "Stripe already connected.");
            }

            $link = StripeControl::createAccountLink([
                "account" => $account->id,
                "refresh_url" => route("stripe.connect", ["step" => "refresh"]),
                "return_url"  => route("stripe.return"),
                "type"        => "account_onboarding"
            ]);

            return redirect()->away($link->url);
        } catch (Exception $e) {
            return redirect(route("stripe.index"))->with("error", $e->getMessage());
        }
    }




    /**
     * Return URL After Success
     *
     * @param Request $request
     * @return mixed
     */
    public function connectReturn(Request $request)
    {

        $data = $request->all();
        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            return redirect(route("user.show"))->with("error", "Stripe did not initiated properly.");
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if (!$user->stripe_details_submitted) {
                $user->stripe_details_submitted = $account->details_submitted ?? NULL;
                $user->save();
            }
            return redirect(route("user.show"))->with("success", "Stripe connected.");
        } catch (Exception $e) {
            return redirect(route("user.show"))->with("error", $e->getMessage());
        }
    }
}
