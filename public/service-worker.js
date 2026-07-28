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
precacheAndRoute([{"revision":"0542490e3b0e14e6b7633d4712086de7","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"b966f3b4b225ef11f23c936dbc876aec","url":"react-emergency-patch.js"},{"revision":"6dcbc0359d538c8c05e4f5e503623142","url":"react-emergency-patch-v2.js"},{"revision":"fb579e404c8c059148d3e5c1c297cec9","url":"react-emergency-patch-simple.js"},{"revision":"5151b6ba20822ebc99dd428afad13c09","url":"og-image.png"},{"revision":"e12052e5d73497f23d5e74aa1b92fe48","url":"offline.html"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"b97974df1c40f1025453ee9e4a5cc5b3","url":"covers/sunset-vibes.svg"},{"revision":"1143f1e32cc0da9353965e47ada43a47","url":"covers/pop-art.svg"},{"revision":"5854305abdd27af6e9b9a9532de306d4","url":"covers/neon-gradient.svg"},{"revision":"d11c0b7d77985cb6a4d0e1027ce100e9","url":"covers/minimal-dark.svg"},{"revision":"c86fb694874eb7d59252ae43ce8fda64","url":"covers/holographic.svg"},{"revision":"9e9f39a80cdbcc65a8a2e41a1500ae2c","url":"covers/coin-rain.svg"},{"revision":"348cb2d8806f7086e2d187e829abc03f","url":"covers/abstract-waves.svg"},{"revision":"f6ac8e8626bb296907c67d7e51e5299d","url":"build/js/wishlistbannerimg-Cpnk9_me.js"},{"revision":"3b21919c37fb03e13310e6c5d3914d3b","url":"build/js/vendor-utils-41xEOZnb.js"},{"revision":"b326bff475b147871b01755a0e294560","url":"build/js/vendor-uploadcare-CaO_HPj8.js"},{"revision":"d316b5e105ea129263134ed95544ad49","url":"build/js/vendor-ui-CeRgmXMC.js"},{"revision":"b7937bf06052b0048a83f79bc2070321","url":"build/js/vendor-sentry-CMaXWSaM.js"},{"revision":"46d7c002318581d4cbf0a88267cef395","url":"build/js/vendor-core-Agv2YTA4.js"},{"revision":"3a80fbdaed64d51a8c3e348760aa86ea","url":"build/js/vendor-charts-C285MpYr.js"},{"revision":"331f8fee69e429620437d4e67d447ff3","url":"build/js/useIsMobile-DNNGnB3v.js"},{"revision":"c481ddd1b5a25d77505c99fca4cbe6d3","url":"build/js/useBundle-Buq10TJP.js"},{"revision":"7d6d49ba3f123a7024c39af133c9a4cd","url":"build/js/use-transform-CivGdIL0.js"},{"revision":"711427dd8f743f3699326f1c830f9ff2","url":"build/js/use-spring-C7jSlqIe.js"},{"revision":"2a59fbe45ca97ec98f8661f8f2e0a1b5","url":"build/js/use-scroll-BHZtP8gy.js"},{"revision":"b042804fa2350cfde78030726404487b","url":"build/js/uploader.module-B0hBk6Cm.js"},{"revision":"ede255f3a984bf541707e66047036341","url":"build/js/uploadedimg-C28q1Z1S.js"},{"revision":"651c31a17220961c13b7aac0b639d33f","url":"build/js/swiper-react-CXB4YmTw.js"},{"revision":"39bf8b3472c6f05ae5182f339eb1a0b1","url":"build/js/sortable.esm-B-4vPM5f.js"},{"revision":"e5707d25920db570ea1d7ed83a27264f","url":"build/js/siteicon-CFDvxeYF.js"},{"revision":"9eb5af0dd9ca8cd438ee62b9e85322ff","url":"build/js/rewards-DmpL-ESN.js"},{"revision":"fbf48a73aa6f7d0f2fb0d8012def33f2","url":"build/js/rankTier-Z-6p5WjV.js"},{"revision":"6b30eefa29ab4b4693ef43a9f2e5b349","url":"build/js/pagination-B27PWfoe.js"},{"revision":"360bb7e12f7befc6fbd23fae2f3eae51","url":"build/js/objectSpread2-BmiL0Ibe.js"},{"revision":"e3adda7d867415707b34f6882e4c420e","url":"build/js/noresultimg-D8-0tO6e.js"},{"revision":"2040526230be1f4367d1109319bb78d5","url":"build/js/navigation-Byqr0vvj.js"},{"revision":"8f206118186beee7837f0dd64fbb8f53","url":"build/js/lucide-ABztztKS.js"},{"revision":"dcd6fe06e5e66e0e8e1b77ceb9d717f4","url":"build/js/logo-BxsSaGIe.js"},{"revision":"9aab09ee6789c725d4ac68802448e956","url":"build/js/index-o0uD7vDy.js"},{"revision":"7880a9daebf5b1e9b58e72de902b7b35","url":"build/js/index-ee7oWfwd.js"},{"revision":"8b2bc29d7935bb637642b9a90e9706d8","url":"build/js/index-IpyCgEhp.js"},{"revision":"f545d65e7a00519f921046c36f6fca37","url":"build/js/index-DQUy403_.js"},{"revision":"295930d452dac0dd70a5acad71d8cca0","url":"build/js/index-CZVAfqPs.js"},{"revision":"285a616e671690cbcf148f14e54eeb11","url":"build/js/index-CZJdqUne.js"},{"revision":"52b5bde482315f72721605340769cba8","url":"build/js/index-C5r6sUXS.js"},{"revision":"edcc9bf026f76b495f4df0dcd59429a9","url":"build/js/index-BcorR5eD.js"},{"revision":"281dce35e3c82c755e486773a9043b35","url":"build/js/index-BTfcaEy5.js"},{"revision":"89b7d195476ec788adddb321cb47d9ba","url":"build/js/index-BJMVbccU.js"},{"revision":"638b61b1d110bac0b42ee8218e58a210","url":"build/js/index-AGTxfaEm.js"},{"revision":"fe09dcbe002b33c0a4a18d268c8950ee","url":"build/js/html2canvas.esm-DXpxwkko.js"},{"revision":"de319950c31cb4b9a26f22c665910f14","url":"build/js/formatDistanceToNow-B6FmQM9Z.js"},{"revision":"01ea452811d71e7b8f55a35247b12817","url":"build/js/format-Dha5fv-H.js"},{"revision":"3c5b52e720c823235416be836d0f016c","url":"build/js/floating-ui.dom-dbkrT13w.js"},{"revision":"202c43dceb40c000db9837cfba2e0f8d","url":"build/js/exportCsv-BFwbKU_G.js"},{"revision":"2d821df371666916f2122fe98685c796","url":"build/js/cartproductimg-nbYRtAcn.js"},{"revision":"a6979ff708b8e8e20903d7745e3e83f7","url":"build/js/app-DrlwhG2E.js"},{"revision":"ac627d97addffb6dd45d325d38e20c8e","url":"build/js/YouBar-1QJNNVc1.js"},{"revision":"d7221e7bb3ea2dff809e4cf578627dd4","url":"build/js/Wishlistbox-C83Bc-8o.js"},{"revision":"03a9ff71c5b5f35f666b3d5b1c8999c3","url":"build/js/WishlistShowcase-TJa6MOJR.js"},{"revision":"25433fb178620e9da9918c351a0a8d69","url":"build/js/WishlistPreview-DTBO5II1.js"},{"revision":"340f10aab5bc83843552656a52431373","url":"build/js/Wishlist-Bo18mcHF.js"},{"revision":"ce35ffc8e41044b38c7a44bd06ff6d75","url":"build/js/WhyLove-CD2K8BBI.js"},{"revision":"2f1edf7867b27560ae1179eced0d3b5b","url":"build/js/Welcome-DLRGlzQJ.js"},{"revision":"b1e35df580b2767a42bc1879dd9fd53f","url":"build/js/WatermarkStrip-xQ2Y_XLo.js"},{"revision":"55aca9193ec246e33943e30680969d1d","url":"build/js/VipSupporters-I5ucKbyJ.js"},{"revision":"8686f901b0ee7d0a6646d1d33dd34897","url":"build/js/VerifyEmail-DaOC5RDV.js"},{"revision":"abb0c0e4f5ebeb6255c0dcdf2472ece6","url":"build/js/UserSlice-CS6kb4AR.js"},{"revision":"16c93ae6fd2e58faec333dba0818c26f","url":"build/js/UserCarts-CHq_UwDc.js"},{"revision":"320025e9fbce11a4bd19d6bc3e40afc6","url":"build/js/UsAddendum-OBXoeoTx.js"},{"revision":"c0b56f7717e405719898cc6472591b94","url":"build/js/Uploader-Cv7tUaYZ.js"},{"revision":"a30da2e084060df8dd65473efdf5611c","url":"build/js/UploadcareEditor-BPeqAdHd.js"},{"revision":"84de47f5c56ae395c3dd39e964e10ab9","url":"build/js/UpdateProfileInformationForm-Ce3wDaIA.js"},{"revision":"7cf7a8a30f0c4d819ff9f5a54e7ae867","url":"build/js/UpdatePasswordForm-BhE8I6LZ.js"},{"revision":"3cd9970b9f6978dcdbc6a68392d76136","url":"build/js/UpdateAvatar-vn6wD8lG.js"},{"revision":"9847958cb12f2ac9f2025c6a78cc33e4","url":"build/js/TwoFactorSetup-BwjptJ-2.js"},{"revision":"a521ee1fa3a3a5c909d926434beddac4","url":"build/js/TweetNow-CBas-yqz.js"},{"revision":"367a5770e4635e6c70b8d226b4deac52","url":"build/js/Turnstile-SsM_X5oU.js"},{"revision":"1af510c985edbe7c7513e151e3fed73b","url":"build/js/TrustBox-Bwlxg9GF.js"},{"revision":"b757194df296ab8d8268c8f5c55b0835","url":"build/js/Transactions-Cj1Ks6Vd.js"},{"revision":"a1feeca9126c0e5ca04a565e3defa5b5","url":"build/js/TopSupporters-DiqnFLRi.js"},{"revision":"57771ca3885e70d90949501bfd20f7c9","url":"build/js/TopSupporters-2SisgWqA.js"},{"revision":"30ff36905535f395c3f33fc63fdf619b","url":"build/js/TopEarnWishes-w8xnGtcX.js"},{"revision":"e70eb442b45cfaedfff058f68c8cfd3e","url":"build/js/TopEarnShop-hNkhmrLq.js"},{"revision":"389ac022d107adc52d3471540c137fae","url":"build/js/TopEarnPiggyPots-DbH4ofjB.js"},{"revision":"8b4cd1fb46feab5ba8ee3e0a2be8b21d","url":"build/js/TopEarnMemberships-DGGnXyxG.js"},{"revision":"8e2ae45cd68587865d9f595d4a8db940","url":"build/js/TopEarnBills-BSXlcups.js"},{"revision":"345efe67c5bf70276ebe89ed77bbd3d9","url":"build/js/TopBar-DzTkA7F7.js"},{"revision":"5a669cd199ceacc760fac8f17eb03a6c","url":"build/js/TipInner-wYDpaoTs.js"},{"revision":"3bcb8571b34da397fb1cbc92a1107cd2","url":"build/js/TimeFormat-uhAiF6Qq.js"},{"revision":"e05217ed19af6434847184341215554e","url":"build/js/TiltCard-BIVQlYFo.js"},{"revision":"02d28390f2590c013ddacd3251361b4d","url":"build/js/Ticket-57Fa-I8S.js"},{"revision":"8930ecdcf0ee88a3af849d88691a913d","url":"build/js/Thankyou-BUqeS9F5.js"},{"revision":"d7cc814bae0b2197c97429880e3b5793","url":"build/js/ThankYouRye-Z0NT-Oxo.js"},{"revision":"61d05fc22a4f7ebdd9e489948b115199","url":"build/js/TextInput-C9jCt_M8.js"},{"revision":"b83ae3050ddafeee67c3619dd9da3d39","url":"build/js/TestIntercom-B070RTa0.js"},{"revision":"61c9a139d2ef5881866b9a9559015cf7","url":"build/js/Test-DOf0q-2p.js"},{"revision":"025b9e028510b23fc2cfaf750d7c8f1b","url":"build/js/TermsOfService-BGEH6Dbt.js"},{"revision":"f9d6d438655e407f539ade8e76bcd152","url":"build/js/TaskItem-D7F09ytx.js"},{"revision":"07d737135cf2e29b0f51c63d9251f0f9","url":"build/js/TFA-BmLXIzfX.js"},{"revision":"a39d87346e33fd267ecfb58f3b1c7ea8","url":"build/js/SystemDiagnostics-fBLjJFjz.js"},{"revision":"6588f2af26efab420537a35107956e89","url":"build/js/Suspanded-DU9rE_5h.js"},{"revision":"dfec5cd3d50ca283beb88f3bb26ce143","url":"build/js/SupporterTerms-DPapoJh1.js"},{"revision":"03804df6748aad9bd0bb19893b78e143","url":"build/js/SupportStory-Dsf_TAlE.js"},{"revision":"23f330fe7778ae6f82eabee7a7403e59","url":"build/js/SupportModal-x-id07j2.js"},{"revision":"80fefe7e4d4d3ef6c29537cde57db2d3","url":"build/js/SubscriptionEarnings-DZZPZnPR.js"},{"revision":"78930a90b4ee40d6ddbb6ad03c64662b","url":"build/js/SubCheckout-DbjqqQki.js"},{"revision":"19c8e5d8f59fe3749961a1716cc6e66f","url":"build/js/StripeSafe-_tqprxIU.js"},{"revision":"1b049557dd21153a44c643ccd20910aa","url":"build/js/StripeIdentity-BJn10Con.js"},{"revision":"8e8698ef3762a7e924773126a5af8ee2","url":"build/js/Stripe-BruoHund.js"},{"revision":"c6dfdaca27396376af75b211d3f6a6b7","url":"build/js/Store-DV--GuwN.js"},{"revision":"de1e9fa0feb6ca8b26f2caf44a29d072","url":"build/js/StatementDownloadCard-DDf6kVQM.js"},{"revision":"d2250d4b9ce9ec5125d6e707da4a7715","url":"build/js/Statement-BcEJAv3h.js"},{"revision":"709be466c1f1270bd3fc669209f409ff","url":"build/js/StaggerItem-vwbDvEXh.js"},{"revision":"1372dbf1e1ea9668b8f15ab7b1431ccc","url":"build/js/SocialLinks-B3dvnVuB.js"},{"revision":"04d45ec6d1f3d74c1b605efb53f6fab8","url":"build/js/Social-DNjCnnVH.js"},{"revision":"f15a16ce014d7781034f78cd3f9bc755","url":"build/js/SiteSubscription-IcN_vduq.js"},{"revision":"1f63aa8987ec8330989923b79ee41688","url":"build/js/SiteLink-naxl6hbO.js"},{"revision":"273539ad61ce9d49d4ccc4f051b2c813","url":"build/js/Show-k69Nobrb.js"},{"revision":"090f39f68c4d89d641bc6354d251a6b4","url":"build/js/Show-C-Vzz_Yt.js"},{"revision":"50fdc09f0250f5b7f0a0975466816f51","url":"build/js/Show-BV3f6SQD.js"},{"revision":"44368f9ba3f723d8c0a350d1ab728323","url":"build/js/Show-4nLR6soZ.js"},{"revision":"2b7046b9b2ac40c731f471310946785c","url":"build/js/ShopPage-CZ-LpQe2.js"},{"revision":"633fa8d4b5d5d56724208a293035682c","url":"build/js/ShopGuide-D-82Ahuw.js"},{"revision":"6bb99ea5bda37012c1661bd1d966044a","url":"build/js/ShopCard-B_v1qCpk.js"},{"revision":"7b05debc209c90ef6e2eaf180ef4a770","url":"build/js/ShareProfile-BbuWubbw.js"},{"revision":"4b762be9944f7bfec7c2201c17d5bdcc","url":"build/js/SetupSteps-D40RM2uE.js"},{"revision":"8816d369c25730536bf75e3057ce3dbb","url":"build/js/Settings-BNWHAo2b.js"},{"revision":"a6ee815e3ac8e0dd0ced714f827c09bf","url":"build/js/SendTip-D0xJKBQp.js"},{"revision":"13ef177fbbf200198aa3c5eab17bea15","url":"build/js/SecondaryButton-BirX0am2.js"},{"revision":"44d851bad408631cf8734dc408b3f1a6","url":"build/js/ScrollX-iQKitjV3.js"},{"revision":"f1059f7c92fd80f8bd6d7a9d3be1a104","url":"build/js/SafeTransition-DTYyzu_o.js"},{"revision":"cb6f526795f9719292cbdc653c8fa7a2","url":"build/js/RiskTestPanel--im3KetN.js"},{"revision":"598697d5e8a94bf5a36339ce215857d1","url":"build/js/RewardSummary-DB8d1sRx.js"},{"revision":"418f63dd60b16f6773eb6d153257f63f","url":"build/js/RewardPreview-DCPe5zUe.js"},{"revision":"bce9451d27a697956452520c2ab65ffe","url":"build/js/RewardMedia-C-rcK-u5.js"},{"revision":"15910be2fa94b7edd19d5509897a57c7","url":"build/js/RewardHint-BRWZ1TAS.js"},{"revision":"90acdebd78e061a1e138a3c0a3fcf1d9","url":"build/js/RewardEditor-BhLbxlt7.js"},{"revision":"cfdf48f5c89b0887d516b1755d9217b9","url":"build/js/RewardBlock-nS4rwEFb.js"},{"revision":"431b17cb3f3093dd444da7acac5c39b8","url":"build/js/ReviewHolds-Bp9ChV94.js"},{"revision":"874bf8cbd0a8092eaede6affe80aa5a0","url":"build/js/Reveal3D-BRiizLVH.js"},{"revision":"752b133ab1795dcdb9b909350ebb5d27","url":"build/js/ReturnPolicy-CE50jgNJ.js"},{"revision":"68af970d0b1be8916c0fb8d0fdea6043","url":"build/js/ResultsGrid-D95TsWJX.js"},{"revision":"6a9cf2efa9c3d0b17f253958a143fcb7","url":"build/js/ResetPassword-wG_Rt9L5.js"},{"revision":"b3d0d78325ffa86609be0078027f710d","url":"build/js/ReportContentModal-Bfr1Mv-w.js"},{"revision":"facabe1856f20a357e1e56fd0ba5b24e","url":"build/js/RemovePost-CF-LCXwt.js"},{"revision":"93707871a3db58a2e7e6b434142f8788","url":"build/js/RemoveMembership-CP4qVN4Q.js"},{"revision":"9da9e1f6056859c8a9eb4a36f1e1bed6","url":"build/js/RemoveBill-f5yLZIZ-.js"},{"revision":"8006342b3a16205e15931e6b882266a9","url":"build/js/Register-BNST1FGQ.js"},{"revision":"37a9cce62269d068287dd9f813468b00","url":"build/js/ReferralBanner-DPqRVlBF.js"},{"revision":"57fd314546706e5a4fa4e435cf837f17","url":"build/js/ReferEarnAnnouncement-XD4P8QqG.js"},{"revision":"da07a3667ade83e3ce41d34643350246","url":"build/js/ReferAndEarn-D-3azA9D.js"},{"revision":"cd58ec28a5ab141d3b7bb26a399b5f4e","url":"build/js/Redirecting-C2v_8G0d.js"},{"revision":"931f5a9d7bda6e5dbc584664cac198b1","url":"build/js/RecentSupporters-BRdVNG9h.js"},{"revision":"576f40abdce1e55f4cecfb373efe8105","url":"build/js/ReactionsAndReply-BOe1p019.js"},{"revision":"8661481f8be395b270a8dfbc8a1f15a8","url":"build/js/RankRow-BGF9BxHl.js"},{"revision":"92a8680524887055e055c17d764d6f77","url":"build/js/PwaTest-DIIHDNh2.js"},{"revision":"a3929608bdedd696fbaf91f7d62a2258","url":"build/js/PurchasesHub-Zwmdm7-m.js"},{"revision":"ce9dc306004e30e25d407b75ad86b203","url":"build/js/Promotions-CGKxwkQb.js"},{"revision":"8485457c119f88c9228e14fe737082a7","url":"build/js/ProfileTaskLists-CifwNuzp.js"},{"revision":"5163ca2564b008c9c135b013a4e79cb9","url":"build/js/ProfileTask-DzVc5jqo.js"},{"revision":"29c900adbddfd4bbe92a1f7bb5df7d0f","url":"build/js/ProfileSteps-mYMdwTEN.js"},{"revision":"4a1d60ad99d47c92e4f82a129c85c600","url":"build/js/ProfileProductLists-Bp7mZ_2M.js"},{"revision":"8d22b33c2c734ef222d3044db4966976","url":"build/js/ProfileProduct-qtThWLfu.js"},{"revision":"a34582140a27067a1bf3448652723e92","url":"build/js/ProfileProduct-Frh8pDIJ.js"},{"revision":"eb820a5c73ffff76914733e852a17f18","url":"build/js/PrimaryButton-BQJHC2kU.js"},{"revision":"93a907a20dae1eb8c02b193ef39ae6bd","url":"build/js/PriceFormat-DBBPViYe.js"},{"revision":"6a642b4c51b2258bda9de8fb3b25e61a","url":"build/js/PostLike-DVFidLHg.js"},{"revision":"ff644051fea91c060e62349b1014ab59","url":"build/js/PostDetail-BhoG-4Hg.js"},{"revision":"245acfcf2eeff349bbf338ca539277fa","url":"build/js/Post-D-bMwq_I.js"},{"revision":"bb9890f9742be28e99643fc47a546f25","url":"build/js/Popup-y8d2SUyb.js"},{"revision":"f9504ceec6ef80efb049a3794db29a49","url":"build/js/PolicyNotifications-BR6FnfTd.js"},{"revision":"9d0a7d2cb89336ca109ab658debb6e33","url":"build/js/Podium-DR1URiUf.js"},{"revision":"4ea403809e7eff7d3b6f9d5569ef2570","url":"build/js/PlatformAnalytics-Bero76PE.js"},{"revision":"851dac5486c55443c5203a89dc4c18f5","url":"build/js/PiggyPotsGrid-CXoZZhXB.js"},{"revision":"60414442325a4ed39925fe6cc5c70291","url":"build/js/PiggyPotWidget-2ESIPP6l.js"},{"revision":"8311bee6a7766225f241b141ecd64d05","url":"build/js/PiggyPotSocialProof-C71gORWn.js"},{"revision":"efe915cefa0a519aa32c2749b0452baa","url":"build/js/PaymentsPolicy-D6ZNXlHP.js"},{"revision":"b05ba60e6f512b428873a6d58a1163ca","url":"build/js/PaymentSlider-roFR3Hx4.js"},{"revision":"5d8bde72006e8afaf458f7b5d9efa21d","url":"build/js/PaymentMethodSelector-DGGqnBGx.js"},{"revision":"8731fec8fb117f20fc2b981055374783","url":"build/js/PaymentDashboard-DIpGqpD4.js"},{"revision":"60b85ec604e5e3f4a26a91fef578a958","url":"build/js/PayByBankAnnouncement-B_cx5_Lp.js"},{"revision":"647accba9ac203c7e45fe73a085ad0ed","url":"build/js/Parallax-B1fS4Wap.js"},{"revision":"642c3df6e9019b7a8c0baf2d61e9636e","url":"build/js/PaidTasksTerms-D1APusyg.js"},{"revision":"bf4066f45404d2ff129bfc6ef7cc808b","url":"build/js/PaidTasksAnnouncement-C0mAOs85.js"},{"revision":"fd0e59115554fa06dd224bf07503ba88","url":"build/js/PaidTask-DD4i88U3.js"},{"revision":"6a998354824af1763a1ab6544dcff9a1","url":"build/js/OrdersLists-USwCrqtR.js"},{"revision":"1a115dceb9a46e087055154dd7aae8e2","url":"build/js/OrderDetail-B52psWGY.js"},{"revision":"b7b1a78ce5e9ed08ae377e49cab5deb8","url":"build/js/Order-C07ChrOc.js"},{"revision":"c6741fdf79d77f722d836265a3f90bfc","url":"build/js/Opportunities-Duckj63-.js"},{"revision":"fa975c0ef130582ae562a0fc059909ce","url":"build/js/OnboardingNudge-WDzMyyg6.js"},{"revision":"f75c78ba6038082faa6f24ac705b2759","url":"build/js/OldSubscribe-BD5a56ks.js"},{"revision":"fe255b4ce193d36ec47aedd19438d58e","url":"build/js/OfferAnnouncement-WugSVSbZ.js"},{"revision":"fa7e2c69e7642f06c359febb0b72753b","url":"build/js/NotFound-BDwOiQXx.js"},{"revision":"8a2e99093d195187a813fc113d9bcf5c","url":"build/js/NotForBusiness-sx5eQDNi.js"},{"revision":"569a385407185c52a49733f767b1899e","url":"build/js/Nocontent-D-xxjgfa.js"},{"revision":"2257e0dd73cf96261e05d6562f6dc7f9","url":"build/js/MySubscriptions-CPxLBVNY.js"},{"revision":"cabad6a42a21090b3d1aa8ce90396627","url":"build/js/MyShopProducts-DMr5FuyO.js"},{"revision":"c03dcf010228fdbd38d20339bb8961ff","url":"build/js/MyGoal-CJj3HYS2.js"},{"revision":"f3d9ae1d213d7c47ab5ad2b75255c32d","url":"build/js/MovementChip-D6YAMHXr.js"},{"revision":"cce821549c3db80b5d87a02ebf8dce57","url":"build/js/MorConsent-C61jiR9t.js"},{"revision":"ad138902e0aecf161cc1368c58e286d2","url":"build/js/MorAgreement-t-rWwGaK.js"},{"revision":"16abb6a89b1fe39f9fd8b89a82078271","url":"build/js/MonthlyRevenue-Dj2NILw_.js"},{"revision":"1d8850fca5945eddc6a6cc850d023d70","url":"build/js/Modal-DXTm33Om.js"},{"revision":"2504926efbbd138b9c7f988ee95b2b4d","url":"build/js/MembershipsLists-Dgo2zHMZ.js"},{"revision":"6fa981e367d641dcaee00f9933d125d5","url":"build/js/Membership_dashboard-B95kgCXa.js"},{"revision":"1ab0d3de18a6cf35fb5c5c565aede49f","url":"build/js/MembershipDetails-DBwyJGUX.js"},{"revision":"0dbe972c05fe98f035cc81d81400de36","url":"build/js/Membership-SY9Uh04E.js"},{"revision":"7e5cc3be9a2340b59401848fdf0c7d71","url":"build/js/Membership-CJ4NYVyI.js"},{"revision":"e385f1d93bf139e05a739e87e62bb63e","url":"build/js/MemberCheckout-CwsLYw96.js"},{"revision":"9829ad2242a9ad1b78f33a8d453aacde","url":"build/js/ManagePasskey-ORjj5njU.js"},{"revision":"03eb2c3a9772c17cce9e2497382229f4","url":"build/js/Magnetic-wOjKDDLO.js"},{"revision":"a574d4a1a73aced65a11c11d28b8534f","url":"build/js/MagicBellNotification-DYyPBbZO.js"},{"revision":"16036ccffedda807deccbe6e0ba33f36","url":"build/js/Login-BypZORii.js"},{"revision":"067b816937f0ccdaf4c08c3f98c9e3fa","url":"build/js/LoadingScreen-BP8ZdN5z.js"},{"revision":"0ba2f8de113b46c6167f8aa331a073eb","url":"build/js/LoaderButton-B4QlPnkz.js"},{"revision":"a98a5f175e54c56e842225085d372623","url":"build/js/LiveBarSection-BOvJLaDG.js"},{"revision":"2929da97835eee8b866a98419aacc66e","url":"build/js/LiveBar-KFV1L8D4.js"},{"revision":"579446f0c2f0a9f61479cde04a07613a","url":"build/js/Lists-FQBgBpP0.js"},{"revision":"e53dfca4da0f6fc8d25bc8cba99517bc","url":"build/js/LinkTwitter-BWEzAmic.js"},{"revision":"26c3a435109ac999f53729895ca4b93d","url":"build/js/LegalLayout-DM38WMjW.js"},{"revision":"7619c0205009083332c5c7ccf6f8bc81","url":"build/js/LeaderboardStars-CJZru94M.js"},{"revision":"57bdf757263198c09a9bccce27e72966","url":"build/js/LazyVideo-ity5ZPiH.js"},{"revision":"1f5332b49cec5b54d21a47c268f441e7","url":"build/js/Keep100-CFZPboTN.js"},{"revision":"97666dd2557f37ccedc525a6676ec547","url":"build/js/JoinUs-DF51cwdV.js"},{"revision":"a5b774d219586c42d16f21275f8f8def","url":"build/js/ItemBadges-C3Y6EzSR.js"},{"revision":"3ff9cf3908ea0efbbf1bc76f8cc67039","url":"build/js/Item-CmFkyjJY.js"},{"revision":"2f91a940078fbb5bf2d08370fa87feac","url":"build/js/Invite-BeoYFwMw.js"},{"revision":"159c918aff7aca7a1056f861bf7c5b78","url":"build/js/IntrosVideos-YxbZWcIK.js"},{"revision":"7c6d6fa2edeb4dd7be82968e67a9a5a0","url":"build/js/IntercomProvider-BXQWimB5.js"},{"revision":"3cecba084e840ef4de95cf15ef9a2c2a","url":"build/js/IntercomDebug-D_SQhdb9.js"},{"revision":"c73f7936fc41f600c4680ca3e25870ee","url":"build/js/InputLabel-CNJ_SYL6.js"},{"revision":"2b2bc150d0b90a99397b80bc3d0c8522","url":"build/js/InputError-C5zVb61Z.js"},{"revision":"ae383bbe5350d1c15ab8ab1e39c15e66","url":"build/js/Index-mQtXD0Zf.js"},{"revision":"8fe6074bf557a2f44d2ea70a93ef865a","url":"build/js/Index-fXZuYjVk.js"},{"revision":"c3ae12580fc01db36f916b503a505198","url":"build/js/Index-H8sveGTZ.js"},{"revision":"6d2ac73e64fa3412de2cd489d44948ec","url":"build/js/Index-GoJGCnno.js"},{"revision":"a427e55bb14fa44f536676c4505c5b5a","url":"build/js/Index-DWFSDQDq.js"},{"revision":"58f9f7d762f353019f03f30b098074e5","url":"build/js/Index-DGmf7HDA.js"},{"revision":"4a1d3044733103849f6fb9498171f428","url":"build/js/Index-D2HBCMm_.js"},{"revision":"c9b76ddf1e422cb86ad7340b833b7d6d","url":"build/js/Index-CI5mas_T.js"},{"revision":"4483d942434ec23cb2c43eacee841736","url":"build/js/Index-Br4mievr.js"},{"revision":"b6ac71bfc37e31d8bf6bcf637496bd8c","url":"build/js/Index-AV0ofpBG.js"},{"revision":"b81e595022d3c684d0234b64de7abf9f","url":"build/js/Icons-C7MIsDOx.js"},{"revision":"f6b6895fccdbacacc6efe7f1e54e7d2a","url":"build/js/Hub-C9fMVdQi.js"},{"revision":"b89dcc02952393ac3398d1781315d64a","url":"build/js/HowSpennyPiggyWorks-BHYfDiB6.js"},{"revision":"6d22995dfbf7799768517384fcf4dd89","url":"build/js/History-DIFXSOtr.js"},{"revision":"dcaa5a74f3804ac851c05ff1b5fa5a73","url":"build/js/Hero-CxpwgMmG.js"},{"revision":"6637e5a65ef59832645b9d8ed7bebc0b","url":"build/js/Header-DKKjWA1d.js"},{"revision":"f205cf598e7cd0fa6e4cc9f189505eb4","url":"build/js/HappyCreators-C6TPn3-Z.js"},{"revision":"50f0ae7a34450f003fbd4a733ada20df","url":"build/js/GuestLayout-BRuj9iTH.js"},{"revision":"8828dc650411a9fb94d66063938a63ba","url":"build/js/GrowthTrends-C_vu-wyX.js"},{"revision":"67f5b07f0e8f70223614303d48afdd4e","url":"build/js/GifterPurchasesTab-D68BeMmY.js"},{"revision":"595f70a4a51a256d69a058a8dea408dd","url":"build/js/GifterFeed-CdczIW8g.js"},{"revision":"47a42ce6c0e6a8bf6ff5946c7b8440de","url":"build/js/GifterCardVerification-B1hTxhCC.js"},{"revision":"b19cb10bccfc29f50585c8493acaae72","url":"build/js/Gifter-BtSE1O-j.js"},{"revision":"cc321eda0906bc8e59ce7eda5345eaa3","url":"build/js/GiftStore-CTBV3Q7C.js"},{"revision":"bf404707aafea79b02eeda68e301d0bd","url":"build/js/GiftListing-DapjUjRm.js"},{"revision":"8d60c83f8b213e992be718daef0e558b","url":"build/js/GiftEdit-CKma66Zg.js"},{"revision":"a6cf951bbda2d853515d561d7dd795f0","url":"build/js/GiftAddCart-BuveyTcM.js"},{"revision":"0f18b7211180012fdf26866a7f800228","url":"build/js/GetCart-D3y6vkjZ.js"},{"revision":"29d16c749073ec45c8865079f8d951a0","url":"build/js/FunPart-CXZJpyOL.js"},{"revision":"fec2c88b3bbe9326f6892d5c130bf33d","url":"build/js/FounderProgressTracker-By_D_h79.js"},{"revision":"2ac9ef93a7ba1c0fdb33b2b8dc8bed4c","url":"build/js/FounderProgramAnnouncement-BfCc7E_n.js"},{"revision":"e964aebbaf2b7935ed84146fc2f34832","url":"build/js/FounderBonus-Bp5NyN8n.js"},{"revision":"5dca029146e46f7f150c0622a4223c6e","url":"build/js/FounderBadge-CPy9Wp1z.js"},{"revision":"0df36d6d0522a415dcbf5027595f94b1","url":"build/js/FormKit-B72OrWY1.js"},{"revision":"747d7a1c5e53f6f5e19b6395518aa72c","url":"build/js/ForgotPassword-l0N6c9Iq.js"},{"revision":"d66b2f0434f81edd704110c13537ca75","url":"build/js/ForCreators-CniBmS6s.js"},{"revision":"56b1d5c5a3d29422d9132381a866e3e0","url":"build/js/Footer-I4j8DPhL.js"},{"revision":"d4b5685b2eeaea5b5b39273d1c11773f","url":"build/js/FollowButton-DZ8uyIx4.js"},{"revision":"b3f3d7206fcf48d5fa3f1e3a8a71af8a","url":"build/js/FeedList-BS6-sel1.js"},{"revision":"f5ca75d7e03b457f3fbf0b1c016c157a","url":"build/js/Features-DdDRV3uV.js"},{"revision":"b1264d35fcd72c3bc1a66fb1f4ff42bf","url":"build/js/FeaturedCarousel-CQIwRz2D.js"},{"revision":"ec3a88550264a9e84265d633b888be5c","url":"build/js/FeatureSuggestions-CmKP2HoM.js"},{"revision":"79393f3cb1d1752e97d0b85582f65aa8","url":"build/js/FeatureSuggestionSection-BK3_m1yB.js"},{"revision":"f8ffcd03583ee636ecc4839ca80ce791","url":"build/js/FeatureSuggestionModal-CFe3xEpK.js"},{"revision":"a414bc3be5e61976dd9da4cc34956654","url":"build/js/FeatureSuggestionBanner-iOBoZEAN.js"},{"revision":"160b59f6488cd74b3ec0d61450e6aca6","url":"build/js/FeatureShowcase-DQUessRg.js"},{"revision":"62941061317064e74be8fbc377ec5751","url":"build/js/FastStartBonusTerms-DG9llHrN.js"},{"revision":"aba879475b62ef2fe6b4c1c610954042","url":"build/js/FastStartBonus-PproLjxJ.js"},{"revision":"d952b6ee0397d713d4d9ca1d4d9a43cf","url":"build/js/FadeIn-DwI_UXSk.js"},{"revision":"fae56572e7a38408b6a99c2dbe217ed8","url":"build/js/FAQ-Csen7rZB.js"},{"revision":"f79693f735e5799c7c41861efbee8b20","url":"build/js/Expenses-DN-g3XWz.js"},{"revision":"53ebb05020372375a0c03fc7b0e1cd18","url":"build/js/ErrorPage-BZyxpBax.js"},{"revision":"8810d1d599cd72fffee89a5b65db8296","url":"build/js/ErrorBoundary-YMSkhw_m.js"},{"revision":"512d280aa078f462ca2616e60686dc70","url":"build/js/EnterOTP-Bk-oq1yw.js"},{"revision":"963a8dffbe3a5d1aca990e83c0c89980","url":"build/js/EnableCardCapabilities-B1Guz8ed.js"},{"revision":"4df2b6964dde386930f1845d7235f1d9","url":"build/js/EditProfile-B7EFFjcx.js"},{"revision":"901e4cce4f5ce1a8b81bbc286c560ac1","url":"build/js/EditMembership-DSZFtqMP.js"},{"revision":"ba76e33132a4272e03128731809a8ef6","url":"build/js/EditCategories-CRp_vyWl.js"},{"revision":"527d1c6f0165a39dc6a97ddf97b99891","url":"build/js/Edit-CgCe4BHK.js"},{"revision":"b4d9ed293727b19ad0cbe715b09c8e04","url":"build/js/Edit-BIywLTyy.js"},{"revision":"dc3020ac0d835bdf72b0ad8de914d208","url":"build/js/Earnings-BY8VDG4h.js"},{"revision":"4b61c5e9854d9221ee40bf88b8aecc41","url":"build/js/EarnMoreAnnouncement-kd6wuMa9.js"},{"revision":"549de044ba0bd7f1e1836a9df1cba54a","url":"build/js/Disputes-oPd46Llh.js"},{"revision":"9aaefed7edfc894e425051d520dadd3f","url":"build/js/DiscoverHero-B0wEnjEt.js"},{"revision":"85c622ebf0621b0858ada96e14ec1f56","url":"build/js/Discover-D5pYtDGu.js"},{"revision":"6eadc2b3ecd9e7a62fad59a96d89c333","url":"build/js/DeleteUserForm-fyAj_B8T.js"},{"revision":"0d031249b38c7f4638db7cf19992fa6f","url":"build/js/DeleteStripeAccount-ByQ5LzEf.js"},{"revision":"950f79d839e27de9d077c68853d3679a","url":"build/js/Dashboard-D2KJ5boM.js"},{"revision":"b2024d4131add0d495be5649c581e96c","url":"build/js/Dashboard-Cf7MK8po.js"},{"revision":"8a3d59f8215eb41d92f244f8faea9a9b","url":"build/js/Dashboard-B6N0BT5a.js"},{"revision":"a854be25abc5a987e4e8e188aed69a8d","url":"build/js/CreatorVerification-BhAH8hnV.js"},{"revision":"d9a557ec6976fcac50d9e4aec9dee9c2","url":"build/js/CreatorSupporterContract-DCVTg6vo.js"},{"revision":"0681240e49b60236668b4a4129cc979e","url":"build/js/CreatorShowcase-DbJ6g884.js"},{"revision":"b6596c59dc35640ebcd37ca8fa9d1905","url":"build/js/CreatorRiskBanner-DZlXAaPt.js"},{"revision":"0e1a5ddc7e7f14d757bdad3b8b2d58d6","url":"build/js/CreatorGuideLinks-DPLtyI35.js"},{"revision":"c4409f99feba65af9482722b5f702f4d","url":"build/js/CreatorCard-Dlc851zy.js"},{"revision":"95e3ab2f45c703ef782a7dda2903b49c","url":"build/js/CreatorAgreement-BGC98KU_.js"},{"revision":"45cddfb2789ed2c0dc689d9091722e83","url":"build/js/CreatorActivityWidget-CCReDuhD.js"},{"revision":"9e30c8986428594cdcd3300688355b59","url":"build/js/Create-DTidSAQi.js"},{"revision":"4ef7a25473aa6ee0ec113b3f55b19233","url":"build/js/Create-DFvaWkRP.js"},{"revision":"7b6d8cdc1eb3482f1ec799c950e0f846","url":"build/js/CoverIdentity-C81x5RBx.js"},{"revision":"3b922adeeb80ba4bfcb247befb8949f4","url":"build/js/Countries-DOoUL_Fl.js"},{"revision":"0678e70449bd049fabae8bd02bb200e6","url":"build/js/CopyrightPolicy-QkP2qGvH.js"},{"revision":"0cf3a047bcc76f1443f6e2ccdfab36f6","url":"build/js/ContentPaymentFramework-Dp_g55x4.js"},{"revision":"9026c65c73260d3aebcf5fa5095d998b","url":"build/js/ConfirmPassword-vTQgCpFl.js"},{"revision":"06ee5e827d2373a168da22ee3cdb6068","url":"build/js/ConfirmDestructive-BpGW-ldY.js"},{"revision":"c5fa16758545b8b6a91b42506fa975e8","url":"build/js/CommetsLists-C2pS6eiE.js"},{"revision":"1716dbb54d958ad5496c644771649f11","url":"build/js/Comment-BXZXY4tR.js"},{"revision":"ef6fd7dc47caac449678bef2e1a3384b","url":"build/js/ComingNext-Ct5L7L2I.js"},{"revision":"94b6896726b9c68a4186e34f92e2ffc4","url":"build/js/Cinematic-BUAZ80Sx.js"},{"revision":"85c58a2730935a0f791a360a84be4c2d","url":"build/js/CheckoutLegalTerms-C1m_z5Dl.js"},{"revision":"2872aaab04fc83565892a8480baf7bd8","url":"build/js/ChangeVat-D6ULje_E.js"},{"revision":"27026e95a89fb3683fc4970c6f5de81b","url":"build/js/ChangeCurrency-Q4QoCYLV.js"},{"revision":"fadc55eba45cba063e48d9414111112a","url":"build/js/Certificate-DXikYHAN.js"},{"revision":"836577129f828d9c52995a8f2ac3c923","url":"build/js/CategoryLeaders-CvNqRCNK.js"},{"revision":"648c9d17de4f7b3177289ca93c8fc831","url":"build/js/CartListing-C_7voavi.js"},{"revision":"b738100febb685da973050404319fcad","url":"build/js/CartItems-DAxc9X9r.js"},{"revision":"88704b1efa052da55c860063a99dd5f2","url":"build/js/CartItem-BuqDnfNy.js"},{"revision":"b365935be2ae1ebe3e473d00c186149a","url":"build/js/Cart-B8LT26uC.js"},{"revision":"b819febd356256250cedb0f2a0aed8e7","url":"build/js/BuyShopItem-Def9IPkN.js"},{"revision":"33f6c270ec5df6413be45e682404ce05","url":"build/js/BoardSkeleton-CXsw6-wd.js"},{"revision":"4a5e5cfdd473c8bb4fa0d8e4398c8e32","url":"build/js/Board-9IXX8-Kj.js"},{"revision":"8922054256124738d9d6a0e661692ac9","url":"build/js/BlockedUsers-Bh4fGDHD.js"},{"revision":"fef2b76ee1b88177aabad2e567c63440","url":"build/js/Billslist-Ckiw1LvB.js"},{"revision":"b60d189b9d23cbdda0b26313c54189d7","url":"build/js/Billing_dashboard-ANSPuueB.js"},{"revision":"4a77fba03eda2e692a9bc488b49fdb49","url":"build/js/BillDetails-yGLR6e91.js"},{"revision":"c4c0ef7572c434c6beac10c54eb2fde4","url":"build/js/BillCheckout-s58o82fU.js"},{"revision":"fcffb6e7a721e57bb75d6682ccd69a24","url":"build/js/Bill-CBob8vqW.js"},{"revision":"6b98985ac0b25e491cea0bd7af2c951f","url":"build/js/Avatar-vMs5n2Px.js"},{"revision":"5d14baa5028c0728255f1e82b1ceed72","url":"build/js/Avatar-BPBiEOZZ.js"},{"revision":"a3ca7e74d0c9f47addd0e4874d9bb715","url":"build/js/AuthenticatedLayout-BdfMSiRQ.js"},{"revision":"03091f59976f6203fd6ba443c62f0231","url":"build/js/Analytics-B_CtyGJ8.js"},{"revision":"1204df1256e627bc6e04b54433c17f50","url":"build/js/AllMembershipPayments-DzoS5cKP.js"},{"revision":"753dabef7c9824a837f6a1a5f2f86fd5","url":"build/js/AllCountries-B7ACVxFQ.js"},{"revision":"8d446d95098658c13ae1341ef06ce4e5","url":"build/js/Alerts-B8aQOL5k.js"},{"revision":"f7b304c3969ca755a3dd93d90cdea728","url":"build/js/AddressForm-D66Jahju.js"},{"revision":"ad21b72ebdfbfc1283aaa23db7a0057d","url":"build/js/AddShop-CUotQ-yE.js"},{"revision":"e617497ce19551abbe82c68fe31f1e4f","url":"build/js/AddPost-CIufHLzN.js"},{"revision":"023d3f6404ba8b28f218acc3ee21a618","url":"build/js/AddMoreTile-CHLehbAF.js"},{"revision":"f65f30265f5066e03bb46b55c31ab860","url":"build/js/AddMembership-CtFmWOvd.js"},{"revision":"8dc20656fcdfdb928d3c9eee161fabd5","url":"build/js/AddItem-CgQe1nWH.js"},{"revision":"48b73a64d34f3c2bd34b6c9c9327dd03","url":"build/js/AddIntro-BjISiSLT.js"},{"revision":"efa925166a2023811596b86f87bc2854","url":"build/js/AddGift-CUC2hzdA.js"},{"revision":"d593af07986c3de4dbdcbcc77fd888ea","url":"build/js/AddComment-BVewZxI6.js"},{"revision":"1c094b0779955855da380f15f597cc7c","url":"build/js/AddCart-DtxXVVGx.js"},{"revision":"8103942474408a5f2927a9b178e17977","url":"build/js/AddBills-DqpK8Qds.js"},{"revision":"5407a95550fd4b3765ef97968436c2fc","url":"build/js/ActivityStatus-2dZrZGLY.js"},{"revision":"9db5a8ecbcfe42c8b46072f83f1e4676","url":"build/js/ActivityLogs-CrMaPEM2.js"},{"revision":"e90d263fe1a2b55f47247eb344540b08","url":"build/js/ActivateSubscription-DGxNjmho.js"},{"revision":"c55296cd5a47c4a2966d93b8d221702d","url":"build/js/ActivateCard-CY7T3dsS.js"},{"revision":"c929cfdcb2c370bd71a00e354854ef62","url":"build/js/ActionRequired-FP7Ez3A9.js"},{"revision":"81f5fe90e366abd983b681faff3eb603","url":"build/js/Accountsetting-QWcBPSvW.js"},{"revision":"30ec187c52111d6c04b23a977c2afc78","url":"build/js/404-BHL9_q5v.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"b25664330b12c815ce97dc0374e7e259","url":"build/images/wishlistbannerimg-DknpQwC_.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"d664b27cca7eaf4d64c41622b5bb9b6c","url":"build/images/user-DLV4cRY7.jpg"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"a94faa1a93034ed70c0024dbb3fc1120","url":"build/css/uploader-BqAXSLBe.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"59f64916d28441ff3708d6f6a9a88e6b","url":"build/css/retro-bottombar-CD1n0nll.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"638404f33a5ac9c53095986a433ae7a1","url":"build/css/app-ffV0fCpE.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
      const { matchPrecache } = workbox.precaching;
      return (await matchPrecache('/offline.html')) || caches.match('/offline.html');
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
