<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index,follow"/>
    <title inertia>{{ config('app.name', 'The Best Alternative to Amazon Wishlist') }}</title>
    <link rel="canonical" href="https://spennypiggy.co" />
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=5" />
    <link rel="manifest"  href={{ URL::asset('/manifest.json') }}  />
    <link rel="mask-icon" href={{ URL::asset('/favicon.ico') }} />
    <link rel="icon" href={{ URL::asset('/favicon.ico') }} />
    <link rel="apple-touch-icon" href={{ URL::asset('/favicon.ico') }} />
    <link rel="apple-touch-icon-precomposed" href={{ URL::asset('/favicon.ico') }} />
    <link rel="shortcut icon" href={{ URL::asset('/favicon.ico') }} />
    <meta name="msapplication-TileColor" content="#05EFB8" />
    <meta name="msapplication-TileImage" content={{ URL::asset('/site.png') }}  >
    <meta name="theme-color" content="#05EFB8" />
    <meta name="description" content="For spicy creators to Safely recieve financial gifts" />
    <meta name="keywords" content="The Best Alternative to Amazon Wishlist, For spicy creators to Safely recieve financial gifts, Create Wishlist, Share Wishlist, Add Wishlist, Recieve Gifts, Send Gifts, Fans Funding." />
    <meta property="og:title" content="The Best Alternative to Amazon Wishlist" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="spennypiggy.co" />
    <meta property="og:image" content={{ URL::asset('/site.png') }} />
    <meta property="og:site_name" content="spennypiggy.co" />
    <meta property="og:description" content="For spicy creators to Safely recieve financial gifts" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="The Best Alternative to Amazon Wishlist" />
    <meta name="twitter:description" content="For spicy creators to Safely recieve financial gifts" />
    <meta name="twitter:image" content={{ URL::asset('/site.png') }} />
    <meta name="twitter:site" content="@spennypiggy" />
    <meta name="twitter:image:alt" content="The Best Alternative to Amazon Wishlist" />
    <meta name="twitter:image:src" content={{ URL::asset('/site.png') }} />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <!-- <script async type="text/javascript" src="/service-worker.js" ></script> -->
    <script async type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" ></script>
    
    @laravelPWA
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
