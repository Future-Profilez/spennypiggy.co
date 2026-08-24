<?php

namespace Tests\Feature;

use App\Models\Deliverable;
use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Security Checklist §3 — "bulk content downloads", the paths beyond paid tasks.
 *
 * `ContentDownloadMonitor` was wired into `TaskController::download` only, so a
 * shop, wish, pot or bill deliverable left the platform through
 * `/deliverable/access/{uuid}` and the deliverables API with no record at all.
 *
 * 🚨 The property pinned hardest here is the one that turns the safeguard into
 * the leak: the recorded row must NEVER carry the file's URL. An alert that
 * names the paid file is a way of getting the paid file.
 */
class ContentDownloadObservationTest extends TestCase
{
    use RefreshDatabase;

    private const SECRET_URL = 'https://ucarecdn.com/secret-paid-file/reward.zip';

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
    }

    private function deliverable(array $overrides = []): Deliverable
    {
        $creator = User::factory()->create();
        $buyer = User::factory()->create();

        return Deliverable::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'product_id' => 'prod_'.Str::random(8),
            'creator_id' => $creator->id,
            'gifter_id' => $buyer->id,
            'deliverable_type' => 'digital_file',
            'product_type' => 'shop',
            'deliverable_url' => self::SECRET_URL,
            'status' => 'delivered',
        ], $overrides));
    }

    /** The generic access link is how shop/wish/pot deliverables are handed over. */
    public function test_the_deliverable_access_link_records_a_download(): void
    {
        $deliverable = $this->deliverable();

        $this->actingAs(User::find($deliverable->gifter_id))
            // ⚠️ Contains, not equals: the redirect target is signed at read
            // time, so an exact match would break on a signing change that has
            // nothing to do with this observation.
            ->get('/deliverable/access/'.$deliverable->uuid)
            ->assertRedirectContains('secret-paid-file');

        $event = SecurityEvent::where('event_type', SecurityEvent::CONTENT_DOWNLOAD)->firstOrFail();

        $this->assertSame('shop', $event->subject_type);
        $this->assertSame($deliverable->uuid, $event->subject_id);
        $this->assertSame($deliverable->gifter_id, $event->user_id);
    }

    /**
     * 🚨 The file is identified, never named. Nothing in the row may be usable
     * as a way of fetching what the supporter paid for.
     */
    public function test_the_recorded_row_never_carries_the_file_url(): void
    {
        $deliverable = $this->deliverable();

        $this->get('/deliverable/access/'.$deliverable->uuid);

        $row = json_encode(SecurityEvent::first()?->toArray());

        $this->assertStringNotContainsString(self::SECRET_URL, (string) $row);
        $this->assertStringNotContainsString('reward.zip', (string) $row);
    }

    /** Nothing was delivered, so nothing counts towards a download burst. */
    public function test_a_deliverable_with_no_file_records_nothing(): void
    {
        $deliverable = $this->deliverable(['deliverable_url' => null]);

        $this->get('/deliverable/access/'.$deliverable->uuid);

        $this->assertDatabaseCount('security_events', 0);
    }

    /** The API hands the buyer the content url one item at a time — that counts. */
    public function test_the_deliverables_api_records_a_per_item_read(): void
    {
        $deliverable = $this->deliverable(['product_type' => 'wish']);
        $buyer = User::find($deliverable->gifter_id);

        $this->actingAs($buyer, 'sanctum')
            ->getJson('/api/deliverables/'.$deliverable->uuid)
            ->assertOk();

        $event = SecurityEvent::where('event_type', SecurityEvent::CONTENT_DOWNLOAD)->firstOrFail();

        $this->assertSame('wish', $event->subject_type);
        $this->assertSame($deliverable->uuid, $event->subject_id);
    }

    /**
     * ⚠️ The buyer's own library listing is NOT a download. One call returns
     * every purchase, so counting each row would push anyone with twenty
     * purchases over the burst threshold for opening their own page.
     */
    public function test_the_library_listing_is_not_recorded_as_a_download(): void
    {
        $deliverable = $this->deliverable();

        $this->actingAs(User::find($deliverable->gifter_id), 'sanctum')
            ->getJson('/api/deliverables')
            ->assertOk();

        $this->assertDatabaseCount('security_events', 0);
    }

    /** Observation must never be able to break the delivery it observes. */
    public function test_a_broken_log_table_does_not_break_the_download(): void
    {
        $deliverable = $this->deliverable();

        Schema::drop('security_events');

        $this->get('/deliverable/access/'.$deliverable->uuid)
            ->assertRedirectContains('secret-paid-file');
    }
}
