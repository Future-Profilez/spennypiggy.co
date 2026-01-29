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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"efaa9ccac78ed61f8dca5801dbcf686e","url":"build/js/vendor-react-BewxsrNk.js"},{"revision":"08a1d2385a8f19b3143edf7a612ee182","url":"build/js/vendor-other-C7haYOLy.js"},{"revision":"4869f24ecb1ed82e8cdbc4b69f6e666a","url":"build/js/vendor-inertia-DS6sUH1_.js"},{"revision":"c3ba05914cc51928535de6896eb1698e","url":"build/js/useDispatch-BhlqtmYo.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"c98d70fa712e986888c35a2ef7b19d02","url":"build/js/triangle-alert-Cr-CzoC9.js"},{"revision":"ff88c2c09dee65ceb0a47ca5457b5aca","url":"build/js/swiper-react-R03qpPA9.js"},{"revision":"f9e9e89ee25b2d385990dcea71c80b2f","url":"build/js/star-CCGZMIPk.js"},{"revision":"6018d2b778be90b94a3424629432154b","url":"build/js/sortable.esm-DWjs62cQ.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"f26042f93a81ecd103df6c5d94f67143","url":"build/js/shield-check-BWO5QFQe.js"},{"revision":"40e2026baaa4f94ca063fd350cd3d69c","url":"build/js/shield-D_Eps8tQ.js"},{"revision":"5cd995acac1653f19e525efee0657b42","url":"build/js/react-select.esm-D_P231As.js"},{"revision":"d70acc200bc06089c132fbbf118511b5","url":"build/js/pagination-DnRiDIkF.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"ff3f08b1ddf2e5d40f8d01dc00e0b342","url":"build/js/navigation-66SL1CKw.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"5c7bfe4b64a9077349757b7e76f9131a","url":"build/js/index-joesGIIx.js"},{"revision":"a726bc38b4d9c981e68d3a5b729b8b88","url":"build/js/index-gpfiYQpx.js"},{"revision":"d7f12909d4f0346d034999a6f2047268","url":"build/js/index-g-3vu7WT.js"},{"revision":"c6e5e2a32ad83f37b3ca433f50b3fa8d","url":"build/js/index-T_4y3ugA.js"},{"revision":"0f5e1ba1d86781a0acbedd4db4b6deff","url":"build/js/index-GGydVyxi.js"},{"revision":"345e9dc40f575cf71c9cc1bab3778649","url":"build/js/index-DjPqVD85.js"},{"revision":"e7fa1b0fbac2507e095a31b3318036f8","url":"build/js/index-Dg5ocEnc.js"},{"revision":"51fa1adc3a4502320b7e06ec65558c04","url":"build/js/index-DYgtGDET.js"},{"revision":"65849e69e9adaf7120afd235a8c24856","url":"build/js/index-CvG1bWnr.js"},{"revision":"8e8cd086e406a1519120b5ee9e2aaa8f","url":"build/js/index-Cpje0xQr.js"},{"revision":"88c82dcd591f2782df36a539f317d3c6","url":"build/js/index-CkAXAtYZ.js"},{"revision":"47d495a79b9f30007ef2c91ee231128d","url":"build/js/index-CXlONxOQ.js"},{"revision":"cd3f8ffbe4a3aa751d889edd405ef671","url":"build/js/index-CRehzcl9.js"},{"revision":"632d46336fbc5b6fa2270391ccf1b155","url":"build/js/index-CPPPZ6bF.js"},{"revision":"00c665b102a613efd0b3ead2b421fd14","url":"build/js/index-B_Unaf1K.js"},{"revision":"3c35c32b38662a0579226aa06fde45e9","url":"build/js/index-BSiVrt2G.js"},{"revision":"253ad9a0a96a52a42383dfd71753a488","url":"build/js/index-BN22XLQK.js"},{"revision":"3541335f59355196798d2a8fb0bae1f4","url":"build/js/iconBase-C2jyJTDU.js"},{"revision":"85a281724e1dfeda56ec1efe06649c28","url":"build/js/html2canvas.esm-N5Qv6hEC.js"},{"revision":"b1006b21f832752ea30a9264c93aff83","url":"build/js/floating-ui.dom-C3m0Cuiq.js"},{"revision":"ec6e0f53e578f9b90d1b410b1ccffcc7","url":"build/js/dollar-sign-BRxkBYim.js"},{"revision":"a1c88df61a70cf72f2de31159aa5b230","url":"build/js/debounce-D-rqLus3.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"de99e21fe4f7637112909d75a4d45ea9","url":"build/js/clock-CWWBcdf6.js"},{"revision":"84fe5143deece3188aac2a28ebd73abd","url":"build/js/check-DafEeEA6.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"e04001a034647d9d23bcdd6f01579147","url":"build/js/arrow-right-DcGtvI8W.js"},{"revision":"bb04bc5d3ab2cc8839d58e44232f170a","url":"build/js/app-DFXJZXD7.js"},{"revision":"b2ee8c01e0aba308c111772e796656d1","url":"build/js/Works--_MArKYd.js"},{"revision":"ffff65b1f1ab969a088f8666437150e9","url":"build/js/Wishtracker-BkUvl6oo.js"},{"revision":"4c80dc7a7fe91d95b2b192304655012e","url":"build/js/Wishlistbox-C6xxJ1rE.js"},{"revision":"6982030980abbaa4644267275b6bb72d","url":"build/js/WishlistGrid-xn51RRy1.js"},{"revision":"64eba8696aef697ad087afe82ef67814","url":"build/js/Wishlist-C2LJS3rU.js"},{"revision":"c4b43304b6980d7ef6e71b078e5b5cf7","url":"build/js/WhyLove-Diezv6sI.js"},{"revision":"68518964e066a5c459140690c2deb2c1","url":"build/js/Welcome-_99Ob5KK.js"},{"revision":"d8d1b6c9d9cef123ef04179257c8bf4c","url":"build/js/VipSupporters-BgEocddk.js"},{"revision":"b75cc9ae28d47f72d5147c6118138b56","url":"build/js/VersionUpdate-C-3KtWaa.js"},{"revision":"6eb23ca4409603a923f7ded5830a4009","url":"build/js/VerifyEmail-T-5NXdvs.js"},{"revision":"b340bb1d3ebaddad81e4d08d34524c74","url":"build/js/Userprofile-CYcYKRmi.js"},{"revision":"f449ed088ab2c345b829c623414e7e90","url":"build/js/UserCarts-BQEIed8v.js"},{"revision":"7cba034c747d3ec9779b0cb911bc1684","url":"build/js/Uploader-D4QKmy_B.js"},{"revision":"1b072c54a26d578cf2d05bced9b6e51d","url":"build/js/UploadcareEditor-CEivoztf.js"},{"revision":"4772aefa85e699a6ad3d4be6fb2836a3","url":"build/js/UpgradeStripeAccount-BSFZgw_O.js"},{"revision":"d5d31d5f2200f7ceb167635e77ee159a","url":"build/js/UpdateProfileInformationForm-B1NyfJpp.js"},{"revision":"38711f42235b6f8eeea82c143e07ee8d","url":"build/js/UpdatePasswordForm-BVXc2SpO.js"},{"revision":"dbffec418ab6857bbb7f83d525462cd0","url":"build/js/UpdateAvatar-CxQWqTP9.js"},{"revision":"01ae16857c1dfd0e8ac97c9d84e5ba99","url":"build/js/USTERMS-DXgk9Abu.js"},{"revision":"fcc7d58ea0cd60631e0dd30518a4059a","url":"build/js/TweetNow-CxdViq3a.js"},{"revision":"a94f5a79e192652c15019e17547b48db","url":"build/js/Turnstile-wAkOwRcV.js"},{"revision":"149ca30cc46faafbac53b0369aeef73c","url":"build/js/TrustBox-DuGNfkML.js"},{"revision":"94208164de7ca90a86f300a59dba4c39","url":"build/js/TrendingCreators-CPkd9Oha.js"},{"revision":"1fef40835fbb83773276c8cd5bae005a","url":"build/js/TopSupporters-DsrcTd88.js"},{"revision":"045d00fa56071f0be3f12c4cad1549aa","url":"build/js/TopSupporters-DhcDbskZ.js"},{"revision":"2ab7a1e1c8e09933fd65b2b7843309b2","url":"build/js/TopEarners-C_VdOHKb.js"},{"revision":"a48d5a5525999e368c9cbb151155106f","url":"build/js/TopEarnWishes-BlwaWbcr.js"},{"revision":"734ed4548f3df9caf95eba3b371461b2","url":"build/js/TopEarnBills-DAbjlRHc.js"},{"revision":"3eec46039825d0f640d5592265b98f18","url":"build/js/TopBar-b9n-_1vX.js"},{"revision":"d2a972ca1ff0af6d9177025f76053c95","url":"build/js/Tiplisting-gynekHdV.js"},{"revision":"0f75062759e1568a7c06a2895cbfee18","url":"build/js/TipTracker-BguItks2.js"},{"revision":"ff4b1cd71b8ae10c8e346487a7edae0b","url":"build/js/TipInner-Cu0xrvXe.js"},{"revision":"6e1c06c07e92190c9f10341ec853c35f","url":"build/js/TimeFormat-B8sdaSpZ.js"},{"revision":"9abddafc695ff35d189e7b70fdcf4607","url":"build/js/ThankyouMessages-4FuJ1d28.js"},{"revision":"2847fe27cff9b1ad08fc613f649157c6","url":"build/js/Thankyou-CZEGptFn.js"},{"revision":"73b5aba212e4a3d60593935278c04d53","url":"build/js/ThankYouRye-FgmgtvJ2.js"},{"revision":"4e6d0c61db7103f82e55e092b058d9d5","url":"build/js/TextInput-CkQ3X_WU.js"},{"revision":"59cff10914cb8160c997941039177497","url":"build/js/TestIntercom-CYdH0Wk0.js"},{"revision":"d41f35dae07b0303dfbe0a75d2154c96","url":"build/js/Test-C_RexbQM.js"},{"revision":"e18bcf6318c7fcafdcf899f8deb44a34","url":"build/js/Terms-C3nGbimt.js"},{"revision":"ea097981db50c51935a1818760cf386b","url":"build/js/TabbedDashboard-B_aE8PYb.js"},{"revision":"1bdd1a5cce76fd15a5507816f46f5317","url":"build/js/TFA-YrmMjkX-.js"},{"revision":"909136fa0d6df43e1c30eb223cedcca0","url":"build/js/Suspanded-BZYi5CiV.js"},{"revision":"b633ece125dc4d44ee954488c0424318","url":"build/js/Success-Cvu5HbKG.js"},{"revision":"f8fdb75155f47af82093ac4b7c69d378","url":"build/js/SubcriptionEarnings-3WzuXPhx.js"},{"revision":"c5be11435d5bce6b78474981badaea60","url":"build/js/SubCheckout-Bckpfo_6.js"},{"revision":"29b3551c54ffb10d69e04ecd72543120","url":"build/js/StripeSafe-DjIYkUNt.js"},{"revision":"12034dc25fe78bdce63fb7da21451ee0","url":"build/js/StripeIdentity-CzIRS0o4.js"},{"revision":"16ac86af1b53c43def28734c854e3669","url":"build/js/Stripe-fPtuPQtx.js"},{"revision":"4f6a13b6badee120cd3e900b5d923237","url":"build/js/SocialLinks-nYs8PGtB.js"},{"revision":"09c794824a5dd319a713768d34b08b89","url":"build/js/Social-DHYGEX45.js"},{"revision":"9933d2e4af595b72d7785c377013c4c5","url":"build/js/SiteSubscription-DVjRg7ej.js"},{"revision":"8d48996622badebaf8962bb1cbfcede8","url":"build/js/Show-CMHfZFPe.js"},{"revision":"e6d73f85433a931729d589beb1c7469e","url":"build/js/ShopTracker-CeT4X3ut.js"},{"revision":"b810ae023c1dd13e5e2efc861bdce588","url":"build/js/ShopPage-CGtHoaRT.js"},{"revision":"aadaaed911d329ec9fed56b74a40b822","url":"build/js/ShareProfile-DWHoZOq0.js"},{"revision":"faff251bb56dc90db68f4748d39a037a","url":"build/js/Settings-BX7_C45S.js"},{"revision":"d97de7c6414169ec3da9ee4eb758d75f","url":"build/js/SendTip-Dy5Gr9d6.js"},{"revision":"998583be795967212d8e39a4fe612b63","url":"build/js/SecondaryButton-DPEKlycK.js"},{"revision":"419ffd156d330c010e1b272feab08bee","url":"build/js/SayThanks-DuFErK-5.js"},{"revision":"642797a803f017af0fb606bf499e55eb","url":"build/js/SafeTransition-hwe6UrA7.js"},{"revision":"e49e9fa1ae97c379be7ba9d2db527ad2","url":"build/js/ResultsGrid-C7e43nYr.js"},{"revision":"4340cffdc82d20845518790785656b30","url":"build/js/ResetPassword-Cql34GE5.js"},{"revision":"a58974c77263f86b7d1654c9af10d452","url":"build/js/RemovePost-CC3IoWTQ.js"},{"revision":"99c7c86ad880c205f98b689e83515b09","url":"build/js/RemoveMembership-Dy28BxQ5.js"},{"revision":"51c5aec6b800e5cfd3b2ccd136eb3353","url":"build/js/RemoveBill-CCyrHOWS.js"},{"revision":"ff8a233438e185f7ebd573d630848374","url":"build/js/Register-oReT76eo.js"},{"revision":"5a1a9b3848ce5438ee88bc722bc40a01","url":"build/js/ReferAndEarn-BFdUbGm0.js"},{"revision":"3d0d96bf2a0e8e0fc3a0e64f683c26e9","url":"build/js/Redirecting-B8LL4xEU.js"},{"revision":"b4bcc3e1d0378fcc2089a88e0c673152","url":"build/js/RecentSupporters-DJvViB1W.js"},{"revision":"cf343aa3c3c02ee838e888cf5f979370","url":"build/js/PwaTest-Jbzh2XYI.js"},{"revision":"7d91573ab62e9cf9182a017dc5924cc3","url":"build/js/Promotions-CdzvS_SV.js"},{"revision":"f72c2e3c6d78f2436548aa47daf68ded","url":"build/js/ProfileTaskLists-kMOJzdJm.js"},{"revision":"b71fc5da05f2ad9555d330ba41af779a","url":"build/js/ProfileTask-D4tc0MEL.js"},{"revision":"6daa92191acd33b972ebf50237efe224","url":"build/js/ProfileSteps-duS0TVdh.js"},{"revision":"11c511dffe0e4c08bc62b5749efe3768","url":"build/js/ProfileProductLists-ChBsmcgj.js"},{"revision":"1bb19899ed479ae0a73167a83f61faba","url":"build/js/ProfileProductLists-CHaPSXCT.js"},{"revision":"f8a8705a85cc66d5c004b1fe946c15ea","url":"build/js/ProfileProduct-CA6Ntdnm.js"},{"revision":"a2233695a28458f49cce077f47b3ed69","url":"build/js/ProfileProduct-B7WKfx16.js"},{"revision":"2ef743e8cdfd066621faedf6d1ca501c","url":"build/js/PrimaryButton-CEJ1vAlN.js"},{"revision":"f0f377397ea2048691653864c436363a","url":"build/js/PriceFormat-CNw2YdT0.js"},{"revision":"8c512202f9c71003f29bde4e66e756b0","url":"build/js/PostLike-PDuukNiz.js"},{"revision":"4a055ab1d118b5180ddd9908dc9aadfa","url":"build/js/Post-vtEL7ypN.js"},{"revision":"b140734b506eb81addf2683091f64df2","url":"build/js/Popup-DRi7JiSF.js"},{"revision":"46df61994c38b438fa629121dfe289ae","url":"build/js/PlatformAnalytics-ynM1o8-r.js"},{"revision":"82edafdf08322894b434e9fb9a67ea8c","url":"build/js/PaymentSlider-BVSkLGBq.js"},{"revision":"3531c45c0f17451871fbe80b2f972e25","url":"build/js/PaymentDashboard-BKwsIwXG.js"},{"revision":"cf60b08a56f39da0f4dc970e8fdc11d2","url":"build/js/PaidTasksTerms-ZtE4zwAz.js"},{"revision":"0616ef4f4abfd8eb330757993f4a92be","url":"build/js/PaidTasksAnnouncement-DL2K9aKh.js"},{"revision":"86a97b5990b6d02c8c0fc444b07d6307","url":"build/js/OrdersLists-JgwJeje1.js"},{"revision":"6f834d7f9e4bb5a95875c4937b95bad8","url":"build/js/OrderDetail-BlEpMAYG.js"},{"revision":"287cf25afd9ab0d1b55f731634e4aae0","url":"build/js/Order-DuVcmpAO.js"},{"revision":"f7c09567c476a89dc910e530746187d8","url":"build/js/OldSubscribe-DeoZEN-4.js"},{"revision":"478bbc57ed3faecb4f7722d242902e95","url":"build/js/NotFound-CrPvNU3l.js"},{"revision":"818433b65f2f15b865f7e66f74db6744","url":"build/js/NotForBusiness-CuOEKAvV.js"},{"revision":"e7d70065c32ffb8bf5c1995a78d14fb2","url":"build/js/Nocontent-CNEL-Wvh.js"},{"revision":"ce6dc9dd6b86489335ecbc6e9891b448","url":"build/js/NewVerified-0T6bBXhN.js"},{"revision":"f98f44fa2d08063064506c1b5f25f3cc","url":"build/js/MyShopProducts-D3yep0Dm.js"},{"revision":"6387e77dd12e01c79b90129d9510922a","url":"build/js/MyGoal-DJM-p_B7.js"},{"revision":"368c5488142fb576f28c4f35c6f29c8d","url":"build/js/MonthlyRevenue-BuY704uy.js"},{"revision":"773457e96080f934ba857f4ef6a9f869","url":"build/js/MembershipsLists-CkNaY-l2.js"},{"revision":"e6176caf2fc550351de81077a587d59c","url":"build/js/Membership_dashboard-D9ZQ0EzY.js"},{"revision":"b39afa70396ad8f3360033323f61182e","url":"build/js/MembershipTracker-EGcrk7HO.js"},{"revision":"4fd80b15058982a9689d536173a210e4","url":"build/js/MembershipLists-BLZgj9HQ.js"},{"revision":"d2842b3c7a348dafd4b9ddc020d2a054","url":"build/js/Membership-kqira_z3.js"},{"revision":"b057c7276781e625520f25b99bd057d6","url":"build/js/Membership-BBNbNTcV.js"},{"revision":"02fa168051a8f026b796113cac45e74b","url":"build/js/MemberCheckout-D8BO43Df.js"},{"revision":"dda9eaa467ded735a7ae8d3d0a212f7b","url":"build/js/MagicBellNotificationDisabled-BV9ZfPFo.js"},{"revision":"aad172bcbed1538e8d8b69bbb5ba0654","url":"build/js/MagicBellNotification-DadEr_xy.js"},{"revision":"dd427668074e6d57648aa5cdd9a94584","url":"build/js/Login-DUawFWxT.js"},{"revision":"29d0a3a6547242809878ba4e197d5393","url":"build/js/LoadingScreen--cxc6Dex.js"},{"revision":"c29e23b0ed86cb4d24990f9895bd3379","url":"build/js/LoaderButton-BwLugdQC.js"},{"revision":"14d1a95437c9bd7d18af17ac2602726c","url":"build/js/LiveBarSection-9JVqrd2p.js"},{"revision":"9b810635b19dc22d41cd098b9d3dd338","url":"build/js/Lists-LYU5HIg-.js"},{"revision":"ac8e623fb17e46ee06f9c569b4c1b4da","url":"build/js/LinkTwitter-BtzIuj2G.js"},{"revision":"99c3e344c5aaf2357b4a46dd0763a74c","url":"build/js/LineChart-B-sFDyl-.js"},{"revision":"649eac39209ff2d7c15e6bda220d6a01","url":"build/js/LeaderboardStars-DThe_T1P.js"},{"revision":"631f0cff536d44d08eadc112c50c45cc","url":"build/js/Keep100-CyBBXq32.js"},{"revision":"d4e97487f9747d2c2419d24c54141cfd","url":"build/js/JoinUs-JmXxND-u.js"},{"revision":"cfe29bab3ef18fc8f067cc91dfdab80e","url":"build/js/Item-DR9SzjrO.js"},{"revision":"99d6859130dbd12637edd4ff95f979d9","url":"build/js/IntrosVideos-DOdh_Mug.js"},{"revision":"26dfb286fce63eaf078f72e9728942e4","url":"build/js/IntercomDebug-akRZtP2D.js"},{"revision":"7dfcabbbd2fd12cf4863558a6bc945f2","url":"build/js/InputLabel-CagEkE1n.js"},{"revision":"fc2533dbaf9a8505f242bcb147bc533b","url":"build/js/InputError-UoiQqE5y.js"},{"revision":"d8c348ec158a03bc894ef8b0a751f0df","url":"build/js/Index-K7aUAIck.js"},{"revision":"f996abfdb0d24bf0f1624e935b45aa58","url":"build/js/Index-DkaFQOju.js"},{"revision":"6e9116491da9473dd5cd7120f7550f84","url":"build/js/Index-CvrqeGWa.js"},{"revision":"30f3af8b66dc82850ef581b8cea20ea6","url":"build/js/Index-Bu0JXWW5.js"},{"revision":"e02159de6f3289e4fac69b7249134e84","url":"build/js/Index-BKlZL3yL.js"},{"revision":"5af94751389c66c256597b635c4dc25f","url":"build/js/ImageGenerationWithAI-C9ZABmXU.js"},{"revision":"ba4bf83bbf34c5eecf2147a2f5a06ab0","url":"build/js/Icons-B92LD0KG.js"},{"revision":"51d4a3c613e299a3e09fe83b9ce1f4d1","url":"build/js/Hero-Bmgp5bsw.js"},{"revision":"f2a09ca62ad0d5e07a3e6a2e522f3f79","url":"build/js/Header-v3cRL9r0.js"},{"revision":"596e0c475b1f92c19e467e10d003607d","url":"build/js/HappyCreators-DqroS3VC.js"},{"revision":"49f5f0d2ff9fc606aef7702acf9f3f38","url":"build/js/GuestLayout-DQvWhtTB.js"},{"revision":"880678866b7fff8f7ef7e10b8eb57eca","url":"build/js/GrowthTrends-DGeukevL.js"},{"revision":"0bb77ed2c35313281a107c5118589185","url":"build/js/GlobalCheckout-Dj52Xyio.js"},{"revision":"04b4736d87fbb7efe90834e9d6245a07","url":"build/js/GifterTips-yLI_KjAS.js"},{"revision":"d4c89164405a6a0a9418dd12c5f8a537","url":"build/js/GifterSubscriptions-DO19Dp8k.js"},{"revision":"d688664e6910c599041661084c9b60f7","url":"build/js/GifterMembership-B5b0tvdO.js"},{"revision":"f9767ca24df72ac65fcf2e46c258dab9","url":"build/js/GifterMedia-Chv_QLPj.js"},{"revision":"3b647db193d9b3c428c8183c88c8df51","url":"build/js/GifterItems-DargxIB1.js"},{"revision":"2707bd4eac116d8dd7c0fcd501be3acd","url":"build/js/GifterFeed-fQ9nLLVp.js"},{"revision":"81e2e836c4b1e09d27270b6de56ba94c","url":"build/js/GifterCardVerification-CgEo3leJ.js"},{"revision":"da994c72fb647963963266b0e6932ae5","url":"build/js/GifterBills-DNeP9wVK.js"},{"revision":"5bea93a517df8811edaa5c6d004956d7","url":"build/js/Gifter-DaDXnnSX.js"},{"revision":"ca7caa1049bdc8e23adfd87210dcb8b2","url":"build/js/GiftStore-IYobvIqA.js"},{"revision":"1aed50af530e30ce3063f904f8bc5044","url":"build/js/GiftListing-C6Zc8iiP.js"},{"revision":"4e6ac616cf709fcadb58a7812efe665e","url":"build/js/GiftEdit-d0hBKJdu.js"},{"revision":"0fe50e7d6301eb7c1a81b765f41f5046","url":"build/js/GiftAddCart-Br3f7S_I.js"},{"revision":"00a8aa3804ad6820eef683c5dec5c3fd","url":"build/js/GetCart-DzZwuK0z.js"},{"revision":"9a7e307256f1ce07a009e3c646f99a9d","url":"build/js/FunPart-C2AHiEpH.js"},{"revision":"4e377fa4ca4d384b149c7c91a5e9895d","url":"build/js/FounderProgramAnnouncement-FLRkfvKl.js"},{"revision":"208e5515a4a8044341d704ae09098144","url":"build/js/FounderBonus-BefDwllo.js"},{"revision":"98dbdfb21d9087de5c47c40b091baeb0","url":"build/js/FounderBadge-Dny0mmfP.js"},{"revision":"65c0e7c392e8e1636009a2c7232e92f4","url":"build/js/ForgotPassword-BkTdBc3F.js"},{"revision":"54c02c62a187af29744a2eabb5c31d8a","url":"build/js/ForCreators-2UdlfoPn.js"},{"revision":"27aeb84fcb14f717f9104dc4a9103534","url":"build/js/Footer-Pnn8M-wI.js"},{"revision":"35cd5728c3c2dd5c457333f674aa5960","url":"build/js/FollowButton-BCxfN2XU.js"},{"revision":"ba9a4992621a18ef9d1eb723b0a1e83a","url":"build/js/FlashMessenger-CldOZQ1l.js"},{"revision":"c8be2ea0f609ad6c6a765a30bdc32ed2","url":"build/js/FiltersPanel-zfh1XHVf.js"},{"revision":"7b5e98ee6e3cb82c57271a9e8d870288","url":"build/js/FeedList-s-5KTmEr.js"},{"revision":"2318a7427209db0b1e460416403965e8","url":"build/js/Features-Dnwjhkz4.js"},{"revision":"0899b6851d8031ba3a559fb135d87d35","url":"build/js/FeaturedCarousel-B74ClZt6.js"},{"revision":"59fe48fbd6fb0474df123ab08ba6afee","url":"build/js/FAQ-D8V6gSFd.js"},{"revision":"f1d421b4ebcb611dbcd6cb565f9647ef","url":"build/js/ErrorPage-Bo4N2p34.js"},{"revision":"43ce5a7071eecfd5e93eac03c0ffdf87","url":"build/js/EnterOTP-ClrtcXp7.js"},{"revision":"900e939a686f1a20ad9f566edaa212ca","url":"build/js/EnableCardCapabilities-DYeGIsUF.js"},{"revision":"20ff2b0a71cb2fe6f17c550552c0c2f3","url":"build/js/EditProfile-CaVzk8vn.js"},{"revision":"20b0e44bbbb92b744e4df28b8a87d3a2","url":"build/js/EditMembership-1_ZwwUTF.js"},{"revision":"858c56ea4c961ac81e712b5cb1f71ebe","url":"build/js/EditCategories-CHDFZbHu.js"},{"revision":"5ab0a15d36c2724654a201fb10cfda4c","url":"build/js/Edit-kmC5SrZQ.js"},{"revision":"cd5efab3ecb7a9768346dd7fd5f746bb","url":"build/js/Edit-DFKf91EV.js"},{"revision":"a97dddd9a84bd08ad0be132f2a043fee","url":"build/js/Earnings-BjXc3XFF.js"},{"revision":"188799594fc6ac067d9788470a3704b0","url":"build/js/Disputes-TOHvEMoA.js"},{"revision":"9162916ebca61b3fef4ebd3f59a906e4","url":"build/js/Discover-Cyu7xZpo.js"},{"revision":"61047153df9e05fc0a443c700046a037","url":"build/js/DiagnosticPage-DfydNcBe.js"},{"revision":"f43f2ae14dcce898675ef0ed2d5ad58b","url":"build/js/DeleteUserForm-IFvsGAy9.js"},{"revision":"60f9b13012472044a51a7de3e9d77a19","url":"build/js/DeleteStripeAccount-H8xP51rl.js"},{"revision":"16638cedad0840bc8642db44fcdbf268","url":"build/js/Dashboard-Qi1SKqAW.js"},{"revision":"662976b7f3441b479d82fbcbb9eee87b","url":"build/js/Dashboard-DAdg1inM.js"},{"revision":"a6bd3df8d48ddbe399516d450d127d74","url":"build/js/CreatorVerificationNew-ChtO1ayF.js"},{"revision":"e2c9032a1b900af719e40ae742913694","url":"build/js/CreatorVerification-BPzPovv0.js"},{"revision":"3258f720651e96592d70d7bca8599f45","url":"build/js/CreatorSubscriptionWidget-D9HlF20p.js"},{"revision":"ede26daa5ad5b866508fb956a244cdbd","url":"build/js/CreatorCard-CwEmejv4.js"},{"revision":"b7b1bd3c838f0518b90c079ac64da0f8","url":"build/js/CreatorActivityWidget-BWfDAR35.js"},{"revision":"2d35c578a1cfdd7756d19e05cf7d0edd","url":"build/js/Create-uUZReMvt.js"},{"revision":"44fd743a465e905bc6ac022a72b4a16d","url":"build/js/CountriesShipping-ByG_IEz8.js"},{"revision":"e9d528cea1092f4a948aa55897c66685","url":"build/js/Countries-DPOQtsps.js"},{"revision":"3aa664ac46cbb1bfaba1ed700a67fa3b","url":"build/js/ConfirmPassword-B3xDnzXK.js"},{"revision":"15adabb28513a871d2646e38645a0df4","url":"build/js/CommetsLists-TyaUbaQS.js"},{"revision":"62f63350a3bb83d12d510e4616de7435","url":"build/js/Comment-CVlfmx2v.js"},{"revision":"c1be85ca6974bebba743ef83f79a178e","url":"build/js/ComingNext-CW-F590f.js"},{"revision":"63bc729d46e92e77e923f95644e34b7e","url":"build/js/ChartDashboard-CC_BfBdl.js"},{"revision":"b1b9f1fdf3d21cb22ee282605855030e","url":"build/js/ChangeVat-DpP_BynS.js"},{"revision":"42d888c909a6c08d059e904889e37486","url":"build/js/ChangeCurrency-DfgAfged.js"},{"revision":"23e25d418735f3aa9abf598dc0902515","url":"build/js/CategoryLeaders-C0mpBi1G.js"},{"revision":"59722ebb29ab03e3a7cbcf4fbd2afeba","url":"build/js/CartListing-CLRzqKR1.js"},{"revision":"e3179b7cc234349c0610c357dd9a131e","url":"build/js/CartItems-BI7WwwCB.js"},{"revision":"ce650758abc3d470f76c59acbfcf179c","url":"build/js/CartItem-BDAMxgNS.js"},{"revision":"9579a5b56df703d53f8cbb8d629ddfe9","url":"build/js/Cart-_9u8jVj0.js"},{"revision":"7910ecb0068b869bae0fc62068640d10","url":"build/js/BuyShopItem-BPHpJUGq.js"},{"revision":"9775b2cb89b642a69fa28b7a12284473","url":"build/js/Board-kyiV_Tfu.js"},{"revision":"3cc27ea3718db4a346fd3a343c48188e","url":"build/js/Billslist-kgTMz6VB.js"},{"revision":"d7a82da2d60f8651c6adf6e3214f58fb","url":"build/js/BillsTracker-Cwe2iCSu.js"},{"revision":"80b73bdf03c80a6e2000dd40886b31d2","url":"build/js/BillCheckout-CWuAzCTL.js"},{"revision":"7a6321d73b77a686e37f6a1c74b3544b","url":"build/js/Bill-DH_vaEnS.js"},{"revision":"755296dbd74278c5d562fb16c32f769d","url":"build/js/Avatar-iEoJtZQc.js"},{"revision":"8df85401ebaf9a84f8f0e5c64f776e62","url":"build/js/AuthenticatedLayout-B32LwVnD.js"},{"revision":"a640eb8e5862676c708977b5dfad5a48","url":"build/js/Analytics-B7RG3pY1.js"},{"revision":"43665e518b8c1180378d515acf83867c","url":"build/js/AllWishes-BD9rIUOH.js"},{"revision":"4387275d03cb74065d1c73c3319760d3","url":"build/js/AllCountries-B-ctmjtH.js"},{"revision":"5a69bdf5c35103a1feeb36674642efc5","url":"build/js/Alerts-CoNF7ZkG.js"},{"revision":"6b8f698f9567706cedb667e4a4010d63","url":"build/js/AddressForm-tEIWU9QS.js"},{"revision":"35e9e1ee0bec3662e0cdf22a218beffc","url":"build/js/AddShop-2sVqQaqo.js"},{"revision":"13a298151492fffb3c5206a6fc6ef4fe","url":"build/js/AddRyeProduct-DGussJCu.js"},{"revision":"596be153075e81969fec22243b343eed","url":"build/js/AddPost-BUBqMsn7.js"},{"revision":"e30cd3526aee4575a6d457e806b20fb8","url":"build/js/AddMembership-DT13pVM7.js"},{"revision":"ea2d9015ebf0009bd11413b69ab6c6ed","url":"build/js/AddItem-WVJTvoG3.js"},{"revision":"e0c196280a2f63754efd888844a27cd2","url":"build/js/AddIntro-CIdpUr6R.js"},{"revision":"21c1aad944d86b3204ac33d8a2eaa920","url":"build/js/AddGoal-CxE3sJZO.js"},{"revision":"b5daee1613447c5d83ef9c7ac0ccc8cc","url":"build/js/AddGift-7-JPbm79.js"},{"revision":"ecf2561f6a58470966987a982989e2b6","url":"build/js/AddComment-DG-nxiEk.js"},{"revision":"5d4fcb09c0116d8544ad497164ec416c","url":"build/js/AddCart-Ci23JbYF.js"},{"revision":"990e4df659158067d9e8b1da1b6cb117","url":"build/js/AddBills-CbzbDeyG.js"},{"revision":"f1e2b8f76c0b447465f2fa8227716e33","url":"build/js/ActivityStatus-CHrQtiLe.js"},{"revision":"5389a7e87bb210f97b8991eda4691229","url":"build/js/ActivateSubscription-C6yr4HH4.js"},{"revision":"c18119c1c497252c920fc701e46ed054","url":"build/js/ActivateCard-DkVcUXtw.js"},{"revision":"48197e5c13aadb6819763751313a97b6","url":"build/js/ActionRequired-EegTTrCt.js"},{"revision":"a6aa8c2a91e500aebeb09915cd28fc45","url":"build/js/AchievementSystem-Dy9qfWAu.js"},{"revision":"5b507d3d6e08793f1886d6b965bf7107","url":"build/js/Accountsetting-DkW9YuiH.js"},{"revision":"4155666cd1c3564eec5c4efbf8722bd7","url":"build/js/404-CVJUfzvc.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"0e17b0439b99cf1f4dd2754bfc8453e3","url":"build/css/app-BD9ffeiC.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
