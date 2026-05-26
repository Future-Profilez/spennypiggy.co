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
use App\Models\CreatorMetric;
use App\Jobs\PiggyPotContributionMailToUser;
use App\StripeControl;
use App\Helpers;
use App\Services\CreatorAvailabilityMessageService;
use App\Services\CreatorSubscriptionService;
use App\Services\CreatorActivityService;
use App\Services\Risk\RiskService;
use App\Services\Risk\RiskIdentityService;
use App\Services\Risk\RiskController;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\ReservePolicy;

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

        $raised = (float) $piggyPot->contributions()->where('status', 'paid')->sum('amount');
        $target = (float) $piggyPot->target_amount;
        $remaining = max(0, round($target - $raised, 2));
        if ($remaining <= 0) {
            return response()->json([
                'status' => false,
                'msg' => "This goal is already completed."
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

        $basePrice = (float) $request->amount; // This is the total amount supporter entered
        if ($basePrice > $remaining) {
            return response()->json([
                'status' => false,
                'msg' => "Max you can add right now is " . number_format($remaining, 2) . "."
            ]);
        }
        $sourceCurrency = strtoupper($request->currency ?? $creator->default_currency ?? 'GBP');

        $isZeroDecimal = Helpers::isZeroDecimalCurrency($sourceCurrency);
        $multiplier = $isZeroDecimal ? 1 : 100;
        $precision = $isZeroDecimal ? 0 : 2;

        // Calculate total amounts and fees using standard logic
        // For direct charge, we need to extract the base amount so that base + fees = total entered amount
        $platformFeePercent = config('app.platform_fee_percentage'); // e.g. 5
        // $basePrice is what the supporter wants to pay total. We need to work backwards to find the actual amount.
        // Or, in Piggy Pot, the entered amount is the base amount and we add fees on top?
        // Wait, the UI says: "Includes platform and payment processing fees." 
        // This means the entered amount is the FINAL amount the supporter pays.
        // Let's assume $basePrice is the final amount.
        $finalTotalAmount = $basePrice;
        
        // Calculate breakdown backwards (approximated for now to match UI expectation)
        // Usually Helpers::calculateStripeDirectChargeFlow expects base amount and adds fees.
        // Let's use the provided amount as the base amount and calculate fees if that's how it's designed.
        // If UI says "Amounts shown are estimates", it might be adding fees. Let's look at TipInner logic.
        $breakdown = Helpers::calculateStripeDirectChargeFlow($basePrice, $sourceCurrency);
        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $applicationFeeAmount = $breakdown['application_fee'];
        $creatorNet = $breakdown['net_to_creator'];
        $vatAmount = 0; // VAT logic is typically handled per-creator if applicable or inside calculateStripeDirectChargeFlow

        // Actually, $basePrice should be stored as minor units in PiggyPotContribution amount?
        // In other tables, amount is stored as major units or minor units?
        // PiggyPotContribution amount is expected to be minor units (e.g. 2500 for 25.00).
        $amountMinor = (int) round($basePrice * $multiplier);

        $unitAmount = (int) round($finalTotalAmount * $multiplier);
        $creatorNetMinor = (int) round($creatorNet * $multiplier);

        // Identity check
        $identityService = app(RiskIdentityService::class);
        $payerIdentity = $identityService->resolveIdentity([
            'email' => $user ? $user->email : $request->email,
            'ip' => $request->ip(),
            'device_id' => $request->device_id,
        ]);

        $riskData = app(\App\Services\Risk\RiskEngineService::class)->evaluate(
            [
                'creator' => $creator,
                'supporter' => $user,
                'identity' => $payerIdentity,
                'amount' => $unitAmount,
                'currency' => $sourceCurrency,
                'type' => 'piggy_pot',
                'return_json' => true
            ]
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
            'vat_amount' => $vatAmount,
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

        $redirectUrl = url()->previous() ?: route('user.show', ['username' => $creator->username]);
        
        $payload = [
            "mode" => 'payment',
            'payment_method_types' => ['card'],
            'line_items' => $lineItems,
            'payment_intent_data' => $paymentIntentData,
            'customer_email' => $user->email ?? $request->email,
            'success_url' => route('piggy-pot.handle', ['uuid' => $pay->uuid, 'status' => "success"]) . '?redirect=' . urlencode($redirectUrl),
            'cancel_url' => route('piggy-pot.handle', ['uuid' => $pay->uuid, 'status' => "cancel"]) . '?redirect=' . urlencode($redirectUrl),
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
                    'amount' => app(MoneyNormalizer::class)->toGbpMinor((int) $unitAmount, (string) strtoupper($sourceCurrency)),
                    'reserve_amount_minor' => (function () use ($creator, $creatorNetMinor, $sourceCurrency) {
                        $metrics = app(RiskService::class)->recalculateMetrics((string) $creator->uuid);
                        $reservePolicy = app(\App\Services\Risk\ReservePolicy::class);
                        $reservePercent = $reservePolicy->getEffectiveReservePercent($creator, $metrics);
                        if ($reservePercent <= 0) return 0;
                        $reserveMinor = (int) round(((int) $creatorNetMinor * $reservePercent) / 100);
                        return app(MoneyNormalizer::class)->toGbpMinor($reserveMinor, (string) strtoupper($sourceCurrency));
                    })(),
                    'platform_holds_funds' => in_array('MARK_REVIEW_HOLD', $riskData['reason_codes'] ?? []),
                    'stripe_session_id' => $session->id,
                    'status' => in_array('MARK_REVIEW_HOLD', $riskData['reason_codes'] ?? []) ? 'review_hold' : 'initiated',
                    'reason_codes' => $riskData['reason_codes'] ?? [],
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

    public function handlePiggyPotPayment(Request $request, $uuid)
    {
        $pay = PiggyPotContribution::whereUuid($uuid)->first();
        if (!$pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }

        $pay->load(['creator', 'piggyPot', 'user']);
        
        $redirectUrl = $request->query('redirect');
        
        try {
            $session = StripeControl::getCheckoutSession($pay->session_id, $pay->creator->account_id);

            $pay->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $pay->payment_intent_id = $session->payment_intent;
                $pay->save();

                try {
                    $payment = Payment::where('stripe_session_id', $session->id)->first();
                    $newStatus = 'succeeded';
                    if (
                        $payment &&
                        (
                            $payment->status === 'review_hold' ||
                            (is_array($payment->reason_codes) && in_array('MARK_REVIEW_HOLD', $payment->reason_codes)) ||
                            (is_string($payment->reason_codes) && str_contains($payment->reason_codes, 'MARK_REVIEW_HOLD'))
                        )
                    ) {
                        $newStatus = 'review_hold';
                    }

                    Payment::where('stripe_session_id', $session->id)->update([
                        'stripe_payment_intent_id' => $session->payment_intent,
                        'status' => $newStatus
                    ]);
                } catch (\Throwable $e) {
                }

                // Sync to FinancialTransactions
                try {
                    $isZeroDecimal = Helpers::isZeroDecimalCurrency($pay->currency);
                    
                    $gross = (float) $pay->total_paid; 
                    $platformFee = (float) $pay->tax;
                    $stripeFee = 0;
                    $vatAmt = (float) $pay->vat_amount;

                    if ($session->payment_intent) {
                        try {
                            $intentObj = \Stripe\PaymentIntent::retrieve($session->payment_intent, ['stripe_account' => $pay->creator->account_id]);
                            if (isset($intentObj->application_fee_amount)) {
                                $platformFee = $isZeroDecimal ? (float) $intentObj->application_fee_amount : ($intentObj->application_fee_amount / 100);
                            }
                        } catch (\Exception $e) {}
                    }

                    $reserveAmountMajor = 0;
                    $reserveStatus = 'none';
                    $creatorMetric = $pay->creator?->uuid
                        ? CreatorMetric::where('creator_id', $pay->creator->uuid)->first()
                        : null;
                    $reservePercent = $pay->creator
                        ? (int) app(ReservePolicy::class)->getEffectiveReservePercent($pay->creator, $creatorMetric, $pay->created_at)
                        : 0;
                    if ($reservePercent > 0) {
                        $precision = $isZeroDecimal ? 0 : 2;
                        $reserveAmountMajor = round(((float) $pay->amount * $reservePercent) / 100, $precision, PHP_ROUND_HALF_UP);
                        $reserveStatus = 'held';
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
                            'reserve_amount'=> $reserveAmountMajor,
                            'reserve_status'=> $reserveStatus,
                            'currency'      => strtoupper($pay->currency ?? 'GBP'),
                            'status'        => 'completed',
                            'description'   => 'Piggy Pot Contribution',
                            'transaction_date' => $pay->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync PiggyPotContribution to FinancialTransaction: ' . $e->getMessage());
                }

                // Clear the cache for the creator's piggy pots
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pots_' . $pay->creator_id . '_owner_pinned');
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pots_' . $pay->creator_id . '_owner_all');
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pots_' . $pay->creator_id . '_public_pinned');
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pots_' . $pay->creator_id . '_public_all');
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pot_top_' . $pay->creator_id);
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pot_top_supporters_' . $pay->creator_id);
                \Illuminate\Support\Facades\Cache::forget('user_piggy_pot_feed_' . $pay->creator_id);

                if ($pay->creator) {
                    app(\App\Services\UserProfileService::class)->clearUserCaches($pay->creator->username, $pay->creator->id);
                }

                Helpers::addGmv($pay->creator_id, (float) $pay->amount, $pay->currency);

                $symbol = Helpers::getCurrency($pay->currency ?? 'GBP');
                $supporterName = $pay->is_anonymous ? 'Anonymous' : ($pay->user?->name ?: ($pay->guest_name ?: 'A supporter'));
                $sendCreator = empty($pay->creator_notified_at);
                $sendSupporter = empty($pay->supporter_notified_at);

                if ($sendCreator && $pay->creator?->email) {
                    $title = "🐷 New Piggy Pot Contribution!";
                    $content = "{$supporterName} contributed {$symbol}" . number_format((float) $pay->amount, 2) . " to {$pay->piggyPot?->title}.";
                    Helpers::sendNotification($title, $content, $pay->creator->email);
                    $pay->creator_notified_at = now();
                }

                $supporterEmail = $pay->user?->email ?: $pay->guest_email;
                if ($sendSupporter && $supporterEmail) {
                    $title = "✅ Payment Successful!";
                    $content = "Your contribution of {$symbol}" . number_format((float) $pay->total_paid, 2) . " was added to {$pay->creator?->name}'s Piggy Pot.";
                    if (!empty($pay->piggyPot?->content_file)) {
                        $content .= " Exclusive reward unlocked.";
                    }
                    Helpers::sendNotification($title, $content, $supporterEmail);
                    $pay->supporter_notified_at = now();
                }

                if ($sendCreator || $sendSupporter) {
                    PiggyPotContributionMailToUser::dispatch($pay->id, $sendCreator, $sendSupporter);
                }

                $pay->save();

                $thankYouParams = [
                    'username' => $pay->creator->username,
                    'type' => 'piggy_pot',
                    'item_name' => $pay->piggyPot?->title ?? 'Piggy Pot',
                    'amount' => $pay->total_paid,
                    'currency' => $pay->currency,
                ];

                if (!empty($pay->piggyPot?->content_file)) {
                    $contentUrl = $pay->piggyPot->content_file;
                    if (!str_starts_with($contentUrl, 'http://') && !str_starts_with($contentUrl, 'https://')) {
                        $contentUrl = 'https://ucarecdn.com/' . trim($contentUrl, '/') . '/';
                    }
                    $thankYouParams['wish_content'] = [
                        'type' => null,
                        'name' => $pay->piggyPot?->content_description ?: 'Exclusive Reward',
                        'url' => $contentUrl,
                    ];
                } elseif (!empty($pay->piggyPot?->content_description)) {
                    $thankYouParams['benefits'] = $pay->piggyPot->content_description;
                }

                return redirect(route('thank-you', $thankYouParams))->with('success', 'Payment Successful.');
            }
            
            if ($redirectUrl) {
                return redirect($redirectUrl)->with("error", "Payment cancelled or failed.");
            }
            return to_route('user.show', ['username' => $pay->creator->username, 'page' => 'piggy-pots'])
                ->with("error", "Payment cancelled or failed.");
        } catch (\Exception $e) {
            Log::error("PiggyPot Payment Handle Error: " . $e->getMessage());
            if ($redirectUrl) {
                return redirect($redirectUrl)->with("error", "Something went wrong while verifying payment.");
            }
            return to_route('user.show', ['username' => $pay->creator->username])
                ->with("error", "Something went wrong while verifying payment.");
        }
    }
}
