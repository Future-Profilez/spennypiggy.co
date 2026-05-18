<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\SeoMeta;

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
        
        $seoData = [
            '/' => [
                'title' => 'Spenny Piggy — Creator Monetisation Platform 🐷 Memberships, Wishlists & Tips',
                'description' => 'Creator monetisation done right. Memberships, wishlists, paid tasks and tips in one place. Set your price — supporters cover platform fees. UK, US & global. 🐷',
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
                'title' => 'Spenny Piggy Features — Memberships, Wishlists, Paid Tasks & Tips',
                'description' => 'Everything creators need to monetise: memberships, wishlists, paid tasks, tips, fraud protection, and real human support. All in one platform.',
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
        ];

        // Landing Pages mapping
        $landingPages = [
            'creators',
            'creators/stripe-safe',
            'creators/keep-100',
            'creators/features',
            'creators/disputes',
            'creators/founder-bonus',
            'pride',
            'giftstore',
            'how-it-works',
            'discover',
            'creator-supporter-contract',
            'founder-program'
        ];
        
        $match = null;
        
        if (isset($seoData[$path])) {
            $match = $seoData[$path];
        } else if (in_array($path, $landingPages)) {
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
            SeoMeta::addTag('link', ['rel' => 'canonical', 'href' => $url]);
        }

        return $next($request);
    }
}