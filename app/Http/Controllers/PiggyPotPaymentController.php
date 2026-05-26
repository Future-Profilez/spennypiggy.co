<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\User;
use App\Models\Payment;
use App\Models\FinancialTransaction;
use App\StripeControl;
use App\Helpers;
use App\Services\CreatorAvailabilityMessageService;
use App\Services\CreatorSubscriptionService;
use App\Services\CreatorActivityService;
use App\Services\Risk\RiskService;
use App\Services\Risk\RiskIdentityService;
use App\Services\Risk\RiskController;
use App\Services\Risk\MoneyNormalizer;

class PiggyPotPaymentController extends Controller
{
    public function contributeToPiggyPot(Request $request, $piggy_pot_uuid)
    {
        $request->validate([
            'digital_waiver' => ['required', 'accepted'],
            'amount' => ['required', 'numeric', 'min:1'],
        ]);
        
        $user = Auth::user();
        if (!empty($user) && $user->role === 0 && $user->is_uk == 0 && $user->is_500_limit_exceeded == 1 && $user->profile_status_lock != 2) {
            return response()->json([
                'status' => false,
                'card_verification_required' => true,
                'msg' => "Please complete your card verification process."
            ]);
        }
        
        $piggyPot = PiggyPot::where('uuid', $piggy_pot_uuid)->first();
        if (!$piggyPot) {
            return response()->json([
                'status' => false,
                'msg' => "Piggy Pot not found."
            ]);
        }
        
        $creator = User::where('id', $piggyPot->user_id)->where('is_uk', 0)->first();
        if (!$creator) {
            return response()->json([
                'status' => false,
                'msg' => "Creator not found."
            ]);
        }

        if (!StripeControl::hasCardPaymentsCapability($creator->account_id)) {
            return response()->json([
                'status' => false,
                'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ['eligible' => false, 'status' => 'stripe_disabled'])
            ]);
        }

        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($creator);
        if (!$subscriptionCheck['eligible']) {
            return response()->json([
                'status' => false,
                'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
            ]);
        }

        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($creator);
        if (!$activityCheck['eligible']) {
            return response()->json([
                'status' => false,
                'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
            ]);
        }

        $basePrice = $request->amount; // e.g. 5.00
        $sourceCurrency = strtoupper($request->currency ?? $creator->default_currency ?? 'GBP');

        // Note: RiskService checkLimits doesn't exist directly, limits are handled inside RiskEngineService later

        // Calculate total amounts and fees using standard logic
        $breakdown = Helpers::calculateStripeDirectChargeFlow($basePrice, $sourceCurrency);
        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $applicationFeeAmount = $breakdown['application_fee'];
        $creatorNet = $breakdown['net_to_creator'];
        $vatAmount = 0; // VAT logic is typically handled per-creator if applicable or inside calculateStripeDirectChargeFlow

        $isZeroDecimal = Helpers::isZeroDecimalCurrency($sourceCurrency);
        $multiplier = $isZeroDecimal ? 1 : 100;
        $precision = $isZeroDecimal ? 0 : 2;

        $unitAmount = round($finalTotalAmount * $multiplier);
        $creatorNetMinor = round($creatorNet * $multiplier);

        // Identity check
        $identityService = app(RiskIdentityService::class);
        $payerIdentity = $identityService->identifyPayer($user, $request->ip(), $request->device_id);

        $riskData = app(\App\Services\Risk\RiskEngineService::class)->evaluate(
            $creator,
            $user,
            $payerIdentity,
            $unitAmount,
            $sourceCurrency,
            'piggy_pot',
            true // JSON response expected
        );

        if ($riskData instanceof \Illuminate\Http\JsonResponse) {
            return $riskData;
        }

        $force3DS = in_array('FORCE_3DS', $riskData['reason_codes'] ?? []);

        $pay = PiggyPotContribution::create([
            'piggy_pot_id' => $piggyPot->id,
            'user_id' => $user ? $user->id : null,
            'creator_id' => $creator->id,
            'guest_name' => $request->name,
            'guest_email' => $request->email,
            'currency' => $sourceCurrency,
            'amount' => $basePrice,
            'tax' => $breakdown['total_fees'],
            'vat_amount' => round($vatAmount, $precision, PHP_ROUND_HALF_UP),
            'total_paid' => $finalTotalAmount,
            'message' => $request->message ?? null,
            'is_anonymous' => $request->anonymous ?? 0,
        ]);

        Helpers::applyDigitalWaiver($pay, (bool) $request->digital_waiver);
        $pay->save();

        $lineItems = [
            [
                'quantity' => 1,
                'price_data' => [
                    'currency' => $sourceCurrency,
                    'product_data' => [
                        'name' => "Contribution to " . $piggyPot->title,
                        'description' => "Support payment to {$creator->name} for their goal.",
                    ],
                    'unit_amount' => $unitAmount,
                ]
            ]
        ];

        $paymentIntentData = [
            'description' => "Spenny Piggy - Piggy Pot Contribution to {$creator->name}",
            "metadata" => Helpers::buildStripeMetadata('piggy_pot', $pay, [
                'item_amount' => (string) $unitAmount,
                'creator_net_amount' => (string) $creatorNet,
                'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                'total_charge_amount' => (string) $unitAmount,
                'payment_type' => 'Piggy Pot - Direct Charge',
                'anonymous' => (string) ($request->anonymous ? 'yes' : 'no'),
            ]),
            'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
        ];

        $payload = [
            "mode" => 'payment',
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'payment_intent_data' => $paymentIntentData,
            'customer_email' => $user->email ?? $request->email,
            'success_url' => route('piggy-pot.handle', ['uuid' => $pay->uuid, 'status' => "success"]),
            'cancel_url' => route('piggy-pot.handle', ['uuid' => $pay->uuid, 'status' => "cancel"]),
        ];

        if ($force3DS) {
            $payload['payment_method_options'] = [
                'card' => [
                    'request_three_d_secure' => 'any',
                ],
            ];
        }

        try {
            $session = StripeControl::createCheckoutSession($payload, $creator->account_id, false, $creator->username);
            $pay->update(['session_id' => $session->id]);

            try {
                Payment::create([
                    'creator_id' => $creator->uuid,
                    'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                    'amount' => app(MoneyNormalizer::class)->toGbpMinor((int) $creatorNetMinor, (string) strtoupper($sourceCurrency)),
                    'reserve_amount_minor' => (function () use ($creator, $creatorNetMinor, $sourceCurrency) {
                        $metrics = app(RiskService::class)->recalculateMetrics((string) $creator->uuid);
                        $reservePercent = (int) ($metrics->reserve_percent ?? 0);
                        if ($reservePercent <= 0) return 0;
                        $reserveMinor = (int) round(((int) $creatorNetMinor * $reservePercent) / 100);
                        return app(MoneyNormalizer::class)->toGbpMinor($reserveMinor, (string) strtoupper($sourceCurrency));
                    })(),
                    'platform_holds_funds' => false,
                    'stripe_session_id' => $session->id,
                    'status' => 'pending',
                    'reason_codes' => json_encode($riskData['reason_codes'] ?? []),
                    'supporter_id' => $user ? $user->uuid : null,
                ]);
            } catch (\Exception $e) {
                Log::error('Failed to create Payment record for PiggyPot', ['error' => $e->getMessage()]);
            }

            return response()->json([
                'status' => true,
                'url' => $session->url
            ]);
        } catch (\Exception $e) {
            $pay->delete();
            return response()->json([
                'status' => false,
                'msg' => $e->getMessage()
            ]);
        }
    }

    public function handlePiggyPotPayment($uuid)
    {
        $pay = PiggyPotContribution::whereUuid($uuid)->first();
        if (!$pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        try {
            $session = StripeControl::getCheckoutSession($pay->session_id, $pay->creator->account_id);
            $pay->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $pay->payment_intent_id = $session->payment_intent;
                $pay->save();

                Payment::where('stripe_session_id', $session->id)->update([
                    'stripe_payment_intent_id' => $session->payment_intent,
                    'status' => 'completed'
                ]);

                // Sync to FinancialTransactions
                try {
                    $gross = (float) $pay->total_paid / 100; // if it was stored as minor, adjust here
                    $platformFee = (float) $pay->tax;
                    $stripeFee = 0;
                    $vatAmt = (float) $pay->vat_amount;

                    if ($session->payment_intent) {
                        try {
                            $intentObj = \Stripe\PaymentIntent::retrieve($session->payment_intent, ['stripe_account' => $pay->creator->account_id]);
                            if (isset($intentObj->application_fee_amount)) {
                                $isZeroDecimal = Helpers::isZeroDecimalCurrency($pay->currency);
                                $platformFee = $isZeroDecimal ? (float) $intentObj->application_fee_amount : ($intentObj->application_fee_amount / 100);
                            }
                        } catch (\Exception $e) {}
                    }

                    FinancialTransaction::updateOrCreate(
                        ['source_type' => PiggyPotContribution::class, 'source_id' => $pay->id],
                        [
                            'user_id'       => $pay->creator_id,
                            'supporter_id'  => $pay->user_id,
                            'type'          => 'income',
                            'gross_amount'  => $gross,
                            'platform_fee'  => $platformFee,
                            'stripe_fee'    => $stripeFee,
                            'vat_amount'    => $vatAmt,
                            'net_amount'    => (float) $pay->amount,
                            'currency'      => strtoupper($pay->currency ?? 'GBP'),
                            'status'        => 'completed',
                            'description'   => 'Piggy Pot Contribution',
                            'transaction_date' => $pay->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync PiggyPotContribution to FinancialTransaction: ' . $e->getMessage());
                }

                Helpers::addGmv($pay->creator_id, (float) $pay->amount, $pay->currency);

                return redirect()->route('checkout.success', ['id' => $pay->uuid, 'type' => 'piggy_pot']);
            }
            return redirect()->route('checkout.cancel', ['id' => $pay->uuid]);
        } catch (\Exception $e) {
            Log::error("PiggyPot Payment Handle Error: " . $e->getMessage());
            return to_route('home')->with("error", 'Something went wrong while verifying payment.');
        }
    }
}
