<?php

namespace App;

use Exception;
use Illuminate\Support\Facades\Log;
use Stripe\Account;
use Stripe\Account\LoginLink;
use Stripe\AccountLink;
use Stripe\Balance;
use Stripe\Checkout\Session;
use Stripe\Collection;
use Stripe\Customer;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\OAuth\InvalidRequestException;
use Stripe\Exception\RateLimitException;
use Stripe\PaymentIntent;
use Stripe\Payout;
use Stripe\Price;
use Stripe\Product;
use Stripe\SearchResult;
use Stripe\StripeClient;
use Stripe\Subscription;
use Stripe\Transfer;

class StripeControl
{
    /**
     * Subscription Periods
     *
     * @var array
     */
    public static $periods = [
        'daily' => 'day',
        'weekly' => 'week',
        'monthly' => 'month',
        'yearly' => 'year',
    ];

    /**
     * Stripe Clients
     *
     * @var StripeClient
     */
    private static $client;

    private static $clientUs;

    /**
     * Check and set as well as return the client
     *
     * @return void
     */
    public static function setClient()
    {
        try {
            if (empty(self::$client)) {
                $apiKey = config('services.stripe.secret') ?? env('STRIPE_SECRET_KEY');

                if (empty($apiKey) || ! is_string($apiKey)) {
                    Log::error('Stripe UK API key configuration issue');
                    throw new Exception('Stripe UK API key is not properly configured.');
                }

                self::$client = new StripeClient($apiKey);
            }

            if (empty(self::$clientUs)) {
                $apiKeyUs = env('STRIPE_SECRET_KEY_US') ?? config('services.stripe.secret') ?? env('STRIPE_SECRET_KEY');

                if (empty($apiKeyUs) || ! is_string($apiKeyUs)) {
                    Log::error('Stripe US API key configuration issue');
                    // Fallback to UK client if US key is missing
                    self::$clientUs = self::$client;
                } else {
                    self::$clientUs = new StripeClient($apiKeyUs);
                }
            }
        } catch (Exception $e) {
            throw new Exception('Stripe Initialization Error: '.$e->getMessage());
        }
    }

    /**
     * Get the appropriate client based on currency
     */
    public static function getClientForCurrency(?string $currency = 'GBP'): StripeClient
    {
        self::setClient();
        $currency = strtoupper($currency ?? 'GBP');

        if ($currency === 'USD') {
            return self::$clientUs;
        }

        return self::$client;
    }

    /**
     * Get the appropriate client based on account ID
     * (Currently defaults to currency-based logic or manual override)
     */
    public static function getClientForAccount(?string $accountId = null): StripeClient
    {
        self::setClient();

        return self::$client;
    }

    public static function getClient()
    {
        self::setClient();

        return self::$client;
    }

    /**
     * Create a Customer
     *
     * @param  array  $payload  User Payload
     * @return throwable||\Stripe\Customer
     */
    public static function createCustomer(array $payload, string $connectedAccountId)
    {
        self::setClient();
        try {
            if (! $connectedAccountId) {
                // If no connected account ID is provided, create the customer directly
                return self::$client->customers->create($payload);
            }

            return self::$client->customers->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Fetch a platform customer.
     *
     * Returns null when the customer does not exist on this Stripe account; a
     * returned object may still carry deleted=true, which Checkout rejects.
     *
     * @param  string  $customer_id  Stripe Customer Id
     * @return Customer|null
     */
    public static function retrieveCustomer($customer_id)
    {
        self::setClient();
        try {
            return self::$client->customers->retrieve($customer_id, []);
        } catch (InvalidRequestException $e) {
            return null;
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Delete an Account
     *
     * @param  string  $account_id  Stripe Account Id
     * @return mixed
     */
    public static function deleteAccount($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->delete($account_id, []);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function getStripeFeeMinorForPaymentIntent(string $paymentIntentId, ?string $connectedAccountId = null): int
    {
        self::setClient();
        try {
            $params = [
                'expand' => ['charges.data.balance_transaction'],
            ];
            $opts = [];
            if (! empty($connectedAccountId)) {
                $opts['stripe_account'] = $connectedAccountId;
            }

            $pi = self::$client->paymentIntents->retrieve($paymentIntentId, $params, $opts);
            $charge = $pi->charges->data[0] ?? null;
            if (! $charge) {
                return 0;
            }

            $balanceTx = $charge->balance_transaction ?? null;
            if (! $balanceTx) {
                return 0;
            }

            if (is_string($balanceTx)) {
                $balanceTx = self::$client->balanceTransactions->retrieve($balanceTx, [], $opts);
            }

            $fee = $balanceTx->fee ?? 0;

            return is_numeric($fee) ? (int) $fee : 0;
        } catch (\Throwable $e) {
            Log::error('Failed to fetch Stripe fee for payment intent', [
                'payment_intent_id' => $paymentIntentId,
                'connected_account_id' => $connectedAccountId,
                'error' => $e->getMessage(),
            ]);

            return 0;
        }
    }

    /**
     * Check if connected account has card_payments capability active
     * This determines whether the account can accept direct charges
     *
     * @param  string  $accountId  Stripe Connected Account ID
     * @return bool True if account can accept direct charges, false otherwise
     */
    public static function hasCardPaymentsCapability(string $accountId): bool
    {
        // Use cache to avoid repeated API calls for the same account
        // Removed caching to ensure real-time accuracy for critical payment capability checks
        // $cacheKey = "stripe_card_payments_capability_{$accountId}";

        // return \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($accountId) {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);
            $hasCardPayments = ($account->capabilities->card_payments ?? null) === 'active';

            Log::info('Stripe capability check completed', [
                'account_id' => $accountId,
                'card_payments_capability' => $account->capabilities->card_payments ?? 'missing',
                'has_card_payments' => $hasCardPayments,
                'service_agreement' => $account->tos_acceptance->service_agreement ?? 'unknown',
            ]);

            return $hasCardPayments;
        } catch (Exception $e) {
            Log::error('Failed to check card_payments capability: '.$e->getMessage(), [
                'account_id' => $accountId,
            ]);

            // Default to true to maintain existing behavior for API failures
            return true;
        }
        // });
    }

    /**
     * Bank capabilities a connected account can hold, by account country.
     * Requesting one the account isn't eligible for makes Stripe error, so this
     * is the allow-list used at onboarding and by the backfill command.
     */
    public static function bankCapabilitiesForCountry(?string $country): array
    {
        $country = strtoupper((string) $country);

        // Pay by Bank (open banking) — Stripe supports UK/FI, plus FR/DE.
        $payByBank = ['GB', 'FI', 'FR', 'DE'];
        // SEPA Direct Debit — Eurozone/SEPA scheme.
        $sepa = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];

        $caps = [];
        if (in_array($country, $payByBank, true)) {
            $caps[] = 'pay_by_bank_payments';
        }
        if (in_array($country, $sepa, true)) {
            $caps[] = 'sepa_debit_payments';
        }
        if ($country === 'US') {
            $caps[] = 'us_bank_account_ach_payments';
        }

        return $caps;
    }

    /**
     * Normalise a Stripe account's capabilities to a plain [name => status] map.
     * A raw `(array)` cast on a StripeObject yields its internal properties
     * (_values, _opts, …), not the capability names — so always go through
     * toArray() when it's available.
     */
    public static function capabilitiesMap($account): array
    {
        $caps = $account->capabilities ?? null;

        if ($caps === null) {
            return [];
        }

        if (is_object($caps) && method_exists($caps, 'toArray')) {
            return $caps->toArray();
        }

        return is_array($caps) ? $caps : [];
    }

    /**
     * Request the bank payment capabilities this account's country supports.
     * Stripe's dashboard "on by default" only covers accounts with Dashboard
     * access, so Express/Custom connected accounts must have these requested
     * explicitly — otherwise checkout refuses bank with
     * "not available for this creator yet".
     *
     * Each capability is requested independently so one ineligible/errored
     * capability doesn't block the others. Returns the ones now requested.
     */
    public static function requestBankCapabilities(string $accountId, ?string $country = null): array
    {
        self::setClient();

        if ($country === null) {
            try {
                $country = self::$client->accounts->retrieve($accountId)->country ?? null;
            } catch (\Throwable $e) {
                Log::error('requestBankCapabilities: could not retrieve account', [
                    'account_id' => $accountId,
                    'error' => $e->getMessage(),
                ]);

                return [];
            }
        }

        $granted = [];
        foreach (self::bankCapabilitiesForCountry($country) as $capability) {
            try {
                self::$client->accounts->updateCapability($accountId, $capability, ['requested' => true]);
                $granted[] = $capability;
            } catch (\Throwable $e) {
                Log::warning('requestBankCapabilities: capability not requestable', [
                    'account_id' => $accountId,
                    'capability' => $capability,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $granted;
    }

    /**
     * Generic connected-account capability check for bank payment methods.
     * $capabilities e.g. ['pay_by_bank_payments', 'sepa_debit_payments'].
     * Returns the subset of Stripe payment_method_types whose capability is
     * active on the account (fails open like hasCardPaymentsCapability).
     */
    public static function activeBankMethodTypes(string $accountId, array $methodTypes): array
    {
        if (empty($methodTypes)) {
            return [];
        }

        $capabilityMap = [
            'pay_by_bank' => 'pay_by_bank_payments',
            'sepa_debit' => 'sepa_debit_payments',
            'us_bank_account' => 'us_bank_account_ach_payments',
        ];

        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);

            return array_values(array_filter($methodTypes, function ($type) use ($account, $capabilityMap) {
                $capability = $capabilityMap[$type] ?? null;

                return $capability && ($account->capabilities->{$capability} ?? null) === 'active';
            }));
        } catch (Exception $e) {
            Log::error('Failed to check bank payment capabilities: '.$e->getMessage(), [
                'account_id' => $accountId,
            ]);

            // Fail CLOSED: unlike the card check (where card is the baseline and
            // Stripe would reject at create time), assuming an unconfirmed bank
            // capability produces a session Stripe refuses — a broken checkout
            // for the supporter. Returning none falls back to the card path.
            return [];
        }
    }

    public static function hasTransfersCapability(string $accountId): bool
    {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);

            return ($account->capabilities->transfers ?? null) === 'active';
        } catch (Exception $e) {
            Log::error('Failed to check transfers capability: '.$e->getMessage(), [
                'account_id' => $accountId,
            ]);

            return true;
        }
    }

    // ✅   Add a check in your class to validate capabilities
    public static function isAccountReadyForCheckout(string $accountId): bool
    {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);
            $agreement = $account->tos_acceptance->service_agreement ?? 'full';

            // For recipient service agreement, only transfers capability is required
            // if ($agreement === 'recipient') {
            //    return ($account->capabilities->transfers ?? null) === 'active';
            // }

            // For full service agreement, both card_payments and transfers must be active
            return ($account->capabilities->card_payments ?? null) === 'active'
                && ($account->capabilities->transfers ?? null) === 'active';
        } catch (Exception $e) {
            Log::error('Failed to verify account capabilities: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Get comprehensive Stripe account requirements and action items
     *
     * @param  string  $accountId  Stripe Account ID
     * @return array Account requirements analysis
     */
    public static function getAccountRequirements(string $accountId): array
    {
        self::setClient();
        try {
            $account = self::$client->accounts->retrieve($accountId);
            $requirements = [];
            $hasRequirements = false;

            // Check if account is disabled
            if (! $account->charges_enabled) {
                $hasRequirements = true;

                // Check disabled reason
                if (isset($account->requirements->disabled_reason)) {
                    switch ($account->requirements->disabled_reason) {
                        case 'requirements.past_due':
                            $requirements[] = [
                                'type' => 'past_due_requirements',
                                'severity' => 'critical',
                                'title' => 'Past Due Requirements',
                                'message' => 'Your account has past due requirements that must be completed immediately to restore payment processing.',
                                'action' => 'Complete missing information in your Stripe dashboard.',
                                'action_url' => '/stripe/enable_card_payments',
                            ];
                            break;

                        case 'requirements.pending_verification':
                            $requirements[] = [
                                'type' => 'pending_verification',
                                'severity' => 'warning',
                                'title' => 'Verification Pending',
                                'message' => 'Your account information is being verified. This process typically takes 1-3 business days.',
                                'action' => 'Please wait for verification to complete.',
                                'action_url' => null,
                            ];
                            break;

                        case 'rejected.fraud':
                            $requirements[] = [
                                'type' => 'rejected_fraud',
                                'severity' => 'critical',
                                'title' => 'Account Rejected - Fraud',
                                'message' => 'Your account was rejected due to fraud concerns. Please contact support.',
                                'action' => 'Contact Stripe support for account review.',
                                'action_url' => null,
                            ];
                            break;

                        case 'rejected.listed':
                            $requirements[] = [
                                'type' => 'rejected_listed',
                                'severity' => 'critical',
                                'title' => 'Account Rejected - Listed',
                                'message' => 'Your account was rejected due to being on a restricted list.',
                                'action' => 'Contact Stripe support for clarification.',
                                'action_url' => null,
                            ];
                            break;

                        case 'rejected.other':
                            $requirements[] = [
                                'type' => 'rejected_other',
                                'severity' => 'critical',
                                'title' => 'Account Rejected',
                                'message' => 'Your account was rejected. Please contact support for more information.',
                                'action' => 'Contact Stripe support for account review.',
                                'action_url' => null,
                            ];
                            break;
                    }
                }

                // Check currently due requirements
                if (! empty($account->requirements->currently_due)) {
                    $requirements[] = [
                        'type' => 'currently_due',
                        'severity' => 'high',
                        'title' => 'Information Required',
                        'message' => 'Additional information is required to activate your account.',
                        'action' => 'Complete your account setup with the missing information.',
                        'action_url' => '/stripe/enable_card_payments',
                        'fields_needed' => $account->requirements->currently_due,
                    ];
                }

                // Check eventually due requirements — only fields NOT already
                // shown in the currently_due card (avoid duplicate cards)
                $eventuallyOnly = array_values(array_diff(
                    $account->requirements->eventually_due ?? [],
                    $account->requirements->currently_due ?? []
                ));
                if (! empty($eventuallyOnly)) {
                    $requirements[] = [
                        'type' => 'eventually_due',
                        'severity' => 'medium',
                        'title' => 'Action Needed Soon',
                        'message' => 'Additional information will be required in the future to maintain your account.',
                        'action' => 'Complete account information at your convenience.',
                        'action_url' => '/stripe/enable_card_payments',
                        'fields_needed' => $eventuallyOnly,
                    ];
                }
            }

            // Check capabilities issues
            if (isset($account->capabilities->card_payments)) {
                if ($account->capabilities->card_payments === 'inactive') {
                    $hasRequirements = true;
                    $requirements[] = [
                        'type' => 'card_payments_inactive',
                        'severity' => 'high',
                        'title' => 'Card Payments Disabled',
                        'message' => 'Card payment capability is not active on your account.',
                        'action' => 'Enable card payments in your account settings.',
                        'action_url' => '/stripe/enable_card_payments',
                    ];
                } elseif ($account->capabilities->card_payments === 'pending') {
                    $hasRequirements = true;
                    $requirements[] = [
                        'type' => 'card_payments_pending',
                        'severity' => 'medium',
                        'title' => 'Card Payments Pending',
                        'message' => 'Card payment capability is being reviewed.',
                        'action' => 'Please wait for the review to complete.',
                        'action_url' => null,
                    ];
                }
            }

            // Check for legacy account upgrade needs using proper migration logic
            // Note: We need the user object to check migration needs properly
            // For now, we'll skip this check here since it requires user context
            // The migration check is handled in the controllers where user context is available

            // Check payout capability
            if (isset($account->capabilities->transfers) && $account->capabilities->transfers !== 'active') {
                $hasRequirements = true;
                $requirements[] = [
                    'type' => 'transfers_disabled',
                    'severity' => 'high',
                    'title' => 'Payouts Disabled',
                    'message' => 'Your account cannot receive payouts. This may be due to missing bank account information.',
                    'action' => 'Complete your payout information.',
                    'action_url' => '/stripe/enable_card_payments',
                ];
            }

            return [
                'has_requirements' => $hasRequirements,
                'requirements' => $requirements,
                'account_status' => [
                    'charges_enabled' => $account->charges_enabled,
                    'details_submitted' => $account->details_submitted,
                    'payouts_enabled' => $account->payouts_enabled ?? false,
                    'disabled_reason' => $account->requirements->disabled_reason ?? null,
                ],
            ];
        } catch (Exception $e) {
            Log::error('Failed to get account requirements: '.$e->getMessage());

            return [
                'has_requirements' => true,
                'requirements' => [[
                    'type' => 'connection_error',
                    'severity' => 'critical',
                    'title' => 'Account Connection Issue',
                    'message' => 'Unable to check your Stripe account status. Please try again or contact support.',
                    'action' => 'Refresh the page or contact support.',
                    'action_url' => null,
                ]],
                'account_status' => [],
            ];
        }
    }

    /**
     * Search Customer
     *
     * @param  string  $query  Query like name, email
     * @return SearchResult
     */
    /**
     * Search Customer across both UK and US accounts
     *
     * @param  string  $query  Query like name, email
     * @return array Array of customers from both accounts
     */
    public static function searchCustomerAcrossAccounts($email)
    {
        self::setClient();
        $results = [];
        $query = "email:'".$email."'";

        try {
            // 1. Search UK
            $searchUk = self::$client->customers->search(['query' => $query]);
            foreach ($searchUk->data as $customer) {
                $customer->account_region = 'UK';
                $results[] = $customer;
            }
        } catch (Exception $e) {
            Log::warning('Stripe UK search failed: '.$e->getMessage());
        }

        try {
            // 2. Search US
            if (self::$clientUs !== self::$client) {
                $searchUs = self::$clientUs->customers->search(['query' => $query]);
                foreach ($searchUs->data as $customer) {
                    $customer->account_region = 'US';
                    $results[] = $customer;
                }
            }
        } catch (Exception $e) {
            Log::warning('Stripe US search failed: '.$e->getMessage());
        }

        return $results;
    }

    public static function searchCustomer($query)
    {
        self::setClient();
        try {
            return self::$client->customers->search([
                'query' => $query,
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Account
     *
     * @param  array  $payload  Account Payload
     * @return Account|Throwable
     */
    public static function createAccount($payload)
    {
        self::setClient();
        try {
            // Force manual payout schedule for all created accounts
            if (! isset($payload['settings'])) {
                $payload['settings'] = [];
            }
            if (! isset($payload['settings']['payouts'])) {
                $payload['settings']['payouts'] = [];
            }
            if (! isset($payload['settings']['payouts']['schedule'])) {
                $payload['settings']['payouts']['schedule'] = [];
            }
            $payload['settings']['payouts']['schedule']['interval'] = 'manual';

            return self::$client->accounts->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Retrive an Account
     *
     * @param  string  $account_id  Stripe Account Id
     * @return Throwable|Account
     */
    public static function getAccount($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->retrieve($account_id, []);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update a connected account.
     *
     * @param  string  $account_id  Connected account ID
     * @param  array  $payload  Fields to update
     * @return Throwable|Account
     */
    public static function updateAccount($account_id, array $payload)
    {
        self::setClient();
        try {
            return self::$client->accounts->update($account_id, $payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Account Link
     *
     * @param  array  $payload  Account Link Payload
     * @return Throwable|AccountLink
     */
    public static function createAccountLink($payload)
    {
        self::setClient();
        try {
            return self::$client->accountLinks->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Express Account Link
     *
     * @param  string  $account_id  Stripe Express Account Id
     * @return Throwable|LoginLink
     */
    public static function getLoginLink($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->createLoginLink($account_id);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Build a merchant-of-record statement descriptor for a creator.
     *
     * Produces "<USERNAME> CONTENT" within Stripe's 22-char limit, always preserving the
     * " CONTENT" marker so the charge reads as a content purchase, never a person-to-person
     * transfer or a platform/gift charge. Strips characters Stripe disallows.
     *
     * @param  string  $username  Creator username (or display name)
     */
    public static function buildContentDescriptor($username): string
    {
        $marker = ' CONTENT';
        // Stripe disallows < > \ ' " * in descriptors; keep alnum, space, underscore, dot, hyphen.
        $clean = preg_replace('/[^A-Za-z0-9 _.\-]/', '', (string) $username);
        $clean = trim(strtoupper($clean));

        $maxName = 22 - strlen($marker); // reserve room for the marker
        if (strlen($clean) > $maxName) {
            $clean = rtrim(substr($clean, 0, $maxName));
        }
        if ($clean === '') {
            $clean = 'CREATOR';
        }

        return substr($clean.$marker, 0, 22);
    }

    /**
     * Create Payment Intent
     *
     * @param  array  $payload  Payment Payload
     * @param  string|null  $connectedAccountId  Connected Account ID
     * @param  bool  $force3DS  Whether to force 3D Secure
     * @param  string|null  $creatorUsername  The username of the creator to use in statement descriptor
     * @return Throwable|PaymentIntent
     */
    public static function createPaymentIntent(array $payload, $connectedAccountId = null, bool $force3DS = false, $creatorUsername = null)
    {
        self::setClient();

        if ($force3DS) {
            $payload['payment_method_options']['card']['request_three_d_secure'] = 'any';
        }

        if ($creatorUsername) {
            // Merchant-of-record: descriptor reads as a content purchase in the creator's name
            // (e.g. "JUSTJACK99 CONTENT"), never a platform/gift marker.
            $payload['statement_descriptor'] = self::buildContentDescriptor($creatorUsername);
        }

        try {
            if ($connectedAccountId) {
                // Set the Stripe Account context
                return self::$client->paymentIntents->create(
                    $payload,
                    ['stripe_account' => $connectedAccountId]
                );
            }

            return self::$client->paymentIntents->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create Payment Session
     *
     * @param  array  $payload  Payment Payload
     * @param  string|null  $connectedAccountId  Connected Account ID
     * @param  bool  $force3DS  Whether to force 3D Secure
     * @param  string|null  $creatorUsername  The username of the creator to use in statement descriptor
     * @return Throwable|Session
     */
    public static function createCheckoutSession(array $payload, $connectedAccountId = null, bool $force3DS = false, $creatorUsername = null)
    {
        self::setClient();

        if ($force3DS) {
            $payload['payment_method_options']['card']['request_three_d_secure'] = 'any';
        }

        if ($creatorUsername) {
            $descriptor = self::buildContentDescriptor($creatorUsername);

            // For one-time payments (mode: payment)
            if (isset($payload['mode']) && $payload['mode'] === 'payment') {
                if (! isset($payload['payment_intent_data'])) {
                    $payload['payment_intent_data'] = [];
                }
                $payload['payment_intent_data']['statement_descriptor'] = $descriptor;
            }
            // For subscriptions (mode: subscription)
            elseif (isset($payload['mode']) && $payload['mode'] === 'subscription') {
                // subscription_data does not support statement_descriptor in the Checkout Session API.
                // Recurring charges fall back to the connected account's default descriptor, which we set
                // to the same "USERNAME CONTENT" value at Connect onboarding (see StripeController).
            }
        }

        try {
            if ($connectedAccountId) {
                // Set the Stripe Account context
                return self::$client->checkout->sessions->create(
                    $payload,
                    ['stripe_account' => $connectedAccountId]
                );
            }

            return self::$client->checkout->sessions->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Get A CheckOut Session
     *
     * @param  string  $sessionId  Stripe Session Checkout Id
     * @return Throwable|Session
     */
    public static function getCheckoutSession($sessionId, $connectedAccountId = null)
    {
        self::setClient();

        if ($connectedAccountId) {
            // Set the Stripe Account context
            return self::$client->checkout->sessions->retrieve(
                $sessionId,
                [],
                ['stripe_account' => $connectedAccountId]
            );
        }
        try {
            return self::$client->checkout->sessions->retrieve($sessionId);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Get Active subscription of customer
     */
    public static function getActiveSubscriptionByCustomer($customerId, $connectedAccountId = null)
    {
        self::setClient();

        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            // 1. Check UK Account (Default)
            $subscriptions = self::$client->subscriptions->all(
                [
                    'customer' => $customerId,
                    'limit' => 1,
                ],
                $options
            );

            if ($subscriptions->data && count($subscriptions->data) > 0) {
                return $subscriptions->data[0];
            }

            // 2. Check US Account if no connected account is specified (Platform Sub)
            if (! $connectedAccountId && self::$clientUs !== self::$client) {
                $subscriptionsUs = self::$clientUs->subscriptions->all(
                    [
                        'customer' => $customerId,
                        'limit' => 1,
                    ],
                    $options
                );

                if ($subscriptionsUs->data && count($subscriptionsUs->data) > 0) {
                    return $subscriptionsUs->data[0];
                }
            }

            return null;
        } catch (Exception $e) {
            Log::error('Stripe fetch subscription error: '.$e->getMessage());

            return null;
        }
    }

    /**
     * Create a Stripe Product
     *
     * @param  array  $payload  Product Payload
     * @return Throwable|Product
     */
    public static function createProduct(array $payload, string $connectedAccountId)
    {
        self::setClient();
        try {
            return self::$client->products->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            Log::info('Stripe API Error: '.$e->getMessage());
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Create a Stripe Price
     *
     * @param  array  $payload  Price Payload
     * @return Throwable|Price
     */
    public static function createPrice(array $priceData, mixed $connectedAccountId = null)
    {
        self::setClient();

        if (! $connectedAccountId) {
            return self::$client->prices->create($priceData);
        }

        return self::$client->prices->create(
            $priceData,
            ['stripe_account' => $connectedAccountId]
        );
    }

    /**
     * Create a Stripe Price
     *
     * @param  array  $payload  Price Payload
     * @return Throwable|Price
     */
    public static function getProduct(?string $productId, ?string $connectedAccountId = null)
    {
        // Return null if productId is null or empty
        if (empty($productId)) {
            return null;
        }

        self::setClient();
        $options = [];
        if ($connectedAccountId) {
            $options['stripe_account'] = $connectedAccountId;
        }

        return self::$client->products->retrieve(
            $productId,
            [],
            $options
        );
    }

    /**
     * Create a Stripe Price
     *
     * @param  array  $payload  Price Payload
     * @return Throwable|Price
     */
    public static function createSubscription(array $payload, string $connectedAccountId)
    {
        self::setClient();

        try {
            return self::$client->subscriptions->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            Log::info('Stripe API Error: '.$e->getMessage());
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param  string  $sub_id  Subscription Id
     * @param  array  $payload  Update Payload
     * @return Throwable|Subscription
     */
    public static function updateSubscription($productId, $payload, $accountId = null)
    {
        self::setClient();

        try {
            if (! $accountId) {
                // If no account ID is provided, update the product directly
                return self::$client->products->update($productId, $payload);
            }

            return self::$client->products->update($productId, $payload, [
                'stripe_account' => $accountId,
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param  string  $sub_id  Subscription Id
     * @param  array  $payload  Update Payload
     * @return Throwable|Subscription
     */
    public static function getSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();

        $options = [];
        if ($connectedAccountId) {
            $options['stripe_account'] = $connectedAccountId;
        }

        try {
            return self::$client->subscriptions->retrieve($sub_id, [], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param  string  $sub_id  Subscription Id
     * @param  array  $payload  Update Payload
     * @return Throwable|Subscription
     */
    /**
     * Cancel a subscription at the end of the period (disable auto-renewal)
     *
     * @param  string  $sub_id  Subscription Id
     * @param  bool  $atPeriodEnd  Whether to cancel at the end of the current period
     * @param  string|null  $connectedAccountId
     * @return Subscription
     */
    public static function cancelSubscription($sub_id, $atPeriodEnd = false, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            if ($atPeriodEnd) {
                return self::$client->subscriptions->update($sub_id, [
                    'cancel_at_period_end' => true,
                ], $options);
            }

            return self::$client->subscriptions->cancel($sub_id, [], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Pause a subscription's billing (no new invoices) — used when a creator falls below
     * the min posting cadence. Reversible via resumeSubscription(). behavior 'void' means
     * invoices during the pause are voided rather than collected later.
     *
     * @param  string  $sub_id  Stripe subscription ID
     * @param  string|null  $connectedAccountId  Creator's connected account
     * @return Throwable|Subscription
     */
    public static function pauseSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = $connectedAccountId ? ['stripe_account' => $connectedAccountId] : [];

            return self::$client->subscriptions->update($sub_id, [
                'pause_collection' => ['behavior' => 'void'],
            ], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Resume a paused subscription's billing (creator met the posting cadence again).
     *
     * @param  string  $sub_id  Stripe subscription ID
     * @param  string|null  $connectedAccountId  Creator's connected account
     * @return Throwable|Subscription
     */
    public static function resumeSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = $connectedAccountId ? ['stripe_account' => $connectedAccountId] : [];

            return self::$client->subscriptions->update($sub_id, [
                'pause_collection' => '',
            ], $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    // public static function cancelSubscription($sub_id)
    // {
    //     self::setClient();
    //     try {
    //         $subscription = self::$client->subscriptions->retrieve($sub_id);
    //         if ($subscription->status !== 'canceled') {
    //             return self::$client->subscriptions->cancel($sub_id);
    //         }
    //         // return self::$client->subscriptions->cancel($sub_id, []);
    //     } catch (RateLimitException $e) {
    //         throw new Exception("Stripe RateLimit: " . $e->getMessage());
    //     } catch (InvalidRequestException $e) {
    //         throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
    //     } catch (ApiConnectionException $e) {
    //         throw new Exception("Stripe API Connection: " . $e->getMessage());
    //     } catch (ApiErrorException $e) {
    //         throw new Exception("Stripe API Error: " . $e->getMessage());
    //     }
    // }

    /**
     * Get account balance for a connected account
     *
     * @param  string  $connectedAccountId
     * @return Balance
     *
     * @throws Exception
     */
    public static function getAccountBalance($connectedAccountId)
    {
        self::setClient();

        try {
            return self::$client->balance->retrieve([], ['stripe_account' => $connectedAccountId]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function ensureManualPayoutSchedule(string $connectedAccountId, string $currency = 'GBP'): bool
    {
        $client = self::getClientForCurrency($currency);

        try {
            $account = $client->accounts->retrieve($connectedAccountId, []);
            $interval = $account->settings->payouts->schedule->interval ?? null;

            if ($interval === 'manual') {
                return false;
            }

            $client->accounts->update($connectedAccountId, [
                'settings' => [
                    'payouts' => [
                        'schedule' => [
                            'interval' => 'manual',
                        ],
                    ],
                ],
            ]);

            return true;
        } catch (Exception $e) {
            Log::error('Failed to ensure manual payout schedule: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Create a payout to a connected account's bank account
     *
     * @param  array  $payload  Payout payload. Pass an 'idempotency_key' to guard against
     *                          duplicate payouts on network retries / re-runs — it is pulled
     *                          out of the payload and sent as a Stripe request option.
     * @param  string  $connectedAccountId
     * @return Payout
     *
     * @throws Exception
     */
    public static function createPayout(array $payload, $connectedAccountId)
    {
        $currency = $payload['currency'] ?? 'GBP';
        $client = self::getClientForCurrency($currency);

        // Pull idempotency_key out of the payload — it is a request option, not a param.
        $idempotencyKey = $payload['idempotency_key'] ?? null;
        unset($payload['idempotency_key']);

        $options = ['stripe_account' => $connectedAccountId];
        if ($idempotencyKey) {
            $options['idempotency_key'] = (string) $idempotencyKey;
        }

        try {
            return $client->payouts->create($payload, $options);
        } catch (Exception $e) {
            Log::error('Stripe Payout Error: '.$e->getMessage());
            throw new Exception('Stripe Payout Error: '.$e->getMessage());
        }
    }

    /**
     * Get transfer details
     *
     * @param  string  $transferId
     * @return Transfer
     *
     * @throws Exception
     */
    public static function getTransfer($transferId)
    {
        self::setClient();

        try {
            return self::$client->transfers->retrieve($transferId);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Transfer funds to a connected account
     *
     * @deprecated Use transferToConnectedAccountMinor() instead. This major-unit
     *             variant has no idempotency key and no metadata support, so a retry
     *             can double-pay. Currently unused; kept only to avoid breaking any
     *             dynamic references.
     *
     * @param  string  $destinationAccountId
     * @param  int|float  $amount  Amount in major units (e.g. 10.00)
     * @param  string  $currency
     * @return Transfer
     *
     * @throws Exception
     */
    public static function transferToConnectedAccount($destinationAccountId, $amount, $currency = 'usd')
    {
        self::setClient();

        try {
            // Convert to minor units (cents/pence)
            $isZeroDecimal = Helpers::isZeroDecimalCurrency($currency);
            $amountMinor = $isZeroDecimal ? (int) $amount : (int) ($amount * 100);

            return self::$client->transfers->create([
                'amount' => $amountMinor,
                'currency' => strtolower($currency),
                'destination' => $destinationAccountId,
                'description' => 'Reserve Release Payout',
            ]);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function transferToConnectedAccountMinor(string $destinationAccountId, int $amountMinor, string $currency = 'usd', array $metadata = [], ?string $description = null, ?string $idempotencyKey = null)
    {
        $client = self::getClientForCurrency($currency);

        try {
            $payload = [
                'amount' => (int) $amountMinor,
                'currency' => strtolower($currency),
                'destination' => $destinationAccountId,
            ];
            if (! empty($description)) {
                $payload['description'] = $description;
            }
            if (! empty($metadata)) {
                $payload['metadata'] = $metadata;
            }

            $options = [];
            if ($idempotencyKey) {
                $options['idempotency_key'] = $idempotencyKey;
            }

            return $client->transfers->create($payload, $options);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function updateTransferMinor(string $transferId, string $currency = 'usd', array $metadata = [], ?string $description = null)
    {
        $client = self::getClientForCurrency($currency);

        try {
            $payload = [];
            if (! empty($description)) {
                $payload['description'] = $description;
            }
            if (! empty($metadata)) {
                $payload['metadata'] = $metadata;
            }
            if (empty($payload)) {
                return $client->transfers->retrieve($transferId);
            }

            return $client->transfers->update($transferId, $payload);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    public static function updatePayoutMetadata(string $payoutId, string $connectedAccountId, string $currency = 'usd', array $metadata = [])
    {
        $client = self::getClientForCurrency($currency);

        try {
            if (empty($metadata)) {
                return $client->payouts->retrieve($payoutId, [], ['stripe_account' => $connectedAccountId]);
            }

            return $client->payouts->update($payoutId, ['metadata' => $metadata], ['stripe_account' => $connectedAccountId]);
        } catch (Exception $e) {
            Log::error('Stripe Payout Update Error: '.$e->getMessage());
            throw new Exception('Stripe Payout Update Error: '.$e->getMessage());
        }
    }

    /**
     * List transfers for an account
     *
     * @return Collection
     *
     * @throws Exception
     */
    public static function listTransfers(array $params = [])
    {
        self::setClient();

        try {
            return self::$client->transfers->all($params);
        } catch (RateLimitException $e) {
            throw new Exception('Stripe RateLimit: '.$e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception('Stripe InvalidRequest: '.$e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception('Stripe API Connection: '.$e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception('Stripe API Error: '.$e->getMessage());
        }
    }

    /**
     * Delete Product
     */
    public static function deleteProductAndPrices(string $productId, string $connectedAccountId)
    {
        $client = new StripeClient(env('STRIPE_SECRET_KEY'));

        try {
            // 1. Fetch all prices for the product
            $prices = $client->prices->all(
                ['product' => $productId, 'limit' => 100],
                ['stripe_account' => $connectedAccountId]
            );

            foreach ($prices->data as $price) {
                // 2. Cancel all subscriptions using this price
                $cancelSubscription = self::cancelSubscriptionsByPrices($client, $price->id);
                Log::info('Cancelled subscriptions for price: ');
                Log::info(json_encode($cancelSubscription));
                // 3. Deactivate the price if active
                if ($price->active) {
                    try {
                        $updated = $client->prices->update(
                            $price->id,
                            ['active' => false],
                            ['stripe_account' => $connectedAccountId]
                        );

                        Log::info($updated->active
                            ? "Price still active after update: {$price->id}"
                            : "Deactivated price: {$price->id}");
                    } catch (Exception $e) {
                        Log::error("Failed to deactivate price {$price->id}: ".$e->getMessage());
                    }
                }
            }

            // 4. Optionally delete the product
            try {
                $updated = $client->products->update(
                    $productId,
                    ['active' => false],
                    ['stripe_account' => $connectedAccountId]
                );

                return $updated->active === false;
            } catch (Exception $e) {
                Log::error('Failed to archive product: '.$e->getMessage());

                return false;
            }

            return true;
        } catch (Exception $e) {
            Log::error('Stripe Error in deleteProductAndPrices: '.$e->getMessage());

            return false;
        }
    }

    public static function deleteProductAndPricesOfCreator(string $productId, ?string $connectedAccountId = null)
    {
        $client = new StripeClient(env('STRIPE_SECRET_KEY'));

        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            // 1. Fetch all prices for the product
            $prices = $client->prices->all(
                ['product' => $productId, 'limit' => 100],
                $options
            );

            foreach ($prices->data as $price) {
                // 2. Cancel all subscriptions using this price
                $cancelSubscription = self::cancelSubscriptionsByPrices($client, $price->id);
                Log::info('Cancelled subscriptions for price: ');
                Log::info(json_encode($cancelSubscription));

                // 3. Deactivate the price if active
                if ($price->active) {
                    try {
                        $updated = $client->prices->update(
                            $price->id,
                            ['active' => false],
                            $options
                        );

                        Log::info($updated->active
                            ? "Price still active after update: {$price->id}"
                            : "Deactivated price: {$price->id}");
                    } catch (Exception $e) {
                        Log::error("Failed to deactivate price {$price->id}: ".$e->getMessage());
                    }
                }
            }

            // 4. Archive the product
            try {
                $updated = $client->products->update(
                    $productId,
                    ['active' => false],
                    $options
                );

                return $updated->active === false;
            } catch (Exception $e) {
                Log::error('Failed to archive product: '.$e->getMessage());

                return false;
            }
        } catch (Exception $e) {
            Log::error('Stripe Error in deleteProductAndPrices: '.$e->getMessage());

            return false;
        }
    }

    private static function cancelSubscriptionsByPrice(StripeClient $client, string $priceId, $connectedAccountId = null)
    {
        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            $startingAfter = null;

            do {
                $params = ['limit' => 100, 'status' => 'active'];
                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $subscriptions = $client->subscriptions->all($params, $options);

                foreach ($subscriptions->data as $subscription) {
                    $startingAfter = $subscription->id;

                    foreach ($subscription->items->data as $item) {
                        if ($item->price->id === $priceId) {
                            try {
                                $client->subscriptions->cancel(
                                    $subscription->id,
                                    [],
                                    $options
                                );
                                Log::info("Cancelled subscription: {$subscription->id}");
                                break;
                            } catch (Exception $e) {
                                Log::error("Failed to cancel subscription {$subscription->id}: ".$e->getMessage());
                            }
                        }
                    }
                }
            } while ($subscriptions->has_more);
        } catch (Exception $e) {
            Log::error('Failed to retrieve subscriptions: '.$e->getMessage());
        }
    }

    private static function cancelSubscriptionsByPrices(StripeClient $client, string $priceId)
    {
        try {
            $options = [];

            $startingAfter = null;

            do {
                $params = ['limit' => 100, 'status' => 'active'];
                if ($startingAfter) {
                    $params['starting_after'] = $startingAfter;
                }

                $subscriptions = $client->subscriptions->all($params, $options);

                foreach ($subscriptions->data as $subscription) {
                    $startingAfter = $subscription->id;

                    foreach ($subscription->items->data as $item) {
                        if ($item->price->id === $priceId) {
                            try {
                                $client->subscriptions->cancel(
                                    $subscription->id,
                                    [],
                                    $options
                                );
                                Log::info("Cancelled subscription: {$subscription->id}");
                                break;
                            } catch (Exception $e) {
                                Log::error("Failed to cancel subscription {$subscription->id}: ".$e->getMessage());
                            }
                        }
                    }
                }
            } while ($subscriptions->has_more);
        } catch (Exception $e) {
            Log::error('Failed to retrieve subscriptions: '.$e->getMessage());
        }
    }
}
