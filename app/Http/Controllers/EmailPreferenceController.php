<?php

namespace App\Http\Controllers;

use App\Models\EmailPreferenceLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;

class EmailPreferenceController extends Controller
{
    /**
     * Opt-out categories the user controls, and the column behind each.
     *
     * Security, legal and transactional mail is deliberately absent — it must
     * always send, so there is no switch for it. `marketing_emails_enabled` is
     * handled separately because it also stamps `marketing_unsubscribed_at`.
     */
    public const CATEGORIES = [
        'product_updates_enabled',
        'creator_updates_enabled',
        'reactivation_emails_enabled',
        'push_notifications_enabled',
    ];

    /**
     * Show the email preferences page for authenticated user
     */
    public function showPreferences(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login')->with('error', 'Please log in to manage your email preferences.');
        }

        return inertia('EmailPreference/Index', [
            'user' => $user,
            'canManageMarketing' => true,
            'preferences' => self::preferencesFor($user),
        ]);
    }

    /** Current state of every switchable category, defaulting to on. */
    public static function preferencesFor(User $user): array
    {
        $values = ['marketing_emails_enabled' => (bool) ($user->marketing_emails_enabled ?? true)];

        foreach (self::CATEGORIES as $column) {
            $values[$column] = (bool) ($user->{$column} ?? true);
        }

        return $values;
    }

    /**
     * Update communication preferences for authenticated user.
     *
     * Every field is optional so the page can submit a single toggle without
     * clobbering the others; only what was actually sent is written.
     */
    public function updatePreferences(Request $request)
    {
        $rules = ['marketing_emails_enabled' => 'sometimes|boolean'];

        foreach (self::CATEGORIES as $column) {
            $rules[$column] = 'sometimes|boolean';
        }

        $request->validate($rules);

        $user = $request->user();

        if (! $user) {
            return redirect()->route('login')->with('error', 'Please log in to update your email preferences.');
        }

        $updates = [];

        if ($request->has('marketing_emails_enabled')) {
            $newValue = $request->boolean('marketing_emails_enabled');

            if ((bool) $user->marketing_emails_enabled !== $newValue) {
                self::logPreferenceChange($user->id, $user->marketing_emails_enabled, $newValue, 'settings_page');
            }

            $updates['marketing_emails_enabled'] = $newValue;
            $updates['marketing_unsubscribed_at'] = $newValue ? null : now();
        }

        foreach (self::CATEGORIES as $column) {
            if ($request->has($column)) {
                $newValue = $request->boolean($column);

                if ((bool) ($user->{$column} ?? true) !== $newValue) {
                    self::logPreferenceChange($user->id, $user->{$column}, $newValue, 'settings_page:'.$column);
                }

                $updates[$column] = $newValue;
            }
        }

        if (! empty($updates)) {
            $user->update($updates);
        }

        return redirect()->back()->with('success', 'Your communication preferences have been updated.');
    }

    public function updatePreferencesFromThankyou(Request $request)
    {
        $request->validate([
            'marketing_emails_enabled' => 'required|boolean',
        ]);

        $user = $request->user();
        if (! $user) {
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
                'marketing_unsubscribed_at' => ! $newValue ? now() : null,
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
        if (! $request->hasValidSignature()) {
            Log::warning('EmailPreferenceController@unsubscribe: Invalid signature', [
                'user_id' => $userId,
                'url' => $request->url(),
            ]);

            return redirect('/')->with('error', 'Invalid or expired unsubscribe link. Please contact support if you need help unsubscribing.');
        }

        $user = User::find($userId);

        if (! $user) {
            return redirect('/')->with('error', 'Invalid unsubscribe link.');
        }

        // Which category this link turns off. Signed into the URL, so a user can
        // stop (say) creator updates from that email's footer without also losing
        // product announcements. Defaults to marketing for older links.
        $category = $request->query('category', 'marketing_emails_enabled');

        if (! in_array($category, array_merge(['marketing_emails_enabled'], self::CATEGORIES), true)) {
            $category = 'marketing_emails_enabled';
        }

        $label = self::categoryLabel($category);

        if (! ($user->{$category} ?? true)) {
            return redirect('/')->with('info', "You are already unsubscribed from {$label}.");
        }

        // Keep the plain source for the marketing opt-out — the existing audit
        // view and CSV export filter on that exact value. Only the new
        // category-specific links get a suffix.
        $source = $category === 'marketing_emails_enabled'
            ? 'unsubscribe_link'
            : 'unsubscribe_link:'.$category;

        self::logPreferenceChange($user->id, $user->{$category}, false, $source);

        $updates = [$category => false];

        if ($category === 'marketing_emails_enabled') {
            $updates['marketing_unsubscribed_at'] = now();
        }

        $user->update($updates);

        return redirect('/')->with('success', "You have been unsubscribed from {$label}.");
    }

    /** Human-readable name for a preference column, used in unsubscribe messages. */
    public static function categoryLabel(string $column): string
    {
        return match ($column) {
            'product_updates_enabled' => 'product updates',
            'creator_updates_enabled' => 'creator updates',
            'reactivation_emails_enabled' => 'reminder emails',
            'push_notifications_enabled' => 'push notifications',
            default => 'marketing emails',
        };
    }

    /**
     * Generate a secure token for one-click unsubscribe links.
     *
     * Pass a category column to make the link turn off just that category;
     * omit it and the link behaves as before (marketing opt-out).
     */
    public static function generateUnsubscribeToken(User $user, ?string $category = null)
    {
        $params = ['user' => $user->id];

        if ($category && in_array($category, self::CATEGORIES, true)) {
            $params['category'] = $category;
        }

        return URL::temporarySignedRoute(
            'email.unsubscribe',
            now()->addHours(24),
            $params
        );
    }

    /**
     * Log preference changes for audit trail
     */
    public function __construct() {}

    public static function handleMarketingOptIn($userId): void
    {
        if (! request()->has('marketing_opt_in') || ! request()->input('marketing_opt_in')) {
            return;
        }

        $user = User::find($userId);
        if (! $user) {
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
        EmailPreferenceLog::create([
            'user_id' => $userId,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'source' => $source,
        ]);
    }
}
