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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"39d69c4aae3eb71cac881f04a7352342","url":"build/js/vendor-react-CQTSBB0C.js"},{"revision":"31d29ad2ba98aa69256185b85323d822","url":"build/js/vendor-other-Do43uU1Z.js"},{"revision":"0255d45e34dd769f17f98c7c00bd7bb7","url":"build/js/vendor-inertia-CbrcXY52.js"},{"revision":"795237abb9e13c0c87c06f18f011160a","url":"build/js/useDispatch-CWba8Q0F.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"4068e8de3b090cf5d01b7eb2772b31de","url":"build/js/swiper-react-4Oha7S_a.js"},{"revision":"245e46ddfc0c6782a105c765eb2813f6","url":"build/js/sortable.esm-CB0To1b3.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"d8bdcacd387bd48dae80d370dea63971","url":"build/js/react-select.esm-COrEJf2t.js"},{"revision":"43a2ff2dff334c140aecf11ff605eaf9","url":"build/js/pagination-DSSIKpn-.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"b477188cb35ac0e9b3cbd522a02cb643","url":"build/js/navigation-BLqWoGDl.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"6774168e5d9883fcea25eab985a48635","url":"build/js/index-xiygsaC8.js"},{"revision":"735a7546ccd689480e2c0d87fbc6b4ee","url":"build/js/index-pbb2WQqZ.js"},{"revision":"4095155f4f44e38d9599332d14646d6d","url":"build/js/index-liyhEXJu.js"},{"revision":"b6e8cf05207a532ee3aa0d1442c6c5ca","url":"build/js/index-Va8ViyQO.js"},{"revision":"3f5822c59a00b7390d903d50177775e0","url":"build/js/index-JKhBa4LU.js"},{"revision":"e77c3ec29c354d23c10e4219605e0ca2","url":"build/js/index-DuJcj4Wr.js"},{"revision":"ae0157be58e95a91855e3402cf2304cf","url":"build/js/index-DoEHJ5YM.js"},{"revision":"4b6456dc73298ef7172ec215a1ee9553","url":"build/js/index-DZTfGvyr.js"},{"revision":"675ce8d38fe4984c81b772548d8693dc","url":"build/js/index-DXzyAcfp.js"},{"revision":"2a652372f21f3794a622ddc9fa17ef64","url":"build/js/index-DC2RaRC_.js"},{"revision":"5e5a7f81017554618311a5dd67f1e71b","url":"build/js/index-Cgau7EAJ.js"},{"revision":"651e111aedcf9cfe3908716761933c87","url":"build/js/index-Cfv8-BnN.js"},{"revision":"b853cd0cabbc96f903c24f0788582428","url":"build/js/index-CC-yjJcl.js"},{"revision":"bcac6897657688b48db8770203af2173","url":"build/js/index-C5L_nJhl.js"},{"revision":"93666738d1ff9c45a0a12d053a192356","url":"build/js/index-BzpZNvBi.js"},{"revision":"d4aa4d11a04f2e0cbd6b8a8d2990650b","url":"build/js/index-BPpeOJZN.js"},{"revision":"024ff35e6045e17b5ec55888d1936fd5","url":"build/js/index-B1jLR3Kc.js"},{"revision":"f73073aed5e46ea41c4c51b74dc1a97a","url":"build/js/iconBase-CqQawuZ4.js"},{"revision":"ee6a20c4a554001b3dba157b707802f4","url":"build/js/floating-ui.dom-DRbkkagK.js"},{"revision":"188ea764fcbf0c113f19a46dc692f071","url":"build/js/debounce-B045DFY-.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"ae7fa4aba6854a768b56060a065fab47","url":"build/js/app-BqIkQ15V.js"},{"revision":"3085a7eec41cd6bb820f6f101d7d772d","url":"build/js/Works-BBWDevY3.js"},{"revision":"0f0dfc9dd79b73cda1679706d3a34808","url":"build/js/Wishtracker-CRYnKgfl.js"},{"revision":"73a6e7a87d8dde38c9f8becbc81a0652","url":"build/js/Wishlistbox-COzwr8dX.js"},{"revision":"16f1b333c15b47d4e12aa55d475a1b95","url":"build/js/WishlistGrid-Cm7g7url.js"},{"revision":"f11ebd617e4977782e167b91a8f21598","url":"build/js/Wishlist-B50moLHA.js"},{"revision":"ef83e718007062e2f973b533e38519ed","url":"build/js/WhyLove-Bv20rpGg.js"},{"revision":"fb80babec992df048cd39fdccf08216d","url":"build/js/Welcome-DhyiQY51.js"},{"revision":"3e1730a9e823060cd10b78b04a409ad5","url":"build/js/VipSupporters-Bl9FX8It.js"},{"revision":"acab09621a2277bae4cc2c52c848a951","url":"build/js/VersionUpdate-CtQSdqW9.js"},{"revision":"516f630eca60f2040c97831d84414c23","url":"build/js/VerifyEmail-pV3a_311.js"},{"revision":"f13738897fbac4b94e4c84e4c8f78276","url":"build/js/Userprofile-BO09p2Qy.js"},{"revision":"2555d5ec5e7beed9e854b6dfe14615d5","url":"build/js/UserCarts-B89N2IHP.js"},{"revision":"c69461804589553da87cde29d1485fc8","url":"build/js/Uploader-CgIPdy2T.js"},{"revision":"b88e8c6a10e1870c128ed1dfc66b5ad5","url":"build/js/UploadcareEditor-gnYBZVSq.js"},{"revision":"695bf151e61842f3624fb8a3942951f2","url":"build/js/UpgradeStripeAccount-MlC39WQG.js"},{"revision":"9e6be8f9bd24e4757e10a435623ba841","url":"build/js/UpdateProfileInformationForm-UKw4Ztdk.js"},{"revision":"b1091aa96fe66373d9d684f5ca56805f","url":"build/js/UpdatePasswordForm-DhdImXEv.js"},{"revision":"4a86b1150d8fde46ace0f7f43f1f25ca","url":"build/js/UpdateAvatar-B2GsLzUQ.js"},{"revision":"5519f559a296627e55ec54d5f1206da9","url":"build/js/USTERMS-Deuu8_O0.js"},{"revision":"797057f3b9db8096aa686690f745c5e2","url":"build/js/TweetNow-00AZoWKV.js"},{"revision":"537f5359b659f371716421328889681e","url":"build/js/Turnstile-BqIs6zhZ.js"},{"revision":"87e29e88aae9ae019f8f4a1dd719e6b2","url":"build/js/TrustBox-BK_c3kgt.js"},{"revision":"836c4c9bd15ea815036847557f251b26","url":"build/js/TrendingCreators-CLgeHlo0.js"},{"revision":"3dcab6cdc161027ff2f85835e5e06dce","url":"build/js/TopSupporters-NvBvQxuQ.js"},{"revision":"36ee3a18ee196e41a9a9674452e69940","url":"build/js/TopSupporters-DS1XMmiB.js"},{"revision":"ad5d23d8b3bda75166566cb802b62f31","url":"build/js/TopEarners-BYGUrkFA.js"},{"revision":"63408a90938ab2240ebf97052e3b667b","url":"build/js/TopEarnWishes-JBuhwfBT.js"},{"revision":"9ba08a1656a65bfad0b3247d22b081e7","url":"build/js/TopEarnBills-CcJI4PbA.js"},{"revision":"d5765b35d7da9305a11249a244d7974a","url":"build/js/TopBar-D6enrVdJ.js"},{"revision":"576ee903d89958d0405663e21d6940e7","url":"build/js/Tiplisting-D5hkSwqs.js"},{"revision":"ef32183350efc26b6858f855a334ce92","url":"build/js/TipTracker-PtjDpezS.js"},{"revision":"a8655fd82e0ac2d58e3e0216f79899fa","url":"build/js/TipInner-ClwQBt9w.js"},{"revision":"cd777eadda45b7423f3db44541f13acf","url":"build/js/TimeFormat-BIp3-9j7.js"},{"revision":"68fb5fe3d2be8da55cc8b0b9473145aa","url":"build/js/ThankyouMessages-SwEMpV7A.js"},{"revision":"08f3891b353c956e6fd6b065be613864","url":"build/js/Thankyou-BXK0WFqp.js"},{"revision":"4b6059f3bb970a0ab6fe3c6d1df5f45d","url":"build/js/ThankYouRye-BEBkNH-5.js"},{"revision":"0ecaad0dcae42132111e3c5ecc7153db","url":"build/js/TextInput-CdvWRJQ_.js"},{"revision":"20a8a8ba70f286444e779087b1437a19","url":"build/js/TestIntercom-BbIopJsv.js"},{"revision":"381b09a2ec6d42fa9a2cf534ed2487a2","url":"build/js/Test-CiORaYnR.js"},{"revision":"2f09ccf812fb7ccffe13e980464b6748","url":"build/js/Terms-CdpszAxV.js"},{"revision":"bd8c92d9790867c209817c2996fe0d45","url":"build/js/TabbedDashboard-B4xZSEBK.js"},{"revision":"3f46da0357df4a0016294a1ca12d1b14","url":"build/js/TFA-DN-nymex.js"},{"revision":"2c25cfbb6dd59c1c109ec8b4f6330f13","url":"build/js/Suspanded-tjEYLoJP.js"},{"revision":"5de1994b4edece5f75afd48ece26c4ff","url":"build/js/Success-C1Dz28Ap.js"},{"revision":"693316293608845ea30a7fb1faa9315e","url":"build/js/SubcriptionEarnings-Bhxp91F7.js"},{"revision":"1c0c020f9bb36b38857452424171530c","url":"build/js/SubCheckout-CEtk7hpq.js"},{"revision":"105f3ea74c4eaea2c944e4f9f082c433","url":"build/js/StripeSafe-Bq_2hwLS.js"},{"revision":"c30071da457de120348abc12b64779e6","url":"build/js/StripeIdentity-U9RM6xnQ.js"},{"revision":"dc649caa29c798bb85fa5da9697ae3bb","url":"build/js/Stripe-Dr6BlUl9.js"},{"revision":"7a1535800227f55d1262edd2681ab0a6","url":"build/js/SocialLinks-C96XoqW2.js"},{"revision":"adbc3b30118685de95041474c388f823","url":"build/js/Social-CIHIdBzw.js"},{"revision":"943c5aaedb42170298c3371a2c36ff44","url":"build/js/SiteSubscription-Bl4rFkM0.js"},{"revision":"774aa387c40549a070e455cc68689a7d","url":"build/js/Show-Clk9KIsM.js"},{"revision":"b1133b858d236ffb82b842ea5bafd410","url":"build/js/ShopTracker-B9T1DeXN.js"},{"revision":"2380153cc7f4a1745be936ba9f58ead0","url":"build/js/ShopPage-BUyG2ZAw.js"},{"revision":"edca68cab5ee104e245595295b869134","url":"build/js/ShareProfile-D7OvPOJp.js"},{"revision":"d6bde48a0146ee4bee4942ada33efaa2","url":"build/js/Settings-C85q3hkR.js"},{"revision":"2ac2c8f951cbd293f391e45eaf2f052e","url":"build/js/SendTip-hSaYtddH.js"},{"revision":"764316b3a36bb5f2f8ad0428c38a6118","url":"build/js/SecondaryButton-Cp2Xswef.js"},{"revision":"dca0335aa220fd10b00510bb41851758","url":"build/js/SayThanks-DcDvxn-Y.js"},{"revision":"3c10548beb2809fdcee6df212eca0fa7","url":"build/js/SafeTransition-CdWS0xgE.js"},{"revision":"268f3aab9ca63b11b9fee1d4beea82de","url":"build/js/ResultsGrid-C_101cQv.js"},{"revision":"6474e6b6800cabbee68049fe738dd31a","url":"build/js/ResetPassword-DpRjxq0c.js"},{"revision":"10df06d5b0d9779bbe9c1f8fcd9bc675","url":"build/js/RemovePost-xNSflDt2.js"},{"revision":"4d7ce70b9eb18af2b563aeac0cc1f76d","url":"build/js/RemoveMembership-uONbb0OX.js"},{"revision":"f3fea66a270c5a94486c2978306861c2","url":"build/js/RemoveBill-CAmwiDD6.js"},{"revision":"d07947fe9eb65c702495e01c46fb93c8","url":"build/js/Register-D0YYr_Kj.js"},{"revision":"43a8c73460b0f3d71b8059350430b7dd","url":"build/js/ReferAndEarn-B190LH_V.js"},{"revision":"75858fd8e5cbd08dd3c1d0288f4f84e9","url":"build/js/Redirecting-BNNpxnRF.js"},{"revision":"57d72187648ceb4dbf6551f76d4da07d","url":"build/js/RecentSupporters-ChfGOxcn.js"},{"revision":"f8047ebae815cc4bb5ae4b94ab583f42","url":"build/js/PwaTest-BqL0RixR.js"},{"revision":"d58d17b2b9ad142b00bbc7e55ddbaa9f","url":"build/js/Promotions-DIP4aJcx.js"},{"revision":"c54e11070d192abb41051a409e30e867","url":"build/js/ProfileTaskLists-x13As_mk.js"},{"revision":"dce553060b55459b1f0c04e75ab36ffb","url":"build/js/ProfileTask-Bzxez6pV.js"},{"revision":"59b092b91c369dd0569ce31cd63b5395","url":"build/js/ProfileSteps-DA30QaJJ.js"},{"revision":"ef26ad725c248263ad4cfb9bddbd2996","url":"build/js/ProfileProductLists-mseiPGSl.js"},{"revision":"fbf86f6d6159dd903519086c835694dd","url":"build/js/ProfileProductLists-BcZxnvU_.js"},{"revision":"5958ffe391f85647cece2a397a0df8d2","url":"build/js/ProfileProduct-Dyhp1mHa.js"},{"revision":"84f9e3c38e223d3d3284103f4a4f60ac","url":"build/js/ProfileProduct-BuyM78uP.js"},{"revision":"afd5afaeb1dbfa83a23acd38d808b50b","url":"build/js/PrimaryButton-DrqbnIUK.js"},{"revision":"19daa459d4be777b51f603543354ab94","url":"build/js/PriceFormat-mtFwoCHZ.js"},{"revision":"4a144f0cf16809b9cc505bd3d06fca39","url":"build/js/PostLike-u49qPQye.js"},{"revision":"a9b9a7a6a90eb5d64d27d907bf6ae1e2","url":"build/js/Post-wsTPx6ZB.js"},{"revision":"d4c1022bfc608b87115d0dae1ea33531","url":"build/js/Popup-DT5YohMf.js"},{"revision":"afe501a851ef38e02d33339cb535e12b","url":"build/js/PlatformAnalytics-Dq0aTAv2.js"},{"revision":"e44d5bd76712e920aebae4dc12c909a9","url":"build/js/PaymentSlider-Bva6GdGS.js"},{"revision":"064b11378736d148e7246c9d43a49ff2","url":"build/js/PaymentDashboard-Dii2a8N4.js"},{"revision":"461581e3d26bd2347a1da8a830a86d20","url":"build/js/PaidTasksTerms-DEGIrMIq.js"},{"revision":"b6dc2abdfe3e898e34d1335a3ce5996d","url":"build/js/PaidTasksAnnouncement-BqexEjk3.js"},{"revision":"860c80c366eabcb19ca9d683c6ad4244","url":"build/js/OrdersLists-CE0bNELy.js"},{"revision":"a876774c7c128dd3cfeb569ba24c3329","url":"build/js/OrderDetail-D48wQ7Zw.js"},{"revision":"d687ce9f14f62f340c7ff71406222a73","url":"build/js/Order-BS0TWP2w.js"},{"revision":"810a95d82d86fc771973947f020388b7","url":"build/js/OldSubscribe-Ce02Lv-v.js"},{"revision":"d855c3e1838842a8efa0312da406576c","url":"build/js/NotFound-DQielyYe.js"},{"revision":"03e87076a6d377e0c2d1d79f10fc6504","url":"build/js/NotForBusiness-DfrcDtS6.js"},{"revision":"d456de3bfab34736dc9d04a0f326913f","url":"build/js/Nocontent-Be5AWHmy.js"},{"revision":"9fbaa5f2375a3498aeeb06f4d0ef8fa3","url":"build/js/NewVerified-B09hChJt.js"},{"revision":"1af43aa118a4e662213e7eb1bf0330ce","url":"build/js/MyShopProducts-BlRA9liY.js"},{"revision":"f2e776bd47725c306b46cbaa3c2bba62","url":"build/js/MyGoal-Eu9T-Igk.js"},{"revision":"f88c8b5f9d1d9047573672084c4d8aa7","url":"build/js/MonthlyRevenue-CRBdzRf1.js"},{"revision":"24e525fd48bf0622f1f29feba0076414","url":"build/js/MembershipsLists-DoD1y2x9.js"},{"revision":"4e2655e234459ba67be9096434a16e80","url":"build/js/Membership_dashboard-BS-yr7HX.js"},{"revision":"bdf43f27a41ea48aab5bdf1e845cea2a","url":"build/js/MembershipTracker-AvISkmg_.js"},{"revision":"ae1aac3ee4ddb2953569b5db16fee0fa","url":"build/js/MembershipLists-DRRNgt64.js"},{"revision":"85f44020ac1febe15fa725c59a557361","url":"build/js/Membership-C4tNwSfX.js"},{"revision":"9726d4126911bcca512a7dbbcc629185","url":"build/js/Membership-BSsj8Xen.js"},{"revision":"3b704c1ceeeaa143a9a21b54b7eafd48","url":"build/js/MemberCheckout-BMI0HVPp.js"},{"revision":"2436e22d1a9babc89a5b5b9fccc7565e","url":"build/js/MagicBellNotificationDisabled-B4B2GaDm.js"},{"revision":"ff9fcfd1a523043836445ca824939469","url":"build/js/MagicBellNotification-Bfx7ks4S.js"},{"revision":"db82eeafbded2afbcb9d2a5d713085fc","url":"build/js/Login-BKUpDGRp.js"},{"revision":"b0c6d59846becc9a8bfb2d3056bbc62d","url":"build/js/LoadingScreen-D_c779YW.js"},{"revision":"8d8f977bd0b003b3109a89d5d62ab6d4","url":"build/js/LoaderButton-CUlJPfmN.js"},{"revision":"6902d17f0c0ce4f0454f55d55e50262d","url":"build/js/LiveBarSection-Snx-ulQf.js"},{"revision":"3eb2d326a603761eca11dbe6ddcdcc21","url":"build/js/Lists-AZDyr_Bn.js"},{"revision":"c822203b5c53a7a96088e0326f02d521","url":"build/js/LinkTwitter-Xu4hpQbl.js"},{"revision":"322781f89d2a194218791a3b949a93ef","url":"build/js/LineChart-DNBtyrAd.js"},{"revision":"07d33a710a0e4f2df9666c734b88211e","url":"build/js/LeaderboardStars-20Cu-lRx.js"},{"revision":"da299cc3504eff26af4b5d2208dfe7a0","url":"build/js/Keep100-O24LopDC.js"},{"revision":"039d4e781426bde5ec800acd541043c7","url":"build/js/JoinUs-Dspmo_GG.js"},{"revision":"d12f591ff65d16e28d56850291a0ed01","url":"build/js/Item-BTvy8g5x.js"},{"revision":"d3f18dd96596424a2e2a148c35c02324","url":"build/js/IntrosVideos-BP8sEMG9.js"},{"revision":"6719647079cb3aa29bc86dbd18d2922b","url":"build/js/IntercomDebug-C2wWmp74.js"},{"revision":"9a01c8022bcee67ba28d1186980009de","url":"build/js/InputLabel-CNz7i8rs.js"},{"revision":"74b972d2752b8150c2cdc25f59fd70b8","url":"build/js/InputError-BJBOi1mb.js"},{"revision":"4021dae1b6288ac6f6054ca50241cdf2","url":"build/js/Index-D2bGs4OJ.js"},{"revision":"e765a805224d5790d140b2fd5c66eb17","url":"build/js/Index-D0Y4wohC.js"},{"revision":"f4908d1a38931cb3fb6f7f8d73b999fc","url":"build/js/Index-CAHJpdvZ.js"},{"revision":"e3bcb4be692e442f1db4f4dd5ae4e771","url":"build/js/Index-BK88JRnG.js"},{"revision":"4e6638fe00951c4ca62ae3747226b4f1","url":"build/js/Index-BBOGGIY_.js"},{"revision":"eb87136b911f46c0b78fedb2447d6ab0","url":"build/js/ImageGenerationWithAI-BJGZH6Vq.js"},{"revision":"21dd828a6bf28ceb93a7b4f8c0961938","url":"build/js/Icons-BqSyYLLB.js"},{"revision":"6f19aeca0fd49098b4a96c4d5950f570","url":"build/js/Hero-DGJ7_Vln.js"},{"revision":"cf6c187b497024c1f6914104904585a9","url":"build/js/Header-C91PNzHw.js"},{"revision":"dac9ca73fc3f57726ae0a1e1441a336f","url":"build/js/HappyCreators-BAhqX2mD.js"},{"revision":"2ba237b6f41bafe10e4f382f7fba219c","url":"build/js/GuestLayout-a1UiGkiY.js"},{"revision":"af70d49f8813b1881b9d5867c7cb13d4","url":"build/js/GrowthTrends-nrQTfhta.js"},{"revision":"ef1c5902ea0076b583fe25987fed0967","url":"build/js/GlobalCheckout-CYKSdVIZ.js"},{"revision":"95f8fc68abb32d80b7c562d8a47ea232","url":"build/js/GifterTips-BH2_G0gy.js"},{"revision":"5f59a608a0527b10048ad7ac8678f164","url":"build/js/GifterSubscriptions--vCFas7r.js"},{"revision":"9b10079d1c7822ee73328fcb6f3c2f6a","url":"build/js/GifterMembership-DWZ2m9VX.js"},{"revision":"d19f129135668de9da512a7c48743e1c","url":"build/js/GifterMedia-Cxm8baR0.js"},{"revision":"16745a650a747c4b461ad966fbb294d9","url":"build/js/GifterItems-BtVKog4Q.js"},{"revision":"25bc47bd6a8ceb19d8b5915c840fefb0","url":"build/js/GifterFeed-Bb0-2wkC.js"},{"revision":"a13de032294f351ad7e04b9523b77cd3","url":"build/js/GifterCardVerification-BiYEtsxy.js"},{"revision":"3d810aca13bb07dfe609c94a7c58d9ff","url":"build/js/GifterBills-DyCAMRgQ.js"},{"revision":"0e80f943b7258b8c70528575cb8d386a","url":"build/js/Gifter-DwLEtPmF.js"},{"revision":"2bbd2937e6ee4919b3020d28da101302","url":"build/js/GiftStore-Baw0GKx3.js"},{"revision":"f7c0e44d83e1a447824d86d87407faaf","url":"build/js/GiftListing-BhiOanQq.js"},{"revision":"83555117962586c2de677f4601965be5","url":"build/js/GiftEdit-CS9TxnX9.js"},{"revision":"59f651de2e2a7716d04fd3f4f582427c","url":"build/js/GiftAddCart-B6q2-d18.js"},{"revision":"7675c56c916d5608aa7cc904496aa4ff","url":"build/js/GetCart-C3IdmeuD.js"},{"revision":"32aabc7e038354fa88cc376ee2afecd3","url":"build/js/FunPart-DfqFDypt.js"},{"revision":"1d5cf8cba3ac24c23600b6d52bb7e0dd","url":"build/js/FounderProgramAnnouncement-C6zO4lfX.js"},{"revision":"f1003583dae4fb90c12692e718337c62","url":"build/js/FounderBonus-Bj3CNRWU.js"},{"revision":"ad9a7bd8fbf5c013c3fca164b7921a69","url":"build/js/FounderBadge-BUzqp6nN.js"},{"revision":"21dba7325db2f83ac6d06206025700a6","url":"build/js/ForgotPassword-B-0xrvYh.js"},{"revision":"eaad7c924dd1fe9af30bc426cb08c75a","url":"build/js/ForCreators-Bw1moAb0.js"},{"revision":"cbb451e547c2bb4374e2822a449826c5","url":"build/js/Footer-gjtL2D2_.js"},{"revision":"3894ade742c4c9a32e5419102a9edd83","url":"build/js/FollowButton-tiy_Ikxa.js"},{"revision":"223423fe4c0946878780f96879a41081","url":"build/js/FlashMessenger-DHGQ6jst.js"},{"revision":"24fcc81e483faeba735028d4c42cade6","url":"build/js/FiltersPanel-DuEUrL8d.js"},{"revision":"348220311875921e28e49473d5ebc55c","url":"build/js/FeedList-DRMCbHhF.js"},{"revision":"29788a63734399c5e93ebf5aec35329e","url":"build/js/Features-LQVpj1Re.js"},{"revision":"ea86d60b3b4ead74a7f57c488240265a","url":"build/js/FeaturedCarousel-CusG6Uod.js"},{"revision":"af07c599f18082e5e674acad2de2636a","url":"build/js/FAQ-p2bk04U8.js"},{"revision":"4c6f7f5f03722cc1df91d745b958bd7c","url":"build/js/ErrorPage-C64OnTfr.js"},{"revision":"74c2fdde603167c9198b184ec1e0aa15","url":"build/js/EnterOTP-C57c5TGt.js"},{"revision":"f844f6517ed4a5f29d6b6262446265aa","url":"build/js/EnableCardCapabilities-CnnBgu8v.js"},{"revision":"2757dd94c24f30b9772623e08944adac","url":"build/js/EditProfile-DSnA9wfQ.js"},{"revision":"ffe566a289f6923e4d53f97e09999861","url":"build/js/EditMembership-CvqceAVZ.js"},{"revision":"d82fbe65bb8080124fb39c7f71b67cba","url":"build/js/EditCategories-vZBqNC6g.js"},{"revision":"bc0f3be0b2e326fe2329fa6a78398d9b","url":"build/js/Edit-_ABaBEyW.js"},{"revision":"e77bd7a512369f11fe009ca4a333002d","url":"build/js/Edit-BfoWd9et.js"},{"revision":"3b8c2c887f18413080c917f537559dec","url":"build/js/Earnings-DIT0TqSQ.js"},{"revision":"b9125c02a48e95f32fa817f31efc7f17","url":"build/js/Disputes-DiDaJpWr.js"},{"revision":"a316af1d0d1187227478eead1d3f9908","url":"build/js/Discover-CiMf5amR.js"},{"revision":"e09e51be4b7c5072660a83f4e699f45b","url":"build/js/DiagnosticPage-CT4psx2d.js"},{"revision":"ed246fe3726a416d793f6fc7d8c0ad1b","url":"build/js/DeleteUserForm-BYsEIVpf.js"},{"revision":"7303e7ef293fcc9a5ae8953d08f687c5","url":"build/js/DeleteStripeAccount-qSKJ-UJE.js"},{"revision":"7969c87d14a5572d0999b9cc49eb3ca4","url":"build/js/Dashboard-C2yzDw7V.js"},{"revision":"a7c13de82a13458c6ec1907ad4cb5ac4","url":"build/js/Dashboard-Bbeh2uK0.js"},{"revision":"8aeb2cba061550953ae989319976f995","url":"build/js/CreatorVerificationNew-zhHI9VpB.js"},{"revision":"83a9024d109da8b0459317dd19523f7e","url":"build/js/CreatorVerification-M-WinoXF.js"},{"revision":"43fbdc546e3c85d662085629f04797b1","url":"build/js/CreatorSubscriptionWidget-CseW8HRG.js"},{"revision":"3b1322ee6de5d09f1d16ab88ab048998","url":"build/js/CreatorCard-B9OJkH__.js"},{"revision":"de5060cc9426df62532e59ebdc435aa7","url":"build/js/CreatorActivityWidget-BuQpIQEf.js"},{"revision":"a5e1b75f5b1b0b528b78badc42d2b868","url":"build/js/Create-DYUv1G4I.js"},{"revision":"d36027964955e3ab82c8ec21a619ed77","url":"build/js/CountriesShipping-D-q5Rwy5.js"},{"revision":"f7f0ba37199167021801a6bceab1ce62","url":"build/js/Countries-C6AJ9qUf.js"},{"revision":"4297e4a5504e50caabee1dcc26bf5e2d","url":"build/js/ConfirmPassword-BP1-_lhT.js"},{"revision":"887a8fa3f94f9d861befd04a07d11e1a","url":"build/js/CommetsLists-BeHQ8Emh.js"},{"revision":"0217f54ac0d275cde2c25c7d177179b6","url":"build/js/Comment-DENieTXL.js"},{"revision":"57ad6ca47c9b6213834d68a3ecc7111e","url":"build/js/ComingNext-nGZs9A73.js"},{"revision":"42cdff017da3fbe4b83a01a8ef048636","url":"build/js/ChartDashboard-CdeNQxcY.js"},{"revision":"1aec97f47e501b1654e4d3a8ac13e990","url":"build/js/ChangeVat-C8go7ulj.js"},{"revision":"23e8bf7c57659df015992a1a56a68535","url":"build/js/ChangeCurrency-CybULzG-.js"},{"revision":"b186c906decff0d6ced38081508f5c9b","url":"build/js/CategoryLeaders-BrSkbwr-.js"},{"revision":"04ae74ea8aaef462c8d2e55aab65442a","url":"build/js/CartListing-CMFhwedz.js"},{"revision":"1db8e2472e8ab94d86c22454e073ade9","url":"build/js/CartItems-CR89XZiV.js"},{"revision":"89a230ca2a63be87571c9ee7868ebbc1","url":"build/js/CartItem-CACfqdpM.js"},{"revision":"8a6689ca2f1f94170d1bce4c3813624c","url":"build/js/Cart-vUS_yzFh.js"},{"revision":"eb1e40d7255dc99e89f6fe5de74357db","url":"build/js/BuyShopItem-BNBr0PwU.js"},{"revision":"c119e1b14654fc57e7e533ec643a75e1","url":"build/js/Board-Ou83VpR_.js"},{"revision":"590c0f3b4cb9d39ff2b0edf69992255a","url":"build/js/Billslist-BXOAs9yW.js"},{"revision":"fa03f4e9344248fe7f009b8d571873c6","url":"build/js/BillsTracker-BlWSX-vc.js"},{"revision":"721486bae75b675defe172dd513dbd92","url":"build/js/BillCheckout-BGjjeLqt.js"},{"revision":"c1247619aa75e67f9d2c33b9d9d2303a","url":"build/js/Bill-BCSbvZqj.js"},{"revision":"4ed6f1c73dc82116075a6ad9f9756ed0","url":"build/js/Avatar-ClpMnCib.js"},{"revision":"ae9aa6a3203efe2481588833720dae4d","url":"build/js/AuthenticatedLayout-DTWbTfz_.js"},{"revision":"88ed9e4ab6317cc1649cf0e5dd4230b4","url":"build/js/Analytics-Bu8Vw3Fw.js"},{"revision":"4e2013f9a6b21c0b8bcbd4b95875c265","url":"build/js/AllWishes-CQ_jhMBO.js"},{"revision":"cae31a6325f3f1c22d50b2082acc87c6","url":"build/js/AllCountries-vQvFe6cT.js"},{"revision":"27971fb5aaa7bc90f0eb02450bcb20f5","url":"build/js/Alerts-Bc4o155A.js"},{"revision":"45ab093949a16e7c853030c8de379f26","url":"build/js/AddressForm-CxCQQxep.js"},{"revision":"1d1c99c738294db01be3a7b997d045aa","url":"build/js/AddShop-nAoUwapZ.js"},{"revision":"01372938933131e8c35e2e25eacb7335","url":"build/js/AddRyeProduct-CBNW2de9.js"},{"revision":"38c36d87b36b0cc47a2d7f1d2371cf3f","url":"build/js/AddPost-I1qSfiSi.js"},{"revision":"95ac2678aa3e3ea20eb9ed94d3ac1855","url":"build/js/AddMembership-CyyfBSjC.js"},{"revision":"3f4508555630875a15c4d4a089b0d572","url":"build/js/AddItem-cLe-PS5z.js"},{"revision":"e1f15eda7593a35a167d2d31719e7f2d","url":"build/js/AddIntro-D9AtGiZ0.js"},{"revision":"88ab1f894d457c3d48316b7ce1852b5b","url":"build/js/AddGoal-Ig4n9lif.js"},{"revision":"7cb10c7ec9e171b5b875d5f6bd950ae0","url":"build/js/AddGift-Cfl3uP-D.js"},{"revision":"2d50296841c8d70db1aef30264c2dc3f","url":"build/js/AddComment-TW0vTTv4.js"},{"revision":"8a224e342b5352468ceda72ba3cad3d0","url":"build/js/AddCart-DQ7Ca2OF.js"},{"revision":"7f4738536e0b40783592937105a3a500","url":"build/js/AddBills-BOj_6Cmk.js"},{"revision":"560b79e325f54a6897c68324fd1097cf","url":"build/js/ActivityStatus-BCZwWt_a.js"},{"revision":"9d3bb56734d9d3bce48e5583b0771581","url":"build/js/ActivateSubscription-DMJVR1tE.js"},{"revision":"179d06c3603574d3f466f7cb53e2e63d","url":"build/js/ActivateCard-Cg3W5LO6.js"},{"revision":"f32f4ab4adfca1db2c84f926ae5aa106","url":"build/js/ActionRequired-CcFNOSxW.js"},{"revision":"b344e404557bc9a5ac51bf8966f8cd2e","url":"build/js/AchievementSystem-C_XG82Vh.js"},{"revision":"010a11d1c56171b63ea91937ed219c89","url":"build/js/Accountsetting-lYM2Fbzd.js"},{"revision":"385f7f12a2e3f6a76ec3b7d7988c581a","url":"build/js/404-CNYJayMX.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"7897fcaff6c8f517df1c3da1c4297907","url":"build/css/app-YP9P32EJ.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
