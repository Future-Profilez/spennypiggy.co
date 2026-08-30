<?php

namespace Tests\Feature;

use App\Services\VisitTracker;
use App\Support\ComparisonFeePayload;
use App\Support\CompetitorSheet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

/**
 * The comparison build — client spec "Comparison Build FINAL v4.3", 24 Aug 2026.
 *
 * These pages make one claim above all others: every competitor figure is taken
 * from that competitor's own site with the date it was read, and every figure of
 * ours is the one the checkout charges. The tests below are the guards on that
 * claim — most of them assert a REFUSAL, because the failure mode here is a page
 * that renders perfectly while saying something nobody can stand behind.
 */
class ComparisonPageTest extends TestCase
{
    use RefreshDatabase;

    /** A minimal sheet that passes validation, for tests to break deliberately. */
    private function validSheet(array $overrides = []): array
    {
        // ⚠️ array_merge, never `+`: with `+` the LEFT value wins and every
        // "this should be refused" fixture would quietly stay valid — the exact
        // trap documented in CLAUDE.md from the Discovery Phase 3 tests.
        return array_merge([
            'published' => true,
            'name' => 'Example',
            'what' => 'A competitor.',
            'heroSubline' => 'A sub-line.',
            'metaTitle' => 'Spenny Piggy vs Example',
            'metaDescription' => 'A description.',
            'betterAt' => ['One genuine thing.', 'A second genuine thing.'],
            'switchSteps' => ['One.', 'Two.', 'Three.'],
            'fees' => [[
                'label' => 'Platform fee',
                'value' => '10%',
                'sourceUrl' => 'https://example.com/pricing',
                'checkedOn' => '2026-08-24',
            ]],
            'matrix' => ['shop' => ['value' => 'no']],
        ], $overrides);
    }

    private function withSheet(array $sheet, string $slug = 'example'): void
    {
        config(["comparisons.$slug" => $sheet]);
    }

    public function test_an_unknown_slug_is_a_404(): void
    {
        $this->get('/creators/vs/does-not-exist')->assertNotFound();
        $this->assertNull(CompetitorSheet::find('does-not-exist'));
    }

    /**
     * 🚨 The slug is the config key and nothing else is consulted, so a caller
     * cannot steer the lookup at a file outside the directory.
     */
    public function test_a_malformed_slug_is_refused_before_any_lookup(): void
    {
        $this->assertNull(CompetitorSheet::find('../payments'));
        $this->assertNull(CompetitorSheet::find('Throne'));
    }

    public function test_a_sheet_with_fewer_than_two_better_at_points_refuses_to_build(): void
    {
        $this->withSheet($this->validSheet(['betterAt' => ['Only one.']]));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/betterAt/');

        CompetitorSheet::find('example');
    }

    /**
     * 🚨 Every competitor figure carries a link to the page it was read from.
     * A sourceless number is indistinguishable from a sourced one once rendered,
     * which is why this refuses rather than dropping the row.
     */
    public function test_a_fee_row_without_a_source_refuses_to_build(): void
    {
        $sheet = $this->validSheet();
        unset($sheet['fees'][0]['sourceUrl']);
        $this->withSheet($sheet);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/sourceUrl/');

        CompetitorSheet::find('example');
    }

    /**
     * 🚨 The 18+ row may never read yes without the policy page that says so.
     * It is a sourced fact about how banks rate a platform, and unsourced it is
     * an accusation.
     */
    public function test_the_adult_content_row_cannot_claim_a_policy_without_linking_to_it(): void
    {
        $this->withSheet($this->validSheet([
            'matrix' => ['permits_adult' => ['value' => 'yes']],
        ]));

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/permits_adult/');

        CompetitorSheet::find('example');
    }

    public function test_an_unpublished_sheet_is_absent_from_the_index(): void
    {
        $this->withSheet($this->validSheet(['published' => false]));

        // ⚠️ Asserts the ABSENCE of this slug, not that the list is empty.
        // Real published sheets exist (the two generic pages), so an
        // empty-list assertion would only pass until the first one shipped —
        // and would then look like this feature had broken.
        $this->assertNotContains(
            'example',
            array_map(fn ($s) => $s->slug, CompetitorSheet::published())
        );
    }

    /**
     * The matrix is the shared row list, in shared order, with only the
     * competitor's own cell coming from the sheet.
     */
    public function test_the_matrix_is_the_shared_rows_and_a_sheet_cannot_add_one(): void
    {
        $this->withSheet($this->validSheet([
            'matrix' => ['shop' => ['value' => 'no'], 'invented_row' => ['value' => 'yes']],
        ]));

        $rows = CompetitorSheet::find('example')->matrix();
        $keys = array_column($rows, 'key');

        $this->assertCount(count(config('comparison_matrix.rows')), $rows);
        $this->assertNotContains('invented_row', $keys);
        $this->assertSame(array_column(config('comparison_matrix.rows'), 'key'), $keys);
    }

    /** A row the sheet does not answer reads "Not stated", never blank. */
    public function test_an_unanswered_row_reads_not_stated(): void
    {
        $this->withSheet($this->validSheet(['matrix' => []]));

        $rows = collect(CompetitorSheet::find('example')->matrix());

        $this->assertSame('Not stated', $rows->firstWhere('key', 'shop')['theirs']);
    }

    /**
     * 🚨 THE CENTRAL GUARD. The spec's own acceptance criterion is that changing
     * a rate in config/payments.php changes the supporter-pays figures on every
     * page with no code change. This MOVES the rate and asserts the payload
     * follows — a test against today's number would pass just as happily with
     * the figure typed into the component.
     */
    public function test_our_fee_figures_follow_the_live_payments_config(): void
    {
        $before = collect(ComparisonFeePayload::build('GBP')['rails'])
            ->firstWhere('key', 'card');

        config(['payments.fee_profiles.card.platform_rate' => 25]);

        $after = collect(ComparisonFeePayload::build('GBP')['rails'])
            ->firstWhere('key', 'card');

        // ⚠️ assertEquals, not assertSame: the pricing engine returns the rate
        // as a float and the point of this test is that the VALUE follows
        // config, not what PHP type it arrives as.
        $this->assertEquals(25, $after['platform_rate']);
        $this->assertNotEquals($before['all_in_rate'], $after['all_in_rate']);
        $this->assertGreaterThan($before['supporter_pays'], $after['supporter_pays']);
    }

    /** The creator always receives exactly the listed price, on every rail. */
    public function test_the_creator_receives_the_listed_price_on_every_live_rail(): void
    {
        $payload = ComparisonFeePayload::build('GBP');

        foreach ($payload['rails'] as $rail) {
            if ($rail['coming_soon']) {
                continue;
            }

            $this->assertSame(
                $payload['example_price'],
                (float) $rail['creator_receives'],
                "Rail {$rail['key']} does not return the listed price"
            );
        }
    }

    /**
     * 🚨 An announced rail shows no all-in figure, because one part of it is not
     * published. Printing the parts we know as a total would under-state our own
     * cost in our favour, on the page whose claim is that it does not.
     */
    public function test_an_announced_rail_publishes_no_all_in_rate_and_no_totals(): void
    {
        $rail = collect(ComparisonFeePayload::build('GBP')['rails'])
            ->firstWhere('coming_soon', true);

        $this->assertNotNull($rail, 'The announced rail is missing from the payload');
        $this->assertNull($rail['all_in_rate']);
        $this->assertNull($rail['supporter_pays']);
        $this->assertNull($rail['creator_receives']);
    }

    /**
     * 🚨 A new /creators page must be in BOTH VisitTracker constants or its
     * visit counters are incremented in the cache, never written to the
     * database, and expire unread — the page reports zero visits for ever and
     * nothing errors.
     */
    public function test_the_new_pages_are_registered_for_visit_tracking(): void
    {
        foreach (['creators.compare', 'creators.vs'] as $route) {
            $this->assertArrayHasKey($route, VisitTracker::AD_LANDING_ROUTES);
            $this->assertContains(
                VisitTracker::AD_LANDING_ROUTES[$route],
                VisitTracker::PAGE_TYPES,
                "$route has a page type that flush() never collects"
            );
        }
    }

    /**
     * 🚨 SPEC v4.3 §3b IS "THE WORDS THE DEVELOPER TYPES ONCE" — FIXED COPY.
     *
     * Every string below is specified verbatim by the client. They drifted
     * silently and in both directions: two were REWRITTEN in a readability pass
     * (the matrix intro was replaced with the platform pitch; the fee heading
     * lost its "£20"), and three blocks §3b lists were NEVER BUILT at all — the
     * secondary CTA, the holds-up block and the bonuses block. Nothing errors
     * when a specified line is missing; the page just quietly says less than the
     * client asked it to.
     *
     * ⚠️ It scans the SOURCE, not a rendered page: this is an Inertia component
     * and PHPUnit cannot mount it, which is exactly why nothing caught the
     * drift. ⚠️ Comments are blanked first — the notes at each call site quote
     * the spec, so a raw scan would find the string it is checking has gone.
     */
    public function test_the_fixed_copy_from_the_spec_is_on_the_vs_template(): void
    {
        $source = file_get_contents(
            resource_path('js/Pages/creators/vs/Show.jsx')
        );
        $source = preg_replace('#/\*.*?\*/#s', '', $source);
        $source = preg_replace('#\{/\*.*?\*/\}#s', '', $source);

        $fixed = [
            // §3b, in the order the spec lists them
            'See the full table' => 'the secondary CTA anchoring to the matrix',
            'Every row below is from' => 'the matrix intro, verbatim',
            'Not stated” rather than guess' => 'the matrix intro, verbatim',
            // The heading names the example sum. ⚠️ Asserted through the
            // DERIVED variable, never the literal "£20": the figure is read from
            // the payload the fee block prices from, so the heading cannot name
            // a sum the table below it does not use.
            'money20' => 'the fee heading keeps its example figure',
            'Keeping all of it is no use' => 'the holds-up block',
            'Three programmes' => 'the bonuses block',
            'We would rather you chose with the whole picture' => 'the "to be fair" intro',
            'Keep the price' => 'the final heading',
            'Listing is free. You are not charged anything until' => 'the final sub-line',
        ];

        foreach ($fixed as $needle => $what) {
            $this->assertStringContainsString(
                $needle,
                $source,
                "vs/Show.jsx no longer carries $what — spec v4.3 §3b fixes that copy."
            );
        }
    }

    /**
     * 🚨 THE TWO REUSED BLOCKS HAVE ONE DEFINITION EACH.
     *
     * §3a says the holds-up block is reused "verbatim" and the bonuses block
     * "unchanged". A second copy pasted into the vs template is a copy that
     * stops being either the first time somebody edits one page — so the words
     * live in a component and every page imports it. This asserts the ORIGINAL
     * pages still do, which is the half a copy-paste would silently undo.
     */
    public function test_the_reused_blocks_are_imported_not_copied(): void
    {
        $pairs = [
            'js/Pages/creators/Keep100.jsx' => 'HoldsUpBlock',
            'js/Pages/creators/Index.jsx' => 'ThreeProgrammes',
            'js/Pages/creators/vs/Show.jsx' => 'HoldsUpBlock',
        ];

        foreach ($pairs as $file => $component) {
            $this->assertMatchesRegularExpression(
                '/^import '.$component.'[,\s]/m',
                file_get_contents(resource_path($file)),
                "$file must import $component rather than carry its own copy."
            );
        }
    }

    /**
     * 🚨 THE WORKED EXAMPLE IS THE CLIENT'S OWN ARITHMETIC, TO THE PENNY.
     *
     * Spec v4.3, Throne sheet: "$20 Cash Gift. Subtotal shown to the fan $21.95
     * (9.75% service fee included). Processing at checkout 3.9% + $0.30 = $1.16.
     * Gifter pays $23.11 … credited $20.00. Withdraw that on its own and the
     * under-$30 fee applies: $18.00 lands."
     *
     * Those five figures are what the page prints and what the side-by-side
     * table's competitor column is derived from, so a typo in any one of them
     * misstates a named competitor's fees on a public page.
     */
    public function test_the_throne_worked_example_matches_the_spec(): void
    {
        $example = config('comparisons.throne.example');

        foreach (['$21.95', '3.9% + $0.30', '$1.16', '$23.11', '$20.00', '$18.00'] as $figure) {
            $this->assertStringContainsString($figure, $example['note']);
        }

        // The table's two numeric cells are the same sourced figures, not a
        // second set typed beside them.
        $this->assertSame(23.11, (float) $example['theirs']['supporter_pays_amount']);
        $this->assertSame(20.00, (float) $example['theirs']['creator_receives_amount']);
        $this->assertStringContainsString('23.11', $example['theirs']['supporter_pays']);
    }

    /** The index answers, and lists only what is published. */
    public function test_the_compare_index_renders(): void
    {
        $this->get('/creators/compare')->assertOk();
    }

    /**
     * 🚨 A `verify` ROW IS A NOTE TO OURSELVES, AND IT MUST NEVER REACH A READER.
     *
     * Those rows carry text like "Verify the current tier names and prices on
     * their pricing page before publishing" in the `value` the page RENDERS —
     * four of Linktree's five fee rows are that. Published, they would appear
     * verbatim on a public, indexable, paid-ads destination as our statement of
     * what a named competitor charges.
     *
     * The rule was prose at the top of every sheet and in `isPublished()`'s own
     * docblock. Prose is not a guard: flipping one boolean was all it took, and
     * the page would have rendered perfectly.
     */
    public function test_a_sheet_cannot_be_published_with_an_unverified_fee_row(): void
    {
        $sheet = $this->validSheet();
        $sheet['fees'][0]['verify'] = true;
        $this->withSheet($sheet);

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessageMatches('/unverified fee row/');

        CompetitorSheet::find('example');
    }

    /** An unverified row on a DRAFT sheet is fine — that is what drafts are for. */
    public function test_an_unpublished_sheet_may_hold_unverified_rows(): void
    {
        $sheet = $this->validSheet(['published' => false]);
        $sheet['fees'][0]['verify'] = true;
        $this->withSheet($sheet);

        $this->assertNotNull(CompetitorSheet::find('example'));
    }

    /**
     * The live sheets honour it. ⚠️ Asserted against the REAL config rather than
     * a fixture: the fixture proves the guard works, this proves nothing has
     * been shipped past it.
     */
    public function test_every_published_sheet_on_this_site_is_fully_verified(): void
    {
        foreach (CompetitorSheet::published() as $sheet) {
            foreach ($sheet->fees() as $row) {
                $this->assertFalse(
                    $row['verify'],
                    "{$sheet->slug} is published with an unverified fee row [{$row['label']}]."
                );
            }
        }
    }

    /**
     * 🚨 `RiskBlock` LINKS TO `/creators/vs/wishtender` FROM EVERY PAGE IT
     * RENDERS ON — every comparison, the index, and /creators/wishlist — and
     * that sheet ships as a draft, which is a 404 in production. A live page
     * pointing at a 404, from the block whose whole job is to be the credible
     * part of the argument.
     *
     * The prop is what the component gates the link on, so these two assertions
     * are the contract: the link is suppressed while the sheet is a draft and
     * comes back the moment it is published, with no edit to the component.
     */
    public function test_the_wishtender_link_is_suppressed_while_that_sheet_is_a_draft(): void
    {
        config(['comparisons.wishtender.published' => false]);

        $this->get('/creators/compare')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('wishtenderLive', false));
    }

    public function test_the_wishtender_link_returns_when_that_sheet_is_published(): void
    {
        config(['comparisons.wishtender.published' => true]);

        $this->get('/creators/compare')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('wishtenderLive', true));
    }

    /**
     * 🚨 A URL IN THE SITEMAP MUST NOT 404. A draft sheet answers 404 in
     * production, and submitting one teaches Search Console the path is dead —
     * which is the reason the vs pages are listed by name rather than as a
     * group. This is what keeps the two lists honest about each other.
     */
    public function test_the_sitemap_lists_no_unpublished_comparison(): void
    {
        $listed = [];
        preg_match_all(
            "#'/creators/vs/([a-z0-9-]+)'#",
            file_get_contents(base_path('routes/web.php')),
            $listed
        );

        $published = array_map(fn ($sheet) => $sheet->slug, CompetitorSheet::published());

        foreach (array_unique($listed[1]) as $slug) {
            $this->assertContains(
                $slug,
                $published,
                "The sitemap submits /creators/vs/$slug, which is not a published sheet and 404s in production."
            );
        }
    }
}
