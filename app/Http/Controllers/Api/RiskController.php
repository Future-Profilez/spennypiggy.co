<?php

namespace App\Http\Controllers\Api;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Models\ConfirmationLog;
use App\Models\Currency;
use App\Models\Payment;
use App\Models\RiskIdentity;
use App\Models\User;
use App\Services\Risk\EffectiveLimitsService;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\ReservePolicy;
use App\Services\Risk\RiskEngineService;
use App\Services\Risk\RiskIdentityService;
use App\Services\Risk\RiskService;
use App\Services\Risk\VerificationService;
use App\StripeControl;
use App\Support\RiskMessages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Laragear\WebAuthn\Http\Requests\AssertedRequest;
use Laragear\WebAuthn\Models\WebAuthnCredential;

class RiskController extends Controller
{
    protected $riskEngine;

    protected $verificationService;

    public function __construct(RiskEngineService $riskEngine, VerificationService $verificationService)
    {
        $this->riskEngine = $riskEngine;
        $this->verificationService = $verificationService;
    }

    /**
     * POST /risk/step-up/verify
     * Verify OTP and proceed with payment intent creation if successful.
     */
    public function verifyStepUpPasskey(AssertedRequest $request)
    {
        $validator = Validator::make($request->all(), [
            'amount' => 'required|integer',
            'creator_id' => 'required|string',
            'email' => 'nullable|email',
            'risk_identity_id' => 'nullable',
            'card_fingerprint' => 'nullable|string',
            'device_id' => 'nullable|string',
            'currency' => 'required|string|size:3',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 422);
        }

        $user = $request->login();

        if (! $user) {
            return response()->json(['error' => 'Passkey verification failed. Device may not be registered.'], 400);
        }

        // Check if user is suspended
        if ($user->suspended_account == 1) {
            auth()->guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['error' => 'Your account is suspended due to a policy violation or payout configuration issue. Please contact support.'], 403);
        }

        // Prevent cross-account verification bypass: verify checkout email matches passkey owner email
        if ($request->filled('email') && strtolower($user->email) !== strtolower($request->email)) {
            auth()->guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return response()->json(['error' => 'Passkey email does not match the checkout email.'], 400);
        }

        // Update credential last used
        $credentialId = $request->input('id');
        $credential = WebAuthnCredential::where('credential_id', $credentialId)
            ->orWhere('id', $credentialId)->first();

        if ($credential) {
            $credential->update([
                'last_used_at' => now(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);
        }

        $context = $this->buildContext($request);

        // 1. Resolve Identity
        if ($request->filled('risk_identity_id')) {

            $identity = RiskIdentity::find(
                $request->risk_identity_id
            );
        } else {

            $identityService = app(
                RiskIdentityService::class
            );

            $identity = $identityService->resolveIdentity(
                $context
            );
        }

        if (! $identity) {

            return response()->json([
                'success' => false,
                'error' => 'Verification session expired.',
            ], 400);
        }

        // 2. Bypass OTP by creating a log
        $log = ConfirmationLog::create([
            'payment_id' => null,
            'risk_identity_id' => $identity->id,
            'ip_hash' => $identity->ip_hash,
            'device_id_hash' => $identity->device_id_hash,
            'otp_verified' => true,
            'typed_confirmation' => 'PASSKEY_VERIFIED',
            'spend_snapshot' => $identity->rollup ? $identity->rollup->toArray() : [],
        ]);

        return $this->processVerifiedStepUp($request, $context, $identity, $log);
    }

    public function verifyStepUp(Request $request)
    {
        $request->validate([
            'otp' => 'required|string',
            'typed_confirmation' => 'required|string', // "I confirm..."
            // Context to resolve identity again
            'amount' => 'required|integer',
            'creator_id' => 'required|string',
            'email' => 'nullable|email',
            'risk_identity_id' => 'nullable',
            'card_fingerprint' => 'nullable|string',
            'device_id' => 'nullable|string',
            'currency' => 'required|string|size:3',
        ]);

        $context = $this->buildContext($request);

        // 1. Resolve Identity
        if ($request->filled('risk_identity_id')) {
            $riskIdentityId = $request->risk_identity_id;
            $identity = RiskIdentity::find($riskIdentityId);
            if (! $identity) {
                return response()->json(['error' => 'Session expired. Please request a new verification code.'], 400);
            }
        } else {
            $identityService = app(RiskIdentityService::class);
            $identity = $identityService->resolveIdentity($context);
        }

        // 2. Verify OTP
        $otpResult = $this->verificationService->verifyOtp(
            $identity,
            $request->otp,
            $request->typed_confirmation
        );

        if (! ($otpResult['ok'] ?? false)) {
            return response()->json(['error' => $otpResult['error'] ?? 'OTP verification failed.'], 400);
        }

        $log = $otpResult['log'];

        return $this->processVerifiedStepUp($request, $context, $identity, $log);
    }

    public function resendStepUpOtp(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer',
            'creator_id' => 'required|string',
            'email' => 'nullable|email',
            'risk_identity_id' => 'nullable',
            'card_fingerprint' => 'nullable|string',
            'device_id' => 'nullable|string',
            'currency' => 'required|string|size:3',
        ]);

        try {

            $context = $this->buildContext($request);

            // Resolve Identity
            if ($request->filled('risk_identity_id')) {

                $riskIdentityId = $request->risk_identity_id;

                $identity = RiskIdentity::find(
                    $riskIdentityId
                );

                if (! $identity) {

                    return response()->json([
                        'success' => false,
                        'error' => 'Session expired. Please request a new verification code.',
                    ], 400);
                }
            } else {

                $identityService = app(
                    RiskIdentityService::class
                );

                $identity = $identityService->resolveIdentity(
                    $context
                );
            }

            // Generate & Send OTP using existing service
            $otpSent = $this->verificationService
                ->sendOtp(
                    $identity,
                    [
                        'email' => $request->email,
                        'amount' => $request->amount,
                        'currency' => $request->currency,
                    ]
                );

            if (! $otpSent) {

                return response()->json([
                    'success' => false,
                    'error' => 'Failed to resend OTP.',
                ], 400);
            }

            return response()->json([
                'success' => true,
                'message' => 'OTP resent successfully.',
                'risk_identity_id' => $identity->id,
            ]);
        } catch (\Exception $e) {

            Log::error(
                'Resend Step-Up OTP Error: '.
                    $e->getMessage()
            );

            return response()->json([
                'success' => false,
                'error' => 'Failed to resend OTP.',
            ], 500);
        }
    }

    protected function processVerifiedStepUp($request, $context, $identity, $log)
    {
        // 3. Re-evaluate Risk (to get reason codes like MARK_REVIEW_HOLD)
        $riskResult = $this->riskEngine->evaluate($context);
        $reasons = $riskResult['reason_codes'];

        // Remove STEP_UP related reasons since we just verified it
        $reasons = array_filter($reasons, function ($reason) {
            return ! in_array($reason, ['HIGH_VALUE_TX', 'FORCE_3DS', 'ACCELERATION_3_IN_10M', 'HIGH_VALUE_VELOCITY_2H']);
        });
        $reasons[] = 'STEP_UP_VERIFIED';
        $reasons = array_values($reasons);

        $decision = 'ALLOW';
        if (in_array('MARK_REVIEW_HOLD', $reasons)) {
            $decision = 'REVIEW_HOLD';
        }

        // If the request came from a checkout session flow
        if ($request->has('is_checkout_session') && $request->is_checkout_session) {
            // Mark the session as verified so the next call to createCheckout bypasses STEP_UP
            session(['step_up_verified_log_id' => $log->id]);

            return response()->json([
                'success' => true,
                'message' => 'Step-Up verified successfully. Please proceed with checkout.',
            ]);
        }

        // Create Payment Record (for Payment Intent flow)
        $amountGbp = app(MoneyNormalizer::class)->toGbpMinor((int) $request->amount, (string) $request->currency);

        // Estimate Net Amount (approx 85% of gross to avoid over-calculating reserve before webhook sync)
        // Webhook will backfill the exact net-based reserve once Stripe fees are known.
        $estimatedNetGbp = (int) round($amountGbp * 0.85);

        $riskService = app(RiskService::class);
        $metrics = $riskService->recalculateMetrics((string) $request->creator_id);
        $creator = User::where('uuid', $request->creator_id)->first();
        $reservePercent = $creator
            ? app(ReservePolicy::class)->getEffectiveReservePercent($creator, $metrics, now())
            : (int) ($metrics->reserve_percent ?? 0);
        $reserveGbp = $reservePercent > 0 ? (int) round(($estimatedNetGbp * $reservePercent) / 100) : 0;

        $payment = Payment::create([
            'creator_id' => $request->creator_id,
            'risk_identity_id' => $identity->id,
            'amount' => $amountGbp,
            'reserve_amount_minor' => $reserveGbp,
            'platform_holds_funds' => true,
            'currency' => 'gbp',
            'status' => ($decision === 'REVIEW_HOLD') ? 'review_hold' : 'initiated',
            'reason_codes' => $reasons,
            'confirmation_log_id' => $log->id,
        ]);

        // Call Stripe — funds stay on platform; weekly payout engine transfers net amounts
        try {
            $creator = User::where('uuid', $request->creator_id)->first();
            if (! $creator) {
                return response()->json(['error' => 'Creator not found'], 404);
            }

            $stripePayload = [
                'amount' => $request->amount,
                'currency' => $request->currency,
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'payment_id' => $payment->id,
                    'risk_identity_id' => $identity->id,
                    'creator_id' => $request->creator_id,
                    'step_up_verified' => 'true',
                    'platform_holds_funds' => 'true',
                ],
            ];

            $pi = StripeControl::createPaymentIntent($stripePayload, null, false, $creator->username);

            $payment->update([
                'stripe_payment_intent_id' => $pi->id,
                'status' => ($decision === 'REVIEW_HOLD') ? 'review_hold' : 'initiated',
            ]);

            $log->update(['payment_id' => $payment->id]);

            return response()->json([
                'client_secret' => $pi->client_secret,
                'payment_id' => $payment->id,
                'decision' => $decision,
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe PI Creation Failed after Step-Up: '.$e->getMessage());
            $payment->update(['status' => 'failed']);

            return response()->json(['error' => 'Payment processing failed'], 500);
        }
    }

    /**
     * GET /risk/limits
     * Get effective limits for current user/context
     */
    public function getEffectiveLimits(Request $request)
    {
        // We need identity context to give accurate limits (e.g. Tier 1)
        // If guest, use IP/Fingerprint from request if provided, or default guest limits.

        $context = $this->buildContext($request);
        $identityService = app(RiskIdentityService::class);
        $identity = $identityService->resolveIdentity($context);

        $limitsService = app(EffectiveLimitsService::class);
        $limits = $limitsService->getEffectiveLimits($identity);

        // 🚨 A GUEST IS TOLD NOTHING BUT WHETHER THEY MAY CHECK OUT.
        //
        // This route is unauthenticated, so the full array — max_spend_1h,
        // max_spend_24h, max_spend_7d, step_up_threshold, review_hold_threshold,
        // cooldown_minutes — was a public readout of every threshold on the
        // platform. Combined with guest identity being keyed to card
        // fingerprint, device and IP, that is exactly the "live readout of how
        // much headroom is left" the messaging brief forbids: someone testing
        // stolen cards could read the line and stay just under it.
        //
        // A signed-in supporter still gets their own limits — they are shown
        // them on /history by design, and they are that person's own terms.
        // The only field the frontend reads for a guest is `guest_allowed`
        // (Tasks/Show.jsx, cart/SubCheckout.jsx, cart/UserCarts.jsx), so
        // narrowing this costs no behaviour.
        if (! $request->user()) {
            return response()->json([
                'guest_allowed' => (bool) ($limits['guest_allowed'] ?? true),
            ]);
        }

        return response()->json($limits);
    }

    /**
     * POST /risk/evaluate
     * Evaluate risk for a payment context.
     */
    public function evaluate(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer',
            'creator_id' => 'required|string',
            'email' => 'nullable|email',
            'card_fingerprint' => 'nullable|string',
            'device_id' => 'nullable|string',
        ]);

        $context = $this->buildContext($request);

        $result = $this->riskEngine->evaluate($context);

        return response()->json($result);
    }

    /**
     * POST /payments/create-intent
     * Create a Stripe PaymentIntent securely via Risk Engine.
     */
    public function createPaymentIntent(Request $request)
    {
        $request->validate([
            'amount' => 'required|integer', // minor units
            'currency' => 'required|string|size:3',
            'creator_id' => 'required|string',
            'payment_method_id' => 'nullable|string', // Optional if using PI for later confirmation
            'email' => 'nullable|email',
            'card_fingerprint' => 'nullable|string', // From frontend if available via Stripe.js
            'device_id' => 'nullable|string', // From fingerprinting lib
        ]);

        $currency = strtoupper($request->currency);
        $currencyModel = Currency::where('ISO', $currency)->first();
        $divisor = ($currencyModel && ($currencyModel->ISOdigits ?? 2) == 0) ? 1 : 100;
        $amountMajor = ((float) $request->amount) / $divisor;

        $guestRestriction = ! $request->user() ? Helpers::guestCheckoutRestriction($currency, $amountMajor) : null;
        if ($guestRestriction) {
            return response()->json([
                'error' => $guestRestriction['message'],
                'requires_login' => true,
                'reason_code' => $guestRestriction['code'],
                'ui' => $guestRestriction['ui'] ?? null,
            ], 401);
        }

        // 1. Evaluate Risk
        $context = $this->buildContext($request);
        $riskResult = $this->riskEngine->evaluate($context);

        $decision = $riskResult['decision'];
        $reasons = $riskResult['reason_codes'];

        if (is_array($reasons) && in_array('MARK_REVIEW_HOLD', $reasons, true) && $decision === 'ALLOW') {
            $decision = 'REVIEW_HOLD';
        }

        // 2. Handle Decisions
        if (in_array($decision, ['BLOCK', 'COOLDOWN'])) {
            // ⚠️ `error` is read straight onto the screen by older callers, so
            // it must be the customer-facing copy — never "Payment blocked by
            // risk engine.", which names the internal system, implies
            // wrongdoing and offers no next step.
            $ui = $riskResult['ui'] ?: RiskMessages::get(
                'GENERIC_HOLD',
                RiskMessages::audienceFor($context['is_guest'] ?? null)
            );

            return response()->json([
                'error' => $ui['body'],
                'decision' => $decision,
                'ui' => $ui,
            ], 403);
        }

        if ($decision === 'STEP_UP') {
            // Return Step-Up requirement
            // Client should show OTP modal, then call /risk/step-up/verify
            return response()->json([
                'requires_action' => true,
                'action_type' => 'STEP_UP',
                'decision' => $decision,
                'ui' => $riskResult['ui'],
                // Don't create PI yet? Or create PI but requires confirmation?
                // Spec says: "Only proceed to Stripe if OTP is verified." for Rule 6.
                // So we return here.
            ]);
        }

        // 3. Create Payment Record (Initiated)
        // Resolve Identity ID again (or modify evaluate to return identity object/id)
        // For now, re-resolve or trust context. Ideally evaluate returns identity ID.
        // Let's assume evaluate returns just the array.
        // We need identity ID to store in payments table.
        // I should update evaluate to return identity_id in metadata or separate field.
        // For now, I'll re-resolve (it's fast/idempotent).
        $identityService = app(RiskIdentityService::class);
        $identity = $identityService->resolveIdentity($context);

        $amountGbp = app(MoneyNormalizer::class)->toGbpMinor((int) $request->amount, (string) $request->currency);

        // Estimate Net Amount (approx 85% of gross to avoid over-calculating reserve before webhook sync)
        // Webhook will backfill the exact net-based reserve once Stripe fees are known.
        $estimatedNetGbp = (int) round($amountGbp * 0.85);

        $riskService = app(RiskService::class);
        $metrics = $riskService->recalculateMetrics((string) $request->creator_id);
        $creator = User::where('uuid', $request->creator_id)->first();
        $reservePercent = $creator
            ? app(ReservePolicy::class)->getEffectiveReservePercent($creator, $metrics, now())
            : (int) ($metrics->reserve_percent ?? 0);
        $reserveGbp = $reservePercent > 0 ? (int) round(($estimatedNetGbp * $reservePercent) / 100) : 0;

        $payment = Payment::create([
            'creator_id' => $request->creator_id,
            'risk_identity_id' => $identity->id,
            'amount' => $amountGbp,
            'reserve_amount_minor' => $reserveGbp,
            'platform_holds_funds' => true,
            'currency' => 'gbp',
            'status' => ($decision === 'REVIEW_HOLD') ? 'review_hold' : 'initiated',
            'reason_codes' => $reasons,
        ]);

        // 4. Call Stripe — funds stay on platform; weekly payout engine transfers net amounts
        try {
            $force3ds = in_array('FORCE_3DS', $reasons);

            $stripePayload = [
                'amount' => $request->amount,
                'currency' => $request->currency,
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'payment_id' => $payment->id,
                    'risk_identity_id' => $identity->id,
                    'creator_id' => $request->creator_id,
                    'platform_holds_funds' => 'true',
                ],
            ];

            if ($force3ds) {
                $stripePayload['payment_method_options'] = [
                    'card' => ['request_three_d_secure' => 'any'],
                ];
            }

            $creator = User::where('uuid', $request->creator_id)->first();
            if (! $creator) {
                return response()->json(['error' => 'Creator not found'], 404);
            }

            $pi = StripeControl::createPaymentIntent($stripePayload, null, $force3ds, $creator->username);

            // 5. Update Payment Record
            $payment->update([
                'stripe_payment_intent_id' => $pi->id,
                'status' => ($decision === 'REVIEW_HOLD') ? 'review_hold' : 'initiated',
            ]);

            return response()->json([
                'client_secret' => $pi->client_secret,
                'payment_id' => $payment->id,
                'decision' => $decision, // ALLOW or REVIEW_HOLD
            ]);
        } catch (\Exception $e) {
            Log::error('Stripe PI Creation Failed: '.$e->getMessage());
            $payment->update(['status' => 'failed']);

            return response()->json(['error' => 'Payment processing failed'], 500);
        }
    }

    private function buildContext(Request $request)
    {
        return [
            'amount' => $request->amount,
            'currency' => $request->currency ?? 'gbp',
            'creator_id' => $request->creator_id,
            'email' => $request->user() ? $request->user()->email : $request->email,
            'ip' => $request->ip(),
            'device_id' => $request->device_id, // Header or body
            'card_fingerprint' => $request->card_fingerprint,
            'is_guest' => ! $request->user(),
        ];
    }
}
