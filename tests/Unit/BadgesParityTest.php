<?php

namespace Tests\Unit;

use App\Support\Badges;
use Tests\TestCase;

/**
 * The PHP badge list and its JavaScript mirror must stay in step.
 *
 * 🚨 This is the whole safety net for a two-copy constant. A badge added to
 * `resources/js/constants/badges.js` only is one the picker offers and the
 * server rejects with a validation error the creator cannot act on; a badge
 * added to `App\Support\Badges` only is one nobody can pick. Both fail silently
 * in review — the category list had ALREADY drifted into two files before this
 * work, which is what these assertions exist to stop happening again.
 */
class BadgesParityTest extends TestCase
{
    private function js(): string
    {
        $path = resource_path('js/constants/badges.js');

        $this->assertFileExists($path, 'The JS badge mirror is missing.');

        return (string) file_get_contents($path);
    }

    /** Slugs as the JS file declares them, in file order. */
    private function jsSlugs(string $marker, string $until): array
    {
        $js = $this->js();

        $start = strpos($js, $marker);
        $this->assertNotFalse($start, "Could not find {$marker} in the JS mirror.");

        $end = strpos($js, $until, $start);
        $section = $end === false
            ? substr($js, $start)
            : substr($js, $start, $end - $start);

        preg_match_all('/slug:\s*"([a-z0-9-]+)"/', $section, $matches);

        return $matches[1];
    }

    public function test_interest_badges_match_the_js_mirror(): void
    {
        $this->assertSame(
            Badges::interestSlugs(),
            $this->jsSlugs('export const INTEREST_GROUPS', 'export const PRIDE_BADGES'),
            'The interest badge list has drifted between App\Support\Badges and resources/js/constants/badges.js.'
        );
    }

    public function test_pride_badges_match_the_js_mirror(): void
    {
        $this->assertSame(
            Badges::prideSlugs(),
            $this->jsSlugs('export const PRIDE_BADGES', 'export const INTEREST_BADGES'),
            'The pride badge list has drifted between App\Support\Badges and resources/js/constants/badges.js.'
        );
    }

    public function test_caps_match_the_js_mirror(): void
    {
        $js = $this->js();

        $this->assertMatchesRegularExpression(
            '/export const MAX_INTERESTS = '.Badges::MAX_INTERESTS.';/',
            $js,
            'MAX_INTERESTS disagrees between PHP and JS — the picker would let a creator pick more than the server accepts.'
        );

        $this->assertMatchesRegularExpression(
            '/export const MAX_PRIDE = '.Badges::MAX_PRIDE.';/',
            $js,
            'MAX_PRIDE disagrees between PHP and JS.'
        );
    }

    /**
     * 🚨 Client decision, 15 Aug 2026. Both name money handed over for nothing,
     * which is the exact framing every payment surface on this platform is
     * written to avoid — and a badge is public profile text a Stripe reviewer
     * reads. If this test fails, the badge was re-added; that needs a client
     * decision, not a green tick.
     */
    public function test_findom_and_cashmaster_are_not_offered(): void
    {
        // ⚠️ Match DECLARATIONS, not the raw file — both docblocks name these
        // two to explain why they are absent, and a whole-file scan fails on
        // the very comment that documents the rule.
        $js = $this->js();

        preg_match_all('/(?:slug|label):\s*"([^"]+)"/', $js, $matches);
        $declared = array_map('strtolower', $matches[1]);

        foreach (['findom', 'cashmaster'] as $banned) {
            $this->assertNotContains(
                $banned,
                Badges::interestSlugs(),
                "'{$banned}' contradicts the content-first compliance rules and must not be a badge."
            );

            $this->assertNotContains(
                $banned,
                $declared,
                "'{$banned}' contradicts the content-first compliance rules and must not be a badge."
            );

            $this->assertNotContains(
                $banned,
                array_map(fn ($b) => strtolower($b['label']), Badges::interests())
            );
        }
    }

    /**
     * ⚠️ This is what carries the ORIGINAL 17 categories forward with no
     * backfill migration. They were stored as labels; each must slugify onto a
     * slug that still exists, or a creator's existing choice is silently
     * dropped the first time they open the form.
     */
    public function test_every_legacy_category_label_still_resolves(): void
    {
        $legacy = [
            'Musician', 'DJ', 'Dancer', 'Podcaster', 'Streamer',
            'Artist', 'Writer', 'Video Creator', 'Developer',
            'Beauty Creator', 'Fashionista', 'Model', 'Cosplay Creator', 'Gym Bunny',
            'Gamer', 'Education Creator', 'Activist',
        ];

        foreach ($legacy as $label) {
            $this->assertContains(
                Badges::slugify($label),
                Badges::interestSlugs(),
                "The legacy category '{$label}' no longer resolves to a badge — existing creators would lose it."
            );
        }
    }

    public function test_the_two_sets_never_share_a_slug(): void
    {
        // They are stored in different columns and one of them is
        // special-category data. A shared slug would make a value ambiguous.
        $this->assertSame(
            [],
            array_intersect(Badges::interestSlugs(), Badges::prideSlugs())
        );
    }

    public function test_every_badge_carries_what_the_picker_renders(): void
    {
        foreach (Badges::interests() as $slug => $badge) {
            $this->assertNotEmpty($badge['label'], "Badge {$slug} has no label.");
            $this->assertNotEmpty($badge['emoji'], "Badge {$slug} has no emoji — the chip would render a gap.");
        }

        foreach (Badges::PRIDE as $slug => $badge) {
            $this->assertNotEmpty($badge['label'], "Pride badge {$slug} has no label.");
            $this->assertGreaterThanOrEqual(
                2,
                count($badge['colors']),
                "Pride badge {$slug} needs at least two stripes to draw a flag."
            );

            foreach ($badge['colors'] as $color) {
                $this->assertMatchesRegularExpression('/^#[0-9A-F]{6}$/', $color);
            }
        }
    }
}
