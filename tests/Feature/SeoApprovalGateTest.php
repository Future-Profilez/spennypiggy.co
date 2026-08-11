<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\SeoTemplateService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Meta is the most public surface the platform has: printed in search results and
 * baked into every link unfurl. None of these templates checked an approval flag,
 * so an unreviewed bio and photo reached every crawler and every chat app through
 * `meta description`, `og:image`, `twitter:image` and the Person schema.
 *
 * A card that has already been unfurled into a group chat cannot be moderated
 * afterwards, which is what makes this different from the same content on a page.
 */
class SeoApprovalGateTest extends TestCase
{
    use RefreshDatabase;

    private function creator(array $overrides = []): User
    {
        return User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'name' => 'Priya Raman',
            'bio' => 'Underwater photography from the Andamans.',
            'bio_approved' => 1,
            'avatar' => '11111111-1111-4111-8111-111111111111',
            'avatar_approved' => 1,
            'cover' => '22222222-2222-4222-8222-222222222222',
            'cover_approved' => 1,
        ], $overrides))->refresh();
    }

    public function test_an_approved_bio_is_published_in_the_description(): void
    {
        $creator = $this->creator();

        $this->assertStringContainsString(
            'Underwater photography',
            SeoTemplateService::getCreatorDescription($creator)
        );
    }

    public function test_an_unapproved_bio_never_reaches_the_description_or_the_schema(): void
    {
        $creator = $this->creator([
            'bio' => 'Message me on telegram @notvetted',
            'bio_approved' => 0,
        ]);

        $this->assertStringNotContainsString('telegram', SeoTemplateService::getCreatorDescription($creator));
        $this->assertStringNotContainsString(
            'telegram',
            SeoTemplateService::generatePersonSchema($creator)['description']
        );
    }

    public function test_a_rejected_bio_never_reaches_the_description(): void
    {
        $creator = $this->creator(['bio' => 'Rejected wording.', 'bio_approved' => 2]);

        $this->assertStringNotContainsString('Rejected wording', SeoTemplateService::getCreatorDescription($creator));
    }

    public function test_an_unapproved_avatar_is_not_used_as_the_schema_image(): void
    {
        $creator = $this->creator(['avatar_approved' => 0]);

        $this->assertArrayNotHasKey('image', SeoTemplateService::generatePersonSchema($creator));
    }

    public function test_the_og_image_falls_back_rather_than_publishing_unapproved_media(): void
    {
        $creator = $this->creator([
            'social_image' => null,
            'cover_approved' => 0,
            'avatar_approved' => 0,
        ]);

        $this->assertSame(url('/og-image.png'), SeoTemplateService::getCreatorOgImage($creator));
    }

    public function test_the_announcement_card_inherits_the_avatars_approval(): void
    {
        // The card is generated FROM the avatar and carries no flag of its own, so
        // an unreviewed photo would otherwise reach every unfurl inside a 1200x630
        // card instead of on its own.
        $creator = $this->creator([
            'social_image' => '44444444-4444-4444-8444-444444444444',
            'avatar_approved' => 0,
            'cover_approved' => 0,
        ]);

        $this->assertSame(url('/og-image.png'), SeoTemplateService::getCreatorOgImage($creator));

        $creator->forceFill(['avatar_approved' => 1])->saveQuietly();

        $this->assertStringContainsString(
            '44444444-4444-4444-8444-444444444444',
            SeoTemplateService::getCreatorOgImage($creator->refresh())
        );
    }

    public function test_it_fails_closed_when_the_flag_column_was_not_selected(): void
    {
        // Unlike `User::profileMediaVisible()`, which treats an unselected column as
        // visible, an unanswerable question here means "do not publish".
        $creator = $this->creator();
        $partial = User::query()->select(['id', 'name', 'username', 'bio', 'avatar'])->find($creator->id);

        $this->assertStringNotContainsString('Underwater photography', SeoTemplateService::getCreatorDescription($partial));
        $this->assertArrayNotHasKey('image', SeoTemplateService::generatePersonSchema($partial));
    }
}
