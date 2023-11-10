<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserCart;
use App\Models\WishItem;
use App\StripeControl;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\Checkout\Session;

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
                return redirect(route("stripe.index"))->with("error", "First invalid error");
            }
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if ($account->charges_enabled) {
                return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe already connected.");
            }

            $link = StripeControl::createAccountLink([
                "account" => $account->id,
                "refresh_url" => route("stripe.connect", ["step" => "refresh"]),
                "return_url"  => route("stripe.return"),
                "type"        => "account_onboarding"
            ]);

            // return Inertia::location($link->url);
            return redirect()->away($link->url);
        } catch (Exception $e) {
            return redirect(route("stripe.index"))->with("error", "Invalid error:" . $e->getMessage());
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
            return redirect(route("user.show", ["username" => $user->username]))->with("error", "Stripe did not initiated properly.");
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if (empty($user->stripe_details_submitted)) {
                $user->stripe_details_submitted = $account->details_submitted ?? NULL;
                $user->save();
            }
            return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe connected.");
        } catch (Exception $e) {
            return redirect(route("user.show", ["username" => $user->username]))->with("error", $e->getMessage());
        }
    }

    /* create checkout */
    public function createCheckout($owner_id)
    {
        try {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();
            $lineItems = [];
            foreach ($getdata as $dd) {
                $lineItems[] = [
                    'price' => $dd->wish->price_id,
                    'quantity' => 1,
                ];
            }

            $stripe = new \Stripe\StripeClient('sk_test_51O3maCG7xsNScLmXVQNnz6tw1ukAvcKY5WhVEk7e1wRAH9pSC7rmk3gxRFKAUMrVMAxWsndWudNmmvqkmm2p2w1J00sBIpHExQ');
            $sessioncreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.success', [$owner_id]),
                'cancel_url' => route('checkout.cancel'),
                'line_items' => $lineItems,
                'mode' => 'payment',
            ]);


            \Log::info("ssss");
            \Log::info($sessioncreate);
            return Inertia::location($sessioncreate->url);


            // $this->retrive($sessioncreate->id);
        } catch (\Throwable $th) {
            throw $th;
        }
    }

    public function retrive($id)
    {
        $stripe = new \Stripe\StripeClient('sk_test_51O3maCG7xsNScLmXVQNnz6tw1ukAvcKY5WhVEk7e1wRAH9pSC7rmk3gxRFKAUMrVMAxWsndWudNmmvqkmm2p2w1J00sBIpHExQ');
        $data = $stripe->checkout->sessions->retrieve(
            $id,
            []
        );

        \Log::info('2');
        \Log::info($data);
    }

    public function successCheckout($owner_id)
    {
        $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();
        foreach ($getdata as $dd) {
            $dd->status = 0;
            $dd->save();
        }

        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('success', 'Payment Successfull.');
    }

    public function cancelCheckout()
    {
        return view('cancel');
    }
}
