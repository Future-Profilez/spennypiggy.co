<?php

namespace App\Services;

class CreatorAvailabilityMessageService
{
    public function supporterMessage(?array $subscriptionCheck = null, ?array $activityCheck = null): string
    {
        if (is_array($subscriptionCheck) && ($subscriptionCheck['eligible'] ?? true) === false) {
            $status = $subscriptionCheck['status'] ?? null;
            if ($status === 'no_subscription') {
                return "This creator’s Wishlist plan is not active right now. Please try again later.";
            }
            if ($status === 'unknown_subscription_status') {
                return "This creator can’t receive payments right now due to an account status issue. Please try again later.";
            }
            return "This creator can’t receive payments right now. Please try again later.";
        }

        if (is_array($activityCheck) && ($activityCheck['eligible'] ?? true) === false) {
            $status = $activityCheck['status'] ?? null;
            if ($status === 'insufficient_content') {
                return "This creator is temporarily unavailable while they update their page. Please try again later.";
            }
            return "This creator is temporarily unavailable. Please try again later.";
        }

        return "This creator is temporarily unavailable. Please try again later.";
    }
}

