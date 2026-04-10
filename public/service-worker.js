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
precacheAndRoute([{"revision":"647603cec14b104c203cecdf22e0548c","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"b966f3b4b225ef11f23c936dbc876aec","url":"react-emergency-patch.js"},{"revision":"6dcbc0359d538c8c05e4f5e503623142","url":"react-emergency-patch-v2.js"},{"revision":"fb579e404c8c059148d3e5c1c297cec9","url":"react-emergency-patch-simple.js"},{"revision":"287a4e64d10d1c91f5abdc2976d50519","url":"offline.html"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/assets/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/assets/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/assets/x-D1QobfAh.png"},{"revision":"1d50a5537d7282e36fc843ec7d60d108","url":"build/assets/wishlistbannerimg-DU_hurLo.js"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/assets/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/assets/vishitimg01-ClMBzIW7.png"},{"revision":"a1a4b8964c6072ab1292324bf8551b1d","url":"build/assets/users-B3-Y_z_A.js"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/assets/userphoto-2kQnKrr1.png"},{"revision":"e9aba4900c12d489fb985f1b610d5c09","url":"build/assets/useDispatch-C7Stu7Ri.js"},{"revision":"ae72c75f0214146149c3aaa4da1fe3c7","url":"build/assets/use-resolve-button-type-BJvqX5Pc.js"},{"revision":"495bb4406c6d55e6e1bc3b5daac4c73d","url":"build/assets/use-owner-KVztcD1w.js"},{"revision":"5f17305a57f20aaa60df17d44b4f38e1","url":"build/assets/use-is-mounted-95Jh6UQM.js"},{"revision":"e3be4fbcf5d22b0b0ec264ef674e1f54","url":"build/assets/use-disposables-CJ3TaHNt.js"},{"revision":"dc4149746b292b9b67526742110ed8ad","url":"build/assets/uploader.module-D2b7oAdn.js"},{"revision":"726e9039ad83739f819d98e02d8ce1f4","url":"build/assets/uploader-DUFri4hT.css"},{"revision":"c014a54ac507234cc3d6c506d8119cb0","url":"build/assets/uploadedimg-iAQ9Y4ys.js"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/assets/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/assets/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/assets/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/assets/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/assets/trust-hK0IhoQZ.png"},{"revision":"3f558e1bff3e0b53aa76d89186571000","url":"build/assets/triangle-alert-CG1CpPDv.js"},{"revision":"337f07066d0b240f195d3deb7947b568","url":"build/assets/trash-2-CCfzwlL2.js"},{"revision":"b3d11a91b3545a2110c9ef96ec5fa817","url":"build/assets/transition-BW9xWwhz.js"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/assets/tiktok-CmXIKDPc.png"},{"revision":"92bdb6c7cedef965d473dc20b081ed83","url":"build/assets/tag-oMOjw_6m.js"},{"revision":"d27af51e2585e971e12c427b5a60c0ab","url":"build/assets/tabs--aj8ncMP.js"},{"revision":"3d3fa61ca9754e33236f89aa776215b9","url":"build/assets/switch-Do6J6mc8.js"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/assets/swiper-react-DV8PrLMj.css"},{"revision":"8ac39ecaed5226567172a4990d3c651b","url":"build/assets/swiper-react-6l-QBMM-.js"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/assets/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/assets/subscribers-img-CICUnn2I.png"},{"revision":"126050f627568b5e555ce07951d49419","url":"build/assets/star-Co-i5RpW.js"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/assets/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/assets/spennys-QKaelW4q.png"},{"revision":"917a3f96d35571bda92d8241b1d673eb","url":"build/assets/sortable.esm-CpY_6MwQ.js"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/assets/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/assets/siteicon-CeHS7aEc.png"},{"revision":"295e73b048fb341a4e7b87ca0a5426e1","url":"build/assets/siteicon-C45idYI1.js"},{"revision":"d86738721b2f3c6b70ee925c35f91de6","url":"build/assets/shield-check-BhXrRv8K.js"},{"revision":"2ca691196531bcba09868cfda3669cdc","url":"build/assets/shield-CC6ua1Qm.js"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/assets/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/assets/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/assets/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/assets/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"2c2625e79f7250d410c0066e98951094","url":"build/assets/render-BvpNhNZP.js"},{"revision":"bd320428006db562c739e8fa7360ff4a","url":"build/assets/react-select.esm-vDkz35-y.js"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/assets/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/assets/proud-B4T3qkHx.png"},{"revision":"9c2253680fddf54c58bc24ba836d5f68","url":"build/assets/printer-CioStiF4.js"},{"revision":"19181c2d8c21926a723f59b7a16ecc80","url":"build/assets/plus-Dg1Mq2nD.js"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/assets/plaid-C3YNig8l.jpg"},{"revision":"d3291cc1c4f29861ed6bd7c080086efa","url":"build/assets/pagination-zax7yJZd.js"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/assets/pagination-DE0q59Ew.css"},{"revision":"87c53d9f0356bf70bb893a8f6a271cfc","url":"build/assets/owner-CP6LXCbI.js"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/assets/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/assets/nova-VIEvmjEk.png"},{"revision":"5015f8ac3dd8a0f170dbe2ab65297f2e","url":"build/assets/noresultimg-FARQaBoV.js"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/assets/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/assets/nike-DLThTltp.png"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"e2f5349cb0b3666dc537ab6dcc6974ef","url":"build/assets/navigation-gS6AmBdZ.js"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/assets/navigation-CteQybwo.css"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/assets/mouse-DINZi5et.png"},{"revision":"d21b84bafd16085030b7be8b745cca35","url":"build/assets/menu-CiajMm9S.js"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/assets/membership-img-D47G_pA3.png"},{"revision":"d152c6581cfa897b865422b19ecf2e6d","url":"build/assets/mail-SPWV8HIn.js"},{"revision":"af6baaab72b428f97e9add96d3cd03c4","url":"build/assets/logo-YD7rJ-Ac.js"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/assets/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/assets/lockprofile-BXHexqRM.png"},{"revision":"0b72a921ba859c309a299765f31bac35","url":"build/assets/lock-BcYMjjvs.js"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/assets/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/assets/kylie-BcKwDcm6.png"},{"revision":"8149259112cba393a9721e67356d1248","url":"build/assets/keyboard-BeC2Q3rb.js"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/assets/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/assets/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/assets/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/assets/instagram-DvC8l1Gh.png"},{"revision":"53b32b2a19e8011739c3ea840241c800","url":"build/assets/index-hFmV76HS.js"},{"revision":"32e8bbd2df745e0cb806f84f5c0a2e22","url":"build/assets/index-ftZR-cWu.js"},{"revision":"c16d805a5f685ae5ef3456c0ef8a76f6","url":"build/assets/index-Ye1pSruz.js"},{"revision":"4c1bb70b1e5038225de774ca525fbf2f","url":"build/assets/index-E2WK7xSX.js"},{"revision":"519b55b4156005d1e7c4f3593cee28ae","url":"build/assets/index-DuC6vQmu.js"},{"revision":"aae2ff01d340d4101f656f2085f43377","url":"build/assets/index-D3qitXM4.js"},{"revision":"c11393a645c68c0cd4ed4c09ace5bd42","url":"build/assets/index-CvGCEEEA.js"},{"revision":"f75a0f715c6c025f2ac9d75ca9073e85","url":"build/assets/index-CjMyUZyj.js"},{"revision":"49a04ea8bfd76b52226b68b1d53b0592","url":"build/assets/index-CTA5idSs.js"},{"revision":"8292b16fa32e000343c346b78657f95f","url":"build/assets/index-CKmnYalv.js"},{"revision":"0b9602dd46b0b3b9d9ef1f4dd83bfdc3","url":"build/assets/index-CCVC_D49.js"},{"revision":"164d96cf9471039d719df009b072aa9b","url":"build/assets/index-BflJuA7A.js"},{"revision":"94c33937c04265f1f2335eb4aa8f54d3","url":"build/assets/index-BaxapIGt.js"},{"revision":"26e192b1d4b8b936ad14cc8e189fbe15","url":"build/assets/index-6eeRIh0C.js"},{"revision":"fd577ecb4751aec16c0acb6b20218049","url":"build/assets/index-4AnXsmOy.js"},{"revision":"5ac8c5be0503dc43c471a2c4fe2b6397","url":"build/assets/index-1ZxR4rIe.js"},{"revision":"f3b5dde3992aa88d8cab80aa77182b96","url":"build/assets/index-1AlVGDJo.js"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/assets/huel-DnOlOTCl.png"},{"revision":"85a281724e1dfeda56ec1efe06649c28","url":"build/assets/html2canvas.esm-N5Qv6hEC.js"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/assets/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/assets/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/assets/howitworks1-CXiXTdFw.png"},{"revision":"6cf73b251c4e58deef35e011e77ab04e","url":"build/assets/hidden-DtXCW1xr.js"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/assets/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/assets/giftbasketimg01-UPFBeLeW.png"},{"revision":"1d2d710d6a09f59dcfc17503321f9939","url":"build/assets/gift-Dp-IeML8.js"},{"revision":"4bb7afad26bd6447bbaaa4e77fbdc082","url":"build/assets/generateCategoricalChart-DdBZ5gIm.js"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/assets/fundbasketimg01-DNZiLLCY.png"},{"revision":"3683cdeb641a562a55ef5022782c0f10","url":"build/assets/focus-management-yEc1Q-h3.js"},{"revision":"ae03a83097cfb8492bc5659256fe27c2","url":"build/assets/floating-ui.dom-BFyafy_e.js"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/assets/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/assets/fillbank-CqRu24Vo.png"},{"revision":"b871b19df4f6f7e2b40bd2a3080f5bc4","url":"build/assets/file-text-T59KDFJV.js"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/assets/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/assets/editicon-errcM8K5.png"},{"revision":"ef854e119cb4e2c3a8b51e0bd41440d3","url":"build/assets/download-W6d12mQ7.js"},{"revision":"1fb2d8363aeacfaacaf31bb815c5ac07","url":"build/assets/dollar-sign-CUCQcUgq.js"},{"revision":"b7a1a379ac20680c7b6ca9b22eae3c32","url":"build/assets/dialog-BS_sNQR7.js"},{"revision":"de8aacaca26ef41b524b5d09a7771c81","url":"build/assets/description-CLbWqjcm.js"},{"revision":"ce7453cea0eb115d277a3e1332b6e869","url":"build/assets/debounce-byse7jve.js"},{"revision":"2382a661148fde0c99cc8da89d210f29","url":"build/assets/createLucideIcon-G1MeFyCA.js"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/assets/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/assets/comingnext-jAz-GIeT.png"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/assets/clsx-DQJ8k6jq.js"},{"revision":"35e43b9ef468e21c93ae22b7434c5910","url":"build/assets/clock-DbY6FODp.js"},{"revision":"590d307103b357262724f86a3c4157d8","url":"build/assets/check-Bl_irrux.js"},{"revision":"050b9c954fd6f9ea1370fae798fbde19","url":"build/assets/cartproductimg-IopLElGc.js"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/assets/cartproductimg-C1koo3C8.png"},{"revision":"e53c84ff77e521a2cc78f0b88c8fc1f8","url":"build/assets/bugs-DEoUBAPW.js"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/assets/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/assets/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/assets/asos-CIGR1i9R.png"},{"revision":"7aea3b09f653781d258b4467e0f65528","url":"build/assets/arrow-right-BH6FnsVZ.js"},{"revision":"97aa8067e821972f442325982ca59f01","url":"build/assets/arrow-left-CqkBkr9P.js"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/assets/apple-Cdm1sU91.png"},{"revision":"e038f52b86d6af682b7a6112a3a94bd4","url":"build/assets/app-H6_4DrU4.js"},{"revision":"8d6e703bd5ed15b2d41304c9767a8e51","url":"build/assets/app-BUVhoAXB.css"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/assets/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/assets/alo-KVTsT1zJ.png"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/assets/Works-DvB2Xm2x.css"},{"revision":"bd823b73992ba3e311f79f883f8ca933","url":"build/assets/Works-CLFQnL35.js"},{"revision":"938d67348379a5f731f9d22eac625649","url":"build/assets/Wishlistbox-CX9sr7RO.js"},{"revision":"d1d24ae00dc6f38cac9f2886dd1a95d3","url":"build/assets/WishlistGrid-Cxk7wIcy.js"},{"revision":"cc81d3f48ae4242ce51593b1bd9dead8","url":"build/assets/Wishlist-DfOpyFBg.js"},{"revision":"07abcf5cca568350f5c49fe4eb7070ae","url":"build/assets/WhyLove-KUa62CSO.js"},{"revision":"0e7d95c0dd6bb962bd47bf645aace8d0","url":"build/assets/Welcome-CcQa2HEY.js"},{"revision":"aaae0c5b66e7ddfb351bc78dbce078de","url":"build/assets/VipSupporters-YHAHEguC.js"},{"revision":"a2dba810ba371f24c6d68e6c3bc4ad12","url":"build/assets/VersionUpdate-DFABXY_-.js"},{"revision":"5da6d93dac8c8c3272509fb328b2cbfc","url":"build/assets/VerifyEmail-CV7sFYl4.js"},{"revision":"bd609f43696368bce21bf4cd498d6478","url":"build/assets/Userprofile-pE7hVJmy.js"},{"revision":"c968d00dcd59011f9329b138ce77f44b","url":"build/assets/UserCarts-rn-af3Uu.js"},{"revision":"a56b7621d3b0bc289c3a1d19d294c6d3","url":"build/assets/Uploader-Dp-C1Wd_.js"},{"revision":"0e6f145e89aa0d46921f3156b39aa8c4","url":"build/assets/UploadcareEditor-CVzG26CO.js"},{"revision":"5ce134543f38a0ba885e08bd37484660","url":"build/assets/UpgradeStripeAccount-BQJZ8hR0.js"},{"revision":"74bfc471a1e2f8b0b3e6b277e4b53686","url":"build/assets/UpdateProfileInformationForm-HAPFAFOW.js"},{"revision":"7edf8eb52f5be29b4a9a9070893c032f","url":"build/assets/UpdatePasswordForm-BV0IJxBC.js"},{"revision":"e8d9049d8b453382c39cdd1ff27fe5bd","url":"build/assets/UpdateAvatar-2g9dAh-8.js"},{"revision":"1cea01b6c51ef7e4306c68927cf705d5","url":"build/assets/USTERMS-D0RX_Hjy.js"},{"revision":"42f2589d966e3a3877adbaf1b30a2edb","url":"build/assets/TwoFactorSetup-BlZeKBb0.js"},{"revision":"96ecb07cdbef44fc0410c08238cc0197","url":"build/assets/TweetNow-zl53JQpe.js"},{"revision":"19569645a6683944469c695eac6ce236","url":"build/assets/Turnstile-B5wQtGTu.js"},{"revision":"c4f506f74fdcd7e374ec01bb52b14ed7","url":"build/assets/TrustBox-_zaN7Avp.js"},{"revision":"7d3d3afcc172892efdc361ab6fc39a24","url":"build/assets/TrendingCreators-MIqM224k.js"},{"revision":"b9d45133c33b422a940576f8b212763b","url":"build/assets/Transactions-lsOkOSRO.js"},{"revision":"5af0362f194a0c44c049e9053ea122de","url":"build/assets/TopSupporters-CySMlC-C.js"},{"revision":"35a37c60f10f3f837fd1536c2acec5ee","url":"build/assets/TopSupporters-ByPurZQY.js"},{"revision":"23cc6aa6da9383fc98324512116880a6","url":"build/assets/TopEarners-CipyouUb.js"},{"revision":"0a0b92ec8d7c24f5c584ecb74fecc8a3","url":"build/assets/TopEarnWishes-Bq1NV3a8.js"},{"revision":"44488f6a19dc9407eeb1844d7e500d05","url":"build/assets/TopEarnBills-BqwOlkeG.js"},{"revision":"8e45d9c5027ba3e532e1f39db0762a8e","url":"build/assets/TopBar-i0XrF-nu.js"},{"revision":"6b61993ac3a2041d3d13fb77ee08c698","url":"build/assets/Tiplisting-COdRwRtR.js"},{"revision":"70b1a3d12465c4dc398b4ee2b3e02faa","url":"build/assets/TipTracker-DF6gb7mr.js"},{"revision":"e34cda77995c54567fdd62922fad3dcf","url":"build/assets/TipInner-QcPAqgOM.js"},{"revision":"4f92d900617f0b4e3cecbdaa1a97b8f5","url":"build/assets/TimeFormat-6B2fYw3K.js"},{"revision":"99a2b2d5ce40d33dfd2e2bd3c82847f2","url":"build/assets/ThankyouMessages-C2Y-n9RT.js"},{"revision":"74c97f7385b109db20e0bc595aa02783","url":"build/assets/Thankyou-cPclEQpx.js"},{"revision":"e3adf0ba8a15f9467b4497c9a7a06676","url":"build/assets/ThankYouRye-DkQ3DHSo.js"},{"revision":"df5f828b69dd9abd0cc7f706d2a15873","url":"build/assets/TextInput-B6hQVgid.js"},{"revision":"f147c3d22687f7782ed5f8715ed6a25a","url":"build/assets/TestIntercom-Cl_In9Nq.js"},{"revision":"a33987919a5045329924f7561397061f","url":"build/assets/Test-DeTGKa4w.js"},{"revision":"65075f9092f810cf8c98033b14e9de8f","url":"build/assets/Terms-w_obxdmY.js"},{"revision":"535b62d09d9778ecae1537a9b22e05f2","url":"build/assets/TabbedDashboard-CF-8kp1a.js"},{"revision":"b66631200e009cc965c2e15d563cdbe5","url":"build/assets/TFA-Bnm5g0Sa.js"},{"revision":"ff004a1522b12782ba740c207dc73efc","url":"build/assets/Suspanded-CwMhGtEy.js"},{"revision":"def522bbe72ae2aec1b0160eff4fd7c0","url":"build/assets/SupportStory-zR-F_b8L.js"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/assets/Support-lrPSB2XC.png"},{"revision":"53b9e7bd9ecc30dfdbe0da10a48317d8","url":"build/assets/Success-Cm2FO-EH.js"},{"revision":"f3c6dae35ac1f98e8433ec597a2c79b8","url":"build/assets/SubscriptionEarnings-5y02c8U1.js"},{"revision":"304f641e36e2a3bf41d628166008cb50","url":"build/assets/SubCheckout-CcOVRc5K.js"},{"revision":"efd90ce545b0d9c3b4f45ac238cee148","url":"build/assets/StripeSafe-CrDJA7Hw.js"},{"revision":"79de22091c8ceb65b626cce7bbd15882","url":"build/assets/StripeIdentity-DOEKlv_h.js"},{"revision":"5a337d60fcb9703e4aa355acfbaa93c9","url":"build/assets/Stripe-COv1p2LL.js"},{"revision":"aa53849f5af941d513dc27f7ea927718","url":"build/assets/Statement-CV29A2ea.js"},{"revision":"c4828c3665a38ee3fa23b9cf333d15ea","url":"build/assets/SocialLinks-C4f6WZ8G.js"},{"revision":"e110997bcb19611663eaef9b160fa0bf","url":"build/assets/Social-Dd9BHq-v.js"},{"revision":"553cf404e393637a2ef83e6b2239f3c2","url":"build/assets/SiteSubscription-Dg0RxzU7.js"},{"revision":"00fdd5cb3cadf67a0146138f0346e4ed","url":"build/assets/Show-DB-UaXJp.js"},{"revision":"cb0890d6221c7c02642591655eaf5141","url":"build/assets/Show-C7jPBUBo.js"},{"revision":"3aa0f88581501a3b7dcc12675bb785dc","url":"build/assets/ShopTracker-Cd13mY1d.js"},{"revision":"583278b44ab94e96091b53e41eceb91f","url":"build/assets/ShopPage-MDgzWmtd.js"},{"revision":"96db24ea2c49da6f1138639de54b934e","url":"build/assets/ShareProfile-BLtWRPG4.js"},{"revision":"661a07f26a414ae331e68b7bd78cb415","url":"build/assets/Settings-CS3nNQkH.js"},{"revision":"b12af05f54aba1c576386bcd181572eb","url":"build/assets/SendTip-BZeYFnYp.js"},{"revision":"652795c004cb502d9fde37584305d932","url":"build/assets/SecondaryButton-DtBS7sqS.js"},{"revision":"d63f3931e058097f11a25201ab309072","url":"build/assets/SayThanks-D724_pCQ.js"},{"revision":"e5296a49210a8bcfea2a32c9ce4e28ae","url":"build/assets/SafeTransition-B-YjR04i.js"},{"revision":"30cd7e3415b5f1f3c04ed6d21718a97d","url":"build/assets/RiskTestPanel-BtGykfpV.js"},{"revision":"a4e421c4eef46db17d211bc5162040fd","url":"build/assets/ResultsGrid-C2rqteef.js"},{"revision":"c35c54808c5ef42a5c9aec23762209a1","url":"build/assets/ResetPassword-3scgBUek.js"},{"revision":"6f119ef8c83009833c87365dd2131bb7","url":"build/assets/RemovePost-B1aLeIon.js"},{"revision":"5ad1a847b8a62509386e393996022852","url":"build/assets/RemoveMembership-BAmzmKzt.js"},{"revision":"345118ec0f2f35fe4323d0fa467b4bd9","url":"build/assets/RemoveBill-CQYBU-nG.js"},{"revision":"069dbf97edce1d26aac14850fc933956","url":"build/assets/Register-WZPLopTj.js"},{"revision":"f19d7904fac73e07f2cf87d62b5c4594","url":"build/assets/ReferAndEarn-sjY2g3zt.js"},{"revision":"e3bdefe6012c46f21f8fc115bb832aa1","url":"build/assets/Redirecting-D5fro9xk.js"},{"revision":"711832020ef32e4aba15f486fbfb7457","url":"build/assets/RecentSupporters-BCgAKPaY.js"},{"revision":"e56427a29e22edc8cf8b9cb0c9e42540","url":"build/assets/ReactionsAndReply-DEZNZhv-.js"},{"revision":"f296a14e92db4c02b832a0f749b55c3d","url":"build/assets/PwaTest-Crfc02XE.js"},{"revision":"b057b99c5d0d68a5b112876e9eb8bb5b","url":"build/assets/Promotions-BWuGzhOD.js"},{"revision":"383773e27f93ab568377919d548c5359","url":"build/assets/ProfileTaskLists-BUMoxGfS.js"},{"revision":"27de993dc52ca7de583b077ccb20c08a","url":"build/assets/ProfileTask-B37Qg9Xl.js"},{"revision":"7b779d5366fa7120d9267dc0104fd37a","url":"build/assets/ProfileSteps-DT1pe3ur.js"},{"revision":"1fa60349d62ee9b647a0ee1dde228f0d","url":"build/assets/ProfileProductLists-CVz1Vplw.js"},{"revision":"25a7ace1501edb010deae62ec8aac727","url":"build/assets/ProfileProductLists-BDCt1h4i.js"},{"revision":"ad0d1d0b486f6eede7ae7994bc279652","url":"build/assets/ProfileProduct-C6tJtyY3.js"},{"revision":"a60fcac5032c67c24abe66015edc7a95","url":"build/assets/ProfileProduct-299ydeUj.js"},{"revision":"c67b755a46fd0f5e36914b5da7a05326","url":"build/assets/PrimaryButton-BOwT6ZIe.js"},{"revision":"5d712e7adcf5836294372a2d96e1d571","url":"build/assets/PriceFormat-B7mKUmTK.js"},{"revision":"e3be5c6dcc03af7debe858f07e8b7f91","url":"build/assets/PostLike-DfapsDy4.js"},{"revision":"e3341730243a028a8e49442228a1fad3","url":"build/assets/Post-BdrdO6Op.js"},{"revision":"6f604cf46f46acf5763604aaa5a9c99d","url":"build/assets/Popup-rv8bXBD7.js"},{"revision":"268dc7418cc28dff3f687f3f48989eb5","url":"build/assets/PlatformAnalytics-DPs-V6uv.js"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/assets/PaymentSlider-VUyWc9KG.css"},{"revision":"02fde7a66eb1b68262e49a926fd519af","url":"build/assets/PaymentSlider-DLgCFhIC.js"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/assets/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/assets/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/assets/PaymentIcon1-CnS4Hmbs.png"},{"revision":"3f2794484675c8b1d49d83cdc6c2505c","url":"build/assets/PaymentDashboard-Bh0OT8IJ.js"},{"revision":"96882a8e837919ac774471010407bb51","url":"build/assets/PaidTasksTerms-DSWzGEtY.js"},{"revision":"061e8278615eee57bea73b8c1152e187","url":"build/assets/PaidTasksAnnouncement-DDGiT3y7.js"},{"revision":"ed643dcb6a7600107212182ba5bfd6f9","url":"build/assets/PaidTask-Dvaft0EO.js"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/assets/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/assets/PCICompliance-qTSDRKZK.png"},{"revision":"9a21b5d82754be1811df0fe3114b40ea","url":"build/assets/OrdersLists-DPW6yw88.js"},{"revision":"45580dc57426f1f4b75dd5ef23f2f122","url":"build/assets/OrderDetail-QD9_9zCp.js"},{"revision":"4cac57b2a7598a3688ed17a39be1939e","url":"build/assets/Order-CXahnfUV.js"},{"revision":"254e0dda755547e370881a9560dcc45a","url":"build/assets/OldSubscribe-BU5SXSm7.js"},{"revision":"426980b48ee8391e6681b7a021b5644a","url":"build/assets/NotFound-DXAZrG-N.js"},{"revision":"540a58bf8bd7ba1359e2e026e0970bbe","url":"build/assets/NotForBusiness-BBGqL5Se.js"},{"revision":"5770cb126fe5f8fad56d472e11a92bd4","url":"build/assets/Nocontent-BWwiuTRg.js"},{"revision":"e8c72cdb77f5636966e66edc6eeca29a","url":"build/assets/NewVerified-CsqLtbWp.js"},{"revision":"fc4a8398b5044a1db19673299447b629","url":"build/assets/MyShopProducts-NpNG10p_.js"},{"revision":"1be360342bc22b44906eab5d6c4ec954","url":"build/assets/MyGoal-CICCDBD8.js"},{"revision":"6cc69b722be1a23b951c0fa494cd982e","url":"build/assets/MorConsent-BwzCY8T_.js"},{"revision":"f255997070a3ee608548d357a6ef61bf","url":"build/assets/MonthlyRevenue-BEAQB4j8.js"},{"revision":"11d5701f1d4b22bac0399f6db1d4f4d9","url":"build/assets/Modal-PvuqEzhI.js"},{"revision":"c1e651a8462056bf78a8e89a43b20c36","url":"build/assets/MembershipsLists-DPnr32Ub.js"},{"revision":"0c9d677059c141641b2ad4ea1cbdb3d5","url":"build/assets/Membership_dashboard-DWnlJ-m-.js"},{"revision":"af11a52483253960fb3af2f0417e19a7","url":"build/assets/MembershipTracker-B_fDqxJX.js"},{"revision":"121bf62c9109a2894fa673261d48b0d8","url":"build/assets/MembershipLists-D8BoAEHf.js"},{"revision":"5dc8b3eb64f5f275af2011d25e15cd95","url":"build/assets/Membership-hSMrZv2O.js"},{"revision":"22ff4920cd84ac565231af8a61a64d23","url":"build/assets/Membership-QycRuvNK.js"},{"revision":"3b7319b08a5f312c60df976fb284e7d3","url":"build/assets/MemberCheckout-CbNUnUqI.js"},{"revision":"1ef110a345d0811f54d8730d5d39b9c3","url":"build/assets/ManagePasskey-DKTL5V4S.js"},{"revision":"a7aa73b2078b24dd64284c33e896abd2","url":"build/assets/MagicBellNotificationDisabled-DJIDLkJ3.js"},{"revision":"021067d97bf22d5f0294ae0e2b1ea45e","url":"build/assets/MagicBellNotification-Db4j-aZ8.js"},{"revision":"b058c2230cdabdeb0d541dcf5f284cd2","url":"build/assets/Login-CQJbPgsz.js"},{"revision":"68abaf5de3a4107039657655c84e81e3","url":"build/assets/LoadingScreen-CT0KIK-u.js"},{"revision":"6cc0c906fb9c33bc78435dbecb125743","url":"build/assets/LoaderButton-BV_6I4GP.js"},{"revision":"c26b9520fe7e0bb6e20508d670e59d4a","url":"build/assets/LiveBarSection-C4-7VTel.js"},{"revision":"4d5b9054502d955547cf69cbce9bd3fe","url":"build/assets/Lists-Bl-7PSol.js"},{"revision":"6440a102f1f136c0faf13edd48202b90","url":"build/assets/LinkTwitter-sgrxwyug.js"},{"revision":"df5018d7b0a51ceca00b94796f48773c","url":"build/assets/LineChart-2DLv5Q3O.js"},{"revision":"ad0217c6caab44cda6e9879fbf63c420","url":"build/assets/LeaderboardStars-BxU1Na7f.js"},{"revision":"8a1c1c3c95e616a439053ac3ffe90882","url":"build/assets/Keep100-BoI71N4a.js"},{"revision":"897c015340dc0d77dfca2902130fbb77","url":"build/assets/JoinUs-ESdtF9EQ.js"},{"revision":"daae99696ee7d4545e7f633e4c8897b8","url":"build/assets/Item-BWKy-l35.js"},{"revision":"a1af8d50d7bf3d9ca9da56bc72b22429","url":"build/assets/IntrosVideos-BSCSuJlo.js"},{"revision":"4a38a4a97a7ed79960e684038f562fad","url":"build/assets/IntercomDebug-CAXAyZ-2.js"},{"revision":"1a3202b1c42f234bd9ec111b27fe4e50","url":"build/assets/InputLabel-BeR7NsAh.js"},{"revision":"a607b802edb778f58d785c965f8df445","url":"build/assets/InputError-C2WVQntw.js"},{"revision":"75037218d77e6b87e2ffbde59af756a2","url":"build/assets/Index-_Iz8tnRV.js"},{"revision":"98b0fee6a9b9d13ab2386ea9a24a1293","url":"build/assets/Index-DDEttbU7.js"},{"revision":"6e6bba79dca6807fdbb7713d89bca873","url":"build/assets/Index-CxmJ-0C3.js"},{"revision":"31a4cecde24254f683e2046031d7d0b9","url":"build/assets/Index-CqyWRLsI.js"},{"revision":"58ebc173213573d7449e5a2ce5e8983e","url":"build/assets/Index-CaZL28cQ.js"},{"revision":"57fe40daef1e6c28a152c8ecb7396c1e","url":"build/assets/Index-0AvSGVFw.js"},{"revision":"6fea9246280606db543dacff64aa3dbb","url":"build/assets/ImageGenerationWithAI-C-yUNowt.js"},{"revision":"39dbad68ef8967b841096d9b0904a2bc","url":"build/assets/Icons-YkVWwKoN.js"},{"revision":"8ff453af0ed2775d7f57a1f6fcf372dc","url":"build/assets/History-9poAsNFY.js"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/assets/HeroWishlist-BvpIkzQT.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/assets/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/assets/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/assets/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/assets/HeroBg-CbJjqro0.webp"},{"revision":"162974adf0bf3e2905e2562e8755e81c","url":"build/assets/Hero-DQSRTP7a.js"},{"revision":"9a14e9b5fb3730533276b594005c87c3","url":"build/assets/Header-DyZsZzmP.js"},{"revision":"1a0a3ab8d96c4bee5ee08425afeaea77","url":"build/assets/HappyCreators-Cxsi_vak.js"},{"revision":"316d52663b83f82716637067191428ef","url":"build/assets/GuestLayout-d5vNCWf0.js"},{"revision":"c43b70a88a611357a0976cdecad6ff3e","url":"build/assets/GrowthTrends-qkmWkfMG.js"},{"revision":"7b4f5a0bfe9921f8321299d44c2276b3","url":"build/assets/GlobalCheckout-CLmlropb.js"},{"revision":"3f438882fb67695809357da929c0621d","url":"build/assets/GifterTips-BzzVEmIc.js"},{"revision":"b87de9f1e80659bf8092b90df599e14b","url":"build/assets/GifterSubscriptions-osAwBm5J.js"},{"revision":"1e2464348f5755a5943758374f0b0006","url":"build/assets/GifterMembership-CzRsmqfw.js"},{"revision":"8b0d8f8bda1de3c7f1deea488fdc3e42","url":"build/assets/GifterMedia-88JxKepC.js"},{"revision":"e3c2ea418ad0862328a2d8102fdf4058","url":"build/assets/GifterItems-CYmhaYMT.js"},{"revision":"ab90c5073cf5a0bf4352cf5161e0bb00","url":"build/assets/GifterFeed-DPIMOUJT.js"},{"revision":"246cce2c0c49357ae24ae3cc874387c4","url":"build/assets/GifterCardVerification-HWKEKq0-.js"},{"revision":"eabb233d38e1a7a8f6bba94d94817e78","url":"build/assets/GifterBills-ewGRn6mv.js"},{"revision":"bb97343e9be0e6cdfc2fcb845aecde92","url":"build/assets/Gifter-DDdkmEaA.js"},{"revision":"b5274add1b9c0724d1b3f0c2e4b4189c","url":"build/assets/GiftStore-ByXPeg9K.js"},{"revision":"92d00223650f434b53dd9b4bcb37883b","url":"build/assets/GiftListing-CdBGIUEX.js"},{"revision":"e272f00e7c40dc88a6edca01633480d1","url":"build/assets/GiftEdit-hospSFJb.js"},{"revision":"e64e9f04e0ba9dd367108838a4e9cf10","url":"build/assets/GiftAddCart-CYMjGXC4.js"},{"revision":"44fd2a94f891544bc463d3304b8475ac","url":"build/assets/GetCart-DQK8GZoc.js"},{"revision":"a4309fd91b34f97c3294b50155f3d05d","url":"build/assets/FunPart-T0UbmYlO.js"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/assets/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/assets/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/assets/Fun1-DDq1R1Kv.png"},{"revision":"e7625f943b6e64bf07f530bc0f799c9e","url":"build/assets/FounderProgramAnnouncement-BrXHJJ0w.js"},{"revision":"46551758299ed1fa4351c98853333623","url":"build/assets/FounderBonus-CBKHAMkc.js"},{"revision":"fd5c4a4d7f8ad140d32f0f866f891213","url":"build/assets/FounderBadge-CfpHF7DD.js"},{"revision":"17d031823e3b4fdd35e843b8f5fe1774","url":"build/assets/ForgotPassword-DctmQMC9.js"},{"revision":"e6a957cb9c36202b0f7c0d05512e87f3","url":"build/assets/ForCreators-BNny8zAN.js"},{"revision":"8f14e3d8ef039a4a3c8388cb011b932f","url":"build/assets/Footer-Dtf5QUeJ.js"},{"revision":"4c343ff436195905a59deebde9905cf1","url":"build/assets/FollowButton-BtxfSFkO.js"},{"revision":"0620e791467461d7ce177bdaa5397491","url":"build/assets/FlashMessenger-BT5hhEqD.js"},{"revision":"43dcb28c4cfef57b16fd7cfc8e603415","url":"build/assets/FiltersPanel-2U-K5LJW.js"},{"revision":"4e9ccbd636065d772294107f59522769","url":"build/assets/FeedList-flQq6_jf.js"},{"revision":"8bfa215c22e0b9a31080b2f6ed7414a0","url":"build/assets/Features-BgIsBrIM.js"},{"revision":"2a54ee302eed1a5acc9e5ee24f44eebc","url":"build/assets/FeaturedCarousel-BGkp0FPp.js"},{"revision":"d27e487fdea4e85a50c9d936d7cb483b","url":"build/assets/FAQ-CGfuGqpP.js"},{"revision":"9629380c0e1b1653d9a68b625c56c31c","url":"build/assets/Expenses-KWTjOqyO.js"},{"revision":"a0b3473902ac6e3e53cd4309fac20ef1","url":"build/assets/ErrorPage-IjYykf0s.js"},{"revision":"136725c38059b627f06f61ca90a6ecd9","url":"build/assets/EnterOTP-Bpq4UZmx.js"},{"revision":"30e745f6a903d2842b2addfc174dc4b2","url":"build/assets/EnableCardCapabilities-BNBfTjTX.js"},{"revision":"5f74fa5cd88eb79b3bd57f1cd15f4c65","url":"build/assets/EditProfile-CgL6pvvO.js"},{"revision":"aad78d72eda5a1799e20611edf787c54","url":"build/assets/EditMembership-DTnGvLdY.js"},{"revision":"9ab7ed1785cb1705404e2218160702ef","url":"build/assets/EditCategories-Ba_JStsB.js"},{"revision":"1cd2444b749d24170dbc6049f42eaabe","url":"build/assets/Edit-CzvRxeqU.js"},{"revision":"f8e53a9fe0737cceb9ef7ca19413c21a","url":"build/assets/Edit-CHC3pZD1.js"},{"revision":"31182c22737e6af5c1c800c9b18a85fa","url":"build/assets/Earnings-C6VJE3yV.js"},{"revision":"a9dff70311f64c3dc7efadc52067e21e","url":"build/assets/Disputes-N5Nmj10P.js"},{"revision":"d474f0c5b9a323a628d8dc34ca954dfd","url":"build/assets/Discover-DsagMc5P.js"},{"revision":"df741325f8b853803fc2c58e1240a68d","url":"build/assets/DiagnosticPage-BGu5Jr4j.js"},{"revision":"00056d8c377c306a096ffc196b6910df","url":"build/assets/DeleteUserForm-CID6GTvN.js"},{"revision":"f2fbcde01ba1113eae26ec40855f52b0","url":"build/assets/DeleteStripeAccount-CkVNn7YY.js"},{"revision":"482d9912b98c1ffa7b700da94cd6b5cd","url":"build/assets/Dashboard-Dw9w26Nz.js"},{"revision":"93bd9058b881fbc725b4195dfcd81c77","url":"build/assets/Dashboard-DjB_MtxG.js"},{"revision":"64843e55d705261c3b4be152985791df","url":"build/assets/Dashboard-DY4TGscj.js"},{"revision":"ee3e4a578375f9cbf98552c172c6eef4","url":"build/assets/CustomProgressBar-eGJEJg5k.js"},{"revision":"edaefe0e9b2d6ae880cb437f7557a243","url":"build/assets/CreatorVerificationNew-DovI6715.js"},{"revision":"a0289647f80742c2e92df95a1ad0e8ef","url":"build/assets/CreatorVerification-5WoHpwIc.js"},{"revision":"38ec9c83b8310fa16ab846985c940de5","url":"build/assets/CreatorCard-CtLpzMgV.js"},{"revision":"1ee624aa3cf99139747cb793b1eb3815","url":"build/assets/CreatorActivityWidget-0bvh8K8V.js"},{"revision":"6661ee14be5e3602d2617390e47af926","url":"build/assets/Create-D35GoEGz.js"},{"revision":"997bd9420689d45a4ece92ef40dfde26","url":"build/assets/CountriesShipping-zg16fixt.js"},{"revision":"7383916f40aa7068b45a5fd108360d18","url":"build/assets/Countries-DT7AItnu.js"},{"revision":"d67bc23cc5bcefbdc14dbd2a5d0a3447","url":"build/assets/ConfirmPassword-BiUZko4P.js"},{"revision":"9e04076345576cc473ea6feb92da174a","url":"build/assets/CommetsLists-_EVT0BzX.js"},{"revision":"f03a0e124cbe6919d21b8d2b7ca9dfa9","url":"build/assets/Comment-CkPrRwBl.js"},{"revision":"18ed88324b030cc599aa717bb34332a4","url":"build/assets/ComingNext-hOIsFCmS.js"},{"revision":"8065b0119458a01d1bd07350430eec78","url":"build/assets/ChartDashboard-iMWrBhKw.js"},{"revision":"88ea04e6c726ba72e7573784e493f0da","url":"build/assets/ChangeVat-0ib0_qfl.js"},{"revision":"9d958450c404a469d6d99fee2d4daa6f","url":"build/assets/ChangeCurrency-DmYg_Qx-.js"},{"revision":"6366de24a291e15f39b9f6cc801392d8","url":"build/assets/Certificate-B9oLRx9r.js"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"8d2c1e1e5ff145a4808907c6546c4607","url":"build/assets/CategoryLeaders-BDjot-ZO.js"},{"revision":"6dae473c2a96aaf70b4ae0262fd7b1da","url":"build/assets/CartListing-JGpFl4Dp.js"},{"revision":"2b715fb9d49a8684eea588b8831d7b0d","url":"build/assets/CartItems-wIS6-KNR.js"},{"revision":"4db73c5b245b2e81420b11d5b5303e10","url":"build/assets/CartItem-u1oxZG7X.js"},{"revision":"548ae7d0666f5d1364d45d2ba1179048","url":"build/assets/Cart-BAK7fRR6.js"},{"revision":"84afcea38daad21dea3da7682016e0ed","url":"build/assets/BuyShopItem-Dy4i2MOE.js"},{"revision":"45af46e9e22fb590af670d2329f4e695","url":"build/assets/Board-DISu_OHZ.js"},{"revision":"3a4bddc040c1989466df8c37c382e2ff","url":"build/assets/Billslist-CAkthNu6.js"},{"revision":"9796ce94ee20ca7e0af1cef40228eabf","url":"build/assets/BillsTracker-C8Csyc1j.js"},{"revision":"db6e0d2027577208be9d52c732cac680","url":"build/assets/BillCheckout-BWZjIJQ0.js"},{"revision":"91b5cee6ad4d68e847112ce4f04c2efa","url":"build/assets/Bill-C76E8P1l.js"},{"revision":"bcbaef5abf69d99683571b7cb8546113","url":"build/assets/Avatar-Bi1jcAC6.js"},{"revision":"460a88524ee852235757997fda4d7fa2","url":"build/assets/AuthenticatedLayout-QUt2xni2.js"},{"revision":"9a41b588f6a213fb3359ed744e8d9f49","url":"build/assets/Analytics-BYwviQ4-.js"},{"revision":"da300180f06f3611937d850f9c8fc6bb","url":"build/assets/AllWishes-DoPiq00_.js"},{"revision":"2de72c087c1c789076d8c2512dd9f0ea","url":"build/assets/AllCountries-BIAGGOEY.js"},{"revision":"0b5e98393892d8255aa84bc4064ecc36","url":"build/assets/Alerts-CHSNXTC_.js"},{"revision":"23d88861ba319cc5ea6a93401dc81bd7","url":"build/assets/AddressForm-CwErsx2y.js"},{"revision":"597d1ce0ccacaf0ce41c1ca072814f90","url":"build/assets/AddShop-2FL-A2Go.js"},{"revision":"7563939a6ffcd33360ca987380d7f28e","url":"build/assets/AddRyeProduct-C6Cdggem.js"},{"revision":"a1441672db28f0f3b239bbd9fd9b206c","url":"build/assets/AddPost-DOHHv7rs.js"},{"revision":"8e3b8237a042d4942d2c762a81baab74","url":"build/assets/AddMembership-4-kSG0Ja.js"},{"revision":"4f9e541cd9d325a15f025dc201814bc4","url":"build/assets/AddItem-D5mTD2od.js"},{"revision":"529353b532ecf33516523552ab0c87de","url":"build/assets/AddIntro-BqisVpH7.js"},{"revision":"d94eedd9edb1ca3e64c56af9af6178d7","url":"build/assets/AddGoal-BBjKtwZ1.js"},{"revision":"06ecc21c998702626a02bdac012991f3","url":"build/assets/AddGift-CueDwSD3.js"},{"revision":"b51c69442db746ce3b3900e43fdf7c3e","url":"build/assets/AddComment-Bo9c6H8e.js"},{"revision":"c7d952171646bdae5b79a3ed676d3bb7","url":"build/assets/AddCart-CEBw_g3Y.js"},{"revision":"500a68acc3770c802c7a67d287b33683","url":"build/assets/AddBills-wPh3qcMr.js"},{"revision":"bd7f0e1dcb3e6e20e0d6badbfb1e0487","url":"build/assets/ActivityStatus-CyMMEtkH.js"},{"revision":"a0f0d6318fda4bd8849ed5c24bc840fc","url":"build/assets/ActivateSubscription-I17VyRos.js"},{"revision":"87a531f3c5ef90b0cba8657fbe326495","url":"build/assets/ActivateCard-RqDOM7ff.js"},{"revision":"e283322b5ed8ba1ee84889211b69f952","url":"build/assets/ActionRequired-CvbFIGBP.js"},{"revision":"68a7f33b138cb2c38f378ed3698325dc","url":"build/assets/AchievementSystem-Y-XhLnB4.js"},{"revision":"bca06da6a0f868138efa7bdcf376bc71","url":"build/assets/Accountsetting-De0SxkYE.js"},{"revision":"520c8af59f1119552fc69827e58bad0f","url":"build/assets/404-C__xo2XJ.js"}]);

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
