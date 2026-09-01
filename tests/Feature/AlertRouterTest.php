<?php

namespace Tests\Feature;

use App\Models\AlertRoute;
use App\Support\AlertRouter;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * The website READS the routing the admin panel writes (shared database).
 *
 * What is pinned here is the fail-open contract: every alert on this app is
 * about something already going wrong, so a missing table, a missing row or a
 * broken lookup must still reach the people config/alerts.php names.
 */
class AlertRouterTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        AlertRouter::forget();

        Config::set('alerts.enabled', true);
        Config::set('alerts.fallback', ['fallback@spennypiggy.co']);
    }

    public function test_no_row_means_the_previous_behaviour(): void
    {
        $this->assertSame(['fallback@spennypiggy.co'], AlertRouter::recipients('dispute_alerts'));
    }

    public function test_a_row_written_by_the_admin_app_is_honoured_here(): void
    {
        // The admin panel is the only writer; this app just reads the table.
        DB::table('alert_routes')->insert([
            'channel' => 'dispute_alerts',
            'environment' => AlertRouter::environment(),
            'emails' => json_encode(['disputes@spennypiggy.co']),
            'roles' => json_encode([]),
            'enabled' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        AlertRouter::forget();

        $this->assertSame(['disputes@spennypiggy.co'], AlertRouter::recipients('dispute_alerts'));
    }

    public function test_disputes_and_fraud_are_separately_aimable(): void
    {
        /*
         * 🚨 `StripeWebhookController::resolveAdminEmails($type)` accepted a
         * type and ignored it, so these two could not be aimed apart however
         * anybody configured them.
         */
        foreach ([['dispute_alerts', 'disputes@spennypiggy.co'], ['fraud_alerts', 'fraud@spennypiggy.co']] as [$channel, $email]) {
            DB::table('alert_routes')->insert([
                'channel' => $channel,
                'environment' => AlertRouter::environment(),
                'emails' => json_encode([$email]),
                'roles' => json_encode([]),
                'enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        AlertRouter::forget();

        $this->assertSame(['disputes@spennypiggy.co'], AlertRouter::recipients('dispute_alerts'));
        $this->assertSame(['fraud@spennypiggy.co'], AlertRouter::recipients('fraud_alerts'));
    }

    public function test_a_missing_table_still_sends(): void
    {
        Schema::dropIfExists('alert_routes');
        AlertRouter::forget();

        // A host that has not run the admin app's migration yet is not a host
        // that stops alerting.
        $this->assertSame(['fallback@spennypiggy.co'], AlertRouter::recipients('platform_risk_state'));
    }

    public function test_a_disabled_channel_is_the_only_way_to_reach_nobody(): void
    {
        // Written the way the admin app writes it — this app's model has no
        // `$fillable`, deliberately, so `create()` here would (correctly) throw.
        DB::table('alert_routes')->insert([
            'channel' => 'diagnostics',
            'environment' => AlertRouter::environment(),
            'emails' => json_encode(['ops@spennypiggy.co']),
            'roles' => json_encode([]),
            'enabled' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        AlertRouter::forget();

        $this->assertSame([], AlertRouter::recipients('diagnostics'));
    }

    public function test_the_model_here_cannot_mass_assign_the_routing(): void
    {
        /*
         * 🚨 The back office owns these writes. A website path able to
         * mass-assign them is a route by which a request re-aims the platform's
         * own security and fraud alerts.
         */
        $this->assertSame([], (new AlertRoute)->getFillable());
    }

    public function test_every_channel_a_sender_uses_is_declared(): void
    {
        $declared = array_keys((array) config('alerts.channels'));

        // A channel missing from the catalogue cannot be aimed from the admin
        // screen — it silently falls back for ever, which reads as "the setting
        // does nothing".
        foreach ([
            'dispute_alerts',
            'fraud_alerts',
            'platform_risk_state',
            'diagnostics',
            'feature_suggestions',
            'whale_retention',
            'creator_intro_submitted',
            'security_events',
        ] as $channel) {
            $this->assertContains($channel, $declared);
        }
    }
}
