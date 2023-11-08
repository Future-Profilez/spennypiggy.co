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
}
