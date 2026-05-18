<?php

namespace App\Http\Controllers\Auth;

use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CreateThankYouPostJob;
use App\Jobs\MonthlySubscribedJob;
use App\Jobs\NotificationSave;
use App\Jobs\ProcessWishItemDeliverable;
use App\Jobs\SendPaymentSuccessEmail;
use App\Jobs\SendRenewMail;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\SubscribedMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Jobs\SubscriptionFailed;
use App\Jobs\TipJarPurchased;
use App\Jobs\TipJarTweet;
use App\Jobs\TipPaymentMailToUser;
use App\Jobs\WishSubscriptionMailToUser;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\Deliverable;
use App\Models\MonthlyCharge;
use App\Models\MorConsent;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\StripeWebhookStatus;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\FinancialTransaction;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use App\Services\StripeMetadataService;
use Stripe\StripeClient;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Stripe\Stripe;
use Stripe\Webhook;
use Stripe\Identity\VerificationSession;
use Stripe\Exception\ApiErrorException;
use App\Services\CreatorActivityService;
use App\Services\CreatorSubscriptionService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Notifications\StripeAccountMigrationNotification;
use App\Services\UserProfileService;
use Illuminate\Support\Facades\Http;
use App\Traits\RiskEnforcement;

class StripeController extends Controller
{
    use RiskEnforcement;
    protected $userProfileService;

    public function __construct(UserProfileService $userProfileService)
    {
        $this->userProfileService = $userProfileService;
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
    }

    public function cancelMandatorySubscription(Request $request)
    {
        $user = Auth::user();

        // Find the latest active subscription for this user
        $charge = MonthlyCharge::where('user_id', $user->id)
            ->whereIn('status', ['paid', 'active', 'renew', 'trialing'])
            ->latest()
            ->first();

        if (!$charge || !$charge->stripe_id) {
            return back()->with('error', 'No active subscription found to cancel.');
        }

        try {
            // Cancel at period end via Stripe
            $subscription = StripeControl::cancelSubscription($charge->stripe_id, true);

            // Sync the change locally
            app(\App\Services\UserProfileService::class)->syncMandatorySubscriptionStatus($subscription, 'customer.subscription.updated', null, $user);

            return back()->with('success', 'Auto-renewal has been cancelled. You will have access until ' . Carbon::createFromTimestamp($subscription->current_period_end)->format('d M Y'));
        } catch (\Exception $e) {
            Log::error("StripeController: Manual cancellation failed: " . $e->getMessage());
            return back()->with('error', 'Failed to cancel subscription: ' . $e->getMessage());
        }
    }

    public function resumeMandatorySubscription(Request $request)
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return back()->with('error', 'User not found.');
        }
        $charge = MonthlyCharge::where('user_id', $user->id)
            ->whereIn('status', ['paid', 'active', 'renew', 'trialing', 'canceled'])
            ->latest()
            ->first();

        if (!$charge || !$charge->stripe_id) {
            return back()->with('error', 'No subscription found to resume.');
        }

        try {
            $stripe = StripeControl::getClient();
            $subscription = $stripe->subscriptions->update($charge->stripe_id, [
                'cancel_at_period_end' => false,
            ]);

            Log::info("StripeController: Resumed subscription", [
                'id' => $subscription->id,
                'cancel_at_period_end' => $subscription->cancel_at_period_end,
                'current_period_end' => $subscription->current_period_end
            ]);

            // Sync the change locally
            app(\App\Services\UserProfileService::class)->syncMandatorySubscriptionStatus($subscription, 'customer.subscription.updated', null, $user);

            // Force a refresh of the local models to ensure the 'upcoming_payment' and 'cancelled_at' are correct
            $charge->refresh();
            $user->unsetRelation('allMonthlyCharges');
            $user->refresh();

            return back()->with('success', 'Auto-renewal has been re-enabled successfully!');
        } catch (\Exception $e) {
            Log::error("StripeController: Manual resume failed: " . $e->getMessage());
            return back()->with('error', 'Failed to resume subscription: ' . $e->getMessage());
        }
    }

    /**
     * Determine the appropriate service agreement type based on country
     * to handle cross-border payment restrictions
     *
     * @param string $country Country code (e.g., 'IT', 'FR', 'DE')
     * @return string 'recipient' or 'full'
     */
    private static function getServiceAgreementType($country)
    {
        // We now enforce 'full' service agreement for all countries to support Direct Charges
        // and card_payments capability.
        return 'full';

        /* 
        // Legacy recipient logic - disabled to support Direct Charges
        // Countries that require 'recipient' service agreement for cross-border payments
        // These are primarily EU countries that have restrictions with full service agreements
        $recipientCountries = [
            'IT', // Italy - confirmed issue
            'FR', // France
            'DE', // Germany
            'ES', // Spain
            'PT', // Portugal
            'NL', // Netherlands
            'BE', // Belgium
            'AT', // Austria
            'IE', // Ireland
            'FI', // Finland
            'DK', // Denmark
            'SE', // Sweden
            'NO', // Norway
            'PL', // Poland
            'CZ', // Czech Republic
            'HU', // Hungary
            'RO', // Romania
            'BG', // Bulgaria
            'HR', // Croatia
            'SI', // Slovenia
            'SK', // Slovakia
            'LT', // Lithuania
            'LV', // Latvia
            'EE', // Estonia
            'GR', // Greece
            'CY', // Cyprus
            'MT', // Malta
            'LU', // Luxembourg
        ];

        return in_array(strtoupper($country), $recipientCountries) ? 'recipient' : 'full';
        */
    }

    /**
     * Check if an existing Stripe account needs migration to recipient service agreement
     *
     * @param User $user
     * @return array
     */
    public static function checkAccountMigrationNeeds(User $user)
    {
        if (empty($user->account_id)) {
            return ['needs_migration' => false, 'reason' => 'No Stripe account connected'];
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            $currentServiceAgreement = $account->tos_acceptance->service_agreement ?? null;
            $requiredServiceAgreement = self::getServiceAgreementType($user->country);

            $needsMigration = (
                ($currentServiceAgreement === 'full' || $currentServiceAgreement === null) &&
                $requiredServiceAgreement === 'recipient'
            );

            // Log migration check for debugging
            Log::info('Stripe migration check completed', [
                'user_id' => $user->id,
                'country' => $user->country,
                'current_agreement' => $currentServiceAgreement,
                'required_agreement' => $requiredServiceAgreement,
                'needs_migration' => $needsMigration,
                'account_id' => $user->account_id
            ]);

            return [
                'needs_migration' => $needsMigration,
                'current_agreement' => $currentServiceAgreement,
                'required_agreement' => $requiredServiceAgreement,
                'country' => $user->country,
                'account_id' => $user->account_id,
                'charges_enabled' => $account->charges_enabled ?? false,
                'reason' => $needsMigration ? 'Country requires recipient agreement for cross-border payments' : 'Account is correctly configured'
            ];
        } catch (Exception $e) {
            Log::error('Failed to check account migration needs', [
                'user_id' => $user->id,
                'account_id' => $user->account_id,
                'error' => $e->getMessage()
            ]);

            return [
                'needs_migration' => false,
                'reason' => 'Error checking account: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Migrate an existing account from full to recipient service agreement
     * Note: This requires creating a new account as service agreements cannot be changed
     *
     * @param User $user
     * @return array
     */
    public static function migrateExistingAccount(User $user)
    {
        $migrationCheck = self::checkAccountMigrationNeeds($user);

        if (!$migrationCheck['needs_migration']) {
            return [
                'success' => false,
                'message' => 'Account does not need migration: ' . $migrationCheck['reason']
            ];
        }

        $oldAccountId = $user->account_id;

        try {
            Log::info('Starting account migration', [
                'user_id' => $user->id,
                'old_account_id' => $oldAccountId,
                'country' => $user->country,
                'from_agreement' => $migrationCheck['current_agreement'],
                'to_agreement' => $migrationCheck['required_agreement']
            ]);

            // Create new account with recipient service agreement
            $serviceAgreementType = self::getServiceAgreementType($user->country);

            // Set capabilities based on service agreement type
            $capabilities = [];
            if ($serviceAgreementType === 'recipient') {
                $capabilities['transfers'] = ['requested' => true];
            } else {
                $capabilities['card_payments'] = ['requested' => true];
            }

            $newAccount = StripeControl::createAccount([
                'country' => $user->country,
                'type' => 'express',
                'email' => $user->email,
                'capabilities' => $capabilities,
                'business_type' => ($user->country === 'AE') ? 'company' : 'individual',
                'business_profile' => [
                    'url' => "https://spennypiggy.co/{$user->username}",
                    'mcc' => '7278',
                ],
                'tos_acceptance' => [
                    'service_agreement' => $serviceAgreementType,
                ],
            ]);

            // Update user with new account ID
            $user->account_id = $newAccount->id;
            $user->stripe_details_submitted = 0; // They'll need to complete onboarding again
            $user->save();

            // Note: We don't delete the old account automatically to avoid data loss
            // It can be cleaned up manually later if needed

            Log::info('Account migration completed successfully', [
                'user_id' => $user->id,
                'old_account_id' => $oldAccountId,
                'new_account_id' => $newAccount->id,
                'new_agreement' => $serviceAgreementType
            ]);

            $migrationResult = [
                'success' => true,
                'message' => 'Account migrated successfully',
                'old_account_id' => $oldAccountId,
                'new_account_id' => $newAccount->id,
                'new_service_agreement' => $serviceAgreementType,
                'onboarding_required' => true
            ];

            // Send notification to creator
            try {
                $user->notify(new StripeAccountMigrationNotification($migrationResult));
            } catch (Exception $e) {
                Log::warning('Failed to send migration notification', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }

            // Clear user cache to reflect new account status
            app(UserProfileService::class)->clearUserCaches($user->username, $user->id);

            return [
                'success' => true,
                'message' => 'Account migrated successfully',
                'old_account_id' => $oldAccountId,
                'new_account_id' => $newAccount->id,
                'new_service_agreement' => $serviceAgreementType,
                'onboarding_required' => true
            ];
        } catch (Exception $e) {
            Log::error('Account migration failed', [
                'user_id' => $user->id,
                'old_account_id' => $oldAccountId,
                'error' => $e->getMessage()
            ]);

            return [
                'success' => false,
                'message' => 'Migration failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Manual migration endpoint for individual account
     * Useful for customer support or admin panel
     */
    public function migrateAccount(Request $request, $userId = null)
    {
        $userId = $userId ?? $request->get('user_id');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 400);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        // Check if migration is needed first
        $migrationCheck = self::checkAccountMigrationNeeds($user);

        if (!$migrationCheck['needs_migration']) {
            return response()->json([
                'success' => false,
                'message' => 'Account migration not needed',
                'details' => $migrationCheck
            ]);
        }

        // Perform the migration
        $result = self::migrateExistingAccount($user);

        return response()->json($result);
    }

    /**
     * Check if account needs migration (endpoint version)
     */
    public function checkMigrationNeeds(Request $request, $userId = null)
    {
        $userId = $userId ?? $request->get('user_id');

        if (!$userId) {
            return response()->json([
                'success' => false,
                'message' => 'User ID is required'
            ], 400);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not found'
            ], 404);
        }

        $migrationCheck = self::checkAccountMigrationNeeds($user);

        return response()->json([
            'success' => true,
            'user_id' => $userId,
            'migration_check' => $migrationCheck
        ]);
    }

    /**
     * Landing Page for Stripe Connect
     *
     * @return Inertia
     */
    /**
     * Landing Page for Stripe Connect
     *
     * @return Inertia
     */
    public function index()
    {
        $user = User::find(Auth::id());

        // Check if Stripe is already connected
        if ($user->stripe_details_submitted == 1) {
            return redirect(route("user.show", $user->username))->with("error", "Stripe Account already connected!");
        }

        // Require: approved profile, Stripe identity verified
        if (($user->profile_status_lock ?? 0) != 2) {
            return redirect(route("user.show", $user->username))->with("error", "Your profile is not approved yet.");
        }
        if (($user->identity_status ?? 0) != 1) {
            return redirect(route("user.show", $user->username))->with("error", "Please complete Stripe identity verification first.");
        }

        // Check if MoR consent exists in the database
        $morConsentGiven = MorConsent::userHasGivenConsent($user->id);

        // Check if account already exists and is active
        if (!empty($user->account_id)) {
            try {
                $account = StripeControl::getAccount($user->account_id);
                if ($account->charges_enabled) {
                    $user->stripe_details_submitted = 1;
                    $user->save();
                    $this->userProfileService->clearUserCaches($user->username, $user->id);
                    return redirect(route("user.show", $user->username))->with("success", "Stripe already connected!");
                }
            } catch (Exception $e) {
                // If there's an error fetching account, continue to show the connect page
                Log::warning('Error fetching Stripe account', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        // Get latest consent details if exists
        $morConsentDetails = null;
        if ($morConsentGiven) {
            $latestConsent = MorConsent::getLatestConsent($user->id);
            if ($latestConsent) {
                $morConsentDetails = [
                    'given_at' => $latestConsent->consent_given_at->format('M d, Y h:i A'),
                    'ip_address' => $latestConsent->ip_address,
                    'device' => $latestConsent->device_type,
                    'location' => $latestConsent->city ? $latestConsent->city . ', ' . $latestConsent->country : 'Unknown'
                ];
            }
        }

        return Inertia::render("stripe/Stripe", [
            'auth' => [
                'user' => $user
            ],
            'mor_consent_given' => $morConsentGiven,
            'mor_consent_details' => $morConsentDetails,
            'success' => session('success')
        ]);
    }

    /**
     * Show Merchant of Record consent page
     */
    public function showMorConsent()
    {
        $user = Auth::user();

        // Check if user has already given consent
        if (MorConsent::userHasGivenConsent($user->id)) {
            return redirect()->route('stripe.index');
        }

        return inertia('stripe/MorConsent', [
            'auth' => [
                'user' => $user
            ]
        ]);
    }
    // public function showMorConsent(Request $request)
    // {
    //     $user = Auth::user();

    //     // Check if user has already given consent
    //     if (MorConsent::userHasGivenConsent($user->id)) {
    //         return redirect()->route('stripe.index');
    //     }

    //     return inertia('stripe/MorConsent', [
    //         'auth' => [
    //             'user' => $user
    //         ]
    //     ]);
    // }

    /**
     * Store Merchant of Record consent
     */
    public function storeMorConsent(Request $request)
    {
        $request->validate([
            'mor_agreed' => 'required|accepted'
        ]);

        $user = Auth::user();

        // Check if consent already exists
        if (MorConsent::userHasGivenConsent($user->id)) {
            // Redirect back with success message instead of JSON
            return redirect()->route('stripe.index')
                ->with('success', 'Merchant of Record agreement already confirmed!');
        }

        $ipAddress = $request->ip();

        // Get location data from IP (optional)
        $locationData = $this->getLocationFromIp($ipAddress);

        // Parse user agent
        $userAgent = $request->header('User-Agent');
        $deviceInfo = $this->parseUserAgent($userAgent);

        // Create consent record
        $morConsent = MorConsent::create([
            'user_id' => $user->id,
            'consent_given' => true,
            'consent_given_at' => now(),
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'device_type' => $deviceInfo['device_type'],
            'browser' => $deviceInfo['browser'],
            'platform' => $deviceInfo['platform'],
            'metadata' => [
                'accepted_at' => now()->toISOString(),
                'referrer' => $request->header('referer'),
                'accept_language' => $request->header('accept-language'),
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'session_id' => $request->session()->getId(),
                'location_data' => $locationData
            ]
        ]);

        // Log the consent
        Log::info('Merchant of Record consent stored', [
            'user_id' => $user->id,
            'username' => $user->username,
            'ip' => $ipAddress,
            'device' => $deviceInfo['device_type'],
            'time' => now()->toDateTimeString(),
            'consent_id' => $morConsent->id
        ]);

        // Redirect back with success message
        return redirect()->route('stripe.index')
            ->with('success', 'Merchant of Record agreement confirmed successfully!');
    }

    // In your main stripe method
    public function stripe()
    {
        $user = Auth::user();

        // Check if user has given consent
        $morConsentGiven = MorConsent::userHasGivenConsent($user->id);

        return Inertia::render('stripe/Stripe', [
            'auth' => [
                'user' => $user,
            ],
            'user' => $user,
            'mor_consent_given' => $morConsentGiven,
            // Pass other props as needed
        ]);
    }

    /**
     * Show Stripe connect page
     */
    public function showAllData()
    {
        $user = Auth::user();

        // Check if user has given MoR consent
        if (!MorConsent::userHasGivenConsent($user->id)) {
            return redirect()->route('stripe.mor-consent');
        }

        // Pass the latest consent info to the view
        $latestConsent = MorConsent::getLatestConsent($user->id);

        return inertia('Stripe/Connect', [
            'auth' => [
                'user' => $user,
                'mor_consent' => $latestConsent ? [
                    'given_at' => $latestConsent->consent_given_at->format('M d, Y h:i A'),
                    'ip_address' => $latestConsent->ip_address,
                    'device' => $latestConsent->device_type,
                    'location' => $latestConsent->city ? $latestConsent->city . ', ' . $latestConsent->country : 'Unknown'
                ] : null
            ],
            'success' => session('success')
        ]);
    }

    /**
     * Init Connect Account Start
     *
     * @param string $step Connection Current Step
     * @return mixed
     */
    /**
     * Initialize Stripe connection (main method you provided)
     */
    /**
     * Initialize Stripe connection
     */
    public function initConnect($country = null, $currency = null)
    {
        /** @var \App\Models\User $user */
        $user = User::find(Auth::id());

        // Check Merchant of Record consent
        if (!MorConsent::userHasGivenConsent($user->id)) {
            return redirect()->route('stripe.index')->with('error', 'You must agree to the Merchant of Record terms first.');
        }

        // Require: approved profile, Stripe identity verified
        if (($user->profile_status_lock ?? 0) != 2) {
            return redirect(route("user.show", $user->username))->with("error", "Your profile is not approved yet.");
        }
        if (($user->identity_status ?? 0) != 1) {
            return redirect(route("user.show", $user->username))->with("error", "Please complete Stripe identity verification first.");
        }

        // Log MoR consent verification
        $morConsent = MorConsent::getLatestConsent($user->id);
        Log::info('Stripe connection initiated with MoR consent', [
            'user_id' => $user->id,
            'username' => $user->username,
            'mor_consent_id' => $morConsent->id ?? null,
            'consent_given_at' => $morConsent->consent_given_at ?? null,
            'country' => $country,
            'currency' => $currency
        ]);

        if (empty($user->account_id)) {
            $country = strtoupper($country);
            try {
                // Determine service agreement type based on country to handle cross-border payment restrictions
                $serviceAgreementType = self::getServiceAgreementType($country);

                Log::info('Creating Stripe account with service agreement', [
                    'user_id' => $user->id,
                    'country' => $country,
                    'service_agreement' => $serviceAgreementType,
                    'reason' => $serviceAgreementType === 'recipient' ? 'Cross-border payment compatibility' : 'Standard account',
                    'mor_consent' => true
                ]);

                // Set capabilities based on service agreement type
                $capabilities = [];
                if ($serviceAgreementType === 'recipient') {
                    $capabilities['transfers'] = ['requested' => true];
                } else {
                    // For card_payments capability, Stripe requires BOTH card_payments AND transfers
                    $capabilities['card_payments'] = ['requested' => true];
                    $capabilities['transfers'] = ['requested' => true];
                }

                $payload = [
                    "country" => $country,
                    "type" => "express",
                    'email' => $user->email,
                    'capabilities' => $capabilities,
                    'tos_acceptance' => ['service_agreement' => $serviceAgreementType],
                    "business_type" => ($user->country === 'AE') ? 'company' : 'individual',
                    'business_profile' => [
                        'url'   => "https://spennypiggy.co/{$user->username}",
                        'mcc'   => '7278',
                    ],
                    'default_currency' => $currency,
                    'metadata' => [
                        'mor_consent_given' => true,
                        'mor_consent_id' => $morConsent->id ?? null,
                        'mor_consent_date' => $morConsent->consent_given_at->toISOString() ?? null,
                        'user_id' => $user->id,
                        'username' => $user->username
                    ]
                ];
                $account = StripeControl::createAccount($payload);
                $user->account_id = $account->id;
                $user->country = $country;
                $user->save();
                $this->userProfileService->clearUserCaches($user->username, $user->id);
            } catch (Exception $e) {
                return redirect(route("stripe.index"))->with("error", "Account creation error:" . $e->getMessage());
            }
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if ($account->charges_enabled) {
                $user->stripe_details_submitted = 1;
                $user->save();
                $this->userProfileService->clearUserCaches($user->username, $user->id);
                return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe already connected.");
            }
            $link = StripeControl::createAccountLink([
                "account" => $account->id,
                "refresh_url" => route("stripe.connect", ["step" => "refresh", "country" => $user->country]),
                "return_url"  => route("stripe.return"),
                "type"        => "account_onboarding",
                "collect"   => 'currently_due'
            ]);
            return Inertia::location($link->url);
        } catch (Exception $e) {
            return redirect(route("stripe.index"))->with("error", "Internal server error:" . $e->getMessage());
        }
    }


    // public function initConnect(Request $request, $step = "init", $country = null, $currency = null)
    // {
    //     $user = User::find(Auth::id());

    //     // Require: approved profile, Stripe identity verified, and admin identity approved
    //     if (($user->profile_status_lock ?? 0) != 2) {
        //         return redirect(route("user.show", $user->username))->with("error", "Your profile is not approved yet.");
    //     }
    //     if (($user->identity_status ?? 0) != 1) {
    //         return redirect(route("user.show", $user->username))->with("error", "Please complete Stripe identity verification first.");
    //     }
    //     // if (($user->identity_admin_status ?? 0) != 1) {
        //     //     return redirect(route("user.show", $user->username))->with("error", "Identity review is pending or rejected by admin.");
    //     // }


    //     if (empty($user->account_id)) {
        //         $country = strtoupper($country);
        //         try {
    //             // Determine service agreement type based on country to handle cross-border payment restrictions
    //             $serviceAgreementType = self::getServiceAgreementType($country);

    //             Log::info('Creating Stripe account with service agreement', [
    //                 'user_id' => $user->id,
    //                 'country' => $country,
    //                 'service_agreement' => $serviceAgreementType,
    //                 'reason' => $serviceAgreementType === 'recipient' ? 'Cross-border payment compatibility' : 'Standard account'
    //             ]);
    
    //             // Set capabilities based on service agreement type
    //             $capabilities = [];
    //             if ($serviceAgreementType === 'recipient') {
    //                 $capabilities['transfers'] = ['requested' => true];
    //             } else {
    //                 // For card_payments capability, Stripe requires BOTH card_payments AND transfers
    //                 // This is mandatory per Stripe documentation: https://stripe.com/docs/connect/account-capabilities#card-payments
    //                 $capabilities['card_payments'] = ['requested' => true];
    //                 $capabilities['transfers'] = ['requested' => true];
    //             }

    //             $payload = [
    //                 "country" => $country,
    //                 "type" => "express",
    //                 'email' => $user->email,
    //                 'capabilities' => $capabilities,
    //                 'tos_acceptance' => ['service_agreement' => $serviceAgreementType],
    //                 // 'business_type' => 'individual',
    //                 "business_type" => ($user->country === 'AE') ? 'company' : 'individual',
    //                 'business_profile' => [
        //                     'url'   => "https://spennypiggy.co/{$user->username}",
        //                     'mcc'   => '7278',
    //                 ],
    //                 'default_currency' => $currency,
    //             ];
    //             $account = StripeControl::createAccount($payload);
    //             $user->account_id = $account->id;
    //             $user->country = $country;
    //             $user->save();
    //             $this->userProfileService->clearUserCaches($user->username, $user->id);
    //         } catch (Exception $e) {
    //             return redirect(route("stripe.index"))->with("error", "Account creation error:" . $e->getMessage());
    //         }
    //     }
    
    //     try {
    //         $account = StripeControl::getAccount($user->account_id);
    //         if ($account->charges_enabled) {
    //             $user->stripe_details_submitted = 1;
    //             $user->save();
    //             $this->userProfileService->clearUserCaches($user->username, $user->id);
    //             return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe already connected.");
    //         }
    //         $link = StripeControl::createAccountLink([
    //             "account" => $account->id,
    //             "refresh_url" => route("stripe.connect", ["step" => "refresh", "country" => $user->country]),
    //             "return_url"  => route("stripe.return"),
    //             "type"        => "account_onboarding",
    //             "collect"   => 'currently_due'
    //         ]);
    //         return Inertia::location($link->url);
    //     } catch (Exception $e) {
        //         return redirect(route("stripe.index"))->with("error", "Internal server error:" . $e->getMessage());
        //     }
    // }

    /**
     * Stripe return callback
     */
    public function stripeReturn()
    {
        $user = Auth::user();

        // Log return with MoR consent info
        $morConsent = MorConsent::getLatestConsent($user->id);
        Log::info('Stripe return callback', [
            'user_id' => $user->id,
            'username' => $user->username,
            'mor_consent_id' => $morConsent->id ?? null
        ]);

        // Your existing return logic
        // ...
    }
    /**
     * Get location data from IP address
     */
    private function getLocationFromIp($ip)
    {
        try {
            // Using ipinfo.io (free tier available)
            $token = env('IPINFO_TOKEN');

            if (!$token || $ip === '127.0.0.1' || $ip === '::1') {
                return [];
            }

            $response = Http::withToken($token)
                ->timeout(5)
                ->get("https://ipinfo.io/{$ip}/json");

            if ($response->successful()) {
                $data = $response->json();

                // Parse coordinates if available
                $coords = explode(',', $data['loc'] ?? '');

                return [
                    'country' => $data['country'] ?? null,
                    'city' => $data['city'] ?? null,
                    'region' => $data['region'] ?? null,
                    'latitude' => $coords[0] ?? null,
                    'longitude' => $coords[1] ?? null,
                    'org' => $data['org'] ?? null,
                    'postal' => $data['postal'] ?? null,
                    'timezone' => $data['timezone'] ?? null,
                ];
            }
        } catch (\Exception $e) {
            Log::warning('Failed to get IP location', [
                'ip' => $ip,
                'error' => $e->getMessage()
            ]);
        }

        return [];
    }

    /**
     * Parse user agent string to extract device info
     */
    private function parseUserAgent($userAgent)
    {
        $deviceType = 'Desktop';
        $browser = 'Unknown';
        $platform = 'Unknown';

        // Device detection
        if (preg_match('/Mobile/i', $userAgent)) {
            $deviceType = 'Mobile';
        } elseif (preg_match('/Tablet|iPad/i', $userAgent)) {
            $deviceType = 'Tablet';
        }

        // Browser detection
        if (preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Chrome';
        } elseif (preg_match('/Firefox/i', $userAgent)) {
            $browser = 'Firefox';
        } elseif (preg_match('/Safari/i', $userAgent) && !preg_match('/Chrome/i', $userAgent)) {
            $browser = 'Safari';
        } elseif (preg_match('/Edge/i', $userAgent)) {
            $browser = 'Edge';
        } elseif (preg_match('/Opera|OPR/i', $userAgent)) {
            $browser = 'Opera';
        }

        // Platform detection
        if (preg_match('/Windows/i', $userAgent)) {
            $platform = 'Windows';
        } elseif (preg_match('/Macintosh|Mac OS X/i', $userAgent)) {
            $platform = 'macOS';
        } elseif (preg_match('/Linux/i', $userAgent)) {
            $platform = 'Linux';
        } elseif (preg_match('/Android/i', $userAgent)) {
            $platform = 'Android';
        } elseif (preg_match('/iPhone|iPad|iPod/i', $userAgent)) {
            $platform = 'iOS';
        }

        return [
            'device_type' => $deviceType,
            'browser' => $browser,
            'platform' => $platform
        ];
    }


    public function upgradeStripeAccount()
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        if (!$user->account_id) {
            return back()->with('error', 'You must first connect a Stripe account.');
        }

        try {
            // ── 1. Inspect the current account ───────────────────────────
            $account = StripeControl::getAccount($user->account_id);

            // If Stripe has already rejected it, don’t continue
            if (($account->requirements->disabled_reason ?? '') === 'rejected') {
                return back()->with(
                    'error',
                    'Stripe rejected your previous application. Please contact support or submit updated information.'
                );
            }

            // Check if account actually needs migration using our migration check logic
            $migrationCheck = self::checkAccountMigrationNeeds($user);

            // If no migration is needed, account is already properly configured
            if (!$migrationCheck['needs_migration']) {
                return back()->with('success', 'Your Stripe account is already fully upgraded.');
            }

            // Clear migration status cache before creating new account
            // Cache::forget("migration_status_{$user->id}");

            // ── 2. Delete legacy + create brand‑new Express account ───────
            // (Optional) Stripe::Account::delete($user->account_id);

            $newAccount = null;

            try {
                // Determine service agreement type based on country to handle cross-border payment restrictions
                $serviceAgreementType = self::getServiceAgreementType($user->country);

                Log::info('Upgrading Stripe account with service agreement', [
                    'user_id' => $user->id,
                    'country' => $user->country,
                    'service_agreement' => $serviceAgreementType,
                    'reason' => $serviceAgreementType === 'recipient' ? 'Cross-border payment compatibility' : 'Standard account'
                ]);

                // Set capabilities based on service agreement type
                $capabilities = [];
                if ($serviceAgreementType === 'recipient') {
                    $capabilities['transfers'] = ['requested' => true];
                } else {
                    // For card_payments capability, Stripe requires BOTH card_payments AND transfers
                    // This is mandatory per Stripe documentation: https://stripe.com/docs/connect/account-capabilities#card-payments
                    $capabilities['card_payments'] = ['requested' => true];
                    $capabilities['transfers'] = ['requested' => true];
                }

                $newAccount = StripeControl::createAccount([
                    'country'       => $user->country,
                    'type'          => 'express',
                    'email'         => $user->email,
                    'capabilities'  => $capabilities,
                    'business_type' => ($user->country === 'AE') ? 'company' : 'individual',
                    'business_profile' => [
                        'url' => "https://spennypiggy.co/{$user->username}",
                        'mcc' => '7278',
                    ],
                    'tos_acceptance' => [
                        'service_agreement' => $serviceAgreementType,
                    ],
                ]);
            } catch (ApiErrorException $e) {
                Log::error('Stripe createAccount failed', [
                    'user_id'   => $user->id,
                    'stripe_id' => $user->account_id,
                    'code'      => $e->getStripeCode(),
                    'msg'       => $e->getError()->message ?? $e->getMessage(),
                ]);

                return back()->with(
                    'error',
                    $e->getError()->message
                        ?? 'Could not create a new Stripe account. Please try again later.'
                );
            }

            // Persist the new ID only after creation succeeds
            $user->account_id = $newAccount->id;
            $user->save();
            $this->userProfileService->clearUserCaches($user->username, $user->id);

            // ── 3. Generate onboarding link ──────────────────────────────
            try {
                $link = StripeControl::createAccountLink([
                    'account'     => $newAccount->id,
                    'refresh_url' => route('stripe.connect', [
                        'step'    => 'refresh',
                        'country' => $user->country,
                    ]),
                    'return_url'  => route('stripe.return'),
                    'type'        => 'account_onboarding',
                    'collect'     => 'currently_due',
                ]);

                return Inertia::location($link->url);
            } catch (ApiErrorException $e) {
                Log::warning('Stripe accountLink failed', [
                    'user_id' => $user->id,
                    'new_id'  => $newAccount->id,
                    'code'    => $e->getStripeCode(),
                    'msg'     => $e->getError()->message ?? $e->getMessage(),
                ]);

                return back()->with(
                    'error',
                    $e->getError()->message
                        ?? 'Your Stripe account could not be onboarded. Please contact support.'
                );
            }
        } catch (ApiErrorException $e) {
            return back()->with(
                'error',
                $e->getError()->message ?? 'Failed to upgrade Stripe account. Please try again.'
            );
        }
    }



    public function enableCardPayments()
    {
        $user = User::findOrFail(Auth::id());
        try {
            // First, get the current account to check its service agreement
            $account = StripeControl::getClient()->accounts->retrieve($user->account_id);
            $currentServiceAgreement = $account->tos_acceptance->service_agreement ?? null;

            // Determine what service agreement type should be based on country
            $expectedServiceAgreementType = self::getServiceAgreementType($user->country);

            // Set capabilities - ALWAYS request card_payments for Direct Charges support
            // We are overriding the recipient/transfers-only logic because the platform
            // now strictly uses Direct Charges which requires card_payments capability.
            $capabilities = [
                'card_payments' => ['requested' => true],
                'transfers' => ['requested' => true]
            ];

            // if ($currentServiceAgreement === 'recipient') {
            //     // Recipient accounts can only request transfers capability
            //     $capabilities['transfers'] = ['requested' => true];
            // } else {
            //     // Full service agreement accounts can request both capabilities
            //     // For card_payments capability, Stripe requires BOTH card_payments AND transfers
            //     // This is mandatory per Stripe documentation: https://stripe.com/docs/connect/account-capabilities#card-payments
            //     $capabilities['card_payments'] = ['requested' => true];
            //     $capabilities['transfers'] = ['requested' => true];
            // }

            Log::info('Enabling card payments with capabilities', [
                'user_id' => $user->id,
                'country' => $user->country,
                'current_service_agreement' => $currentServiceAgreement,
                'expected_service_agreement' => $expectedServiceAgreementType,
                'capabilities' => array_keys($capabilities),
                'service_agreement_mismatch' => $currentServiceAgreement !== $expectedServiceAgreementType
            ]);

            // Log a warning if there's a service agreement mismatch
            if ($currentServiceAgreement !== $expectedServiceAgreementType) {
                Log::warning('Service agreement mismatch detected', [
                    'user_id' => $user->id,
                    'account_id' => $user->account_id,
                    'current_agreement' => $currentServiceAgreement,
                    'expected_agreement' => $expectedServiceAgreementType,
                    'country' => $user->country
                ]);

                // FIX: If account is 'recipient' but needs to be 'full', we MUST create a new account.
                // Existing Express accounts cannot be upgraded from recipient to full via API.
                if ($currentServiceAgreement === 'recipient' && $expectedServiceAgreementType === 'full') {
                    Log::info('Migrating user from Recipient to Full account automatically', ['user_id' => $user->id]);

                    try {
                        $newAccount = StripeControl::createAccount([
                            'country'       => $user->country,
                            'type'          => 'express',
                            'email'         => $user->email,
                            'capabilities'  => $capabilities,
                            'business_type' => ($user->country === 'AE') ? 'company' : 'individual',
                            'business_profile' => [
                                'url' => "https://spennypiggy.co/{$user->username}",
                                'mcc' => '7278',
                            ],
                            'tos_acceptance' => [
                                'service_agreement' => 'full',
                            ],
                        ]);

                        // Update user to use the new account
                        $oldAccountId = $user->account_id;
                        $user->account_id = $newAccount->id;
                        $user->stripe_details_submitted = 0; // Reset submitted status
                        $user->save();

                        Log::info('User migrated to new Stripe account', [
                            'user_id' => $user->id,
                            'old_account' => $oldAccountId,
                            'new_account' => $newAccount->id
                        ]);

                        // Use the new account ID for the rest of the flow
                        $user->refresh();
                    } catch (ApiErrorException $e) {
                        Log::error('Failed to create new account for migration', ['error' => $e->getMessage()]);
                        throw $e;
                    }
                }
            }

            // 1. Ask for the capabilities ↴
            $updateParams = [
                'capabilities' => $capabilities,
            ];

            // NOTE: We cannot explicitly update 'tos_acceptance' via API for existing Express accounts
            // as it triggers a permission error. We rely on the Account Link to handle this.

            $updatedAccount = StripeControl::getClient()->accounts->update(
                $user->account_id,
                $updateParams
            );

            Log::info('Stripe Account Updated', [
                'user_id' => $user->id,
                'card_payments_status' => $updatedAccount->capabilities->card_payments ?? 'unknown',
                'transfers_status' => $updatedAccount->capabilities->transfers ?? 'unknown',
                'currently_due' => $updatedAccount->requirements->currently_due ?? [],
                'eventually_due' => $updatedAccount->requirements->eventually_due ?? [],
                'disabled_reason' => $updatedAccount->requirements->disabled_reason ?? null,
            ]);

            // 2. Create an onboarding link ↴
            $accountLinkType = 'account_onboarding';

            // If card_payments is inactive but no requirements are due, try account_update
            // This happens when Stripe doesn't trigger onboarding for capability changes automatically
            if (($updatedAccount->capabilities->card_payments ?? '') === 'inactive'
                && empty($updatedAccount->requirements->currently_due)
            ) {
                $accountLinkType = 'account_update';
                Log::info('Switching to account_update flow due to inactive capability without requirements');
            }

            $accountLink = StripeControl::getClient()->accountLinks->create([
                'account'      => $user->account_id,
                'refresh_url'  => route('stripe.connect', [
                    'step'    => 'refresh',
                    'country' => $user->country,
                ]),
                'return_url'   => route('stripe.return'),
                'type'         => $accountLinkType,
            ]);

            // 3. Redirect to Stripe’s URL
            return Inertia::location($accountLink->url);
        } catch (ApiErrorException $e) {
            Log::warning('Stripe onboarding failed', [
                'user_id' => $user->id,
                'stripe_error' => $e->getError()->message ?? $e->getMessage(),
                'stripe_code'  => $e->getStripeCode(),
            ]);
            $errorMessage = $e->getError()->message ?? $e->getMessage();

            // Provide more specific error messages for capability-related issues
            $userErrorMessage = $errorMessage;
            if (str_contains($errorMessage, 'recipient') && str_contains($errorMessage, 'service agreement')) {
                $userErrorMessage = 'Your account is configured for recipient payments only and cannot process card payments. Please contact support if you need to change your account type.';
            } elseif (str_contains($errorMessage, 'capability') || str_contains($errorMessage, 'capabilities')) {
                $userErrorMessage = 'There was an issue configuring payment capabilities for your account. Please contact support for assistance.';
            } elseif (!$userErrorMessage) {
                $userErrorMessage = 'Your Stripe account cannot be onboarded. Please contact support.';
            }

            return redirect(route("user.show", ["username" => $user->username, "page" => 'about']))->with("error", $userErrorMessage);
        }
    }


    /**
     * Return URL After Success
     *
     * @param Request $request
     * @return mixed
     */
    public function connectReturn()
    {
        $user = User::find(Auth::id());
        if (empty($user->account_id)) {
            return redirect(route("user.show", ["username" => $user->username]))->with("error", "Stripe did not initiated properly.");
        }
        try {
            $account = StripeControl::getAccount($user->account_id);
            if (empty($user->stripe_details_submitted)) {
                $user->stripe_details_submitted = $account->details_submitted ?? NULL;
                $user->default_currency = $account->default_currency;
                $user->save();
            }
            // Bust cached Stripe capability and migration status so the dashboard updates immediately
            // Cache::forget("stripe_capabilities_{$user->account_id}");
            // Cache::forget("migration_status_{$user->id}");
            $this->userProfileService->clearUserCaches($user->username, $user->id);

            // Log updated capability status for diagnosis
            Log::info('Stripe connectReturn status', [
                'user_id' => $user->id,
                'account_id' => $user->account_id,
                'charges_enabled' => $account->charges_enabled ?? null,
                'payouts_enabled' => $account->payouts_enabled ?? null,
                'cap_card_payments' => $account->capabilities->card_payments ?? null,
                'cap_transfers' => $account->capabilities->transfers ?? null,
                'requirements_due' => $account->requirements->eventually_due ?? []
            ]);

            return redirect(route("user.show", ["username" => $user->username]))->with("success", "Stripe connected.");
        } catch (Exception $e) {
            return redirect(route("user.show", ["username" => $user->username]))->with("error", $e->getMessage());
        }
    }

    /**
     * Login To Stripe Express Account Dashboard
     *
     * @param Request $request
     * @return Response
     */
    // public function loginToStripe(Request $request)
    // {
    //     try {
    //         $stripe = StripeControl::getLoginLink(Auth::user()->account_id);
    //         return Inertia::location($stripe->url);
    //     } catch (Exception $e) {
    //         return back()->with("error", $e->getMessage());
    //     }
    // }


    public function loginToStripe($country = null)
    {
        try {
            /** @var \App\Models\User|null $user */
            $user = Auth::user();

            Stripe::setApiKey(config('services.stripe.secret'));

            // ✅ 1. Create account if not exists
            if (empty($user->account_id)) {

                $country = strtoupper($country);

                try {
                    // 1️⃣ Decide service agreement
                    $serviceAgreementType = self::getServiceAgreementType($country);

                    Log::info('Creating Stripe account', [
                        'user_id' => $user->id,
                        'country' => $country,
                        'service_agreement' => $serviceAgreementType,
                    ]);

                    // 2️⃣ Capabilities (Stripe rules)
                    $capabilities = [];

                    if ($serviceAgreementType === 'recipient') {
                        // Recipient accounts = transfers only
                        $capabilities['transfers'] = ['requested' => true];
                    } else {
                        // card_payments ALWAYS requires transfers
                        $capabilities = [
                            'card_payments' => ['requested' => true],
                            'transfers'     => ['requested' => true],
                        ];
                    }

                    // 3️⃣ Business type (Stripe restriction safe)
                    $businessType = ($country === 'AE') ? 'company' : 'individual';

                    // 4️⃣ Payload
                    $payload = [
                        'type'    => 'express',
                        'country' => $country,
                        'email'   => $user->email,

                        'capabilities' => $capabilities,

                        'tos_acceptance' => [
                            'service_agreement' => $serviceAgreementType,
                        ],

                        'business_type' => $businessType,

                        'business_profile' => [
                            'url' => "https://spennypiggy.co/{$user->username}",
                            'mcc' => '7278',
                        ],
                    ];

                    // 5️⃣ Default currency (ONLY if valid)
                    if (!empty($currency)) {
                        $payload['default_currency'] = strtolower($currency);
                    }

                    // 6️⃣ Create Stripe account
                    $account = StripeControl::createAccount($payload);

                    // 7️⃣ Persist safely
                    $user->update([
                        'account_id' => $account->id,
                        'country'    => $country,
                    ]);
                    $this->userProfileService->clearUserCaches($user->username, $user->id);
                } catch (\Throwable $e) {

                    Log::error('Stripe account creation failed', [
                        'user_id' => $user->id,
                        'error'   => $e->getMessage(),
                    ]);

                    return redirect(route('stripe.index'))
                        ->with('error', 'Stripe account creation failed. Please try again.');
                }
            }


            // ✅ 2. Create login link
            $loginLink = StripeControl::getLoginLink($user->account_id);

            return Inertia::location($loginLink->url);
        } catch (Exception $e) {
            return back()->with('error', $e->getMessage());
        }
    }


    /* create checkout */
    public function createCheckout($owner_id)
    {
        request()->validate([
            'digital_waiver' => ['required', 'accepted'],
        ]);

        try {
            if (!empty(request()->query('message'))) {
                $wordLimit = 100;
                $message = request()->query('message');

                if (str_word_count($message) > $wordLimit) {
                    return redirect()->back()->with("error", "Max limit for message is 100 words");
                }
            }

            $user = User::where('id', Auth::id())
                ->where('is_uk', 0)
                ->firstOrFail();

            $getdata = UserCart::where('user_id', Auth::id())
                ->where('owner_id', $owner_id)
                ->where('status', 1)
                ->with(['wish'])
                ->get();

            if (!empty($getdata) && $getdata->count() > 0) {
                foreach ($getdata as $item) {
                    if ($item->wish && $item->wish->is_suspended) {
                        return redirect()->back()->with('error', 'One or more items in your cart are suspended and cannot be purchased.');
                    }
                }
            }

            $lineItems = [];
            $totalApplicationFee = 0;
            $totalCreatorNet = 0;

            $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $owner_id);
            $reserveRate = $metrics->reserve_percent ?? 0;

            foreach ($getdata as $dd) {
                $basePrice = (float) $dd->amount;
                $vatPercent = (float) ($dd->owner->vat_amount_percentage ?? 0);
                $vatAmount = ($basePrice * $vatPercent) / 100;
                $listedPriceWithVat = $basePrice + $vatAmount;

                // Use new gross-up flow
                $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceWithVat, $dd->wish->currency ?? 'USD', $reserveRate);

                $totalPrice = $breakdown['total_supporter_pays'];
                $applicationFee = $breakdown['application_fee'];
                $creatorNet = $breakdown['net_to_creator'];

                $lineItems[] = [
                    'price_data' => [
                        'currency' => $dd->wish->currency ?? 'USD',
                        'product_data' => [
                            'name' => "Total value of item including all fees",
                            'description' => "Support payment for " . ($dd->wish->title ?? 'Wish Item'),
                        ],
                        'unit_amount' => (int)round($totalPrice * 100),
                    ],
                    'quantity' => $dd->quantity,
                ];

                $totalApplicationFee += ($applicationFee * $dd->quantity);
                $totalCreatorNet += ($creatorNet * $dd->quantity);
            }

            $stripe = StripeControl::getClient();

            $sessionCreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.success', [$owner_id]) . '?session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('checkout.cancel', [$owner_id]) . '?session_id={CHECKOUT_SESSION_ID}',
                'line_items' => $lineItems,
                'mode' => 'payment',
                'payment_intent_data' => [
                    'application_fee_amount' => (int)($totalApplicationFee * 100),
                    'receipt_email' => $user->email,
                    'description' => "Wish/Cart Payment for {$getdata[0]->owner->username} (Total value including all fees)",
                ],
                'customer_email' => $user->email,
                'metadata' => Helpers::buildStripeMetadata('wishlist', $getdata[0], [
                    'user_id' => Auth::id(),
                    'creator_id' => $owner_id,
                    'wish_id' => $getdata[0]->wish_item_id ?? null,
                    'deliverable_type' => 'media_bundle',
                    'certificate' => 'true',
                    'product_type' => 'wish_one_off',
                    'digital_waiver_confirmed_at' => now()->toDateTimeString(),
                    'digital_waiver_text' => Helpers::DIGITAL_WAIVER_TEXT,
                ]),
            ], [
                'stripe_account' => $getdata[0]->owner->account_id,
            ]);

            $stripePaymentDetail = StripePaymentDetail::create([
                'amount_subtotal' => $totalCreatorNet,
                'amount_total' => $sessionCreate->amount_total / 100,
                'tax' => $totalApplicationFee,
                'currency' => $sessionCreate->currency,
                'payment_method_config_detail_id' => optional($sessionCreate->payment_method_configuration_details)->id,
                'payment_method_type' => optional($sessionCreate->payment_method_types)[0],
                'user_id' => Auth::id(),
                'owner_id' => $owner_id,
                'name' => request()->query('from') ?? '',
                'guest_email' => request()->query('email') ?? Auth::user()->email,
                'message' => $message ?? '',
                'session_created' => $sessionCreate->created,
                'session_expires_at' => $sessionCreate->expires_at,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Helpers::applyDigitalWaiver($stripePaymentDetail, (bool) request()->digital_waiver);
            $stripePaymentDetail->save();

            $stripePaymentDetail->refresh();

            $this->userProfileService->clearUserCaches(Auth::user()->username, Auth::user()->id);

            return Inertia::location($sessionCreate->url);
        } catch (Exception $e) {
            return back()->with('error', 'Something went wrong. Error: ' . $e->getMessage());
        }
    }

    public function retrive($id)
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
        $stripe->checkout->sessions->retrieve(
            $id,
            []
        );
    }

    public function successCheckout($owner_id)
    {
        try {
            $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->get();

            foreach ($getdata as $dd) {
                $dd->status = 0;
                $dd->save();

                if (!empty($dd->wish->subscription)) {
                    if ($dd->wish->subscription == 1) {
                        if ($dd->wish->subscription_period == 'daily') {
                            $end = Carbon::now()->addDay(1);
                        } elseif ($dd->wish->subscription_period == 'weekly') {
                            $end = Carbon::now()->addWeek(1);
                        } elseif ($dd->wish->subscription_period == 'monthly') {
                            $end = Carbon::now()->addMonth(1);
                        }


                        $subscription = new Subscription();
                        $subscription->user_id = $dd->user_id;
                        $subscription->owner_id = $dd->owner_id;
                        $subscription->wish_id = $dd->wish_item_id;
                        $subscription->start_at = Carbon::now();
                        $subscription->end_at = $end;
                        $subscription->status = 1;
                        $subscription->save();
                    } elseif ($dd->wish->subscription == 2) {
                        $dd->wish->fullfill_amount += $dd->amount;
                        $dd->wish->save();
                    }
                }
            }

            $sessionId = request()->query('session_id') ?? session('session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();
            foreach ($getdata as $dd) {
                $payment_data = StripePaymentItems::create([
                    'uuid' => (string) Str::uuid(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_item_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'total_paid' => (float)$dd->amount + (float)($dd->tax ?? 0),
                    'tax' => $dd->tax,
                    'anonymous' => $dd->anonymous ?? false,
                    'message' => $dd->message ?? null,
                ]);
                $payment_data->refresh();


                // if ($dd->wish_item_id == NULL) {
                //     CheckoutUser::dispatch($payment_data, false, $dd, $message, false);
                // } else {
                //     CheckoutUser::dispatch($payment_data, false, false, $message, false);
                // }
            }

            // CheckoutMailToUser::dispatch($stripeid);
            // NOTE: Disabled to prevent duplicate emails - CheckoutController handles this with proper currency

            if (!empty($getdata[0]->owner->username)) {
                $this->userProfileService->clearUserCaches($getdata[0]->owner->username, $getdata[0]->owner->id);
                return redirect(route('user.show', [$getdata[0]->owner->username]))->with('success', 'Payment Successfull.');
            } else {
                $this->userProfileService->clearUserCaches(Auth::user()->username, Auth::user()->id);
                return redirect(route('user.show', [Auth::user()->username]))->with('success', 'Payment Successfull.');
            }
        } catch (\Throwable $th) {
            Log::info('error:' . $th);
        }
    }

    public function cancelCheckout($owner_id)
    {
        $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();
        $sessionId = request()->query('session_id') ?? session('session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);
        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('error', 'Payment Cancel.');
        // return view('cancel');
    }

    public function createAnonymousCheckout($device_id)
    {
        request()->validate([
            'digital_waiver' => ['required', 'accepted'],
        ]);

        try {
            // \Log::info(request()->query('name'));
            $cart = UserCart::where('device_id', $device_id)->where('status', 1)->with('owner', 'wish')->get();

            if (!empty($cart) && $cart->count() > 0) {
                // Check if any cart item is suspended
                foreach ($cart as $item) {
                    if ($item->wish && $item->wish->is_suspended) {
                        return redirect()->back()->with('error', 'One or more items in your cart are suspended and cannot be purchased.');
                    }
                }

                // Get the creator from the first cart item to validate activity
                $creator = $cart[0]->owner;
                if (!$creator) {
                    return redirect()->back()->with('error', 'Creator not found.');
                }

                // NEW: Check creator activity eligibility for anonymous checkout
                $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($creator);

                if (!$activityCheck['eligible']) {
                    // Send notification to creator about blocked payment
                    $preliminaryTotal = $cart->sum(function ($item) {
                        return $item->amount * $item->quantity;
                    });
                    $creator->notify(new PaymentBlockedNotification($activityCheck, $preliminaryTotal));

                    // Log the blocked payment for analytics
                    Log::info('Anonymous cart payment blocked due to insufficient creator activity', [
                        'creator_id' => $creator->id,
                        'creator_username' => $creator->username,
                        'device_id' => $device_id,
                        'cart_items_count' => $cart->count(),
                        'preliminary_total' => $preliminaryTotal,
                        'activity_status' => $activityCheck['status'],
                        'content_count' => $activityCheck['content_count'] ?? 0
                    ]);

                    // Return user-friendly error to fan
                    return redirect()->back()->with(
                        'error',
                        app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
                    );
                }

                // Log successful activity check for analytics
                if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
                    Log::info('Anonymous cart payment allowed - creator activity check passed', [
                        'creator_id' => $creator->id,
                        'creator_username' => $creator->username,
                        'device_id' => $device_id,
                        'activity_status' => $activityCheck['status'],
                        'content_count' => $activityCheck['content_count'] ?? 0
                    ]);
                }

                $lineItems = [];
                $totalApplicationFee = 0;
                $totalCreatorNet = 0;
                $currency = $cart[0]->wish->currency ?? 'USD';

                $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $cart[0]->owner_id);
                $reserveRate = $metrics->reserve_percent ?? 0;

                foreach ($cart as $value) {
                    $basePrice = (float) $value->amount;
                    $vatPercent = (float) ($value->owner->vat_amount_percentage ?? 0);
                    $vatAmount = ($basePrice * $vatPercent) / 100;
                    $listedPriceWithVat = $basePrice + $vatAmount;

                    // Use new gross-up flow
                    $breakdown = Helpers::calculateStripeDirectChargeFlow($listedPriceWithVat, $currency, $reserveRate);

                    $totalPrice = $breakdown['total_supporter_pays'];
                    $applicationFee = $breakdown['application_fee'];
                    $creatorNet = $breakdown['net_to_creator'];

                    $lineItems[] = [
                        'price_data' => [
                            'currency' => $currency,
                            'product_data' => [
                                'name' => "Total value of item including all fees",
                                'description' => "Support payment for " . ($value->wish->title ?? 'Wish Item'),
                            ],
                            'unit_amount' => (int)round($totalPrice * 100),
                        ],
                        'quantity' => $value->quantity,
                    ];

                    $totalApplicationFee += ($applicationFee * $value->quantity);
                    $totalCreatorNet += ($creatorNet * $value->quantity);
                }

                $creator = User::find($cart[0]->owner_id);
                $connectedAccountId = $creator->account_id;

                if (empty($connectedAccountId)) {
                    return redirect()->back()->with('error', 'Creator has not connected their Stripe account.');
                }

                $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
                $sessioncreate = $stripe->checkout->sessions->create([
                    'success_url' => route('checkout.anonymous.success', [$device_id]),
                    'cancel_url' => route('checkout.anonymous.cancel', [$device_id]),
                    'line_items' => $lineItems,
                    'mode' => 'payment',
                    'payment_intent_data' => [
                        'application_fee_amount' => (int)($totalApplicationFee * 100),
                        'description' => "Anonymous Support Payment for {$creator->username} (Total value including all fees)",
                        'metadata' => Helpers::buildStripeMetadata('wishlist', $cart[0], [
                            'user_id' => null, // Anonymous purchase
                            'creator_id' => $creator->id,
                            'wish_id' => $cart[0]->wish_item_id ?? null,
                            'deliverable_type' => 'media_bundle',
                            'certificate' => 'true',
                            'product_type' => 'wish_one_off',
                            'device_id' => $device_id,
                            'creator_net_amount' => (string)($totalCreatorNet * 100),
                            'total_charge_amount' => (string)(array_sum(array_column($lineItems, 'price_data.unit_amount'))),
                            'digital_waiver_confirmed_at' => now()->toDateTimeString(),
                            'digital_waiver_text' => Helpers::DIGITAL_WAIVER_TEXT,
                        ]),
                    ],
                ], ['stripe_account' => $connectedAccountId]);

                $callbackData = $sessioncreate;
                $subtotal = $totalCreatorNet;
                $taxnew = $totalApplicationFee;

                session()->forget('anonymous_session_id');
                session(['anonymous_session_id' => $callbackData->id]);
                $stripeid = StripePaymentDetail::create([
                    'session_id' => $callbackData->id,
                    'amount_subtotal' => $subtotal,
                    'amount_total' => $callbackData->amount_total / 100,
                    'tax' => $taxnew,
                    'currency' => $callbackData->currency,
                    'owner_id' => $cart[0]->owner_id,
                    'payment_method_config_detail_id' => optional($callbackData->payment_method_configuration_details)->id,
                    'payment_method_type' => optional($callbackData->payment_method_types)[0],
                    'session_created' => $callbackData->created,
                    'name' => request()->query('from') ?? null,
                    'message' => request()->query('message') ?? null,
                    'anonymous' => request()->query('anonymous') ?? 0,
                    'session_expires_at' => $callbackData->expires_at,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]);

                Helpers::applyDigitalWaiver($stripeid, (bool) request()->digital_waiver);
                $stripeid->save();
                $stripeid->refresh();

                return Inertia::location($sessioncreate->url);
            }
        } catch (\Throwable) {
            //throw $th;
        }
    }

    public function anonymousSuccessCheckout($device_id)
    {
        try {
            $sessionId = session('anonymous_session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();

            $cart = UserCart::where('device_id', $device_id)->where('status', 1)->get();

            foreach ($cart as $value) {
                $amount = $value->amount;
                $tax = $value->tax;
                if ($value->wish_item_id != null) {
                    if ($value->wish->subscription == 2) {
                        $value->wish->fullfill_amount += $amount;
                        $value->wish->save();
                    }
                }

                $data = StripePaymentItems::create([
                    'uuid' => (string) Str::uuid(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $value->wish_item_id ?? null,
                    'amount' => $amount,
                    'total_paid' => (float)$amount + (float)($tax ?? 0),
                    'tax' => $tax,
                    'anonymous' => $value->anonymous ?? false,
                    'message' => $value->message ?? null,
                ]);
                $data->refresh();
                $value->status = 0;
                $value->save();

                // $dd->wish_id == NULL
                // CheckoutUser::dispatch($data, true, false, false, $stripeid->name);
            }


            $this->userProfileService->clearUserCaches($stripeid->owner->username, $stripeid->owner->id);
            return redirect(route('user.show', [$stripeid->owner->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable) {
            //throw $th;
        }
    }

    public function anonymousCancelCheckout()
    {
        $sessionId = session('anonymous_session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);

        return back()->with('error', 'Payment unsuccessfull.');
    }

    /**
     * Create Subscription
     *
     * @param Request $request
     * @param string $uuid WishItem UUID
     * @param string $reccure Subscription Reccurning - onetime or Continue
     * @return mixed
     */
    public function wishItemSubscribe(Request $request, $uuid, $reccure = 'continue')
    {
        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus === true) {
            $user = Auth::user();
            return to_route('user.show', ['username' => $user->username])
                ->with("error", "⚠️ Please complete your card verification payment and wait for admin approval before making further payments.");
        }

        $user = Auth::user();
        $wish = WishItem::whereUuid($uuid)->with('user')->first();
        if (!$wish) return redirect()->back()->with('error', 'Wish item not found!');
        if ($wish->is_suspended) return redirect()->back()->with('error', 'This item is currently suspended and cannot accept payments.');
        if (!$wish->user) return redirect()->back()->with('error', 'Creator not found!');

        $guestRestriction = Helpers::guestCheckoutRestriction('GBP', 0);
        if (!Auth::check() && $guestRestriction) {
            return to_route('login', [
                'redirect' => $request->fullUrl(),
                'message' => $guestRestriction['message']
            ]);
        }

        // NEW: Check creator activity eligibility
        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($wish->user);

        if (!$activityCheck['eligible']) {
            // Send notification to creator about blocked payment
            $wish->user->notify(new PaymentBlockedNotification($activityCheck, $wish->price));

            // Log the blocked payment for analytics
            Log::info('Wish subscription payment blocked due to insufficient creator activity', [
                'creator_id' => $wish->user->id,
                'creator_username' => $wish->user->username,
                'wish_item_id' => $wish->id,
                'wish_price' => $wish->price,
                'activity_status' => $activityCheck['status'],
                'content_count' => $activityCheck['content_count'] ?? 0
            ]);

            // Return user-friendly error to fan
            return redirect()->back()->with(
                'error',
                app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
            );
        }

        // Log successful activity check for analytics
        if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
            Log::info('Wish subscription payment allowed - creator activity check passed', [
                'creator_id' => $wish->user->id,
                'creator_username' => $wish->user->username,
                'wish_item_id' => $wish->id,
                'activity_status' => $activityCheck['status'],
                'content_count' => $activityCheck['content_count'] ?? 0
            ]);
        }




        $subtotals = 0;
        $totalAmount = $wish->price;

        $ConvertedToGBpAmount = Helpers::priceFormat($wish->currency, $totalAmount, 'gbp');
        $subtotals += $ConvertedToGBpAmount;

        // NEW: Risk Engine Evaluation
        $riskData = $this->enforceRiskChecks(
            $request,
            $wish->user,
            $subtotals, // Pass the total amount in GBP or use original currency? The trait expects minor units. Wait, let's use the actual price.
            $wish->currency ?? 'gbp',
            'wish_subscription',
            false // Redirect response expected
        );

        // If risk enforcement returned a redirect, return it immediately
        if ($riskData instanceof \Illuminate\Http\RedirectResponse) {
            return $riskData;
        }

        $force3DS = in_array('FORCE_3DS', $riskData['reason_codes'] ?? []);


        $chargeCurrency = $wish->currency ?? $wish->user->default_currency ?? 'usd';
        $tax = (float) str_replace(',', '', $wish->tax_amount);
        $price = (float) str_replace(',', '', $wish->price);
        $adminFee = (float) Helpers::administrationFeeInCurrency($chargeCurrency);
        $totalTax = $tax + $adminFee;
        $vat_percentage_amount = 0;

        if ($reccure === 'continue' && !empty($wish->user->vat_amount_percentage)) {
            $vat_percentage_amount = ($price + $tax) * $wish->user->vat_amount_percentage / 100;
        }

        if ($request->isMethod("POST")) {
            $guestRestriction = Helpers::guestCheckoutRestriction('GBP', $subtotals);
            if (!Auth::check() && $guestRestriction) {
                return to_route('login', [
                    'redirect' => $request->fullUrl(),
                    'message' => $guestRestriction['message']
                ]);
            }
            $request->validate([
                'name' => ['nullable', 'sometimes', 'string', 'max:50'],
                'email' => ['required', 'email:dns'],
                'message' => ['sometimes', 'nullable', 'string', 'max:800'],
                'digital_waiver' => ['required', 'accepted'],
            ]);

            // ✅ FIXED: Prevent duplicate subscriptions by canceling existing ones
            $existingSubscriptions = WishItemSubscription::where('wish_item_id', $wish->id)
                ->where(function ($q) use ($user, $request) {
                    $q->where('user_id', $user->id)
                        ->orWhere('guest_email', $request->email);
                })
                ->whereIn('status', ['paid', 'initiated'])
                ->where('recurring_for', 'continue') // Only cancel recurring subscriptions
                ->get();

            foreach ($existingSubscriptions as $existingSub) {
                if ($existingSub->stripe_id) {
                    try {
                        // Cancel the old subscription at Stripe
                        StripeControl::cancelSubscription($existingSub->stripe_id, $wish->user->account_id);

                        // Update local status
                        $existingSub->status = 'cancelled';
                        $existingSub->stripe_status = 'canceled';
                        $existingSub->canceled_at = Carbon::now();
                        $existingSub->save();

                        Log::info('StripeController: Canceled existing subscription for new subscription', [
                            'old_subscription_id' => $existingSub->id,
                            'old_stripe_id' => $existingSub->stripe_id,
                            'user_id' => $user->id,
                            'wish_item_id' => $wish->id
                        ]);
                    } catch (\Exception $e) {
                        Log::warning('StripeController: Failed to cancel existing subscription', [
                            'old_subscription_id' => $existingSub->id,
                            'old_stripe_id' => $existingSub->stripe_id,
                            'error' => $e->getMessage()
                        ]);
                        // Mark as cancelled locally even if Stripe call fails
                        $existingSub->status = 'cancelled';
                        $existingSub->save();
                    }
                }
            }

            $vatPercent = $wish->user->vat_amount_percentage ?? 0;
            $vatAmountCalculated = $price * $vatPercent / 100;
            $priceWithVat = $price + $vatAmountCalculated;
            $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $chargeCurrency);
            $finalTotalAmount = $breakdown['total_supporter_pays'];

            $sub = WishItemSubscription::create([
                'wish_item_id'   => $wish->id,
                'user_id'        => Auth::id(),
                'guest_name'     => $request->name ?? NULL,
                'guest_email'    => $request->email,
                'currency'       => $wish->currency,
                'amount'         => $wish->price,
                'total_paid'     => $finalTotalAmount,
                'tax'            => $totalTax,
                'vat_tax_amount' => ceil($vat_percentage_amount),
                'recurring_for'  => $reccure,
                'recurring_type' => $wish->subscription_period,
                'payment_method' => 'stripe',
                'surprise_message' => $request->message ?? NULL,
                'anonymous' => $request->anonymous ?? 0
            ]);

            Helpers::applyDigitalWaiver($sub, (bool) $request->digital_waiver);
            $sub->save();

            $connectedAccountId = $wish->user->account_id;

            $storeCustomer = ConnectedAccountCustomer::where([
                'user_id' => $user->id ?? null,
                'creator_id' => $wish->user->id,
                'connected_account_id' => $connectedAccountId,
                'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                'currency' => $chargeCurrency
            ])->first();

            if (!$storeCustomer) {
                $customer = StripeControl::createCustomer([
                    'email' => $user->email ?? $request->email,
                    'name' => $user->name ?? $request->name,
                ], $connectedAccountId);
            }

            $basePrice = $price;

            $applicationFeeAmount = $breakdown['application_fee'];
            $creatorNet = $breakdown['net_to_creator'];
            $applicationFeePercent = round(($applicationFeeAmount / $finalTotalAmount) * 100, 2);

            // Look for existing price with same currency
            $existingPrice = ConnectedAccountCustomer::where([
                'user_id' => $user->id ?? null,
                'creator_id' => $wish->user->id,
                'connected_account_id' => $connectedAccountId,
                'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                'product_id' => $wish->stripe_product_id,
                'currency' => $chargeCurrency
            ])->first();

            $priceId = $existingPrice->price_id ?? null;

            $currencyModel = Currency::where('ISO', strtoupper($chargeCurrency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            if (!$priceId) {

                $priceParams = [
                    'unit_amount' => round($finalTotalAmount * $multiplier),
                    'currency' => $chargeCurrency,
                    'product' => $wish->stripe_product_id,
                ];
                if ($reccure !== 'onetime') {
                    $priceParams['recurring'] = [
                        'interval' => StripeControl::$periods[$wish->subscription_period],
                        'interval_count' => 1,
                    ];
                }

                $priceObj = StripeControl::createPrice($priceParams, $connectedAccountId);
                $priceId = $priceObj->id;
            }

            $customer_id = $storeCustomer->stripe_customer_id ?? $customer->id;

            // Handle currency mismatch for customer
            $existingSubscription = StripeControl::getActiveSubscriptionByCustomer($customer_id, $connectedAccountId);
            if ($existingSubscription && $existingSubscription->currency !== $chargeCurrency) {
                $customer = StripeControl::createCustomer([
                    'email' => $user->email ?? $request->email,
                    'name' => $user->name ?? $request->name,
                ], $connectedAccountId);

                $customer_id = $customer->id;

                ConnectedAccountCustomer::create([
                    'user_id' => $user->id ?? null,
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'stripe_customer_id' => $customer_id,
                    'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                    'product_id' => $wish->stripe_product_id,
                    'price_id' => $priceId,
                    'currency' => $chargeCurrency
                ]);
            }

            if (!$storeCustomer) {
                ConnectedAccountCustomer::create([
                    'user_id' => $user->id ?? null,
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'stripe_customer_id' => $customer_id,
                    'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                    'product_id' => $wish->stripe_product_id,
                    'price_id' => $priceId,
                    'currency' => $chargeCurrency
                ]);
            }

            // Use Direct Charges pattern (Standard/Express accounts)
            // Single line item hiding all fees
            $lineItems = [
                [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $chargeCurrency,
                        'product_data' => [
                            'name' => "Wish: {$wish->name} (Total value including all fees)",
                            'description' => "Subscription content from {$wish->user->name}",
                        ],
                        'unit_amount' => round($finalTotalAmount * $multiplier),
                    ]
                ]
            ];

            // Add recurring data for non-onetime subscriptions
            if ($reccure !== 'onetime') {
                $lineItems[0]['price_data']['recurring'] = [
                    'interval' => StripeControl::$periods[$wish->subscription_period],
                    'interval_count' => 1,
                ];
            }

            // Creator Net Amount = what creator receives after Stripe fees
            $creatorNetAmount = round($creatorNet * $multiplier);

            // Total charge amount = what supporter pays
            $totalChargeAmount = round($finalTotalAmount * $multiplier);

            // Check if creator has card_payments capability to determine payment flow
            $hasCardPayments = StripeControl::hasCardPaymentsCapability($connectedAccountId);

            if (!$hasCardPayments) {
                $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
                return back()->with('error', app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck));
            }

            $payload = [
                'mode' => $reccure === 'onetime' ? 'payment' : 'subscription',
                'payment_method_types' => ['card'],
                'line_items' => $lineItems, // Total amount determined by line items
                'customer' => $customer_id,
                'success_url' => route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => 'success']),
                'cancel_url' => route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => 'cancel']),
            ];

            // Risk Engine: Force 3DS if Step-Up required
            if (isset($force3DS) && $force3DS) {
                $payload['payment_method_options'] = [
                    'card' => [
                        'request_three_d_secure' => 'any',
                    ],
                ];
            }

            if ($reccure === 'onetime') {
                $paymentIntentData = [
                    'description' => "One-time Wish Subscription for {$wish->user->username} (Total value including all fees)",
                    'metadata' => Helpers::buildStripeMetadata('wish_subscription', $sub, [
                        'creator_id' => (string) $wish->user->id,
                        'wish_id' => (string) $wish->id,
                        'deliverable_type' => $reccure === 'onetime' ? 'media_bundle' : 'access',
                        'certificate' => 'true',
                        'product_type' => $reccure === 'onetime' ? 'wish_onetime' : 'wish_subscription',
                        'wishlist_item_id' => (string) $wish->id,
                        'item_amount' => (string) round($basePrice * $multiplier),
                        'creator_net_amount' => (string) $creatorNetAmount,
                        'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                        'total_charge_amount' => (string) $totalChargeAmount,
                        'payment_type' => 'One-time Wish Subscription - Direct Charge',
                        'anonymous' => (string) ($sub->anonymous ?? 0),
                        'has_card_payments' => (string) $hasCardPayments,
                    ]),
                    'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
                ];

                if ($user->email) {
                    $paymentIntentData['receipt_email'] = $user->email;
                }

                // Direct Charges used
                // Funds go to connected account, platform takes application fee.

                $payload['payment_intent_data'] = $paymentIntentData;

                Log::info('Wish subscription payment flow determined', [
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'payment_type' => 'onetime_direct'
                ]);
            } else {
                $subscriptionData = [
                    'description' => 'Wish Item Subscription Content Purchase.',
                    'metadata' => Helpers::buildStripeMetadata('wish_subscription', $sub, [
                        'creator_id' => (string) $wish->user->id,
                        'wish_id' => (string) $wish->id,
                        'deliverable_type' => $reccure === 'onetime' ? 'media_bundle' : 'access',
                        'certificate' => 'true',
                        'product_type' => $reccure === 'onetime' ? 'wish_onetime' : 'wish_subscription',
                        'wishlist_item_id' => (string) $wish->id,
                        'item_amount' => (string) round($basePrice * $multiplier),
                        'creator_net_amount' => (string) $creatorNetAmount,
                        'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                        'total_charge_amount' => (string) $totalChargeAmount,
                        'payment_type' => 'Recurring Wish Subscription - Direct Charge',
                        'anonymous' => (string) ($sub->anonymous ?? 0),
                        'has_card_payments' => (string) $hasCardPayments,
                    ]),
                    'application_fee_percent' => $applicationFeePercent,
                ];

                // Direct Charges used

                $payload['subscription_data'] = $subscriptionData;

                Log::info('Wish subscription payment flow determined', [
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'payment_type' => 'subscription_direct'
                ]);
            }

            try {
                // Create session on CONNECTED account
                $session = StripeControl::createCheckoutSession($payload, $connectedAccountId, current(compact('force3DS')), $wish->user->username);
                $sub->update(['session_id' => $session->id]);
                return Inertia::location($session->url);
            } catch (Exception $e) {
                $sub->delete();
                Log::error("Stripe Checkout Error: " . $e->getMessage());
                return back()->with('error', $e->getMessage());
            }
        }

        return Inertia::render('cart/SubCheckout', [
            'wish' => $wish,
            'vat_amount' => $vat_percentage_amount,
            'reccure' => $reccure
        ]);
    }

    /**
     * Handle Checkout Session
     *
     * @param string $uuid Subscription UUID
     * @return mixed
     */
    public function handleSubscription($uuid)
    {
        $sub = WishItemSubscription::whereUuid($uuid)->first();
        if (!$sub) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($sub->status !== 'initiated') {
            return to_route('user.show', ['username' => $sub->user->username])->with("success", 'Subscription already processed!');
        }
        try {
            // Retrieve session from connected account
            $session = StripeControl::getCheckoutSession($sub->session_id, $sub->wish_item->user->account_id);

            $sub->status = $session->payment_status;
            if ($session->payment_status == 'paid') {

                $symbol = Currency::where('iso', strtoupper($sub->currency))->first();
                if (!$symbol) {
                    Log::error("Currency not found for ISO: " . strtoupper($sub->currency));
                    return to_route('user.show', ['username' => $sub->wish_item->user->username])->with('error', 'Currency configuration error. Please contact support.');
                }
                $creatorAmount = $sub->amount + $sub->vat_tax_amount;
                $creatorFinalAmount = $symbol->symbol . $creatorAmount;
                // Include subscription period in amount display
                $subscriptionPeriod = $sub->wish_item->subscription_period ?? 'monthly';
                $amountTotal = $symbol->symbol . $sub->amount . '/' . $subscriptionPeriod;
                $creator_name = $sub->wish_item->user->name;
                $mailToSend = $sub->guest_email;

                Log::info('StripeController: Starting subscription email handling', [
                    'subscription_id' => $sub->id,
                    'wish_item_id' => $sub->wish_item->id,
                    'recurring_for' => $sub->recurring_for,
                    'has_content_file' => !empty($sub->wish_item->content_file),
                    'has_reward' => !empty($sub->wish_item->reward),
                    'guest_email' => $sub->guest_email
                ]);

                // ✅ NEW: Use CheckoutMailToUser system for ALL subscriptions (both one-time and recurring)
                // This ensures consistent email delivery with content URLs and deliverable creation
                try {
                    // Create actual StripePaymentDetail record that works with CheckoutMailToUser
                    $stripePayment = $this->createStripePaymentForSubscription($sub, $session);

                    Log::info('StripeController: Created StripePaymentDetail for subscription', [
                        'subscription_id' => $sub->id,
                        'stripe_payment_id' => $stripePayment->id,
                        'session_id' => $stripePayment->session_id,
                        'user_id' => $stripePayment->user_id,
                        'owner_id' => $stripePayment->owner_id
                    ]);

                    // Get currency symbol for email
                    $currency = Currency::where('iso', strtoupper($sub->currency))->first();
                    $currencySymbol = $currency ? $currency->symbol : '£';

                    // Dispatch CheckoutMailToUser with real StripePaymentDetail - this will create deliverables and send email with content
                    CheckoutMailToUser::dispatch($stripePayment, $currencySymbol);

                    Log::info('StripeController: CheckoutMailToUser dispatched for subscription deliverables', [
                        'subscription_id' => $sub->id,
                        'stripe_payment_id' => $stripePayment->id,
                        'currency_symbol' => $currencySymbol,
                        'email_address' => $sub->guest_email
                    ]);
                } catch (\Exception $e) {
                    Log::error('StripeController: Failed to dispatch CheckoutMailToUser for subscription', [
                        'subscription_id' => $sub->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }

                // ✅ ALWAYS send WishSubscriptionMailToUser - this is the confirmation email to the gifter
                // This should be sent regardless of CheckoutMailToUser success/failure
                WishSubscriptionMailToUser::dispatch($sub, $mailToSend, $amountTotal, $creator_name);
                Log::info('StripeController: WishSubscriptionMailToUser dispatched for gifter confirmation', [
                    'subscription_id' => $sub->id,
                    'gifter_email' => $mailToSend,
                    'amount_total' => $amountTotal,
                    'creator_name' => $creator_name
                ]);

                $sub->stripe_id = $session->subscription;

                // ✅ FIXED: Retrieve and populate full Stripe subscription data
                try {
                    if ($session->subscription) {
                        // Get full subscription details from Stripe to populate new fields
                        $stripeSubscription = StripeControl::getSubscription($session->subscription, $sub->wish_item->user->account_id);

                        // Populate the new Stripe subscription fields
                        $sub->stripe_status = $stripeSubscription->status;
                        $sub->cancel_at_period_end = $stripeSubscription->cancel_at_period_end;
                        $sub->current_period_start = Carbon::createFromTimestamp($stripeSubscription->current_period_start);
                        $sub->current_period_end = Carbon::createFromTimestamp($stripeSubscription->current_period_end);

                        // Set canceled_at if subscription is canceled
                        if (isset($stripeSubscription->canceled_at) && $stripeSubscription->canceled_at) {
                            $sub->canceled_at = Carbon::createFromTimestamp($stripeSubscription->canceled_at);
                        }

                        // Set trial dates if they exist
                        if (isset($stripeSubscription->trial_start) && $stripeSubscription->trial_start) {
                            $sub->trial_start = Carbon::createFromTimestamp($stripeSubscription->trial_start);
                        }
                        if (isset($stripeSubscription->trial_end) && $stripeSubscription->trial_end) {
                            $sub->trial_end = Carbon::createFromTimestamp($stripeSubscription->trial_end);
                        }

                        // Store relevant Stripe metadata
                        $sub->stripe_metadata = [
                            'stripe_customer_id' => $stripeSubscription->customer ?? null,
                            'stripe_price_id' => $stripeSubscription->items->data[0]->price->id ?? null,
                            'collection_method' => $stripeSubscription->collection_method ?? null,
                            'billing_cycle_anchor' => $stripeSubscription->billing_cycle_anchor ?? null,
                            'created' => $stripeSubscription->created ?? null
                        ];

                        // Use current_period_end for upcoming_payment instead of manual calculation
                        $sub->upcoming_payment = Carbon::createFromTimestamp($stripeSubscription->current_period_end);

                        Log::info('StripeController: Populated subscription with Stripe data', [
                            'subscription_id' => $sub->id,
                            'stripe_id' => $sub->stripe_id,
                            'stripe_status' => $sub->stripe_status,
                            'current_period_start' => $sub->current_period_start,
                            'current_period_end' => $sub->current_period_end,
                            'cancel_at_period_end' => $sub->cancel_at_period_end,
                            'upcoming_payment' => $sub->upcoming_payment
                        ]);
                    } else {
                        // Fallback for one-time payments or sessions without subscriptions
                        Log::warning('StripeController: No subscription ID in session, using fallback calculation', [
                            'subscription_id' => $sub->id,
                            'session_id' => $session->id,
                            'payment_status' => $session->payment_status
                        ]);

                        $current = Carbon::now();
                        if ($sub->recurring_type == 'daily') {
                            $current->addDay();
                        } else if ($sub->recurring_type == 'weekly') {
                            $current->addWeek();
                        } else if ($sub->recurring_type == "monthly") {
                            $current->addMonth();
                        } else {
                            $current->addYear();
                        }
                        $sub->upcoming_payment = $current;
                        $sub->stripe_status = 'active'; // Default for one-time payments
                    }
                } catch (\Exception $e) {
                    Log::error('StripeController: Failed to retrieve Stripe subscription details', [
                        'subscription_id' => $sub->id,
                        'stripe_id' => $session->subscription,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);

                    // Fallback to manual calculation if Stripe API fails
                    $current = Carbon::now();
                    if ($sub->recurring_type == 'daily') {
                        $current->addDay();
                    } else if ($sub->recurring_type == 'weekly') {
                        $current->addWeek();
                    } else if ($sub->recurring_type == "monthly") {
                        $current->addMonth();
                    } else {
                        $current->addYear();
                    }
                    $sub->upcoming_payment = $current;
                    $sub->stripe_status = 'active'; // Default fallback
                }

                $sub->save();

                if ($sub->recurring_for == 'onetime') {
                    SubscriptionCancelAtEnd::dispatch($sub);
                } else {
                    SubscribedMail::dispatch($sub, $creatorFinalAmount);
                }

                // ❌ REMOVED: Duplicate deliverable creation - CheckoutMailToUser will handle this properly

                if ($sub->wish_item->user->auto_tweet == 1) {
                    // MakeAutoTweets::dispatch($user);
                    SubscribeAutoTweet::dispatch($sub);
                }

                if ($sub->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $sub->guest_name ?? "Anonymous user";
                }

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $sub->user_id ?? null;
                $userPayment->to_user_id = $sub->wish_item->user_id;
                $userPayment->product_type = 'wish item subscription';
                $userPayment->amount = $sub->wish_item->price; // Use wish item price directly (no fees)

                // Ensure total_paid is updated in WishItemSubscription if missing
                if (!$sub->total_paid || $sub->total_paid <= 0) {
                    $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                    $sub->total_paid = (float) ($session->amount_total / $multiplier);
                    $sub->save();
                }

                $userPayment->total_paid = $sub->total_paid;
                $userPayment->currency = $sub->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();

                // -------------------------------------------------------------
                // NEW: Ensure a `payments` table record exists for Wish Subscriptions
                // This makes it show up in the Financial Hub and Reserve calculations
                // -------------------------------------------------------------
                try {
                    $paymentIntentId = $session->payment_intent ?? ($stripeSubscription->latest_invoice->payment_intent ?? null);
                    if ($paymentIntentId) {
                        $existingPayment = \App\Models\Payment::where('stripe_payment_intent_id', $paymentIntentId)->first();

                        $isZeroDecimal = \App\Helpers::isZeroDecimalCurrency($sub->currency ?? 'GBP');
                        $multiplier = $isZeroDecimal ? 1 : 100;

                        // Use actual creator net from session metadata if available, otherwise calculate
                        $creatorNetMinor = round($sub->amount * $multiplier); // Default fallback
                        if ($session && isset($session->metadata->creator_net_amount)) {
                            $creatorNetMinor = (int) $session->metadata->creator_net_amount;
                        } else if ($session && isset($session->subscription)) {
                            // Try to get from subscription metadata
                            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
                            try {
                                $stripeSub = $stripe->subscriptions->retrieve($session->subscription);
                                if (isset($stripeSub->metadata->creator_net_amount)) {
                                    $creatorNetMinor = (int) $stripeSub->metadata->creator_net_amount;
                                }
                            } catch (\Exception $e) {
                                // Ignore
                            }
                        }

                        // Calculate initial reserve if needed
                        $reserveMinor = 0;
                        $metrics = \App\Models\CreatorMetric::firstOrCreate(['creator_id' => $sub->wish_item->user->uuid]);
                        $reservePercent = app(\App\Services\Risk\ReservePolicy::class)->getEffectiveReservePercent($sub->wish_item->user, $metrics, now());
                        if ($reservePercent > 0) {
                            $reserveMinor = (int) round(($creatorNetMinor * $reservePercent) / 100);
                        }

                        if (!$existingPayment) {
                            \App\Models\Payment::create([
                                'creator_id' => $sub->wish_item->user->uuid,
                                'amount' => $creatorNetMinor,
                                'currency' => strtolower($sub->currency),
                                'stripe_payment_intent_id' => $paymentIntentId,
                                'stripe_session_id' => $session->id,
                                'status' => 'succeeded',
                                'reserve_amount_minor' => $reserveMinor,
                            ]);
                        } else {
                            if ((int) ($existingPayment->reserve_amount_minor ?? 0) === 0 && $reservePercent > 0) {
                                $existingPayment->update(['reserve_amount_minor' => $reserveMinor]);
                            }
                        }

                        // Sync to FinancialTransaction to reflect on dashboard
                        $stripeFeeMinor = 0;
                        if (!empty($paymentIntentId)) {
                            $stripeFeeMinor = StripeControl::getStripeFeeMinorForPaymentIntent((string) $paymentIntentId, $sub->wish_item->user->account_id);
                        }
                        $stripeFee = $isZeroDecimal ? (float) $stripeFeeMinor : ((float) $stripeFeeMinor / 100);

                        $gross = $sub->total_paid && $sub->total_paid > 0 ? (float) $sub->total_paid : $creatorAmount;
                        $platformFee = $gross - $stripeFee - (float) $sub->amount - (float) $sub->vat_tax_amount;
                        if ($platformFee < 0) $platformFee = 0;

                        \App\Models\FinancialTransaction::updateOrCreate(
                            ['stripe_payment_intent_id' => $paymentIntentId],
                            [
                                'user_id' => $sub->wish_item->user->id,
                                'type' => 'wish_subscription',
                                'amount' => $sub->amount,
                                'currency' => strtoupper($sub->currency),
                                'status' => 'completed',
                                'stripe_fee' => $stripeFee,
                                'platform_fee' => $platformFee,
                                'net_amount' => $sub->amount,
                                'metadata' => json_encode(['wish_item_id' => $sub->wish_item->id])
                            ]
                        );
                    }
                } catch (\Exception $e) {
                    Log::error("Failed to create Payment/FinancialTransaction record for wish subscription: " . $e->getMessage());
                }
                // -------------------------------------------------------------

                $message = $username . " just subscribed to your subscription wish " . $sub->wish_item->name;
                NotificationSave::dispatch($message, $sub->wish_item->user, $sub->user, 'Wish Subscription');
                $message = null;
                if ($sub->recurring_for == 'onetime') {
                    $message = 'Subscription Success! If you have paid for onetime subscription, it will be automatically cancelled after 24 hours.';
                } else {
                    $message = 'Subscription Payment Successfully Paid.';
                }
                $this->userProfileService->clearUserCaches($sub->wish_item->user->username, $sub->wish_item->user->id);

                $thankYouParams = [
                    'username' => $sub->wish_item->user->username,
                    'type' => 'wish',
                    'item_name' => $sub->wish_item->name,
                    'amount' => $sub->amount ?? 0,
                    'currency' => $sub->currency ?? 'GBP',
                    'item_id' => $sub->wish_item->id
                ];

                if ($sub->wish_item->content_file) {
                    $thankYouParams['wish_content'] = [
                        'type' => $sub->wish_item->content_file_type,
                        'name' => $sub->wish_item->content_file_name,
                        'url'  => $sub->wish_item->content_file_url
                    ];
                }

                return to_route('thank-you', $thankYouParams)->with('success', $message);
            }

            SubscriptionFailed::dispatch($sub);

            $sub->save();
            return to_route('user.show', ['username' => $sub->wish_item->user->username])->with('warning', "Subscription is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $sub->wish_item->user->username])->with('error', $e->getMessage());
        }
        // return response()->json([
        //     'success'   =>  true,
        //     'session'   =>  $session,
        //     'status'    =>  $status
        // ]);
    }

    /**
     * Create StripePaymentDetail record for subscription to work with CheckoutMailToUser
     */
    private function createStripePaymentForSubscription($subscription, $session)
    {
        try {
            // Create a proper StripePaymentDetail record that works with CheckoutMailToUser system
            $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
            $totalPaid = (float) ($session->amount_total / $multiplier);

            $stripePayment = StripePaymentDetail::create([
                'uuid' => Str::uuid(),
                'session_id' => $subscription->session_id,
                'user_id' => $subscription->user_id,
                'owner_id' => $subscription->wish_item->user_id,
                'stripe_payment_intent_id' => $session->payment_intent ?? null,
                'amount_subtotal' => $subscription->wish_item->price, // Use wish item price directly
                'amount_total' => $totalPaid,
                'currency' => $subscription->currency,
                'payment_status' => $session->payment_status,
                'guest_email' => $subscription->guest_email,
                'guest_name' => $subscription->guest_name,
                'anonymous' => $subscription->anonymous ?? false,
                'message' => $subscription->surprise_message,
                'digital_waiver_confirmed_at' => $subscription->digital_waiver_confirmed_at,
                'digital_waiver_text' => $subscription->digital_waiver_text,
                'metadata' => json_encode([
                    'subscription_id' => $subscription->id,
                    'wish_item_id' => $subscription->wish_item->id,
                    'subscription_type' => $subscription->recurring_for,
                    'content_delivery' => true
                ])
            ]);

            // Create the corresponding stripe payment items for the subscription
            $stripePaymentItem = StripePaymentItems::create([
                'uuid' => Str::uuid(),
                'stripe_payment_detail_id' => $stripePayment->id,
                'wish_item_id' => $subscription->wish_item->id,
                'amount' => $subscription->wish_item->price, // Use wish item price directly
                'total_paid' => $totalPaid,
                'quantity' => 1,
                'message' => $subscription->surprise_message,
                'anonymous' => $subscription->anonymous ?? false
            ]);

            Log::info('StripeController: Created StripePaymentDetail and Item for subscription', [
                'subscription_id' => $subscription->id,
                'stripe_payment_id' => $stripePayment->id,
                'stripe_payment_item_id' => $stripePaymentItem->id,
                'wish_item_id' => $subscription->wish_item->id
            ]);

            return $stripePayment;
        } catch (\Exception $e) {
            Log::error('StripeController: Failed to create StripePaymentDetail for subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function subscriptionStatus(Request $request)
    {
        $stripe = StripeControl::getClient();

        // This is your Stripe CLI webhook secret for testing your endpoint locally.

        // $payload = @file_get_contents('php://input');
        $endpoint_secret = env('STRIPE_WEBHOOK_SECRET');
        $payload = $request->getContent();
        $sig_header = $request->header('Stripe-Signature');
        $event = null;

        try {
            $event = Webhook::constructEvent(
                $payload,
                $sig_header,
                $endpoint_secret
            );
        } catch (\UnexpectedValueException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage()
            ]);
            // Invalid payload
            http_response_code(400);
            exit();
        } catch (\Stripe\Exception\SignatureVerificationException $e) {
            return response()->json([
                'status' => false,
                'message' => $e->getMessage(),
            ]);
            // Invalid signature
            http_response_code(400);
            exit();
        }

        $array = [];
        if (!empty($event)) {
            $charge = $event->data->object;

            // Get email from billing_details
            $email = $charge->billing_details->email ?? null;
            $user = User::where('email', $email)->where('is_uk', 0)->first();
            if (!$user) {
                return response()->json([
                    'status' => true,
                    'message' => 'user not found',
                ]);
            }
            $subs = StripePaymentDetail::where('user_id', $user->id)->whereIn('payment_status', ['paid', 'pending'])->latest()->first();
            StripeControl::getSubscription($event->data->object->subscription);
            if ($charge->object == 'charge') {
                if ($event->type == "customer.subscription.deleted" && !empty($subs)) {
                    $subs->payment_status = 'cancelled';
                    $subs->save();

                    if ($subs->user) {
                        $this->userProfileService->clearUserCaches($subs->user->username, $subs->user->id);
                    }
                    if ($subs->owner) {
                        $this->userProfileService->clearUserCaches($subs->owner->username, $subs->owner->id);
                    }

                    SendRenewMail::dispatch($array, 'cancelled', 'main');
                } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
                    $subs->payment_status = 'failed';
                    $subs->save();

                    if ($subs->user) {
                        $this->userProfileService->clearUserCaches($subs->user->username, $subs->user->id);
                    }
                    if ($subs->owner) {
                        $this->userProfileService->clearUserCaches($subs->owner->username, $subs->owner->id);
                    }

                    SendRenewMail::dispatch($array, 'failed', 'main');
                } elseif ($event->type == "charge.updated" && !empty($subs)) {

                    $subs->payment_status = $charge->status ?? 'unknown';
                    $subs->save();

                    $array = [
                        'email' => $email,
                        'name' => $charge->billing_details->name ?? null,
                        'uuid' => $subs->uuid,
                        'notification' => $subs->user->notification_send ?? 0,
                        'trial_end' => $subs->upcoming_payment ?? null,
                        'amount' => $subs->amount ?? null,
                        'currency' => $subs->currency ?? 'GBP',
                    ];

                    SendRenewMail::dispatch($array, $subs->payment_status, 'main');

                    if ($subs->user) {
                        $this->userProfileService->clearUserCaches($subs->user->username, $subs->user->id);
                    }
                    if ($subs->owner) {
                        $this->userProfileService->clearUserCaches($subs->owner->username, $subs->owner->id);
                    }
                }

                if (!empty($subs)) {
                    $stripe = new StripeWebhookStatus;
                    $stripe->subscription_id = $subs->id;
                    $stripe->invoice_type = $event->type;
                    $stripe->data = $event;
                    $stripe->save();

                    // Clear cache for the user (gifter) and owner (creator)
                    if ($subs->user) {
                        $this->userProfileService->clearUserCaches($subs->user->username, $subs->user->id);
                    }
                    if ($subs->owner) {
                        $this->userProfileService->clearUserCaches($subs->owner->username, $subs->owner->id);
                    }
                }
            }

            // Handle invoice.payment_succeeded events for wish item subscription renewals
            if ($event->type == "invoice.payment_succeeded") {
                $this->handleSubscriptionRenewal($event);
            }

            // Handle invoice.paid events for wish item subscriptions
            if ($event->type == "invoice.paid" && !empty($subs)) {
                // Find the subscription to get wish item info
                $subscriptionId = $event->data->object->subscription ?? null;
                if ($subscriptionId) {
                    $wishSubscription = WishItemSubscription::where('stripe_id', $subscriptionId)->where('status', 'paid')->first();

                    if ($wishSubscription && $wishSubscription->wish_item) {
                        Log::info('Processing invoice.paid for wish subscription', [
                            'subscription_id' => $subscriptionId,
                            'wish_item_id' => $wishSubscription->wish_item->id,
                            'event_type' => $event->type
                        ]);

                        // Check if wish item has content to deliver
                        if (!empty($wishSubscription->wish_item->content_file) || !empty($wishSubscription->wish_item->reward)) {

                            $creatorUuid = $wishSubscription->wish_item && $wishSubscription->wish_item->user ? $wishSubscription->wish_item->user->uuid : null;
                            $metrics = $creatorUuid ? app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $creatorUuid) : null;
                            $reserveRate = $metrics ? ($metrics->reserve_percent ?? 0) : 0;

                            // Use consistent fee calculation for creator net amount
                            $breakdown = Helpers::calculateStripeDirectChargeFlow($wishSubscription->amount, $wishSubscription->currency, $reserveRate);
                            $creatorNet = $breakdown['net_to_creator'];

                            // Create deliverable record for tracking
                            $deliverable = Deliverable::create([
                                'uuid' => Str::uuid(),
                                'product_id' => (string) $wishSubscription->wish_item->id,
                                'item_id' => $wishSubscription->wish_item->id,
                                'creator_id' => $wishSubscription->wish_item->user_id,
                                'gifter_id' => $wishSubscription->user_id,
                                'session_id' => $wishSubscription->session_id,
                                'payment_intent_id' => $event->data->object->payment_intent ?? null,
                                'deliverable_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
                                'product_type' => 'wish_subscription_content',
                                'transaction_amount' => $wishSubscription->amount,
                                'status' => 'pending',
                                'customer_email' => $wishSubscription->guest_email,
                                'customer_name' => $wishSubscription->guest_name,
                                'anonymous' => $wishSubscription->anonymous ?? false,
                                'message' => $wishSubscription->surprise_message,
                                'metadata' => json_encode([
                                    'wish_id' => $wishSubscription->wish_item->id,
                                    'subscription_id' => $wishSubscription->id,
                                    'stripe_subscription_id' => $subscriptionId,
                                    'creator_net_amount' => $creatorNet,
                                    'subscription_payment' => true,
                                    'content_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                                    'invoice_id' => $event->data->object->id,
                                    'billing_reason' => $event->data->object->billing_reason ?? null
                                ])
                            ]);

                            // Dispatch ProcessWishItemDeliverable job for content processing
                            ProcessWishItemDeliverable::dispatch($deliverable);

                            // Update Stripe payment intent metadata (exactly like membership)
                            if ($event->data->object->payment_intent) {
                                try {
                                    $stripeMetadataService = app(StripeMetadataService::class);
                                    $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                                        'wish_content_processed_at' => now()->toISOString(),
                                        'immediate_delivery' => 'true'
                                    ]);
                                } catch (\Exception $e) {
                                    Log::error('StripeController: Failed to update Stripe metadata for wish subscription', [
                                        'deliverable_id' => $deliverable->id,
                                        'payment_intent_id' => $event->data->object->payment_intent,
                                        'error' => $e->getMessage()
                                    ]);
                                }
                            }

                            Log::info('Subscription content delivery job dispatched', [
                                'deliverable_id' => $deliverable->id,
                                'subscription_id' => $subscriptionId,
                                'wish_item_id' => $wishSubscription->wish_item->id,
                                'has_content_file' => !empty($wishSubscription->wish_item->content_file),
                                'has_reward' => !empty($wishSubscription->wish_item->reward)
                            ]);

                            // Send subscription payment notification using existing wish subscription email
                            $currency = Currency::where('iso', strtoupper($wishSubscription->currency ?? 'gbp'))->first();
                            $currencySymbol = $currency ? $currency->symbol : '£';
                            $formattedAmount = $currencySymbol . number_format($wishSubscription->amount, 2);
                            $subscriptionPeriod = $wishSubscription->wish_item->subscription_period ?? 'monthly';
                            $paymentAmount = $formattedAmount . '/' . $subscriptionPeriod;

                            // Use existing wish subscription email system
                            WishSubscriptionMailToUser::dispatch(
                                $wishSubscription,
                                $wishSubscription->guest_email,
                                $paymentAmount,
                                $wishSubscription->wish_item->user->name,
                                true // is_renewal = true for subscription payments
                            );
                        }
                    }
                }
            }

            // if ($event->type == "invoice.updated" && !empty($subs)) {

            //     $array = [
            //         'email' => $event->data->object->customer_email,
            //         'name' => $event->data->object->customer_name,
            //         'invoice_pdf' => $event->data->object->invoice_pdf,
            //         'uuid' => $subs->uuid,
            //         'notification' => $subs->user->notification_send ?? 0
            //     ];

            //     $subs->status = "ended";
            //     $subs->save();

            //     $newSubs = new WishItemSubscription();
            //     $newSubs->stripe_id = $subs->stripe_id;
            //     $newSubs->session_id = $subs->session_id;
            //     $newSubs->wish_item_id = $subs->wish_item_id;
            //     $newSubs->user_id = $subs->user_id;
            //     $newSubs->guest_name = $subs->guest_name;
            //     $newSubs->guest_email = $subs->guest_email;
            //     $newSubs->currency = $subs->currency;
            //     $newSubs->amount = $subs->amount;
            //     $newSubs->tax = $subs->tax;
            //     $newSubs->recurring_for = $subs->recurring_for;
            //     $newSubs->recurring_type = $subs->recurring_type;
            //     $newSubs->payment_method = 'stripe';
            //     $newSubs->surprise_message = $subs->surprise_message;
            //     $newSubs->anonymous = $subs->anonymous;
            //     $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
            //     $newSubs->status = "paid";
            //     $newSubs->created_at = $subs->created_at;
            //     $newSubs->updated_at = Carbon::now();
            //     $newSubs->save();

            //     SendRenewMail::dispatch($array, 'renew', 'main');
            // }
            // else

        }

        return response()->json([
            'status' => true,
            'message' => 'success'
        ]);
        // return true;
    }

    /**
     * Handle subscription renewal for invoice.payment_succeeded events
     */
    private function handleSubscriptionRenewal($event)
    {
        $subscriptionId = $event->data->object->subscription ?? null;
        $invoiceData = $event->data->object;

        if (!$subscriptionId) {
            Log::info("Invoice payment succeeded but no subscription ID found", ['invoice_id' => $invoiceData->id]);
            return;
        }

        Log::info("Processing subscription renewal for invoice.payment_succeeded", [
            'invoice_id' => $invoiceData->id,
            'subscription_id' => $subscriptionId,
            'billing_reason' => $invoiceData->billing_reason ?? null,
            'amount' => $invoiceData->amount_paid ?? 0
        ]);

        // Find the wish item subscription
        $wishSubscription = WishItemSubscription::where('stripe_id', $subscriptionId)
            ->where('status', 'paid')
            ->first();

        if (!$wishSubscription) {
            Log::info("No wish subscription found for renewal", ['subscription_id' => $subscriptionId]);
            return;
        }

        try {
            // Get the subscription details from Stripe to update period information
            $stripeClient = StripeControl::getClient();
            $stripeSubscription = $stripeClient->subscriptions->retrieve($subscriptionId);

            // Update subscription with new period information
            $wishSubscription->current_period_start = Carbon::createFromTimestamp($stripeSubscription->current_period_start);
            $wishSubscription->current_period_end = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
            $wishSubscription->upcoming_payment = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
            $wishSubscription->stripe_status = $stripeSubscription->status;
            $wishSubscription->updated_at = Carbon::now();
            $wishSubscription->save();

            // Clear cache for both users
            if ($wishSubscription->user) {
                $this->userProfileService->clearUserCaches($wishSubscription->user->username, $wishSubscription->user->id);
            }
            if ($wishSubscription->wish_item && $wishSubscription->wish_item->user) {
                $this->userProfileService->clearUserCaches($wishSubscription->wish_item->user->username, $wishSubscription->wish_item->user->id);
            }

            Log::info('Subscription updated with new renewal period', [
                'subscription_id' => $wishSubscription->id,
                'stripe_id' => $subscriptionId,
                'new_period_end' => $wishSubscription->current_period_end,
                'new_upcoming_payment' => $wishSubscription->upcoming_payment
            ]);

            // Send renewal email notification
            $this->sendRenewalEmailNotification($wishSubscription);

            // If wish item has content to deliver for renewals, create deliverable
            if ($wishSubscription->wish_item && (!empty($wishSubscription->wish_item->content_file) || !empty($wishSubscription->wish_item->reward))) {

                $creatorUuid = $wishSubscription->wish_item && $wishSubscription->wish_item->user ? $wishSubscription->wish_item->user->uuid : null;
                $metrics = $creatorUuid ? app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $creatorUuid) : null;
                $reserveRate = $metrics ? ($metrics->reserve_percent ?? 0) : 0;

                // Use consistent fee calculation for creator net amount
                $breakdown = Helpers::calculateStripeDirectChargeFlow($wishSubscription->amount, $wishSubscription->currency, $reserveRate);
                $creatorNet = $breakdown['net_to_creator'];

                // Create deliverable record for renewal content delivery
                $deliverable = Deliverable::create([
                    'uuid' => Str::uuid(),
                    'product_id' => (string) $wishSubscription->wish_item->id,
                    'item_id' => $wishSubscription->wish_item->id,
                    'creator_id' => $wishSubscription->wish_item->user_id,
                    'gifter_id' => $wishSubscription->user_id,
                    'session_id' => $wishSubscription->session_id,
                    'payment_intent_id' => $invoiceData->payment_intent ?? null,
                    'deliverable_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
                    'product_type' => 'wish_subscription_renewal',
                    'transaction_amount' => $wishSubscription->amount,
                    'status' => 'pending',
                    'customer_email' => $wishSubscription->guest_email,
                    'customer_name' => $wishSubscription->guest_name,
                    'anonymous' => $wishSubscription->anonymous ?? false,
                    'message' => 'Subscription renewal content delivery',
                    'metadata' => json_encode([
                        'wish_id' => $wishSubscription->wish_item->id,
                        'subscription_id' => $wishSubscription->id,
                        'stripe_subscription_id' => $subscriptionId,
                        'creator_net_amount' => $creatorNet,
                        'subscription_renewal' => true,
                        'content_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                        'invoice_id' => $invoiceData->id,
                        'billing_reason' => $invoiceData->billing_reason ?? 'subscription_cycle'
                    ])
                ]);

                // Dispatch job to process renewal content delivery
                ProcessWishItemDeliverable::dispatch($deliverable);

                // Update Stripe payment intent metadata (exactly like membership)
                if ($invoiceData->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'wish_renewal_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeController: Failed to update Stripe metadata for renewal', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $invoiceData->payment_intent,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                Log::info('Subscription renewal content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $subscriptionId,
                    'wish_item_id' => $wishSubscription->wish_item->id
                ]);
            }

            // Clear cache for the creator and gifter
            if ($wishSubscription->wish_item && $wishSubscription->wish_item->user) {
                $this->userProfileService->clearUserCaches($wishSubscription->wish_item->user->username, $wishSubscription->wish_item->user->id);
            }
            if ($wishSubscription->user) {
                $this->userProfileService->clearUserCaches($wishSubscription->user->username, $wishSubscription->user->id);
            }
        } catch (\Exception $e) {
            Log::error('Failed to process subscription renewal', [
                'subscription_id' => $subscriptionId,
                'wish_item_id' => $wishSubscription->wish_item_id ?? null,
                'invoice_id' => $invoiceData->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Send renewal email notification
     */
    private function sendRenewalEmailNotification($wishSubscription)
    {
        try {
            // Prepare renewal amount with currency formatting and subscription period
            // Use the base subscription amount (wish item price only, without platform fees)
            $currency = Currency::where('iso', strtoupper($wishSubscription->currency ?? 'gbp'))->first();
            $currencySymbol = $currency ? $currency->symbol : '£';
            $formattedAmount = $currencySymbol . number_format($wishSubscription->amount, 2);
            $subscriptionPeriod = $wishSubscription->wish_item->subscription_period ?? 'monthly';
            $renewalAmount = $formattedAmount . '/' . $subscriptionPeriod;

            // Use the existing wish subscription email system for renewals
            WishSubscriptionMailToUser::dispatch(
                $wishSubscription,
                $wishSubscription->guest_email,
                $renewalAmount,
                $wishSubscription->wish_item->user->name,
                true // is_renewal = true
            );

            Log::info('Wish subscription renewal email dispatched', [
                'subscription_id' => $wishSubscription->stripe_id,
                'customer_email' => $wishSubscription->guest_email,
                'amount' => $renewalAmount,
                'creator_name' => $wishSubscription->wish_item->user->name
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send renewal email notification', [
                'subscription_id' => $wishSubscription->stripe_id,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function cancelSubs($uuid)
    {
        $subs = WishItemSubscription::where('uuid', $uuid)->first();
        $subs->status = "cancelled";
        $subs->save();

        StripeControl::cancelSubscription($subs->stripe_id);
        $this->userProfileService->clearUserCaches($subs->wish_item->user->username, $subs->wish_item->user->id);
        if ($subs->user) {
            $this->userProfileService->clearUserCaches($subs->user->username, $subs->user->id);
        }
        return to_route('user.show', ['username' => $subs->wish_item->user->username])->with('success', "Subscription is cancelled for wish {$subs->wish_item->wishname}.");
    }

    public function tipToJar(Request $request, $creator_uid)
    {
        $request->validate([
            'digital_waiver' => ['required', 'accepted'],
        ]);
        $user = Auth::user();
        if (!empty($user) && $user->role === 0 && $user->is_uk == 0 && $user->is_500_limit_exceeded == 1 && $user->profile_status_lock != 2) {
            return response()->json([
                'status' => false,
                'card_verification_required' => true,
                'msg' => "Please complete your card verification process. Go your profile and complete your card verification process."
            ]);
        }
        $creator = User::where('uuid', $creator_uid)->where('is_uk', 0)->first();
        if (!$creator) {
            return response()->json([
                'status' => false,
                'msg' => "Creator not found."
            ]);
        }


        // Check if creator has card_payments capability
        if (!StripeControl::hasCardPaymentsCapability($creator->account_id)) {
            $stripeCheck = ['eligible' => false, 'status' => 'stripe_disabled'];
            return response()->json([
                'status' => false,
                'msg' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, $stripeCheck)
            ]);
        }

        // NEW: Check creator subscription eligibility first
        $subscriptionCheck = app(CreatorSubscriptionService::class)->validateCreatorSubscription($creator);

        if (!$subscriptionCheck['eligible']) {
            // Send notification to creator about blocked payment
            $creator->notify(new SubscriptionBlockedNotification($subscriptionCheck, $request->amount ?? 0));

            // Log the blocked payment for subscription issues
            Log::warning('Tip jar payment blocked due to subscription issue', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'payment_amount' => $request->amount ?? 0,
                'subscription_status' => $subscriptionCheck['status'],
                'subscription_status_code' => $subscriptionCheck['subscription_status'] ?? 'unknown'
            ]);

            // Return user-friendly error to fan
            return response()->json([
                'status' => false,
                'msg' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage($subscriptionCheck, null)
            ]);
        }

        // NEW: Check creator activity eligibility
        $activityCheck = app(CreatorActivityService::class)->validateCreatorActivity($creator);

        if (!$activityCheck['eligible']) {
            // Send notification to creator about blocked payment
            $creator->notify(new PaymentBlockedNotification($activityCheck, $request->amount ?? 0));

            // Log the blocked payment for analytics
            Log::info('Tip jar payment blocked due to insufficient creator activity', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'payment_amount' => $request->amount ?? 0,
                'activity_status' => $activityCheck['status'],
                'content_count' => $activityCheck['content_count'] ?? 0
            ]);

            // Return user-friendly error to fan
            return response()->json([
                'status' => false,
                'msg' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, $activityCheck)
            ]);
        }

        // Log successful activity check for analytics
        if ($activityCheck['status'] !== 'not_creator' && $activityCheck['status'] !== 'not_fully_verified') {
            Log::info('Tip jar payment allowed - creator activity check passed', [
                'creator_id' => $creator->id,
                'creator_username' => $creator->username,
                'activity_status' => $activityCheck['status'],
                'content_count' => $activityCheck['content_count'] ?? 0
            ]);
        }
        $checkGifterStatus = Helpers::checkGifterCardVerificationStatus();
        if ($checkGifterStatus == true) {
            $user = Auth::user();
            return response()->json([
                'status' => false,
                'msg' => "⚠️ Please complete your card verification payment and wait for admin approval before making further payments."
            ]);
        }

        $user = Auth::user();
        // if ($user) {
        //     $checkCardVerification = User::where('id', Auth::id())->where('role', 0)
        //         ->whereHas('gifterCardVerification', function ($q) use ($user) {
        //             $q->where('user_id', $user->id ?? null)->where('status', 'success');
        //         })->first();

        //     if (empty($checkCardVerification) && $user->role == 0) {
        //         return response()->json([
        //             'status' => false,
        //             'msg' => "You must have to activate your account before making any payment."
        //         ]);
        //     }
        // }
        if (Auth::check()) {
            if ($creator->id == Auth::id()) {
                return response()->json([
                    'status' => false,
                    'msg' => "You can't pay yourself!"
                ]);
            }
        }

        $goal = TipGoal::where('user_id', $creator->id)->where('completed', 0)->latest()->first();

        // if (!$goal) {
        //     return redirect()->back()->with('error', 'No tip jar found!');
        // }

        // if ((!empty($goal->completed_at) && $goal->completed_at <= Carbon::now()) || ($goal->completed == 1)) {
        //     return redirect()->back()->with('error', 'Goal is completed already.');
        // }

        if ($request->isMethod("POST")) {
            $request->validate([
                'name' => 'required|string|min:3|max:50',
                'email' => 'required|email:dns',
                'amount' => 'required|numeric',
                'anonymous' => 'required',
                'message' => 'sometimes|nullable|string|max:800',
                'device_id' => 'sometimes|nullable|string|max:255',
            ]);

            $this->ensureTurnstileVerified($request);

            $sourceCurrency = strtoupper($request->currency ?? $creator->default_currency ?? 'GBP');
            $amount = (float) $request->amount;
            $sourceCurrency = strtoupper($request->currency ?? $creator->default_currency ?? 'GBP');

            $basePrice = $amount;
            $vatPercent = (float) ($creator->vat_amount_percentage ?? 0);
            $vatAmount = $basePrice * $vatPercent / 100;
            $priceWithVat = $basePrice + $vatAmount;

            $breakdown = Helpers::calculateStripeDirectChargeFlow($priceWithVat, $sourceCurrency);

            $finalTotalAmount = $breakdown['total_supporter_pays'];
            $applicationFeeAmount = $breakdown['application_fee'];
            $creatorNet = $breakdown['net_to_creator'];

            $isZeroDecimal = Helpers::isZeroDecimalCurrency($sourceCurrency);
            $multiplier = $isZeroDecimal ? 1 : 100;
            $precision = $isZeroDecimal ? 0 : 2;

            $unitAmount = round($finalTotalAmount * $multiplier);
            $creatorNetMinor = round($creatorNet * $multiplier);

            // Unified Risk Enforcement
            $riskData = $this->enforceRiskChecks(
                $request,
                $creator,
                $creatorNet,
                $sourceCurrency,
                'tip_jar',
                true // JSON response expected
            );

            // If it's a JSON error response (blocked, step_up, login required), return it immediately
            if ($riskData instanceof \Illuminate\Http\JsonResponse) {
                return $riskData;
            }

            $force3DS = in_array('FORCE_3DS', $riskData['reason_codes'] ?? []);

            $pay = TipGoalsPayment::create([
                'tip_goal_id' => $goal->id ?? null,
                'user_id' => Auth::id() ?? null,
                'creator_id' => $creator->id,
                'guest_name' => $request->name,
                'guest_email' => $request->email,
                'currency' => $sourceCurrency,
                'amount' => $basePrice,
                'tax' => $breakdown['total_fees'],
                'vat_amount' => round($vatAmount, $precision, PHP_ROUND_HALF_UP),
                'total_paid' => $finalTotalAmount,
                'message' => $request->message ?? null,
                'anonymous' => $request->anonymous ?? 0,
            ]);

            Helpers::applyDigitalWaiver($pay, (bool) $request->digital_waiver);
            $pay->save();

            $lineItems = [
                [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $sourceCurrency,
                        'product_data' => [
                            'name' => "Total value of item including all fees",
                            'description' => "Support payment to {$creator->name} to help them create more content.",
                        ],
                        'unit_amount' => $unitAmount,
                    ]
                ]
            ];

            // Check if creator has card_payments capability
            $hasCardPayments = StripeControl::hasCardPaymentsCapability($creator->account_id);

            if (!$hasCardPayments) {
                return response()->json([
                    'status' => false,
                    'msg' => app(\App\Services\CreatorAvailabilityMessageService::class)->supporterMessage(null, null, ["eligible" => false, "status" => "stripe_disabled"])
                ]);
            }

            // Direct Charges Implementation
            $paymentIntentData = [
                'description' => "Spenny Piggy - Support payment to {$creator->name} (Total value including all fees)",
                "metadata" => Helpers::buildStripeMetadata('support_payment', $pay, [
                    'item_amount' => (string) $unitAmount,
                    'certificate' => 'true',
                    'creator_net_amount' => (string) $creatorNet,
                    'platform_fee_amount' => (string) round($applicationFeeAmount * $multiplier),
                    'total_charge_amount' => (string) $unitAmount,
                    'payment_type' => 'Support Payment - Direct Charge',
                    'anonymous' => (string) ($request->anonymous ? 'yes' : 'no'),
                    'has_card_payments' => (string) $hasCardPayments,
                ]),
                'application_fee_amount' => (int) round($applicationFeeAmount * $multiplier),
            ];

            Log::info('Using Direct Charges for support payment', [
                'creator_id' => $creator->id,
                'connected_account_id' => $creator->account_id,
                'payment_type' => 'support_payment',
                'application_fee_amount' => $applicationFeeAmount
            ]);

            $payload = [
                "mode" => 'payment',
                'payment_method_types' => ['card'],
                'line_items' => $lineItems,
                'payment_intent_data' => $paymentIntentData,
                'customer_email' => $user->email ?? $request->email,
                'success_url' => route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "success"]),
                'cancel_url' => route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "cancel"]),
            ];

            // Check if we need to force 3DS
            if ($force3DS) {
                $payload['payment_method_options'] = [
                    'card' => [
                        'request_three_d_secure' => 'any',
                    ],
                ];
            }

            try {
                // IMPORTANT: Pass connected account ID for Direct Charge!
                $session = StripeControl::createCheckoutSession($payload, $creator->account_id, false, $creator->username);
                $pay->update(['session_id' => $session->id]);

                try {
                    \App\Models\Payment::create([
                        'creator_id' => $creator->uuid,
                        'risk_identity_id' => $riskData['risk_identity_id'],
                        'amount' => app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor((int) $creatorNetMinor, (string) strtoupper($sourceCurrency)),
                        'reserve_amount_minor' => (function () use ($creator, $creatorNetMinor, $sourceCurrency) {
                            $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $creator->uuid);
                            $reservePercent = (int) ($metrics->reserve_percent ?? 0);
                            if ($reservePercent <= 0) return 0;
                            $reserveMinor = (int) round(((int) $creatorNetMinor * $reservePercent) / 100);
                            return app(\App\Services\Risk\MoneyNormalizer::class)->toGbpMinor($reserveMinor, (string) strtoupper($sourceCurrency));
                        })(),
                        'currency' => 'gbp',
                        'stripe_session_id' => $session->id,
                        'stripe_payment_intent_id' => $session->payment_intent ?? null,
                        'status' => 'initiated',
                        'reason_codes' => $riskData['reason_codes'] ?? [],
                    ]);
                } catch (\Exception $e) {
                    Log::error('Risk Ledger: Failed to record tip jar payment', [
                        'session_id' => $session->id,
                        'error' => $e->getMessage(),
                    ]);
                }

                return response()->json([
                    'status' => true,
                    'url' => $session->url
                ]);
            } catch (Exception $e) {
                return response()->json([
                    'status' => false,
                    'msg' => $e->getMessage()
                ]);
            }
        }
    }

    /**
     * Handle Checkout Session
     *
     * @param string $uuid Subscription UUID
     * @return mixed
     */
    public function handleTipJarPayment($uuid)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        $tip_pay = TipGoalsPayment::whereUuid($uuid)->first();
        if (!$tip_pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        try {
            // Need to pass the connected account ID because the session was created on the creator's account
            $session = StripeControl::getCheckoutSession($tip_pay->session_id, $tip_pay->creator->account_id);
            $tip_pay->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $ownerCurrency = Currency::where('iso', strtoupper($tip_pay->currency))->first();
                $userCurrency = Currency::where('iso', strtoupper($currency))->first();

                if (!$ownerCurrency || !$userCurrency) {
                    Log::error("Currency not found - Owner: " . strtoupper($tip_pay->currency) . ", User: " . strtoupper($currency));
                    return to_route('user.show', ['username' => $tip_pay->creator->username])->with('error', 'Currency configuration error. Please contact support.');
                }

                // Send notification to creator
                TipJarPurchased::dispatch($tip_pay, $ownerCurrency->symbol);

                $creatorNet = (float) $tip_pay->amount;

                // Create deliverable record for tracking and certificate generation
                $deliverable = Deliverable::create([
                    'uuid' => (string) Str::uuid(),
                    'product_id' => 'support_payment_' . $tip_pay->id,
                    'item_id' => $tip_pay->id,
                    'creator_id' => $tip_pay->creator_id,
                    'gifter_id' => $tip_pay->user_id,
                    'session_id' => $tip_pay->session_id,
                    'payment_intent_id' => $session->payment_intent ?? null,
                    'deliverable_type' => 'support',
                    'product_type' => 'support_payment',
                    'transaction_amount' => $tip_pay->amount,
                    'customer_email' => $tip_pay->guest_email ?? ($tip_pay->user->email ?? null),
                    'customer_name' => $tip_pay->guest_name ?? ($tip_pay->user->name ?? 'Anonymous'),
                    'payment_currency' => strtoupper($tip_pay->currency ?? 'GBP'),
                    'anonymous' => $tip_pay->anonymous ?? false,
                    'message' => $tip_pay->message,
                    'metadata' => json_encode([
                        'support_payment_id' => $tip_pay->id,
                        'creator_id' => $tip_pay->creator_id,
                        'tip_goal_id' => $tip_pay->tip_goal_id,
                        'creator_net_amount' => $creatorNet,
                        'anonymous' => $tip_pay->anonymous,
                    ])
                ]);

                // Dispatch ProcessWishItemDeliverable job for certificate generation
                ProcessWishItemDeliverable::dispatch($deliverable);

                // Update Stripe payment intent metadata (exactly like membership)
                if ($session->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'support_payment_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true'
                        ]);
                    } catch (\Exception $e) {
                        Log::error('StripeController: Failed to update Stripe metadata for support payment', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $session->payment_intent,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                // Process supporter deliverable, certificate, and email (replaces TipJarMailToUser)
                TipPaymentMailToUser::dispatch($tip_pay, $userCurrency ? $userCurrency->iso : $tip_pay->currency);

                // Generate thank you post for creator's feed
                CreateThankYouPostJob::dispatch($tip_pay);

                $tip_pay->save();

                // Immediately sync to FinancialTransaction so earnings dashboard shows up-to-date
                try {
                    $gross = $tip_pay->total_paid && $tip_pay->total_paid > 0
                        ? (float) $tip_pay->total_paid
                        : (float) $tip_pay->amount;
                    $vatAmt = (float) ($tip_pay->vat_amount ?? 0);
                    $stripeFeeMinor = 0;
                    if (!empty($session->payment_intent)) {
                        $stripeFeeMinor = StripeControl::getStripeFeeMinorForPaymentIntent((string) $session->payment_intent, $tip_pay->creator->account_id);
                    }
                    $isZeroDecimal = Helpers::isZeroDecimalCurrency((string) strtoupper($tip_pay->currency ?? 'GBP'));
                    $stripeFee = $isZeroDecimal ? (float) $stripeFeeMinor : ((float) $stripeFeeMinor / 100);

                    // Platform fee is what remains after we give the creator their base amount + vat, and stripe takes its fee from the gross.
                    // Or we can just use the difference.
                    $platformFee = $gross - $stripeFee - (float) $tip_pay->amount - $vatAmt;
                    if ($platformFee < 0) $platformFee = 0;

                    // Fetch exact platform fee (application_fee_amount) from Stripe Session/Intent if available
                    if (!empty($session->payment_intent)) {
                        try {
                            \Stripe\Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
                            $intentObj = \Stripe\PaymentIntent::retrieve($session->payment_intent, ['stripe_account' => $tip_pay->creator->account_id]);
                            if (isset($intentObj->application_fee_amount)) {
                                $platformFee = $isZeroDecimal ? (float) $intentObj->application_fee_amount : ($intentObj->application_fee_amount / 100);
                            }
                        } catch (\Exception $e) {
                            Log::warning("Could not fetch application_fee_amount for tip", ['error' => $e->getMessage()]);
                        }
                    }

                    FinancialTransaction::updateOrCreate(
                        ['source_type' => TipGoalsPayment::class, 'source_id' => $tip_pay->id],
                        [
                            'user_id'       => $tip_pay->creator_id,
                            'supporter_id'  => $tip_pay->user_id,
                            'type'          => 'income',
                            'gross_amount'  => $gross,
                            'platform_fee'  => $platformFee,
                            'stripe_fee'    => $stripeFee,
                            'vat_amount'    => $vatAmt,
                            'net_amount'    => (float) $tip_pay->amount,
                            'currency'      => strtoupper($tip_pay->currency ?? 'GBP'),
                            'status'        => 'completed',
                            'description'   => 'Tip / Support',
                            'transaction_date' => $tip_pay->created_at,
                        ]
                    );
                } catch (\Throwable $e) {
                    Log::error('Failed to sync TipGoalsPayment to FinancialTransaction: ' . $e->getMessage(), ['tip_pay_id' => $tip_pay->id]);
                }

                // Update GMV for creator
                Helpers::addGmv($tip_pay->creator_id, (float) $tip_pay->amount, $tip_pay->currency);


                /**************************TIP**JAR**PWA**START****************************************************/
                // below is TIP JAR pwa for fans
                $CreatorName = ucfirst($tip_pay->creator->name) ?? 'A Creator';

                $multiplier = Helpers::isZeroDecimalCurrency($session->currency) ? 1 : 100;
                $totalPaidAmount = $tip_pay->total_paid && $tip_pay->total_paid > 0 ? $tip_pay->total_paid : (float) ($session->amount_total / $multiplier);
                $symbolStr = \App\Models\Currency::where('iso', strtoupper($tip_pay->currency))->value('symbol') ?? '£';
                $amountWithcurrency = $symbolStr . number_format($totalPaidAmount, 2);

                $title = "🏅 You've unlocked a new badge!";
                $content = "You just tipped {$amountWithcurrency} to $CreatorName. Thanks for supporting them!.";
                $email = $tip_pay->guest_email ?? $tip_pay->user->email;

                Helpers::sendNotification($title, $content, $email);

                // below is membership pwa for creator
                $FanName = ucfirst($tip_pay->user->name ?? 'A Fan');
                $title = "💰 New Support Received";
                $content = "You just received a support payment from $FanName!.";
                $email = $tip_pay->creator->email;

                Helpers::sendNotification($title, $content, $email);
                /****************************TIP**JAR**PWA**ENDS****************************************************/

                if (!empty($tip_pay->tipGoal)) {
                    $tip_pay->tipGoal->fullfilled += $tip_pay->amount;
                    $tip_pay->tipGoal->save();

                    if ($tip_pay->tipGoal->user->auto_tweet == 1) {
                        TipJarTweet::dispatch($tip_pay);
                    }
                }

                if ($tip_pay->anonymous == 1) {
                    $username = "Anonymous user";
                } else {
                    $username = $tip_pay->guest_name ?? "Anonymous user";
                }

                $userPayment = new UserPayment();
                $userPayment->from_user_id = $tip_pay->user_id ?? null;
                $userPayment->to_user_id = $tip_pay->creator_id ?? null;
                $userPayment->product_type = 'support payment';
                $userPayment->amount = $tip_pay->amount;
                $userPayment->total_paid = $tip_pay->total_paid;
                $userPayment->currency = $tip_pay->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status ?? 'paid';
                $userPayment->save();

                $message = $username . " just granted some coins to your piggy bank";
                NotificationSave::dispatch($message, $tip_pay->creator, $tip_pay->user, 'Piggy Bank');

                $this->userProfileService->clearUserCaches($tip_pay->creator->username, $tip_pay->creator->id);
                if ($tip_pay->user) {
                    $this->userProfileService->clearUserCaches($tip_pay->user->username, $tip_pay->user->id);
                }

                return to_route('thank-you', [
                    'username' => $tip_pay->creator->username,
                    'type' => 'support',
                    'item_name' => $tip_pay->tipGoal ? $tip_pay->tipGoal->name : 'Support Payment',
                    'amount' => $tip_pay->amount ?? 0,
                    'currency' => $tip_pay->currency ?? 'GBP'
                ])->with('success', "Thank you for your support!");
            }

            $tip_pay->save();
            return to_route('user.show', ['username' => $tip_pay->creator->username])->with('warning', "Payment is in {$session->payment_status} status.");
        } catch (Exception $e) {
            Log::error("Stripe Checkout Error: " . $e->getMessage());
            return to_route('user.show', ['username' => $tip_pay->creator->username])->with('error', $e->getMessage());
        }
    }

    /**
     * Deleting the stripe account through user.
     *
     * @param string $uuid user UUID
     * @return mixed
     */
    public function deleteStripeAccount($accountid)
    {
        // $user = User::where('id', Auth::id())->where('is_uk', 0)->first();
        // if ($user->account_id) {
        //     StripeControl::deleteAccount($user->account_id);
        //     $user->account_id = NULL;
        //     $user->stripe_details_submitted = 0;
        //     $user->save();
        // }
        // return to_route('user.show', ['username' => $user->username])->with('success', 'Stripe account deleted successfully!');
        StripeControl::deleteAccount($accountid);
        return 'Deleted';
    }

    /**
     * Pay for monthly charge
     *
     * @return mixed
     */
    public function payMonthlyCharge(Request $request)
    {
        $now = now();
        $user = User::where('id', Auth::id())->first();
        if (!$user) {
            return back()->with('error', 'Subscription not allowed for this user.');
        }

        // If user doesn't have a stripe_id, try to find one by email on Stripe first
        if (!$user->stripe_id) {
            try {
                $search = StripeControl::searchCustomer("email:'" . $user->email . "'");
                if ($search->data && count($search->data) > 0) {
                    $user->stripe_id = $search->data[0]->id;
                    $user->save();
                    Log::info("Found existing Stripe customer for user {$user->id} by email: {$user->stripe_id}");
                }
            } catch (\Exception $e) {
                Log::warning("StripeController: Could not search for existing customer: " . $e->getMessage());
            }
        }

        // Prevent duplicate subscriptions: sync status from Stripe first, then check all cases
        if ($user->stripe_id) {
            // Fetch active subscription from Stripe
            $stripeSub = StripeControl::getActiveSubscriptionByCustomer($user->stripe_id);

            if ($stripeSub) {
                // Fetch the latest invoice for this subscription to ensure accurate sync
                $invoice = null;
                try {
                    $stripe = StripeControl::getClient();
                    $invoices = $stripe->invoices->all([
                        'subscription' => $stripeSub->id,
                        'status' => 'paid',
                        'limit' => 1
                    ]);
                    $invoice = $invoices->data[0] ?? null;
                } catch (\Exception $e) {
                    Log::warning("StripeController: Could not fetch latest invoice for sync: " . $e->getMessage());
                }

                // Subscription exists on Stripe - sync it using the unified service method
                // This mimics "sending the webhook again" as requested by the user
                $this->userProfileService->syncMandatorySubscriptionStatus($stripeSub, 'manual_sync', $invoice, $user);

                // Refresh user model and its relationships to ensure subscription_status is accurate
                $user->load('creatorMonthlySubscription');
                $user->refresh();

                Log::info("StripeController: Sync completed for user {$user->id}. New status: " . $user->subscription_status);

                if ($user->subscription_status >= 1) {
                    // Subscription is now active locally (either fully active or trialing)
                    $msg = $user->subscription_status == 2 ? 'Your trial was synchronized.' : 'Your subscription was synchronized.';
                    return redirect(
                        route('user.show', [
                            'username' => $user->username
                        ]) . '#profile'
                    )->with('success', $msg);
                }

                // Fallback check if subscription_status didn't catch it but stripeSub is active/trialing
                if (in_array($stripeSub->status, ['active', 'trialing'])) {
                    return redirect(
                        route('user.show', [
                            'username' => $user->username
                        ]) . '#profile'
                    )->with('success', 'Your subscription is active on Stripe and has been synchronized.');
                }

                if ($stripeSub->cancel_at_period_end) {
                    // Cancelled but still in paid period — offer to resume
                    try {
                        $stripe = StripeControl::getClient();
                        $resumedSub = $stripe->subscriptions->update($stripeSub->id, [
                            'cancel_at_period_end' => false,
                        ]);

                        // Sync the change locally
                        $this->userProfileService->syncMandatorySubscriptionStatus($resumedSub, 'manual_sync', $invoice, $user);

                        return redirect(
                            route('user.show', [
                                'username' => $user->username
                            ]) . '#profile'
                        )->with('success', 'Your auto-renewal has been re-enabled successfully!');
                    } catch (\Exception $e) {
                        Log::warning("StripeController: Auto-resume failed in checkout flow: " . $e->getMessage());
                        $endDate = \Carbon\Carbon::createFromTimestamp($stripeSub->current_period_end)->format('d M Y');
                        return back()->with('info', "Your subscription is active until {$endDate}. You can renew after that date.");
                    }
                }

                if ($user->subscription_status >= 1) {
                    // Fully active subscription — no action needed
                    return redirect(
                        route('user.show', [
                            'username' => $user->username
                        ]) . '#profile'
                    )->with('success', 'You already have an active subscription.');
                }

                // If we found a subscription on Stripe but local status is not active, 
                // it might be because the webhook was missed or sync was delayed.
                // Since syncUserSubscription was just called and it's robust, 
                // we should check again if it fixed the user status.
                if ($user->is_subscribed) {
                    return redirect(
                        route('user.show', [
                            'username' => $user->username
                        ]) . '#profile'
                    )->with('success', 'Your subscription was found and has been synchronized.');
                }

                // If it's still not active (e.g. past_due or unpaid), we should not allow a new checkout.
                return to_route('user.show', ['username' => $user->username])
                    ->with('info', 'An existing subscription was found on Stripe but it requires attention (e.g. payment failed). Please check your Stripe billing or contact support.');
            } else {
                // No active subscription on Stripe — check if local record is still in its paid/trial window
                $canceledButActive = \App\Models\MonthlyCharge::where('user_id', $user->id)
                    ->where('status', 'canceled')
                    ->where(function ($q) use ($now) {
                        $q->where(function ($q2) use ($now) {
                            $q2->whereNotNull('current_end_subscription_date')
                                ->whereDate('current_end_subscription_date', '>=', $now);
                        })->orWhere(function ($q2) use ($now) {
                            $q2->whereNotNull('current_end_trial_date')
                                ->whereDate('current_end_trial_date', '>=', $now);
                        });
                    })
                    ->latest()
                    ->first();

                if ($canceledButActive) {
                    $date = $canceledButActive->current_end_subscription_date
                        ? \Carbon\Carbon::parse($canceledButActive->current_end_subscription_date)->format('d M Y')
                        : \Carbon\Carbon::parse($canceledButActive->current_end_trial_date)->format('d M Y');

                    $date = $canceledButActive->current_end_subscription_date
                        ? \Carbon\Carbon::parse($canceledButActive->current_end_subscription_date)->format('d M Y')
                        : \Carbon\Carbon::parse($canceledButActive->current_end_trial_date)->format('d M Y');

                    $infoMessage = "Your subscription is active until {$date}. You can renew after that date.";

                    return redirect(
                        route('user.show', [
                            'username' => $user->username
                        ]) . '#profile'
                    )->with('info', $infoMessage);
                }

                // Also handle existing paid/active DB record that DB didn't sync (webhook missed)
                $existingActive = \App\Models\MonthlyCharge::where('user_id', $user->id)
                    ->whereIn('status', ['paid', 'active', 'renew', 'trialing'])
                    ->whereNotNull('current_end_subscription_date')
                    ->whereDate('current_end_subscription_date', '>=', $now)
                    ->latest()
                    ->first();

                if ($existingActive) {
                    // Stripe says no subscription, but local DB says active — DB is stale, allow re-subscription
                    $existingActive->status = 'canceled';
                    $existingActive->cancelled_at = $now;
                    $existingActive->upcoming_payment = null;
                    $existingActive->save();
                }
            }
        }

        $currency = strtolower($request->cookie("currency", "GBP"));
        $price = 8.99;

        // Calculate VAT (20%) on top of the base price, same as the previous 4+VAT logic
        $vatRate = 20;
        $tax = round($price * $vatRate / 100, 2);
        $finalTotalAmount = $price + $tax;

        if (!$user->stripe_id) {
            $customer = StripeControl::createCustomer([
                'email' => $user->email,
                'name' => $user->name,
            ], '');

            $customer_id = $customer->id;
            $user->stripe_id = $customer_id;
            $user->save();

            // Clear cache since user data changed
            $this->userProfileService->clearUserCaches($user->username, $user->id);
        }

        $sub = MonthlyCharge::create([
            'user_id'   =>  $user->id,
            'name'      =>  $user->name ?? NULL,
            'email'     =>  $user->email,
            'currency'  =>  "GBP",
            'amount'    =>  $price,
            'tax'       =>  $tax,
            'digital_waiver_confirmed_at' => now(), // Auto-confirm since it's not required to be clicked
        ]);

        $amount = $finalTotalAmount;
        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        // Force exactly the total amount (Price + VAT) in pence for GBP
        if (strtoupper($currency) === 'GBP') {
            $unit_amount = (int) round($finalTotalAmount * 100);
        } else {
            $unit_amount = round(Helpers::priceFormat("GBP", $amount, $currency) * $multiplier);
        }

        // Determine if user has already used a free trial for the mandatory platform subscription
        $hasUsedTrial = MonthlyCharge::where('user_id', $user->id)
            ->whereNotNull('current_start_trial_date')
            ->exists();
        $trial_period_days = $hasUsedTrial ? 0 : 3;

        $payload = [
            "mode"  =>  'subscription',
            "currency"  =>  $currency,
            'line_items' =>  [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => "Platform Charge: SpennyPiggy (Total value including all fees)",
                        'description' => "Monthly platform charge for SpennyPiggy features",
                    ],
                    'unit_amount' => $unit_amount, // Ensure integer
                    'recurring' => [
                        'interval' => StripeControl::$periods["monthly"],
                        'interval_count' => 1
                    ]
                ]
            ]],
            'subscription_data' => array_filter([
                // Only include trial if user has not used it before
                'trial_period_days' => $trial_period_days > 0 ? $trial_period_days : null,
                'description' => "Subscription for using site through Stripe.",
                'metadata' => Helpers::buildStripeMetadata('site_subscription', $sub, [
                    'subscription_amount' => (string) $price,
                    'tax_amount' => (string) $tax,
                    // Reflect actual trial setting in metadata
                    'trial_period_days' => $trial_period_days > 0 ? (string) $trial_period_days : '0',
                    'total_charge_amount' => (string) round($finalTotalAmount * $multiplier),
                    'subscription_purpose' => 'mandatory_platform_access',
                ]),
            ]),
            'customer' => $user->stripe_id,
            'success_url' => route('mandatory.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
            'cancel_url' => route('mandatory.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
        ];

        try {
            $session = StripeControl::createCheckoutSession($payload);
            $updateData = [
                'session_id' => $session->id,
            ];
            // Persist trial dates only if trial is actually applied
            if ($trial_period_days > 0) {
                $updateData['current_start_trial_date'] = now();
                $updateData['current_end_trial_date'] = now()->addDays($trial_period_days);
            }
            $sub->update($updateData);
            return Inertia::location($session->url);
        } catch (Exception $e) {
            $sub->delete();
            return back()->with('error', $e->getMessage());
        }
    }

    /**
     * Handle Checkout Session for mandatory subscription of 4 pound
     *
     * @param string $uuid Subscription UUID
     * @return mixed
     */
    public function handleMandatorySubscription(Request $request, $uuid)
    {
        $sub = MonthlyCharge::whereUuid($uuid)->first();
        if (!$sub) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($sub->status !== 'initiated') {
            return to_route('user.show', ['username' => $sub->user->username])->with("success", 'Subscription already processed!');
        }

        $user = User::where('id', $sub->user_id)->where('is_uk', 0)->first();

        try {
            $session = StripeControl::getCheckoutSession($sub->session_id);
            $sub->status = $session->payment_status;
            if ($session->payment_status == 'paid' || $session->payment_status == 'no_payment_required') {

                $sub->stripe_id = $session->subscription;

                // Set upcoming payment and subscription dates based on whether a trial was applied
                if (!empty($sub->current_end_trial_date)) {
                    $sub->upcoming_payment = Carbon::parse($sub->current_end_trial_date);
                } else {
                    $sub->upcoming_payment = Carbon::now()->addMonth();
                    $sub->current_start_subscription_date = now();
                    $sub->current_end_subscription_date = now()->addMonth();
                }
                if ($sub->save()) {
                    $user->is_subscribed = 1;
                    $user->save();
                }

                // Use consistent fee calculation for creator net amount (platform keeps it here)
                $breakdown = Helpers::calculateStripeDirectChargeFlow($sub->amount, $sub->currency);
                $creatorNet = $breakdown['net_to_creator'];

                // Create deliverable record for tracking and consistency
                $deliverable = Deliverable::create([
                    'uuid' => (string) Str::uuid(),
                    'product_id' => 'mandatory_charge_' . $sub->id,
                    'item_id' => $sub->id,
                    'creator_id' => null, // Platform access doesn't have a specific creator
                    'gifter_id' => $sub->user_id,
                    'session_id' => $sub->session_id,
                    'payment_intent_id' => $session->payment_intent ?? null,
                    'deliverable_type' => 'platform_access',
                    'product_type' => 'mandatory_platform_access',
                    'transaction_amount' => $sub->amount,
                    'customer_email' => $sub->email,
                    'customer_name' => $sub->name ?? $sub->user->name ?? 'User',
                    'payment_currency' => strtoupper($sub->currency ?? 'GBP'),
                    'metadata' => json_encode([
                        'monthly_charge_id' => $sub->id,
                        'user_id' => $sub->user_id,
                        'creator_net_amount' => $creatorNet,
                        'stripe_subscription_id' => $session->subscription,
                        'access_type' => 'mandatory_platform_access'
                    ])
                ]);

                // Update Stripe payment intent metadata
                if ($session->payment_intent) {
                    try {
                        $stripeMetadataService = app(StripeMetadataService::class);
                        $stripeMetadataService->updateDeliverableMetadata($deliverable, [
                            'mandatory_access_processed_at' => now()->toISOString(),
                            'immediate_delivery' => 'true'
                        ]);
                    } catch (Exception $e) {
                        Log::error('StripeController: Failed to update Stripe metadata for mandatory charge', [
                            'deliverable_id' => $deliverable->id,
                            'payment_intent_id' => $session->payment_intent,
                            'error' => $e->getMessage()
                        ]);
                    }
                }

                $currency = strtolower($request->cookie("currency", "GBP"));

                // Force correct display for GBP emails (Total = Price + Tax)
                if (strtoupper($currency) === 'GBP') {
                    $totalAmount = $sub->amount + $sub->tax;
                    $convertedAmount = number_format($totalAmount, 2);
                } else {
                    $convertedAmount = strtoupper(Helpers::priceFormat('gbp', $sub->amount + $sub->tax, $currency));
                }

                SendPaymentSuccessEmail::dispatch($sub->user, $convertedAmount, $currency, $sub->upcoming_payment);

                $this->userProfileService->clearUserCaches($sub->user->username, $sub->user->id);

                return to_route('user.show', ['username' => $sub->user->username])->with('success', "Subscription Success!");
            }

            MonthlySubscribedJob::dispatch($sub->email, $sub, 'failure');
            // MonthlySubscriptionFailedJobs::dispatch($sub);
            // SubscriptionFailed::dispatch($sub);

            $sub->save();
            return to_route('user.show', ['username' => $sub->user->username])->with('warning', "Subscription is in {$session->payment_status} status.");
        } catch (Exception $e) {
            return to_route('user.show', ['username' => $sub->user->username])->with('error', $e->getMessage());
        }
    }

    // public function mandatorySubscriptionStatus(Request $request)
    // {
    //     // Log::info('Webhook received: mandatorySubscriptionStatus');
    //     $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
    //     $endpoint_secret = env('MANDATORY_STATUS_WEBHOOK_SECRET');

    //     $payload = $request->getContent();
    //     // $sigHeader = $request->header('Stripe-Signature');
    //     $sig_header = $request->header('Stripe-Signature');
    //     $event = null;

    //     try {
    //         $event = Webhook::constructEvent(
    //             $payload,
    //             $sig_header,
    //             $endpoint_secret
    //         );
    //     } catch (\UnexpectedValueException | \Stripe\Exception\SignatureVerificationException $e) {
    //         Log::error("Webhook signature verification failed: " . $e->getMessage());
    //         return response()->json(['error' => 'Invalid signature'], 400);
    //     }

    //     if (!empty($event)) {
    //         $eventType = $event->type;
    //         $object = $event->data->object;
    //         // $subscription = $event['data']['object'];s

    //         $customer_id = $object->customer ?? null;
    //         $customer = Customer::retrieve($customer_id);

    //         $subscriptionId = data_get($object, 'subscription');
    //         $customerEmail = $customer->email ?? null;
    //         $customerName = data_get($object, 'customer_name');
    //         $invoicePdf = data_get($object, 'invoice_pdf');

    //         $subs = MonthlyCharge::where('stripe_id', $subscriptionId)->orderBy('updated_at', 'desc')->first();

    //         if ($subs) {
    //             $array = [
    //                 'email' => $customerEmail,
    //                 'name' => $customerName,
    //                 'invoice_pdf' => $invoicePdf,
    //                 'uuid' => $subs->uuid,
    //                 'notification' => $subs->user->notification_send ?? 0,
    //             ];

    //             switch ($eventType) {
    //                 case "customer.subscription.trial_will_end":
    //                     Log::info("Trial will end for subscription: {$subscriptionId}");
    //                     // $subs->status = "trial";
    //                     // $subs->save();
    //                     // SendRenewMail::dispatch($array, 'trial', 'site');
    //                     break;
    //                 case "invoice.payment_succeeded":
    //                     Log::info("Payment succeeded for subscription: {$subscriptionId}");
    //                     // if ($subs->status != 'paid') {
    //                     if (
    //                         $subs->current_end_subscription_date &&
    //                         Carbon::parse($subs->current_end_subscription_date)->lte(now())
    //                     ) {
    //                         $periodEnd = data_get($object, 'lines.data.0.period.end');
    //                         $subs->upcoming_payment = $periodEnd ? Carbon::createFromTimestamp($periodEnd)->format('Y-m-d H:i:s') : null;
    //                         $subs->current_start_subscription_date = now();
    //                         $subs->current_end_subscription_date = now()->addMonths(1);
    //                         $subs->status = "paid";
    //                         $subs->save();
    //                     }
    //                     // $planAmount = data_get($object, 'lines.data.0.plan.amount', 0);
    //                     // $planCurrency = strtoupper(data_get($object, 'lines.data.0.plan.currency', 'usd'));
    //                     // $amount = $planAmount / 100;

    //                     // SendRenewMail::dispatch($array, 'renew', 'site');

    //                     // SendPaymentSuccessEmail::dispatch($subs->user, $amount, $planCurrency, $subs->upcoming_payment);
    //                     // }
    //                     break;

    //                 case "invoice.payment_failed":
    //                     $subs->status = "failed";
    //                     $subs->save();
    //                     SendRenewMail::dispatch($array, 'failed', 'site');
    //                     break;

    //                 case "invoice.updated":
    //                     Log::info("Invoice updated for subscription: {$subscriptionId}");
    //                     $subs->status = "ended";
    //                     $subs->save();
    //                     $periodEnd = data_get($object, 'lines.data.0.period.end');

    //                     $newSubs = new MonthlyCharge();
    //                     $newSubs->stripe_id = $subs->stripe_id;
    //                     $newSubs->session_id = $subs->session_id;
    //                     $newSubs->user_id = $subs->user_id;
    //                     $newSubs->name = $subs->name;
    //                     $newSubs->email = $subs->email;
    //                     $newSubs->currency = $subs->currency;
    //                     $newSubs->amount = $subs->amount;
    //                     $newSubs->tax = $subs->tax;
    //                     $subs->current_start_subscription_date = now();
    //                     $subs->current_end_subscription_date = now()->addMonths(1);
    //                     $newSubs->upcoming_payment = Carbon::createFromTimestamp($periodEnd)->format('Y-m-d H:i:s');
    //                     $newSubs->status = "paid";
    //                     $newSubs->created_at = $subs->created_at;
    //                     $newSubs->updated_at = $subs->updated_at;
    //                     $newSubs->save();

    //                     // SendPaymentSuccessEmail::dispatch($subs->user, $amount, $planCurrency, $subs->upcoming_payment);
    //                     SendRenewMail::dispatch($array, 'renew', 'site');
    //                     break;

    //                 default:
    //                     Log::info("Unhandled event type: {$eventType}");
    //                     break;
    //             }
    //         }
    //     }

    //     return response()->json(['status' => 'success']);
    // }

    // public function createVerificationSession(Request $request)
    // {
    //     try {
    //         // Set Stripe secret key
    //         Stripe::setApiKey(env('STRIPE_SECRET_KEY'));

    //         $user = Auth::user();

    //         // Always create a real verification session, even in non-production environments
    //         // This ensures admin can view actual Stripe document images

    //         // Create a new verification session - restrict to passport only
    //         $session = VerificationSession::create([
    //             'type' => 'document',
    //             'options' => [
    //                 'document' => [
    //                     // Allow only passports; disallow ID cards and driver's licenses
    //                     'allowed_types' => ['passport'],
    //                     // Keep other defaults; adjust if business rules change
    //                     // 'require_live_capture' => true,
    //                     // 'require_matching_selfie' => false, 
    //                     // 'require_id_number' => false, 
    //                 ],
    //             ],
    //             'metadata' => [
    //                 'user_id' => $request->user() ? $request->user()->id : null,
    //             ],
    //             'provided_details' => ['email' => $request->user() ? $request->user()->email : null],
    //             'return_url' => route('user.show', [$user->username]), // Redirect here after success or failure
    //         ]);

    //         // Retrieve the user
    //         // $user = User::find($user->id); // Update 228 to dynamic user ID logic if necessary

    //         if (!$user) {
    //             return response()->json([
    //                 'error' => 'User not found.',
    //             ], 404);
    //         }

    //         // Update the user's Stripe session ID
    //         $user->stripe_user_id = $session->id;
    //         $user->identity_verification_error = null;

    //         if (env('APP_ENV') !== 'production') {
    //             $user->identity_status = 1;
    //         }

    //         if ($user->save()) {
    //             return response()->json([
    //                 'sessionId' => $session->id,
    //                 'url' => $session->url,
    //             ]);
    //         } else {
    //             return response()->json([
    //                 'error' => 'Failed to update user Stripe session ID.',
    //             ], 500);
    //         }
    //     } catch (\Exception $e) {
    //         // Log the error for debugging purposes
    //         Log::error('Error creating verification session', ['message' => $e->getMessage()]);

    //         // Handle any errors
    //         return response()->json([
    //             'error' => $e->getMessage(),
    //         ], 500);
    //     }
    // }

    public function createVerificationSession()
    {
        try {
            Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            /** @var \App\Models\User $user */
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'User not found.'], 404);
            }
            if ($user->identity_admin_status == 2) {
                // $appUrl = config('app.url');
                // if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000', 'http://localhost:8000'])) {
                $user->identity_admin_status = 0;
                // }
                $user->save();
            }
            // Create Passport-Only Stripe Identity Verification Session
            $session = VerificationSession::create([
                'type' => 'document',
                'options' => [
                    'document' => [
                        'allowed_types' => ['passport'],
                        'require_live_capture' => true,
                        'require_matching_selfie' => true,
                    ],
                ],
                'metadata' => [
                    'user_id' => $user->id,
                ],
                'provided_details' => [
                    'email' => $user->email,
                ],
                'return_url' => route('user.show', $user->username),
            ]);

            // Update user with verification session ID
            $user->stripe_user_id = $session->id;
            $user->identity_verification_error = null;

            // Skip verification in dev environment
            if (env('APP_ENV') !== 'production') {
                $user->identity_status = 1;
            }

            $user->save();

            return response()->json([
                'sessionId' => $session->id,
                'url' => $session->url,
            ]);
        } catch (\Exception $e) {
            Log::error('Error creating verification session', ['error' => $e->getMessage()]);

            return response()->json([
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function deleteConnectedAccount($accountId)
    {
        // Only allow admins to delete connected accounts or the owner
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        if ((string)$user->role !== '2' && $user->account_id !== $accountId) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        try {
            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY')); // move your secret to .env

            $deleted = $stripe->accounts->delete($accountId, []);

            // Clear local user account ID if it matches
            if ($user->account_id === $accountId) {
                $user->account_id = null;
                $user->stripe_details_submitted = 0;
                $user->save();
            } else {
                // If admin deleted it, find the user and clear it
                $targetUser = \App\Models\User::where('account_id', $accountId)->first();
                if ($targetUser) {
                    $targetUser->account_id = null;
                    $targetUser->stripe_details_submitted = 0;
                    $targetUser->save();
                }
            }

            return response()->json([
                'message' => 'Connected account deleted successfully.',
                'deleted' => $deleted,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete connected account.',
                'error' => $e->getMessage(),
            ], 400);
        }
    }

    public function makeProductId($price)
    {
        // Get currency metadata to handle zero-decimal currencies properly
        $currency = 'gbp';
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $product = StripeControl::createProduct([
            'name' => 'Gifter Card Verification',
            'images' => ["https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/"],
            "default_price_data" => ["currency" => $currency, "unit_amount_decimal" => $price * $multiplier],
        ], true);

        return response()->json([
            'product_id' => $product->id,
        ]);
    }

    // public function subscriptionUpdateStatus(Request $request)
    // {
    //     Log::info('Webhook received: subscriptionUpdateStatus');
    //     $endpoint_secret = 'whsec_5dgNdG5AVVtgC95nHMDnMJ1V8MxIlXr7';
    //     // $endpoint_secret = env('BILL_SUB_WEBHOOK_SECRET');

    //     $payload = @file_get_contents('php://input');
    //     $sig_header = $request->server('HTTP_STRIPE_SIGNATURE');

    //     // $payload = @file_get_contents('php://input');
    //     // $sig_header = $_SERVER['HTTP_STRIPE_SIGNATURE'];
    //     $event = null;

    //     try {
    //         $event = Webhook::constructEvent(
    //             $payload,
    //             $sig_header,
    //             $endpoint_secret
    //         );
    //     } catch (\UnexpectedValueException $e) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => $e->getMessage()
    //         ]);
    //         // Invalid payload
    //         http_response_code(400);
    //         exit();
    //     } catch (\Stripe\Exception\SignatureVerificationException $e) {
    //         return response()->json([
    //             'status' => false,
    //             'message' => $e->getMessage()
    //         ]);
    //         // Invalid signature
    //         http_response_code(400);
    //         exit();
    //     }

    //     // $array = [];
    //     if (!empty($event)) {
    //         // $subs = BillPayment::where('stripe_id', $event->data->object->subscription)->latest()->first();

    //         $ret = StripeControl::getSubscription($event->data->object->subscription);

    //         if ($event->type == "invoice.updated") {
    //             $metadata = $event->data->object->metadata;

    //             $userId = $metadata->user_id ?? null;
    //             $creatorId = $metadata->creator_id ?? null;
    //             $membership_id = $metadata->membership_id ?? null;

    //             Log::info("Subscription updated for user ID: {$userId}, creator ID: {$creatorId}, bill ID: {$membership_id}");
    //             // switch ($ret->status) {
    //             //     case 'active':
    //             //         $status = 'paid';
    //             //         break;
    //             //     case 'past_due':
    //             //         $status = 'failed';
    //             //         break;
    //             //     case 'canceled':
    //             //         $status = 'cancelled';
    //             //         break;
    //             //     default:
    //             //         $status = 'unknown';
    //             // }

    //             // $array = [
    //             //     'email' => $event->data->object->customer_email,
    //             //     'name' => $event->data->object->customer_name,
    //             //     'invoice_pdf' => $event->data->object->invoice_pdf,
    //             //     'uuid' => $subs->uuid,
    //             //     'notification' => $subs->user->notification_send ?? 0
    //             // ];

    //             // $subs->status = "ended";
    //             // $subs->save();

    //             // $newSubs = new BillPayment();
    //             // $newSubs->stripe_id = $subs->stripe_id;
    //             // $newSubs->session_id = $subs->session_id;
    //             // $newSubs->bills_id = $subs->bills_id;
    //             // $newSubs->user_id = $subs->user_id;
    //             // $newSubs->guest_name = $subs->guest_name;
    //             // $newSubs->guest_email = $subs->guest_email;
    //             // $newSubs->currency = $subs->currency;
    //             // $newSubs->amount = $subs->amount;
    //             // $newSubs->tax = $subs->tax;
    //             // $newSubs->recurring_for = $subs->recurring_for;
    //             // $newSubs->recurring_type = $subs->recurring_type;
    //             // $newSubs->message = $subs->message;
    //             // $newSubs->anonymous = $subs->anonymous;
    //             // $newSubs->upcoming_payment = Carbon::createFromTimestamp($ret->current_period_end)->format('Y-m-d H:i:s');
    //             // $newSubs->status = "paid";
    //             // $newSubs->created_at = $subs->created_at;
    //             // $newSubs->updated_at = Carbon::now();
    //             // $newSubs->save();

    //             // SendRenewMail::dispatch($array, 'renew', 'bill');
    //         }
    //         //  elseif ($event->type == "customer.subscription.deleted" && !empty($subs)) {
    //         //     $subs->status = 'cancelled';
    //         //     $subs->save();

    //         //     SendRenewMail::dispatch($array, 'cancelled', 'bill');
    //         // } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
    //         //     $subs->status = 'failed';
    //         //     $subs->save();

    //         //     SendRenewMail::dispatch($array, 'failed', 'bill');
    //         // }
    //     }

    //     return response()->json([
    //         'status' => true,
    //         'message' => 'success',
    //     ]);
    // }

}
