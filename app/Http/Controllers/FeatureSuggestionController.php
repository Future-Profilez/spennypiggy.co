<?php

namespace App\Http\Controllers;

use App\EmailService;
use App\Mail\FeatureSuggestionStatusMail;
use App\Models\FeatureSuggestion;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class FeatureSuggestionController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'suggestion' => 'required|string|max:2000',
            'email' => 'nullable|email',
            'name' => 'nullable|string|max:255',
            'image_url' => 'nullable|string',
            'image_uuid' => 'nullable|string',
        ]);

        $data = $request->only(['suggestion', 'email', 'name', 'image_url', 'image_uuid']);

        if (Auth::check()) {
            $data['user_id'] = Auth::id();
            $data['user_email'] = Auth::user()->email;
            $data['user_name'] = Auth::user()->name;
        }

        $suggestion = FeatureSuggestion::create([
            'user_id' => $data['user_id'] ?? null,
            'name' => $data['name'] ?? null,
            'email' => $data['email'] ?? null,
            'suggestion' => $data['suggestion'],
            'image_url' => $data['image_url'] ?? null,
            'image_uuid' => $data['image_uuid'] ?? null,
        ]);

        EmailService::featureSuggestion($data);

        return back()->with('success', 'Thank you for your suggestion!');
    }

    public function updateStatus(Request $request, FeatureSuggestion $suggestion)
    {
        $request->validate([
            'status' => 'required|in:pending,accepted,under_review,planned,rejected',
            'admin_notes' => 'nullable|string|max:1000',
        ]);

        $oldStatus = $suggestion->status;
        $suggestion->update([
            'status' => $request->status,
            'admin_notes' => $request->admin_notes,
        ]);

        // Notify user whenever status changes (any non-pending status)
        $recipientEmail = $suggestion->email ?? $suggestion->user?->email;
        $statusChanged = $request->status !== $oldStatus;
        $shouldNotify = $statusChanged
            && $request->status !== 'pending'
            && $recipientEmail;

        $recipientUser = $suggestion->user;
        $canSendEmail = User::shouldSendEmail($recipientUser);

        if ($shouldNotify && $canSendEmail) {
            try {
                Mail::to($recipientEmail)->send(new FeatureSuggestionStatusMail($suggestion));
            } catch (\Exception $e) {
                Log::error('FeatureSuggestion status email failed', ['error' => $e->getMessage()]);
            }
        }

        return back()->with('success', 'Status updated.');
    }
}
