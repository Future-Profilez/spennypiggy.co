<?php

namespace App\Http\Controllers\Auth;

use AmrShawky\LaravelCurrency\Facade\Currency as FacadeCurrency;
use App\Helpers;
use App\Http\Controllers\Controller;
use App\Jobs\CheckoutMailToUser;
use App\Jobs\CheckoutUser;
use App\Jobs\MonthlySubscribedJob;
use App\Jobs\MonthlySubscribedJobs;
use App\Jobs\MonthlySubscriptionFailedJobs;
use App\Jobs\NotificationSave;
use App\Jobs\SendMailSubscriptions;
use App\Jobs\SendPaymentSuccessEmail;
use App\Jobs\SendRenewMail;
use App\Jobs\SubscribeAutoTweet;
use App\Jobs\SubscribedMail;
use App\Jobs\SubscriptionCancelAtEnd;
use App\Jobs\SubscriptionFailed;
use App\Jobs\TipJarMailToUser;
use App\Jobs\TipJarPurchased;
use App\Jobs\TipJarTweet;
use App\Jobs\WishSubscriptionMailToUser;
use App\Models\BillPayment;
use App\Models\Bills;
use App\Models\ConnectedAccountCustomer;
use App\Models\Currency;
use App\Models\Membership;
use App\Models\MonthlyCharge;
use App\Models\Post;
use App\Models\StripePaymentDetail;
use App\Models\StripePaymentItems;
use App\Models\StripeWebhookStatus;
use App\Models\Subscription;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\UserCart;
use App\Models\UserPayment;
use App\Models\WishItem;
use App\Models\WishItemSubscription;
use App\StripeControl;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use League\ISO3166\ISO3166;
use Ramsey\Uuid\Uuid;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Stripe\StripeClient;
use Stripe\Webhook;
use Stripe\Identity;
use Stripe\Identity\VerificationSession;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Customer;
use Stripe\Exception\ApiErrorException;
use App\Services\CreatorActivityService;
use App\Services\CreatorSubscriptionService;
use App\Notifications\PaymentBlockedNotification;
use App\Notifications\SubscriptionBlockedNotification;
use App\Notifications\StripeAccountMigrationNotification;

class StripeController extends Controller
{
    public function __construct()
    {
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
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
    public function index()
    {
        $user = User::find(Auth::id());
        if ($user->stripe_details_submitted == 1) {
            return redirect(route("user.show", $user->username))->with("error", "Stripe Account already connected!");
        }

        // Require: approved profile, Stripe identity verified, and admin identity approved
        if (($user->profile_status_lock ?? 0) != 2) {
            return redirect(route("user.show", $user->username))->with("error", "Your profile is not approved yet.");
        }
        if (($user->identity_status ?? 0) != 1) {
            return redirect(route("user.show", $user->username))->with("error", "Please complete Stripe identity verification first.");
        }
        // if (($user->identity_admin_status ?? 0) != 1) {
        //     return redirect(route("user.show", $user->username))->with("error", "Identity review is pending or rejected by admin.");
        // }

        if (!empty($user->account_id)) {
            try {
                $account = StripeControl::getAccount($user->account_id);
                if ($account->charges_enabled) {
                    return redirect(route("user.show", $user->username))->with("success", "Already Connected!");
                }
            } catch (Exception $e) {
                return redirect(route("user.show", $user->username))->with("error", $e->getMessage());
            }
        }
        return Inertia::render("stripe/Stripe");
    }

    /**
     * Init Connect Account Start
     *
     * @param Request $request
     * @param string $step Connection Current Step
     * @return mixed
     */
    public function initConnect(Request $request, $step = "init", $country = null, $currency = null)
    {
        $user = User::find(Auth::id());

        // Require: approved profile, Stripe identity verified, and admin identity approved
        if (($user->profile_status_lock ?? 0) != 2) {
            return redirect(route("user.show", $user->username))->with("error", "Your profile is not approved yet.");
        }
        if (($user->identity_status ?? 0) != 1) {
            return redirect(route("user.show", $user->username))->with("error", "Please complete Stripe identity verification first.");
        }
        if (($user->identity_admin_status ?? 0) != 1) {
            return redirect(route("user.show", $user->username))->with("error", "Identity review is pending or rejected by admin.");
        }


        if (empty($user->account_id)) {
            $country = strtoupper($country);
            try {
                // Determine service agreement type based on country to handle cross-border payment restrictions
                $serviceAgreementType = self::getServiceAgreementType($country);

                Log::info('Creating Stripe account with service agreement', [
                    'user_id' => $user->id,
                    'country' => $country,
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

                $payload = [
                    "country" => $country,
                    "type" => "express",
                    'email' => $user->email,
                    'capabilities' => $capabilities,
                    'tos_acceptance' => ['service_agreement' => $serviceAgreementType],
                    // 'business_type' => 'individual',
                    "business_type" => ($user->country === 'AE') ? 'company' : 'individual',
                    'business_profile' => [
                        'url'   => "https://spennypiggy.co/{$user->username}",
                        'mcc'   => '7278',
                    ],
                    'default_currency' => $currency,
                ];
                $account = StripeControl::createAccount($payload);
                $user->account_id = $account->id;
                $user->country = $country;
                $user->save();
            } catch (Exception $e) {
                return redirect(route("stripe.index"))->with("error", "Account creation error:" . $e->getMessage());
            }
        }

        try {
            $account = StripeControl::getAccount($user->account_id);
            if ($account->charges_enabled) {
                $user->stripe_details_submitted = 1;
                $user->save();
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


    public function upgradeStripeAccount(Request $request)
    {
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
            Cache::forget("migration_status_{$user->id}");

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

            // Set capabilities based on the ACTUAL service agreement of the account
            // This prevents capability mismatch errors
            $capabilities = [];
            if ($currentServiceAgreement === 'recipient') {
                // Recipient accounts can only request transfers capability
                $capabilities['transfers'] = ['requested' => true];
            } else {
                // Full service agreement accounts can request both capabilities
                // For card_payments capability, Stripe requires BOTH card_payments AND transfers
                // This is mandatory per Stripe documentation: https://stripe.com/docs/connect/account-capabilities#card-payments
                $capabilities['card_payments'] = ['requested' => true];
                $capabilities['transfers'] = ['requested' => true];
            }

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
            }

            // 1. Ask for the capabilities ↴
            StripeControl::getClient()->accounts->update(
                $user->account_id,
                [
                    'capabilities' => $capabilities,
                ]
            );

            // 2. Create an onboarding link ↴
            $accountLink = StripeControl::getClient()->accountLinks->create([
                'account'      => $user->account_id,
                'refresh_url'  => route('stripe.connect', [
                    'step'    => 'refresh',
                    'country' => $user->country,
                ]),
                'return_url'   => route('stripe.return'),
                'type'         => 'account_onboarding',
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
    public function connectReturn(Request $request)
    {
        $data = $request->all();
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
            Cache::forget("stripe_capabilities_{$user->account_id}");
            Cache::forget("migration_status_{$user->id}");

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
    public function loginToStripe(Request $request)
    {
        try {
            $stripe = StripeControl::getLoginLink(Auth::user()->account_id);
            return Inertia::location($stripe->url);
        } catch (Exception $e) {
            return back()->with("error", $e->getMessage());
        }
    }

    /* create checkout */
    public function createCheckout($owner_id)
    {
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

            $lineItems = [];
            $subtotal = 0;
            $taxNew = 0;
            $adminFee = config('app.administration_fee');
            foreach ($getdata as $dd) {
                $priceId = $dd->priceid != Null ? $dd->priceid : $dd->wish->price_id;
                $totalPrice = $priceId + $adminFee + $dd->tax;

                $lineItems[] = [
                    'price' => $totalPrice ?? '',
                    'quantity' => $dd->quantity,
                ];

                $subtotal += $dd->amount;
                $taxNew += $dd->tax;
                $taxNew += $adminFee;
            }

            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));

            $sessionCreate = $stripe->checkout->sessions->create([
                'success_url' => route('checkout.success', [$owner_id]),
                'cancel_url' => route('checkout.cancel', [$owner_id]),
                'line_items' => $lineItems,
                'mode' => 'payment',
                'payment_intent_data' => [
                    'transfer_data' => [
                        'destination' => $getdata[0]->owner->account_id, // Creator's connected account ID
                    ],
                    'application_fee_amount' => $taxNew,
                    'receipt_email' => $user->email,
                ],
                'customer_email' => $user->email,
                'metadata' => [
                    'user_id' => Auth::id(),
                    'creator_id' => $owner_id,
                    'wish_id' => $getdata[0]->wish_item_id ?? null,
                    'deliverable_type' => 'media_bundle',
                    'certificate' => 'true',
                    'product_type' => 'wish_one_off',
                ],
            ]);

            $stripePaymentDetail = StripePaymentDetail::create([
                'amount_subtotal' => $subtotal,
                'amount_total' => $sessionCreate->amount_total / 100,
                'tax' => $taxNew,
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

            $stripePaymentDetail->refresh();

            return Inertia::location($sessionCreate->url);
        } catch (Exception $e) {
            return back()->with('error', 'Something went wrong. Error: ' . $e->getMessage());
        }
    }

    public function retrive($id)
    {
        $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
        $data = $stripe->checkout->sessions->retrieve(
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

            $sessionId = session('session_id');
            StripePaymentDetail::where('session_id', $sessionId)->update([
                'payment_status' => 'paid',
                'updated_at' => Carbon::now(),
            ]);
            $stripeid = StripePaymentDetail::where('session_id', $sessionId)->first();
            foreach ($getdata as $dd) {
                $payment_data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $dd->wish_item_id ?? Null,
                    'user_cart_id' => $dd->id,
                    'amount' => $dd->amount,
                    'tax' => $dd->tax,
                    'anonymous' => $dd->anonymous ?? false,
                    'message' => $dd->message ?? null,
                ]);
                $payment_data->refresh();
                $message = $stripeid->message;


                // if ($dd->wish_item_id == NULL) {
                //     CheckoutUser::dispatch($payment_data, false, $dd, $message, false);
                // } else {
                //     CheckoutUser::dispatch($payment_data, false, false, $message, false);
                // }
            }

            // CheckoutMailToUser::dispatch($stripeid);
            // NOTE: Disabled to prevent duplicate emails - CheckoutController handles this with proper currency

            if (!empty($getdata[0]->owner->username)) {
                return redirect(route('user.show', [$getdata[0]->owner->username]))->with('success', 'Payment Successfull.');
            } else {
                return redirect(route('user.show', [Auth::user()->username]))->with('success', 'Payment Successfull.');
            }
        } catch (\Throwable $th) {
            Log::info('error:' . $th);
        }
    }

    public function cancelCheckout($owner_id)
    {
        $getdata = UserCart::where('user_id', Auth::id())->where('owner_id', $owner_id)->where('status', 1)->with(['wish'])->get();
        $sessionId = session('session_id');
        StripePaymentDetail::where('session_id', $sessionId)->update([
            'payment_status' => 'unpaid',
            'updated_at' => Carbon::now(),
        ]);
        return redirect(route('user.show', [$getdata[0]->owner->username]))->with('error', 'Payment Cancel.');
        // return view('cancel');
    }

    public function createAnonymousCheckout($device_id)
    {
        try {
            // \Log::info(request()->query('name'));
            $cart = UserCart::where('device_id', $device_id)->where('status', 1)->with('owner')->get();

            if (!empty($cart)) {
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
                        'This creator is temporarily unavailable. Please try again later.'
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
                foreach ($cart as $key => $value) {

                    $lineItems[] = [
                        'price' => !empty($value->priceid) ? $value->priceid : $value->wish->price_id,
                        'quantity' => $value->quantity,
                    ];
                }

                $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY'));
                $sessioncreate = $stripe->checkout->sessions->create([
                    'success_url' => route('checkout.anonymous.success', [$device_id]),
                    'cancel_url' => route('checkout.anonymous.cancel', [$device_id]),
                    'line_items' => $lineItems,
                    'mode' => 'payment',
                    'metadata' => [
                        'user_id' => null, // Anonymous purchase
                        'creator_id' => $cart[0]->owner_id,
                        'wish_id' => $cart[0]->wish_item_id ?? null,
                        'deliverable_type' => 'media_bundle',
                        'certificate' => 'true',
                        'product_type' => 'wish_one_off',
                        'device_id' => $device_id,
                    ],
                ]);

                $callbackData = $sessioncreate;
                $subtotal = ($callbackData->amount_total / 100) / (1 + (env('TAX_PERCENTAGE') / 100));
                $taxnew = ($callbackData->amount_total / 100) - ($subtotal);

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
                $stripeid->refresh();

                return Inertia::location($sessioncreate->url);
            }
        } catch (\Throwable $th) {
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

            foreach ($cart as $key => $value) {
                $amount = $value->amount;
                $tax = $value->tax;
                if ($value->wish_item_id != null) {
                    if ($value->wish->subscription == 2) {
                        $value->wish->fullfill_amount += $amount;
                        $value->wish->save();
                    }
                }

                $data = StripePaymentItems::create([
                    'uuid' => Uuid::uuid4(),
                    'stripe_payment_detail_id' => $stripeid->id,
                    'wish_item_id' => $value->wish_item_id ?? null,
                    'amount' => $amount,
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


            return redirect(route('user.show', [$stripeid->owner->username]))->with('success', 'Payment Successfull.');
        } catch (\Throwable $th) {
            //throw $th;
        }
    }

    public function anonymousCancelCheckout($id = null)
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
        if (!$wish->user) return redirect()->back()->with('error', 'Creator not found!');

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
                'This creator is temporarily unavailable. Please try again later.'
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

        if ($wish->user['is_subscribed'] !== 1) {
            return redirect()->back()->with('error', 'Currently creator has paused gift payments. Please again later when gift payments are active.');
        }


        $subtotals = 0;
        $totalAmount = $wish->price;
        $ConvertedToGBpAmount = Helpers::priceFormat($wish->currency, $totalAmount, 'gbp');
        $subtotals += $ConvertedToGBpAmount;


        $currency = strtolower($request->cookie("currency", "usd"));
        $tax = (float) str_replace(',', '', $wish->tax_amount);
        $price = (float) str_replace(',', '', $wish->price);
        $adminFee = (float) config('app.administration_fee');
        $totalTax = $tax + $adminFee;
        $vat_percentage_amount = 0;

        if ($reccure === 'continue' && !empty($wish->user->vat_amount_percentage)) {
            $vat_percentage_amount = ($price + $tax) * $wish->user->vat_amount_percentage / 100;
        }

        if ($request->isMethod("POST")) {
            if (!Auth::check() && $subtotals > 50) {
                return to_route('login', ['message' => 'Larger payments more than £50 need to login']);
            }
            $request->validate([
                'name' => ['nullable', 'sometimes', 'string', 'max:50'],
                'email' => ['required', 'email:dns'],
                'message' => ['sometimes', 'nullable', 'string', 'max:800'],
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

                        \Log::info('StripeController: Canceled existing subscription for new subscription', [
                            'old_subscription_id' => $existingSub->id,
                            'old_stripe_id' => $existingSub->stripe_id,
                            'user_id' => $user->id,
                            'wish_item_id' => $wish->id
                        ]);
                    } catch (\Exception $e) {
                        \Log::warning('StripeController: Failed to cancel existing subscription', [
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

            $sub = WishItemSubscription::create([
                'wish_item_id'   => $wish->id,
                'user_id'        => Auth::id(),
                'guest_name'     => $request->name ?? NULL,
                'guest_email'    => $request->email,
                'currency'       => $wish->currency,
                'amount'         => $wish->price,
                'tax'            => $totalTax,
                'vat_tax_amount' => ceil($vat_percentage_amount),
                'recurring_for'  => $reccure,
                'recurring_type' => $wish->subscription_period,
                'payment_method' => 'stripe',
                'surprise_message' => $request->message ?? NULL,
                'anonymous' => $request->anonymous ?? 0
            ]);

            $connectedAccountId = $wish->user->account_id;

            $storeCustomer = ConnectedAccountCustomer::where([
                'user_id' => $user->id,
                'creator_id' => $wish->user->id,
                'connected_account_id' => $connectedAccountId,
                'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                'currency' => $currency
            ])->first();

            if (!$storeCustomer) {
                $customer = StripeControl::createCustomer([
                    'email' => $user->email,
                    'name' => $user->name,
                ], $connectedAccountId);
            }

            $basePrice = Helpers::priceFormat($wish->currency, $wish->price, $currency);
            $platformFeePercentage = config('app.platform_fee_percentage');
            $adminFeeGBP = config('app.administration_fee');
            $gbpToUsdRate = Helpers::priceFormat('GBP', $adminFeeGBP, $currency);

            $platformFeeAmount = $basePrice * $platformFeePercentage / 100;
            $vatAmount = 0;
            if ($reccure === 'continue' && !empty($wish->user->vat_amount_percentage)) {
                $vat_percentage_amount = Helpers::priceFormat($wish->currency, $vat_percentage_amount, $currency);
                // $vatAmount = ($basePrice + $platformFeeAmount) * $wish->user->vat_amount_percentage / 100;
            }

            $creatorTotal = $basePrice + $vat_percentage_amount;
            $platformTotal = $platformFeeAmount + $gbpToUsdRate;
            $finalTotalAmount = $creatorTotal + $platformTotal;
            $applicationFeePercent = ($platformTotal / $finalTotalAmount) * 100;

            // Look for existing price with same currency
            $existingPrice = ConnectedAccountCustomer::where([
                'user_id' => $user->id,
                'creator_id' => $wish->user->id,
                'connected_account_id' => $connectedAccountId,
                'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                'product_id' => $wish->stripe_product_id,
                'currency' => $currency
            ])->first();

            $priceId = $existingPrice->price_id ?? null;

            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            if (!$priceId) {

                $priceParams = [
                    'unit_amount' => round($finalTotalAmount * $multiplier),
                    'currency' => $currency,
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
            if ($existingSubscription && $existingSubscription->currency !== $currency) {
                $customer = StripeControl::createCustomer([
                    'email' => $user->email,
                    'name' => $user->name,
                ], $connectedAccountId);

                $customer_id = $customer->id;

                ConnectedAccountCustomer::create([
                    'user_id' => $user->id,
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'stripe_customer_id' => $customer_id,
                    'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                    'product_id' => $wish->stripe_product_id,
                    'price_id' => $priceId,
                    'currency' => $currency
                ]);
            }

            if (!$storeCustomer) {
                ConnectedAccountCustomer::create([
                    'user_id' => $user->id,
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'stripe_customer_id' => $customer_id,
                    'product_type' => $reccure != 'onetime' ? 'wish item subscription' : 'wish item subscription onetime',
                    'product_id' => $wish->stripe_product_id,
                    'price_id' => $priceId,
                    'currency' => $currency
                ]);
            }

            // Calculate creator VAT amount if applicable
            $creatorVatAmount = 0;
            if (isset($wish->user->vat_amount_percentage) && $wish->user->vat_amount_percentage > 0) {
                $creatorVatAmount = round(($basePrice * $wish->user->vat_amount_percentage / 100) * $multiplier);
            }

            // Use destination charges pattern like cart/tip payments - create line items that sum to total charge
            $lineItems = [
                [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => $wish->wishname ?? 'Wish Item Subscription',
                            'description' => "Subscription content from {$wish->user->name}",
                        ],
                        'unit_amount' => round($basePrice * $multiplier),
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

            // Add creator VAT as separate line item if applicable
            if ($creatorVatAmount > 0) {
                $vatLineItem = [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => 'Creator VAT',
                        ],
                        'unit_amount' => $creatorVatAmount,
                        'tax_behavior' => 'exclusive',
                    ],
                ];

                // Add recurring data for VAT if not onetime
                if ($reccure !== 'onetime') {
                    $vatLineItem['price_data']['recurring'] = [
                        'interval' => StripeControl::$periods[$wish->subscription_period],
                        'interval_count' => 1,
                    ];
                }

                $lineItems[] = $vatLineItem;
            }

            // Add platform fee as separate line item
            $platformFeeLineItem = [
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => 'Platform Fee (' . config('app.platform_fee_percentage', 20) . '%) - Wish Subscription',
                    ],
                    'unit_amount' => round($platformTotal * $multiplier),
                    'tax_behavior' => 'exclusive',
                ],
            ];

            // Add recurring data for platform fee if not onetime
            if ($reccure !== 'onetime') {
                $platformFeeLineItem['price_data']['recurring'] = [
                    'interval' => StripeControl::$periods[$wish->subscription_period],
                    'interval_count' => 1,
                ];
            }

            $lineItems[] = $platformFeeLineItem;

            // Transfer amount = wish price + creator's VAT (what creator receives)
            $transferAmount = round($basePrice * $multiplier) + $creatorVatAmount;

            // Total charge amount = wish price + creator's VAT + platform fees
            $totalChargeAmount = round($basePrice * $multiplier) + $creatorVatAmount + round($platformTotal * $multiplier);

            // Check if creator has card_payments capability to determine payment flow
            $hasCardPayments = \App\StripeControl::hasCardPaymentsCapability($connectedAccountId);

            $payload = [
                'mode' => $reccure === 'onetime' ? 'payment' : 'subscription',
                'payment_method_types' => ['card'],
                'line_items' => $lineItems, // Total amount determined by line items
                'customer_email' => $user->email,
                'success_url' => route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => 'success']),
                'cancel_url' => route('wish.subscribe.handle', ['uuid' => $sub->uuid, 'status' => 'cancel']),
            ];

            if ($reccure === 'onetime') {
                $paymentIntentData = [
                    'description' => "One-time Wish Subscription for {$wish->user->username} with platform fee",
                    'metadata' => \App\Helpers::buildStripeMetadata('wish_subscription', $sub, [
                        'creator_id' => (string) $wish->user->id,
                        'wish_id' => (string) $wish->id,
                        'deliverable_type' => $reccure === 'onetime' ? 'media_bundle' : 'access',
                        'certificate' => 'true',
                        'product_type' => $reccure === 'onetime' ? 'wish_onetime' : 'wish_subscription',
                        'wishlist_item_id' => (string) $wish->id,
                        'item_amount' => (string) round($basePrice * $multiplier),
                        'creator_vat_amount' => (string) $creatorVatAmount,
                        'transfer_amount' => (string) $transferAmount,
                        'platform_fee_amount' => (string) round($platformTotal * $multiplier),
                        'total_charge_amount' => (string) $totalChargeAmount,
                        'payment_type' => $hasCardPayments ? 'One-time Wish Subscription - Destination Charges with transfers' : 'One-time Wish Subscription - Platform Charges with transfers',
                        'anonymous' => (string) ($sub->anonymous ?? 0),
                        'has_card_payments' => (string) $hasCardPayments,
                    ]),
                ];

                // Only add on_behalf_of if creator has card_payments capability
                if ($hasCardPayments) {
                    $paymentIntentData['on_behalf_of'] = $connectedAccountId; // Shows creator as seller-of-record
                    $paymentIntentData['transfer_data'] = [
                        'destination' => $connectedAccountId, // Creator's connected account
                        'amount' => $transferAmount, // What creator receives (wish + VAT)
                    ];
                } else {
                    // For restricted creators, charge on platform and transfer the creator amount
                    // Use simple destination transfer without application_fee_amount
                    $paymentIntentData['transfer_data'] = [
                        'destination' => $connectedAccountId,
                        'amount' => $transferAmount, // Transfer only what creator should receive
                    ];
                }

                $payload['payment_intent_data'] = $paymentIntentData;

                Log::info('Wish subscription payment flow determined', [
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'has_card_payments' => $hasCardPayments,
                    'using_on_behalf_of' => $hasCardPayments,
                    'payment_type' => 'onetime'
                ]);
            } else {
                $subscriptionData = [
                    'description' => 'Wish Item Subscription Content Purchase.',
                    'metadata' => \App\Helpers::buildStripeMetadata('wish_subscription', $sub, [
                        'creator_id' => (string) $wish->user->id,
                        'wish_id' => (string) $wish->id,
                        'deliverable_type' => $reccure === 'onetime' ? 'media_bundle' : 'access',
                        'certificate' => 'true',
                        'product_type' => $reccure === 'onetime' ? 'wish_onetime' : 'wish_subscription',
                        'wishlist_item_id' => (string) $wish->id,
                        'item_amount' => (string) round($basePrice * $multiplier),
                        'creator_vat_amount' => (string) $creatorVatAmount,
                        'transfer_amount' => (string) $transferAmount,
                        'platform_fee_amount' => (string) round($platformTotal * $multiplier),
                        'total_charge_amount' => (string) $totalChargeAmount,
                        'payment_type' => $hasCardPayments ? 'Recurring Wish Subscription - Destination Charges with transfers' : 'Recurring Wish Subscription - Platform Charges with transfers',
                        'anonymous' => (string) ($sub->anonymous ?? 0),
                        'has_card_payments' => (string) $hasCardPayments,
                    ]),
                    'transfer_data' => [
                        'destination' => $connectedAccountId, // Creator's connected account
                        'amount_percent' => round(($transferAmount / $totalChargeAmount) * 100, 2), // Percentage of total to transfer
                    ],
                ];

                // For subscriptions, on_behalf_of is not used in subscription_data, but we still log the capability
                $payload['subscription_data'] = $subscriptionData;

                Log::info('Wish subscription payment flow determined', [
                    'creator_id' => $wish->user->id,
                    'connected_account_id' => $connectedAccountId,
                    'has_card_payments' => $hasCardPayments,
                    'payment_type' => 'subscription'
                ]);
            }

            try {
                $session = StripeControl::createCheckoutSession($payload); // Create session on PLATFORM account (no connected account parameter)
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
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handleSubscription($uuid, $status)
    {
        $sub = WishItemSubscription::whereUuid($uuid)->first();
        if (!$sub) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($sub->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }
        try {
            // Since we're using destination charges, session is created on platform account (no connected account parameter)
            $session = StripeControl::getCheckoutSession($sub->session_id);

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

                \Log::info('StripeController: Starting subscription email handling', [
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

                    \Log::info('StripeController: Created StripePaymentDetail for subscription', [
                        'subscription_id' => $sub->id,
                        'stripe_payment_id' => $stripePayment->id,
                        'session_id' => $stripePayment->session_id,
                        'user_id' => $stripePayment->user_id,
                        'owner_id' => $stripePayment->owner_id
                    ]);

                    // Get currency symbol for email
                    $currency = \App\Models\Currency::where('iso', strtoupper($sub->currency))->first();
                    $currencySymbol = $currency ? $currency->symbol : '£';

                    // Dispatch CheckoutMailToUser with real StripePaymentDetail - this will create deliverables and send email with content
                    \App\Jobs\CheckoutMailToUser::dispatch($stripePayment, $currencySymbol);

                    \Log::info('StripeController: CheckoutMailToUser dispatched for subscription deliverables', [
                        'subscription_id' => $sub->id,
                        'stripe_payment_id' => $stripePayment->id,
                        'currency_symbol' => $currencySymbol,
                        'email_address' => $sub->guest_email
                    ]);
                } catch (\Exception $e) {
                    \Log::error('StripeController: Failed to dispatch CheckoutMailToUser for subscription', [
                        'subscription_id' => $sub->id,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }

                // ✅ ALWAYS send WishSubscriptionMailToUser - this is the confirmation email to the gifter
                // This should be sent regardless of CheckoutMailToUser success/failure
                WishSubscriptionMailToUser::dispatch($sub, $mailToSend, $amountTotal, $creator_name);
                \Log::info('StripeController: WishSubscriptionMailToUser dispatched for gifter confirmation', [
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

                        \Log::info('StripeController: Populated subscription with Stripe data', [
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
                        \Log::warning('StripeController: No subscription ID in session, using fallback calculation', [
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
                    \Log::error('StripeController: Failed to retrieve Stripe subscription details', [
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
                $userPayment->currency = $sub->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status;
                $userPayment->save();

                $message = $username . " just subscribed to your subscription wish " . $sub->wish_item->name;
                NotificationSave::dispatch($message, $sub->wish_item->user, $sub->user, 'Wish Subscription');
                $message = null;
                if ($sub->recurring_for == 'onetime') {
                    $message = 'Subscription Success! If you have paid for onetime subscription, it will be automatically cancelled after 24 hours.';
                } else {
                    $message = 'Subscription Payment Successfully Paid.';
                }
                return to_route('thank-you', ['username' => $sub->wish_item->user->username])->with('success', $message);
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
            // Use wish item price only (no fees) to match what user expects to pay for the content
            $stripePayment = \App\Models\StripePaymentDetail::create([
                'uuid' => \Str::uuid(),
                'session_id' => $subscription->session_id,
                'user_id' => $subscription->user_id,
                'owner_id' => $subscription->wish_item->user_id,
                'stripe_payment_intent_id' => $session->payment_intent ?? null,
                'amount_subtotal' => $subscription->wish_item->price, // Use wish item price directly
                'amount_total' => $subscription->wish_item->price, // Use wish item price directly (no fees)
                'currency' => $subscription->currency,
                'payment_status' => $session->payment_status,
                'guest_email' => $subscription->guest_email,
                'guest_name' => $subscription->guest_name,
                'anonymous' => $subscription->anonymous ?? false,
                'message' => $subscription->surprise_message,
                'metadata' => json_encode([
                    'subscription_id' => $subscription->id,
                    'wish_item_id' => $subscription->wish_item->id,
                    'subscription_type' => $subscription->recurring_for,
                    'content_delivery' => true
                ])
            ]);

            // Create the corresponding stripe payment items for the subscription
            $stripePaymentItem = \App\Models\StripePaymentItems::create([
                'uuid' => \Str::uuid(),
                'stripe_payment_detail_id' => $stripePayment->id,
                'wish_item_id' => $subscription->wish_item->id,
                'amount' => $subscription->wish_item->price, // Use wish item price directly
                'quantity' => 1,
                'message' => $subscription->surprise_message,
                'anonymous' => $subscription->anonymous ?? false
            ]);

            \Log::info('StripeController: Created StripePaymentDetail and Item for subscription', [
                'subscription_id' => $subscription->id,
                'stripe_payment_id' => $stripePayment->id,
                'stripe_payment_item_id' => $stripePaymentItem->id,
                'wish_item_id' => $subscription->wish_item->id
            ]);

            return $stripePayment;
        } catch (\Exception $e) {
            \Log::error('StripeController: Failed to create StripePaymentDetail for subscription', [
                'subscription_id' => $subscription->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    public function subscriptionStatus(Request $request)
    {
        $stripe = new StripeClient(env('STRIPE_SECRET_KEY'));

        // This is your Stripe CLI webhook secret for testing your endpoint locally.

        // $payload = @file_get_contents('php://input');
        $endpoint_secret = env('WISH_SUB_WEBHOOK_SECRET');
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
            $ret = StripeControl::getSubscription($event->data->object->subscription);
            if ($charge->object == 'charge') {
                if ($event->type == "customer.subscription.deleted" && !empty($subs)) {
                    $subs->payment_status = 'cancelled';
                    $subs->save();

                    SendRenewMail::dispatch($array, 'cancelled', 'main');
                } elseif ($event->type == "invoice.payment_failed" && !empty($subs)) {
                    $subs->payment_status = 'failed';
                    $subs->save();

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
                }

                if (!empty($subs)) {
                    $stripe = new StripeWebhookStatus;
                    $stripe->subscription_id = $subs->id;
                    $stripe->invoice_type = $event->type;
                    $stripe->data = $event;
                    $stripe->save();
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

                            // Create deliverable record for tracking
                            $deliverable = \App\Models\Deliverable::create([
                                'uuid' => \Illuminate\Support\Str::uuid(),
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
                                    'subscription_payment' => true,
                                    'content_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                                    'invoice_id' => $event->data->object->id,
                                    'billing_reason' => $event->data->object->billing_reason ?? null
                                ])
                            ]);

                            // Dispatch ProcessWishItemDeliverable job for content processing using SQS
                            \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable)->onConnection('sqs_certificates');

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
                            \App\Jobs\WishSubscriptionMailToUser::dispatch(
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
            $stripeClient = new StripeClient(env('STRIPE_SECRET_KEY'));
            $stripeSubscription = $stripeClient->subscriptions->retrieve($subscriptionId);

            // Update subscription with new period information
            $wishSubscription->current_period_start = Carbon::createFromTimestamp($stripeSubscription->current_period_start);
            $wishSubscription->current_period_end = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
            $wishSubscription->upcoming_payment = Carbon::createFromTimestamp($stripeSubscription->current_period_end);
            $wishSubscription->stripe_status = $stripeSubscription->status;
            $wishSubscription->updated_at = Carbon::now();
            $wishSubscription->save();

            Log::info('Subscription updated with new renewal period', [
                'subscription_id' => $wishSubscription->id,
                'stripe_id' => $subscriptionId,
                'new_period_end' => $wishSubscription->current_period_end,
                'new_upcoming_payment' => $wishSubscription->upcoming_payment
            ]);

            // Send renewal email notification
            $this->sendRenewalEmailNotification($wishSubscription, $invoiceData);

            // If wish item has content to deliver for renewals, create deliverable
            if ($wishSubscription->wish_item && (!empty($wishSubscription->wish_item->content_file) || !empty($wishSubscription->wish_item->reward))) {

                // Create deliverable record for renewal content delivery
                $deliverable = \App\Models\Deliverable::create([
                    'uuid' => \Illuminate\Support\Str::uuid(),
                    'product_id' => (string) $wishSubscription->wish_item->id,
                    'item_id' => $wishSubscription->wish_item->id,
                    'creator_id' => $wishSubscription->wish_item->user_id,
                    'gifter_id' => $wishSubscription->user_id,
                    'session_id' => $wishSubscription->session_id,
                    'payment_intent_id' => $invoiceData->payment_intent ?? null,
                    'deliverable_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'media_bundle',
                    'product_type' => 'wish_subscription_renewal',
                    'transaction_amount' => $wishSubscription->wish_item->price, // Use wish item price directly (base amount only)
                    'status' => 'pending',
                    'customer_email' => $wishSubscription->guest_email,
                    'customer_name' => $wishSubscription->guest_name,
                    'anonymous' => $wishSubscription->anonymous ?? false,
                    'message' => 'Subscription renewal content delivery',
                    'metadata' => json_encode([
                        'wish_id' => $wishSubscription->wish_item->id,
                        'subscription_id' => $wishSubscription->id,
                        'stripe_subscription_id' => $subscriptionId,
                        'subscription_renewal' => true,
                        'content_type' => !empty($wishSubscription->wish_item->content_file) ? 'content_file' : 'reward',
                        'invoice_id' => $invoiceData->id,
                        'billing_reason' => $invoiceData->billing_reason ?? 'subscription_cycle'
                    ])
                ]);

                // Dispatch job to process renewal content delivery using SQS
                \App\Jobs\ProcessWishItemDeliverable::dispatch($deliverable)->onConnection('sqs_certificates');

                Log::info('Subscription renewal content delivery job dispatched', [
                    'deliverable_id' => $deliverable->id,
                    'subscription_id' => $subscriptionId,
                    'wish_item_id' => $wishSubscription->wish_item->id
                ]);
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
    private function sendRenewalEmailNotification($wishSubscription, $invoiceData)
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
            \App\Jobs\WishSubscriptionMailToUser::dispatch(
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
        return to_route('user.show', ['username' => $subs->wish_item->user->username])->with('success', "Subscription is cancelled for wish {$subs->wish_item->wishname}.");
    }

    public function tipToJar(Request $request, $creator_uid)
    {
        $user = Auth::user();
        if (!empty($user) && $user->role === 0 && $user->is_uk == 0 && $user->is_500_limit_exceeded == 1 && $user->profile_status_lock != 2) {
            return response()->json([
                'status' => false,
                'msg' => "Please complete your card verification process. Go your profile and complete your card verification process."
            ]);
        }
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'usd';
        $creator = User::where('uuid', $creator_uid)->where('is_uk', 0)->first();
        if (!$creator) {
            return response()->json([
                'status' => false,
                'msg' => "Creator not found."
            ]);
        }
        if ($creator['is_subscribed'] !== 1) {
            return response()->json([
                'status' => false,
                'msg' => "Currently creator has paused gift payments. Please try again later when gift payments are active."
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
                'msg' => 'This creator is temporarily unavailable. Please try again later.'
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
                'msg' => 'This creator is temporarily unavailable. Please try again later.'
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
                'message' => 'sometimes|nullable|string|max:800'
            ]);


            $amount = $request->amount;
            $ConvertedAmount = Helpers::priceFormat($creator->default_currency, $amount, 'gbp');
            // return response()->json([
            //     'creator->default_currency' => $creator->default_currency,
            //     'amount' => $amount,
            //     'ConvertedAmount' => $ConvertedAmount,
            //     'cookies_currency' => $currency,
            // ]);

            if (!Auth::check() && $ConvertedAmount > 50) {
                return response()->json([
                    'status' => false,
                    'msg' => "Larger payments more than £50 need to login."
                ]);
            }

            $isZeroDecimalCurrency = in_array(strtolower($currency), ['jpy', 'krw', 'vnd']);
            $amount = $request->amount;
            $adminFeeAmount = config('app.administration_fee', 1);
            $taxPercentage = config('app.platform_fee_percentage');
            $price = Helpers::priceFormat($currency, $amount, $creator->default_currency);

            $tax = round(($price * $taxPercentage / 100), 2, PHP_ROUND_HALF_UP);
            $adminFeeForStoreDB = Helpers::priceFormat('GBP', $adminFeeAmount, $creator->default_currency);
            $totalTaxForDB = $tax + $adminFeeForStoreDB;

            $taxAmount = round(($amount * $taxPercentage / 100), 2, PHP_ROUND_HALF_UP);
            $adminFeeForPay = Helpers::priceFormat('GBP', $adminFeeAmount, $currency);
            $totalTaxForPay = $taxAmount + $adminFeeForPay;
            // Get currency metadata to handle zero-decimal currencies properly
            $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
            $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

            $applicationFeeAmount = round($totalTaxForPay * $multiplier);
            $unitAmount = round($amount * $multiplier);

            // Calculate creator VAT amount if applicable
            $creatorVatAmount = 0;
            if (isset($creator->vat_amount_percentage) && $creator->vat_amount_percentage > 0) {
                $creatorVatAmount = round(($amount * $creator->vat_amount_percentage / 100) * $multiplier);
            }

            // Transfer amount = item amount + creator's VAT (what creator receives)
            $transferAmount = $unitAmount + $creatorVatAmount;

            // Total charge amount = item amount + creator's VAT + platform fees
            $totalChargeAmount = $unitAmount + $creatorVatAmount + $applicationFeeAmount;

            $pay = TipGoalsPayment::create([
                'tip_goal_id' => $goal->id ?? null,
                'user_id' => Auth::id() ?? null,
                'creator_id' => $creator->id,
                'guest_name' => $request->name,
                'guest_email' => $request->email,
                'currency' => $creator->default_currency,
                'amount' => $price,
                'tax' => $totalTaxForDB,
                'message' => $request->message ?? null,
                'anonymous' => $request->anonymous ?? 0,
            ]);

            // Use destination charges pattern like createCheckout - create line items that sum to total charge
            $lineItems = [
                [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => "Support payment to {$creator->name}",
                            'description' => "Some support to {$creator->name} to help them create more content.",
                        ],
                        'unit_amount' => $unitAmount,
                    ]
                ]
            ];

            // Add creator VAT as separate line item if applicable
            if ($creatorVatAmount > 0) {
                $lineItems[] = [
                    'quantity' => 1,
                    'price_data' => [
                        'currency' => $currency,
                        'product_data' => [
                            'name' => 'Creator VAT',
                        ],
                        'unit_amount' => $creatorVatAmount,
                        'tax_behavior' => 'exclusive',
                    ],
                ];
            }

            // Add platform fee as separate line item
            $lineItems[] = [
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'product_data' => [
                        'name' => 'Platform Fee (' . config('app.platform_fee_percentage', 20) . '%) - Support Payment',
                    ],
                    'unit_amount' => $applicationFeeAmount,
                    'tax_behavior' => 'exclusive',
                ],
            ];

            // Check if creator has card_payments capability to determine payment flow
            $hasCardPayments = \App\StripeControl::hasCardPaymentsCapability($creator->account_id);

            // Build payment_intent_data based on creator's capabilities
            $paymentIntentData = [
                'description' => "Spenny Piggy - Support payment to {$creator->name} with platform fee",
                "metadata" => \App\Helpers::buildStripeMetadata('support_payment', $pay, [
                    // 'support_goal_id' => (string) ($goal->id ?? ''),
                    'item_amount' => (string) $unitAmount,
                    'certificate' => true,
                    'creator_vat_amount' => (string) $creatorVatAmount,
                    'transfer_amount' => (string) $transferAmount,
                    'platform_fee_amount' => (string) $applicationFeeAmount,
                    'total_charge_amount' => (string) $totalChargeAmount,
                    'payment_type' => $hasCardPayments ? 'Support Payment - Destination Charges with transfers' : 'Support Payment - Platform Charges with transfers',
                    'anonymous' => (string) ($request->anonymous ? 'yes' : 'no'),
                    'has_card_payments' => (string) $hasCardPayments,
                ]),
            ];

            // Only add on_behalf_of if creator has card_payments capability
            if ($hasCardPayments) {
                $paymentIntentData['on_behalf_of'] = $creator->account_id; // Shows creator as seller-of-record
                $paymentIntentData['transfer_data'] = [
                    'destination' => $creator->account_id, // Creator's connected account
                    'amount' => $transferAmount, // What creator receives (item + VAT)
                ];
                Log::info('Using standard flow with on_behalf_of for support payment', [
                    'creator_id' => $creator->id,
                    'connected_account_id' => $creator->account_id,
                    'has_card_payments' => true,
                    'payment_type' => 'support_payment',
                    'transfer_amount' => $transferAmount
                ]);
            } else {
                // For restricted creators (transfers-only), charge on platform and transfer the creator amount
                // Use simple destination transfer without application_fee_amount
                $paymentIntentData['transfer_data'] = [
                    'destination' => $creator->account_id,
                    'amount' => $transferAmount, // Transfer only what creator should receive
                ];
                Log::info('Using fallback flow without on_behalf_of for restricted support payment creator', [
                    'creator_id' => $creator->id,
                    'connected_account_id' => $creator->account_id,
                    'has_card_payments' => false,
                    'reason' => 'Creator lacks card_payments capability',
                    'payment_type' => 'support_payment',
                    'transfer_amount' => $transferAmount
                ]);
            }

            $payload = [
                "mode" => 'payment',
                'payment_method_types' => ['card'],
                'line_items' => $lineItems, // Total amount determined by line items
                'payment_intent_data' => $paymentIntentData,
                'customer_email' => $user->email ?? $request->email,
                'success_url' => route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "success"]),
                'cancel_url' => route('tip-jar.handle', ['uuid' => $pay->uuid, 'status' => "cancel"]),
            ];

            try {
                // Create session on PLATFORM account (no connected account parameter)
                $session = StripeControl::createCheckoutSession($payload);
                $pay->update(['session_id' => $session->id]);

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
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handleTipJarPayment($uuid, $status)
    {
        $currency = !empty(request()->cookie('currency')) ? strtolower(request()->cookie('currency')) : 'gbp';
        $tip_pay = TipGoalsPayment::whereUuid($uuid)->first();
        if (!$tip_pay) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        try {
            // Since we're using destination charges, session is created on platform account (no connected account parameter)
            $session = StripeControl::getCheckoutSession($tip_pay->session_id);
            $tip_pay->status = $session->payment_status;
            if ($session->payment_status == 'paid') {
                $ownerCurrency = Currency::where('iso', strtoupper($tip_pay->currency))->first();
                $userCurrency = Currency::where('iso', strtoupper($currency))->first();

                if (!$ownerCurrency || !$userCurrency) {
                    Log::error("Currency not found - Owner: " . strtoupper($tip_pay->currency) . ", User: " . strtoupper($currency));
                    return to_route('user.show', ['username' => $tip_pay->creator->username])->with('error', 'Currency configuration error. Please contact support.');
                }

                $userAmount = Helpers::priceFormat($tip_pay->currency, $tip_pay->amount, $currency);
                $creatorAmount = Helpers::priceFormat($tip_pay->currency, $tip_pay->amount, $currency);

                // Send notification to creator
                TipJarPurchased::dispatch($tip_pay, $ownerCurrency->symbol);

                // Process supporter deliverable, certificate, and email (replaces TipJarMailToUser)
                \App\Jobs\TipPaymentMailToUser::dispatch($tip_pay, $userCurrency ? $userCurrency->iso : $tip_pay->currency);

                // Generate thank you post for creator's feed
                \App\Jobs\CreateThankYouPostJob::dispatch($tip_pay);

                $tip_pay->save();

                /**************************TIP**JAR**PWA**START****************************************************/
                // below is TIP JAR pwa for fans
                $CreatorName = ucfirst($tip_pay->creator->name) ?? 'A Creator';
                $title = "🏅 You've unlocked a new badge!";
                $content = "You just tipped to $CreatorName. Thanks for supporting them!.";
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
                $userPayment->currency = $tip_pay->currency;
                $userPayment->payment_method = 'stripe';
                $userPayment->payment_details = json_encode($session, true);
                $userPayment->paid_at = Carbon::now();
                $userPayment->status = $session->payment_status ?? 'paid';
                $userPayment->save();

                $message = $username . " just granted some coins to your piggy bank";
                NotificationSave::dispatch($message, $tip_pay->creator, $tip_pay->user, 'Piggy Bank');

                return to_route('user.show', ['username' => $tip_pay->creator->username])->with('success', "Thank you for your support!");
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
        $currency = strtolower($request->cookie("currency", "GBP"));
        $price = 4.00;
        $tax = round(($price * 20 / 100), 2, PHP_ROUND_HALF_UP);
        $fee_per = number_format(($tax / ($tax + $price)) * 100, 2);

        $user = User::where('id', Auth::id())->first();
        if (!$user) {
            return back()->with('error', 'Subscription not allowed for this user.');
        }

        if (!$user->stripe_id) {
            $customer = StripeControl::createCustomer([
                'email' => $user->email,
                'name' => $user->name,
            ], '');

            $customer_id = $customer->id;
            $user->stripe_id = $customer_id;
            $user->save();
        }

        $sub = MonthlyCharge::create([
            'user_id'   =>  $user->id,
            'name'      =>  $user->name ?? NULL,
            'email'     =>  $user->email,
            'currency'  =>  "GBP",
            'amount'    =>  $price,
            'tax'       =>  $tax,
        ]);

        $amount = $price + $tax;
        // Get currency metadata to handle zero-decimal currencies properly
        $currencyModel = Currency::where('ISO', strtoupper($currency))->first();
        $multiplier = ($currencyModel && $currencyModel->ISOdigits == 0) ? 1 : 100;

        $unit_amount = round(Helpers::priceFormat("GBP", $amount, $currency) * $multiplier);

        $trial_period_days = 3;

        $payload = [
            "mode"  =>  'subscription',
            "currency"  =>  $currency,
            'line_items' =>  [[
                'quantity' => 1,
                'price_data' => [
                    'currency' => $currency,
                    'product' => env("SUBSCRIPTION_4_PRODUCT_ID"),
                    'unit_amount' => $unit_amount, // Ensure integer
                    'recurring' => [
                        'interval' => StripeControl::$periods["monthly"],
                        'interval_count' => 1
                    ]
                ]
            ]],
            'subscription_data' => [
                'trial_period_days' => $trial_period_days,
                'description' => "Subscription for using site through Stripe.",
                'metadata' => Helpers::buildStripeMetadata('site_subscription', $sub, [
                    'subscription_amount' => (string) $price,
                    'tax_amount' => (string) $tax,
                    'trial_period_days' => (string) $trial_period_days,
                    'subscription_purpose' => 'mandatory_platform_access',
                ]),
            ],
            'customer_email' => $user->email,
            'success_url' => route('mandatory.handle', ['uuid' => $sub->uuid, 'status' => "success"]),
            'cancel_url' => route('mandatory.handle', ['uuid' => $sub->uuid, 'status' => "cancel"]),
        ];

        try {
            $session = StripeControl::createCheckoutSession($payload);
            $sub->update([
                'session_id' => $session->id,
                'current_start_trial_date' => now(),
                'current_end_trial_date' => now()->addDays($trial_period_days),
            ]);
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
     * @param string $status Status of Subscription
     * @return mixed
     */
    public function handleMandatorySubscription(Request $request, $uuid, $status)
    {
        $sub = MonthlyCharge::whereUuid($uuid)->first();
        if (!$sub) {
            return to_route('home')->with("error", 'Insufficient data!');
        }
        if ($sub->status !== 'initiated') {
            return to_route('home')->with("error", 'Subscription already processed!');
        }

        $email = isset($sub->user) ? $sub->user->email : $sub->email;
        $user = User::where('id', $sub->user_id)->where('is_uk', 0)->first();

        try {
            $session = StripeControl::getCheckoutSession($sub->session_id);
            $sub->status = $session->payment_status;
            if ($session->payment_status == 'paid') {

                $sub->stripe_id = $session->subscription;

                // $sub->upcoming_payment = Carbon::now()->addMonth();
                $sub->upcoming_payment = Carbon::now()->addDays(3);
                if ($sub->save()) {
                    // update profile status lock 1
                    $user->profile_status_lock = 1;
                    $user->is_subscribed = 1;
                    $user->save();
                }
                $currency = strtolower($request->cookie("currency", "GBP"));
                $convertedAmount = strtoupper(Helpers::priceFormat('gbp', $sub->amount, $currency));
                SendPaymentSuccessEmail::dispatch($sub->user, $convertedAmount, $currency, $sub->upcoming_payment);

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

    public function createVerificationSession(Request $request)
    {
        try {
            Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            $user = Auth::user();
            if (!$user) {
                return response()->json(['error' => 'User not found.'], 404);
            }
            if($user->identity_admin_status == 2){
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
        try {
            $stripe = new \Stripe\StripeClient(env('STRIPE_SECRET_KEY')); // move your secret to .env

            $deleted = $stripe->accounts->delete($accountId, []);

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
