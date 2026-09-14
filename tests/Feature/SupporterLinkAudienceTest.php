<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * 🚨 EVERY `/creators*` PATH IS A PAID LANDING PAGE AIMED AT CREATORS.
 *
 * `/creators` opens with the eyebrow "For creators" and the headline "Sell your
 * content. Keep all of it."; `/creators/discovery` is headlined "Don't just bring
 * your audience. Grow it." They are creator-acquisition pages, and the supporter's
 * browse surface is `/discover`.
 *
 * Three supporter-facing CTAs pointed at them anyway (found 12 Sep 2026):
 *
 *  - `SupporterLevel`'s "Find creators to support" — the ONE button on a
 *    brand-new supporter's own profile — went to `/creators`.
 *  - `MoreCreators`' "Browse all creators · Find someone new to support" tile, at
 *    the foot of every profile, went to `/creators/discovery`.
 *  - `PurchasesHub`'s "Find creators" CTA, on EVERY empty state in a supporter's
 *    own purchase hub, went to `/creators`.
 *
 * 🚨 NOTHING ERRORS AND NOTHING LOOKS BROKEN. Each is a real page that renders a
 * 200, so the button simply does the opposite of what its own label says, and no
 * route test, scanner or build step can see it — a link to the wrong real page is
 * indistinguishable from a correct one. That is why this is a source scan.
 *
 * ⚠️ THE FILE LIST IS EXPLICIT, NOT A SWEEP OF `resources/js`. A creator-facing
 * surface linking to a creator landing page is correct, and `includes/Header.jsx`
 * deliberately carries a "Link in Bio" row to `/creators/link-in-bio` for every
 * signed-in account — an upsell toward becoming a creator, which is a product
 * decision rather than a mistake. Add a file here when it is read by a supporter
 * acting AS a supporter.
 */
class SupporterLinkAudienceTest extends TestCase
{
    /**
     * Files a supporter reads while being a supporter.
     *
     * @var array<int, string>
     */
    private const SUPPORTER_SURFACES = [
        'resources/js/Components/Gifter/SupporterLevel.jsx',
        'resources/js/Components/Gifter/SupporterShelf.jsx',
        'resources/js/Components/Gifter/ExploreNext.jsx',
        'resources/js/Components/Gifter/CreatorsBacked.jsx',
        'resources/js/Components/discovery/MoreCreators.jsx',
        'resources/js/Pages/gifter/Gifter.jsx',
        'resources/js/Pages/gifter/GifterFeed.jsx',
        'resources/js/Pages/gifter/PurchasesHub.jsx',
    ];

    public function test_no_supporter_surface_links_to_a_creator_landing_page(): void
    {
        $offenders = [];

        foreach (self::SUPPORTER_SURFACES as $relative) {
            $path = base_path($relative);

            // A file listed here that has since been deleted or renamed is a
            // finding of its own — silently skipping it is how an allowlist rots.
            $this->assertFileExists($path, "{$relative} is listed as a supporter surface but does not exist.");

            /*
             * ⚠️ COMMENTS ARE BLANKED FIRST. Every one of the three fixes left a
             * note at the call site explaining the bug, and those notes QUOTE the
             * wrong path — a raw scan finds the very string it is checking has
             * gone. Same precaution `NoWritingGetRoutesTest` takes.
             */
            $source = $this->withoutComments(file_get_contents($path));

            if (preg_match_all('~href=(["\'])(/creators[^"\']*)\1~', $source, $m, PREG_SET_ORDER)) {
                foreach ($m as $hit) {
                    $offenders[] = "{$relative} → {$hit[2]}";
                }
            }
        }

        $this->assertSame(
            [],
            $offenders,
            "A supporter-facing surface links to a creator-acquisition landing page.\n"
            ."Every /creators* path sells becoming a creator; a supporter browsing wants /discover.\n"
            .implode("\n", $offenders),
        );
    }

    /**
     * ⚠️ A control. Without it the scan above passes just as happily against a
     * regex that matches nothing at all, which is the commonest way a source scan
     * certifies what it missed.
     */
    public function test_the_scan_would_catch_a_creator_landing_link(): void
    {
        $planted = 'const x = <a href="/creators/discovery">Find creators</a>;';

        $this->assertMatchesRegularExpression(
            '~href=(["\'])(/creators[^"\']*)\1~',
            $this->withoutComments($planted),
        );
    }

    /** Blank `//` and block comments so a note explaining the bug is not read as the bug. */
    private function withoutComments(string $source): string
    {
        $source = preg_replace('~/\*.*?\*/~s', '', $source);

        return preg_replace('~//[^\n]*~', '', $source);
    }
}
