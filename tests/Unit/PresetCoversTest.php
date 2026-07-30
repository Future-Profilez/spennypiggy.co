<?php

namespace Tests\Unit;

use App\Support\PresetCovers;
use Tests\TestCase;

/**
 * The curated list decides two things that are invisible until they go wrong:
 * which covers skip the moderation scan, and which one a new creator lands on.
 */
class PresetCoversTest extends TestCase
{
    public function test_curated_covers_skip_the_moderation_queue(): void
    {
        $this->assertTrue(PresetCovers::isPreApproved('56c67c16-29da-47ec-a381-fa6423233f64'));
        $this->assertTrue(PresetCovers::isPreApproved('dc1021e2-41a4-4dfa-8379-b27fb7e3834e'));
        $this->assertFalse(PresetCovers::isPreApproved('11111111-2222-3333-4444-555555555555'));
        $this->assertFalse(PresetCovers::isPreApproved(null));
    }

    public function test_signup_assigns_from_the_named_covers_only(): void
    {
        $pool = PresetCovers::signupPool();

        $this->assertSame(array_keys(PresetCovers::COVERS), $pool);
        $this->assertNotEmpty($pool);

        foreach ($pool as $uuid) {
            $this->assertTrue(PresetCovers::isPreApproved($uuid));
        }
    }

    public function test_the_fan_default_is_itself_a_curated_cover(): void
    {
        // Signup writes `cover_approved => 1` for every new account, so a fan
        // default that is not on the curated list would be marked approved
        // without ever having been reviewed.
        $this->assertTrue(PresetCovers::isPreApproved(PresetCovers::FAN_DEFAULT));
    }

    public function test_every_cover_has_a_label_and_a_known_category(): void
    {
        foreach (PresetCovers::COVERS as $uuid => [$label, $category]) {
            $this->assertMatchesRegularExpression(
                '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/',
                $uuid,
                'Cover key must be an Uploadcare uuid'
            );
            $this->assertNotSame('', $label);
            $this->assertArrayHasKey($category, PresetCovers::CATEGORIES, "Unknown category on {$uuid}");
        }
    }

    public function test_the_picker_offers_every_cover_with_a_distinct_label(): void
    {
        $picker = PresetCovers::forPicker();

        $this->assertCount(
            count(PresetCovers::COVERS) + count(PresetCovers::LEGACY_UPLOADED),
            $picker['covers']
        );

        $labels = array_column($picker['covers'], 'label');
        $this->assertSame($labels, array_unique($labels), 'Two covers share a label');

        foreach ($picker['covers'] as $cover) {
            $this->assertArrayHasKey($cover['category'], $picker['categories']);
            $this->assertStringStartsWith('https://ucarecdn.com/'.$cover['value'].'/', $cover['url']);
        }
    }

    public function test_no_cover_is_listed_twice(): void
    {
        $all = array_merge(array_keys(PresetCovers::COVERS), PresetCovers::LEGACY_UPLOADED);

        $this->assertSame($all, array_unique($all));
    }
}
