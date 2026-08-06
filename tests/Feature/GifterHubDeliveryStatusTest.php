<?php

namespace Tests\Feature;

use App\Models\NotificationLog;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Purchase Hub is the surface a buyer opens specifically to ask "did I get
 * a receipt for this?" — and, unlike Support History and the creator ledger, it
 * showed nothing about delivery at all. `GifterHubController::attachDeliveryStatus()`
 * closes that gap for one-time purchases.
 */
class GifterHubDeliveryStatusTest extends TestCase
{
    use RefreshDatabase;

    private function tip(int $buyerId, int $creatorId, string $sessionId): TipGoalsPayment
    {
        // `target` is a deprecated column, not in $fillable, but still NOT NULL
        // on the schema — forceFill is the only way to satisfy the constraint.
        $goal = new TipGoal(['user_id' => $creatorId, 'name' => 'Test goal']);
        $goal->forceFill(['target' => 0])->save();

        return TipGoalsPayment::create([
            'user_id' => $buyerId,
            'creator_id' => $creatorId,
            'tip_goal_id' => $goal->id,
            'session_id' => $sessionId,
            'status' => 'paid',
            'amount' => 10,
            'currency' => 'gbp',
        ]);
    }

    public function test_an_unlocked_purchase_shows_the_buyers_own_delivery_status(): void
    {
        $buyer = User::factory()->create();
        $creator = User::factory()->create();

        $tip = $this->tip($buyer->id, $creator->id, 'cs_hub_test_1');

        NotificationLog::create([
            'channel' => NotificationLog::CHANNEL_EMAIL,
            'status' => NotificationLog::STATUS_SENT,
            'recipient_user_id' => $buyer->id,
            'stripe_session_id' => $tip->session_id,
            'sent_at' => now(),
        ]);

        $response = $this->actingAs($buyer)->getJson(route('gifter.hub.data'));

        $response->assertOk();

        $item = collect($response->json('unlocked'))->firstWhere('id', "tip:{$tip->id}");

        $this->assertNotNull($item, 'The tip purchase was not in the unlocked list.');
        $this->assertSame('sent', $item['notifications']['email'] ?? null);
    }

    /** No recorded delivery for this session means null, not a fabricated "not sent". */
    public function test_a_purchase_with_no_delivery_log_shows_null_not_a_guess(): void
    {
        $buyer = User::factory()->create();
        $creator = User::factory()->create();

        $tip = $this->tip($buyer->id, $creator->id, 'cs_hub_test_2');

        $response = $this->actingAs($buyer)->getJson(route('gifter.hub.data'));

        $item = collect($response->json('unlocked'))->firstWhere('id', "tip:{$tip->id}");

        $this->assertNotNull($item);
        $this->assertNull($item['notifications']);
    }

    /**
     * 🚨 A creator's own delivery rows for the SAME session must never leak into
     * the buyer's view — the platform never hands a creator's notification data
     * to the buyer, or vice versa.
     */
    public function test_the_creators_delivery_row_never_appears_on_the_buyers_hub(): void
    {
        $buyer = User::factory()->create();
        $creator = User::factory()->create();

        $tip = $this->tip($buyer->id, $creator->id, 'cs_hub_test_3');

        // Only the CREATOR was ever told anything about this session.
        NotificationLog::create([
            'channel' => NotificationLog::CHANNEL_EMAIL,
            'status' => NotificationLog::STATUS_SENT,
            'recipient_user_id' => $creator->id,
            'stripe_session_id' => $tip->session_id,
            'sent_at' => now(),
        ]);

        $response = $this->actingAs($buyer)->getJson(route('gifter.hub.data'));

        $item = collect($response->json('unlocked'))->firstWhere('id', "tip:{$tip->id}");

        $this->assertNull($item['notifications'], "The creator's delivery row leaked into the buyer's own hub.");
    }
}
