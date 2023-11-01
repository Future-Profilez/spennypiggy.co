<?php

namespace App;

use Exception;
use Stripe\Exception\ApiConnectionException;
use Stripe\Exception\ApiErrorException;
use Stripe\Exception\OAuth\InvalidRequestException;
use Stripe\Exception\RateLimitException;
use Stripe\StripeClient;

class StripeControl {

    /**
     * Stripe Client
     * @var \Stripe\StripeClient
     */
    private static $client;

    /**
     * Check and set as well as return the client
     * @return void
     */
    public static function setClient(){
        try {
            if(empty(self::$client)){
                self::$client = new StripeClient(env("STRIPE_SECRET_KEY"));
            }
        } catch (RateLimitException $e){
            throw new Exception("Stripe RateLimit: ". $e->getMessage());
        } catch (InvalidRequestException $e){
            throw new Exception("Stripe InvalidRequest: ". $e->getMessage());
        } catch (ApiConnectionException $e){
            throw new Exception("Stripe API Connection: ". $e->getMessage());
        } catch(ApiErrorException $e){
            throw new Exception("Stripe API Error: ". $e->getMessage());
        }
    }


    /**
     * Create a Customer
     *
     * @param array $payload User Payload
     * @return throwable||\Stripe\Customer
     */
    public static function createCustomer($payload){
        self::setClient();
        try {
            return self::$client->customers->create($payload);
        } catch (RateLimitException $e){
            throw new Exception("Stripe RateLimit: ". $e->getMessage());
        } catch (InvalidRequestException $e){
            throw new Exception("Stripe InvalidRequest: ". $e->getMessage());
        } catch (ApiConnectionException $e){
            throw new Exception("Stripe API Connection: ". $e->getMessage());
        } catch(ApiErrorException $e){
            throw new Exception("Stripe API Error: ". $e->getMessage());
        }
    }
}
