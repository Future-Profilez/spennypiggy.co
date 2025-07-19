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
use Image;

class Helpers
{
    public static function checkBlockData($request)
    {
        $blockedWords = ['paypig', 'findom', 'worship', 'unlock', 'unblock', 'receive', 'tax', 'fee', 'session', 'deposit', 'tribute', 'dick', 'goddess', 'master', 'mistress'];
        $blockedEmojis = ['😈', '💩', '💬', '👅', '🍆', '🍌', '🌽', '🌶️', '🍑', '💎', '💦'];

        $inputText = implode(' ', $request->all());

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

        $gbp_price = $amount / $def->conversion_rate;

        $prof_cur_price = $prof->conversion_rate * $gbp_price;

        return round($prof_cur_price, 2, PHP_ROUND_HALF_UP);
    }

    public static function checkUnsafeContent($uuid)
    {

        $rest_words = ['adult', '18+', 'pornographic', 'XXX', 'NSFW', 'blood', 'brutality', 'explicit', 'mature', 'weapons', 'aggression', 'combat', 'adult', 'adult', 'adult',];
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

        $data = $response->json();
        $tags = $data['appdata']['aws_rekognition_detect_moderation_labels']['data']['ModerationLabels'];

        $rest = false;

        foreach ($tags as $key => $tag) {
            $name = explode(" ", $tag['Name']);

            $common = array_intersect($rest_words, $name);

            if (count($common) > 0) {
                $rest = true;
            }
        }

        return $rest;
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
            Log::error('No authenticated user found.');
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
}
