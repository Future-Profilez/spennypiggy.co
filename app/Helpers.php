<?php

namespace App;

use App\Models\Currency;
use Illuminate\Support\Facades\Storage;
use Image;

class Helpers
{
    public static function checkBlockData($request)
    {
        $blockedWords = ['Paypig', 'Findom', 'Worship', 'Unlock', 'Unblock', 'Receive'];
        $blockedEmojis = ['😈', '💩', '💬', '👅', '🍆', '🍌', '🌽', '🌶️', '🍑', '💎', '💦'];
        foreach ($blockedWords as $word) {
            if (stripos($request->getContent(), $word) !== false) {
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
}
