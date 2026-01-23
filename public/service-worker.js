// Import workbox from CDN for better compatibility
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

if (workbox) {
  console.log('🎉 Workbox is loaded');
} else {
  console.log('❌ Workbox failed to load');
}

const { precacheAndRoute, cleanupOutdatedCaches } = workbox.precaching;
const { registerRoute } = workbox.routing;
const { StaleWhileRevalidate, CacheFirst, NetworkFirst, NetworkOnly } = workbox.strategies;
const { ExpirationPlugin } = workbox.expiration;
const { CacheableResponsePlugin } = workbox.cacheableResponse;
const { BackgroundSyncPlugin } = workbox.backgroundSync;

// Precache and route - Workbox will inject the manifest
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"5aded960997ee0ba8383fbd756c24539","url":"build/js/vendor-react-iI8rrG0X.js"},{"revision":"856a5f74fec23491174058446ca14f4b","url":"build/js/vendor-other-BFz8b479.js"},{"revision":"c319a5a59e27ce465d3ffb13f845d1a3","url":"build/js/vendor-inertia-BxdxfA5t.js"},{"revision":"10ddfcc564c3bd6bec2445f7f93ecbbc","url":"build/js/useDispatch-CYqdUGGo.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"c93efdcbc098939aeadf088802345cfd","url":"build/js/triangle-alert-BwiBxZcp.js"},{"revision":"69ad058940aaf53d84235bc386000fde","url":"build/js/swiper-react-Bp_wx8iq.js"},{"revision":"3d96597334f35d80a777979b4c6d6d1b","url":"build/js/star-Cyl2WiZR.js"},{"revision":"da957945a99149e3e9e4c1f062377978","url":"build/js/sortable.esm-C3JVRTPy.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"bad9201dca581e09e193c382610fd75f","url":"build/js/shield-check-C15IhTwT.js"},{"revision":"aea5986692402bb4f3f1db070de3e3cd","url":"build/js/shield-DfJjTfyC.js"},{"revision":"36efdfd9671c2b5a4ecd62a6ac5b9243","url":"build/js/react-select.esm-BCP6GGdT.js"},{"revision":"333501d74846b94c169e58604618f409","url":"build/js/pagination-Cjpy89BJ.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"924f91a636775f32563a50aebc954734","url":"build/js/navigation-CIGpJio8.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"aa83b466821a947da81fd84ba403a9d6","url":"build/js/index-jpZHG2t9.js"},{"revision":"70bf3527a98c09a01cdfdcae060f3dd4","url":"build/js/index-eGHgv6AW.js"},{"revision":"c63e9165459f1ab2454d7ff9814e0d4e","url":"build/js/index-ZjuiB_aZ.js"},{"revision":"7a37217952130a8ce5b97aba1fd47c7b","url":"build/js/index-WiCXr17H.js"},{"revision":"639923343484fa9e263374b9d80a26ac","url":"build/js/index-DcOEuk35.js"},{"revision":"b00413f522551d0dbb646e2b96052db3","url":"build/js/index-DF8hIk0b.js"},{"revision":"102310d158c55636c06f6b1357cb0a91","url":"build/js/index-DCPQv-R3.js"},{"revision":"b25c9235272f9858d3c6b31569d53ff3","url":"build/js/index-DBAOnVUu.js"},{"revision":"f89ee7dd43fa4384209b33053226fea2","url":"build/js/index-CvP5zlpY.js"},{"revision":"a1577579760d26dcbb7c49578dd022b7","url":"build/js/index-CsxylLo0.js"},{"revision":"e21909ffc2635889018c4ab8195e1958","url":"build/js/index-CrhOig4t.js"},{"revision":"e2490415ff22fedd3dc621db0e9d21f7","url":"build/js/index-CnSmVaUE.js"},{"revision":"e1a99aae1a87e24325688ad8de16687d","url":"build/js/index-CYqr26Yw.js"},{"revision":"9b373cce079814efc5078f40b3e6a3ef","url":"build/js/index-CTOEl7lU.js"},{"revision":"568abce25ecdd8fb10b5aa022ef78cb2","url":"build/js/index-CKEXy-Zi.js"},{"revision":"9e1b3d5fa35fb91e6d9425bd464c6ee0","url":"build/js/index-CEWZia5q.js"},{"revision":"5b00154ace61f58ecf63ec881d83e167","url":"build/js/index-BcK62yD1.js"},{"revision":"03287d3bdc9ba4293e1da789989c32ba","url":"build/js/iconBase-CxZZFUQG.js"},{"revision":"85a281724e1dfeda56ec1efe06649c28","url":"build/js/html2canvas.esm-N5Qv6hEC.js"},{"revision":"cc4f284fd8157c7ad4dea2ccf0371b55","url":"build/js/floating-ui.dom-CUDuJZoz.js"},{"revision":"40ac6f13548a78a4db378415e3a766eb","url":"build/js/dollar-sign-CqouXNp5.js"},{"revision":"b4fc45f573f469ae1adcd684b8ce4dd1","url":"build/js/debounce-BYZlPqOl.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"ef899598dc5da8b060723c1ab2cc0772","url":"build/js/clock-CzOOaU5K.js"},{"revision":"b75720fc5cf302512dee21c11c51bffc","url":"build/js/check-CNKTtUnK.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"83e6e05b99bab7f52912a7d9b2e68635","url":"build/js/arrow-right-BmfasIJd.js"},{"revision":"15fb78703d96b77a49ad0eee4d02b651","url":"build/js/app-C3OTMv1K.js"},{"revision":"c08321f01ed304f43b98cb0611ac1896","url":"build/js/Works-D5dUNutg.js"},{"revision":"0e7b28372dc96ddaa43c9682f11e431c","url":"build/js/Wishtracker-BR3hr72D.js"},{"revision":"cbf39608fe6d1ae63e080d04f144b20d","url":"build/js/Wishlistbox-jA0hOQAi.js"},{"revision":"56b72a48692a674a6a0537ecd29fcead","url":"build/js/WishlistGrid-Bty-wT8-.js"},{"revision":"07f2a9129d359ff9b908940623bf684c","url":"build/js/Wishlist-CvAR8rl3.js"},{"revision":"cc276ab57df0206bc435870ead4f8350","url":"build/js/WhyLove-BuEnelZ4.js"},{"revision":"613003fb4e586145cc0ff68b61e85732","url":"build/js/Welcome-BVC-p1tb.js"},{"revision":"740f7dd55e4ea3d0590a4c78b899c674","url":"build/js/VipSupporters-BG8OG2jK.js"},{"revision":"30ad4a53bd6e4fc8c1ad3002d842cfab","url":"build/js/VersionUpdate-ee9AzTp9.js"},{"revision":"14979c7421adcca13a4a0d9de482d30a","url":"build/js/VerifyEmail-BKXL9TLA.js"},{"revision":"c102a7a6dde1e8388642f0e70d3459a5","url":"build/js/Userprofile-AmQAmc-w.js"},{"revision":"6bfa9a1b075cec41f9d04047e17f8dc9","url":"build/js/UserCarts-CN1nsju3.js"},{"revision":"2795af685c5006943f3d3d81904a5b74","url":"build/js/Uploader-DhHoXkp3.js"},{"revision":"5d74646556170827e5c500adea1afa79","url":"build/js/UploadcareEditor-C8FLninK.js"},{"revision":"26bd5dc10c04ebb43a26b5a77af2ccb0","url":"build/js/UpgradeStripeAccount-DyLlp1sb.js"},{"revision":"e33030916e90f97dd4abddba4a1ece18","url":"build/js/UpdateProfileInformationForm-DLfP9aep.js"},{"revision":"288ced6965fd21cb09a663ff3fbc6e69","url":"build/js/UpdatePasswordForm-D6J2V12E.js"},{"revision":"1969ed914fe339807799e25d9358aeb5","url":"build/js/UpdateAvatar-CIfV2wLp.js"},{"revision":"a8de7d526e8bc45caa560d3ac479b559","url":"build/js/USTERMS-ClvxYWA9.js"},{"revision":"b288f2b737f81d629c17ec16a5f283ae","url":"build/js/TweetNow-BK4WPbv0.js"},{"revision":"092f91b72bcdc7e11a23099a319472f2","url":"build/js/Turnstile-D0-AjxsY.js"},{"revision":"95b37a32106f826b97c6ad4ca4770bd1","url":"build/js/TrustBox-B0vO6plN.js"},{"revision":"fbdc4de72f00d67a32574bb4dab49435","url":"build/js/TrendingCreators-BcdE37AA.js"},{"revision":"255544ed22228f0729ae893d11d097ea","url":"build/js/TopSupporters-CFg-0yHC.js"},{"revision":"f666f32d569bbfbf243d75739bdf0c14","url":"build/js/TopSupporters-BMQsxQyi.js"},{"revision":"824705f7b18b6d56a96ab757b1e38096","url":"build/js/TopEarners-CRUdJ9kc.js"},{"revision":"94fcc01ee4fe7576a1ade4e87325ea60","url":"build/js/TopEarnWishes-D32VQj_u.js"},{"revision":"184d92cdaf658ac2d6794dd48d987ad8","url":"build/js/TopEarnBills-CsRiPfw7.js"},{"revision":"9ca2dbb3e76d2c26ed1f76a159c45501","url":"build/js/TopBar-D55JNghW.js"},{"revision":"935f44e2d38e078169cd350e37c62af7","url":"build/js/Tiplisting-Bxbmoz2J.js"},{"revision":"4d80f0d96f3b8888cf01d268db39a5f2","url":"build/js/TipTracker-CJmpA_3-.js"},{"revision":"6d9708393e563d19df961c3aa1971ff8","url":"build/js/TipInner-DA_PQFgO.js"},{"revision":"00bfe78ab3eb197ae1ff19a48a3c80f8","url":"build/js/TimeFormat-DNp8Jto_.js"},{"revision":"c2c684a9cd411ad1e08e61b53b8207d4","url":"build/js/ThankyouMessages-CcoUO4KR.js"},{"revision":"e439148353b50c2530e0494f0efc5c82","url":"build/js/Thankyou-Cbe6weu7.js"},{"revision":"e8a2c33ef0cd9c46fe527830aec4e89a","url":"build/js/ThankYouRye-lJ8Zva4i.js"},{"revision":"e8634bca3fb698712edc1364dfe85ce2","url":"build/js/TextInput-DVnUZ8_2.js"},{"revision":"a4d9a3a268f26066e92f0c32d7893b89","url":"build/js/TestIntercom-DMqQiTfC.js"},{"revision":"6f12931725a81d11ff501affd6382fa7","url":"build/js/Test-DAnfg4Fl.js"},{"revision":"b485b73d543c63c33f30b046841d6162","url":"build/js/Terms-CUPEKqxi.js"},{"revision":"76407997e4488019dc6e08da7f7ac3e5","url":"build/js/TabbedDashboard-zy-EFD77.js"},{"revision":"4dda40bb8027d60b468246db47660e8b","url":"build/js/TFA-9hg57sF8.js"},{"revision":"9ef2ab8c43f1e466c0f59420bd1774b6","url":"build/js/Suspanded-cXqNj191.js"},{"revision":"f81e7a18cf8ecacf6b4aff3f02bbf6a5","url":"build/js/Success-BN1BCq5z.js"},{"revision":"f59334870f5628c0e1e3c2124217f8ce","url":"build/js/SubcriptionEarnings-B2sgydqL.js"},{"revision":"c4b2d9c14c14b5d90d088f0a8363bb46","url":"build/js/SubCheckout-C3tm7DUf.js"},{"revision":"9f0bd2763e6d28c3238aa5551c6ca2f0","url":"build/js/StripeSafe-CkOSKAF8.js"},{"revision":"591a273ca0c7dc377f88ddf4b23875d3","url":"build/js/StripeIdentity-2gq2leTg.js"},{"revision":"d3b96cefb411941c4840f8ff266305a2","url":"build/js/Stripe-Bg46p0ck.js"},{"revision":"b8544da1bbe7b4b1f3dd9222c9d80f0d","url":"build/js/SocialLinks-D2fEfx7s.js"},{"revision":"c9a0ee746bbfbc66e9b74f809dcf03bc","url":"build/js/Social-CqGGoyed.js"},{"revision":"6c33ce47621995cebd2cd7bef615cadd","url":"build/js/SiteSubscription-CTVkcdcV.js"},{"revision":"975a91a58d08bbf6f2714c2d3bd700d5","url":"build/js/Show-D3rB-Hd5.js"},{"revision":"afbf56be71a535c70785bcf5754095a7","url":"build/js/ShopTracker-DPXXAMTX.js"},{"revision":"d86675d6bd2092f62339cedcc4fab556","url":"build/js/ShopPage-Do3qg8I3.js"},{"revision":"4b3dd1b6ef6e4a36bc5ed80a1d3305ba","url":"build/js/ShareProfile-1506td7L.js"},{"revision":"9a472882bc321db7097fdf8cebe5168b","url":"build/js/Settings-BLoIL-0B.js"},{"revision":"1fde8c427625e83a4a22eefac2eb8a8b","url":"build/js/SendTip-DE1b_IpF.js"},{"revision":"f59cd6798ca718e44e14d9b2b910f68b","url":"build/js/SecondaryButton-B6Q_duhA.js"},{"revision":"dfb0fc72474bf131e42bb8f9b7fe70f8","url":"build/js/SayThanks-DxPUrKIh.js"},{"revision":"546319f5c7cf288ae30e0a7f5245d277","url":"build/js/SafeTransition-DThiSwnS.js"},{"revision":"53307510bb63a0b92e47cb791419f6e7","url":"build/js/ResultsGrid-Cr_xulp2.js"},{"revision":"3629e654c1c7d2aec40b667519885e5e","url":"build/js/ResetPassword-Ci0perLp.js"},{"revision":"49be6e7f045c27587eb03286f3e89d53","url":"build/js/RemovePost-RNRyMm8P.js"},{"revision":"d4f0c5e64688b5e477935544441701b6","url":"build/js/RemoveMembership-C2V3N1dN.js"},{"revision":"ac58c6531f8ccdda5fb3407e942051ab","url":"build/js/RemoveBill-DdTe5nid.js"},{"revision":"ad5e7f2834f8a946c164cd0e37612f25","url":"build/js/Register-BWX7RwPp.js"},{"revision":"d072ffafd6b5938297a2a00e98457553","url":"build/js/ReferAndEarn-6bSNaH6X.js"},{"revision":"1f600ded4129b29791425d94b7c0522f","url":"build/js/Redirecting-B7tiwlZt.js"},{"revision":"da64e3b43be7fec59576cbe12c6c1b36","url":"build/js/RecentSupporters-DCHC8sJw.js"},{"revision":"5f80c677eb6c409c0960cf461bc95dbb","url":"build/js/PwaTest-DAgjGRU5.js"},{"revision":"e5985ccac73818bb392b3148dac1a187","url":"build/js/Promotions-CXq6v2kb.js"},{"revision":"47d4a1411b7da50fd42eae9c7ae73916","url":"build/js/ProfileTaskLists-CwvRvzeR.js"},{"revision":"9c2e2efc1c459b0b563ed1ca3f04a20c","url":"build/js/ProfileTask-DR429Nzd.js"},{"revision":"498804a0882efe6b9fa7b9e69a998c92","url":"build/js/ProfileSteps-CHab6MfA.js"},{"revision":"bd62085966856969094790a09565cc7b","url":"build/js/ProfileProductLists-D2wfANT8.js"},{"revision":"261c00dfc69c6e323d63cea1f8df4e61","url":"build/js/ProfileProductLists-BTXMQHqv.js"},{"revision":"d356c0fa6d201679a32137d52f1c002f","url":"build/js/ProfileProduct-FfNNwWJL.js"},{"revision":"e671cdf184dd5be9fd228ed6b4af541d","url":"build/js/ProfileProduct-DsdJyIvo.js"},{"revision":"d0f68a55d51cfcaef19474cfd351f873","url":"build/js/PrimaryButton-B9nJnFv4.js"},{"revision":"e30663b79051dc7ef52422594b8b80f5","url":"build/js/PriceFormat-C9z44-Do.js"},{"revision":"aea408e015565a73c07205d514b2a410","url":"build/js/PostLike-CN6foWId.js"},{"revision":"58714bbb2a2010640f160341c8d73166","url":"build/js/Post-BydrLoU0.js"},{"revision":"f6e4e962d367652511ff95a751b7e77f","url":"build/js/Popup-CQMqefSS.js"},{"revision":"5a856cb1a56f3a2a9dbf15365d399fcc","url":"build/js/PlatformAnalytics-CxHhvvDK.js"},{"revision":"7a0902c721af21f7916321164f82da6a","url":"build/js/PaymentSlider-BzEU3E-g.js"},{"revision":"d4545517e1f997cadfb37ab503575032","url":"build/js/PaymentDashboard-RjPdLPBq.js"},{"revision":"b6d44870ca7ee857e4dee4be4129ea7e","url":"build/js/PaidTasksTerms-2CKqy-eN.js"},{"revision":"e6bf2905b11b6443e41983303ce81a12","url":"build/js/PaidTasksAnnouncement-DUcNioL5.js"},{"revision":"ca184003fef21d813f19cb597c4f162b","url":"build/js/OrdersLists-B01hCllv.js"},{"revision":"403a9b584282950cff751d53cf44b11a","url":"build/js/OrderDetail-BGlKcmth.js"},{"revision":"df85f557d617b312cc03cc3cd2629bf1","url":"build/js/Order-Dx8XWSoY.js"},{"revision":"1563f31cd648af6f6335d43269b43a0a","url":"build/js/OldSubscribe-EaeCNqsT.js"},{"revision":"4523a9a21e578b37549968374f0e4226","url":"build/js/NotFound-CHx6EVkN.js"},{"revision":"8a2be6e73a4db2a08d3ec6c586f3fbc9","url":"build/js/NotForBusiness-CgoJoxNk.js"},{"revision":"2057f538485511c37b40230a8eb70ca5","url":"build/js/Nocontent-COT-32ES.js"},{"revision":"e62d329bf9f42d1251a10bedbb497443","url":"build/js/NewVerified-B-dYoUSv.js"},{"revision":"d57a3fcdc9f041720fa2ab9c9c598e13","url":"build/js/MyShopProducts-BJAQpR_e.js"},{"revision":"0830a1bec37075eebedfa4ac04c7327b","url":"build/js/MyGoal-by232fnf.js"},{"revision":"813b37b443f40af7424ae5c6034ec11c","url":"build/js/MonthlyRevenue-iEDXccvK.js"},{"revision":"534df20c55792c0983cf5832e17e2f5c","url":"build/js/MembershipsLists-C87q8pvo.js"},{"revision":"dbb01067c484065dcd7ff1fafae5c35b","url":"build/js/Membership_dashboard-MjCDw8bk.js"},{"revision":"54ce4dac8564ca24bbe0925683c8f634","url":"build/js/MembershipTracker-ByoF47p8.js"},{"revision":"6c3c91986781ce4175162c2a559cf25f","url":"build/js/MembershipLists-C6UkvR3a.js"},{"revision":"141fb6e39f1d6c52e3c3af8a20984e7a","url":"build/js/Membership-L85ZBw54.js"},{"revision":"0bb8b96625e3a998baff8274ffdf91ca","url":"build/js/Membership-CL27wkeX.js"},{"revision":"487eecb61c9dd790230a0c428fe3785c","url":"build/js/MemberCheckout-Cgsgtzgb.js"},{"revision":"4f24991a807f4decca0d096ef72e7e0f","url":"build/js/MagicBellNotificationDisabled-fZ9hFhCj.js"},{"revision":"d50eacba6b12112b771b2a44916fbc43","url":"build/js/MagicBellNotification-DM7Fj4gd.js"},{"revision":"dda751d3036e144c9eac4ce5ec363354","url":"build/js/Login-BW5N2Cem.js"},{"revision":"af7f18bc171362ee7a98f685148faafe","url":"build/js/LoadingScreen-D1UkiGf6.js"},{"revision":"b74136a4508abd9230068d905ad15cc9","url":"build/js/LoaderButton-lWhJpJzc.js"},{"revision":"aa8e797163d82f3e1f65d66e250ae44b","url":"build/js/LiveBarSection-Dc5r0F5R.js"},{"revision":"8682373442c75450ade4d4f64f0aac0f","url":"build/js/Lists-DlHm72J3.js"},{"revision":"88b840ef79bcd804e3b3e2ac1fb66abb","url":"build/js/LinkTwitter-BvyHwip1.js"},{"revision":"b841ede8db0a500679f560eb03c0fb51","url":"build/js/LineChart-CbSuNr8k.js"},{"revision":"06068832ef0d287eb07932db65f4c748","url":"build/js/LeaderboardStars-CBu26Af0.js"},{"revision":"242381330835366dc1b412c57a1c5afe","url":"build/js/Keep100-DId5nfQM.js"},{"revision":"fb1c6efe382187c2929dac183194c72f","url":"build/js/JoinUs-BeYrLv15.js"},{"revision":"9a17ee9c04b42707e94b1a6a18964c2b","url":"build/js/Item-bV36O6Pp.js"},{"revision":"bd8da24fb572420d99e0f78cfc74757d","url":"build/js/IntrosVideos-C7W58moK.js"},{"revision":"27e15a959ca93fa480d121c67f851386","url":"build/js/IntercomDebug-DFgPSD_3.js"},{"revision":"634ee4cab9e84e9942060cca2a5ae0f7","url":"build/js/InputLabel-vJFjtsbW.js"},{"revision":"f33672e5cadb6815751deb9d6ed33a25","url":"build/js/InputError-CJsQnULU.js"},{"revision":"5abad75f4aa0c76d6b8fa46df3fb5e78","url":"build/js/Index-DxdtV2Tg.js"},{"revision":"f0f35ad02f5bba84da147f01497bb782","url":"build/js/Index-CtsfXy_G.js"},{"revision":"9874d3de61df2998d8e2ceaac3e54072","url":"build/js/Index-Ben8Nm-4.js"},{"revision":"35d8b8d719b3b829cf0a01fe9ac9f6ee","url":"build/js/Index-BcrBLG20.js"},{"revision":"c6744a15c648af9c94e5ad32c56dfcc0","url":"build/js/Index-BRX6yNUy.js"},{"revision":"d76040d4ef6812ebad86c84bd760e4a7","url":"build/js/ImageGenerationWithAI-IgFtuAEc.js"},{"revision":"92f05fa3feb2bd77dc2ff60438ec6a46","url":"build/js/Icons-JB9Kg2Nk.js"},{"revision":"15a4a4e71263f0d96788330f51519a77","url":"build/js/Hero-BPFF3DTW.js"},{"revision":"4800e0a380dcf6a733f9c98a815fd94d","url":"build/js/Header-CJC3DWmj.js"},{"revision":"004f01c38bd0e0309d19d59831def931","url":"build/js/HappyCreators-DaMdCK6o.js"},{"revision":"746e0da87af30fad9cf3c8be55e3a8cf","url":"build/js/GuestLayout-CBiZyY6-.js"},{"revision":"c0908de8abcba38266c6d2ea21510dc5","url":"build/js/GrowthTrends-Dx6rqyLE.js"},{"revision":"02bf0c9155c4869575d2c3eb671d8b2f","url":"build/js/GlobalCheckout-CVH9zgNT.js"},{"revision":"ef4ea431486d6f8c9a06d2869039eac4","url":"build/js/GifterTips-CBKf_vlf.js"},{"revision":"e2b6d38fc15778c03b67ceb3cb9e62d4","url":"build/js/GifterSubscriptions-BWkBfrSO.js"},{"revision":"aa7116a38e4fbb716acfd2ed991d4082","url":"build/js/GifterMembership-BIZ-kzGe.js"},{"revision":"654e2fd6482528d5158821032a149dd1","url":"build/js/GifterMedia-Bpx1UDVY.js"},{"revision":"0d6b24adcd852e8df8fbf1da6bb4c38d","url":"build/js/GifterItems-BjO94RTj.js"},{"revision":"97e28d702bafdbf18bf64738eb21afbd","url":"build/js/GifterFeed-CCgsOPRq.js"},{"revision":"8e578b460bdd44c347b2d2af1d6dd7d2","url":"build/js/GifterCardVerification-DYJjayCH.js"},{"revision":"54fd5cc50e1f18a1cafc89cb79e91937","url":"build/js/GifterBills-j1PHQbjT.js"},{"revision":"f9862bf0fe7964d523d4e98285ddbc5f","url":"build/js/Gifter-DDFB90Pz.js"},{"revision":"9adff6c8bb25ad701be66e62d04c808a","url":"build/js/GiftStore-D-ugJpyz.js"},{"revision":"76b8c3fbd53c9e69bf0a1be370e0c025","url":"build/js/GiftListing-RrQtjtd8.js"},{"revision":"1000bbb12cbfd68ad924594f2b35eb7d","url":"build/js/GiftEdit-kOMHIltV.js"},{"revision":"ee185beeddb914e0abec415f366af0fa","url":"build/js/GiftAddCart-DacLWutk.js"},{"revision":"0aa25911f22dc96009c0c2729b11e39d","url":"build/js/GetCart-DU7LsCvv.js"},{"revision":"9c4540b34a5cd90c38239800ae694b28","url":"build/js/FunPart-CxA39Kos.js"},{"revision":"a4a467ae343242c1f2f086c141910322","url":"build/js/FounderProgramAnnouncement-rOWi-Swg.js"},{"revision":"d0ce1a197c697bb069f8fc7f60d873cd","url":"build/js/FounderBonus-gSDh1su0.js"},{"revision":"d0665ecf98778de9bb7d9957cc9d5c89","url":"build/js/FounderBadge-B1rebL9s.js"},{"revision":"89f95d0970e90e20f876cb203732b466","url":"build/js/ForgotPassword-BdZI0xxl.js"},{"revision":"5df00d1024433d98d281c3c8f2e20535","url":"build/js/ForCreators-DedU4_-w.js"},{"revision":"eb4d371e933e8fd836b551a119abddf8","url":"build/js/Footer-D6ovnfEB.js"},{"revision":"7cb743fdf9ffa08800a96a79385cc340","url":"build/js/FollowButton-DlgSEeQZ.js"},{"revision":"a7ff066dc8bbb91397f786203dc214f0","url":"build/js/FlashMessenger-IX0jAoPG.js"},{"revision":"2ff0fd802220048483de215c37cb9aa3","url":"build/js/FiltersPanel-B0_wKgel.js"},{"revision":"5746f107dbe30678fce799e9ae5d7b39","url":"build/js/FeedList-Ba4kI72d.js"},{"revision":"d288a7103be5404f3b54deebf5190b02","url":"build/js/Features-DCNeqfGQ.js"},{"revision":"1ff651849b623599ca0e54e2aaf66447","url":"build/js/FeaturedCarousel-COkz44NN.js"},{"revision":"60373a932a48608838754b24dedf9e6e","url":"build/js/FAQ-DtLQuKS_.js"},{"revision":"044807821720de490aefb4827371b4db","url":"build/js/ErrorPage-Co4yTvaD.js"},{"revision":"072c29484f5fa8080c4d96630b4b2b7e","url":"build/js/EnterOTP-LMDimi8p.js"},{"revision":"b644ece83df51bcaf3362f91d4a354c3","url":"build/js/EnableCardCapabilities-Fb-CJrFC.js"},{"revision":"aa4d73226a75b7ae3659472a6aa2f75b","url":"build/js/EditProfile-dRaBTHF9.js"},{"revision":"504762cc5fca69878ac06f6bc6aa8245","url":"build/js/EditMembership-ByxvmkAo.js"},{"revision":"aa91822e0f4779e9dc67b31b0589970d","url":"build/js/EditCategories-hcfkH7tJ.js"},{"revision":"d3f75590c98c587eedb765ecb577e1d3","url":"build/js/Edit-DFePQNKx.js"},{"revision":"03cfef97786fae4d0f2a5735f37f0112","url":"build/js/Edit-CLzsqhSS.js"},{"revision":"c442e4bf98f228000702b7ccacc037ba","url":"build/js/Earnings-tX8KYuBT.js"},{"revision":"c69a9f2d6b02fed9a25c15c1ef5ee081","url":"build/js/Disputes-CV42YwJG.js"},{"revision":"e670596142771f9703f113bfb7bc7a8c","url":"build/js/Discover-Wr-zIYac.js"},{"revision":"9ff51f47ca9ebb58f1c10af2a1d08e88","url":"build/js/DiagnosticPage-DQA0Kr-P.js"},{"revision":"99c49a1656c6d928cbf06481814c59ef","url":"build/js/DeleteUserForm-BySzXT_H.js"},{"revision":"1d3689f459e1fc4746f6ca58bef3b9a1","url":"build/js/DeleteStripeAccount-B4RZK_af.js"},{"revision":"582e864c0563496e6219b96310d09766","url":"build/js/Dashboard-Dq-diGSh.js"},{"revision":"1ee389262ece1fba25f7512413f444fd","url":"build/js/Dashboard-DBISrtG_.js"},{"revision":"133a3a43b86dc2e8ad54cb154ce44574","url":"build/js/CreatorVerificationNew-C0OOi5ck.js"},{"revision":"a7766f1d2e43f3607cb84ef12b22a763","url":"build/js/CreatorVerification-pOEMciB2.js"},{"revision":"d0c002681646822a18213f4ee5d2a588","url":"build/js/CreatorSubscriptionWidget-CY6gkcii.js"},{"revision":"9bec7e6650c3f47e56bc6f6dc320f326","url":"build/js/CreatorCard-B7ixcn1P.js"},{"revision":"3710b54cf2ccd190cbd153d1775ac85f","url":"build/js/CreatorActivityWidget-DIPbWtKK.js"},{"revision":"9189deb48d5cfadb9a99a2ae27d13618","url":"build/js/Create-BPdUbXu1.js"},{"revision":"162e0d8f75e669f4b264584fa2f6a1da","url":"build/js/CountriesShipping-Bz5010fy.js"},{"revision":"927689a1e4c9997c60add33efc648d3b","url":"build/js/Countries-CZO5A7Ft.js"},{"revision":"8a20939cdc97659b0cb50f5aeb3122e3","url":"build/js/ConfirmPassword-CvZWT-bu.js"},{"revision":"2d1bf0f451f7b313807b1fd708e4db1f","url":"build/js/CommetsLists-CREZjdVu.js"},{"revision":"afe3dc204e55d20cd2d79b82964f5122","url":"build/js/Comment-DDphH0jZ.js"},{"revision":"f73f97f32db439a63c7bf3624cb3d09d","url":"build/js/ComingNext-BKKD8AbN.js"},{"revision":"7c043c5dfcd63004cb63365d6f5cf46d","url":"build/js/ChartDashboard-DYahfJC_.js"},{"revision":"525d368ddafdef43128ed2ca5a88f8ef","url":"build/js/ChangeVat-BXxL34cJ.js"},{"revision":"c9ce3da315759af0353b9ce4ed9e30bf","url":"build/js/ChangeCurrency-CK9RFxLM.js"},{"revision":"02e803530b7604c142a1620e4a032841","url":"build/js/CategoryLeaders-3N5v9kBf.js"},{"revision":"1cf2d1bcb72894d79f148e72950b1bd2","url":"build/js/CartListing-CwixHnh4.js"},{"revision":"750bfa9917144cb4e2bb9eb2b997fe30","url":"build/js/CartItems-DWFBS6Ko.js"},{"revision":"9e180199b32c7885cc4cbe816a9292a7","url":"build/js/CartItem-DvF7KWVa.js"},{"revision":"ae61c40c9cc93d8f0b0cd5a7d9e8af57","url":"build/js/Cart-BbWWMp2i.js"},{"revision":"cb41745e2ca47410b3434ace7b44a072","url":"build/js/BuyShopItem-OH1Io3e6.js"},{"revision":"d800b2913b3001944a6e08f27af240f0","url":"build/js/Board-DIdCoSHl.js"},{"revision":"5df96b09999e8cb97dc86017766831f9","url":"build/js/Billslist-CuoRsZt_.js"},{"revision":"e08ad03bc124e1ccb24cd6130f099283","url":"build/js/BillsTracker-HxXMKctV.js"},{"revision":"b11fc2718eebc6da5a51c1262b9c18a9","url":"build/js/BillCheckout-DvoYWElP.js"},{"revision":"829b0b4d10baa56bfaddc90733d13e9c","url":"build/js/Bill-aDA6hgF0.js"},{"revision":"2bbf6b1e85cfc46ab6b4e1cfc8a602c7","url":"build/js/Avatar-CK6jKbm5.js"},{"revision":"59f4061fa4436c0090735f783ab5b30a","url":"build/js/AuthenticatedLayout-Bo29kJr9.js"},{"revision":"a93a3dfb159f990021f07f479baebff2","url":"build/js/Analytics-C-dI6a6Z.js"},{"revision":"3b7b1ec6bbe62b498d864ab465b6de24","url":"build/js/AllWishes-DdowbO3w.js"},{"revision":"9e1978828b723a590e7df98d132a2cdf","url":"build/js/AllCountries-yw26CxFP.js"},{"revision":"f7d37c3a294766b2c018c5fb3aae03fa","url":"build/js/Alerts-Cy-dYMMH.js"},{"revision":"c4a4f6f3e2681fb98c72cb8fef089589","url":"build/js/AddressForm-CBOU2Hl8.js"},{"revision":"5d7f34155bf5e3e31c92f2813f245c48","url":"build/js/AddShop-DbGdyyIb.js"},{"revision":"7f29d61b7dad1378ba509aa7967d0c6e","url":"build/js/AddRyeProduct-C9wBla5J.js"},{"revision":"476f3d68b81d749ab025a00309188e6c","url":"build/js/AddPost-B4nsIhtl.js"},{"revision":"bbf029b2e1d6a26ea6560cecf71268f1","url":"build/js/AddMembership-CKobS1Gi.js"},{"revision":"0d55cbf4b4b604913a89989969e14bb3","url":"build/js/AddItem-C0PlZxC_.js"},{"revision":"b5879d70dd1d13ca68b8ee047df6ecbb","url":"build/js/AddIntro-Cq6YwrK6.js"},{"revision":"af0696c6ac3668f2964f1a093f48e810","url":"build/js/AddGoal-CuTgczIj.js"},{"revision":"ae70314a0c9e88fd30a94284cee44811","url":"build/js/AddGift-C73c7t8n.js"},{"revision":"c7650fc79719c63647e064d7543a94c4","url":"build/js/AddComment-Bh8ILNFD.js"},{"revision":"16e178b85f5bae3ce707e642fdca0637","url":"build/js/AddCart-BBiY4cBx.js"},{"revision":"da3a0f2e8c14f082ff0903a8233654f7","url":"build/js/AddBills-BFVYhQaH.js"},{"revision":"74f0e498e08bd37af2bfaf15ec5eba9a","url":"build/js/ActivityStatus-DhclYFZW.js"},{"revision":"abb47d87d10c2d002126a889d3b73936","url":"build/js/ActivateSubscription-CzCi-SZF.js"},{"revision":"17ca71309d1b9dd703373f7af7f3e937","url":"build/js/ActivateCard-JrTrXWF9.js"},{"revision":"66f5d54ccfa51fd1574bc4abc4fccc97","url":"build/js/ActionRequired-DAIoDmyC.js"},{"revision":"68f3d54cc892c9a950019ba36934576e","url":"build/js/AchievementSystem-DiMcwle0.js"},{"revision":"d65315a1d5b1f08eacb0218ad964bd3c","url":"build/js/Accountsetting-BPFEZMIG.js"},{"revision":"4382d072575d52df2f5a34362e9a897b","url":"build/js/404-CEZXzd5M.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"0e17b0439b99cf1f4dd2754bfc8453e3","url":"build/css/app-BD9ffeiC.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

// Clean up old caches
cleanupOutdatedCaches();

// ================================================================
// CACHING STRATEGIES
// ================================================================

// 1. STATIC ASSETS - Cache First with long expiration
registerRoute(
  ({ request }) => request.destination === 'style' || 
                   request.destination === 'script' || 
                   request.destination === 'worker',
  new CacheFirst({
    cacheName: 'static-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 60,
      }),
    ],
  })
);

// 2. IMAGES - Cache First with image optimization
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        maxEntries: 100,
        purgeOnQuotaError: true,
      }),
    ],
  })
);

// 3. FONTS - Cache First with long expiration
registerRoute(
  ({ url }) => url.origin === self.location.origin && 
               (url.pathname.endsWith('.woff') || 
                url.pathname.endsWith('.woff2') || 
                url.pathname.endsWith('.ttf') || 
                url.pathname.endsWith('.otf')),
  new CacheFirst({
    cacheName: 'fonts-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// 4. API RESPONSES - Network First with background sync
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') || 
               url.pathname.startsWith('/graphql'),
  new NetworkFirst({
    cacheName: 'api-cache-v1',
    networkTimeoutSeconds: 3,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 5 * 60, // 5 minutes
        maxEntries: 50,
      }),
    ],
  })
);

// 5. HTML PAGES - Stale While Revalidate
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new StaleWhileRevalidate({
    cacheName: 'pages-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 24 * 60 * 60, // 24 hours
        maxEntries: 50,
      }),
    ],
  })
);

// 6. GOOGLE FONTS - Stale While Revalidate
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' ||
               url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// 7. CDN ASSETS - Cache First
registerRoute(
  ({ url }) => url.origin === 'https://cdn.jsdelivr.net' ||
               url.origin === 'https://cdnjs.cloudflare.com' ||
               url.origin === 'https://unpkg.com',
  new CacheFirst({
    cacheName: 'cdn-assets-v1',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        maxEntries: 50,
      }),
    ],
  })
);

// ================================================================
// BACKGROUND SYNC
// ================================================================

// Background sync for failed API requests
const bgSyncPlugin = new BackgroundSyncPlugin('api-sync', {
  maxRetentionTime: 24 * 60, // 24 hours
});

// Register background sync for POST/PUT/PATCH requests
registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'POST'
);

registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PUT'
);

registerRoute(
  ({ url, request }) => {
    return url.pathname.startsWith('/api/') && 
           (request.method === 'POST' || request.method === 'PUT' || request.method === 'PATCH');
  },
  new NetworkOnly({
    plugins: [bgSyncPlugin],
  }),
  'PATCH'
);

// ================================================================
// OFFLINE SUPPORT
// ================================================================

// Catch-all for navigation requests when offline
registerRoute(
  ({ request }) => request.mode === 'navigate',
  async (args) => {
    try {
      return await new StaleWhileRevalidate({
        cacheName: 'pages-v1',
      }).handle(args);
    } catch (error) {
      return caches.match('/offline.html');
    }
  }
);

// ================================================================
// PUSH NOTIFICATIONS
// ================================================================

self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'No payload',
    icon: '/images/icons/icon-192x192.png',
    badge: '/images/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/images/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/images/icons/xmark.png'
      },
    ]
  };
  event.waitUntil(
    self.registration.showNotification('SpennyPiggy', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// ================================================================
// CACHE MANAGEMENT
// ================================================================

// Skip waiting and claim clients immediately
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Runtime cache cleanup
self.addEventListener('activate', event => {
  const currentCaches = [
    'static-assets-v1',
    'images-v1', 
    'fonts-v1',
    'api-cache-v1',
    'pages-v1',
    'google-fonts-v1',
    'cdn-assets-v1'
  ];
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
