<?php

namespace Tests\Unit;

use App\Support\MediaUrl;
use Tests\TestCase;

/**
 * The watermark builder's whole job is to be unable to corrupt a URL.
 *
 * Every one of these asserts the SAME property from a different angle: on any
 * doubt, the caller's URL comes back byte-for-byte unchanged.
 */
class MediaUrlWatermarkTest extends TestCase
{
    private const IMAGE = 'https://ucarecdn.com/11111111-2222-3333-4444-555555555555/-/format/jpeg/';

    private const WM = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';

    private function on(): void
    {
        config([
            'media.watermark.enabled' => true,
            'media.watermark.dimensions' => '34px34p',
            'media.watermark.coordinates' => '4p,90p',
            'media.watermark.opacity' => '45p',
        ]);
    }

    public function test_disabled_returns_the_url_byte_for_byte(): void
    {
        config(['media.watermark.enabled' => false]);

        $this->assertSame(self::IMAGE, MediaUrl::watermark(self::IMAGE, self::WM));
    }

    public function test_applies_the_overlay_last_so_it_draws_on_top(): void
    {
        $this->on();

        $this->assertSame(
            self::IMAGE.'-/overlay/'.self::WM.'/34px34p/4p,90p/45p/',
            MediaUrl::watermark(self::IMAGE, self::WM)
        );
    }

    /**
     * `false` and null are how these accessors say "this item has no image".
     * Turning either into a string would make an empty slot render as broken.
     */
    public function test_non_string_inputs_survive_untouched(): void
    {
        $this->on();

        $this->assertFalse(MediaUrl::watermark(false, self::WM));
        $this->assertNull(MediaUrl::watermark(null, self::WM));
        $this->assertSame('', MediaUrl::watermark('', self::WM));
    }

    public function test_no_watermark_uuid_leaves_the_url_alone(): void
    {
        $this->on();

        $this->assertSame(self::IMAGE, MediaUrl::watermark(self::IMAGE, null));
        $this->assertSame(self::IMAGE, MediaUrl::watermark(self::IMAGE, ''));
        $this->assertSame(self::IMAGE, MediaUrl::watermark(self::IMAGE, 'not-a-uuid'));
    }

    /**
     * Generated thank-you images arrive with their own text/font operations
     * baked into the stored column, and the platform authored them.
     */
    public function test_an_image_that_already_carries_text_operations_is_refused(): void
    {
        $this->on();

        $thankYou = 'https://ucarecdn.com/11111111-2222-3333-4444-555555555555/-/text/80px8p/8p,100p/hi/-/font/40/fff/';

        $this->assertSame($thankYou, MediaUrl::watermark($thankYou, self::WM));
    }

    public function test_the_platform_placeholder_never_carries_a_creator_watermark(): void
    {
        $this->on();

        $placeholder = 'https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/';

        $this->assertSame($placeholder, MediaUrl::watermark($placeholder, self::WM));
    }

    public function test_a_second_overlay_is_never_stacked(): void
    {
        $this->on();

        $already = MediaUrl::watermark(self::IMAGE, self::WM);

        $this->assertSame($already, MediaUrl::watermark($already, self::WM));
    }

    public function test_non_uploadcare_and_non_uuid_references_are_refused(): void
    {
        $this->on();

        foreach ([
            'https://example.com/photo.jpg',
            'https://ucarecdn.com/',
            // A group id, not a file uuid.
            'https://ucarecdn.com/11111111-2222-3333-4444-555555555555~3/nth/0/',
            // A query string would end up before the operations we append.
            'https://ucarecdn.com/11111111-2222-3333-4444-555555555555/?v=2',
        ] as $url) {
            $this->assertSame($url, MediaUrl::watermark($url, self::WM), $url);
        }
    }

    /**
     * A typo in config must cost the watermark, never the image.
     */
    public function test_a_malformed_config_argument_yields_no_watermark_not_a_broken_url(): void
    {
        $this->on();
        config(['media.watermark.coordinates' => '4p,92p/-/resize/9000x']);

        $this->assertSame(self::IMAGE, MediaUrl::watermark(self::IMAGE, self::WM));
        $this->assertNull(MediaUrl::overlayOps(self::WM));
    }

    /**
     * 🚨 Regression guard for a 400 that actually happened.
     *
     * `overlay/<uuid>/34p/` parses on its own, but a ONE-DIMENSIONAL size makes
     * Uploadcare reject the coordinates that follow it and answer 400 for the
     * whole image — verified against the live CDN. Dimensions must be `WxH`.
     */
    public function test_one_dimensional_size_is_rejected_because_the_cdn_400s_on_it(): void
    {
        $this->on();

        foreach (['34p', '34', 'center', '34p,34p'] as $bad) {
            config(['media.watermark.dimensions' => $bad]);

            $this->assertNull(MediaUrl::overlayOps(self::WM), $bad);
            $this->assertSame(self::IMAGE, MediaUrl::watermark(self::IMAGE, self::WM), $bad);
        }
    }

    /**
     * The exact string verified as HTTP 200 against ucarecdn.com.
     */
    public function test_the_shape_verified_against_the_live_cdn(): void
    {
        $this->on();

        $this->assertMatchesRegularExpression(
            '#^-/overlay/[0-9a-f-]{36}/\d+px\d+p/\d+p,\d+p/\d+p/$#',
            (string) MediaUrl::overlayOps(self::WM)
        );
    }

    /**
     * 🚨 The deploy-safety property.
     *
     * ~16 owner eager-loads name this column. Selecting it unconditionally would
     * throw an unknown-column error on every Discover query and every profile
     * listing between the code landing and the migration running — while the
     * feature is OFF, the one state that must change nothing. It also keeps the
     * payload shape identical, since an unselected column cannot surface as a
     * new JSON key.
     */
    public function test_the_owner_column_is_only_selected_while_the_feature_is_on(): void
    {
        config(['media.watermark.enabled' => false]);
        $this->assertSame('', MediaUrl::ownerColumn());

        $this->on();
        $this->assertSame(',watermark_uuid', MediaUrl::ownerColumn());
    }

    public function test_ops_for_is_null_while_the_feature_is_off(): void
    {
        config(['media.watermark.enabled' => false]);
        $this->assertNull(MediaUrl::opsFor(self::WM));

        $this->on();
        $this->assertSame('-/overlay/'.self::WM.'/34px34p/4p,90p/45p/', MediaUrl::opsFor(self::WM));
    }
}
