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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"80aa6e9a18645272701714a23fc1669d","url":"build/css/app-XSWBFaPI.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"74eac91a84096dda36c6ea70eb68807d","url":"build/css/uploader-DA0FOkb5.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"296786c5cc6d37e35fb4e3f0b397eb01","url":"build/js/Accountsetting-DCSlwDYT.js"},{"revision":"5eb0c03994750d8caad634e936b376c9","url":"build/js/AchievementSystem-6XL2qN2T.js"},{"revision":"afbd51ef6a5f06cc7e04281485e882ec","url":"build/js/ActionRequired-5Dg47Zh0.js"},{"revision":"1f52b12549e0178c924565ff765798c2","url":"build/js/ActivateCard-OvF4movV.js"},{"revision":"3494f7388a1be9f05a3fe6c9882c9a02","url":"build/js/ActivateSubscription-C1W0XNJL.js"},{"revision":"3cbeafd115d086c3e5a1317b45916bc4","url":"build/js/ActivityStatus-BpdoS_Tw.js"},{"revision":"1c80c8f7f5155e1c64be8217028fc81c","url":"build/js/AddBills-DtVmbJbN.js"},{"revision":"9e197df190129d5271c5acf336d76171","url":"build/js/AddCart-DHW1p4lq.js"},{"revision":"9f546fe52a1ce7133ca7ad51b3ecd437","url":"build/js/AddComment-DSrckdyg.js"},{"revision":"5eb527b563d79a4b885ea4942ad63532","url":"build/js/AddGift-axis75bO.js"},{"revision":"5fc45a77fa4f7f6f6bc31cda009d60fd","url":"build/js/AddGoal-9Ep71vYu.js"},{"revision":"c0dd3c2b914d7ef969d94a4084e479c7","url":"build/js/AddIntro-CaMIGvVV.js"},{"revision":"c99f7aa43e3ecad3383669f9c81ac9ec","url":"build/js/AddItem-BqxOCoTP.js"},{"revision":"217b11c18c068ea04c1f9c1c66655fb0","url":"build/js/AddMembership-DYtt_sU0.js"},{"revision":"b51c1ad68e03ea43098898ee54574201","url":"build/js/AddPost-DEBGksPm.js"},{"revision":"70cfd77db182e3bc437d284747751c9d","url":"build/js/AddressForm-CWIUV-aq.js"},{"revision":"68d32478e9cdb7ab3b6f14a7e8567b94","url":"build/js/AddRyeProduct-BY8oEh55.js"},{"revision":"261e3d56d55ef74b6eac49a6d6fdb084","url":"build/js/AddShop-DiigLkyJ.js"},{"revision":"a88f330d610f84d608b093d563c9ebd7","url":"build/js/Alerts-D7IPyk_g.js"},{"revision":"02dfd3602c74b6f289a9666ae2cdd248","url":"build/js/AllCountries-DMC8uQmP.js"},{"revision":"d9f4052b92e8cdd2ac3a9e794eaeb3e6","url":"build/js/AllWishes-BRc2IuCY.js"},{"revision":"21ad136ec3bcc2fc47e2330a287c2609","url":"build/js/app-CPwblp1I.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"a441bd34353d3a6a35a4309f27edf709","url":"build/js/AuthenticatedLayout-CH2RRomt.js"},{"revision":"b5e9ddf4c3722f6128f35aff4f10f4e1","url":"build/js/Avatar-QbMTxlvD.js"},{"revision":"0d1180c5b0a93b54ea9e2174d0b127db","url":"build/js/Bill-CAuX2oOv.js"},{"revision":"bcd01f5e802bc998f3570623665841c8","url":"build/js/BillCheckout-hO4hyQ2B.js"},{"revision":"af806577036c39497730a35bd8bf9c65","url":"build/js/Billslist-DD724dgt.js"},{"revision":"a7c0497bc29f39f8bd9287f86703068b","url":"build/js/BillsTracker-BOixCu6I.js"},{"revision":"c66d449c6cbdc3f03c46cb35bdde5df4","url":"build/js/Board-B0VyM5yv.js"},{"revision":"7cc7072ac04a6ec2f212366018e77785","url":"build/js/BuyShopItem-B0w2Rio3.js"},{"revision":"ef103deb5c670665893516856cf213a1","url":"build/js/Cart-bzuaL370.js"},{"revision":"1e94ac1cfc4fa8f3899600f82a3da724","url":"build/js/CartItem-D8pJFkuc.js"},{"revision":"970053798eba2a7cf9c9fe8743d09937","url":"build/js/CartItems-gmCuMBmc.js"},{"revision":"6d8ec69a2958c5594d1517f3704582df","url":"build/js/CartListing-DPPQ0mN9.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"ed02b37c284604ff1249af33881eee47","url":"build/js/CategoryLeaders-n4tiGkTS.js"},{"revision":"a4c420a914f214f2754a5b43dc7d5c3e","url":"build/js/ChangeCurrency-CNfcyPl4.js"},{"revision":"fae0a9f7103714df61217fa46a9cc153","url":"build/js/ChangeVat-DdLB2Pwd.js"},{"revision":"e24fcf8dc07a6bce26d342248f1e3fb4","url":"build/js/ChartDashboard-C5h_KygS.js"},{"revision":"8042013196bdf9405b1e3bd0fef9003a","url":"build/js/ComingNext-DzkKFuKI.js"},{"revision":"3a58691d3696d8fd2f6c34f65d02b455","url":"build/js/Comment-BcN7osIU.js"},{"revision":"513b0d51dd344df95f768caa2c5eebe3","url":"build/js/CommetsLists-1HTvhlCP.js"},{"revision":"9cd5f858ed163d155cc51ebec2a9f982","url":"build/js/ConfirmPassword-yhkP_qFg.js"},{"revision":"4c7b9f7a21447faafe5c4ad9605c2f3b","url":"build/js/Countries-D5SQWG2x.js"},{"revision":"e8bcfd7be371df0a9e2b821471050c73","url":"build/js/CountriesShipping-CYYX1SZP.js"},{"revision":"2fc9832e5f40979672efbedf4a1be2ce","url":"build/js/CreatorActivityWidget-DL8yi5Gc.js"},{"revision":"dd4da159cabfeaefe464065e5f8a4985","url":"build/js/CreatorSubscriptionWidget-CnjONgEg.js"},{"revision":"526f4b9cf7c99189d6cf068fd761d50a","url":"build/js/CreatorVerification-Btkr3XqC.js"},{"revision":"96e548df152768adf5ddc6354a8b6ed3","url":"build/js/CreatorVerificationNew-bdrlRkg7.js"},{"revision":"4fce2c9c943b8ac63c00cd5b7306d763","url":"build/js/Dashboard-DvMsJOqy.js"},{"revision":"4a54956b6c28fa636da827881e2b1b59","url":"build/js/Dashboard-v-6j6pq-.js"},{"revision":"04256e0eb4d693d9b97fd65595450e69","url":"build/js/DeleteStripeAccount-Dvo24I0o.js"},{"revision":"616fa548fb48a60e8f008378fc6a1b51","url":"build/js/DeleteUserForm-DUOkBLfJ.js"},{"revision":"4c99a80b15eee598d663beb2f348e04d","url":"build/js/DiagnosticPage-DTCNUJSg.js"},{"revision":"6bd3123a1c366debfe2a82039dbd9d3e","url":"build/js/Discover-Dzn0exfv.js"},{"revision":"73c0b28f35f8c7dd26f404c27a02801a","url":"build/js/Earnings-D7O137HE.js"},{"revision":"b065df0bd0b26b118b47fb69e5ce18d0","url":"build/js/Edit-Cr0BHW0L.js"},{"revision":"cff82421fa57c595dc20e066fae18b44","url":"build/js/EditCategories-CByVxOQg.js"},{"revision":"6f82f9062d49b6a46b373cb3a5f4c7ee","url":"build/js/EditMembership-CEmTYtNF.js"},{"revision":"7ddfa0bf64c3259702ac5d4bf058de25","url":"build/js/EditProfile-BDA0YjAo.js"},{"revision":"199b051e19cdeb4fad8b3971bf9eb3b2","url":"build/js/EnableCardCapabilities-DQjiUjN7.js"},{"revision":"6668ca36999516d967b535b07b7ff6dd","url":"build/js/EnterOTP-Cl4sVhD5.js"},{"revision":"d6a88ef5b7a6204948a176723388eefa","url":"build/js/ErrorPage-BkoQqg0z.js"},{"revision":"bd9cc04abbc2c9e11ea36ae967b272b5","url":"build/js/FAQ-C7jk7pi2.js"},{"revision":"3ac39562763c562b8dcc75faafebd4ac","url":"build/js/FeedList-n7OwwZ86.js"},{"revision":"818aa20b874c1f8fabe7a35dfe0bcb7f","url":"build/js/floating-ui.dom-GnrqsJ2b.js"},{"revision":"29e3b09498fc18a7bcb0190b244b9745","url":"build/js/FollowButton-C31tWch3.js"},{"revision":"ff6f87290d9b2fae2e9b09128f8ed505","url":"build/js/Footer-BIwgCnWp.js"},{"revision":"c35b569ba2aa6cfa7624472ec26b4c72","url":"build/js/ForCreators-k6FrkIVp.js"},{"revision":"33dd5b50665e6d7e92f9bc05dc4ed757","url":"build/js/ForgotPassword-PqULTYL4.js"},{"revision":"2c1f841895a9551bcb109d6e874ecbc7","url":"build/js/FunPart-BtkWb9r8.js"},{"revision":"653751a3e8f2847b82ea4c84879106fb","url":"build/js/GetCart-BsntR2IP.js"},{"revision":"d3df87c2636cc0b34c61315cd563c6d4","url":"build/js/GiftAddCart-D_-aYqSN.js"},{"revision":"fd99aaede37cef205e5b97a70c3360f0","url":"build/js/GiftEdit-CQAIAfBW.js"},{"revision":"7164618612b3b86c8ea70ac5e4982f1e","url":"build/js/Gifter-CSPDY0Wy.js"},{"revision":"28862a2ec595b3136619c5523f2dd18f","url":"build/js/GifterCardVerification-D3tuhwRF.js"},{"revision":"d3e786ee156c2a15f9c6794f5963113f","url":"build/js/GifterFeed-BTTCRlrD.js"},{"revision":"95a6d67a02a3a30e2687ce42c88080a8","url":"build/js/GifterItems-CY8o09oa.js"},{"revision":"1749d3e8688ccf14e88ffe2fd650c48b","url":"build/js/GifterMedia-1pArjWWD.js"},{"revision":"385c38e67c3be8488f981099c8f25685","url":"build/js/GifterMembership-6kqGxXTH.js"},{"revision":"61d58b2c5f28f2bbef87fbb6fbe9e759","url":"build/js/GifterSubscriptions-BJdEryD0.js"},{"revision":"ae945efffd24bea342f47c9ca965ec1e","url":"build/js/GifterTips-CWYYtmTB.js"},{"revision":"6a3b90b0d78f88fd69cf08a82482801d","url":"build/js/GiftListing-CtucJxYT.js"},{"revision":"70ec00e046e9a33032ba66d773dd7830","url":"build/js/GiftStore-H1QqxrED.js"},{"revision":"447d0785e8c25724262586a33d9fa84f","url":"build/js/GlobalCheckout-Ds_2deL3.js"},{"revision":"e8181255837d0ae158654c707a00aad7","url":"build/js/GrowthTrends-DRY2c-5O.js"},{"revision":"e315bb165e147a18522ee1c6ad929d65","url":"build/js/GuestLayout-chSx3rbV.js"},{"revision":"9223da04afba91e7ed7afa6ed6b057c9","url":"build/js/HappyCreators-D7XQcFC4.js"},{"revision":"4910509aa84485d18d3558026d03ac3e","url":"build/js/Header-DOpzwWNv.js"},{"revision":"6b6a4644d77e2db4813d6d90f97f5a50","url":"build/js/Hero-eSpHxSU5.js"},{"revision":"5e125e83ebac46d00d7146ec0371a609","url":"build/js/iconBase-C73Wx8Xj.js"},{"revision":"aac862e84f229f80550ebb6b560d53e8","url":"build/js/Icons-weozyvqj.js"},{"revision":"7449f8de9d91243ff59e53c59cf65e3e","url":"build/js/ImageGenerationWithAI-CpwV1RzL.js"},{"revision":"3d1a9f44882657949119ea9905073437","url":"build/js/index-3kCCRBKd.js"},{"revision":"321d2911f820cff37c194154f21c1366","url":"build/js/index-B0O2fKTM.js"},{"revision":"e5b031d6a275b385804ba976a161c58e","url":"build/js/index-B3Ra5zkM.js"},{"revision":"3cf68491c6207ce4ad50f5434a1b08a5","url":"build/js/index-Bn8vbVu2.js"},{"revision":"69ecee126273e335ffd7414e06f54ef4","url":"build/js/index-BwFlELVb.js"},{"revision":"302bc8cbfa6328a14665b66f32e9d99c","url":"build/js/index-BxZzLa3r.js"},{"revision":"91bd10d2eca6eebb76443a0e3a2af19b","url":"build/js/index-CBusg34z.js"},{"revision":"cebb38ea9d0c4168197cf51f71e9a6e8","url":"build/js/index-ChF1nFpY.js"},{"revision":"6c20ba53f0a2db72a519ff88165d56d9","url":"build/js/index-CjqqFlU9.js"},{"revision":"fa086c3a203dfe5e319305a6e369505b","url":"build/js/index-Ck5ESKy1.js"},{"revision":"8d8247669c068805e07acc43634686b3","url":"build/js/index-DASzfpY-.js"},{"revision":"2486ff27ae5cdda73320a79694708d88","url":"build/js/Index-Gv-4ycxM.js"},{"revision":"28d9f92108d95c3af1530057bee4c825","url":"build/js/index-ILYGdTIH.js"},{"revision":"28907073ee1f47f6c29035b560b97a35","url":"build/js/index-nkqYoZKk.js"},{"revision":"5b5d156a2d3b69a5be10d2b815e5538f","url":"build/js/index-s07aZ1tJ.js"},{"revision":"b8804ec5698435aaf9ff96f4d593dedf","url":"build/js/index-WZr517LR.js"},{"revision":"3a26ab49aa8d7d5e75b6bc249fc6e35a","url":"build/js/InputError-MKHlRRTT.js"},{"revision":"0f4d12fac09b19aa265e60e65f3f9aba","url":"build/js/InputLabel-ClpqV8_d.js"},{"revision":"30419a5fa9379ec27bbd586a42e765b7","url":"build/js/IntrosVideos-XlirOTou.js"},{"revision":"3e958280efed0879bb4e64880611873c","url":"build/js/Item-CJiN9hza.js"},{"revision":"a73d3941aea06ffb99bcc051c5a5ad06","url":"build/js/JoinUs-Bd2coxYf.js"},{"revision":"56c84a63d8d9dea296e4f464f2ece247","url":"build/js/LeaderboardStars-BoCDicqt.js"},{"revision":"530ef4a5018ccd559be12b01d69fde43","url":"build/js/LineChart-BorsPwMj.js"},{"revision":"5ec43a53a4fa1a151e2c7bde243af1fe","url":"build/js/LinkTwitter-CSzv1fDD.js"},{"revision":"34a376998f31bf2d3d9e73eee7605c6e","url":"build/js/Lists-DBPvv0Kr.js"},{"revision":"3db360a471211a8fe8d73d84ba6ec934","url":"build/js/LiveBar-BDWG_zFi.js"},{"revision":"aa4f6e7c6c73e5a15ed183b5193d894d","url":"build/js/LiveBarSection-Bo5CYOfX.js"},{"revision":"72a0a4f8e7d59b1a014a153797c6e70b","url":"build/js/LoaderButton-cJx1RPy5.js"},{"revision":"ca1cb889cf2216ca38df9be571968bd6","url":"build/js/LoadingScreen-CPvmt-x1.js"},{"revision":"28cf1bced6e3b3aed1981061a75462fa","url":"build/js/Login-6GRivk-Q.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"959e552cbadc9c298dec75e306406dab","url":"build/js/MagicBellNotification-BUA8wrX4.js"},{"revision":"c769df75813294845a82cecad608d56d","url":"build/js/MagicBellNotificationDisabled-D2A9GcpF.js"},{"revision":"e6a9ab4ae186fc8116319b876e471d2f","url":"build/js/MemberCheckout-D33q4T4p.js"},{"revision":"dc41c927fb469f834250c222b9a5a897","url":"build/js/Membership_dashboard-pXpZoI9D.js"},{"revision":"bc568f66de12fbddfbcd68b53a80d94b","url":"build/js/Membership-Be63sBaC.js"},{"revision":"e862f9652662f72d4396b0e71d82d7d4","url":"build/js/Membership-Bjmoc_dx.js"},{"revision":"0c36f5217ba08f7552c504c5b8d10881","url":"build/js/MembershipLists-Bzs23oSs.js"},{"revision":"8d49938929f81e0d44b83ac929c6006e","url":"build/js/MembershipsLists-_884NEoi.js"},{"revision":"74ddd32967ecc899ce240e3d8cf9c16f","url":"build/js/MembershipTracker-HmUgXp5t.js"},{"revision":"a0eb2680198aa3083c800bf418dceb83","url":"build/js/MonthlyRevenue-CE4ae8pm.js"},{"revision":"2a85d18152a6f4e348a7aaddfc63cf7f","url":"build/js/MyGoal-BmsTjhdw.js"},{"revision":"5aa3aa4f8cc64f4a8671e84bc2f8e36f","url":"build/js/MyShopProducts-DJ0UpRpg.js"},{"revision":"bd07137927ba78e9b17b4880577ff354","url":"build/js/navigation-DqLX6i9q.js"},{"revision":"0676d4e204b9acd1fafce06e7986a1a0","url":"build/js/Nocontent-Cp62yujr.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"a681cdd7098fc28535844eb5b7f392cc","url":"build/js/NotForBusiness-BCOTEOjW.js"},{"revision":"0a57560f2b0c9c53b26f8405cc7dde42","url":"build/js/NotFound-euRBOa7u.js"},{"revision":"6a3f8bba783a925ad34f7735f06f9b16","url":"build/js/OldSubscribe-D9qGL4wV.js"},{"revision":"c4dfc94caedded653d9026b68377cc13","url":"build/js/OrderDetail-Df0MMY57.js"},{"revision":"f592b48e4c55358b17c61e82f284545b","url":"build/js/OrdersLists-C48g3ubi.js"},{"revision":"2e3bcd2cda2035cf4feddcadf12326a2","url":"build/js/pagination-BKyb5FwK.js"},{"revision":"c8b506122f7036ba8dfe9545a08c3dc4","url":"build/js/PaymentDashboard-BQfBU4mV.js"},{"revision":"ca5bb0fe6bf79427b89fcf5e014dc9d1","url":"build/js/PaymentSlider-CFiZkDIu.js"},{"revision":"d8f8d70cecb454da1859545e41b20d15","url":"build/js/PlatformAnalytics-DCNv1T3C.js"},{"revision":"14275f12d09fe2f266e2b5d62593324e","url":"build/js/Popup-BgxXorSh.js"},{"revision":"090a05dd79b0cf35f6c8573f094fcfd4","url":"build/js/Post-5wcEZGT0.js"},{"revision":"97645c60a238ea35b07c5c10a975abe6","url":"build/js/PostLike-BWjEBu08.js"},{"revision":"31f78ebc148f06dd08a191119a69d7c2","url":"build/js/PriceFormat-BFFWePyi.js"},{"revision":"399ea25ab72f6a18a53d3f83945ea6fb","url":"build/js/PrimaryButton-DQHnZn47.js"},{"revision":"3f18382ec7739ac6174310a164ee8deb","url":"build/js/ProfileProduct-BxXgyBYC.js"},{"revision":"f8b9cf7f313cd16df082edca5d2d7a88","url":"build/js/ProfileProduct-DqqPQc5t.js"},{"revision":"b64369c58606ce488b32386146ebaddd","url":"build/js/ProfileProductLists-Be-eKVWp.js"},{"revision":"8ee37d48a57317132f18f6cd008f689d","url":"build/js/ProfileProductLists-P_YUkP8L.js"},{"revision":"a0e86c0e72346afa8ad6b886c81d33e6","url":"build/js/ProfileSteps-AEevCYzs.js"},{"revision":"98d7ebaa37cf0cf90a46f5e91f109e3c","url":"build/js/Promotions-B_U941P-.js"},{"revision":"39d324254e367faba51352283c7bca68","url":"build/js/PwaInstallPrompt-CVPpk4Te.js"},{"revision":"4e14f3cc74efc6af8225fe5d9ac0850c","url":"build/js/PwaTest-DlsGCYDc.js"},{"revision":"228b890dc2846de520697c83017986dc","url":"build/js/react-select.esm-CHExebXC.js"},{"revision":"9246e20e4fb55634e2699a9069dc7485","url":"build/js/RecentSupporters-COrBW_2v.js"},{"revision":"0214e0d31dd5bed758d738030629a67d","url":"build/js/Redirecting-CPSRsTe0.js"},{"revision":"b68a1c68cff903a6cdb857e250a30e09","url":"build/js/Register-CVfja3j-.js"},{"revision":"3481f8613e5ebc794e4be6e6410a7735","url":"build/js/RemoveBill-_EBk5Ey8.js"},{"revision":"5cf2b9cc2a5f0679a4ab31863875d784","url":"build/js/RemoveMembership-Dqd2chfz.js"},{"revision":"fefe8f9ee8bac5deebae515e3fbe2860","url":"build/js/RemovePost-TzIRN4W2.js"},{"revision":"a2366fef55b2ca56cf2149e205784787","url":"build/js/ResetPassword-CK_HYNvI.js"},{"revision":"792a3b042b192e3210f3d7aceae7ec73","url":"build/js/SafeTransition-D3Ov_-T4.js"},{"revision":"f5e13baabd519e26b52ce996fb0b0f98","url":"build/js/SayThanks-B9x2RDFn.js"},{"revision":"9dc47d3ef996323b523b1a7249c8110b","url":"build/js/SecondaryButton-DdtWcz8J.js"},{"revision":"54f8f7d2928b9d528c4ae30a7aa4a2c9","url":"build/js/SendTip-B6N81V3c.js"},{"revision":"dbaf57fee17a207181a5d525d11d32da","url":"build/js/ShareProfile-Cb3RlLed.js"},{"revision":"4ceefd93853befd685128f9956f168d0","url":"build/js/ShopPage-B787lm32.js"},{"revision":"f75f2cdf1a4f33cf2175d353e224d8aa","url":"build/js/ShopTracker-CkngcGjx.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"f637f70df2210bfab7c8edf686b301f9","url":"build/js/SiteSubscription-C2Q22XIo.js"},{"revision":"ab1d600641986367460306953b49405f","url":"build/js/Social-BT4KWqSD.js"},{"revision":"7412a92d4ade7d122013de2aa9aba768","url":"build/js/SocialLinks-BibnB0VK.js"},{"revision":"81e0032d685bb620f05e02a422fd0a99","url":"build/js/sortable.esm-DC1aF4Ld.js"},{"revision":"864b8b03741f43aa26ac39b89cf63a71","url":"build/js/Stripe-DXHoN2ml.js"},{"revision":"71cacfc38466d6c102bb10a3157a979e","url":"build/js/StripeIdentity-B8g1cad4.js"},{"revision":"92a2213fbcc6b5b16272a2b60f7a0646","url":"build/js/SubCheckout-C3EC8RRZ.js"},{"revision":"d05db69fc55c7c430794a35c7b6c6741","url":"build/js/SubcriptionEarnings-CEXwUmBA.js"},{"revision":"5b0a4af808a935b977d88685056a52a1","url":"build/js/Suspanded-C8k_238A.js"},{"revision":"ff84ffeba88f06070833ea98bcade88d","url":"build/js/swiper-react-D1RsQQ7o.js"},{"revision":"6783e0d6c6669d6480808cf392fd2740","url":"build/js/TabbedDashboard-C5rr13Yt.js"},{"revision":"ab47e74eefc8f316f2a0d8754ab7f0bc","url":"build/js/Terms-CcSCjuMo.js"},{"revision":"9861a4df39973b35ce8b9e3ca1d6b6f6","url":"build/js/Test-DjQocDNT.js"},{"revision":"ad6777ead69fef18f10f009082d7251a","url":"build/js/TextInput-C4oUrG8b.js"},{"revision":"30da30e8ed31ebe86808f2e8eee53a2a","url":"build/js/TFA-KnliMk6C.js"},{"revision":"f61d1916bc9a469d5e46aab63a07c7d1","url":"build/js/Thankyou-B6Rr9pKt.js"},{"revision":"8a9a413191b523fee6dfe8ea87b8f041","url":"build/js/ThankyouMessages-BuUKQRro.js"},{"revision":"206e86a0812943a1e65cff71248b8c44","url":"build/js/ThankYouRye-BHsLTCNA.js"},{"revision":"2af9f4bc6bdd7628e5c1f654609e4e05","url":"build/js/TimeFormat-DSPCj6di.js"},{"revision":"5b5422887d3ec1a302e29a15638e1b42","url":"build/js/TipInner-BtahNRNi.js"},{"revision":"c2edab024a26387e0ce84a50e72aedf9","url":"build/js/Tiplisting-DCif-9oU.js"},{"revision":"254fed317b61aa66b16f3daf42ae6c5b","url":"build/js/TipTracker-DXgx0S_L.js"},{"revision":"f5ceeaab9bed5b9de862ab629c3635a3","url":"build/js/TopEarnBills-Uc6bOj8V.js"},{"revision":"5b7f3c12672cab325158aeb657c28824","url":"build/js/TopEarnWishes-BskqmXXL.js"},{"revision":"89d56f98166a410170eb617cf63bd260","url":"build/js/TopSupporters-BYKWrA_2.js"},{"revision":"f6123281e693e21920307cd3d7ce2c41","url":"build/js/TopSupporters-CPAFi3iL.js"},{"revision":"b754d783d9f31df4088d0e78f1b320ca","url":"build/js/TrustBox-Xidq0SSg.js"},{"revision":"8e204be022670c39bedabc806b302728","url":"build/js/TweetNow-Cl_eN18x.js"},{"revision":"40b1625a151a56169795fc1b6cbda2d6","url":"build/js/UpdateAvatar-zFUz3jys.js"},{"revision":"eecba86a4eeb6c05aa9a0870a69c8573","url":"build/js/UpdatePasswordForm-zrJIcczH.js"},{"revision":"af53de2bbbf869c9e923e6c87687cb91","url":"build/js/UpdateProfileInformationForm-DGCabo9v.js"},{"revision":"8c25886f8f77b3867c223865d6d01a2a","url":"build/js/UpgradeStripeAccount-BUyMC1mm.js"},{"revision":"f352c782aa226746d9006ec982dfc287","url":"build/js/UploadcareEditor-Bt84Fh4G.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"361a4ce249e10840e3e127e9cad500e2","url":"build/js/uploader.module-BGGw_Xr2.js"},{"revision":"2e7ebca9ef2fccd9b795813c14111702","url":"build/js/useDispatch-BK5KtpGq.js"},{"revision":"4e3e42e0f4de4cdb37e66e35fb30d289","url":"build/js/UserCarts-C12RydfS.js"},{"revision":"d7fd39a6cdd8922c087c5e62335a2924","url":"build/js/Userprofile-CFdbJ0Yd.js"},{"revision":"aa5c137dd422ccd638d10c3b77413ee7","url":"build/js/USTERMS-DNIR2xmJ.js"},{"revision":"89b54a06550a9c3e1e85c6dd2ae53b48","url":"build/js/vendor-inertia-BzKA7ZXb.js"},{"revision":"e0a2bd4e1e2a32a71aed6546ae6ebef7","url":"build/js/vendor-other-DEvkJdGj.js"},{"revision":"c8dd18ad954cb9d2f4323b951a264589","url":"build/js/vendor-react-18GqBPFw.js"},{"revision":"72602faef91f8740ee3fe77b12ae38fa","url":"build/js/VerifyEmail-BC0_YYc7.js"},{"revision":"de6cb0c73e092cd4d94538f40e8db9a5","url":"build/js/VersionUpdate-BK8H_1_Y.js"},{"revision":"11f5a161aaa2a1f14c36ddcfa14dfb27","url":"build/js/VipSupporters-BdWGz7uM.js"},{"revision":"2493e1534f7f701c7f5f4c88e6c09d82","url":"build/js/Welcome-C71c8X0L.js"},{"revision":"f91f03a72acf374468ef9d977e232ab9","url":"build/js/WhyLove-CABTs6pq.js"},{"revision":"8ee80111f64c1d0cfaa2e59ed913b36d","url":"build/js/Wishlist-gJ4OHGkS.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"b6d5ace282df259bf45d1277076e8e01","url":"build/js/Wishlistbox-VCl5lpyN.js"},{"revision":"248fb653824eaccce9a7891fd15f5cc7","url":"build/js/Wishtracker-BoquCX-V.js"},{"revision":"89eab3a05d5bb30306fef3bd4217103c","url":"build/js/Works--MhC_Ghf.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
