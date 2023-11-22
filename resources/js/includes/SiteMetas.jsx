import {Helmet} from "react-helmet";
function SiteMetas() {
  return (
    <>
      <Helmet>
        <meta charSet="utf-8" />
        <link rel="canonical" href={`https://spennypiggy.co`} />
        <meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no,maximum-scale=5" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="apple-touch-icon-precomposed" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <meta name="msapplication-TileColor" content="var(--mint)" />
        <meta name="msapplication-TileImage" content={`/android-chrome-512x512.png`} />
        <meta name="theme-color" content="var(--mint)" />
        <title>Spenny Piggy</title>
        <meta name="description" content="Receive or give gifts safely and easily." />
        <meta name="keywords" content="Receive or give gifts safely and easily. gifts, wish" />
        <meta property="og:title" content="Spenny Piggy" />
        <meta property="og:type" content="video.movie" />
        <meta property="og:url" content="spennypiggy.co" />
        <meta property="og:image" content={`/android-chrome-512x512.png`}/>
        <meta property="og:site_name" content="spennypiggy.co" />
        <meta property="og:description" content="Receive or give gifts safely and easily." />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Spenny Piggy" />
        <meta name="twitter:description" content="Receive or give gifts safely and easily." />
        <meta name="twitter:image" content={`/android-chrome-512x512.png`} />
        <meta name="twitter:site" content="@spennypiggy" />
        <meta name="twitter:image:alt" content="Spenny Piggy" />
        <meta name="twitter:image:src" content={`/android-chrome-512x512.png`} />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </Helmet>
    </>
  );
}

export default SiteMetas;
