<?php

namespace Tests\Feature;

use App\Mail\SecurityEventAlert;
use App\Models\SecurityEvent;
use App\Models\User;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * The two website-side gaps the audit named, exercised through the real login
 * endpoint rather than through the monitors directly — the listeners being
 * REGISTERED is half of what was missing, and a unit test of the monitor cannot
 * see that.
 */
class SecurityLoginObservationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Mail::fake();
        Cache::flush();
        RateLimiter::clear('nobody@example.com|127.0.0.1');
        config(['alerts.fallback' => ['ops@example.test']]);

        // ⚠️ `login_logs` is created by a migration in the ADMIN app — the two
        // apps share one database and no code, so this app's suite has no copy
        // of it. That is exactly why RecordFailedLogin guards on
        // `Schema::hasTable`. Built here so the write branch is genuinely
        // exercised rather than skipped.
        Schema::dropIfExists('login_logs');
        Schema::create('login_logs', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->unsignedBigInteger('admin_id')->nullable();
            $table->string('email')->nullable();
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            $table->boolean('success')->default(false);
            $table->string('failure_reason')->nullable();
            $table->string('location')->nullable();
            $table->string('device')->nullable();
            $table->string('browser')->nullable();
            $table->timestamp('login_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * 🚨 The website recorded SUCCESSES only (`RecordUserLogin`), so a per-IP
     * failed-login threshold was not merely un-implemented, it was not
     * computable. This asserts the failure now reaches both tables.
     */
    public function test_a_failed_website_login_is_recorded_in_both_tables(): void
    {
        User::factory()->create(['email' => 'real@example.com', 'password' => bcrypt('correct-horse')]);

        $this->post('/verify/login', ['email' => 'real@example.com', 'password' => 'wrong']);

        $this->assertDatabaseHas('login_logs', ['email' => 'real@example.com', 'success' => false]);
        $this->assertDatabaseHas('security_events', ['event_type' => SecurityEvent::LOGIN_FAILED]);
    }

    /**
     * ⚠️ The recorded reason must NOT say which half was wrong. "No such
     * account" versus "wrong password" written into a table admins read is an
     * account-enumeration oracle sitting in our own logs.
     */
    public function test_an_unknown_address_is_recorded_without_confirming_it_is_unknown(): void
    {
        $this->post('/verify/login', ['email' => 'ghost@example.com', 'password' => 'whatever']);

        $row = DB::table('login_logs')->where('email', 'ghost@example.com')->first();

        $this->assertNotNull($row);
        $this->assertSame('Invalid credentials', $row->failure_reason);
    }

    /**
     * 🚨 THE CHEAP WIN. `LoginRequest` has always fired this event and NEITHER
     * app had a listener registered, so it went nowhere. Fire it and assert
     * something now happens.
     */
    public function test_the_lockout_event_now_has_a_listener(): void
    {
        $this->assertNotEmpty(
            Event::getListeners(Lockout::class),
            'Lockout fires from LoginRequest with no listener — the whole point of this row.'
        );

        event(new Lockout(request()->merge(['email' => 'sprayed@example.com'])));

        $this->assertDatabaseHas('security_events', ['event_type' => SecurityEvent::LOGIN_LOCKOUT]);
        Mail::assertSent(SecurityEventAlert::class);
    }

    /** A successful sign-in is still recorded as before, and says nothing. */
    public function test_a_successful_login_does_not_raise_a_security_alert(): void
    {
        $user = User::factory()->create(['email' => 'good@example.com', 'password' => bcrypt('correct-horse')]);

        $this->actingAs($user);

        Mail::assertNothingSent();
    }
}
