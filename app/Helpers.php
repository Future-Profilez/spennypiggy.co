<?php

namespace App;

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
}
