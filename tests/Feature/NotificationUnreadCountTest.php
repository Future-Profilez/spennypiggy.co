<?php

namespace Tests\Feature;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * 🚨 THE BADGE COUNT IS A COUNT, NOT A FILTER OF THE FIRST PAGE.
 *
 * `get-notification` paginates at 30 and the installed app's icon badge is its
 * only consumer, so counting unread rows in the returned page meant anybody with
 * more than 30 notifications was shown a number lower than the truth. It
 * UNDERCOUNTS, which is why nobody ever reported it — a badge that reads 30 when
 * it should read 41 looks like a badge that works.
 *
 * ⚠️ The threshold is the thing under test, so the fixture deliberately sits
 * ABOVE one page. A test with 5 notifications passes just as happily against the
 * bug it exists to catch.
 */
class NotificationUnreadCountTest extends TestCase
{
    use RefreshDatabase;

    private const PER_PAGE = 30;

    private function fan(): User
    {
        // A gifter (role 0) clears CheckStripeIdentityVerification without any
        // Connect/identity setup — this route is behind that middleware too.
        return User::factory()->create(['role' => 0, 'suspended_account' => 0]);
    }

    private function notify(User $user, int $count, int $isRead = 0): void
    {
        foreach (range(1, $count) as $i) {
            Notification::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user->id,
                'notifiable_id' => $user->id,
                // NOT NULL on the table, and `NotificationDispatcher` writes
                // exactly this — a fixture that invents a value is a fixture
                // testing a row shape the app never produces.
                'notifiable_type' => User::class,
                'notification' => "Something happened ({$i})",
                'is_read' => $isRead,
            ]);
        }
    }

    public function test_the_unread_count_counts_past_the_first_page(): void
    {
        $user = $this->fan();
        $this->notify($user, self::PER_PAGE + 11);

        $response = $this->actingAs($user)->getJson('/get-notification');

        $response->assertOk();

        // The page itself is still capped — that part is correct and stays.
        $this->assertCount(self::PER_PAGE, $response->json('notifications'));

        // The count is not.
        $this->assertSame(self::PER_PAGE + 11, $response->json('unread_count'));
    }

    /** ⚠️ Read rows are excluded — the badge is unread, not total. */
    public function test_read_notifications_are_not_counted(): void
    {
        $user = $this->fan();
        $this->notify($user, 4);
        $this->notify($user, 6, isRead: 1);

        $this->actingAs($user)
            ->getJson('/get-notification')
            ->assertOk()
            ->assertJsonPath('unread_count', 4);
    }

    /** 🚨 Another account's notifications are never counted into this badge. */
    public function test_the_count_is_scoped_to_the_signed_in_account(): void
    {
        $mine = $this->fan();
        $theirs = $this->fan();

        $this->notify($mine, 2);
        $this->notify($theirs, 7);

        $this->actingAs($mine)
            ->getJson('/get-notification')
            ->assertOk()
            ->assertJsonPath('unread_count', 2);
    }

    /** Nothing unread is 0, not a missing key — the client falls back when the key is absent. */
    public function test_no_notifications_reports_zero_rather_than_omitting_the_key(): void
    {
        $this->actingAs($this->fan())
            ->getJson('/get-notification')
            ->assertOk()
            ->assertJsonPath('unread_count', 0);
    }
}
