<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 THE AD PAGES MUST UNFURL WHEN THEY ARE POSTED.
 *
 * `/creators/discovery` and `/creators/link-in-bio` are where the paid ads point
 * and what Jack posts by hand. Until 24 Aug 2026 they carried NO `og:` or
 * `twitter:` tags at all — the homepage had a full set, so this was specific to
 * the two newest pages: there was simply no entry for them in
 * `StaticPageSeoMiddleware`, and only an exact path match in that map emits tags.
 *
 * ⚠️ Nothing errors when they are missing. The page renders perfectly and the
 * link posts as a bare URL, which is why it survived launch unnoticed — so this
 * is asserted against RENDERED HTML rather than against the map.
 */
class AdPageSocialCardTest extends TestCase
{
    /*
     * ⚠️ `RefreshDatabase` IS REQUIRED, and its absence did not fail loudly.
     * Both pages read the currencies table, so without it the request 500s — and
     * three of these tests still PASSED against the error page, because the
     * middleware sets the meta tags on the way in and the rendered error view
     * carried them. A test that passes against a 500 is worse than no test.
     */
    use RefreshDatabase;

    public static function adPages(): array
    {
        return [
            'Discovery' => ['/creators/discovery'],
            'Link in Bio' => ['/creators/link-in-bio'],
        ];
    }

    /**
     * @dataProvider adPages
     */
    public function test_the_page_carries_a_full_social_card(string $path): void
    {
        $html = $this->get($path)->assertOk()->getContent();

        foreach ([
            'og:title',
            'og:description',
            'og:image',
            'og:url',
            'og:type',
            'twitter:card',
            'twitter:title',
            'twitter:description',
            'twitter:image',
        ] as $tag) {
            $this->assertStringContainsString(
                $tag,
                $html,
                "{$path} is missing {$tag} — the link will post as a bare URL."
            );
        }
    }

    /**
     * ⚠️ An empty content attribute is not a tag. A share card with a present but
     * blank title unfurls exactly as badly as a missing one.
     */
    public function test_the_card_values_are_not_empty(): void
    {
        foreach (array_column(self::adPages(), 0) as $path) {
            $html = $this->get($path)->assertOk()->getContent();

            preg_match_all('/<meta (?:property|name)="(og:[a-z]+|twitter:[a-z]+)" content="([^"]*)"/i', $html, $m, PREG_SET_ORDER);

            $this->assertNotEmpty($m, "{$path} rendered no social tags at all.");

            foreach ($m as [, $tag, $value]) {
                $this->assertNotSame('', trim($value), "{$path} has an empty {$tag}.");
            }
        }
    }

    /**
     * 🚨 THE BANS APPLY TO THE SHARE CARD TOO. A description is marketing copy on
     * a payment-facing surface, and it is the part that travels furthest — it is
     * what gets pasted into a social post. No competitor names, no
     * payment-provider names, and on the Link in Bio page never a settlement
     * speed, because none has been confirmed by anybody.
     */
    public function test_the_link_in_bio_card_promises_no_settlement_speed(): void
    {
        $html = $this->get('/creators/link-in-bio')->assertOk()->getContent();

        preg_match_all('/<meta (?:property|name)="(?:og|twitter):[a-z]+" content="([^"]*)"/i', $html, $m);
        $card = strtolower(implode(' ', $m[1]));

        foreach (['instant', 'immediate', 'seconds', 'linktree', 'youpay', 'stripe', 'bridge', 'coinflow'] as $banned) {
            $this->assertStringNotContainsString(
                $banned,
                $card,
                "The Link in Bio share card contains the banned word '{$banned}'."
            );
        }
    }

    /**
     * ⚠️ Both pages must be indexable in production. The environment decides it,
     * so the assertion is that neither is on the no-index list — not that the
     * local response says index (it does not, and should not).
     */
    public function test_neither_page_is_marked_noindex_by_a_path_rule(): void
    {
        config(['seo.indexable' => true]);

        foreach (array_column(self::adPages(), 0) as $path) {
            $html = $this->get($path)->assertOk()->getContent();

            $this->assertMatchesRegularExpression(
                '/<meta name="robots" content="index,follow"/i',
                $html,
                "{$path} is being no-indexed by a path rule; the plan requires both pages indexable."
            );
        }
    }
}
