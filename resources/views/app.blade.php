<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index,follow" />
    {{-- <title inertia>    le> --}}

    {!! \App\SeoMeta::render() !!}
    
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="Exclusive Content, Memberships & More!" />
    <meta property="twitter:description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />
    <meta property="twitter:image" content="{{ URL::asset('/siteicon.png') }}" />
    <meta property="twitter:site" content="@spennypiggy" />
    <meta property="twitter:image:alt" content="Exclusive Content, Memberships & More!" />
    <meta property="twitter:image:src" content="{{ URL::asset('/siteicon.png') }}" />

    <link rel="canonical" href="https://spennypiggy.co" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="mask-icon" href="{{ URL::asset('/favicon.ico') }}" />
    <link rel="icon" href="{{ URL::asset('/favicon.ico') }}" />
    <link rel="apple-touch-icon" href="{{ URL::asset('/favicon.ico') }}" />
    <link rel="apple-touch-icon-precomposed" href="{{ URL::asset('/favicon.ico') }}" />
    <link rel="shortcut icon" href="{{ URL::asset('/favicon.ico') }}" />
    <meta name="msapplication-TileColor" content="#05EFB8" />
    <meta name="msapplication-TileImage" content="{{ URL::asset('/siteicon.png') }}">
    <meta name="theme-color" content="#05EFB8" />
    <meta name="description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />
    <meta name="keywords"
        content="Exclusive Content, Memberships & More!, Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!, Create Wishlist, Share Wishlist, Add Wishlist, Recieve Gifts, Send Gifts, Fans Funding. The Best Alternative to Amazon Wishlist" />

    <meta property="og:title" content="Exclusive Content, Memberships & More!" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="spennypiggy.co" />
    <meta property="og:image" content="{{ URL::asset('/siteicon.png') }}" />
    <meta property="og:site_name" content="spennypiggy.co" />
    <meta property="og:description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js"></script>

    <!-- <script src="https://sdk.canva.com/v1/button.js"></script> -->

    <script>
        const css1 = [
            "font-size: 15px",
            "display:block",
            "color:#37e1ad",
            "width: 100%",
            "padding:30px 30px",
        ];
        console.log("%cWelcome to Spenny Piggy.", css1.join(";"));
    </script>
    
    <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "url": "https://spennypiggy.co/",
            "potentialAction": {
                "@type": "SearchAction",
                "target": "https://spennypiggy.co/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
            }
        }
    </script>
    
    {{-- @laravelPWA --}}
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])
    @inertiaHead
    <!-- "resources/js/Pages/{$page['component']}.jsx" -->
</head>

<body className="font-sans antialiased">
    @inertia
</body>

</html>
