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
use App\Models\AllowedDomain;
use App\Models\GifterAddress;
use App\Models\GifterCardVerification;
use App\Models\PromoCode;
use App\Models\Referal;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Stripe\StripeClient;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request)
    {
        // $locale = $request->cookie('locale') ? json_decode($request->cookie('locale'), true) : null;
        // if(!$locale AND !in_array($request->getHttpHost(), ['::1:8000', 'localhost:8000', '127.0.0.1:8000', 'uk.spennypiggy.co'])) {
        //     IpTracker::getIpInfo();
        //     if(IpTracker::$ipInfo->country == "GB" || IpTracker::$ipInfo->country == "UK") {
        //         return Inertia::location("https://uk.spennypiggy.co/register");
        //     }
        // } else if($locale AND in_array($request->getHttpHost(), ['::1:8000', 'localhost:8000', '127.0.0.1:8000', 'uk.spennypiggy.co'])){
        //     if($locale['country'] == "GB" || $locale["country"]=="GB"){
        //         return Inertia::location("https://uk.spennypiggy.co/register");
        //     }
        // }
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
            'role' => ['required'],
        ]);

        if ($request->role == 0) {
            $request->validate([
                'country' => 'required|string',
                'street_address' => 'required|string|min:20',
                'city' => 'required|string',
                'state' => 'required|string',
                'postal_code' => 'required|integer|digits_between:4,8',
            ]);
        }

        $ip_address = $request->ip();
        $checkIpExist = User::where('ip_address', $ip_address)->exists();
        if ($checkIpExist) {
            return redirect()->back()->with('error', "You can not create multiple account with same IP address. You have already registered with this IP address.");
        }

        $exist = User::where('email', $request->email)->whereNull('deleted_at')->first();
        if (!empty($exist)) {
            return redirect()->back()->with('error', "This email already has been taken.");
        }

        $email = $request->email;
        $domain = explode('@', $email);
        $secure = AllowedDomain::all()->pluck('name')->toArray();

        if (!in_array($domain[1], $secure)) {
            return redirect()->back()->with('error', "Invalid Email Id.");
        }

        $checkdata = Helpers::checkBlockData($request);
        if ($checkdata == 1) {
            return redirect()->back()->with("error", "Some words and emojis are not allowed. Eg. paypig, findom, worship, unlock, unblock, receive, tax, fee, session, deposit, tribute,dick,goddess,master,mistress,
             😈, 💩, 💬, 👅, 🍆, 🍌, 🌽, 🌶️, 🍑, 💎, 💦");
        } else {
            $user = User::create([
                'name' => $request->name,
                'email' => strtolower($request->email),
                'username' => $request->username,
                'gender' => $request->gender ?? null,
                'password' => Hash::make($request->password),
                'role' => $request->role ?? 0,
                'creator_category' => $request->creator_category ?? null,
                'ip_address' => $ip_address,
                'country' => $request->country_code ?? null,
            ]);
            $user->refresh();

            if ($request->role == 0) {
                $addressData = [
                    'country' => Crypt::encryptString($request->country),
                    'street_address' => Crypt::encryptString($request->street_address),
                    'city' => Crypt::encryptString($request->city),
                    'state' => Crypt::encryptString($request->state),
                    'postal_code' => Crypt::encryptString($request->postal_code),
                ];
                // Convert to JSON format
                $addressJson = json_encode($addressData, true);

                GifterAddress::create([
                    'user_id' => $user->id,
                    'address' => $addressJson,
                ]);
            }

            if (!empty($request->promo)) {
                $promocode = PromoCode::whereCode($request->promo)->first();
                $user->promo_code_id = $promocode->id;
                $user->save();
            }

            Auth::login($user);

            $promocode = PromoCode::whereCode($request->promocode)->first();
            if (!empty($promocode)) {
                Referal::insert([
                    'user_id' => Auth::id(),
                    'promocode_id' => $promocode->id,
                ]);
            }

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


    public function checkCouponCode($code)
    {
        $promocode = PromoCode::whereCode($code)->get();
        if (!empty($promocode)) {
            return response()->json([
                'status' => true,
                'message' => 'promo code available',
            ]);
        } else {
            return response()->json([
                'status' => false,
                'message' => 'promo code not available',
            ]);
        }
    }

    /**
     * Check if email available
     *
     * @param Request $request
     * @return Response
     */
    public function gifterCardVerification(Request $request)
    {
        // $request->validate([
        //     'amount' => 'required|numeric',
        // ]);

        $user = Auth::user();

        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

        // Step 1: Create customer if not exists
        if (empty($user->stripe_id)) {
            $stripeCustomer = $stripe->customers->create([
                'email' => $user->email,
                'name' => $user->name,
            ]);
            $user->stripe_id = $stripeCustomer->id;
            $user->save();
        }

        // Step 2: Ensure product exists
        $productName = 'Gifter Card Verification';
        $productList = $stripe->products->all(['limit' => 100]);

        $product = collect($productList->data)->firstWhere('name', $productName);

        if (!$product) {
            $product = $stripe->products->create([
                'name' => $productName,
            ]);
        }

        // Step 3: Currency conversion (1 GBP to requested currency)
        $baseAmountGBP = 1.00;
        $tax = $baseAmountGBP * 20 / 100; // 20% TAX
        $vat = ($baseAmountGBP + $tax) * 20 / 100; // 20% VAT
        $totalAmount = $baseAmountGBP + $vat + $tax; // Total amount in GBP
        $selectedCurrency = $user->default_currency;
        $price = round($totalAmount, 2, PHP_ROUND_HALF_UP);
        // $convertedAmount = $this->convertCurrency('GBP', $selectedCurrency, $baseAmountGBP); // you need this method
        $convertCurrency = Helpers::priceFormat('GBP', $price, $selectedCurrency);
        // $price = round($convertCurrency, 2, PHP_ROUND_HALF_UP);

        \Log::info("Converted amount: $convertCurrency");
        \Log::info("Selected currency: $selectedCurrency");
        \Log::info("Base amount in GBP: $baseAmountGBP");
        \Log::info("Total amount in GBP: $totalAmount");
        \Log::info("Price in GBP: $price");
        \Log::info("tax Price: $tax");
        \Log::info("vat Price: $vat");

        $unitAmount = intval($convertCurrency * 100); // convert to smallest currency unit

        // Step 4: Check or create price
        $priceList = $stripe->prices->all([
            'product' => $product->id,
            'active' => true,
        ]);

        $price = collect($priceList->data)->firstWhere(function ($price) use ($unitAmount, $selectedCurrency) {
            return $price->unit_amount == $unitAmount && $price->currency === $selectedCurrency;
        });

        if (!$price) {
            $price = $stripe->prices->create([
                'unit_amount' => $unitAmount,
                'currency' => $selectedCurrency,
                'product' => $product->id,
            ]);
        }

        // Step 5: Create Checkout Session
        $session = $stripe->checkout->sessions->create([
            'success_url' => route('card.verification.success', [$user->uuid]),
            'cancel_url' => route('card.verification.failed', [$user->uuid]),
            'mode' => 'payment',
            'customer' => $user->stripe_id,
            'line_items' => [[
                'price' => $price->id,
                'quantity' => 1,
            ]],
            'payment_method_types' => ['card'],
        ]);

        // Optional: store record if needed
        $verification = GifterCardVerification::create([
            'user_id' => $user->id,
            'amount' => $baseAmountGBP,
            'currency' => $selectedCurrency,
            'status' => 'pending',
            'payment_details' => null,
            'payment_method' => 'Card',
        ]);

        return response()->json([
            'status' => true,
            'checkout_url' => $session->url,
            'verification' => $verification,
        ]);
    }

    /**
     * Handle successful card verification.
     */
    // This method is called when the payment is successful
    public function cardVerificationSuccess($uuid)
    {
        $user = User::where('uuid', $uuid)->first();

        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

        // Optionally, retrieve the latest checkout session for this customer
        $sessions = $stripe->checkout->sessions->all([
            'customer' => $user->stripe_id,
            'limit' => 1,
        ]);

        $session = $sessions->data[0] ?? null;

        if (!$session) {
            return response()->json([
                'status' => false,
                'message' => 'Stripe session not found.',
            ]);
        }
        $paymentIntent = $stripe->paymentIntents->retrieve(
            $session->payment_intent,
            ['expand' => ['payment_method', 'charges.data.billing_details']]
        );

        if (!$paymentIntent) {
            return response()->json([
                'status' => false,
                'message' => 'Payment intent not found.',
            ]);
        }
        $charge = $paymentIntent->charges->data[0] ?? null;
        $paymentMethod = $charge->payment_method ?? null;

        $billingDetails = $charge->billing_details ?? null;
        $address = $billingDetails->address ?? null;

        $gifterAddress = GifterAddress::where('user_id', $user->id)->whereNotNull('stripe_address')->exists();

        if ($address && !$gifterAddress) {
            $encryptedAddress = encrypt(json_encode([
                'line1' => $address->line1 ?? null,
                'line2' => $address->line2 ?? null,
                'city' => $address->city ?? null,
                'state' => $address->state ?? null,
                'postal_code' => $address->postal_code ?? null,
                'country' => $address->country ?? null,
            ]));

            GifterAddress::create(
                ['user_id' => $user->id],
                ['stripe_address' => $encryptedAddress]
            );
        }

        // Find the latest verification record
        $verification = GifterCardVerification::where('user_id', $user->id)
            ->latest()
            ->first();

        if ($verification) {
            $verification->status = 'success';
            $verification->payment_details = json_encode([
                'payment_intent' => $session->payment_intent,
                'billing_address' => $address,
                'card_last4' => $paymentMethod?->card?->last4,
                'card_brand' => $paymentMethod?->card?->brand,
            ]);
            $verification->save();
        }

        return redirect()->route('user.show', ['username' => $user->username])->with([
            'status' => true,
            'message' => 'Payment verified successfully.',
            'payment_info' => [
                'address' => $address,
                'card_brand' => $paymentMethod?->card?->brand,
                'last4' => $paymentMethod?->card?->last4,
            ],
        ]);


        // return response()->json([
        //     'status' => true,
        //     'message' => 'Payment verified successfully.',
        //     'payment_info' => [
        //         'address' => $address,
        //         'card_brand' => $paymentMethod?->card?->brand,
        //         'last4' => $paymentMethod?->card?->last4,
        //     ],
        // ]);
    }

    /**
     * Handle card verification failure or cancellation.
     */
    public function cardVerificationFailed($uuid)
    {
        $user = User::where('uuid', $uuid)->first();

        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'User not found.',
            ]);
        }

        // Update the latest verification record for the user
        $verification = GifterCardVerification::where('user_id', $user->id)
            ->latest()
            ->first();

        if ($verification) {
            $verification->status = 'failed';
            $verification->payment_details = json_encode([
                'reason' => 'User canceled the Stripe Checkout session',
            ]);
            $verification->save();
        }

        return response()->json([
            'status' => false,
            'message' => 'Card verification failed or was canceled by the user.',
        ]);
    }

    // public function gifterCardVerification(Request $request)
    // {
    //     $request->validate([
    //         'amount' => 'required|numeric',
    //     ]);

    //     $user = Auth::user();

    //     if (empty($user->stripe_id)) {
    //         $stripeCustomer = \Stripe\Customer::create([
    //             'email' => $user->email,
    //             'name' => $user->name ?? null,
    //         ]);

    //         $user->stripe_id = $stripeCustomer->id;
    //         $user->save();
    //     }

    //     $convertCurrency = Helpers::priceFormat('gbp', $request->amount, $user->default_currency);
    //     $price = round($convertCurrency, 2, PHP_ROUND_HALF_UP);

    //     $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

    //     $lineItems[] = [
    //         'quantity' => 1,
    //         'price_data' => [
    //             'currency' => $user->default_currency,
    //             'unit_amount' => $price * 100,
    //             'product_data' => [
    //                 'name' => 'Gifter Card Verification',
    //             ],
    //         ],
    //     ];

    //     // $successUrl = route('card.verification.success', [
    //     //     'uuid' => $ryeProductPayment->uuid,
    //     //     'orderUuid' => $orderDetails->uuid
    //     // ]);

    //     $sessionCreate = $stripe->checkout->sessions->create([
    //         'success_url' => route('card.verification.success', [$user->uuid]), // Include correct parameters
    //         'cancel_url' => route('card.verification.failed', [$user->uuid]),
    //         'line_items' => $lineItems,
    //         'mode' => 'payment',
    //         'payment_method_types' => ['card'],
    //         'payment_intent_data' => [
    //             'transfer_data' => [
    //                 'destination' => $orderDetails->creator->account_id,
    //                 'amount' => $totalAmount,
    //             ],
    //             'on_behalf_of' => $orderDetails->creator->account_id,
    //             'metadata' => [
    //                 'order_id' => $orderDetails->id,
    //                 'user_id' => $orderDetails->user->id,
    //                 'creator_id' => $orderDetails->creator->id,
    //                 'payment_type' => 'product_purchase'
    //             ],
    //         ],
    //         'customer_email' => $orderDetails->user->email,
    //         'metadata' => [
    //             'order_id' => $orderDetails->id,
    //             'user_email' => $orderDetails->user->email,
    //             'payment_source' => 'website',
    //         ],
    //     ]);

    //     $verification = GifterCardVerification::create([
    //         'user_id' => $user->id,
    //         'amount' => $request->amount,
    //         'currency' => $request->currency,
    //         'status' => $request->status,
    //         'payment_details' => json_encode($request->payment_details),
    //         'payment_method' => $request->payment_method,
    //     ]);

    //     return response()->json([
    //         'status' => true,
    //         'message' => 'Gifter card verification created successfully.',
    //         'data' => $verification,
    //     ]);
    // }
}
