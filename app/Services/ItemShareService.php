<?php

namespace App\Services;

use App\SeoMeta;
use Illuminate\Support\Str;

/**
 * Makes a single listing shareable.
 *
 * Two problems this solves, both invisible until you paste a link somewhere:
 *
 *  1. **A shared item link unfurled as the generic site card.** The shop item and task
 *     pages emitted no OpenGraph at all, so WhatsApp / X / Slack showed the platform's
 *     default image and description instead of the product. SSR is off, so an Inertia
 *     `<Head>` would not have helped — an unfurler never runs the page's JavaScript, and
 *     the meta has to be in the server-rendered `<head>`.
 *  2. **Traffic a creator sent was recorded as `direct`.** Share links now carry a utm
 *     source, so `VisitTracker` and the funnels can finally attribute it.
 *
 * ONLY genuinely public pages belong here. Membership and bill detail pages sit behind
 * `auth`, so an unfurler is redirected to login and there is nothing to tag; the wish
 * "page" is the creator profile and is handled by AuthenticatedSessionController.
 */
class ItemShareService
{
    /** The utm source every in-app share link carries. Mirrored in VisitTracker::SOURCES. */
    public const SHARE_SOURCE = 'creator_share';

    /**
     * Per-type field mapping.
     *
     * `image` only names the column. What that column HOLDS varies — Task stores a full
     * CDN URL, Shop stores a uuid that may or may not already carry operations — so
     * imageFor() normalises whatever it finds rather than trusting a per-type flag.
     */
    private const TYPES = [
        'shop' => [
            'route' => 'single-shop-list',
            'title' => 'name',
            'description' => 'description',
            'image' => 'image',
            'noun' => 'item',
        ],
        'task' => [
            'route' => 'task.show',
            'title' => 'title',
            'description' => 'description',
            'image' => 'media_url',
            'noun' => 'creator service',
        ],
    ];

    public static function supports(string $type): bool
    {
        return array_key_exists($type, self::TYPES);
    }

    /** Canonical public URL for a listing. Null when the type has no public page. */
    public static function urlFor($item, string $type): ?string
    {
        if (! self::supports($type) || ! $item) {
            return null;
        }

        return match ($type) {
            'shop' => route('single-shop-list', [
                'slug' => Str::slug((string) $item->name) ?: 'item',
                'uuid' => $item->uuid,
            ]),
            'task' => route('task.show', ['uuid' => $item->uuid]),
            default => null,
        };
    }

    /**
     * The URL a creator hands out. Same page, tagged so the visit is attributable.
     *
     * Without this every share lands in the funnels as `direct` and creator-driven
     * traffic is indistinguishable from someone typing the address.
     */
    public static function shareUrl($item, string $type): ?string
    {
        $url = self::urlFor($item, $type);

        if (! $url) {
            return null;
        }

        return $url.(str_contains($url, '?') ? '&' : '?').'utm_source='.self::SHARE_SOURCE;
    }

    /**
     * Card image, sized for a link preview.
     *
     * ⚠️ `-/quality/smart/`, never `-/quality/85/` — the numeric form is not a valid
     * Uploadcare operation and the CDN answers 400, which shows up as a broken preview
     * rather than an error anyone would notice.
     */
    public static function imageFor($item, string $type): ?string
    {
        $config = self::TYPES[$type] ?? null;

        if (! $config) {
            return null;
        }

        $raw = trim((string) ($item->{$config['image']} ?? ''));

        if ($raw === '') {
            return null;
        }

        // ⚠️ Always extract the uuid, whatever shape the column happens to hold.
        //
        // Task stores a full CDN URL and Shop stores a "bare" uuid — except a Shop image
        // can ALSO arrive with operations already appended (`<uuid>/-/crop/…/-/preview/`).
        // Treating that as a plain uuid and concatenating produced
        // `…/-/preview//-/scale_crop/…` — a double slash, a crop chained onto a crop, and
        // a preview image that is wrong or dead. Normalising to the uuid first is the only
        // shape that is correct for every stored variant.
        $uuid = self::uuidFromUrl($raw);

        if (! $uuid) {
            // A non-Uploadcare absolute URL is used as-is; anything else is unusable.
            return str_starts_with($raw, 'http') ? $raw : null;
        }

        return "https://ucarecdn.com/{$uuid}/-/scale_crop/1200x630/center/-/format/jpeg/-/quality/smart/";
    }

    /**
     * Pull the uuid out of whatever the column holds — a bare uuid, a full CDN URL, or
     * a uuid that already carries operations.
     */
    private static function uuidFromUrl(string $value): ?string
    {
        if (preg_match('/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i', $value, $m)) {
            return $m[1];
        }

        return null;
    }

    /**
     * Title / description / image / url for a listing.
     *
     * ⚠️ The description NEVER contains `reward_body` — that is the paid content, and a
     * link preview is the most public surface on the platform. Only the reward headline
     * and the creator's own public description are used.
     */
    public static function metaFor($item, string $type, $creator): array
    {
        $config = self::TYPES[$type] ?? null;

        if (! $config || ! $item) {
            return [];
        }

        $name = trim((string) ($item->{$config['title']} ?? '')) ?: 'Exclusive content';
        $creatorName = trim((string) ($creator->name ?? $creator->username ?? '')) ?: 'a creator';

        $title = Str::limit("{$name} · {$creatorName} on Spenny Piggy", 60, '');

        $description = self::description($item, $config, $creatorName, $name);

        return [
            'title' => $title,
            'description' => $description,
            'image' => self::imageFor($item, $type),
            'url' => self::urlFor($item, $type),
        ];
    }

    /**
     * Content-first description.
     *
     * Meta is printed in search results and social cards, so the Stripe content rules
     * apply here in full — no gift, tip, donation or fundraising wording, and the item
     * is described as something bought, not something given.
     */
    private static function description($item, array $config, string $creatorName, string $name): string
    {
        $own = trim(strip_tags((string) ($item->{$config['description']} ?? '')));
        $reward = trim((string) ($item->reward_title ?? ''));

        $parts = array_filter([
            $own !== '' ? $own : null,
            $reward !== '' ? "You get: {$reward}" : null,
        ]);

        if (empty($parts)) {
            $parts[] = "Buy {$name} from {$creatorName} on Spenny Piggy.";
        }

        return Str::limit(implode(' · ', $parts), 160, '');
    }

    /**
     * Emit the server-side meta for a listing page.
     *
     * Called from the page controller, not from JS: an unfurler never executes the
     * page, so anything set client-side is invisible to it.
     */
    public static function applySeo($item, string $type, $creator): void
    {
        $meta = self::metaFor($item, $type, $creator);

        if (empty($meta['url'])) {
            return;
        }

        SeoMeta::addTag('title', $meta['title']);
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $meta['description']]);
        SeoMeta::setCanonical($meta['url']);
        SeoMeta::setOgData('product', $meta['title'], $meta['description'], $meta['image'], $meta['url']);
        SeoMeta::setTwitterCard('summary_large_image', $meta['title'], $meta['description'], $meta['image']);
        SeoMeta::addJsonLd(self::productSchema($item, $type, $creator, $meta));
    }

    /**
     * Product + Offer structured data.
     *
     * Deliberately generic rather than reusing SeoTemplateService::generateProductSchema,
     * which reads WishItem's own columns (`wishname`) and builds a wish URL.
     */
    public static function productSchema($item, string $type, $creator, array $meta): array
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $meta['title'],
            'url' => $meta['url'],
            'description' => $meta['description'],
            'brand' => ['@type' => 'Brand', 'name' => 'Spenny Piggy'],
        ];

        if (! empty($meta['image'])) {
            $schema['image'] = $meta['image'];
        }

        if (! empty($item->price) && ! empty($item->currency)) {
            $schema['offers'] = [
                '@type' => 'Offer',
                'price' => number_format((float) $item->price, 2, '.', ''),
                'priceCurrency' => strtoupper((string) $item->currency),
                // Sold out is deliberately still InStock-shaped nowhere: availability is
                // reported honestly, but the page stays shareable because the waitlist
                // is what a sold-out visitor is there for.
                'availability' => self::availability($item, $type),
                'url' => $meta['url'],
                'seller' => [
                    '@type' => 'Person',
                    'name' => $creator->name ?? $creator->username ?? 'Creator',
                ],
            ];
        }

        return $schema;
    }

    private static function availability($item, string $type): string
    {
        if ($type === 'shop'
            && $item->slot_limitation !== null
            && (int) $item->slot_limitation <= 0) {
            return 'https://schema.org/OutOfStock';
        }

        return 'https://schema.org/InStock';
    }

    /**
     * Prefilled text for the share sheet.
     *
     * Kept short: every platform truncates, and the link preview carries the detail.
     * Content-first — it describes a purchase, never a gift or a donation.
     */
    public static function captionFor($item, string $type, $creator): string
    {
        $config = self::TYPES[$type] ?? null;
        $name = trim((string) ($item->{$config['title'] ?? 'name'} ?? '')) ?: 'my latest';
        $handle = trim((string) ($creator->username ?? ''));

        return $handle !== ''
            ? "{$name} — now available from @{$handle} on Spenny Piggy"
            : "{$name} — now available on Spenny Piggy";
    }

    /** Everything the frontend share control needs, in one prop. */
    public static function payloadFor($item, string $type, $creator): array
    {
        return [
            'url' => self::shareUrl($item, $type),
            'title' => $item->{self::TYPES[$type]['title']} ?? '',
            'caption' => self::captionFor($item, $type, $creator),
        ];
    }
}
