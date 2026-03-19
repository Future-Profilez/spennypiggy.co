<?php

namespace App;

use App\Jobs\SendReferralQualifiedEmailJob;
use App\Models\CreatorReferral;
use App\Models\Currency;
use App\Models\UserPayment;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Ramsey\Uuid\Uuid;

class Helpers
{
    public static function checkBlockData($request)
    {
        $blockedWords = ['paypig', 'findom', 'worship', 'unlock', 'unblock', 'receive', 'tax', 'fee', 'session', 'deposit', 'tribute', 'dick', 'goddess', 'master', 'mistress'];
        $blockedEmojis = ['😈', '💩', '💬', '👅', '🍆', '🍌', '🌽', '🌶️', '🍑', '💎', '💦'];

        // Filter out non-stringable values (like arrays or objects)
        $stringValues = array_filter($request->all(), function ($value) {
            return is_scalar($value) || (is_object($value) && method_exists($value, '__toString'));
        });

        // Combine all the valid inputs into one string
        $inputText = implode(' ', $stringValues);

        foreach ($blockedWords as $word) {
            if (preg_match("/\b" . preg_quote($word) . "\b/i", $inputText)) {
                return true;
            }
        }

        foreach ($blockedEmojis as $emoji) {
            if (mb_strpos($inputText, $emoji) !== false) {
                return true;
            }
        }

        return false;
    }

    /**
     * Add GMV to an existing creator referral
     *
     * @param int   $referredCreatorId  Creator who received payment
     * @param float $amountGbp          GMV amount in GBP
     */
    public static function addGmv(int $referredCreatorId, float $amount, string $fromCurrency = 'gbp'): void
    {
        try {
            if ($amount <= 0) {
                return;
            }

            // Convert to GBP
            $amountGbp = Helpers::priceFormat($fromCurrency, $amount, 'gbp');
            $amountGbp = (float) round($amountGbp, 2);

            if ($amountGbp <= 0) {
                return;
            }

            // Always fetch referral
            /** @var CreatorReferral|null $referral */
            $referral = CreatorReferral::with('referrer', 'referred')
                ->where('referred_creator_id', $referredCreatorId)
                ->whereIn('status', ['IN_PROGRESS', 'QUALIFIED'])
                ->first();

            if (!$referral) {
                return;
            }

            // Already qualified → do nothing
            if ($referral->status === 'QUALIFIED') {
                return;
            }

            // Remaining amount to reach 1000
            $remaining = 1000 - $referral->lifetime_gmv;

            if ($remaining <= 0) {
                return;
            }

            // Cap the increment
            $increment = min($amountGbp, $remaining);

            // Add only allowed amount
            $referral->increment('lifetime_gmv', $increment);

            // Final qualification check
            if ($referral->lifetime_gmv >= 1000) {
                $referral->update([
                    'status'       => 'QUALIFIED',
                    'qualified_at' => now(),
                ]);

                // 📧 Existing email job
                SendReferralQualifiedEmailJob::dispatch($referral);

                $referredCreatorName = $referral->referred->name;

                // 🔔 PWA Notification (NEW)
                $title = '🎉 Referral Goal Achieved!';
                $content = "Your referred creator($referredCreatorName) has reached £1,000 GMV. £50 has been unlocked in your wallet.";
                $email = $referral->referrer->email;

                Helpers::sendNotification($title, $content, $email);
            }

            Log::info('Creator referral GMV updated (capped)', [
                'referrer_creator_id' => $referral->referrer_creator_id,
                'referred_creator_id' => $referredCreatorId,
                'added_gmv_gbp'       => $increment,
                'total_gmv_gbp'       => $referral->lifetime_gmv,
                'status'              => $referral->status,
            ]);
        } catch (\Throwable $e) {
            Log::error('CreatorReferralHelper::addGmv failed', [
                'referred_creator_id' => $referredCreatorId,
                'amount'              => $amount,
                'currency'            => $fromCurrency,
                'error'               => $e->getMessage(),
            ]);
        }
    }




    /**
     * Calculate total price for Stripe Direct Charges Flow
     * 
     * Step 1: Gross-up for Stripe processing fees (2.9% + $0.30)
     * Step 2: Add platform fee (15%) and compliance fee (2%)
     * Step 3: Add fixed administration fee ($1.00)
     * 
     * @param float $listedPrice The price set by the creator
     * @param string $currency The currency ISO code
     * @return array Breakdown of fees and total
     */
    public static function isZeroDecimalCurrency($currency): bool
    {
        $zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return in_array(strtoupper($currency), $zeroDecimalCurrencies);
    }

    public static function administrationFeeInCurrency($currency): float
    {
        $feeGbp = (float) config('app.administration_fee', 1);
        $currency = strtoupper($currency ?: 'GBP');

        if ($currency === 'GBP') {
            return $feeGbp;
        }

        $converted = (float) self::priceFormat('GBP', $feeGbp, $currency);
        if (!is_finite($converted) || $converted <= 0) {
            return $feeGbp;
        }

        $precision = self::isZeroDecimalCurrency($currency) ? 0 : 2;
        return round($converted, $precision, PHP_ROUND_HALF_UP);
    }

    public static function calculateStripeDirectChargeFlow($listedPrice, $currency = 'USD', $reserveRate = 0): array
    {
        $listedPrice = (float) $listedPrice;
        $isZeroDecimal = self::isZeroDecimalCurrency($currency);
        
        // Stripe fees (Variable based on card/country, used here for estimation to cover costs)
        // Note: The actual fee is deducted by Stripe at transaction time.
        // We use a standard rate (e.g. 2.9% + 30c) to ensure the gross-up covers most scenarios.
        $stripeFeeRate = 0.029;
        $stripeFixedFee = $isZeroDecimal ? 0 : 0.30;
        
        // Platform fees
        $platformFeeRate = config('app.platform_fee_percentage', 15) / 100;
        $complianceFeeRate = config('app.transaction_fee_percentage', 2) / 100;
        $adminFee = self::administrationFeeInCurrency($currency);

        // Correct gross-up formula to ensure creator receives exactly listedPrice:
        // TotalAmount = (ListedPrice + StripeFixedFee + AdminFee) / (1 - StripeFeeRate - PlatformFeeRate - ComplianceFeeRate)
        $totalDeductionRate = $stripeFeeRate + $platformFeeRate + $complianceFeeRate;
        
        if ($totalDeductionRate >= 1) {
            Log::error('Total deduction rate exceeds 100% in calculateStripeDirectChargeFlow');
            return [
                'listed_price' => $listedPrice,
                'total_supporter_pays' => $listedPrice,
                'application_fee' => 0,
            ];
        }

        $totalSupporterPays = ($listedPrice + $stripeFixedFee + $adminFee) / (1 - $totalDeductionRate);
        
        // Use CEIL as per client requirement to avoid underpayment (round UP)
        $precision = $isZeroDecimal ? 0 : 2;
        // For standard currencies, multiply by 100, ceil, then divide by 100
        if (!$isZeroDecimal) {
            $totalSupporterPays = ceil($totalSupporterPays * 100) / 100;
        } else {
            $totalSupporterPays = ceil($totalSupporterPays);
        }
        
        // Calculate the actual Stripe fee based on the total charged
        $actualStripeFee = round(($totalSupporterPays * $stripeFeeRate) + $stripeFixedFee, $precision, PHP_ROUND_HALF_UP);
        
        // Application Fee is what we take (Platform + Compliance + Admin)
        $platformFee = round($totalSupporterPays * $platformFeeRate, $precision, PHP_ROUND_HALF_UP);
        $complianceFee = round($totalSupporterPays * $complianceFeeRate, $precision, PHP_ROUND_HALF_UP);
        $applicationFee = $platformFee + $complianceFee + $adminFee;

        // Calculate Reserve (if applicable)
        // Reserve is calculated on the Net to Creator (Listed Price) or Total Supporter Pays?
        // Usually reserves are held from the *processed volume*.
        // Let's assume 10% of the *Total Supporter Pays* to be safe, OR 10% of the *Creator's Share*.
        // If we deduct from Creator Share:
        $reserveAmount = 0;
        if ($reserveRate > 0) {
             // Reserve logic: Deduct from Creator's Net, Add to Application Fee (Held by Platform)
             // Calculation Base: Percentage of the *Gross Amount* (Total Supporter Pays) is standard for risk.
             $reserveAmount = round(($totalSupporterPays * $reserveRate) / 100, $precision, PHP_ROUND_HALF_UP);
             
             // Add to Application Fee (So Stripe sends it to Platform Account instead of Creator)
             $applicationFee += $reserveAmount;
        }

        return [
            'listed_price' => round($listedPrice, $precision),
            'platform_fee' => $platformFee,
            'compliance_fee' => $complianceFee,
            'admin_fee' => round($adminFee, $precision),
            'reserve_amount' => $reserveAmount, // Return for logging/metadata
            'application_fee' => round($applicationFee, $precision),
            'stripe_fee' => $actualStripeFee,
            'total_supporter_pays' => $totalSupporterPays,
            // Net to creator is reduced by Reserve
            'net_to_creator' => round($totalSupporterPays - $actualStripeFee - $applicationFee, $precision),
        ];
    }

    public static function priceFormat($currency1, $amount, $currency2)
    {
        // Validate input amount
        if (!is_numeric($amount) || is_nan($amount) || !is_finite($amount)) {
            Log::error('Invalid amount in priceFormat', [
                'amount' => $amount,
                'currency1' => $currency1,
                'currency2' => $currency2
            ]);
            return 0; // Return 0 for invalid amounts
        }

        $def = Currency::where('ISO', strtoupper($currency1))->first();
        $prof = Currency::where('ISO', strtoupper($currency2))->first();

        if (!$def || !$prof) {
            Log::error('Currency not found', [
                'currency1' => $currency1,
                'currency2' => $currency2
            ]);
            return $amount; // Return original amount if currencies not found
        }

        if ($def->conversion_rate == 0) {
            Log::error('Division by zero prevented in priceFormat', [
                'currency1' => $currency1,
                'conversion_rate' => $def->conversion_rate
            ]);
            return $amount; // Return original amount to prevent division by zero
        }

        $gbp_price = $amount / $def->conversion_rate;
        $prof_cur_price = $prof->conversion_rate * $gbp_price;

        // Use ISOdigits to determine decimal places for proper rounding
        $decimalPlaces = $prof->ISOdigits ?? 2;
        $result = round($prof_cur_price, $decimalPlaces, PHP_ROUND_HALF_UP);

        // Final validation to ensure we don't return NaN
        if (is_nan($result) || !is_finite($result)) {
            Log::error('NaN result in priceFormat', [
                'amount' => $amount,
                'currency1' => $currency1,
                'currency2' => $currency2,
                'gbp_price' => $gbp_price,
                'prof_cur_price' => $prof_cur_price,
                'result' => $result
            ]);
            return 0; // Return 0 instead of NaN
        }

        return $result;
    }

    public static function checkUnsafeContent($uuid)
    {
        // Remove duplicate entries from restricted words
        $rest_words = ['adult', '18+', 'pornographic', 'XXX', 'NSFW', 'blood', 'brutality', 'explicit', 'mature', 'weapons', 'aggression', 'combat'];

        Http::withHeaders([
            'Content-Type' => 'application/json',
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->post('https://api.uploadcare.com/addons/aws_rekognition_detect_moderation_labels/execute/', [
            'target' => $uuid,
        ]);

        $response = Http::withHeaders([
            'Accept' => 'application/vnd.uploadcare-v0.7+json',
            'Authorization' => 'Uploadcare.Simple ' . env('UPLOADCARE_PUBLIC_KEY') . ':' . env('UPLOADCARE_SECRET_KEY'),
        ])->get("https://api.uploadcare.com/files/$uuid/?include=appdata");

        if (!$response->successful()) {
            Log::error('Uploadcare API failed in checkUnsafeContent', [
                'uuid' => $uuid,
                'status' => $response->status(),
                'response' => $response->body()
            ]);
            return false; // Return false if API fails
        }

        $data = $response->json();

        if (!isset($data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'])) {
            Log::warning('ModerationLabels not found in checkUnsafeContent', [
                'uuid' => $uuid,
                'response' => $data
            ]);
            return false;
        }

        $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];

        foreach ($tags as $tag) {
            $name = explode(" ", $tag['Name']);
            $common = array_intersect($rest_words, $name);

            if (count($common) > 0) {
                return true;
            }
        }

        return false;
    }

    public static function getCurrency($currency)
    {

        $curr = strtolower($currency);

        $arr = [
            'gbp' => '£',
            'usd' => '$',
            'aud' => 'AU$',
            'eur' => '€',
            'jpy' => '¥',
            'hkd' => 'HK$',
            'cad' => 'CA$',
            'chf' => 'Fr.',
            'sek' => 'kr',
            'nzd' => 'NZ$'
        ];

        return $arr[$curr];
    }

    /*
     * send pwa notification on every activity
     */
    public static function sendNotification($title, $content, $email)
    {
        $payload = [
            'notification' => [
                'title' => $title,
                'content' => $content,
                'recipients' => [
                    ['email' => $email]
                ]
            ]
        ];
        try {
            $response = Http::withHeaders([
                'X-MAGICBELL-API-KEY' => env('MAGICBELL_API_KEY'),
                'X-MAGICBELL-API-SECRET' => env("MAGICBELL_API_SECRET"),
                'Accept' => 'application/json',
            ])->post('https://api.magicbell.com/notifications', $payload);

            Log::info('MagicBell API response status: ' . $response->status());
            Log::info('MagicBell API response body: ' . $response->body());

            if ($response->successful()) {
                return response()->json(['message' => 'Push notification sent successfully!']);
            }
            Log::error('Failed to send push notification: ' . $response->reason());
            return response()->json([
                'error' => 'Failed to send push notification !!',
                'reason' => $response->reason(),
                'status_code' => $response->status(),
                'response_body' => $response->body(),
            ], 500);
        } catch (\Exception $e) {
            Log::error('Error sending push notification: ' . $e->getMessage());
            return response()->json(['error' => 'Error sending push notification: ' . $e->getMessage()], 500);
        }
    }

    /*
     * check login user is fan and is card verified or not
     */
    public static function checkGifterCardVerificationStatus(): bool
    {
        /** @var \App\Models\User|null $user */
        $user = Auth::user();
        if (!$user) {
            // No user logged in - this is normal for guest checkouts
            return false;
        }
        try {

            if ($user->role != 0) {
                return false;
            }

            $totalPaid = UserPayment::whereHas('fromUser')->where('from_user_id', $user->id)
                ->where('status', 'paid')
                ->get();

            if ($totalPaid->isEmpty()) {
                return false;
            }

            $convertedAmount = [];
            foreach ($totalPaid as $payment) {
                if ($payment->currency != 'GBP') {
                    $convertedAmount[] = Helpers::priceFormat($payment->currency, $payment->amount, 'GBP');
                } else {
                    $convertedAmount[] = $payment->amount;
                }
            }

            $totalAmountPaid = array_sum($convertedAmount);

            if ($user->is_500_limit_exceeded == 0 && $totalAmountPaid && $totalAmountPaid > 500) {
                $user->update(['profile_status_lock' => 1, 'is_500_limit_exceeded' => 1]);
                return true;
            }

            return false;
        } catch (\Exception $e) {
            Log::error('Error retrieving authenticated user: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Build comprehensive Stripe metadata for payments with detailed user and transaction information
     *
     * @param string $type Payment type (support, wishlist, membership, bill, shop, etc.)
     * @param mixed $paymentModel Payment model instance
     * @param array $extra Additional metadata fields
     * @return array Formatted metadata array
     */
    public static function buildStripeMetadata(string $type, $paymentModel, array $extra = []): array
    {
        $baseMetadata = [];

        // Essential common metadata fields for all payment types
        $commonFields = [
            'platform' => 'SpennyPiggy',
            'payment_uuid' => (string) ($paymentModel->uuid ?? Uuid::uuid4()),
            'timestamp' => now()->format('Y-m-d H:i:s T'),
        ];

        switch ($type) {
            case 'support':
            case 'support_payment':
            case 'tip_jar':
                $buyer = $paymentModel->user ?? null;
                $creator = $paymentModel->creator ?? null;
                $supporterName = $buyer ? $buyer->name : ($paymentModel->guest_name ?? $paymentModel->name ?? 'Anonymous');
                $supporterEmail = $buyer ? $buyer->email : ($paymentModel->guest_email ?? $paymentModel->email ?? 'anonymous@spennypiggy.co');

                $baseMetadata = array_merge($commonFields, [
                    'type' => 'support_payment',

                    // Essential Supporter Information
                    'supporter_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'supporter_name' => $supporterName,
                    'supporter_email' => $supporterEmail,
                    'anonymous' => (string) ($paymentModel->anonymous ?? '0'),

                    // Essential Creator Information
                    'creator_id' => (string) $paymentModel->creator_id,
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',

                    // Support Details
                    'support_goal_id' => (string) ($paymentModel->tip_goal_id ?? ''),
                    'message' => $paymentModel->message ? substr($paymentModel->message, 0, 200) : '',
                    'deliverable_type' => 'supporter_access',
                    'access_duration_days' => '30',
                ]);
                break;

            case 'wishlist':
            case 'wishlist_contribution':
                $buyer = $paymentModel->user ?? null;
                $creator = $paymentModel->owner ?? $paymentModel->creator ?? null;
                $wishItem = $paymentModel->wish_item ?? null;

                $baseMetadata = array_merge($commonFields, [
                    'type' => 'wishlist_payment',

                    // Essential Buyer Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $buyer ? $buyer->name : ($paymentModel->name ?? 'Anonymous'),
                    'buyer_email' => $buyer ? $buyer->email : ($paymentModel->email ?? 'anonymous@spennypiggy.co'),
                    'anonymous' => (string) ($paymentModel->anonymous ?? '0'),

                    // Essential Creator Information
                    'creator_id' => (string) ($paymentModel->owner_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',

                    // Essential Product Information
                    'wish_item_id' => (string) ($paymentModel->wish_item_id ?? ''),
                    'wish_name' => $wishItem ? substr($wishItem->name ?? 'Wishlist Content', 0, 100) : 'Wishlist Content',
                    'deliverable_type' => 'wish_content',
                    'has_content' => $wishItem && (!empty($wishItem->content_file) || !empty($wishItem->reward)) ? '1' : '0',
                ]);
                break;

            case 'membership':
            case 'membership_subscription':
                $subscriber = $paymentModel->user ?? null;
                $creator = $paymentModel->membership->user ?? $paymentModel->creator ?? null;
                $membership = $paymentModel->membership ?? null;

                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Creator Membership Subscription Payment',
                    'payment_category' => 'membership_subscription',
                    'product_type' => 'membership_level',

                    // Subscriber Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $subscriber ? $subscriber->name : ($paymentModel->name ?? $paymentModel->guest_name ?? 'Anonymous'),
                    'buyer_username' => $subscriber ? $subscriber->username : 'guest',
                    'buyer_email' => $subscriber ? $subscriber->email : ($paymentModel->guest_email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $subscriber ? env('APP_URL') . '/' . $subscriber->username : '',

                    // Creator Information
                    'creator_id' => (string) ($membership->user_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',
                    'creator_profile_url' => $creator ? env('APP_URL') . '/' . $creator->username : '',

                    // Membership Details
                    'membership_id' => (string) ($paymentModel->membership_id ?? $membership->id ?? ''),
                    'membership_level' => $membership ? $membership->level : 'Unknown Level',
                    'membership_description' => $membership ? $membership->description : '',
                    'subscription_type' => $paymentModel->recurring_type ?? 'monthly',
                    'membership_price' => (string) ($membership->price ?? $paymentModel->amount ?? '0'),
                    'transaction_description' => 'Membership subscription: ' . ($membership ? $membership->level : 'Level') . ' for ' . ($creator ? $creator->name : 'creator'),
                ]);
                break;

            case 'wish_subscription':
            case 'wish_item_subscription':
                $subscriber = $paymentModel->user ?? null;
                $creator = $paymentModel->wish_item->user ?? $paymentModel->creator ?? null;
                $wishItem = $paymentModel->wish_item ?? null;

                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Recurring Wishlist Item Subscription Payment',
                    'payment_category' => 'wishlist_subscription',
                    'product_type' => 'wish_item_subscription',

                    // Subscriber Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $subscriber ? $subscriber->name : ($paymentModel->name ?? 'Anonymous'),
                    'buyer_username' => $subscriber ? $subscriber->username : 'guest',
                    'buyer_email' => $subscriber ? $subscriber->email : ($paymentModel->email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $subscriber ? env('APP_URL') . '/' . $subscriber->username : '',

                    // Creator Information
                    'creator_id' => (string) ($wishItem->user_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',
                    'creator_profile_url' => $creator ? env('APP_URL') . '/' . $creator->username : '',

                    // Subscription Details
                    'wish_item_id' => (string) ($paymentModel->wish_item_id ?? ''),
                    'wish_item_name' => $wishItem ? $wishItem->name : 'Wishlist Item',
                    'subscription_type' => $paymentModel->recurring_type ?? 'monthly',
                    'subscription_purpose' => $wishItem && $wishItem->subscription ? 'task_request' : 'wishlist_contribution',
                    'transaction_description' => 'Recurring subscription for wishlist item: ' . ($wishItem ? $wishItem->name : 'item'),
                ]);
                break;

            case 'bill':
            case 'bill_payment':
                $payer = $paymentModel->user ?? null;
                $creator = $paymentModel->bill->user ?? $paymentModel->creator ?? null;
                $bill = $paymentModel->bill ?? null;
                $payerName = $payer ? $payer->name : ($paymentModel->guest_name ?? $paymentModel->name ?? 'Anonymous');
                $payerEmail = $payer ? $payer->email : ($paymentModel->guest_email ?? $paymentModel->email ?? 'anonymous@spennypiggy.co');

                $baseMetadata = array_merge($commonFields, [
                    'type' => 'bill_payment',

                    // Essential Payer Information
                    'payer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'payer_name' => $payerName,
                    'payer_email' => $payerEmail,

                    // Essential Creator Information
                    'creator_id' => (string) ($bill->user_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',

                    // Essential Bill Information
                    'bill_id' => (string) ($paymentModel->bills_id ?? $bill->id ?? ''),
                    'bill_name' => $bill ? substr($bill->name, 0, 100) : 'Bill Payment',
                    'subscription_type' => $paymentModel->recurring_type ?? 'one_time',
                    'deliverable_type' => $bill && !empty($bill->content_file) ? 'digital_content' : 'bill_receipt',
                    'has_content' => $bill && !empty($bill->content_file) ? '1' : '0',
                ]);
                break;

            case 'shop':
            case 'shop_purchase':
                $buyer = $paymentModel->user ?? null;
                $creator = $paymentModel->shop->user ?? $paymentModel->creator ?? null;
                $shopItem = $paymentModel->shop ?? null;

                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Shop Item Purchase Payment',
                    'payment_category' => 'shop_purchase',
                    'product_type' => 'shop_item',

                    // Buyer Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $buyer ? $buyer->name : ($paymentModel->name ?? 'Anonymous'),
                    'buyer_username' => $buyer ? $buyer->username : 'guest',
                    'buyer_email' => $buyer ? $buyer->email : ($paymentModel->email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $buyer ? env('APP_URL') . '/' . $buyer->username : '',
                    'is_anonymous_purchase' => (string) ($paymentModel->anonymous ?? '0'),

                    // Shop Owner Information
                    'creator_id' => (string) ($shopItem->user_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',
                    'creator_profile_url' => $creator ? env('APP_URL') . '/' . $creator->username : '',

                    // Shop Item Details
                    'shop_item_id' => (string) ($paymentModel->shop_id ?? $shopItem->id ?? ''),
                    'shop_item_name' => $shopItem ? $shopItem->name : 'Shop Item',
                    'shop_item_description' => $shopItem ? $shopItem->description : '',
                    'shop_item_type' => $shopItem ? $shopItem->type : 'digital',
                    'quantity_purchased' => (string) ($paymentModel->quantity ?? '1'),
                    'variant_id' => (string) ($paymentModel->varient_id ?? ''),
                    'transaction_description' => 'Shop purchase: ' . ($shopItem ? $shopItem->name : 'item') . ' from ' . ($creator ? $creator->name : 'creator'),
                ]);
                break;

            case 'site_subscription':
            case 'mandatory_subscription':
                $subscriber = $paymentModel->user ?? null;

                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Mandatory Platform Access Subscription',
                    'payment_category' => 'site_subscription',
                    'product_type' => 'platform_subscription',

                    // Subscriber Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $subscriber ? $subscriber->name : ($paymentModel->name ?? 'Anonymous'),
                    'buyer_username' => $subscriber ? $subscriber->username : 'guest',
                    'buyer_email' => $subscriber ? $subscriber->email : ($paymentModel->email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $subscriber ? env('APP_URL') . '/' . $subscriber->username : '',

                    // Platform Information (SpennyPiggy is both platform and "creator")
                    'creator_id' => 'platform',
                    'creator_name' => 'SpennyPiggy Platform',
                    'creator_username' => 'spennypiggy',
                    'creator_profile_url' => env('APP_URL'),

                    // Subscription Details
                    'subscription_type' => 'monthly',
                    'subscription_amount' => (string) ($paymentModel->amount ?? '4.00'),
                    'currency' => (string) ($paymentModel->currency ?? 'GBP'),
                    'trial_period_days' => '3',
                    'subscription_description' => 'Mandatory monthly subscription for platform access',
                    'transaction_description' => 'Monthly platform access subscription for ' . ($subscriber ? $subscriber->name : 'user'),
                ]);
                break;

            default:
                Log::warning('Unknown payment type for metadata builder', ['type' => $type]);
                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'General Payment Transaction',
                    'payment_category' => 'general_payment',
                    'product_type' => 'unknown',
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'transaction_description' => 'General payment transaction',
                ]);
                break;
        }

        // Merge with extra metadata and ensure all values are strings
        $metadata = array_merge($baseMetadata, $extra);

        // Convert all values to strings and sanitize
        foreach ($metadata as $key => $value) {
            if (is_bool($value)) {
                $metadata[$key] = $value ? '1' : '0';
            } elseif (is_null($value)) {
                $metadata[$key] = 'null';
            } elseif (is_array($value) || is_object($value)) {
                $metadata[$key] = json_encode($value);
            } else {
                $metadata[$key] = (string) $value;
            }

            // Truncate if too long (Stripe limit: 500 chars per value)
            if (strlen($metadata[$key]) > 500) {
                $metadata[$key] = substr($metadata[$key], 0, 497) . '...';
                Log::warning('Stripe metadata value truncated', [
                    'key' => $key,
                    'original_length' => strlen((string) $value)
                ]);
            }
        }

        return $metadata;
    }
}
