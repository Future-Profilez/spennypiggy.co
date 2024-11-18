<?php

namespace App;

use App\Models\Currency;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Image;

class Helpers
{
    public static function checkBlockData($request)
    {
        $blockedWords = ['paypig', 'findom', 'worship', 'unlock', 'unblock', 'receive','tax','fee','session','deposit','tribute','dick','goddess','master','mistress'];
        Log::info("request -". json_encode($request->all(),true));
        $blockedEmojis = ['😈', '💩', '💬', '👅', '🍆', '🍌', '🌽', '🌶️', '🍑', '💎', '💦'];
        foreach ($blockedWords as $key => $word) {
            if (stripos($request->getContent(), $word) !== false) {
                Log::info("word -$key ". $word);
                Log::info("word -request->getContent() ". $request->getContent());
                // return response()->json([
                //     'status' => true,
                //     'message' => 'Some restricted words are not allowed.',
                // ]);
                return true;
                // return redirect()->route('home')->with('error', "These words are not allowed.");
            }
        }

        foreach ($blockedEmojis as $emoji) {
            $emojiPattern = preg_quote($emoji);
            if (preg_match("/$emojiPattern/u", $request->getContent())) {
                // return response()->json([
                //     'status' => true,
                //     'message' => 'Some restricted emojis are not allowed.',
                // ]);
                return true;

                // return redirect()->route('home')->with('error', "These emojis are not allowed.");
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


    public static function getCurrency($currency){

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
}
