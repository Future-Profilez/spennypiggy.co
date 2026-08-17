<?php

namespace Tests\Unit;

use App\Support\Badges;
use Tests\TestCase;

/**
 * `Badges::sanitise*()` is the last line between the request and a column that
 * two SEO builders print into a public meta tag. It must fail CLOSED.
 */
class BadgesSanitiseTest extends TestCase
{
    public function test_unknown_slugs_are_dropped_not_stored(): void
    {
        $this->assertSame(
            ['musician'],
            Badges::sanitiseInterests(['musician', 'not-a-badge', '<script>alert(1)</script>'])
        );
    }

    public function test_legacy_labels_are_accepted_and_normalised(): void
    {
        // The column has held labels since long before slugs existed.
        $this->assertSame(
            ['video-creator', 'gym-bunny'],
            Badges::sanitiseInterests(['Video Creator', 'Gym Bunny'])
        );
    }

    public function test_a_json_string_is_accepted_as_well_as_an_array(): void
    {
        // Registration wrote the raw request value while the profile form wrote
        // json_encode(), so BOTH shapes are in the table today.
        $this->assertSame(
            ['artist', 'writer'],
            Badges::sanitiseInterests('["Artist","Writer"]')
        );

        $this->assertSame(['artist'], Badges::sanitiseInterests(['artist']));
    }

    public function test_duplicates_are_collapsed(): void
    {
        $this->assertSame(
            ['artist'],
            Badges::sanitiseInterests(['Artist', 'artist', 'artist'])
        );
    }

    public function test_the_cap_is_enforced_server_side(): void
    {
        $tooMany = array_slice(Badges::interestSlugs(), 0, Badges::MAX_INTERESTS + 4);

        $this->assertCount(
            Badges::MAX_INTERESTS,
            Badges::sanitiseInterests($tooMany),
            'The cap is a client courtesy until the server enforces it.'
        );

        $this->assertCount(
            Badges::MAX_PRIDE,
            Badges::sanitisePride(Badges::prideSlugs())
        );
    }

    public function test_the_two_sets_do_not_accept_each_other(): void
    {
        // Pride badges live in their own column precisely so they cannot be
        // smuggled into the public, SEO-indexed one.
        $this->assertSame([], Badges::sanitiseInterests(['trans', 'pride']));
        $this->assertSame([], Badges::sanitisePride(['musician', 'artist']));
    }

    public function test_junk_input_yields_an_empty_set_rather_than_an_error(): void
    {
        foreach ([null, '', 'not json', '{"a":1}', 42, [[], new \stdClass]] as $junk) {
            $this->assertSame([], Badges::sanitiseInterests($junk));
        }
    }

    public function test_labels_render_in_definition_order_not_pick_order(): void
    {
        // Two creators wearing the same badges must render them the same way.
        $this->assertSame(
            Badges::labels(['writer', 'musician']),
            Badges::labels(['musician', 'writer'])
        );

        $this->assertSame(['Musician', 'Writer'], Badges::labels(['writer', 'musician']));
    }

    public function test_labels_never_leak_an_unknown_value(): void
    {
        $this->assertSame(['Artist'], Badges::labels(['Artist', 'buy-me-a-coffee']));
    }
}
