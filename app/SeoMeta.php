<?php

namespace App;

use Illuminate\Support\Facades\Request;

/**
 * Dynamically Generate Seo Meta & Title Tags for Pages
 * Enhanced with dynamic canonical URLs, OpenGraph, and better meta management
 */
class SeoMeta
{
    /**
     * Dynamic SEO Tags structured as
     * tagType => tagProps[...props]
     * @var array
     */
    protected static $tags = [
        'title' => 'Spennypiggy | Financial Gifts, Exclusive Content & Memberships'
    ];

    /**
     * Add Tags in Meta Tags
     *
     * @param string $tag   Tag Name
     * @param string|array  $props  Tag Properties
     * @param string|null $content Content for script tags
     * @return void
     */
    public static function addTag($tag, $props, $content = null): void
    {
        if ($tag == 'title') {
            static::$tags[$tag] = $props;
        } else {
            static::$tags[$tag][] = ['props' => $props, 'content' => $content];
        }
    }

    /**
     * Set canonical URL for the page
     *
     * @param string $url
     * @return void
     */
    public static function setCanonical($url): void
    {
        $existing = static::$tags['link'] ?? [];
        if (is_array($existing)) {
            static::$tags['link'] = array_values(array_filter($existing, function ($item) {
                $props = is_array($item) && isset($item['props']) ? $item['props'] : $item;
                return !is_array($props) || ($props['rel'] ?? null) !== 'canonical';
            }));
        }

        static::addTag('link', ['rel' => 'canonical', 'href' => $url]);
    }

    public static function setRobots($robots, $googlebot = null): void
    {
        $existing = static::$tags['meta'] ?? [];
        if (is_array($existing)) {
            static::$tags['meta'] = array_values(array_filter($existing, function ($item) {
                $props = is_array($item) && isset($item['props']) ? $item['props'] : $item;
                $name = is_array($props) ? ($props['name'] ?? null) : null;
                return $name !== 'robots' && $name !== 'googlebot';
            }));
        }

        static::addTag('meta', ['name' => 'robots', 'content' => $robots]);
        static::addTag('meta', ['name' => 'googlebot', 'content' => $googlebot ?? $robots]);
    }

    /**
     * Get canonical URL for a specific route
     *
     * @param string $route
     * @param array $params
     * @return string
     */
    public static function getPageCanonical($route, $params = []): string
    {
        $baseUrl = config('app.url');
        
        switch ($route) {
            case 'user.show':
                return $baseUrl . '/' . $params['username'];
            case 'wish.show':
                return $baseUrl . '/' . $params['username'] . '/wish/' . $params['id'];
            case 'membership.show':
                return $baseUrl . '/' . $params['username'] . '/memberships';
            case 'discover':
                return $baseUrl . '/discover';
            case 'leaderboard':
                return $baseUrl . '/leaderboard';
            default:
                return $baseUrl . Request::getPathInfo();
        }
    }

    /**
     * Set OpenGraph data
     *
     * @param string $type
     * @param string $title
     * @param string $description
     * @param string|null $image
     * @param string|null $url
     * @return void
     */
    public static function setOgData($type, $title, $description, $image = null, $url = null): void
    {
        static::addTag('meta', ['property' => 'og:type', 'content' => $type]);
        static::addTag('meta', ['property' => 'og:title', 'content' => $title]);
        static::addTag('meta', ['property' => 'og:description', 'content' => $description]);
        
        if ($image) {
            static::addTag('meta', ['property' => 'og:image', 'content' => $image]);
        }
        
        if ($url) {
            static::addTag('meta', ['property' => 'og:url', 'content' => $url]);
        }
    }

    /**
     * Set Twitter Card data
     *
     * @param string $card
     * @param string $title
     * @param string $description
     * @param string|null $image
     * @return void
     */
    public static function setTwitterCard($card, $title, $description, $image = null): void
    {
        static::addTag('meta', ['name' => 'twitter:card', 'content' => $card]);
        static::addTag('meta', ['name' => 'twitter:title', 'content' => $title]);
        static::addTag('meta', ['name' => 'twitter:description', 'content' => $description]);
        
        if ($image) {
            static::addTag('meta', ['name' => 'twitter:image', 'content' => $image]);
        }
    }

    /**
     * Add JSON-LD structured data
     *
     * @param array $data
     * @return void
     */
    public static function addJsonLd($data): void
    {
        static::addTag('script', ['type' => 'application/ld+json'], json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
    }

    public static function setPaginationLinks($prevUrl = null, $nextUrl = null): void
    {
        if (!empty($prevUrl)) {
            static::addTag('link', ['rel' => 'prev', 'href' => $prevUrl]);
        }
        if (!empty($nextUrl)) {
            static::addTag('link', ['rel' => 'next', 'href' => $nextUrl]);
        }
    }

    public static function addBreadcrumbJsonLd(array $items): void
    {
        $list = [];
        $pos = 1;
        foreach ($items as $item) {
            $name = $item['name'] ?? null;
            $url = $item['url'] ?? null;
            if (empty($name) || empty($url)) {
                continue;
            }
            $list[] = [
                '@type' => 'ListItem',
                'position' => $pos++,
                'name' => $name,
                'item' => $url,
            ];
        }

        if (empty($list)) {
            return;
        }

        static::addJsonLd([
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $list,
        ]);
    }

    /**
     * Render Seo Tags
     *
     * @return string
     */
    public static function render()
    {
        $html = '';
        
        foreach (static::$tags as $tag => $sub) {
            if ($tag == 'title') {
                $html .= "<title inertia>$sub</title>" . PHP_EOL;
                continue;
            }

            if (is_array($sub)) {
                foreach ($sub as $item) {
                    $props = is_array($item) && isset($item['props']) ? $item['props'] : $item;
                    $content = is_array($item) && isset($item['content']) ? $item['content'] : null;
                    
                    $attr = '';
                    $html .= "<$tag ";
                    
                    if (is_array($props)) {
                        foreach ($props as $prop => $value) {
                            $attr .= "$prop=\"$value\" ";
                        }
                    } else {
                        $attr = $props;
                    }

                    $html .= "$attr";
                    
                    if ($content !== null) {
                        $html .= ">$content</$tag>" . PHP_EOL;
                    } else {
                        $html .= " />" . PHP_EOL;
                    }
                }
            }
        }

        return $html;
    }

    /**
     * Clear all tags (useful for testing)
     *
     * @return void
     */
    public static function clear(): void
    {
        static::$tags = [
            'title' => 'Spennypiggy | Financial Gifts, Exclusive Content & Memberships'
        ];
    }

    /**
     * Get all tags as array (useful for debugging)
     *
     * @return array
     */
    public static function toArray(): array
    {
        return static::$tags;
    }
}
