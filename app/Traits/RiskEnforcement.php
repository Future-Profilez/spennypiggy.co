<?php

namespace App\Traits;

use App\Helpers;
use App\Models\Payment;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\RiskEngineService;
use App\Services\Risk\RiskIdentityService;
use App\Services\Risk\RiskService;
use App\Services\Risk\VerificationService;
use App\Support\BlockedPaymentNotice;
use App\Support\RiskMessages;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

trait RiskEnforcement
{
    /**
     * Enforce all risk checks for a payment flow.
     * Includes Turnstile, Guest Limits, Risk Engine evaluation, and Step-Up handling.
     * Returns either a redirect/JSON response (if blocked/step-up) or an array with risk data.
     */
    protected function enforceRiskChecks(
        Request $request,
        $creator,
        float $totalAmountWithFees,
        string $currency,
        string $paymentType,
        bool $isJsonResponse = false
    ) {
        // 1. Turnstile Captcha Check
        // if (method_exists($this, 'ensureTurnstileVerified')) {
        //     try {
        //         $this->ensureTurnstileVerified($request);
        //     } catch (\Illuminate\Validation\ValidationException $e) {
        //         // Get the exact error message from the validation bag (e.g. "Please verify you are not a robot.")
        //         $errors = $e->validator->errors()->all();
        //         $msg = !empty($errors) ? $errors[0] : 'Captcha verification failed. Please try again.';

        //         if ($isJsonResponse) {
        //             return response()->json([
        //                 'status' => false,
        //                 'message' => $msg,
        //                 'msg' => $msg
        //             ]);
        //         }
        //         return redirect()->back()->with('error', $msg);
        //     }
        // }

        // 2. Guest Checkout Restriction
        $guestRestriction = Helpers::guestCheckoutRestriction(
            $currency,
            $totalAmountWithFees
        );

        if ($guestRestriction) {
            // Copy comes from RiskMessages, never from the check itself — the
            // same refusal is raised from several places and used to be worded
            // three different ways.
            $ui = RiskMessages::get('GUEST_ACCOUNT_REQUIRED', RiskMessages::AUDIENCE_GUEST);

            if ($isJsonResponse) {
                return response()->json([
                    'status' => false,
                    'code' => 'AUTH_REQUIRED',
                    'reason_code' => $guestRestriction['code'],
                    'message' => 'Login required',
                    // `msg` is what the older checkout screens render; `ui` is
                    // what the shared RiskMessage component renders. Both carry
                    // the same wording so a half-migrated screen cannot drift.
                    'msg' => $ui['body'],
                    'ui' => $ui,
                ]);
            }

            return to_route('login', [
                'redirect' => $request->fullUrl(),
                'message' => $ui['body'],
            ]);
        }

        // 3. Risk Engine Context
        $context = [
            // ⚠️ Minor units. A zero-decimal currency (JPY, KRW…) has no minor
            // unit, so multiplying by 100 inflated the amount a hundredfold and
            // put every such payment over the spend caps.
            'amount' => (int) round($totalAmountWithFees * (Helpers::isZeroDecimalCurrency($currency) ? 1 : 100)),
            'currency' => strtoupper($currency),
            'creator_id' => $creator->uuid,
            'email' => Auth::user()->email ?? $request->query('email') ?? $request->input('email'),
            'ip' => $request->ip(),
            'device_id' => $request->input('device_id') ?? $request->query('device_id') ?? session()->getId(),
            'is_guest' => ! Auth::check(),
        ];

        // 4. Evaluate Risk
        $riskResult = app(RiskEngineService::class)->evaluate($context);
        $decision = $riskResult['decision'] ?? 'ALLOW';

        // Bypass STEP_UP if emulated by admin
        if ($decision === 'STEP_UP' && session()->get('emulated_by_admin')) {
            Log::info('Bypassing STEP_UP for payment because user is being emulated by admin.');
            $decision = 'ALLOW';
        }

        // 5. Handle BLOCK / COOLDOWN
        if (in_array($decision, ['BLOCK', 'COOLDOWN'], true)) {
            // The engine already resolved the audience-correct copy. The
            // fallback is RiskMessages' own generic state, NOT a bare string —
            // the old fallback ("Payment blocked for security reasons.") broke
            // all three of the brief's rules at once: it named the rule, it
            // implied wrongdoing, and it gave no next step.
            $ui = $riskResult['ui'] ?: RiskMessages::get(
                'GENERIC_HOLD',
                RiskMessages::audienceFor($context['is_guest'])
            );

            // On-screen only left anyone who navigated away with nothing at all,
            // and a guest with no account to come back to. Send-once per address
            // per day, and never throws — see BlockedPaymentNotice.
            BlockedPaymentNotice::send($ui, $context['email'] ?? null, Auth::user());

            if ($isJsonResponse) {
                return response()->json([
                    'status' => false,
                    'message' => $ui['body'],
                    'msg' => $ui['body'],
                    'decision' => $decision,
                    'reason_codes' => $riskResult['reason_codes'] ?? [],
                    'ui' => $ui,
                ]);
            }

            return redirect()->back()
                ->with('error', $ui['body'])
                ->with('risk_message', $ui);
        }

        // 6. Handle STEP_UP
        if ($decision === 'STEP_UP') {
            if (session()->has('step_up_verified_log_id')) {
                // Verified in this session, consume it and proceed
                session()->forget('step_up_verified_log_id');
                Log::info("Bypassing STEP_UP due to verified log for $paymentType");
            } else {
                // Not verified, initiate OTP
                try {
                    $identity = app(RiskIdentityService::class)->resolveIdentity($context);
                    $sent = app(VerificationService::class)->sendOtp($identity, $context);

                    if (! $sent) {
                        // A guest's step-up code goes to an address they typed
                        // moments ago and nothing has verified — so "check your
                        // email" has to include "check it's the right one", or
                        // this is a silently lost sale that looks like nothing
                        // happened.
                        $msg = 'We couldn\'t get that code to you. Double-check the email address and give it another go.';
                        if ($isJsonResponse) {
                            return response()->json(['status' => false, 'message' => $msg, 'msg' => $msg]);
                        }

                        return redirect()->back()->with('error', $msg);
                    }

                    // Record the initiated STEP_UP in the ledger so REVIEW_HOLD tags are captured
                    // Note: We don't have stripe_session_id yet, but this captures the step_up attempt.
                    Payment::create([
                        'creator_id' => $creator->uuid,
                        'risk_identity_id' => $identity->id,
                        'amount' => app(MoneyNormalizer::class)->toGbpMinor((int) $context['amount'], $context['currency']),
                        'reserve_amount_minor' => (function () use ($creator, $context) {
                            $amountGbp = app(MoneyNormalizer::class)->toGbpMinor((int) $context['amount'], $context['currency']);
                            $metrics = app(RiskService::class)->recalculateMetrics((string) $creator->uuid);
                            $reservePercent = (int) ($metrics->reserve_percent ?? 0);

                            return $reservePercent > 0 ? (int) round(($amountGbp * $reservePercent) / 100) : 0;
                        })(),
                        'currency' => 'gbp',
                        'status' => 'step_up',
                        'reason_codes' => $riskResult['reason_codes'] ?? [],
                    ]);

                } catch (\Exception $e) {
                    Log::error("Failed to start STEP_UP for $paymentType", ['error' => $e->getMessage()]);
                }

                $stepUpData = [
                    'step_up_required' => true,
                    'decision' => 'STEP_UP',
                    'ui' => $riskResult['ui'] ?: RiskMessages::get(
                        'STEP_UP_REQUIRED',
                        RiskMessages::audienceFor($context['is_guest'])
                    ),
                    'step_up_context' => [
                        'risk_identity_id' => $identity->id ?? null,
                        'amount' => $context['amount'],
                        'currency' => $context['currency'],
                        'creator_id' => $context['creator_id'],
                        'email' => $context['email'],
                        'device_id' => $context['device_id'],
                    ],
                ];

                if ($isJsonResponse) {
                    return response()->json(array_merge(['status' => false], $stepUpData));
                }

                return redirect()->back()->with([
                    'step_up_required' => true,
                    'step_up_data' => ['ui' => $stepUpData['ui']],
                    'step_up_context' => $stepUpData['step_up_context'],
                ]);
            }
        }

        // Return passing risk evaluation data so caller can build ledger/stripe metadata
        return [
            'status' => 'passed',
            'risk_identity_id' => app(RiskIdentityService::class)->resolveIdentity($context)->id ?? null,
            'reason_codes' => $riskResult['reason_codes'] ?? [],
            'amount_minor' => $context['amount'],
            'currency' => $context['currency'],
        ];
    }
}
