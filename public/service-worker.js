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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"89512bba110aa707e017aa69000e6f9f","url":"build/css/app-DU4OGKj5.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"a1e5cd6dea317520b1c7a36a5136b34c","url":"build/js/404-BljRku-0.js"},{"revision":"39e63a0537ecae6dfed29468915e0964","url":"build/js/Accountsetting-CbcjPhvW.js"},{"revision":"e112dce7fc4d8b075f1297642c4f5133","url":"build/js/AchievementSystem-DctHTHiT.js"},{"revision":"5a9918cda5638f5f264107b20b7bb967","url":"build/js/ActionRequired-DZIUxD7Q.js"},{"revision":"b06bb9018622d990ead1971e47342d1b","url":"build/js/ActivateCard-CaU4QXbz.js"},{"revision":"44133e7c00111e13fb6438743963872e","url":"build/js/ActivateSubscription-D-R_dSlP.js"},{"revision":"477e196c1538bbb72295c68f8575a416","url":"build/js/ActivityStatus-Dnx6WIrk.js"},{"revision":"5e40691ccb76e8a89286b93018546392","url":"build/js/AddBills-CXTYao84.js"},{"revision":"298fb7f0019e003040645813f3579f2b","url":"build/js/AddCart-2eB72lCB.js"},{"revision":"9e55a0776b1e7ace23ed4f0b997d7101","url":"build/js/AddComment-B2v_5IIO.js"},{"revision":"9a509cfb35b23dbb8b9328f437bad065","url":"build/js/AddGift-SEcs6mEG.js"},{"revision":"e0f440a9c4724559d1f1e44203ac8f94","url":"build/js/AddGoal-p8j-Tf7C.js"},{"revision":"ccc81149bad94bc58eede09a1863bd9d","url":"build/js/AddIntro-B_8oESK-.js"},{"revision":"2ffb1088de0aadb7ad9e17d4f9f11c1e","url":"build/js/AddItem-6xO3xWYP.js"},{"revision":"920c560b99eedfe8337b6cc5303777c3","url":"build/js/AddMembership-D2ocxQKw.js"},{"revision":"11965d34209f50f3d62dea27286279bb","url":"build/js/AddPost-DzFgtPZk.js"},{"revision":"a54a3a0034946e98303daed3ef8c6fc8","url":"build/js/AddressForm-DiuMRc__.js"},{"revision":"032bba5db908f984324ee30ef5ace000","url":"build/js/AddRyeProduct-CYH7fXIr.js"},{"revision":"f2a1316009b0122ed2075fa85d90cee4","url":"build/js/AddShop-DpObLjQk.js"},{"revision":"c4948d3f4f0cc8fadc32b5cb0b053dab","url":"build/js/Alerts-Byzsg8dC.js"},{"revision":"ce8e698b602c097e481c1cb72afbdaab","url":"build/js/AllCountries-3G3vlRdP.js"},{"revision":"f122e53df3d524b2bda2c71365972fe7","url":"build/js/AllWishes-qFfFbgTw.js"},{"revision":"1ce29def65435eed63db088eb40b36b3","url":"build/js/app-CLfL_j_c.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"b33ac91c46f251688e6e6977c69a38ca","url":"build/js/AuthenticatedLayout-Px1Lm-xu.js"},{"revision":"c0c0d296638dfe2d5f9f3dba1ee7c9e5","url":"build/js/Avatar-_gc7IVKn.js"},{"revision":"b72cae69a9e48e917422ce80930034f3","url":"build/js/Bill-DyHVrELW.js"},{"revision":"df8774faaefe39915bff2d969914aa40","url":"build/js/BillCheckout-DfGXxiA_.js"},{"revision":"312e0b93efce3329009284d97a07e17a","url":"build/js/Billslist-Br5Bx9nR.js"},{"revision":"d84b010a5c16274fb30d66c1c3e73113","url":"build/js/BillsTracker-DkGW8SyL.js"},{"revision":"e67d93763ccde36287da8bf954add19b","url":"build/js/Board-CNJwJmhd.js"},{"revision":"7d6ed023aa3540eefb20aba25292cf52","url":"build/js/BuyShopItem-Z7JDA7dr.js"},{"revision":"d9950658e8006000349882a4b7424c82","url":"build/js/Cart-0rNDhM39.js"},{"revision":"20098b141bfbe6fa94727ee50fba34c8","url":"build/js/CartItem-iyReeOC2.js"},{"revision":"23540e496117ea0866d4c4b146eba5cf","url":"build/js/CartItems-DqQcSoxF.js"},{"revision":"33957747c2da5b138c0cd6be8b07d22d","url":"build/js/CartListing-DMVc3YCC.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"5e28320b17ce14152608f89c5d6f9beb","url":"build/js/CategoryLeaders-B30wgdgX.js"},{"revision":"f6978aa3e63e10192873d5b4d6b42193","url":"build/js/ChangeCurrency--6T57TU_.js"},{"revision":"cc368aa090459c0ce8a1d066efd46c3b","url":"build/js/ChangeVat-B5zzoewc.js"},{"revision":"5f884069967e84a2a4078789a49a2cd5","url":"build/js/ChartDashboard-zJaYwxTU.js"},{"revision":"4f476e563262139839c29e5b5e4433f9","url":"build/js/ComingNext-C4ortPvq.js"},{"revision":"778f152c9da1a9c200ade496ab3e1438","url":"build/js/Comment-iIZrxZRH.js"},{"revision":"319836f20c156ff9e9213528609933fa","url":"build/js/CommetsLists-BCnYcy0D.js"},{"revision":"51f015f6d43fb319455df8b676c65795","url":"build/js/ConfirmPassword-B-K6beTd.js"},{"revision":"a3c3570bfd73763b4b03e01df8cce1f3","url":"build/js/Countries-Bm2Fa5yA.js"},{"revision":"d06bb4d154f899b2de799c3253768633","url":"build/js/CountriesShipping-BNsviqEr.js"},{"revision":"bbad872931c89ba65a418fd7deadfd12","url":"build/js/CreatorActivityWidget-Dx2wDRbS.js"},{"revision":"78abc29b6a763355554bab10c575f832","url":"build/js/CreatorSubscriptionWidget-DJTepxO4.js"},{"revision":"80607eacd6344f53f3969fb1f1cc0aa1","url":"build/js/CreatorVerification-C5rZKr-4.js"},{"revision":"c374a36e0e63abf9dcf0949fbf93ba4d","url":"build/js/CreatorVerificationNew-sItv0yF_.js"},{"revision":"86de5d548f40bb812c40f58975c58ac8","url":"build/js/Dashboard-C9ngDZGA.js"},{"revision":"28a41cede8e62804070b0507bf70f914","url":"build/js/Dashboard-CtCp_IOH.js"},{"revision":"4a358be31cd488fa65282f2c70ec722b","url":"build/js/DeleteStripeAccount-DugD-_ah.js"},{"revision":"637efacecd417af99f79151fc63003c1","url":"build/js/DeleteUserForm-DltwtrNn.js"},{"revision":"359201861152c88816928835b41a153d","url":"build/js/DiagnosticPage-C9IkwuQb.js"},{"revision":"c5bae9b86ee2357f32dece42f5d2074d","url":"build/js/Discover-CrpNRnGd.js"},{"revision":"6e7e8dc132cfeb44edff9ef0659656a7","url":"build/js/Earnings-Bg7CYL1Z.js"},{"revision":"308bdb0eb774bb8f1ab54953fc0a6a52","url":"build/js/Edit-BXhUIqLG.js"},{"revision":"427905edfcdda619fbd0ccf3e6a1583e","url":"build/js/EditCategories-8s9FJDEQ.js"},{"revision":"7ae1a66b368ca9bf44ab4e05df8009d2","url":"build/js/EditMembership-TZR4D1eo.js"},{"revision":"0f9a7fce75481dee7ba2e8684fc995e9","url":"build/js/EditProfile-CNXY4ofr.js"},{"revision":"126c2bd9eca7f403f74863eb4ebbd2d7","url":"build/js/EnableCardCapabilities-Bj9PhxAs.js"},{"revision":"1ef4e08462bc9daee84c9b4de8a05226","url":"build/js/EnterOTP-CftYt1f7.js"},{"revision":"a4e61b4ef8a9378e725c7aaabd0443f8","url":"build/js/ErrorPage-BzZTCP0l.js"},{"revision":"0385668eb8239c33efab54f7db4aad75","url":"build/js/FAQ-DFbqx7cZ.js"},{"revision":"a7e23c248bb8684de6efb92c5db55916","url":"build/js/FeedList-C73cge8O.js"},{"revision":"9b231c63d1d20cde31671ae07e046e03","url":"build/js/FlashMessenger-BumfuACM.js"},{"revision":"4d6c14460fd7987766f4f3bfc322f00c","url":"build/js/floating-ui.dom-BMWbtHKS.js"},{"revision":"2f4e3bad0da59878d1d0c55e1d1c8db7","url":"build/js/FollowButton-nmZmFGdM.js"},{"revision":"d24035e5715cba6f0ab4fcfa3862e425","url":"build/js/Footer-DzAwngB4.js"},{"revision":"8912bc34d6dab734e85b300dcbca58a2","url":"build/js/ForCreators-jP8Ice_O.js"},{"revision":"c0b606daba9214605a5b3d87abf5907f","url":"build/js/ForgotPassword-61iWE_c1.js"},{"revision":"2301d5c5746e211a788b9ef51ac61422","url":"build/js/FounderBadge-BPi8ikmD.js"},{"revision":"332de3470782d4b0744d5f897432f7d3","url":"build/js/FounderProgramAnnouncement-Bb1ueyZD.js"},{"revision":"424f7cc5300c59215e4070ba3671374c","url":"build/js/FunPart-BaY9JIyR.js"},{"revision":"b12f3a70337e1ea8e075d8c87f2bbfdf","url":"build/js/GetCart-C2O-mthX.js"},{"revision":"2ff773fb235467a6915c3426892d3919","url":"build/js/GiftAddCart-BI-5ApVt.js"},{"revision":"f7adc9328c7c96af13e0d0b17b70b08e","url":"build/js/GiftEdit-CBEpklAO.js"},{"revision":"ee7e92dc980758bc388e1d076e518bce","url":"build/js/Gifter-JoG6VljG.js"},{"revision":"dcbba0787670ab7a8abad792bba322dc","url":"build/js/GifterCardVerification-g4GQIK4-.js"},{"revision":"24f7ff55920b197842a97e6cb6eaa718","url":"build/js/GifterFeed-Dw1tMECF.js"},{"revision":"2fc3eb9727f83b9eba589a65bd632f06","url":"build/js/GifterItems-CYskQc-J.js"},{"revision":"4e63126d55b535cc318553a71c0a6e46","url":"build/js/GifterMedia-DrbZ7lK3.js"},{"revision":"e0ba6e821076f32df15c748118d6dc35","url":"build/js/GifterMembership-BgOLTqzQ.js"},{"revision":"572f164de55c219b4e7f7306438c4093","url":"build/js/GifterSubscriptions-CfGAV89m.js"},{"revision":"82aa9378856c3e0a3cf149059fdc2936","url":"build/js/GifterTips-DJ1ciXb8.js"},{"revision":"6ebc90290e8be36c0a0174c7294cc991","url":"build/js/GiftListing-NpOvVy91.js"},{"revision":"026f165f9f61190a914875c80a33bfbe","url":"build/js/GiftStore-CNgrdGX1.js"},{"revision":"e24c003ff57f3cb7a1bfe56a446fefeb","url":"build/js/GlobalCheckout-GYZLZu_4.js"},{"revision":"f53eb511c4b0399bc0693363dc421025","url":"build/js/GrowthTrends-X5rpbBug.js"},{"revision":"1f90af1fc9ef3cb398e9dd469d61845d","url":"build/js/GuestLayout-C1XeoWMV.js"},{"revision":"d23ac2cf32a6de260412211fd73f4600","url":"build/js/HappyCreators-DhidXFsI.js"},{"revision":"d92ee02de3e519d92bb156151db1edc1","url":"build/js/Header-Dm3FJliy.js"},{"revision":"a8af1cacc5ec00e9663127d17a09e7af","url":"build/js/Hero-nVqQTqlZ.js"},{"revision":"8b8dd1daa4f32e51830b08d0d721f5fa","url":"build/js/iconBase-C55AXXUz.js"},{"revision":"746ae52e4bd8c6d7d1a39d3f1e5d32e0","url":"build/js/Icons-C3jeXv0B.js"},{"revision":"b72bfedc4a29dc39596d48d2470669c8","url":"build/js/ImageGenerationWithAI-CX_JRnpz.js"},{"revision":"44045b30639cb3360f7a97766d6134b3","url":"build/js/index-BIQDiR2Z.js"},{"revision":"56e411e44242c65a2174567326dfed28","url":"build/js/Index-BiXR4Zay.js"},{"revision":"ce25e22358d67d09644d4c4f962de8a6","url":"build/js/index-BMdifO9m.js"},{"revision":"87eff25c71de583aa414b67a75215503","url":"build/js/index-BPLMiJZz.js"},{"revision":"db67ea07c9eff6644c1efe0d4a3c8b79","url":"build/js/index-C6NWUJRU.js"},{"revision":"68e2d437d34ea720d3eff4f8c8748d8a","url":"build/js/index-CBBCh6Dx.js"},{"revision":"a0f9ac37018c6b69182e42a35378706d","url":"build/js/index-CFll-rmx.js"},{"revision":"1ce31f0eba8f232d12f8be43654952bd","url":"build/js/index-CKX_EDbm.js"},{"revision":"a7f6fb0f6400303a211967d91c1e7275","url":"build/js/index-CmYwFDRi.js"},{"revision":"13e4c1dea8847efb5e8e6ead8eb00b4b","url":"build/js/index-CNuscHM6.js"},{"revision":"71b50f0dce06759ccd0ba9d7f4c8ccad","url":"build/js/Index-CpObEcPU.js"},{"revision":"0a3ee31a0b09f736dde620dc08e11879","url":"build/js/index-CrFgx1O8.js"},{"revision":"b6c49e9b5f3ad1ad4e514ed679aae976","url":"build/js/index-CS3jsDP9.js"},{"revision":"168155e448b533c0ce7012159e86efb6","url":"build/js/index-CV4Op5wf.js"},{"revision":"1a18c942ac89a9ba02ede406726177d6","url":"build/js/Index-D3W4Gkt7.js"},{"revision":"97a64c831f3814cb4e6fe296f912624d","url":"build/js/index-D9CzH6kK.js"},{"revision":"dfc625e1b162161b718a9939fd0f086c","url":"build/js/index-DB6Hd-wf.js"},{"revision":"5c768a25602abb883140e9d843be55df","url":"build/js/index-DUaXxdp9.js"},{"revision":"9ff6791a1527e58b1a172393e62ac1f0","url":"build/js/index-DVzIkNJk.js"},{"revision":"331e87ad061b9bbd966812cf0df36aa2","url":"build/js/index-Sij5c1Lo.js"},{"revision":"20c549e153da047640ca8c3e93be8994","url":"build/js/InputError-BqoEbYu6.js"},{"revision":"26bb394fc6bfc2164cd9de92c11bc2ab","url":"build/js/InputLabel-LJaepSM5.js"},{"revision":"46700929355ac9a5fd8e68efc7076712","url":"build/js/IntrosVideos-3rbZRZpz.js"},{"revision":"fffef944976a2ecf88b6b891e753ca7a","url":"build/js/Item-DmrdFOgT.js"},{"revision":"fe79a03e9656fe2a2c8d0a5366f8d2c0","url":"build/js/JoinUs-C33TW-2O.js"},{"revision":"046b439ada9af27d2ce7ed5de3c7813a","url":"build/js/LeaderboardStars-CcoKHPhg.js"},{"revision":"d347f18facb81c080c609c6f6cad6330","url":"build/js/LineChart-CKfJWmBF.js"},{"revision":"ad132b83a231ade70dccd959294f81b8","url":"build/js/LinkTwitter-DLsuqOZY.js"},{"revision":"0ac324e9fddfb0ccf12acbe918335489","url":"build/js/Lists-CrdypiMO.js"},{"revision":"add32dc4229b7bfc01e85250e165e299","url":"build/js/LiveBar-CqQRTDKB.js"},{"revision":"4030a513393185fb621b170b82715a9f","url":"build/js/LiveBarSection-CYgdJNdV.js"},{"revision":"dad169ad656b5c74e278e920020f5bc8","url":"build/js/LoaderButton-XpQ0s2MT.js"},{"revision":"269b3dc7ccd304547059826605da0019","url":"build/js/LoadingScreen-Od9WUzLH.js"},{"revision":"1021de1ef790d6af9dbe9a48756d20cd","url":"build/js/Login-Cb28836i.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"ab256fe12fb558e6abe9630c1e74d75d","url":"build/js/MagicBellNotification-aXE9JSHf.js"},{"revision":"04cf09c4587b2716d60a7b0f00510a95","url":"build/js/MagicBellNotificationDisabled-BUsdK0e3.js"},{"revision":"f7d626118718651dc002a9021e6960d3","url":"build/js/MemberCheckout-DN8RwIpU.js"},{"revision":"4149cccde472875d881ce6dceb9d75b1","url":"build/js/Membership_dashboard-pUElTE2T.js"},{"revision":"df726c48925cc785bdf6fa6687b40649","url":"build/js/Membership-Ciz_FtTM.js"},{"revision":"a3636fc314bd874e7abe01295de7d160","url":"build/js/Membership-DDBQw9EZ.js"},{"revision":"bd9e68a1573cca5f8d1eadaa151f175c","url":"build/js/MembershipLists-KPcCeYIG.js"},{"revision":"069bbbfc3717bcc2a841d85ced292aba","url":"build/js/MembershipsLists-BWQHAdl6.js"},{"revision":"6a58663c07a7206ec21fef97772d16b6","url":"build/js/MembershipTracker-CLPtsQlK.js"},{"revision":"b9dd2fe5a43b8a12687ec2d59fcd63d3","url":"build/js/MonthlyRevenue-WxYQ_gCA.js"},{"revision":"80f10bd376310e5e751147021fa3cb37","url":"build/js/MyGoal-Cx6e2E47.js"},{"revision":"040564ec0c216f8ade62a90480413e97","url":"build/js/MyShopProducts-Ck4-V7yr.js"},{"revision":"e5624060dbc06e7a9fc86796db657e8d","url":"build/js/navigation-CoANCxAn.js"},{"revision":"418c03a2cede2c8342d58299d22f7583","url":"build/js/Nocontent-BUD3-Mxd.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"44b2d6269ca7a479889ed0906b8e060a","url":"build/js/NotForBusiness-DnYFX9q5.js"},{"revision":"cfe45132604fe4119fbbedc1087556c4","url":"build/js/NotFound-BXCkr3hx.js"},{"revision":"0fdcf7ae56d7cf0568a6d076a8dd3143","url":"build/js/OldSubscribe-B-9QgxRM.js"},{"revision":"829e787798e4462416072c37caee5913","url":"build/js/OrderDetail-CojvFdR7.js"},{"revision":"f58ec87f1bb2a3fd4f347a29e7f2a1ba","url":"build/js/OrdersLists-DV09YzCn.js"},{"revision":"91b2dbbf1acb118a5069d5c10abb7c77","url":"build/js/pagination-BG466BvZ.js"},{"revision":"34ee4a2e04ae5712d8174652837936ab","url":"build/js/PaymentDashboard-Bx1KrnEg.js"},{"revision":"a1a70063eafe8579e091f7e544b41f52","url":"build/js/PaymentSlider-DuxHFtWT.js"},{"revision":"a2a91eea4466dab1ebb947cc9680b587","url":"build/js/PlatformAnalytics-C7LjdWFO.js"},{"revision":"c5344dade21cfdfe282bbb3ea8cf4ebb","url":"build/js/Popup-B9lN1jIC.js"},{"revision":"ebd6c7331e93a33acd678670517c62ab","url":"build/js/Post-BCVMjvVB.js"},{"revision":"03df4760aff664c60416ed4ec4be5048","url":"build/js/PostLike-BDdMFNPY.js"},{"revision":"fc840b2e3771d82b8eb8df7174f8a463","url":"build/js/PriceFormat-CFLMflU0.js"},{"revision":"1f9e37867f6be4a3a7e423a4d12e7744","url":"build/js/PrimaryButton-DnhVcRkT.js"},{"revision":"38d6f6f093696b85d39386a8f785c89d","url":"build/js/ProfileProduct-Cg_PQml0.js"},{"revision":"34c383f63961c1adc1b4a44d805fa77a","url":"build/js/ProfileProduct-DYeUHCwS.js"},{"revision":"44c42860db1d9c07cb4704bdad1fcc48","url":"build/js/ProfileProductLists-BYluFwXr.js"},{"revision":"a544f77329e7480ab85f1034146c0335","url":"build/js/ProfileProductLists-C1W5PjwC.js"},{"revision":"e211ad2edfa953b33f48612edcd6ff0d","url":"build/js/ProfileSteps-B7DuPZYQ.js"},{"revision":"85a1dcf4c2d98292041fb1b551a46954","url":"build/js/Promotions-pAK3bsHq.js"},{"revision":"c093ec32d08aa353ae42c104e157d937","url":"build/js/PwaTest-BV5wFWPW.js"},{"revision":"5ac028317c04148a191e9024970b752b","url":"build/js/react-select.esm-B9olM9Ut.js"},{"revision":"8964e97fbbc48e8b4fd89932842b3b75","url":"build/js/RecentSupporters-_Naqp3Or.js"},{"revision":"f7553e3a26c7345e7c39a0a40db30dae","url":"build/js/Redirecting-CLZo59LA.js"},{"revision":"e65e1e942ec59b9d64b9fbe0cb4e25ba","url":"build/js/Register-SskAPZhY.js"},{"revision":"941be7f5941d2608c2ee351e4d32ec2e","url":"build/js/RemoveBill-DhC3F_Zj.js"},{"revision":"137cbb30e432e836b7a2a690bb387262","url":"build/js/RemoveMembership-DvZZ4JFs.js"},{"revision":"d3a813631e935b8da02226086f1c9e40","url":"build/js/RemovePost-D_CthxmP.js"},{"revision":"776b1a689dc1e7f77126eab9190fa72e","url":"build/js/ResetPassword-C7dm8yS_.js"},{"revision":"8d0fc9ed6952ce5b42e62719e4494ff7","url":"build/js/SafeTransition-Bef9tQ01.js"},{"revision":"c33b3a8a784e90df5817a1d598d45244","url":"build/js/SayThanks-99B1uZ3t.js"},{"revision":"67469a15a0447c36f7961cd3a493a845","url":"build/js/SecondaryButton-DCaWduii.js"},{"revision":"edc178aa64ab4a5ac31fdda430d579f8","url":"build/js/SendTip-Bjm5VvOH.js"},{"revision":"9133a84efd5f2f33a523059b27dd2bb0","url":"build/js/Settings-7-Q71OIH.js"},{"revision":"a154fa1ed4f3a6c3e4ccefc724ea99a7","url":"build/js/ShareProfile-DD3JUCGc.js"},{"revision":"3e46288ba99c822f8c098d9b62fe8b1d","url":"build/js/ShopPage-UM9nUsYU.js"},{"revision":"cae9d337c80b2aaf2cdf589721b7d595","url":"build/js/ShopTracker-BoSoLbTD.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"e61e9a9ea5e97384199df13efb0c7fd4","url":"build/js/SiteSubscription-CTALqkej.js"},{"revision":"1fd0cbf58e3f15b195cb9a8b8841dc15","url":"build/js/Social-Dmvn4Jig.js"},{"revision":"645b0e1f9b7c44ad58a067f164147235","url":"build/js/SocialLinks-CWWSOU2C.js"},{"revision":"f795aac3350b304dbbc5c6f121514407","url":"build/js/sortable.esm-E-KMb7im.js"},{"revision":"745d5771514f368526fd7f4b81e39e87","url":"build/js/Stripe-o0Qxs378.js"},{"revision":"5f6eabe6a05d32a7caaadf285fbc9227","url":"build/js/StripeIdentity-oeBmlLjs.js"},{"revision":"2dd666b16f789f2a36749ec5d4779148","url":"build/js/SubCheckout-BhiIQWkl.js"},{"revision":"bd730d27553d94aa81ad624dd33c35d7","url":"build/js/SubcriptionEarnings-CFOTrdVH.js"},{"revision":"4b479104f54b5a0e8dad5eb96a96d0fa","url":"build/js/Suspanded-DaxKJ0HP.js"},{"revision":"1e16f689bfd39aeb542c7db9eb2aed96","url":"build/js/swiper-react-DR9qINSe.js"},{"revision":"99a1fd1b35eb18685ba381864a1f6f31","url":"build/js/TabbedDashboard-DqUC9UsM.js"},{"revision":"474494a2112ebd053b48cf28641140ed","url":"build/js/Terms-DxQnLQay.js"},{"revision":"7d7e4e03072c23e5a2e17ff78950f29c","url":"build/js/Test-CzRlf8Wu.js"},{"revision":"562c663594b6ff9cb3f70361ab92b6bc","url":"build/js/TextInput-B8_TQxKy.js"},{"revision":"337e916fd571cd679a77483706b00b84","url":"build/js/TFA-D9pmEf8b.js"},{"revision":"3319f43a5dd3d491eb6568f797eb79ad","url":"build/js/Thankyou-3aXLjdAb.js"},{"revision":"ff5b054cbda45d5320e4623526ea537a","url":"build/js/ThankyouMessages-CxfV12YM.js"},{"revision":"2cbb5c0d5eb7552d3ae983de6c27f5db","url":"build/js/ThankYouRye-HDV_qAVK.js"},{"revision":"e810a20a25edd22294b0a05f714e7d46","url":"build/js/TimeFormat-BDsGoVEG.js"},{"revision":"60e463506e9fd6fa00903b04738c24f1","url":"build/js/TipInner-BQrfCjOb.js"},{"revision":"d86af793fabfa2c1f8670453deaf454b","url":"build/js/Tiplisting-BNhe62I_.js"},{"revision":"5eaa855433d9d25ea3c51cc102732b73","url":"build/js/TipTracker-DWmy978C.js"},{"revision":"ac1f9544337f8d7550be34edcbee765d","url":"build/js/TopEarnBills-BogO8td0.js"},{"revision":"9a7f6f202544cb906dc9c212f883e746","url":"build/js/TopEarnWishes-DWUnW6lE.js"},{"revision":"ea1647ba3bef3450ea102b21314ef8d8","url":"build/js/TopSupporters-DJLnV7A6.js"},{"revision":"0f41e67a5647bf84e07dcb730a0bef70","url":"build/js/TopSupporters-saxTGyrL.js"},{"revision":"74b52fe43af8ba8848c1553413a8f874","url":"build/js/TrustBox-D0CYN36i.js"},{"revision":"9d68e73fca39749bdc327fdab7d2b3ef","url":"build/js/TweetNow-CoK2j0Mo.js"},{"revision":"79edfb15dade3d89573a25bd151d8300","url":"build/js/UpdateAvatar-C531KQVe.js"},{"revision":"235564248f7a349d663622cce2284b87","url":"build/js/UpdatePasswordForm-DQwLkxoo.js"},{"revision":"3b2cd8f7a20fa1357b27b51af7ee3dd1","url":"build/js/UpdateProfileInformationForm-DwkC1BfS.js"},{"revision":"e472a6dec4f8b274fa5e5c103f89540a","url":"build/js/UpgradeStripeAccount-CukvNR40.js"},{"revision":"34577af53a7040d0aa7f62f5dd3dcd6f","url":"build/js/UploadcareEditor-A9cNDqOr.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"88b3952d877279f7b5e4f7fba68e7f33","url":"build/js/uploader.module-DWZqH7yI.js"},{"revision":"3b1e15f8bcfb32d56c630944d13fdc8c","url":"build/js/useDispatch-BEaW790V.js"},{"revision":"c875566ddbe76f2986796ad1f26da7a2","url":"build/js/UserCarts-B5CSM3B4.js"},{"revision":"6948063bfa193231ffdc7877c833578c","url":"build/js/Userprofile-CNIvQmzs.js"},{"revision":"e1f614aefc1cc79b7bd081b870d21aca","url":"build/js/USTERMS-B8xILiHm.js"},{"revision":"a7c107c6a84a30827bf6d3851caa6cfa","url":"build/js/vendor-inertia-Dc3-ULSi.js"},{"revision":"4a22279d2f01b470bc5314c75424cfd1","url":"build/js/vendor-other-Bx_jCjWD.js"},{"revision":"31e5f4a11a2c886590a4e7c58ecf25a5","url":"build/js/vendor-react-CYT1y4LQ.js"},{"revision":"05f1904d6a5e6e3fa9ae193f1ca5537c","url":"build/js/VerifyEmail-Bh32t5sE.js"},{"revision":"03acbb19b0f736c242903223802aeae9","url":"build/js/VersionUpdate-CU6R8iqh.js"},{"revision":"bbebe55b0413e373052e50ed6960a3d4","url":"build/js/VipSupporters-1jzTO5-P.js"},{"revision":"4bebad4d769634e91ac9e719180ab38f","url":"build/js/Welcome-C1VdiGnE.js"},{"revision":"a2f08fc8d9477e61c4ad76cac564c54b","url":"build/js/WhyLove-BvTa1fq6.js"},{"revision":"f8867e6a0fbbbbfafbd8bc3b47f33bc6","url":"build/js/Wishlist-DJxVFx9U.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"b55accd4479ba1727d6aea28824f5cf6","url":"build/js/Wishlistbox-BAWoaUi-.js"},{"revision":"9eb40c6ef7d8d0e6b7bdb2f44c0ca1b0","url":"build/js/WishlistGrid-CdyFJjaR.js"},{"revision":"fc7a662800b16ba993c69986ee774305","url":"build/js/Wishtracker-CynflKB3.js"},{"revision":"6069a2262e34bc6fb4bfb2c48e560903","url":"build/js/Works-yzTxXuPn.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
