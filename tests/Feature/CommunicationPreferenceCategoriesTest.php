<?php

namespace Tests\Feature;

use App\EmailService;
use App\Http\Controllers\EmailPreferenceController;
use App\Mail\CommandFailed;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * The point of separate categories: turning one off must not silence the others,
 * and nothing here may switch off security/legal/transactional mail.
 */
class CommunicationPreferenceCategoriesTest extends TestCase
{
    use RefreshDatabase;

    public function test_categories_default_to_opted_in(): void
    {
        // refresh() because column defaults are applied by the database, so a
        // just-created model still has them null in memory. Every read path
        // falls back to opted-in for exactly that reason.
        $user = User::factory()->create()->refresh();

        foreach (EmailPreferenceController::CATEGORIES as $column) {
            $this->assertTrue((bool) $user->{$column}, "{$column} should default to on");
        }
    }

    public function test_a_user_row_predating_the_columns_is_treated_as_opted_in(): void
    {
        $user = User::factory()->create();

        // Simulate a row written before the migration: attribute absent entirely.
        foreach (EmailPreferenceController::CATEGORIES as $column) {
            unset($user->{$column});
        }

        foreach (EmailPreferenceController::preferencesFor($user) as $value) {
            $this->assertTrue($value, 'A missing preference must default to opted in, never opted out.');
        }
    }

    public function test_turning_off_one_category_leaves_the_others_on(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->post(route('email.preferences.update'), [
            'product_updates_enabled' => false,
        ]);

        $user->refresh();

        $this->assertFalse((bool) $user->product_updates_enabled);
        $this->assertTrue((bool) $user->creator_updates_enabled);
        $this->assertTrue((bool) $user->marketing_emails_enabled);
        $this->assertTrue((bool) $user->reactivation_emails_enabled);
    }

    public function test_partial_submit_does_not_clobber_untouched_categories(): void
    {
        $user = User::factory()->create(['creator_updates_enabled' => false]);

        // Submitting only the marketing switch must leave creator updates as-is.
        $this->actingAs($user)->post(route('email.preferences.update'), [
            'marketing_emails_enabled' => false,
        ]);

        $user->refresh();

        $this->assertFalse((bool) $user->marketing_emails_enabled);
        $this->assertFalse((bool) $user->creator_updates_enabled, 'Untouched category must not be reset.');
        $this->assertNotNull($user->marketing_unsubscribed_at);
    }

    public function test_re_enabling_marketing_clears_the_unsubscribed_timestamp(): void
    {
        $user = User::factory()->create([
            'marketing_emails_enabled' => false,
            'marketing_unsubscribed_at' => now()->subDay(),
        ]);

        $this->actingAs($user)->post(route('email.preferences.update'), [
            'marketing_emails_enabled' => true,
        ]);

        $user->refresh();

        $this->assertTrue((bool) $user->marketing_emails_enabled);
        $this->assertNull($user->marketing_unsubscribed_at);
    }

    public function test_category_unsubscribe_link_turns_off_only_that_category(): void
    {
        $user = User::factory()->create();

        $url = EmailPreferenceController::generateUnsubscribeToken($user, 'creator_updates_enabled');

        $this->get($url)->assertRedirect();

        $user->refresh();

        $this->assertFalse((bool) $user->creator_updates_enabled);
        $this->assertTrue((bool) $user->marketing_emails_enabled, 'A category link must not unsubscribe everything.');
    }

    public function test_unsubscribe_link_without_a_category_still_opts_out_of_marketing(): void
    {
        $user = User::factory()->create();

        $this->get(EmailPreferenceController::generateUnsubscribeToken($user))->assertRedirect();

        $user->refresh();

        $this->assertFalse((bool) $user->marketing_emails_enabled);
        $this->assertNotNull($user->marketing_unsubscribed_at);
    }

    public function test_unsubscribe_rejects_an_unsigned_link(): void
    {
        $user = User::factory()->create();

        $this->get(route('email.unsubscribe', ['user' => $user->id]))->assertRedirect('/');

        $this->assertTrue((bool) $user->fresh()->marketing_emails_enabled);
    }

    public function test_category_email_respects_the_opt_out(): void
    {
        Mail::fake();

        $optedIn = User::factory()->create();
        $optedOut = User::factory()->create(['product_updates_enabled' => false]);

        $mailable = new CommandFailed('Subject', 'Body');

        EmailService::sendCategoryEmail($optedIn, $mailable, 'product_updates_enabled');
        Mail::assertSentCount(1);

        EmailService::sendCategoryEmail($optedOut, $mailable, 'product_updates_enabled');
        Mail::assertSentCount(1, 'An opted-out user must not receive the email.');
    }

    public function test_category_email_refuses_an_unknown_category(): void
    {
        Mail::fake();

        $user = User::factory()->create();

        EmailService::sendCategoryEmail($user, new CommandFailed('Subject', 'Body'), 'not_a_real_category');

        Mail::assertNothingSent();
    }
}
