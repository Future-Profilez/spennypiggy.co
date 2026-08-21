<?php

namespace Tests\Feature;

use App\Services\VisitTracker;
use App\Support\BioSellableItems;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

/**
 * The Discovery marketing surfaces (A1 — landing-page section).
 *
 * 🚨 THE STANDING PROHIBITION THIS EXISTS TO ENFORCE: nothing may be labelled
 * LIVE NOW in marketing that is not live in the product (Developer Master Plan,
 * 19 Aug 2026, "Never, on any of this work"). The label map in
 * `config/discovery.php` is the one place three marketing pages read their
 * labels from, so a careless flip there advertises an unbuilt feature on all
 * three at once — and nothing errors, nothing renders differently in a way
 * anyone would notice, and the first person to find out is a creator who signed
 * up for it.
 *
 * The test pins the LIVE set. Adding a key to it is a deliberate act that fails
 * this test until someone updates the list here — which is the moment to check
 * the feature actually shipped.
 *
 * ⚠️ It deliberately does NOT assert the coming-soon set. That side grows freely
 * as the roadmap is advertised ahead of build; the direction that costs us is
 * the other one.
 */
class DiscoveryMarketingTest extends TestCase
{
    // The shared Inertia payload reads the `currencies` table on every page.
    use RefreshDatabase;

    /**
     * Every capability currently claimed as LIVE NOW, each with the code that
     * backs the claim. Verified 20 Aug 2026.
     */
    private const VERIFIED_LIVE = [
        'public_discovery' => 'public /discover route (routes/auth.php)',
        'creator_search' => 'DiscoveryService::getSearchCreators',
        'public_wishes' => 'DiscoveryService::getFeaturedWishes / discover_wish route',
        'promo_placements' => 'homepage trending / new-verified / top-earners',
        'sitewide_promotion' => 'as promo_placements, sitewide',
        'supporter_emails' => 'AbandonedCheckoutReminder, ReactivationReminder, StockBackInStock',
        'supporter_reminders' => 'ShopOrderReminderMail, TaskGracePeriodReminderMail',
        'creator_push' => 'PushSubscriptionController, RemindStalePushSubscriptions',
        'bio_phone' => 'BioPageController + Pages/Bio/Show.jsx, renders no layout',
        'bio_direct_sales' => 'bio.buy route + BioSellableItems::checkoutUrl + bio.items.* editor',
        'hidden_gems' => 'CollectionService::hiddenGems + homepage CreatorShowcase (Phase 6)',
        'almost_funded' => 'CollectionService::almostFunded + homepage CreatorShowcase (Phase 6)',
    ];

    /** @test */
    public function no_capability_is_advertised_as_live_without_verified_backing(): void
    {
        $live = array_keys(array_filter(
            config('discovery.labels'),
            fn ($state) => $state === 'live'
        ));

        $unverified = array_diff($live, array_keys(self::VERIFIED_LIVE));

        $this->assertSame([], array_values($unverified), sprintf(
            'These keys are labelled LIVE NOW in config/discovery.php but are not in this '
            ."test's verified list: %s. Either the feature shipped — in which case add it to "
            .'VERIFIED_LIVE with the code that backs it — or the label is a false claim on '
            .'three public marketing pages.',
            implode(', ', $unverified)
        ));
    }

    /** @test */
    public function every_label_state_is_one_of_the_two_known_values(): void
    {
        foreach (config('discovery.labels') as $key => $state) {
            $this->assertContains($state, ['live', 'coming_soon'],
                "Label '{$key}' has state '{$state}'. The frontend treats anything that is not "
                .'exactly \'live\' as coming soon, so a typo silently demotes a live feature.'
            );
        }
    }

    /** @test */
    public function the_four_scheduled_flips_are_still_pending(): void
    {
        // These flip on their own dates: analytics with Phase 2, more_creators
        // Mon 31 Aug, birthday with Phase 4, tips when Bridge access lands. If
        // one has genuinely shipped, move it here AND to VERIFIED_LIVE.
        foreach (['more_creators', 'birthday', 'tips'] as $key) {
            $this->assertSame('coming_soon', config("discovery.labels.{$key}"),
                "'{$key}' is marked live. Confirm the feature actually shipped before flipping it."
            );
        }

        $this->assertFalse((bool) config('discovery.analytics_live'),
            'Discovery analytics is switched to live, but the panel has no Phase 1 data source '
            .'yet — it would render the mock figures with the coming-soon badge removed.'
        );
    }

    /** @test */
    public function the_discovery_ad_page_answers_and_carries_the_same_payload(): void
    {
        $this->get('/creators/discovery')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('creators/Discovery')
                ->has('discovery.labels')
                ->where('discovery.analyticsLive', false)
            );
    }

    /**
     * @test
     *
     * 🚨 The brief lists four phrases under "Keep intact on this page". Two of
     * them appear in no section's copy, so they are placed by hand — which is
     * exactly the kind of thing a later layout edit removes without anyone
     * noticing.
     *
     * ⚠️ ASSERTED AGAINST THE SOURCE FILES, NOT AGAINST THE RENDERED HTML. This
     * app does not run Inertia SSR, so a server response carries only the props
     * JSON — every word of marketing copy lives in the JS bundle and reaches the
     * page client-side. An earlier version of this test hit `/creators/discovery`
     * and searched the response body; it failed on all four phrases for that
     * reason, and would have passed just as misleadingly if the page had been
     * rendered by a component that never used them. Two assertions are needed:
     * the words exist, and the page actually reads the constant that holds them.
     */
    public function the_ad_page_keeps_the_four_required_phrases(): void
    {
        $constants = file_get_contents(resource_path('js/constants/discovery.js'));
        $page = file_get_contents(resource_path('js/Pages/creators/Discovery.jsx'));

        $required = [
            'More than somewhere to earn.',
            "Bring your audience. We'll help you grow it.",
            'Get discovered. Stay visible. Bring supporters back.',
            "We don't just offer exposure. We show you what that exposure is worth.",
        ];

        foreach ($required as $phrase) {
            // The constants file writes apostrophes as \' inside single-quoted
            // strings, so compare against both spellings.
            $found = str_contains($constants, $phrase)
                || str_contains($constants, str_replace("'", "\\'", $phrase));

            $this->assertTrue($found, sprintf(
                'The brief requires this phrase to stay on /creators/discovery verbatim, '
                .'and it is no longer in constants/discovery.js: "%s".',
                $phrase
            ));
        }

        $this->assertStringContainsString('DISCOVERY_AD_KEEP_INTACT', $page,
            'Discovery.jsx no longer reads DISCOVERY_AD_KEEP_INTACT, so two of the four '
            .'required phrases have no other place on the page they could be coming from.'
        );
    }

    /**
     * @test
     *
     * A page type written by `record()` but missing from `PAGE_TYPES` is a
     * counter incremented in the cache, never written to the database, and
     * expired unread — the page reports zero visits forever and nothing errors.
     */
    public function the_discovery_ad_page_is_registered_for_visit_tracking(): void
    {
        $this->assertArrayHasKey('creators.discovery', VisitTracker::AD_LANDING_ROUTES);
        $this->assertContains(
            VisitTracker::AD_LANDING_ROUTES['creators.discovery'],
            VisitTracker::PAGE_TYPES
        );
    }

    /**
     * @test
     *
     * 🚨 A3's SECTIONS 3 AND 6 ARE LIVE NOW ONLY WHILE THE BIO PAGE CAN ACTUALLY
     * TAKE A PAYMENT.
     *
     * They shipped COMING SOON against the brief's own "LIVE NOW" label because
     * `/{username}/bio` sold nothing — its rows linked out to profile pages —
     * and direct selling was the B stream, due three days after this ad page
     * went live. The key flipped on 20 Aug 2026 in the same release as that
     * stream. The prohibition it was protecting has not gone away, so the test
     * inverts rather than disappearing: the label may stay live only while the
     * buying path behind it exists.
     *
     * ⚠️ Asserted against the ROUTER and the support class, not against a page
     * render. A marketing label is a claim about the product, and the thing that
     * makes it true is that a supporter tapping a card reaches a checkout.
     */
    public function the_bio_page_may_only_advertise_selling_while_it_can_sell(): void
    {
        if (config('discovery.labels.bio_direct_sales') !== 'live') {
            $this->markTestSkipped('bio_direct_sales is back to coming_soon; nothing is claimed.');
        }

        $this->assertTrue(Route::has('bio.buy'),
            'A3 advertises selling from the bio page, but the bio.buy route is gone — '
            .'every card on the page is a dead link and the LIVE NOW label is a false claim.'
        );

        $this->assertTrue(Route::has('bio.items.store'),
            'A3 section 6 advertises choosing which items appear, but the item editor '
            .'endpoint is gone.'
        );

        $this->assertTrue(Route::has('bio.items.reorder'),
            'A3 section 6 advertises choosing the order, but the reorder endpoint is gone.'
        );

        $this->assertTrue(
            method_exists(BioSellableItems::class, 'checkoutUrl'),
            'BioSellableItems::checkoutUrl is what turns a card into a checkout. '
            .'Without it the page lists items it cannot sell.'
        );
    }

    /**
     * @test
     *
     * The brief bans "instant" / "immediate" / "seconds" from the Link in Bio
     * page outright: nobody has confirmed how fast a stablecoin tip settles, so
     * any of those words is a promise we cannot keep. They are exactly the words
     * that reappear when someone rewrites a line to sound more exciting.
     *
     * ⚠️ COMMENTS ARE BLANKED BEFORE SCANNING — the same rule
     * `scripts/checks/check-conflicting-classes.mjs` follows, and for the same
     * reason: a comment is not shipped copy. The docblocks in that file NAME the
     * banned words in order to prohibit them, and a first version of this test
     * failed on its own warning notice.
     */
    public function the_link_in_bio_page_never_promises_a_settlement_speed(): void
    {
        $constants = file_get_contents(resource_path('js/constants/discovery.js'));

        // Only the A3 block — the words are legitimate elsewhere in the file.
        $marker = strpos($constants, 'A3 — /creators/link-in-bio');
        $this->assertNotFalse($marker, 'The A3 copy block is no longer in constants/discovery.js.');

        // ⚠️ Start AFTER the section's own header comment, not at the marker.
        // The marker sits INSIDE a block comment, so slicing at it leaves a
        // fragment with no opening `/*` for the comment-stripping regex to
        // match — the header's own prohibition notice then reads as page copy.
        $headerEnd = strpos($constants, '*/', $marker);
        $this->assertNotFalse($headerEnd, 'The A3 header comment is unterminated.');

        $copy = substr($constants, $headerEnd + 2);

        // Blank block comments, then line comments, then the banned-word list
        // itself, which necessarily spells them out.
        $copy = preg_replace('#/\*.*?\*/#s', ' ', $copy);
        $copy = preg_replace('#^\s*//.*$#m', ' ', $copy);
        $copy = preg_replace('/BIO_AD_BANNED_WORDS.*$/s', '', $copy);

        foreach (['instant', 'instantly', 'immediate', 'immediately', 'seconds'] as $word) {
            $this->assertDoesNotMatchRegularExpression(
                '/\b'.preg_quote($word, '/').'\b/i',
                $copy,
                "The brief bans \"{$word}\" from /creators/link-in-bio — no settlement speed "
                .'has been confirmed, so it is a promise we cannot keep.'
            );
        }
    }

    /** @test */
    public function the_link_in_bio_ad_page_answers_and_is_tracked(): void
    {
        $this->get('/creators/link-in-bio')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('creators/LinkInBio')
                ->has('discovery.labels')
            );

        $this->assertArrayHasKey('creators.link-in-bio', VisitTracker::AD_LANDING_ROUTES);
        $this->assertContains(
            VisitTracker::AD_LANDING_ROUTES['creators.link-in-bio'],
            VisitTracker::PAGE_TYPES
        );
    }

    /** @test */
    public function the_landing_page_carries_the_discovery_payload(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Welcome')
                ->has('discovery.labels')
                ->has('discovery.mockStats.introduced')
                ->has('discovery.mockStats.new_supporters')
                ->has('discovery.mockStats.attributed_earnings')
                ->where('discovery.analyticsLive', false)
            );
    }
}
