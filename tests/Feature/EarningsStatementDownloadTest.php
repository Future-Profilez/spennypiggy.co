<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class EarningsStatementDownloadTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login()
    {
        $response = $this->get(route('financial.statement.download', [
            'period' => 'month', 'month' => '2026-06', 'format' => 'csv',
        ]));

        $response->assertRedirect();
    }

    public function test_invalid_period_is_rejected()
    {
        $this->actingAs(User::factory()->create(['uuid' => (string) Str::uuid()]));

        $response = $this->getJson(route('financial.statement.download', [
            'period' => 'weekly', 'format' => 'csv',
        ]));

        $response->assertStatus(422);
    }

    public function test_custom_range_requires_valid_dates()
    {
        $this->actingAs(User::factory()->create(['uuid' => (string) Str::uuid()]));

        // to before from → validation error
        $response = $this->getJson(route('financial.statement.download', [
            'period' => 'custom', 'from' => '2026-06-30', 'to' => '2026-06-01', 'format' => 'csv',
        ]));

        $response->assertStatus(422);
    }

    public function test_custom_range_over_a_year_is_rejected()
    {
        $this->actingAs(User::factory()->create(['uuid' => (string) Str::uuid()]));

        $response = $this->getJson(route('financial.statement.download', [
            'period' => 'custom', 'from' => '2024-01-01', 'to' => '2026-01-01', 'format' => 'csv',
        ]));

        $response->assertStatus(422);
    }

    public function test_csv_statement_downloads_for_user_with_no_activity()
    {
        $this->actingAs(User::factory()->create(['uuid' => (string) Str::uuid()]));

        $response = $this->get(route('financial.statement.download', [
            'period' => 'month', 'month' => '2026-06', 'format' => 'csv',
        ]));

        $response->assertOk();
        $response->assertHeader('Content-type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('Spenny Piggy Earnings Statement', $csv);
        $this->assertStringContainsString('Gross earnings', $csv);
        $this->assertStringContainsString('Profit', $csv);
    }

    public function test_month_period_resolves_correct_month_even_on_day_overflow()
    {
        // Regression: 'Y-m' parsing inherits the current day-of-month; on Jan 31 a
        // request for Feb would overflow into March. Freeze time to the worst case.
        Carbon::setTestNow('2026-01-31 12:00:00');

        $this->actingAs(User::factory()->create(['uuid' => (string) Str::uuid()]));

        $response = $this->get(route('financial.statement.download', [
            'period' => 'month', 'month' => '2026-02', 'format' => 'csv',
        ]));

        $response->assertOk();
        $csv = $response->streamedContent();
        $this->assertStringContainsString('February 2026', $csv);
        $this->assertStringContainsString('01 Feb 2026', $csv);
        $this->assertStringContainsString('28 Feb 2026', $csv);

        Carbon::setTestNow();
    }

    public function test_pdf_statement_downloads_for_user_with_no_activity()
    {
        $this->actingAs(User::factory()->create(['uuid' => (string) Str::uuid()]));

        $response = $this->get(route('financial.statement.download', [
            'period' => 'month', 'month' => '2026-06', 'format' => 'pdf',
        ]));

        $response->assertOk();
        $this->assertStringStartsWith('%PDF', $response->getContent());
    }
}
