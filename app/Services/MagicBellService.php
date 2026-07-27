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
        $this->apiKey = config('services.magicbell.key');
        $this->apiSecret = config('services.magicbell.secret');
        $this->apiUrl = config('services.magicbell.url', 'https://api.magicbell.com');
    }

    public function sendNotification($title, $content, $email)
    {
        if (empty($email) || ! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            Log::warning('MagicBellService::sendNotification: Invalid or missing recipient email', ['email' => $email, 'title' => $title]);

            return false;
        }

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
            if (empty($this->apiKey) || empty($this->apiSecret)) {
                Log::error('MagicBellService::sendNotification: Missing MagicBell credentials');

                return false;
            }

            $response = Http::withHeaders([
                'X-MAGICBELL-API-KEY' => $this->apiKey,
                'X-MAGICBELL-API-SECRET' => $this->apiSecret,
                'Accept' => 'application/json',
            ])->post($this->apiUrl . '/notifications', $payload);

            if ($response->successful()) {
                Log::info('MagicBell push notification sent successfully: ' . $title, ['email' => $email]);
                return true;
            }

            Log::error('Failed to send push notification', [
                'status' => $response->status(),
                'reason' => $response->reason(),
                'body' => $response->body(),
            ]);

            return false;
        } catch (\Exception $e) {
            Log::error('Error sending push notification: ' . $e->getMessage());
            return false;
        }
    }
}
