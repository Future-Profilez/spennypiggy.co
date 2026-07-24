<?php

namespace Tests\Feature;

use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\TipGoal;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Services\SupportTicketRefundService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class SupportTicketTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    public function test_authenticated_user_can_create_support_ticket()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $response = $this->actingAs($supporter)
            ->postJson(route('support.tickets.store'), [
                'type' => 'contact',
                'creator_username' => $creator->username,
                'message' => 'Hello, I need help with my support transaction.',
            ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'ticket_uuid', 'redirect']);

        $ticket = SupportTicket::first();
        $this->assertNotNull($ticket);
        $this->assertEquals('contact', $ticket->type);
        $this->assertEquals($creator->id, $ticket->creator_id);
        $this->assertEquals($supporter->id, $ticket->supporter_id);

        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'sender_role' => 'supporter',
            'sender_user_id' => $supporter->id,
            'message' => 'Hello, I need help with my support transaction.',
        ]);
    }

    public function test_user_can_view_support_ticket()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $ticket = SupportTicket::create([
            'type' => 'contact',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
        ]);

        $response = $this->actingAs($supporter)
            ->get(route('support.tickets.show', $ticket->uuid));

        $response->assertStatus(200);

        // Creator can also view
        $response = $this->actingAs($creator)
            ->get(route('support.tickets.show', $ticket->uuid));

        $response->assertStatus(200);

        // Unrelated user cannot view
        $other = User::factory()->create();
        $response = $this->actingAs($other)
            ->get(route('support.tickets.show', $ticket->uuid));

        $response->assertStatus(403);
    }

    public function test_user_can_send_message_in_ticket()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $ticket = SupportTicket::create([
            'type' => 'contact',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
        ]);

        $response = $this->actingAs($supporter)
            ->postJson(route('support.tickets.message', $ticket->uuid), [
                'message' => 'Follow up message',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'sender_role' => 'supporter',
            'sender_user_id' => $supporter->id,
            'message' => 'Follow up message',
        ]);
    }

    public function test_cannot_send_more_than_three_consecutive_messages()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $ticket = SupportTicket::create([
            'type' => 'contact',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
        ]);

        for ($i = 0; $i < 3; $i++) {
            SupportTicketMessage::create([
                'ticket_id' => $ticket->id,
                'sender_role' => 'supporter',
                'sender_user_id' => $supporter->id,
                'message' => 'Message '.$i,
            ]);
        }

        $response = $this->actingAs($supporter)
            ->postJson(route('support.tickets.message', $ticket->uuid), [
                'message' => 'Message 4 should fail',
            ]);

        $response->assertStatus(422);
    }

    public function test_guest_can_create_ticket_from_tip_payment()
    {
        $creator = User::factory()->create();
        $tipGoal = new TipGoal;
        $tipGoal->user_id = $creator->id;
        $tipGoal->name = 'Support my content';
        $tipGoal->description = 'Support';
        $tipGoal->target = 5000;
        $tipGoal->save();

        $payment = TipGoalsPayment::create([
            'tip_goal_id' => $tipGoal->id,
            'creator_id' => $creator->id,
            'guest_email' => 'guest@example.com',
            'amount' => 1000,
            'currency' => 'gbp',
            'status' => 'paid',
        ]);

        $url = URL::signedRoute('support.guest.tip.store', [
            'tipPaymentId' => $payment->id,
            'email' => 'guest@example.com',
        ]);

        $response = $this->postJson($url, [
            'email' => 'guest@example.com',
            'type' => 'refund',
            'message' => 'I would like a refund please.',
            'reason' => 'Mistake',
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure(['status', 'ticket_uuid', 'redirect']);

        $ticket = SupportTicket::first();
        $this->assertNotNull($ticket);
        $this->assertEquals('refund', $ticket->type);
        $this->assertEquals($creator->id, $ticket->creator_id);
        $this->assertNull($ticket->supporter_id);
        $this->assertEquals('guest@example.com', $ticket->guest_email);
    }

    public function test_guest_cannot_create_ticket_with_wrong_email()
    {
        $creator = User::factory()->create();
        $tipGoal = new TipGoal;
        $tipGoal->user_id = $creator->id;
        $tipGoal->name = 'Support my content';
        $tipGoal->description = 'Support';
        $tipGoal->target = 5000;
        $tipGoal->save();

        $payment = TipGoalsPayment::create([
            'tip_goal_id' => $tipGoal->id,
            'creator_id' => $creator->id,
            'guest_email' => 'guest@example.com',
            'amount' => 1000,
            'currency' => 'gbp',
            'status' => 'paid',
        ]);

        $url = URL::signedRoute('support.guest.tip.store', [
            'tipPaymentId' => $payment->id,
            'email' => 'guest@example.com',
        ]);

        $response = $this->postJson($url, [
            'email' => 'wrong@example.com',
            'type' => 'refund',
            'message' => 'I would like a refund please.',
        ]);

        $response->assertStatus(403);
    }

    public function test_guest_can_view_and_message_on_ticket()
    {
        $creator = User::factory()->create();
        $ticket = SupportTicket::create([
            'type' => 'contact',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'guest_email' => 'guest@example.com',
        ]);

        $showUrl = URL::signedRoute('support.guest.tickets.show', [
            'uuid' => $ticket->uuid,
            'email' => 'guest@example.com',
        ]);

        $response = $this->get($showUrl);
        $response->assertStatus(200);

        $msgUrl = URL::signedRoute('support.guest.tickets.message', [
            'uuid' => $ticket->uuid,
            'email' => 'guest@example.com',
        ]);

        $response = $this->postJson($msgUrl, [
            'email' => 'guest@example.com',
            'message' => 'Hello from guest',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'sender_role' => 'supporter',
            'sender_user_id' => null,
            'message' => 'Hello from guest',
        ]);
    }

    public function test_user_can_resolve_ticket()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $ticket = SupportTicket::create([
            'type' => 'contact',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
        ]);

        $response = $this->actingAs($supporter)
            ->postJson(route('support.tickets.resolve', $ticket->uuid));

        $response->assertStatus(200);

        $ticket->refresh();
        $this->assertEquals('resolved', $ticket->status);
        $this->assertNotNull($ticket->resolved_at);
    }

    public function test_creator_can_approve_refund()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $ticket = SupportTicket::create([
            'type' => 'refund',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
        ]);

        // Mock SupportTicketRefundService
        $this->mock(SupportTicketRefundService::class, function ($mock) use ($ticket, $creator) {
            $mock->shouldReceive('initiateRefund')
                ->once()
                ->with(\Mockery::on(function ($t) use ($ticket) {
                    return $t->id === $ticket->id;
                }), \Mockery::on(function ($c) use ($creator) {
                    return $c->id === $creator->id;
                }), 'creator');
        });

        $response = $this->actingAs($creator)
            ->postJson(route('support.tickets.creator.approve-refund', $ticket->uuid), [
                'message' => 'Approved refund',
            ]);

        $response->assertStatus(200);

        $ticket->refresh();
        $this->assertEquals('refund_initiated', $ticket->status);
        $this->assertNotNull($ticket->resolved_at);

        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'sender_role' => 'creator',
            'sender_user_id' => $creator->id,
            'message' => 'Approved refund',
        ]);
    }

    public function test_creator_can_reject_refund()
    {
        $supporter = User::factory()->create();
        $creator = User::factory()->create();

        $ticket = SupportTicket::create([
            'type' => 'refund',
            'status' => 'awaiting_creator',
            'creator_id' => $creator->id,
            'supporter_id' => $supporter->id,
        ]);

        $response = $this->actingAs($creator)
            ->postJson(route('support.tickets.creator.reject-refund', $ticket->uuid), [
                'message' => 'No refund for you',
            ]);

        $response->assertStatus(200);

        $ticket->refresh();
        $this->assertEquals('rejected', $ticket->status);
        $this->assertNotNull($ticket->resolved_at);

        $this->assertDatabaseHas('support_ticket_messages', [
            'ticket_id' => $ticket->id,
            'sender_role' => 'creator',
            'sender_user_id' => $creator->id,
            'message' => 'No refund for you',
        ]);
    }
}
