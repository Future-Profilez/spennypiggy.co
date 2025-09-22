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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"67b87467c1342e4ed30d3da05e2f6778","url":"build/css/app-pvLqfh2C.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"9816d1ba0e0ec014b6141324c22d0ffc","url":"build/js/404-184w_KZG.js"},{"revision":"e95e90fd36561ad770a97221ac34cead","url":"build/js/Accountsetting-e0cD9AZE.js"},{"revision":"d1c7d4af10f0aa1d269ba1d20537d67d","url":"build/js/AchievementSystem-BhkHvJ4s.js"},{"revision":"971822c93995c2b3bab36fb25e47718f","url":"build/js/ActionRequired-DaSxZq4S.js"},{"revision":"083706dca579b72c37e010879b148744","url":"build/js/ActivateCard-DJrCYQ2_.js"},{"revision":"e037824eba4837dd66b8fcde248725c0","url":"build/js/ActivateSubscription-CmDI7o7z.js"},{"revision":"99d67bae7e79b4aa23e5b65b9afd6f2f","url":"build/js/ActivityStatus-C5WWqh3p.js"},{"revision":"b89ce8b7288adeb293d7af08aad207f9","url":"build/js/AddBills-QcrsaK_b.js"},{"revision":"dd4d908e5e260cf55f89f387eec6bef8","url":"build/js/AddCart-BWf0R3Xg.js"},{"revision":"91eb18c87018b7c93efb4eaaf24ac9e4","url":"build/js/AddComment-dJ4K5zBl.js"},{"revision":"d064262d49d758d16cce51ca69ee2c3d","url":"build/js/AddGift-CIqSOGSM.js"},{"revision":"20f94c0d3f4e826d897406e5777ae9fc","url":"build/js/AddGoal-B_O2ahmJ.js"},{"revision":"4d15cac163457be39244e91f96eb4e0e","url":"build/js/AddIntro-DdF7rdAL.js"},{"revision":"2c1c9d33b667d3c24b3b38cd30f5ac5e","url":"build/js/AddItem-BtmPZ8dT.js"},{"revision":"f0397b47cfc17598a3bc2d2f95fba325","url":"build/js/AddMembership-DmsdHBQF.js"},{"revision":"42a2bcd9bf0f457578a07bbbc68d4aef","url":"build/js/AddPost-DpVpnA3X.js"},{"revision":"33fe7958eeb9da428e6b70501708544a","url":"build/js/AddressForm-Bf-tzufI.js"},{"revision":"7ef9e4ad5029bdbd88cb74ae18891cbb","url":"build/js/AddRyeProduct-PnjFS2xH.js"},{"revision":"7f5ba1a6df85ebf74475fdb69b0b1f74","url":"build/js/AddShop-CsXAMwQg.js"},{"revision":"d771be8ef9d1f40a55f78aef07eb063d","url":"build/js/Alerts-CPYykNiW.js"},{"revision":"a2529e0e153c96ab62c5e1492b72f0e7","url":"build/js/AllCountries-C6-Izqps.js"},{"revision":"6d989135c8e7396792ca4be7da5abbf5","url":"build/js/AllWishes-ClH06zLf.js"},{"revision":"4d424941982e9377f008de0ddfc631bc","url":"build/js/app-5rvSBXyv.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"24e46b834a58adf380fd8a176f3a6b97","url":"build/js/AuthenticatedLayout-n9-nCkRY.js"},{"revision":"f1dbad9af21b841242019de6a4421049","url":"build/js/Avatar-BmwVjmvl.js"},{"revision":"3ee45a94fb535b3dc647687526225f51","url":"build/js/Bill-CmAPgars.js"},{"revision":"1a405391d9ffa6d7d324df37f51cfbe8","url":"build/js/BillCheckout-xu4oA_QB.js"},{"revision":"2c911aa9135682139cc36848ede01f01","url":"build/js/Billslist-CFeyhRcT.js"},{"revision":"7a9b5566f0d0747db16ba22c7aa55be2","url":"build/js/BillsTracker-C4UoZPUY.js"},{"revision":"bc6ce84f57fa1d160be8e0e361facd5b","url":"build/js/Board-CQFGYgH2.js"},{"revision":"d1256b7aa92c96f0119f6a6a6ae608ba","url":"build/js/BuyShopItem-NnnG1Nzs.js"},{"revision":"733084d47d44a194433b3216d1bc7b33","url":"build/js/Cart-DFkNSWmU.js"},{"revision":"4b12c9d43f659bebed66e79d5bc38fdd","url":"build/js/CartItem-CDKNDkOr.js"},{"revision":"a8f489aa7829f65d38da0bdf4b03cb5d","url":"build/js/CartItems-DDkaayg7.js"},{"revision":"f80116b559b66cec18d3fbda33876a31","url":"build/js/CartListing-DQDBs9vu.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"eda42cf8a872adc89366c7a763da6248","url":"build/js/CategoryLeaders-D3VorpPL.js"},{"revision":"c9292209d629966832e10279efe851f6","url":"build/js/ChangeCurrency-BWw3o6jZ.js"},{"revision":"24ce1b71603b5ea1844abee571f406df","url":"build/js/ChangeVat-C8VWWTij.js"},{"revision":"da8433d6b9887e134b4290d70e9e47db","url":"build/js/ChartDashboard-0gvEOCPQ.js"},{"revision":"f5f96477958f1654404d2c2a6386e388","url":"build/js/ComingNext-pELt1L2-.js"},{"revision":"2224bae58f1974cc57064922d3f439e3","url":"build/js/Comment-pZCOK_B3.js"},{"revision":"7bf6a555ae5483c57ea220b6ce57ec27","url":"build/js/CommetsLists-BrX-2Dpc.js"},{"revision":"fb1e18089d4f3b082c2f110cf92342bc","url":"build/js/ConfirmPassword-Btr2aUyu.js"},{"revision":"2e7edad2b4af0ab65b4212dfebd70d0e","url":"build/js/Countries-DJJEkPcQ.js"},{"revision":"7ccf0e303f20c8009f60f1a036d667da","url":"build/js/CountriesShipping-BIVQzUtV.js"},{"revision":"ff6e2bdae172a5df7253ef1f9be5e02b","url":"build/js/CreatorActivityWidget-CoRgCaBw.js"},{"revision":"5d15c2489bd3fbc022601fc03bf48609","url":"build/js/CreatorSubscriptionWidget-BD0UcETW.js"},{"revision":"73f163dc0db45dabe51f6a35f1baf8b2","url":"build/js/CreatorVerification-CLWyg0eX.js"},{"revision":"afb893527d3a6d7618b57a205269057e","url":"build/js/CreatorVerificationNew-BHlPesX1.js"},{"revision":"8a73551554666710c2d58f91c5b0093d","url":"build/js/Dashboard-Ck5vf4hf.js"},{"revision":"bd21bbb76c3b9c0d748e65510a08082d","url":"build/js/Dashboard-DSV2bOP5.js"},{"revision":"4a6ee177cc3039dc1c79f1f522319754","url":"build/js/DeleteStripeAccount-CikJhzHt.js"},{"revision":"4e851fd1640c753cddcd744ed90828e5","url":"build/js/DeleteUserForm-dmEkZhtW.js"},{"revision":"d9a0840c3f7d402c6add8a670db7786e","url":"build/js/DiagnosticPage-DfdfLFMv.js"},{"revision":"ba9fb7838ab060dfcef6d8770c0fab31","url":"build/js/Discover-BFBu_qAC.js"},{"revision":"8ae72476184feaefdaf3aae8e8077020","url":"build/js/Earnings-B7HKM1z3.js"},{"revision":"838cb4ea4c47861bb35155263cb0a2de","url":"build/js/Edit-CzZAOz-o.js"},{"revision":"9b38edbdeb3c44f42d1bedf8992d9e19","url":"build/js/EditCategories-GVA9IHXx.js"},{"revision":"88df28a6a6c1b30a68a1590991d333bc","url":"build/js/EditMembership-MmhDsFdf.js"},{"revision":"9aafc30474450fed08744e84db38daec","url":"build/js/EditProfile-zkmxbvIZ.js"},{"revision":"e73c7cdc08e8be4313f78d6f94965462","url":"build/js/EnableCardCapabilities-Bbsa1B8x.js"},{"revision":"91232b734421cdd98fd3b357949218e4","url":"build/js/EnterOTP-DKFFcs5C.js"},{"revision":"59302c865fe43b931643353a013087e9","url":"build/js/ErrorPage-Co1ana-h.js"},{"revision":"5200a52256c6a69557bb58f031213984","url":"build/js/FAQ-C7FqomKp.js"},{"revision":"0e3e178443e7fe07f9705c782c745f6d","url":"build/js/FeedList-BooqGtpN.js"},{"revision":"477c21ea6d7339695c2fda7c2c4f7869","url":"build/js/floating-ui.dom-xUSAFQUa.js"},{"revision":"fe2ff12fc20904e37131ff328a5202db","url":"build/js/FollowButton-CwG7XswU.js"},{"revision":"7185099a33e9759c7337798d5ef0e194","url":"build/js/Footer-mvpFv0nF.js"},{"revision":"b49168fc0134e12d404a6d90a0867908","url":"build/js/ForCreators-P_U4pvmU.js"},{"revision":"21c99ee48df9fdb48019129adeebfd66","url":"build/js/ForgotPassword-VvnSkERe.js"},{"revision":"ee462983dad0a4c5af25478da4be3367","url":"build/js/FunPart-DjPKz-y-.js"},{"revision":"306a65356f9f70027f3bf1dbbb941a4e","url":"build/js/GetCart-ghL85owH.js"},{"revision":"22e8a6ad1e58aa0c3c030c8011e5be03","url":"build/js/GiftAddCart-BfodLyG2.js"},{"revision":"2bd7dc519f18d162957a7381a82f8049","url":"build/js/GiftEdit-CgiHmsFt.js"},{"revision":"86b2b6f698e96b5285250772391130df","url":"build/js/Gifter-ab6FFU1U.js"},{"revision":"db10aa7a3dfec91d0f89693a2f4112f8","url":"build/js/GifterCardVerification-DYOiXLFg.js"},{"revision":"3f705a613d49479f972d471625935e58","url":"build/js/GifterFeed-gT2xu123.js"},{"revision":"1313bdc6cd56d4929aa4a61bb1c524f1","url":"build/js/GifterItems-CGoGb92i.js"},{"revision":"23c39698016d8802966697160a032253","url":"build/js/GifterMedia-BiIo77e8.js"},{"revision":"d285638d19fa65ea2be0614345b16aee","url":"build/js/GifterMembership-jcepRB1F.js"},{"revision":"e7ca4e5ea53c1f197ccca60b3798af55","url":"build/js/GifterSubscriptions-wb8PqbMU.js"},{"revision":"078795a01c9cfd90a68253a95c2e4532","url":"build/js/GifterTips-B7EPEm5y.js"},{"revision":"d511b79b47dc7f2e7bcfe7ecc93a9678","url":"build/js/GiftListing-BBgUR8tf.js"},{"revision":"e90102cf13dcaba95b02ca12a66ce8e5","url":"build/js/GiftStore-DoTfw5y-.js"},{"revision":"a55a4837be2470603818d5a13a8124b9","url":"build/js/GlobalCheckout-Cafx-NdM.js"},{"revision":"355ac0af30e17cc3c19a225a916bae96","url":"build/js/GrowthTrends-DJD01k2i.js"},{"revision":"a14c4dc61ddb07c89dee57d40494502c","url":"build/js/GuestLayout-BUMn-fNH.js"},{"revision":"a831bdfb72284a4d29e522534d2ef9b2","url":"build/js/HappyCreators-1_WQXTUQ.js"},{"revision":"c65068b322abd4bb60fff13d040b725c","url":"build/js/Header-DuWMpAO6.js"},{"revision":"62038165ef1a1ebbedd9ae852ab7612d","url":"build/js/Hero-BDjWGDL7.js"},{"revision":"6fec44377ef477768457ea08bbca9388","url":"build/js/iconBase-BvmsTYjD.js"},{"revision":"3ea017b2afe1fb25b88125188680573a","url":"build/js/Icons-N3XiwxHv.js"},{"revision":"475981a307c87ea099b33da829b76981","url":"build/js/ImageGenerationWithAI-Cpn9Hw7u.js"},{"revision":"e4dc8ec0abba072bf03534088259f017","url":"build/js/Index-B-5Zngfa.js"},{"revision":"36e0f2dccebf3729d0c34c365f4fc601","url":"build/js/index-Bj2GU4c3.js"},{"revision":"0bdca0d539ce2bb2e5501ed2424314a3","url":"build/js/index-BjRusztq.js"},{"revision":"3ef423a090a54ad9ebed237a41c39765","url":"build/js/index-BKXlgPPd.js"},{"revision":"335dfa73a6427533de9c7a51911c47fd","url":"build/js/index-C2UTxeHl.js"},{"revision":"70dc299e73aa8f6f0736a6d75ac08462","url":"build/js/index-C3dkOucR.js"},{"revision":"226ac148f3903870da70fbb233ea4e8a","url":"build/js/index-CpFLlz2_.js"},{"revision":"f78cd2071db38ba8548e2887c52f7dd6","url":"build/js/index-D5wgsS5r.js"},{"revision":"6d8cb074743c2b8b0d8d5a5d1a01d0e3","url":"build/js/index-DCAcFBFb.js"},{"revision":"f42372062044fd0a52b888d8e3f6d268","url":"build/js/index-Dg2OZS3v.js"},{"revision":"e9f21ec9792daa0ac38182166e8faf08","url":"build/js/index-Dgg5gIEf.js"},{"revision":"6d0a77e82c01d11af982077d9a36119f","url":"build/js/index-DZ9X0ro-.js"},{"revision":"15d69ed22c9bb55dc08cc706141a9c30","url":"build/js/index-Fdr41EKu.js"},{"revision":"9796456a84059ab336756d3d97f5a0e1","url":"build/js/index-gNHp4DWB.js"},{"revision":"5d4df3f1f65aac70a4f10923dfb0ecf0","url":"build/js/index-PoueTEsr.js"},{"revision":"0b6bfb2f635b0b7e87c52e63b7a1f2a1","url":"build/js/index-SnksQg9e.js"},{"revision":"ac41d0fcd0641c893cffd3400d9b02cd","url":"build/js/InputError-gSCTYw_w.js"},{"revision":"5244ba70580a62a8f0670c2be0a84954","url":"build/js/InputLabel-ulx-5R6u.js"},{"revision":"5ee40271306c1242ef80ba9ec6b6a698","url":"build/js/IntrosVideos-BS3SLO9I.js"},{"revision":"b96c35096c83e3e666094555c9361e26","url":"build/js/Item-D0lVwWao.js"},{"revision":"95651c5c06dd674db6c272731112f560","url":"build/js/JoinUs-BeIaReOf.js"},{"revision":"3ab492aeb8b8e103b7fb630887e8d27f","url":"build/js/LeaderboardStars-Bv9GV1VO.js"},{"revision":"541a9b383e4b0f48d80999befc85cc1c","url":"build/js/LineChart-DXfYAgPp.js"},{"revision":"98fe2cdea536fbafa5921f18d821d4e5","url":"build/js/LinkTwitter-Dwy1wDgt.js"},{"revision":"e7bd980dd0b7412281fe417462cc0cb0","url":"build/js/Lists-BmrOhYSI.js"},{"revision":"ce76f8de626d8c188aac29a00ae19dbf","url":"build/js/LiveBar-BlEqszL6.js"},{"revision":"50f712c71bb32c9447607282cea8f00f","url":"build/js/LiveBarSection-CWhniUmo.js"},{"revision":"1f7c0ec87f94e4a343339d5648ee68b5","url":"build/js/LoaderButton-Br_aAHTM.js"},{"revision":"9b15612fbc91d0a2758e832c30a5df26","url":"build/js/LoadingScreen-D4qaHWcq.js"},{"revision":"df882493f0ea3323f20cdec8b728c525","url":"build/js/Login-B5SaHAvZ.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"0a98cf2e548a59f57427d433376242b2","url":"build/js/MagicBellNotification-CwmseRyD.js"},{"revision":"3be8cb416a322b953b70a23a1b87e8e2","url":"build/js/MagicBellNotificationDisabled-Be3WHbaN.js"},{"revision":"b30e2fd30beaf1e5f1bf3c7e96d80625","url":"build/js/MemberCheckout-CZRd7zDO.js"},{"revision":"fee7789b8dd1d5c8f92b1fdafd535f6a","url":"build/js/Membership_dashboard-C5WtbKzY.js"},{"revision":"7170f389ea5874a9e2e455bcdf95f1e0","url":"build/js/Membership-B4S5JJxw.js"},{"revision":"5fbcfa764adc3cc7422bb97d2e14aa51","url":"build/js/Membership-C2XCJT0e.js"},{"revision":"85d7c596ff0fcbd4723f0c837c0284b5","url":"build/js/MembershipLists-C9LjW2df.js"},{"revision":"5c807bf55bd6dacb7a65ed9a6d246da7","url":"build/js/MembershipsLists-tWPlp0HH.js"},{"revision":"44061cc463fb335fa89da8176c39c5cb","url":"build/js/MembershipTracker-BtiCKb47.js"},{"revision":"c87c1760ca227f7f2bcc335537397302","url":"build/js/MonthlyRevenue-DMYJiT4I.js"},{"revision":"cedae8170bc182f5b92f98c637e31006","url":"build/js/MyGoal-yB4Sf5J7.js"},{"revision":"c52ea2a0ccbcfd742cd31e6f56ea1f0b","url":"build/js/MyShopProducts-DqKOMNqZ.js"},{"revision":"5c699806153368a72633e649ad740a92","url":"build/js/navigation-_cQxs4zS.js"},{"revision":"5b2232465aa80adbbc3f93844b1d9b3c","url":"build/js/Nocontent-DjcaPmHB.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"0838ce77d32f1579f849a5f3470cfcdc","url":"build/js/NotForBusiness-DfTZ1csy.js"},{"revision":"f3cf30367a3f916ec9c105396caadfd9","url":"build/js/NotFound-BEU17Zx9.js"},{"revision":"b31d85311925279ec3de17b1861a021b","url":"build/js/OldSubscribe-CGQx0Cwk.js"},{"revision":"cb7e23332b3df28acdff894d8c985fcc","url":"build/js/OrderDetail-DCuWvHwO.js"},{"revision":"90437c0c434d3518624850a0c14f6a76","url":"build/js/OrdersLists-BogIsTD0.js"},{"revision":"b8b6879f8e668d2b32fc8974c42dfd84","url":"build/js/pagination-ikz7FnjK.js"},{"revision":"0957573d6c97ef2bf52da0a4cee90173","url":"build/js/PaymentDashboard-P4e_J_Mv.js"},{"revision":"c949258b75d1138f45d9c6517a34cc5e","url":"build/js/PaymentSlider-2MH-aKgt.js"},{"revision":"09193adbf041a4275c02d538d22065f0","url":"build/js/PlatformAnalytics-D4pF1RzZ.js"},{"revision":"e408e7b0fd39047ff904a85887bff082","url":"build/js/Popup-oMOJOeXL.js"},{"revision":"969dfaca28548cd6d1996ab340ceb9ee","url":"build/js/Post-3dA9Xa_2.js"},{"revision":"02b7b90a10b6689ef1dd3b3c9dd09b34","url":"build/js/PostLike-CXKMn6bD.js"},{"revision":"e52edce4747fdfe8913628545861c974","url":"build/js/PriceFormat-eRMbV8nt.js"},{"revision":"ad41a990125f66a11d7cfb856d4b03c8","url":"build/js/PrimaryButton-BSc6AUW7.js"},{"revision":"4e1dfe3b119d2c7b1ae54ff576f32daa","url":"build/js/ProfileProduct-CM4KoAAd.js"},{"revision":"ac44405a91a3d55711262e991078d760","url":"build/js/ProfileProduct-GdrXRIWq.js"},{"revision":"a992e4dc469ea5f1c7b0f2b0ef232488","url":"build/js/ProfileProductLists-3sFmzB8J.js"},{"revision":"cef39318fb25627a55807c0c42c9c767","url":"build/js/ProfileProductLists-D5G-4r10.js"},{"revision":"5b31fc6714972b5478d762bf4d7599da","url":"build/js/ProfileSteps-7VtAzDEU.js"},{"revision":"27659d419ed68c5bceaa7e84c0d188ac","url":"build/js/Promotions-C8M1VuWy.js"},{"revision":"32279ca240554e61fff2dfacfc53d3e8","url":"build/js/PwaInstallPrompt-Xt6bsqpJ.js"},{"revision":"8736123f389afc935c4347673da65ee1","url":"build/js/PwaTest-CBz6JL4l.js"},{"revision":"98e953c60f20f080fbea0a42e4c03135","url":"build/js/react-select.esm-Bumd8R6o.js"},{"revision":"fca334551971573cd36eb34b1e66b4ed","url":"build/js/RecentSupporters-BbWigBEx.js"},{"revision":"41fd7393755b817e84a43e015186c4ce","url":"build/js/Redirecting-DkN6Ace4.js"},{"revision":"4337dde2bd0846a6b4ad90b538ac9ed1","url":"build/js/Register-DtfeeRPs.js"},{"revision":"e0d3728bdac3a9d66669adc7bab9421d","url":"build/js/RemoveBill-BBGZvanC.js"},{"revision":"48e5b8497517f3b0b63a3b1f736c9e63","url":"build/js/RemoveMembership-BriYLLDf.js"},{"revision":"171741ddebeac28500d472b542bc9ea5","url":"build/js/RemovePost-BI_i5IzF.js"},{"revision":"ba537c7461c0f7a097e6f558828f4e29","url":"build/js/ResetPassword-BFBelE4F.js"},{"revision":"eeb261c870fce9960c9acc4bfb111abe","url":"build/js/SafeTransition-2TPeeoRF.js"},{"revision":"cd20eab65a32b83a4407d9be1a6aa7c1","url":"build/js/SayThanks-3RkNA-fz.js"},{"revision":"bd8d79700c5adbcf5a56dcd8cf9b3908","url":"build/js/SecondaryButton-JdosUYii.js"},{"revision":"fae4033ecb7e087f93a2558a584ad40d","url":"build/js/SendTip-C7mnmzsq.js"},{"revision":"77727fc31c829910ecc9a8e4ec0dd22d","url":"build/js/ShareProfile-BiuPyS7u.js"},{"revision":"f69f77981662de712336940261b2a669","url":"build/js/ShopPage-D3OQp2Dc.js"},{"revision":"7d0540aaff43e4c76f76b664b9644faf","url":"build/js/ShopTracker-DL7tIcsp.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"d3ba45a8df9a3505b92de565cd82b470","url":"build/js/SiteSubscription-UmhUyE-3.js"},{"revision":"e4d14daffefec3e9e487c5c85cae2a8b","url":"build/js/Social-BWQz9mwW.js"},{"revision":"0a728e0a34d878bd5b31439ec340f943","url":"build/js/SocialLinks-CA2k-o_i.js"},{"revision":"8714cd25c2700061afa7185499d1ba12","url":"build/js/sortable.esm-BP6-0I36.js"},{"revision":"c7096f9cd8968910b77f308e789f27df","url":"build/js/Stripe-DgVZkdbL.js"},{"revision":"31000bfd10a6b5e6bdfe2da2ad6f7965","url":"build/js/StripeIdentity-BNf0AQyv.js"},{"revision":"423ab07a0bf2ecadb48e36459bd511bb","url":"build/js/SubCheckout-Cj5KRlyT.js"},{"revision":"bc4bb53a83b6861f04b4a474d48878ae","url":"build/js/SubcriptionEarnings-CoI4ugtD.js"},{"revision":"3887a2524a389e59c801fb714c21efb9","url":"build/js/Suspanded-CX-1Oh02.js"},{"revision":"6088d43dc5cf5ae4300056f6e33e7088","url":"build/js/swiper-react-Dch4ncnG.js"},{"revision":"356cda18df9f66eeaa6c5eac589306b3","url":"build/js/TabbedDashboard-NGd4ZYNv.js"},{"revision":"a0e726df1f6a79f04462172299f1e729","url":"build/js/Terms-Bu1WHBju.js"},{"revision":"60cd2ad8fd19ce216e3c8f67cec1c236","url":"build/js/Test-Bddt2Zd_.js"},{"revision":"842ad156c9da8f5c4b3c555ad16c6e04","url":"build/js/TextInput-CtXd9doy.js"},{"revision":"e977b1954ae03bfd6535cb436298598f","url":"build/js/TFA-Csy5TZz2.js"},{"revision":"7337999cf80f4b146307e4f8a59d46f5","url":"build/js/Thankyou-CRUr_kNR.js"},{"revision":"74cb7098f16cad0d5065f011739a47bb","url":"build/js/ThankyouMessages-CvD4yiKz.js"},{"revision":"435bdd5d288e20b1475af501f3f76e70","url":"build/js/ThankYouRye-Bw1XTKRp.js"},{"revision":"d798b6a6b65a354a11d5816ef6539236","url":"build/js/TimeFormat-BI-rPKji.js"},{"revision":"33fb5dbaed5f1b0a586daaaef8baaa94","url":"build/js/TipInner-DmvBm1OK.js"},{"revision":"2bf6f6b16277ec54ea742eb1c0798baa","url":"build/js/Tiplisting-skeBYUH6.js"},{"revision":"059146d8828d8a7c71bfb8de17ee7a92","url":"build/js/TipTracker-BG0tcakF.js"},{"revision":"016b92a1c0c7858f6513e4bbd11e4fd0","url":"build/js/TopEarnBills-DeVeUund.js"},{"revision":"c9e28a6b0dfa74218524e8622d4211b3","url":"build/js/TopEarnWishes-BNPXz8A7.js"},{"revision":"49d788e30103cc11f7816b2f7f1952cb","url":"build/js/TopSupporters-CxTevI_l.js"},{"revision":"d61bdc326d4c71b26d96dce53386589c","url":"build/js/TopSupporters-SqPvgXUS.js"},{"revision":"4959860dcd7209dd2d20e34cbf20926d","url":"build/js/TrustBox-DZFRBuHf.js"},{"revision":"a34da67055fcdbb845c846ae435d81c2","url":"build/js/TweetNow-CqrFj91c.js"},{"revision":"bfbf2a5398b3cbfed07be335f4f9d470","url":"build/js/UpdateAvatar-D8kzQPo4.js"},{"revision":"637b032ea7f442b460c32fe29fe94456","url":"build/js/UpdatePasswordForm-C2VsqPiN.js"},{"revision":"7eefa125030e509a914ec192e633e93d","url":"build/js/UpdateProfileInformationForm-zmvPk9Ko.js"},{"revision":"535606584eb4b55dd56102a58116ccaf","url":"build/js/UpgradeStripeAccount-DUtPE7Ih.js"},{"revision":"08d1be330339af0868af238042137c15","url":"build/js/UploadcareEditor-DNeUZry3.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"3be2d65fd92755883dfc4fecaeadadeb","url":"build/js/uploader.module-Bh6iHw12.js"},{"revision":"1b6a7d215178497f67f3874fd6fbdc89","url":"build/js/useDispatch-DcFfaYF1.js"},{"revision":"bdb439433a1568077cc834608aa99728","url":"build/js/UserCarts-CV4w1tNt.js"},{"revision":"bc5fc7d61b3790ff7c64749abf81a086","url":"build/js/Userprofile-CM_9Br6U.js"},{"revision":"b7ccd765f3185b35006690b7fb843f71","url":"build/js/USTERMS-CJ9IP4It.js"},{"revision":"b401fc6075b1da11498e05da16fd47d6","url":"build/js/vendor-inertia-DHQnDr5D.js"},{"revision":"48dae2e067e97bcaa7beab0218084d02","url":"build/js/vendor-other-DHgfFRXT.js"},{"revision":"1c75567daefd4838c36c35d538bc067a","url":"build/js/vendor-react-CpZKQgay.js"},{"revision":"a6747449b2632f96b0e6b6bee56006b7","url":"build/js/VerifyEmail-2AKELCTh.js"},{"revision":"a9ab519e678392e8463702748558852e","url":"build/js/VersionUpdate-BGaveO4o.js"},{"revision":"51d8ea9a388fe840a199154a87207747","url":"build/js/VipSupporters-gzH810fg.js"},{"revision":"f971ebf72457841b2bfd3cee22351599","url":"build/js/Welcome-BsOLtvdd.js"},{"revision":"02e5f437a90860027d08c1dce49f1503","url":"build/js/WhyLove--srcksQ_.js"},{"revision":"f90f89c82e132e5e965f65c99e3fe25c","url":"build/js/Wishlist-B0UMGi4f.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"c3dd9310bac616870d0a69fe5e1d2fb9","url":"build/js/Wishlistbox-BHqQxRlg.js"},{"revision":"d1ddf5ec8ff50fdad859f5786a64c34d","url":"build/js/WishlistGrid-CnPKROw6.js"},{"revision":"4750f82211f49a68e292117dfc5a91d1","url":"build/js/Wishtracker-CWxpr3pg.js"},{"revision":"4c43dde8af0aa2e1637c5e6490c3cf75","url":"build/js/Works-BnGRf97c.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
