<?php

namespace App\Http\Controllers;

use App\Services\MagicBellService;
use Illuminate\Http\Request;
use GuzzleHttp\Client;

class NotificationController extends Controller
{
    protected $magicBellService;

    public function __construct(MagicBellService $magicBellService)
    {
        $this->magicBellService = $magicBellService;
    }

    public function getUserKey()
    {
        $user = 'naveen@internetbusinesssolutionsindia.com';  // Get the authenticated user

        // Call MagicBell API to generate the user key
        $client = new Client();
        $response = $client->post('https://api.magicbell.com/users', [
            'headers' => [
                'X-MAGICBELL-API-KEY' => env('MAGICBELL_API_KEY'),
                'X-MAGICBELL-API-SECRET' => env('MAGICBELL_API_SECRET'),
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'user' => [
                    'email' => $user,  // Nest the email inside a user object
                ]
            ],
        ]);

        $data = json_decode($response->getBody()->getContents());
        return response()->json(['userKey' => $data->user->id]);
    }

    // Send notification to MagicBell
    public function sendNotification(Request $request)
    {
        $client = new Client();

        $response = $client->post('https://api.magicbell.com/notifications', [
            'headers' => [
                'X-MAGICBELL-API-KEY' => env('MAGICBELL_API_KEY'),
                'X-MAGICBELL-API-SECRET' => env('MAGICBELL_API_SECRET'),
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'notification' => [
                    'title' => $request->title,
                    'content' => $request->content,
                    'category' => 'general',
                    'recipients' => [
                        ['email' => $request->email],
                    ],
                ],
            ],
        ]);
        // return response()->json(['status' => 'Notification sent']);
        return $response;
    }

    public function testSendNotification(Request $request)
    {
        $client = new Client();

        $response = $client->post('https://api.magicbell.com/notifications', [
            'headers' => [
                'X-MAGICBELL-API-KEY' => env('MAGICBELL_API_KEY'),
                'X-MAGICBELL-API-SECRET' => env('MAGICBELL_API_SECRET'),
                'Content-Type' => 'application/json',
            ],
            'json' => [
                'notification' => [
                    'title' => $request->query('title')  ?? '🎉 You\'re in! Let\'s get started.',
                    'content' => $request->query('content') ?? 'Get paid with secure, trackable income — with built-in protection against disputes and chargebacks.',
                    'category' => 'general',
                    'recipients' => [
                        ['email' => $request->query('email')],
                    ],
                ],
            ],
        ]);
        return $response;
    }

    // public function sendNotification(Request $request)
    // {
    //     $request->validate([
    //         'email' => 'required|email',
    //         'title' => 'required|string',
    //         'content' => 'required|string',
    //     ]);
    //     $title = $request->input('title');
    //     $content = $request->input('content');
    //     $email = $request->input('email');
    //     $notification = $this->magicBellService->sendNotification($title, $content, $email);
    //     if ($notification) {
    //         return response()->json(['status' => 'success', 'message' => 'Notification sent successfully.']);
    //     }
    //     return response()->json(['status' => 'error', 'message' => 'Failed to send notification.'], 500);
    // }
}
