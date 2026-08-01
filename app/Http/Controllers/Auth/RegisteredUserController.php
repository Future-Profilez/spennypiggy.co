<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\IpTracker;
use App\Jobs\LinkUserToCrmCreator;
use App\Jobs\WelcomeUser;
use App\Models\AllowedDomain;
use App\Models\CreatorReferral;
use App\Models\Follow;
use App\Models\GifterAddress;
use App\Models\GifterCardVerification;
use App\Models\PlatformRiskState;
use App\Models\PromoCode;
use App\Models\ReferralCode;
use App\Models\User;
use App\Models\UserVerificationStatus;
use App\Services\UserProfileService;
use App\Services\VisitTracker;
use App\Support\PresetCovers;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FALaravel\Google2FA;
use Ramsey\Uuid\Uuid;
use Stripe\StripeClient;

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
        $google = $request->session()->get(GoogleController::SESSION_KEY);

        return Inertia::render('Auth/Register', [
            // Present only when the person arrived through Google. The page pre-fills the name,
            // shows the email as settled rather than as a field, and drops the password step.
            //
            // Only what the screen needs to render is sent — never `google_id`, and the address
            // is display-only: `store()` reads the authoritative copy from the session, so
            // editing this in the browser changes nothing.
            'googleProfile' => is_array($google) && ! empty($google['email'])
                ? [
                    'email' => $google['email'],
                    'name' => $google['name'] ?? null,
                    'avatar' => $google['avatar'] ?? null,
                ]
                : null,
            // Campaign tags that were on the URL before the round trip to Google.
            'googleUtm' => (object) $request->session()->get('google_signup_utm', []),
            // The button renders only when both credentials are configured, so an environment
            // without them shows the email form alone rather than a control that cannot work.
            'googleEnabled' => filled(config('services.google.client_id'))
                && filled(config('services.google.client_secret')),
        ]);
    }

    public function validateRegistration(Request $request)
    {
        $messages = [
            'username.regex' => 'The username must only contain letters, numbers, periods (.), and underscores (_).',
        ];

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'username' => ['sometimes', 'required', 'string', 'lowercase', 'regex:/^[a-zA-Z0-9_\.]+$/', 'not_regex:/@/', 'min:5', 'max:20', 'unique:users,username'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['sometimes', 'required', 'string', Rules\Password::defaults()],
            'password_confirmation' => ['sometimes', 'required_with:password', 'same:password'],
            'country' => ['sometimes', 'required', 'string'],
        ], $messages);

        $validator->after(function ($validator) use ($request) {
            $email = (string) $request->input('email', '');
            if ($email !== '' && str_contains($email, '@')) {
                $domain = strtolower(trim(explode('@', $email)[1] ?? ''));
                if ($domain !== '' && ! AllowedDomain::where('name', $domain)->exists()) {
                    $validator->errors()->add('email', 'Invalid Email Id.');
                }
            }
        });

        $validator->validate();

        return response()->json([
            'valid' => true,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        /* =========================RISK ENGINE CHECK========================== */
        // Check Platform State (FREEZE blocks new creator activation)
        $platformState = PlatformRiskState::latest('started_at')->first();
        if ($platformState && $platformState->state === 'FREEZE' && $request->role == 1) {
            throw ValidationException::withMessages([
                'email' => 'New creator registration is temporarily paused due to system maintenance.',
            ]);
        }

        /* =========================GOOGLE SIGN-UP========================== */
        // A Google sign-up posts this same form and passes every gate below it. The only
        // differences are handled here.
        //
        // 🚨 The email is taken from the SESSION, never from the request. The session copy was
        // written by `GoogleController` only after Google reported the address verified; the
        // request copy is whatever the browser sent. Trusting the request would let anyone with
        // a Google session POST somebody else's address and receive an account already marked
        // email-verified on it.
        $google = $request->session()->get(GoogleController::SESSION_KEY);

        if (is_array($google) && ! empty($google['email'])) {
            $request->merge([
                'email' => $google['email'],
                // There is no password to post. One is generated so the column (NOT NULL) is
                // satisfied and the row cannot be signed into by guessing an empty value; the
                // person can set a real one later through forgot-password, which also gives
                // them a second way in if they ever lose the Google account.
                'password' => $generatedPassword = Str::random(48),
                'password_confirmation' => $generatedPassword,
            ]);
        } else {
            $google = null;
        }

        /* =========================BASIC VALIDATION========================== */
        $messages = [
            'username.regex' => 'The username must only contain letters, numbers, periods (.), and underscores (_).',
        ];

        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'username' => ['required', 'string', 'lowercase', 'regex:/^[a-zA-Z0-9_\.]+$/', 'not_regex:/@/', 'min:5', 'max:20', 'unique:users,username'],
            // 0 = gifter, 1 = creator. 2 is ADMIN and must never be reachable from
            // this form: `role` is mass-assigned into User::create() and
            // EnsureUserIsAdmin gates purely on role === '2', so an unvalidated
            // `role` made "POST /register with role=2" a route to platform admin
            // (including the founder payout triggers).
            'role' => ['required', Rule::in([0, 1, '0', '1'])],
            'promo' => ['nullable', 'string'], // referral code
            'crm_invite_token' => ['nullable', 'string', 'max:255'],
        ], $messages);

        // Turnstile is skipped on the Google path, and ONLY this one. Google's own sign-in is the
        // bot gate there, and the form never rendered a widget for the person to solve — every
        // other check below still runs.
        if (! $google && config('app.url') === 'https://spennypiggy.co') {
            $turnstileSecret = config('services.turnstile.secret_key') ?: env('TRUNSTILE_SECRET_KEY') ?: env('TURNSTILE_SECRET_KEY');
            if (! empty($turnstileSecret)) {
                $request->validate([
                    'cf_turnstile_response' => ['required', 'string'],
                ]);

                $verifyResponse = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $turnstileSecret,
                    'response' => $request->input('cf_turnstile_response'),
                    'remoteip' => $request->ip(),
                ]);

                $verifyBody = $verifyResponse->json();
                if (! ($verifyBody['success'] ?? false)) {
                    throw ValidationException::withMessages([
                        'cf_turnstile_response' => 'Captcha verification failed. Please try again.',
                    ]);
                }
            }
        }

        /* =========================SUPPORTER COUNTRY========================== */
        // Only the country is asked for at signup — it sets the display
        // currency. The billing address is NOT collected here: `successCheckout`
        // already writes the card-verified address from Stripe into
        // `gifter_addresses` at the first purchase, so asking for a
        // hand-typed copy up front collected worse data at the point where it
        // cost the most sign-ups. The old rules also required a street address
        // of at least 20 characters, which a genuine short address fails.
        if ($request->role == 0) {
            $request->validate([
                'country' => 'required|string',
            ]);
        }

        if ($request->role == 1) {
            $request->validate([
                'creator_email_receipt_ack' => ['accepted'],
            ], [
                'creator_email_receipt_ack.accepted' => 'Please confirm you understand your creator e-mail address may appear on supporter transaction records and receipts.',
            ]);
        }

        /* =========================FRAUD PREVENTION CHECK (LIVE ONLY)========================== */
        $ip_address = $request->ip();

        if (app()->environment('production') || config('app.url') === 'https://spennypiggy.co') {
            // Solution C: Check device cookie/session first
            // If they already have a "registered_device" cookie, block them immediately
            if ($request->cookie('registered_device')) {
                throw ValidationException::withMessages([
                    'email' => 'Multiple accounts from the same device are not allowed.',
                ]);
            }

            // Solution A: Max accounts per IP limit
            $ipCount = User::where('ip_address', $ip_address)->count();

            if ($ipCount >= 3) {
                throw ValidationException::withMessages([
                    'email' => 'Too many accounts have been created from this IP address.',
                ]);
            }
        }

        /* =========================EMAIL DOMAIN CHECK========================== */
        // Skipped on the Google path. The allowlist exists to keep unreachable and throwaway
        // addresses out; Google has already proved this one receives mail. Enforcing it there
        // would also reject every Google Workspace address — the list holds six domains — so the
        // button would refuse a large share of the people it is meant to let in.
        if (! $google) {
            $domain = strtolower(explode('@', $request->email)[1] ?? '');
            $allowedDomains = AllowedDomain::pluck('name')->toArray();

            if (! in_array($domain, $allowedDomains)) {
                throw ValidationException::withMessages([
                    'email' => 'Invalid Email Id.',
                ]);
            }
        }

        /* =========================BLOCKED CONTENT CHECK========================== */
        $blockedWord = Helpers::checkBlockData($request);
        if ($blockedWord !== false) {
            throw ValidationException::withMessages([
                'name' => "The word or emoji '{$blockedWord}' is not allowed as per our policies.",
            ]);
        }

        $referralCode = null;
        $referrer = null;
        if ($request->filled('promo') && $request->role == 1) {
            $referralCode = ReferralCode::where('code', $request->promo)
                ->where('is_active', 1)
                ->first();

            if ($referralCode) {
                $referrer = User::where('id', $referralCode->creator_id)
                    ->where('role', 1)
                    ->first();
            }
        }

        /* =========================CREATE USER========================== */
        $secret = $this->google2FA->generateSecretKey();

        // From App\Support\PresetCovers, not a copy of the list: this array had
        // drifted into three files, and a new creator was landing on one of the
        // old unnamed banners rather than one of the designed ones.
        $creatorCovers = PresetCovers::signupPool();

        $assignedCover = $request->role == 1
            ? $creatorCovers[array_rand($creatorCovers)]
            : PresetCovers::FAN_DEFAULT;

        $user = User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'name' => $request->name,
            'email' => $request->email,
            'username' => strtolower($request->username),
            'gender' => $request->gender ?? null,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'creator_category' => $request->creator_category ?? null,
            'ip_address' => $ip_address,
            'country' => $request->country_code ?? null,
            'terms_accepted_at' => now(),
            'creator_email_receipt_acknowledged_at' => $request->role == 1 ? now() : null,
            'bio_approved' => 0,
            'profile_status_lock' => 0,
            // Fall back to the first-touch source cookie set by TrackSiteVisit.
            // Without it, anyone who arrived from Reddit, browsed, and signed up
            // later from a clean URL was recorded as "direct" — which is why
            // attribution was almost entirely empty.
            //
            // Sanitised, not normalised: lowercased and capped so 'Reddit' and
            // 'reddit' are one channel and an oversized query string cannot fail
            // the INSERT — but custom campaign tags (pride_qr) pass through
            // untouched, because collapsing them to 'other' would erase the very
            // thing they were created to measure.
            'utm_source' => $this->sanitiseUtm(
                $request->input('utm_source')
                    ?: $request->cookie(VisitTracker::ATTRIBUTION_COOKIE)
            ),
            'utm_medium' => $request->input('utm_medium'),
            'utm_campaign' => $request->input('utm_campaign'),
        ]);

        // ⚠️ Set AFTER create, not inside it. These columns are not in the model's
        // `$fillable`, so passing them to `User::create()` is silently dropped.
        // We use forceFill to bypass the fillable guard.
        $user->forceFill([
            'tfa_key' => $secret,
            'cover' => $assignedCover,
            'cover_approved' => 1,
        ]);

        if ($google) {
            // Google has already proved the address receives mail, so asking the person to
            // click a link in it proves nothing twice.
            $user->forceFill([
                'email_verified_at' => now(),
                'google_id' => $google['google_id'] ?? null,
            ]);
        }

        $user->save();

        Auth::login($user);

        if (app()->environment('production') || config('app.url') === 'https://spennypiggy.co') {
            // Solution C: Set a long-lived cookie to identify this device
            // This prevents the same device from creating another account, even if IP changes
            Cookie::queue('registered_device', '1', 60 * 24 * 365 * 10); // 10 years
        }

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
                'user_id' => $user->id,
                'role' => 1,
                'bio_status' => 1,
                'address_status' => 0,
            ]);
        }

        if ($request->role == 0) {
            // Country only. The rest of the row is filled by
            // `successCheckout`'s `updateOrCreate` from Stripe's
            // `customer_details.address` on the first purchase.
            GifterAddress::create([
                'user_id' => $user->id,
                'country' => $request->country,
            ]);
        }

        /* =========================✅ CREATOR REFERRAL LOGIC========================== */
        if ($referralCode && $referrer && $request->role == 1 && $referrer->id !== $user->id) {
            // ❌ Prevent duplicate referral entry
            $alreadyExists = CreatorReferral::where('referred_creator_id', $user->id)
                ->exists();

            if (! $alreadyExists) {
                CreatorReferral::create([
                    'referrer_creator_id' => $referrer->id,
                    'referred_creator_id' => $user->id,
                    'referral_code_id' => $referralCode->id, // ✅ NEW
                    'lifetime_gmv' => 0,
                    'status' => 'IN_PROGRESS',
                ]);
            }
        }
        /* =========================SEND WELCOME EMAIL========================== */
        WelcomeUser::dispatch($user);
        LinkUserToCrmCreator::dispatch($user->id, $request->input('crm_invite_token'));

        // The verified profile has been spent. Leaving it in the session would let a second POST
        // to /register create another account carrying the same Google-verified email flag.
        $request->session()->forget([GoogleController::SESSION_KEY, 'google_signup_utm']);

        /* =========================REDIRECT========================== */
        if ($user->email_verified_at) {
            return redirect()->intended(route('user.show', $user->username))->with('success', 'Registration successful.');
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
     * @return Response
     */
    public function checkUsername(Request $request)
    {
        $request->validate([
            'username' => [
                'required',
                'string',
                'alpha_num',
                'not_regex:/@/',
                'min:5',
                'max:20',
            ],
        ]);
        $exist = User::whereUsername($request->username)->first();

        return response()->json([
            'available' => empty($exist),
        ]);
    }

    public function checkCouponCode($code)
    {
        $promocode = PromoCode::whereCode($code)->get();
        if (! empty($promocode)) {
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
     * @return Response
     */
    public function gifterCardVerification(Request $request)
    {
        if ($request->header('X-Inertia') || ! $request->ajax()) {
            return Inertia::render('gifter/GifterCardVerification');
        }

        $currency = strtoupper($request->cookie('currency', 'GBP'));
        $user = Auth::user();
        if (! ($user instanceof User)) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthorized.',
            ], 401);
        }
        $stripe = new StripeClient(config('services.stripe.secret'));

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

        // Use new gross-up flow
        $breakdown = Helpers::calculateStripeDirectChargeFlow($baseAmount, 'GBP');

        $finalTotalAmount = $breakdown['total_supporter_pays'];

        // Convert final amount to selected currency if not GBP
        if ($currency !== 'GBP') {
            $convertedAmount = Helpers::priceFormat('gbp', $finalTotalAmount, $currency);
            $finalUnitAmount = intval(round($convertedAmount * 100));
        } else {
            $finalUnitAmount = intval(round($finalTotalAmount * 100));
        }

        // Create Stripe Checkout session
        $session = $stripe->checkout->sessions->create([
            'success_url' => route('card.verification.success', [$user->uuid]),
            'cancel_url' => route('card.verification.failed', [$user->uuid]), // Use explicit failed route
            'mode' => 'payment',
            'customer' => $user->stripe_id,
            'billing_address_collection' => 'required',
            'line_items' => [[
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => 'Total value of item including all fees',
                        'metadata' => [
                            'product_type' => 'gifter_card_verification',
                        ],
                    ],
                    'unit_amount' => $finalUnitAmount,
                ],
                'quantity' => 1,
            ]],
            'payment_method_types' => ['card'],
            'metadata' => [
                'platform' => 'SpennyPiggy',
                'type' => 'gifter_card_verification',
                'purpose' => 'Gifter Card Verification',
                'payment_category' => 'card_verification',
                'buyer_id' => (string) $user->id,
                'buyer_name' => (string) $user->name,
                'buyer_email' => (string) $user->email,
                'buyer_username' => (string) ($user->username ?? ''),
                'verification_amount' => (string) $baseAmount,
                'currency' => (string) $currency,
                'transaction_description' => 'Card verification charge for '.$user->name,
                'env' => (string) config('app.env'),
            ],
            'payment_intent_data' => [
                'description' => 'SpennyPiggy - Card Verification for '.$user->name,
                'metadata' => [
                    'platform' => 'SpennyPiggy',
                    'type' => 'gifter_card_verification',
                    'purpose' => 'Gifter Card Verification',
                    'payment_category' => 'card_verification',
                    'buyer_id' => (string) $user->id,
                    'buyer_name' => (string) $user->name,
                    'buyer_email' => (string) $user->email,
                    'buyer_username' => (string) ($user->username ?? ''),
                    'verification_amount' => (string) $baseAmount,
                    'currency' => (string) $currency,
                    'transaction_description' => 'Card verification charge for '.$user->name,
                    'env' => (string) config('app.env'),
                ],
            ],
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
        $user = User::where('uuid', $uuid)->first();

        if (! $user) {
            return redirect()->route('login')->with('error', 'User not found.');
        }

        // Prevent IDOR: the {uuid} must belong to the authenticated user — otherwise
        // anyone could flip another user's verification by visiting their UUID.
        if (! Auth::check() || (int) $user->id !== (int) Auth::id()) {
            abort(403);
        }

        $stripe = new StripeClient(config('services.stripe.secret'));

        // Optionally, retrieve the latest checkout session for this customer
        $sessions = $stripe->checkout->sessions->all([
            'customer' => $user->stripe_id,
            'limit' => 1,
        ]);

        $session = $sessions->data[0] ?? null;

        if (! $session) {
            return response()->json([
                'status' => false,
                'message' => 'Stripe session not found.',
            ]);
        }

        // Retrieve full session object to ensure customer_details are populated
        $session = $stripe->checkout->sessions->retrieve($session->id);

        $address = $session->customer_details->address ?? null;

        // Fallback: Check payment intent billing details if session address is incomplete
        if ((! $address || empty($address->line1)) && $session->payment_intent) {
            try {
                $paymentIntent = $stripe->paymentIntents->retrieve($session->payment_intent);
                if ($paymentIntent->shipping && $paymentIntent->shipping->address) {
                    $address = $paymentIntent->shipping->address;
                } elseif ($paymentIntent->latest_charge) {
                    $charge = $stripe->charges->retrieve($paymentIntent->latest_charge);
                    if ($charge->billing_details && $charge->billing_details->address) {
                        $address = $charge->billing_details->address;
                    }
                }
            } catch (\Exception $e) {
                Log::error('Failed to retrieve fallback address: '.$e->getMessage());
            }
        }

        if ($address) {
            $encryptedAddress = [
                'line1' => $address->line1 ?? null,
                'line2' => $address->line2 ?? null,
                'city' => $address->city ?? null,
                'state' => $address->state ?? null,
                'postal_code' => $address->postal_code ?? null,
                'country' => $address->country ?? null,
                'name' => ($session->customer_details->name ?? null) ?: ($address->name ?? null),
            ];

            $encryptedJson = json_encode($encryptedAddress);

            GifterAddress::updateOrCreate(
                ['user_id' => $user->id],
                ['stripe_address' => $encryptedJson]
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
            if (! $userVerificationStatus) {
                $userVerificationStatus = new UserVerificationStatus;
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

        return redirect()->route('user.show', ['username' => $user->username])->with('success', 'Payment Card Verification Successfully Completed.');
    }

    /**
     * Handle card verification failure or cancellation.
     */
    public function cardVerificationFailed($uuid)
    {
        $user = User::where('uuid', $uuid)->first();

        if (! $user) {
            return redirect()->route('login')->with('error', 'User not found.');
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

        return redirect()->route('user.show', ['username' => $user->username])
            ->with('error', 'Card verification was canceled or failed. Please try again.');
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

    //     $stripe = new \Stripe\StripeClient(config('services.stripe.secret'));

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

    /**
     * Make a utm value safe to store and consistent to report on.
     *
     * Lowercased so 'Reddit' and 'reddit' are one channel in attribution and
     * CAC; capped because the column is varchar(255) and an oversized query
     * string must never be able to fail the registration INSERT. Custom
     * campaign tags (pride_qr) pass through untouched.
     */
    private function sanitiseUtm(?string $value): ?string
    {
        $value = strtolower(trim((string) $value));

        if ($value === '') {
            return null;
        }

        return mb_substr($value, 0, 100);
    }
}
