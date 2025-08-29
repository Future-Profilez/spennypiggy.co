<?php

namespace App;

use App\Models\Currency;
use App\Models\GifterCardVerification;
use App\Models\User;
use App\Models\UserPayment;
use App\Models\UserVerificationStatus;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Ramsey\Uuid\Uuid;
use Image;

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




    public static function priceFormat($currency1, $amount, $currency2)
    {
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
        return round($prof_cur_price, $decimalPlaces, PHP_ROUND_HALF_UP);
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

        foreach ($tags as $key => $tag) {
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

            $totalPaid = array_sum($convertedAmount);

            if ($user->is_500_limit_exceeded == 0 && $totalPaid && $totalPaid > 500) {
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
        
        // Common metadata fields for all payment types
        $commonFields = [
            'platform' => 'SpennyPiggy',
            'environment' => env('APP_ENV', 'production'),
            'payment_uuid' => $paymentModel->uuid ?? Uuid::uuid4(),
            'created_at' => now()->toISOString(),
        ];
        
        switch ($type) {
            case 'support':
            case 'tip_jar':
                $buyer = $paymentModel->user ?? null;
                $creator = $paymentModel->creator ?? null;
                
                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Support Payment',
                    'payment_category' => 'support_payment',
                    'product_type' => 'support',
                    
                    // Buyer/Gifter Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $buyer ? $buyer->name : ($paymentModel->name ?? 'Anonymous'),
                    'buyer_username' => $buyer ? $buyer->username : 'guest',
                    'buyer_email' => $buyer ? $buyer->email : ($paymentModel->email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $buyer ? env('APP_URL') . '/' . $buyer->username : '',
                    
                    // Creator/Owner Information
                    'creator_id' => (string) $paymentModel->creator_id,
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',
                    'creator_profile_url' => $creator ? env('APP_URL') . '/' . $creator->username : '',
                    
                    // Transaction Details
                    'support_type' => 'leaderboard_unlock',
                    'transaction_description' => 'Support payment for creator ' . ($creator ? $creator->name : 'Unknown'),
                ]);
                break;
                
            case 'wishlist':
            case 'wishlist_contribution':
                $buyer = $paymentModel->user ?? null;
                $creator = $paymentModel->owner ?? $paymentModel->creator ?? null;
                $wishItem = $paymentModel->wish_item ?? null;
                
                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Wishlist Item Contribution Payment',
                    'payment_category' => 'wishlist_contribution',
                    'product_type' => 'wish_item',
                    
                    // Buyer/Gifter Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $buyer ? $buyer->name : ($paymentModel->name ?? 'Anonymous'),
                    'buyer_username' => $buyer ? $buyer->username : 'guest',
                    'buyer_email' => $buyer ? $buyer->email : ($paymentModel->email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $buyer ? env('APP_URL') . '/' . $buyer->username : '',
                    'is_anonymous_gift' => (string) ($paymentModel->anonymous ?? '0'),
                    
                    // Creator/Owner Information
                    'creator_id' => (string) ($paymentModel->owner_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',
                    'creator_profile_url' => $creator ? env('APP_URL') . '/' . $creator->username : '',
                    
                    // Product Details
                    'wish_item_id' => (string) ($paymentModel->wish_item_id ?? ''),
                    'wish_item_name' => $wishItem ? $wishItem->name : 'Wishlist Item',
                    'wish_item_description' => $wishItem ? $wishItem->description : '',
                    'transaction_description' => 'Wishlist contribution for ' . ($wishItem ? $wishItem->name : 'item'),
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
                
                $baseMetadata = array_merge($commonFields, [
                    'purpose' => 'Creator Bill Payment',
                    'payment_category' => 'bill_payment',
                    'product_type' => 'bill',
                    
                    // Payer Information
                    'buyer_id' => (string) ($paymentModel->user_id ?? 'guest'),
                    'buyer_name' => $payer ? $payer->name : ($paymentModel->name ?? $paymentModel->guest_name ?? 'Anonymous'),
                    'buyer_username' => $payer ? $payer->username : 'guest',
                    'buyer_email' => $payer ? $payer->email : ($paymentModel->guest_email ?? 'anonymous@spennypiggy.co'),
                    'buyer_profile_url' => $payer ? env('APP_URL') . '/' . $payer->username : '',
                    
                    // Bill Creator Information
                    'creator_id' => (string) ($bill->user_id ?? $paymentModel->creator_id),
                    'creator_name' => $creator ? $creator->name : 'Unknown Creator',
                    'creator_username' => $creator ? $creator->username : '',
                    'creator_profile_url' => $creator ? env('APP_URL') . '/' . $creator->username : '',
                    
                    // Bill Details
                    'bill_id' => (string) ($paymentModel->bills_id ?? $bill->id ?? ''),
                    'bill_name' => $bill ? $bill->name : 'Bill Payment',
                    'bill_description' => $bill ? $bill->description : '',
                    'subscription_type' => $paymentModel->recurring_type ?? 'one_time',
                    'recurring_for' => (string) ($paymentModel->recurring_for ?? 'one_time'),
                    'transaction_description' => 'Bill payment: ' . ($bill ? $bill->name : 'payment') . ' for ' . ($creator ? $creator->name : 'creator'),
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
