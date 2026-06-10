<?php
namespace App\Services;
use App\SeoMeta;
class SeoTemplateService
{
    /**
     * Generate SEO meta tags for creator profile pages
     *
     * @param object $creator
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

        $keywords = "{$creator->name}, {$creator->username}, creator, memberships, wishlists, SpennyPiggy";
        if (!empty($creator->creator_category)) {
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
     * @param object $creator
     * @param object $wishItem
     * @return void
     */
    public static function setWishlistMeta($creator, $wishItem)
    {
        $title = static::getWishItemTitle($creator, $wishItem);
        $description = static::getWishItemDescription($creator, $wishItem);
        $image = !empty($wishItem->thumbnail)
            ? "https://ucarecdn.com/{$wishItem->thumbnail}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/"
            : static::getDefaultImage();
        $canonicalUrl = SeoMeta::getPageCanonical('wish.show', [
            'username' => $creator->username,
            'id' => $wishItem->id
        ]);
        
        // Set basic meta
        SeoMeta::addTag('title', $title);
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => $description]);

        $keywords = "{$wishItem->wishname}, gift, wishlist, {$creator->name}, {$creator->username}, SpennyPiggy";
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
     * @param string|null $filter
     * @return void
     */
    public static function setDiscoverMeta($filter = null)
    {
        $title = $filter 
            ? "Discover " . ucfirst($filter) . " Creators – SpennyPiggy"
            : "Discover Amazing Creators – SpennyPiggy";
            
        $description = $filter
            ? "Explore talented " . $filter . " creators on SpennyPiggy. Support their work with gifts, memberships, and more."
            : "Discover amazing creators on SpennyPiggy. Support their work, browse wishlists, and join exclusive memberships.";
        
        $canonicalUrl = SeoMeta::getPageCanonical('discover');
        
        SeoMeta::addTag('title', static::validateTitle($title));
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => static::validateDescription($description)]);

        $keywords = $filter 
            ? "discover creators, {$filter} creators, SpennyPiggy creators, support {$filter}"
            : "discover creators, top creators, SpennyPiggy creators, support creators";
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
     * @param object $creator
     * @return string
     */
    public static function getCreatorTitle($creator)
    {
        $title = $creator->name . " | SpennyPiggy - Creator Profile";
        return static::validateTitle($title);
    }
    
    /**
     * Generate description for creator profile
     *
     * @param object $creator
     * @return string
     */
    public static function getCreatorDescription($creator)
    {
        $desc = "Support " . $creator->name . " on SpennyPiggy. ";
        $desc .= "Browse their wishlist, join memberships, and send financial gifts safely.";
        
        if ($creator->bio) {
            $desc = $creator->bio . " | " . $desc;
        }
        
        return static::validateDescription($desc);
    }

    /**
     * Generate title for wishlist item
     *
     * @param object $creator
     * @param object $wishItem
     * @return string
     */
    public static function getWishItemTitle($creator, $wishItem)
    {
        $title = $wishItem->wishname . " - " . $creator->name . " | SpennyPiggy";
        return static::validateTitle($title);
    }

    /**
     * Generate description for wishlist item
     *
     * @param object $creator
     * @param object $wishItem
     * @return string
     */
    public static function getWishItemDescription($creator, $wishItem)
    {
        $desc = "Gift \"" . $wishItem->wishname . "\" to " . $creator->name . " on SpennyPiggy. ";
        
        if ($wishItem->description) {
            $desc .= $wishItem->description . " ";
        }
        
        $desc .= "Safe gifting platform with 100% secure payments.";
        
        return static::validateDescription($desc);
    }

    /**
     * Generate Person structured data
     *
     * @param object $creator
     * @return array
     */
    public static function generatePersonSchema($creator)
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Person',
            'name' => $creator->name,
            'url' => url('/' . $creator->username),
            'description' => $creator->bio ?? "Creator on SpennyPiggy"
        ];

        if ($creator->avatar) {
            $schema['image'] = static::getCreatorAvatarUrl($creator);
        }

        // Add social media links if available
        $sameAs = [];
        if (isset($creator->twitter) && $creator->twitter) {
            $sameAs[] = 'https://twitter.com/' . $creator->twitter;
        }
        if (isset($creator->instagram) && $creator->instagram) {
            $sameAs[] = 'https://instagram.com/' . $creator->instagram;
        }
        
        if (!empty($sameAs)) {
            $schema['sameAs'] = $sameAs;
        }

        return $schema;
    }

    /**
     * Generate Product structured data for wish items
     *
     * @param object $wishItem
     * @param object $creator
     * @return array
     */
    public static function generateProductSchema($wishItem, $creator)
    {
        $schema = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $wishItem->wishname,
            'url' => url('/' . $creator->username . '/wish/' . $wishItem->id),
            'brand' => [
                '@type' => 'Brand',
                'name' => 'SpennyPiggy'
            ]
        ];

        if ($wishItem->description) {
            $schema['description'] = $wishItem->description;
        }

        if ($wishItem->image_url) {
            $schema['image'] = $wishItem->image_url;
        }

        if ($wishItem->price && $wishItem->currency) {
            $schema['offers'] = [
                '@type' => 'Offer',
                'price' => $wishItem->price,
                'priceCurrency' => $wishItem->currency,
                'availability' => 'https://schema.org/InStock',
                'seller' => [
                    '@type' => 'Person',
                    'name' => $creator->name
                ]
            ];
        }

        return $schema;
    }

    /**
     * Get creator avatar URL
     *
     * @param object $creator
     * @return string
     */
    protected static function getCreatorAvatarUrl($creator)
    {
        if ($creator->avatar) {
            $baseUrl = 'https://ucarecdn.com/' . $creator->avatar . '/';
            $modifier = $creator->avatar_cdn_modifier ?? '-/resize/400x400/-/quality/smart/';
            return $baseUrl . $modifier;
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
        if (!empty($creator->social_image)) {
            return "https://ucarecdn.com/{$creator->social_image}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }
        if (!empty($creator->cover)) {
            return "https://ucarecdn.com/{$creator->cover}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }
        if (!empty($creator->avatar)) {
            return "https://ucarecdn.com/{$creator->avatar}/-/scale_crop/1200x630/center/-/format/jpg/-/quality/smart/";
        }
        return static::getDefaultImage();
    }

    /**
     * Validate and truncate title to SEO best practices
     *
     * @param string $title
     * @param int $maxLength
     * @return string
     */
    public static function validateTitle($title, $maxLength = 60)
    {
        return strlen($title) <= $maxLength ? $title : substr($title, 0, $maxLength - 3) . '...';
    }

    /**
     * Validate and truncate description to SEO best practices
     *
     * @param string $description
     * @param int $maxLength
     * @return string
     */
    public static function validateDescription($description, $maxLength = 160)
    {
        return strlen($description) <= $maxLength ? $description : substr($description, 0, $maxLength - 3) . '...';
    }

    /**
     * Generate hreflang tags for internationalization
     *
     * @param string $currentPath
     * @return void
     */
    public static function setHreflangTags($currentPath)
    {
        $baseUrl = config('app.url');
        $ukUrl = str_replace('https://spennypiggy.co', 'https://uk.spennypiggy.co', $baseUrl);
        
        // US/International version (default)
        SeoMeta::addTag('link', ['rel' => 'alternate', 'hreflang' => 'en', 'href' => $baseUrl . $currentPath]);
        SeoMeta::addTag('link', ['rel' => 'alternate', 'hreflang' => 'en-US', 'href' => $baseUrl . $currentPath]);
        
        // UK version
        SeoMeta::addTag('link', ['rel' => 'alternate', 'hreflang' => 'en-GB', 'href' => $ukUrl . $currentPath]);
        
        // Default fallback
        SeoMeta::addTag('link', ['rel' => 'alternate', 'hreflang' => 'x-default', 'href' => $baseUrl . $currentPath]);
    }
}
