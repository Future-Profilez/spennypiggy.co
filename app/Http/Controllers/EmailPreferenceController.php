<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Carbon\Carbon;

class EmailPreferenceController extends Controller
{
    /**
     * Show the email preferences page for authenticated user
     */
    public function showPreferences(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return redirect()->route('login')->with('error', 'Please log in to manage your email preferences.');
        }

        return inertia('EmailPreference/Index', [
            'user' => $user,
            'canManageMarketing' => true,
        ]);
    }

    /**
     * Update email marketing preferences for authenticated user
     */
    public function updatePreferences(Request $request)
    {
        $request->validate([
            'marketing_emails_enabled' => 'required|boolean',
        ]);

        $user = $request->user();

        if (!$user) {
            return redirect()->route('login')->with('error', 'Please log in to update your email preferences.');
        }

        // Log the change for audit
        self::logPreferenceChange(
            $user->id,
            $user->marketing_emails_enabled,
            $request->input('marketing_emails_enabled'),
            'settings_page'
        );

        // Update the user's preference
        $user->update([
            'marketing_emails_enabled' => $request->input('marketing_emails_enabled'),
            'marketing_unsubscribed_at' => !$request->input('marketing_emails_enabled') ? now() : null,
        ]);

        return redirect()->back()->with('success', 'Your email preferences have been updated successfully.');
    }

    public function updatePreferencesFromThankyou(Request $request)
    {
        $request->validate([
            'marketing_emails_enabled' => 'required|boolean',
        ]);

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'status' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $newValue = (bool) $request->boolean('marketing_emails_enabled');
        $oldValue = (bool) $user->marketing_emails_enabled;

        if ($oldValue !== $newValue) {
            self::logPreferenceChange(
                $user->id,
                $oldValue,
                $newValue,
                'thankyou_prompt'
            );

            $user->update([
                'marketing_emails_enabled' => $newValue,
                'marketing_unsubscribed_at' => !$newValue ? now() : null,
            ]);
        }

        return response()->json([
            'status' => true,
            'marketing_emails_enabled' => $newValue,
            'message' => $newValue
                ? 'Marketing emails enabled.'
                : 'Marketing emails disabled.',
        ]);
    }

    /**
     * Handle one-click unsubscribe via signed URL
     * No login required - user clicks link in email footer
     */
    public function unsubscribe(Request $request, $userId)
    {
        // Validate the signed URL signature
        if (!$request->hasValidSignature()) {
            Log::warning('EmailPreferenceController@unsubscribe: Invalid signature', [
                'user_id' => $userId,
                'url' => $request->url()
            ]);

            return redirect('/')->with('error', 'Invalid or expired unsubscribe link. Please contact support if you need help unsubscribing.');
        }

        $user = User::find($userId);

        if (!$user) {
            return redirect('/')->with('error', 'Invalid unsubscribe link.');
        }

        // Only process if user is currently subscribed to marketing emails
        if ($user->marketing_emails_enabled) {
            // Log the change for audit
            self::logPreferenceChange(
                $user->id,
                $user->marketing_emails_enabled,
                false,
                'unsubscribe_link'
            );

            // Update the user's preference
            $user->update([
                'marketing_emails_enabled' => false,
                'marketing_unsubscribed_at' => now(),
            ]);

            return redirect('/')->with('success', 'You have been successfully unsubscribed from marketing emails.');
        } else {
            return redirect('/')->with('info', 'You are already unsubscribed from marketing emails.');
        }
    }

    /**
     * Generate a secure token for one-click unsubscribe links
     */
    public static function generateUnsubscribeToken(User $user)
    {
        return URL::temporarySignedRoute(
            'email.unsubscribe',
            now()->addHours(24),
            ['user' => $user->id]
        );
    }

    /**
     * Log preference changes for audit trail
     */
    public function __construct()
    {
    }

    public static function handleMarketingOptIn($userId): void
    {
        if (!request()->has('marketing_opt_in') || !request()->input('marketing_opt_in')) {
            return;
        }

        $user = \App\Models\User::find($userId);
        if (!$user) {
            return;
        }

        if ($user->marketing_emails_enabled) {
            return;
        }

        self::logPreferenceChange(
            $user->id,
            $user->marketing_emails_enabled,
            true,
            'checkout_opt_in'
        );

        $user->update([
            'marketing_emails_enabled' => true,
            'marketing_unsubscribed_at' => null,
        ]);
    }

    public static function logPreferenceChange($userId, $oldValue, $newValue, $source)
    {
        \App\Models\EmailPreferenceLog::create([
            'user_id' => $userId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'source' => $source,
        ]);
    }
}
