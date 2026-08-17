<?php

namespace App\Support;

/**
 * The ONE definition of what a bio-page link may point at.
 *
 * 🚨 THIS CLASS IS THE SECURITY BOUNDARY, NOT THE PICKER UI. A creator submits
 * a platform key and a handle; the URL is built here and nowhere else. Three
 * things follow from that and must not be traded away for convenience:
 *
 *   1. `/bio/go/{uuid}` can never be an open redirect. It rebuilds the
 *      destination from a stored key, so a crafted request has nothing to
 *      inject — there is no URL anywhere in the request or the row.
 *   2. A link cannot pass review and change afterwards. `bit.ly/x` reviewed on
 *      Monday resolves wherever its owner points it on Tuesday, which makes
 *      reviewing a shortened URL meaningless. No host outside this list is
 *      reachable at all.
 *   3. Most links need no human review. The destination host is fixed and the
 *      handle is regex-bounded, so only the creator's own LABEL is free text —
 *      and that goes through the same two moderation rules every sellable
 *      module's title already uses.
 *
 * ⚠️ ADDING A PLATFORM IS A COMPLIANCE DECISION, NOT A CONFIG TWEAK. Spenny
 * Piggy is the merchant of record for the content sold on the same page, so an
 * adult destination or an off-platform payment destination is not merely a
 * traffic leak — it is our checkout page linking to it. Nothing that takes
 * money (Patreon, Ko-fi, Throne, YouPay) and nothing adult goes in this list.
 *
 * ⚠️ Deliberately NOT reusing SocialLinks::ACCEPTED_PLATFORMS. Those three are
 * the handles an admin reviewed to VERIFY the creator, and they live under the
 * profile-change-request flow; these are display links the creator edits
 * freely. Same words, different jobs — a creator moving their bio link must
 * never touch the handle their verification rests on.
 */
class BioLinkPlatforms
{
    /**
     * Off-platform destinations.
     *
     * `pattern` bounds the handle to what the network itself accepts, so a
     * handle can never carry a path, a query string or a second host.
     */
    public const PLATFORMS = [
        'instagram' => [
            'label' => 'Instagram',
            'url' => 'https://instagram.com/{handle}',
            'pattern' => '/^[A-Za-z0-9._]{1,30}$/',
            'placeholder' => 'yourname',
        ],
        'tiktok' => [
            'label' => 'TikTok',
            'url' => 'https://tiktok.com/@{handle}',
            'pattern' => '/^[A-Za-z0-9._]{2,24}$/',
            'placeholder' => 'yourname',
        ],
        'twitter' => [
            'label' => 'X',
            'url' => 'https://x.com/{handle}',
            'pattern' => '/^[A-Za-z0-9_]{1,15}$/',
            'placeholder' => 'yourname',
        ],
        'youtube' => [
            'label' => 'YouTube',
            'url' => 'https://youtube.com/@{handle}',
            'pattern' => '/^[A-Za-z0-9._-]{3,30}$/',
            'placeholder' => 'yourchannel',
        ],
        'twitch' => [
            'label' => 'Twitch',
            'url' => 'https://twitch.tv/{handle}',
            'pattern' => '/^[A-Za-z0-9_]{4,25}$/',
            'placeholder' => 'yourchannel',
        ],
        'discord' => [
            // The handle is an INVITE CODE, not a username — a Discord username
            // has no public URL, so linking one would produce a dead button.
            'label' => 'Discord',
            'url' => 'https://discord.gg/{handle}',
            'pattern' => '/^[A-Za-z0-9-]{2,25}$/',
            'placeholder' => 'invite code',
        ],
        'spotify' => [
            // Spotify has no handles; an artist page is a 22-character base62
            // id taken from the share link.
            'label' => 'Spotify',
            'url' => 'https://open.spotify.com/artist/{handle}',
            'pattern' => '/^[A-Za-z0-9]{22}$/',
            'placeholder' => 'artist id',
        ],
    ];

    /**
     * On-platform destinations. `page` is the `{page?}` segment of the existing
     * profile catch-all, so every one of these lands on a screen that already
     * exists and is already gated — this page adds no new way to reach anything.
     *
     * `requires` names the BioPageService availability check; a section the
     * creator does not use is never rendered, so the page has no dead buttons.
     */
    public const INTERNAL_TARGETS = [
        'wishes' => ['label' => 'My wishlist', 'page' => 'wishes', 'requires' => 'wishes'],
        'shop' => ['label' => 'Shop', 'page' => 'shop', 'requires' => 'shop'],
        'piggy-pots' => ['label' => 'Piggy Pots', 'page' => 'piggy-pots', 'requires' => 'piggyPots'],
        'memberships' => ['label' => 'Memberships', 'page' => 'memberships', 'requires' => 'memberships'],
        'bills' => ['label' => 'Subscriptions', 'page' => 'bills', 'requires' => 'bills'],
        'tasks' => ['label' => 'Paid tasks', 'page' => 'tasks', 'requires' => 'tasks'],
        // The Piggy Bank is a widget on the About tab rather than a page of its
        // own, so its button lands there.
        'piggy-bank' => ['label' => 'Unlock content', 'page' => 'about', 'requires' => 'piggyBank'],
        'feed' => ['label' => 'Latest posts', 'page' => 'feed', 'requires' => 'feed'],
    ];

    /** The order a page renders in before the creator has reordered anything. */
    public const DEFAULT_ORDER = [
        'piggy-bank',
        'wishes',
        'piggy-pots',
        'shop',
        'memberships',
        'bills',
        'tasks',
        'feed',
    ];

    public const KIND_INTERNAL = 'internal';

    public const KIND_EXTERNAL = 'external';

    public const KIND_STABLECOIN = 'stablecoin';

    public const KINDS = [self::KIND_INTERNAL, self::KIND_EXTERNAL, self::KIND_STABLECOIN];

    /** A creator cannot add more external links than this. */
    public const MAX_EXTERNAL_LINKS = 12;

    public static function platform(?string $key): ?array
    {
        return self::PLATFORMS[$key] ?? null;
    }

    public static function internalTarget(?string $key): ?array
    {
        return self::INTERNAL_TARGETS[$key] ?? null;
    }

    public static function isPlatform(?string $key): bool
    {
        return $key !== null && isset(self::PLATFORMS[$key]);
    }

    public static function isInternalTarget(?string $key): bool
    {
        return $key !== null && isset(self::INTERNAL_TARGETS[$key]);
    }

    /**
     * Strip what a creator will paste anyway — a full profile URL, an '@', a
     * trailing slash — down to the bare handle.
     *
     * ⚠️ This is a convenience, never the gate. It runs BEFORE validation, and
     * anything it fails to normalise is refused by the pattern rather than
     * quietly accepted. Never let it "fix" a value into passing.
     */
    public static function normaliseHandle(?string $raw): string
    {
        $value = trim((string) $raw);

        if ($value === '') {
            return '';
        }

        // A pasted URL: keep the last non-empty path segment, which is the
        // handle on every network in the list above.
        if (preg_match('#^(https?:)?//#i', $value) || str_contains($value, '/')) {
            $path = parse_url($value, PHP_URL_PATH) ?: $value;
            $segments = array_values(array_filter(explode('/', $path), fn ($s) => $s !== ''));
            $value = $segments === [] ? '' : end($segments);
        }

        return ltrim($value, '@');
    }

    public static function handleIsValid(string $platformKey, string $handle): bool
    {
        $platform = self::platform($platformKey);

        if ($platform === null || $handle === '') {
            return false;
        }

        return (bool) preg_match($platform['pattern'], $handle);
    }

    /**
     * Build the outbound URL. Returns null rather than a half-built string for
     * anything not on the list — the caller is a redirect, and a redirect with
     * a questionable destination must not happen at all.
     */
    public static function externalUrl(?string $platformKey, ?string $handle): ?string
    {
        $platform = self::platform($platformKey);
        $handle = (string) $handle;

        if ($platform === null || ! self::handleIsValid($platformKey, $handle)) {
            return null;
        }

        return str_replace('{handle}', rawurlencode($handle), $platform['url']);
    }

    /** The on-platform destination for an internal button. */
    public static function internalUrl(?string $targetKey, string $username): ?string
    {
        $target = self::internalTarget($targetKey);

        if ($target === null) {
            return null;
        }

        return route('user.show', ['username' => $username, 'page' => $target['page']]);
    }

    /** Picker payload for the editor — labels, placeholders, no patterns. */
    public static function pickerOptions(): array
    {
        return array_map(
            fn ($key, $meta) => [
                'key' => $key,
                'label' => $meta['label'],
                'placeholder' => $meta['placeholder'],
            ],
            array_keys(self::PLATFORMS),
            self::PLATFORMS
        );
    }
}
