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
 * The default answer to all of them — the page is paused, come back — lives in
 * `App\Support\RiskMessages` (state 12 of the 9 Aug messaging brief) alongside
 * every other customer-facing string.
 *
 * ⚠️ ONE exception, added 14 Aug 2026 on client direction after an Intercom
 * ticket: when the creator is paused for being BEHIND ON POSTING, the supporter
 * is told so (`CREATOR_CONTENT_PAUSED`). That reason discloses nothing private —
 * the creator's feed is public — and it is the only one a supporter can act on,
 * because a nudge is what ends it. A lapsed subscription or a Stripe account
 * problem is still the creator's billing position and still resolves to the
 * generic message.
 *
 * ⚠️ The creator gets the SPECIFIC reason, on their own dashboard, through
 * `RiskMessages::CREATOR_ACCOUNT_ISSUE` / `CREATOR_SUBSCRIPTION_INACTIVE` /
 * `CREATOR_POSTING_PAUSED`, including the count and the window. The supporter
 * never sees a number — rule 1.
 */
class CreatorAvailabilityMessageService
{
    /**
     * `CreatorActivityService::validateCreatorActivity()` statuses that mean
     * "this creator has not published enough recently".
     *
     * ⚠️ An allow-list, not `! $activityCheck['eligible']`. Every other failing
     * state that service can grow would then silently start telling supporters
     * the creator owes posts — which for, say, an unverified account is simply
     * untrue. An unrecognised status falls back to the generic message.
     */
    protected const CONTENT_GATE_STATUSES = ['insufficient_content'];

    /**
     * One-line copy for the older checkouts, which render a bare `msg` string.
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
            $this->stateFor($activityCheck),
            RiskMessages::audienceFor()
        );
    }

    /**
     * Which message this refusal gets.
     *
     * Every call site already says which check failed by which argument it
     * passes — `supporterMessage(null, $activityCheck)` is the posting gate —
     * so no checkout had to change to get the specific copy.
     */
    protected function stateFor(?array $activityCheck): string
    {
        $status = $activityCheck['status'] ?? null;

        return in_array($status, self::CONTENT_GATE_STATUSES, true)
            ? 'CREATOR_CONTENT_PAUSED'
            : 'CREATOR_SUBSCRIPTION_INACTIVE';
    }
}
