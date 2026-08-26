<?php

namespace App\Support;

/**
 * The ONE place a creator watermark is added to an Uploadcare URL.
 *
 * Everything here fails OPEN: on any doubt at all the caller's own URL is
 * returned byte-for-byte unchanged. A missing watermark costs attribution on
 * one image; a malformed CDN path is a broken image on a live page, and this
 * runs on the accessors behind every profile, feed and item card on the site.
 *
 * ⚠️ Callers must only pass IMAGE urls. Uploadcare's `-/overlay/` is an image
 * operation — on a video it is silently ignored, which reads as "the watermark
 * feature is broken" rather than as an unsupported file. `looksApplicable()`
 * catches the shapes we can detect from the URL alone; it cannot tell an image
 * uuid from a video uuid, so the call site is still the real gate.
 */
final class MediaUrl
{
    public const CDN = 'https://ucarecdn.com/';

    /**
     * The platform's own placeholder thumbnail, served whenever a listing has no
     * image of its own (wish, bill, shop, task, pot — Membership has its own
     * per-tier art, see Membership::defaultThumbnailUuid()).
     *
     * ⚠️ Read this const, never retype the uuid. It was copy-pasted into four
     * models and two JSX files, so a listing type added later simply rendered a
     * broken-image icon instead — which is what a creator reads as "my upload
     * failed", on a screen they cannot fix it from.
     */
    public const FALLBACK_THUMBNAIL = '901c0a0e-e5de-4d7a-8ac3-de11a4632542';

    /**
     * Platform-owned images that must never carry a creator's watermark — they
     * are not that creator's work.
     */
    private const PLACEHOLDERS = [
        self::FALLBACK_THUMBNAIL,
    ];

    /**
     * Longest-edge caps, in pixels, for every image the browser renders.
     *
     * 🚨 A browser holds a DECODED BITMAP, not the file. Cost is
     * `width × height × 4` bytes whatever the JPEG weighs — a 4032×3024 phone
     * photo is **48 MB of RAM**, and a creator profile renders a whole grid of
     * them plus an avatar and a cover. Ten uncapped images is ~490 MB, which is
     * how iOS came to kill the Safari tab on a profile the moment the user
     * switched apps: the page returns as a BLACK SCREEN with no error anywhere,
     * because the process it was running in is gone.
     *
     * Every accessor below therefore caps what it serves. `-/format/jpeg/`
     * converts (which is what makes a HEIC upload display at all) — it does not
     * downscale, and for a long time that was the only operation on these URLs.
     */
    public const THUMB_WIDTH = 800;

    public const AVATAR_WIDTH = 400;

    public const COVER_WIDTH = 1600;

    /**
     * Post images render larger than a card thumbnail (full-bleed in the feed,
     * larger again on the post detail page) and several are held in memory at
     * once while a feed scrolls, so this is the cap that matters most.
     *
     * ⚠️ Mirrored in `resources/js/Components/PostMediaCarousel.jsx` as the
     * `IMAGE_OPS` string — a multi-image post is composed client-side from bare
     * uuids and never passes through this accessor. Change both.
     */
    public const POST_WIDTH = 1200;

    /**
     * Fit-within operations for an image the browser will render.
     *
     * ⚠️ `-/preview/` and NOT `-/resize/`. Both cap a large image identically,
     * but `resize` UPSCALES anything smaller than the target — so a 200px
     * thumbnail would be stretched to 800px and cost 16× the memory this exists
     * to save. `preview` only ever scales down, and preserves aspect ratio.
     *
     * Safe to chain after an existing `-/preview/` or crop modifier: operations
     * apply in sequence, so the creator's own crop happens first and this caps
     * the result. Verified against the live CDN (chained previews answer 200).
     */
    /**
     * 🚨 A SQUARE, FACE-AWARE CROP — for avatars, which are drawn in a circle.
     *
     * `fitOps()` FITS an image inside the box and preserves its aspect ratio, so
     * a portrait photo stays a portrait. Dropped into a 56px circle with
     * `object-cover`, the browser then crops the middle of it — which on a
     * standing photo is a torso, not a face. Measured on the Birthdays cards:
     * three creators, none with a crop of their own, all showing a body.
     *
     * `scale_crop` crops to fill instead, and `smart` puts Uploadcare's own
     * face/subject detection in charge of WHERE. Verified against the CDN before
     * use (HTTP 200) — this project has shipped an invalid operation before
     * (`-/quality/85/`, which the CDN answers 400 to).
     *
     * ⚠️ Unlike `preview`, this CAN upscale a smaller source. For a 400px avatar
     * that is ~640KB decoded, which is nothing beside the multi-megabyte phone
     * photos the width caps exist for — and a slightly soft avatar beats a
     * beheaded one.
     */
    public static function squareOps(int $width): string
    {
        $width = max(1, min(4000, $width));

        return "-/scale_crop/{$width}x{$width}/smart/-/format/jpeg/-/quality/smart/";
    }

    public static function fitOps(int $width): string
    {
        $width = max(1, min(4000, $width));

        return "-/preview/{$width}x{$width}/-/format/jpeg/-/quality/smart/";
    }

    /**
     * A capped CDN URL for a bare file uuid.
     */
    public static function thumb(string $uuid, int $width = self::THUMB_WIDTH): string
    {
        return self::CDN.$uuid.'/'.self::fitOps($width);
    }

    /** A bare Uploadcare file uuid. Deliberately rejects group ids (`uuid~3`). */
    private const UUID = '/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i';

    /**
     * Operation arguments are interpolated straight into a URL path, so each is
     * held to the exact shape Uploadcare's parser accepts. A typo in config must
     * degrade to "no watermark", never to a 400 on a live image.
     *
     * 🚨 DIMENSIONS MUST BE TWO-DIMENSIONAL (`34px34p`, read as 34p × 34p).
     * Verified against the live CDN: with a one-dimensional value the operation
     * parses on its own but the COORDINATES that follow it do not, and the whole
     * request answers 400 —
     *   `overlay/<uuid>/34p/`            → 200
     *   `overlay/<uuid>/34p/4p,92p/45p/` → 400 "Failed to parse remainder"
     *   `overlay/<uuid>/34px34p/4p,92p/45p/` → 200
     * This cost a real 400 during implementation. Do not relax it to allow a
     * bare `34p`.
     */
    private const OPS_DIMENSIONS = '/^\d{1,4}p?x\d{1,4}p?$/i';

    /** `10p,90p`, `10,90`, or a keyword such as `center`. */
    private const OPS_COORDINATES = '/^(center|top|bottom|left|right|\d{1,4}p?,\d{1,4}p?)$/i';

    /** `45p`, or a bare number. */
    private const OPS_OPACITY = '/^\d{1,3}p?$/i';

    public static function enabled(): bool
    {
        return (bool) config('media.watermark.enabled', false);
    }

    /**
     * The extra column an owner eager-load needs, or an empty string.
     *
     * 🚨 Gated on the feature flag, and that is what makes the whole feature
     * safe to deploy. Naming `watermark_uuid` unconditionally in ~16 `with()`
     * selects across UserProfileService and DiscoveryService would throw an
     * unknown-column error on every Discover query and every profile listing in
     * the window between the code landing and the migration running — with the
     * feature switched OFF, which is the one state that must change nothing.
     *
     * It also keeps the payload shape identical while off: an unselected column
     * cannot appear as a new key in the JSON either.
     *
     * The cost of the gate is that enabling the flag before running the
     * migration errors — but enabling is a deliberate manual step (migrate,
     * pre-warm, then switch on), not something that happens by deploying.
     */
    public static function ownerColumn(): string
    {
        return self::enabled() ? ',watermark_uuid' : '';
    }

    /**
     * Append the creator's watermark overlay to an already-built image URL.
     *
     * @param  string|false|null  $url  Whatever the calling accessor produced.
     * @param  string|null  $watermarkUuid  The creator's `users.watermark_uuid`.
     * @return string|false|null The input, unchanged, unless every check passes.
     */
    public static function watermark($url, ?string $watermarkUuid)
    {
        if (! self::enabled()) {
            return $url;
        }

        // `false` and null are meaningful return values for several of these
        // accessors ("this item has no image") and must survive untouched.
        if (! is_string($url) || $url === '') {
            return $url;
        }

        if (! is_string($watermarkUuid) || preg_match(self::UUID, $watermarkUuid) !== 1) {
            return $url;
        }

        if (! self::looksApplicable($url)) {
            return $url;
        }

        $ops = self::overlayOps($watermarkUuid);

        if ($ops === null) {
            return $url;
        }

        // Uploadcare applies operations in order, so the overlay must come last
        // to be drawn on top of whatever the caller already asked for.
        return rtrim($url, '/').'/'.$ops;
    }

    /**
     * Is this URL one we can safely append an overlay to?
     */
    public static function looksApplicable(string $url): bool
    {
        if (! str_starts_with($url, self::CDN)) {
            return false;
        }

        // A query string or fragment would end up after the operations we
        // append, producing a path the CDN never sees.
        if (str_contains($url, '?') || str_contains($url, '#')) {
            return false;
        }

        $path = substr($url, strlen(self::CDN));

        if ($path === '') {
            return false;
        }

        // Already watermarked — appending a second overlay stacks two copies.
        if (str_contains($path, '/-/overlay/')) {
            return false;
        }

        // Generated thank-you images arrive with their own `-/text/` + `-/font/`
        // operations already baked into the stored column, and the platform —
        // not the creator — authored them.
        if (str_contains($path, '/-/text/') || str_contains($path, '/-/font/')) {
            return false;
        }

        $ref = strtok($path, '/');

        if ($ref === false || $ref === '') {
            return false;
        }

        if (in_array(strtolower($ref), self::PLACEHOLDERS, true)) {
            return false;
        }

        // Anything that is not a plain file uuid — a group, a proxied remote
        // URL, an already-transformed reference — is left alone.
        return preg_match(self::UUID, $ref) === 1;
    }

    /**
     * Build `-/overlay/:uuid/:dimensions/:coordinates/:opacity/`.
     *
     * Returns null when any configured argument fails validation, so a bad
     * config value yields an unwatermarked image rather than a broken URL.
     */
    public static function overlayOps(string $watermarkUuid): ?string
    {
        if (preg_match(self::UUID, $watermarkUuid) !== 1) {
            return null;
        }

        $args = [
            self::OPS_DIMENSIONS => (string) config('media.watermark.dimensions', '34px34p'),
            self::OPS_COORDINATES => (string) config('media.watermark.coordinates', '4p,90p'),
            self::OPS_OPACITY => (string) config('media.watermark.opacity', '45p'),
        ];

        foreach ($args as $pattern => $arg) {
            if ($arg === '' || preg_match($pattern, $arg) !== 1) {
                return null;
            }
        }

        return '-/overlay/'.strtolower($watermarkUuid).'/'.implode('/', array_values($args)).'/';
    }

    /**
     * The operation string handed to the frontend so JS never has to know the
     * overlay geometry. Null when watermarking is off or unavailable.
     */
    public static function opsFor(?string $watermarkUuid): ?string
    {
        if (! self::enabled() || ! is_string($watermarkUuid)) {
            return null;
        }

        return self::overlayOps($watermarkUuid);
    }
}
