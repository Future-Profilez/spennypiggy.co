<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class MagicBellProxyController extends Controller
{
    public function __invoke(Request $request, ?string $path = null)
    {
        if ($request->isMethod('options')) {
            return response()->noContent(204);
        }

        $baseUrl = config('services.magicbell.url', env('MAGICBELL_API_URL', 'https://api.magicbell.com'));
        $url = rtrim($baseUrl, '/') . '/' . ltrim($path ?? '', '/');

        $apiKey = env('MAGICBELL_API_KEY') ?: $request->header('X-MagicBell-Api-Key') ?: $request->header('X-MAGICBELL-API-KEY');

        $headers = [
            'Accept' => $request->header('Accept', 'application/json'),
            'X-MAGICBELL-API-KEY' => $apiKey,
        ];

        $apiSecret = env('MAGICBELL_API_SECRET');
        if ($apiSecret) {
            $headers['X-MAGICBELL-API-SECRET'] = $apiSecret;
        }

        if ($request->hasHeader('Idempotency-Key')) {
            $headers['Idempotency-Key'] = $request->header('Idempotency-Key');
        }

        if ($request->hasHeader('X-MagicBell-Client-User-Agent')) {
            $headers['X-MagicBell-Client-User-Agent'] = $request->header('X-MagicBell-Client-User-Agent');
        }

        $user = $request->user();
        if ($user && $user->email) {
            $headers['X-MAGICBELL-USER-EMAIL'] = $user->email;
        }

        $pending = Http::withHeaders($headers);

        $body = $request->getContent();
        if ($body !== '' && !in_array($request->method(), ['GET', 'HEAD'], true)) {
            $pending = $pending->withBody($body, $request->header('Content-Type', 'application/json'));
        }

        try {
            $upstream = $pending->timeout(10)->send($request->method(), $url, ['query' => $request->query()]);
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            \Illuminate\Support\Facades\Log::warning("MagicBell Proxy Connection Timeout: " . $e->getMessage());
            return response()->json(['error' => 'MagicBell service timeout'], 504);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("MagicBell Proxy Error: " . $e->getMessage());
            return response()->json(['error' => 'MagicBell service unavailable'], 502);
        }

        $response = response($upstream->body(), $upstream->status());

        $contentType = $upstream->header('Content-Type');
        if ($contentType) {
            $response->header('Content-Type', $contentType);
        }

        return $response;
    }
}
