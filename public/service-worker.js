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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"59724508c66fa401f732a742419fc85b","url":"build/css/app-DXUvn59a.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"8e2dd5f656e42be7a259caa966600957","url":"build/js/404-Dmuaf05I.js"},{"revision":"da5e3596bbbe9decc79e8ffdc29c0955","url":"build/js/Accountsetting-CYh-aTPB.js"},{"revision":"52007ac7747a9bd0541f4fbc9851aa63","url":"build/js/AchievementSystem-BfAqQLF7.js"},{"revision":"bdf8d8709e77a610d18445511a50bef1","url":"build/js/ActionRequired-B5jKsU6R.js"},{"revision":"cc893d579e75147155d109360ade34ca","url":"build/js/ActivateCard-ByC0kZW8.js"},{"revision":"d53f5880ec0998c14dc6630ef3ecc5e9","url":"build/js/ActivateSubscription-BjSJS6Lc.js"},{"revision":"b41e699c15ffb6d620beb22bd64bd5fa","url":"build/js/ActivityStatus-CiaIIUsc.js"},{"revision":"5b0de4e055dd6dbf60e2b1346364ffde","url":"build/js/AddBills-BxQrfA8u.js"},{"revision":"eddff1cd307ec0a42421a553bcb45dde","url":"build/js/AddCart-lBna0ENa.js"},{"revision":"52612cef74a66efc5f2588598a08f531","url":"build/js/AddComment-a53Mq4cC.js"},{"revision":"a7850f830f8abba3911bcd1ea4403b46","url":"build/js/AddGift-BiWIRojZ.js"},{"revision":"763bfaec570f59134d25022d19b01be3","url":"build/js/AddGoal-1cMrEc-w.js"},{"revision":"423cb85bd382d05e0ef876bdff230934","url":"build/js/AddIntro-DfJth3PA.js"},{"revision":"f2d89863746de397e450a4ebf22809c4","url":"build/js/AddItem-BmYZXJZA.js"},{"revision":"8dc2d437c7c6eb4f3a67d1ddbb72bc6b","url":"build/js/AddMembership-B06AXDwq.js"},{"revision":"d8d498dfbaab15585562c60b47d4025c","url":"build/js/AddPost-CfU7zFh2.js"},{"revision":"6eb97b0f2b5ff2b7fadbb8e9e858e9d1","url":"build/js/AddressForm-BatQqPHX.js"},{"revision":"c14b575a3ad8f19025f944e8ad97a167","url":"build/js/AddRyeProduct-BBpxLljc.js"},{"revision":"08a37e9d35a0ce093d85a16d71066c17","url":"build/js/AddShop-krOkkSMz.js"},{"revision":"e0786b60878c81eb40fcff437634f0a0","url":"build/js/Alerts-r3T0IzNs.js"},{"revision":"762f5be24fb0e0457668b1c058f7aadb","url":"build/js/AllCountries-B42XpkAM.js"},{"revision":"99867c5b52dfe7aeaae6aa0383269584","url":"build/js/AllWishes-1l7c416u.js"},{"revision":"6f971d0d41cacb6a309e9a7cc34f2b68","url":"build/js/app-CsNlH2co.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"2ced53205af3e6c8d7c780072f319434","url":"build/js/AuthenticatedLayout-DTca-Tm2.js"},{"revision":"23fa0e7f4cbb1aa8bc88a5367e019962","url":"build/js/Avatar-BrZ28tOZ.js"},{"revision":"e517f648d8ea2030955ea658738a081b","url":"build/js/Bill-CckvIBGY.js"},{"revision":"05e55f7513d2cbbe713bf3f402f19d88","url":"build/js/BillCheckout-zKfrgM4N.js"},{"revision":"17e87d8552b0085ac999ef9a35a8a401","url":"build/js/Billslist-mFD2gkcF.js"},{"revision":"bf5479c8adbb617484dc522700f619f4","url":"build/js/BillsTracker-BNt8quo8.js"},{"revision":"4321fdb03324fe04f7d3d79486c1e6a7","url":"build/js/Board-W2vwkK-0.js"},{"revision":"6872e0a80116f0449d0a951f286cd4c7","url":"build/js/BuyShopItem-BoHDcDof.js"},{"revision":"f1cc45b6e4ac0887193796465a4c9694","url":"build/js/Cart-DY_PkPJU.js"},{"revision":"5cae1bff6115925943010fecbeabe15c","url":"build/js/CartItem-DnQePYpg.js"},{"revision":"3b63d41a8a4e1c463f2206dfb0161d59","url":"build/js/CartItems-D-4x6t5r.js"},{"revision":"718c5145ae5138d8cf29cb70fa5fc1be","url":"build/js/CartListing-BXQsl8Vp.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"0cde8e5e55e05278a1aaf3768ab96055","url":"build/js/CategoryLeaders-CRnwVOio.js"},{"revision":"f4b20c3f19aaffd6103267182f8cbae9","url":"build/js/ChangeCurrency-Ch3ts91Z.js"},{"revision":"33857c08e722125358077e3b6311ee56","url":"build/js/ChangeVat-FymQ9sHJ.js"},{"revision":"56a40b37a4fac24d7a418016c825d0af","url":"build/js/ChartDashboard-BAQlhP41.js"},{"revision":"e07188bf703034bed129cb5f84b21e97","url":"build/js/ComingNext-CT8nS-pC.js"},{"revision":"80c63ecb1e624adcbe9f3a91b0519d77","url":"build/js/Comment-CAQnhpnt.js"},{"revision":"0a09771e30dc8328dec86d4d7bddbc3a","url":"build/js/CommetsLists-CfnqhgiG.js"},{"revision":"508d2d158261fd882c15b1bb39371dbc","url":"build/js/ConfirmPassword-CVUzzstl.js"},{"revision":"ece5dadda2081535509fa192995f7e8f","url":"build/js/Countries-UEiZWx48.js"},{"revision":"e00af7c648f68d0adaceefd00dc919af","url":"build/js/CountriesShipping-DHY0J_12.js"},{"revision":"07c5fa870e0589f2bfa067bf023fab27","url":"build/js/CreatorActivityWidget-pRJMjT4t.js"},{"revision":"b9c1f8cba0343f2322892ed04b6919c2","url":"build/js/CreatorSubscriptionWidget-BczCheek.js"},{"revision":"e874134888155bfd52bea2772612ac3f","url":"build/js/CreatorVerification-SYHQZUEb.js"},{"revision":"a394586f974e26fd21f167545e39260d","url":"build/js/CreatorVerificationNew-CiDDEby3.js"},{"revision":"676d5fa7771db4ae540af42e17e49049","url":"build/js/Dashboard-BgyzIkXn.js"},{"revision":"05ba3a37584ef4f4ca42448ec1302410","url":"build/js/Dashboard-CYy8B11l.js"},{"revision":"11a3470d34d4330e03bcc7b13b52cee0","url":"build/js/DeleteStripeAccount-CfoafoSQ.js"},{"revision":"6d3bbe00c3eab77f5124c56a0debd5fe","url":"build/js/DeleteUserForm-Ch_19I5Q.js"},{"revision":"eb39c7bb131e1d09c34db29d239de43d","url":"build/js/DiagnosticPage-DB2i11Bt.js"},{"revision":"0f7928d079cf90afbea689fb924a3112","url":"build/js/Discover-WGiPWvca.js"},{"revision":"da08a277e2a0e57da66a3e84fca9d723","url":"build/js/Earnings-CIO3CSIn.js"},{"revision":"2f1bd6339c6285d476f61cad3bc8aa2c","url":"build/js/Edit-B5yAdtMy.js"},{"revision":"59689f7cf0fe45486fb3223238758f01","url":"build/js/EditCategories-CKsyWvXu.js"},{"revision":"4b11f8175493af76368621f3503e8603","url":"build/js/EditMembership-DqbcfOhY.js"},{"revision":"5cf480ee33c3eab3fb2c841fe5d36376","url":"build/js/EditProfile-D0f1lzoa.js"},{"revision":"b53dc883e89c937933cb892f2dcd5635","url":"build/js/EnableCardCapabilities-DcaGAjaj.js"},{"revision":"d26851b4051c2a1d4df2f7fcd4248587","url":"build/js/EnterOTP-DhzRkQ2e.js"},{"revision":"ce68fb72f2c27e1f823eb39bb17d0be5","url":"build/js/ErrorPage-CuayZzin.js"},{"revision":"2fac7914f3b969296ab95207f59cc780","url":"build/js/FAQ-DHs95bK3.js"},{"revision":"3fc2846dd823fe5b816cf61b49518774","url":"build/js/FeedList-CkPFQR9q.js"},{"revision":"0618212bff2d5978a73cdd5a712031d1","url":"build/js/floating-ui.dom-DcaTYDVg.js"},{"revision":"ca6c07180229f798c4f9b155a4a753d5","url":"build/js/FollowButton-e2zZOTaN.js"},{"revision":"e44f766f61b86945945daa3ee992d9d2","url":"build/js/Footer-DJDpPyYh.js"},{"revision":"931201a63b2a013791e7fc21644a1e9e","url":"build/js/ForCreators-BFOm9Dri.js"},{"revision":"87a2e6d9c4004adbe97a9f648c1b7219","url":"build/js/ForgotPassword-ykgwL_bD.js"},{"revision":"85fdaa16948d8fb8b00cd967efc3f158","url":"build/js/FunPart-DvZpJKGi.js"},{"revision":"3742dcaee8f1e18cc0e898ca7ffa89ad","url":"build/js/GetCart-D-2Ll3P5.js"},{"revision":"3463bf3ae8abdf9680f8376868519462","url":"build/js/GiftAddCart-v9nHiRAh.js"},{"revision":"b18f6a776c5747564f9b5a55b9e52363","url":"build/js/GiftEdit-CkfBrwsi.js"},{"revision":"d91d7b3b179e31261c8ebf8c0a53ce1e","url":"build/js/Gifter-DIq9uzhm.js"},{"revision":"7902281f396acdafbbdf8bcedd2a4d9d","url":"build/js/GifterCardVerification-DsNQhbPS.js"},{"revision":"342bb0b7b7443a9bd1da63682bc40153","url":"build/js/GifterFeed-BDHw6Qda.js"},{"revision":"59fdc102485bfb45ee69e2fa480e9d11","url":"build/js/GifterItems-DyjRlwDB.js"},{"revision":"83a37038ee169e1fa8ddda42fe1b2bfb","url":"build/js/GifterMedia--yoJrMr8.js"},{"revision":"069ade55f30ccc36d87a6b32df282a58","url":"build/js/GifterMembership-CUkMsa6M.js"},{"revision":"c9a974775236bbd341dce50bcf0fb20e","url":"build/js/GifterSubscriptions-DwKBAEkY.js"},{"revision":"92176e8e45b7b4699a4c5e7e7b0a3691","url":"build/js/GifterTips-CvP3TeeZ.js"},{"revision":"4584bdfe7e8f26aff1380073f20ce113","url":"build/js/GiftListing-BDRDRjr3.js"},{"revision":"a3485cc6241a8c39a44c4c2a4266f762","url":"build/js/GiftStore-ld6NS0Af.js"},{"revision":"a1fc4b69aeff258f19c9a1f965e51164","url":"build/js/GlobalCheckout-DqLddJKO.js"},{"revision":"9c73de91d5267e224baea210f60f0072","url":"build/js/GrowthTrends-Bg9wpcfx.js"},{"revision":"9734a39bd11f880f01231f39bfa4c53c","url":"build/js/GuestLayout-BHWt1iry.js"},{"revision":"777cb6b6e3ad8e5c1413b1629c06faab","url":"build/js/HappyCreators-DWSiwtiK.js"},{"revision":"07644d852ce31d20f5e6d3e5637ee8c2","url":"build/js/Header-C7CM8pdU.js"},{"revision":"f36794c5b227bbd17331f85dc29d0027","url":"build/js/Hero-DKOG74HI.js"},{"revision":"de3929525636fe6a80165901f1e7d21f","url":"build/js/iconBase-CaAOhAJR.js"},{"revision":"d42677e1e578d6c2c1b6c176c86ca98a","url":"build/js/Icons-DL2I5psa.js"},{"revision":"dd81c9db6e49a7fba17d53a7b9ea3351","url":"build/js/ImageGenerationWithAI-CZZTpaZQ.js"},{"revision":"170fccd20c9d418ab538387be1730151","url":"build/js/index-BcUQW_3i.js"},{"revision":"e8a9a6af12c3b4366bff3d9b10fcc10d","url":"build/js/index-BgUSVpAj.js"},{"revision":"e0b8f92404a405ed56c5c75c1b5ed7d7","url":"build/js/Index-BJr7vMqV.js"},{"revision":"bb417a5b39a3d9aada2615ee0b16c066","url":"build/js/index-C4ePiiqR.js"},{"revision":"cc6c291933c16d06f11b42504468dce1","url":"build/js/index-C7KQVvZD.js"},{"revision":"052d88444252915a64721ce3c08ccb18","url":"build/js/index-CA7Dwpb2.js"},{"revision":"c540687baa13df62f91c30d16fc8fc16","url":"build/js/index-CsiUIVT0.js"},{"revision":"d007eb3a5a1b8e53e8c012862f0ae678","url":"build/js/index-D4S2px2a.js"},{"revision":"0976720d52029ef51d7c7b004e6cb1c8","url":"build/js/index-D5TKs07T.js"},{"revision":"cd75b3af5da71b6f4db38b9c1c1a841d","url":"build/js/index-DGMIwNYm.js"},{"revision":"0cb18a748c9c2ff73e0726119d8cdecd","url":"build/js/index-DtRg_Djs.js"},{"revision":"489b65ca11579dead662bac377922422","url":"build/js/index-ErvvJ7cf.js"},{"revision":"8bddd9409f7665c12ab8087bcb18a653","url":"build/js/index-j81lKM3d.js"},{"revision":"eb76040d45e137854637d3da1f759cab","url":"build/js/Index-n_Ps6KQd.js"},{"revision":"8e6947c061f7d9ebf77c8ef51a3c573b","url":"build/js/index-pcdgZJjQ.js"},{"revision":"c725b5b9432f05cbde2c2bdfcef0db37","url":"build/js/index-V2w2z6rO.js"},{"revision":"43547823155f080d7ef8ddf1b19ee2f1","url":"build/js/index-z6UHAch4.js"},{"revision":"d84b1103a5442c35e30f9d2079fdf387","url":"build/js/InputError-CiwmOCMW.js"},{"revision":"d9d44fdc73c10f7b5e5ccfc40a104292","url":"build/js/InputLabel-I4vEVtCx.js"},{"revision":"c6599279ab4b49c1d311a4769efcb185","url":"build/js/IntrosVideos-byJvKQLv.js"},{"revision":"66cc999696b489a070e7e5985c74bc63","url":"build/js/Item-C9tyEGtQ.js"},{"revision":"1d033e63136ae2f077bdd294599d95ac","url":"build/js/JoinUs-5vp-5GQm.js"},{"revision":"66d4414a72afa37b8278b8d2027668d4","url":"build/js/LeaderboardStars-r4Is7oE4.js"},{"revision":"2230566481f3da70035fcf119d2711af","url":"build/js/LineChart-Df4FoOwh.js"},{"revision":"aa23bb33773cf83f764805b073f0940b","url":"build/js/LinkTwitter-DCVm1GT_.js"},{"revision":"046743c983a9c9c9bab0203dd83d649b","url":"build/js/Lists-uXrR9lMC.js"},{"revision":"033c375b5ef2cc2729e82ce0eed3d588","url":"build/js/LiveBar-CA95Bl7T.js"},{"revision":"ac14fe06fd39df89b85e66de0b94a5e9","url":"build/js/LiveBarSection-MOy4OsTz.js"},{"revision":"fb490ee7be5d17f88ecc66ca6b5a621d","url":"build/js/LoaderButton-nBE-5IjE.js"},{"revision":"9128227ed10f62f137f91c95627683e1","url":"build/js/LoadingScreen-dY1vidWP.js"},{"revision":"d1b5f47cac800c0f2e79e267a9932dee","url":"build/js/Login-GjK_MPay.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"26c9141a9149b6956fd1ecb7789ab63e","url":"build/js/MagicBellNotification-Bp5Pa6Gq.js"},{"revision":"f5b04a6d88576ba4876e998ba2362754","url":"build/js/MagicBellNotificationDisabled-BLkMr3my.js"},{"revision":"5d15e5565b6a50c4f06d6caa868e3049","url":"build/js/MemberCheckout-CgtSK7Nf.js"},{"revision":"a276d1f1c5c3ff24a542398477f4bdc3","url":"build/js/Membership_dashboard-C-t1RPGc.js"},{"revision":"eb4777b7c282d2702af85ce9a8cfc48d","url":"build/js/Membership-BYcddC0t.js"},{"revision":"7abb9b0aeff765be8215fafdf6cb3322","url":"build/js/Membership-C1QGH2nH.js"},{"revision":"9cf4e6a1a15b5ac5f7d3ab02b5c0e7ea","url":"build/js/MembershipLists-DFR3kGgP.js"},{"revision":"ef88b7ca0b80603337fc71df410df38a","url":"build/js/MembershipsLists-U80A0Sti.js"},{"revision":"a3ade6c8eefa06dbc1fa7cb1bf2d509f","url":"build/js/MembershipTracker-C28JFLeQ.js"},{"revision":"4a15863e22d8544b2e108555caef6b2d","url":"build/js/MonthlyRevenue-DPdzXDe4.js"},{"revision":"b053e5d3ecc5121335d0d7383c9a68af","url":"build/js/MyGoal-BlFIERFc.js"},{"revision":"c7a15a7ddb6608ba395d75f2dcc5f7e5","url":"build/js/MyShopProducts-BFf4_1Cp.js"},{"revision":"3b8206ff4e1b9afa61798dd690905d11","url":"build/js/navigation-CNvu5ZY5.js"},{"revision":"29aea785edd125faa1b6dda1e7049c78","url":"build/js/Nocontent-EgqBBqKq.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"b101d6e60ba26f05d4806090e34dd804","url":"build/js/NotForBusiness-CtkiEfR8.js"},{"revision":"852ad2b16ddda5780e52bee4d0540f34","url":"build/js/NotFound-CuJsoRVG.js"},{"revision":"35e2b2a9fadfe7288d05a4bf60d60d73","url":"build/js/OldSubscribe-EjyfTBRV.js"},{"revision":"287987819f13f6d9ad2dc1282712c262","url":"build/js/OrderDetail-C0xBh2av.js"},{"revision":"23bdbf6727c01c915a1cc0827c942b82","url":"build/js/OrdersLists-D0RYhwN8.js"},{"revision":"a9d40fbb8237e62aec371bdce2700e07","url":"build/js/pagination-lt7jDpcF.js"},{"revision":"85cff731033c648fe2b3d43d3658827d","url":"build/js/PaymentDashboard-B7m-ec3F.js"},{"revision":"8365f7fb6cd62dc5961397364f251252","url":"build/js/PaymentSlider-DWD3C8XD.js"},{"revision":"5f0831d4c3fdcd900ac1947a36add944","url":"build/js/PlatformAnalytics-LKApHxAP.js"},{"revision":"754c8731caf0edd542a054cb479a7e40","url":"build/js/Popup-BLgWHcB3.js"},{"revision":"760958aaebf5b2a1f2d5787bf6753d38","url":"build/js/Post-CDTurHqr.js"},{"revision":"0fc677716779a9bfe0689a5d8d57ceda","url":"build/js/PostLike-DKDw_CKp.js"},{"revision":"42e88cf92ae9eb29e8661d0c76925ce1","url":"build/js/PriceFormat-Ddw8gt2H.js"},{"revision":"e9d8cd5ced89b2d0e6560c17b053f387","url":"build/js/PrimaryButton-BPxogiep.js"},{"revision":"a5dc6467ab1303db0ae43d4924d41b6a","url":"build/js/ProfileProduct-BRHMEk8H.js"},{"revision":"1d70ffb354f5614c633bfa6741748ed6","url":"build/js/ProfileProduct-C_-k-RqY.js"},{"revision":"154cb067d22d33983e4b7b76db647a0c","url":"build/js/ProfileProductLists-Brdjk79z.js"},{"revision":"d8e05e35d35b36a5f9c308237d785642","url":"build/js/ProfileProductLists-C1YR1-ak.js"},{"revision":"529fe912578fc2ec5f7b6b3e95604736","url":"build/js/ProfileSteps-BIxRBh_y.js"},{"revision":"02bf9fe77fd5b16552f0cd7fb77c4b05","url":"build/js/Promotions-CzHYZhai.js"},{"revision":"50f9323d7dde40e224e4ab2bc7813294","url":"build/js/PwaInstallPrompt-DUMdRvAY.js"},{"revision":"3fdb790cbb17eef2ef56500bda8a8e79","url":"build/js/PwaTest-DUo3TwGU.js"},{"revision":"a1cdf124afb14d2f8dd4a9dd0e764afa","url":"build/js/react-select.esm-vjMtYAzY.js"},{"revision":"cfdf1c591765603ed542f22051b54fc5","url":"build/js/RecentSupporters-RuPociLI.js"},{"revision":"d631ded2011e4ed0fce2bf04777c9179","url":"build/js/Redirecting-D5aUfE9t.js"},{"revision":"3f0006cd912c4978ed084993f8b1aca7","url":"build/js/Register-yph8U_KX.js"},{"revision":"3cf9e2b8fc6bd128ad7633fe5c1a82df","url":"build/js/RemoveBill-nrTLz-m9.js"},{"revision":"65560a0756b0c30b786ef906b07c0051","url":"build/js/RemoveMembership-DqqUZJuG.js"},{"revision":"be7e5da93e594d97892d0a4a88617393","url":"build/js/RemovePost-i3GjX-YK.js"},{"revision":"a8756f9f0029830702d06a4a7a7d81cb","url":"build/js/ResetPassword-De2PQ6NG.js"},{"revision":"c296784d87b5ba3f732465b1fb287b04","url":"build/js/SafeTransition-CRsqq1gZ.js"},{"revision":"9f76e511753f1f715db1c6e9a9a502bc","url":"build/js/SayThanks-CTN386rv.js"},{"revision":"257aa0837ea8754f785d7ceeb79444b0","url":"build/js/SecondaryButton-BC8MOPII.js"},{"revision":"f53b207754f2c31daf8730c6581c8e9f","url":"build/js/SendTip-O-1z2ENN.js"},{"revision":"657e5b24b9d8cce1fc74ac03af44322f","url":"build/js/ShareProfile-C8PdCtoh.js"},{"revision":"1d5af48f17b3887ae2e7558c3a70d3d6","url":"build/js/ShopPage-CTNRwEYJ.js"},{"revision":"2b8b383f95ec621ad2724164950419f5","url":"build/js/ShopTracker-DYVdWjQg.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"f699551acf10941fbf714fe7c56f2c21","url":"build/js/SiteSubscription-HUgPJztd.js"},{"revision":"6d6b5ad6cc1a80c87ded857dc6cb3afe","url":"build/js/Social-6rwU6Mfs.js"},{"revision":"4b55346e1cfcc35af1251cac26169492","url":"build/js/SocialLinks-CdDSuUXx.js"},{"revision":"4a63d5698424aa2156e3da4a2e056c0e","url":"build/js/sortable.esm-BAHr9_SB.js"},{"revision":"e47897f57e851aff23e7acc30a806f15","url":"build/js/Stripe-CkE0kwWH.js"},{"revision":"9189cfb400df21da336ed5534d926d7e","url":"build/js/StripeIdentity-AK874IyV.js"},{"revision":"04c8cb754cc33352a2f592e8e09c9c38","url":"build/js/SubCheckout-CrW2YnT7.js"},{"revision":"5a9c25e9d62382937b2e4575f647d855","url":"build/js/SubcriptionEarnings-1EYnZqYs.js"},{"revision":"f3eb3027c5ce071bf93159c3f6240b70","url":"build/js/Suspanded-mCrqxenY.js"},{"revision":"3ff00ea3a362229e45d52d430c99201f","url":"build/js/swiper-react-D_S--K_t.js"},{"revision":"f4e75451f90fa5b47f294f23fe6665f9","url":"build/js/TabbedDashboard-riidruuA.js"},{"revision":"bc0e094b1f2c595c2da1b91c02a887b9","url":"build/js/Terms-CBg0mOnK.js"},{"revision":"808b9610029e940e42a04597bb33f3c3","url":"build/js/Test-D4KThMSo.js"},{"revision":"a87210fd05e24826f4ae1fdd39ace515","url":"build/js/TextInput-Diaf4VVA.js"},{"revision":"69640e36df0ead4e056c3cd688d7a2eb","url":"build/js/TFA-Blqd-PM-.js"},{"revision":"955ab2370e63dc38160e1dd7696eeb1b","url":"build/js/Thankyou-ckzSdG3n.js"},{"revision":"3f75507eda19e325331c80bf1755fdf4","url":"build/js/ThankyouMessages-NIx1sR0_.js"},{"revision":"6585414fb1733d14e4749639e201f012","url":"build/js/ThankYouRye-A2PAtse7.js"},{"revision":"2b126c426f862618b16aa40965732f5a","url":"build/js/TimeFormat-Bbei7gJ5.js"},{"revision":"6738b4632862827e0a460895008777b0","url":"build/js/TipInner-gt7kpXM3.js"},{"revision":"e7b08ce8f355de4987a0133521e5f816","url":"build/js/Tiplisting-BXPpexJV.js"},{"revision":"469c95dc1bcdf849cca6832daea47013","url":"build/js/TipTracker-BKrS5axj.js"},{"revision":"eaa4931a988755159308b162c66df8d2","url":"build/js/TopEarnBills-0V5vMtjG.js"},{"revision":"139b7979e5ce280c749b199a5a47a2ae","url":"build/js/TopEarnWishes-ByPHvYBE.js"},{"revision":"f1386a0fb2e365d27f1fb1b2d2fca80e","url":"build/js/TopSupporters-1jAKu_pL.js"},{"revision":"f768aa0e48625102563280e77eb463fd","url":"build/js/TopSupporters-B1X_x8LM.js"},{"revision":"76599999363b01b65bb56b180943e165","url":"build/js/TrustBox-ChARxI4o.js"},{"revision":"1f26d84d140a6cc258ccc8192979db15","url":"build/js/TweetNow-QCVV0DN2.js"},{"revision":"5ff1d18b5d1e4af78518bedb6d89c41d","url":"build/js/UpdateAvatar-D3XOYYHY.js"},{"revision":"08bccb389117412b667e6616e543d3ed","url":"build/js/UpdatePasswordForm-CJzwgYU2.js"},{"revision":"6386d62f7929a66f74597731bdbadf2b","url":"build/js/UpdateProfileInformationForm-CI8PfxsH.js"},{"revision":"26e14bd694f0fa35008b36177bdad9f8","url":"build/js/UpgradeStripeAccount-CS4XjBUw.js"},{"revision":"a33fe5d021bfd56d1e99b3435a530590","url":"build/js/UploadcareEditor-CTYjOFPA.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"461be911503f4e9d6be9d344a9dd5011","url":"build/js/uploader.module-BluU3CvJ.js"},{"revision":"1279641abed0e802b7051e1028d4ef77","url":"build/js/useDispatch-BvkRDrvg.js"},{"revision":"4c823797870440748f7afcf8e49d8df9","url":"build/js/UserCarts-CF1i5jN4.js"},{"revision":"db6de5d9710e0dd2df35252ff6d6986c","url":"build/js/Userprofile-D4cp68M_.js"},{"revision":"a34474f9b0349c222f7f64aa838fa6f0","url":"build/js/USTERMS-CpUlb5rO.js"},{"revision":"7f168fe04cfcaae9c76285aef4403229","url":"build/js/vendor-inertia-nOh2SxjF.js"},{"revision":"b35a6b1dc28ce59c10b486da8e3d509c","url":"build/js/vendor-other-C3ZqLi6V.js"},{"revision":"5514b308f2ae41ed5e7e59703f47e8a0","url":"build/js/vendor-react-BYM_PUoz.js"},{"revision":"c238c5dfdcce1ad2efe36592950151ba","url":"build/js/VerifyEmail-5Cyr7-2R.js"},{"revision":"8ea47f855bb0ce25f04322c4b39e6738","url":"build/js/VersionUpdate-K-hXE_wC.js"},{"revision":"dc744316b7e6ea31333e36473fedacc6","url":"build/js/VipSupporters-u397QzYr.js"},{"revision":"7491c334a18f43e802e1eecd6794a745","url":"build/js/Welcome-Dnb0_vqE.js"},{"revision":"1cd423ac748a86e4d646cc5058724fe7","url":"build/js/WhyLove-B4mf8Kco.js"},{"revision":"4960ce29e33c8d073894b67edbccbaa7","url":"build/js/Wishlist-BhF9LO8X.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"3cf1cae1320b0b6189258803a66725df","url":"build/js/Wishlistbox-DcltSgQD.js"},{"revision":"79bf6005f71abc413fda10b203f17517","url":"build/js/WishlistGrid-5DfDcCAX.js"},{"revision":"df8074ff8aa21fb0ba51f862adc20601","url":"build/js/Wishtracker-By6kONi1.js"},{"revision":"7fd1d5a1c6aa6de8a2753831280c9751","url":"build/js/Works-DBDK8_3d.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
