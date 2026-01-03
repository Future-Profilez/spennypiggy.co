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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"c5b469a87f4830af269b2fe1f9458af2","url":"build/js/vendor-react-Cic1HMFm.js"},{"revision":"f10468da696acc3b234107eefa347092","url":"build/js/vendor-other-BrbU_eit.js"},{"revision":"839e49ba72601adc448e0456b728fef1","url":"build/js/vendor-inertia-CicFcDOA.js"},{"revision":"4e6401b6542a6b288ba284f13b2e8150","url":"build/js/useDispatch-5uUBUVlA.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"7dd5daa082c08dc85a0609e178c3ffda","url":"build/js/swiper-react-BDLdM1PO.js"},{"revision":"e6a0e0bfce6322f029cb216e4dac2752","url":"build/js/sortable.esm-B1D0Znfj.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"5991d7417a249264c16384ab17246b2e","url":"build/js/react-select.esm-Cv70LKd8.js"},{"revision":"3fce0e114272d5dcfc314f328a8c1823","url":"build/js/pagination-NxxSmbbg.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"e61a73903da1fed79526348c68fc7f21","url":"build/js/navigation-DoNFlcEe.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"1d0a4393c83073e1db9f36513e803752","url":"build/js/index-v4RG2Vin.js"},{"revision":"ce9da595c72ece7aeefce12a80b78ee3","url":"build/js/index-sWi3hJla.js"},{"revision":"201a8f20aa20dbc0de76956b882d14c7","url":"build/js/index-oo8yemWB.js"},{"revision":"596e4b08ca86ee555c61bf512207881b","url":"build/js/index-WdbN69lJ.js"},{"revision":"34840834b97f6234005d5285b906c993","url":"build/js/index-DvCHB1V6.js"},{"revision":"6ba07deca382ae573eaddc90314ce190","url":"build/js/index-DmevZ9cn.js"},{"revision":"b60ca12f66e52697db4ece390a572107","url":"build/js/index-DlKzECAP.js"},{"revision":"19d386114411f317ae84c39d4ab30db0","url":"build/js/index-D_9juTsT.js"},{"revision":"e70f4fce2d54f356832c346a06fc7ae6","url":"build/js/index-DS_w2dz8.js"},{"revision":"d86080c7bc0f37f603319f842d3b8ba0","url":"build/js/index-DS67S7V2.js"},{"revision":"2866fda5d7c6c80318be220dd0478dad","url":"build/js/index-CtNQCJqW.js"},{"revision":"042d946ec7bd56118acf6a5ac3398fe8","url":"build/js/index-CWo7XZXq.js"},{"revision":"f0d664bce03fcc93030ef7f09c63dc0a","url":"build/js/index-CEcd0VNS.js"},{"revision":"ef6c7a0ef0434c5826f33851ceef9bf6","url":"build/js/index-CCXyl286.js"},{"revision":"d427fbad4d2b75e9eb04537f45fcfafe","url":"build/js/index-Bp2q7kXb.js"},{"revision":"3be68ed70c4eec4c246e667751ad4a46","url":"build/js/index-BYDeqUSv.js"},{"revision":"5983012519483e6fbb0fa0c923d30b2f","url":"build/js/index-BQD4sETN.js"},{"revision":"7f490ca1ddd89ad95106f38d437db470","url":"build/js/index-B8Twf1vP.js"},{"revision":"ed0d87ac46f7a7b41b6e6796f823d967","url":"build/js/iconBase-OTJ_z4jV.js"},{"revision":"5a6994ecdea2a4e86281d0403a1b7701","url":"build/js/floating-ui.dom-DWTtJ2j1.js"},{"revision":"11f857d08840035c6e8004e48f82222f","url":"build/js/debounce-BwmzP3Ci.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"78482ecf45716d5833f55fc02a423ed7","url":"build/js/app-SS2OLoJC.js"},{"revision":"e7b7e0298799ceb39007ed7f6d871083","url":"build/js/Works-DIhTX6Oc.js"},{"revision":"b64d1728c0fd9c189e417dbbbf13dc6b","url":"build/js/Wishtracker-BKrVZT5U.js"},{"revision":"86079791bb3c8118c7246d17792a0e29","url":"build/js/Wishlistbox-DenL5-k7.js"},{"revision":"04eed76445a001d77f025fe6e765aa1b","url":"build/js/WishlistGrid-Dnsq8kNr.js"},{"revision":"d412532ad43971ba9de94b7eb8c855ef","url":"build/js/Wishlist-DV-e3YZj.js"},{"revision":"8f06f1c2c78d584f890bd961d3677e7b","url":"build/js/WhyLove-BM7lr0_6.js"},{"revision":"7bfceb75843fad3945cfb706115706a1","url":"build/js/Welcome-BfKZT9cf.js"},{"revision":"30026d8cd8f87145fa1c0fe0c6fe113c","url":"build/js/VipSupporters-CHqycJcV.js"},{"revision":"3a25fa5d7988c82d49f3e35084172239","url":"build/js/VersionUpdate-ClmIA5-W.js"},{"revision":"87989507ed9d638f92ffde0b178d8425","url":"build/js/VerifyEmail-DwrIpREy.js"},{"revision":"6bfa7745a5519567505257fd102a1995","url":"build/js/Userprofile-BTJkuJ4K.js"},{"revision":"dd6589d9d6cbb405312614d153bf6935","url":"build/js/UserCarts-BuLwgDi6.js"},{"revision":"4107f98c15de3cdca52879fa574a6593","url":"build/js/Uploader-DMW8rEgH.js"},{"revision":"723e67cf73a099e9994ada224a26dc26","url":"build/js/UploadcareEditor-MQJLkQs_.js"},{"revision":"c3b3c18e6d21134a4b7a0a0902f84e43","url":"build/js/UpgradeStripeAccount-DSV6VSmL.js"},{"revision":"2344f1274ceca89caabbdcb0011435b5","url":"build/js/UpdateProfileInformationForm-XFcvO2Br.js"},{"revision":"7eaa54e25492f82fb2be6eaf5122d673","url":"build/js/UpdatePasswordForm-BvM8YDvi.js"},{"revision":"93573ae8f62c16000ab6ec9f386f95bf","url":"build/js/UpdateAvatar-BEp_tt52.js"},{"revision":"0709863972a2ddd8010e899e52460f7d","url":"build/js/USTERMS-CL0Yiyvq.js"},{"revision":"a5e54955181f34f5c5c0da83f46dd499","url":"build/js/TweetNow-CKpNleCo.js"},{"revision":"e64465cf5ddcea1f4563adc01a061983","url":"build/js/TrustBox-DfXkaXsW.js"},{"revision":"73828702a8c026c25d00d6f1cd45f71b","url":"build/js/TrendingCreators-D1Nr-Nxd.js"},{"revision":"67af34889da4ebb7c562a9601cb2ccc0","url":"build/js/TopSupporters-D5fOD-HB.js"},{"revision":"452743de21b71019ce6278c0b8ca8a31","url":"build/js/TopSupporters-B6vUflm5.js"},{"revision":"b8808619c4f9da24997ab9c69be49507","url":"build/js/TopEarners-BBzreK7w.js"},{"revision":"c282c54eb4761c71be73647e032c0d72","url":"build/js/TopEarnWishes-CpFEKn_A.js"},{"revision":"a58849a0960337566a43bd600dd89d10","url":"build/js/TopEarnBills-Drlczefm.js"},{"revision":"edf7bc95f50e2e5dac1f3d8ac96aad9b","url":"build/js/TopBar-CiTYpu--.js"},{"revision":"3f41a3cc7fb34a5c30a0c6a44aa57aba","url":"build/js/Tiplisting-D-lrcyyd.js"},{"revision":"5f485afdaaf34fed591ddf6b2f85cf8e","url":"build/js/TipTracker-ceE6zMLB.js"},{"revision":"9039b2db63bf98fe2e0fafd0c14b4c09","url":"build/js/TipInner-ABSNl1HU.js"},{"revision":"4ba2a19b4d637444459ffcaf3c7f8041","url":"build/js/TimeFormat-B94VEmXA.js"},{"revision":"7d8888532450a2a413dea04748f4bb96","url":"build/js/ThankyouMessages--ZAMI7HV.js"},{"revision":"bfa1a38827dc039113a43cb4d2d5b1c1","url":"build/js/Thankyou-NgxjumRk.js"},{"revision":"3f252fdea8739a413496e50d278136a6","url":"build/js/ThankYouRye-BxalcEcA.js"},{"revision":"6e895bcbb5d587943737fc339fb4f14c","url":"build/js/TextInput-ChN8CKlY.js"},{"revision":"eb47e4ee66ce10ff7b33a7046215a9ad","url":"build/js/TestIntercom-SDc3g-XR.js"},{"revision":"cecb090f4da572f1b903e84a66479828","url":"build/js/Test-Ch5ySDG7.js"},{"revision":"414e389631eb4c8d00f23a9e2d9446bc","url":"build/js/Terms-BsNGbFtH.js"},{"revision":"8bce46435db34ad9d372570c068e2b95","url":"build/js/TabbedDashboard-cJXkj6gm.js"},{"revision":"04e69afb1298bbd63b5b89e530d6ad9e","url":"build/js/TFA-Da2R3tLK.js"},{"revision":"da649d8c872ec4e34888a3733a2611ac","url":"build/js/Suspanded-BpyiTsad.js"},{"revision":"c164ebbef9d7ef6cd4b7c59df1bca079","url":"build/js/Success-CPDAQvDw.js"},{"revision":"8e1c0bd6187e895802594c7b7584b45d","url":"build/js/SubcriptionEarnings-BGUHpZbY.js"},{"revision":"6392f5eb6c57d8d459f11c96406aa042","url":"build/js/SubCheckout-sNir0eRE.js"},{"revision":"dbd001fc9d75b2b5b5a9ce24acb721e2","url":"build/js/StripeIdentity-Cff8Ah5J.js"},{"revision":"635f0639f9cd3fe5eb3810781b88a2db","url":"build/js/Stripe-Bp4WLgWg.js"},{"revision":"350ec07196fe0729fe963c18390bb8ba","url":"build/js/SocialLinks-CoOxylRr.js"},{"revision":"984505b335c785d2bbf57b933507b4c4","url":"build/js/Social-B6JOIHgM.js"},{"revision":"5de18c29b97606e53a5f3fafe7ffe558","url":"build/js/SiteSubscription-jIkPx0og.js"},{"revision":"40f44a3dc877593fdd567eb31b8bf5f9","url":"build/js/Show-sbjEYvuX.js"},{"revision":"a3d3ae1a51ab3e5229e2e0c2032a34e1","url":"build/js/ShopTracker-b9vINg3j.js"},{"revision":"79626ad31f2eafd4f7726ddcc764d56e","url":"build/js/ShopPage-b_oQcSuj.js"},{"revision":"d0fba136af87f77e1380ac96ca8fef52","url":"build/js/ShareProfile-UtA6pqUl.js"},{"revision":"52c9c7ac59a44bfec8761466e81d586a","url":"build/js/Settings-Bz4DVQaS.js"},{"revision":"de9ddbda866c96a49287fe5059dd7bc1","url":"build/js/SendTip-DR1O2mWq.js"},{"revision":"a7b56655ff29fb12f1197df937d78b12","url":"build/js/SecondaryButton-BqEDaO-u.js"},{"revision":"c209ae03cb1b2c04174b99b9c51bc1ec","url":"build/js/SayThanks-D8iB2bdQ.js"},{"revision":"0ec917a91a5d53ebfb07175cf7454d98","url":"build/js/SafeTransition-BCvo-u7R.js"},{"revision":"6793b65e94b9c6a1c36d17ea4bf8c758","url":"build/js/ResultsGrid-CWiA3XeG.js"},{"revision":"710547ebc3ba5ffeaae2703441840634","url":"build/js/ResetPassword-D0-p1-QQ.js"},{"revision":"7b38c693ca36a77ac723412a84be8f99","url":"build/js/RemovePost-CLPvyE5o.js"},{"revision":"c2b44ae11c07a56a9c20a5fafdffba26","url":"build/js/RemoveMembership-BXiqrs8D.js"},{"revision":"398418281108e33faaf5fd40713c3f59","url":"build/js/RemoveBill-C6fW2MDy.js"},{"revision":"c77d6fc589c261ac8f4bcc7ac3de0c33","url":"build/js/Register-D2V8L_x6.js"},{"revision":"b107caca0e5e21ef8b2a092b337a0a75","url":"build/js/ReferAndEarn-D88x-vuc.js"},{"revision":"1ee885fb2035f489101d20707e5dc564","url":"build/js/Redirecting-B0kt40Oc.js"},{"revision":"f63913b56a355f818c9f183b4358b431","url":"build/js/RecentSupporters-2-ARnOUH.js"},{"revision":"cc364f2c7fd04b84700d25bcf92fd3af","url":"build/js/PwaTest-DzfYjrIZ.js"},{"revision":"fbf5c1562fc286951f1c307f910514d8","url":"build/js/Promotions-BR25eyMk.js"},{"revision":"e66478a7c0973dbcf5e96f1527db17f0","url":"build/js/ProfileTaskLists-Cm8DTSF3.js"},{"revision":"fbb1c72a1633d31be2b0346cd6907e86","url":"build/js/ProfileTask-BJd7SY3q.js"},{"revision":"73c21ea3103869ad98dc7ec14c93588b","url":"build/js/ProfileSteps-D-2ZvX5k.js"},{"revision":"8499ceaa7a8b4245a5b835606a638ac8","url":"build/js/ProfileProductLists-DBUdVl1k.js"},{"revision":"5bd8c1d91e9ce275aa21f9b2abe762db","url":"build/js/ProfileProductLists-C_lBgLnx.js"},{"revision":"76b4ec4ee9fe1f750e07ec333d794eb0","url":"build/js/ProfileProduct-CvNYfGfi.js"},{"revision":"090e4e3dfae16d6ebf5a55114da274c6","url":"build/js/ProfileProduct-B6mosPal.js"},{"revision":"84cc9142922b1243177314c18036590b","url":"build/js/PrimaryButton-DakmhzuL.js"},{"revision":"e199e4f37b1ba18423eaad285b1f03d8","url":"build/js/PriceFormat-DlbLP7-N.js"},{"revision":"39b97d7c7602eca98be49964bf2665b1","url":"build/js/PostLike-B0VtkChP.js"},{"revision":"52916171a05c2caca0cfa6062930b2a2","url":"build/js/Post-DYzvcQkp.js"},{"revision":"e6780361877c4c3dcdbc8c0f801f36d5","url":"build/js/Popup-DT4m4WCN.js"},{"revision":"8d8510629befd2b26594cefad6cc9137","url":"build/js/PlatformAnalytics-B-bC20KC.js"},{"revision":"cd61167f33c0f6c586e84b1a87e8cbce","url":"build/js/PaymentSlider-DFM-rQZL.js"},{"revision":"385564e92c400a4e2520935192822a87","url":"build/js/PaymentDashboard-CykzyHoV.js"},{"revision":"6ee36825dac1c5525d5699218d4e85a3","url":"build/js/OrdersLists-DOfdhdaI.js"},{"revision":"8035d02099d75b2341187ec82e4847db","url":"build/js/OrderDetail-CbFL82GS.js"},{"revision":"1123c0284676a2c7af0b19aa28cc19fa","url":"build/js/Order-DDejkLi_.js"},{"revision":"296404e3d0923400165cae78ef14dea1","url":"build/js/OldSubscribe-CPB6lFci.js"},{"revision":"fc8a022275f21f063c1d07238db80321","url":"build/js/NotFound-C-dUzjCk.js"},{"revision":"b424d12b520ea9a973e437160dc05c98","url":"build/js/NotForBusiness-B4fSlkFH.js"},{"revision":"5dfcf1e1dfa890735bb26a2a281d9beb","url":"build/js/Nocontent-B_aDS76Q.js"},{"revision":"9fb740e0130d82f9a748a6869799b930","url":"build/js/NewVerified-DGdJQefj.js"},{"revision":"311f5ebbde19a377d2c4191ffb596ee3","url":"build/js/MyShopProducts-CZaHgVjq.js"},{"revision":"f8a7926375a4ddd17aaf08999904dca2","url":"build/js/MyGoal-Dq7xG3XC.js"},{"revision":"a91b2ae8a642ea7e545264b89d604f36","url":"build/js/MonthlyRevenue-CBQrbEgi.js"},{"revision":"16d5b6aecc312a09514285edbfce222b","url":"build/js/MembershipsLists-BwJNqeM6.js"},{"revision":"9c3e0c26f22668864a1edc1bb23b35ea","url":"build/js/Membership_dashboard-iTYjf8yZ.js"},{"revision":"6aa69642dba45ea34b660bc9a4d1ed90","url":"build/js/MembershipTracker-Dd18vrTe.js"},{"revision":"72d31cddbac4a66b2cdfbbf1a8d99e7d","url":"build/js/MembershipLists-DJ1IjXS1.js"},{"revision":"3f0be9922b6a64bdd0a71a31ea1a63a2","url":"build/js/Membership-O9kATwgJ.js"},{"revision":"aaf920aebc2df8efd896057c0f01653c","url":"build/js/Membership-DDv-Wniw.js"},{"revision":"5f14cf53f429941a7739285a1bb3706e","url":"build/js/MemberCheckout-CllH17nL.js"},{"revision":"d2efdd584604561afdaa704de2e11d0b","url":"build/js/MagicBellNotificationDisabled-DnfDzSdb.js"},{"revision":"b6fd9fc63b8033573ba9b0a6322640a1","url":"build/js/MagicBellNotification-Chv2ODWf.js"},{"revision":"02a6e691efe8f6f91db1c0377731bd12","url":"build/js/Login-F0yM0X9o.js"},{"revision":"0466b29edaeb8fa335a4e826b5efc638","url":"build/js/LoadingScreen-r1uN5DX8.js"},{"revision":"ec74b0504d184b1b9ce3ee57407712c0","url":"build/js/LoaderButton-CZjvu-vn.js"},{"revision":"f76b9ea2ef8e1c1ec9950125b1114b79","url":"build/js/LiveBarSection-D-7h7tB1.js"},{"revision":"535e397cff3e92fb47662d35c04ffbb5","url":"build/js/Lists-03IOSmhC.js"},{"revision":"eb193e1a7431011ed74d41c6767f613c","url":"build/js/LinkTwitter-B8w_LDnb.js"},{"revision":"df2117d1846d8133c0948169c1846ff1","url":"build/js/LineChart-CSREMgub.js"},{"revision":"ae5a127c79d8f861a2dad2561c213ae8","url":"build/js/LeaderboardStars-D-NiCzR0.js"},{"revision":"90be4490598b71035932253acf83017b","url":"build/js/JoinUs-HS7BA39q.js"},{"revision":"4d348cffdd34cba584b1475581b6fd0e","url":"build/js/Item-BcrqNfbP.js"},{"revision":"f5e11f2010f37c14c0ae16ed4567badb","url":"build/js/IntrosVideos-B8gStq-k.js"},{"revision":"7e74f0439a650bd9d16fb5883e688712","url":"build/js/IntercomDebug-f2Qglh41.js"},{"revision":"dd9b1fa5cd5a670624ee5e6f126be1e9","url":"build/js/InputLabel-CBVJgYe1.js"},{"revision":"93c91ff64aa3b4051b40ec397a679e1e","url":"build/js/InputError-DxeXtwNp.js"},{"revision":"731c1aa7061e5b07a67e366536262a82","url":"build/js/Index-V2ICoBI8.js"},{"revision":"a235262cbe3a1c6c1e37c1da168686a9","url":"build/js/Index-D3YFkOlm.js"},{"revision":"4d65fbc0b7c95e69a2cc11b574de5335","url":"build/js/Index-BsaJUpZT.js"},{"revision":"d57a8c34af0f1c6befecab6a0d347508","url":"build/js/Index-B31bWOtM.js"},{"revision":"6efe68685c913e8e85f4815fa6583fe0","url":"build/js/ImageGenerationWithAI-DsDl16NP.js"},{"revision":"a1ced4e3a5fdb44354314d6cbe8d6221","url":"build/js/Icons-YjBjXQw_.js"},{"revision":"3d8e6ecd32841a7b6dc04d65e93f0490","url":"build/js/Hero-M32FLRpZ.js"},{"revision":"2891876e8fb63b4beaadd976f9765962","url":"build/js/Header-Bh1Qw6KN.js"},{"revision":"a71951512218cafbe31d092a5bd47182","url":"build/js/HappyCreators-D4XMhtGb.js"},{"revision":"e1567bf560c85bd5c84da44873436c67","url":"build/js/GuestLayout-DXWYxQtJ.js"},{"revision":"f02dd40f0ee4a4c0bdd69cda0dda6e29","url":"build/js/GrowthTrends-C4H31JFc.js"},{"revision":"9262fb3e0749ebae2b90b2dc59024558","url":"build/js/GlobalCheckout-2icwAUCf.js"},{"revision":"3fcff2ecee25f49aebcf0e41a1146c9d","url":"build/js/GifterTips-Mj11yLIX.js"},{"revision":"88df2302052f0c803fdcd9432ac6d355","url":"build/js/GifterSubscriptions-CjTFvL_A.js"},{"revision":"fd2fdd35bc313e7a99f94720da04c144","url":"build/js/GifterMembership-DLdqAOd3.js"},{"revision":"c8383bbf95e91c79d39224c427406ea1","url":"build/js/GifterMedia-DLgL7zsD.js"},{"revision":"adea6f7c62af5b7e5156d041a99f564b","url":"build/js/GifterItems-pdjQjir2.js"},{"revision":"7f4c2d2535572098a3f44d1691e5c45d","url":"build/js/GifterFeed-Bd9MOFSj.js"},{"revision":"5337acc2b0ab7b1e4d0b9c85354d6143","url":"build/js/GifterCardVerification-C9-Af427.js"},{"revision":"339679119291403ab1ccf9dc3e6b1889","url":"build/js/GifterBills-Dr8qqbqK.js"},{"revision":"27eb6f9ce60da8d670684838d79c02d5","url":"build/js/Gifter-BCv0B7JA.js"},{"revision":"77295f48a11f3510f4b0b1f3746740b8","url":"build/js/GiftStore-BctHMXf_.js"},{"revision":"a00e11a1e57f7bd4ca1976552c130c99","url":"build/js/GiftListing-DpnBAQ-p.js"},{"revision":"fc2ac0d6939b35397d563079e8f72f66","url":"build/js/GiftEdit-CMrR29Sd.js"},{"revision":"4723894b41ebc7f37ea3d2453ea18457","url":"build/js/GiftAddCart-nyDe-cQy.js"},{"revision":"6251fef01a34cb188475646e07356c90","url":"build/js/GetCart-C3oQBtRD.js"},{"revision":"56bb7c76cf2a98c6d39f7af6757c7865","url":"build/js/FunPart-CNNNl0W6.js"},{"revision":"04f55070a75fc691a925d2377cafdd12","url":"build/js/FounderProgramAnnouncement-Gfhtomli.js"},{"revision":"765a62c68918a2135e4ec43024d51ca5","url":"build/js/FounderBadge-CbtDMkVC.js"},{"revision":"13feaaecfb51f66daa8d7ff39dfd8b8d","url":"build/js/ForgotPassword-C18SlHET.js"},{"revision":"d2f221d874fc3c2a6ccb615623742675","url":"build/js/ForCreators-AlyC8MX_.js"},{"revision":"8d92c3a818447cf24aab2073bcacbc98","url":"build/js/Footer-DPkOkVzi.js"},{"revision":"3a0c54f55f0265a83ecbc6f3cca7f629","url":"build/js/FollowButton-BLl-Fgtc.js"},{"revision":"8c6a726a2c6355e6e982c257a43aa818","url":"build/js/FlashMessenger-CacnRjd8.js"},{"revision":"ece5c3f1cbdcb9d405987cf2dd0b20e5","url":"build/js/FiltersPanel-Cu_Ya6Kp.js"},{"revision":"f70455026bbd257d7ee5cd8e1aae6e31","url":"build/js/FeedList-Bh-fPZoW.js"},{"revision":"b53ae7bf55b1c0ef94d04cbf0866a0a2","url":"build/js/FeaturedCarousel-BqZgeo6q.js"},{"revision":"aa1c7f3f11b72a84a9f010f28d03190a","url":"build/js/FAQ-DxoxEUr3.js"},{"revision":"8be6dc2a29894608f2b38644e07cf0e9","url":"build/js/ErrorPage-DzabdEfY.js"},{"revision":"81611a942a20bef2a0c2ff8cd9e902e8","url":"build/js/EnterOTP-CJap8McX.js"},{"revision":"61a21778f49903e718ec8edcf11fd3f3","url":"build/js/EnableCardCapabilities-2tG-ggv3.js"},{"revision":"b3ea53ac6178cbaa8be63298c82b38df","url":"build/js/EditProfile-_hfKfW8V.js"},{"revision":"86a1f8483a1ff1bce601581f1962e695","url":"build/js/EditMembership-D9MnVReM.js"},{"revision":"0b9b03af7d31c4ec91a00acffd9e6194","url":"build/js/EditCategories-DeKmVCXp.js"},{"revision":"c5067269ebb467bff9a7a0fc71968928","url":"build/js/Edit-CYD1r1yI.js"},{"revision":"7925d4ab14a90bd73cb767b413a8381b","url":"build/js/Earnings-CiSBkBS_.js"},{"revision":"623e4fa376c2d4c1b637baaab819d39a","url":"build/js/Discover-aW3BAwBr.js"},{"revision":"7a6d877ca965fbeaeda946f601e8d8ef","url":"build/js/DiagnosticPage-Dr_lm3xI.js"},{"revision":"00376d477df49b2a46164c688bb80173","url":"build/js/DeleteUserForm-BTm7w9iv.js"},{"revision":"db7c07afc927ccd26b36401f7f2164f7","url":"build/js/DeleteStripeAccount-CJq0nf60.js"},{"revision":"d8159bbe2a4124494b8e2f8749bfbbda","url":"build/js/Dashboard-DDK4ieqm.js"},{"revision":"6d23daca32f6b65494d99523b694e9ea","url":"build/js/Dashboard-CQv_wlaP.js"},{"revision":"2ef5ea17cdb9e1ab24a38daeda2b0cf4","url":"build/js/CreatorVerificationNew-iQxWXfDk.js"},{"revision":"90978a0aedc0108d88f0a08e1138852c","url":"build/js/CreatorVerification-BvZSVE6x.js"},{"revision":"92a9ec31bb462ffb3f4a61bb2cbc8bca","url":"build/js/CreatorSubscriptionWidget-DL8xksye.js"},{"revision":"7e261b42702dc650814886f8f9b9ad76","url":"build/js/CreatorCard-BaKHV1dy.js"},{"revision":"f34271f387bcc43f2c6df67241d01c14","url":"build/js/CreatorActivityWidget-q8NXUjpN.js"},{"revision":"8870a6f5b8fd36c1b3ae20e1f89d3265","url":"build/js/Create-C-gLgSpY.js"},{"revision":"5f7af897d2443bdc3df7e3a14d9763f6","url":"build/js/CountriesShipping-DaYmNHjS.js"},{"revision":"746433c957c31b7793a32a04f284f4f9","url":"build/js/Countries-CQYGjTfQ.js"},{"revision":"4eb10e2b9da615efe0b83e41edbd1c71","url":"build/js/ConfirmPassword-DOPMKyN_.js"},{"revision":"d4443f4f56997ce60900c24d5c800352","url":"build/js/CommetsLists-tr-2fSyy.js"},{"revision":"f635a052651ac7e180d2451a7d18e75c","url":"build/js/Comment-CzleMQjV.js"},{"revision":"cf7ef38babc8cc27b4b0bfa5b4b65b1a","url":"build/js/ComingNext-DCtZDI8B.js"},{"revision":"a47e043b9b6c9a210b9323076407cc08","url":"build/js/ChartDashboard-DNMRYWd8.js"},{"revision":"ae2f52e01d0868394f74205266ff2230","url":"build/js/ChangeVat-B9judw81.js"},{"revision":"a53cfdbd4d35e03760bd42024f492638","url":"build/js/ChangeCurrency-mLnbn1F8.js"},{"revision":"e0c5d5dea627c5576124b61fe35f8aa9","url":"build/js/CategoryLeaders-DQjJY2xM.js"},{"revision":"cbd431d9200cd43b13d0e3ba23aa8c38","url":"build/js/CartListing-D4v78zVg.js"},{"revision":"846b59815f97aca866698b688a2a11f6","url":"build/js/CartItems-B8rTG1mn.js"},{"revision":"99d7c0d2449ea65582aced690fb092d0","url":"build/js/CartItem-Dp1tD47E.js"},{"revision":"d336287b9dad3876e460bca6f0278aae","url":"build/js/Cart-DUQ1vT3p.js"},{"revision":"cd804655ce93b1528b7d645a858b9753","url":"build/js/BuyShopItem-DmiDLiQh.js"},{"revision":"e2d98e55d6286954bc86f6a627c3c8c3","url":"build/js/Board-5sCNmaM-.js"},{"revision":"d6ea7c8a6dba0b06e13e59779f9072cb","url":"build/js/Billslist-cs5TQxcv.js"},{"revision":"32155d1860919e2503342275c6f4c783","url":"build/js/BillsTracker-B5FmraBq.js"},{"revision":"1b5c3bfe920e5b35ee788242f55e19ac","url":"build/js/BillCheckout-BBYcSLQD.js"},{"revision":"b2a4bd2faf71519463a096d793790cfa","url":"build/js/Bill-Ce82L_nG.js"},{"revision":"124777647996e0fb509326e4aef39887","url":"build/js/Avatar-DxIxIY9e.js"},{"revision":"2c0ce08d0c411c45520301545e9dc740","url":"build/js/AuthenticatedLayout-BQZH1VCr.js"},{"revision":"a0af635bd57941aae5545a0afbb391d3","url":"build/js/Analytics-Jb_TmKRh.js"},{"revision":"3e566098d513f321b67c2cea7f188a91","url":"build/js/AllWishes-CiskNqa_.js"},{"revision":"c05fa663f10ba383182a7527f5ec3e4d","url":"build/js/AllCountries-CJJcPvSA.js"},{"revision":"b017d1a89d61ea43cfe3ff8c6d36ed49","url":"build/js/Alerts-Dd0aV0mm.js"},{"revision":"e7df30f79398a3f4deb129eba31aa2c6","url":"build/js/AddressForm-CphP2Ib2.js"},{"revision":"803d987b4855cffe703a39c84b6651dc","url":"build/js/AddShop-DZfMaBKq.js"},{"revision":"b0bf46da500c1d9d22b11acb55f379bb","url":"build/js/AddRyeProduct-BMkMmFDu.js"},{"revision":"e0e503ff02da6d1d6b6604ae6aa3a112","url":"build/js/AddPost-BMV67bu4.js"},{"revision":"54115afac432489e9d5cc3f1746bb6af","url":"build/js/AddMembership-CK8kyQrJ.js"},{"revision":"0ffee073b65c1d5bfeb2d6ad68c46d7c","url":"build/js/AddItem-CHFbbjz8.js"},{"revision":"aec98c671cf7f07e8d24fe813a83ff24","url":"build/js/AddIntro-MS0W44sJ.js"},{"revision":"62a9cd7cd4bc4adc39dd9d8e25f24c48","url":"build/js/AddGoal-DkaxxAWd.js"},{"revision":"ac8fe8519c7954c8f047ad203b6e8450","url":"build/js/AddGift-g6zY7p46.js"},{"revision":"12d50cd492e64f1f3948ba0d602ad3c6","url":"build/js/AddComment-4pJxwEpu.js"},{"revision":"70c3b288e868782c30d8ef2b7c07e1e0","url":"build/js/AddCart-M0wY0-Zv.js"},{"revision":"4dab8985e645133f39860fa04fa99038","url":"build/js/AddBills-BuLym6yY.js"},{"revision":"f38484c981c82305130a4f8e27b8f216","url":"build/js/ActivityStatus-gQb6z___.js"},{"revision":"5a2280531ce132948a3cabe15e47cc6f","url":"build/js/ActivateSubscription-CcuZqNt3.js"},{"revision":"c9406e84f521365d0f7c4a96893cffb4","url":"build/js/ActivateCard-B-y_iku3.js"},{"revision":"dfe27d3d82b7931b96ff10e4bba83832","url":"build/js/ActionRequired-BGOVJ_19.js"},{"revision":"73577aac9885f0da7fa5229146c6e022","url":"build/js/AchievementSystem-BnjosYrW.js"},{"revision":"b39db13a41dcd517c42dc941d82c5895","url":"build/js/Accountsetting-_Ag0rtIF.js"},{"revision":"721d4ca8acb8802299bc0d192ae69082","url":"build/js/404--SRZJ3M_.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"7a2e8692a7e710560cc38880890662c8","url":"build/css/app-BJH9dQLK.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
