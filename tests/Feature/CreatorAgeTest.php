<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\CreatorAge;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 A DATE OF BIRTH THIS PLATFORM ACCEPTED, STRIPE REFUSED — AND THE CREATOR
 * COULD NOT BE PAID (Sentry JAVASCRIPT-REACT-C6, 13 Sep 2026).
 *
 * `accounts->create` answered "Must be at least 13 years of age to use Stripe"
 * and the whole Connect account failed. The date came from us: the profile form
 * validated `date_of_birth` as `before:today`, so YESTERDAY was a legal value, on
 * a platform whose Terms require 18+ and whose shop form makes a creator tick a
 * box saying so.
 */
class CreatorAgeTest extends TestCase
{
    use RefreshDatabase;

    /** 🚨 The bug itself: the app accepted a date that made the creator a child. */
    public function test_a_profile_cannot_save_a_date_of_birth_under_eighteen(): void
    {
        $user = User::factory()->create(['role' => 1]);

        $this->actingAs($user)
            ->from('/account-setting')
            ->post(route('edit-profile'), [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'date_of_birth' => now()->subYears(10)->toDateString(),
            ])
            ->assertSessionHasErrors('date_of_birth');

        $this->assertNull($user->fresh()->date_of_birth);
    }

    /** ⚠️ The control — an adult still saves, or the fix has broken the field. */
    public function test_an_adult_date_of_birth_is_still_accepted(): void
    {
        $user = User::factory()->create(['role' => 1]);
        $dob = now()->subYears(30)->toDateString();

        $this->actingAs($user)
            ->from('/account-setting')
            ->post(route('edit-profile'), [
                'name' => $user->name,
                'username' => $user->username,
                'email' => $user->email,
                'date_of_birth' => $dob,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame($dob, $user->fresh()->date_of_birth?->toDateString());
    }

    /** ⚠️ The boundary is the rule, not a number typed twice. */
    public function test_exactly_eighteen_today_is_old_enough(): void
    {
        $this->assertTrue(CreatorAge::meetsPlatformMinimum(now()->subYears(18)->toDateString()));
        $this->assertFalse(CreatorAge::meetsPlatformMinimum(now()->subYears(18)->addDay()->toDateString()));
    }

    /**
     * 🚨 THE HALF THAT SAVES THE CREATORS ALREADY CARRYING A BAD DATE. The prefill
     * is a convenience and must never be the reason an account cannot be created.
     */
    public function test_a_date_stripe_would_refuse_is_never_sent(): void
    {
        $this->assertTrue(CreatorAge::stripeWouldRefuse(now()->subYears(5)->toDateString()));

        $this->assertStringContainsString(
            'CreatorAge::stripeWouldRefuse',
            (string) file_get_contents(base_path('app/Http/Controllers/Auth/StripeController.php')),
            'The dob prefill no longer screens the date, so one bad row fails the whole Connect account again.'
        );
    }

    /**
     * ⚠️ THE TWO FLOORS ARE DIFFERENT QUESTIONS. A row saved before the profile
     * rule existed can sit between 13 and 18 — Stripe accepts those, so they are
     * still prefilled rather than silently dropped.
     */
    public function test_a_row_between_the_two_floors_is_still_sent(): void
    {
        $sixteen = now()->subYears(16)->toDateString();

        $this->assertFalse(CreatorAge::meetsPlatformMinimum($sixteen));
        $this->assertFalse(CreatorAge::stripeWouldRefuse($sixteen));
    }

    /** ⚠️ No date on file is not a refusal — it is the ordinary case. */
    public function test_no_date_on_file_refuses_nothing(): void
    {
        $this->assertTrue(CreatorAge::meetsPlatformMinimum(null));
        $this->assertFalse(CreatorAge::stripeWouldRefuse(null));
        $this->assertFalse(CreatorAge::stripeWouldRefuse('not a date'));
    }

    /**
     * 🚨 "Try again in a minute" is FALSE for a permanent refusal, and it is what
     * the creator does next — three attempts in 28 seconds.
     */
    public function test_a_permanent_refusal_names_the_profile_instead_of_a_retry(): void
    {
        $source = (string) file_get_contents(base_path('app/Http/Controllers/Auth/StripeController.php'));

        $this->assertStringContainsString('years of age', $source);
        $this->assertStringContainsString('date of birth on your profile', $source);
    }
}
