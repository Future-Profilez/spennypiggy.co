<?php

namespace App\Traits;

use App\Helpers;
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
            if ($isJsonResponse) {
                return response()->json([
                    'status' => false,
                    'code' => 'AUTH_REQUIRED',
                    'reason_code' => $guestRestriction['code'],
                    'message' => 'Login required',
                    'msg' => $guestRestriction['message'],
                ]);
            }
            return to_route('login', [
                'redirect' => $request->fullUrl(),
                'message' => $guestRestriction['message']
            ]);
        }

        // 3. Risk Engine Context
        $context = [
            'amount' => (int) round($totalAmountWithFees * 100),
            'currency' => strtoupper($currency),
            'creator_id' => $creator->uuid,
            'email' => Auth::user()->email ?? $request->query('email') ?? $request->input('email'),
            'ip' => $request->ip(),
            'device_id' => $request->input('device_id') ?? $request->query('device_id') ?? session()->getId(),
            'is_guest' => !Auth::check(),
        ];

        // 4. Evaluate Risk
        $riskResult = app(\App\Services\Risk\RiskEngineService::class)->evaluate($context);
        $decision = $riskResult['decision'] ?? 'ALLOW';

        // Bypass STEP_UP if emulated by admin
        if ($decision === 'STEP_UP' && session()->get('emulated_by_admin')) {
            Log::info("Bypassing STEP_UP for payment because user is being emulated by admin.");
            $decision = 'ALLOW';
        }

        // 5. Handle BLOCK / COOLDOWN
        if (in_array($decision, ['BLOCK', 'COOLDOWN'], true)) {
            $msg = $riskResult['ui']['body'] ?? 'Payment blocked for security reasons.';
            if ($isJsonResponse) {
                return response()->json([
                    'status' => false,
                    'message' => $msg,
                    'msg' => $msg,
                    'decision' => $decision,
                    'reason_codes' => $riskResult['reason_codes'] ?? [],
                ]);
            }
            return redirect()->back()->with('error', $msg);
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
                    $identity = app(\App\Services\Risk\RiskIdentityService::class)->resolveIdentity($context);
                    $sent = app(\App\Services\Risk\VerificationService::class)->sendOtp($identity, $context);
                    
                    if (!$sent) {
                        $msg = 'Unable to send verification code. Please check your email and try again.';
                        if ($isJsonResponse) {
                            return response()->json(['status' => false, 'message' => $msg, 'msg' => $msg]);
                        }
                        return redirect()->back()->with('error', $msg);
                    }

                    // Record the initiated STEP_UP in the ledger so REVIEW_HOLD tags are captured
                    // Note: We don't have stripe_session_id yet, but this captures the step_up attempt.
                    \App\Models\Payment::create([
                        'creator_id' => $creator->uuid,
                        'risk_identity_id' => $identity->id,
                        'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) $context['amount'], $context['currency']),
                        'reserve_amount_minor' => (function () use ($creator, $context) {
                            $amountGbp = app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) $context['amount'], $context['currency']);
                            $reservePercent = (int) (\App\Models\CreatorMetric::firstOrCreate(['creator_id' => $creator->uuid])->reserve_percent ?? 0);
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
                    'ui' => $riskResult['ui'] ?? [
                        'title' => 'Confirm Your Payment',
                        'body' => 'For your security, please confirm this payment.',
                    ],
                    'step_up_context' => [
                        'risk_identity_id' => $identity->id ?? null,
                        'amount' => $context['amount'],
                        'currency' => $context['currency'],
                        'creator_id' => $context['creator_id'],
                        'email' => $context['email'],
                        'device_id' => $context['device_id'],
                    ]
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
            'risk_identity_id' => app(\App\Services\Risk\RiskIdentityService::class)->resolveIdentity($context)->id ?? null,
            'reason_codes' => $riskResult['reason_codes'] ?? [],
            'amount_minor' => $context['amount'],
            'currency' => $context['currency'],
        ];
    }
}
