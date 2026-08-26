<?php

namespace App\Http\Controllers;

use App\Helpers;
use App\Jobs\PiggyPotContributionMailToUser;
use App\Models\CreatorMetric;
use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\PiggyPot;
use App\Models\PiggyPotContribution;
use App\Models\User;
use App\Services\AbandonedCheckoutService;
use App\Services\CheckoutMethodResolver;
use App\Services\CreatorActivityService;
use App\Services\CreatorAvailabilityMessageService;
use App\Services\CreatorSubscriptionService;
use App\Services\Discovery\AttributionService;
use App\Services\PiggyPotStatusService;
use App\Services\Risk\MoneyNormalizer;
use App\Services\Risk\ReservePolicy;
use App\Services\Risk\RiskService;
use App\Services\UserProfileService;
use App\StripeControl;
use App\Support\NotificationContext;
use App\Traits\RiskEnforcement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Stripe\PaymentIntent;

class PiggyPotPaymentController extends Controller
{
    use RiskEnforcement;

    /**
     * Minutes an unpaid ('pending') contribution reserves goal headroom.
     * A Stripe Checkout session the supporter is still filling in must not be
     * ignored by a concurrent buyer (two £500 buys against a £500 goal both
     * passed the old check), but an abandoned one must free up again.
     */
    private const PENDING_HOLD_MINUTES = 30;

    /**
     * Amount counted against a pot's goal: settled + in-flight bank payments +
     * recently-created pending checkouts. Single definition — the unlocked
     * pre-check and the locked insert must agree or the "max you can add"
     * message contradicts the error the insert throws.
     */
    private static function raisedAmountFor(int $piggyPotId): float
    {
        return (float) PiggyPotContribution::where('piggy_pot_id', $piggyPotId)
            ->where(function ($q) {
                $q->whereIn('status', ['paid', 'succeeded', 'processing'])
                    ->orWhere(function ($q2) {
                        $q2->where('status', 'pending')
                            ->where('created_at', '>=', now()->subMinutes(self::PENDING_HOLD_MINUTES));
                    });
            })
            ->sum('amount');
    }

    public function contributeToPiggyPot(Request $request, $piggy_pot_uuid)
    {
        $rules = [
            'digital_waiver' => ['required', 'accepted'],
            'amount' => ['required', 'numeric', 'min:1'],
        ];

        if (! Auth::check()) {
            $rules['name'] = ['required', 'string', 'max:255'];
            $rules['email'] = ['required', 'email', 'max:255'];
        }

        $request->validate($rules);

        // Bot gate — pots allow guest checkout, so this was the easiest fraud
        // path with no captcha at all. Self-gating: no-op when no secret is set.
        $this->ensureTurnstileVerified($request);

        $user = Auth::user();

        $piggyPot = PiggyPot::where('uuid', $piggy_pot_uuid)->first();

        if (! $piggyPot) {
            return response()->json([
                'status' => false,
                'msg' => 'Piggy Pot not found.',
            ]);
        }

        // Don't allow purchases into a pot that is under moderation review or closed.
        if (in_array($piggyPot->status, PiggyPotStatusService::UNPURCHASABLE_STATUSES, true)) {
            return response()->json([
                'status' => false,
                'msg' => 'This content is currently unavailable for purchase.',
            ]);
        }

        // A passed deadline closes the listing. `piggy-pots:expire` flips `status`
        // hourly, so this covers the gap between the deadline passing and that
        // sweep running — and a direct POST at any time thereafter.
        if (PiggyPotStatusService::deadlinePassed($piggyPot->deadline)) {
            return response()->json([
                'status' => false,
                'msg' => 'This content is no longer available — the creator\'s deadline has passed.',
            ]);
        }

        // Stripe compliance: content unlock pricing £4.99–£500 (GBP equivalent)
        $priceError = Helpers::priceWithinLimits($request->amount, $piggyPot->currency ?? 'gbp', 4.99, 500);
        if ($priceError) {
            return response()->json([
                'status' => false,
                'msg' => $priceError,
            ]);
        }

        // Self-purchase is blocked for guests too — Piggy Pot allows guest
        // checkout, so an authenticated-only check let a creator log out and
        // inflate their own pot's progress bar.
        $creatorAccount = User::find($piggyPot->user_id);
        $buyerEmail = $user ? $user->email : $request->email;
        $isSelfPurchase = ($user && $user->id === $piggyPot->user_id)
            || ($creatorAccount && $buyerEmail && strcasecmp(trim($buyerEmail), trim($creatorAccount->email)) === 0);

        if ($isSelfPurchase) {
            return response()->json([
                'status' => false,
                'msg' => 'You cannot purchase your own content.',
            ]);
        }

        if (! empty($user) && $user->role === 0 && $user->is_500_limit_exceeded == 1 && $user->profile_status_lock != 2) {
            return response()->json([
                'status' => false,
                'card_verification_required' => true,
                'msg' => 'Please complete your card verification process.',
            ]);
        }

        // Same rule as the locked re-check below, so the "max you can add"
        // figure shown here matches what the insert will actually allow.
        $raised = self::raisedAmountFor($piggyPot->id);
        $target = (float) $piggyPot->target_amount;
        $remaining = max(0, round($target - $raised, 2));
        if ($remaining <= 0) {
            return response()->json([
                'status' => false,
                'msg' => 'This goal is already completed.',
            ]);
        }

        $creator = $creatorAccount;
        if (! $creator) {
            return response()->json([
                'status' => false,
                'msg' => 'Creator not found.',
            ]);
        }

        $requestedMethod = $request->input('payment_method', 'card') === 'bank' ? 'bank' : 'card';

        if ($requestedMethod === 'card' && ! StripeControl::hasCardPaymentsCapability($creator->account_id)) {
            return response()->json([
                'status' => false,
                'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ['eligible' => false, 'status' => 'stripe_disabled']),
            ]);
        }

        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($creator);
        if (! $subscriptionCheck['eligible']) {
            return response()->json([
                'status' => false,
                'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null),
            ]);
        }

        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($creator);
        if (! $activityCheck['eligible']) {
            return response()->json([
                'status' => false,
                'msg' => app(CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck),
            ]);
        }

        $basePrice = (float) $request->amount; // This is the total amount supporter entered
        if ($basePrice > $remaining) {
            return response()->json([
                'status' => false,
                'msg' => 'Max you can add right now is '.number_format($remaining, 2).'.',
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
        // Resolve requested payment method (card|bank) against listing
        // preference, progressive tiers, and creator capabilities.
        $methodResolution = CheckoutMethodResolver::resolve(
            $requestedMethod,
            $piggyPot->payment_methods_accepted ?? 'both',
            $basePrice,
            $sourceCurrency,
            $user,
            $request->email ?? null,
            $creator->account_id
        );
        if (! ($methodResolution['ok'] ?? false)) {
            return response()->json([
                'status' => false,
                'code' => $methodResolution['code'],
                'msg' => $methodResolution['message'],
            ]);
        }

        // Pass $creator->id as the 5th arg so the pricing engine picks up the
        // creator's live bespoke deal (if any) — this is the correct pattern for
        // new-charge paths. Recompute paths use $rateOverride (6th arg) instead.
        $breakdown = Helpers::calculateStripeDirectChargeFlow(
            $basePrice,
            $sourceCurrency,
            0,
            $methodResolution['fee_profile'],
            $creator->id
        );
        $finalTotalAmount = $breakdown['total_supporter_pays'];
        $applicationFeeAmount = $breakdown['application_fee'];
        $creatorNet = $breakdown['net_to_creator'];
        $vatAmount = 0; // VAT logic is typically handled per-creator if applicable or inside calculateStripeDirectChargeFlow

        // PiggyPotContribution.amount holds the LISTED (base) major-unit price —
        // total_paid holds the grossed-up amount. Reserve maths depends on this.
        $unitAmount = (int) round($finalTotalAmount * $multiplier);
        $creatorNetMinor = (int) round($creatorNet * $multiplier);

        // 🚨 Risk enforcement — this used to be the ONLY checkout on the
        // platform where the risk engine did nothing at all.
        //
        // The old code called evaluate() directly and then did
        // `if ($riskData instanceof JsonResponse) { return $riskData; }`.
        // evaluate() ALWAYS returns an array, never a JsonResponse, so every
        // BLOCK / COOLDOWN / STEP_UP decision was silently discarded and the
        // checkout carried straight on. On top of that the context it passed
        // used the keys `creator`/`supporter`/`identity`/`type` instead of
        // `creator_id`/`email`/`ip`/`device_id`/`is_guest`, so `creator_id` was
        // null (killing the new-creator and cross-creator rules outright) and a
        // brand-new orphan RiskIdentity was resolved from an empty context on
        // every call — meaning the rollups this pot's spend was measured
        // against were always zero. `risk_identity_id` on the ledger row below
        // was always null for the same reason.
        //
        // It now goes through the same shared trait as the other eight
        // checkouts, which also applies the guest-checkout gate that Piggy Pot
        // never called. Note the consequence: a GUEST contributing more than the
        // high-value threshold is now asked to log in here, exactly as they
        // already are on the wish flows.
        $riskResult = $this->enforceRiskChecks(
            $request,
            $creator,
            (float) $finalTotalAmount,
            $sourceCurrency,
            'piggy_pot',
            true
        );

        // A refusal, a step-up, or a login requirement comes back as a response.
        // Checked with is_array rather than a class name so that a future change
        // to the trait's return type cannot silently reopen this same hole.
        if (! is_array($riskResult)) {
            return $riskResult;
        }

        $riskData = $riskResult;
        $force3DS = in_array('FORCE_3DS', $riskData['reason_codes'] ?? []);

        // Re-check the remaining headroom under a row lock before inserting.
        // The earlier $remaining read is unlocked, so two concurrent buyers near
        // the goal cap could both pass it and over-fund the pot past
        // target_amount. Locking the pot row serialises the check + insert.
        try {
            $pay = DB::transaction(function () use ($piggyPot, $basePrice, $user, $creator, $request, $sourceCurrency, $methodResolution, $breakdown, $vatAmount, $finalTotalAmount) {
                $locked = PiggyPot::where('id', $piggyPot->id)->lockForUpdate()->first();
                if (! $locked) {
                    throw new \RuntimeException('This content is no longer available.');
                }

                $raisedNow = self::raisedAmountFor($piggyPot->id);
                $remainingNow = max(0, round((float) $locked->target_amount - $raisedNow, 2));

                if ($remainingNow <= 0 || $basePrice > $remainingNow) {
                    throw new \RuntimeException($remainingNow <= 0
                        ? 'This goal is already completed.'
                        : 'Max you can add right now is '.number_format($remainingNow, 2).'.');
                }

                return PiggyPotContribution::create([
                    'piggy_pot_id' => $piggyPot->id,
                    'user_id' => $user ? $user->id : null,
                    'creator_id' => $creator->id,
                    'guest_name' => $request->name,
                    'guest_email' => $request->email,
                    'currency' => $sourceCurrency,
                    'amount' => $basePrice,
                    'fee_profile' => $methodResolution['fee_profile'],
                    'tax' => $breakdown['total_fees'],
                    'vat_amount' => $vatAmount,
                    'total_paid' => $finalTotalAmount,
                    'message' => $request->message ?? null,
                    'is_anonymous' => $request->anonymous ?? 0,
                    // The rates this charge was priced at. Read back by every recompute
                    // path so a later change to the creator's deal cannot re-price it.
                    ...Helpers::feeRateColumns($breakdown),
                    // Discovery Phase 1 — persisted here so finance:sync-transactions
                    // can attribute the ledger row it rebuilds later, with no cookie
                    // and no ambient event metadata to read.
                    'discovery_source' => AttributionService::sourceForCreator($creator->id),
                ]);
            });
        } catch (\RuntimeException $e) {
            return response()->json(['status' => false, 'msg' => $e->getMessage()]);
        }

        Helpers::applyDigitalWaiver($pay, (bool) $request->digital_waiver);
        $pay->save();

        $lineItems = [
            [
                'quantity' => 1,
                'price_data' => [
                    'currency' => $sourceCurrency,
                    'product_data' => [
                        'name' => 'Exclusive content',
                        'description' => Helpers::rewardLineDescription(
                            $pay->piggyPot ?? null,
                            "Exclusive content from {$creator->name}."
                        ),
                    ],
                    'unit_amount' => $unitAmount,
                ],
            ],
        ];

        $paymentIntentData = [
            'description' => "SpennyPiggy content from {$creator->name}",
            'metadata' => Helpers::buildStripeMetadata('piggy_pot', $pay, [
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
            'mode' => 'payment',
            'payment_method_types' => $methodResolution['payment_method_types'],
            'line_items' => $lineItems,
            'payment_intent_data' => $paymentIntentData,
            // Session-level metadata is what the webhook reads
            // ($event->data->object->metadata). Without type=piggy_pot here the
            // async-settlement webhook (bank/SEPA/ACH) can't route to
            // processPiggyPotPayment → payment never completes, no deliverable,
            // no notification. The redirect handler covers card; the webhook
            // covers delayed bank settlement.
            'metadata' => $paymentIntentData['metadata'],
            'customer_email' => $user?->email ?? $request->email,
            'success_url' => route('piggy-pot.handle', ['uuid' => $pay->uuid, 'status' => 'success']).'?redirect='.urlencode($redirectUrl),
            'cancel_url' => route('piggy-pot.handle', ['uuid' => $pay->uuid, 'status' => 'cancel']).'?redirect='.urlencode($redirectUrl),
        ];

        if ($methodResolution['fee_profile'] === 'card' && ($force3DS || $methodResolution['force_3ds'])) {
            $payload['payment_method_options'] = [
                'card' => [
                    'request_three_d_secure' => 'any',
                ],
            ];
        }

        try {
            $session = StripeControl::createCheckoutSession($payload, $creator->account_id, false, $creator->username);
            $pay->update(['session_id' => $session->id]);

            // Recovery tracking. Swallows its own errors — a missed reminder costs one
            // email, a thrown exception here would cost the sale.
            AbandonedCheckoutService::record(
                $session,
                'piggy_pot',
                $creator,
                $pay->piggy_pot_id,
                $pay->user_id,
                $pay->guest_email ?? null,
                (int) ($session->amount_total ?? 0),
                $session->currency ?? null,
                $methodResolution['fee_profile'] ?? null
            );

            try {
                Payment::create([
                    'creator_id' => $creator->uuid,
                    'risk_identity_id' => $riskData['risk_identity_id'] ?? null,
                    'amount' => app(MoneyNormalizer::class)->toGbpMinor((int) $unitAmount, (string) strtoupper($sourceCurrency)),
                    'reserve_amount_minor' => (function () use ($creator, $creatorNetMinor, $sourceCurrency) {
                        $metrics = app(RiskService::class)->recalculateMetrics((string) $creator->uuid);
                        $reservePolicy = app(ReservePolicy::class);
                        $reservePercent = $reservePolicy->getEffectiveReservePercent($creator, $metrics);
                        if ($reservePercent <= 0) {
                            return 0;
                        }
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
                'url' => $session->url,
            ]);
        } catch (\Exception $e) {
            $pay->delete();

            return response()->json([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }

    public function handlePiggyPotPayment(Request $request, $uuid)
    {
        $pay = PiggyPotContribution::whereUuid($uuid)->first();
        if (! $pay) {
            return to_route('home')->with('error', 'Insufficient data!');
        }

        // withTrashed: a creator deleting the pot while the supporter is mid-checkout
        // must not leave a paid purchase with no resolvable content (the deliverable
        // would be written url-less and nothing ever revisits it).
        $pay->load(['creator', 'user', 'piggyPot' => fn ($q) => $q->withTrashed()]);

        // Labels every receipt/push this request sends with the contribution
        // behind it — see App\Support\NotificationContext.
        NotificationContext::for([
            'context_type' => 'piggy_pot',
            'context_id' => $pay->piggy_pot_id,
            'stripe_session_id' => $pay->session_id,
            'stripe_payment_intent_id' => $pay->payment_intent_id,
            'buyer_id' => $pay->user_id,
            'buyer_email' => $pay->user->email ?? $pay->guest_email ?? null,
            'creator_id' => $pay->creator_id,
        ]);

        $redirectUrl = $request->query('redirect');

        try {
            $session = StripeControl::getCheckoutSession($pay->session_id, $pay->creator->account_id);

            $instantFulfil = config('payments.instant_fulfilment', true) && $pay->fee_profile === 'bank';
            $isPaidOrInstantBank = $session->payment_status == 'paid' || ($instantFulfil && in_array($session->payment_status, ['unpaid', 'processing']));

            $pay->status = $session->payment_status == 'paid' ? 'paid' : ($instantFulfil ? 'processing' : $session->payment_status);
            if ($isPaidOrInstantBank) {
                $pay->payment_intent_id = $session->payment_intent;
                $pay->save();

                $newStatus = 'succeeded';
                try {
                    $payment = Payment::where('stripe_session_id', $session->id)->first();
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
                        'status' => $newStatus,
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
                            $intentObj = PaymentIntent::retrieve($session->payment_intent, ['stripe_account' => $pay->creator->account_id]);
                            if (isset($intentObj->application_fee_amount)) {
                                $platformFee = $isZeroDecimal ? (float) $intentObj->application_fee_amount : ($intentObj->application_fee_amount / 100);
                            }
                        } catch (\Exception $e) {
                        }
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
                            'user_id' => $pay->creator_id,
                            'supporter_id' => $pay->user_id,
                            'type' => 'income',
                            'gross_amount' => $gross,
                            'fee_profile' => $pay->fee_profile ?? 'card',
                            'platform_fee' => $platformFee,
                            // Carried from the contribution, never re-resolved — and
                            // written IDENTICALLY to the webhook's FT sync
                            // (processPiggyPotPayment), because both paths updateOrCreate
                            // the same row and whichever lands second wins. This used to
                            // recompute the rates AND explicitly null compliance_fee /
                            // admin_fee, so a redirect arriving after the webhook wiped
                            // fee columns off an already-correct ledger row.
                            ...Helpers::copyFeeRateColumns($pay),
                            'stripe_fee' => $stripeFee,
                            'vat_amount' => $vatAmt,
                            'net_amount' => (float) $pay->amount,
                            'reserve_amount' => $reserveAmountMajor,
                            'reserve_status' => $reserveStatus,
                            'currency' => strtoupper($pay->currency ?? 'GBP'),
                            'status' => $newStatus === 'review_hold' ? 'review_hold' : 'completed',
                            'description' => 'Content purchase: '.($pay->piggyPot?->title ?? 'Content'),
                            'transaction_date' => $pay->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync PiggyPotContribution to FinancialTransaction: '.$e->getMessage());
                }

                // Stripe compliance: every payment stores a content/service deliverable
                // with a fulfilment/delivery status. The content_file is the product.
                try {
                    $pot = $pay->piggyPot;
                    $contentUrl = null;
                    if (! empty($pot?->content_file)) {
                        $contentUrl = $pot->content_file;
                        if (! str_starts_with($contentUrl, 'http')) {
                            $contentUrl = 'https://ucarecdn.com/'.trim($contentUrl, '/').'/';
                        }
                    }

                    Deliverable::firstOrCreate(
                        [
                            'product_type' => 'piggy_pot',
                            'item_id' => $pay->id,
                        ],
                        [
                            'uuid' => (string) Str::uuid(),
                            'product_id' => 'piggy_pot_'.($pot?->id ?? 'unknown'),
                            'creator_id' => $pay->creator_id,
                            'gifter_id' => $pay->user_id,
                            'payment_intent_id' => $session->payment_intent,
                            'session_id' => $session->id,
                            'deliverable_type' => ! empty($pot?->content_file) ? 'digital_file' : 'content_file',
                            'transaction_amount' => $pay->amount,
                            'deliverable_url' => $contentUrl,
                            'customer_email' => $pay->user?->email ?? $pay->guest_email,
                            'customer_name' => $pay->is_anonymous ? 'Anonymous' : ($pay->user?->name ?? $pay->guest_name),
                            'payment_status' => $pay->status,
                            'payment_currency' => $pay->currency,
                            'anonymous' => (bool) $pay->is_anonymous,
                            'message' => $pay->message,
                            'status' => ! empty($contentUrl) ? 'delivered' : 'pending',
                            'delivered_at' => ! empty($contentUrl) ? now() : null,
                            'metadata' => [
                                'product_type' => 'piggy_pot',
                                'content_id' => $pot?->id,
                                'content_title' => $pot?->title,
                                'goal_target' => $pot?->target_amount,
                                'amount' => $pay->amount,
                                'currency' => $pay->currency,
                            ],
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to create PiggyPot deliverable: '.$e->getMessage());
                }

                // Clear the cache for the creator's piggy pots
                Cache::forget('user_piggy_pots_'.$pay->creator_id.'_owner_pinned');
                Cache::forget('user_piggy_pots_'.$pay->creator_id.'_owner_all');
                Cache::forget('user_piggy_pots_'.$pay->creator_id.'_public_pinned');
                Cache::forget('user_piggy_pots_'.$pay->creator_id.'_public_all');
                Cache::forget('user_piggy_pot_top_'.$pay->creator_id);
                Cache::forget('user_piggy_pot_top_supporters_'.$pay->creator_id);
                Cache::forget('user_piggy_pot_feed_'.$pay->creator_id);

                if ($pay->creator) {
                    app(UserProfileService::class)->clearUserCaches($pay->creator->username, $pay->creator->id);
                }

                Helpers::addGmv($pay->creator_id, (float) $pay->amount, $pay->currency);

                $symbol = Helpers::getCurrency($pay->currency ?? 'GBP');
                $supporterName = $pay->is_anonymous ? 'Anonymous' : ($pay->user?->name ?: ($pay->guest_name ?: 'A supporter'));
                // Atomic claim, matching the webhook's guard. This redirect handler
                // and checkout.session.completed can land concurrently; reading
                // *_notified_at off an in-memory copy let both pass and send the
                // purchase emails twice.
                $supporterEmail = $pay->user?->email ?: $pay->guest_email;

                $sendCreator = $pay->creator?->email
                    ? PiggyPotContribution::where('id', $pay->id)
                        ->whereNull('creator_notified_at')
                        ->update(['creator_notified_at' => now()]) > 0
                    : false;

                $sendSupporter = $supporterEmail
                    ? PiggyPotContribution::where('id', $pay->id)
                        ->whereNull('supporter_notified_at')
                        ->update(['supporter_notified_at' => now()]) > 0
                    : false;

                Log::info('PiggyPot Creator Notification Check', [
                    'payment_id' => $pay->id,
                    'creator_id' => $pay->creator?->id,
                    'creator_email' => $pay->creator?->email,
                    'creator_notified_at' => $pay->creator_notified_at,
                    'sendCreator' => $sendCreator,
                ]);

                if ($sendCreator) {
                    try {
                        $pay->creator_notified_at = now();

                        $title = '🐷 New content purchase!';
                        $content = "{$supporterName} purchased {$pay->piggyPot?->title} for {$symbol}".
                            number_format((float) $pay->amount, 2).'.';

                        Log::info('Sending Creator PWA Notification', [
                            'payment_id' => $pay->id,
                            'title' => $title,
                            'content' => $content,
                            'email' => $pay->creator->email,
                        ]);

                        $result = Helpers::sendNotification(
                            $title,
                            $content,
                            $pay->creator->email
                        );

                        Log::info('Creator PWA Notification Result', [
                            'payment_id' => $pay->id,
                            'result' => $result,
                        ]);
                    } catch (\Throwable $e) {

                        Log::error('Creator PWA Notification Failed', [
                            'payment_id' => $pay->id,
                            'creator_id' => $pay->creator?->id,
                            'email' => $pay->creator?->email,
                            'message' => $e->getMessage(),
                            'line' => $e->getLine(),
                            'file' => $e->getFile(),
                            'trace' => $e->getTraceAsString(),
                        ]);
                    }
                } else {
                    Log::warning('Creator notification skipped', [
                        'payment_id' => $pay->id,
                        'reason' => [
                            'sendCreator' => $sendCreator,
                            'creator_email_exists' => ! empty($pay->creator?->email),
                            'creator_notified_at' => $pay->creator_notified_at,
                        ],
                    ]);
                }
                // if ($sendCreator) {
                //     $pay->creator_notified_at = now();
                //     $title = '🐷 New content purchase!';
                //     $content = "{$supporterName} purchased {$pay->piggyPot?->title} for {$symbol}".number_format((float) $pay->amount, 2).'.';
                //     Helpers::sendNotification($title, $content, $pay->creator->email);
                // }

                if ($sendSupporter) {
                    $pay->supporter_notified_at = now();
                    $title = '✅ Payment Successful!';
                    $content = "Your purchase of {$symbol}".number_format((float) $pay->total_paid, 2)." from {$pay->creator?->name} is complete.";
                    if (! empty($pay->piggyPot?->content_file)) {
                        $content .= ' Exclusive content unlocked.';
                    }
                    Helpers::sendNotification($title, $content, $supporterEmail);
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
                    'source' => 'piggy_pot_contributions',
                    'source_id' => $pay->id,
                ];

                if (! empty($pay->piggyPot?->content_file)) {
                    $contentUrl = $pay->piggyPot->content_file;
                    if (! str_starts_with($contentUrl, 'http://') && ! str_starts_with($contentUrl, 'https://')) {
                        $contentUrl = 'https://ucarecdn.com/'.trim($contentUrl, '/').'/';
                    }
                } elseif (! empty($pay->piggyPot?->content_description)) {
                }

                return redirect(route('thank-you', $thankYouParams))->with('success', 'Payment Successful.');
            }

            // Delayed-settlement bank methods (SEPA/ACH): session completes with
            // payment_status 'unpaid' while the debit clears — fulfilment runs
            // via the async_payment_succeeded webhook.
            if (
                ! config('payments.instant_fulfilment', true)
                && $pay->fee_profile === 'bank' && in_array($session->payment_status, ['unpaid', 'processing'])
            ) {
                $pay->status = 'processing';
                $pay->save();

                $processingMsg = 'Payment received — your bank payment is processing. Your content unlocks as soon as it clears.';
                if ($redirectUrl) {
                    return redirect($redirectUrl)->with('success', $processingMsg);
                }

                return to_route('user.show', ['username' => $pay->creator->username, 'page' => 'piggy-pots'])
                    ->with('success', $processingMsg);
            }

            if ($redirectUrl) {
                return redirect($redirectUrl)->with('error', 'Payment cancelled or failed.');
            }

            return to_route('user.show', ['username' => $pay->creator->username, 'page' => 'piggy-pots'])
                ->with('error', 'Payment cancelled or failed.');
        } catch (\Exception $e) {
            Log::error('PiggyPot Payment Handle Error: '.$e->getMessage());
            if ($redirectUrl) {
                return redirect($redirectUrl)->with('error', 'Something went wrong while verifying payment.');
            }

            return to_route('user.show', ['username' => $pay->creator->username])
                ->with('error', 'Something went wrong while verifying payment.');
        }
    }
}
