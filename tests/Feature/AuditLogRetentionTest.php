<?php

namespace Tests\Feature;

use App\Models\AuditLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Two rules about `audit_logs` that nothing structural used to enforce.
 *
 * 1. A row is immutable through the model. Both apps write; neither may edit or
 *    delete through Eloquent — the scrub and prune commands go through the
 *    query builder on purpose.
 * 2. `audit:prune-system` removes ONLY observer-written system rows past the
 *    retention window. An admin's row, an explicit system code, and a young
 *    observer row are never candidates.
 */
class AuditLogRetentionTest extends TestCase
{
    use RefreshDatabase;

    private function row(array $overrides = []): AuditLog
    {
        return AuditLog::create(array_merge([
            'actor' => 'system',
            'action_type' => 'MONTHLYCHARGE_UPDATED',
            'reference_id' => '87',
            'metadata_json' => ['event' => 'updated'],
            'created_at' => now()->subDays(400),
        ], $overrides));
    }

    public function test_an_audit_row_cannot_be_updated_or_deleted_through_the_model(): void
    {
        $row = $this->row();

        try {
            $row->update(['action_type' => 'SOMETHING_ELSE']);
            $this->fail('An audit row was updated through the model.');
        } catch (\LogicException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        try {
            $row->delete();
            $this->fail('An audit row was deleted through the model.');
        } catch (\LogicException $e) {
            $this->assertStringContainsString('immutable', $e->getMessage());
        }

        $this->assertSame('MONTHLYCHARGE_UPDATED', $row->fresh()->action_type);
    }

    public function test_the_prune_is_a_dry_run_by_default(): void
    {
        $this->row();

        $this->artisan('audit:prune-system')->assertSuccessful();

        $this->assertSame(1, DB::table('audit_logs')->count());
    }

    public function test_the_prune_removes_only_old_observer_system_rows(): void
    {
        $oldObserver = $this->row();
        $youngObserver = $this->row(['created_at' => now()->subDays(10)]);
        $adminObserver = $this->row(['actor' => 'admin:1', 'action_type' => 'ADMIN_USER_UPDATED']);
        $userObserver = $this->row(['actor' => 'user:5', 'action_type' => 'WISHITEM_UPDATED']);
        $explicitSystem = $this->row(['action_type' => 'RISK_DECISION']);
        $platformState = $this->row(['action_type' => 'PLATFORM_STATE_CHANGE']);
        $oldDeleted = $this->row(['action_type' => 'POSTLIKE_DELETED']);

        $this->artisan('audit:prune-system --apply --days=180')->assertSuccessful();

        $remaining = DB::table('audit_logs')->pluck('id')->all();

        $this->assertNotContains($oldObserver->id, $remaining, 'an old observer row survived');
        $this->assertNotContains($oldDeleted->id, $remaining, 'an old observer DELETED row survived');
        $this->assertContains($youngObserver->id, $remaining, 'a row inside the window was pruned');
        $this->assertContains($adminObserver->id, $remaining, 'an ADMIN row was pruned');
        $this->assertContains($userObserver->id, $remaining, 'a USER-actor row was pruned');
        $this->assertContains($explicitSystem->id, $remaining, 'an explicit system decision was pruned');
        $this->assertContains($platformState->id, $remaining, 'a platform state change was pruned');
    }

    public function test_the_noisy_models_are_no_longer_observed(): void
    {
        $source = file_get_contents(app_path('Providers/AppServiceProvider.php'));

        // The list, not the imports: a comment may still name the class.
        preg_match('/\$activityLogModels = \[(.*?)\];/s', $source, $m);
        $this->assertNotEmpty($m, 'activityLogModels list not found');

        foreach (['MonthlyCharge::class', 'SubscriptionEvent::class', 'PostLike::class'] as $model) {
            $this->assertStringNotContainsString(
                $model,
                preg_replace('#/\*.*?\*/#s', '', $m[1]),
                "{$model} is back on the ActivityObserver list — it wrote 98% of audit_logs and none of it was a decision."
            );
        }
    }
}
