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


    public static function priceFormat($currency, $amount)
    {
        $cur = Currency::where('ISO', strtoupper($currency))->first();

        $gbp = Currency::where('ISO', 'GBP')->first();

        $rate = $cur->conversion_rate * $amount;

        $real = $rate * $gbp->conversion_rate;

        return round($real, 2, PHP_ROUND_HALF_UP);
    }
}
