<?php

namespace Tests\Feature;

use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\User;
use App\Support\CreatorHelpTicket;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Help tickets — a conversation between a creator and the Spenny Piggy team
 * (config/creator_help.php). See App\Support\CreatorHelpTicket.
 */
class CreatorHelpTicketTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Http::fake();
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'email_verified_at' => now(),
            'profile_status_lock' => 2,
        ], $attributes));
    }

    /** 🚨 The first message is FROM SUPPORT, never as the creator (client decision, 7 Sep 2026). */
    public function test_a_tier_one_opener_writes_the_first_message_from_support(): void
    {
        $user = $this->creator();

        $ticket = CreatorHelpTicket::openFor($user, 'fraud_suspected');

        $this->assertNotNull($ticket);
        $this->assertSame('help', $ticket->type);
        $this->assertSame('open', $ticket->status);
        $this->assertNull($ticket->supporter_id);
        $this->assertSame('fraud_suspected', $ticket->event_type);

        $first = SupportTicketMessage::where('ticket_id', $ticket->id)->orderBy('id')->first();
        $this->assertSame('admin', $first->sender_role);
        $this->assertNull($first->sender_user_id);
        $this->assertSame(config('creator_help.codes.fraud_suspected.opening'), $first->message);
    }

    /** The admin's own written reason IS the first message — nobody explains a refusal twice. */
    public function test_a_passed_opening_replaces_the_default(): void
    {
        $user = $this->creator();

        $ticket = CreatorHelpTicket::openFor($user, 'identity_mismatch', 'The passport does not match your profile photo.');

        $this->assertSame(
            'The passport does not match your profile photo.',
            SupportTicketMessage::where('ticket_id', $ticket->id)->value('message')
        );
    }

    /** One open conversation per creator per code — a second call returns the first. */
    public function test_one_open_ticket_per_creator_per_code(): void
    {
        $user = $this->creator();

        $a = CreatorHelpTicket::openFor($user, 'policy_suspension');
        $b = CreatorHelpTicket::openFor($user, 'policy_suspension');

        $this->assertSame($a->id, $b->id);
        $this->assertSame(1, SupportTicket::where('creator_id', $user->id)->count());
    }

    /** An automatic opener never reopens a conversation a person closed; the creator still can. */
    public function test_an_automatic_opener_never_reopens_a_resolved_ticket(): void
    {
        $user = $this->creator();

        $first = CreatorHelpTicket::openFor($user, 'consent_declined');
        $first->update(['status' => 'resolved', 'resolved_at' => now()]);

        $this->assertNull(CreatorHelpTicket::openFor($user, 'consent_declined'));

        // Tier 2 (the creator pressed a button) may open a fresh one.
        $again = CreatorHelpTicket::openFor($user, 'suspension', null, [], auto: false);
        $this->assertNotNull($again);
    }

    /** 🚨 The daily cap stops a webhook loop, and it is LOUD. */
    public function test_the_daily_cap_refuses_and_logs_at_error(): void
    {
        config(['creator_help.daily_cap' => 2]);
        Log::shouldReceive('error')->once()->withArgs(fn ($m) => str_contains($m, 'daily auto-open cap'));
        Log::shouldReceive('warning')->zeroOrMoreTimes();
        Log::shouldReceive('info')->zeroOrMoreTimes();

        CreatorHelpTicket::openFor($this->creator(), 'fraud_suspected');
        CreatorHelpTicket::openFor($this->creator(), 'fraud_suspected');

        $this->assertNull(CreatorHelpTicket::openFor($this->creator(), 'fraud_suspected'));
    }

    /** 🚨 Creator-opened (tier 2) tickets never spend the automatic cap (review finding, 7 Sep 2026). */
    public function test_the_daily_cap_ignores_creator_opened_tickets(): void
    {
        config(['creator_help.daily_cap' => 1]);

        CreatorHelpTicket::openFor($this->creator(), 'identity_help', null, [], auto: false);
        CreatorHelpTicket::openFor($this->creator(), 'blocked_payment', null, [], auto: false);

        $this->assertSame(2, SupportTicket::where('type', 'help')->count());
        $this->assertNotNull(CreatorHelpTicket::openFor($this->creator(), 'fraud_suspected'));
    }

    /** A help ticket is a queue to the team, so the 3-consecutive-message cap does not apply. */
    public function test_a_help_ticket_is_not_capped_at_three_consecutive_messages(): void
    {
        $user = $this->creator();
        $ticket = CreatorHelpTicket::openFor($user, 'identity_help', null, [], auto: false);

        foreach ([1, 2, 3] as $i) {
            SupportTicketMessage::create([
                'ticket_id' => $ticket->id,
                'sender_role' => 'creator',
                'sender_user_id' => $user->id,
                'message' => "Part {$i} of my question",
            ]);
        }

        $this->actingAs($user)
            ->postJson("/support/tickets/{$ticket->uuid}/message", ['message' => 'And one more detail about my photo.'])
            ->assertOk();

        $this->assertSame(5, SupportTicketMessage::where('ticket_id', $ticket->id)->count());
    }

    public function test_an_unknown_code_opens_nothing_and_never_throws(): void
    {
        $this->assertNull(CreatorHelpTicket::openFor($this->creator(), 'not_a_code'));
        $this->assertSame(0, SupportTicket::count());
    }

    /** Tier 2: the "Get help with this" button, with the item attached. */
    public function test_a_creator_opens_a_help_ticket_from_a_dead_end(): void
    {
        $user = $this->creator();

        $response = $this->actingAs($user)->postJson('/support/help', [
            'code' => 'moderation_hold',
            'source' => 'tasks',
            'source_id' => 'abc-123',
            'message' => 'Why is this held?',
        ]);

        $response->assertOk()->assertJsonPath('status', true);

        $ticket = SupportTicket::where('creator_id', $user->id)->firstOrFail();
        $this->assertSame('tasks', $ticket->source);
        $this->assertSame('abc-123', $ticket->source_id);
        // Their own words go in as THEIR reply, so it is with the team.
        $this->assertSame('awaiting_admin', $ticket->status);
        $this->assertSame(2, SupportTicketMessage::where('ticket_id', $ticket->id)->count());
    }

    /** A tier-1 code cannot be opened from the button. */
    public function test_the_button_refuses_a_tier_one_code(): void
    {
        $this->actingAs($this->creator())
            ->postJson('/support/help', ['code' => 'fraud_suspected'])
            ->assertStatus(422);
    }

    /** 🚨 A suspended creator is exactly who presses it — the route is on the write-allowlist. */
    public function test_a_suspended_creator_can_still_open_one(): void
    {
        $user = $this->creator(['suspended_account' => 1]);

        $this->actingAs($user)
            ->postJson('/support/help', ['code' => 'suspension'])
            ->assertOk();

        $this->assertContains('support.help.open', config('suspension.allowed_write_routes'));
    }

    /** A creator's message moves a help ticket to the team, and a money question gets the automatic first answer. */
    public function test_a_creator_message_goes_to_the_team_with_an_automatic_reply_on_payout_questions(): void
    {
        $user = $this->creator();
        $ticket = CreatorHelpTicket::openFor($user, 'blocked_payment', null, [], auto: false);

        $this->actingAs($user)
            ->postJson("/support/tickets/{$ticket->uuid}/message", ['message' => 'When will I get paid for last week?'])
            ->assertOk();

        $ticket->refresh();
        $this->assertSame('awaiting_admin', $ticket->status);

        $last = SupportTicketMessage::where('ticket_id', $ticket->id)->orderByDesc('id')->first();
        $this->assertSame('admin', $last->sender_role);
        $this->assertStringStartsWith(config('creator_help.auto_reply_prefix'), $last->message);
        // Never closed by the automatic answer.
        $this->assertNull($ticket->resolved_at);
    }

    public function test_a_message_with_no_matching_question_gets_no_automatic_reply(): void
    {
        $this->assertNull(CreatorHelpTicket::autoReplyFor('Hello, I need help with my photo.'));
        $this->assertNotNull(CreatorHelpTicket::autoReplyFor('Why is part of my money held in reserve?'));
    }

    /** The creator's own screen reads `is_help`, and the page renders for a ticket with no supporter. */
    public function test_the_creator_can_open_a_help_ticket_with_no_supporter(): void
    {
        $user = $this->creator();
        $ticket = CreatorHelpTicket::openFor($user, 'identity_help', null, [], auto: false);

        $this->actingAs($user)
            ->get("/support/tickets/{$ticket->uuid}")
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('ticket.is_help', true)->where('ticket.supporter_id', null));
    }
}
