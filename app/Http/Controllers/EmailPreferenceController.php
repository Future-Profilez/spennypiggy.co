<?php

namespace App\Http\Controllers;

use App\Models\AbandonedCheckout;
use App\Models\EmailPreferenceLog;
use App\Models\User;
use App\Services\AbandonedCheckoutService;
use App\Support\MarketingConsent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
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
        'birthday_emails_enabled',
        'reactivation_emails_enabled',
        'abandoned_checkout_emails_enabled',
        'restock_emails_enabled',
        'push_notifications_enabled',
    ];

    /**
     * How long an emailed preference link stays alive.
     *
     * 🚨 30 DAYS, NOT 24 HOURS, AND THAT IS THE POINT OF THIS FEATURE.
     *
     * The old 24-hour window meant a person who opened the email on Wednesday a
     * link sent on Monday got "Invalid or expired unsubscribe link" and was
     * bounced to the homepage — and if they cannot sign in (at the time, a
     * suspended creator was force-logged-out by `CheckSuspendedUser` on every web
     * request, and `/email-preferences` is behind `auth`) that was the END of the
     * road. ⚠️ That half is SUPERSEDED (3 Sep 2026): a suspended account signs in
     * and reads normally now. Somebody who genuinely cannot sign in — a deleted
     * or never-verified address — still depends on this link living 30 days. They
     * had NO WAY to stop the mail. `generateCheckoutReminderOptOut` already used
     * 30 days for exactly this reason: a dead unsubscribe link is worse than no
     * link at all.
     */
    public const LINK_TTL_DAYS = 30;

    /**
     * The preference centre, in plain language, defined ONCE.
     *
     * The point of the descriptions is that a person can turn off one thing
     * instead of everything — which they can only do if they know what each
     * switch actually sends. Read by both the signed-in page and the signed
     * no-login page, so the two can never describe the same switch differently.
     *
     * 🚨 SECURITY, LEGAL AND TRANSACTIONAL MAIL IS DELIBERATELY ABSENT FROM THIS
     * LIST AND FROM `CATEGORIES`. It has no column, no switch and no row here.
     * Never add one, and never route it through a consent-checking helper.
     *
     * @return array<int, array{key: string, title: string, description: string, group: string}>
     */
    public static function catalogue(): array
    {
        return [
            [
                'key' => 'marketing_emails_enabled',
                'title' => 'Promotions & offers',
                'description' => 'Campaigns, seasonal promotions and other marketing email from Spenny Piggy. Turning this off does not affect anything else on this page.',
                'group' => 'marketing',
            ],
            [
                'key' => 'product_updates_enabled',
                'title' => 'Product updates',
                'description' => 'New features, changes to how the platform works, and announcements about your account type.',
                'group' => 'platform',
            ],
            [
                'key' => 'creator_updates_enabled',
                'title' => 'Creator updates',
                'description' => 'News about creators you already support — new content, announcements and changes to what they offer.',
                'group' => 'creators',
            ],
            [
                'key' => 'birthday_emails_enabled',
                'title' => 'Birthdays',
                'description' => 'The Monday round-up of creator birthdays that week, and the reminders before the birthday of a creator you support.',
                'group' => 'creators',
            ],
            [
                'key' => 'reactivation_emails_enabled',
                'title' => 'Reminders & milestones',
                'description' => 'Occasional nudges about content waiting for you, and milestone messages about your own account.',
                'group' => 'platform',
            ],
            [
                'key' => 'abandoned_checkout_emails_enabled',
                'title' => 'Unfinished purchases',
                'description' => 'A reminder when you start a purchase and do not finish it, with a link back to your checkout.',
                'group' => 'purchases',
            ],
            [
                'key' => 'restock_emails_enabled',
                'title' => 'Back in stock',
                'description' => 'A one-off notice when an item you asked about becomes available again.',
                'group' => 'purchases',
            ],
            [
                'key' => 'push_notifications_enabled',
                'title' => 'Push & in-app notifications',
                'description' => 'Alerts on your device and in the notification bell. This one is not email — turning it off changes nothing about what arrives in your inbox.',
                'group' => 'platform',
            ],
        ];
    }

    /**
     * Show the email preferences page for authenticated user
     */
    public function showPreferences(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return redirect()->route('login')->with('error', 'Please log in to manage your email preferences.');
        }

        return inertia('EmailPreference/Index', self::pagePayload($user, signed: false));
    }

    /**
     * The props both preference pages render from.
     *
     * ⚠️ The signed page is reachable WITHOUT LOGGING IN, so it gets a
     * whitelisted, masked account shape — never the User model. The signed-in
     * page used to be handed the whole model; there is no reason for either of
     * them to carry more than the name of the account and the address the mail
     * goes to.
     *
     * @return array<string, mixed>
     */
    private static function pagePayload(User $user, bool $signed): array
    {
        return [
            'account' => [
                'name' => $user->name,
                'email' => $signed ? self::maskEmail($user->email) : $user->email,
            ],
            'categories' => self::catalogue(),
            'preferences' => self::preferencesFor($user),
            // The signed page has no session user, so its form must post back to
            // a signed URL of its own. Null on the authenticated page, which
            // posts to the ordinary named route.
            'updateUrl' => $signed ? self::generateManageUpdateToken($user) : null,
            'signed' => $signed,
        ];
    }

    /**
     * `naveen@gmail.com` -> `na***@gmail.com`.
     *
     * Whoever holds the link was sent it at this address, so this is a
     * reminder of which account they are editing rather than a secret. It is
     * masked anyway because a signed URL can be forwarded, and the page is
     * served with `Referrer-Policy: no-referrer` for the same reason.
     */
    private static function maskEmail(?string $email): string
    {
        $email = (string) $email;
        $at = strpos($email, '@');

        if ($at === false || $at < 1) {
            return '';
        }

        $local = substr($email, 0, $at);
        $keep = substr($local, 0, min(2, strlen($local)));

        return $keep.str_repeat('*', max(1, strlen($local) - strlen($keep))).substr($email, $at);
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
        $request->validate(self::validationRules());

        $user = $request->user();

        if (! $user) {
            return redirect()->route('login')->with('error', 'Please log in to update your email preferences.');
        }

        self::applyPreferences($user, $request, 'settings_page');

        return redirect()->back()->with('success', 'Your communication preferences have been updated.');
    }

    /**
     * ⚠️ EVERY FIELD IS `sometimes`, ON PURPOSE.
     *
     * The page can submit a single toggle without clobbering the others, and a
     * client that sends a partial payload never silently switches something off
     * that the person did not touch.
     *
     * @return array<string, string>
     */
    private static function validationRules(): array
    {
        $rules = ['marketing_emails_enabled' => 'sometimes|boolean'];

        foreach (self::CATEGORIES as $column) {
            $rules[$column] = 'sometimes|boolean';
        }

        return $rules;
    }

    /**
     * The ONE write path for a preference change made on a preference page.
     *
     * Shared by the signed-in page and the signed no-login page so the two can
     * never disagree about what gets written, what gets audited, or which
     * columns exist. Only what was actually submitted is written.
     *
     * 🚨 It can only ever write `marketing_emails_enabled` and the columns in
     * `CATEGORIES`. There is no column for security, legal or transactional
     * mail, so there is nothing here that could switch one off.
     */
    private static function applyPreferences(User $user, Request $request, string $source): void
    {
        $updates = [];

        if ($request->has('marketing_emails_enabled')) {
            $newValue = $request->boolean('marketing_emails_enabled');

            // `?? true` — a row predating the column reads as opted IN.
            if ((bool) ($user->marketing_emails_enabled ?? true) !== $newValue) {
                self::logPreferenceChange($user->id, $user->marketing_emails_enabled, $newValue, $source);
            }

            /*
             * 🚨 CONSENT COLUMNS MOVE WITH THE SWITCH, VIA MarketingConsent.
             * Flipping `marketing_emails_enabled` alone leaves a send permission
             * with no evidence of when or where it was granted, which is the
             * exact gap the 23 Aug UK brief exists to close. Turning it ON is a
             * fresh consent — today, to today's wording — not a restoration of
             * the old one; turning it OFF leaves the original provenance intact.
             */
            $updates += $newValue
                ? MarketingConsent::attributesForGrant($source)
                : MarketingConsent::attributesForWithdrawal();

            // The address-level record (UK brief §6), so the opt-out outlives
            // this row. Only ever lifted here because the PERSON submitted the
            // change — never inferred from behaviour.
            if ($newValue) {
                MarketingConsent::unsuppress($user->email);
            } else {
                MarketingConsent::suppress($user->email, $source, $user->id);
            }
        }

        foreach (self::CATEGORIES as $column) {
            if ($request->has($column)) {
                $newValue = $request->boolean($column);

                if ((bool) ($user->{$column} ?? true) !== $newValue) {
                    self::logPreferenceChange($user->id, $user->{$column}, $newValue, $source.':'.$column);
                }

                $updates[$column] = $newValue;
            }
        }

        if (! empty($updates)) {
            $user->update($updates);
        }
    }

    /**
     * The preference centre for somebody who is NOT signed in.
     *
     * 🚨 THIS IS WHAT LETS SOMEBODY WHO CANNOT SIGN IN UNSUBSCRIBE.
     * `/email-preferences` sits inside the `auth` group, so before this the only
     * control such a person had was a single-category unsubscribe link that died
     * after 24 hours, after which they had no way to stop the mail at all.
     *
     * ⚠️ It was written for the SUSPENDED creator, who at the time was
     * force-logged-out by `CheckSuspendedUser` on every web request. That is no
     * longer true (3 Sep 2026 — a suspended account signs in and reads, and
     * `email.preferences.update` is on the suspension write-allowlist), and this
     * page is no less necessary for it: an unverified or abandoned address has
     * never had a session to reach the signed-in page with.
     *
     * Signed URL, no login, and the signature is checked here rather than by the
     * `signed` middleware so a stale link gets an explanation instead of a bare
     * 403.
     */
    public function manage(Request $request, $userId)
    {
        $user = self::userFromSignedLink($request, $userId, 'manage');

        if (! $user instanceof User) {
            return $user;
        }

        // ⚠️ `->toResponse()` first: `inertia()` returns an `Inertia\Response`,
        // which is not an HTTP response and carries no `headers` bag — setting a
        // header on it throws.
        return $this->noReferrer(
            inertia('EmailPreference/Index', self::pagePayload($user, signed: true))->toResponse($request)
        );
    }

    /** Write a change made on the signed, no-login preference centre. */
    public function updateManaged(Request $request, $userId)
    {
        $user = self::userFromSignedLink($request, $userId, 'manage.update');

        if (! $user instanceof User) {
            return $user;
        }

        $request->validate(self::validationRules());

        self::applyPreferences($user, $request, 'preference_centre_link');

        return $this->noReferrer(
            redirect()->to(self::generateManageToken($user) ?? '/')
                ->with('success', 'Your communication preferences have been updated.')
        );
    }

    /**
     * Resolve the account a signed preference link belongs to.
     *
     * Returns a redirect (not a User) when the link is unusable, so both signed
     * endpoints handle a stale link identically.
     *
     * @return User|RedirectResponse
     */
    private static function userFromSignedLink(Request $request, $userId, string $context)
    {
        if (! $request->hasValidSignature()) {
            Log::warning('EmailPreferenceController@'.$context.': Invalid signature', [
                'user_id' => $userId,
            ]);

            return redirect('/')->with('error', 'That preferences link has expired. Sign in and open Communication Preferences, or contact support and we will unsubscribe you.');
        }

        $user = User::find($userId);

        if (! $user) {
            return redirect('/')->with('error', 'Invalid preferences link.');
        }

        return $user;
    }

    /**
     * A signed preferences page can be forwarded, and a referrer header would
     * hand the link to whatever the page links out to. Same precaution
     * `GuestPurchaseController` takes with its signed lookup.
     *
     * ⚠️ `SecurityHeaders` runs first in the `web` group, so its "after" work
     * runs LAST — it only sets `Referrer-Policy` when one is not already
     * present, which is what keeps this from being overwritten. Do not relax
     * that guard.
     */
    private function noReferrer($response)
    {
        $response->headers->set('Referrer-Policy', 'no-referrer');

        return $response;
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

            if ($newValue) {
                MarketingConsent::unsuppress($user->email);
            } else {
                MarketingConsent::suppress($user->email, 'thankyou_prompt', $user->id);
            }

            $user->update(
                $newValue
                    ? MarketingConsent::attributesForGrant('thankyou_prompt')
                    : MarketingConsent::attributesForWithdrawal()
            );
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
            // Still land them on the centre — "already off" is the moment
            // somebody most wants to check what ELSE is still on.
            return $this->noReferrer(
                redirect()->to(self::generateManageToken($user) ?? '/')
                    ->with('info', "You are already unsubscribed from {$label}.")
            );
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
            $updates += MarketingConsent::attributesForWithdrawal();
            MarketingConsent::suppress($user->email, $source, $user->id);
        }

        $user->update($updates);

        /*
         * 🚨 ONE CLICK STILL UNSUBSCRIBES — the opt-out above has already been
         * written before this line. The redirect then lands them on the signed
         * preference centre rather than the homepage, so somebody who wanted to
         * stop ONE thing can see the rest and does not have to choose between
         * silence and everything. Previously this dropped them on `/` with a
         * flash and no further control, which for an account that cannot sign
         * in was the end of the road.
         */
        return $this->noReferrer(
            redirect()->to(self::generateManageToken($user) ?? '/')
                ->with('success', "You have been unsubscribed from {$label}.")
        );
    }

    /** Human-readable name for a preference column, used in unsubscribe messages. */
    public static function categoryLabel(string $column): string
    {
        return match ($column) {
            'product_updates_enabled' => 'product updates',
            'creator_updates_enabled' => 'creator updates',
            'birthday_emails_enabled' => 'birthday emails',
            'reactivation_emails_enabled' => 'reminder emails',
            'abandoned_checkout_emails_enabled' => 'unfinished purchase reminders',
            'restock_emails_enabled' => 'back-in-stock notices',
            'push_notifications_enabled' => 'push notifications',
            default => 'marketing emails',
        };
    }

    /**
     * Guest opt-out from abandoned-checkout reminders.
     *
     * A guest has no account, so there is no preference column to flip and the normal
     * unsubscribe route (which needs a user id) cannot serve them. Their opt-out is
     * recorded against the email address itself, which is the only identifier we hold.
     *
     * No login, signed URL only — exactly like the marketing unsubscribe.
     */
    public function stopCheckoutReminders(Request $request, $checkoutId)
    {
        if (! $request->hasValidSignature()) {
            Log::warning('EmailPreferenceController@stopCheckoutReminders: Invalid signature', [
                'abandoned_checkout_id' => $checkoutId,
            ]);

            return redirect('/')->with('error', 'Invalid or expired link. Please contact support if you need help.');
        }

        $checkout = AbandonedCheckout::find($checkoutId);

        if (! $checkout || empty($checkout->guest_email)) {
            return redirect('/')->with('error', 'Invalid link.');
        }

        app(AbandonedCheckoutService::class)->suppressGuest($checkout->guest_email);

        return redirect('/')->with('success', 'You will not receive any more reminders about unfinished purchases.');
    }

    /**
     * Signed opt-out link for a guest's abandoned-checkout reminder.
     *
     * 30 days rather than the 24 hours the marketing links use — this email is about
     * one specific purchase and may sit unread for a while, and a dead unsubscribe
     * link is worse than no link at all.
     */
    public static function generateCheckoutReminderOptOut(int $checkoutId): string
    {
        return URL::temporarySignedRoute(
            'checkout-reminders.stop',
            now()->addDays(30),
            ['checkout' => $checkoutId]
        );
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
            now()->addDays(self::LINK_TTL_DAYS),
            $params
        );
    }

    /**
     * A no-login link to the full preference centre, for an email footer.
     *
     * Every marketing/category email should carry BOTH: the one-click category
     * unsubscribe above, and this — "turn this one off" and "choose what you
     * do want" are different intentions and a footer that only offers the first
     * makes people opt out of everything.
     */
    public static function generateManageToken(User $user): ?string
    {
        return self::signedPreferenceUrl('email.preferences.manage', $user);
    }

    /** The signed POST target the no-login centre submits to. */
    private static function generateManageUpdateToken(User $user): ?string
    {
        return self::signedPreferenceUrl('email.preferences.manage.update', $user);
    }

    /**
     * ⚠️ NULL WHEN THE ROUTE IS NOT REGISTERED, DELIBERATELY.
     *
     * `URL::temporarySignedRoute()` THROWS on an unknown route name, and these
     * generators are called from inside `Mailable::content()` — so a missing
     * route line would not produce a missing footer link, it would throw while
     * rendering and take the whole e-mail down. Every caller and every Blade
     * footer already guards on null, so an unregistered route costs the extra
     * link and nothing else.
     */
    private static function signedPreferenceUrl(string $routeName, User $user): ?string
    {
        if (! Route::has($routeName)) {
            return null;
        }

        return URL::temporarySignedRoute(
            $routeName,
            now()->addDays(self::LINK_TTL_DAYS),
            ['user' => $user->id]
        );
    }

    /**
     * Log preference changes for audit trail
     */
    public function __construct() {}

    /**
     * The checkout opt-in — an EXPLICIT action by the person, ticked by them.
     *
     * 🚨 NOTE FOR THE NEXT PERSON: automatic resubscribe triggers (re-enabling a
     * category because somebody came back, bought something, or a set period
     * elapsed) are flagged in the client's Developer Master Plan (19 Aug 2026,
     * §E) as needing LEGAL REVIEW BEFORE IMPLEMENTATION, and none is
     * implemented. This method is the place one would be added, and it is
     * deliberately NOT one: it requires a `marketing_opt_in` the person
     * submitted. Do not add an automatic path here without that sign-off — under
     * UK PECR/GDPR an opt-out is withdrawn consent, and inferring a new consent
     * from a purchase is exactly the thing that needs a lawyer, not a commit.
     */
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

        MarketingConsent::unsuppress($user->email);

        $user->update(MarketingConsent::attributesForGrant('checkout_opt_in'));
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
