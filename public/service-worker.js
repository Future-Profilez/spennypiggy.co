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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"bed492ec675786ea50d228468908f6d3","url":"build/js/vendor-react-mFeW7wOl.js"},{"revision":"af355c671ca8eebf4472c42d3141668c","url":"build/js/vendor-other-BGOK6KHF.js"},{"revision":"f695de8286177235a0087fcef557895a","url":"build/js/vendor-inertia-Bh35yyai.js"},{"revision":"6c488d8b4eee7106ba794730b3654c23","url":"build/js/useDispatch-B-dYU3Sj.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"620b70c4602f84d08aa64f738aa14438","url":"build/js/swiper-react-YPOiRleF.js"},{"revision":"64b998e6f8a7141524e84bcdd356f87d","url":"build/js/sortable.esm-DUgzTeS_.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"58a6652e1d3730a1f8b70d95d1754cd8","url":"build/js/react-select.esm-D1cIlkyk.js"},{"revision":"60ad6cfda62f476fad10fcdef497075a","url":"build/js/pagination-nXOw-_fv.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"9a1175eb86b14ee292a6b08fc5cb7a28","url":"build/js/navigation-BIJWjddp.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"948d97dba56181bca2e1fb934f815464","url":"build/js/index-z7YL2h1x.js"},{"revision":"cebc4f3503a59fc9dc4a22fda9063a89","url":"build/js/index-qkb7ve0Y.js"},{"revision":"510d4cd5dc143a30199b1fb4270047c8","url":"build/js/index-og4vxY7G.js"},{"revision":"0236caf93224cad62fe2b0587de01cf8","url":"build/js/index-eW0jXIKs.js"},{"revision":"159da807f133092ec126ae74c3875ef4","url":"build/js/index-ZXCQXRT_.js"},{"revision":"cb397480542e01ded1f7e837dcf4b492","url":"build/js/index-TRbHG118.js"},{"revision":"2347abb94d9ced7e32e8f9e6a83c91e8","url":"build/js/index-DQOszC56.js"},{"revision":"bc140371499a77596225b86df511ae5e","url":"build/js/index-D6QmckJt.js"},{"revision":"4c4ec0318d1dae7328a124d1d449ae33","url":"build/js/index-CfOWo1_R.js"},{"revision":"830867816a5261a9741d571bf5a7619e","url":"build/js/index-CMB8JAgW.js"},{"revision":"9600a3738f0d13a0ea40737875ea283e","url":"build/js/index-CDbPZVBm.js"},{"revision":"8c3e72ac4d6d1ca47724a2714dab2e39","url":"build/js/index-C8_zGuX1.js"},{"revision":"1913419235a78229add9603659a86f45","url":"build/js/index-C3j-D3ab.js"},{"revision":"7e2e0bf1b22cb2dc1b7e515bb4658018","url":"build/js/index-Bt-KTGCJ.js"},{"revision":"0028db12533ffc02ae527e4bdc9dd222","url":"build/js/index-BOG0LNBP.js"},{"revision":"bc39cb94453393799950138c21e6755c","url":"build/js/index-ALw6XHU3.js"},{"revision":"b7c2e0f810a6cea48e13265fca79547f","url":"build/js/index-55pEk9iG.js"},{"revision":"6bba73b901f72a241b873e5b531a7037","url":"build/js/iconBase-94nePmLD.js"},{"revision":"17df51b707d4fbc64987d0b01a41aa9b","url":"build/js/floating-ui.dom-BwhYFfO3.js"},{"revision":"08a79136b62c9b3bd51f663ad8e26761","url":"build/js/debounce-Cn1rDYAQ.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"7fe5c5ed85b0cb4261331fe8f62ed4c3","url":"build/js/app-BdIIADjF.js"},{"revision":"56efa7cbe20900c4be25e9e9dbc71a6d","url":"build/js/Works-Burt8I3W.js"},{"revision":"f69d42f250e954f60490dfd739513a67","url":"build/js/Wishtracker-CAmWGEA0.js"},{"revision":"1b8b42a7954bb20556cb8b622f08a247","url":"build/js/Wishlistbox-CO_9erRP.js"},{"revision":"9612e3b9c1659179845870a9d7385fa9","url":"build/js/WishlistGrid-Brk-PQHa.js"},{"revision":"8817bcc16bd6645d92e6c4d81f726956","url":"build/js/Wishlist-DmoWmUZ8.js"},{"revision":"89767b731ab8cf012a933921550d4d8d","url":"build/js/WhyLove-C6ytTLi3.js"},{"revision":"597481fe45f3385554782952718f7e6d","url":"build/js/Welcome-oenKzHgA.js"},{"revision":"a25db4843ac6ab5a6f4386dfec603123","url":"build/js/VipSupporters-BI2Z6fC7.js"},{"revision":"4efa261f8b4f5370217b8efe89ed7af9","url":"build/js/VersionUpdate-fjkpiP-L.js"},{"revision":"fe7a92da614941ae245a357ec4531926","url":"build/js/VerifyEmail-BQYlqzra.js"},{"revision":"a48d3fbede8b45f7d5a58fb3519cabdd","url":"build/js/Userprofile-BkDEC3K_.js"},{"revision":"7d5a7cd89cd3fc875080d0ce64bcc686","url":"build/js/UserCarts-DlCTn2ya.js"},{"revision":"a4c8bdc8950c619ca666f9c23270d158","url":"build/js/Uploader-CDb-CLn4.js"},{"revision":"95b24a4722cbc6b9799bd5e499977172","url":"build/js/UploadcareEditor-C1fyDOmS.js"},{"revision":"92f6a306bcc1ac578df46137942970f7","url":"build/js/UpgradeStripeAccount-BM8pkXRF.js"},{"revision":"1953ed694fce0c0f92ebd3f1b9de9b06","url":"build/js/UpdateProfileInformationForm-ByoWjmbw.js"},{"revision":"25b1f39934f69bc248043483aeb369f8","url":"build/js/UpdatePasswordForm-BVaxeI3-.js"},{"revision":"f0888454bd5d4f8c4915ff0c6bbbb5d3","url":"build/js/UpdateAvatar-DCWYtA6j.js"},{"revision":"4a58950ce7d26c351733db44e006b496","url":"build/js/USTERMS-W2iO9LxA.js"},{"revision":"cfd6fe399ffdfd8c1435e6085ded8680","url":"build/js/TweetNow-CxKe3YSA.js"},{"revision":"2ce9a3ea13d7a60b13a434215f11197a","url":"build/js/Turnstile-BfoUS5Da.js"},{"revision":"2f0e4b070ac4027785b13f95eee00a2e","url":"build/js/TrustBox-BJrdgslZ.js"},{"revision":"d9c72adaa65a3a8b7096655740b51903","url":"build/js/TrendingCreators-brFFy3UT.js"},{"revision":"815f6edf8261896a068e9fb83afdab21","url":"build/js/TopSupporters-CxBGN8Xh.js"},{"revision":"98276f83349a58092065c07fde9f0c7c","url":"build/js/TopSupporters-2k2wK4yF.js"},{"revision":"7d0240d4090b3c62abe9783ae11dd0e7","url":"build/js/TopEarners-DgTdbpSz.js"},{"revision":"78c98693d8bbb1ff39e5a0466032001c","url":"build/js/TopEarnWishes-DeIbHJka.js"},{"revision":"bc226490b91d25f4d7c439526bfc8707","url":"build/js/TopEarnBills-EriKtIF9.js"},{"revision":"bef6e0e24643403ae136a8f630e2131c","url":"build/js/TopBar-mUrklIQJ.js"},{"revision":"82b501f03dcf37ca4e862b49d1859fe3","url":"build/js/Tiplisting-BlSQ-H0T.js"},{"revision":"33c81d0203f60c8c8f610ba3962c28fd","url":"build/js/TipTracker-yJgRJ4EN.js"},{"revision":"c2362f98d3d9d45acff5b05995226db2","url":"build/js/TipInner-D0GBG9x3.js"},{"revision":"25d09393124fa4dd8bd15b5d45d5761d","url":"build/js/TimeFormat-Dx_ri4XQ.js"},{"revision":"bd62050867ae24fa4a729a5cd77edc93","url":"build/js/ThankyouMessages-Bt0NWEn1.js"},{"revision":"15236a7925f0b35277095420f4eeb786","url":"build/js/Thankyou-C1lcaOZ2.js"},{"revision":"0bf8280b820d80481713c31056a297fc","url":"build/js/ThankYouRye-0P5C8E1E.js"},{"revision":"06649a858343d697c2f2bad5f1e500e0","url":"build/js/TextInput-CT7pWrZs.js"},{"revision":"619b76a1042f628f282155ff73d91d3b","url":"build/js/TestIntercom-Bbynh3aq.js"},{"revision":"eda27004e97a94ec230dbcbf93b90004","url":"build/js/Test-vZUtut8Q.js"},{"revision":"9fd6fdd3d4071a0aad6542272a219b3d","url":"build/js/Terms-DBlb3DfT.js"},{"revision":"d8b9d35c6ed0f981afe34b3d8b2d7275","url":"build/js/TabbedDashboard-IBHOheJE.js"},{"revision":"1f91d92a1b8e85eba2ec837c8b33a70d","url":"build/js/TFA-Gc7slduI.js"},{"revision":"53a21dca03c0b70ce08ec96266113d9f","url":"build/js/Suspanded-B3Pk8LTf.js"},{"revision":"910085c672b5a224257a3a2de72f3ec1","url":"build/js/Success-CizEDFRo.js"},{"revision":"d27e922baceb0522b7860916d9d2083f","url":"build/js/SubcriptionEarnings-CmhEH6S1.js"},{"revision":"018c0f39f3277588e2efd28f595bd324","url":"build/js/SubCheckout-CA6Ka-a2.js"},{"revision":"7bc7127685724f6078182800844f7873","url":"build/js/StripeSafe-CvKoJlxU.js"},{"revision":"5fb824694580ffcc2915d10c69c16329","url":"build/js/StripeIdentity-LVMUp1--.js"},{"revision":"f94c40df3da0ecec7f5f61ae7bb9180c","url":"build/js/Stripe-CNNEu36D.js"},{"revision":"d45d602cf5e1ceebb520a67d404e0f2a","url":"build/js/SocialLinks-B7sMD8Qj.js"},{"revision":"7805e00b8b811ee752056b21c0c3a33c","url":"build/js/Social-JKt8fKkr.js"},{"revision":"861bf4ea2e7bcfd42c67ef76a7873c83","url":"build/js/SiteSubscription-CvFt57S_.js"},{"revision":"a98b59425b71f493cae106dff3663fc5","url":"build/js/Show-D10_bvh-.js"},{"revision":"4861ec92038c1e39f3810c5f25b57a4f","url":"build/js/ShopTracker-D6Bt6Kud.js"},{"revision":"4a56a66e3c9a780bb579d9ca21756a5a","url":"build/js/ShopPage-WIX2xOmS.js"},{"revision":"fc1781c5677549586f98f256b0d15a9e","url":"build/js/ShareProfile-B-HbPfSb.js"},{"revision":"7553be5ca9dee3bce1ca09e4c3718713","url":"build/js/Settings-BgbFyEId.js"},{"revision":"3c4def20ca46361c26fb4d6084709869","url":"build/js/SendTip-C-vQujoG.js"},{"revision":"dc298bc2084f864fbc9123bd444fdde7","url":"build/js/SecondaryButton-C0Sd_Gyz.js"},{"revision":"557b656e1a68ebce0a2414b676e0c263","url":"build/js/SayThanks-BcaGqFH5.js"},{"revision":"26518aafa50e357e76a78b3a23d70b48","url":"build/js/SafeTransition-DUazVqRO.js"},{"revision":"ea0b9f10b518ec35c66ac24f9cbb7a10","url":"build/js/ResultsGrid-B7HnW-U1.js"},{"revision":"51dfc9c117f32207c53b1c91a5c63465","url":"build/js/ResetPassword-Rgh5KTne.js"},{"revision":"af3bf5a471cc0dcccf0483bebbff4d38","url":"build/js/RemovePost-YxRvB1WG.js"},{"revision":"2dedbf1af3a3dcbfb68886ae1aff9ada","url":"build/js/RemoveMembership-DVJ3DZfb.js"},{"revision":"4629ca926f1c2c8264a95d3734ff1504","url":"build/js/RemoveBill-BQz2UrcJ.js"},{"revision":"be4dbb5f4c93eac4898ea1541de83aff","url":"build/js/Register-D6zO9t73.js"},{"revision":"993fbeba70545adb4309caee48e88e5d","url":"build/js/ReferAndEarn-C-gS4kie.js"},{"revision":"5d98b39d495bf0aabab296fdf97735a6","url":"build/js/Redirecting-BCjK2nOR.js"},{"revision":"d5c1e845bead0b117f49c3c0b030cc10","url":"build/js/RecentSupporters-CbuiWBDa.js"},{"revision":"3da3e29e6a6d764c4f85c8a26343f5fa","url":"build/js/PwaTest-8FsvC62N.js"},{"revision":"3103a4b18dc12f57a83d36d9c93dcdb2","url":"build/js/Promotions-CQSUVCfA.js"},{"revision":"1da7c134b9b48cba62e5dda46cb4cd57","url":"build/js/ProfileTaskLists-B-MCf7WJ.js"},{"revision":"45baa5a40093359a60d9e467823335a3","url":"build/js/ProfileTask-CJ6qvOkc.js"},{"revision":"20fe1a7fa23b69d62e2ce406f83a0f2c","url":"build/js/ProfileSteps-C2OeCfD-.js"},{"revision":"42c442555bdea2ef47b304e22de31a53","url":"build/js/ProfileProductLists-DFVa99cm.js"},{"revision":"104018b0a556d157d5630f89a93437a8","url":"build/js/ProfileProductLists-CmsKgaNl.js"},{"revision":"35d594912df5a2454ddd8b19e7c88249","url":"build/js/ProfileProduct-_QieJ9UK.js"},{"revision":"75303f479c6c8ac427b0331375f26b3f","url":"build/js/ProfileProduct-2Fe_TXpt.js"},{"revision":"ad2b9f6d6b419d66faac8f2ec8fcca9b","url":"build/js/PrimaryButton-lc6thCWR.js"},{"revision":"70373b83d8f66855081c9b3382ccd1e3","url":"build/js/PriceFormat-FJy3GIWa.js"},{"revision":"5ee6bef8cfc00ed62114428dd548704c","url":"build/js/PostLike-BwUzRwam.js"},{"revision":"9b6b91ccdc7d4211fd9431112ef34ebe","url":"build/js/Post-CvRq254C.js"},{"revision":"40b973f7479a14a1025a0f8b7977fae8","url":"build/js/Popup-CQgoQtS-.js"},{"revision":"fa11af212b16042048a39048dd66fbfd","url":"build/js/PlatformAnalytics-B_EojISF.js"},{"revision":"3f41f96d35cdbfff820b163601b71e54","url":"build/js/PaymentSlider-D3oX-lvg.js"},{"revision":"f6b75d56fe3d718d67af9f273d5f3cc0","url":"build/js/PaymentDashboard-DaVe3hVr.js"},{"revision":"6571e86841b68e8b92f28b9d75c2a165","url":"build/js/PaidTasksTerms-CzsEuCjo.js"},{"revision":"6125c530c431de34a870c61659a598a6","url":"build/js/PaidTasksAnnouncement-YKQND8gn.js"},{"revision":"3ade471aebc3442e14374c41af9f0493","url":"build/js/OrdersLists-D-4OeD2T.js"},{"revision":"186418d33213d5298df9b1786fabe1b8","url":"build/js/OrderDetail-mjIUyMZ5.js"},{"revision":"4fcb46f055c33c04575094f59cf955ae","url":"build/js/Order-Dve-uckX.js"},{"revision":"3895d02551b7cf2e295da6bf75d364b8","url":"build/js/OldSubscribe-C8k9W7J1.js"},{"revision":"99cf9504d3080ffffeeeaa12d9d0afd7","url":"build/js/NotFound-Ch9DVBrg.js"},{"revision":"e2f22df47f47984eb94775a7ca1907b0","url":"build/js/NotForBusiness-P5WTRTbV.js"},{"revision":"479ac5ff92953762aa895a1c5513a513","url":"build/js/Nocontent-D4cbKItf.js"},{"revision":"79c508a4e9cbe68c0740c6a4eb99842d","url":"build/js/NewVerified-BufjrpYr.js"},{"revision":"343a4776f443a59f60ca328bc2bb1abc","url":"build/js/MyShopProducts-D7aMlSXR.js"},{"revision":"213de89111332a817289799e5374cc46","url":"build/js/MyGoal-u-RDRRdh.js"},{"revision":"8080f9e6c8d3e77a9105a47f065934f2","url":"build/js/MonthlyRevenue-BSzkIrxW.js"},{"revision":"7b9aed8059b106eb42fd5603457d5cbf","url":"build/js/MembershipsLists-Kd11-FNl.js"},{"revision":"3808ab260e9e82dc81e77aa40963a517","url":"build/js/Membership_dashboard-XElbCqpm.js"},{"revision":"81ce1de09b6a7668e7dabc7ce4350916","url":"build/js/MembershipTracker-CBby0ZJg.js"},{"revision":"efbfe6b214e59b0e9eaaafb9611673c7","url":"build/js/MembershipLists-CwtQO_Yz.js"},{"revision":"75a1456e98ea291f332050f2dc77639f","url":"build/js/Membership-D7wGDFr4.js"},{"revision":"01d5940ba4432acf4b63f6cb2edc5274","url":"build/js/Membership-Cg-1NsLw.js"},{"revision":"07336066f690feff0432216d7f932788","url":"build/js/MemberCheckout-Br7_iiby.js"},{"revision":"a7c2d37218f5858279e179f7233600fd","url":"build/js/MagicBellNotificationDisabled-6394dSw_.js"},{"revision":"630cdc5c12fbc03def882ca059244c71","url":"build/js/MagicBellNotification-hhTfmaKB.js"},{"revision":"3477be75b1e3fb3a75ea3b685a378247","url":"build/js/Login-Za2DiQK8.js"},{"revision":"b1e22ea8f576133743c81a3c9565c1d4","url":"build/js/LoadingScreen-8UFvbMac.js"},{"revision":"84f35ae6a48efe26354d2a80136027ad","url":"build/js/LoaderButton-DRonlnyb.js"},{"revision":"8e27b4edd919a84c5aed79e351a5dbba","url":"build/js/LiveBarSection-tudtZUUW.js"},{"revision":"06afd7568ee8e562e68cbdd15618fdc1","url":"build/js/Lists-CfjK-NJj.js"},{"revision":"f5efb3799262452884eae81de2472724","url":"build/js/LinkTwitter-CdkYTQCD.js"},{"revision":"069c907a21929e1fd80596465d256276","url":"build/js/LineChart-BYPISdnw.js"},{"revision":"4810ef72c3a3910d707e5b8875396593","url":"build/js/LeaderboardStars-BUmmkQop.js"},{"revision":"3b76a0f92a0dbd1a7eef98faa09afce2","url":"build/js/Keep100-BRxEHVTr.js"},{"revision":"2b7ac3d62c6c8ee16f4ae47ad0d70f2a","url":"build/js/JoinUs-hNoPKfe0.js"},{"revision":"353570351e69e126a8117b081e940ff4","url":"build/js/Item-a8Nwm81Y.js"},{"revision":"3fdb02768bdec62cf46f3de6e309995c","url":"build/js/IntrosVideos-AIg25xsf.js"},{"revision":"c930bbc1996ca9370f21f80fdf5ca08b","url":"build/js/IntercomDebug-B_cAY5Xl.js"},{"revision":"9be859665e5378b459923a7b65e0a471","url":"build/js/InputLabel-D2Dbu0oB.js"},{"revision":"38db61ed5ec8cfe173b5fa9a6f04b41d","url":"build/js/InputError-u4KFYXo_.js"},{"revision":"8378dc7eb990fc8b24b304946fa39f1c","url":"build/js/Index-Dg7Xrdva.js"},{"revision":"d94b8f0f80003b89660bcc6217481249","url":"build/js/Index-CcpxZdG9.js"},{"revision":"3b85268b174cc9fba01484808851f207","url":"build/js/Index-C_xnSNod.js"},{"revision":"180accd62b66a2a467d4705700f69456","url":"build/js/Index-BW8xvp8A.js"},{"revision":"e32e5051863637e7e795381ddf836715","url":"build/js/Index-B0gnyfRw.js"},{"revision":"2a8ccb9bbc0abacd5d6d6aba36acab2e","url":"build/js/ImageGenerationWithAI-NpjxEY1B.js"},{"revision":"ca04a08e1ac17878636f78df64f4d520","url":"build/js/Icons-DLWzumDd.js"},{"revision":"5d8b37fd9bdc3b2f3735011b3a090f26","url":"build/js/Hero-Bfs9Iyer.js"},{"revision":"c07dea0fc7622e666f0298ec3e9fd2a2","url":"build/js/Header-CMpUILCK.js"},{"revision":"91030b83e31234eabb4c50689829ae5c","url":"build/js/HappyCreators-CnPolq8L.js"},{"revision":"0fadb9c9a0720eb41d687d046d5d6a3c","url":"build/js/GuestLayout-CcWoK5v5.js"},{"revision":"d150f0cc929ced49e62c4a13281925e7","url":"build/js/GrowthTrends-5EE78027.js"},{"revision":"323265506243c7f28e7504be85edbd86","url":"build/js/GlobalCheckout-02POTl0I.js"},{"revision":"fc880f093340aecd9782ddf7f18a4a09","url":"build/js/GifterTips-cLQzbYJI.js"},{"revision":"802fded7d930e1a7e7d33794c54b7d98","url":"build/js/GifterSubscriptions-CwtkkXJC.js"},{"revision":"e6dace919431e6d04d20d59af035f760","url":"build/js/GifterMembership-CxApdg14.js"},{"revision":"8d05dba7f4bba0bde1d2a6fed3d2e068","url":"build/js/GifterMedia-Dj2cTj5a.js"},{"revision":"b9a96fb86d474f02b2a4aba4932b6bd5","url":"build/js/GifterItems-B3wJaUa-.js"},{"revision":"48bda625c18627ab831b3e8a3fb0699d","url":"build/js/GifterFeed-oMFGyP8G.js"},{"revision":"b86740fded672d769fef973c19f0b1bb","url":"build/js/GifterCardVerification-COfK5D-x.js"},{"revision":"3409c654401ecce0b57eb169eb3859eb","url":"build/js/GifterBills-Cd9dezKx.js"},{"revision":"c5efcac88cae9382c00a8a953bbe80f0","url":"build/js/Gifter-CLxPy48-.js"},{"revision":"d6bbbad20cb5c7cf30d4d386b1615024","url":"build/js/GiftStore-BHVqOSx-.js"},{"revision":"9c2187a8296c8acc4e9dde53c3efe4b9","url":"build/js/GiftListing-C4-GauRN.js"},{"revision":"89728c35cab25fdaeef96bb46185e258","url":"build/js/GiftEdit-Bb-jQAuC.js"},{"revision":"6a9c331c42d208ea19d2427fb0767b9f","url":"build/js/GiftAddCart-A08UQOpB.js"},{"revision":"32b33ac801db7971071cf7326194dd59","url":"build/js/GetCart-XiMH3fnx.js"},{"revision":"2e46892c6f558940a8b862ee3d004918","url":"build/js/FunPart-DMeWnZ6o.js"},{"revision":"c01f28b9d5775dea679ffa2acdfc6cb5","url":"build/js/FounderProgramAnnouncement-CNPHOuY7.js"},{"revision":"11edc44ea0fafa768a2919b295d7938e","url":"build/js/FounderBonus-CDinXZ78.js"},{"revision":"0c5886b5cb5af4acf3984e5d499dd671","url":"build/js/FounderBadge-B1Qi5BKj.js"},{"revision":"cc6b8c6ccf4d3952a49b62d790237c58","url":"build/js/ForgotPassword-Dh0o3HJK.js"},{"revision":"cdcfdd0ab8b5af542672a87c82f2fdd3","url":"build/js/ForCreators-8vWFYLGn.js"},{"revision":"52328707b18748f28171327218b4e819","url":"build/js/Footer-CyDD_hlz.js"},{"revision":"aac0d6cb24a1b28cac5cc342c67a6258","url":"build/js/FollowButton-ph7a7BmM.js"},{"revision":"2f5a0cdd0e174afc5eabf4c0fd6b52fc","url":"build/js/FlashMessenger-DaMDZuQ6.js"},{"revision":"79fcde74d2730f504cffd5f5b7c6364a","url":"build/js/FiltersPanel-BesvdDW_.js"},{"revision":"3cb4fd828c994f34c38c4f011ed10430","url":"build/js/FeedList-BHFO_tVI.js"},{"revision":"a7044b51ff57cea41176d3f307556ed8","url":"build/js/Features-BPCX_ARO.js"},{"revision":"665560b6f92469d37516332922a4acc6","url":"build/js/FeaturedCarousel-D9lR4teC.js"},{"revision":"01cbed849eeba8702fc9f1aeb2ad5828","url":"build/js/FAQ-Dd_zsEre.js"},{"revision":"2423324cb5936c0bc1b2a6d0ebba7cf7","url":"build/js/ErrorPage-8cV-Jmk6.js"},{"revision":"2f5a2d2886ae50bd73fd64cd8580c2af","url":"build/js/EnterOTP-CTsiDik2.js"},{"revision":"13a29b02e4d162abb355cccabfa40420","url":"build/js/EnableCardCapabilities-DRLmRViN.js"},{"revision":"807acc28b9968886c479a18201ae2c79","url":"build/js/EditProfile-Clg2FFzZ.js"},{"revision":"04e0f8e4283b20836b9cfe2b2a0abb11","url":"build/js/EditMembership-BT0F-JxP.js"},{"revision":"a1702b2c62e0bdf3ea37420f5010b4fe","url":"build/js/EditCategories-DN3Gm2zK.js"},{"revision":"cb9cd81e4761860de1b28f9f1a8c4d30","url":"build/js/Edit-WS44R4w8.js"},{"revision":"8a15643161798ab7df3dddbb9b577ff0","url":"build/js/Edit-DAeW6gmH.js"},{"revision":"25a08eb30d63a4dfb930d24ef7245281","url":"build/js/Earnings-BDeh9Bi9.js"},{"revision":"26ef6e147ccd0a0ae75e9fbd53bf84fb","url":"build/js/Disputes-muArq3Eh.js"},{"revision":"53c7d63fdf2759cd47b2fe3de99cc80f","url":"build/js/Discover-DM5DnOCM.js"},{"revision":"3c25cde6cea072ab1b6b4c937b1b9d36","url":"build/js/DiagnosticPage-wCtQi7k0.js"},{"revision":"0dca97e33ec89e7f9e18ea59445e5d5c","url":"build/js/DeleteUserForm-arO_OXq3.js"},{"revision":"9bdbd9629ea00bdf335bee03d838ab26","url":"build/js/DeleteStripeAccount-C9cZHEJg.js"},{"revision":"daf772f247a10d2db6d82b21379b66eb","url":"build/js/Dashboard-f7rseySZ.js"},{"revision":"620af538d374926866bd23d2a4263954","url":"build/js/Dashboard-DwxOcoPH.js"},{"revision":"e7621f73e29f1073c0da5700ab1d1116","url":"build/js/CreatorVerificationNew-BxhrUC9s.js"},{"revision":"71c4315c971f4dc50f18cb38c2461d4b","url":"build/js/CreatorVerification-6KYoFVjA.js"},{"revision":"980dc4800712d605a9548e054dee689b","url":"build/js/CreatorSubscriptionWidget-C71WZyEK.js"},{"revision":"c70800de22850b1bc241c66aca7fc0d1","url":"build/js/CreatorCard-BbbO-JNY.js"},{"revision":"9ede213a5ac6aa80aa96303a1e7afded","url":"build/js/CreatorActivityWidget-1ysXvKVw.js"},{"revision":"4aca7755606fdbe7d6aa2cf2611ca9db","url":"build/js/Create-hjQ2ASJF.js"},{"revision":"f43e872d649e70b5358e931881e1014d","url":"build/js/CountriesShipping-PfsABy76.js"},{"revision":"2acaeaf6b8e17077b131d52df5c15f76","url":"build/js/Countries-DB_HCOnL.js"},{"revision":"97839ef0913d0d6a227fb18b730d24ef","url":"build/js/ConfirmPassword-B0oiU5y5.js"},{"revision":"61a4c993938c32f375f2a7c33968d8f4","url":"build/js/CommetsLists-D_xFcfTP.js"},{"revision":"7ff28c0caaedae2fa45758a40ef35a56","url":"build/js/Comment-C5ZTC5q7.js"},{"revision":"fbb01bb64209c7f87e85e3827e152ff3","url":"build/js/ComingNext-B1OOktu1.js"},{"revision":"1b9e07f90d68681211352a17d264a7f7","url":"build/js/ChartDashboard-DD1eGcVD.js"},{"revision":"90aedabbc81850f8c167db62195f7fae","url":"build/js/ChangeVat-D5V8NyDM.js"},{"revision":"53584ada2bab70256c52778b4feaa3c9","url":"build/js/ChangeCurrency-DQGqmk_G.js"},{"revision":"234a4ddf8346030a604001830aae60c4","url":"build/js/CategoryLeaders-ViW-FwvH.js"},{"revision":"ba0f77085bc5b9787cbb8b8168271f67","url":"build/js/CartListing-D7Q1dxDy.js"},{"revision":"241f62530a1fae3506c5e70fa7bcb9a0","url":"build/js/CartItems-DsXgpAoI.js"},{"revision":"7caeabf06c88f36158799440204b545a","url":"build/js/CartItem-CUPzTcwj.js"},{"revision":"3a246161bfac50e969150b4879c25b88","url":"build/js/Cart-kmCIpRat.js"},{"revision":"5bf012cb6f040cac57032db8e5192cdd","url":"build/js/BuyShopItem-5K9EZ7qC.js"},{"revision":"f75dacffe357abd02796f42cb2a3d04a","url":"build/js/Board-DPIKqfIn.js"},{"revision":"a1525bf20546ea0ef79e8c53161446cb","url":"build/js/Billslist-kmXRmEE_.js"},{"revision":"bef989d12b5ccd85cc7ebb4516b3b3f2","url":"build/js/BillsTracker-C8hhuA1S.js"},{"revision":"83a002883963b68be77fce80331ed50f","url":"build/js/BillCheckout-D8Q_nFP2.js"},{"revision":"66f3678a391b42cb26f00603c0ecfd17","url":"build/js/Bill-C7C7eCj4.js"},{"revision":"b47cf3fffc4a0ad49877963832d485d2","url":"build/js/Avatar-DXzMcuui.js"},{"revision":"a9af58da048cd95496d5ba74c7bdca03","url":"build/js/AuthenticatedLayout-Dz94cI9M.js"},{"revision":"61c44e306d5a2de841b22e0d0926d44a","url":"build/js/Analytics-BaHtfoWz.js"},{"revision":"4691120bfe077e0c8897c19bc7231b4d","url":"build/js/AllWishes-Dni1MjtA.js"},{"revision":"1ab12e6a5f291b3f5e990d3a2a8d898e","url":"build/js/AllCountries-hcPSpVEp.js"},{"revision":"45a7a4663497de79bc75c24748287dd5","url":"build/js/Alerts-DDrwJ-L0.js"},{"revision":"e5d076642cda01f48919999f1fb42bc8","url":"build/js/AddressForm-CdY6Q_Xm.js"},{"revision":"02163b0dd348fb87319dd9feea64d635","url":"build/js/AddShop-A4iY-gbs.js"},{"revision":"9c278aa5bf9e49b4182d2c92eeeae3fe","url":"build/js/AddRyeProduct-bzDZAwAw.js"},{"revision":"c38c4e7ce99758f7292b75526097c064","url":"build/js/AddPost-lpE1DdHO.js"},{"revision":"6f976b117a801eaee9d15317325e8fd1","url":"build/js/AddMembership-DOqCDOtR.js"},{"revision":"df7604dc7b282b2df5fa1e5b7fec77fc","url":"build/js/AddItem-M2nCy6fV.js"},{"revision":"a49a0357681f29a4612fe204ef371d68","url":"build/js/AddIntro-CSHrg-42.js"},{"revision":"5f9b4d4888e2f374ae6e8bb59b1339b4","url":"build/js/AddGoal-BpZabPV1.js"},{"revision":"1f8a3eda0ab011da416fee0d37be3b58","url":"build/js/AddGift-Dwb2bYCJ.js"},{"revision":"4aeed2d763c73bfa84e3d7ae154e8509","url":"build/js/AddComment-593nQePk.js"},{"revision":"33259aab266d3162532d287aed17bcfb","url":"build/js/AddCart-BrNwsJu6.js"},{"revision":"c40eaadcb63d4014674e40acd9ecbe50","url":"build/js/AddBills-DZdKbKIr.js"},{"revision":"5a649b60f69e1221d7aec17746060202","url":"build/js/ActivityStatus-D5Js2q0J.js"},{"revision":"d0597b914926c79ce819e4f88ba4699a","url":"build/js/ActivateSubscription-CszhMmZB.js"},{"revision":"3de95d529e70107e6987ec082c8ecf86","url":"build/js/ActivateCard-DfDJbTi_.js"},{"revision":"631f0f6d54c0e0ee02deadff6b11d356","url":"build/js/ActionRequired-UvSc-Tev.js"},{"revision":"9a267414d4eea840c4562e2e59326402","url":"build/js/AchievementSystem-B_B0IyFO.js"},{"revision":"c2d90219b8f5aa1dd622207b8b1a34e1","url":"build/js/Accountsetting-BKNxs5YL.js"},{"revision":"d1b3480adc6a3db89a777460a51ea212","url":"build/js/404-BtBwHUYR.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"6d4d90f55a497e614ce5b0ae871da806","url":"build/css/app-B7NsHuZJ.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
