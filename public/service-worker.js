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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"13c8c5c37589e9f363fdcd1ed57ace61","url":"build/js/vendor-react-BcVLa1S9.js"},{"revision":"a926b3e284f3f2298baed526f7768261","url":"build/js/vendor-other-BWoxW1BA.js"},{"revision":"924b499b004f034df46309a660be6418","url":"build/js/vendor-inertia-DX9Wv90r.js"},{"revision":"36af9743d8b78d17d74f063af517713f","url":"build/js/useDispatch-gFk9Fg49.js"},{"revision":"90c9fa28cf0c0566c6a7c93281458fbe","url":"build/js/uploader.module-B3pVLeb5.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"9f80d842256927bfbd376da10d2f0738","url":"build/js/swiper-react-BtU8svzH.js"},{"revision":"0c3534b01bae864e45d8855716e946c9","url":"build/js/sortable.esm-DGrgl4Zt.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"ef245344e39ac8f300a97d9beadd1bb5","url":"build/js/react-select.esm-BJRpd3RP.js"},{"revision":"93fffa812399b4bf65d55467b259cdf1","url":"build/js/pagination-AzvW7lJH.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"ab1f3204c5826decc40efa9aa3681e39","url":"build/js/navigation-Dkd5QWrB.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"10deb5bc51c6a3ed0811eac49a589ced","url":"build/js/index-gqzEkrve.js"},{"revision":"6dbbc93ad56b7a808e542bd8c088787c","url":"build/js/index-Y7-eUs3X.js"},{"revision":"471bebbe7ad2d381d01458cac63f2ca5","url":"build/js/index-Ezca8vEP.js"},{"revision":"30736617f52e5d6f6bcf12a7f5930230","url":"build/js/index-DuWD-06h.js"},{"revision":"695aefc52e942bdacbea3df71cc8bada","url":"build/js/index-Dh2wPYmO.js"},{"revision":"8d7deb21cf80dc4a4e667b59ad90009b","url":"build/js/index-DEK8YnMt.js"},{"revision":"713b244813f79e1699e6437a1d951ecf","url":"build/js/index-D8oVr-OJ.js"},{"revision":"a68dfefa803a4cbcfae4f0c6d467611d","url":"build/js/index-D021hA1U.js"},{"revision":"04d95d5734037d1a668a2a44617222d8","url":"build/js/index-Crjv87RC.js"},{"revision":"9ddb8e95c1c57416dda374456777977f","url":"build/js/index-CpGFBtpQ.js"},{"revision":"300696050bad700f14e01911a714b5e6","url":"build/js/index-CTwcCh7c.js"},{"revision":"a65594c3eb2ef3c417d76d9c29ae460f","url":"build/js/index-CEajb3wD.js"},{"revision":"15051ed384870b305617c9a931e380bd","url":"build/js/index-BoY2jOzN.js"},{"revision":"748a75bb13a54d624a10fb68f6ac1c4c","url":"build/js/index-BUQf0-z6.js"},{"revision":"93608df4b2ed7c8839543a333bde3b2d","url":"build/js/index-BPXKoWpY.js"},{"revision":"e4e185dff86e4e7315fe3582887318a2","url":"build/js/index-BFI0bCXQ.js"},{"revision":"ae61c4ff1876b72c703dff75d2357bb2","url":"build/js/index-B8dGOMFs.js"},{"revision":"ef08caca847261dfe6c481e0f03c2c58","url":"build/js/index-B4nHIgg2.js"},{"revision":"591069ecbd2ac55767050d9214cf3069","url":"build/js/iconBase-DNSXur5K.js"},{"revision":"960863ecfc727604b567bf9fd6688c7a","url":"build/js/floating-ui.dom-Ca8gKEea.js"},{"revision":"dd7a72088192a93ed205d9700cede5c7","url":"build/js/debounce-C4quloSe.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"345c2531a96e256b4c48bd7c92e22eb8","url":"build/js/app-DpzOekFF.js"},{"revision":"3542f6b3cf51fd7016050900879bf3f2","url":"build/js/Works-CFvyqsow.js"},{"revision":"212cb512b66b9d91397433fe8d669ec1","url":"build/js/Wishtracker-B-BzwKyV.js"},{"revision":"da7f55ec124a49f6de81e91b65355478","url":"build/js/Wishlistbox-iz-hday-.js"},{"revision":"3098e11e5252a9cf716f75569f2c2690","url":"build/js/WishlistGrid-CrcJkZOl.js"},{"revision":"329fe5818fbb41934114f26e90a1cbdb","url":"build/js/Wishlist-nbknfp1V.js"},{"revision":"f061038069308775cfd40a704fd34400","url":"build/js/WhyLove-j3sJyMzv.js"},{"revision":"d65d0e571b7a82032e8b2baebb098708","url":"build/js/Welcome-DascFfev.js"},{"revision":"4cf6c671d2f63ad90d7b0425210c0156","url":"build/js/VipSupporters-Bqt8H7OK.js"},{"revision":"90d6e3e903aeeb9af4c042bfdf56374d","url":"build/js/VersionUpdate-CGOLiLdm.js"},{"revision":"b2d3ff9f3694f7952534f5432cdc84b5","url":"build/js/VerifyEmail-DvWwyufZ.js"},{"revision":"5308c5f4e18c9bdc577e1df150b67d09","url":"build/js/Userprofile-hh-T7YRF.js"},{"revision":"cadbbd260a435b463be2608f7a552ee9","url":"build/js/UserCarts-D4xiVmXJ.js"},{"revision":"c6f3ec4ccb61dd38fc32ff55a337bbf0","url":"build/js/UploadcareEditor-CRv98kd_.js"},{"revision":"86637362628310b516e0d8edaa2be345","url":"build/js/UpgradeStripeAccount-DHxajsox.js"},{"revision":"a7d5688a7f1f4d7297f571356fa86028","url":"build/js/UpdateProfileInformationForm-CHhgkVXx.js"},{"revision":"e83f5c4896473f4d136b36965679f681","url":"build/js/UpdatePasswordForm-CYZJ3gu3.js"},{"revision":"e8395bced9b328170d518f88270d14d7","url":"build/js/UpdateAvatar-BDw18GlH.js"},{"revision":"0a4451e24cc3a2df6f6d7a4a0417eaef","url":"build/js/USTERMS-kfx2IkAs.js"},{"revision":"6e6a0d1cf4a9e7f9a429e65f7bb1113c","url":"build/js/TweetNow-ClWSEDXG.js"},{"revision":"3869d67be4b77a6b3250766f397e8a3c","url":"build/js/TrustBox-Bk7m-q1a.js"},{"revision":"ca1a2995f54b24eade50a18b248862ff","url":"build/js/TrendingCreators-DTwm3iry.js"},{"revision":"e8835e97083dc1cffdd013f3998aee96","url":"build/js/TopSupporters-D4lFKwB8.js"},{"revision":"c20a8e23b14280f8de1421850ec0cdd0","url":"build/js/TopSupporters-Chclxqn4.js"},{"revision":"e04f0a6f16df344b0af7e9abfc28f1b0","url":"build/js/TopEarners-xDE3fIJq.js"},{"revision":"91add75944c1b7a2d888f9f09068aa3d","url":"build/js/TopEarnWishes-CnTh86j4.js"},{"revision":"72b59313be3ed6962a2c32244723f0b6","url":"build/js/TopEarnBills-C_nH8KWP.js"},{"revision":"5501242b4e5e1dfa5e3e51a76c3673fa","url":"build/js/TopBar-DrCTDeZy.js"},{"revision":"7622180bf387330cb03bdfd7bf3781f0","url":"build/js/Tiplisting-BZKptPrc.js"},{"revision":"3ddf7a7d13bc624c104c860a2b882eb0","url":"build/js/TipTracker-tDD-h8Wu.js"},{"revision":"dc2818fdaf46df3571c143e0e0c18e76","url":"build/js/TipInner-fL0Ljvg7.js"},{"revision":"3b06006c88e92eb2351b951448687113","url":"build/js/TimeFormat-CQZFFBNI.js"},{"revision":"b015ce37ab93deca851ad95a5bc18d39","url":"build/js/ThankyouMessages-D_RkQ95I.js"},{"revision":"f13f1f38e2d39959b2d8f0db2d7a2ab9","url":"build/js/Thankyou-CTgDpZRa.js"},{"revision":"6dec07b7866039f89d7d6d49acc87b4a","url":"build/js/ThankYouRye-sV7gQtoj.js"},{"revision":"77d5ef883509323e9845c7797df46e45","url":"build/js/TextInput-D8dS3IK7.js"},{"revision":"e7b3706873d24e914c6e0bdb58d33e4c","url":"build/js/TestIntercom-CBzTuRMI.js"},{"revision":"7af547a3ec998f2740f137f896885fd5","url":"build/js/Test-m5MDYUk3.js"},{"revision":"175cd9404178df7c8be06f296ddf6bba","url":"build/js/Terms-BzpMOPnf.js"},{"revision":"474f77e24e72df2dbd93530b55508921","url":"build/js/TabbedDashboard-DPCW-JzB.js"},{"revision":"787891acc98ffeca81d2b4c6222f023d","url":"build/js/TFA-Bu7H3EaM.js"},{"revision":"c388b6ff32c0b6c6adfa5509801cea5e","url":"build/js/Suspanded-D6SBmIXG.js"},{"revision":"6e78c60ec1333f662cbf08932feefb26","url":"build/js/SubcriptionEarnings-CJkwXjd_.js"},{"revision":"8deee4e5fde2de5646a7f5f4f67c27f3","url":"build/js/SubCheckout-BXTAV1ct.js"},{"revision":"f5640a65ffb7bc326c27a5e8d671fa2a","url":"build/js/StripeIdentity-iT-U5lqe.js"},{"revision":"c59c899b59452e3f254a80a73abd5a47","url":"build/js/Stripe-DLyOGvpM.js"},{"revision":"aecbac7fc9f7fdf6e7e078532c29a3aa","url":"build/js/SocialLinks-BtVCxWvR.js"},{"revision":"82c74e9ce1976e306a0ea4b6f512b135","url":"build/js/Social-DCFvb_pk.js"},{"revision":"19b5c96b525e346615e31a79ed5141c4","url":"build/js/SiteSubscription-QemFRb0v.js"},{"revision":"402e3ac8fbeae6520f79a886f23f949b","url":"build/js/ShopTracker-KjRU1Ep2.js"},{"revision":"6c34b6aebd894fb110aefffb2dff322d","url":"build/js/ShopPage-QN-bDY77.js"},{"revision":"9fa45361068e5e42a112045cdba1d3e6","url":"build/js/ShareProfile-CmtrqaSv.js"},{"revision":"f0c789b7fff96b16a3c84e2a8155b94c","url":"build/js/Settings-Fy-K41HY.js"},{"revision":"f758ed85c51f5276a96c2cc93ea54d23","url":"build/js/SendTip-1r3zgnxv.js"},{"revision":"7af4893d78075db8865dabb79a49bd8a","url":"build/js/SecondaryButton-3wbgAgAA.js"},{"revision":"a8c697ce69907e5d42b74073150f2cf7","url":"build/js/SayThanks-Dlq7-6Um.js"},{"revision":"f6fd790dddac79a6be199b9feeee6d5c","url":"build/js/SafeTransition-WgVJ05E6.js"},{"revision":"ee1779929aae30aeab4938123e9b8351","url":"build/js/ResultsGrid-DENf9cfK.js"},{"revision":"be5d4182400513271f98092403b3857a","url":"build/js/ResetPassword-DYp-aRNb.js"},{"revision":"46d93b71b97dfe4b6e81e381c94a920e","url":"build/js/RemovePost-X5pN7hnM.js"},{"revision":"b9fc83f087a8accdd9e30cf6fb4a2bc6","url":"build/js/RemoveMembership-MxZbFPmp.js"},{"revision":"7ae8c64284ac63090a70f19e5654aadd","url":"build/js/RemoveBill-tCJJVvhw.js"},{"revision":"38273fee3ee5bfef57ab540258a1d10b","url":"build/js/Register-BLCLYWDB.js"},{"revision":"7602addb19e10d2acb9b272907e5238e","url":"build/js/Redirecting-CkEkVgoo.js"},{"revision":"612a618dc0c59d130b131c7c69918a4d","url":"build/js/RecentSupporters-CYH4aeb_.js"},{"revision":"2b602b24ad965ec4aed9ea5ffb675de7","url":"build/js/PwaTest-BFRP6n-9.js"},{"revision":"0ca062f93e4e58d8f91cbe5519fd34c1","url":"build/js/Promotions-8q7DWBbn.js"},{"revision":"e48e628d4ccb4470ed3817d7ecadd4f3","url":"build/js/ProfileSteps-B123zYRu.js"},{"revision":"a4f164654a185d36b8da8c7f56ce36af","url":"build/js/ProfileProductLists-vMhB6rF0.js"},{"revision":"cead79083e53b5ad0040bf46f8e4a869","url":"build/js/ProfileProductLists-B2dc8UHq.js"},{"revision":"b029869d4b9ff6b7ab3bacb1089388c1","url":"build/js/ProfileProduct-CvJ8GjP4.js"},{"revision":"568b41d78e6c5687c7663fe4240b864b","url":"build/js/ProfileProduct-BnFqmkbS.js"},{"revision":"45aaaa1328fd5f1bc7acb2c9b98b637b","url":"build/js/PrimaryButton-Dnc4Cudf.js"},{"revision":"5ec1b2354e307f13120513e5bd713e00","url":"build/js/PriceFormat-D87VPMh_.js"},{"revision":"b594f99e1c99d8db7793dd0afc9db271","url":"build/js/PostLike-DXZztkXW.js"},{"revision":"4df559d5c073d9b33fb1e803a5c3496d","url":"build/js/Post-Dnj9vVmf.js"},{"revision":"bb685dd1d39d7b19e1411714849bcda6","url":"build/js/Popup-DrZROyMg.js"},{"revision":"5b3e63801681b737abda1307c396ff78","url":"build/js/PlatformAnalytics-EGI9YATQ.js"},{"revision":"a3a7762345aeb5ef23e2fc447b6350ee","url":"build/js/PaymentSlider-SqkGrykp.js"},{"revision":"4d10d33393d83f2dd0a94c92728aa585","url":"build/js/PaymentDashboard-CIZWzRzI.js"},{"revision":"e71ddafc7e158a6ae4ffd93df9c5c18b","url":"build/js/OrdersLists-Dn8sLToc.js"},{"revision":"1b5f7d9784565468518a99e0fe56c53a","url":"build/js/OrderDetail-geLz_OvM.js"},{"revision":"c10018c934ed61895657f3cb357c6d34","url":"build/js/OldSubscribe-CYuqYBkn.js"},{"revision":"8c47c00d0db7b68715aa45833bdc66f0","url":"build/js/NotFound-BjHmd7L4.js"},{"revision":"f2daffdd1734a1775d65105c1b2cc673","url":"build/js/NotForBusiness-BNebhhcu.js"},{"revision":"57eae230e8502c160a005776675545df","url":"build/js/Nocontent-D2wqR7r9.js"},{"revision":"bf78d04ad4e4898c026b5e5a85b487b5","url":"build/js/NewVerified-BNkLgbBE.js"},{"revision":"bfd16280b6d71b2ab9694867b0e2cbcc","url":"build/js/MyShopProducts-BztsZ-Nq.js"},{"revision":"3a5b3ea101f517303fd93c1add339605","url":"build/js/MyGoal-CoNTv9DX.js"},{"revision":"adfa1f9e90e45d26ec0c3bf74fc9bf99","url":"build/js/MonthlyRevenue-BD1akJwr.js"},{"revision":"9567240b0c3c68f0bcbd3920e5d38cdd","url":"build/js/MembershipsLists-CPvF1N6w.js"},{"revision":"037c3a6cb24125496cb665816a129de1","url":"build/js/Membership_dashboard-tfkopv23.js"},{"revision":"4de86ebb83b610b9d28cbe85f8468de0","url":"build/js/MembershipTracker-5gtKMTIe.js"},{"revision":"8827c6aecbecb0022a0e481b41824e82","url":"build/js/MembershipLists-DQIgSj91.js"},{"revision":"66006dd43ed296b94fd4492ff42209ec","url":"build/js/Membership-C3uV1IVs.js"},{"revision":"cef55714d4f3d9a3defc442569a98105","url":"build/js/Membership-Bklf9lds.js"},{"revision":"1c79701865314d5eb2a8ca0bfc83a90c","url":"build/js/MemberCheckout-Cfnx0m0D.js"},{"revision":"76893c74268c95846881f14567d0012e","url":"build/js/MagicBellNotificationDisabled-QbqsH985.js"},{"revision":"612ca6a2d52076735054448f618cbdc1","url":"build/js/MagicBellNotification-yeGBulVr.js"},{"revision":"2534b6f9bf70db2943246aba49f9cb53","url":"build/js/Login-CXF6ERxM.js"},{"revision":"fc850fb3a389b3fe5d3736602bb2aaef","url":"build/js/LoadingScreen-sW3IFfq_.js"},{"revision":"1b4de405d50c5ff1651cffc54e7cf502","url":"build/js/LoaderButton-dZKM5k2i.js"},{"revision":"887e13a43e1858c71a3699a94e9c5782","url":"build/js/LiveBarSection-oeNR0YDQ.js"},{"revision":"8f437afd13f0b2c9d953c607278e56fd","url":"build/js/Lists-gU1cJlTA.js"},{"revision":"ad0833d11faf25a11a841a508007e5b4","url":"build/js/LinkTwitter-2HTas3qm.js"},{"revision":"f5811c4cd06605706b5c366768cbe03f","url":"build/js/LineChart-DQ843rIl.js"},{"revision":"64c112cc222e27815759949abe6a2f24","url":"build/js/LeaderboardStars-DOPnPlVi.js"},{"revision":"63ffb577d478575a09b8fbb5717d5270","url":"build/js/JoinUs-BUdvlRST.js"},{"revision":"a4d0385ff39f59c2c84d88daf8e665f1","url":"build/js/Item-CyqJv_lA.js"},{"revision":"f18c96c72a3f86c32df4a5acf5017f4d","url":"build/js/IntrosVideos-CQWxgir9.js"},{"revision":"b930a85c5aa0d03dfe4e975d7a7d42ba","url":"build/js/IntercomDebug-D451Bqxi.js"},{"revision":"15c752192a36782da67a40ea70f42ea5","url":"build/js/InputLabel-dv95psoI.js"},{"revision":"1b22c056c6bc288d4f5e58b5bfe5e5da","url":"build/js/InputError-BQsXhGza.js"},{"revision":"0a689265a0a2ef1f673b8cf178fd2fa4","url":"build/js/Index-CyUTNWAb.js"},{"revision":"8156c71e212e37d1d7e6ac0c1f00b8d5","url":"build/js/Index-Brme5lD4.js"},{"revision":"25a9e3ba32b0c99029c78695fa759637","url":"build/js/Index-BpjeAY1K.js"},{"revision":"32e167f16079e80a75c1fd4c68fae2ac","url":"build/js/ImageGenerationWithAI-X0OW68yU.js"},{"revision":"7270ea70b3ce25fac35f9cedef43308a","url":"build/js/Icons-TQl1GTAL.js"},{"revision":"673e2b8f69ae44515c55a9bab90fe9a6","url":"build/js/Hero-BO2gpGHs.js"},{"revision":"34d4c190d5bb2aa6c34f419125190420","url":"build/js/Header-Ca7CHuHg.js"},{"revision":"669a394482ed5c3df905b8325eeb211d","url":"build/js/HappyCreators-DcpOq0J7.js"},{"revision":"09e128c157ef95be6b4be2f885164b3e","url":"build/js/GuestLayout-N1Gm3DmH.js"},{"revision":"37a4355256def1098daca23dff3ceaaf","url":"build/js/GrowthTrends-B8XRjOAX.js"},{"revision":"a42d98126a63048ae879948825ef29ab","url":"build/js/GlobalCheckout-CZh6UUgM.js"},{"revision":"8dcb566c26128184f400af427ed484da","url":"build/js/GifterTips-C1t-VljN.js"},{"revision":"87276071c48972ead02f201de8b1d06f","url":"build/js/GifterSubscriptions-ZvB3uvdT.js"},{"revision":"6eef397e20d2e47987ef34c6dd913a2c","url":"build/js/GifterMembership-DbWBLvDl.js"},{"revision":"7bdf2b9293013e7f0916648e3f61ea38","url":"build/js/GifterMedia-DsszWgVG.js"},{"revision":"f9bcb41e7ca394192756cfc786c5b1e6","url":"build/js/GifterItems-Bz5Lgjqe.js"},{"revision":"c3358e7379b0e35819bcb0cbd8eb9b1a","url":"build/js/GifterFeed-DvVfF2na.js"},{"revision":"64c3589b2e44961cc028157aedb73a3d","url":"build/js/GifterCardVerification-tgaXPJlJ.js"},{"revision":"f010f9840c881c0b6c499caa4a438892","url":"build/js/GifterBills-CpS_AqWq.js"},{"revision":"3b1217953af7acd05b7d7632dfc84881","url":"build/js/Gifter-DF8M8lG-.js"},{"revision":"e7d15080a8e7b341bce86d0925b51a74","url":"build/js/GiftStore-DTMYaJce.js"},{"revision":"0007e2a45653b2ec4d2f8a3f47eae64d","url":"build/js/GiftListing-C4ISzKGr.js"},{"revision":"a7a2df20f9a23ee1a10614535ba7d25d","url":"build/js/GiftEdit-jvmNiKts.js"},{"revision":"c2f722ea1acc0d881b768088f4727899","url":"build/js/GiftAddCart-DRXv_FKO.js"},{"revision":"c5901cae7048c571a393ca5a02b5cc59","url":"build/js/GetCart-DpxjN3no.js"},{"revision":"51f5e51dff9db766e622254a8bacf940","url":"build/js/FunPart-CzokIrvn.js"},{"revision":"4b6c6411bcb59b5a56f60d922f86ec82","url":"build/js/FounderProgramAnnouncement-De5YPxoq.js"},{"revision":"ec269d1c29c976a8e4a5c49e2fb913b5","url":"build/js/FounderBadge-D8KBgT3S.js"},{"revision":"43df4ccacde1cd56f3503b19b01c5674","url":"build/js/ForgotPassword-C3QK75BE.js"},{"revision":"592a4d970333a3f453fe1ac5f3fa134e","url":"build/js/ForCreators-BFBRCy1u.js"},{"revision":"eb572bee5c1b779d4193863170778e56","url":"build/js/Footer-CZNYiFj3.js"},{"revision":"de15d418c79a9b849f55ec2685ef1547","url":"build/js/FollowButton-DiXFHNgX.js"},{"revision":"79639f93439d8a10aa74959f6d7d7fae","url":"build/js/FlashMessenger-DQIo4qSZ.js"},{"revision":"03b24644135f3db70b797d108bfefb2c","url":"build/js/FiltersPanel-B1XdPTpR.js"},{"revision":"6cc46e4f5102d71f5f8d6279f968c5da","url":"build/js/FeedList-BqyolK07.js"},{"revision":"e431360aff9588b92406b799c32924d8","url":"build/js/FeaturedCarousel-YkHGFKuS.js"},{"revision":"81ce70f09d6ce1d9282211794f4a1345","url":"build/js/FAQ-xqvX087a.js"},{"revision":"eb39011d76692fd82528c45029bddf26","url":"build/js/ErrorPage-BV8j72Jx.js"},{"revision":"b72008fd8643cf8bc666d252d621ff7f","url":"build/js/EnterOTP-BlJSSeJ7.js"},{"revision":"154d5e2915002879ee15b03ae3e0a331","url":"build/js/EnableCardCapabilities-DieV6GOF.js"},{"revision":"6bad05a69265585d2cf1ec5823255408","url":"build/js/EditProfile-C3VHrufv.js"},{"revision":"a7c9296a10ee79bb12762b528b94e894","url":"build/js/EditMembership-BgFDm-f2.js"},{"revision":"b5edec39dd2667704f86b662fffa745b","url":"build/js/EditCategories-ChLOMVCp.js"},{"revision":"ea761e9e935a1871e92ed7d5db7ae66a","url":"build/js/Edit-DTkO3QZ3.js"},{"revision":"339c789e5665c3d26576d1e438e420c6","url":"build/js/Earnings-Be621NAV.js"},{"revision":"a1e6d6ab401b97ecd3f8fc80086b40e9","url":"build/js/Discover-BLAT0cT6.js"},{"revision":"afb1ca24eda2359b6775a75cfad9fd1c","url":"build/js/DiagnosticPage-Cu3MqaDL.js"},{"revision":"2dfc4a4929854b88e194884d1ff8fde0","url":"build/js/DeleteUserForm-DIUp9HVO.js"},{"revision":"445988d615151cd3df23e5f1f95f75f7","url":"build/js/DeleteStripeAccount-DBGJCV9b.js"},{"revision":"33dd2bb91fe99eb9c10760a39bb8bc1d","url":"build/js/Dashboard-Wp8RbAWX.js"},{"revision":"e537786fb34a5548cc848568af15f680","url":"build/js/Dashboard-C_WxsSya.js"},{"revision":"9013d40e7ed4aea80d266cdd2679ba4c","url":"build/js/CreatorVerificationNew-l0RfV_pU.js"},{"revision":"a2ca044d098a57f80cea10a2831c6d2e","url":"build/js/CreatorVerification-Cg5aYmgU.js"},{"revision":"61414c9980177f55ded4842a2cfc39be","url":"build/js/CreatorSubscriptionWidget-CPWzG0ZV.js"},{"revision":"10447b209ca2c798c21d2d99709e1b16","url":"build/js/CreatorCard-8fWMzipK.js"},{"revision":"32e720c14a300ad025f0655a6a2d49b9","url":"build/js/CreatorActivityWidget-C0Hjr9ip.js"},{"revision":"98d05fbcbc423fed44a75ba8206a8ecc","url":"build/js/CountriesShipping-8Vj5BPP1.js"},{"revision":"c9874eeefd93f51c2c60283049e54914","url":"build/js/Countries-D_JFG2hb.js"},{"revision":"1e58cc596d25ac0423532f71cf9175e7","url":"build/js/ConfirmPassword-BcBt33r-.js"},{"revision":"1a7d3ed351105dc3f268e142fbc06681","url":"build/js/CommetsLists-Bf1tkwlx.js"},{"revision":"e6884c75067e2a92c59679a43e4cd122","url":"build/js/Comment-7G_gb2AQ.js"},{"revision":"93cc399c0f5d7b8fca3977bb1a287fa9","url":"build/js/ComingNext-Cwscwdix.js"},{"revision":"4d7d14dc23fc8ab9326ce6ddc6dc084e","url":"build/js/ChartDashboard-BvheYnLZ.js"},{"revision":"7fec509dff94b665095bbac9ed28a392","url":"build/js/ChangeVat-WNl_kzIQ.js"},{"revision":"9b141b2a9b6c5b97fbfdaaab92189b2a","url":"build/js/ChangeCurrency-DVrZ6SxQ.js"},{"revision":"03884c54951dbb84daf7091d5f4da422","url":"build/js/CategoryLeaders-D8kwceFF.js"},{"revision":"e6221205fe26571e072f819ba829f33e","url":"build/js/CartListing-Cxq8og4q.js"},{"revision":"2b2f362e50c1d7c7975add9b44b79b45","url":"build/js/CartItems-CIflG22Y.js"},{"revision":"0cddb52fbfa3506f2a03b066752f25e0","url":"build/js/CartItem-DNRV8fZp.js"},{"revision":"881d573f87ba96bc693d9dd37ba4da2a","url":"build/js/Cart-BO8OJwco.js"},{"revision":"75aa0f1f4612bd16432b9692b8423630","url":"build/js/BuyShopItem-ChlaUrNt.js"},{"revision":"bec2ddcda6900d17ac76ef8135dae060","url":"build/js/Board-B4_Zpelj.js"},{"revision":"c5561947e03fe0278a19cc88dc2c50de","url":"build/js/Billslist-BsJZ5eTp.js"},{"revision":"91f5ae19cab87e19970c59493dc53d58","url":"build/js/BillsTracker-BB_hL-M5.js"},{"revision":"c71c5427e63d6d83580375cf0eefeb5a","url":"build/js/BillCheckout-CXsfw3-b.js"},{"revision":"48676d0f7707c63cf177f0f9216ce1d0","url":"build/js/Bill-CL5yBjJn.js"},{"revision":"99332021e8469ae20622e870a175577f","url":"build/js/Avatar-DXGetXQt.js"},{"revision":"6760a891880362d9fc3fffb476c6b053","url":"build/js/AuthenticatedLayout-Chg6PAwC.js"},{"revision":"61c4034a455b01b15dfd0d943131e5fa","url":"build/js/Analytics-rGpGfOFn.js"},{"revision":"ac88c374606b1647e7965de4e1a26d54","url":"build/js/AllWishes-IYk-aVyN.js"},{"revision":"6fa7e1f6f578bed1c535bdd401d8cead","url":"build/js/AllCountries-HOWcl0_G.js"},{"revision":"e712d72a1dcd77a37db66cc78d0ff023","url":"build/js/Alerts-CzJq5TOa.js"},{"revision":"26324a5147c1e9db0846c86bed8fd26d","url":"build/js/AddressForm-gEdaNbzn.js"},{"revision":"6b3cda9bba7887273e58c3655d66d703","url":"build/js/AddShop-CwiXCL78.js"},{"revision":"9dc716d5fb5e2ff501546401e152f352","url":"build/js/AddRyeProduct-IBW4sp_P.js"},{"revision":"f6988f2a812af2d164864cfc50a51678","url":"build/js/AddPost-CX_Q_KxK.js"},{"revision":"f876bc7ffd23bab9b4637e828c352438","url":"build/js/AddMembership-Cj5eI0iL.js"},{"revision":"666f3722090721b1dc202da9b5cca76d","url":"build/js/AddItem-Cb13hLwn.js"},{"revision":"4e9d6addc41b140781e5d19326eb7a83","url":"build/js/AddIntro-DLjWq3D7.js"},{"revision":"38b3f34bab3c1d1a12d990c972153ddf","url":"build/js/AddGoal-CiMtsrRH.js"},{"revision":"d68e32a56a6ccdcb94406f640144481f","url":"build/js/AddGift--j9bEw-w.js"},{"revision":"5b92240f307f89ec9a8c5a6410ea84d8","url":"build/js/AddComment-CJtBkaMo.js"},{"revision":"4ac0f99c708e5361d4873aa8d974a462","url":"build/js/AddCart-BiOjfddB.js"},{"revision":"cd32a549ef8421b77b65f4564b0d2df7","url":"build/js/AddBills-DQJAniif.js"},{"revision":"ddf6e3f9dd6e8776c2f14681ff85d25c","url":"build/js/ActivityStatus-BFWFFeh0.js"},{"revision":"076df66a16a77e8ff54e8806ed8c7a23","url":"build/js/ActivateSubscription-MrgLU75U.js"},{"revision":"90b61241931fef9970579442d6e7c5fe","url":"build/js/ActivateCard-DJD6jNbb.js"},{"revision":"f5b72d9c901afd75e14f84ef3cad43dc","url":"build/js/ActionRequired-BY4t4Dg_.js"},{"revision":"dabc8609b9b67a488e128042d647c128","url":"build/js/AchievementSystem-CChyqVGb.js"},{"revision":"8acdddda8db45c81876f4ef7927a35ef","url":"build/js/Accountsetting-f8pV0PcL.js"},{"revision":"19180df900a2b72bb2621822a972af79","url":"build/js/404-DXmW8rdd.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"bae9cc8569e7ab600d32b31a1ad6c29a","url":"build/css/app-Bcl5oPZO.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
