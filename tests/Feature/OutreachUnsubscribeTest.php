<?php

namespace Tests\Feature;

use App\Models\CrmCreator;
use App\Models\MarketingSuppression;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * The cold-outreach unsubscribe: a CRM lead (not a user) asking out through
 * the link the admin app put in their email.
 */
class OutreachUnsubscribeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The admin app owns these columns; declare them for this app's sqlite test DB.
        Schema::table('crm_creators', function ($table) {
            foreach (['outreach_blocked_reason' => 'string', 'do_not_contact_at' => 'dateTime', 'bounced_at' => 'dateTime', 'last_outreach_at' => 'dateTime'] as $col => $type) {
                if (! Schema::hasColumn('crm_creators', $col)) {
                    $table->{$type}($col)->nullable();
                }
            }
        });
    }

    private function lead(): CrmCreator
    {
        return CrmCreator::create([
            'full_name' => 'Kayla Bud',
            'email' => 'Kayla@Example.test',
            'crm_stage' => 'prospect',
            'status' => 'active',
        ]);
    }

    /** Mirrors admin's WebsiteSignedUrl::outreachUnsubscribe — same APP_KEY, same HMAC. */
    private function signedUrl(int $leadId, int $expiresIn = 3600): string
    {
        $params = ['expires' => now()->addSeconds($expiresIn)->getTimestamp()];
        ksort($params);
        $url = config('app.url').'/outreach/unsubscribe/'.$leadId.'?'.http_build_query($params);

        return $url.'&signature='.hash_hmac('sha256', $url, config('app.key'));
    }

    public function test_a_signed_link_unsubscribes_the_lead_and_suppresses_the_address(): void
    {
        $lead = $this->lead();

        $response = $this->get($this->signedUrl($lead->id))
            ->assertOk()
            ->assertSee('unsubscribed');

        $this->assertStringContainsString('noindex', (string) $response->headers->get('X-Robots-Tag'));

        $lead->refresh();
        $this->assertNotNull($lead->do_not_contact_at);
        $this->assertSame('unsubscribed', $lead->outreach_blocked_reason);
        $this->assertTrue(MarketingSuppression::where('email', 'kayla@example.test')->exists());
    }

    public function test_an_unsigned_or_expired_link_changes_nothing(): void
    {
        $lead = $this->lead();

        $this->get('/outreach/unsubscribe/'.$lead->id)->assertStatus(410);
        $this->get($this->signedUrl($lead->id, -10))->assertStatus(410);

        $this->assertNull($lead->fresh()->do_not_contact_at);
        $this->assertFalse(MarketingSuppression::where('email', 'kayla@example.test')->exists());
    }

    public function test_one_click_post_works_without_a_session_or_csrf_token(): void
    {
        $lead = $this->lead();

        $this->post($this->signedUrl($lead->id), ['List-Unsubscribe' => 'One-Click'])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertNotNull($lead->fresh()->do_not_contact_at);
        $this->assertTrue(MarketingSuppression::where('email', 'kayla@example.test')->exists());
    }

    public function test_a_link_for_a_lead_that_no_longer_exists_still_renders_a_page(): void
    {
        $this->get($this->signedUrl(999999))->assertOk()->assertSee('find that address');
    }
}
