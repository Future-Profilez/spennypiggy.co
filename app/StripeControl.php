<?php

namespace App;

use Exception;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\OAuth\InvalidRequestException;
use Stripe\Exception\RateLimitException;
use Stripe\StripeClient;

class StripeControl
{
    /**
     * Subscription Periods
     * @var array
     */
    public static $periods = [
        "daily"     =>  'day',
        'weekly'    =>  'week',
        'monthly'   =>  'month',
        'yearly'    =>  'year'
    ];

    /**
     * Stripe Client
     * @var \Stripe\StripeClient
     */
    private static $client;

    /**
     * Check and set as well as return the client
     * @return void
     */
    public static function setClient()
    {
        try {
            if (empty(self::$client)) {
                $apiKey = env("STRIPE_SECRET_KEY");
                
                // If env() returns null, try to get from config
                if (is_null($apiKey)) {
                    $apiKey = config('services.stripe.secret', env("STRIPE_SECRET_KEY"));
                }
                
                // If still null or not a string, log debug info and throw exception
                if (empty($apiKey) || !is_string($apiKey)) {
                    Log::error("Stripe API key configuration issue", [
                        'env_value' => var_export(env("STRIPE_SECRET_KEY"), true),
                        'config_value' => var_export(config('services.stripe.secret'), true),
                        'final_key_type' => gettype($apiKey),
                        'final_key_empty' => empty($apiKey)
                    ]);
                    throw new Exception("Stripe API key is not properly configured. Please check STRIPE_SECRET_KEY environment variable. Debug info logged.");
                }
                
                self::$client = new StripeClient($apiKey);
            }
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }


    /**
     * Create a Customer
     *
     * @param array $payload User Payload
     * @return throwable||\Stripe\Customer
     */
    public static function createCustomer(array $payload, string $connectedAccountId)
    {
        self::setClient();
        try {
            if (!$connectedAccountId) {
                // If no connected account ID is provided, create the customer directly
                return self::$client->customers->create($payload);
            }
            return self::$client->customers->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }
    // {
    //     self::setClient();
    //     try {
    //         return self::$client->customers->create($payload);
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


        public static function getClient()
        {
            self::setClient();
            return self::$client;
        }

    // ✅   Add a check in your class to validate capabilities
    public static function isAccountReadyForCheckout(string $accountId): bool
        {
            self::setClient();
            try {
                $account = self::$client->accounts->retrieve($accountId);
                return isset($account->capabilities->card_payments) &&
                    $account->capabilities->card_payments === 'active' &&
                    $account->capabilities->transfers === 'active';
            } catch (\Exception $e) {
                Log::error("Failed to verify account capabilities: " . $e->getMessage());
                return false;
            }
        }

    /**
     * Get comprehensive Stripe account requirements and action items
     * 
     * @param string $accountId Stripe Account ID
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
            if (!$account->charges_enabled) {
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
                                'action_url' => '/stripe/enable_card_payments'
                            ];
                            break;
                            
                        case 'requirements.pending_verification':
                            $requirements[] = [
                                'type' => 'pending_verification',
                                'severity' => 'warning', 
                                'title' => 'Verification Pending',
                                'message' => 'Your account information is being verified. This process typically takes 1-3 business days.',
                                'action' => 'Please wait for verification to complete.',
                                'action_url' => null
                            ];
                            break;
                            
                        case 'rejected.fraud':
                            $requirements[] = [
                                'type' => 'rejected_fraud',
                                'severity' => 'critical',
                                'title' => 'Account Rejected - Fraud',
                                'message' => 'Your account was rejected due to fraud concerns. Please contact support.',
                                'action' => 'Contact Stripe support for account review.',
                                'action_url' => null
                            ];
                            break;
                            
                        case 'rejected.listed':
                            $requirements[] = [
                                'type' => 'rejected_listed',
                                'severity' => 'critical',
                                'title' => 'Account Rejected - Listed',
                                'message' => 'Your account was rejected due to being on a restricted list.',
                                'action' => 'Contact Stripe support for clarification.',
                                'action_url' => null
                            ];
                            break;
                            
                        case 'rejected.other':
                            $requirements[] = [
                                'type' => 'rejected_other',
                                'severity' => 'critical',
                                'title' => 'Account Rejected',
                                'message' => 'Your account was rejected. Please contact support for more information.',
                                'action' => 'Contact Stripe support for account review.',
                                'action_url' => null
                            ];
                            break;
                    }
                }
                
                // Check currently due requirements
                if (!empty($account->requirements->currently_due)) {
                    $requirements[] = [
                        'type' => 'currently_due',
                        'severity' => 'high',
                        'title' => 'Information Required',
                        'message' => 'Additional information is required to activate your account.',
                        'action' => 'Complete your account setup with the missing information.',
                        'action_url' => '/stripe/enable_card_payments',
                        'fields_needed' => $account->requirements->currently_due
                    ];
                }
                
                // Check eventually due requirements  
                if (!empty($account->requirements->eventually_due)) {
                    $requirements[] = [
                        'type' => 'eventually_due',
                        'severity' => 'medium',
                        'title' => 'Action Needed Soon',
                        'message' => 'Additional information will be required in the future to maintain your account.',
                        'action' => 'Complete account information at your convenience.',
                        'action_url' => '/stripe/enable_card_payments',
                        'fields_needed' => $account->requirements->eventually_due
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
                        'action_url' => '/stripe/enable_card_payments'
                    ];
                } elseif ($account->capabilities->card_payments === 'pending') {
                    $hasRequirements = true;
                    $requirements[] = [
                        'type' => 'card_payments_pending',
                        'severity' => 'medium',
                        'title' => 'Card Payments Pending',
                        'message' => 'Card payment capability is being reviewed.',
                        'action' => 'Please wait for the review to complete.',
                        'action_url' => null
                    ];
                }
            }
            
            // Check for legacy account upgrade needs
            $isLegacy = ($account->tos_acceptance->service_agreement ?? '') === 'recipient';
            if ($isLegacy) {
                $hasRequirements = true;
                $requirements[] = [
                    'type' => 'legacy_upgrade',
                    'severity' => 'high',
                    'title' => 'Account Upgrade Required',
                    'message' => 'Your Stripe account needs to be upgraded to the latest version to receive card payments.',
                    'action' => 'Upgrade your Stripe account now.',
                    'action_url' => '/stripe/upgrade-express-account'
                ];
            }
            
            // Check payout capability
            if (isset($account->capabilities->transfers) && $account->capabilities->transfers !== 'active') {
                $hasRequirements = true;
                $requirements[] = [
                    'type' => 'transfers_disabled',
                    'severity' => 'high',
                    'title' => 'Payouts Disabled',
                    'message' => 'Your account cannot receive payouts. This may be due to missing bank account information.',
                    'action' => 'Complete your payout information.',
                    'action_url' => '/stripe/enable_card_payments'
                ];
            }
            
            return [
                'has_requirements' => $hasRequirements,
                'requirements' => $requirements,
                'account_status' => [
                    'charges_enabled' => $account->charges_enabled,
                    'details_submitted' => $account->details_submitted,
                    'payouts_enabled' => $account->payouts_enabled ?? false,
                    'disabled_reason' => $account->requirements->disabled_reason ?? null
                ]
            ];
            
        } catch (\Exception $e) {
            Log::error("Failed to get account requirements: " . $e->getMessage());
            return [
                'has_requirements' => true,
                'requirements' => [[
                    'type' => 'connection_error',
                    'severity' => 'critical',
                    'title' => 'Account Connection Issue',
                    'message' => 'Unable to check your Stripe account status. Please try again or contact support.',
                    'action' => 'Refresh the page or contact support.',
                    'action_url' => null
                ]],
                'account_status' => []
            ];
        }
    }


    /**
     * Search Customer
     *
     * @param string $query Query like name, email
     * @return \Stripe\SearchResult
     */
    public static function searchCustomer($query)
    {
        self::setClient();
        try {
            return self::$client->customers->search([
                'query' => $query
            ]);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Create Account
     *
     * @param array $payload Account Payload
     * @return \Stripe\Account|Throwable
     */
    public static function createAccount($payload)
    {
        self::setClient();
        try {
            return self::$client->accounts->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Retrive an Account
     *
     * @param string $account_id Stripe Account Id
     * @return Throwable|\Stripe\Account
     */
    public static function getAccount($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->retrieve($account_id, []);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Create Account Link
     *
     * @param array $payload Account Link Payload
     * @return Throwable|\Stripe\AccountLink
     */
    public static function createAccountLink($payload)
    {
        self::setClient();
        try {
            return self::$client->accountLinks->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Create Express Account Link
     *
     * @param string $account_id Stripe Express Account Id
     * @return Throwable|\Stripe\Account\LoginLink
     */
    public static function getLoginLink($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->createLoginLink($account_id);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Create Payment Session
     *
     * @param array $payload Payment Payload
     * @return Throwable|\Stripe\Checkout\Session
     */
    public static function createCheckoutSession(array $payload, $connectedAccountId = null)
    {
        self::setClient();
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
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Get A CheckOut Session
     *
     * @param string $sessionId Stripe Session Checkout Id
     * @return Throwable|\Stripe\Checkout\Session
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
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Get Active subscription of customer
     *
     */
    public static function getActiveSubscriptionByCustomer($customerId, $connectedAccountId)
    {
        self::setClient();

        try {
            $subscriptions = self::$client->subscriptions->all(
                [
                    'customer' => $customerId,
                    'status' => 'active',
                    'limit' => 1,
                ],
                ['stripe_account' => $connectedAccountId]
            );

            return $subscriptions->data[0] ?? null;
        } catch (\Exception $e) {
            Log::error("Stripe fetch subscription error: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Create a Stripe Product
     *
     * @param array $payload Product Payload
     * @return Throwable|\Stripe\Product
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
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            Log::info("Stripe API Error: " . $e->getMessage());
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Create a Stripe Price
     *
     * @param array $payload Price Payload
     * @return Throwable|\Stripe\Price
     */
    public static function createPrice(array $priceData, mixed $connectedAccountId = null)
    {
        self::setClient();

        if (!$connectedAccountId) {
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
     * @param array $payload Price Payload
     * @return Throwable|\Stripe\Price
     */
    public static function getProduct(string $productId, string $connectedAccountId = null)
    {
        // $stripe = new StripeClient(env("STRIPE_SECRET_KEY"));
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
     * @param array $payload Price Payload
     * @return Throwable|\Stripe\Price
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
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            Log::info("Stripe API Error: " . $e->getMessage());
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Update A Subscriptions
     *
     * @param string $sub_id Subscription Id
     * @param array $payload Update Payload
     * @return Throwable|\Stripe\Subscription
     */
    public static function updateSubscription($productId, $payload, $accountId = null)
    {
        self::setClient();

        try {
            if (!$accountId) {
                // If no account ID is provided, update the product directly
                return self::$client->products->update($productId, $payload);
            }
            return self::$client->products->update($productId, $payload, [
                'stripe_account' => $accountId,
            ]);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }


    /**
     * Update A Subscriptions
     *
     * @param string $sub_id Subscription Id
     * @param array $payload Update Payload
     * @return Throwable|\Stripe\Subscription
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
        } catch (\Stripe\Exception\RateLimitException $e) {
            throw new \Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (\Stripe\Exception\InvalidRequestException $e) {
            throw new \Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (\Stripe\Exception\ApiConnectionException $e) {
            throw new \Exception("Stripe API Connection: " . $e->getMessage());
        } catch (\Stripe\Exception\ApiErrorException $e) {
            throw new \Exception("Stripe API Error: " . $e->getMessage());
        }
    }



    /**
     * Update A Subscriptions
     *
     * @param string $sub_id Subscription Id
     * @param array $payload Update Payload
     * @return Throwable|\Stripe\Subscription
     */
    public static function cancelSubscription($sub_id, $connectedAccountId = null)
    {
        self::setClient();
        try {
            $options = [];
            if ($connectedAccountId) {
                $options['stripe_account'] = $connectedAccountId;
            }

            return self::$client->subscriptions->cancel($sub_id, [], $options);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
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
     * Create a transfer to a connected account
     *
     * @param array $payload Transfer payload
     * @return \Stripe\Transfer
     * @throws Exception
     */
    public static function createTransfer(array $payload)
    {
        self::setClient();
        
        try {
            return self::$client->transfers->create($payload);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Get account balance for a connected account
     *
     * @param string $connectedAccountId
     * @return \Stripe\Balance
     * @throws Exception
     */
    public static function getAccountBalance($connectedAccountId)
    {
        self::setClient();
        
        try {
            return self::$client->balance->retrieve([], ['stripe_account' => $connectedAccountId]);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Create a payout to a connected account's bank account
     *
     * @param array $payload Payout payload
     * @param string $connectedAccountId
     * @return \Stripe\Payout
     * @throws Exception
     */
    public static function createPayout(array $payload, $connectedAccountId)
    {
        self::setClient();
        
        try {
            return self::$client->payouts->create(
                $payload,
                ['stripe_account' => $connectedAccountId]
            );
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * Get transfer details
     *
     * @param string $transferId
     * @return \Stripe\Transfer
     * @throws Exception
     */
    public static function getTransfer($transferId)
    {
        self::setClient();
        
        try {
            return self::$client->transfers->retrieve($transferId);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     * List transfers for an account
     *
     * @param array $params
     * @return \Stripe\Collection
     * @throws Exception
     */
    public static function listTransfers(array $params = [])
    {
        self::setClient();
        
        try {
            return self::$client->transfers->all($params);
        } catch (RateLimitException $e) {
            throw new Exception("Stripe RateLimit: " . $e->getMessage());
        } catch (InvalidRequestException $e) {
            throw new Exception("Stripe InvalidRequest: " . $e->getMessage());
        } catch (ApiConnectionException $e) {
            throw new Exception("Stripe API Connection: " . $e->getMessage());
        } catch (ApiErrorException $e) {
            throw new Exception("Stripe API Error: " . $e->getMessage());
        }
    }

    /**
     *
     * Delete Product
     *
     */
    public static function deleteProductAndPrices(string $productId, string $connectedAccountId)
    {
        $client = new StripeClient(env("STRIPE_SECRET_KEY"));

        try {
            // 1. Fetch all prices for the product
            $prices = $client->prices->all(
                ['product' => $productId, 'limit' => 100],
                ['stripe_account' => $connectedAccountId]
            );

            foreach ($prices->data as $price) {
                // 2. Cancel all subscriptions using this price
                $cancelSubscription = self::cancelSubscriptionsByPrices($client, $price->id);
                Log::info("Cancelled subscriptions for price: ");
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
                    } catch (\Exception $e) {
                        Log::error("Failed to deactivate price {$price->id}: " . $e->getMessage());
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
            } catch (\Exception $e) {
                Log::error("Failed to archive product: " . $e->getMessage());
                return false;
            }

            return true;
        } catch (\Exception $e) {
            Log::error("Stripe Error in deleteProductAndPrices: " . $e->getMessage());
            return false;
        }
    }

    public static function deleteProductAndPricesOfCreator(string $productId, string $connectedAccountId = null)
    {
        $client = new StripeClient(env("STRIPE_SECRET_KEY"));

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
                Log::info("Cancelled subscriptions for price: ");
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
                    } catch (\Exception $e) {
                        Log::error("Failed to deactivate price {$price->id}: " . $e->getMessage());
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
            } catch (\Exception $e) {
                Log::error("Failed to archive product: " . $e->getMessage());
                return false;
            }
        } catch (\Exception $e) {
            Log::error("Stripe Error in deleteProductAndPrices: " . $e->getMessage());
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
                            } catch (\Exception $e) {
                                Log::error("Failed to cancel subscription {$subscription->id}: " . $e->getMessage());
                            }
                        }
                    }
                }
            } while ($subscriptions->has_more);
        } catch (\Exception $e) {
            Log::error("Failed to retrieve subscriptions: " . $e->getMessage());
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
                            } catch (\Exception $e) {
                                Log::error("Failed to cancel subscription {$subscription->id}: " . $e->getMessage());
                            }
                        }
                    }
                }
            } while ($subscriptions->has_more);
        } catch (\Exception $e) {
            Log::error("Failed to retrieve subscriptions: " . $e->getMessage());
        }
    }
}
