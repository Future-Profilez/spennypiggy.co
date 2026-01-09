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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"c059b8a12d5247009087a73233cbb2de","url":"build/js/vendor-react-C60XgNHN.js"},{"revision":"eea29632ba3c39311b364b374d27ab05","url":"build/js/vendor-other-C4pR23k0.js"},{"revision":"946721af7b962d74858b2cfa99df0acc","url":"build/js/vendor-inertia-BhbEgEiK.js"},{"revision":"6950754c095ff96c4020408bfd3a6607","url":"build/js/useDispatch-CjYGhdvY.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"d11d0bc0aadb20d4c50aa5c8af695093","url":"build/js/swiper-react-C-5C1CGt.js"},{"revision":"e21e1523dff1df7cde76e2c8cc30e2d7","url":"build/js/sortable.esm-B5IUgTRP.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"c93e2f0848a87c7100507dd0acb289ea","url":"build/js/react-select.esm-Dn1U8p_e.js"},{"revision":"7c76b54af32ee7d37635f3e18fd9ccc3","url":"build/js/pagination-BnsOWde9.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"b63d1c085c65d5bf8f97941d1faddaed","url":"build/js/navigation-DxdwecrF.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"f0cc89b185cf1701c020ccc597bcebe1","url":"build/js/index-wH1kB1b_.js"},{"revision":"676429efd91ec9f511f8c1aadcc3c976","url":"build/js/index-w0NXz-4S.js"},{"revision":"26763e623d86f40be11854edd2859408","url":"build/js/index-EJQCIokv.js"},{"revision":"48c197285b0625e49033b6265eb4ece4","url":"build/js/index-DyhfPNYj.js"},{"revision":"1ac43161abeea249207784030c3a17b4","url":"build/js/index-Do7SHfmK.js"},{"revision":"c681e5e77e895df14ae2be357bf3588e","url":"build/js/index-Dg2Qvn82.js"},{"revision":"a9f882394d608a4216624a83034c166a","url":"build/js/index-DeH1vgEF.js"},{"revision":"c2e57f02eb6312464d7edddc4edef702","url":"build/js/index-D_tjseIC.js"},{"revision":"bf250148b672394ee29d8c4abb12cf74","url":"build/js/index-DP0tYvs5.js"},{"revision":"4a4d032bf9a41de6a18b78a69d135270","url":"build/js/index-CBSodwdW.js"},{"revision":"26c6a09a1d4a8a476acbb5abf1a07a68","url":"build/js/index-CBQo8Z3F.js"},{"revision":"17cc8d77cf2640ea59ec1c65db245232","url":"build/js/index-C00pync8.js"},{"revision":"969e4656a6fad65e1bbfdd78c7028921","url":"build/js/index-Bstqvo_x.js"},{"revision":"f7ee3f26823d032830784612642d5c59","url":"build/js/index-BcuxTZRM.js"},{"revision":"d8571b09ae7f9e8d6b3e3781a35d6fbe","url":"build/js/index-Bbr2ptb_.js"},{"revision":"3c57f4e831b040631caac5d949d11d9f","url":"build/js/index-BKzHUjJc.js"},{"revision":"7ae15b7f11ac8c3d5574750006f1407d","url":"build/js/index-3XOv31ez.js"},{"revision":"7309679bea326293efda7ec10cf6854d","url":"build/js/iconBase-DtMan6Je.js"},{"revision":"3feea703b623d478b652405308871f9e","url":"build/js/floating-ui.dom-CgymtSOC.js"},{"revision":"668af3cb2b9cce8b68bfb358d53766d5","url":"build/js/debounce-7DU0SwaZ.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4df4e6dabe655ecd404630e81f9f8526","url":"build/js/app-Bgx6Ovaw.js"},{"revision":"918e32bc8ec2c23fd126654b8ba4f55f","url":"build/js/Works-B_OJyZLu.js"},{"revision":"1f2f80cd1306f71c08ca4cdbe6345651","url":"build/js/Wishtracker-ChCV9aU-.js"},{"revision":"0ba6828e4d027d4708a9d3a26ddb85f5","url":"build/js/Wishlistbox-Djd-3WXY.js"},{"revision":"6a1ce78aa605910f88d5af5521099f3a","url":"build/js/WishlistGrid-K-jE3f9Q.js"},{"revision":"29588ec0667cd7823f1784fa14342f04","url":"build/js/Wishlist-xIWVen68.js"},{"revision":"1ea3029fb5ac6cb33875589db2eaa0e2","url":"build/js/WhyLove-v0HgC3QG.js"},{"revision":"19c3e13bde5d6ca71a023d208ca680ca","url":"build/js/Welcome-p1nlmW2J.js"},{"revision":"2f97b4451204edcc5906e8bfe58e751d","url":"build/js/VipSupporters-Bo7JR1iP.js"},{"revision":"5ef2d9315e46cfef8a1af1db85737a23","url":"build/js/VersionUpdate-CrAbLkI6.js"},{"revision":"7d2caa9a3d846e67713e5120251fe19e","url":"build/js/VerifyEmail-Da5DYh7W.js"},{"revision":"4e576ccd8f6f5217f99ea64f3e9260e6","url":"build/js/Userprofile-BjZXbS7S.js"},{"revision":"b9277d2bd09e411fad9866ee0e72be24","url":"build/js/UserCarts-S6fGF-m2.js"},{"revision":"62b39b90f29e041b6a1006ca75c349c7","url":"build/js/Uploader-DVilqvrj.js"},{"revision":"a1fa534c4a80b6b9907955fc554ae917","url":"build/js/UploadcareEditor-CBVsy3m4.js"},{"revision":"4bd332c592ba576d58f15d688a9b9157","url":"build/js/UpgradeStripeAccount-BxyU0qpB.js"},{"revision":"23e45964543047670f915ea1d2714ee8","url":"build/js/UpdateProfileInformationForm-CWsc0JJ9.js"},{"revision":"f94725f58bc1c86ddf69dabb71bae692","url":"build/js/UpdatePasswordForm-AFgHlUkB.js"},{"revision":"ff098abd6a2955d2aef0e88333021fc7","url":"build/js/UpdateAvatar-CqQA5LVB.js"},{"revision":"53f206191517418b0d2a37fe73092a1c","url":"build/js/USTERMS-b_PFd2lJ.js"},{"revision":"7df00e54a2873ff1bff795b27025adf8","url":"build/js/TweetNow-BHopWllh.js"},{"revision":"fba91fca4e36bcefcb450eb2a56b81b1","url":"build/js/Turnstile-Ce6CQUow.js"},{"revision":"2d90d1f90884451cf8a2dc5c741f5012","url":"build/js/TrustBox-B1j_8ZgY.js"},{"revision":"2fd75f72be3843ce92868c2db3078672","url":"build/js/TrendingCreators-DED8jJaW.js"},{"revision":"b436b2b12b3e1017539dd52fa4282a97","url":"build/js/TopSupporters-GC5GqnKW.js"},{"revision":"b44a3e60879c919e7eacb1f511930dfa","url":"build/js/TopSupporters-Bk6QXjhB.js"},{"revision":"a9543a9e8ab7586413eeef0a8c45ff84","url":"build/js/TopEarners-opM2SXWW.js"},{"revision":"8f8b2b35920d3dd11c0c493d9a2a586f","url":"build/js/TopEarnWishes-Cp_ku0xv.js"},{"revision":"ce1c6218bc48f29434d70c26e4c35b0d","url":"build/js/TopEarnBills-DI8OahT-.js"},{"revision":"9f6dc605f5671164fc49d7a33eafa834","url":"build/js/TopBar-BKg5drrb.js"},{"revision":"b5dc7af4994e32132576c8854c2dfd79","url":"build/js/Tiplisting-DcL3HNhs.js"},{"revision":"69ebdc9c77b048d3377431dda1348fc9","url":"build/js/TipTracker-OfZS1mnx.js"},{"revision":"98b50241dd15efade1a271b2d4eb86b7","url":"build/js/TipInner-CSBeSRNM.js"},{"revision":"3942504740d22237979e13ae84479f16","url":"build/js/TimeFormat-CvpYF908.js"},{"revision":"c7ec88114700c36922fcfc0202a0ea11","url":"build/js/ThankyouMessages-CDgdYltI.js"},{"revision":"ad12f6828c7708fe742fc77a4c463b51","url":"build/js/Thankyou-B-jQthTz.js"},{"revision":"ad18f4a88ba7c99d1a03b3105199a4b7","url":"build/js/ThankYouRye-C723lVFr.js"},{"revision":"6ed18b1933581e3299a5bd732eb8f4ef","url":"build/js/TextInput-CGpKh9W_.js"},{"revision":"f49280cb569955ba1b556986bff6cbd5","url":"build/js/TestIntercom--qoTq9d0.js"},{"revision":"0a40b7d3777763dd42b92e108e28031c","url":"build/js/Test-DcXZuW4f.js"},{"revision":"289da21b2db4bf553e6eba0de9b7ab78","url":"build/js/Terms-ujhHV097.js"},{"revision":"c8647e30e81293a32ba6a104da58249c","url":"build/js/TabbedDashboard-BJWWCib5.js"},{"revision":"fdef74fdf4ca83b8b9ce71912c126f1b","url":"build/js/TFA-CUuEvWVJ.js"},{"revision":"d68eb4d118bba88adfaee22bad54126f","url":"build/js/Suspanded-C7hkQcIz.js"},{"revision":"6e5cb77d3c23ec43922644a03b0c33c8","url":"build/js/Success-Ot8wRVQv.js"},{"revision":"2e853c8379376e4e79e012f32e185267","url":"build/js/SubcriptionEarnings-CThqrhMv.js"},{"revision":"32ce36eb5c145d554b69f4a9941fb356","url":"build/js/SubCheckout-bhPBJl8d.js"},{"revision":"d940bb4fdca54cbe5a59f915d38e714c","url":"build/js/StripeSafe-CZsHAsqJ.js"},{"revision":"2d86431bab9dd9888147e03d68469dbb","url":"build/js/StripeIdentity-CGzc-eBI.js"},{"revision":"7c495ef136a65780e563129ef1f5d6d1","url":"build/js/Stripe-uubxtkWZ.js"},{"revision":"d12b1a9593b9e5d0784843ec779d0171","url":"build/js/SocialLinks-CerlPORn.js"},{"revision":"7a36c3f4a2f05bbfb441e7f30710936f","url":"build/js/Social-CpnNt2Ah.js"},{"revision":"be7fafeefc874a1d5ed0ee763b23acc8","url":"build/js/SiteSubscription-C5L7BecX.js"},{"revision":"5a5816b543c153156e0bb02ca0b5d27e","url":"build/js/Show-CR9jppSZ.js"},{"revision":"6f3b80710b60f8891be41619a35e799a","url":"build/js/ShopTracker-CsY34Beg.js"},{"revision":"49f91040be2c92eebf4d76981d318af0","url":"build/js/ShopPage-BPoHnjIe.js"},{"revision":"4e9e337d9ebb1d13e8b9652a272e49b9","url":"build/js/ShareProfile-DkqxYBNX.js"},{"revision":"a38314c3c4b25783a8162b049a825aa0","url":"build/js/Settings-DbFy-5Z_.js"},{"revision":"11477705ab16a461d02c2668561b21af","url":"build/js/SendTip-BWmNBsPN.js"},{"revision":"3f2fa82730a9cd5e9751dc97d3c56897","url":"build/js/SecondaryButton-DwY3hXu4.js"},{"revision":"759411b1e6b4306e434ea1fce71da4f6","url":"build/js/SayThanks-By2E6UcE.js"},{"revision":"6c4e2bbbc2d9796af9a051c44ae00f50","url":"build/js/SafeTransition-D4u2Y3V-.js"},{"revision":"ff4327ee9df981f3f43eb13443417a91","url":"build/js/ResultsGrid-CauhhDoU.js"},{"revision":"d65864d1c0f656556f6e27f72d0dd363","url":"build/js/ResetPassword-B8dEHrdf.js"},{"revision":"cf6abeaf8d4b28b56f5224c5cfcf1c27","url":"build/js/RemovePost-J_64j6U1.js"},{"revision":"4a8451918de94ca2d6d715d484ba3c48","url":"build/js/RemoveMembership-FFamp4nA.js"},{"revision":"4188a75cae54d7a6cc1173d9e8b3644b","url":"build/js/RemoveBill-DCPAK8sS.js"},{"revision":"0becedafc6528495e41275af895bdd2e","url":"build/js/Register-_m5Tz2x2.js"},{"revision":"1ca9a97326dce65f762685c6e921bfdf","url":"build/js/ReferAndEarn-iR1znsSw.js"},{"revision":"06418706193b5b8a961154762082d083","url":"build/js/Redirecting-CXf2WmC5.js"},{"revision":"30e1c1f231f5c9a2163bea1178915ecb","url":"build/js/RecentSupporters-efoVxRDQ.js"},{"revision":"11273faedf104ee7b6f4a732d70a3337","url":"build/js/PwaTest-bj2RMjHx.js"},{"revision":"6b8a96ba8ddf2dfaac847d86d1dfa05a","url":"build/js/Promotions-D6XHc1x3.js"},{"revision":"a0be22c5ed171f14e55d8a7f431d9447","url":"build/js/ProfileTaskLists-Lc8hj0LB.js"},{"revision":"5e794befc9d797563986bf95c3061e42","url":"build/js/ProfileTask-Cx97bHIy.js"},{"revision":"cfd0b2b681360ff9985c3cff080bcfa1","url":"build/js/ProfileSteps-B47wiyzI.js"},{"revision":"03b9753b28f1cb50a6325409e573699b","url":"build/js/ProfileProductLists-DKsdWXbu.js"},{"revision":"5c135d75ee744222cdbaaa468d349e07","url":"build/js/ProfileProductLists-Bz1KgVKi.js"},{"revision":"0e37bf8e451d1912faed310f09a5949c","url":"build/js/ProfileProduct-BeNZr6hR.js"},{"revision":"e1b45802fa99de51566d4aab3751c70d","url":"build/js/ProfileProduct-Bdxpyaby.js"},{"revision":"e6aab96d36d382e723a25bb10d1cc71a","url":"build/js/PrimaryButton-sQSgWt3O.js"},{"revision":"36c3bb826f41db92981c23c0a0e69216","url":"build/js/PriceFormat-ByIQ8x-M.js"},{"revision":"11e1149532acf75fdf7d9306ad083ca3","url":"build/js/PostLike-DSuxne16.js"},{"revision":"8e41b97f9760be316109a37f3ed0296e","url":"build/js/Post-DXJYgHgV.js"},{"revision":"fd77b2527785c7d6468f27649415f220","url":"build/js/Popup-BP5YNPYx.js"},{"revision":"fec92e7937b23144068b6786679ba50b","url":"build/js/PlatformAnalytics-H1valJei.js"},{"revision":"07c206ea486849d77a71f00482d4cf89","url":"build/js/PaymentSlider-CVa3U1yH.js"},{"revision":"c5960843e91195375dd3ca38b0a030f4","url":"build/js/PaymentDashboard-Dz3jEXA5.js"},{"revision":"788a947edcdad3ad26104f440090d57a","url":"build/js/PaidTasksTerms-iZkpwcLr.js"},{"revision":"51a1209b8d925595c0044cde6e9e19bc","url":"build/js/PaidTasksAnnouncement-DnGVAW3A.js"},{"revision":"00a7f737b23c26627ca1b8e2056ada57","url":"build/js/OrdersLists-BseOevow.js"},{"revision":"83753a4de83d11fcbeb655673d9dad5c","url":"build/js/OrderDetail-DXkiSx0A.js"},{"revision":"be605ad5ee802a4fd2bdd00da864511f","url":"build/js/Order-C-gm4GeW.js"},{"revision":"67c7642dfaaa00f771cbdc275b737532","url":"build/js/OldSubscribe-DHN5_GQ1.js"},{"revision":"c23a562d357abe4b2dbba242d40370ac","url":"build/js/NotFound-CWCHQSR6.js"},{"revision":"0186618e88f41de8a5e403f0b53f6893","url":"build/js/NotForBusiness-BIuOMxG3.js"},{"revision":"319ac020fbfa2e7b4a1cb9809f3f4ef4","url":"build/js/Nocontent-CEvflPfD.js"},{"revision":"a8057dcabb549126a6cf0bdcea59e01d","url":"build/js/NewVerified-GTnosP5O.js"},{"revision":"3ea46445a42f57268f2bc07cbe7225cc","url":"build/js/MyShopProducts-DA46uWmq.js"},{"revision":"2dd241fbf4f0e0a4075840b00a9f4888","url":"build/js/MyGoal-COuDyihz.js"},{"revision":"3792e94ee872dd68bf398e3f4beb39a3","url":"build/js/MonthlyRevenue-CRuBS4mN.js"},{"revision":"6bba531ba5bc966d20547de6898319ef","url":"build/js/MembershipsLists-DmPuPw8w.js"},{"revision":"4c42a83a2aea392250be1df7a945e0e3","url":"build/js/Membership_dashboard-DPMP4FDL.js"},{"revision":"246e9a7cec48829517e00c0da9e077dd","url":"build/js/MembershipTracker-DCaoWrS3.js"},{"revision":"214650d533f70e023b3a9881cedb534e","url":"build/js/MembershipLists-C3zEIB68.js"},{"revision":"4f190910161f4c766b2a62834d966518","url":"build/js/Membership-DQLthFcg.js"},{"revision":"9ab2b67dec40d20b7a3b545d313676db","url":"build/js/Membership-CSbNfjkg.js"},{"revision":"a9a38cb785684f80ba782515719714e8","url":"build/js/MemberCheckout-BpkdncmQ.js"},{"revision":"3a3c2e5b8b431db418a3a34898ee7c57","url":"build/js/MagicBellNotificationDisabled-DgVZcQHO.js"},{"revision":"6afe1f3220293479548875152738cd9f","url":"build/js/MagicBellNotification-Bna92Q_p.js"},{"revision":"01b43dea5e32f07c458e02e20fa53611","url":"build/js/Login-LPnwZERE.js"},{"revision":"1ebc6d736d81156e6b30a7a91a1e9011","url":"build/js/LoadingScreen-hXIUwjlV.js"},{"revision":"6f92b6e23ab4ccf714d4fabb63599654","url":"build/js/LoaderButton-Crk1Qxf4.js"},{"revision":"28939808957561894dfa385f966fceaa","url":"build/js/LiveBarSection-DnOVxriz.js"},{"revision":"7fa17771a058c98a91b7f9aee477e585","url":"build/js/Lists-x2TiPRMP.js"},{"revision":"4ef8acc4eb600c0375bed7fbd6378117","url":"build/js/LinkTwitter-BJyDNn31.js"},{"revision":"77edba363e6eb44e88fa6c3a704e6824","url":"build/js/LineChart-X9zdsT4-.js"},{"revision":"613b13d2da73bacc28ce3a7641d3d3a2","url":"build/js/LeaderboardStars-_hAC5SXg.js"},{"revision":"f5533bd9bfe44b4bcbbb3f6d201601ae","url":"build/js/Keep100-CJ4lguX0.js"},{"revision":"f4296b57a33bebb41f2ebd4ba6d37723","url":"build/js/JoinUs-B-tlb98Q.js"},{"revision":"bd5a3096b093587f327e87228208571d","url":"build/js/Item-BOyEUqWK.js"},{"revision":"dbc841776c847a397ec7ab307619b8aa","url":"build/js/IntrosVideos-4WweRY2U.js"},{"revision":"7a708d886d318bd17110ff93a75c1049","url":"build/js/IntercomDebug-DiCX3yFe.js"},{"revision":"a887d7c09ef85e78291040a331feba14","url":"build/js/InputLabel-NuSz7A4Q.js"},{"revision":"5327eeeb4a91bdd2d9a7e38d422b7f15","url":"build/js/InputError-DrXrFQY4.js"},{"revision":"55a1f1fb767fa956acc4c04fcb4e10d0","url":"build/js/Index-DLOo0YcO.js"},{"revision":"b26638435f09745b9bed0bc4b43b8e94","url":"build/js/Index-CWkBLNLI.js"},{"revision":"63239ed9ec1ae8d06ed36f697805765e","url":"build/js/Index-BUJd532I.js"},{"revision":"11f52788f948599d9a1f0dd6330b760b","url":"build/js/Index-BSNYzmGt.js"},{"revision":"3778e52618dd86f7746815f770a0ca43","url":"build/js/Index-BNbs7W-T.js"},{"revision":"66e595c4f90aa6e61ede48ab6469a086","url":"build/js/ImageGenerationWithAI-DROPB52Y.js"},{"revision":"9f350fa48051e87178975e8a9667b931","url":"build/js/Icons-DDqjff3u.js"},{"revision":"8bfe7def74833ce493ed8d4134395b8b","url":"build/js/Hero-DL6koGte.js"},{"revision":"2eb7714b0cf206023ab478d28de87844","url":"build/js/Header-KXSUpgpa.js"},{"revision":"c8dcab1de41b44ca9b7f40c86fe2d69a","url":"build/js/HappyCreators-D7jAphPf.js"},{"revision":"4c90988388aef751a3179bf106941104","url":"build/js/GuestLayout-BGY8svd1.js"},{"revision":"2a2b526afd7d67e4af867c4b3c1342de","url":"build/js/GrowthTrends-8f1TVXt_.js"},{"revision":"6ec99fef53e6dbbbd0fcb54edb856447","url":"build/js/GlobalCheckout-B0wX-CXK.js"},{"revision":"951972bf6c19e2bb079f0d7a87d0e6ab","url":"build/js/GifterTips-Cze0kX-4.js"},{"revision":"7bdf9a00331cc4e27eb6eccb5ce6cc33","url":"build/js/GifterSubscriptions-CxFxNRQh.js"},{"revision":"c48ecc0a09df66f7eec36ec3aa3e6838","url":"build/js/GifterMembership-DnlD7WYL.js"},{"revision":"8cbc6eb9c01be626b1096253820ca866","url":"build/js/GifterMedia-BhQ0nu4n.js"},{"revision":"20a6c90266bbb2b73046efad7fb0bbcc","url":"build/js/GifterItems-q55OxoeH.js"},{"revision":"5a3ee398509d82283f14428afe033f66","url":"build/js/GifterFeed-UU0zcI7E.js"},{"revision":"375bfe3d31affa53ab9d8692359d90e7","url":"build/js/GifterCardVerification-BDCoG5tO.js"},{"revision":"0d24761073474aaff9918161344c2af7","url":"build/js/GifterBills-CpLr0sPv.js"},{"revision":"c8cca7148d3097690f6acb66457e8147","url":"build/js/Gifter-DSM2ZbyV.js"},{"revision":"7c37894dcbef12a1ba8831c7e2b0aa8a","url":"build/js/GiftStore-B0FqW48r.js"},{"revision":"3b0037a5ffc8f60eb6277315b6a8cad8","url":"build/js/GiftListing-9CrgZMyt.js"},{"revision":"0b78d4d3b7a88e4a498ed6ab6bec79e0","url":"build/js/GiftEdit-BphF1MKm.js"},{"revision":"a44fe176eef71fe10aadd2f4251986ff","url":"build/js/GiftAddCart-DMblRmKd.js"},{"revision":"c80b688024fab0fa078a2b6319183075","url":"build/js/GetCart-DPVPYT-z.js"},{"revision":"5f9a42e1d71ef42365e74c935cf664a3","url":"build/js/FunPart-CACDVazD.js"},{"revision":"f0933f551cc21dffd35f921a0cfe1730","url":"build/js/FounderProgramAnnouncement-CgicrRMs.js"},{"revision":"5fbdb1d6b2532474399794668694128c","url":"build/js/FounderBonus-CCyPBI68.js"},{"revision":"fdebef787009da65b8e588f4c362fc30","url":"build/js/FounderBadge-BUMo-kjb.js"},{"revision":"8ee180e7ca5ca6e21b956b74292dcfcc","url":"build/js/ForgotPassword-AbANPVOV.js"},{"revision":"bef4a2f85235b27e83aab54934bdda69","url":"build/js/ForCreators-C8RNJ3Sz.js"},{"revision":"b1bac086a6ee4ba7d4a3c4a2b31b77ac","url":"build/js/Footer-BQus5czd.js"},{"revision":"3f502d742a9ffae135d676b9175b2d28","url":"build/js/FollowButton-COOReDec.js"},{"revision":"17d4c327a3bae213ca150d9782e73c9b","url":"build/js/FlashMessenger-Kymrs0RK.js"},{"revision":"4baf2730b0ed6a3149e3e9b0c4d00aa0","url":"build/js/FiltersPanel-YOeNg_Kn.js"},{"revision":"1a438804c88ea1e1871cde642caacadc","url":"build/js/FeedList-D1yhpMoB.js"},{"revision":"d89b93dda2780ab744e0f86a0996187e","url":"build/js/Features-CRQFp4sr.js"},{"revision":"b00a2b1fb71881fc7679aa51d45c356b","url":"build/js/FeaturedCarousel-CmhlvjKH.js"},{"revision":"d7ac04ea9af514592b735259d0365df2","url":"build/js/FAQ-DyLL4f66.js"},{"revision":"ceac55882dc9d80dfe82e0b72e6faeb8","url":"build/js/ErrorPage-BSif6hXn.js"},{"revision":"732b435f6cd45239a3fbb7ced2972948","url":"build/js/EnterOTP-DjIuT2U0.js"},{"revision":"adf068b673dfa3d6dc076b20c3cce365","url":"build/js/EnableCardCapabilities-BnpXgJih.js"},{"revision":"6891c409b2d1d6fe7872a084aa7eaf2a","url":"build/js/EditProfile-YdEHDLCl.js"},{"revision":"82b3b26f66bbbcbdfc89ca3efc2cc782","url":"build/js/EditMembership-D4L2gJpS.js"},{"revision":"d2db7fa3784406b7d7061c080b9c33e3","url":"build/js/EditCategories-CSxfl8CI.js"},{"revision":"ea922b4cccef47011de89d6b031a3da7","url":"build/js/Edit-Ds-D7qth.js"},{"revision":"fb0edbfeff20d400ddc4e8a9c7865cf1","url":"build/js/Edit-Bc_BIw1v.js"},{"revision":"738fcc381dbdbc77bbf1de8d86758ca0","url":"build/js/Earnings-Cv0ljs8t.js"},{"revision":"234c3505029650cbbceb5f4416ecf6bb","url":"build/js/Disputes-CTzHpcdd.js"},{"revision":"e0123e4da8397ec994626c16392084c9","url":"build/js/Discover-DGnZp7Re.js"},{"revision":"215faad320947d618cb07beca27bb007","url":"build/js/DiagnosticPage-CiauPI11.js"},{"revision":"30657cdb44c84d9f0461ad95d3b19ffc","url":"build/js/DeleteUserForm-7wgUAFz4.js"},{"revision":"a62137322db45132a33154c0a0187a06","url":"build/js/DeleteStripeAccount-6OgeZf-z.js"},{"revision":"d03dc46b49815e1382fa16ee7ae9cb79","url":"build/js/Dashboard-TrosItS0.js"},{"revision":"4bb060271dcdc3aae8299286bf060d2b","url":"build/js/Dashboard-DAHT70mY.js"},{"revision":"375f21f574e44b593c021e5fc7f032b3","url":"build/js/CreatorVerificationNew-CegStaOo.js"},{"revision":"4fa6f44ae9a55b888695ffbe47c69ce1","url":"build/js/CreatorVerification-CBkU08G6.js"},{"revision":"f3bb564ddee9a2ea50caf70b0c5ec249","url":"build/js/CreatorSubscriptionWidget-COiMI9iD.js"},{"revision":"2092b4c2640e86cf305d8689f3c32733","url":"build/js/CreatorCard-DsfiIIKh.js"},{"revision":"fb70a8387f088286217543292744f047","url":"build/js/CreatorActivityWidget-CsGNB-Qe.js"},{"revision":"056514ba4b5b2d34ce6d6ceb5a8f7dad","url":"build/js/Create-DsgcCnNY.js"},{"revision":"b5411c9af28a3e370578349e1cb56e36","url":"build/js/CountriesShipping-Don0BDZo.js"},{"revision":"d5eadee16f244d5b5c0ce9d54249185c","url":"build/js/Countries-4uu6ACWt.js"},{"revision":"21607b93513ea026970a916652c3481d","url":"build/js/ConfirmPassword-vmUWFhRP.js"},{"revision":"f4049e1ead27a4f209188da3bae4a7d4","url":"build/js/CommetsLists-eVljSs4t.js"},{"revision":"bcd1d5997b10c416b6826f71038638d3","url":"build/js/Comment-CrQao4dc.js"},{"revision":"72e336883e8948c8182951e6a6fd07d4","url":"build/js/ComingNext-xnYpz46y.js"},{"revision":"9093729dd96b7d7d4167cbbeea398e55","url":"build/js/ChartDashboard-CEyx-fcm.js"},{"revision":"d2268a86d4b45c39728ffeedf1ef93b1","url":"build/js/ChangeVat-x8_9_rPS.js"},{"revision":"fd41a6fd8e5fea3654c579e9cdfd5da6","url":"build/js/ChangeCurrency-Bpqe3Kjk.js"},{"revision":"80fed1d4609807a3dbf8dc58a9db9344","url":"build/js/CategoryLeaders-CKy5yx_z.js"},{"revision":"b4e25e5a349aad833adcd7127cef2855","url":"build/js/CartListing-CFuTdBQz.js"},{"revision":"5052c76731520536d5564a30feb33f67","url":"build/js/CartItems-BieO2r4u.js"},{"revision":"f2998ad8b34f6a9a7509ab20db1188e9","url":"build/js/CartItem-CxCBQFkz.js"},{"revision":"5514edf653533776ef6d72eac6adca53","url":"build/js/Cart-C6kSkhqQ.js"},{"revision":"11209269bbaeb89103b7cd6aa53f398d","url":"build/js/BuyShopItem-DIB63O4g.js"},{"revision":"d19b299accd8a5745cb24a1827fc8af7","url":"build/js/Board-Dh4tP93_.js"},{"revision":"ab0891ecfac57bd603672b85e461f9d2","url":"build/js/Billslist-D5jKWCTP.js"},{"revision":"d40f6198acc85bd025efbb39ba01762b","url":"build/js/BillsTracker-DD_GDaB3.js"},{"revision":"c601fb637b837f0856cefa252262b3ac","url":"build/js/BillCheckout-CepraxkQ.js"},{"revision":"5f54b182d49b12467dad21ed08131431","url":"build/js/Bill-O56ZIjIC.js"},{"revision":"4afdc95d5bedc1e10ac000ecf1015439","url":"build/js/Avatar-C6LBO_SU.js"},{"revision":"d424a63da85ff0ba79446608a185bd12","url":"build/js/AuthenticatedLayout-CwKf3TWF.js"},{"revision":"9ceeb5973751d0b9c5321b4f21d6b5b4","url":"build/js/Analytics-CEnV2D6w.js"},{"revision":"632009a68ff6824c5d7a046dc4ba694e","url":"build/js/AllWishes-DVruV79g.js"},{"revision":"5adb5d4d4c42ba43c7f8d2fd8d75bb8e","url":"build/js/AllCountries-0leWWlvU.js"},{"revision":"f35fd728e046b93882e7ce0760f77e13","url":"build/js/Alerts-x-Npv9gM.js"},{"revision":"661cdc4220437d7210c0dfa5fa9974fb","url":"build/js/AddressForm--7jxgNlB.js"},{"revision":"978f88efc18f84917314cbb3b1f7f086","url":"build/js/AddShop-B7-Pilin.js"},{"revision":"2dfde6d98614e95a128fc97cb19c96e1","url":"build/js/AddRyeProduct-tWRZ-QpA.js"},{"revision":"b4208208dce059e7a3613918533fe41a","url":"build/js/AddPost-BWJ2vYDl.js"},{"revision":"c92a8b7a317427f4c812cb39b76136cb","url":"build/js/AddMembership-5nIr4QI8.js"},{"revision":"844d47af0758462379b62752ac538ae4","url":"build/js/AddItem-VYY4e045.js"},{"revision":"dfb075f6b4671d85a34f82ca03a53e52","url":"build/js/AddIntro-DA1ShUDH.js"},{"revision":"56d7427afd38ae2383d1f1b8a8d1fe47","url":"build/js/AddGoal-woeJ_0KG.js"},{"revision":"f9dc6d0d5e19d7730e54a73ec855a72a","url":"build/js/AddGift-CYzDTS7Q.js"},{"revision":"4cdea5db8afbdae8cd057166bb99fe72","url":"build/js/AddComment-CmE1s691.js"},{"revision":"8f7f8131dd7b5745136847257b75ab0c","url":"build/js/AddCart-BmnMEFWL.js"},{"revision":"01d697582a3641ce288e9c473b88cae3","url":"build/js/AddBills-BfixaRco.js"},{"revision":"b3df5b2e9f5f302872382ae6670bd6f3","url":"build/js/ActivityStatus-BfWtOtKg.js"},{"revision":"5e1eadffd03a012cd0b22c7ef08ec446","url":"build/js/ActivateSubscription--xJ465dW.js"},{"revision":"617164170500e6f3b8d8ab95c1889680","url":"build/js/ActivateCard-aY7zotD7.js"},{"revision":"14c3213515152c46f043be281f764fd7","url":"build/js/ActionRequired-7wdGn5yr.js"},{"revision":"5394ecada4764b527bbf3d7dff016fe0","url":"build/js/AchievementSystem-Cf1CSm0-.js"},{"revision":"16217cb5d7d3ca66f9cdee7d0ad5f717","url":"build/js/Accountsetting-CZLdw3W9.js"},{"revision":"07c82a3355f8d09910263ec22f81fcb5","url":"build/js/404-D5I2yUPS.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"6d4d90f55a497e614ce5b0ae871da806","url":"build/css/app-B7NsHuZJ.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
