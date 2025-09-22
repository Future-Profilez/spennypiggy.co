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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"f33dd39c7aa67794f29985d40cc43760","url":"build/css/app-BNrxwv2p.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"62054aff98ba18417e59aaed98c25c13","url":"build/js/404-Ge6drNJp.js"},{"revision":"fb5ddb78b58311497cef5e24537ac7a0","url":"build/js/Accountsetting-D-Q60ueg.js"},{"revision":"de2bcaa31024b579ff3a9fd1e2d2f5f2","url":"build/js/AchievementSystem-DmLvAXPg.js"},{"revision":"376bbe7a56c0c92dd495802b6eb3fa24","url":"build/js/ActionRequired-D6tZXvoR.js"},{"revision":"f315416f6b2cf154097c9ac4b869e5db","url":"build/js/ActivateCard-CJ0Tn1ql.js"},{"revision":"4d516c7d4390a1a072a8793b18ff71c3","url":"build/js/ActivateSubscription-BFzy_KE-.js"},{"revision":"18da2336be020625c3d7144fdd413246","url":"build/js/ActivityStatus-CzG9dK1Z.js"},{"revision":"87989c5b37d30881743c894e028f87a3","url":"build/js/AddBills-Cmt0vKRU.js"},{"revision":"02a03b228eee7de5f92d413ac88c1f23","url":"build/js/AddCart-BhzdAsOO.js"},{"revision":"6d5978d9fa0f2a26161c92ad8470227a","url":"build/js/AddComment-BA_rz23G.js"},{"revision":"381433708077f3217f56042235d207b6","url":"build/js/AddGift-C2nRxqkx.js"},{"revision":"0be34b2edf98b7484cfdce4ed62481e4","url":"build/js/AddGoal-D7Guke5P.js"},{"revision":"24266e1712e3274ab966a810bf2b7bbd","url":"build/js/AddIntro-U2IQCGrK.js"},{"revision":"528ec80c84ec6241ac60ab129efb82f0","url":"build/js/AddItem-DRVevu9V.js"},{"revision":"81061cc04c879eb012a4dff30369a6bf","url":"build/js/AddMembership-BUQps2Wl.js"},{"revision":"68f3fecd79099910ff52afed2aceb987","url":"build/js/AddPost-C9TsgMYf.js"},{"revision":"144ec416d9ad47d42d85312733562fe0","url":"build/js/AddressForm-CCFRAK1q.js"},{"revision":"eea5aadd7d034b1e7f9ca286eed0afa6","url":"build/js/AddRyeProduct-fWQU0bAy.js"},{"revision":"b987eaad0b563aa784fd3baeb29cc8f3","url":"build/js/AddShop-CWY2TNJD.js"},{"revision":"2f91db73336e4830738885589990a49a","url":"build/js/Alerts-U3N0EdLM.js"},{"revision":"a7b912e209366f0e9555ffebd712d4fc","url":"build/js/AllCountries-BN0IPW8C.js"},{"revision":"3941eb719c88c688d17b01bb5e8902c4","url":"build/js/AllWishes-BZRf_WA7.js"},{"revision":"8817c9a4530b208a6032c348b47b4f91","url":"build/js/app-bALUNiCu.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"e35e9ca5c6c5f87b083f5aa0ed6facdc","url":"build/js/AuthenticatedLayout-Cz4DIfKM.js"},{"revision":"a476c53cacdd319ef6c968be4ba69741","url":"build/js/Avatar-sApJi49i.js"},{"revision":"c5aaab50e95061f7bccb4be466f25e73","url":"build/js/Bill-D-8EnGUA.js"},{"revision":"ca41071371bfc30cd38560fbd53d439b","url":"build/js/BillCheckout-eYbeNqba.js"},{"revision":"afa74caa4402823682fca1bf828f12a5","url":"build/js/Billslist-iHOh1-QK.js"},{"revision":"878ab2d2fdd5215d5f99622e98bd4956","url":"build/js/BillsTracker-ZVtV4Lea.js"},{"revision":"6939209aae3d79dda1dc4511cc6d7705","url":"build/js/Board-BE_oyT7I.js"},{"revision":"7020a69cd04df505a415c49050f39aef","url":"build/js/BuyShopItem-COXromjG.js"},{"revision":"9724c9bb07e642b2b5b398d25c23171b","url":"build/js/Cart-B6FDPTR3.js"},{"revision":"44ac369efc5d9b5e28beab3b04a7ac86","url":"build/js/CartItem-DwURMLYU.js"},{"revision":"2ae6b769dc0b8382a412c68d93ece579","url":"build/js/CartItems-CzwWCEjO.js"},{"revision":"0732e74d61119327119dbb257500483c","url":"build/js/CartListing-krkVcicK.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"dcc2299f5d3df3ff8cdd058e8db6c589","url":"build/js/CategoryLeaders-CUsxSrtQ.js"},{"revision":"68785888274f0ea1a85b143ddf7644c9","url":"build/js/ChangeCurrency-BOdA9Eg-.js"},{"revision":"825ef104a918e351af9946eaafcf6c3c","url":"build/js/ChangeVat-BYPacU0V.js"},{"revision":"0a5708441f85787ccef11f3dcf9d1841","url":"build/js/ChartDashboard-BF0KlCzs.js"},{"revision":"0949097fceb0980ef4a9ff4d36ec6bd7","url":"build/js/ComingNext-BTGiX_xC.js"},{"revision":"b8809f37d43fd37f7c26b9f6a2d7add8","url":"build/js/Comment-jZlnIhvf.js"},{"revision":"c2d2d3fc8dc0953f8f30bd33ecaea4d7","url":"build/js/CommetsLists-Cy9LTmCK.js"},{"revision":"b176246046a2d054acab128697a05480","url":"build/js/ConfirmPassword-CmocWapB.js"},{"revision":"6659a187eb14b5462d96675562743e73","url":"build/js/Countries-DGwdVy9q.js"},{"revision":"dfd0ccac6ecb24a3fc8986d56ccce543","url":"build/js/CountriesShipping-BDho4SVF.js"},{"revision":"13646b8f895cda5c3df6c7ad529cac7f","url":"build/js/CreatorActivityWidget-DR12nkde.js"},{"revision":"571b3eee83e3d54d5ebd88a868ffa716","url":"build/js/CreatorSubscriptionWidget-CJs8JwHm.js"},{"revision":"33fc2ccaee2e70da437f202ec6b04660","url":"build/js/CreatorVerification-Dsk7fjkn.js"},{"revision":"38310aac9582875d9ad640b7306a0c05","url":"build/js/CreatorVerificationNew-D30Vn-IN.js"},{"revision":"771315f7a7f356ee484aabb9a08215b4","url":"build/js/Dashboard-DHJf4PLY.js"},{"revision":"f8fcbabec1145f8437bd2881fe3cfc60","url":"build/js/Dashboard-KCgdkERg.js"},{"revision":"70307d0f3ae579cc18fccd43cd6f339f","url":"build/js/DeleteStripeAccount-Cy3VKfMI.js"},{"revision":"41a8c67bcf8a72d3a4ea6750aaf6d2d0","url":"build/js/DeleteUserForm-CYesBgGM.js"},{"revision":"6c3dda0f369b4529626107c17d1c7e94","url":"build/js/DiagnosticPage-B9XaqrC2.js"},{"revision":"2c15e377f9d2d8ba511ddd08dc46c9b9","url":"build/js/Discover-Bn_3ix8D.js"},{"revision":"a7fd76b1d4e9123dfb86970434d2ee60","url":"build/js/Earnings-8ETQPxH0.js"},{"revision":"0f4a654e880bc0fdd6570cfd74399984","url":"build/js/Edit-CQsOdGAi.js"},{"revision":"29ed4557b9ae34e543dff875246d21c8","url":"build/js/EditCategories-BfSkh123.js"},{"revision":"1fa363071679e55cb1b680b2a132895a","url":"build/js/EditMembership-B_V3_JQy.js"},{"revision":"4b21714bf207b50e9cb44e0c2dadb1b5","url":"build/js/EditProfile-qs-P-lJz.js"},{"revision":"bf3652fa478d98e5522263e70dd87877","url":"build/js/EnableCardCapabilities-D4hZUgcJ.js"},{"revision":"7b906a99f80b7f0da1be031498a5e682","url":"build/js/EnterOTP-DH0oMBcc.js"},{"revision":"45ee4dd9e51c401ecda610766b77a721","url":"build/js/ErrorPage-B5szrc6k.js"},{"revision":"1b9705ca17b97a21c4c4637cd7b9ad61","url":"build/js/FAQ-DU5rktM1.js"},{"revision":"887bec8fd97c19d88989b4bf80879f21","url":"build/js/FeedList-0hnlFerC.js"},{"revision":"1fdec5c72af14f9cc8b111cd02d75d93","url":"build/js/floating-ui.dom-DVl2D4rQ.js"},{"revision":"62d0764eb1c2788eee6d5c1d55ff8b94","url":"build/js/FollowButton-Da9cwkKP.js"},{"revision":"6b2b9f75c4aaa3d79a3052a99d22376d","url":"build/js/Footer-CGQQVvBL.js"},{"revision":"7aff797062bcc39910647aad41352622","url":"build/js/ForCreators-8-HmbnkY.js"},{"revision":"d63dec6f8fb4e9c6ddbf238213c0ce94","url":"build/js/ForgotPassword-CfT36sx_.js"},{"revision":"66d02d2727a8ba707dec43f1a99a2861","url":"build/js/FunPart-nEaIe6AY.js"},{"revision":"806fa200aab59dfa42b8963dbe9db2f9","url":"build/js/GetCart-DdSuXyul.js"},{"revision":"ab4067b3faddeb1f518162591a9bd185","url":"build/js/GiftAddCart-hzL6WCcv.js"},{"revision":"ba417841f33e0c1e2410470143d3f80e","url":"build/js/GiftEdit-9yOt3XkV.js"},{"revision":"0cd9f277f99dea469511ecfee8c26c27","url":"build/js/Gifter-DIWlI8Gq.js"},{"revision":"c59c8d581a164ac925021c38382e0a12","url":"build/js/GifterCardVerification-CdQTuycK.js"},{"revision":"11b7a1ad2a4690848a882ed745d4f253","url":"build/js/GifterFeed-CWaB6Ts6.js"},{"revision":"492af64448d50c053dfcf56200b258b0","url":"build/js/GifterItems-DwsexfZ7.js"},{"revision":"26443582e9bd9b0e872e2c80993a9d08","url":"build/js/GifterMedia-qHMvZLbx.js"},{"revision":"951078f40b8078807b789a0c20e57f5f","url":"build/js/GifterMembership-DkmT-hgd.js"},{"revision":"6d8b577f375eb872eae5355fd5bbb3ff","url":"build/js/GifterSubscriptions-fn2_hklM.js"},{"revision":"a9431246b45783eb5698c22f0af57a57","url":"build/js/GifterTips-DWsE5C-1.js"},{"revision":"d2671578b0631a52bc2cf17ec594eede","url":"build/js/GiftListing-pBa1x0om.js"},{"revision":"3057334a220122cbf777b547a67373b6","url":"build/js/GiftStore-C2TmPMiG.js"},{"revision":"87dadf94af646e4e74c24a515fab2ba6","url":"build/js/GlobalCheckout-ww9cwrA5.js"},{"revision":"fad8f2ee6f1c8122a647af762f9b4042","url":"build/js/GrowthTrends-C50RB3pN.js"},{"revision":"25b784fab5b887373e0c75dda0bd5a94","url":"build/js/GuestLayout-C_6B-rpz.js"},{"revision":"9751175a4eca995c4a95b3d6b1ae4e6d","url":"build/js/HappyCreators-B358mbNk.js"},{"revision":"4b7d6440cfbc306c27e7cc8bdb7eac48","url":"build/js/Header-B59_uMl_.js"},{"revision":"a6b037004fcc0fd5a263595ce6186275","url":"build/js/Hero-DdV3K_SX.js"},{"revision":"393c7e0882281941fa97ec9e30cbe62b","url":"build/js/iconBase-MjKsQ6cq.js"},{"revision":"8e05df2619552798e2ca4e191ae42e92","url":"build/js/Icons-DjLq9-QZ.js"},{"revision":"c49f71a564c16efd7cad4a2b4074f0da","url":"build/js/ImageGenerationWithAI-Cy7SwfMn.js"},{"revision":"0013605a650f03d42e6a42dcc0ff3659","url":"build/js/Index-05DlkqCS.js"},{"revision":"5a1135fb7e443a24c710fe211e67d112","url":"build/js/index-5-Dg0jS0.js"},{"revision":"e39053a9405e7d55bfa14c4a31e85255","url":"build/js/index-a99alXri.js"},{"revision":"9c604e11caf4d15c5389c55114712097","url":"build/js/index-B3b3x1j3.js"},{"revision":"43ebde35ff2413cf4d95524ff8da2147","url":"build/js/index-BFDb6Qyk.js"},{"revision":"0d00600e034f98d4144a07e06d227de5","url":"build/js/index-BVb_2JLH.js"},{"revision":"70e951172e0e49c273f848983470fe6d","url":"build/js/index-BvRzshaI.js"},{"revision":"6bc518b6f491672a0da9a5f4d9cad7c5","url":"build/js/index-BVtUkR33.js"},{"revision":"d8aaca0c01c4346208d02bebbbfce3a2","url":"build/js/index-CedkpBIq.js"},{"revision":"59d386e11b8bf3b9d621ba1da86bbc4d","url":"build/js/index-CZOkfoKQ.js"},{"revision":"99f1ab54c33a4eebe9268b055238d664","url":"build/js/index-DmvsKUaZ.js"},{"revision":"94512aadd0222a46e216fa23aa0921b5","url":"build/js/index-DseNaiH_.js"},{"revision":"11d0f9f8c973050058b5609a8088cada","url":"build/js/index-DTpPHi8b.js"},{"revision":"1ecba80e68ffdb75224d964fc7445391","url":"build/js/index-IZJ2Bp8f.js"},{"revision":"f349ef31cb1fc7b751ad1dcf5e9519b9","url":"build/js/index-wHdGfhNj.js"},{"revision":"72637194600ac4926b94b5d8f2ee3a84","url":"build/js/index-z658crud.js"},{"revision":"289fcdae44c6932663d277a108450a67","url":"build/js/InputError-CFxqzFBp.js"},{"revision":"36a361226217b017cb89bfcad48a5e14","url":"build/js/InputLabel-B6fiVSRJ.js"},{"revision":"95a77f4cd17cb91a763e5d417142a474","url":"build/js/IntrosVideos-CboEZi5f.js"},{"revision":"9bb16cab5170abd78cdb9b12d0506c34","url":"build/js/Item-CWkX-M0V.js"},{"revision":"facf0bb3e2d494d43e277f1ca029eb9f","url":"build/js/JoinUs-toibHRC9.js"},{"revision":"5a4712c1c36328604d5e0cd3b3767f4f","url":"build/js/LeaderboardStars-BXxIwnGK.js"},{"revision":"3e3471bb826207b5f9b40ab18941241b","url":"build/js/LineChart-D_ZWNNjk.js"},{"revision":"7037ab10797d404705667cf449691a1b","url":"build/js/LinkTwitter-Ble_7l8L.js"},{"revision":"53c3c6b7d440ed45e2090199af4345ee","url":"build/js/Lists-Gqor1o6Z.js"},{"revision":"9ae2f7efc39545bdb72a4c95760deed4","url":"build/js/LiveBar-DC1xhEDx.js"},{"revision":"3f3504053179d0529610dbcfea68e5f9","url":"build/js/LiveBarSection-BmRfRcaK.js"},{"revision":"4f537d5367809979600609179ecab496","url":"build/js/LoaderButton-Yo4wapHX.js"},{"revision":"9e3b027b7aed91be7fc618441f1c385b","url":"build/js/LoadingScreen-BtQ0AKfe.js"},{"revision":"4d9c31a42b705420a7948a647049146c","url":"build/js/Login-DJ62Ed5z.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"97ef21575147690036feedecbc08af85","url":"build/js/MagicBellNotification-C0Ko7MNe.js"},{"revision":"795d06a7d97401efddd52e4ff4eaf7e8","url":"build/js/MagicBellNotificationDisabled-DA2imzJl.js"},{"revision":"27bf01d144763534135f67f2f817767b","url":"build/js/MemberCheckout-BVyRkfgl.js"},{"revision":"b7ee2f986f4de5668a936e429b226451","url":"build/js/Membership_dashboard-DAPV07b8.js"},{"revision":"1102011173ffa6937b8e2edff001ba97","url":"build/js/Membership-DgWN0anf.js"},{"revision":"74f6e29dcac5f429f086a3280de1b6dd","url":"build/js/Membership-j5noo0cl.js"},{"revision":"de90c94b7ea59ed0049cbccde1efb042","url":"build/js/MembershipLists-4DFrmMWi.js"},{"revision":"bb80ec1e9f1bbdfcb832761b34119401","url":"build/js/MembershipsLists-C9SaiRwF.js"},{"revision":"ad322256f6ccadeb69de38a4f44245ee","url":"build/js/MembershipTracker-CwpvzDrS.js"},{"revision":"72562ce187897e9aa49cd28ca0cfa58c","url":"build/js/MonthlyRevenue-DoPB5NIo.js"},{"revision":"b62eb3a61501e82b97f9e9ac64b51588","url":"build/js/MyGoal-CSjLpGNZ.js"},{"revision":"1467d4dc7555f63ea148931b0562a99f","url":"build/js/MyShopProducts-3jO0HoKt.js"},{"revision":"8de10e03c3e0c1224cf76ddc9ef7cde1","url":"build/js/navigation-DoZDW6Cs.js"},{"revision":"bfe084c01403be715390774b1a1457c7","url":"build/js/Nocontent-C-gxQ3Is.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"c003f9a5ce0d9dc69db812cd5706d3ab","url":"build/js/NotForBusiness-MBgYjfF4.js"},{"revision":"f9e95803def6c53b71807ab2ef34208f","url":"build/js/NotFound-Cl1bbPNy.js"},{"revision":"744307675c36ad71066a62bce295fcea","url":"build/js/OldSubscribe-CIqvX0D9.js"},{"revision":"ef6fbad74b1e45c745299af1e0a0bd4f","url":"build/js/OrderDetail-OMl-77Zc.js"},{"revision":"2d10af738958e13b19004f70657b46fd","url":"build/js/OrdersLists-umyaxOQE.js"},{"revision":"ee18ff698580fd5b8b9d9babc331d424","url":"build/js/pagination-BErcr0LO.js"},{"revision":"2308e17620470ffbcc3cd9299cc851d7","url":"build/js/PaymentDashboard-CwJOT9x2.js"},{"revision":"18366bd3ae2accec14359e4e56c2ede2","url":"build/js/PaymentSlider-D0nL_CdF.js"},{"revision":"ab21c610157a4b96474c99de545a4c59","url":"build/js/PlatformAnalytics-DSvo9VQN.js"},{"revision":"6001806237edbf99dfea7da350440e80","url":"build/js/Popup-QYD3xZI7.js"},{"revision":"acfad71979194b2a29668001fd1666e6","url":"build/js/Post-CeE_gMXb.js"},{"revision":"bb51e945b8967cd5819812c376e18203","url":"build/js/PostLike-2aNjWMuJ.js"},{"revision":"21ebdd74055d87a5d16aec1eaac079d3","url":"build/js/PriceFormat-D75lv6kt.js"},{"revision":"00a5f00342e52e7f27ab9c8c89890bcb","url":"build/js/PrimaryButton-CbxTPf0h.js"},{"revision":"a31fae8b92b1c92376cf17059c9ddafb","url":"build/js/ProfileProduct-gKDL4VSp.js"},{"revision":"5e153259e26e0269a285de89d30d5a28","url":"build/js/ProfileProduct-u86V0uGn.js"},{"revision":"643cf3537d518910d595e88f9f259087","url":"build/js/ProfileProductLists-BCq68Ukq.js"},{"revision":"568dda94208530792ac2186c9331116b","url":"build/js/ProfileProductLists-D7zUFEA7.js"},{"revision":"1656940fe7b3da79c9ffc7ed028b00e4","url":"build/js/ProfileSteps-B0M82GYF.js"},{"revision":"525208a6393540c059aa93ab621d7f69","url":"build/js/Promotions-BFKawI35.js"},{"revision":"4379c70bfd6d68531eb6287368bdbcfd","url":"build/js/PwaInstallPrompt-ByHn2bep.js"},{"revision":"cd5268dfa5ad4f0fcddb6bed7209a2e2","url":"build/js/PwaTest-Gq-JHV_z.js"},{"revision":"c6432d893a5eca29234d70f884feec39","url":"build/js/react-select.esm-Dva90Tei.js"},{"revision":"3a6ca70cd4d09d81dedc1b515ef66f4b","url":"build/js/RecentSupporters-BcgpB-ej.js"},{"revision":"d1abb2dc528e3c0bd6fb616a196e45d0","url":"build/js/Redirecting-vQnUX3xB.js"},{"revision":"0598be4c36b56b5f41866a1d90b95b3f","url":"build/js/Register-Xx4xXd2R.js"},{"revision":"784a67f84e8c2f6c7c7450298902371e","url":"build/js/RemoveBill-Du4vDoUe.js"},{"revision":"935a2fa0bea4534ac67b34f0b9f77704","url":"build/js/RemoveMembership-BlQ8qBU5.js"},{"revision":"d0cb71f4929e7336321cc5268f8b7d91","url":"build/js/RemovePost-C-5mzw-0.js"},{"revision":"aef11c0b7fa66b17a7e47804afc9cd46","url":"build/js/ResetPassword-kowEpn2o.js"},{"revision":"8f356608deae0ee16e9392b34fa4cf98","url":"build/js/SafeTransition-BiEr4r_b.js"},{"revision":"58ac5d3d239bc1a905233570960c4cd9","url":"build/js/SayThanks-B_-H84TP.js"},{"revision":"39b0bd43250d1e07178cc5d88843783a","url":"build/js/SecondaryButton-DD9g9Dlf.js"},{"revision":"8edf5419afc20cbcc460e849af2ad604","url":"build/js/SendTip-DExbeaaf.js"},{"revision":"cd5f287625b3a373794384122450c2c2","url":"build/js/ShareProfile-CjzS1YuN.js"},{"revision":"81a39fb14be361c90af47e9f1ad02ebc","url":"build/js/ShopPage-pkZIEDGA.js"},{"revision":"7cffb8b4e633d8d550f8e730257c0d2d","url":"build/js/ShopTracker-DIEx146D.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"34636e952ddcf5d0b96b10208d28ca03","url":"build/js/SiteSubscription-B39pcVnZ.js"},{"revision":"df2037738b4e2a7d5a128750d8af1b44","url":"build/js/Social-C3dzuw0D.js"},{"revision":"7ac19eac54d7fd5062c754a5ed4a5caa","url":"build/js/SocialLinks-CN8p9Id8.js"},{"revision":"54b89fa86b4a392a17e28b08c96c6f3e","url":"build/js/sortable.esm-C2GZ4Alk.js"},{"revision":"0166f413609821366f9c5ee44019a104","url":"build/js/Stripe-DdXfIKJq.js"},{"revision":"d9c093c03a2883ce3820ae19719deccf","url":"build/js/StripeIdentity-BdFU7GbR.js"},{"revision":"95b53fe710b8ade5b51ed8a56c675687","url":"build/js/SubCheckout-CcaGyj1w.js"},{"revision":"9da5b6bab880c3cd1ea3b0869886499c","url":"build/js/SubcriptionEarnings-C2A_BLEa.js"},{"revision":"407dec61b49ebec9a5d0571f9efd2f90","url":"build/js/Suspanded-DUuLqy6H.js"},{"revision":"6804af24c31e84f4aecaf714a4245729","url":"build/js/swiper-react-XCOYNjTZ.js"},{"revision":"f750d26d97988899680aadf567ea0fc1","url":"build/js/TabbedDashboard-BeMEKzal.js"},{"revision":"2923e727126d155663371190025aac5a","url":"build/js/Terms-BDUK-NKQ.js"},{"revision":"deeb064b377003d9e13d397ef8218cc8","url":"build/js/Test-DJRMnYWo.js"},{"revision":"0f43ef820c36dc0e047c4c8515255aba","url":"build/js/TextInput-DyZkxxS6.js"},{"revision":"2d87ef260d2215f48cad5f6253016a4a","url":"build/js/TFA-DFUYQ0Sq.js"},{"revision":"42fa9b57ba01c6da24267de1536b662a","url":"build/js/Thankyou-CoP2P3uP.js"},{"revision":"eab48b46a855dc4cf3a3bbcff7c2e317","url":"build/js/ThankyouMessages-BXihnizz.js"},{"revision":"bae39152665df5b98a7e465720bda23b","url":"build/js/ThankYouRye-Bk3M4e5B.js"},{"revision":"33f0159bd7fe8365e63aa523a645e562","url":"build/js/TimeFormat-K_XT5JVl.js"},{"revision":"7078118c00ff637ac33f073b6afcfd4f","url":"build/js/TipInner-ALFZ1xuz.js"},{"revision":"1191509217ef720c6abd4eb674139746","url":"build/js/Tiplisting-O3t5me8r.js"},{"revision":"c385007ddb2d57b02a53110cd0a25d2b","url":"build/js/TipTracker-DUThjwBm.js"},{"revision":"0ed2638032f30a73ea2de182fd97a291","url":"build/js/TopEarnBills-BeixsutK.js"},{"revision":"9c8015ab5e403c109283f5569c392cc3","url":"build/js/TopEarnWishes-C8U4qd7C.js"},{"revision":"98ec3a708d6eac4693d9bd69d358f13a","url":"build/js/TopSupporters-Dh_3Dy6q.js"},{"revision":"d25202123528c402ce393be6ced51bca","url":"build/js/TopSupporters-lPJngDE0.js"},{"revision":"112ad10f738a0a082666b1e4b0773085","url":"build/js/TrustBox-C0F5mQRr.js"},{"revision":"9642f3c1813f3b80e368d278ee6c9fa5","url":"build/js/TweetNow-DT91s3nV.js"},{"revision":"f373c3536d43557bc42011f3ac6407c4","url":"build/js/UpdateAvatar-C0Rz1HmX.js"},{"revision":"1d94088bc93f3762acff127318fb14c0","url":"build/js/UpdatePasswordForm-CMuU1y0B.js"},{"revision":"e5cfd20e114b5b5136a9283a2911cf23","url":"build/js/UpdateProfileInformationForm-bfBHeX_f.js"},{"revision":"cd5738e042aee419baa27275b2932a37","url":"build/js/UpgradeStripeAccount-B5VMmdZj.js"},{"revision":"0840947ea0b1e52f6a002cf1afcf7172","url":"build/js/UploadcareEditor-BX5sU9Gj.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"5ec5bdaf81d71c0c72562be2da9d4859","url":"build/js/uploader.module-DHGeDRz6.js"},{"revision":"66e806190e2798657cf4c69ff9d89f5f","url":"build/js/useDispatch-CBSXWDV_.js"},{"revision":"d8c1227dc243737e44c58b1840ee67a8","url":"build/js/UserCarts-C9gZkxdY.js"},{"revision":"b53f62625923cd94e0ffce052be79d7f","url":"build/js/Userprofile-Xz9BzutH.js"},{"revision":"5309545231b253b07c07da6b20f6774c","url":"build/js/USTERMS-CKQImR7b.js"},{"revision":"84b3010a037501802978b368f5bc09fe","url":"build/js/vendor-inertia-Dzbngo-l.js"},{"revision":"0a84cb623bb6eaaf1ef4cf4441ca5575","url":"build/js/vendor-other-BEhyYuI4.js"},{"revision":"f29269c39c6887f8bc78f756f1f09dac","url":"build/js/vendor-react-Ah3Nslg9.js"},{"revision":"700d481a99ecfa97b4b0624d3d09690c","url":"build/js/VerifyEmail-DnpFn4YE.js"},{"revision":"16f5677ff3d655c18dadb0fbe7214a1c","url":"build/js/VersionUpdate-dRoWp4e4.js"},{"revision":"b15610a64186235a947fff2ffcfaa7d4","url":"build/js/VipSupporters-CmdxLasP.js"},{"revision":"49043a24c4fffd46ca5317e152c328ca","url":"build/js/Welcome-CKBAx9qp.js"},{"revision":"67c4d82dbf70cb42e9dc35c274677901","url":"build/js/WhyLove-C68ZZ8NS.js"},{"revision":"49ab1c47cf1366c16ac9ada5da10da0f","url":"build/js/Wishlist-F1Iwo45L.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"4671247c725c314dd54843c0e4268aba","url":"build/js/Wishlistbox-Ba4QLW-v.js"},{"revision":"904805330ff77791d84b2fd32b6c99c6","url":"build/js/WishlistGrid-QHAyZVDP.js"},{"revision":"592c716c9669e6ee3ad81da22354ebc5","url":"build/js/Wishtracker-DIswnKhd.js"},{"revision":"50cd3f75f538368e157ca68535ce6318","url":"build/js/Works-C4Snz6yp.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
