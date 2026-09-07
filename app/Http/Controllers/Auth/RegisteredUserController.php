<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Http\Controllers\EmailPreferenceController;
use App\IpTracker;
use App\Jobs\LinkUserToCrmCreator;
use App\Jobs\WelcomeUser;
use App\Models\CreatorReferral;
use App\Models\Follow;
use App\Models\GifterAddress;
use App\Models\GifterCardVerification;
use App\Models\PlatformRiskState;
use App\Models\PromoCode;
use App\Models\ReferralCode;
use App\Models\SignupLead;
use App\Models\SocialLinks;
use App\Models\User;
use App\Models\UserVerificationStatus;
use App\Services\SignupLeadService;
use App\Services\UserProfileService;
use App\Services\VisitTracker;
use App\Support\AnalyticsEvent;
use App\Support\Badges;
use App\Support\EmailDomainPolicy;
use App\Support\GifterVerificationCharge;
use App\Support\MarketingConsent;
use App\Support\PresetCovers;
use App\Support\RiskMessages;
use App\Support\SocialHandle;
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
        // Fails closed: an entry with no readable `expires_at` is treated as expired, not as
        // "no deadline". Reading `! empty($entry['expires_at'])` as the outer condition let such
        // an entry skip the check entirely — which is exactly what an older deploy leaves behind.
        $google = $request->session()->get(GoogleController::SESSION_KEY);

        if ($google !== null && ! GoogleController::pendingIsValid($google)) {
            $request->session()->forget([GoogleController::SESSION_KEY, 'google_signup_utm']);
            $google = null;
        }

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
            // The exact wording the marketing checkbox must show. Served from
            // config rather than hardcoded in the JSX so that the text a person
            // agreed to and the version recorded against their consent
            // (`marketing_consent_version`) can never drift apart.
            'marketingConsentLabel' => MarketingConsent::currentLabel(),
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
            'social_platform' => ['sometimes', 'nullable', Rule::in(SocialHandle::platforms())],
            'social_handle' => ['sometimes', 'nullable', 'string', 'max:255'],
        ], $messages);

        $validator->after(function ($validator) use ($request) {
            $email = (string) $request->input('email', '');

            if ($email !== '' && str_contains($email, '@')) {
                // 🚨 Was an APPROVED-LIST check answering every refusal with
                // "Invalid Email Id." — which reads as "you typed it wrong", so
                // people retyped a perfectly good business address and left. See
                // App\Support\EmailDomainPolicy for why the list could not do the
                // job it was written for.
                if ($error = EmailDomainPolicy::errorFor($email)) {
                    $validator->errors()->add('email', $error);
                } elseif (EmailDomainPolicy::aliasOfExistingAccount($email)) {
                    $validator->errors()->add('email', 'An account already exists for this mailbox. Try signing in, or use the password reset.');
                }
            }

            if ($request->has('social_handle') && filled($request->input('social_handle'))) {
                $platform = $request->input('social_platform', 'instagram');
                $handle = $request->input('social_handle');
                if ($socialError = SocialHandle::errorFor($platform, $handle)) {
                    $validator->errors()->add('social_handle', $socialError);
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
        /* =========================GOOGLE SIGN-UP========================== */
        // A Google sign-up posts this same form and passes every gate below it. The only
        // differences are handled here.
        //
        // 🚨 The email is taken from the SESSION, never from the request. The session copy was
        // written by `GoogleController` only after Google reported the address verified; the
        // request copy is whatever the browser sent. Trusting the request would let anyone with
        // a Google session POST somebody else's address and receive an account already marked
        // email-verified on it.
        // Fails closed: an entry with no readable `expires_at` is treated as expired, not as
        // "no deadline". Reading `! empty($entry['expires_at'])` as the outer condition let such
        // an entry skip the check entirely — which is exactly what an older deploy leaves behind.
        $google = $request->session()->get(GoogleController::SESSION_KEY);

        if ($google !== null && ! GoogleController::pendingIsValid($google)) {
            $request->session()->forget([GoogleController::SESSION_KEY, 'google_signup_utm']);
            $google = null;
        }

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

        /* =========================RISK ENGINE CHECK==========================
         *
         * Platform FREEZE stops new creator accounts being opened.
         *
         * ⚠️ This gate sits AFTER the Google block deliberately. A Google sign-up
         * posts no email — the verified address is merged in above — so gating
         * first meant we refused the person and had nothing to capture them with,
         * which is the entire failure this lead capture exists to close.
         *
         * 🚨 The refusal key is `signup_paused`, NOT `email`. `Register.jsx`
         * branches on it to render the waitlist panel instead of a field error,
         * and its owner-finder maps `email` back to the credentials step — so an
         * `email` key would bounce the person to a field they cannot fix.
         */
        $platformState = PlatformRiskState::latest('started_at')->first();
        if ($platformState && $platformState->state === 'FREEZE' && $request->role == 1) {
            // Never throws; a lead we failed to record costs one email, an
            // exception here costs the person their message.
            app(SignupLeadService::class)->capture(
                $request,
                (string) $request->input('email'),
                1,
                SignupLead::REASON_PLATFORM_FREEZE,
            );

            throw ValidationException::withMessages([
                'signup_paused' => RiskMessages::get(
                    'CREATOR_SIGNUP_PAUSED',
                    RiskMessages::AUDIENCE_CREATOR,
                )['body'],
            ]);
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
            // 🚨 Both badge fields were previously written STRAIGHT from the
            // request with no validation at all, into a column that
            // SeoTemplateService and AuthenticatedSessionController concatenate
            // into a public <meta name="keywords"> tag — so any string this form
            // was handed was published to every crawler. Checked against
            // App\Support\Badges here, and sanitised again below.
            'creator_category' => ['nullable', 'array', 'max:'.Badges::MAX_INTERESTS],
            'creator_category.*' => [Rule::in(Badges::interestSlugs())],
            'pride_badges' => ['nullable', 'array', 'max:'.Badges::MAX_PRIDE],
            'pride_badges.*' => [Rule::in(Badges::prideSlugs())],
            /*
             * 🚨 REQUIRED FOR A CREATOR (client decision, 25 Aug 2026), OPTIONAL FOR
             * NOBODY ELSE.
             *
             * This is not new friction, it is friction moved earlier: a creator ALREADY
             * cannot go live without an approved handle — `Profile/CreatorVerification.jsx`
             * locks "Submit for review" until socials, photo and bio are approved — so an
             * account with no social account was never able to sell anything. Asking here
             * means the social onboarding step is answered before they reach the
             * dashboard, and the Creator Studio form is prefilled from this row rather
             * than asking for the same handle twice.
             *
             * ⚠️ `Rule::requiredIf`, not `required_if:role,1` — `role` arrives as the
             * string '1' from the form and as an int from tests, and the string form of
             * the rule compares loosely enough that it is worth not depending on.
             *
             * ⚠️ A GIFTER is never asked: their form offers neither field, so these stay
             * optional for role 0 and a value there is ignored rather than refused.
             *
             * ⚠️ The handle itself is checked below rather than by a regex here: the rule
             * depends on WHICH platform was chosen, and the refusal has to say what to do
             * about it. `App\Support\SocialHandle` owns both.
             */
            'social_platform' => [
                Rule::requiredIf(fn () => (int) $request->role === 1),
                'nullable',
                Rule::in(SocialHandle::platforms()),
            ],
            'social_handle' => [
                Rule::requiredIf(fn () => (int) $request->role === 1),
                'nullable',
                'string',
                'max:255',
            ],
            'promo' => ['nullable', 'string'], // referral code
            'crm_invite_token' => ['nullable', 'string', 'max:255'],
            /*
             * 🚨 OPTIONAL, AND IT MUST STAY OPTIONAL (UK brief §1). Marketing
             * consent may never be a condition of creating an account, so this
             * is `nullable` and never `accepted` — unlike `creator_email_receipt_ack`
             * below it, which genuinely is required. The front end must also
             * keep it out of its submit gate; making it required in either place
             * turns an opt-in into a forced consent, which is worth nothing.
             */
            'marketing_opt_in' => ['nullable', 'boolean'],
        ], $messages);

        /* =========================CREATOR SOCIAL HANDLE========================== */
        // ⚠️ Refused HERE, before the account exists, so the creator can correct a typo
        // while the form is still in front of them. A handle rejected after the insert
        // would have to be silently dropped — which is how `users.country` came to be
        // NULL for every creator on the platform.
        //
        // A gifter posting these fields is IGNORED rather than refused: nothing on their
        // form offers them, so a value there is noise, not a mistake to explain.
        if ($request->role == 1 && filled($request->input('social_handle'))) {
            $socialError = SocialHandle::errorFor(
                $request->input('social_platform'),
                $request->input('social_handle'),
            );

            if ($socialError !== null) {
                throw ValidationException::withMessages(['social_handle' => $socialError]);
            }
        }

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
        // ⚠️ Both roles since 31 Aug 2026. Creators were never asked, so `users.country`
        // stayed NULL until Stripe Connect and every read of it before then (shipping
        // zones, the AE business-type check) got `undefined`.
        $request->validate([
            'country' => 'required|string',
        ]);

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

            // Solution A: Max accounts per IP limit (rolling 24-hour window)
            $ipCount = User::where('ip_address', $ip_address)
                ->where('created_at', '>=', now()->subHours(24))
                ->count();

            if ($ipCount >= 5) {
                throw ValidationException::withMessages([
                    'email' => 'Too many accounts have been created from this IP address recently. Please try again later.',
                ]);
            }
        }

        /* =========================EMAIL DOMAIN CHECK========================== */
        // Skipped on the Google path. The allowlist exists to keep unreachable and throwaway
        // addresses out; Google has already proved this one receives mail. Enforcing it there
        // would also reject every Google Workspace address — the list holds six domains — so the
        // button would refuse a large share of the people it is meant to let in.
        if (! $google) {
            if ($error = EmailDomainPolicy::errorFor($request->email)) {
                throw ValidationException::withMessages(['email' => $error]);
            }

            // 🚨 `jane@gmail.com`, `jane+1@gmail.com` and `j.a.ne@gmail.com` are
            // ONE mailbox. `unique:users,email` only catches the exact spelling,
            // so all three registered, all three passed the device and IP caps,
            // and all three received a verification link — the cheapest way to
            // mint accounts in bulk, and nothing to do with which domains are
            // permitted.
            if (EmailDomainPolicy::aliasOfExistingAccount($request->email)) {
                throw ValidationException::withMessages([
                    'email' => 'An account already exists for this mailbox. Try signing in, or use the password reset.',
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

        /*
         * The `promo` field carries TWO different things depending on who is
         * signing up: a creator's referral code (below), or a fan's promo code.
         * The fan half was validated by the register form and then discarded —
         * nothing on the server read it, so `users.promo_code_id` was written by
         * nobody and the admin panel's "who used this code" list
         * (`Admin\PromoCodeController::getPromoCodeUser`, which reads exactly that
         * column) was permanently empty. Re-checked here rather than trusted from
         * the form: the form's answer is minutes old and the last seat on a
         * limited code may have gone since.
         */
        $promoCode = null;
        if ($request->filled('promo') && (int) $request->role !== 1) {
            $promoCode = PromoCode::redeemable($request->promo)['code'];
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

        // Badges are a creator-only step, so a supporter posting either field
        // is discarded here rather than trusted — the picker is never rendered
        // for them and the column would be meaningless on a fan profile.
        $isCreator = (int) $request->role === 1;
        $creatorBadges = $isCreator
            ? Badges::sanitiseInterests($request->input('creator_category'))
            : [];
        $prideBadges = $isCreator
            ? Badges::sanitisePride($request->input('pride_badges'))
            : [];

        $user = User::create([
            'uuid' => Uuid::uuid4()->toString(),
            'name' => $request->name,
            'email' => $request->email,
            'username' => strtolower($request->username),
            'gender' => $request->gender ?? null,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            // Sanitised, never the raw request value: unknown slugs are dropped
            // rather than stored, and only a creator can carry badges at all.
            // Stored as JSON to match how the profile form has always written
            // this column. NULL, not '[]', so "never picked" stays distinct.
            'creator_category' => $creatorBadges !== []
                ? json_encode($creatorBadges)
                : null,
            'ip_address' => $ip_address,
            'country' => $request->country_code ?: $request->country,
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
            /*
             * Marketing consent, captured at signup with its proof (UK brief
             * §§1-2). Spread from MarketingConsent so the five columns can
             * never be written apart — a send permission with no timestamp,
             * source or wording version behind it is not evidence of consent.
             *
             * ⚠️ Written EXPLICITLY rather than left to the column default. The
             * default was flipped to false in the same change, but the default
             * is defence in depth: SQLite ignores that migration and the test
             * suite runs on SQLite, so the behaviour that matters is stated
             * here where it is actually testable.
             */
            ...MarketingConsent::attributesForSignup(
                $request->boolean('marketing_opt_in'),
                $request->role == 1 ? 'creator_signup' : 'gifter_signup',
            ),
        ]);

        // The append-only half of the proof. The users row is overwritten every
        // time somebody changes their mind; this log is what can still show the
        // original opt-in after that. Only written when consent was actually
        // given — an untouched checkbox is not an event.
        if ($request->boolean('marketing_opt_in')) {
            EmailPreferenceController::logPreferenceChange(
                $user->id,
                false,
                true,
                $request->role == 1 ? 'creator_signup' : 'gifter_signup',
            );
        }

        // Which paid-ads landing page earned this signup, on the same first-touch
        // rule as the source above.
        //
        // ⚠️ The cookie is visitor-supplied, so the value is only stored when it
        // is one of the six known page types — otherwise anyone could write an
        // arbitrary string into this column by setting a cookie, and the admin
        // report would be reading whatever they typed.
        //
        // ⚠️ Written with forceFill for the same reason as the block below: the
        // column is deliberately not in `$fillable`, so a mass assignment would
        // be dropped in silence.
        $adLanding = $request->cookie(VisitTracker::LANDING_COOKIE);

        if (VisitTracker::isAdLanding($adLanding)) {
            $user->forceFill(['signup_landing_page' => $adLanding]);
        }

        // ⚠️ Set AFTER create, not inside it. These columns are not in the model's
        // `$fillable`, so passing them to `User::create()` is silently dropped.
        // We use forceFill to bypass the fillable guard.
        $user->forceFill([
            'tfa_key' => $secret,
            'cover' => $assignedCover,
            'cover_approved' => 1,
            // 🚨 Pride badges are special-category data and are deliberately NOT
            // in `$fillable` — so a stray `update($request->all())` anywhere on
            // the platform can never set them. Written here after validation
            // against App\Support\Badges. NULL when nothing was picked, so
            // "declined to say" and "picked none" are not stored differently.
            'pride_badges' => $prideBadges !== []
                ? json_encode($prideBadges)
                : null,
            // 🚨 THE REDEMPTION RECORD. Nothing wrote this column before 24 Aug
            // 2026, so `limit` could not be counted against anything and the
            // admin panel's "who used this code" list — which reads exactly this
            // via `PromoCode::users()` — was empty for every code ever created.
            // Resolved server-side from the code, never taken as an id from the
            // request: this is not in `$fillable` precisely so a posted
            // `promo_code_id` cannot attribute somebody to a code they never
            // typed.
            'promo_code_id' => $promoCode?->id,
        ]);

        // A waiting lead who has now got in must be CLOSED, or the notify sweep
        // emails "you can sign up now" to somebody who already did.
        //
        // ⚠️ AFTER the row exists, never before. Closing first and then losing the
        // insert — a username taken in the race, a constraint — would leave the
        // person with no account AND a lead marked converted, so they could never
        // be told when sign-ups reopened.
        app(SignupLeadService::class)->close((string) $user->email);

        if ($google) {
            // Google has already proved the address receives mail, so asking the person to
            // click a link in it proves nothing twice.
            $user->forceFill([
                'email_verified_at' => now(),
                'google_id' => $google['google_id'] ?? null,
            ]);
        }

        $user->save();

        /* =========================CREATOR SOCIAL HANDLE========================== */
        /*
         * 🚨 THIS IS THE SOCIAL ONBOARDING STEP, DONE AT SIGNUP — NOT A SEPARATE
         * CONTACT FIELD.
         *
         * `Profile/CreatorVerification.jsx` carries a real step ("Add a social handle")
         * and locks "Submit for review" until the handles, photo and bio are APPROVED.
         * Writing this row the way `SocialLinksController` writes it means the creator
         * gives their handle ONCE: the step is already ticked, the row is already in the
         * admin review queue, and there is nothing to go back and re-enter.
         *
         * It also closes the reachability gap it was originally built for — the platform
         * holds a creator's e-mail and nothing else, so a creator who stalls has no other
         * contact route. Measured 25 Aug 2026: 3 of the 33 creators who signed up in the
         * previous 90 days had a handle on file.
         *
         * ⚠️ `source = 'signup'` is PROVENANCE ONLY and changes no behaviour. It tells a
         * reviewer the handle was typed on the registration form — one platform, entered
         * in seconds — which is worth knowing when judging it. It does NOT exclude the row
         * from anything.
         *
         * ⚠️ Nothing here may throw. The account already exists and the person is one line
         * from being logged in; failing a signup over this would turn an optional field
         * into the thing that broke registration. Same house pattern as VisitTracker and
         * AttributionService.
         */
        $socialHandleStored = false;

        if ((int) $user->role === 1) {
            try {
                $platform = $request->input('social_platform');
                $handle = SocialHandle::normalise($platform, $request->input('social_handle'));

                if ($handle !== null) {
                    SocialLinks::create([
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $user->id,
                        'source' => 'signup',
                        // 0 = awaiting review, exactly as a Creator Studio submission
                        // lands. It is not published until an admin approves it.
                        'status' => 0,
                        $platform => $handle,
                    ]);

                    $socialHandleStored = true;
                }
            } catch (\Throwable $e) {
                Log::warning('Signup social handle not stored', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

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
            $verification = [
                'user_id' => $user->id,
                'role' => 1,
                'bio_status' => 1,
                'address_status' => 0,
            ];

            // ⚠️ Set to the same 0 (awaiting review) that `SocialLinksController`
            // writes, so a signup handle and a Creator Studio submission leave the
            // account in an identical state.
            //
            // ⚠️ Still CONDITIONAL even though the field is required. The write is
            // wrapped in a catch that must never fail a signup, so "the row was
            // written" and "the form was filled in" are not the same fact — and a
            // `social_status` claiming a submission that was not stored would show the
            // creator a step ticked with nothing behind it.
            if ($socialHandleStored) {
                $verification['social_status'] = 0;
            }

            UserVerificationStatus::create($verification);
        }

        if ($request->role == 0) {
            // Country only. The rest of the row is filled by the gifter themselves at
            // the £500 card-verification gate (`saveVerificationAddress`), which is
            // also the only place it is ever read.
            //
            // ⚠️ This comment used to say `successCheckout` filled the rest from
            // Stripe on the first purchase. It never did — no checkout on this
            // platform has ever written these columns, and none of the seven asks
            // Stripe for a billing address in the first place. From the day signup
            // stopped collecting one, every new gifter's address stayed NULL and the
            // admin's £500 match report had nothing on its own side to compare, which
            // made approving a gifter a rubber stamp. Verify before repeating it.
            //
            // ⚠️ The ISO CODE, not the label. The form posts both (`country` is the
            // display name, `country_code` the ISO code) and this wrote the label —
            // so the column held "United Kingdom" until the first purchase replaced
            // it with Stripe's "GB", and the same column meant two different things
            // depending on how far through the funnel someone got.
            GifterAddress::create([
                'user_id' => $user->id,
                'country' => $request->country_code ?: $request->country,
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

        // 🚨 Registration sends the verification link. It used to be dispatched
        // ONLY from a mount effect on the verification page, so anything that
        // stopped that page's JavaScript running — a blocked script, a failed
        // XHR, closing the tab during the redirect — meant the account was
        // created and no verification email ever went out. A Google signup
        // arrives already verified and needs none.
        if (! $user->email_verified_at) {
            EmailVerificationNotificationController::dispatchLink($user);
        }

        // The verified profile has been spent. Leaving it in the session would let a second POST
        // to /register create another account carrying the same Google-verified email flag.
        $request->session()->forget([GoogleController::SESSION_KEY, 'google_signup_utm']);

        // GA4 funnel — stage 1 of the creator funnel and of the supporter funnel.
        // `method` separates Google signups from the form, which is the only
        // acquisition split GA4 cannot infer from the referrer.
        AnalyticsEvent::push('sign_up', [
            'method' => ! empty($google) ? 'google' : 'email',
            'role' => (int) $user->role === 1 ? 'creator' : 'supporter',
        ]);

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
        // ⚠️ Mirrors the rule `store()` actually enforces. `alpha_num` here rejected
        // full stops and underscores, which registration allows — so a handle like
        // `jane.doe` came back as a validation error from the availability check
        // even though it was perfectly registrable.
        $request->validate([
            'username' => [
                'required',
                'string',
                'lowercase',
                'regex:/^[a-zA-Z0-9_\.]+$/',
                'not_regex:/@/',
                'min:5',
                'max:20',
            ],
        ]);
        $exist = User::withTrashed()->whereUsername(strtolower($request->username))->first();

        return response()->json([
            'available' => empty($exist),
        ]);
    }

    public function checkCouponCode($code)
    {
        // ⚠️ This used `! empty($collection)`, and an Eloquent Collection is an
        // OBJECT — always truthy, empty or not — so every code ever typed came back
        // "available", including ones that do not exist. The key was `message` while
        // the register form reads `msg`, so the text never rendered either.
        //
        // ⚠️ It then only asked whether the ROW EXISTED. `limit`, `start_date` and
        // `end_date` were all ignored, so a code that expired two years ago still
        // answered "Code applied.". `PromoCode::redeemable()` is the one rule, and
        // `store()` below calls the same method — if this screen and the signup
        // disagreed, a fan would be told the code applied and then be registered
        // without it.
        $result = PromoCode::redeemable($code);
        $message = $result['code'] ? 'Code applied.' : $result['reason'];

        return response()->json([
            'status' => (bool) $result['code'],
            'msg' => $message,
            'message' => $message,
        ]);
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

        // 🚨 No address, no charge.
        //
        // The whole point of this £1 charge is that Stripe hands back the address
        // the gifter types into Checkout, which an admin then compares against the
        // one they gave US. With nothing on our side every field reads `unknown`,
        // the mismatch count is always 0, and the review an admin performs before
        // letting somebody spend past £500 is a rubber stamp.
        //
        // Enforced HERE and not only in the form, because the button is one
        // `axios.get` away for anyone who opens a console.
        if (! ($user->gifterAddress?->isComplete() ?? false)) {
            return response()->json([
                'status' => false,
                'error' => 'Please add your billing address before verifying your card.',
                'needs_address' => true,
            ], 422);
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

        // 🚨 The SAME call the screen quotes from, so the figure on the button and
        // the figure on the card are one number by construction. They used to be two:
        // the page said "a one-time verification fee of £1" and this charged the
        // grossed-up £2.95.
        $quote = GifterVerificationCharge::quote($currency);
        $finalUnitAmount = $quote['minor'];

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
     * The gifter's own billing address, typed once at the £500 gate.
     *
     * Kept apart from `stripe_address` on purpose: that one is what they type into
     * Stripe Checkout moments later, and the admin review is only worth running
     * because the two are entered independently. Merge them and the check becomes
     * a copy of itself.
     */
    public function saveVerificationAddress(Request $request)
    {
        $user = Auth::user();

        if (! ($user instanceof User) || (int) $user->role !== 0) {
            return response()->json([
                'status' => false,
                'error' => 'Unauthorized.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'street_address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            // ⚠️ Deliberately optional. Many countries have no state and some have no
            // postcode; this is the gate that unblocks a gifter's spending, so a field
            // they cannot fill must never be able to trap them behind it. The admin
            // comparison reads a blank as `unknown`, never as a mismatch.
            'state' => ['nullable', 'string', 'max:120'],
            'postal_code' => ['nullable', 'string', 'max:32'],
            // 🚨 The ISO code, never the display label. `gifter_addresses.country` is
            // compared against Stripe's ISO code, and the signup form once wrote
            // "United Kingdom" here — which put "India" against "IN" and flagged every
            // gifter in the admin queue, a red chip on all of them being the same as
            // no signal at all.
            'country' => ['required', 'string', 'regex:/^[A-Za-z]{2}$/'],
        ], [
            'country.regex' => 'Please choose your country from the list.',
        ]);

        // ⚠️ NO `min:20` on the street. The signup form it replaces had exactly that,
        // and it refused a genuine short address — "12 High St" is eleven characters.
        if ($validator->fails()) {
            return response()->json([
                'status' => false,
                'error' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $data = $validator->validated();

        // `firstOrNew`, not `updateOrCreate`: signup creates this row with `country`
        // only, but a gifter whose role changed — or any legacy account — may have no
        // row at all, and failing at the gate with "address not found" gives them
        // nothing to do about it.
        $address = GifterAddress::firstOrNew(['user_id' => $user->id]);

        $address->fill([
            'street_address' => trim($data['street_address']),
            'city' => trim($data['city']),
            'state' => filled($data['state'] ?? null) ? trim($data['state']) : null,
            'postal_code' => filled($data['postal_code'] ?? null) ? trim($data['postal_code']) : null,
            'country' => strtoupper($data['country']),
        ]);

        // ⚠️ `stripe_address` is never touched here. It is the second, independent
        // record and belongs to `cardVerificationSuccess`.
        $address->save();

        return response()->json([
            'status' => true,
            'address' => $address->toFormArray(),
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

        // 🚨 Same IDOR guard as `cardVerificationSuccess`, which had one while this
        // did not. A uuid is a public identifier — it travels in profile payloads and
        // item URLs all over this platform — so without this any signed-in account
        // could flip another gifter's latest verification to `failed` by visiting
        // their uuid. The victim, who may have paid minutes earlier and be waiting on
        // an admin, is then shown "Payment Failed or Canceled" about a charge that
        // succeeded.
        if (! Auth::check() || (int) $user->id !== (int) Auth::id()) {
            abort(403);
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
