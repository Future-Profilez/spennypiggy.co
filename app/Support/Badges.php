<?php

namespace App\Support;

/**
 * Profile badges — the ONE definition of every badge a creator can wear.
 *
 * Two sets, deliberately kept apart:
 *
 *  - INTEREST_GROUPS — what a creator makes and is into. Public. Feeds the
 *    profile card and the SEO keyword line.
 *  - PRIDE — identity badges. GDPR Article 9 special-category data (sexual
 *    orientation and gender identity), stored in its own column so it can be
 *    excluded from SEO, OpenGraph and every public payload BY CONSTRUCTION
 *    rather than by somebody remembering to filter it. See PRIDE below.
 *
 * `resources/js/constants/badges.js` mirrors this file. The two are asserted
 * in step by tests/Unit/BadgesParityTest.php — a badge added on one side only
 * is a badge the picker offers and the server rejects, or the reverse.
 *
 * ⚠️ The STORED value is the slug, never the label. Renaming a label must not
 * orphan a creator's existing choice, which is the whole reason for the split.
 */
class Badges
{
    /** How many interest badges one creator may wear. */
    public const MAX_INTERESTS = 6;

    /** How many pride badges one creator may wear. */
    public const MAX_PRIDE = 3;

    /**
     * Interest badges, grouped for the picker.
     *
     * ⚠️ Group order and item order ARE the render order — the picker reads
     * this array and adds no ordering of its own.
     *
     * 🚨 "Findom" and "Cashmaster" are deliberately absent (client decision,
     * 15 Aug 2026). Both name money handed over for nothing, which is the exact
     * framing every payment surface on this platform is written to avoid — and
     * a badge is public profile text a Stripe reviewer reads. Do not add them.
     */
    public const INTEREST_GROUPS = [
        'Performing' => [
            'musician' => ['label' => 'Musician', 'emoji' => '🎵'],
            'dj' => ['label' => 'DJ', 'emoji' => '🎧'],
            'dancer' => ['label' => 'Dancer', 'emoji' => '💃'],
            'podcaster' => ['label' => 'Podcaster', 'emoji' => '🎙️'],
            'streamer' => ['label' => 'Streamer', 'emoji' => '📺'],
        ],
        'Making' => [
            'artist' => ['label' => 'Artist', 'emoji' => '🎨'],
            'writer' => ['label' => 'Writer', 'emoji' => '✍️'],
            'video-creator' => ['label' => 'Video Creator', 'emoji' => '🎬'],
            'content-creator' => ['label' => 'Content Creator', 'emoji' => '🎞️'],
            'developer' => ['label' => 'Developer', 'emoji' => '💻'],
            'ai' => ['label' => 'AI', 'emoji' => '🤖'],
        ],
        'Style & body' => [
            'beauty-creator' => ['label' => 'Beauty Creator', 'emoji' => '💄'],
            'fashionista' => ['label' => 'Fashionista', 'emoji' => '👗'],
            'model' => ['label' => 'Model', 'emoji' => '📸'],
            'cosplay-creator' => ['label' => 'Cosplay Creator', 'emoji' => '🎭'],
            'gym-girl' => ['label' => 'Gym Girl', 'emoji' => '🏋️‍♀️'],
            'gym-guy' => ['label' => 'Gym Guy', 'emoji' => '🏋️‍♂️'],
            'gym-fan' => ['label' => 'Gym Fan', 'emoji' => '🏋️'],
            // Retained from the original 17. Creators already wear it, and
            // remapping it onto gym-fan would rewrite how they describe
            // themselves without asking.
            'gym-bunny' => ['label' => 'Gym Bunny', 'emoji' => '🐰'],
            'lingerie-lover' => ['label' => 'Lingerie Lover', 'emoji' => '🎀'],
        ],
        'Community' => [
            'gamer' => ['label' => 'Gamer', 'emoji' => '🎮'],
            'anime' => ['label' => 'Anime', 'emoji' => '🌸'],
            'whovian' => ['label' => 'Whovian', 'emoji' => '🛸'],
            'foodie' => ['label' => 'Foodie', 'emoji' => '🍜'],
            'influencer' => ['label' => 'Influencer', 'emoji' => '🌟'],
            'internet-princess' => ['label' => 'Internet Princess', 'emoji' => '👑'],
            'education-creator' => ['label' => 'Education Creator', 'emoji' => '📚'],
            'activist' => ['label' => 'Activist', 'emoji' => '✊'],
        ],
        'Grown-up' => [
            'adult-creator' => ['label' => 'Adult Creator', 'emoji' => '🔥'],
            'dominant' => ['label' => 'Dominant', 'emoji' => '⛓️'],
            'good-sub' => ['label' => 'Good Sub', 'emoji' => '🖤'],
            'switch' => ['label' => 'Switch', 'emoji' => '🔄'],
            'vanilla' => ['label' => 'Vanilla', 'emoji' => '🍦'],
            'couple' => ['label' => 'Couple', 'emoji' => '💞'],
        ],
    ];

    /**
     * Pride badges.
     *
     * 🚨 SPECIAL-CATEGORY DATA. Never concatenate these into meta keywords, an
     * OpenGraph tag, a share caption or a Stripe payload. They live in their own
     * column (`users.pride_badges`) precisely so a surface has to ASK for them.
     *
     * ⚠️ `colors` are the flag's own stripes, top to bottom, and the picker
     * renders them as a gradient disc. Emoji cannot do this job: only 🏳️‍🌈 and
     * 🏳️‍⚧️ exist, so every other badge would render as the same glyph and say
     * the wrong thing about somebody's identity.
     *
     * ⚠️ "Pride Unity" from the reference artwork is NOT here. There is no
     * agreed stripe set for it, and inventing a flag for an identity group is
     * worse than omitting it. Add it only with a source.
     */
    public const PRIDE = [
        'pride' => [
            'label' => 'Pride',
            'colors' => ['#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'],
        ],
        'pride-poc' => [
            'label' => 'Pride POC',
            'colors' => ['#000000', '#613915', '#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'],
        ],
        'pride-progress' => [
            'label' => 'Pride Progress',
            'colors' => ['#FFFFFF', '#FFAFC8', '#74D7EE', '#613915', '#000000', '#E40303', '#FF8C00', '#FFED00', '#008026', '#004DFF', '#750787'],
        ],
        'lesbian' => [
            'label' => 'Lesbian',
            'colors' => ['#D52D00', '#EF7627', '#FF9A56', '#FFFFFF', '#D162A4', '#B55690', '#A30262'],
        ],
        'gay' => [
            'label' => 'Gay',
            'colors' => ['#078D70', '#26CEAA', '#98E8C1', '#FFFFFF', '#7BADE2', '#5049CC', '#3D1A78'],
        ],
        'bisexual' => [
            'label' => 'Bisexual',
            'colors' => ['#D60270', '#D60270', '#9B4F96', '#0038A8', '#0038A8'],
        ],
        'trans' => [
            'label' => 'Trans',
            'colors' => ['#5BCEFA', '#F5A9B8', '#FFFFFF', '#F5A9B8', '#5BCEFA'],
        ],
        'genderqueer' => [
            'label' => 'Genderqueer',
            'colors' => ['#B57EDC', '#FFFFFF', '#4A8123'],
        ],
        'intersex' => [
            'label' => 'Intersex',
            'colors' => ['#FFD800', '#7902AA', '#FFD800'],
        ],
        'asexual' => [
            'label' => 'Asexual',
            'colors' => ['#000000', '#A3A3A3', '#FFFFFF', '#800080'],
        ],
        'pansexual' => [
            'label' => 'Pansexual',
            'colors' => ['#FF218C', '#FFD800', '#21B1FF'],
        ],
        'non-binary' => [
            'label' => 'Non-Binary',
            'colors' => ['#FCF434', '#FFFFFF', '#9C59D1', '#2C2C2C'],
        ],
        'genderfluid' => [
            'label' => 'Genderfluid',
            'colors' => ['#FF75A2', '#FFFFFF', '#BE18D6', '#000000', '#333EBD'],
        ],
        'aromantic' => [
            'label' => 'Aromantic',
            'colors' => ['#3DA542', '#A7D379', '#FFFFFF', '#A9A9A9', '#000000'],
        ],
    ];

    /**
     * Flatten the interest groups to slug => definition.
     */
    public static function interests(): array
    {
        $flat = [];

        foreach (self::INTEREST_GROUPS as $group => $items) {
            foreach ($items as $slug => $item) {
                $flat[$slug] = $item + ['group' => $group];
            }
        }

        return $flat;
    }

    public static function interestSlugs(): array
    {
        return array_keys(self::interests());
    }

    public static function prideSlugs(): array
    {
        return array_keys(self::PRIDE);
    }

    /**
     * Normalise a stored value to a slug.
     *
     * ⚠️ This is what carries the ORIGINAL 17 categories forward. They were
     * stored as labels ("Video Creator") and every one of them slugifies onto
     * its new slug ("video-creator"), so no creator's existing choice is lost
     * and no backfill migration is needed. Asserted by test.
     */
    public static function slugify(?string $value): string
    {
        $value = strtolower(trim((string) $value));
        $value = preg_replace('/[^a-z0-9]+/', '-', $value);

        return trim((string) $value, '-');
    }

    /**
     * Keep only real interest slugs, deduped, capped, order preserved.
     *
     * Fails CLOSED: anything not in the list is dropped rather than stored.
     * The registration endpoint used to write this column raw, so an unknown
     * string reached a column two SEO builders print into meta keywords.
     */
    public static function sanitiseInterests(mixed $values): array
    {
        return self::sanitise($values, self::interestSlugs(), self::MAX_INTERESTS);
    }

    public static function sanitisePride(mixed $values): array
    {
        return self::sanitise($values, self::prideSlugs(), self::MAX_PRIDE);
    }

    /**
     * Labels for a set of stored slugs, in the order the badges are defined
     * rather than the order they were picked — so two creators wearing the same
     * badges render them the same way.
     */
    public static function labels(mixed $values, bool $pride = false): array
    {
        $known = $pride ? self::PRIDE : self::interests();
        $slugs = $pride ? self::sanitisePride($values) : self::sanitiseInterests($values);
        $slugs = array_flip($slugs);

        $labels = [];

        foreach ($known as $slug => $item) {
            if (isset($slugs[$slug])) {
                $labels[] = $item['label'];
            }
        }

        return $labels;
    }

    /**
     * Decode whatever `users.creator_category` / `users.pride_badges` holds.
     *
     * ⚠️ The column has held BOTH a JSON string and a real array depending on
     * which write path last touched it — registration wrote the raw request
     * value while the profile form wrote `json_encode()`. Both shapes are still
     * in the table, so every reader has to accept both.
     */
    public static function decode(mixed $stored): array
    {
        if (is_array($stored)) {
            return $stored;
        }

        if (! is_string($stored) || $stored === '') {
            return [];
        }

        $decoded = json_decode($stored, true);

        return is_array($decoded) ? $decoded : [];
    }

    private static function sanitise(mixed $values, array $allowed, int $max): array
    {
        $values = self::decode($values);
        $allowed = array_flip($allowed);

        $out = [];

        foreach ($values as $value) {
            if (! is_string($value) && ! is_numeric($value)) {
                continue;
            }

            $slug = self::slugify((string) $value);

            if ($slug === '' || ! isset($allowed[$slug]) || in_array($slug, $out, true)) {
                continue;
            }

            $out[] = $slug;

            if (count($out) >= $max) {
                break;
            }
        }

        return $out;
    }
}
