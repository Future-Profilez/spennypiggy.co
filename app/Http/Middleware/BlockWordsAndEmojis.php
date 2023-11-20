<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Emoji\Emoji;
use Symfony\Component\HttpFoundation\Response;

class BlockWordsAndEmojis
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next)
    {
        $blockedWords = ['Paypig', 'Findom', 'Worship', 'Unlock', 'Unblock', 'Receive'];
        $blockedEmojis = ['😈', '💩', '💬', '👅', '🍆', '🍌', '🌽', '🌶️', '🍑', '💎', '💦'];

        foreach ($blockedWords as $word) {
            if (stripos($request->getContent(), $word) !== false) {
                return redirect()->back()->with('error', "These words are blocked.");
                // return response()->json(['error' => 'Blocked word found.'], 403);
            }
        }

        foreach ($blockedEmojis as $emoji) {
            $emojiPattern = preg_quote($emoji);
            if (preg_match("/$emojiPattern/u", $request->getContent())) {
                return back()->with('error', "These emojis are blocked.");
            }
        }


        return $next($request);
    }
}
