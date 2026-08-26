<?php

namespace App\Support;

use App\Models\SocialLinks;
use Illuminate\Support\Str;

/**
 * One reading of "what social account is this?".
 *
 * 🚨 THE COLUMN ALREADY HOLDS THREE DIFFERENT THINGS, BECAUSE NOTHING EVER NORMALISED IT.
 * Measured on live data, 25 Aug 2026, across the three accepted platforms:
 *
 *     full URL  20   ·   @handle  17   ·   bare handle  21
 *
 * All three are "correct" to whoever typed them and none of them can be compared to
 * another, so a duplicate is invisible and a stored value cannot be turned back into a
 * profile link without guessing. Every NEW handle goes through here first; the existing
 * rows are deliberately left alone (see the note on backfilling below).
 *
 * ⚠️ The platform list is `SocialLinks::ACCEPTED_PLATFORMS`, never restated. It was
 * narrowed from thirteen to three on 11 Aug 2026 by client decision, and a second copy
 * here is a second thing to forget the next time it moves.
 */
class SocialHandle
{
    /**
     * The hosts each platform is reachable on, so a pasted link can be checked against
     * the platform the creator picked rather than trusted.
     *
     * ⚠️ A link to the WRONG platform is refused rather than silently filed under the
     * chosen one — "I picked Instagram and pasted my TikTok" is a mistake worth telling
     * somebody about, and storing it produces a contact route that goes nowhere.
     */
    private const HOSTS = [
        'twitter' => ['twitter.com', 'www.twitter.com', 'mobile.twitter.com', 'x.com', 'www.x.com'],
        'instagram' => ['instagram.com', 'www.instagram.com', 'instagr.am'],
        'tiktok' => ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com', 'm.tiktok.com'],
    ];

    /** What each platform actually allows in a handle. */
    private const PATTERNS = [
        // X caps at 15 and allows no dots.
        'twitter' => '/^[A-Za-z0-9_]{1,15}$/',
        'instagram' => '/^[A-Za-z0-9._]{1,30}$/',
        'tiktok' => '/^[A-Za-z0-9._]{2,24}$/',
    ];

    /**
     * First path segments that are NOT a profile.
     *
     * ⚠️ Somebody pasting the link to their newest post is the ordinary case, not the
     * exotic one — and `instagram.com/p/Cxyz` passes the handle pattern happily, so
     * without this the stored "handle" is the literal word `p`. Every one of these is a
     * dead contact route that looks exactly like a live one.
     */
    private const RESERVED = [
        'twitter' => ['i', 'home', 'search', 'hashtag', 'intent', 'status', 'explore', 'notifications', 'messages'],
        'instagram' => ['p', 'reel', 'reels', 'tv', 'stories', 'explore', 'accounts', 'direct'],
        'tiktok' => ['video', 'tag', 'discover', 'foryou', 'following', 'live'],
    ];

    /** @return array<int, string> */
    public static function platforms(): array
    {
        return SocialLinks::ACCEPTED_PLATFORMS;
    }

    public static function supports(?string $platform): bool
    {
        return $platform !== null && in_array($platform, self::platforms(), true);
    }

    /**
     * The bare, lower-cased handle, or NULL when the input cannot be read as one.
     *
     * ⚠️ Lower-cased because handles are case-insensitive on all three platforms, and a
     * value stored in whatever case it was typed in cannot be compared to another. What
     * is stored is the identifier, not the creator's styling of it.
     */
    public static function normalise(?string $platform, ?string $raw): ?string
    {
        if (! self::supports($platform)) {
            return null;
        }

        $value = trim((string) $raw);

        if ($value === '') {
            return null;
        }

        $handle = self::looksLikeUrl($value)
            ? self::handleFromUrl($platform, $value)
            : ltrim($value, '@');

        if ($handle === null || $handle === '') {
            return null;
        }

        $handle = strtolower($handle);

        if (in_array($handle, self::RESERVED[$platform], true)) {
            return null;
        }

        return preg_match(self::PATTERNS[$platform], $handle) === 1 ? $handle : null;
    }

    /**
     * A message the creator can act on, or null when the input is fine (or empty).
     *
     * ⚠️ Empty is NOT an error. The field is optional everywhere it is used, and a
     * required-by-accident social handle on the signup form would gate account creation
     * on something nobody has to give us.
     */
    public static function errorFor(?string $platform, ?string $raw): ?string
    {
        $value = trim((string) $raw);

        if ($value === '') {
            return null;
        }

        if (! self::supports($platform)) {
            return 'Choose Instagram, X or TikTok first.';
        }

        if (self::looksLikeUrl($value) && self::hostOf($value) !== null && ! self::hostBelongsTo($platform, $value)) {
            return 'That link is not a '.self::label($platform).' link. Paste the right one, or just type your username.';
        }

        if (self::normalise($platform, $value) === null) {
            return 'That does not look like a '.self::label($platform).' username. Type it without the @, or paste your profile link.';
        }

        return null;
    }

    public static function label(string $platform): string
    {
        return match ($platform) {
            'twitter' => 'X',
            'instagram' => 'Instagram',
            'tiktok' => 'TikTok',
            default => ucfirst($platform),
        };
    }

    /** The public profile URL for a stored handle — the whole point of normalising. */
    public static function profileUrl(string $platform, string $handle): ?string
    {
        return match ($platform) {
            'twitter' => 'https://x.com/'.$handle,
            'instagram' => 'https://instagram.com/'.$handle,
            'tiktok' => 'https://tiktok.com/@'.$handle,
            default => null,
        };
    }

    private static function looksLikeUrl(string $value): bool
    {
        return Str::contains($value, ['://', '.com', '.am']) || Str::startsWith($value, 'www.');
    }

    private static function hostOf(string $value): ?string
    {
        // `parse_url` puts a scheme-less "instagram.com/jane" entirely in `path`, so the
        // scheme is added before parsing rather than after guessing.
        $withScheme = Str::contains($value, '://') ? $value : 'https://'.ltrim($value, '/');

        $host = parse_url($withScheme, PHP_URL_HOST);

        return is_string($host) && $host !== '' ? strtolower($host) : null;
    }

    private static function hostBelongsTo(string $platform, string $value): bool
    {
        $host = self::hostOf($value);

        return $host !== null && in_array($host, self::HOSTS[$platform], true);
    }

    private static function handleFromUrl(string $platform, string $value): ?string
    {
        if (! self::hostBelongsTo($platform, $value)) {
            return null;
        }

        $withScheme = Str::contains($value, '://') ? $value : 'https://'.ltrim($value, '/');
        $path = (string) parse_url($withScheme, PHP_URL_PATH);

        $segment = collect(explode('/', trim($path, '/')))
            ->filter(fn ($part) => $part !== '')
            ->first();

        return $segment === null ? null : ltrim($segment, '@');
    }
}
