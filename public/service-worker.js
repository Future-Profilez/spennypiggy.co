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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"ad8fd8322a40d172cd1fceda84f9f1ef","url":"build/js/vendor-react-DXQOdZZM.js"},{"revision":"4a95d531d27a88e3bb68761bd576ff53","url":"build/js/vendor-other-DzLdQydi.js"},{"revision":"041c01868522173d658fa56dbffe87d1","url":"build/js/vendor-inertia-60HWBH-8.js"},{"revision":"f62e6cf99a5aa572e933ed5c3c0509cb","url":"build/js/useDispatch-D7-Ra-YJ.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"60d18cfb685e547ee3873d66bed44659","url":"build/js/swiper-react-BQ3rgkRJ.js"},{"revision":"e7bee1881c1d147644a05443972f2df0","url":"build/js/sortable.esm-BjX6uDAw.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"ed571c3fa798bf8f537922cadf5dfed4","url":"build/js/react-select.esm-RHHrhLOX.js"},{"revision":"2d1a913260b4becdd9a1a49ad60671a4","url":"build/js/pagination-DQZLPik5.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"a0abc2558cdb203933f1dd41efa21100","url":"build/js/navigation-1Z56ZGWR.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"92dcfdca0d1f93fe7750373354493ade","url":"build/js/index-sIErqi7z.js"},{"revision":"4f1d74708d70786b22b6a1e23b3ccad8","url":"build/js/index-rD_OrL8Z.js"},{"revision":"0df106a5f24b094a6a8a71dfce641f11","url":"build/js/index-lro5UnFL.js"},{"revision":"33e9ccafa510336ce0139f09d8e1e7dc","url":"build/js/index-U4Jtogvq.js"},{"revision":"47002f0abb957e7a3445a19390b1b71e","url":"build/js/index-Oj3FfBpR.js"},{"revision":"539fa6e7f3a8dfda031ca065182d7c84","url":"build/js/index-KteUw3_V.js"},{"revision":"3b8ded0491fe46dae614baaa2656b4e3","url":"build/js/index-DQdZhhyI.js"},{"revision":"918ba8060a80bfcd20642c5e909c3197","url":"build/js/index-DJFwa9Ni.js"},{"revision":"f8c0d9ad586caae876fcd035de3c546b","url":"build/js/index-CWHj0RcM.js"},{"revision":"f8350f4bb780e122489fe2e53a7da796","url":"build/js/index-CVSs6sx_.js"},{"revision":"2d4019662487b7dfdfe30f88dde7cc94","url":"build/js/index-CTjKadyz.js"},{"revision":"cfbe9d88d405e084eaad9965526c836f","url":"build/js/index-CSL406oz.js"},{"revision":"ad1a4f74d19887764013a751abc1af3a","url":"build/js/index-BlqY-EA6.js"},{"revision":"7808b0d1f0358082f5778b709863dd5e","url":"build/js/index-Bh-oEFKQ.js"},{"revision":"d7842966b0860348aa5e459e87a13c7a","url":"build/js/index-3japGalb.js"},{"revision":"767b1412b0245236f0cccc5ba5cc6105","url":"build/js/index-3ZdmTXmZ.js"},{"revision":"05bc7afb28f55730828d457fb5a26975","url":"build/js/index-0euaV4Zq.js"},{"revision":"7945c0d5841a2ff2af77dd66028f698f","url":"build/js/iconBase-BFD8GuVP.js"},{"revision":"c2e0ace24767db3ec776cae7107b506c","url":"build/js/floating-ui.dom-jraPaEkf.js"},{"revision":"b77c55c975b2045185bec244386665df","url":"build/js/debounce-MqNxowu7.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"19b38aa1577fb8e3048a17bb54003b1b","url":"build/js/app-P1agBm-0.js"},{"revision":"ea25a7c924592cf604bc06f2e88e9157","url":"build/js/Works-CDB1rs7m.js"},{"revision":"ba63a6c979ccf91acd2d5a6019253e5b","url":"build/js/Wishtracker-Ckr1FhJj.js"},{"revision":"1f79076abe100914fc4f3189f629e506","url":"build/js/Wishlistbox-CCJtSctO.js"},{"revision":"5666bf0916a3fe8ee52aaab6fda1e7f3","url":"build/js/WishlistGrid-BjOypmhY.js"},{"revision":"706e0d0fa8d8204c399496a4ffe0eafd","url":"build/js/Wishlist-kGIpu7tF.js"},{"revision":"cdb0aa71d45aad52e59c718764c6f6bf","url":"build/js/WhyLove-DB3_x-IC.js"},{"revision":"6c242dd0faec3e07efce9d32631ce25d","url":"build/js/Welcome-DDjbEnF-.js"},{"revision":"a3b51b192e670eb8e0cb83807eb2cd1c","url":"build/js/VipSupporters-DazFsU1V.js"},{"revision":"3859f2c5c3a3304808ce696f32e8d126","url":"build/js/VersionUpdate-DkcklW4L.js"},{"revision":"8bc79607f906206c6377cd0157095b2f","url":"build/js/VerifyEmail-D3KXXGgO.js"},{"revision":"30a1dd3594519316f6b73464f1d1e7f4","url":"build/js/Userprofile-Is_qj1ps.js"},{"revision":"3d01e4b65f6ace87a74b93211aff332d","url":"build/js/UserCarts-Bn0Yl8lV.js"},{"revision":"dd65be637ba0f44bee5389cd866af4ed","url":"build/js/Uploader-CtbH0DUT.js"},{"revision":"70726a36b4f9796e7c485dc96fca2000","url":"build/js/UploadcareEditor-BSoYx0zG.js"},{"revision":"8b8f4e83b3f560e5cfc59d28e3308534","url":"build/js/UpgradeStripeAccount-cqkYlYhE.js"},{"revision":"5a6e738e6dcb895e64f414c7766f5c5c","url":"build/js/UpdateProfileInformationForm-BMsH9z5i.js"},{"revision":"79036257b5e5ca957564976fb1df5fda","url":"build/js/UpdatePasswordForm-4FIZMGFR.js"},{"revision":"73c9fa9bd2886ba95b3e09f3b7badd25","url":"build/js/UpdateAvatar-D4qU11ZY.js"},{"revision":"d2c11d106a895835fe8b0a122005de7a","url":"build/js/USTERMS-Co1bmwuv.js"},{"revision":"f7bc8be52e59778b40a389357eb5e1e7","url":"build/js/TweetNow-Cnci1K-P.js"},{"revision":"303aab74768c204052caf0860de47494","url":"build/js/Turnstile-CF8EW702.js"},{"revision":"6a3ac9fa1c8e1e85d190b39f4d79ee01","url":"build/js/TrustBox-D2z6D46e.js"},{"revision":"47e38333d663b37116107f87905ec751","url":"build/js/TrendingCreators-Cu-n0P75.js"},{"revision":"fad310f656fd44838a1a0289b71edc32","url":"build/js/TopSupporters-DN1fnyJF.js"},{"revision":"be9579ba8b2f4636d917f71077a9ea4b","url":"build/js/TopSupporters-CNGStXYX.js"},{"revision":"787108dad0b13bde6946ca436e4e33be","url":"build/js/TopEarners-CZg-UO2d.js"},{"revision":"5682fe941852f8febc0156a71970f849","url":"build/js/TopEarnWishes-DLcH96O4.js"},{"revision":"ba67c69869a395951d4b56f12c7be590","url":"build/js/TopEarnBills-kW9I7Yc3.js"},{"revision":"4115512c5277b56c2e91ad8bde1c7721","url":"build/js/TopBar-bA3JfcEj.js"},{"revision":"87d590e1262bb21d81543d860d45fe01","url":"build/js/Tiplisting-D4KZo2S4.js"},{"revision":"b6a1003e158f188c978b89e1b42e035a","url":"build/js/TipTracker-D75I9iwI.js"},{"revision":"37b8bf1ed5a2293ab327c74f3c9e8f0b","url":"build/js/TipInner-C4OvsqgJ.js"},{"revision":"013cc8d80cbef3e40671dd60c61a495f","url":"build/js/TimeFormat-BMzBgxFY.js"},{"revision":"e31f9402d35dbce7727725355162903a","url":"build/js/ThankyouMessages-WW4DnXIT.js"},{"revision":"8401d6b22d21ceceadc75b4ce8563b54","url":"build/js/Thankyou-DZ2XwptU.js"},{"revision":"742b2e5fbf8bf0daaea2bd58da93bfb2","url":"build/js/ThankYouRye-CY8_pttZ.js"},{"revision":"4aeaec32f423dafda9c6b39ae481ceb7","url":"build/js/TextInput-BUCdogEl.js"},{"revision":"ab4cc92f12ef7732cc2d24a63947895c","url":"build/js/TestIntercom-BPTEmq1b.js"},{"revision":"504b71d53ba01fea1ec89fabebaa0e96","url":"build/js/Test-EF3oYRe-.js"},{"revision":"1cccb9cc81d7be7f2feadb8617715fa5","url":"build/js/Terms-C_cUgcHm.js"},{"revision":"948bcf8ab523817f6bda3b3800db9966","url":"build/js/TabbedDashboard-S_oqx3SN.js"},{"revision":"f1348b4d591394c6296e13aeabdf5ed7","url":"build/js/TFA-Dxte78Bb.js"},{"revision":"d326a05dabe1bdaa585ee7338db35171","url":"build/js/Suspanded-BvA2ipp4.js"},{"revision":"527063e4d34880ba45f760dcd6b50f2b","url":"build/js/Success-WRMSyvCC.js"},{"revision":"ce74c339f2da4187299a16eda1ad721d","url":"build/js/SubcriptionEarnings-wCG0g2Os.js"},{"revision":"d607ba3e41a2b9107e421466f7e5de69","url":"build/js/SubCheckout-DKJlDYl0.js"},{"revision":"55f4dcb4a8fb1d5e28bed33d797f7481","url":"build/js/StripeSafe-DBSgYLLv.js"},{"revision":"96128346e54d5f530391ddc64709313d","url":"build/js/StripeIdentity-BTsCXsN9.js"},{"revision":"b1a52f301b971aa09e5722b7ca02a921","url":"build/js/Stripe-BXW3zEjV.js"},{"revision":"1f09b27e14b89229597952a283bf1b6a","url":"build/js/SocialLinks-C8nNLnqu.js"},{"revision":"ebdda82472cf55a6c397eb47e749d331","url":"build/js/Social-Dd5BjVxX.js"},{"revision":"988832d3bafcf4b6101e8ee3be60fe14","url":"build/js/SiteSubscription-CGIslAGM.js"},{"revision":"da83a68b869e3a99d93f13528c0ad2af","url":"build/js/Show-DXcEGDnG.js"},{"revision":"8806642d0b2616ad4a82d8409da94e1a","url":"build/js/ShopTracker-B_j8gKFL.js"},{"revision":"f26c7319eab5f08a3c92738f636875bc","url":"build/js/ShopPage-B77yN_Yz.js"},{"revision":"e4750bfc6af0b7d2213d3f1dda216c8a","url":"build/js/ShareProfile-DGGtDozF.js"},{"revision":"7e5ad50cd35c61f67f1e0d2cba0af1af","url":"build/js/Settings-9BoZ1NMh.js"},{"revision":"be5cb9779c475f8785ef84ecde44d2da","url":"build/js/SendTip-5k24v_us.js"},{"revision":"bef6427835de4a378b26f34f9c4676d9","url":"build/js/SecondaryButton-CoM-G-2d.js"},{"revision":"c90ad60abef6673b2a6de3029756fbc9","url":"build/js/SayThanks-BOIYq0K9.js"},{"revision":"7e657a30131d78aeaef69d0925792be3","url":"build/js/SafeTransition-BVDyj0E8.js"},{"revision":"67c0d067b5cf1f155c91e21da3c44a49","url":"build/js/ResultsGrid-BuWOLvXl.js"},{"revision":"4f5b79763e3a03425b7e714685ab3fa0","url":"build/js/ResetPassword-DgyTj1bU.js"},{"revision":"385d41c8160db8522d1f893e4c854208","url":"build/js/RemovePost-Da5Aao_6.js"},{"revision":"c789923591688e1fc74f93559fadedd2","url":"build/js/RemoveMembership-DGmUXypQ.js"},{"revision":"98ce00c40bfa49e303f4310230b86097","url":"build/js/RemoveBill-olvV8sI9.js"},{"revision":"eca69d614cadefe3ec12975d3b8b2cbc","url":"build/js/Register-Cp0LEi8q.js"},{"revision":"0671ce031332ab2961a9243d485d781a","url":"build/js/ReferAndEarn-BQT9Chv5.js"},{"revision":"4c30b1ba600d99b0058cf50efa37dbb1","url":"build/js/Redirecting-BqeV7cTw.js"},{"revision":"7b77164751a008c7347932f76d21c32c","url":"build/js/RecentSupporters-CE7MtGsZ.js"},{"revision":"3b376e2de69c2ce0358b1a7333da78e3","url":"build/js/PwaTest-DILcK3Be.js"},{"revision":"b202cc271da33e39c489052e4945f3e9","url":"build/js/Promotions-uPpkVDCY.js"},{"revision":"10f06e2d07fabfabca458e7c39984c9e","url":"build/js/ProfileTaskLists-CLH26qOq.js"},{"revision":"76bf1ed1b84df9d5fecd797b70744901","url":"build/js/ProfileTask-Cab2fZQi.js"},{"revision":"15e02cc7860d8c7e1162a45e212b7e7f","url":"build/js/ProfileSteps-CX53iKu5.js"},{"revision":"e231f8f5edcf7d13a2f34a146835e858","url":"build/js/ProfileProductLists-uDJtsPwe.js"},{"revision":"f77ee2c677d4d7dd4c52b1df207035f5","url":"build/js/ProfileProductLists-DQm6Gnq_.js"},{"revision":"0be8c36c1f0af574a648c98180d8095b","url":"build/js/ProfileProduct-Xd9SJTiU.js"},{"revision":"1540378ce57a4726c5f1b28d5871c1de","url":"build/js/ProfileProduct-D-_AAqB-.js"},{"revision":"5c7f071daeff1e20f7d5e79f0cb58505","url":"build/js/PrimaryButton-qddooAtc.js"},{"revision":"acf6ea5d10f9786a71bee2c50e880983","url":"build/js/PriceFormat-BBoWABYl.js"},{"revision":"fac202e0b66fb3304b79d1625cd60ba6","url":"build/js/PostLike-C3sFbW0F.js"},{"revision":"ad8fea2e63d515bbb11a6d0f407e56b1","url":"build/js/Post-DX5RDZqp.js"},{"revision":"4b385727ece0b53fd77e510b8ae3e80e","url":"build/js/Popup-D1dtMxkT.js"},{"revision":"5405ec60f34dcfd3462c5b94ae52a4a7","url":"build/js/PlatformAnalytics-CODF9AmQ.js"},{"revision":"b3420ce7e3ef508124dcd5cc4a2fa934","url":"build/js/PaymentSlider-D61BplHc.js"},{"revision":"3c3ec8bf94f2b9ba504cfc41ab4b6cdd","url":"build/js/PaymentDashboard-YTlgrGqX.js"},{"revision":"fcea3241b8eafe48dc5fc6a59b947af7","url":"build/js/PaidTasksTerms-CexeNrfD.js"},{"revision":"c4890ff3aaaf78adff4fd937847267a8","url":"build/js/PaidTasksAnnouncement-C2gM1Esx.js"},{"revision":"2f4c5c0b9257b96abc714763cf083baf","url":"build/js/OrdersLists-CoTAqG5U.js"},{"revision":"2f9123ceea8717fcbd36a87deca36e01","url":"build/js/OrderDetail-DxdTzdUc.js"},{"revision":"bf9f925bc07e503932134546688921e0","url":"build/js/Order-D_MDRNVQ.js"},{"revision":"681d623c111b0309f300d73999f2b057","url":"build/js/OldSubscribe-DU0xg49S.js"},{"revision":"2f908a0da2b6d23cbbd13340cb3df4f2","url":"build/js/NotFound-pqOkoNhQ.js"},{"revision":"34f32d1be1c916685f99b166a4cf497d","url":"build/js/NotForBusiness-BainRt0C.js"},{"revision":"c6f9cbaefda51ab3c77d010a741c4a6e","url":"build/js/Nocontent-BZGD5Erb.js"},{"revision":"fb24d03b9993215f078ec5c0855b9546","url":"build/js/NewVerified-CFT6abtz.js"},{"revision":"90546ded176f523e9b4e06a11c57e9cd","url":"build/js/MyShopProducts-B_9zxYu3.js"},{"revision":"c4fbeba825c7e9c1925e89ce52d7b8ce","url":"build/js/MyGoal-DsOnSdtT.js"},{"revision":"62341942233979e715ee05648fd3ab7d","url":"build/js/MonthlyRevenue-RH2iKk5R.js"},{"revision":"00908c0a7d402e44179bd37b6cf12d6a","url":"build/js/MembershipsLists-qtN0PTIl.js"},{"revision":"0f33509318e3cf4ecf8560c264e4a8b0","url":"build/js/Membership_dashboard-BJDmxoQj.js"},{"revision":"7c3bf405ce6a3954074e513ee12705f9","url":"build/js/MembershipTracker-Cqz2Cl9k.js"},{"revision":"76ea83f072c1705a256027a837424e01","url":"build/js/MembershipLists-vueki0kj.js"},{"revision":"794abc32d7a8ec5c96de44ec28db084c","url":"build/js/Membership-C6wTr2PT.js"},{"revision":"7d52f3f1ba047594b667967b9484e1cd","url":"build/js/Membership-C6kQj80n.js"},{"revision":"78ccbe282f8faeca7e93fc947c67b5d4","url":"build/js/MemberCheckout-CNK4Wp2d.js"},{"revision":"555783ebefeec9228f2afc64dd0d1b34","url":"build/js/MagicBellNotificationDisabled-275pW-ye.js"},{"revision":"65b6a8b6794cf71632dcd8005e0c1c8d","url":"build/js/MagicBellNotification-igBGs73O.js"},{"revision":"6ef63e3f51ec407741f53b72be77044d","url":"build/js/Login-BxAxSyKO.js"},{"revision":"5e9c3fd3f1228391a5f3cecedf24affc","url":"build/js/LoadingScreen-sVSHvudB.js"},{"revision":"d919c20ab147643a220e425d7d91403a","url":"build/js/LoaderButton-DvcKX37w.js"},{"revision":"43b05c35058ad9894959ebfcaa11c85d","url":"build/js/LiveBarSection-DY-_3V7R.js"},{"revision":"00c75d05073d23065d0a2e8d86fae31f","url":"build/js/Lists-SDPQdcGV.js"},{"revision":"c310afd2b26f2a1ed5047113107a7481","url":"build/js/LinkTwitter-CcFP3dHF.js"},{"revision":"9b247c06a64d576424c563c13e2dc805","url":"build/js/LineChart-CDFPweua.js"},{"revision":"5cf1111f1a2588f8b0773afb6f502427","url":"build/js/LeaderboardStars-CMsPK1P9.js"},{"revision":"869d3920d88213c73166103002f88579","url":"build/js/Keep100-BXpBFPAU.js"},{"revision":"934bb088511d2c229bd69eab6bd2626d","url":"build/js/JoinUs-C-pT1tGf.js"},{"revision":"df3a5613628ee8e2f3e5478fb5837926","url":"build/js/Item-DhNdSCDZ.js"},{"revision":"54e7511aa9fab58711b98346749b4d1d","url":"build/js/IntrosVideos-BTMC_qsW.js"},{"revision":"fe6852da08f2d90269fbc2a8876c78d1","url":"build/js/IntercomDebug-BJVtRrFY.js"},{"revision":"6250fd24f7510d817ad55b969ca246d9","url":"build/js/InputLabel-CFYeRZcL.js"},{"revision":"7b2fe39776c0a712780a2cd8f9119153","url":"build/js/InputError-D__grXOH.js"},{"revision":"a8f988944b5033ae827748330667e3b3","url":"build/js/Index-DQRW3qmU.js"},{"revision":"35d2ce0cf3b3b83a2b3dfbaecd61f8ae","url":"build/js/Index-DHymaZdL.js"},{"revision":"f7f1233e2b1705c15c2514fa0ee78d6a","url":"build/js/Index-CWcdijE4.js"},{"revision":"81ab205246753b2f38873cf8e35732be","url":"build/js/Index-CU3h_QG6.js"},{"revision":"ee879a33b55fa1e94e7772a31153bf09","url":"build/js/Index-B23iu1EV.js"},{"revision":"82a1f43228e56a23f721d0a6e6b447df","url":"build/js/ImageGenerationWithAI-BixiYgOJ.js"},{"revision":"900c0731ff6212d9adeccde3a0df1000","url":"build/js/Icons-D39-pY3d.js"},{"revision":"c4c7475d69415dd89bc324f7d9c542bf","url":"build/js/Hero-ngRFGkTD.js"},{"revision":"504ca4b37981b777d0b40786e937da8b","url":"build/js/Header-DUcxSolr.js"},{"revision":"84d1b957f3e4d61c31ea6c36bd451906","url":"build/js/HappyCreators-p70FgQAc.js"},{"revision":"7e8cf91233e87db8a80555bcc60c4cfb","url":"build/js/GuestLayout-CofCUkiA.js"},{"revision":"dcce0ee191e0285788d0c8b4fe3d90e3","url":"build/js/GrowthTrends-Duh3Cc0b.js"},{"revision":"87da054a061ea536561d3db26515446e","url":"build/js/GlobalCheckout-BjsF1PnP.js"},{"revision":"f8ab6e46cb5e511aeaa16f1eefe81e54","url":"build/js/GifterTips-DjBzsPkS.js"},{"revision":"eb20dbc12acec4ca91082091e7936aea","url":"build/js/GifterSubscriptions-BoRwtaFg.js"},{"revision":"54cf480e11462f576b7934785b0b102f","url":"build/js/GifterMembership-BHnbuDUX.js"},{"revision":"2d26702b09b724bab4ec42ad43ebd9c0","url":"build/js/GifterMedia-BHB_T8D4.js"},{"revision":"99e3e2ff7442d13c4b614fce5fe66780","url":"build/js/GifterItems-CxIAjlTg.js"},{"revision":"64882f7d2c162f2f3f306070a3b6512a","url":"build/js/GifterFeed-DBlJn0uc.js"},{"revision":"74ff1e8d9ffab1ba0974796852cd9591","url":"build/js/GifterCardVerification-BOidGfOF.js"},{"revision":"42b600f6aa783718b965302a33695dfa","url":"build/js/GifterBills-CvbFnxXw.js"},{"revision":"0fefcaffeafede7ba26f4f2ba6506b2c","url":"build/js/Gifter-Dds5LDZP.js"},{"revision":"30315b47de657bbcfcb8f402a77a971d","url":"build/js/GiftStore-Dajc46Rg.js"},{"revision":"0478bd667c2a8207c32913be402882a0","url":"build/js/GiftListing-DIgklbGc.js"},{"revision":"dad188b5b38b60c44f38d802dc307110","url":"build/js/GiftEdit-C--GftGp.js"},{"revision":"0cb1e8845e388d890391221e3ec2a80c","url":"build/js/GiftAddCart-DGJoWjDM.js"},{"revision":"6c863a36d8da6b954cbcd1084589de12","url":"build/js/GetCart-CQoBSVi2.js"},{"revision":"57eb9b0dce5ea7835328a5fec0ed51ae","url":"build/js/FunPart-C4AP0DKW.js"},{"revision":"9b754a76b3bb31ebf14c4cbc0ab4b93e","url":"build/js/FounderProgramAnnouncement-CoK9hrww.js"},{"revision":"1cd578ec8675c627d697162ae51d088e","url":"build/js/FounderBonus-DseSD9Ia.js"},{"revision":"f10437768a83115c0904d4de1658a34b","url":"build/js/FounderBadge-DOP4cETX.js"},{"revision":"31d06c8089a904103fb07fea069a0378","url":"build/js/ForgotPassword-BkjgBlzE.js"},{"revision":"49821285c4df319fd6321ba416b585be","url":"build/js/ForCreators-Cv6O468q.js"},{"revision":"1c1fa29f9cad6ab0f73d8358644d249c","url":"build/js/Footer-B4WpWYM8.js"},{"revision":"9198da4eeb16be292cc4107c53925902","url":"build/js/FollowButton-CSHZlQQX.js"},{"revision":"75a6eed838c400c6dccf017e9b1f70d1","url":"build/js/FlashMessenger-DjFET_Nd.js"},{"revision":"7d2ede446a67494743aeeafe00baf4ac","url":"build/js/FiltersPanel-DzUWyZoX.js"},{"revision":"eb893fe3aba16234310e40a502db9d0d","url":"build/js/FeedList-C5wu6gjP.js"},{"revision":"523e647f5c5b648650fc15242a4b0a8e","url":"build/js/Features-CZJCcDJb.js"},{"revision":"546de5fe3b9d5594bf4e939f455f7aff","url":"build/js/FeaturedCarousel-CpuEqCsm.js"},{"revision":"2b91555b627d856c8dd5f354681fb56c","url":"build/js/FAQ-Cp35DOwB.js"},{"revision":"b7978b222970bd8ada88fadb9a72c9f0","url":"build/js/ErrorPage-CFgr47Jt.js"},{"revision":"2b11e5770cbb7805534329d8d8517409","url":"build/js/EnterOTP-CFy4w9_0.js"},{"revision":"b7b1b9c58ef1e59545e33b697e3f90b2","url":"build/js/EnableCardCapabilities-3loUFlls.js"},{"revision":"b7b13c8a13f48ae316b2d60837776fd2","url":"build/js/EditProfile-Ot1mB9p0.js"},{"revision":"9d4cd1f5fd21a5e5d57be7b400c33e5b","url":"build/js/EditMembership-BXt0s9sD.js"},{"revision":"7b86c7733503124324cb967f501b532c","url":"build/js/EditCategories-DP--yYFu.js"},{"revision":"b307b10f8011de2f5594cae611d4f23b","url":"build/js/Edit-DBPgHoBT.js"},{"revision":"3d04da67c86eb6e541d59be7d3d33658","url":"build/js/Edit-CdmuYWau.js"},{"revision":"abff81049bab082ead261ae1bc60c949","url":"build/js/Earnings-DhENB1ZC.js"},{"revision":"2ae552b507084e955bba9f67bf9b875c","url":"build/js/Disputes-DIL1HFim.js"},{"revision":"1448007e2dc53ca48823275145b26e65","url":"build/js/Discover-WxYXUw0S.js"},{"revision":"ee93f0255a6be97956811fb77c114c22","url":"build/js/DiagnosticPage-7F4VLeET.js"},{"revision":"11af888f6df641692bd441af29f147e1","url":"build/js/DeleteUserForm-Csl_z--X.js"},{"revision":"1a71f0c9208a33be98fccd6702511805","url":"build/js/DeleteStripeAccount-B52-MhsJ.js"},{"revision":"b9496a86143c52df6b0a08fdce3232ae","url":"build/js/Dashboard-hskR9tLI.js"},{"revision":"b07f768712cd6a5bfee18bebca2fe16c","url":"build/js/Dashboard-BxWfqgoq.js"},{"revision":"75a41859981896c4d5406455be9ce4a1","url":"build/js/CreatorVerificationNew-B8QygeIG.js"},{"revision":"0018be245a982c6da9af447ad7babc00","url":"build/js/CreatorVerification-HHZepEKr.js"},{"revision":"00a6b44a9a2430163328bd6a5beb700b","url":"build/js/CreatorSubscriptionWidget-DdRsjrqa.js"},{"revision":"d66211a26ee1d704d3cc34745066e0b0","url":"build/js/CreatorCard-CewGblYY.js"},{"revision":"2f482c54fdee5ab42ce2222aca05ecc0","url":"build/js/CreatorActivityWidget-Cuq9dfe0.js"},{"revision":"008ee8a869a0eb2e0de09f12ca1a4f27","url":"build/js/Create-D6DmTD33.js"},{"revision":"6040c6f38024a501d27e56341cdae7a6","url":"build/js/CountriesShipping-BhZQVq-C.js"},{"revision":"9298fa307264e6c3182f39b82fe0b43f","url":"build/js/Countries-n7n1K-YT.js"},{"revision":"82fe680c3a7961a0ebf4b22a5020fac0","url":"build/js/ConfirmPassword-5A7feYR5.js"},{"revision":"6542038d7dbae63b9329b021df70184c","url":"build/js/CommetsLists-BOdd01Q8.js"},{"revision":"a91c3e1925ffd0e9bac6aedb10fd4507","url":"build/js/Comment-C-6V387a.js"},{"revision":"5b588e20ff4745d2eecba5e9b86f1d25","url":"build/js/ComingNext-BnSfrpTx.js"},{"revision":"4b65bb9d502a60228105a29d87ee8d69","url":"build/js/ChartDashboard-Da8jqnW-.js"},{"revision":"d6ae66e5cacbb893872f7ae658e334d1","url":"build/js/ChangeVat-DgsmVgMm.js"},{"revision":"a44770565b4428409132487c6d664f6d","url":"build/js/ChangeCurrency-Cv4fFrwc.js"},{"revision":"7e0d64869833ac3128be9e052d614406","url":"build/js/CategoryLeaders-9FOml9MW.js"},{"revision":"285f7bf1e5f1494c8f7ee78ad48b006a","url":"build/js/CartListing-HkNR73O9.js"},{"revision":"624d23ca0aa4e4a554bb917d211f5590","url":"build/js/CartItems-BBP_G6cj.js"},{"revision":"1d626cad82366bcee0d2894df2b59ba3","url":"build/js/CartItem-jhWwpvw0.js"},{"revision":"55f4cfa3e746eb615159d4d5b8180a54","url":"build/js/Cart-Cs-uOYwB.js"},{"revision":"432e2c7ca1109e4e2a810fded04092a9","url":"build/js/BuyShopItem-C79QcFnO.js"},{"revision":"48fe4b5cee26cb66d440c38eda465ed3","url":"build/js/Board-daHhNluc.js"},{"revision":"12f63f0e1c6acc764b2332405ee916c7","url":"build/js/Billslist-B4KlHZsK.js"},{"revision":"3466aab6128dcf7a68eaebe291bb4ef4","url":"build/js/BillsTracker-XP-17TED.js"},{"revision":"dfce59fb92846ba6538b555821bbbaee","url":"build/js/BillCheckout-BJF2O7un.js"},{"revision":"07130dbe8da37b2ae6d43595c7c2c188","url":"build/js/Bill-BbEa5aAC.js"},{"revision":"0f12e979c6d3b8a6929fbebd71756f5a","url":"build/js/Avatar-D4DSU5HQ.js"},{"revision":"fcfc0bb99d070c7586aab313074af873","url":"build/js/AuthenticatedLayout-B3ILpIi5.js"},{"revision":"7dc30d600fc06d198a6a0869e417a055","url":"build/js/Analytics-DYVFgv_J.js"},{"revision":"9f3d32d5b9059361ea60edc84838d7ae","url":"build/js/AllWishes-BfutT2tA.js"},{"revision":"948b20ee172c0cad2a7a139918ebc418","url":"build/js/AllCountries-DZ4kj97Y.js"},{"revision":"d21af889d1e2aae10dfc8633ef6fbdc6","url":"build/js/Alerts-BaNUySq2.js"},{"revision":"51e30e55af3bb38f05dc775ef7e9f576","url":"build/js/AddressForm-CrY5tnlt.js"},{"revision":"f35b9232f517eddab19a5e59878de184","url":"build/js/AddShop-eji5W7CJ.js"},{"revision":"5731a902a650735d88f1621ab61aac6a","url":"build/js/AddRyeProduct-tin4qJ5B.js"},{"revision":"8233cf52b7b15481e9c5941ba4051568","url":"build/js/AddPost-Dxx86uFF.js"},{"revision":"e4b0d4d34bc8495b00889ec7eaf87732","url":"build/js/AddMembership-ChsA6Lvs.js"},{"revision":"8cb2245be4c92af0d2fbc55eeb2c877c","url":"build/js/AddItem-BRnj0SaO.js"},{"revision":"c0231bb28620b55f4a281e749d255bc5","url":"build/js/AddIntro-BEZEjU4Z.js"},{"revision":"5eaa4ce630dbb44799e3890884ed035b","url":"build/js/AddGoal-CXkc9l42.js"},{"revision":"3157b2a32380e077d4170c1947fccbc5","url":"build/js/AddGift-CDpzAkaY.js"},{"revision":"086addf996726cbf21b838aca67afa69","url":"build/js/AddComment-Cx2TuIYX.js"},{"revision":"09175dcf170abad417b2f4887ceeea49","url":"build/js/AddCart-DZThQg4e.js"},{"revision":"76c10b1579dc2f3f3ac34f6cf38090a5","url":"build/js/AddBills-C8xPNftQ.js"},{"revision":"9f50145e1ac2f6c5ed95fe36528c4ab2","url":"build/js/ActivityStatus-D6oxi6CJ.js"},{"revision":"7ff6f00649dfa56c2750cde9b38818d2","url":"build/js/ActivateSubscription-BNY-gg-H.js"},{"revision":"748172c36d61214a6f92eb9ad5d7838c","url":"build/js/ActivateCard-Buesrs0g.js"},{"revision":"a10ec5d263d1692e54b383706c164e6a","url":"build/js/ActionRequired-BUul2vO6.js"},{"revision":"e77aae8872f448cdf241962ba76169ac","url":"build/js/AchievementSystem-1-WCfm0v.js"},{"revision":"2b0f26755f4e40667ba6c0a714201503","url":"build/js/Accountsetting-HUFlqnc5.js"},{"revision":"f2853ab773ad08bc73dd04bb03ac79b1","url":"build/js/404-D4r_U33y.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"c567767aea8b8b5ef132d668994e7309","url":"build/css/app-pbinz--p.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
