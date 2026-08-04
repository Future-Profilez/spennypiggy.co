<?php

namespace Tests\Feature;

use App\Models\NotificationLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationLogMaintenanceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * ⚠️ `created_at` is written AFTER the insert. Eloquent stamps its own
     * timestamps on create and silently discards one passed to `create()`, so a
     * row meant to be 90 days old would be created as brand new and every
     * retention assertion here would pass against the wrong data.
     */
    private function log(array $attributes = []): NotificationLog
    {
        $createdAt = $attributes['created_at'] ?? now();
        unset($attributes['created_at']);

        $log = NotificationLog::create(array_merge([
            'channel' => NotificationLog::CHANNEL_EMAIL,
            'status' => NotificationLog::STATUS_SENT,
            'recipient_email' => 'someone@example.test',
        ], $attributes));

        $log->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->saveQuietly();

        return $log->refresh();
    }

    /**
     * A row still `queued` long after the send never got a confirmation from the
     * transport. Left alone it reads as "still on its way", which it is not.
     */
    public function test_an_unconfirmed_row_is_settled_as_failed(): void
    {
        $stale = $this->log([
            'status' => NotificationLog::STATUS_QUEUED,
            'created_at' => now()->subHours(6),
        ]);

        $fresh = $this->log([
            'status' => NotificationLog::STATUS_QUEUED,
            'created_at' => now()->subMinutes(2),
        ]);

        $this->artisan('notification-logs:prune')->assertSuccessful();

        $this->assertSame(NotificationLog::STATUS_FAILED, $stale->fresh()->status);
        $this->assertSame(
            NotificationLog::STATUS_QUEUED,
            $fresh->fresh()->status,
            'A send from two minutes ago was written off before it had a chance to confirm.',
        );
    }

    public function test_expired_rows_are_deleted_and_recent_ones_are_kept(): void
    {
        config(['notification_logs.retention_days' => 30]);

        $old = $this->log(['created_at' => now()->subDays(90)]);
        $recent = $this->log(['created_at' => now()->subDays(3)]);

        $this->artisan('notification-logs:prune')->assertSuccessful();

        $this->assertNull($old->fresh());
        $this->assertNotNull($recent->fresh());
    }

    /** Campaign traffic is far higher volume and is kept for less time. */
    public function test_campaign_rows_use_their_own_shorter_window(): void
    {
        config([
            'notification_logs.retention_days' => 180,
            'notification_logs.campaign_retention_days' => 30,
        ]);

        $campaign = $this->log(['campaign_id' => 5, 'created_at' => now()->subDays(60)]);
        $transactional = $this->log(['created_at' => now()->subDays(60)]);

        $this->artisan('notification-logs:prune')->assertSuccessful();

        $this->assertNull($campaign->fresh());
        $this->assertNotNull($transactional->fresh());
    }

    public function test_dry_run_changes_nothing(): void
    {
        config(['notification_logs.retention_days' => 30]);

        $old = $this->log(['created_at' => now()->subDays(90)]);
        $stale = $this->log([
            'status' => NotificationLog::STATUS_QUEUED,
            'created_at' => now()->subHours(6),
        ]);

        $this->artisan('notification-logs:prune', ['--dry-run' => true])->assertSuccessful();

        $this->assertNotNull($old->fresh());
        $this->assertSame(NotificationLog::STATUS_QUEUED, $stale->fresh()->status);
    }

    /**
     * ⚠️ A bad `--days` must not delete rows the creator and gifter surfaces
     * still read back. The floor is what stops a typo emptying the table.
     */
    public function test_a_tiny_retention_value_is_clamped(): void
    {
        $twoDaysOld = $this->log(['created_at' => now()->subDays(2)]);

        $this->artisan('notification-logs:prune', ['--days' => 1])->assertSuccessful();

        $this->assertNotNull($twoDaysOld->fresh());
    }

    /**
     * With no rows at all, nothing can be judged — reporting every historical
     * payment as "no receipt" would bury any real finding.
     */
    public function test_the_audit_says_nothing_when_no_logs_exist_yet(): void
    {
        $this->artisan('notifications:audit-missing')->assertSuccessful();
    }
}
