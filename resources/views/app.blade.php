<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index,follow" />

    {!! \App\SeoMeta::render() !!}
    
    {{-- <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:title" content="Exclusive Content, Memberships & More!" />
    <meta property="twitter:description" content="Join Memberships, adopt bills & more. Safe for all Creators who receive 100% payouts!" />
    <meta property="twitter:image" content="{{ URL::asset('/siteicon.png') }}" />
    <meta property="twitter:site" content="@spennypiggy" />
    <meta property="twitter:image:alt" content="Exclusive Content, Memberships & More!" />
    <meta property="twitter:image:src" content="{{ URL::asset('/siteicon.png') }}" /> --}}

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

    <script src="https://sdk.canva.com/v1/button.js"></script>
    <script>
        const css1 = [
            "font-size: 15px",
            "display:block",
            "color:#37e1ad",
            "width: 100%",
            "padding:30px 30px",
        ];
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
  
  <script async type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Spenny Piggy",
      "alternateName": "Exclusive Content, Memberships & More!",
      "url": "https://spennypiggy.co/",
      "logo": "https://d36ape3u423eoo.cloudfront.net/329a3236-4b42-40ed-abf7-61da55dbcb22/build/assets/logo-164abf9b.png",
      "sameAs": [
        "https://www.facebook.com/spennypiggy",
        "https://twitter.com/spennypiggy",
        "https://www.instagram.com/spennypiggy/",
        "https://blog.spennypiggy.co/"
      ]
    }
    </script>
  <script async type="application/ld+json">
          {
          "@context":"http://schema.org",
          "@type":"SiteNavigationElement",
          "name":["Exclusive Content, Memberships & More!"],
          "url":["https://spennypiggy.co/",
          "https://intercom.help/spenny-piggy/en/",
          "https://spennypiggy.co/login",
          "https://spennypiggy.co/leaderboard",
          "https://spennypiggy.co/discover",
          "https://uk.spennypiggy.co/register"]
          }
        </script>
        <script async type="application/ld+json">
            {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "What is Spenny Piggy?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Spenny Piggy is your one-stop party platform for every type of creator out there! Get those financial love taps, whip up a wishlist, dish out free and exclusive goodies, and even roll out bespoke memberships and custom commissions. It's the ultimate creator playground! 🚀"
                    }
                }, {
                    "@type": "Question",
                    "name": "How do I get paid?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Bag those bucks effortlessly with automatic Stripe payments! Your payment dashboard lets you be the money maestro, changing payout details on a whim. Initial payouts may take 7-14 days but are usually quick. In the United States/Aus, it's a snappy 2-day roll—charge Monday, party Wednesday. UK/European pals, enjoy a slick 7-day roll—the Monday magic. Keep in mind, payout dates may change based on your account status. If in doubt, reach out to Stripe and us for help! 💰"
                    }
                }, {
                    "@type": "Question",
                    "name": "How much does it cost?",
                    "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Creators, listen up! The best part? It won't cost you a dime! You pocket the whole 100%. Sure, there might be some tiny conversion costs, but fear not—US, CAD, and UK creators, you're in the clear! Now, here's the scoop for Supporters: there's a service fee, starting at just 8%. But, for those creators craving extra perks, drop £29.99 per month for exclusive features and no service fees for supporters. They just handle the processing fees, making each transaction way cheaper. More money in your pocket, less in fees—win-win! 💸"
                    }
                }, 
                {
                "@type": "Question",
                "name": "What currencies do you offer?",
                "acceptedAnswer": {
                "@type": "Answer",
                    "text": "Pick your currency! Creators, you've got the choice between USD or GBP. If you're based in the UK, GBP; for the rest of the world, USD is the go-to. Customize your display currency, and supporters can do the same when making payments. Keeping it simple for everyone! 💲"
                }
                }
            ]
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
