<?php

namespace Tests\Feature;

use App\Jobs\GenerateCreatorWatermark;
use App\Models\User;
use App\Services\CreatorWatermarkService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * When the platform is allowed to SPEND on Uploadcare.
 *
 * Rendering a watermark uploads a file per creator. The feature ships disabled,
 * so nothing here may reach Uploadcare until someone deliberately switches it
 * on — otherwise the day it deploys the daily sweep bills the account for images
 * nothing will stamp.
 */
class CreatorWatermarkGenerationTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $attributes = []): User
    {
        $user = new User;
        $user->forceFill(array_merge([
            'name' => 'Test Creator',
            'username' => 'testcreator'.uniqid(),
            'email' => uniqid().'@example.com',
            'password' => bcrypt('secret-password'),
            'role' => 1,
        ], $attributes))->save();

        return $user->refresh();
    }

    public function test_the_scheduled_sweep_renders_nothing_while_the_feature_is_off(): void
    {
        config(['media.watermark.enabled' => false]);
        Queue::fake();

        $this->creator();

        $this->artisan('watermarks:generate')
            ->expectsOutputToContain('Nothing rendered')
            ->assertSuccessful();

        Queue::assertNothingPushed();
    }

    /**
     * The pre-warm path: populate every creator BEFORE flipping the flag, so
     * nobody sees a half-stamped site.
     */
    public function test_force_queues_work_even_while_the_feature_is_off(): void
    {
        config(['media.watermark.enabled' => false]);
        Queue::fake();

        $creator = $this->creator();

        $this->artisan('watermarks:generate --force')->assertSuccessful();

        Queue::assertPushed(
            GenerateCreatorWatermark::class,
            fn ($job) => $job->userId === $creator->id && $job->force === true
        );
    }

    public function test_the_job_uploads_nothing_while_the_feature_is_off(): void
    {
        config(['media.watermark.enabled' => false]);

        $creator = $this->creator();

        // A real render would call Uploadcare. Reaching the service at all is
        // the failure this asserts against.
        $service = new class extends CreatorWatermarkService
        {
            public bool $touched = false;

            public function needsGeneration(User $user): bool
            {
                $this->touched = true;

                return true;
            }

            public function generate(User $user): ?string
            {
                $this->touched = true;

                return null;
            }
        };

        (new GenerateCreatorWatermark($creator->id))->handle($service);

        $this->assertFalse($service->touched);
    }

    public function test_a_new_creator_is_queued_rather_than_waiting_for_the_daily_sweep(): void
    {
        config(['media.watermark.enabled' => true]);
        Queue::fake();

        $creator = $this->creator();

        Queue::assertPushed(
            GenerateCreatorWatermark::class,
            fn ($job) => $job->userId === $creator->id
        );
    }

    public function test_a_new_supporter_is_never_queued(): void
    {
        config(['media.watermark.enabled' => true]);
        Queue::fake();

        $this->creator(['role' => 0]);

        Queue::assertNotPushed(GenerateCreatorWatermark::class);
    }

    /**
     * A rename does not make the PNG stale, it makes it WRONG — it prints a
     * profile URL that then 404s.
     */
    public function test_a_rename_re_renders_the_watermark(): void
    {
        config(['media.watermark.enabled' => true]);

        $creator = $this->creator();

        Queue::fake();
        $creator->forceFill(['username' => 'renamed'.uniqid()])->save();

        Queue::assertPushed(
            GenerateCreatorWatermark::class,
            fn ($job) => $job->userId === $creator->id && $job->force === true
        );
    }

    public function test_a_rename_queues_nothing_while_the_feature_is_off(): void
    {
        config(['media.watermark.enabled' => false]);

        $creator = $this->creator();

        Queue::fake();
        $creator->forceFill(['username' => 'renamed'.uniqid()])->save();

        Queue::assertNothingPushed();
    }

    /**
     * The handle the PNG was rendered with is what makes a rename detectable.
     */
    public function test_needs_generation_tracks_the_handle_not_just_presence(): void
    {
        $service = app(CreatorWatermarkService::class);
        $creator = $this->creator(['username' => 'stable_handle']);

        $this->assertTrue($service->needsGeneration($creator));

        $creator->forceFill([
            'watermark_uuid' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            'watermark_for_username' => 'stable_handle',
        ])->saveQuietly();

        $this->assertFalse($service->needsGeneration($creator->refresh()));

        $creator->forceFill(['username' => 'new_handle'])->saveQuietly();

        $this->assertTrue($service->needsGeneration($creator->refresh()));
    }

    public function test_a_supporter_never_needs_a_watermark(): void
    {
        $service = app(CreatorWatermarkService::class);

        $this->assertFalse($service->needsGeneration($this->creator(['role' => 0])));
    }
}
