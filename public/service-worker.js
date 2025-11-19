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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"8dcbb6d7c83cb4e05e31ff2b3f0f9a33","url":"build/css/app-CqB1S6kW.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"788956f52b4ee54e048821b08a2ea7c2","url":"build/js/404-COMuzXYp.js"},{"revision":"dee65b031b8aeb10cfd722df5dd40cd5","url":"build/js/Accountsetting-DjbXywFp.js"},{"revision":"85c8dd7bc820fd2158316661cba225c2","url":"build/js/AchievementSystem-iR5s7MdY.js"},{"revision":"2f3be636c0e9b554fb85fd37ce44cec9","url":"build/js/ActionRequired-DpHmIg_-.js"},{"revision":"1bd7bf2f22ce45c5868060ce649828ad","url":"build/js/ActivateCard-B0Y7ZIpj.js"},{"revision":"63368e2d7b02e1c5360ba4241330dc75","url":"build/js/ActivateSubscription-D_TlEIrk.js"},{"revision":"600d44fca81ce534cf45a2a667c95737","url":"build/js/ActivityStatus-BIRL8fAR.js"},{"revision":"577a103c0f327c1d45686198de3af8b2","url":"build/js/AddBills-DgN1-dGm.js"},{"revision":"f180f903a21aa0fee7f6352e9db1acfe","url":"build/js/AddCart-BonuQXsN.js"},{"revision":"c89788e262483cb16fdf7b4528f3d22b","url":"build/js/AddComment-Dymt7KL7.js"},{"revision":"31005735ea6f986da22242b106442c31","url":"build/js/AddGift-DvV6ll9-.js"},{"revision":"a04b8471a0a731b8a15611f5fe203e11","url":"build/js/AddGoal-DlNtf0Kx.js"},{"revision":"5a688ea1a7098b79708e88157a1f28ea","url":"build/js/AddIntro-BKYED5SQ.js"},{"revision":"21abd09028f31ce145d6105b5e0caf6f","url":"build/js/AddItem-DfUOLBRU.js"},{"revision":"d6b5e1a7c1cd0e6c6dcc966946d1c46c","url":"build/js/AddMembership-B3bJdAHE.js"},{"revision":"881b1628c0f9c3cd70e43af0c671042a","url":"build/js/AddPost-DEc1kiak.js"},{"revision":"32c3fe003f1f46bd194e6be81b80e692","url":"build/js/AddressForm-BOKVlWrx.js"},{"revision":"4d48d9d4f4d0d13bd2a3be148477ef9b","url":"build/js/AddRyeProduct-Bh52LX4X.js"},{"revision":"5a1088ce8630581667184b0d967f49d6","url":"build/js/AddShop-CpCNgQM0.js"},{"revision":"6c3b2bdf20c81bb9b98523ef6e4432ba","url":"build/js/Alerts-CJrTHR61.js"},{"revision":"7529210df22c8e1bd774473978503dc7","url":"build/js/AllCountries-CIQgP557.js"},{"revision":"1e02383b94656feca108468994785448","url":"build/js/AllWishes-ChUM010j.js"},{"revision":"1ad8f722fcf8f89130da77e19e72bac1","url":"build/js/app-BYEPtjZo.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"10d79dce03fe731723b7616c060a8d9f","url":"build/js/AuthenticatedLayout-DJnvzrj5.js"},{"revision":"ca9f3706b39df4a215d2bfb12b13c61d","url":"build/js/Avatar-wr9eOdBV.js"},{"revision":"3dbd2edf1ff5a708f173f16408d8f621","url":"build/js/Bill-DhUEiSPQ.js"},{"revision":"5116e2d5d238bd1a2967ae4d96e67c8c","url":"build/js/BillCheckout-B_UVu4m9.js"},{"revision":"fca4918545cc8edbced7367edfae9d0a","url":"build/js/Billslist-BvX4PCtN.js"},{"revision":"324be71376c23cc3e2983b8b36099356","url":"build/js/BillsTracker-BekMzNGg.js"},{"revision":"9a216e909290fa6d1cc314e97073b37e","url":"build/js/Board-BaNxJqlD.js"},{"revision":"3d0abf02b8a9c595153c0835cfda0378","url":"build/js/BuyShopItem-CgSWBozn.js"},{"revision":"b49ad50c7d0fb3efe81aaffeb4604d79","url":"build/js/Cart-C5aWFq7u.js"},{"revision":"75413ce8c98629eb3bbcd2fdb6c761f4","url":"build/js/CartItem-BXdDhGfR.js"},{"revision":"c9bff62b05d882b575ba1ccf2730759e","url":"build/js/CartItems-3GNx1Kcv.js"},{"revision":"3e0355e9424a019e858b35740910c063","url":"build/js/CartListing-DokxhXBp.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"bce36d28c4b3826f18bd13da3c8bf0ee","url":"build/js/CategoryLeaders-Cv9FAtwZ.js"},{"revision":"5348ba2c5bc69084034553f18dd3c018","url":"build/js/ChangeCurrency-C2KtUG09.js"},{"revision":"d2ef8c6dc51ff5f25b781ef04fbcf70b","url":"build/js/ChangeVat-BXXdcX5_.js"},{"revision":"3699fea72d616f1dba85cb5898647f41","url":"build/js/ChartDashboard-BPnUTfjD.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"442e52dc9aff5e5c1918f2ee1ec8db78","url":"build/js/ComingNext-C2lRFpn4.js"},{"revision":"170b5b7dad1012115dd297069df8ae8b","url":"build/js/Comment-BbDhp_sB.js"},{"revision":"bcc65989589ccd403cd2fa9e69542cdb","url":"build/js/CommetsLists-xk_vbySm.js"},{"revision":"dccdc83e76130dc766e44e7124187202","url":"build/js/ConfirmPassword-DaExPynH.js"},{"revision":"29d7fdafb0e154504192dec61ee14e4c","url":"build/js/Countries-juHdQamn.js"},{"revision":"ae28bfaef659544d41b89285949699a2","url":"build/js/CountriesShipping-0wwet95J.js"},{"revision":"20dd2fa1053ef49ede3ea54b16423fc0","url":"build/js/CreatorActivityWidget-CQGDPNHZ.js"},{"revision":"10449ca5cf79c6424d1063c916298d1f","url":"build/js/CreatorSubscriptionWidget-COw1p8zS.js"},{"revision":"617dc4b2f664062456bb0a2cb15354d3","url":"build/js/CreatorVerification-C-ch4mf1.js"},{"revision":"f11979f07c371a6f5d48128670b36650","url":"build/js/CreatorVerificationNew-BPFvrAEh.js"},{"revision":"cd7f80ab97488b46534197e71559f86c","url":"build/js/Dashboard-JUOm7qDR.js"},{"revision":"c531e56618ad649d07b8c578a46a0bfd","url":"build/js/Dashboard-V0c9Vvv3.js"},{"revision":"8395151042b49c6dbfc987eaf0bda0d2","url":"build/js/DeleteStripeAccount-HJVW06dl.js"},{"revision":"215382d9dbd48b16e5640d70e3c9c046","url":"build/js/DeleteUserForm-DDKb_uDO.js"},{"revision":"81e45e8d2ed3e646ec3c3e91a9c58233","url":"build/js/DiagnosticPage-D_-90HNa.js"},{"revision":"4cd522bff629d3a5a253b14038960981","url":"build/js/Discover-DLWnjTXK.js"},{"revision":"ac8221c02752e8abc9db9cc1602913f2","url":"build/js/Earnings-D6GkRZ6D.js"},{"revision":"21890305cb5c361a5a6f78a994c9b02e","url":"build/js/Edit-C34lFFcs.js"},{"revision":"0c6e699749adca51c24bdc4fa03c2226","url":"build/js/EditCategories-DLQ_nNSE.js"},{"revision":"a76ef7e94bf6a7e0ef61ae21607b49fd","url":"build/js/EditMembership-I01O3seZ.js"},{"revision":"6d72ee8991ea5fe1d1c502e3f88443c8","url":"build/js/EditProfile-NdT2Obu6.js"},{"revision":"88ec53e9e03233f83dc2a4fc25eb48ee","url":"build/js/EnableCardCapabilities-CtN4kAE0.js"},{"revision":"5a186fa759064d4a35b3166a0d5b1f80","url":"build/js/EnterOTP-BXgN0kEi.js"},{"revision":"418217b1d0cb7292b7f6cc01a2804f2a","url":"build/js/ErrorPage-CYWxGlc5.js"},{"revision":"8bd8a0fa0a431b0f9f04ce39978b9260","url":"build/js/FAQ-BBt-wr5N.js"},{"revision":"e23aaa43c43b1355b2c778424df82cb7","url":"build/js/FeedList-SmLGpzck.js"},{"revision":"7a9c267d4831c70ecf644b842b0eda15","url":"build/js/FlashMessenger-G3CQqNL1.js"},{"revision":"fa20090674bbb5cd63b4797852d29e88","url":"build/js/floating-ui.dom-Bycj7zgc.js"},{"revision":"e1085ce49fe8fe8bb3f4db40369c6249","url":"build/js/FollowButton-B4GMWIFx.js"},{"revision":"26b3615aae21351ae5442ec9a154737d","url":"build/js/Footer-DHrrMSok.js"},{"revision":"d7eccfac55b86e1d23540ef4b7aae701","url":"build/js/ForCreators-C6erlatT.js"},{"revision":"9794ae75b44e90f960bfa8eaaaab48e6","url":"build/js/ForgotPassword-B3hUv_Ll.js"},{"revision":"4f25eba4e7d0ece0198fa37a48221c00","url":"build/js/FounderBadge-CjZkCYCq.js"},{"revision":"49d2f16dd62aacde6ec7a64b3e397150","url":"build/js/FounderProgramAnnouncement-N9O6RHQ1.js"},{"revision":"b8d195a4245978f441619fd0942f558a","url":"build/js/FunPart-BtsDahuj.js"},{"revision":"8c6283bde23cead2fc01ba4717e8616e","url":"build/js/GetCart-DoxgIIJL.js"},{"revision":"5c281a918c7ff020c0990830a5ded828","url":"build/js/GiftAddCart-CFsYkzoc.js"},{"revision":"271c2d2861db253826c4ec6ddde0f84a","url":"build/js/GiftEdit-D9Ef1BtR.js"},{"revision":"3864b85c19528240320a09643f5b7d31","url":"build/js/Gifter-d93HWECa.js"},{"revision":"443af234dc9d6495c1bd88c21708e9cf","url":"build/js/GifterBills-C8ihxuyt.js"},{"revision":"901eb0eb7eed09bd8a372c07b2e8e0f9","url":"build/js/GifterCardVerification-Dkq3fmU0.js"},{"revision":"fd5d9f0d8c98b94372a3c75f54d69c18","url":"build/js/GifterFeed-D1RRXypt.js"},{"revision":"78d2e3dade3c03c9fad3cc9b8837ee49","url":"build/js/GifterItems-b56g17Nl.js"},{"revision":"3560dbda49bd128b8beb0c7a2427931e","url":"build/js/GifterMedia-DrT3U_3Q.js"},{"revision":"7b525dd11f11bc453bf91eaf62f87fee","url":"build/js/GifterMembership-w1UdRDj3.js"},{"revision":"039a0f7576aed64008534802e5f1db9a","url":"build/js/GifterSubscriptions-BPLq1Uqk.js"},{"revision":"8de454cb6b9ddc8768bc8352a3a5b7fd","url":"build/js/GifterTips-2B1f2dqV.js"},{"revision":"1a1527b044022b1e0307230bf8c2b61f","url":"build/js/GiftListing-3WRYN_Bz.js"},{"revision":"7f7bf3094f4d437bc524e647e49fb870","url":"build/js/GiftStore-CNn_mWNx.js"},{"revision":"8570a8693c9df262e1785243f1712b4e","url":"build/js/GlobalCheckout-bzRXoNQH.js"},{"revision":"e5ed0d5c16ade1fcd997801258b0337c","url":"build/js/GrowthTrends-C3A9Rrvu.js"},{"revision":"780321d56f72dd45b561c91174ca1b52","url":"build/js/GuestLayout-BNd2Ygrb.js"},{"revision":"fd94a51cc25669812cf8100264fcdbe6","url":"build/js/HappyCreators-C12P0AnP.js"},{"revision":"bf86d71d3b74752006ec0b17b178d12a","url":"build/js/Header-D_vOGooP.js"},{"revision":"57b03fe64169869f1086fe50114780b6","url":"build/js/Hero-BwjVKCfI.js"},{"revision":"8721e0a569431cfc89b365b5cb3a28a1","url":"build/js/iconBase-DTLk3jVI.js"},{"revision":"29681af5953cd7b862056f198bc5a5f7","url":"build/js/Icons-BZcOU2j-.js"},{"revision":"f02bc748305ed0a4da94593574a630e0","url":"build/js/ImageGenerationWithAI-OHzClhqr.js"},{"revision":"2ae2b022b397703585162b1312853785","url":"build/js/index-8b2tXxxS.js"},{"revision":"0ba368e1ac62498c136a52264ed9cfae","url":"build/js/index-B7xQJ5B0.js"},{"revision":"71f11d249f10546a93f674c9a0037ede","url":"build/js/index-BmIeLlXJ.js"},{"revision":"e733135af79cc9d8160f6a24b22f7aa5","url":"build/js/index-BnlO2tu2.js"},{"revision":"9a43722dd3c208fb2d5e322bed250821","url":"build/js/Index-Bqxx-Tnx.js"},{"revision":"eef1f717062d1f408e1626211212eac2","url":"build/js/index-BsmlPo6p.js"},{"revision":"608a92afb5a059458ecb4dfd39c29ff2","url":"build/js/index-BTQMUzua.js"},{"revision":"99fe89ab8395def3c803cd8f0b7f2cb6","url":"build/js/index-BVPCy3DX.js"},{"revision":"a24b52c180d7282c3ed50d5a2988385c","url":"build/js/index-BVTph-2H.js"},{"revision":"19fc70b777ab0423eb1d47db8be29fcb","url":"build/js/index-BZFs0Ubt.js"},{"revision":"6c7e02faa1cf40bfc46fa8a9237ff4a0","url":"build/js/index-C1Fz_TIv.js"},{"revision":"f48b70e1f65b2a0c1585791540da8fb0","url":"build/js/index-C3qIuLc6.js"},{"revision":"2bb7a60a3a3876eb9c3f3543f6f74e31","url":"build/js/index-DaH5_2-x.js"},{"revision":"c0007580805826e1c51ee47c58d2d62b","url":"build/js/Index-DazxpXI1.js"},{"revision":"54af432c44e43919d7aff341d7182d40","url":"build/js/index-DM5NSBYd.js"},{"revision":"687b7c787a1c221cd2401742ba63f4d3","url":"build/js/index-DXq9NKWa.js"},{"revision":"7d43f39db2ff32d26a3c4e0b2a96f3b6","url":"build/js/index-GwshZivn.js"},{"revision":"d3941596a6075d24c513a882a21b35c1","url":"build/js/Index-jHyl-01k.js"},{"revision":"3db2f05f504a33c389b47ebad16a792c","url":"build/js/index-KF9dgN_m.js"},{"revision":"79ffbbc59daa2e9febc2d512f411dc1b","url":"build/js/index-VhHDgBaL.js"},{"revision":"cca1246d8542acb86b18b349319f8d05","url":"build/js/index-w01iy9YS.js"},{"revision":"f26f26a54e44900b9adbfb61f60cda99","url":"build/js/InputError-CnYH4CEM.js"},{"revision":"c4c896d32c8c4627d97e7499f14faa82","url":"build/js/InputLabel-Btuaxd35.js"},{"revision":"1ca03027265bbadab4c5258129da7da0","url":"build/js/IntercomDebug-A1acnNYL.js"},{"revision":"623a8d5e3db411cab7012b45ab4898eb","url":"build/js/IntrosVideos-fC6EGh5L.js"},{"revision":"43d5c53167af37408b69ad3fb7cf4e08","url":"build/js/Item-CLEIhOKg.js"},{"revision":"935beb431ee459450f66e62d53253d35","url":"build/js/JoinUs-BzMItwbC.js"},{"revision":"6034ad6d0dee744480a10d633deeb367","url":"build/js/LeaderboardStars-65lfTge1.js"},{"revision":"cc7389571b991d3af96033fc05cb9c91","url":"build/js/LineChart-BpZCJ02g.js"},{"revision":"e618586982772c96d2977aaa2643b3a8","url":"build/js/LinkTwitter-BGjT6ftw.js"},{"revision":"efcbf5fcf88a80415dbe20acd67f3d84","url":"build/js/Lists-BJuazitV.js"},{"revision":"f96e1517e2d12642cd108b56444d01d5","url":"build/js/LiveBarSection-CxzOuaTN.js"},{"revision":"0e1cdcfbd0a48d31639247138b30cd73","url":"build/js/LoaderButton-CZ0WbY_z.js"},{"revision":"b3ec7d0fa4ffd34dea56ea26b54d2d06","url":"build/js/LoadingScreen-TJPdmbZZ.js"},{"revision":"162be150d111285ad7fa73c1cbea139e","url":"build/js/Login-CcyOB3RF.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"c90b3ee490825a59a09b3d16d2c3520c","url":"build/js/MagicBellNotification-H1GYjqL-.js"},{"revision":"074a0290ce2ec4f964fda9bc7bb4e3a7","url":"build/js/MagicBellNotificationDisabled-rsR_IHNX.js"},{"revision":"d8afe53ea86a348ab5c84a8b699132d3","url":"build/js/MemberCheckout-DA7uZ3A8.js"},{"revision":"f37129868a7603bd9922b5d4d2c19bb1","url":"build/js/Membership_dashboard-CNkD9yND.js"},{"revision":"e65c4cf57e7b217a513dbe658147f884","url":"build/js/Membership-AH_T4dUq.js"},{"revision":"42d9b521f3563ae303b0d6698d5c08ea","url":"build/js/Membership-BjQrs4ho.js"},{"revision":"2319c2596b9a2ad1babdf3919a4ef153","url":"build/js/MembershipLists-6y9Mq3eB.js"},{"revision":"e17e3c0da09eb484c0234303f23cc26a","url":"build/js/MembershipsLists-BoWihSse.js"},{"revision":"d3e72e42cc61ada92a2dd9b5fe6f5854","url":"build/js/MembershipTracker-CD4LRKSV.js"},{"revision":"83710081fdcf032c340656be981c0770","url":"build/js/MonthlyRevenue-D_tuK8L-.js"},{"revision":"d4b1267334c093105e9a8f35c7b13376","url":"build/js/MyGoal-CAtikSj-.js"},{"revision":"abc01521c6139fd47d75ae1b5570ac22","url":"build/js/MyShopProducts-CQS2hrfD.js"},{"revision":"2f226d42d3bd604b1595c7f04983db29","url":"build/js/navigation-BW8FmOUK.js"},{"revision":"2cd7176dd99a62b9dc4b4ead3b7315fb","url":"build/js/Nocontent-B2woSsWt.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"dc55335f36fd1c3011b57a7c828a2899","url":"build/js/NotForBusiness-N8OqfGbm.js"},{"revision":"bd927b0765215c74ca4224b2a5ac87ba","url":"build/js/NotFound-DA-illHX.js"},{"revision":"ae63d44cf781b6c378015db4e3894325","url":"build/js/OldSubscribe-DGur7tl4.js"},{"revision":"632eedcad12de722ee66f07e925cd441","url":"build/js/OrderDetail-BOud1Mwg.js"},{"revision":"8f667c97e8eebf8064c3be4e67a8ce27","url":"build/js/OrdersLists-S7f8LL_n.js"},{"revision":"43599e41f150672c4bc870ff33f50e3e","url":"build/js/pagination-DfaRiM2b.js"},{"revision":"05916231320436b56908009659374b12","url":"build/js/PaymentDashboard-CplbZnTB.js"},{"revision":"32ac849a16facf48673bdd2d07b9ad24","url":"build/js/PaymentSlider-DEen9HB8.js"},{"revision":"f7aa834b6ddc700968f15859ff51b1bc","url":"build/js/PlatformAnalytics-CQJNZaVr.js"},{"revision":"c80324cd93cd20494ac6f7775a991353","url":"build/js/Popup-Dj45KKIP.js"},{"revision":"8038785218b46135fb50e8372a3abb26","url":"build/js/Post-CoIWFz4m.js"},{"revision":"e38822f8004037f85446799e5a16a115","url":"build/js/PostLike-v9puHir-.js"},{"revision":"bcfb6f45b9f75cf65d15bfc82e16b440","url":"build/js/PriceFormat-CIugbPGc.js"},{"revision":"291fc38cb07746fa95008a589bced765","url":"build/js/PrimaryButton-f0H0U-5t.js"},{"revision":"51528e63312b7fb62a6b53c6249927f8","url":"build/js/ProfileProduct-CFbUvcA0.js"},{"revision":"4f78645dce0c99141e9c900f97bd3ad2","url":"build/js/ProfileProduct-CHf_x_eE.js"},{"revision":"8db5de54bd15edaff520161f072e06da","url":"build/js/ProfileProductLists-DvsoU7UC.js"},{"revision":"6bd2889b548705844b66d818df2c74df","url":"build/js/ProfileProductLists-DXNsixBf.js"},{"revision":"36a0188c30b50941aa1d2da2668cbb28","url":"build/js/ProfileSteps-B5dgMNw0.js"},{"revision":"5322f8e9403ce15dcb8dfc63c58e0384","url":"build/js/Promotions-CDjGyPLv.js"},{"revision":"9784dd52cdfcda774ad07d2beb7b39d1","url":"build/js/PwaTest-C2HFJRN-.js"},{"revision":"ff30bc542d18c9cd758a2ea72923998d","url":"build/js/react-select.esm-BIAszgoM.js"},{"revision":"d4b6f23af91653506ee9faab3d720849","url":"build/js/RecentSupporters-DbU8eG_0.js"},{"revision":"8b8010ae01487031d4e12eb4726212a8","url":"build/js/Redirecting-pflMM4Zj.js"},{"revision":"28ba7b7b5d4ee0c76cf7c1946dc21d41","url":"build/js/Register-6q9t2TSQ.js"},{"revision":"976eef450a891d3a12d257f03368b430","url":"build/js/RemoveBill-C1b4a2s_.js"},{"revision":"663a22a6d71dac3f00980daab5c4aeaa","url":"build/js/RemoveMembership-OIN_H5Fs.js"},{"revision":"63e1934bb1213ee6e0c2bf26e7c00c4b","url":"build/js/RemovePost-D2y3T5W-.js"},{"revision":"14968bda5771e6b610458e5920f9792b","url":"build/js/ResetPassword-Dj4P8PGx.js"},{"revision":"e7e1af89670711cf41a4aae69f02d89f","url":"build/js/SafeTransition-Cy9lqHmc.js"},{"revision":"73e3b12d49ade4c130803bf1aab77918","url":"build/js/SayThanks-2uERyVQv.js"},{"revision":"9fd1ce7c5922ed329e64dafb6147c251","url":"build/js/SecondaryButton-DzNsdmUL.js"},{"revision":"129c2b0722b951a3e0724c710fa4f671","url":"build/js/SendTip-CdGHLqlV.js"},{"revision":"bce8587c03737aae6674863fd173b562","url":"build/js/Settings-Tt5dTOZV.js"},{"revision":"28720b116285328d6a07b3b5faeeac89","url":"build/js/ShareProfile-VRocFeI_.js"},{"revision":"2717909a62428ad265b73a7f92bc3c80","url":"build/js/ShopPage-C1BMD2I6.js"},{"revision":"38f0b8d36bd3bbc1df523be62b8b285d","url":"build/js/ShopTracker-CErnKs-n.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"b18456b3c6252343b4540a25f7ca2a8a","url":"build/js/SiteSubscription-CV97ECVd.js"},{"revision":"90a756a8e86ae29fc0b92b530fce363b","url":"build/js/Social-p06zL2fE.js"},{"revision":"2e8feb415e5d2c60884de9188e8b99cf","url":"build/js/SocialLinks-DDn9lCaA.js"},{"revision":"a4bd810c4c1af2ab9ec9b09b4c672d49","url":"build/js/sortable.esm-B5C2L7qJ.js"},{"revision":"c52c2bc5dc00e851c5dea3c325ef69f4","url":"build/js/Stripe-RxmfrG95.js"},{"revision":"5d5c81985b0beafad3c4df05dc190601","url":"build/js/StripeIdentity-CSluW5BL.js"},{"revision":"b519ee62d38c3bcd0fdce81a7452a0e8","url":"build/js/SubCheckout-BcgmBGP8.js"},{"revision":"70e716a8edd5b9696d5c96b62d709abd","url":"build/js/SubcriptionEarnings-pU02gFSq.js"},{"revision":"24d9e19a1cfc0e43d0ffbb0874f5ed06","url":"build/js/Suspanded-GbUNeHns.js"},{"revision":"9d966960122de70ad3e1723b6f706192","url":"build/js/swiper-react-CgIgobDL.js"},{"revision":"30bfdbc9ea692e2cf5a7b0fdb41a1ad5","url":"build/js/TabbedDashboard-CY8ivnNl.js"},{"revision":"5a237878f8dd2d3d497325f2a4cc876b","url":"build/js/Terms-CFERM1zv.js"},{"revision":"7a4da1ca7478b1c363f56f07934c7ee5","url":"build/js/Test-CjXF-LK0.js"},{"revision":"198579a5a0afce9d4ab09eafe7e5ecaa","url":"build/js/TestIntercom-ZKeuht9n.js"},{"revision":"18d2c3783e8ae11b0a115f70f0baa49f","url":"build/js/TextInput-BXjX3foJ.js"},{"revision":"a480dd6231b3da27c9fae379dbbd8438","url":"build/js/TFA-2RMl61IP.js"},{"revision":"171a9f6021219e199c447b33eb5bc587","url":"build/js/Thankyou-B5Mb1ohq.js"},{"revision":"412a351329ad94a9e2276953e793f922","url":"build/js/ThankyouMessages-CTEn6Wwp.js"},{"revision":"2390329c7ada02340037fa8631645e87","url":"build/js/ThankYouRye-DbWBtfaK.js"},{"revision":"409b2209a37ddb1728a8acd0b0b623a2","url":"build/js/TimeFormat-DpuAhh1P.js"},{"revision":"a5f6bcaa00efa4fa24f0829548e1c3fd","url":"build/js/TipInner-Cqf7XOac.js"},{"revision":"4059a4fac70897e66220d21054794f8f","url":"build/js/Tiplisting-BLgUjUSt.js"},{"revision":"02f74ec9a3754c9d82edef94307e52e3","url":"build/js/TipTracker-_G0oIsop.js"},{"revision":"6360ec8c08ba024e15557b2223ecb52c","url":"build/js/TopEarnBills-jbLA5n27.js"},{"revision":"618f559b9694e40d6016dd6c987688d2","url":"build/js/TopEarnWishes-4TjNvUck.js"},{"revision":"1efd66447aca04881017fd42768896a6","url":"build/js/TopSupporters-B8mvdT79.js"},{"revision":"fda9e3d0acc08763c26e755657bbbe7d","url":"build/js/TopSupporters-C_yU6kTH.js"},{"revision":"804d82602210960438e0353c387a4940","url":"build/js/TrustBox-BYzZQI56.js"},{"revision":"3155a0817ec9e4f2367d470f97c1aaba","url":"build/js/TweetNow-z22h7x7y.js"},{"revision":"e6674998a6b0217f2e431db8617598d2","url":"build/js/UpdateAvatar-CmC-6-Yg.js"},{"revision":"8e29698ce0cd7758e453a82ecea0faa0","url":"build/js/UpdatePasswordForm-BenWtlRF.js"},{"revision":"402d72d5a759ed8895be6e54e9e5eec1","url":"build/js/UpdateProfileInformationForm-D8eByxKw.js"},{"revision":"57189fbfa32b948293a6289d107235c7","url":"build/js/UpgradeStripeAccount-AJv-KF6W.js"},{"revision":"c4eb50de5002b85ecfafd552655b7741","url":"build/js/UploadcareEditor-DcUdT1jB.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"fd94fef2edf618c34a6c982dc0094911","url":"build/js/uploader.module-CNl5wRnH.js"},{"revision":"c6cde02c0d949020a29040be3b2a604b","url":"build/js/useDispatch-BPBMtssE.js"},{"revision":"3e06d0a18836e33c3d69b474deaba5a6","url":"build/js/UserCarts-C-VsRsAl.js"},{"revision":"9606bcd9412d8289ba42e6ad5b3cfbd2","url":"build/js/Userprofile-C_V177FW.js"},{"revision":"7118d81dc1eb8389c48edcc5fbc84c36","url":"build/js/USTERMS-maFCq9sw.js"},{"revision":"81c7ec2232f8e34e78b2b01d29e519b7","url":"build/js/vendor-inertia-BWn82-90.js"},{"revision":"a9360158ef0d42d9e2c1dbe36c591a55","url":"build/js/vendor-other-hXv9rrXh.js"},{"revision":"e278c4189cc729b29d464f84634a3231","url":"build/js/vendor-react-CjnVVPN3.js"},{"revision":"0298c1416de536a8ccde02ed1947acd9","url":"build/js/VerifyEmail-DpwPEQWT.js"},{"revision":"8e9582cf1ba7ad57fc23afe3dffb7887","url":"build/js/VersionUpdate-CWi_mIQW.js"},{"revision":"f1400ed4ea200b538024dc9e5149eb84","url":"build/js/VipSupporters-Ckdcge4b.js"},{"revision":"fb0472d1855979a8cd25da6b644246f3","url":"build/js/Welcome-J3Tj6rRe.js"},{"revision":"bb0999737f4a9f942bfdea7f414f1f8b","url":"build/js/WhyLove-D9z3VPDh.js"},{"revision":"0015fc0c533ca17974e6e133498a2457","url":"build/js/Wishlist-Pssiu3e2.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"31fc29637c9bc9fc6248ca1bbaa7ac07","url":"build/js/Wishlistbox-e5aXs9mz.js"},{"revision":"b9ddde70da81728ab8d6e1479ee23e47","url":"build/js/WishlistGrid-CzzBD9BS.js"},{"revision":"b446a06fe464d875153b965c6c474631","url":"build/js/Wishtracker-D4R4rCJt.js"},{"revision":"76d238a530e989199a720df576fbfdf9","url":"build/js/Works-CxkQ9dTQ.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
