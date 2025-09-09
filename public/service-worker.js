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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"d00bb09ca952e274cb1e828921a588ca","url":"build/css/app-DQxUNHEB.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"f12bfb8a64a0a5fbeaffa4d9d5527f17","url":"build/js/Accountsetting-ClH2itmU.js"},{"revision":"e5e4619684a2b60108ef566d57746217","url":"build/js/AchievementSystem-xhuo15Ms.js"},{"revision":"a329539fb36c7554900a0252837bd98b","url":"build/js/ActionRequired-ui1b1Xah.js"},{"revision":"186e939fe005d30e96a0f9eb53d32c43","url":"build/js/ActivateCard-BgxCHoRs.js"},{"revision":"828bc6c9dfe79c56d6cea044ac2feac9","url":"build/js/ActivateSubscription-CbAQyhGx.js"},{"revision":"7aac118a99b9f436542714b6940a2120","url":"build/js/ActivityStatus-YFoyr8FN.js"},{"revision":"58587a4655397e5c87ec3c076f36244e","url":"build/js/AddBills-CEsQaogE.js"},{"revision":"c6542c759c2c1f06e7708ea9f779067a","url":"build/js/AddCart-CegLpWot.js"},{"revision":"fb297bed5510cfa847f07cc6f1d9d9f5","url":"build/js/AddComment-BKBtqED6.js"},{"revision":"6f966bef6f46a3c63749b37be783f876","url":"build/js/AddGift-CkL90lpG.js"},{"revision":"5f47b43fb15d83f4b5081bea149cdb74","url":"build/js/AddGoal-ZDJ26Fu5.js"},{"revision":"cf7a9beed47b3a727325270bdb5c5082","url":"build/js/AddIntro-Cs-dXJEg.js"},{"revision":"04cc46c1f64a53b64ddc92a0ba742de7","url":"build/js/AddItem-zOYqzmkt.js"},{"revision":"3f677ce590373246e53771ee814ba301","url":"build/js/AddMembership-LYhGVW1B.js"},{"revision":"67d5d2a19f3614dd04057bd134b2b103","url":"build/js/AddPost-CDPrSyR9.js"},{"revision":"9501a5d9e391bd2c3322ca75fbde88cb","url":"build/js/AddressForm-CJc4Vn1C.js"},{"revision":"a0e1a5cec87d866ffa5ced84bed0f71b","url":"build/js/AddRyeProduct-X4qa7mFk.js"},{"revision":"d1e92016751604c08cd41c5fa7154c77","url":"build/js/AddShop-CxCeED0r.js"},{"revision":"e5bb1adf16ae2dd947ba3747942a07a8","url":"build/js/Alerts-9e8UPeRH.js"},{"revision":"928dafa3bff7094c2630b236e4d53304","url":"build/js/AllCountries-DNw9R4E4.js"},{"revision":"88a06829f97be676994e324531217239","url":"build/js/AllWishes-BINinAWv.js"},{"revision":"7d3e9755cd8d8ee10b6aafcd29f41d4f","url":"build/js/app-BmuOJ_3e.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"616afda6daf0ecdddefbd7390e1ed267","url":"build/js/AuthenticatedLayout-DVAcffpB.js"},{"revision":"98363414ce8bfd702c6d6f28356b8d39","url":"build/js/Avatar-DU7RwNcE.js"},{"revision":"a6f7e942a8ee02aa777d70921c01ed25","url":"build/js/Bill-BI9DWZPu.js"},{"revision":"e046251a82961a9848ddef06a8e18233","url":"build/js/BillCheckout-CNTmrYvD.js"},{"revision":"ab6592c816a6139b251439c3a98c5043","url":"build/js/Billslist-C-6lQP01.js"},{"revision":"6f56b7bddc73ea6f3d9d81b530915d99","url":"build/js/BillsTracker-skGQqifq.js"},{"revision":"1e5cc82349f683eb4fe961af7bbd94d0","url":"build/js/Board-gjqWSpie.js"},{"revision":"6c8117bcfa367a93bcdbe79d8ae60fce","url":"build/js/BuyShopItem-DiyGMdPi.js"},{"revision":"23f46e2e40abe8dec1775b9c44c59a0f","url":"build/js/Cart-DBYzFMQs.js"},{"revision":"98189b384c84a412547cc0fc8f941885","url":"build/js/CartItem-ruH5jyux.js"},{"revision":"5763ea79e551778c00f5d10e986aa1a1","url":"build/js/CartItems-CtzX-kjA.js"},{"revision":"7322b0b8b3e4d202e6e51b1466d40f3b","url":"build/js/CartListing-cvs7Kd_8.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"6c0742618c06be9299f08a00802a1e18","url":"build/js/CategoryLeaders-BpJC84Bf.js"},{"revision":"9852ded033a5fc0218ccbca7711fd637","url":"build/js/ChangeCurrency-DXYaTvpW.js"},{"revision":"964493e93af380a7245177aae8881943","url":"build/js/ChangeVat-BFm3Xw7U.js"},{"revision":"5bca48d1fc2341ec04fe25f10672da6f","url":"build/js/ChartDashboard-CO-PRyfs.js"},{"revision":"c79200835e10f67b12ef1494609837b0","url":"build/js/ComingNext-CdRWjlIh.js"},{"revision":"1be02bc680bc9a7e9f1672ba12b2e138","url":"build/js/Comment-B1wjrdUY.js"},{"revision":"be1728a36561c35028e3052498ab4569","url":"build/js/CommetsLists-CsgSBasr.js"},{"revision":"4461308842d5bc3b8792b26dbec4a72a","url":"build/js/ConfirmPassword-J_xmNSy8.js"},{"revision":"a902f9c759f8182bb7144d53f9a05e2d","url":"build/js/Countries-D-rdyGdc.js"},{"revision":"c512a494bf3132e8bff5037a868b72f2","url":"build/js/CountriesShipping-D1llZdcO.js"},{"revision":"658f549de40990c1d211e78d44088248","url":"build/js/CreatorActivityWidget-DGpK7bMX.js"},{"revision":"6558050d95adf886ce50c0304f0bd94f","url":"build/js/CreatorVerification-Bsdes85g.js"},{"revision":"4d8813588d56722032cf067ff98e10e4","url":"build/js/CreatorVerificationNew-BozmRyde.js"},{"revision":"d3b5aea25c8db442e3d241ecbbf735f6","url":"build/js/Dashboard-aRJrh5Nz.js"},{"revision":"632a13bb20ea3945b6524ed81d1fbf21","url":"build/js/DeleteStripeAccount-Eodl4ga_.js"},{"revision":"702fd787d504195fe351d10c2315caa3","url":"build/js/DeleteUserForm-CfC8-Xby.js"},{"revision":"0310de06949005d2b93bec15de52ba92","url":"build/js/DiagnosticPage-DnyvZxE5.js"},{"revision":"1b4409711b7c6fc80ce99e3ba77eb1e7","url":"build/js/Discover-Di-Mv9KX.js"},{"revision":"4a5f2deded0ae88f10303ac6dbc917a7","url":"build/js/Earnings-DFUFTRy2.js"},{"revision":"7913927c3011f76be69794fe15d5da57","url":"build/js/Edit-OYil0Dvu.js"},{"revision":"c41242b9e9888ff109c6392e9e4378a3","url":"build/js/EditCategories-CAzXpsaK.js"},{"revision":"9e3abe098a71936eaf0b097f000154c4","url":"build/js/EditMembership-CRUTcK4X.js"},{"revision":"b4662bd8d1a136a1180346ce520b212a","url":"build/js/EditProfile-iw64oH7E.js"},{"revision":"7c58bcc276db9e385ba6f7c150567316","url":"build/js/EnableCardCapabilities-DuXuLIkv.js"},{"revision":"00755e4300c94e34b8276993774844e8","url":"build/js/EnterOTP-DTb_mpkV.js"},{"revision":"c1cc3929627eb21afb83493817ee08b2","url":"build/js/ErrorPage-DRrNel8M.js"},{"revision":"e96d016dea8d56d614d8e955ea639931","url":"build/js/FAQ-BvwVzZQJ.js"},{"revision":"18f5feec89d9adff8e4403340b2484c3","url":"build/js/FeedList-DnZylg5x.js"},{"revision":"b4936feb3452763fa35c9ec0155da488","url":"build/js/floating-ui.dom-DJtutMaL.js"},{"revision":"532ee2c61d3bba32788a40d89e9adfa5","url":"build/js/FollowButton-ySzrtFVT.js"},{"revision":"e2e4c8836ef9029732f85ec56d510c9f","url":"build/js/Footer-CuJPgoQ_.js"},{"revision":"074ee956f31b44c99453dac0fa9d5904","url":"build/js/ForCreators-ByyBl7Mo.js"},{"revision":"2ad3a0027ee6009c0bae953050d0b91b","url":"build/js/ForgotPassword-Ddx97Jv3.js"},{"revision":"ddbd7266392f92be01d1d76c55411419","url":"build/js/FunPart-Be0_Jvea.js"},{"revision":"061c9ac80a32798711d3c3e405f9f96d","url":"build/js/GetCart-0UMwBJE8.js"},{"revision":"a64a5a36d3163fc46c96e231321819a7","url":"build/js/GiftAddCart-DHeCLzGy.js"},{"revision":"67327381e5f4a9561a29fee1c1a50eb9","url":"build/js/GiftEdit-CBYAGpag.js"},{"revision":"c23d879a4c08585fa6cde19474b7ff7f","url":"build/js/Gifter-DaI1hfVa.js"},{"revision":"067e4ece79c7dd7e2564b3edce35f1d9","url":"build/js/GifterCardVerification-DnwU_x8U.js"},{"revision":"78f41ea7acebf095a37f5c0c790aa271","url":"build/js/GifterFeed-CXSrgFA2.js"},{"revision":"5bc32f409c338feba23d55a898c8c83e","url":"build/js/GifterItems-BtJgGfqi.js"},{"revision":"c255b4773f39e8777fd7371abe877346","url":"build/js/GifterMedia-B6-rfkNY.js"},{"revision":"1a7cf61972a63f8841327164d6ab3a21","url":"build/js/GifterMembership-ByhVwBvA.js"},{"revision":"d84455182ab2765935e1d19e0cb0039b","url":"build/js/GifterSubscriptions-gxzSeKav.js"},{"revision":"38512aff64dfa58c26043ef2ad0a28a5","url":"build/js/GifterTips-D_B4pvjZ.js"},{"revision":"072c52a7b257e210552804646d60ca16","url":"build/js/GiftListing-BrJ8ZhUU.js"},{"revision":"10ab49390b225fca23bbb1f534e504ba","url":"build/js/GiftStore-5wYBWQJV.js"},{"revision":"9444d3f2f6e515300a0e4b2d460b0c5f","url":"build/js/GlobalCheckout-DL-RFow5.js"},{"revision":"f5f4ba23e32455a2687f2e0d51f8704e","url":"build/js/GrowthTrends-BU7sHvYl.js"},{"revision":"36f308ecb014e52271cd829315056012","url":"build/js/GuestLayout-BtA1FFb1.js"},{"revision":"d68d2fb6cbc4aa7dfc98c6c1427cdce2","url":"build/js/HappyCreators-Dc472wKc.js"},{"revision":"ee8081fbaafe180b78e99cf7240558ce","url":"build/js/Header-DgATkRna.js"},{"revision":"c8bdd2ef24229804d4023ad10d6d6559","url":"build/js/Hero-xGh4il9e.js"},{"revision":"7ccdee1799f4d88b7a91179d3f6369b7","url":"build/js/iconBase-Cz4DZpJo.js"},{"revision":"aec76d54d5628a0fc496aaa3f4a351e1","url":"build/js/Icons-Cq4nuBmY.js"},{"revision":"8cfd58e4f7a27c193fd3653dfa187828","url":"build/js/ImageGenerationWithAI-CMY04rVi.js"},{"revision":"5c37a55e412559590a3d1a2408279032","url":"build/js/index-_uKWAi2V.js"},{"revision":"0f182d944b721d775577ed8a07ac9268","url":"build/js/index-BCeMV-gd.js"},{"revision":"254897719f02db2cae23614f18ea441c","url":"build/js/index-BeJEQU-E.js"},{"revision":"339f446e768acf305bf44239e6a1d879","url":"build/js/index-BoXq9KrH.js"},{"revision":"33b580e1e5fe67d976d92edca8215c51","url":"build/js/index-BqO4CftB.js"},{"revision":"79dc2d1f43ffd67c1d0969f63934382c","url":"build/js/index-CmI6lO-D.js"},{"revision":"90d2124d2e550657682eac45a9384444","url":"build/js/index-Cpydnkpk.js"},{"revision":"ec7ef4f39397321a8de0b7f25df890f5","url":"build/js/index-CxSwf2-W.js"},{"revision":"923ba69fa6fb7cce50b96b4198ae4a0c","url":"build/js/index-DAe11SKJ.js"},{"revision":"764a427484096932446ce4c9e0341988","url":"build/js/index-Dfm861LN.js"},{"revision":"88f1021e5b2005cbc11c5403956a675c","url":"build/js/index-DnjUpPJK.js"},{"revision":"a8db74596709c81e160340282036114f","url":"build/js/index-DTaQ-WYa.js"},{"revision":"0662c34f24cff9b58cd0e9274f9bb46f","url":"build/js/index-Dzme_CJg.js"},{"revision":"46f493f4a51e6c600f2a597fea8ac57a","url":"build/js/index-Fifk66FI.js"},{"revision":"8d88f03665c5bb901175a00799293dae","url":"build/js/InputError-DSV81enI.js"},{"revision":"1169decd96153db70004bb12edc5fcb9","url":"build/js/InputLabel-CVveE2Nk.js"},{"revision":"02fb6bea97d44c236c3abb035f9c4db6","url":"build/js/IntrosVideos-wTD-_lge.js"},{"revision":"58cfc637e4c5f24b991d6c3cbe10820b","url":"build/js/Item-Bz_Q3ZNp.js"},{"revision":"1a9ef7826e59e25f1bcc8118f1036428","url":"build/js/JoinUs-54Xm9VG2.js"},{"revision":"b9c998b3fe699ad08431548a46765179","url":"build/js/LeaderboardStars-DUAeYtlc.js"},{"revision":"b1585508791b29d0cea694e7e83a8402","url":"build/js/LineChart-DpyPrtK2.js"},{"revision":"7a3cc5836a7385c89edc3c8c4dd12ae3","url":"build/js/LinkTwitter-B1PnECJO.js"},{"revision":"8ac0d1b16fc9c8ecabf1c255f37567f0","url":"build/js/Lists-BL6F8bmz.js"},{"revision":"6002bda8bbc06de1185d16ab1237231c","url":"build/js/LiveBar-DUEzWTqC.js"},{"revision":"2df6ecb99d369d29b75a1b64ccf543a2","url":"build/js/LiveBarSection-B1F7Jwap.js"},{"revision":"44bd54ab7e3d2c2f683f338d41091a9d","url":"build/js/LoaderButton-C6MHLCEk.js"},{"revision":"49deb1430d1d4b822d585753cbc403aa","url":"build/js/LoadingScreen-DjcA48fa.js"},{"revision":"687b7bcd78244ded3b8c2b944d2d21c3","url":"build/js/Login-5qrpNuAu.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"c9e742e31f4194c0049ec1304372d026","url":"build/js/MagicBellNotification-DU3RirIm.js"},{"revision":"796ec25590276c1da118d011a5ebcf8c","url":"build/js/MagicBellNotificationDisabled-BM6h2Dth.js"},{"revision":"1b16813ff9e3437b1be95aad6c26bfe7","url":"build/js/MemberCheckout-DgjjCN5J.js"},{"revision":"7f914c9add53e643970979427f96ff20","url":"build/js/Membership_dashboard-DvlkkaUX.js"},{"revision":"b67561a593344f0bb0f0c538f90073e4","url":"build/js/Membership-Dj_fa6WX.js"},{"revision":"068076776441b0f5e7545fb0f2b5d58f","url":"build/js/Membership-Dt3YyL-I.js"},{"revision":"1f21272ba21db4705fec69f7cab09289","url":"build/js/MembershipLists-BcO9J1GY.js"},{"revision":"516a64e6ea09238762cda7c448f42aae","url":"build/js/MembershipsLists-CxnAG9vm.js"},{"revision":"ba72a2af3cbdb6c8b3754cf91c46b6cd","url":"build/js/MembershipTracker-iUn7xOnl.js"},{"revision":"a758d4f519b20a3b061a4b21c190ba97","url":"build/js/MonthlyRevenue-DCHS_dt9.js"},{"revision":"e6fc1ec04983f67697851593a0f215f6","url":"build/js/MyGoal-3HJeoKZI.js"},{"revision":"8b3e39e31d0af2f396cb7af1a0e9ddda","url":"build/js/MyShopProducts-CU_aOK5n.js"},{"revision":"86cf31a8c7e0188dc1a83d1bdf7ca960","url":"build/js/navigation-DctEEqRX.js"},{"revision":"2f2750fc5ca1b5c039a375acc5000012","url":"build/js/Nocontent-DcaTvBoH.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"a8fc9c5841f606c04f5d9a630e2be869","url":"build/js/NotForBusiness-oE_OCo_y.js"},{"revision":"42cd6252da82ae44e583c035f83d5d63","url":"build/js/NotFound-DhUscR77.js"},{"revision":"8e5488cc6e25a14c3af6647871ade074","url":"build/js/OldSubscribe-B3iBo3fk.js"},{"revision":"ad4a7ef5e473652186773e398b1c315d","url":"build/js/OrderDetail-DUEH42pE.js"},{"revision":"7cb86e4b35ade598de23964cd78fe014","url":"build/js/OrdersLists-Ci5QoZ-e.js"},{"revision":"2f3d35236ac0a6d55f789733291f5a79","url":"build/js/pagination-B3vyoKio.js"},{"revision":"079e157e45067e2da487273fae095614","url":"build/js/PaymentDashboard-9iPsZJaR.js"},{"revision":"2f3be0c7e3b22b821f18a274d9847850","url":"build/js/PaymentSlider-Cz5g8LwP.js"},{"revision":"1c516991f2b15c4745e9d9563205f7b4","url":"build/js/PlatformAnalytics-CKzuFV7v.js"},{"revision":"78b8152386da519bf8feeb52b57c66d0","url":"build/js/Popup-CyDrSgp0.js"},{"revision":"a7012395f4f3adedd98e8b3945df572b","url":"build/js/Post-OUQVBPCC.js"},{"revision":"eb0ca9cccceeb41edd18a6db7ca47590","url":"build/js/PostLike-CeKBRbSw.js"},{"revision":"55baf0c24f9c69c07f6f9b9438766b79","url":"build/js/PriceFormat-CJjxFbhG.js"},{"revision":"d4c70b197375483a2d207a389ad1c5fc","url":"build/js/PrimaryButton-Bs13bEzP.js"},{"revision":"96147113569aca2d5bc2b0beb5bb2e26","url":"build/js/ProfileProduct-CffHiZp-.js"},{"revision":"9ce47c74496072dce58b44211e264662","url":"build/js/ProfileProduct-QQl4rRC6.js"},{"revision":"30c609716aa966b05f2dadf1d2ec5a1e","url":"build/js/ProfileProductLists-CAs1KAhf.js"},{"revision":"0a20514c2c88c08bcd593b0462c938b0","url":"build/js/ProfileProductLists-EVubcbHH.js"},{"revision":"97171d8cd7d8c4c82262f43c9615cd65","url":"build/js/ProfileSteps-BI7dK5m8.js"},{"revision":"b7aa1e1d13a837c7f262568cb9db4471","url":"build/js/Promotions-BfKjcWGl.js"},{"revision":"dc7de8a5bb45931f67238f72965ce00c","url":"build/js/PwaTest-BR-qARi5.js"},{"revision":"3f36ccaa72067da381fa0a55294a2482","url":"build/js/PwaTestPrompt-CqbGfO2X.js"},{"revision":"b3693e40f6f06d8e11a00a5151390524","url":"build/js/react-select.esm-Cxv1ykwU.js"},{"revision":"5aa9651ec70347de61d58eff3d64872e","url":"build/js/RecentSupporters-CKh6bWQr.js"},{"revision":"c6a8ab56cae1af3961e5a1e017e2d918","url":"build/js/Redirecting-3TIkoqe-.js"},{"revision":"3c013e908832d263fba7434dd9443429","url":"build/js/Register-B8gIDKlo.js"},{"revision":"eb93cb370eea8e18accaa4093cd6f5df","url":"build/js/RemoveBill-Dy5b9hs8.js"},{"revision":"78e1b6ec6745443d4eb9554e41df89c0","url":"build/js/RemoveMembership-DA0vYXax.js"},{"revision":"78e156ab2e53b3ac966a890d78f9b02a","url":"build/js/RemovePost-BenjYK71.js"},{"revision":"0e7db394f90d9665286c42cbf99ebe21","url":"build/js/ResetPassword-CLWJxX9X.js"},{"revision":"369bede3f9e1d5032b3e33cdd167376f","url":"build/js/SafeTransition-CO2MwRCw.js"},{"revision":"62593cbbf906615d429a254c4a8dff6e","url":"build/js/SayThanks-BIcthOCk.js"},{"revision":"c4abed841fe92143a9da6922fa554729","url":"build/js/SecondaryButton-DYXp0IOf.js"},{"revision":"0c6ef2031538fe6dc56015fa168229cf","url":"build/js/SendTip-D3prnxoO.js"},{"revision":"8512ad16074d8f54a220b12a362e79f2","url":"build/js/ShareProfile-D2-yygQ3.js"},{"revision":"3f1095704f7c7e64a4071b27d2075330","url":"build/js/ShopPage-Cg32OfFm.js"},{"revision":"2a03f714427840bff9552f239e5db6ca","url":"build/js/ShopTracker-BRIY6Rfe.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"a4e8f54cebcdafddc8a131ed5bcfe69d","url":"build/js/SiteSubscription-S8nBVBXr.js"},{"revision":"780e4f4c99c711e90c8037734a5635e8","url":"build/js/Social-Crl4-Tem.js"},{"revision":"796eb3b4b4c82c1610734bc9fcd79ec2","url":"build/js/SocialLinks-ByJiO3Hc.js"},{"revision":"76efd005a627c7cb7adec1a79bd77634","url":"build/js/sortable.esm-Day77jmG.js"},{"revision":"bfdaaa5df335128ae43fe952942e4560","url":"build/js/Stripe-Ddg-fOXs.js"},{"revision":"6c91e4f994fb9f1e3accc23e6ea4bdb0","url":"build/js/StripeIdentity-DAjDE57Q.js"},{"revision":"7c5bf3d90937a9cfc9a8e618b4444c21","url":"build/js/SubCheckout-BwO-vUZr.js"},{"revision":"aad1a7cbf1fffaf582fd7a19046692d6","url":"build/js/SubcriptionEarnings-DJ184JQc.js"},{"revision":"1783d2f028a839528768a76f420e4c77","url":"build/js/Suspanded-BXneEYIo.js"},{"revision":"3c5854ea979ad2a686420d49b4719d35","url":"build/js/swiper-react-LAUPLDs2.js"},{"revision":"d1282632d3abf80f3e20269808fafb72","url":"build/js/TabbedDashboard-CvUcmX9o.js"},{"revision":"80cd2daefda78df1c165ae3d2210cd8e","url":"build/js/Terms-MEAAp-p7.js"},{"revision":"f338652182913344db54eada1404beca","url":"build/js/Test-C57n7A7I.js"},{"revision":"fffa3f90fee24c166d460b0b21357995","url":"build/js/TextInput-5L2hrTf6.js"},{"revision":"0846af3954fc0d02a3dcb8a851d7aa54","url":"build/js/TFA-JHAOs6Mm.js"},{"revision":"7b7db6e264cff932943e2dd6e9f7bf6c","url":"build/js/Thankyou-Fk1-0zOv.js"},{"revision":"e632337c692cd07b2561c3d1a4e691fc","url":"build/js/ThankyouMessages-D6GFgRwv.js"},{"revision":"8691ce75a840792a29cfb75a05b849b9","url":"build/js/ThankYouRye-BWT8T7DI.js"},{"revision":"4d528fec7ca0fd844bdf3ef87fe9f863","url":"build/js/TimeFormat-3ssAUIJG.js"},{"revision":"1fdd33dd533e5a0a8e7131c7d3ec9121","url":"build/js/TipInner-D9nfecR9.js"},{"revision":"27b542dfa8554122986440aab9baa81c","url":"build/js/Tiplisting-Y1nF_WZ_.js"},{"revision":"a2d362b53df7e7142c33e3f543a4f21c","url":"build/js/TipTracker-Dyx6wKeb.js"},{"revision":"1177fa080c62d917e3cb8aae3d24de6d","url":"build/js/TopEarnBills-R7lPhZF_.js"},{"revision":"2dd0e02a72a6ad35cad933789589704c","url":"build/js/TopEarnWishes-AHk7aF9V.js"},{"revision":"937068b9098cf450625eb69c7d7e4774","url":"build/js/TopSupporters-7tinT3bO.js"},{"revision":"5c094b40c5c2b0e18a619aa2e52f993c","url":"build/js/TopSupporters-D66CtQhz.js"},{"revision":"fb1e570043f39c959b16b837e54a9a95","url":"build/js/TrustBox-BaXHNiTA.js"},{"revision":"ea2eed35ff60d157c9ca8b5f62006ed7","url":"build/js/TweetNow-mwid_Xv7.js"},{"revision":"a0f1adb838d6df6d3e68d5dbb3d5d928","url":"build/js/UpdateAvatar-BBW8UrnW.js"},{"revision":"705f3141901f86eee3a7ad960e1afd0c","url":"build/js/UpdatePasswordForm-CkbuT9rk.js"},{"revision":"07119759f81b8376193ac45bd0bf3b43","url":"build/js/UpdateProfileInformationForm-zr-h8B29.js"},{"revision":"7fceeb63bcdc397296a9f67550c161aa","url":"build/js/UpgradeStripeAccount-DZgi7bza.js"},{"revision":"33bf540191de10e92d6159f4a8358907","url":"build/js/UploadcareEditor-DhEshy_B.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"cde125a0e0875e1458e4d7ee893471ea","url":"build/js/uploader.module-CJYl6Mth.js"},{"revision":"9c81a386ab2c173502d34dc0b1ee7c9b","url":"build/js/useDispatch-BPjLnygw.js"},{"revision":"430b39728b41951c8392970c999235a0","url":"build/js/UserCarts-ChNnDzJU.js"},{"revision":"8497aef69bfef5823697837d89664149","url":"build/js/Userprofile-Cxe40wUm.js"},{"revision":"80cd2daefda78df1c165ae3d2210cd8e","url":"build/js/USTERMS-DAkyqByX.js"},{"revision":"a352b3ca52fe04afdd6349afe56284c5","url":"build/js/vendor-inertia-DDx0xmmW.js"},{"revision":"2f494dd74e86032f119aca26ed3d151d","url":"build/js/vendor-other-DYOch1JV.js"},{"revision":"3c22184e32d3582a6b8a8751f5d76943","url":"build/js/vendor-react-CqYL98nw.js"},{"revision":"982a0e7c4daa3a45e665804977dc1e5f","url":"build/js/VerifyEmail-CH9mBzay.js"},{"revision":"8b90e93bd308821f9c121856e5be34d3","url":"build/js/VersionUpdate-CtDtSt70.js"},{"revision":"d93415bf2c5e225d08dc3b00b062a539","url":"build/js/VipSupporters-BGigvaOR.js"},{"revision":"719946f2d910d2e3d31fbb9466406df6","url":"build/js/Welcome-BrqL7XoU.js"},{"revision":"80b19f2c8856beda5919901b07e737bf","url":"build/js/WhyLove-DuWt3pDy.js"},{"revision":"ddc8b19fcf3f7128da7555b026117e36","url":"build/js/Wishlist-CMAsTxzQ.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"095a74c37d26b3fe67b19bf6de3fb9c7","url":"build/js/Wishlistbox-CsgVm8Yr.js"},{"revision":"a5eee3b50b39674f7b9918ca381fa2ea","url":"build/js/Wishtracker-EoTurrVb.js"},{"revision":"f28f808a66ce22f34d15879eb57912b7","url":"build/js/Works-oKyEfnxU.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
