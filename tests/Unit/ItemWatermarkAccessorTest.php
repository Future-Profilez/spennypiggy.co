<?php

namespace Tests\Unit;

use App\Models\Post;
use App\Models\Shop;
use App\Models\User;
use App\Models\WishItem;
use App\Support\MediaUrl;
use Tests\TestCase;

/**
 * The item accessors that public preview surfaces render.
 *
 * In-memory models on purpose — no database. These assert URL construction, and
 * the point of the whole feature is that construction cannot go wrong.
 */
class ItemWatermarkAccessorTest extends TestCase
{
    private const IMG = '11111111-2222-3333-4444-555555555555';

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

    private function owner(?string $uuid = self::WM): User
    {
        $user = new User;
        $user->forceFill(['id' => 1, 'watermark_uuid' => $uuid]);

        return $user;
    }

    private function ops(): string
    {
        return '-/overlay/'.self::WM.'/34px34p/4p,90p/45p/';
    }

    public function test_post_image_url_is_unchanged_while_the_feature_is_off(): void
    {
        config(['media.watermark.enabled' => false]);

        $post = new Post(['image' => self::IMG]);
        $post->setRelation('user', $this->owner());

        $this->assertSame(
            MediaUrl::thumb(self::IMG, MediaUrl::POST_WIDTH),
            $post->image_url
        );
    }

    public function test_post_image_url_carries_the_overlay_when_the_owner_is_loaded(): void
    {
        $this->on();

        $post = new Post(['image' => self::IMG]);
        $post->setRelation('user', $this->owner());

        $this->assertSame(
            MediaUrl::thumb(self::IMG, MediaUrl::POST_WIDTH).$this->ops(),
            $post->image_url
        );
    }

    /**
     * 🚨 The load-bearing performance rule: no relation, no query, no watermark.
     * A lookup here would be one query per card on every feed on the site.
     */
    public function test_an_unloaded_owner_yields_no_watermark_and_no_query(): void
    {
        $this->on();

        $post = new Post(['image' => self::IMG]);

        $this->assertFalse($post->relationLoaded('user'));
        $this->assertSame(
            MediaUrl::thumb(self::IMG, MediaUrl::POST_WIDTH),
            $post->image_url
        );
    }

    public function test_the_override_works_without_loading_the_relation(): void
    {
        $this->on();

        $post = new Post(['image' => self::IMG]);
        $post->creatorWatermarkOverride = self::WM;

        $this->assertFalse($post->relationLoaded('user'));
        $this->assertStringEndsWith($this->ops(), $post->image_url);
    }

    public function test_a_generated_thank_you_image_is_never_watermarked(): void
    {
        $this->on();

        // The stored column already carries its own operations.
        $post = new Post(['image' => self::IMG.'/-/text/80px8p/8p,100p/thanks/-/font/40/fff']);
        $post->setRelation('user', $this->owner());

        $this->assertStringNotContainsString('-/overlay/', (string) $post->image_url);
    }

    public function test_a_post_with_no_image_still_returns_false(): void
    {
        $this->on();

        $post = new Post(['image' => null]);
        $post->setRelation('user', $this->owner());

        $this->assertFalse($post->image_url);
    }

    public function test_shop_perma_link_is_watermarked_and_degrades_to_the_original(): void
    {
        $this->on();

        $shop = new Shop(['image' => self::IMG]);
        $shop->setRelation('user', $this->owner());
        $this->assertStringEndsWith($this->ops(), $shop->perma_link);

        $bare = new Shop(['image' => self::IMG]);
        $this->assertSame(MediaUrl::thumb(self::IMG), $bare->perma_link);
    }

    public function test_wish_thumbnail_is_watermarked(): void
    {
        $this->on();

        $wish = new WishItem(['thumbnail' => self::IMG]);
        $wish->setRelation('user', $this->owner());

        $this->assertStringEndsWith($this->ops(), $wish->perma_link);
    }

    /**
     * The wish fallback is a PLATFORM image, not this creator's work.
     */
    public function test_the_wish_fallback_placeholder_is_never_watermarked(): void
    {
        $this->on();

        $wish = new WishItem(['thumbnail' => null]);
        $wish->setRelation('user', $this->owner());

        $this->assertSame(
            MediaUrl::thumb(MediaUrl::FALLBACK_THUMBNAIL),
            $wish->perma_link
        );
    }

    public function test_an_owner_without_a_watermark_changes_nothing(): void
    {
        $this->on();

        $post = new Post(['image' => self::IMG]);
        $post->setRelation('user', $this->owner(null));

        $this->assertSame(
            MediaUrl::thumb(self::IMG, MediaUrl::POST_WIDTH),
            $post->image_url
        );
    }
}
