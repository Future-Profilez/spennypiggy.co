<?php

namespace Tests\Feature;

use App\Mail\FeatureSuggestionStatusMail;
use App\Models\FeatureSuggestion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class FeatureSuggestionTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_store_suggestion(): void
    {
        Mail::fake();

        $response = $this->post(route('feature-suggestion.store'), [
            'suggestion' => 'This is a test feature suggestion from a guest.',
            'name' => 'Guest User',
            'email' => 'guest@example.com',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('feature_suggestions', [
            'suggestion' => 'This is a test feature suggestion from a guest.',
            'name' => 'Guest User',
            'email' => 'guest@example.com',
            'user_id' => null,
            'status' => 'pending',
        ]);
    }

    public function test_user_can_store_suggestion_prefilled(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'name' => 'Authenticated User',
            'email' => 'user@example.com',
        ]);

        $response = $this->actingAs($user)->post(route('feature-suggestion.store'), [
            'suggestion' => 'I would love to see an upvote system.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('feature_suggestions', [
            'suggestion' => 'I would love to see an upvote system.',
            'user_id' => $user->id,
            'name' => null,
            'email' => null,
            'status' => 'pending',
        ]);
    }

    public function test_user_can_store_suggestion_with_explicit_name_and_email(): void
    {
        Mail::fake();

        $user = User::factory()->create([
            'name' => 'Original Name',
            'email' => 'original@example.com',
        ]);

        $response = $this->actingAs($user)->post(route('feature-suggestion.store'), [
            'suggestion' => 'Custom feedback',
            'name' => 'Override Name',
            'email' => 'override@example.com',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('feature_suggestions', [
            'suggestion' => 'Custom feedback',
            'user_id' => $user->id,
            'name' => 'Override Name',
            'email' => 'override@example.com',
            'status' => 'pending',
        ]);
    }

    public function test_updating_status_validation_accepts_accepted(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 2]);
        $suggestion = FeatureSuggestion::create([
            'suggestion' => 'Example suggestion',
            'status' => 'pending',
            'email' => 'test@example.com',
        ]);

        $response = $this->actingAs($admin)->patch(route('admin.feature-suggestions.update-status', $suggestion->id), [
            'status' => 'accepted',
            'admin_notes' => 'Great idea, we accepted it!',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('feature_suggestions', [
            'id' => $suggestion->id,
            'status' => 'accepted',
            'admin_notes' => 'Great idea, we accepted it!',
        ]);

        // Email should be sent because the user is guest (null user relation, so receives email by default)
        Mail::assertSent(FeatureSuggestionStatusMail::class, function ($mail) use ($suggestion) {
            return $mail->hasTo('test@example.com') && $mail->suggestion->status === 'accepted';
        });
    }

    public function test_updating_status_sends_email_according_to_notification_preferences(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 2]);

        // User with email notifications disabled
        $userWithNoNotification = User::factory()->create([
            'notification_send' => 0,
            'email' => 'nonotif@example.com',
        ]);

        $suggestion1 = FeatureSuggestion::create([
            'user_id' => $userWithNoNotification->id,
            'suggestion' => 'Suggestion 1',
            'status' => 'pending',
        ]);

        // User with email notifications enabled
        $userWithNotification = User::factory()->create([
            'notification_send' => 1,
            'email' => 'notif@example.com',
        ]);

        $suggestion2 = FeatureSuggestion::create([
            'user_id' => $userWithNotification->id,
            'suggestion' => 'Suggestion 2',
            'status' => 'pending',
        ]);

        // 1. Update suggestion 1 (No notification expected)
        $response1 = $this->actingAs($admin)->patch(route('admin.feature-suggestions.update-status', $suggestion1->id), [
            'status' => 'under_review',
        ]);
        $response1->assertRedirect();
        Mail::assertNotSent(FeatureSuggestionStatusMail::class);

        // 2. Update suggestion 2 (Notification expected)
        $response2 = $this->actingAs($admin)->patch(route('admin.feature-suggestions.update-status', $suggestion2->id), [
            'status' => 'planned',
        ]);
        $response2->assertRedirect();
        Mail::assertSent(FeatureSuggestionStatusMail::class, function ($mail) {
            return $mail->hasTo('notif@example.com') && $mail->suggestion->status === 'planned';
        });
    }

    public function test_mail_subject_mapping(): void
    {
        $suggestion = new FeatureSuggestion(['status' => 'accepted']);
        $mail = new FeatureSuggestionStatusMail($suggestion);
        $envelope = $mail->envelope();
        $this->assertEquals('Great news! Your idea has been accepted - Spenny Piggy', $envelope->subject);

        $suggestion->status = 'planned';
        $mail = new FeatureSuggestionStatusMail($suggestion);
        $envelope = $mail->envelope();
        $this->assertEquals('Great news! Your idea is planned - Spenny Piggy', $envelope->subject);
    }
}
