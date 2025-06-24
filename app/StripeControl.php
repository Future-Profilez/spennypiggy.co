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
                self::$client = new StripeClient(env("STRIPE_SECRET_KEY"));
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
    public static function getProduct(string $productId, string $connectedAccountId)
    {
        self::setClient();

        return self::$client->products->retrieve(
            $productId,
            [],
            ['stripe_account' => $connectedAccountId]
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
    public static function cancelSubscription($sub_id)
    {
        self::setClient();
        try {

            return self::$client->subscriptions->cancel($sub_id, []);
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
     * Deleting and account
     *
     * @param string $account_id account Id
     * @return Throwable|\Stripe\Subscription
     */
    public static function deleteAccount($account_id)
    {
        self::setClient();
        try {
            return self::$client->accounts->delete($account_id, []);
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
        self::setClient();

        try {
            // First, list all prices attached to the product
            // Step 1: Fetch all prices of the product
            $prices = self::$client->prices->all(
                ['product' => $productId, 'limit' => 100],
                // [], // no extra params
                ['stripe_account' => $connectedAccountId]
            );
            Log::info('prices');
            Log::info(json_encode($prices));

            if (empty($prices->data)) {
                Log::info("No prices found for product {$productId}.");
                return false; // No prices to delete
            }

            // Step 2: Deactivate each price
            foreach ($prices->data as $price) {
                try {
                    self::$client->prices->update(
                        $price->id,
                        ['active' => false],
                        ['stripe_account' => $connectedAccountId]
                    );
                } catch (\Exception $e) {
                    Log::warning("Failed to deactivate price {$price->id}: " . $e->getMessage());
                }
            }

            // Step 3: Now delete the product
            $deleted = self::$client->products->delete(
                $productId,
                [],
                ['stripe_account' => $connectedAccountId]
            );

            return $deleted->deleted ?? false;
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
}
