<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <title inertia>{{ config('app.name', 'The Best Alternative to Amazon Wishlist') }}</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />
    <!-- Metas start -->
    <link rel="canonical" href="https://spennypiggy.co" />
    <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=2" />
    <link rel="manifest"  href={{env("FILE_URL")."/manifest.json"}} />
    <link rel="mask-icon" href={{env("FILE_URL")."/favicon.ico"}} />
    <link rel="icon" href={{env("FILE_URL")."/favicon.ico"}} />
    <link rel="apple-touch-icon" href={{env("FILE_URL")."/favicon.ico"}} />
    <link rel="apple-touch-icon-precomposed" href={{env("FILE_URL")."/favicon.ico"}} />
    <link rel="shortcut icon" href={{env("FILE_URL")."/favicon.ico"}} />
    <meta name="msapplication-TileColor" content="#05EFB8" />
    <meta name="msapplication-TileImage" content={{env("FILE_URL")."/site.png"}}  >
    <meta name="theme-color" content="#05EFB8" />
    <meta name="description" content="For spicy creators to Safely recieve financial gifts" />
    <meta name="keywords" content="The Best Alternative to Amazon Wishlist, For spicy creators to Safely recieve financial gifts, Create Wishlist, Share Wishlist, Add Wishlist, Recieve Gifts, Send Gifts, Fans Funding." />
    <meta property="og:title" content="The Best Alternative to Amazon Wishlist" />
    <meta property="og:type" content="video.movie" />
    <meta property="og:url" content="spennypiggy.co" />
    <meta property="og:image" content={{env("FILE_URL")."/site.png"}} />
    <meta property="og:site_name" content="spennypiggy.co" />
    <meta property="og:description" content="For spicy creators to Safely recieve financial gifts" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="The Best Alternative to Amazon Wishlist" />
    <meta name="twitter:description" content="For spicy creators to Safely recieve financial gifts" />
    <meta name="twitter:image" content={{env("FILE_URL")."/site.png"}} />
    <meta name="twitter:site" content="@spennypiggy" />
    <meta name="twitter:image:alt" content="The Best Alternative to Amazon Wishlist" />
    <meta name="twitter:image:src" content={{env("FILE_URL")."/site.png"}} />
    <meta name="apple-mobile-web-app-capable" content="yes" />

    <script type="text/javascript"> 
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('https://d352qugnflhnxw.cloudfront.net/10954687-295e-4a13-9c92-1688e776c243/service-worker.js', {scope: '.'
            }).then(function (registration) {
                console.log('Service worker installed: ', registration.scope);
            }, function (err) {
                console.log('Laravel PWA: ServiceWorker registration failed: ', err);
            });
        }
    </script>

    <!-- Scripts -->
    @laravelPWA
    @routes
    @viteReactRefresh
    @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
    @inertiaHead
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
