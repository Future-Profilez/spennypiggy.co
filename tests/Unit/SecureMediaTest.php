<?php

namespace Tests\Unit;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\Post;
use App\Models\Shop;
use App\Models\WishItem;
use App\Services\RewardService;
use App\Support\SecureMedia;
use Tests\TestCase;

/**
 * Signing paid content has two failure modes and this pins both.
 *
 * Signing TOO LITTLE leaves a permanent link to something a supporter paid for.
 * Signing TOO MUCH is worse: an expiry on an avatar, a cover or an OG image
 * breaks edge caching and link previews on a public marketing surface. Every
 * test below asserts one side or the other of that line.
 */
class SecureMediaTest extends TestCase
{
    private const UUID = '11111111-2222-3333-4444-555555555555';

    /** An even-length hex string — the shape hex2bin() requires. */
    private const KEY = 'a1b2c3d4e5f60718293a4b5c6d7e8f90';

    private function on(?int $ttl = null): void
    {
        config([
            'media.secure.enabled' => true,
            'media.secure.ttl' => $ttl ?? 3600,
            'services.uploadcare.secure_key' => self::KEY,
        ]);
        SecureMedia::resetWarningLatch();
    }

    private function off(): void
    {
        config([
            'media.secure.enabled' => false,
            'services.uploadcare.secure_key' => self::KEY,
        ]);
    }

    // ---------------------------------------------------------------- signer

    public function test_flag_off_returns_the_url_byte_for_byte(): void
    {
        $this->off();
        $url = 'https://ucarecdn.com/'.self::UUID.'/-/format/jpeg/';

        $this->assertSame($url, SecureMedia::sign($url));
    }

    public function test_signing_appends_a_token_and_preserves_the_operation_chain(): void
    {
        $this->on();
        $ops = '/-/preview/800x800/-/format/jpeg/-/quality/smart/';
        $url = 'https://ucarecdn.com/'.self::UUID.$ops;

        $signed = SecureMedia::sign($url);

        // 🚨 A paid reward file is never re-processed to add auth: the whole
        // original path must survive untouched and the token lives after it.
        $this->assertStringStartsWith($url.'?token=exp=', $signed);
        $this->assertStringContainsString($ops, $signed);
        $this->assertMatchesRegularExpression('/~hmac=[0-9a-f]{64}$/', $signed);
    }

    public function test_the_acl_covers_transformations_not_just_the_bare_file(): void
    {
        $this->on();

        // Our paid URLs carry operation paths, so an ACL of the bare `/{uuid}/`
        // would authorise only the untransformed original — a 403 on every one.
        $this->assertStringContainsString('~acl=/'.self::UUID.'/*~', SecureMedia::sign('https://ucarecdn.com/'.self::UUID.'/'));
    }

    public function test_the_expiry_in_the_url_is_the_expiry_that_was_signed(): void
    {
        $this->on(600);
        $signed = SecureMedia::sign('https://ucarecdn.com/'.self::UUID.'/');

        preg_match('/token=(exp=\d+~acl=[^~]+)~hmac=([0-9a-f]{64})/', $signed, $m);
        $this->assertNotEmpty($m, 'token did not parse');

        // The SDK's own generator calls time() twice (once for the URL, once
        // inside the HMAC) and can disagree with itself by a second. Ours
        // computes the timestamp once.
        $this->assertSame(hash_hmac('sha256', $m[1], hex2bin(self::KEY)), $m[2]);

        preg_match('/exp=(\d+)/', $signed, $e);
        $this->assertEqualsWithDelta(time() + 600, (int) $e[1], 5);
    }

    public function test_ttl_is_clamped_at_both_ends(): void
    {
        // A token already expired on render is worse than none; a token beyond
        // 30 days is the permanent link this replaces, with extra steps.
        $this->on(1);
        $this->assertEqualsWithDelta(time() + 60, $this->expiryOf(SecureMedia::sign('https://ucarecdn.com/'.self::UUID.'/')), 5);

        $this->on(99999999);
        $this->assertEqualsWithDelta(time() + 2592000, $this->expiryOf(SecureMedia::sign('https://ucarecdn.com/'.self::UUID.'/')), 5);
    }

    public function test_delivery_ttl_is_longer_than_a_page_lifetime(): void
    {
        $this->on();
        config(['media.secure.delivery_ttl' => 2592000]);

        $this->assertGreaterThan(
            $this->expiryOf(SecureMedia::sign('https://ucarecdn.com/'.self::UUID.'/')),
            $this->expiryOf(SecureMedia::signForDelivery('https://ucarecdn.com/'.self::UUID.'/'))
        );
    }

    // ------------------------------------------------------------ fails open

    /**
     * 🚨 The single most important property here. Signing depends on an
     * Uploadcare ACCOUNT SETTING we cannot switch on from code, so every doubt
     * must degrade to the URL that works today, never to a broken one.
     *
     * @dataProvider unsignableProvider
     */
    public function test_fails_open($input): void
    {
        $this->on();
        $this->assertSame($input, SecureMedia::sign($input));
    }

    public static function unsignableProvider(): array
    {
        return [
            'null' => [null],
            'false — "this item has no file"' => [false],
            'empty string' => [''],
            'another host' => ['https://example.com/'.self::UUID.'/'],
            'http, not https' => ['http://ucarecdn.com/'.self::UUID.'/'],
            'a group id, not a file' => ['https://ucarecdn.com/'.self::UUID.'~3/nth/0/'],
            'not a uuid at all' => ['https://ucarecdn.com/not-a-uuid/'],
            'already carries a token' => ['https://ucarecdn.com/'.self::UUID.'/?token=exp=1~acl=/x/~hmac=deadbeef'],
        ];
    }

    public function test_a_non_hex_key_serves_unsigned_rather_than_broken(): void
    {
        config([
            'media.secure.enabled' => true,
            // A non-hex key: hex2bin() cannot accept it, and AkamaiToken (the
            // SDK class the old dead signer used) throws outright on one.
            // Signing must degrade to "unsigned", never to an exception on a
            // live page.
            'services.uploadcare.secure_key' => null,
            'services.uploadcare.secret' => 'abcdefghij0123456789kl',
        ]);
        SecureMedia::resetWarningLatch();

        $url = 'https://ucarecdn.com/'.self::UUID.'/';
        $this->assertSame($url, SecureMedia::sign($url));
    }

    public function test_a_missing_key_serves_unsigned(): void
    {
        config([
            'media.secure.enabled' => true,
            'services.uploadcare.secure_key' => null,
            'services.uploadcare.secret' => null,
        ]);
        SecureMedia::resetWarningLatch();

        $url = 'https://ucarecdn.com/'.self::UUID.'/';
        $this->assertSame($url, SecureMedia::sign($url));
    }

    // ------------------------------------------------- what IS and IS NOT signed

    public function test_paid_accessors_are_signed(): void
    {
        $this->on();

        $wish = new WishItem(['reward' => self::UUID, 'content_file' => self::UUID]);
        $this->assertStringContainsString('token=', (string) $wish->reward_url);
        $this->assertStringContainsString('token=', (string) $wish->content_file_url);

        $bill = new Bills(['content_file' => self::UUID]);
        $this->assertStringContainsString('token=', (string) $bill->content_file_url);

        $membership = new Membership(['content_file' => self::UUID]);
        $this->assertStringContainsString('token=', (string) $membership->content_file_url);

        $shop = new Shop(['reward_file' => self::UUID]);
        $this->assertStringContainsString('token=', (string) $shop->reward_file_url);

        // The one builder for the unified reward_file column — covers task and
        // Piggy Pot, which have no accessor of their own.
        $this->assertStringContainsString('token=', RewardService::media(self::UUID)['url']);
    }

    /**
     * 🚨 Signing the wrong things is a worse outcome than signing none.
     * A public card thumbnail is edge-cached, feeds OG previews and is meant to
     * outlive any session.
     */
    public function test_public_thumbnails_are_never_signed(): void
    {
        $this->on();

        $this->assertStringNotContainsString('token=', (string) (new WishItem(['thumbnail' => self::UUID]))->perma_link);
        $this->assertStringNotContainsString('token=', (string) (new Bills(['thumbnail' => self::UUID]))->perma_link);
        $this->assertStringNotContainsString('token=', (string) (new Membership(['thumbnail' => self::UUID]))->perma_link);
        $this->assertStringNotContainsString('token=', (string) (new Shop(['image' => self::UUID]))->perma_link);
    }

    public function test_a_public_post_image_is_not_signed_but_a_members_only_one_is(): void
    {
        $this->on();

        $public = new Post(['image' => self::UUID, 'for_module' => 'public']);
        $this->assertStringNotContainsString('token=', (string) $public->image_url);

        foreach (['membership', 'subscription', 'support'] as $gated) {
            $post = new Post(['image' => self::UUID, 'for_module' => $gated]);
            $this->assertStringContainsString('token=', (string) $post->image_url, $gated.' post image should be signed');
        }
    }

    public function test_the_reward_contract_leaves_the_bare_uuid_unsigned(): void
    {
        $this->on();

        // Callers re-derive their own URLs from `uuid`, and a signed string
        // there would be stored back by any form that round-trips the field.
        $this->assertSame(self::UUID, RewardService::media(self::UUID)['uuid']);
    }

    public function test_a_creators_own_non_uploadcare_link_is_left_alone(): void
    {
        $this->on();

        $shop = new Shop(['reward_file' => 'https://dropbox.example/file.zip']);
        $this->assertSame('https://dropbox.example/file.zip', $shop->reward_file_url);
    }

    private function expiryOf($signed): int
    {
        preg_match('/exp=(\d+)/', (string) $signed, $m);

        return (int) ($m[1] ?? 0);
    }
}
