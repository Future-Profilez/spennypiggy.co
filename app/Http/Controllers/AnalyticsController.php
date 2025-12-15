<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Models\SearchClick;

class AnalyticsController extends Controller
{
    public function searchClick(Request $request)
    {
        $validated = $request->validate([
            'creator_id' => 'nullable|integer',
            'creator_username' => 'nullable|string',
        ]);

        try {
            $userId = Auth::id();
            $creatorId = $validated['creator_id'] ?? null;

            if (!$creatorId && !empty($validated['creator_username'])) {
                $u = \App\Models\User::where('username', $validated['creator_username'])->select('id')->first();
                if ($u) { $creatorId = $u->id; }
            }

            if (!$creatorId) {
                $ref = $request->headers->get('referer');
                if ($ref) {
                    $path = parse_url($ref, PHP_URL_PATH);
                    $segments = array_values(array_filter(explode('/', $path)));
                    $username = $segments[0] ?? null;
                    if ($username) {
                        $u = \App\Models\User::where('username', $username)->select('id')->first();
                        if ($u) { $creatorId = $u->id; }
                    }
                }
            }

            if (!$creatorId) {
                return response()->json(['status' => false], 422);
            }
            $ip = $request->ip();
            $ua = $request->header('User-Agent') ?? '';

            $uaStr = strtolower($ua);
            $isBot = false;
            foreach (['bot','crawl','spider','slurp','bingpreview','facebookexternalhit','monitor','headless','phantom','puppeteer'] as $k) {
                if (strpos($uaStr, $k) !== false) { $isBot = true; break; }
            }
            if ($isBot) {
                return response()->json(['status' => true]);
            }

            $recentWindow = now()->subMinutes(1);
            if ($userId) {
                $exists = SearchClick::where('creator_id', $creatorId)
                    ->where('user_id', $userId)
                    ->where('created_at', '>=', $recentWindow)
                    ->exists();
                if ($exists) {
                    return response()->json(['status' => true]);
                }
            } else if ($ip) {
                $exists = SearchClick::where('creator_id', $creatorId)
                    ->where('ip_address', $ip)
                    ->where('created_at', '>=', $recentWindow)
                    ->exists();
                if ($exists) {
                    return response()->json(['status' => true]);
                }
            }

            $todayStart = now()->startOfDay();
            $dailyCapUser = 50;
            $dailyCapIp = 100;
            if ($userId) {
                $count = SearchClick::where('user_id', $userId)
                    ->where('created_at', '>=', $todayStart)
                    ->count();
                if ($count >= $dailyCapUser) {
                    return response()->json(['status' => true]);
                }
            } else if ($ip) {
                $count = SearchClick::where('ip_address', $ip)
                    ->where('created_at', '>=', $todayStart)
                    ->count();
                if ($count >= $dailyCapIp) {
                    return response()->json(['status' => true]);
                }
            }

            SearchClick::create([
                'creator_id' => $creatorId,
                'user_id' => $userId,
                'ip_address' => $ip,
                'user_agent' => $ua,
                'referer' => $request->headers->get('referer'),
            ]);

            return response()->json(['status' => true]);
        } catch (\Throwable $e) {
            Log::warning('Failed to record search click', [
                'error' => $e->getMessage(),
                'creator_id' => $validated['creator_id'] ?? null,
            ]);
            return response()->json(['status' => false], 500);
        }
    }
}
