<?php

namespace App;

use Exception;
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
    public static function createCustomer($payload)
    {
        self::setClient();
        try {
            return self::$client->customers->create($payload);
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
    public static function createCheckoutSession($payload)
    {
        self::setClient();
        try {
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
    public static function getCheckoutSession($sessionId)
    {
        self::setClient();
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
     * Create a Stripe Product
     *
     * @param array $payload Product Payload
     * @return Throwable|\Stripe\Product
     */
    public static function createProduct($payload)
    {
        self::setClient();
        try {
            return self::$client->products->create($payload);
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
    public static function updateSubscription($sub_id, $payload)
    {
        self::setClient();
        try {
            return self::$client->subscriptions->update($sub_id, $payload);
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
    public static function getSubscription($sub_id)
    {
        self::setClient();
        try {
            return self::$client->subscriptions->retrieve($sub_id, []);
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
}
