<?php

namespace App\Services;

use App\SeoMeta;

/**
 * Titles, descriptions and structured data for the dynamic pages (creator profiles,
 * wish pages, discover).
 *
 * ⚠️ Everything this class emits is a Stripe-facing surface — it is what Google
 * prints in a search result and what a shared link previews as. The content-first
 * rules apply in full: a page sells creator CONTENT. Never "gift", "tip",
 * "donation", "tribute", "fundraise" or a bill/expense.
 */
class SeoTemplateService
{
    /**
     * Generate SEO meta tags for creator profile pages
     *
     * @param  object  $creator
     * @return void
     */
    public static function setCreatorMeta($creator)
    {
        $title = static::getCreatorTitle($creator);
        $description = static::getCreatorDescription($creator);
        $image = static::getCreatorOgImage($creator);
        $canonicalUrl = SeoMeta::getPageCanonical('user.show', ['username' => $creator->username]);

        // Set basic meta
        SeoMeta::addTag('title', $title);
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);

        $keywords = "{$creator->name}, {$creator->username}, creator, exclusive content, memberships, Spenny Piggy";
        if (! empty($creator->creator_category)) {
            $keywords .= ", {$creator->creator_category}";
        }
        SeoMeta::addTag('meta', ['name' => 'keywords', 'content' => $keywords]);

        SeoMeta::setCanonical($canonicalUrl);

        // Set OpenGraph
        SeoMeta::setOgData('profile', $title, $description, $image, $canonicalUrl);

        // Set Twitter Card
        SeoMeta::setTwitterCard('summary_large_image', $title, $description, $image);

        // Add structured data for Person
        $personSchema = static::generatePersonSchema($creator);
        SeoMeta::addJsonLd($personSchema);
    }

    /**
     * Generate SEO meta tags for wishlist pages
     *
     * @param  object  $creator
     * @param  object  $wishItem
     * @return void
     */
    public static function setWishlistMeta($creator, $wishItem)
    {
        $title = static::getWishItemTitle($creator, $wishItem);
        $description = static::getWishItemDescription($creator, $wishItem);
        $image = ! empty($wishItem->thumbnail)
            ? "https://ucarecdn.com/{$wishItem->thumbnail}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/"
            : static::getDefaultImage();
        $canonicalUrl = SeoMeta::getPageCanonical('wish.show', [
            'username' => $creator->username,
            'id' => $wishItem->id,
        ]);

        // Set basic meta
        SeoMeta::addTag('title', $title);
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);

        $keywords = "{$wishItem->wishname}, exclusive content, {$creator->name}, {$creator->username}, Spenny Piggy";
        if ($wishItem->category) {
            $keywords .= ", {$wishItem->category}";
        }
        SeoMeta::addTag('meta', ['name' => 'keywords', 'content' => $keywords]);

        SeoMeta::setCanonical($canonicalUrl);

        // Set OpenGraph
        SeoMeta::setOgData('product', $title, $description, $image, $canonicalUrl);

        // Set Twitter Card
        SeoMeta::setTwitterCard('summary_large_image', $title, $description, $image);

        // Add structured data for Product
        $productSchema = static::generateProductSchema($wishItem, $creator);
        SeoMeta::addJsonLd($productSchema);
    }

    /**
     * Generate SEO meta tags for discover page
     *
     * @param  string|null  $filter
     * @return void
     */
    public static function setDiscoverMeta($filter = null)
    {
        $title = $filter
            ? 'Discover '.ucfirst($filter).' Creators – SpennyPiggy'
            : 'Discover Amazing Creators – SpennyPiggy';

        $description = $filter
            ? 'Explore '.$filter.' creators on Spenny Piggy. Buy their exclusive content, memberships and paid requests.'
            : 'Discover creators on Spenny Piggy. Buy exclusive content, join memberships and unlock creator-made rewards.';

        $canonicalUrl = SeoMeta::getPageCanonical('discover');

        SeoMeta::addTag('title', static::validateTitle($title));
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => static::validateDescription($description)]);

        $keywords = $filter
            ? "discover creators, {$filter} creators, SpennyPiggy creators, support {$filter}"
            : 'discover creators, top creators, SpennyPiggy creators, support creators';
        SeoMeta::addTag('meta', ['name' => 'keywords', 'content' => $keywords]);

        SeoMeta::setCanonical($canonicalUrl);

        // Set OpenGraph
        SeoMeta::setOgData('website', $title, $description, static::getDefaultImage(), $canonicalUrl);

        // Set Twitter Card
        SeoMeta::setTwitterCard('summary', $title, $description, static::getDefaultImage());
    }

    /**
     * Generate title for creator profile
     *
     * @param  object  $creator
     * @return string
     */
    public static function getCreatorTitle($creator)
    {
        $title = $creator->name.' — Exclusive Content | Spenny Piggy';

        return static::validateTitle($title);
    }

    /**
     * Generate description for creator profile
     *
     * @param  object  $creator
     * @return string
     */
    public static function getCreatorDescription($creator)
    {
        $desc = 'Buy exclusive content from '.$creator->name.' on Spenny Piggy. ';
        $desc .= 'Memberships, one-off unlocks and paid requests — delivered by the creator.';

        if ($creator->bio) {
            $desc = trim((string) $creator->bio).' | '.$desc;
        }

        return static::validateDescription($desc);
    }

    /**
     * Generate title for wishlist item
     *
     * @param  object  $creator
     * @param  object  $wishItem
     * @return string
     */
    public static function getWishItemTitle($creator, $wishItem)
    {
        $title = $wishItem->wishname.' — '.$creator->name.' | Spenny Piggy';

        return static::validateTitle($title);
    }

    /**
     * Generate description for wishlist item
     *
     * @param  object  $creator
     * @param  object  $wishItem
     * @return string
     */
    public static function getWishItemDescription($creator, $wishItem)
    {
        $desc = 'Unlock "'.$wishItem->wishname.'" from '.$creator->name.' on Spenny Piggy. ';

        // WishItem has no `description` column — the buyer-facing blurb is
        // reward_description (the reward contract). Reading ->description gave
        // null on every row, so this sentence never appeared.
        $blurb = $wishItem->reward_description ?? null;
        if (! empty($blurb)) {
            $desc .= trim((string) $blurb).' ';
        }

        $desc .= 'Secure checkout, content delivered by the creator.';

        return static::validateDescription($desc);
    }

    /**
     * Generate Person structured data
     *
     * @param  object  $creator
     * @return array
     */
    public static function generatePersonSchema($creator)
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Person',
            'name' => $creator->name,
            'url' => url('/'.$creator->username),
            'description' => $creator->bio ?? 'Creator on SpennyPiggy',
        ];

        if ($creator->avatar) {
            $schema['image'] = static::getCreatorAvatarUrl($creator);
        }

        // Add social media links if available
        $sameAs = [];
        if (isset($creator->twitter) && $creator->twitter) {
            $sameAs[] = 'https://twitter.com/'.$creator->twitter;
        }
        if (isset($creator->instagram) && $creator->instagram) {
            $sameAs[] = 'https://instagram.com/'.$creator->instagram;
        }

        if (! empty($sameAs)) {
            $schema['sameAs'] = $sameAs;
        }

        return $schema;
    }

    /**
     * Generate Product structured data for wish items
     *
     * @param  object  $wishItem
     * @param  object  $creator
     * @return array
     */
    public static function generateProductSchema($wishItem, $creator)
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $wishItem->wishname,
            'url' => url('/'.$creator->username.'/wish/'.$wishItem->id),
            'brand' => [
                '@type' => 'Brand',
                'name' => 'SpennyPiggy',
            ],
        ];

        // `description` and `image_url` are not columns on WishItem — reading them
        // silently produced a Product with neither, which Google drops as incomplete.
        $description = $wishItem->reward_description ?? $wishItem->reward_title ?? null;
        if (! empty($description)) {
            $schema['description'] = trim((string) $description);
        }

        if (! empty($wishItem->thumbnail)) {
            $schema['image'] = 'https://ucarecdn.com/'.$wishItem->thumbnail.'/-/format/jpeg/';
        }

        if (! empty($wishItem->category)) {
            $schema['category'] = $wishItem->category;
        }

        if ($wishItem->price && $wishItem->currency) {
            $schema['offers'] = [
                '@type' => 'Offer',
                'price' => number_format((float) $wishItem->price, 2, '.', ''),
                'priceCurrency' => strtoupper((string) $wishItem->currency),
                'availability' => 'https://schema.org/InStock',
                'url' => $schema['url'],
                'seller' => [
                    '@type' => 'Person',
                    'name' => $creator->name,
                ],
            ];
        }

        return $schema;
    }

    /**
     * Get creator avatar URL
     *
     * @param  object  $creator
     * @return string
     */
    protected static function getCreatorAvatarUrl($creator)
    {
        if ($creator->avatar) {
            $baseUrl = 'https://ucarecdn.com/'.$creator->avatar.'/';
            $modifier = $creator->avatar_cdn_modifier ?? '-/resize/400x400/-/quality/smart/';

            return $baseUrl.$modifier;
        }

        return static::getDefaultImage();
    }

    /**
     * Get default image for social sharing
     *
     * @return string
     */
    protected static function getDefaultImage()
    {
        return url('/og-image.png');
    }

    protected static function getCreatorOgImage($creator)
    {
        if (! empty($creator->social_image)) {
            return "https://ucarecdn.com/{$creator->social_image}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }
        if (! empty($creator->cover)) {
            return "https://ucarecdn.com/{$creator->cover}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }
        if (! empty($creator->avatar)) {
            return "https://ucarecdn.com/{$creator->avatar}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }

        return static::getDefaultImage();
    }

    /**
     * Validate and truncate title to SEO best practices
     *
     * @param  string  $title
     * @param  int  $maxLength
     * @return string
     */
    public static function validateTitle($title, $maxLength = 60)
    {
        return strlen($title) <= $maxLength ? $title : substr($title, 0, $maxLength - 3).'...';
    }

    /**
     * Validate and truncate description to SEO best practices
     *
     * @param  string  $description
     * @param  int  $maxLength
     * @return string
     */
    public static function validateDescription($description, $maxLength = 160)
    {
        return strlen($description) <= $maxLength ? $description : substr($description, 0, $maxLength - 3).'...';
    }

    /**
     * Generate hreflang tags for internationalization
     *
     * @param  string  $currentPath
     * @return void
     */
    /**
     * Self-referencing hreflang.
     *
     * ⚠️ This used to point en-GB at `uk.spennypiggy.co`, a host that does not exist.
     * An hreflang to a dead URL is worse than none — Google drops the whole cluster
     * and the annotation is ignored for every page in it. There is one English site,
     * so it declares itself and x-default; add a real locale here only when a real
     * localised host exists.
     */
    public static function setHreflangTags($currentPath)
    {
        $href = rtrim(config('app.url'), '/').'/'.ltrim((string) $currentPath, '/');
        $href = rtrim($href, '/') ?: rtrim(config('app.url'), '/');

        SeoMeta::addTag('link', ['rel' => 'alternate', 'hreflang' => 'en', 'href' => $href]);
        SeoMeta::addTag('link', ['rel' => 'alternate', 'hreflang' => 'x-default', 'href' => $href]);
    }
}
