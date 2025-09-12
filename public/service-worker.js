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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"21282797a9ffd5c1059490633febb00f","url":"build/css/app-D9EHJWu_.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"a908e4a029b9d5bd07a5204025fac64d","url":"build/js/Accountsetting-BwULWHB4.js"},{"revision":"8264810a61c28cade2862a213a574a36","url":"build/js/AchievementSystem-BC387MKv.js"},{"revision":"2e986b83dd783cec8dd9ff4d212284bf","url":"build/js/ActionRequired-BSgIOQn-.js"},{"revision":"ba254537176d52a602f33308bf34abb6","url":"build/js/ActivateCard-BtOA9QiD.js"},{"revision":"eb0d717b5498c4b030a7b0945f6b9d16","url":"build/js/ActivateSubscription-oDD27M_Y.js"},{"revision":"bfc51ab95e51de83bcd63e72153076a5","url":"build/js/ActivityStatus-CplfunD-.js"},{"revision":"afee6fd38c6472e5d444e34975182671","url":"build/js/AddBills-C9SgaiGZ.js"},{"revision":"f6556e91b2709bf1ebc5ae6300b64e27","url":"build/js/AddCart-V4-x30vQ.js"},{"revision":"f74cc6fb9d992f8f98189a5c30ea8429","url":"build/js/AddComment-CKoL439Q.js"},{"revision":"1ee45c74d12c04a4ddcfa67c4a9347ae","url":"build/js/AddGift-D8IBLrgw.js"},{"revision":"d5b145097a5f120c47ebcb8152b5fb36","url":"build/js/AddGoal-CeeP9li_.js"},{"revision":"6640d41851d2d3535db50bd50df22e7b","url":"build/js/AddIntro-C-LQQmFL.js"},{"revision":"985584ff9a43061a31640f68fd76fe66","url":"build/js/AddItem-DEpOoyZ_.js"},{"revision":"6aa48b5bd06beb154eaf27d3e073df7c","url":"build/js/AddMembership-DIbfHV5O.js"},{"revision":"0a0f48c7a597909fe0a90dc8f25c9a74","url":"build/js/AddPost-BrQz2IjH.js"},{"revision":"14e48cd8a1fc320990a49911d4204dc9","url":"build/js/AddressForm-Fl2Sxy8y.js"},{"revision":"8d05d81fd05809a68d570f8fdc203b91","url":"build/js/AddRyeProduct-Dp4WTxm9.js"},{"revision":"ef83317fa1f91165e6a048b15dbb7e61","url":"build/js/AddShop-7rhFih9_.js"},{"revision":"6fea86c9cdd4d6ff62156712e28b465f","url":"build/js/Alerts-Dj3oMb-_.js"},{"revision":"ebbda0de7bdb6499f1a60da8134dae45","url":"build/js/AllCountries-BX3Scd8r.js"},{"revision":"0f671b4c3e88fa9435d50da1ad50366a","url":"build/js/AllWishes-DvQHnoel.js"},{"revision":"ac61987d0abb4cb4c7eb00fe274a2fa9","url":"build/js/app-CYziJg8x.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"994e18ab138836c53f1d0fecfa654829","url":"build/js/AuthenticatedLayout-C4sqcZl4.js"},{"revision":"9859acebfce05dd1a912ef72462df02e","url":"build/js/Avatar-CX4U5TIw.js"},{"revision":"dff4ed04cfa84afddf54890c8ec85f45","url":"build/js/Bill-BYngpJOp.js"},{"revision":"37b65c209f407d27a81b9f2c52f1dd1b","url":"build/js/BillCheckout-pmvn-Vx6.js"},{"revision":"2f8f3b07bbf950e4595f2238e45c5ba8","url":"build/js/Billslist-B_Q3o9Q9.js"},{"revision":"f124bad1189fa87d403f0a52942da28f","url":"build/js/BillsTracker-CNQNYXoY.js"},{"revision":"70aab95a5745c40fd60cfe4075784463","url":"build/js/Board-Du9od-9k.js"},{"revision":"a6f7a528cfed514bf606678fc7c0a56d","url":"build/js/BuyShopItem-DxRr_r1L.js"},{"revision":"96e735ca016091c779ac0519d173558c","url":"build/js/Cart-C2lizS6Z.js"},{"revision":"86383c2f781bf63a696ae69b4ebe8c56","url":"build/js/CartItem-BCVJUpw8.js"},{"revision":"68ad44626d2ea36fba7f820e655c9f8d","url":"build/js/CartItems-TjGcJ2sb.js"},{"revision":"0f9d76449535c834678994b57ea23d6d","url":"build/js/CartListing-CTfpG6Dy.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"551bc97d88d9fa4324adb42cd737d046","url":"build/js/CategoryLeaders-CZkf13Dh.js"},{"revision":"14df7e22b35b507f6930856cee12f8e0","url":"build/js/ChangeCurrency-DJi-IEtT.js"},{"revision":"ce2ca5144f2e1f140d9353684ddedc33","url":"build/js/ChangeVat-Bo7wy1Ya.js"},{"revision":"0e353b79f8931c384efb5a17c58b96ef","url":"build/js/ChartDashboard-Dt_2izG9.js"},{"revision":"4229d5c44ce6cb449d6e7d7e73c3c167","url":"build/js/ComingNext-5cj3mtcQ.js"},{"revision":"03a8dfc5ab694bedcf973c68ba20cd66","url":"build/js/Comment-DRPHWcEJ.js"},{"revision":"95901f486f1bd98ecae0784d89483e19","url":"build/js/CommetsLists-A53fB6Lj.js"},{"revision":"2ce8a1645dc44f610b9efa81f86d0233","url":"build/js/ConfirmPassword-B4q4oaHv.js"},{"revision":"f768e71ff62c8a737fcfb2d05ce852bc","url":"build/js/Countries-BZwXqBzy.js"},{"revision":"9fbe8c6a9f2e9a306237d7a6a63b4298","url":"build/js/CountriesShipping-DtnQbm16.js"},{"revision":"08a5cb38ce103c1ae7fce66b80f9fbf0","url":"build/js/CreatorActivityWidget-CvFWExnw.js"},{"revision":"cc2769cf9d7f5d39843d0639687091ea","url":"build/js/CreatorSubscriptionWidget-C93Q12XP.js"},{"revision":"b1bd83343c2346b24d2a731a8ec6b8e2","url":"build/js/CreatorVerification-Bj4NLfvO.js"},{"revision":"0e252b325c5aa7f00c65dc145ceae724","url":"build/js/CreatorVerificationNew-Bs5lQOel.js"},{"revision":"addebc067dec333216e2155c62e27247","url":"build/js/Dashboard-CIVwSyFt.js"},{"revision":"da16fa4e23571c44774ef616bfac8db2","url":"build/js/DeleteStripeAccount-DeGYPBXd.js"},{"revision":"68eea8c286c8fc81648bb5484c342c13","url":"build/js/DeleteUserForm-Br04HLT5.js"},{"revision":"1e2e3e8630aadee34a7fe5f28083ac96","url":"build/js/DiagnosticPage-CMGHZzBw.js"},{"revision":"ec80a66b152064cee86b5156c6ad114c","url":"build/js/Discover-BpjfGwXB.js"},{"revision":"5c5ad1cda3cff2bd73b1326c006baca4","url":"build/js/Earnings-w4bapMqL.js"},{"revision":"a34b8868dbfe51be6fc74fa83542944d","url":"build/js/Edit-D4HUdQzA.js"},{"revision":"8b4db394c6a0e8667f576b927893fc81","url":"build/js/EditCategories-0Y9-ACfG.js"},{"revision":"efb8455c4e27eb652189653d5abaefdd","url":"build/js/EditMembership-uaZeM9IP.js"},{"revision":"1d6063a6f29d1b5411384e30a8360832","url":"build/js/EditProfile-BPZmxcDS.js"},{"revision":"bab4c2e63f2cb26f45fb23c6680fd47b","url":"build/js/EnableCardCapabilities-CQ09_aqs.js"},{"revision":"671f116f0bd403827629d620fe00e746","url":"build/js/EnterOTP-uyPIFElx.js"},{"revision":"30e59cb3c7fc0e442f995f13d6056db3","url":"build/js/ErrorPage-Cg1or8Lm.js"},{"revision":"4058a3222edd0f2983f853f00eb39392","url":"build/js/FAQ-CVW1l7TN.js"},{"revision":"e6479d2f46f0c17f0b97f1e753ed4f64","url":"build/js/FeedList-Czqx7BKS.js"},{"revision":"ed9a880e9d0a09bde38f3a88c64e1bea","url":"build/js/floating-ui.dom-C26eFCNs.js"},{"revision":"18d1acdb59d6863c67416c6f6454ff73","url":"build/js/FollowButton-DdkiRs_r.js"},{"revision":"a027d9fddc893bf36e45c4930752d64a","url":"build/js/Footer-TZUwv1sf.js"},{"revision":"1b7473403c7f4960bdb387b775cfaad6","url":"build/js/ForCreators-ewhYunVX.js"},{"revision":"b229a5bb0454913e3a6731935a53aa5e","url":"build/js/ForgotPassword-IcyPf_ad.js"},{"revision":"1009abd12af69d179bf0727afbb3e402","url":"build/js/FunPart-BEq8W3vs.js"},{"revision":"3771af0a345c506dc683ba6c432ea9bf","url":"build/js/GetCart-D7m-cjKL.js"},{"revision":"5172cd2e9c0d45abcb072f2eb8192735","url":"build/js/GiftAddCart-BjjUBEb8.js"},{"revision":"1414297673410868ec2dd799aec67103","url":"build/js/GiftEdit-BLGBiZjo.js"},{"revision":"8578863d01a5309d784e3a60e5a423fb","url":"build/js/Gifter-aoOioyeF.js"},{"revision":"635f1f4a42b6b3a31f2d62a2cb733b3f","url":"build/js/GifterCardVerification-oEoOXhcJ.js"},{"revision":"5dd08a3b1ec0f3196ce6d91ab17f8147","url":"build/js/GifterFeed-0VBLZ48Z.js"},{"revision":"3ecdaf7421186decbd3adfe99aba8047","url":"build/js/GifterItems-CY2ZM_hy.js"},{"revision":"e1720946a0c57433eccd3d8e13163e0b","url":"build/js/GifterMedia-B3OjoT4C.js"},{"revision":"b2eaaba580438b0fa65af147dd4ecebe","url":"build/js/GifterMembership-Y5xZ4wYX.js"},{"revision":"e805cb3ff9dd567520115f50be290b29","url":"build/js/GifterSubscriptions-BlKMDPsz.js"},{"revision":"83d385c35ea5a3d42962814bdc42881e","url":"build/js/GifterTips-DvmohRnF.js"},{"revision":"a210ca5b8531352353de6ea208dc3c62","url":"build/js/GiftListing-BQR62Vmk.js"},{"revision":"5c6988a5bbccfebae43029daf03753de","url":"build/js/GiftStore-BGcdGgIB.js"},{"revision":"05a6be3cbca670e56e0c88daee558841","url":"build/js/GlobalCheckout-oK2ber6k.js"},{"revision":"6874e361ca9ba0bea03567ac21ff5c3c","url":"build/js/GrowthTrends-Du8SuyDi.js"},{"revision":"42159910cd985956240410314d55a3ce","url":"build/js/GuestLayout-8TfbnUQv.js"},{"revision":"1f8911b61aef30c9e4f13b3548839983","url":"build/js/HappyCreators-Bb3MRG91.js"},{"revision":"edefb2e02e5f79d85a6671fc956dd3ff","url":"build/js/Header-B8-P5O-L.js"},{"revision":"ea32c5e344039caa391fac51b05818cb","url":"build/js/Hero-DVSgphBA.js"},{"revision":"054742b362878793faf15c667640872a","url":"build/js/iconBase-CA6cnCXX.js"},{"revision":"a43e924ae65887783e352b1c0446d6c4","url":"build/js/Icons-cmdv8GNi.js"},{"revision":"28e8ccc916ff116bd6fbf0e9a8a87f6d","url":"build/js/ImageGenerationWithAI-C7pO0Ien.js"},{"revision":"607f6054c7de8ae511d3e7bf62fd6dc9","url":"build/js/index-8jnoSxUb.js"},{"revision":"3b97654813a68d118185665ee0611d13","url":"build/js/index-awCeu6B2.js"},{"revision":"cb4c9c7b2f242ce0a4741a70656ff849","url":"build/js/index-B8vTlHqt.js"},{"revision":"5b05b3009c66e9e0db87c3a7caa6cbe0","url":"build/js/index-C--1x6V1.js"},{"revision":"f10476add446202b388f629edf31e2ef","url":"build/js/index-CA5Z-Pbn.js"},{"revision":"62dfbb740cdf516eab388cca0666d7cc","url":"build/js/index-CJV6rCnP.js"},{"revision":"ae90ae267127edceee9ec0aa8995998f","url":"build/js/index-CK2siquj.js"},{"revision":"cd9abfe1d883009d76be7e49e3599728","url":"build/js/index-CKhJD44G.js"},{"revision":"65fa9eb19f5e4682a3c6543b85b77cd5","url":"build/js/index-Cs0TgZ2R.js"},{"revision":"6caaa6a1da714df31b1bae1f0aff1178","url":"build/js/index-CVZKauDD.js"},{"revision":"1c4e17cd7148de9d2aa8d352faa0ad62","url":"build/js/index-D_TPgrTY.js"},{"revision":"01fb6c89f17e1b955abbeb0d36797ea7","url":"build/js/index-DMbalZJ-.js"},{"revision":"f520832a7cffe9b2a27035fb0e80b34a","url":"build/js/index-sA-tMLZP.js"},{"revision":"7a8f23f3b742c0d869ef183c92b0ad3f","url":"build/js/index-tXn96RDV.js"},{"revision":"6567c45cd9d9d66a2b8d3ec73ffb9216","url":"build/js/InputError-Df4wx-cL.js"},{"revision":"1ea29f3c98246242bcf678ebf4e0c2b5","url":"build/js/InputLabel-B1Y6DKAo.js"},{"revision":"b2062396834c9264ed87dc882f34d0e5","url":"build/js/IntrosVideos-5OYljjrD.js"},{"revision":"d9ee3386923ab79d9667896452506fd1","url":"build/js/Item-CUSb4D_L.js"},{"revision":"b5bba7ca30e49841d7ba26c44ad4f152","url":"build/js/JoinUs-CQE5D0cF.js"},{"revision":"e9725b01db5462c62c0ea9e8116707a9","url":"build/js/LeaderboardStars-BH0CWwzo.js"},{"revision":"ff481785d710bb940551d9e26ce513bf","url":"build/js/LineChart-B9EXQX_t.js"},{"revision":"082b08859e006423c37ace712dc47197","url":"build/js/LinkTwitter-BdWXd2xi.js"},{"revision":"5237fe5d2f57cb7fa0df96b8296495b0","url":"build/js/Lists-FtRKNuzp.js"},{"revision":"5adde9a72837a7e3d4d499eb361ed4d0","url":"build/js/LiveBar-DN6e6NzE.js"},{"revision":"433766b0e8560f81682cefd3aeb09414","url":"build/js/LiveBarSection-Cc6FNfPq.js"},{"revision":"426e297c3b7a3abe5f586edf818eb909","url":"build/js/LoaderButton-BoHbe5q6.js"},{"revision":"cd09e25f481988158ff75cfa10e03498","url":"build/js/LoadingScreen-NbTKARPD.js"},{"revision":"13925aade722a8038b8a3edfa9399b1b","url":"build/js/Login-D4ZNB120.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"3e2de220dd65f627bb81eb33dc29f1eb","url":"build/js/MagicBellNotification-DrQnf2dF.js"},{"revision":"4a6a43384d291c50c46d65024d6d1c55","url":"build/js/MagicBellNotificationDisabled-CDiAhcjX.js"},{"revision":"dad63b555d489f6347de7ef6901b6447","url":"build/js/MemberCheckout-4kIgFtDz.js"},{"revision":"4ff1ae354924d896c145de2cdcd746d0","url":"build/js/Membership_dashboard-BKHRAvTj.js"},{"revision":"6bbfc93640c2c44e3abd64da089c4272","url":"build/js/Membership-D8Gh4lUX.js"},{"revision":"edd46ebe40e961e638e934fe83afc11e","url":"build/js/Membership-DFD-UfjH.js"},{"revision":"70913486ccf010e7865c513155ab347f","url":"build/js/MembershipLists-Dk4xR1sU.js"},{"revision":"af9652bb9f6409608319de8baddac14d","url":"build/js/MembershipsLists-adQ-Pd8E.js"},{"revision":"24e5c9bbbd3b4a132cf7950f14f73146","url":"build/js/MembershipTracker-B84pyyo6.js"},{"revision":"b141cb64a4dfe965dad62cf671311e8c","url":"build/js/MonthlyRevenue-CWOukWE2.js"},{"revision":"6446ac536612683f55a4c78dcdcb7b13","url":"build/js/MyGoal-BVyRSJ0S.js"},{"revision":"490086694313884f62df0d5a64581b8c","url":"build/js/MyShopProducts-8uVWtg09.js"},{"revision":"4517f11bc3853a047c4ee699d7fec803","url":"build/js/navigation-BcsRDmjE.js"},{"revision":"6a4cbb53d475bbf98eaf0fa62c7ac85f","url":"build/js/Nocontent-DoXXL6ua.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"add40429a448c8f4e363f5b305dff8f9","url":"build/js/NotForBusiness-Dhrpl2g7.js"},{"revision":"1079a483553a3c5d2045f48c500f2fc5","url":"build/js/NotFound-BzFS4qzQ.js"},{"revision":"1899a49b8b40beb33cadd04b2b92e9a5","url":"build/js/OldSubscribe-DHNdZSty.js"},{"revision":"4032840e9dd2206a7c6ce4218029058b","url":"build/js/OrderDetail-CxEF0wHy.js"},{"revision":"ca6e564b06774448593308c854d34567","url":"build/js/OrdersLists-pHXOIYeh.js"},{"revision":"2df14f30e4d46769010463ec2e38e709","url":"build/js/pagination-CTdnKtER.js"},{"revision":"85b9a5961206116723ec1123f7c24174","url":"build/js/PaymentDashboard-4qYMDIFU.js"},{"revision":"a857cd5aee229b197f4a288ecb8143c9","url":"build/js/PaymentSlider-18sp3itG.js"},{"revision":"e2d159b8ca2e7dcb1b33d4725821f602","url":"build/js/PlatformAnalytics-B3PWq5bD.js"},{"revision":"c5ead2489e0ea390b01283a0de1d7723","url":"build/js/Popup-BKOPlrkz.js"},{"revision":"975a1084dae47155eee006379ef91cff","url":"build/js/Post-lEq4UMug.js"},{"revision":"6779a63174eb5d93cb1b66ea6862e38f","url":"build/js/PostLike-DPIQ20dg.js"},{"revision":"77e9718c6192c42693b5d7ed6f024677","url":"build/js/PriceFormat-kWnke2Bb.js"},{"revision":"045654d7522547b754ce68be12720c40","url":"build/js/PrimaryButton-oaAyBM4c.js"},{"revision":"b89b6b80d649c19261b11212bdf30cd3","url":"build/js/ProfileProduct-CoD-oh98.js"},{"revision":"1f57e30831a8c145c510d99dec4a5746","url":"build/js/ProfileProduct-Dej0NfiX.js"},{"revision":"baa52a86dbbe42b2970751fa16bfa8ee","url":"build/js/ProfileProductLists-CdonRRhw.js"},{"revision":"3deb242b8328f3844b6bc56225035ed8","url":"build/js/ProfileProductLists-DwMLtlq5.js"},{"revision":"ed088f22da6bbab9c27075ff0167289c","url":"build/js/ProfileSteps-C51a1A9w.js"},{"revision":"2acc1cbaba76b91bd6e026365a07e543","url":"build/js/Promotions-dLPdLBzO.js"},{"revision":"02589272bb4276ec2389544bba42fda1","url":"build/js/PwaInstallPrompt-EnAduX1Y.js"},{"revision":"9e97d8999ee6a1bb08d663bb61b12355","url":"build/js/PwaTest-ezMkTIkW.js"},{"revision":"efd129ea7f6fd619cb0f4f8d9c3a5472","url":"build/js/react-select.esm-BMyeiOSM.js"},{"revision":"417a02e79c3a71d5479aa1f6bc27b8e7","url":"build/js/RecentSupporters-DNjkPt04.js"},{"revision":"af42e5dd820c73621022a32fbcff1554","url":"build/js/Redirecting-Co2KGWSS.js"},{"revision":"960a5b99b839627254e5d7f2f13c26b4","url":"build/js/Register-DGXdF0b7.js"},{"revision":"5c0b0ff5a9eee0e9a11600dd972b9b2e","url":"build/js/RemoveBill-CHgvn_01.js"},{"revision":"a0718f27b8cfc50d3628f82c2ff1c9dc","url":"build/js/RemoveMembership-C7BR3H-N.js"},{"revision":"d08ecbfb6f70e2e4b24268fce6761ff7","url":"build/js/RemovePost-B_uAIY5y.js"},{"revision":"034e28dd3b3b75e19fa381a571366a2b","url":"build/js/ResetPassword-BUvzX92o.js"},{"revision":"e5c6b05f31bad9a5b5843c83955bdd43","url":"build/js/SafeTransition-Dyb2StD9.js"},{"revision":"3244536b6db316a32bdd16311a3b43af","url":"build/js/SayThanks-CcWyI4Fu.js"},{"revision":"b2352b60777bb090d2b63aca3c59daee","url":"build/js/SecondaryButton-C0RH0niu.js"},{"revision":"6cdb7c6b33972e2b636bd96477bc49a0","url":"build/js/SendTip-CbSa7c5d.js"},{"revision":"371d7617d1bcc8539499708a4ab27cf1","url":"build/js/ShareProfile-DpnosdLW.js"},{"revision":"e862db36d23bb38442e47de7b4b24d53","url":"build/js/ShopPage-ClTanqiq.js"},{"revision":"98629d674576843ddad5400d52d06e9c","url":"build/js/ShopTracker-D5Tts9nn.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"a1563aaa650979bfa5ba528c2238daaf","url":"build/js/SiteSubscription-C2KFqI_U.js"},{"revision":"c857ec5b92c1a8a3c3de1c71959253a6","url":"build/js/Social-UalITaQw.js"},{"revision":"44d8bc92b2bc301134098ba83d00a1ec","url":"build/js/SocialLinks-DFqeLr5M.js"},{"revision":"92621f4ee35764a5062521b7b825e4a0","url":"build/js/sortable.esm-BZPeGiL0.js"},{"revision":"0530657428cecc3866b34865feb8dc61","url":"build/js/Stripe-BnTiNeey.js"},{"revision":"1d99e90ed7f315b15572b59e254fb9f1","url":"build/js/StripeIdentity-CCo0FZ15.js"},{"revision":"790114be326a08c97bafa86e91d099f7","url":"build/js/SubCheckout-Czr0atRW.js"},{"revision":"506a14a4157bf535c63610fe74bd9f17","url":"build/js/SubcriptionEarnings-btwpRjPC.js"},{"revision":"861da96378d25c4324881df32ae8c5bc","url":"build/js/Suspanded-D3hUEvh2.js"},{"revision":"c90bfa8a73889b6168d2caa5da61d582","url":"build/js/swiper-react-DvkHG3_k.js"},{"revision":"9cf5075b4df1a513746d0e7d89af6ec4","url":"build/js/TabbedDashboard-HTZRXhzm.js"},{"revision":"ac00240c2b032c9b496a17e9265cb860","url":"build/js/Terms-BSDTvJ6B.js"},{"revision":"d5f6c9bdedc6052772cbe412dbfd32e9","url":"build/js/Test-BXEtgh1P.js"},{"revision":"0585fa6936e6ce8a7c0d358e9847061c","url":"build/js/TextInput-FRqWGSni.js"},{"revision":"a0a76d798ef73a505d8f8e6bdfc5c56f","url":"build/js/TFA-BMgfo-5y.js"},{"revision":"6ad957285a570f39b0b6b3e496fecbe2","url":"build/js/Thankyou-BFaJ5rtp.js"},{"revision":"b48506622c1db235ac64d3b61fdacab6","url":"build/js/ThankyouMessages-BJ6cOcTr.js"},{"revision":"86ce8274b73214f4bc0269d1a078e268","url":"build/js/ThankYouRye-ig1pTCiD.js"},{"revision":"fb1345b47ce5c590a389f2822d258513","url":"build/js/TimeFormat-BXibMynb.js"},{"revision":"0923647f8c0f1b4d664eab7fea4e4631","url":"build/js/TipInner-C8diw-i7.js"},{"revision":"d22517d8f7d2a614d2a86de19ae7a547","url":"build/js/Tiplisting-DMHHBdRk.js"},{"revision":"32e48c09f32b11ceb8677b3596482204","url":"build/js/TipTracker-DyK2-WmP.js"},{"revision":"3a3e998fc122c501a5419db0190f77e2","url":"build/js/TopEarnBills-CwlHMVQ-.js"},{"revision":"b4d8602a94d215bbb12f1f01c7b70b45","url":"build/js/TopEarnWishes-CDgf3NBK.js"},{"revision":"7bd6b961088e6541b649ddd4ca868fbe","url":"build/js/TopSupporters-CQ3VxYVZ.js"},{"revision":"68bec6b610ac58f7e3d41bc693f75a77","url":"build/js/TopSupporters-DwC4qoBB.js"},{"revision":"9a7769da7d2d5c6620724670cb72d7e6","url":"build/js/TrustBox-QulVfbZp.js"},{"revision":"fde184b5a55e0f1d9ad983dab8e69804","url":"build/js/TweetNow-B6N40bg7.js"},{"revision":"9f0d0c85793829824f17ef353d5faf04","url":"build/js/UpdateAvatar-DQMEUn89.js"},{"revision":"7706a4b6076f164c4f1de6e2998f5e67","url":"build/js/UpdatePasswordForm-DYq18Uve.js"},{"revision":"efe2fe27e7ee97941fa4e9cbd0fa53b7","url":"build/js/UpdateProfileInformationForm-BSXPVOAN.js"},{"revision":"f6767500da03679385dfefd69bd013aa","url":"build/js/UpgradeStripeAccount-DQ5rw3fX.js"},{"revision":"70b81e939e794366a46a932d9a165902","url":"build/js/UploadcareEditor-18aSASj8.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"5af4e80c8449b6bc993982770c41a7da","url":"build/js/uploader.module-DAvZ6ivR.js"},{"revision":"d16c6cfe563adef59cf68ef702d2c632","url":"build/js/useDispatch-BiYVfzzX.js"},{"revision":"04223cfefbc2222d153814684c6cd70d","url":"build/js/UserCarts-DCyPLTll.js"},{"revision":"a399b573e2fd68cc87be8591f94c3002","url":"build/js/Userprofile-CTWDRHUe.js"},{"revision":"e33a49473b6c564b1a62df2bf24cd12c","url":"build/js/USTERMS-D4ZVOHER.js"},{"revision":"46b66d66424ea1e10235cf6ddd784444","url":"build/js/vendor-inertia-0-tq096F.js"},{"revision":"e87dec51a6700849b98a1e16b3be0ff2","url":"build/js/vendor-other-D6IHe49A.js"},{"revision":"b53e9fa4c111b5f41953271fea0ae69e","url":"build/js/vendor-react-BoKkIuXw.js"},{"revision":"f28ce80fc1882f850bebd6faa1607d8b","url":"build/js/VerifyEmail-DZmMmfos.js"},{"revision":"158b270fc95409a7f08a1cebf0aa4290","url":"build/js/VersionUpdate-BQr8468a.js"},{"revision":"76e157adbd9ed9bb243075fb607103d0","url":"build/js/VipSupporters-BBxc7agk.js"},{"revision":"62a852830f683a79e380bbcb0b916e2f","url":"build/js/Welcome-B9T0vNx2.js"},{"revision":"f38dff99bb12d53fa09ddb2d1bf61d10","url":"build/js/WhyLove-CjHUbeJW.js"},{"revision":"f7fd50d1aa19cdf1b6283047046c11eb","url":"build/js/Wishlist-BHHlza_e.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"f026d382814b71604a38ec55de8200ff","url":"build/js/Wishlistbox-sK5OYavM.js"},{"revision":"195464c544bea2d1134113344c494194","url":"build/js/Wishtracker-CiZCLkF5.js"},{"revision":"e39045723556c78172e6e2efb8cd651a","url":"build/js/Works-C3jf4RmJ.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
