<?php

namespace App\Http\Middleware;

use App\SeoMeta;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StaticPageSeoMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $path = ltrim($request->path(), '/');
        if ($path === '') {
            $path = '/';
        }
        $url = url($request->path());
        $image = url('/og-image.png');

        // ⚠️ A non-production host is never indexable, whatever the path rules
        // below say. dev.spennypiggy.co served the same pages as production and
        // was fully indexed. The meta tag alone is not enough — a link unfurler
        // or a fetcher that never renders the markup only sees headers — so the
        // response carries `X-Robots-Tag` as well, applied below.
        $indexable = (bool) config('seo.indexable');

        SeoMeta::setRobots($indexable ? 'index,follow' : 'noindex,nofollow,noarchive');

        // A page only belongs in the index if a stranger arriving from a search
        // result gets something useful. Everything below is either signed-in-only,
        // a step inside a purchase, or a one-off token URL — indexing it wastes
        // crawl budget and puts a personal page in front of the wrong person.
        $noIndexExact = [
            'login',
            'register',
            'forgot-password',
            'verification',
            'account',
            'dashboard',
            'cart',
            'checkout',
            'thank-you',
            'my-purchases',
            'history',
            'settings',
            'subscriptions',
            'email-preferences',
            'notifications',
            'support',
            'refer-and-earn',
            // Coming-soon screen while RYE is kill-switched — nothing to index.
            'giftstore',
        ];
        $noIndexPrefixes = [
            'reset-password/',
            'admin/',
            'debug',
            'test',
            'checkout/',
            'cart/',
            'financial',
            'creator/',
            'my-purchases',
            'unsubscribe/',
            'emulate',
            'webhook',
            'seo/',
            'dev/',
        ];
        if (in_array($path, $noIndexExact, true) || Str::startsWith($path, $noIndexPrefixes)) {
            SeoMeta::setRobots('noindex,follow');
        }

        // The leaderboard is the same board six times over (daily … all time).
        // Only the default is worth indexing; the rest point their canonical at it
        // so the ranking signals land on one URL instead of splitting six ways.
        if (Str::startsWith($path, 'leaderboard/')) {
            SeoMeta::setRobots('noindex,follow');
            SeoMeta::setCanonical(url('/leaderboard'));
        }

        $seoData = [
            // ⚠️ Meta copy is a Stripe-facing surface — it is printed in search
            // results and social cards, so the content-first ban list applies in
            // full. Both of these said "tips" until 10 Aug 2026, which is the one
            // word the platform renamed a whole feature to avoid.
            '/' => [
                'title' => 'Spenny Piggy — Creator Monetisation Platform 🐷 Content, Memberships & Paid Requests',
                'description' => 'Creator monetisation done right. Sell content, memberships, paid requests and your own products in one place. Set your price — supporters cover platform fees. UK, US & global. 🐷',
            ],
            'register' => [
                'title' => 'Sign Up as a Creator on Spenny Piggy — Free in 5 Minutes',
                'description' => 'Become a creator on Spenny Piggy in 5 minutes. Set up memberships, wishlists and paid tasks. Fast verification, fast payouts. Start earning today.',
            ],
            'login' => [
                'title' => 'Sign In to Spenny Piggy',
                'description' => 'Sign in to your Spenny Piggy account to manage your creator profile, view earnings, and connect with your supporters.',
            ],
            'pricing' => [
                'title' => 'Spenny Piggy Pricing — Transparent Fees Explained 🐷',
                'description' => 'Set your price, supporters cover platform fees at checkout. No hidden costs, no surprises. See exactly how Spenny Piggy pricing works for creators.',
            ],
            'features' => [
                'title' => 'Spenny Piggy Features — Memberships, Wishlists, Paid Tasks & Piggy Bank',
                'description' => 'Everything creators need to monetise: memberships, wishlists, paid tasks, exclusive content, fraud protection, and real human support. All in one platform.',
            ],
            'about' => [
                'title' => 'About Spenny Piggy — Built for Serious Creators 🐷',
                'description' => 'Spenny Piggy is a creator monetisation platform built for sustainable creator income. Real fraud protection, real human support, real long-term thinking.',
            ],
            'contact' => [
                'title' => 'Contact Spenny Piggy — Support & Enquiries',
                'description' => 'Get in touch with the Spenny Piggy team. Email support@spennypiggy.co or phone 020 335 52057. Real humans, real fast responses.',
            ],
            'leaderboard' => [
                'title' => 'Spenny Piggy Leaderboard 👑 Top Creators & Supporters',
                'description' => 'See the top creators and supporters on Spenny Piggy. The leaderboard updates regularly — celebrate the community making it all happen 🐷',
            ],
            'terms-and-conditions' => [
                'title' => 'Terms & Conditions — Spenny Piggy',
                'description' => 'Spenny Piggy Terms of Service. The full legal framework covering creator and supporter use of the platform. Last updated April 2026.',
            ],
            'privacy-policy' => [
                'title' => 'Privacy Policy — Spenny Piggy',
                'description' => 'How Spenny Piggy collects, uses and protects your personal data. Full GDPR-compliant privacy policy for creators and supporters.',
            ],
            'cookies-policy' => [
                'title' => 'Cookies Policy — Spenny Piggy',
                'description' => 'How Spenny Piggy uses cookies and similar technologies. Full cookies policy with details on the cookies we set and how to manage them.',
            ],
            'creator-agreement' => [
                'title' => 'Creator Agreement — Spenny Piggy',
                'description' => 'The agreement governing creator use of Spenny Piggy. Merchant of Record status, content responsibilities, payouts and platform rules.',
            ],
            'supporter-terms' => [
                'title' => 'Supporter Terms — Spenny Piggy',
                'description' => 'Terms for supporters using Spenny Piggy. Payment authorisation, refunds, chargebacks, and how transactions work between supporters and creators.',
            ],
            'return-policy' => [
                'title' => 'Return, Refund & Cancellation Policy — Spenny Piggy',
                'description' => 'Spenny Piggy refund and cancellation policy. When refunds are available, subscription cancellation rules, and your statutory consumer rights.',
            ],
            'paid-tasks-terms' => [
                'title' => 'Paid Tasks Terms — Spenny Piggy',
                'description' => 'Terms governing the Paid Tasks feature on Spenny Piggy. Creator acceptance rules, delivery timeframes, auto-refunds and prohibited use.',
            ],
            'reserves-and-payments-policy' => [
                'title' => 'Payments, Payouts & Reserves Policy — Spenny Piggy',
                'description' => 'How Spenny Piggy handles payments, payouts and reserves. Weekly payout cycle, reserve rates by risk classification, and chargeback recovery.',
            ],
            'mor-agreement' => [
                'title' => 'Merchant of Record Agreement — Spenny Piggy',
                'description' => 'The Merchant of Record agreement creators acknowledge during Stripe Connect onboarding. Confirms creator responsibility for transactions.',
            ],
            'us-addendum' => [
                'title' => 'US Terms Addendum — Spenny Piggy',
                'description' => 'Additional terms applicable to US-based users of Spenny Piggy. Read alongside our main Terms of Service and Platform Legal Framework.',
            ],
            'copyright-policy' => [
                'title' => 'Copyright & IP Policy — Spenny Piggy',
                'description' => 'Spenny Piggy copyright and intellectual property policy. DMCA notices, content takedown procedures, and IP protection for creators.',
            ],
            'creators' => [
                'title' => 'Monetise Your Content with Spenny Piggy — Built for Creators 🐷',
                'description' => 'Join Spenny Piggy to start earning from your content. Offer memberships, wishlists, paid tasks, and exclusive content. Set your price, keep your earnings, and let supporters cover the fees.',
            ],
            'creators/stripe-safe' => [
                'title' => 'Stripe Safe Payments for Creators — Spenny Piggy',
                'description' => 'Spenny Piggy partners with Stripe for secure, fast, and reliable payouts. Enjoy peace of mind with enterprise-grade fraud protection and automatic weekly transfers.',
            ],
            'creators/keep-100' => [
                'title' => 'Keep 100% of Your Set Price — Spenny Piggy Pricing',
                'description' => 'On Spenny Piggy, you keep 100% of the price you set. We add a small platform fee at checkout so your supporters cover the costs. No hidden fees, just transparent earnings.',
            ],
            'creators/features' => [
                'title' => 'Creator Features — Memberships, Wishlists & Paid Tasks 🐷',
                'description' => 'Discover all the tools Spenny Piggy offers to grow your income. From monthly memberships and custom wishlists to paid tasks and one-off content sales.',
            ],
            'creators/disputes' => [
                'title' => 'Chargeback & Dispute Protection for Creators — Spenny Piggy',
                'description' => 'Spenny Piggy provides real human support and dedicated dispute management. We fight chargebacks on your behalf to protect your income and keep your business safe.',
            ],
            'creators/founder-bonus' => [
                'title' => 'Spenny Piggy Founder Bonus — Earn Extra Rewards 👑',
                'description' => 'Join the Spenny Piggy Founder Bonus program. Hit your monthly targets and earn extra cash bonuses as a reward for growing your community on our platform.',
            ],
            'pride' => [
                'title' => 'Pride on Spenny Piggy — Celebrating LGBTQ+ Creators 🏳️‍🌈',
                'description' => 'Spenny Piggy proudly supports and celebrates our LGBTQ+ creators. Discover amazing talent, support diverse voices, and join an inclusive community.',
            ],
            // Not open yet — the page is a coming-soon screen, so the meta says so
            // rather than advertising a store nobody can buy from. Content-first
            // wording only (no gift/tip/donation framing).
            'giftstore' => [
                'title' => 'Oink Store — Coming soon',
                'description' => 'The Oink Store is not open yet. Soon you will be able to buy physical products from creators on Spenny Piggy, shipped direct to your door.',
            ],
            'how-spenny-piggy-works' => [
                'title' => 'How Spenny Piggy Works — Payments & Content',
                'description' => 'How Spenny Piggy works: every payment buys creator content or a content membership. A plain-English payments and content policy for supporters and payment partners.',
            ],
            'discover' => [
                'title' => 'Discover Creators on Spenny Piggy 🐷',
                'description' => 'Explore and discover amazing creators on Spenny Piggy. Find new communities, support fresh talent, and engage with creators offering exclusive memberships and wishlists.',
            ],
            'creator-supporter-contract' => [
                'title' => 'Creator-Supporter Contract — Trust & Transparency',
                'description' => 'Read the Spenny Piggy Creator-Supporter Contract. We believe in clear expectations, transparent transactions, and building trust between creators and their communities.',
            ],
            'founder-program' => [
                'title' => 'The Spenny Piggy Founder Program — Grow With Us',
                'description' => 'Be part of the Spenny Piggy Founder Program. Early adopters get exclusive perks, dedicated support, and bonus incentives for building their presence on our platform.',
            ],
        ];

        // Landing Pages mapping
        $landingPages = [];

        $match = null;

        if (isset($seoData[$path])) {
            $match = $seoData[$path];
        } elseif (in_array($path, $landingPages)) {
            $topic = ucwords(str_replace(['-', '/'], [' ', ' '], str_replace('creators', '', $path)));
            if (trim($topic) === '') {
                $topic = 'Creators';
            }
            $topic = trim($topic);

            $match = [
                'title' => "{$topic} — Spenny Piggy 🐷",
                'description' => "Explore {$topic} on Spenny Piggy. Discover how our platform empowers creators with memberships, wishlists, and paid tasks globally.",
            ];
        }

        if ($match) {
            SeoMeta::addTag('title', $match['title']);
            SeoMeta::addTag('meta', ['name' => 'description', 'content' => $match['description']]);

            $keywords = isset($match['keywords']) ? $match['keywords'] : 'Spenny Piggy, Creator Monetisation, Memberships, Wishlists, Paid Tasks, Fans Funding, Support Creators';
            SeoMeta::addTag('meta', ['name' => 'keywords', 'content' => $keywords]);

            // Open Graph
            SeoMeta::addTag('meta', ['property' => 'og:title', 'content' => $match['title']]);
            SeoMeta::addTag('meta', ['property' => 'og:description', 'content' => $match['description']]);
            SeoMeta::addTag('meta', ['property' => 'og:image', 'content' => $image]);
            SeoMeta::addTag('meta', ['property' => 'og:url', 'content' => $url]);
            SeoMeta::addTag('meta', ['property' => 'og:type', 'content' => 'website']);
            SeoMeta::addTag('meta', ['property' => 'og:site_name', 'content' => 'Spenny Piggy']);

            // Twitter Card
            SeoMeta::addTag('meta', ['name' => 'twitter:card', 'content' => 'summary_large_image']);
            SeoMeta::addTag('meta', ['name' => 'twitter:title', 'content' => $match['title']]);
            SeoMeta::addTag('meta', ['name' => 'twitter:description', 'content' => $match['description']]);
            SeoMeta::addTag('meta', ['name' => 'twitter:image', 'content' => $image]);
            SeoMeta::addTag('meta', ['name' => 'twitter:site', 'content' => '@spennypiggy']);

            // Canonical
            SeoMeta::setCanonical($url);

            $segments = array_values(array_filter(explode('/', $path)));
            $breadcrumbs = [
                ['name' => 'Home', 'url' => url('/')],
            ];
            if (! empty($segments)) {
                $accum = '';
                foreach ($segments as $seg) {
                    $accum .= '/'.$seg;
                    $breadcrumbs[] = [
                        'name' => ucwords(str_replace('-', ' ', $seg)),
                        'url' => url($accum),
                    ];
                }
            }
            SeoMeta::addBreadcrumbJsonLd($breadcrumbs);
        }

        $response = $next($request);

        // The header covers what the meta tag cannot: fetchers that read headers
        // and never render the page. Set on the whole response, not per path,
        // because on a non-production host nothing on it belongs in an index.
        if (! $indexable && method_exists($response, 'header')) {
            $response->header('X-Robots-Tag', 'noindex, nofollow, noarchive');
        }

        return $response;
    }
}
