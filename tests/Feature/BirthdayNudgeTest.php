<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\PromoBannerService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * 🚨 A BUILT FEATURE NOBODY CAN FIND IS NOT A SHIPPED FEATURE.
 *
 * Birthday Discovery works end to end — opt-in, three supporter reminders, the
 * Monday campaign, the collection page — and until 24 Aug 2026 NOTHING told a
 * creator it existed. The switch is inside Creator Studio on the account page, so
 * it was found only by wandering through settings. Without opt-ins the collection
 * has nobody in it and the campaign has nobody to feature, so the whole feature
 * sits idle no matter how correct the code is.
 */
class BirthdayNudgeTest extends TestCase
{
    use RefreshDatabase;

    private function deckFor(?User $user): array
    {
        Cache::flush();

        return array_column(app(PromoBannerService::class)->for($user)['banners'], 'key');
    }

    private function creator(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'suspended_account' => 0,
        ], $attributes));
    }

    public function test_a_creator_who_has_not_opted_in_is_told_the_feature_exists(): void
    {
        $creator = $this->creator();
        $creator->forceFill([
            'birthday_discovery_opt_in' => false,
            'birthday_month' => null,
        ])->save();

        $this->assertContains('birthday_discovery', $this->deckFor($creator));
    }

    /** ⚠️ Once they act, the card describes a state they have left. */
    public function test_the_card_disappears_once_they_have_opted_in(): void
    {
        $creator = $this->creator();
        $creator->forceFill([
            'birthday_day' => 12,
            'birthday_month' => 3,
            'birthday_discovery_opt_in' => true,
        ])->save();

        $this->assertNotContains('birthday_discovery', $this->deckFor($creator));
    }

    /**
     * 🚨 THE SWITCH ALONE IS NOT ENOUGH. `ProfileController` refuses the opt-in
     * when no date is on file, so `birthday_discovery_opt_in` can read true with
     * nothing behind it — and that creator would never appear in the collection
     * while being told there is nothing left to do.
     */
    public function test_an_opt_in_with_no_date_still_gets_the_card(): void
    {
        $creator = $this->creator();
        $creator->forceFill([
            'birthday_discovery_opt_in' => true,
            'birthday_month' => null,
        ])->save();

        $this->assertContains('birthday_discovery', $this->deckFor($creator));
    }

    /** ⚠️ A supporter has no profile to add a birthday to. */
    public function test_a_gifter_is_never_shown_it(): void
    {
        $gifter = $this->creator(['role' => 0]);

        $this->assertNotContains('birthday_discovery', $this->deckFor($gifter));
    }
}
