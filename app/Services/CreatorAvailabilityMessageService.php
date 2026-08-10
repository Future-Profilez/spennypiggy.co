<?php

namespace App\Services;

use App\Support\RiskMessages;

/**
 * What a SUPPORTER is told when a creator cannot currently be paid.
 *
 * Every branch used to have its own sentence, and three of them explained the
 * creator's internal state to a stranger: "due to an account status issue",
 * "this creator's Wishlist plan is not active". A supporter can do nothing with
 * any of that, and it discloses the creator's billing situation to whoever
 * happens to open their page.
 *
 * There is one honest answer to all of them — the page is paused, come back —
 * and it lives in `App\Support\RiskMessages` (state 12 of the 9 Aug messaging
 * brief) alongside every other customer-facing string.
 *
 * ⚠️ The creator gets the SPECIFIC reason, on their own dashboard, through
 * `RiskMessages::CREATOR_ACCOUNT_ISSUE` / `CREATOR_SUBSCRIPTION_INACTIVE`. The
 * split is deliberate: specificity is what the creator needs to fix it, and
 * exactly what the supporter must not be given.
 */
class CreatorAvailabilityMessageService
{
    /**
     * One-line copy for the older checkouts, which render a bare `msg` string.
     *
     * The parameters are kept even though every branch now resolves to the same
     * message: seven checkouts pass them, and they are what a future
     * per-reason variant would branch on.
     */
    public function supporterMessage(?array $subscriptionCheck = null, ?array $activityCheck = null, ?array $stripeCheck = null): string
    {
        return $this->supporterUi($subscriptionCheck, $activityCheck, $stripeCheck)['body'];
    }

    /**
     * The full message object, for surfaces rendering <RiskMessage />.
     */
    public function supporterUi(?array $subscriptionCheck = null, ?array $activityCheck = null, ?array $stripeCheck = null): array
    {
        return RiskMessages::get(
            'CREATOR_SUBSCRIPTION_INACTIVE',
            RiskMessages::audienceFor()
        );
    }
}
