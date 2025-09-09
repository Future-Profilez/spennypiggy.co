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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c3122435be2d4602acdec2f38692ed36","url":"build/css/app-BnXL-ssz.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"d9fa193b4ac2b2aad937903a325d1a45","url":"build/js/Accountsetting-C2t7a1-O.js"},{"revision":"865489ba6ede5606b05bd3f8b6e5bbb4","url":"build/js/AchievementSystem-aEHh8bsL.js"},{"revision":"8d0a326cf347517c5c12d957efcf2493","url":"build/js/ActionRequired-Di0reoCX.js"},{"revision":"8de5fb9dfad9fb7c5be012d98a1c5345","url":"build/js/ActivateCard-BDqjwPXt.js"},{"revision":"651138766d03adea959bbfc1e48d5ae3","url":"build/js/ActivateSubscription-DKiMc_ab.js"},{"revision":"0f26470b170be5684bebd0b983cbcd8e","url":"build/js/ActivityStatus-BNSHZAeJ.js"},{"revision":"68e0d3a192e79234ca12434118804d50","url":"build/js/AddBills-2mWsT88q.js"},{"revision":"44b1013e738a34e56cd4388f42c21966","url":"build/js/AddCart-CC3Eb0l8.js"},{"revision":"449bcc6adb7b83c497489e61124fa9e2","url":"build/js/AddComment-ByTJVaOk.js"},{"revision":"f31303f484a03f5f892399fd14079b78","url":"build/js/AddGift-BaR7CDSc.js"},{"revision":"b40c662c68d581662543988b6e7b82d5","url":"build/js/AddGoal-CazqlP8_.js"},{"revision":"42e0f1a13e1840198d1d9b121187b65a","url":"build/js/AddIntro-D65NIA_o.js"},{"revision":"e93bac5427ce57cca0519e1c6e4cb6d7","url":"build/js/AddItem-DgSbNzMw.js"},{"revision":"224c7709703405856e4767d107245ac5","url":"build/js/AddMembership-dyuRI2R3.js"},{"revision":"025ac40eb26e1d40d078845d38f67e10","url":"build/js/AddPost-C9ANw2Id.js"},{"revision":"88990d82d99e57b42af3cabf48b063ea","url":"build/js/AddressForm-BGq-BdTu.js"},{"revision":"f472541f19f49a92284c48a405bd40b0","url":"build/js/AddRyeProduct-BWUtOtiB.js"},{"revision":"cf217d6b489a2976206a4e9b4be831c5","url":"build/js/AddShop-Z7eOYfBn.js"},{"revision":"d2299efa4fb458ea6430808c75b8eb6d","url":"build/js/Alerts-DiBxEe5G.js"},{"revision":"8056a625902504b0d2a98b4dab1327d4","url":"build/js/AllCountries-2kmcJqWm.js"},{"revision":"784714d3ad3490dcea9ba8f2acbed580","url":"build/js/AllWishes-Bi3UfnhZ.js"},{"revision":"fff4975706f589bd0433061ae44cc1be","url":"build/js/app-DHyC3H9m.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"1f28be5e9f3ea46a27c47dab22dd46d6","url":"build/js/AuthenticatedLayout-iFE1-XgI.js"},{"revision":"8d3c1045cb3dfbf37f62f1687122256c","url":"build/js/Avatar-YMcj4skI.js"},{"revision":"3c634de02eef4f9f64ec2ac67238a423","url":"build/js/Bill-D9WW_2re.js"},{"revision":"80edbbb631e8458504d7fe7c367a144c","url":"build/js/BillCheckout-DEbSIxnL.js"},{"revision":"6ca1704dbc996fb4b91bf9721f660295","url":"build/js/Billslist-BWIDoyWb.js"},{"revision":"7d65ed746f4737aba50b0702e3e2544e","url":"build/js/BillsTracker-RzBsfiBu.js"},{"revision":"1afa98040d29e3f20d507bed7df23434","url":"build/js/Board-6zSYiYbC.js"},{"revision":"b88fcf40a6f89279e9180a86eed6197a","url":"build/js/BuyShopItem-DqVNJd15.js"},{"revision":"23570e8137ff7d03e164e547c38768ac","url":"build/js/Cart-DsE-b2dz.js"},{"revision":"c59d5136bae6602a3df961ba527dcc13","url":"build/js/CartItem-BXruSU-R.js"},{"revision":"4f94cb0711346e8735225e7661b10ec0","url":"build/js/CartItems-CnvdI4eN.js"},{"revision":"68c1238d968c8ad99d0ad6c10433a76e","url":"build/js/CartListing-rHdMGjY2.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4c0bef50277e39bd16351a54eb68e8af","url":"build/js/CategoryLeaders-D2HBXyDU.js"},{"revision":"4d94a1b0e628a535a346f4ac521ce029","url":"build/js/ChangeCurrency-D5Fc4Ab3.js"},{"revision":"aee1fbfb4d6f5e733f0836d37707681a","url":"build/js/ChangeVat-Bba46miq.js"},{"revision":"9c5f61a410f28669325fc9b009daff7c","url":"build/js/ChartDashboard-D5rVE6Wl.js"},{"revision":"76ab6e0df03dd7f9271601d2c067b85c","url":"build/js/ComingNext-DoH5V26v.js"},{"revision":"48633b4eafe87c11634fcb4fd5b592ff","url":"build/js/Comment-ECOwx2pP.js"},{"revision":"f3e12f48991f8cd2a8de1d24dc5f7d08","url":"build/js/CommetsLists-BY4JSyjs.js"},{"revision":"163cc011b64ea7dae6680cdd84e51638","url":"build/js/ConfirmPassword-Uz0S2Tce.js"},{"revision":"15d4e9e2e995309584dcbef619339a11","url":"build/js/Countries-C8jel-SM.js"},{"revision":"80a2f66b2f5f33130f313c9470e978fd","url":"build/js/CountriesShipping-Dlubucnf.js"},{"revision":"2758a54154726f91b22ab1261d107b50","url":"build/js/CreatorActivityWidget-CvxdwCs8.js"},{"revision":"a126812cb9172d4a8ee3f86bda51c67c","url":"build/js/CreatorVerification-JxeReojC.js"},{"revision":"12f8110c151ade9c1243d35fe2b05955","url":"build/js/CreatorVerificationNew-s0iPqN2L.js"},{"revision":"ac00c5c19a4b094da8e18f86106d19ff","url":"build/js/Dashboard-CK33YsdS.js"},{"revision":"a1e839716658a710bd718fdc9ffad700","url":"build/js/DeleteStripeAccount-DR968dqF.js"},{"revision":"d5569c49ec0b4b7ac2f68619f8294198","url":"build/js/DeleteUserForm-BnVKsADF.js"},{"revision":"ad36fcb0229acd8b24e86c887878e573","url":"build/js/DiagnosticPage-CqYiRrnb.js"},{"revision":"e322ff87d2eab99d5518daf9617095da","url":"build/js/Discover-DZkBeZFo.js"},{"revision":"cbdb05bdcb41652e5d2e41ce77a6666a","url":"build/js/Earnings-D14t3XPx.js"},{"revision":"16632decc5609ec1eb256f57ec9c49d3","url":"build/js/Edit-G92DCJIq.js"},{"revision":"2d70065c98fa9eff5c3b41601aea8c6f","url":"build/js/EditCategories-D3p5oviR.js"},{"revision":"efa952ef9123c04ad65b570fab6ae713","url":"build/js/EditMembership-DqjZVSF0.js"},{"revision":"65c7ad8816bddea93338816f966fbafb","url":"build/js/EditProfile-BFEDRjow.js"},{"revision":"5e61367afd93b1fb4d086166695a730b","url":"build/js/EnableCardCapabilities-Bwmq6p5g.js"},{"revision":"6c064ad49e047732dd8f55dcbdf4a3a9","url":"build/js/EnterOTP-DHDPJR84.js"},{"revision":"54b64f58f10890fb6113bf7ff2237282","url":"build/js/ErrorPage-CD8W_2v2.js"},{"revision":"7a8487c8791eed1c793a39cfc63d8ae9","url":"build/js/FAQ-DOddaY4a.js"},{"revision":"dfb653954413bcbb52d905c5ffcb0ca9","url":"build/js/FeedList-xifXzbgg.js"},{"revision":"5bf754a80e0aee8882e071ba76a3a2e4","url":"build/js/floating-ui.dom-C_UQUPRW.js"},{"revision":"22df6542037666324d5dcc309d9760d6","url":"build/js/FollowButton-CVVwdX6T.js"},{"revision":"55e74965f8a02ea17c35e839e825c8ec","url":"build/js/Footer-DfUPHodw.js"},{"revision":"2531bdd4a4169fc43c2e4e6dfafe97a3","url":"build/js/ForCreators-BfxZZwxF.js"},{"revision":"655feba609f27d6fa6ff2bf230ac433b","url":"build/js/ForgotPassword-BV8C3QRr.js"},{"revision":"39c28739719eb9e4900899760c551ae6","url":"build/js/FunPart-BN6jYS2T.js"},{"revision":"a3df843c83ccad1944ac6f7675fed2fd","url":"build/js/GetCart--5dhdc71.js"},{"revision":"53c1c924680bd736b813033a6ba48120","url":"build/js/GiftAddCart-Dva8XTnj.js"},{"revision":"b9a6db8e43b035bea450d741bf88bbd9","url":"build/js/GiftEdit-Bt47IqVU.js"},{"revision":"536510ba051f5d4d2dff667f56fac995","url":"build/js/Gifter-BTiouiGY.js"},{"revision":"9132b007b2b1321535762a3b6e78f078","url":"build/js/GifterCardVerification-DNtU-XNH.js"},{"revision":"8636d8ac51ccf54628a4ec4222fefc5e","url":"build/js/GifterFeed-C1Bm9_nN.js"},{"revision":"b75e42e43323e77a4d379014727a784d","url":"build/js/GifterItems-THX36EZJ.js"},{"revision":"8562439ee5be043ff708e4c529e007cd","url":"build/js/GifterMedia-1pTICaoe.js"},{"revision":"93e631a2cac4f14afba6b7fe1706c8e5","url":"build/js/GifterMembership-DzTOo29A.js"},{"revision":"c5484e6b2c0d0461a462941b5d15f054","url":"build/js/GifterSubscriptions-CzW0jUf9.js"},{"revision":"33ab24d164eed755861573d13dd19157","url":"build/js/GifterTips-5RCjrh83.js"},{"revision":"177b636b85169a75de1e6de936e4bb62","url":"build/js/GiftListing-CxFaJsrZ.js"},{"revision":"b574b12bb4c694f01a6899e86d0f0164","url":"build/js/GiftStore-zjRCPJA4.js"},{"revision":"e2bfa3822f53ba3dbea6ff8e7911f8c3","url":"build/js/GlobalCheckout-CABCHJEz.js"},{"revision":"02c84cbe6f191484ad4fd68613492e71","url":"build/js/GrowthTrends-auQCsI7E.js"},{"revision":"93471d65926b5444c71fcf2c8b69a2ee","url":"build/js/GuestLayout-CKFTHB4z.js"},{"revision":"4612efe0366a2b6c2b42042ef727e292","url":"build/js/HappyCreators-Bj8rIwI6.js"},{"revision":"cd0af710dd3e7ae6552946be7de5ea25","url":"build/js/Header-5SdoNk45.js"},{"revision":"184f857f9afae8d06c2a32884e1eb3f8","url":"build/js/Hero-C1PRqn5o.js"},{"revision":"a0b4c2b5a082a678866b4ff1f72dac3c","url":"build/js/iconBase-23tKdLxl.js"},{"revision":"fcf60f24dda17aa1ae563e092ff08fbf","url":"build/js/Icons-eYYT3uF5.js"},{"revision":"36a28d688932c47ba8a54fd68afe7fc1","url":"build/js/ImageGenerationWithAI-DtVzLKEn.js"},{"revision":"5ffdcf588914270e6b74beaa56fca8d4","url":"build/js/index-bfylRnGJ.js"},{"revision":"73ff575f05ba896dd93e499e98a6c2fd","url":"build/js/index-C2xSxkFk.js"},{"revision":"0aa0eef6e157018db7b4337bb07a4bc1","url":"build/js/index-C9KuLVIU.js"},{"revision":"a0e708b29bcdeaac6f6c1fc6497df62e","url":"build/js/index-Cct_2CP2.js"},{"revision":"16623b0697195c3a377c65404c0d27e6","url":"build/js/index-CNz0XVrH.js"},{"revision":"6cb4658897689982e6581192dea14ba2","url":"build/js/index-CvLSI5Af.js"},{"revision":"8530c57947ff173db6aa4ece6a10e447","url":"build/js/index-CXucKh_z.js"},{"revision":"4d0a3ff6f9354d445432e89fd7f57308","url":"build/js/index-D9NT97PX.js"},{"revision":"71cf18b504671e1143c7d66a57412604","url":"build/js/index-DhTi4-H-.js"},{"revision":"6c65ae0694c98883227690be389bbafc","url":"build/js/index-DIYuzGsC.js"},{"revision":"da7237a89f021e4bb420de990c45c133","url":"build/js/index-Dj29W5h4.js"},{"revision":"e086d7fd21a028bf695649bd294232c2","url":"build/js/index-DTQ9_pbb.js"},{"revision":"537405f73cc954a2f1bfa2a3c2f0c96f","url":"build/js/index-NJBDXPMz.js"},{"revision":"1b545b1eb1c4e13f3923fa6aed840be2","url":"build/js/index-UJsIVpUl.js"},{"revision":"f678928f29ba752d9b90ecfee25f082d","url":"build/js/InputError-BN-mrRBB.js"},{"revision":"99e839af5ba2304f68d06db4f9bea114","url":"build/js/InputLabel-2LNYx6Bn.js"},{"revision":"c8421b5c9d31d8a9a8313c0e6582227f","url":"build/js/IntrosVideos-DK9Zi1hu.js"},{"revision":"f2afef8e7f73d14a665eb1bbfce08de1","url":"build/js/Item-CoT6cNeX.js"},{"revision":"ae0553f8f71370077d25cbd8bc076e16","url":"build/js/JoinUs-CdcuNTQ0.js"},{"revision":"4ed22c1873924f0ebd9aa1fa455f84f3","url":"build/js/LeaderboardStars-ClmcV3Yh.js"},{"revision":"21c8fd7c49c2929190a93049e32a9b56","url":"build/js/LineChart-Bv47nnOG.js"},{"revision":"a3f8b436ca54948760dcded8527f48a2","url":"build/js/LinkTwitter-CcLEjIPa.js"},{"revision":"e2b3e7dbdfd1c69bf122fec5a9aed556","url":"build/js/Lists-BIKsnKXR.js"},{"revision":"7d2f042aed7d26c686deda8f9dfb2a04","url":"build/js/LiveBar-D7bueT_m.js"},{"revision":"92d56cf4ae9318e975541a7687153566","url":"build/js/LiveBarSection-eNMCiGT-.js"},{"revision":"a19b4572a7449977b807b240654b1548","url":"build/js/LoaderButton-Ckh6jEuZ.js"},{"revision":"1bfb3fa5b0e370bd563c92f53b0bf3a5","url":"build/js/LoadingScreen-RnIgGBJV.js"},{"revision":"b22399e85a9e12b184fe10363bdb5050","url":"build/js/Login-C7YFzCbB.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"e89cdc35cfb9373e259bd12bce009893","url":"build/js/MagicBellNotification-DQSqssVv.js"},{"revision":"7e9ebc1a9216e1b42db569642aa9b2f9","url":"build/js/MagicBellNotificationDisabled-Bfx2BcIW.js"},{"revision":"d70cd995aa2b34bb9fd567763fb121c3","url":"build/js/MemberCheckout-EpnWdojz.js"},{"revision":"c31ffb28c2e7a3f6b95db67e49facbcb","url":"build/js/Membership_dashboard-D5jAUUYf.js"},{"revision":"a42f2207b19b59e313e67c09baac5053","url":"build/js/Membership-ARbYXhZF.js"},{"revision":"081f74b8a0849297c3d648befeab1820","url":"build/js/Membership-DmIr5344.js"},{"revision":"cb96cb8878273190b2749e89e0912c96","url":"build/js/MembershipLists-eicp5tHQ.js"},{"revision":"455db45589a71c1b6260a1ced89fe747","url":"build/js/MembershipsLists-BSsvaIcX.js"},{"revision":"5cac06dbea7391d987dbe422663c0e64","url":"build/js/MembershipTracker-B6L2eQ0o.js"},{"revision":"a919585a82365f0080dc89828ce4108b","url":"build/js/MonthlyRevenue-BGsXnjnp.js"},{"revision":"7b703e09fc4cbe362024c8530b09f01a","url":"build/js/MyGoal-BBDW5rqe.js"},{"revision":"a5fa5c2188c5067cb76d6d9f1765551b","url":"build/js/MyShopProducts-DBkBphND.js"},{"revision":"0cc4dee7286e5d678f7d88d072c911f5","url":"build/js/navigation-Be0fNZYu.js"},{"revision":"cc49d3cd2e59988a9c48b0f9f3cace3b","url":"build/js/Nocontent-BbJEOCNA.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"d6d9b37a8a62ebf435096d051f084de2","url":"build/js/NotForBusiness-Ig1FNsLM.js"},{"revision":"530141d7a84cf1fda21320c93644cfb3","url":"build/js/NotFound-_Thd9Rek.js"},{"revision":"8457fa5b8f3908091905326e42d8533f","url":"build/js/OldSubscribe-Ba3xep1b.js"},{"revision":"e933afebe3a0c401f25bf23aab67ffe7","url":"build/js/OrderDetail-CtBavj3C.js"},{"revision":"41cee881a43c7414c79df445d6321b62","url":"build/js/OrdersLists-dB9wLqAo.js"},{"revision":"72202ee88f7357e42734208f2a3be98a","url":"build/js/pagination-BcF_VkFu.js"},{"revision":"4138217a3e88d78969eb143e3b9104c1","url":"build/js/PaymentDashboard-AhdVd07W.js"},{"revision":"630b4cf64b22f584430508be4f1d4cdc","url":"build/js/PaymentSlider-CRZxE7VJ.js"},{"revision":"9a91b41229c0645534bdd25c154d5e50","url":"build/js/PlatformAnalytics-BOWb4ZgP.js"},{"revision":"a17523e74daa9118e353062acaf9a2ee","url":"build/js/Popup-BsKBmYzm.js"},{"revision":"29bb35b0cbb2d4bdae66ed8a0dcc3704","url":"build/js/Post-B7MqVu-Z.js"},{"revision":"514ade7451bb31f97962dbaf1612c534","url":"build/js/PostLike-CfOzBrXv.js"},{"revision":"9b72c127e35b9cb53731e22b2d835ed0","url":"build/js/PriceFormat-DK6hcu3J.js"},{"revision":"6b462d8e86ca64b314b713c9e77be7f8","url":"build/js/PrimaryButton-Jeh8UCmu.js"},{"revision":"98b5b1fcbd9f1703b2549694eb8415fb","url":"build/js/ProfileProduct-LrtyCRV0.js"},{"revision":"5d5bff955bee008d0b89c083b94db3c5","url":"build/js/ProfileProduct-V_ynYx32.js"},{"revision":"5645e7b38e69211f5e0db6d066282ebf","url":"build/js/ProfileProductLists-BXwoTuSB.js"},{"revision":"937fb95e101ce9381adc0ac42ce06f9c","url":"build/js/ProfileProductLists-CHu3ej4I.js"},{"revision":"4807b4675430a06856ec1bd00ecf6bcc","url":"build/js/ProfileSteps-cn405P0p.js"},{"revision":"2b24313d7b9aadeb31e12175af09a201","url":"build/js/Promotions-BtT3BPGs.js"},{"revision":"627dd29c073d4b38a1e0431b6e085cd7","url":"build/js/PwaInstallPrompt-CVoNb3qm.js"},{"revision":"56e00970c26b4f53db1afd02f0e4cf1e","url":"build/js/PwaTest-BHL28AIR.js"},{"revision":"66b0bc3f056d135116794151b82c17b5","url":"build/js/react-select.esm-PaPzkVmC.js"},{"revision":"503b97b699b618b3177672bff9520207","url":"build/js/RecentSupporters-etFX5Hhn.js"},{"revision":"bb8ca041beb44714347eb0a19fb436e8","url":"build/js/Redirecting-BVeFvmNp.js"},{"revision":"c84f9c9c6d8a662e7ee75c5ac18f3585","url":"build/js/Register-uxqLk1I7.js"},{"revision":"afce24bd99f1ec38bbfe760b87e4bd8b","url":"build/js/RemoveBill-Blrf1fnz.js"},{"revision":"b03c7c05b5ce8036c8184dce615b3f10","url":"build/js/RemoveMembership-CJlGDca5.js"},{"revision":"214215a5a95b749c5f3168a686a454b6","url":"build/js/RemovePost-DAAoxhbh.js"},{"revision":"dad3536f725d00037fab7383cdd23336","url":"build/js/ResetPassword-B9ztvT8M.js"},{"revision":"ab5914559626e4bf5d9cdddeceb4f439","url":"build/js/SafeTransition-Cnv3UHUJ.js"},{"revision":"2b0928c60c2bfbb10ffd0ff728898407","url":"build/js/SayThanks-BverZ8H9.js"},{"revision":"e408eafc3aac135a1acaa49067aaefa9","url":"build/js/SecondaryButton-DCHBeAHs.js"},{"revision":"c30791dddce93c176ea4be0184f57de4","url":"build/js/SendTip-CUC1MCiy.js"},{"revision":"7bba7ad0f7b0b88e4883245e120e6a64","url":"build/js/ShareProfile-Bl0HwCwN.js"},{"revision":"8c1bfa4c459783b1912081663cc704c4","url":"build/js/ShopPage-NyAh-j4J.js"},{"revision":"227c73fa504c37d3e4c927189ff16483","url":"build/js/ShopTracker-Bleq546f.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"08305a97634860c50fc5153d5618b6bf","url":"build/js/SiteSubscription-DX2IeA8W.js"},{"revision":"ed1845fb6017ba28809ea1c18eda3b76","url":"build/js/Social-BnNAadSY.js"},{"revision":"09eccea3612569c0bd0886e3499d2117","url":"build/js/SocialLinks-By-O5g-2.js"},{"revision":"87d8945b269c0c8c6f2110176767ec68","url":"build/js/sortable.esm-DeU7egHu.js"},{"revision":"6b36485d58f8475d15d3dd007ee2b6dc","url":"build/js/Stripe-CLHq1cBC.js"},{"revision":"327235f971b3da667ed936c55f1af5b8","url":"build/js/StripeIdentity-CvmMYfQs.js"},{"revision":"abfbcae1f1430c9011bc06714f9b9e22","url":"build/js/SubCheckout-B_5kjolz.js"},{"revision":"cd34412a1d170b17ab90cfb648fc1686","url":"build/js/SubcriptionEarnings-D0wQQWrW.js"},{"revision":"2324765d50eb11c221a8c18f5f35f9b4","url":"build/js/Suspanded-JqlnPEwb.js"},{"revision":"61434607f9f8bc2c11d1fed4e5bf33ee","url":"build/js/swiper-react-D_QNfF61.js"},{"revision":"c9f6bb59f454d62568e0cbcfc6295c2e","url":"build/js/TabbedDashboard-5PCHGKIu.js"},{"revision":"424d30786c91e0fb4d4580099c76f5dd","url":"build/js/Terms-C161i4Wt.js"},{"revision":"977c5333e4fa867cc65ccc38ae1cfe64","url":"build/js/Test-DjIp2NRm.js"},{"revision":"22d7bf76106d874f808a3267cbf7c9e3","url":"build/js/TextInput-IDggJOSP.js"},{"revision":"758fb705c2bd712266b0c92354f078a3","url":"build/js/TFA-CiLkPO1M.js"},{"revision":"a1f3a01a2aa16aaff8cede8dd9acf929","url":"build/js/Thankyou-u0JtZTIu.js"},{"revision":"282abc29265aebfa1e807c82057107cc","url":"build/js/ThankyouMessages-DqTpVN5G.js"},{"revision":"fddccb98c01342bdc9d44f4409c8293f","url":"build/js/ThankYouRye-2tCA0LeS.js"},{"revision":"9010f105cd5e10f9ac79af7a4480c041","url":"build/js/TimeFormat-DpQtMxcA.js"},{"revision":"8d969d869e4bad55dd28cd6c8f19697c","url":"build/js/TipInner-CNVER0uN.js"},{"revision":"44d2310e15654b7b36d5de08047e3f58","url":"build/js/Tiplisting-BaHQ0x3g.js"},{"revision":"e0ecc6a578176c3182ee8fc4563d9c7d","url":"build/js/TipTracker-DuJG2ksd.js"},{"revision":"0037857163a5249a1ef5eaa1ed819cae","url":"build/js/TopEarnBills-DwBzI9v_.js"},{"revision":"73b4ac7767a9828068efb3ae64906d51","url":"build/js/TopEarnWishes-BFitmlPN.js"},{"revision":"f06ac4929317c8e22d0a4455ef99fb88","url":"build/js/TopSupporters-BVzupmCu.js"},{"revision":"cab21258b3c9d08664d0003164037b42","url":"build/js/TopSupporters-DCeulc6s.js"},{"revision":"d4f520d680acc3c5d7861544c7a1199b","url":"build/js/TrustBox-Ci4SHKZ6.js"},{"revision":"ea5743af4750017cc0c25db339bcba43","url":"build/js/TweetNow-BLtnc2sz.js"},{"revision":"e9c2e877b1d22f7186d76b7b0845d94d","url":"build/js/UpdateAvatar-DRSkxSeD.js"},{"revision":"d9bae1e2ab37cb860db661d57692d549","url":"build/js/UpdatePasswordForm-DSvTIEK3.js"},{"revision":"e0d423c53cf6901dd430e626c53d557e","url":"build/js/UpdateProfileInformationForm-1mLA9I2d.js"},{"revision":"cd5754eda4cf806c5d3b7bdf545ecf25","url":"build/js/UpgradeStripeAccount-BLG8cNwP.js"},{"revision":"e535bae9ca9aba216593c678a1399dc2","url":"build/js/UploadcareEditor-ChJKLxBT.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"4356cb931aac07965461126bd18aa1d5","url":"build/js/uploader.module-Bx_O2Uol.js"},{"revision":"83175104cea590b667c0a15ed6dc3873","url":"build/js/useDispatch-BGDaum4B.js"},{"revision":"572345f7c4392ce6129acea6dee65c7a","url":"build/js/UserCarts-wnhStMew.js"},{"revision":"d625c30b5ee6fae89af6a4a942dd0976","url":"build/js/Userprofile-JXwUUj4y.js"},{"revision":"424d30786c91e0fb4d4580099c76f5dd","url":"build/js/USTERMS-BTf_hoEY.js"},{"revision":"2281f980c8655804e5e637b5c4efc3a8","url":"build/js/vendor-inertia-DYhxHSLp.js"},{"revision":"a2ec16d1af97baba878ca55e88717b76","url":"build/js/vendor-other-HvgeQooW.js"},{"revision":"2ef9d9276fb176e1c4f5424d6ef4be5c","url":"build/js/vendor-react-BYW71CHa.js"},{"revision":"ffc427825820ce234fe1a09fa74aee46","url":"build/js/VerifyEmail-BmH9lSnE.js"},{"revision":"76809825af0ae60471e3d32d40ec6777","url":"build/js/VersionUpdate-B0TjYapR.js"},{"revision":"5ba832d8fd24927bc363751d793785e3","url":"build/js/VipSupporters-DJnGcM1i.js"},{"revision":"112eff9e237a6829e8fed84a13d0277a","url":"build/js/Welcome-DtlSaOJz.js"},{"revision":"d997ff213ec12e53acb3d218b0e3332a","url":"build/js/WhyLove-BuxxUGzA.js"},{"revision":"d4952d8a34510cbaadf2094d4d3ee607","url":"build/js/Wishlist-DLE9NiTC.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"8115ff17649ed00c9be1e509be69cab1","url":"build/js/Wishlistbox-CkY6L1t7.js"},{"revision":"c9bad65d24ed8ff31c2a8e0c1bb1cf2d","url":"build/js/Wishtracker-DBiCoD9A.js"},{"revision":"fee2ce1736af70b7184606d66dcd9d64","url":"build/js/Works-MEP1_Vi8.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
