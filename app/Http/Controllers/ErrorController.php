<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\SeoMeta;
use App\Services\SeoTemplateService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ErrorController extends Controller
{
    /**
     * Show 404 page with SEO optimization and helpful content
     */
    public function show404()
    {
        // Set SEO meta tags for 404 page
        SeoMeta::addTag('title', 'Page Not Found – SpennyPiggy');
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => 'Sorry, this page could not be found. Discover amazing creators, browse wishlists, or explore our help resources on SpennyPiggy.']);
        SeoMeta::setCanonical(url('/404'));
        
        // Set OpenGraph for social sharing of 404 page
        SeoMeta::setOgData(
            'website',
            'Page Not Found – SpennyPiggy',
            'Oops! This page seems to have disappeared. Explore our amazing creators instead!',
            url('/siteicon.png'),
            url('/404')
        );
        
        // Add structured data for 404 page
        $webPageSchema = [
            '@context' => 'https://schema.org',
            '@type' => 'WebPage',
            'name' => 'Page Not Found',
            'description' => 'The requested page could not be found on SpennyPiggy.',
            'url' => url('/404'),
            'isPartOf' => [
                '@type' => 'WebSite',
                'name' => 'SpennyPiggy',
                'url' => url('/')
            ],
            'mainEntity' => [
                '@type' => 'Organization',
                'name' => 'SpennyPiggy',
                'url' => url('/')
            ]
        ];
        SeoMeta::addJsonLd($webPageSchema);

        // Get popular creators for suggestions
        try {
            $popularCreators = User::where('is_public_profile', 1)
                ->where('suspended_account', 0)
                ->select('id', 'username', 'name', 'avatar', 'avatar_cdn_modifier')
                ->limit(6)
                ->get();
        } catch (\Exception $e) {
            // Fallback if database query fails
            $popularCreators = collect();
        }

        // Help links for user assistance
        $helpLinks = [
            ['title' => 'How It Works', 'url' => '/how-it-works', 'description' => 'Learn how SpennyPiggy works'],
            ['title' => 'Discover Creators', 'url' => '/discover', 'description' => 'Find amazing creators to support'],
            ['title' => 'Leaderboard', 'url' => '/leaderboard', 'description' => 'See top creators and supporters'],
            ['title' => 'Help Center', 'url' => 'https://intercom.help/spenny-piggy/en/', 'description' => 'Get help with your account'],
        ];

        // Search suggestions
        $searchSuggestions = [
            'creators',
            'wishlists', 
            'memberships',
            'gifts',
            'support creators'
        ];

        return Inertia::render('Errors/404', [
            'popularCreators' => $popularCreators,
            'helpLinks' => $helpLinks,
            'searchSuggestions' => $searchSuggestions,
            'currentUrl' => request()->fullUrl(),
        ])->toResponse(request())->setStatusCode(404);
    }

    /**
     * Show 500 error page
     */
    public function show500()
    {
        SeoMeta::addTag('title', 'Server Error – SpennyPiggy');
        SeoMeta::addTag('meta', ['name' => 'description', 'content' => 'We are experiencing technical difficulties. Please try again later.']);
        
        return Inertia::render('Errors/500', [
            'message' => 'We are experiencing technical difficulties. Please try again later.',
        ])->toResponse(request())->setStatusCode(500);
    }
}