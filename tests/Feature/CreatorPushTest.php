<?php

namespace Tests\Feature;

use App\Models\CreatorPushMessage;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\CreatorPushService;
use App\Services\NotificationDispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Creator-controlled push — Developer Master Plan, 19 Aug 2026, §E.
 *
 * 🚨 THIS IS THE ONLY FEATURE WHERE ONE USER'S TEXT LANDS ON ANOTHER USER'S
 * LOCK SCREEN. These tests are about the guards, in the order they would cost
 * most if they failed: what may be written, how often, and who receives it.
 */
class CreatorPushTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1, 'suspended_account' => 0]);
    }

    private function supporterOf(User $creator, array $overrides = []): User
    {
        $supporter = User::factory()->create(array_merge([
            'role' => 0,
            'suspended_account' => 0,
        ], $overrides));

        /*
         * ⚠️ Built directly, not through a factory — `FinancialTransaction` has
         * none, and this test only needs the one fact the service reads: this
         * person paid this creator. `uuid`, `type`, `gross_amount` and
         * `net_amount` are the table's other NOT NULL columns.
         */
        FinancialTransaction::create([
            'uuid' => (string) Str::uuid(),
            'user_id' => $creator->id,
            'supporter_id' => $supporter->id,
            'type' => 'income',
            'gross_amount' => 10.00,
            'net_amount' => 8.00,
            'transaction_date' => now(),
        ]);

        return $supporter;
    }

    private function service(): CreatorPushService
    {
        return app(CreatorPushService::class);
    }

    /**
     * 🚨 THE RULE THAT MATTERS MOST. A push arrives on a lock screen with a
     * creator's name on it and is trusted accordingly. A link in one is how a
     * paying audience gets moved to a site with no refunds, no chargeback
     * protection and no moderation — and how a creator gets impersonated doing
     * it.
     *
     * @dataProvider offMessages
     */
    public function test_nothing_that_leads_off_the_platform_is_allowed(string $body, string $expect): void
    {
        $problem = $this->service()->moderate($body);

        $this->assertNotNull($problem, "This should have been refused: {$body}");
        $this->assertStringContainsStringIgnoringCase($expect, $problem);
    }

    public static function offMessages(): array
    {
        return [
            'https link' => ['Come and see https://elsewhere.com today', 'links'],
            'bare domain' => ['Everything is now on myshop.store instead', 'links'],
            'dot spelled out' => ['find me at example dot com from now on', 'links'],
            'handle' => ['I am @janedoe over there now', 'usernames'],
            'email' => ['message me on jane@example.com instead', 'email'],
            'phone' => ['text me on 07700 900123 any time', 'phone'],
        ];
    }

    /**
     * ⚠️ A refusal must NAME WHAT TO REMOVE. An address caught by the domain
     * pattern and refused as "a link" tells the creator to look for the wrong
     * thing. E-mail is therefore checked before the URL rule.
     */
    public function test_an_email_is_refused_as_an_email_not_as_a_link(): void
    {
        $this->assertStringContainsStringIgnoringCase(
            'email',
            (string) $this->service()->moderate('write to me at jane@example.com please')
        );
    }

    public function test_an_ordinary_message_passes(): void
    {
        $this->assertNull(
            $this->service()->moderate('New set is live today, come and take a look')
        );
    }

    /**
     * 🚨 THE LIMIT IS COMPUTED FROM THE TABLE, NEVER A CACHE. A cache flush must
     * not hand every creator on the platform a fresh allowance.
     */
    public function test_a_creator_may_send_once_a_day(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator);

        $first = $this->service()->send($creator, 'New set is live today, take a look');
        $this->assertTrue($first['sent']);

        $second = $this->service()->send($creator, 'And another one, right away');
        $this->assertFalse($second['sent']);
        $this->assertStringContainsStringIgnoringCase('today', (string) $second['reason']);

        // The refused one is not recorded as a moderation event.
        $this->assertSame(1, CreatorPushMessage::count());
    }

    /**
     * ⚠️ A refused message IS recorded, with its reason — "this creator keeps
     * trying to send phone numbers" is the signal a moderator needs.
     */
    public function test_a_blocked_message_is_recorded_with_its_reason(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator);

        $result = $this->service()->send($creator, 'Come to myshop.store instead');

        $this->assertFalse($result['sent']);

        $row = CreatorPushMessage::first();
        $this->assertSame(CreatorPushMessage::STATUS_BLOCKED, $row->status);
        $this->assertNotNull($row->blocked_reason);
        $this->assertSame(0, $row->recipients);
    }

    /** ⚠️ And a blocked message does not spend the creator's daily allowance. */
    public function test_being_refused_does_not_cost_the_creator_their_slot(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator);

        $this->service()->send($creator, 'Come to myshop.store instead');

        $this->assertTrue($this->service()->allowance($creator)['allowed']);
    }

    /**
     * 🚨 CONSENT IS HONOURED, AND A MISSING VALUE MEANS OPTED IN. A row created
     * before the column existed reads NULL; treating that as "they said no"
     * silently drops the majority of an audience — the exact fault that once
     * skipped the platform's largest e-mail fan-out.
     */
    public function test_a_supporter_who_turned_push_off_is_not_sent_to(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator, ['push_notifications_enabled' => true]);
        $this->supporterOf($creator, ['push_notifications_enabled' => false]);

        $result = $this->service()->send($creator, 'New set is live today, take a look');

        $this->assertSame(1, $result['recipients']);
    }

    /**
     * ⚠️ A suspended account is never messaged. Somebody who paid before being
     * suspended stays in the transaction list for ever — the same trap the
     * birthday campaign was caught by.
     */
    public function test_a_suspended_supporter_is_never_messaged(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator, ['suspended_account' => 1]);

        $this->assertSame(0, $this->service()->send($creator, 'New set is live today, take a look')['recipients']);
    }

    /** A creator with no supporters sends to nobody, and it is not an error. */
    public function test_no_supporters_is_not_a_failure(): void
    {
        $result = $this->service()->send($this->creator(), 'New set is live today, take a look');

        $this->assertTrue($result['sent']);
        $this->assertSame(0, $result['recipients']);
    }

    /**
     * 🚨 A SUPPORTER CANNOT SEND. This endpoint pushes text to other people's
     * phones; the role check is the whole gate on who may use it.
     */
    public function test_a_supporter_cannot_send_a_push(): void
    {
        $supporter = User::factory()->create(['role' => 0]);

        $this->actingAs($supporter)
            ->post(route('creator.push.send'), ['body' => 'New set is live today, take a look'])
            ->assertSessionHas('error');

        $this->assertSame(0, CreatorPushMessage::count());
    }

    public function test_a_signed_out_visitor_cannot_send(): void
    {
        $this->post(route('creator.push.send'), ['body' => 'New set is live today, take a look'])
            ->assertRedirect();

        $this->assertSame(0, CreatorPushMessage::count());
    }

    /**
     * ⚠️ A refusal comes back on the FIELD, not as a flash. The creator is
     * looking at what they typed and needs to know which part to change.
     */
    public function test_a_refused_message_returns_a_field_error(): void
    {
        $creator = $this->creator();

        $this->actingAs($creator)
            ->post(route('creator.push.send'), ['body' => 'Everything is on myshop.store now'])
            ->assertSessionHasErrors('body');
    }

    public function test_a_creator_can_send_through_the_endpoint(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator);

        $this->actingAs($creator)
            ->post(route('creator.push.send'), ['body' => 'New set is live today, take a look'])
            ->assertSessionHasNoErrors()
            ->assertSessionHas('success');

        $this->assertSame(1, CreatorPushMessage::where('status', CreatorPushMessage::STATUS_SENT)->count());
    }

    /**
     * ⚠️ The status endpoint tells the composer what is left. A supporter asking
     * gets 403 rather than a shape they could read a creator's activity from.
     */
    public function test_the_status_endpoint_is_creator_only(): void
    {
        $this->actingAs(User::factory()->create(['role' => 0]))
            ->getJson(route('creator.push.status'))
            ->assertForbidden();

        $this->actingAs($this->creator())
            ->getJson(route('creator.push.status'))
            ->assertOk()
            ->assertJsonStructure([
                'allowed', 'reason', 'sent_today', 'sent_this_month',
                'max_length', 'max_per_day', 'max_per_month',
            ]);
    }

    /**
     * 🚨 THE COMPOSER DRAWS ITS ALLOWANCE FROM THIS RESPONSE.
     * `Components/push/CreatorPushCard` renders "N left today · N left this month"
     * by subtracting `sent_today`/`sent_this_month` from `max_per_day`/`max_per_month`,
     * and falls back to literal 1 and 4 when a key is missing. So dropping or renaming
     * either limit does not break anything — it silently prints numbers that no longer
     * match the limits the service actually enforces, and the creator is refused by a
     * rule the screen told them they were within. Assert the VALUES, not just the keys.
     */
    public function test_the_status_endpoint_reports_the_real_limits(): void
    {
        $body = $this->actingAs($this->creator())
            ->getJson(route('creator.push.status'))
            ->assertOk()
            ->json();

        $this->assertSame(CreatorPushService::MAX_PER_DAY, $body['max_per_day']);
        $this->assertSame(CreatorPushService::MAX_PER_MONTH, $body['max_per_month']);
        $this->assertSame(CreatorPushService::MAX_LENGTH, $body['max_length']);
    }

    /**
     * 🚨 A CHANNEL NAME THAT MATCHES NOTHING IS A SILENT NO-OP.
     * `NotificationDispatcher::send()` selects channels with `in_array` and
     * returns void, so a literal `'push'` here that stopped matching the
     * constant would mean every creator notification reached nobody, with no
     * error, no failed row and nothing in the logs. The service references the
     * constants; this asserts the two channels it uses still exist.
     */
    public function test_the_dispatch_channels_it_asks_for_still_exist(): void
    {
        $this->assertSame('push', NotificationDispatcher::CHANNEL_PUSH);
        $this->assertSame('bell', NotificationDispatcher::CHANNEL_BELL);

        $source = (string) file_get_contents(
            (new \ReflectionClass(CreatorPushService::class))->getFileName()
        );

        $this->assertStringContainsString(
            'NotificationDispatcher::CHANNEL_PUSH',
            $source,
            'The service has gone back to a raw channel string, which can stop matching silently.'
        );
    }

    /**
     * 🚨 THE FAN-OUT IS QUEUED, AND THIS IS WHY.
     *
     * `NotificationDispatcher::send()` makes a SYNCHRONOUS HTTP call per
     * recipient — its own docblock says "avoid calling directly from a request
     * or a loop". Production runs on Lambda with a 60-second request timeout and
     * this fan-out is capped at 5,000 people, so sending inline meant a creator
     * with a few hundred supporters timed out mid-send, with the row already
     * written as `sent` and a recipient count that never happened.
     */
    public function test_the_fan_out_is_queued_not_sent_inside_the_request(): void
    {
        $source = (string) file_get_contents(
            (new \ReflectionClass(CreatorPushService::class))->getFileName()
        );

        $this->assertStringContainsString(
            'NotificationDispatcher::queue(',
            $source,
            'The fan-out must enqueue, not deliver.'
        );

        $this->assertStringNotContainsString(
            '->send(',
            $source,
            'The service is delivering inside the request again. On Lambda that times out '
            .'part-way through a large fan-out, after the row says it was sent.'
        );
    }

    /**
     * ⚠️ The row is written BEFORE the fan-out. If dispatch fails halfway the
     * creator has still spent the allowance and some people still received it;
     * a row written afterwards would record neither.
     */
    public function test_the_record_carries_how_many_it_actually_reached(): void
    {
        $creator = $this->creator();
        $this->supporterOf($creator);
        $this->supporterOf($creator);

        $this->service()->send($creator, 'New set is live today, take a look');

        $this->assertSame(2, CreatorPushMessage::first()->recipients);
    }
}
