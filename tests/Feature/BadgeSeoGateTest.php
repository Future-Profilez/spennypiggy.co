<?php

namespace Tests\Feature;

use App\Models\User;
use App\SeoMeta;
use App\Services\SeoTemplateService;
use App\Support\Badges;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 The one test that matters most in this feature.
 *
 * `users.pride_badges` holds GDPR Article 9 special-category data — sexual
 * orientation and gender identity. It sits in its own column precisely so it
 * cannot reach a public meta tag by accident, and this asserts that separation
 * holds rather than trusting a reviewer to remember it.
 *
 * It also covers the pre-existing bug the badge work uncovered: both keyword
 * builders concatenated `users.creator_category` RAW, and that column is JSON —
 * so the literal string `["Musician","Artist"]` was being published as the
 * page's meta keywords.
 */
class BadgeSeoGateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Static tag store, so one test's tags would otherwise be read by the
        // next and every assertion here would pass for the wrong reason.
        SeoMeta::clear();
    }

    private function creator(array $overrides = []): User
    {
        $creator = User::factory()->create(array_merge([
            'role' => 1,
            'profile_status_lock' => 2,
            'name' => 'Priya Raman',
            'bio' => 'Underwater photography from the Andamans.',
            'bio_approved' => 1,
        ], $overrides));

        return $creator->refresh();
    }

    private function keywords(User $creator): string
    {
        SeoTemplateService::setCreatorMeta($creator);

        return (string) SeoMeta::render();
    }

    public function test_interest_badges_are_published_as_readable_labels(): void
    {
        $creator = $this->creator([
            'creator_category' => json_encode(['musician', 'video-creator']),
        ]);

        $rendered = $this->keywords($creator);

        $this->assertStringContainsString('Musician', $rendered);
        $this->assertStringContainsString('Video Creator', $rendered);
    }

    /**
     * The old builder printed the column, and the column is JSON.
     */
    public function test_the_raw_json_column_is_never_printed(): void
    {
        $creator = $this->creator([
            'creator_category' => json_encode(['musician', 'video-creator']),
        ]);

        $rendered = $this->keywords($creator);

        $this->assertStringNotContainsString('["musician"', $rendered);
        $this->assertStringNotContainsString('video-creator', $rendered, 'The slug reached the page instead of the label.');
    }

    /**
     * 🚨 The load-bearing assertion. If this fails, a creator's identity is
     * being published to every crawler and every link unfurl.
     */
    public function test_pride_badges_never_reach_the_meta_tags(): void
    {
        $creator = $this->creator([
            'creator_category' => json_encode(['musician']),
            'pride_badges' => json_encode(['trans', 'lesbian', 'asexual']),
        ]);

        // 🚨 Prove the data EXISTS before asserting it is absent from the page.
        // Without this the test passes just as happily against a column that
        // was never written, which is the worst kind of green.
        $this->assertSame(
            ['trans', 'lesbian', 'asexual'],
            Badges::sanitisePride($creator->pride_badges)
        );

        $rendered = $this->keywords($creator);

        // The creator's chosen interest badge IS published — so a false pass
        // here cannot come from the whole keyword line being empty.
        $this->assertStringContainsString('Musician', $rendered);

        foreach (['trans', 'Trans', 'lesbian', 'Lesbian', 'asexual', 'Asexual', 'pride_badges'] as $needle) {
            $this->assertStringNotContainsString(
                $needle,
                $rendered,
                "'{$needle}' is special-category data and must never reach a meta tag."
            );
        }
    }

    public function test_the_person_schema_carries_no_pride_badge(): void
    {
        $creator = $this->creator([
            'pride_badges' => json_encode(['genderfluid']),
        ]);

        $schema = json_encode(SeoTemplateService::generatePersonSchema($creator));

        $this->assertStringNotContainsStringIgnoringCase('genderfluid', (string) $schema);
    }

    public function test_a_creator_with_no_badges_still_gets_valid_keywords(): void
    {
        $creator = $this->creator(['creator_category' => null]);

        $rendered = $this->keywords($creator);

        $this->assertStringContainsString('Spenny Piggy', $rendered);
        // No trailing separator left behind by an empty badge list.
        $this->assertStringNotContainsString(', "', $rendered);
    }

    /**
     * A creator carrying a value nobody offers any more — a badge removed from
     * the list, or a legacy free-text value — must not have it published.
     */
    public function test_an_unknown_stored_value_is_not_published(): void
    {
        $creator = $this->creator([
            'creator_category' => json_encode(['musician', 'buy me a coffee']),
        ]);

        $rendered = $this->keywords($creator);

        $this->assertStringContainsString('Musician', $rendered);
        $this->assertStringNotContainsStringIgnoringCase('coffee', $rendered);
    }

    public function test_the_keyword_line_cannot_grow_past_the_cap(): void
    {
        // A stored value that predates the cap must not print ten badges into
        // a meta tag just because the column happens to hold ten.
        $creator = $this->creator([
            'creator_category' => json_encode(Badges::interestSlugs()),
        ]);

        $labels = Badges::labels($creator->creator_category);

        $this->assertCount(Badges::MAX_INTERESTS, $labels);
    }
}
