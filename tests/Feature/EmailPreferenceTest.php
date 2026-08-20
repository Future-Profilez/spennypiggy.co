<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class EmailPreferenceTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_preferences_page_shows_for_authenticated_user()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('email.preferences'));

        $response->assertStatus(200);
    }

    public function test_email_preferences_update_toggles_flag_and_logs_change()
    {
        $user = User::factory()->create([
            'marketing_emails_enabled' => true,
        ]);

        $response = $this->actingAs($user)
            ->post(route('email.preferences.update'), [
                'marketing_emails_enabled' => false,
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'marketing_emails_enabled' => false,
        ]);

        // Check that a log entry was created
        $this->assertDatabaseHas('email_preference_logs', [
            'user_id' => $user->id,
            'old_value' => 1,
            'new_value' => 0,
            'source' => 'settings_page',
        ]);
    }

    public function test_unsubscribe_link_disables_marketing_emails_and_logs()
    {
        $user = User::factory()->create([
            'marketing_emails_enabled' => true,
        ]);

        // Generate a signed URL for unsubscribe
        $url = URL::temporarySignedRoute(
            'email.unsubscribe',
            now()->addHours(24),
            ['user' => $user->id]
        );

        // Extract the user id from the URL (the route expects {user})
        // In our route, the URL will be like /unsubscribe/1?signature=...
        // We can get the user id from the user object.

        $response = $this->get($url);

        /*
         * ⚠️ THE OPT-OUT IS WRITTEN BEFORE THE REDIRECT EITHER WAY — that is
         * what is asserted below. The destination depends on whether the signed
         * preference-centre route is registered: `/` while it is not, and the
         * centre itself once it is, so somebody who wanted to stop ONE thing can
         * see what else is still on instead of being dropped on the homepage.
         */
        $response->assertRedirect();
        $target = (string) $response->headers->get('Location');
        $this->assertTrue(
            $target === url('/') || str_contains($target, '/email-preferences/manage/'),
            'Unsubscribe must land on the homepage or the signed preference centre, got: '.$target
        );
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'marketing_emails_enabled' => false,
        ]);

        // Check that a log entry was created
        $this->assertDatabaseHas('email_preference_logs', [
            'user_id' => $user->id,
            'old_value' => 1,
            'new_value' => 0,
            'source' => 'unsubscribe_link',
        ]);
    }

    /**
     * ⚠️ Renamed: links now live for `EmailPreferenceController::LINK_TTL_DAYS`
     * (30 days), not 24 hours. What this pins is the thing that still matters —
     * an EXPIRED link is refused, whatever the window is. The URL below is
     * hand-built with an expiry in the past for exactly that reason.
     */
    public function test_an_expired_unsubscribe_link_is_rejected()
    {
        $user = User::factory()->create([
            'marketing_emails_enabled' => true,
        ]);

        // Generate a signed URL that expired 1 hour ago
        $url = URL::temporarySignedRoute(
            'email.unsubscribe',
            now()->subHour(), // expired 1 hour ago
            ['user' => $user->id]
        );

        $response = $this->get($url);

        $response->assertRedirect('/');
        $response->assertSessionHas('error');
        // The user's preference should remain unchanged
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'marketing_emails_enabled' => true,
        ]);
    }
}
