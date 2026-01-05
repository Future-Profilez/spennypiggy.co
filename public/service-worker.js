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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"672a816005cc04b94e0af7352ff4bc48","url":"build/js/vendor-react-BdIP2M-d.js"},{"revision":"35957bc830afc060bbc9af2d7528697b","url":"build/js/vendor-other-COK6P_VF.js"},{"revision":"37233bd814799d525dddb031ce7365dc","url":"build/js/vendor-inertia-DAYZjRQa.js"},{"revision":"1809c3eb34656c0e73802c65d5d3a626","url":"build/js/useDispatch-B_4l9osg.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"2047cf751d6448da68413524bcd624c2","url":"build/js/swiper-react-C2r58X96.js"},{"revision":"1301419c123c0e2ed2794834e644fc47","url":"build/js/sortable.esm-gQOZ00to.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"f6b89df42d18f4ce49e3fef3db462730","url":"build/js/react-select.esm-BT9nxh1W.js"},{"revision":"a000bd85fc58174a70fdb565db559935","url":"build/js/pagination-Cl3KAKQR.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"5f2e90f8f1a18a47e9ba23b9e3eeec8d","url":"build/js/navigation-DXnqc4s4.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"b304476688a10cb052b7da9a2bcbf5dc","url":"build/js/index-v5o2LFvN.js"},{"revision":"935acd9393549cf2dae63908064b4119","url":"build/js/index-Z6FpQnNI.js"},{"revision":"1eb2a28a1907ee4cd24a34a2b7e8e475","url":"build/js/index-RCufYxTf.js"},{"revision":"f5c85e977dd5b7c908b2958c52e16b08","url":"build/js/index-Dc3fjsvB.js"},{"revision":"155b902b608299362f0950649a8f020a","url":"build/js/index-DYSnArK2.js"},{"revision":"32ac1c79bb68be841339f0478e4402e5","url":"build/js/index-DQuMAraU.js"},{"revision":"f780fe590cf4b444479a8323e54d1682","url":"build/js/index-DE_Wo2u8.js"},{"revision":"40a1a43a20e506cebebb6d41640160f3","url":"build/js/index-D6GihXAb.js"},{"revision":"bde8c2afc03dc5c6a41c9aae464f4ae0","url":"build/js/index-CljOezly.js"},{"revision":"9c2f5a4accec84460dc4e9be031215f8","url":"build/js/index-CUEi96jP.js"},{"revision":"8c25a26f2c154bb7d9c65a45afd044f2","url":"build/js/index-COOIY-0q.js"},{"revision":"482d43be8bcf65898d6ef3a3b1e04216","url":"build/js/index-Bmssdjj-.js"},{"revision":"882f4687ba6bde966d287141b4d900ee","url":"build/js/index-BiusXvhL.js"},{"revision":"461043853bccfa128eafc13d6a4a4242","url":"build/js/index-Bh87PzfF.js"},{"revision":"882202648787b78690bd63c8b4a881ed","url":"build/js/index-BdAUZ6wV.js"},{"revision":"c32bffa128923e0b3be1202ee6673fcd","url":"build/js/index-BVizvcsc.js"},{"revision":"d5faf4c0a5147a12c828de62524dc3cb","url":"build/js/index-BLZkxrQp.js"},{"revision":"ed2d2d448d466fb95a350200dfa1527d","url":"build/js/index-BCMK15eq.js"},{"revision":"2ea366ff68783aa5176c26f174d753cd","url":"build/js/iconBase-B5pH8exa.js"},{"revision":"64dda9bcd861aa8af1fa8b0018ecaa1e","url":"build/js/floating-ui.dom-Chu7V4Gd.js"},{"revision":"3e6b06c4ef121e48eb07eec8c14fd843","url":"build/js/debounce-BlA5xJn9.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"919f73f03b7b00db7c1bfa56def48d2c","url":"build/js/app-Dcz4jwj4.js"},{"revision":"006ef968f669ff13cc2d7889e744d859","url":"build/js/Works-BviNWlQY.js"},{"revision":"83bb1c7c7429c0b04fa2a185dc8da321","url":"build/js/Wishtracker-OE-wav_g.js"},{"revision":"c5efaba74d6fdbb1fed18593ef8fea43","url":"build/js/Wishlistbox-DXSUdXWB.js"},{"revision":"3227b30f0925f0676368221278209f3b","url":"build/js/WishlistGrid-C6szc2bL.js"},{"revision":"617e994cbbf09bf32329c0a4cf94dd57","url":"build/js/Wishlist-Dgs2iVin.js"},{"revision":"61be239e9960c224fa7ae6ddc38d8abf","url":"build/js/WhyLove-Cm-Q79Dw.js"},{"revision":"4848a7b09f6c5ef0cd3009a71ddc1a2f","url":"build/js/Welcome-CVeXo_NI.js"},{"revision":"1ba0bcf149feac509394970924aaf405","url":"build/js/VipSupporters-bJDkzHrx.js"},{"revision":"aa36060871d27541a1c02199bf49f9e2","url":"build/js/VersionUpdate-DPAuODPl.js"},{"revision":"9b1b5879acd55817597541fa954571f0","url":"build/js/VerifyEmail-CZYOGCKS.js"},{"revision":"077b48098560d2e854f13896c342b342","url":"build/js/Userprofile-CGFaoKqh.js"},{"revision":"8fe86602b150c5bb46fa38e4158b0100","url":"build/js/UserCarts-CcHREUVw.js"},{"revision":"890176a4d0ea36e68594c6ac468b894e","url":"build/js/Uploader-TJvKfEpd.js"},{"revision":"f9a03028895885ea6d6f4c0edcb5cc01","url":"build/js/UploadcareEditor-C4j3rBiH.js"},{"revision":"3a6116a4a06f75ff352f553b9727c529","url":"build/js/UpgradeStripeAccount-BSoi94iV.js"},{"revision":"8db483004ce07c11e3aa77dab43dbfbe","url":"build/js/UpdateProfileInformationForm-DPtcwTJG.js"},{"revision":"c767ffb3b275cf635b0a3d4a779c2bd4","url":"build/js/UpdatePasswordForm-Bh8m49ph.js"},{"revision":"8b3aa617459be272fa100d54747915a8","url":"build/js/UpdateAvatar-D_h1J29X.js"},{"revision":"175017b9af4b01825642db275c7e88b6","url":"build/js/USTERMS-Bx3rBDPf.js"},{"revision":"aeb465f71b15e987d8397310c221826f","url":"build/js/TweetNow-D80DnvTp.js"},{"revision":"ef7f150edd4b791134480a61946c7a29","url":"build/js/TrustBox-tqR-xQVj.js"},{"revision":"6b916b2930971770061f41d2586017c5","url":"build/js/TrendingCreators-CQzQ5zz1.js"},{"revision":"6ca437eb6e0d20971cd683f82f3f45c4","url":"build/js/TopSupporters-DHq1N4G5.js"},{"revision":"c1db3aa773b2ab397d98b2d9ccc73d3b","url":"build/js/TopSupporters-BzZ1I2jp.js"},{"revision":"abfcf315fa21976b5fcf373ba6110c81","url":"build/js/TopEarners-CzD1vptR.js"},{"revision":"fa41a0b6b015d82cc9b4bcbeaf425ff2","url":"build/js/TopEarnWishes-CPupwmmp.js"},{"revision":"0e5e79031b3999b608dc6dde4d736ff9","url":"build/js/TopEarnBills-pRQR2l0i.js"},{"revision":"948ab5ce5621303caeb23b117ef23ba4","url":"build/js/TopBar-CL5NDnck.js"},{"revision":"12298b6d19e15849e00823a9b9b4772a","url":"build/js/Tiplisting-Dni1f2Mp.js"},{"revision":"e4c0c68ebc74f4a14221af90a2b6a317","url":"build/js/TipTracker-CtvOiwcX.js"},{"revision":"cd17bda02d558a6c5ef79f8e6e6e87a1","url":"build/js/TipInner-siU_OlDd.js"},{"revision":"eb84411e038d75489e09b05b6b1f986d","url":"build/js/TimeFormat-CA9dYu0_.js"},{"revision":"4fd8ab2c2cdecd006d255f491d86c121","url":"build/js/ThankyouMessages-JK-pjJPw.js"},{"revision":"03341c47dfaf69cbe792c051470c2c95","url":"build/js/Thankyou-Bp_h7hhN.js"},{"revision":"9984d691beddc53688cb1be49ee87e55","url":"build/js/ThankYouRye-Ff-Tu7Nl.js"},{"revision":"244f48ace36056d541e96ba94264c084","url":"build/js/TextInput-C4x7L5Rh.js"},{"revision":"ffac6d1278187937a0a1df2756713779","url":"build/js/TestIntercom-Bm8-o4J_.js"},{"revision":"cdf27dcdd908e84beabc5173a495b180","url":"build/js/Test-BOz7gv3V.js"},{"revision":"f8e7e1b89d5e60ca5c28037d6c69dca6","url":"build/js/Terms-B6b1rxH1.js"},{"revision":"10e7f5b01c13591c16d8a4fedbaec772","url":"build/js/TabbedDashboard-CX1pM09T.js"},{"revision":"a23ff5db0f1f933a0506afae86cd4bff","url":"build/js/TFA-CMDOUwoP.js"},{"revision":"b45e8ae9ad7c04450557262c9a45e548","url":"build/js/Suspanded-CFhe8j-E.js"},{"revision":"49d6c2849bbe7baeb9c2688e3d19d170","url":"build/js/Success-D4XWkUnl.js"},{"revision":"4596a1b547e659ce6b3e383e9fcf5ba5","url":"build/js/SubcriptionEarnings-9hpCubRQ.js"},{"revision":"c7b297f75452ba049052caf9b2002b42","url":"build/js/SubCheckout-B8mfmMYb.js"},{"revision":"bb185ffdd9b0ccc55a345b241ebbde3f","url":"build/js/StripeIdentity-CzohLmS_.js"},{"revision":"b016a4c1f4ef353d80f8565b99ac4885","url":"build/js/Stripe-CpKXhgi6.js"},{"revision":"065e9b3c1fc5822484605be0ca7ecda9","url":"build/js/SocialLinks-DOdSNOT1.js"},{"revision":"7938a5e77454768b81dad1458732f0fb","url":"build/js/Social-CRH2lR9l.js"},{"revision":"1843c9e0bf6c5d3c8b10529f08b50842","url":"build/js/SiteSubscription-CpDtLKqt.js"},{"revision":"aef37ee2af676cad5afb320848431489","url":"build/js/Show-C_NXgNCu.js"},{"revision":"18025c638eccdddf90feb2534065c403","url":"build/js/ShopTracker-C_urD45V.js"},{"revision":"80f8a760888c1855fc4af47cbb1f4888","url":"build/js/ShopPage-SluQ6yiq.js"},{"revision":"eed8047cd33ac11e0d0ee9ec59d323ef","url":"build/js/ShareProfile-CG8OhV3j.js"},{"revision":"8bae644670329f02d2ca0bcf49f738bd","url":"build/js/Settings-ClkujGxs.js"},{"revision":"227fc841d12bcef3ec7f31b901ff1a2a","url":"build/js/SendTip-DQ-mVefO.js"},{"revision":"f34d3c50aff03464a20115dff60ef456","url":"build/js/SecondaryButton-0mFv1EsN.js"},{"revision":"d8a85916be234063413b2764f17430f1","url":"build/js/SayThanks-BjGgWo0b.js"},{"revision":"8312ae3c177be19adc244f81b2244ae6","url":"build/js/SafeTransition-QzYv4oNr.js"},{"revision":"760455a8c29ee352bff205959d08f877","url":"build/js/ResultsGrid-CyV3knW0.js"},{"revision":"d77b7a40cf80b3bb48355d80a88e2c6b","url":"build/js/ResetPassword-D-iSP2Zw.js"},{"revision":"4d572fedb71bc570b932678a24ebd4d5","url":"build/js/RemovePost-D68bupV5.js"},{"revision":"a37d2a83444811cbe894f9ce976f9c28","url":"build/js/RemoveMembership-BFsBq6Qw.js"},{"revision":"3535f0ee15633afbfdf00b579c4af588","url":"build/js/RemoveBill-lQ6pf4nZ.js"},{"revision":"9a806cda7abc4dac0279e404284ca5f4","url":"build/js/Register-DvEJEU-7.js"},{"revision":"e5abc1ab9743b3fbd4e9b6e7854bfb9c","url":"build/js/ReferAndEarn-BWX54ZNT.js"},{"revision":"174e1142af7d51594772b0d593280f0c","url":"build/js/Redirecting-uv-AMvqH.js"},{"revision":"50e61d0d739fc3ed46304d3e70683f11","url":"build/js/RecentSupporters-D3sKY_lH.js"},{"revision":"19718df4e9502f481c107f65badce553","url":"build/js/PwaTest-BoTduyMu.js"},{"revision":"ddcbaedaad599ac90d91fadfe8ce50cb","url":"build/js/Promotions-0HdyDI-k.js"},{"revision":"13da610b76fddbaaac16faf565c8e2e3","url":"build/js/ProfileTaskLists-Cyu9tn-F.js"},{"revision":"015f6221c561963007c075df38a0f453","url":"build/js/ProfileTask-XmzrMBhe.js"},{"revision":"3d380c72dc560966f4b90c9399a644dd","url":"build/js/ProfileSteps-CJ5Hvar8.js"},{"revision":"6e76bcbb0195334ece1222880186a709","url":"build/js/ProfileProductLists-DtnUGJc_.js"},{"revision":"a4a632a6645e7735ab921b47ffae8bb3","url":"build/js/ProfileProductLists-COgSsmRr.js"},{"revision":"c70c42a676ef05fe39f5ba39706c9069","url":"build/js/ProfileProduct-x7RfKmMZ.js"},{"revision":"c82be4a4c43cbe66f653ee86c3b6828e","url":"build/js/ProfileProduct-CYVbVx4U.js"},{"revision":"0db7f158796768c2400301566b908053","url":"build/js/PrimaryButton-DRYQUPwa.js"},{"revision":"6f920ecab26404160f203915f9bc3c78","url":"build/js/PriceFormat-C3n00PY-.js"},{"revision":"0605d54d17fe0260a4a1c1452241bb83","url":"build/js/PostLike-B5AacZE0.js"},{"revision":"64bd20cef63788e3da55223aaf9e9a0c","url":"build/js/Post-DoRJSqS6.js"},{"revision":"7942edb735ff73d4ab26a01e3484e71a","url":"build/js/Popup-C1fHl5cU.js"},{"revision":"0c0c847c67b4fcfc89a6d006f8003019","url":"build/js/PlatformAnalytics-oqe6JGlR.js"},{"revision":"8b8fa1d4c3b77b098e2dc8360f34d9ed","url":"build/js/PaymentSlider-6j1HrzGN.js"},{"revision":"748329c0b10fbe20d14ef3c0dcb56ba2","url":"build/js/PaymentDashboard-D6-Hf08c.js"},{"revision":"8da3a6e73bc748420c5dd4ef5001a655","url":"build/js/PaidTasksTerms-BIx9blzV.js"},{"revision":"e0ce961351ed198f162bf77f767aa73e","url":"build/js/PaidTasksAnnouncement-ClYJDq6N.js"},{"revision":"3accc9a27a21265518e4b45b47bdb80e","url":"build/js/OrdersLists-BTe4RX2s.js"},{"revision":"6d4c513397e647375e139512273a8c1a","url":"build/js/OrderDetail-D4efksKX.js"},{"revision":"adf18e5052b4d5578e94fe69c537cd94","url":"build/js/Order-CJH7wLRc.js"},{"revision":"c9f70388bbf359a6ba598b81b5258f64","url":"build/js/OldSubscribe-B5pHlIwF.js"},{"revision":"2b63df03697b389cd824cc0691d9b9c6","url":"build/js/NotFound-DBy_BaI-.js"},{"revision":"421ba5b1c2cd95284e411574bf234c53","url":"build/js/NotForBusiness-zhpbuLSy.js"},{"revision":"ae197a714d2b1b4150ad136bd327db5f","url":"build/js/Nocontent-DDA1U7ou.js"},{"revision":"3ae16a56caaed9318cfc77b37c376742","url":"build/js/NewVerified-Bb_gz4X-.js"},{"revision":"128a5d93ce53e35051130278aae49a17","url":"build/js/MyShopProducts-tgfqexDd.js"},{"revision":"bef1571275ae4e6e439827cf40819ddf","url":"build/js/MyGoal-BfRzaUfA.js"},{"revision":"7b84f665391566fbfdf83317d5dc48e3","url":"build/js/MonthlyRevenue-DOBOOrTw.js"},{"revision":"869b81f2d5e74eb4ebf85b3bf2dc7e03","url":"build/js/MembershipsLists-xo0SvxiQ.js"},{"revision":"e08ab3df817a3a4cfeb7a56ed823fa58","url":"build/js/Membership_dashboard-Dd0k8Ep5.js"},{"revision":"9d5b39aefddaa97b001ecee7e760872f","url":"build/js/MembershipTracker-CuBOB8Vs.js"},{"revision":"395e4b92a56b8707184692a090a9deed","url":"build/js/MembershipLists-qhrqoX-e.js"},{"revision":"4e5b94b9aa2681979a5b8b06096b3e42","url":"build/js/Membership-CCxDpTBN.js"},{"revision":"4772503df430046af92da51b718ae429","url":"build/js/Membership-B-1qAqbs.js"},{"revision":"083ace08d88b16c16929cd06c38cc143","url":"build/js/MemberCheckout-CW4Zw4BM.js"},{"revision":"db5e0c401852a30b282e8d3f6b7ecf91","url":"build/js/MagicBellNotificationDisabled-BuwmFBYX.js"},{"revision":"59ed7b218385ab0f96457ef5c00e07b5","url":"build/js/MagicBellNotification-uCNCgcOn.js"},{"revision":"edfe205c9b6ad3573f6eacdc5f2300dc","url":"build/js/Login-CexsGdZ-.js"},{"revision":"39c3636b114369056bd72c7835391fc4","url":"build/js/LoadingScreen-DJifl-XD.js"},{"revision":"17abd482b69920818a166fe8f4fd2b35","url":"build/js/LoaderButton-Dq3GBH7Q.js"},{"revision":"3b7dbb9aff6e10b3c7c9456c1db4ab93","url":"build/js/LiveBarSection-DHeVRTUt.js"},{"revision":"be268baf17adfa912d0f4a74f9382b3b","url":"build/js/Lists-CDkT4AX4.js"},{"revision":"b2074506135b33e1f1304236089428c8","url":"build/js/LinkTwitter-D2ghdb13.js"},{"revision":"8d6e1c18f6eb2016663b972ac66df32d","url":"build/js/LineChart-DiOOcp8p.js"},{"revision":"f521157ae5caa74ea5b83e298eba3e97","url":"build/js/LeaderboardStars-DJ19alyj.js"},{"revision":"3827397ede87ae0b7f6df4a1fc00dfa3","url":"build/js/JoinUs-sUgPwwMe.js"},{"revision":"24394d1fcf4e31064ed676722c79e712","url":"build/js/Item-BZXGa4Uu.js"},{"revision":"0ad4df1c7926924c2d75a49c5540f10a","url":"build/js/IntrosVideos-DLZAnNLr.js"},{"revision":"621a2ae1b3f9ff450b7a9eccfe809db9","url":"build/js/IntercomDebug-CTByTxx1.js"},{"revision":"53ddd853645ebec324be0bd773f978fb","url":"build/js/InputLabel-kjSdpme0.js"},{"revision":"0f7b264f0a678b186f7b19c98bdef549","url":"build/js/InputError-DNO2YpdY.js"},{"revision":"3bf84d9fda439f33598122c4e793e5ae","url":"build/js/Index-ihBZEa0o.js"},{"revision":"e3ecac737c9fdbc190fc382abc18a772","url":"build/js/Index-CbtgToZ8.js"},{"revision":"7d2998f634282f00a0c7edd96ec49452","url":"build/js/Index-BthAc9x0.js"},{"revision":"d235a05455baf047c8a4bc98056de628","url":"build/js/Index-B7qBPEJI.js"},{"revision":"1b0e0484a5b25afce6d54ef4f423e15c","url":"build/js/ImageGenerationWithAI-a_jqhQcG.js"},{"revision":"dede11da9f94e4c27d92551693c6e305","url":"build/js/Icons-COsBaf_w.js"},{"revision":"67d4678d99a5030e17aa94f3df18db6f","url":"build/js/Hero-K1iwqhng.js"},{"revision":"3994f082dc33c3aea6622e9b808714d7","url":"build/js/Header-BHYvfbu6.js"},{"revision":"92cb01dfbb794e415c01c3fc81bbdf42","url":"build/js/HappyCreators-CkD1_ebb.js"},{"revision":"ac8893f49946bd29b93cf3efd62e77b4","url":"build/js/GuestLayout-NluwXmIg.js"},{"revision":"c11200f6d0543050fdfcc36fc8744bc1","url":"build/js/GrowthTrends-CliXuOzp.js"},{"revision":"80442c207e7451cbce727b4a5f4de5eb","url":"build/js/GlobalCheckout-BwFi7ulE.js"},{"revision":"3f609e54febd270be6c92ec5ff683136","url":"build/js/GifterTips-aCEwgC3I.js"},{"revision":"454bd8d6e284b750c34543bc40637798","url":"build/js/GifterSubscriptions-DaHfWYAH.js"},{"revision":"c7ec0504ce90eed7cd280f6a800225ab","url":"build/js/GifterMembership-bypCXJtt.js"},{"revision":"851182a0d7db65069795b591c6c0d70b","url":"build/js/GifterMedia-CyWl7cj_.js"},{"revision":"71c8da3df04717da2906ecabddad6b41","url":"build/js/GifterItems-ByqbrhVF.js"},{"revision":"8bd74ae37ec1a329517b38af562f5bf9","url":"build/js/GifterFeed-CF-FjOEc.js"},{"revision":"54e62ad079c66bb669bc6803ac8d1e4f","url":"build/js/GifterCardVerification-C0TwTIOG.js"},{"revision":"d66fe113b1f86c9185b3fad40ca47b84","url":"build/js/GifterBills-DoAcpBJ9.js"},{"revision":"4c0c6d4869a3039c7fdcf2c8760e8f40","url":"build/js/Gifter-D3yAXZ_K.js"},{"revision":"900b878a71e84062c82b20049727c063","url":"build/js/GiftStore-CQCsm3eV.js"},{"revision":"3ea2e1c42abf6edf4bd4742fc962ab5d","url":"build/js/GiftListing-C_WkbhOf.js"},{"revision":"ae411c3ef8416706dab66b243f61330d","url":"build/js/GiftEdit-Cbg8rFk_.js"},{"revision":"eb7d3f6a910b8e89fa16caa74b217dae","url":"build/js/GiftAddCart-U9NvBfF7.js"},{"revision":"405f9c9b86809054e395da816c1a2065","url":"build/js/GetCart-hDLEJYt3.js"},{"revision":"def445fb9605668de27de9424248330d","url":"build/js/FunPart-B3CLDair.js"},{"revision":"7ee21857e9205d33bb2124a1c22c694e","url":"build/js/FounderProgramAnnouncement-CumaAigE.js"},{"revision":"cc0d1f0a6dcec9221d3bb35a0edaaa60","url":"build/js/FounderBadge-CWUNEcLR.js"},{"revision":"0420aa8b73ad948a22b3ce11e4935c12","url":"build/js/ForgotPassword-3gXBIgiQ.js"},{"revision":"999da64f2acea9cbe5d7ee088c61c5dd","url":"build/js/ForCreators-gf3ZndZp.js"},{"revision":"fdce153a391c0a18d60107eca677391b","url":"build/js/Footer-DIMxOC4m.js"},{"revision":"5d0130337b9639551aa92ec0736b25c5","url":"build/js/FollowButton-DqcSo7et.js"},{"revision":"d7d46182f1745dcac6ba12fe0a6d31a2","url":"build/js/FlashMessenger-DPGocfe8.js"},{"revision":"d59d11db1ba258170165c9621ec8484c","url":"build/js/FiltersPanel-CaBo--kN.js"},{"revision":"1cd7e223351d02f3832501ef233e32dd","url":"build/js/FeedList-DmAj8WBq.js"},{"revision":"afb606b79e94b8bca0e09006fa384909","url":"build/js/FeaturedCarousel-9CkHhdXO.js"},{"revision":"a9d13b4a42d0a93d6aab542879b78f2a","url":"build/js/FAQ-D476sv9H.js"},{"revision":"5bd333324d32a9a9e2613879e31dc865","url":"build/js/ErrorPage-CArNznFo.js"},{"revision":"8c3036b0e3e356f1b6a8f867ab71e667","url":"build/js/EnterOTP-Byj1rk0D.js"},{"revision":"133afad869bc4725c2343e2690f5edf9","url":"build/js/EnableCardCapabilities-CIhPj-F6.js"},{"revision":"9e6d860d5e5e8eb165e2769f151aa121","url":"build/js/EditProfile-S3AaosLZ.js"},{"revision":"dc3764bb26369a02345f4620302ce73c","url":"build/js/EditMembership-PYjBfyyX.js"},{"revision":"d227be04a91a9891d0b126748738773f","url":"build/js/EditCategories-ZUOcaXaH.js"},{"revision":"d0733a6ebe5003c5cc6623a2045212e4","url":"build/js/Edit-DK2W2KOd.js"},{"revision":"2b6f63722c2358ec51a3062467150b8c","url":"build/js/Edit-D-wlD07w.js"},{"revision":"a69be7b57bd1933ed62c6e3e4e574fec","url":"build/js/Earnings-D0fFIwDB.js"},{"revision":"858dc33bd11a014460d80be63a1c6022","url":"build/js/Discover-BYJha2Ne.js"},{"revision":"5949f5dcd3f586a4d6eb6c00cd5b6470","url":"build/js/DiagnosticPage-Ch1VwD_9.js"},{"revision":"a4d85b45e389cfdae79bb9ab20855bb7","url":"build/js/DeleteUserForm-B8xCYWSp.js"},{"revision":"af66b24055b98e99bb7f6a536a2a6750","url":"build/js/DeleteStripeAccount-COzMa7Im.js"},{"revision":"f679a99c44a6d49345ea60f637612b5b","url":"build/js/Dashboard-CiFT3o6b.js"},{"revision":"de0db98aa973595811ba66de1add85ad","url":"build/js/Dashboard-CfDEFv3_.js"},{"revision":"07176dfcdfe34b4fc2da2e3fbf901d31","url":"build/js/CreatorVerificationNew-F_MM9Gi1.js"},{"revision":"591b0864f4f518072ad7ac2998fd8f77","url":"build/js/CreatorVerification-CWOJQtF9.js"},{"revision":"cfb71f4bc7269e1706560ea8f3de3b75","url":"build/js/CreatorSubscriptionWidget-Usd4hoAs.js"},{"revision":"e891696bbc6bdf9b9fda24cdf75fea0b","url":"build/js/CreatorCard-CnjsGRTP.js"},{"revision":"44780252edde50578992f2a0d69cb898","url":"build/js/CreatorActivityWidget-De6NGnap.js"},{"revision":"793728679f58fc2f1847262b27750295","url":"build/js/Create-BP4y6CJG.js"},{"revision":"db78f5961d59181c14b1b4e502b6f834","url":"build/js/CountriesShipping-CLblIXzW.js"},{"revision":"073b83fcaf15ace521118a65fd7d7298","url":"build/js/Countries-sxjeOu8Z.js"},{"revision":"40a80ff8701cc3205090324f53adf1c6","url":"build/js/ConfirmPassword-BruNDKMz.js"},{"revision":"34d826fd3f8c372a47fbf3a1f1851422","url":"build/js/CommetsLists-B_DO1jG3.js"},{"revision":"a82b7a9c0afc2c5be165be3a1faf2574","url":"build/js/Comment-BaPiw2CN.js"},{"revision":"17eb5cd8d21482e73630c979dacd8484","url":"build/js/ComingNext-CY_AoiJG.js"},{"revision":"0814c7a5da88b3a877c1959a5e9d881f","url":"build/js/ChartDashboard-Cy71Qt1T.js"},{"revision":"a91178486455e405501e81f6c0dea455","url":"build/js/ChangeVat-B82xWEBA.js"},{"revision":"0fa3c92f013f9fe6b44bdb2783bccb27","url":"build/js/ChangeCurrency-BZ4SHZ2g.js"},{"revision":"e2691a3bbc20878a70b8874946a9500b","url":"build/js/CategoryLeaders-D-BzOnU2.js"},{"revision":"f87186f41ffdf21f7c09891b20c6340f","url":"build/js/CartListing-CpeU5is9.js"},{"revision":"de61fb7b529e4c2117478bf80144b918","url":"build/js/CartItems-CKtiirow.js"},{"revision":"2075a26add62e37b315ad023078a6a4e","url":"build/js/CartItem-B-2Qqp_z.js"},{"revision":"03d76e16b6308731715b85c646b16629","url":"build/js/Cart-CUTGumow.js"},{"revision":"a3ff19e7c3518267600a27867c5e286c","url":"build/js/BuyShopItem-CarzRTx1.js"},{"revision":"083d697448132ee093a791ee6209ed08","url":"build/js/Board-aPzmXjR3.js"},{"revision":"165e6f5078f690ef6852c93aed4011c9","url":"build/js/Billslist-BNmgkAi1.js"},{"revision":"56a2b8090d051661f98907ad4a861ea0","url":"build/js/BillsTracker-Bgix1kNO.js"},{"revision":"5a9caf2b8f73c19c7a8a0d69d281e9fb","url":"build/js/BillCheckout-DLF5E_13.js"},{"revision":"41cc2283cec7f4b0e9223c68d152267b","url":"build/js/Bill-CcMFd2LT.js"},{"revision":"002e9fadfd6be9deb34550b02be88b12","url":"build/js/Avatar-CL178OKE.js"},{"revision":"759cacb2d74d8d5647372133cdee88c4","url":"build/js/AuthenticatedLayout-DqE8frzB.js"},{"revision":"828efc603a714e707d6fe2cdfb6459e3","url":"build/js/Analytics-DXA9e0-c.js"},{"revision":"456b602c03113507789f5060fa5c9664","url":"build/js/AllWishes-ubYg-V-H.js"},{"revision":"6c625caf0b8bf010c5c2c73755b6aaff","url":"build/js/AllCountries-FdYk-PuV.js"},{"revision":"6c1c3a332e0ae51ca4d7db5d14ecb42e","url":"build/js/Alerts-CnZrsV8_.js"},{"revision":"ff945626ee3e40eef2d83fb7fb69cd56","url":"build/js/AddressForm-C2j9WMPf.js"},{"revision":"d5d1a0df040e8a60d2783b80d3d687de","url":"build/js/AddShop-BN0H4u6k.js"},{"revision":"14e72fdccf8c4bd536f3c5b83bcb4d13","url":"build/js/AddRyeProduct-DE1Cvw-U.js"},{"revision":"8ef8ee413904af2144fa44a68d18a916","url":"build/js/AddPost-CG0KwGtF.js"},{"revision":"583556da306c25561661bf431778231e","url":"build/js/AddMembership-DOFwhw2B.js"},{"revision":"76c43dc02a6e169c0c45cf32205e3975","url":"build/js/AddItem-BqO9548j.js"},{"revision":"390f0bd8c1dd5c8974f4ae77c8fea015","url":"build/js/AddIntro-CQ9Pks7y.js"},{"revision":"3fe3558f04f3b655e25d15c4adecab7b","url":"build/js/AddGoal-CTzS7LRk.js"},{"revision":"8b4ce44d0d0e288150a0d281f1c747c9","url":"build/js/AddGift-Cd-H0ZjL.js"},{"revision":"5aeb71a809c71a5fa188a63468f51cc5","url":"build/js/AddComment-C5hPZQrD.js"},{"revision":"f2d7518838936daee8108669893c6ddc","url":"build/js/AddCart-D2-_ZfUQ.js"},{"revision":"ded0abd9e86ca41b3217c0e8c70b3109","url":"build/js/AddBills-9jQQmGX7.js"},{"revision":"ca365f3fcc95569bc6f59e517e6b5071","url":"build/js/ActivityStatus-CkuXSdOX.js"},{"revision":"26830e4270d234935eb9fcee00b5a43e","url":"build/js/ActivateSubscription-BiYTvCnP.js"},{"revision":"7f9ee82faec91c3beee029c6ecf872ee","url":"build/js/ActivateCard-D5Y0090W.js"},{"revision":"60a043ea968e528460a9737400bb8131","url":"build/js/ActionRequired-yCz2ZgsP.js"},{"revision":"8564b9ab5e4bfc5c9922bdde92e70300","url":"build/js/AchievementSystem-DiJS1gGF.js"},{"revision":"cbe30365f36265aaf05e5a0bce17cfc2","url":"build/js/Accountsetting-CDVIYVIy.js"},{"revision":"4941fc7627a73fe5abbc9455373e0062","url":"build/js/404-_29MdD-t.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"1abe20920c6b02ef56eed181c7ec1eaa","url":"build/css/app-CzqJ8kBm.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
