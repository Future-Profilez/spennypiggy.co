<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class MagicBellService
{
    protected $client;
    protected $apiKey;
    protected $apiSecret;
    protected $apiUrl;

    public function __construct()
    {
        $this->client = new Client();
        $this->apiKey = env('MAGICBELL_API_KEY');
        $this->apiSecret = env('MAGICBELL_API_SECRET');
        $this->apiUrl = env('MAGICBELL_API_URL', 'https://api.magicbell.com');
    }

    public function sendNotification($title, $content, $email)
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
                'X-MAGICBELL-API-KEY' => $this->apiKey,
                'X-MAGICBELL-API-SECRET' => $this->apiSecret,
                'Accept' => 'application/json',
            ])->post('https://api.magicbell.com/notifications', $payload);

            // Log::info('MagicBell API response status: ' . $response->status());
            // Log::info('MagicBell API response body: ' . $response->body());

            if ($response->successful()) {
                Log::error('Notification sent successfully: ' . $response);
                return true;
            }
            Log::error('Failed to send push notification: ' . $response->reason());
            return true;
        } catch (\Exception $e) {
            Log::error('Error sending push notification: ' . $e->getMessage());
            return true;
        }
    }
}
