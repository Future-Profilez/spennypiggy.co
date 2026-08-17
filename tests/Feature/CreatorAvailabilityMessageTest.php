<?php

namespace Tests\Feature;

use App\Services\CreatorAvailabilityMessageService;
use App\Support\RiskMessages;
use Tests\TestCase;

/**
 * What a SUPPORTER is told when a creator cannot currently be paid.
 *
 * Every branch used to resolve to one sentence — "they'll be back shortly" —
 * which a supporter could do nothing with. From 14 Aug 2026 the posting-gate
 * branch says what is actually needed, because a nudge from the person trying
 * to buy is what ends that pause. The other branches still must not.
 */
class CreatorAvailabilityMessageTest extends TestCase
{
    private function service(): CreatorAvailabilityMessageService
    {
        return app(CreatorAvailabilityMessageService::class);
    }

    public function test_the_posting_gate_tells_the_supporter_the_creator_owes_posts(): void
    {
        $body = $this->service()->supporterMessage(null, [
            'eligible' => false,
            'status' => 'insufficient_content',
        ]);

        $this->assertStringContainsString('posts', mb_strtolower($body));
    }

    /**
     * 🚨 A lapsed platform subscription is the creator's billing position and
     * stays behind the generic message. Telling a stranger that a creator has
     * not paid their bill is the disclosure this service was written to stop.
     */
    public function test_a_lapsed_subscription_still_says_nothing_specific(): void
    {
        $body = $this->service()->supporterMessage(['eligible' => false, 'status' => 'inactive'], null);

        $this->assertStringNotContainsString('posts', mb_strtolower($body));
        $this->assertStringNotContainsString('subscription', mb_strtolower($body));
        $this->assertSame(
            RiskMessages::get('CREATOR_SUBSCRIPTION_INACTIVE', RiskMessages::AUDIENCE_GUEST)['body'],
            $body
        );
    }

    public function test_a_stripe_problem_still_says_nothing_specific(): void
    {
        $body = $this->service()->supporterMessage(null, null, [
            'eligible' => false,
            'status' => 'stripe_disabled',
        ]);

        $this->assertStringNotContainsString('posts', mb_strtolower($body));
        $this->assertStringNotContainsString('stripe', mb_strtolower($body));
    }

    /**
     * The status list is an allow-list. A future failing state from
     * CreatorActivityService must not start telling supporters the creator owes
     * posts when it means something else entirely.
     */
    public function test_an_unrecognised_activity_status_falls_back_to_the_generic_message(): void
    {
        $body = $this->service()->supporterMessage(null, [
            'eligible' => false,
            'status' => 'some_future_state',
        ]);

        $this->assertStringNotContainsString('posts', mb_strtolower($body));
    }

    /**
     * 🚨 The supporter's version and the creator's version are two states, not
     * one shared string. The creator's carries the required count and the
     * window; a supporter must never be shown a number (rule 1).
     */
    public function test_the_supporter_copy_is_not_the_creator_copy(): void
    {
        $supporter = RiskMessages::get('CREATOR_CONTENT_PAUSED', RiskMessages::AUDIENCE_GUEST);
        $creator = RiskMessages::get('CREATOR_POSTING_PAUSED', RiskMessages::AUDIENCE_CREATOR);

        $this->assertNotSame($creator['body'], $supporter['body']);
        $this->assertContains('CREATOR_CONTENT_PAUSED', RiskMessages::supporterKeys());
        $this->assertNotContains('CREATOR_CONTENT_PAUSED', RiskMessages::creatorKeys());
        $this->assertNotContains('CREATOR_POSTING_PAUSED', RiskMessages::supporterKeys());
    }

    /**
     * Rule 3 — a refusal with no next step is what sends someone to their bank
     * instead of our chat.
     */
    public function test_the_new_state_gives_a_next_step(): void
    {
        $m = RiskMessages::get('CREATOR_CONTENT_PAUSED', RiskMessages::AUDIENCE_GUEST);

        $this->assertNotSame('', trim($m['next_step']));
        $this->assertNotSame('', trim($m['title']));
    }
}
