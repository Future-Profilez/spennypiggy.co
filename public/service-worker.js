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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"9949747c62c7174e69a22263b4fca393","url":"build/js/vendor-react-aT3HqAlF.js"},{"revision":"fe2087cc837910bb626f864f856aed80","url":"build/js/vendor-other-n0bqoG6m.js"},{"revision":"3428eb1c4151c39bae7b97fb8f50c46a","url":"build/js/vendor-inertia-CuZNEPSP.js"},{"revision":"00a2c4996746abc8a722b65274ca933a","url":"build/js/useDispatch-Dl28o9DU.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"681a9f5270f07cbbdcc172379110ddea","url":"build/js/triangle-alert-BSmMPxi8.js"},{"revision":"38b160c5852e541df48eb15bb2d38c0d","url":"build/js/swiper-react-CTOn3sCc.js"},{"revision":"6ae013b83d9161603e064dffd9a5dcb0","url":"build/js/star-DfRfKRqL.js"},{"revision":"0bb11bc2ae49db49b07563bfde347a27","url":"build/js/sortable.esm-CaSOpX8K.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"230e038fb88819ff001cf8db00dff919","url":"build/js/shield-check-C5L7gQGJ.js"},{"revision":"0872bc65d42641d34b0682988abb6476","url":"build/js/shield-VB7B6PfS.js"},{"revision":"5b50742c3a4fce5bb335b8dee3566be1","url":"build/js/react-select.esm-poh-xbeG.js"},{"revision":"f2cf8786d70c6291a053df44f4ec8431","url":"build/js/pagination-Dg5bNVvv.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"25dc0e3df0dfc27f1e070769608c1289","url":"build/js/navigation-DrvP2hp-.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"6146b040b2c5969208cfa4486c5f58ed","url":"build/js/index-nxceGIna.js"},{"revision":"e7739be636f1f64ce26ef887f3a4098c","url":"build/js/index-ixQCbAq-.js"},{"revision":"7dc8771ea49fe2911fc32f66de438e0e","url":"build/js/index-ZTQfP3zh.js"},{"revision":"477619f82c4394a55b48a957d0570fb1","url":"build/js/index-Hw1qOlDz.js"},{"revision":"5bc0fd23e44a6917887583f20fa63781","url":"build/js/index-DXkBn8bF.js"},{"revision":"b36fb759a43f8698375829719e8897bc","url":"build/js/index-DOmTZx_s.js"},{"revision":"b7482a91e3d0d91a9c6cb572a0d7d9ad","url":"build/js/index-DMjbSOzm.js"},{"revision":"738708cd77a82e02cc1aa397b46640e2","url":"build/js/index-D9osjcIx.js"},{"revision":"3549eb0f78202b6c221871c2b05316a0","url":"build/js/index-Cd6vMDMk.js"},{"revision":"3f577524d4cc250eddfe7a28e903f7a7","url":"build/js/index-Bu45HLAh.js"},{"revision":"b258e90e848201f87cb4cbbbd0b9c280","url":"build/js/index-Bpc2X_SU.js"},{"revision":"0e3b9d5505701e749a67d5fe3e0ba837","url":"build/js/index-Bn9HTYeZ.js"},{"revision":"17a739cff8f824513b1ac9fef7b217ce","url":"build/js/index-BYZZ5SKm.js"},{"revision":"a9dded70a1c237d4c72d431a6243db11","url":"build/js/index-BLG5zD2Y.js"},{"revision":"683f980f425c904d33d241a77546f586","url":"build/js/index-B-HaKp1I.js"},{"revision":"6a4b8254c23d1054f19b73c6e4a22b36","url":"build/js/index-6mXq3rjf.js"},{"revision":"4fb2868f726841b71f9fcf62c8c1df22","url":"build/js/index-5NPPqqIs.js"},{"revision":"fbb198c8d175195ee74ccfde45504e12","url":"build/js/iconBase-D-zDhhXs.js"},{"revision":"85a281724e1dfeda56ec1efe06649c28","url":"build/js/html2canvas.esm-N5Qv6hEC.js"},{"revision":"0fb563620cbefa7a5d3654880138fd92","url":"build/js/floating-ui.dom-BgKqM2xO.js"},{"revision":"d52008739b07d6f14954a7deb6f7c720","url":"build/js/dollar-sign-CJnmd4uP.js"},{"revision":"083020289d75f706b0a4375c266b431f","url":"build/js/debounce-DAEALp4_.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"796a5436e80f1c8048efae663d741b6c","url":"build/js/clock-J3cehpix.js"},{"revision":"91def461b55b2096110ab04e0e0fe40c","url":"build/js/check-DHLalqxn.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"22a1289f31fa3cd5011e33799f0eda1d","url":"build/js/arrow-right-COx7KR6R.js"},{"revision":"95fcd526ecd64caec882a0840d9f213d","url":"build/js/app-CaczD6u1.js"},{"revision":"0e8e1a82935f39f2a0293962be121ea3","url":"build/js/Works-aVzfCduE.js"},{"revision":"dd44fa5baeae57bd2bfd2e514fbed019","url":"build/js/Wishtracker-DtpyL4km.js"},{"revision":"2659bb024b6b10f5d5a47e63c748791e","url":"build/js/Wishlistbox-CT32nJl9.js"},{"revision":"76cb99f277fd80e4d2df7d396aec1e80","url":"build/js/WishlistGrid-C4qtdmCb.js"},{"revision":"98cbb3f3de18b05af7699327c449b5f8","url":"build/js/Wishlist-oRnV8HnV.js"},{"revision":"ddd0a9fc5339016e03911e1aa622c651","url":"build/js/WhyLove-BB37Izys.js"},{"revision":"55e3862eaa2ac5be921192d26882f184","url":"build/js/Welcome-DSDn7WF2.js"},{"revision":"072d2948ffb6f410b0ffdfcfe1db450a","url":"build/js/VipSupporters-BwsfCwBd.js"},{"revision":"7453924a39c515f086bdf1602f0db75d","url":"build/js/VersionUpdate-CAiiRWOZ.js"},{"revision":"8b0ec6babc4d10518faf889ab6d23285","url":"build/js/VerifyEmail-BszZEyfZ.js"},{"revision":"d46cc30ac2e66d8cc2bed829f333db9b","url":"build/js/Userprofile-DYIvQnwr.js"},{"revision":"4e740f3ae070056fb9027a150b89b5ee","url":"build/js/UserCarts-BBv_bNk5.js"},{"revision":"5c79d4480e8ca2c23dfb06137e59726f","url":"build/js/Uploader-1-qGcLyd.js"},{"revision":"f76d3db81f74e96396b333b0ad80c75c","url":"build/js/UploadcareEditor-LYJi78Ld.js"},{"revision":"95c7afff617a9b4cc8dc1cd0753bae25","url":"build/js/UpgradeStripeAccount-DXFEUbiu.js"},{"revision":"8371a16982a923d3e5886fbbfc561695","url":"build/js/UpdateProfileInformationForm-Cfi6EQKH.js"},{"revision":"1cd3bc8cf24504f914cb7abe9308f4f6","url":"build/js/UpdatePasswordForm-Cwikfsen.js"},{"revision":"d3e8d6967be4b853d2361e69085d4a96","url":"build/js/UpdateAvatar-BaG1LfdZ.js"},{"revision":"76739bd3b136e11afd67f24598292a6b","url":"build/js/USTERMS-D68YSb5A.js"},{"revision":"53a6bf0341e7aa3e94292a5c012ebdf3","url":"build/js/TweetNow-BV9mGB55.js"},{"revision":"628ac1dff0343938e8f713a5bb63e20b","url":"build/js/Turnstile-B7Mi2FU8.js"},{"revision":"76b82e705d07cbd7a1df90a03ae04ae4","url":"build/js/TrustBox-COKN7ETs.js"},{"revision":"0c1564a75628af2ec9aeef4fb9a83f8f","url":"build/js/TrendingCreators-DZpnz3Y2.js"},{"revision":"4dbc23a5bf0a9a3bd9e96cf2b2b7732e","url":"build/js/TopSupporters-Cu0oJVVC.js"},{"revision":"bf14f5e704ae3ca0fca917f3bfc5899d","url":"build/js/TopSupporters-B5hViqtU.js"},{"revision":"7ee63ca57ff1b2a7da6a1cf9fac29425","url":"build/js/TopEarners-qdqaGTW-.js"},{"revision":"9edb786046890e25e870b2d340ed1096","url":"build/js/TopEarnWishes-g46fAt-w.js"},{"revision":"fb5d77c0d2ab935f97610e6d8fafa710","url":"build/js/TopEarnBills-DFQ2Cz2-.js"},{"revision":"30fd5c791f38e1b086aa4dc87afcddac","url":"build/js/TopBar-DaLP4O4J.js"},{"revision":"940566f44d878317e59400abc707ba96","url":"build/js/Tiplisting-Cc9H3ZxD.js"},{"revision":"732fdea6e7dcd921ce575692d9edafe6","url":"build/js/TipTracker-BZXi9ZkY.js"},{"revision":"079e8d438151aee945746bf00958a2e4","url":"build/js/TipInner-D0L5tS8C.js"},{"revision":"900c9f9aacfd2b6a65522e40b80d1fe7","url":"build/js/TimeFormat-J7mAmPUE.js"},{"revision":"46472e5df87aefe26832b0f52d3e0c09","url":"build/js/ThankyouMessages-DPHRy0Pg.js"},{"revision":"21b0be7aadd6415d836a285d4c19c904","url":"build/js/Thankyou-DdWe6hWQ.js"},{"revision":"4da95a05d67777a3a19e6c788d6d39e1","url":"build/js/ThankYouRye-CgyPAKOw.js"},{"revision":"30ff2993bdb18f93f54e34562be2c747","url":"build/js/TextInput-hB74SlBq.js"},{"revision":"2d36f39d6670ca19b6f64e62e47f98f4","url":"build/js/TestIntercom-PVA-ZZvE.js"},{"revision":"348a1e51bbdaa484e01f97aad7cf7532","url":"build/js/Test-69aGFEmp.js"},{"revision":"b2a0d2cfad8d4abc6c2afdda0af10535","url":"build/js/Terms-nusJafUo.js"},{"revision":"512410a69355e67a26754b10cac18c74","url":"build/js/TabbedDashboard-B8DHtx3L.js"},{"revision":"72042fd597dc534deabc82b2a79ca966","url":"build/js/TFA-Ca8E38Gb.js"},{"revision":"79e132f788d48df696af9a27a7b48390","url":"build/js/Suspanded-Bw9epf3K.js"},{"revision":"d64613e5202677cdcaf36562df1b8498","url":"build/js/Success-Bf08XAXd.js"},{"revision":"0da3b48b9e5b600b3ed5f8522f72ccaa","url":"build/js/SubcriptionEarnings-C3htdoYS.js"},{"revision":"f0f69e6f3e0e3c0154ddf6cb866d702c","url":"build/js/SubCheckout-BYJQ4hXQ.js"},{"revision":"fb2ba2b5825c6158dc06cf9bbf62fcc0","url":"build/js/StripeSafe-DyuFuVly.js"},{"revision":"6934a68870ed836cb7719a30c2979fbe","url":"build/js/StripeIdentity-DBYDxLmN.js"},{"revision":"42a993b5b39e4fd765bec2b6a1b81b2e","url":"build/js/Stripe-aD1ipDNi.js"},{"revision":"4041e80086e8f4f665a32d7eb303f18d","url":"build/js/SocialLinks-tMbWe4jM.js"},{"revision":"3a76acfaa665afd1a51c2c20151d7529","url":"build/js/Social-B4qPRUJP.js"},{"revision":"19ec8e2994e17f874936b1ce6ca0074a","url":"build/js/SiteSubscription-ffK2bWC9.js"},{"revision":"0a1a2c690722616420864cda40f7dd2f","url":"build/js/Show-DIE04pvG.js"},{"revision":"7a043761956799d918196679a01e9695","url":"build/js/ShopTracker-MdcotIUi.js"},{"revision":"e938bb843fd5c81e5745b9ada744467b","url":"build/js/ShopPage-BFDZ3pRQ.js"},{"revision":"727f8bc9a7ad904295575e5076c5b39c","url":"build/js/ShareProfile-DGzcuwtS.js"},{"revision":"bd8cc314e4f10255c51aff9fef2aa081","url":"build/js/Settings-BIlffXqT.js"},{"revision":"e939bed70ba91bd162764855d2876bdc","url":"build/js/SendTip-UTcBROT-.js"},{"revision":"695265ca1777375288f1a3129dd1542f","url":"build/js/SecondaryButton-DxgjSRpb.js"},{"revision":"786c7eae6d5bfbd9f1178c29896603b5","url":"build/js/SayThanks-BYTlOM24.js"},{"revision":"c2670a4d59de03bab5f46d22c5d3b675","url":"build/js/SafeTransition-CPtyADPI.js"},{"revision":"893f0420424fda96e921c277d605fe4e","url":"build/js/ResultsGrid-IKSdJXLc.js"},{"revision":"c60ccea133f217acdf46dc1e07adcf58","url":"build/js/ResetPassword-_S4-J5AB.js"},{"revision":"1931928ee423422d84aa009a577978d5","url":"build/js/RemovePost-BQ-ZPMS8.js"},{"revision":"e13f79a9132539a863518cae301fc426","url":"build/js/RemoveMembership-DeDNB_Ev.js"},{"revision":"c42775a099c49e1d2b0ff1ca95629f92","url":"build/js/RemoveBill-C_bCiJdA.js"},{"revision":"4b7601fb731f7d600e6581c4c7f9be30","url":"build/js/Register-BWd3L4kY.js"},{"revision":"e7bba0482a03b8d3c47d0c71662d901e","url":"build/js/ReferAndEarn-CRGxANes.js"},{"revision":"d6765ba1c56fc09e9032983d46f4b9a0","url":"build/js/Redirecting-BuVdmjon.js"},{"revision":"e15e58cf00c2994608c1fd423027d9a6","url":"build/js/RecentSupporters-D9PdsX2R.js"},{"revision":"73f7e897064c4154a446e35f7073686c","url":"build/js/PwaTest-DdMwuYf6.js"},{"revision":"136089ed4dc529fc3e98962dd2046f69","url":"build/js/Promotions-DK_KnKB2.js"},{"revision":"6a5c19f446e8609cfe0cba027171fa12","url":"build/js/ProfileTaskLists-BO9ImXDe.js"},{"revision":"7f1d13f7d4c5f932be491f35a0da9229","url":"build/js/ProfileTask-D9W8gMtk.js"},{"revision":"0b507e89ec4b679e1dfdaaaa12ee5eb3","url":"build/js/ProfileSteps-CzyqiZTq.js"},{"revision":"456f6f7b2968ebe89c009e4706c46bb7","url":"build/js/ProfileProductLists-BHI05Fvv.js"},{"revision":"a21363ef947ae4490e8ca760d1ad9563","url":"build/js/ProfileProductLists-2OfgjUhJ.js"},{"revision":"4bd10f1a0a9c1cf69bbbe7165364b4e6","url":"build/js/ProfileProduct-Dk_CQoqB.js"},{"revision":"0a7d23a3764eac89561c010e6f5e008d","url":"build/js/ProfileProduct-D1TlZ_Vz.js"},{"revision":"1a03e7a4ddfdad9b23b216f41f2a5fa0","url":"build/js/PrimaryButton-ls-Dqy7D.js"},{"revision":"602c0bb4fdc26ee9c14de858bcc272af","url":"build/js/PriceFormat-BWAjgpjc.js"},{"revision":"da9561c71505daf76e7506f44d77e58d","url":"build/js/PostLike-Cg_UnN3U.js"},{"revision":"c1bf023c73856b02d08e8c2439095130","url":"build/js/Post--yXrCl-5.js"},{"revision":"21c1f4b5ab871ad2493fc77a713fa256","url":"build/js/Popup-BS-bVE0c.js"},{"revision":"8de10cca630bd568df8045f574eab95a","url":"build/js/PlatformAnalytics-CZh_JbQI.js"},{"revision":"2b58ecd5bf01bc3107ac6e019ffc6d14","url":"build/js/PaymentSlider-1h9M5vpU.js"},{"revision":"1d258aa8c3a3add63b2b572da31080c4","url":"build/js/PaymentDashboard-D-Sr0_c_.js"},{"revision":"099e50089c0b060f6a15dfd9d863e4ad","url":"build/js/PaidTasksTerms-E2D4u1He.js"},{"revision":"923c82d87e9f85319de1c9f7095e5101","url":"build/js/PaidTasksAnnouncement-BhRD_2-m.js"},{"revision":"bc355eb42e191f930526dc6699d0803d","url":"build/js/OrdersLists-z8FRpufn.js"},{"revision":"5b9041db62cd2b70365c35afc4ab5650","url":"build/js/OrderDetail-DhnhJZ28.js"},{"revision":"54e205b8b1eedccc1f1ee7086396f62f","url":"build/js/Order-4Cdg_QWx.js"},{"revision":"399265c0dad4bdd34a9a8c017981ce87","url":"build/js/OldSubscribe-BfPg1nMz.js"},{"revision":"8a8a98f980693727154d340a84cdf13d","url":"build/js/NotFound-BUPylEyI.js"},{"revision":"592445758f6c5c9c94f0b072598d4c9d","url":"build/js/NotForBusiness-B3hsEHpg.js"},{"revision":"feaf04398ce902e29b821d3409ea1077","url":"build/js/Nocontent-BZhVjF8H.js"},{"revision":"dca9ba6d301ec08853f454a1bb360ead","url":"build/js/NewVerified-FLm9ShkH.js"},{"revision":"d6268b21db06501f62078e9499f6ba1a","url":"build/js/MyShopProducts-D99oo71x.js"},{"revision":"438f0a7b4dbcde888167395f2eca8099","url":"build/js/MyGoal-CCNlFkTO.js"},{"revision":"53ca9c4ed113ad26e736a250001de203","url":"build/js/MonthlyRevenue-C_07YLej.js"},{"revision":"afac1eb3f76d32ec6c3ad1b6d11cf6bf","url":"build/js/MembershipsLists-CL79jcyL.js"},{"revision":"20e4aef21482c4500a79015c39a71880","url":"build/js/Membership_dashboard-BoyDD-98.js"},{"revision":"0ff23a2a77cb9a1994c54e5cda14715d","url":"build/js/MembershipTracker-CAsvOiln.js"},{"revision":"62ba6eebaa502a2f73031edb0711251f","url":"build/js/MembershipLists-8XDSCHpr.js"},{"revision":"84540a9aaad67815747db5aeb3322a36","url":"build/js/Membership-CzxuXrAo.js"},{"revision":"a5fe263e5b812af7fe7aaf6f5308124b","url":"build/js/Membership-Byj1hLiS.js"},{"revision":"8c14d924124160925b311f4bc395b867","url":"build/js/MemberCheckout-C1CS3HWi.js"},{"revision":"c3fd3c5fa4ceb37ada8a9b80230c52de","url":"build/js/MagicBellNotificationDisabled-sxbtZq7g.js"},{"revision":"d23a62444db40fd11f3754ecb143f376","url":"build/js/MagicBellNotification-D7tf3EzK.js"},{"revision":"72d144c76fd7039edcecd28e30819b3e","url":"build/js/Login-CK1_YxSI.js"},{"revision":"cb0e69221377f8a139e973c2b3acfc7e","url":"build/js/LoadingScreen-CN9Qpwdw.js"},{"revision":"dfc365fde002389100fde683c769af71","url":"build/js/LoaderButton-D1Zwy35s.js"},{"revision":"589e364f6d217914b9c448926ca464b1","url":"build/js/LiveBarSection-JB5VZ-OB.js"},{"revision":"bb779399fc837da718ad38864647cf74","url":"build/js/Lists-C68pxgDR.js"},{"revision":"163f5e04000f541c884461dbfd044a53","url":"build/js/LinkTwitter-Bu5h_GEk.js"},{"revision":"0799b4e1ec7e444ae11dee9d133dc4fd","url":"build/js/LineChart-C6MLTMZ6.js"},{"revision":"637e23edaa79da94c4802d563046beaf","url":"build/js/LeaderboardStars-CqkMaQe3.js"},{"revision":"271169a0e569589e9cdbb2c5f7c99c35","url":"build/js/Keep100-F8PMaQyp.js"},{"revision":"831b6647ccf565576da8d360f66586a0","url":"build/js/JoinUs-BBT13UWB.js"},{"revision":"a274fcacf1d86b3559b5a7e72489344c","url":"build/js/Item-CjHrNXlp.js"},{"revision":"fe956cd1ee0ce64071b0ad1e1ebcb11d","url":"build/js/IntrosVideos-CWwmNP5S.js"},{"revision":"7a6a80baa093acdca9e782131f70cc8f","url":"build/js/IntercomDebug-CDALBSLQ.js"},{"revision":"f2d570b2c14360f70a6a9a51d135ed76","url":"build/js/InputLabel-CWqqv8zQ.js"},{"revision":"f9e74a14c71a82bd60883c714ac5e768","url":"build/js/InputError-DtPSofw8.js"},{"revision":"3e43e363a4fc82791186a3968fea2bf8","url":"build/js/Index-xtMzjnrc.js"},{"revision":"aee0d08159ec84569507cc616a026f71","url":"build/js/Index-CgMVykUD.js"},{"revision":"7fb117a702cf21bdcdb2b3b77ee6c495","url":"build/js/Index-By2s7O-a.js"},{"revision":"a963bcd6a3ad80342062221e6c91c61b","url":"build/js/Index-BdsmFjgM.js"},{"revision":"2f032b47c411545cf287283beba15275","url":"build/js/Index-BJvwOevW.js"},{"revision":"dba7eb6b6ecac613dbdd34dd901557bb","url":"build/js/ImageGenerationWithAI-BHVrQZH3.js"},{"revision":"ba8bc98ceeb34646441f69f7fc6a32f9","url":"build/js/Icons-CtV1eP92.js"},{"revision":"fe2b0a28a12b51ea1141d35189155b1c","url":"build/js/Hero-Bg1AWH4_.js"},{"revision":"da271ed7c33350968f392b047cc0c39b","url":"build/js/Header-CXYWVrPo.js"},{"revision":"6c79673b09599cc7ecd06004424abc23","url":"build/js/HappyCreators-Cfyn69fW.js"},{"revision":"8ae6159b796f15320ffcbb1d4106b3de","url":"build/js/GuestLayout-CXDtBhDG.js"},{"revision":"9d91b0ded64e3a16296e70bcea14273e","url":"build/js/GrowthTrends-CWUX6hk8.js"},{"revision":"1ad26d0a6d9da37d0691bc21d08cc723","url":"build/js/GlobalCheckout-B1FRQRgv.js"},{"revision":"2e7b3d666a9ebb2d7d7292342373dab0","url":"build/js/GifterTips-CaLXKvGm.js"},{"revision":"72acdd0efe409edcf99859b632810671","url":"build/js/GifterSubscriptions-DCh6ld2s.js"},{"revision":"c956922ad609e95831b26ac0267f9f26","url":"build/js/GifterMembership-BMoQuIN4.js"},{"revision":"5d23482f0b28310c13d36d70c7465a78","url":"build/js/GifterMedia-D-QL9iyO.js"},{"revision":"a68731ce91fd65c81b21b594c4808b82","url":"build/js/GifterItems-DeAID3-l.js"},{"revision":"509bd697f53a9dd98d64c2e323055a0e","url":"build/js/GifterFeed-CdhHimHo.js"},{"revision":"f6689eb6e5d576292e2802eca5e73cd4","url":"build/js/GifterCardVerification-0V4_GcQE.js"},{"revision":"da7086c472a2b8613d5d76e8b8f14e4a","url":"build/js/GifterBills-D7rmC-KH.js"},{"revision":"c475698b07a4028307b0058bd60b0bf1","url":"build/js/Gifter-CL5oA64Z.js"},{"revision":"b2fb7730eeb14ffa0b7eda180bd4ab99","url":"build/js/GiftStore-nlVsTp46.js"},{"revision":"7d4535e4a951eacef9d16816c84b5031","url":"build/js/GiftListing-BiM7tAdK.js"},{"revision":"c0dec7257d2b96a7e2aa03c1afa26a7a","url":"build/js/GiftEdit-CJei_CQj.js"},{"revision":"a85afa93bf397ffd199ce0313410e7d0","url":"build/js/GiftAddCart-DLwBgCD3.js"},{"revision":"a06d9ed8f6ae991a831c20e347b03348","url":"build/js/GetCart-BtSRszWm.js"},{"revision":"0027bee0477f4cee445e995f4c72a325","url":"build/js/FunPart-CSKc-Zsf.js"},{"revision":"c989148134c5af1b6a31a297efcd3bec","url":"build/js/FounderProgramAnnouncement-DkQZKf_V.js"},{"revision":"130e5029c239aca0972ccf57dbaf4e31","url":"build/js/FounderBonus-DQy4hHh-.js"},{"revision":"482df754c4372af7ebb993e997470934","url":"build/js/FounderBadge-CB7_ndS3.js"},{"revision":"b8f541e8ba78b21ff954dabcbb8f52e3","url":"build/js/ForgotPassword-rmsqMkNE.js"},{"revision":"e673bcd7e83864df8ceea5c59bb6a0bc","url":"build/js/ForCreators-CwBqd-Rh.js"},{"revision":"d2cf3673d3b31617b6c82aca49c520e3","url":"build/js/Footer-CLGJEcaT.js"},{"revision":"3df762c7883e8755ab753a5695143318","url":"build/js/FollowButton-DkvQiSN_.js"},{"revision":"1e0e0dc30f4932997d392e759fa112c3","url":"build/js/FlashMessenger-B9ru3_fY.js"},{"revision":"74fe3ca6ae5922d5492fbfe19ef10eb7","url":"build/js/FiltersPanel-Bl3aEqzJ.js"},{"revision":"9ccec2c5c2d5beaf713dc56b1d86f3d8","url":"build/js/FeedList-8Kxi5D2S.js"},{"revision":"eb0ccd6c44e71a308ece28a55f691b4e","url":"build/js/Features-D3JZqpOD.js"},{"revision":"981b504dc334b22a2b44f3283978211a","url":"build/js/FeaturedCarousel-DsrdkXe4.js"},{"revision":"1b8debac2db70ce236f19b57de73069a","url":"build/js/FAQ-B17zx1t1.js"},{"revision":"9b3652d4290fbda2b10a3ec6bf458883","url":"build/js/ErrorPage-CFCdoqp5.js"},{"revision":"e7014638b89eb6e699f258c2e819f02d","url":"build/js/EnterOTP-DhsqRm5m.js"},{"revision":"dbafa57b856abc24ad88718773b4565d","url":"build/js/EnableCardCapabilities-NGAVpmtb.js"},{"revision":"63f80d74d144ce4a957bdbfe7cea9b40","url":"build/js/EditProfile-BLKVhV93.js"},{"revision":"73686daec7d1ce20817a867fdf70aa36","url":"build/js/EditMembership-DRwCcDpC.js"},{"revision":"07ba4ac063fda843fcb0733e68970424","url":"build/js/EditCategories-BLQPNvxI.js"},{"revision":"1cef65b010afe1c1c066449c0c08f69c","url":"build/js/Edit-jsefXCSC.js"},{"revision":"a51012b50918e2bb1a0d4799b9a97491","url":"build/js/Edit-F7jE7qaC.js"},{"revision":"8ff52456f7e670ec41d8e31774dcc38b","url":"build/js/Earnings-CXUHX298.js"},{"revision":"68a44e3368614a3eb4bd225c00be6553","url":"build/js/Disputes-j8J3vj1f.js"},{"revision":"8c427fcc289b57f8840a4ce8acda2b77","url":"build/js/Discover-q4PuJzSi.js"},{"revision":"ffa956e0c4e96681cd20ca6a2468e151","url":"build/js/DiagnosticPage-DDX13fJp.js"},{"revision":"3996520f6d1a1afb6e7afd4a18fa115f","url":"build/js/DeleteUserForm-BHnSruMW.js"},{"revision":"a0a74ec13ff5da10b9e6eed3e4108da6","url":"build/js/DeleteStripeAccount-C5NH1J10.js"},{"revision":"e8aba2d623894683520f4bf5b74e202d","url":"build/js/Dashboard-NNTVJlFd.js"},{"revision":"87bfca86e91e41acba20293317758eca","url":"build/js/Dashboard-E_E80ehO.js"},{"revision":"f09f3031399d3923d090aaf9e9591314","url":"build/js/CreatorVerificationNew-5mpGFgFW.js"},{"revision":"bedfc0ff1c5829673412c92cfae46601","url":"build/js/CreatorVerification-Cc7_fW4l.js"},{"revision":"05e128aafb36dde7d576332a9de5bda3","url":"build/js/CreatorSubscriptionWidget-DWgRLqkF.js"},{"revision":"1a929c52917a48ede105be35b753ddac","url":"build/js/CreatorCard-CVNw3Pn6.js"},{"revision":"74513e00a2bda3f851d617c80e7ace06","url":"build/js/CreatorActivityWidget-DrQHMyzn.js"},{"revision":"901702e658e1c7c19afd16e03f0154de","url":"build/js/Create-DV5cuJ7N.js"},{"revision":"8b70f6d7ee69cab946046b467886c371","url":"build/js/CountriesShipping-CZFOPWTc.js"},{"revision":"ddef5ad42bf45f576ac9b00c92c3e600","url":"build/js/Countries-suqNqRtw.js"},{"revision":"a73c8f2d2e4b0870de8791ef23a059dc","url":"build/js/ConfirmPassword-DfwyIyZ-.js"},{"revision":"545416ac741e9f75d917491c1a64ece5","url":"build/js/CommetsLists-Q0A2MiIM.js"},{"revision":"5317d8494cf77463ffd9de26315160f5","url":"build/js/Comment-DsfVPlBi.js"},{"revision":"b0fe53aa49f712751b17da8e36f834d0","url":"build/js/ComingNext-BdQI_FJz.js"},{"revision":"db0484a6ea2b493bb589936cddc33e9e","url":"build/js/ChartDashboard-C85bZP19.js"},{"revision":"cd9a2fc24ebb89f616c9f974e224b7f5","url":"build/js/ChangeVat-CWr-OB8q.js"},{"revision":"7ed1b71485b9b57e2165ae83f26fe359","url":"build/js/ChangeCurrency-CjXvpEfU.js"},{"revision":"cacccf14821c334355f1172fb690214a","url":"build/js/CategoryLeaders-DpdM9Ykg.js"},{"revision":"64eea8356580e95e67c62e9796a10cf9","url":"build/js/CartListing-CLWl0lC1.js"},{"revision":"558d2c618ff2a9eb98ba5b02061f43b9","url":"build/js/CartItems--DF9eh_Z.js"},{"revision":"f104f68067c0741e505564c6df8b59a5","url":"build/js/CartItem-BmVmLq1H.js"},{"revision":"cd36830979b8ee1cc55ba1c28fa4b7a8","url":"build/js/Cart-gh7loLkn.js"},{"revision":"800f9cb3bd84cf73a0bd052a4391aaa3","url":"build/js/BuyShopItem-CuzkBKaw.js"},{"revision":"aeb66612b894d3e1d9d0bc482f646911","url":"build/js/Board-BRBc14HY.js"},{"revision":"085db777fd08294fe0247cfde2029ce2","url":"build/js/Billslist-CWbenSko.js"},{"revision":"f57a61e1f4e2e14b2a6024b514af5deb","url":"build/js/BillsTracker-BduGLjQe.js"},{"revision":"105d78a50c7b1114d561b85c75d3bd98","url":"build/js/BillCheckout-Q9xx3KAK.js"},{"revision":"c392122ad93b096f1bde7bdaefefc20c","url":"build/js/Bill-C4ttM-_3.js"},{"revision":"e41bee66635c3e3e495851ea21241172","url":"build/js/Avatar-BPzN02mC.js"},{"revision":"700dab6281b9b841f63388f424824746","url":"build/js/AuthenticatedLayout-DC6V-ZrE.js"},{"revision":"e8f454e17008c306b5adb33ba1374554","url":"build/js/Analytics-B3yVOVIL.js"},{"revision":"ea9fc8b0f46d84dd145c9bd2886a463e","url":"build/js/AllWishes-zfSHIsek.js"},{"revision":"f0fd3a396eb71552b566e2637eb09471","url":"build/js/AllCountries-CJHctRck.js"},{"revision":"b82c6a0771b799a857c87f185ce83a57","url":"build/js/Alerts-C0oraJRK.js"},{"revision":"37a648098a6f5a4ff8b97d72502cef15","url":"build/js/AddressForm-BpbQNR8G.js"},{"revision":"c4e9bd9e56199d8f14eef90ab6369273","url":"build/js/AddShop-ClWyv2B0.js"},{"revision":"de17174d377a1df61e6873886a894cef","url":"build/js/AddRyeProduct-yzCmH3sq.js"},{"revision":"4482b33753afa0a75c9377a20629d0df","url":"build/js/AddPost-DU5TWuCG.js"},{"revision":"5d82954d6b492a53537363078df6898c","url":"build/js/AddMembership-9zn6lDzn.js"},{"revision":"320e6dcdc37b894bda4f15bb143a1d16","url":"build/js/AddItem-Bu2Sf5Hh.js"},{"revision":"647410c95dc666e804fb0002a4ebc784","url":"build/js/AddIntro-DWqeoTxC.js"},{"revision":"6e01342da856985cb6e6aa48f45c57bd","url":"build/js/AddGoal-Cd2J2d1o.js"},{"revision":"124f516145b50aa9c1cc4ccf78e848d2","url":"build/js/AddGift-B-MtzSSn.js"},{"revision":"c9c72287d29ef71bb049836994ecd2df","url":"build/js/AddComment-CBePQTBn.js"},{"revision":"19b9aaf512740d2590205e3db891eebc","url":"build/js/AddCart-DuSGROo6.js"},{"revision":"1c85c03796aefea67ec5e38b2ab1b4bf","url":"build/js/AddBills-BERaXGXC.js"},{"revision":"67b3b592513b632648d2fca8b280af6f","url":"build/js/ActivityStatus-C1OZ8-lv.js"},{"revision":"c7cd9a4f03855cbc5e7dda58228becf6","url":"build/js/ActivateSubscription-DzaK8p-0.js"},{"revision":"9e50cfaf59ca2e653ced323dc802f4ba","url":"build/js/ActivateCard-CY3yogAq.js"},{"revision":"4e9f97e6e2ccfab7d7ea8cad8c06a892","url":"build/js/ActionRequired---MfP4tB.js"},{"revision":"67cdf03575348aae457a0c8ef2395945","url":"build/js/AchievementSystem-BfHq6PDv.js"},{"revision":"fc9580233f59392386d60caacc99be7f","url":"build/js/Accountsetting-DJ-akgoE.js"},{"revision":"b489477c8bc5dd1fb9c4c11a130ed09d","url":"build/js/404-BFF_-Qb1.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"0e17b0439b99cf1f4dd2754bfc8453e3","url":"build/css/app-BD9ffeiC.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
