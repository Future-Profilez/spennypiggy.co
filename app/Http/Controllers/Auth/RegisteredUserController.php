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
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Ramsey\Uuid\Uuid;
use App\Jobs\WelcomeUser;
use App\Models\AllowedDomain;
use App\Models\CreatorReferral;
use App\Models\Follow;
use App\Models\GifterAddress;
use App\Models\GifterCardVerification;
use App\Models\PromoCode;
use App\Models\Referal;
use App\Models\ReferralCode;
use App\Models\UserVerificationStatus;
use App\Services\UserProfileService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;
use PragmaRX\Google2FALaravel\Google2FA;

class RegisteredUserController extends Controller
{
    protected $google2FA;
    protected $userProfileService;

    public function __construct(Google2FA $google2FA, UserProfileService $userProfileService)
    {
        $this->google2FA = $google2FA;
        $this->userProfileService = $userProfileService;
    }
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


    public function store(Request $request): RedirectResponse
    {
        /* =========================BASIC VALIDATION========================== */
        $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'username' => ['required', 'string', 'lowercase', 'max:20', 'unique:users,username'],
            'role'     => ['required'],
            'promo'    => ['nullable', 'string'], // referral code
        ]);

        $turnstileSecret = config('services.turnstile.secret_key') ?: env('TRUNSTILE_SECRET_KEY') ?: env('TURNSTILE_SECRET_KEY');
        if (!empty($turnstileSecret)) {
            $request->validate([
                'cf_turnstile_response' => ['required', 'string'],
            ]);

            $verifyResponse = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $turnstileSecret,
                'response' => $request->input('cf_turnstile_response'),
                'remoteip' => $request->ip(),
            ]);

            $verifyBody = $verifyResponse->json();
            if (!($verifyBody['success'] ?? false)) {
                throw ValidationException::withMessages([
                    'cf_turnstile_response' => 'Captcha verification failed. Please try again.',
                ]);
            }
        }

        /* =========================FAN ADDRESS VALIDATION========================== */
        if ($request->role == 0) {
            $request->validate([
                'country'        => 'required|string',
                'street_address' => 'required|string|min:20',
                'city'           => 'required|string',
                'state'          => 'required|string',
                'postal_code'    => 'required|integer|digits_between:4,8',
            ]);
        }

        /* =========================IP CHECK (LIVE ONLY)========================== */
        $ip_address = $request->ip();

        if (config('app.url') === 'https://spennypiggy.co') {
            $ipExists = User::where('ip_address', $ip_address)
                ->where('is_uk', 0)
                ->exists();

            if ($ipExists) {
                return back()->with('error', 'You can not create multiple accounts with the same IP address.');
            }
        }

        /* =========================EMAIL DOMAIN CHECK========================== */
        $domain = explode('@', $request->email)[1] ?? '';
        $allowedDomains = AllowedDomain::pluck('name')->toArray();

        if (!in_array($domain, $allowedDomains)) {
            return back()->with('error', 'Invalid Email Id.');
        }

        /* =========================BLOCKED CONTENT CHECK========================== */
        if (Helpers::checkBlockData($request) == 1) {
            return back()->with('error', 'Some words or emojis are not allowed.');
        }

        /* =========================CREATE USER========================== */
        $secret = $this->google2FA->generateSecretKey();

        $user = User::create([
            'tfa_key'             => $secret,
            'name'                => $request->name,
            'email'               => strtolower($request->email),
            'username'            => $request->username,
            'gender'              => $request->gender ?? null,
            'password'            => Hash::make($request->password),
            'role'                => $request->role,
            'creator_category'    => $request->creator_category ?? null,
            'ip_address'          => $ip_address,
            'country'             => $request->country_code ?? null,
            'bio_approved'        => 0,
            'profile_status_lock' => 0,
        ]);

        Auth::login($user);

        /* =========================AUTO FOLLOW SPENNY========================== */
        $spenny = User::where('username', 'spenny_piggy')->first();
        if ($spenny) {
            Follow::updateOrCreate(
                ['follower_id' => $user->id, 'followed_id' => $spenny->id],
                []
            );
            $this->userProfileService->clearUserCaches($spenny->username, $spenny->id);
        }

        /* =========================VERIFICATION / ADDRESS========================== */
        if ($request->role == 1) {
            UserVerificationStatus::create([
                'user_id'        => $user->id,
                'role'           => 1,
                'bio_status'     => 1,
                'address_status' => 0,
            ]);
        }

        if ($request->role == 0) {
            GifterAddress::create([
                'user_id'        => $user->id,
                'country'        => $request->country,
                'street_address' => $request->street_address,
                'city'           => $request->city,
                'state'          => $request->state,
                'postal_code'    => $request->postal_code,
            ]);
        }

        /* =========================✅ CREATOR REFERRAL LOGIC========================== */
        if ($request->filled('promo') && $request->role == 1) {

            // 🔎 Find active referral code
            $referralCode = ReferralCode::where('code', $request->promo)
                ->where('is_active', 1)
                ->first();

            if (!$referralCode) {
                return back()->with('error', 'Invalid referral code.');
            }

            // 👤 Get referrer (creator who owns the code)
            $referrer = User::where('id', $referralCode->creator_id)
                ->where('role', 1)
                ->first();

            if (!$referrer) {
                return back()->with('error', 'Invalid referral code.');
            }

            // ❌ Prevent self-referral
            if ($referrer->id === $user->id) {
                return back()->with('error', 'You cannot use your own referral code.');
            }

            // ❌ Prevent duplicate referral entry
            $alreadyExists = CreatorReferral::where('referred_creator_id', $user->id)
                ->exists();

            if (!$alreadyExists) {
                CreatorReferral::create([
                    'referrer_creator_id' => $referrer->id,
                    'referred_creator_id' => $user->id,
                    'referral_code_id'    => $referralCode->id, // ✅ NEW
                    'lifetime_gmv'        => 0,
                    'status'              => 'IN_PROGRESS',
                ]);
            }
        }
        /* =========================SEND WELCOME EMAIL========================== */
        WelcomeUser::dispatch($user);

        /* =========================REDIRECT========================== */
        if ($user->email_verified_at) {
            return redirect(route('user.show', $user->username))->with('success', 'Registration successful.');
        }

        return redirect(route('verification.notice'));
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
        $exist = User::whereUsername($request->username)->where('is_uk', 0)->first();
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
        $currency = strtoupper($request->cookie("currency", "GBP"));
        $user = Auth::user();
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

        // Ensure Stripe customer
        if (empty($user->stripe_id)) {
            $customer = $stripe->customers->create([
                'email' => $user->email,
                'name' => $user->name,
            ]);
            $user->stripe_id = $customer->id;
            $user->save();
        }

        // Step 1: Check existing verification
        $existingSuccess = GifterCardVerification::where('user_id', $user->id)->where('status', 'success')->whereNull('deleted_at')->first();
        GifterCardVerification::where('user_id', $user->id)->whereIn('status', ['pending', 'rejected by admin'])->delete();

        // if ($existingSuccess) {
        //     $user->update(['profile_status_lock' => 1]);
        //     return response()->json([
        //         'status' => false,
        //         'message' => 'You have already completed verification.',
        //     ]);
        // }

        // Static base amount in GBP
        $baseAmount = 1.00;

        // Add tax (20%) and VAT (20%)
        $tax = $baseAmount * 0.20;
        $subtotal = $baseAmount + $tax;
        $vat = $subtotal * 0.20;
        $finalAmount = $subtotal + $vat;

        // Convert final amount to selected currency
        $convertedAmount = Helpers::priceFormat('gbp', $finalAmount, $currency);
        $finalUnitAmount = intval(round($convertedAmount * 100)); // in smallest currency unit

        // Create Stripe Checkout session
        $session = $stripe->checkout->sessions->create([
            'success_url' => route('card.verification.success', [$user->uuid]),
            'cancel_url' => route('card.verification.failed', [$user->uuid]),
            'mode' => 'payment',
            'customer' => $user->stripe_id,
            'line_items' => [[
                'price_data' => [
                    'currency' => $currency,
                    'product' => env('GIFTER_VERIFY_PRODUCT_ID'),
                    'unit_amount' => $finalUnitAmount,
                ],
                'quantity' => 1,
            ]],
            'payment_method_types' => ['card'],
        ]);

        // Create/update verification record
        $verification = GifterCardVerification::updateOrCreate(
            ['user_id' => $user->id],
            [
                'amount' => $baseAmount,
                'currency' => $currency,
                'status' => 'pending',
                'payment_details' => null,
                'payment_method' => 'Card',
            ]
        );

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
        $user = User::where('uuid', $uuid)->where('is_uk', 0)->first();

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

        // $billingDetails = $charge->billing_details;
        $address = $session->customer_details->address ?? null;

        $gifterAddress = GifterAddress::where('user_id', $user->id)->whereNotNull('stripe_address')->exists();

        if ($address && !$gifterAddress) {
            $encryptedAddress = [
                'line1' => $address->line1 ?? null,
                'line2' => $address->line2 ?? null,
                'city' => $address->city ?? null,
                'state' => $address->state ?? null,
                'postal_code' => $address->postal_code ?? null,
                'country' => $address->country ?? null,
                'name' => $session->customer_details->name ?? null,
            ];

            $encryptedJson = json_encode($encryptedAddress);
            // $encryptedJson = Crypt::encryptString(json_encode($encryptedAddress));

            $gifterAddress = GifterAddress::updateOrCreate(
                ['user_id' => $user->id],  // Match user by their ID
                ['stripe_address' => $encryptedJson]  // Update the stripe_address column
            );
        }

        if ($user->role == 0) {
            // Find the latest verification record
            $verification = GifterCardVerification::where('user_id', $user->id)
                ->latest()
                ->first();

            if ($verification) {
                $verification->status = 'success';
                $verification->payment_details = json_encode([
                    'payment_intent' => $session,
                ]);
                $verification->save();
            }

            $userVerificationStatus = UserVerificationStatus::where('user_id', $user->id)
                ->where('role', 0)
                ->first();
            if (!$userVerificationStatus) {
                $userVerificationStatus = new UserVerificationStatus();
                $userVerificationStatus->user_id = $user->id;
                $userVerificationStatus->role = 0; // Assuming role 0 is for regular users
            }

            $userVerificationStatus->bio_status = 1; // Set gifter card status to verified
            $userVerificationStatus->social_status = 1; // Set gifter card status to verified
            $userVerificationStatus->address_status = 1; // Set gifter card status to verified
            $userVerificationStatus->user_profile_status = 1; // Set gifter card status to verified
            $userVerificationStatus->save();
        }

        // pending profile
        $user->update(['profile_status_lock' => 1, 'is_subscribed' => 1]);

        return redirect()->route('user.show', ['username' => $user->username])->with('success', "Payment Card Verification Successfully Completed.");
    }

    /**
     * Handle card verification failure or cancellation.
     */
    public function cardVerificationFailed($uuid)
    {
        $user = User::where('uuid', $uuid)->where('is_uk', 0)->first();

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
