<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;
use App\Models\User;

class LogViewerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create a sample log file for testing
        $logPath = storage_path('logs/laravel.log');
        $logContent = '[2024-01-01 10:00:00] production.ERROR: Test error message
Stack trace:
#0 /path/to/file.php(123): TestClass->testMethod()

[2024-01-01 10:01:00] production.INFO: Test info message
[2024-01-01 10:02:00] production.WARNING: Test warning message
[2024-01-01 10:03:00] production.DEBUG: Test debug message';

        File::ensureDirectoryExists(dirname($logPath));
        File::put($logPath, $logContent);
    }

    protected function tearDown(): void
    {
        // Clean up test log file
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::delete($logPath);
        }
        
        parent::tearDown();
    }

    public function test_unauthorized_user_cannot_access_logs()
    {
        $response = $this->get('/debug/logs');

        $response->assertRedirect('/login');
    }

    public function test_non_admin_user_cannot_access_logs_in_production()
    {
        // Set environment to production
        config(['app.env' => 'production']);
        
        $user = User::factory()->create(['role' => 1]); // Non-admin role

        $response = $this->actingAs($user)->get('/debug/logs');

        $response->assertStatus(403);
    }

    public function test_admin_user_can_access_logs()
    {
        $admin = User::factory()->create(['role' => 0]); // Admin role

        $response = $this->actingAs($admin)->get('/debug/logs');

        $response->assertStatus(200);
        $response->assertViewIs('logs.index');
        $response->assertViewHas(['logs', 'pagination', 'search', 'level']);
    }

    public function test_user_can_access_logs_with_valid_debug_token()
    {
        config(['app.env' => 'production']);
        config(['app.debug_token' => 'test-debug-token-123']);
        
        $user = User::factory()->create(['role' => 1]); // Non-admin role

        $response = $this->actingAs($user)->get('/debug/logs?debug_token=test-debug-token-123');

        $response->assertStatus(200);
    }

    public function test_user_cannot_access_logs_with_invalid_debug_token()
    {
        config(['app.env' => 'production']);
        config(['app.debug_token' => 'test-debug-token-123']);
        
        $user = User::factory()->create(['role' => 1]);

        $response = $this->actingAs($user)->get('/debug/logs?debug_token=invalid-token');

        $response->assertStatus(403);
    }

    public function test_logs_are_displayed_correctly()
    {
        $admin = User::factory()->create(['role' => 0]);

        $response = $this->actingAs($admin)->get('/debug/logs');

        $response->assertStatus(200);
        $response->assertSeeText('Test error message');
        $response->assertSeeText('Test info message');
        $response->assertSeeText('Test warning message');
        $response->assertSeeText('Test debug message');
    }

    public function test_log_filtering_by_level_works()
    {
        $admin = User::factory()->create(['role' => 0]);

        $response = $this->actingAs($admin)->get('/debug/logs?level=error');

        $response->assertStatus(200);
        $response->assertSeeText('Test error message');
        $response->assertDontSeeText('Test info message');
    }

    public function test_log_search_functionality_works()
    {
        $admin = User::factory()->create(['role' => 0]);

        $response = $this->actingAs($admin)->get('/debug/logs?search=warning');

        $response->assertStatus(200);
        $response->assertSeeText('Test warning message');
        $response->assertDontSeeText('Test error message');
    }

    public function test_log_download_functionality()
    {
        $admin = User::factory()->create(['role' => 0]);

        $response = $this->actingAs($admin)->get('/debug/logs/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/octet-stream');
    }

    public function test_non_production_environment_allows_any_authenticated_user()
    {
        config(['app.env' => 'local']);
        
        $user = User::factory()->create(['role' => 1]); // Non-admin role

        $response = $this->actingAs($user)->get('/debug/logs');

        $response->assertStatus(200);
    }

    public function test_log_clear_functionality()
    {
        $admin = User::factory()->create(['role' => 0]);

        $response = $this->actingAs($admin)->post('/debug/logs/clear');

        $response->assertRedirect('/debug/logs');
        $response->assertSessionHas('success', 'Log file cleared successfully.');

        // Check that log file is empty
        $logPath = storage_path('logs/laravel.log');
        $this->assertEquals('', File::get($logPath));
    }

    public function test_missing_log_file_shows_appropriate_message()
    {
        // Delete the log file
        $logPath = storage_path('logs/laravel.log');
        if (File::exists($logPath)) {
            File::delete($logPath);
        }

        $admin = User::factory()->create(['role' => 0]);

        $response = $this->actingAs($admin)->get('/debug/logs');

        $response->assertStatus(200);
        $response->assertViewHas('message', 'Log file not found.');
    }
}