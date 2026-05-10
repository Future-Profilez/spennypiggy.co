<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class ReportController extends Controller
{
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'reporter_name' => 'required|string|max:255',
            'reporter_email' => 'required|email|max:255',
            'reported_url' => 'required|url|max:2048',
            'reported_username' => 'nullable|string|exists:users,username',
            'reason' => 'required|string|min:10',
            'good_faith_confirmed' => 'required|accepted',
            'cf_turnstile_response' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Validate Turnstile if it's provided and we have a secret key configured
        $turnstileSecret = env('TURN_SECRET');
        if (!empty($turnstileSecret)) {
            if (!$request->filled('cf_turnstile_response')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please complete the CAPTCHA verification.',
                ], 422);
            }

            $verifyResponse = Http::asForm()->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                'secret' => $turnstileSecret,
                'response' => $request->input('cf_turnstile_response'),
                'remoteip' => $request->ip(),
            ]);

            $verifyBody = $verifyResponse->json();
            if (!isset($verifyBody['success']) || !$verifyBody['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'CAPTCHA verification failed. Please try again.',
                ], 422);
            }
        }

        $reportedUserId = null;
        if ($request->reported_username) {
            $user = User::where('username', $request->reported_username)->first();
            if ($user) {
                $reportedUserId = $user->id;
            }
        }

        $report = Report::create([
            'reporter_name' => $request->reporter_name,
            'reporter_email' => $request->reporter_email,
            'reported_url' => $request->reported_url,
            'reported_user_id' => $reportedUserId,
            'reason' => $request->reason,
            'status' => 'pending',
            'good_faith_confirmed' => $request->good_faith_confirmed == 'true' || $request->good_faith_confirmed === true ? 1 : 0,
        ]);

        // Send email to admin (optional, or we can just rely on the admin panel)
        // Log::info('New DMCA Report submitted: ' . $report->id);

        return response()->json([
            'success' => true,
            'message' => 'Your report has been successfully submitted. We will review it shortly.'
        ]);
    }
}
