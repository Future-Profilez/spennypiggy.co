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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"e53b5ab7bf27d2ac0080cd18562557d9","url":"build/css/app-XUaoN_SA.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"45687dfa97935d1389a82ad35c0420fb","url":"build/js/404-1OPhLF9K.js"},{"revision":"cda97667a7f084d3db2d467201e88207","url":"build/js/Accountsetting-DbXCg_zk.js"},{"revision":"998cb37406ba87d13677823c81a4396b","url":"build/js/AchievementSystem-CbFK5-Ok.js"},{"revision":"ccad577850ba9e875d9b4caf79f83f88","url":"build/js/ActionRequired-Ccm_6lZw.js"},{"revision":"35cf5e3d216d8af3ff1edc93a46bb06c","url":"build/js/ActivateCard-C69p5ZRU.js"},{"revision":"8d5502dc0d0822afd3bc994439d52fdf","url":"build/js/ActivateSubscription-DPJJe-d9.js"},{"revision":"2f3de8f6a9a859a6758d24929e95fba0","url":"build/js/ActivityStatus-DP0WkyAP.js"},{"revision":"6d9bcafb8877d1771ec6a0d9ee37575f","url":"build/js/AddBills-BZV26Grx.js"},{"revision":"58c13a9918eda9d08881bcf2a75c9e8d","url":"build/js/AddCart-B4O0m8JQ.js"},{"revision":"2b3e51916e697bb1265c9c0649e26e70","url":"build/js/AddComment-DLUOjKj_.js"},{"revision":"d6d851060614f875297ece6bf709c6a0","url":"build/js/AddGift-CkkGZPeR.js"},{"revision":"5b8465c89aefab64a984c56b02d683b1","url":"build/js/AddGoal-Cd3IaQVy.js"},{"revision":"53b356be90c1b26b8b1b9777558399b6","url":"build/js/AddIntro-DVHAZp8L.js"},{"revision":"bb7dc2d15d562d52af5a5980f39f86ff","url":"build/js/AddItem-BjitcZxq.js"},{"revision":"5fdadd4240f77ca4a661f9d6af2904a1","url":"build/js/AddMembership-WE6EX9Q0.js"},{"revision":"0bb7dcc3597334ea359c7c4cf852c630","url":"build/js/AddPost-BRRhI1U4.js"},{"revision":"646b45bfd0cfee53ae30104b98c8f851","url":"build/js/AddressForm-khypJ_OS.js"},{"revision":"a37c4c6d7363768b26e42992a46efb9a","url":"build/js/AddRyeProduct-A0YoT-af.js"},{"revision":"a180006b0ca93c451cbbe5bf8e996529","url":"build/js/AddShop-CNYJ7waw.js"},{"revision":"5396ddbf2d64c48442f97c723222ae72","url":"build/js/Alerts-DUvHgnyR.js"},{"revision":"b285c9fed1b23bcbb95c6a054031e516","url":"build/js/AllCountries-ZbH1kONC.js"},{"revision":"1ff4ebb3380b9b1c2b91e3f64ff0be56","url":"build/js/AllWishes-DLBqIWCQ.js"},{"revision":"8104a2568353ec84b68bf96fef03d4f1","url":"build/js/app-Ct1z6ZfF.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"228daf003157626609b60584fd4abb6e","url":"build/js/AuthenticatedLayout-Xd3WKQ2B.js"},{"revision":"8152616a8bb6b7e71f5d8e9299af6822","url":"build/js/Avatar-D82aLElz.js"},{"revision":"6ba1ecc87727f4158a1362435546a8a8","url":"build/js/Bill-B3-a2Uky.js"},{"revision":"2eda6ebb366c31ebedc42a8ee86a083e","url":"build/js/BillCheckout-BTIMGpGd.js"},{"revision":"1bae1eb6ae65672f98714fc2fbd238cc","url":"build/js/Billslist-BNdT8zqV.js"},{"revision":"c587c1ab7cf033ef3e4ed65014fb3c42","url":"build/js/BillsTracker-BjqklZdB.js"},{"revision":"9b42468d0e4183cce6481facc0c086f1","url":"build/js/Board-DJ0lyJjr.js"},{"revision":"8683f9b0d1dfb304e8dcb1d57bdf7eec","url":"build/js/BuyShopItem-B-iA5a7E.js"},{"revision":"9de1b30effdaf23d91d78264cce75d12","url":"build/js/Cart-BWbsVC1F.js"},{"revision":"5052c677a89c43559173f13cea825ec4","url":"build/js/CartItem-EdRFqnjp.js"},{"revision":"6aa18b60d199d886395cbf5826bee86a","url":"build/js/CartItems-DFAPO3_q.js"},{"revision":"e18a9cedd23ced6724d0db9853d2a694","url":"build/js/CartListing-BXebIa_J.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"348f9214464c6741c528938c69fc983e","url":"build/js/CategoryLeaders-DtY2UUEb.js"},{"revision":"e5b307ce5a9e95b0a530fb81abc6169a","url":"build/js/ChangeCurrency-B-ctJZdi.js"},{"revision":"be3629813ed1bd92efe893272304cd02","url":"build/js/ChangeVat-D6pBy9h6.js"},{"revision":"5ccc9a0385376b965cacaf148506d10e","url":"build/js/ChartDashboard-_DG2ZZYJ.js"},{"revision":"cbc2d634784219fd030c4c19876e633a","url":"build/js/ComingNext-CDCcwSUc.js"},{"revision":"f89a2070cc791c637aaac3ba1f003f22","url":"build/js/Comment-BegJhT8u.js"},{"revision":"f9f864d47acd24363a3a2122f63977ca","url":"build/js/CommetsLists-BZ-3jAVW.js"},{"revision":"9b5c5ee9ef3b57a0816b8e6efe638a5a","url":"build/js/ConfirmPassword-DkxA0CwA.js"},{"revision":"bda49f668c237b417ad481b69b775bc9","url":"build/js/Countries-DF8qCi9E.js"},{"revision":"0e8524e5da53784ac2c5e6defbcd71c5","url":"build/js/CountriesShipping-DwILn9Hh.js"},{"revision":"28aaa0f93b6ae9f9babf3bfa4cc64625","url":"build/js/CreatorActivityWidget-DxnDqyTQ.js"},{"revision":"da032db43cb45b291d9315a3d270f00d","url":"build/js/CreatorSubscriptionWidget-CNE0vtiG.js"},{"revision":"22e264e525a5130d993018143ce4b88a","url":"build/js/CreatorVerification-CyX186LB.js"},{"revision":"7e15286b740cdb70e0aa830fc30882ee","url":"build/js/CreatorVerificationNew-8z3X3TNB.js"},{"revision":"1ff72d607f3048824caee773bf1bd19a","url":"build/js/Dashboard-lls4Ntkb.js"},{"revision":"ae41f9c457bd2edd9b3dc3e05fa474a0","url":"build/js/Dashboard-m8mZCpde.js"},{"revision":"08df6510c3a52e0cc3475434144ce2f3","url":"build/js/DeleteStripeAccount-Bp2ar3ES.js"},{"revision":"85313cbdb182491784c8520fa02dcde2","url":"build/js/DeleteUserForm-AU2sHMSr.js"},{"revision":"b6ae8e7b3e7ddab2ddc634cc8b166731","url":"build/js/DiagnosticPage-B3xr5W6h.js"},{"revision":"45308be61b4e96f5eae15069cbe54cae","url":"build/js/Discover-Cdx2VKWH.js"},{"revision":"fd6cdbaffc8e44c992eab988cf53adae","url":"build/js/Earnings-Cq5TJKoK.js"},{"revision":"c1bff6f08a1f7c23e60181ca52fee783","url":"build/js/Edit-CLgGe_Y9.js"},{"revision":"eb9cd64a838830eb1d43415968c8c263","url":"build/js/EditCategories-DjHE40TF.js"},{"revision":"9d44ef2f7efa51370bb73073d606866e","url":"build/js/EditMembership-dmSgHMH4.js"},{"revision":"f9c3ffa57e9037d7846f043bef58a00b","url":"build/js/EditProfile-BOKlXk93.js"},{"revision":"dc80a53fdb29e690cf9a27c4616dd010","url":"build/js/EnableCardCapabilities-ColH66WQ.js"},{"revision":"c346baec44616d6ffdd52b32e6252f20","url":"build/js/EnterOTP-BjtSxU0Q.js"},{"revision":"d25d7356f4e639af8f22fcbdcd00eff2","url":"build/js/ErrorPage-Dioqouaj.js"},{"revision":"fa5d7ecb63a050ccfc2284196940f062","url":"build/js/FAQ-D3y37-Vp.js"},{"revision":"15b53a63b41aed2beba1adce1f987bf8","url":"build/js/FeedList-BdS8esFO.js"},{"revision":"9c107bbf4f496809728ede9fcbbd53d9","url":"build/js/floating-ui.dom-DovVNVmw.js"},{"revision":"ab8e75d4e51d5445e91218d38db42088","url":"build/js/FollowButton-BRmybKaE.js"},{"revision":"1c96ec01ac41548f32b2c927354c2a19","url":"build/js/Footer-C9iMRsFF.js"},{"revision":"4b79832f1b0cd9dabff2aa3c93c002a3","url":"build/js/ForCreators-PRzui1Jo.js"},{"revision":"871cc177fe5cdccc6d4ddbebba5c9c6f","url":"build/js/ForgotPassword-BqzSdiiW.js"},{"revision":"1123d42b327a034ca9771e3f37761d67","url":"build/js/FunPart-B4kK9x33.js"},{"revision":"a3a1496b4b40b886f1bcccc3401454dc","url":"build/js/GetCart-BV-Wfdco.js"},{"revision":"fa3305d9831b156adae7172de8626d7b","url":"build/js/GiftAddCart-BTgKbZEh.js"},{"revision":"30788b2826d1b1d7f8a4a33f5eaee44b","url":"build/js/GiftEdit-KWwsPVTA.js"},{"revision":"869b31b1a1a054da7a8b9ebc84208d4b","url":"build/js/Gifter-C8fAYMvJ.js"},{"revision":"98c6be12b1b6f7b8504b55a53ea74ab3","url":"build/js/GifterCardVerification-qw3A2rob.js"},{"revision":"ce754839767d8e0412c0f3476b232664","url":"build/js/GifterFeed-Baq4T1JM.js"},{"revision":"1c609ce6ad30549775c28372e912857e","url":"build/js/GifterItems-BgsmpN_N.js"},{"revision":"07a5513cf15dcb3b6df3deea07bdde32","url":"build/js/GifterMedia-DAiM4YdN.js"},{"revision":"12e474c7f73de19be9c1fe620201dfdc","url":"build/js/GifterMembership-BPCVvPJ9.js"},{"revision":"fbcc3aa705ee2604f696ee500f104fb4","url":"build/js/GifterSubscriptions-D_IUeVZZ.js"},{"revision":"fbf7f73d8be0d60b0119312c71c01080","url":"build/js/GifterTips-DOcIYrd2.js"},{"revision":"18fe52eae67730ad7ed521d734cb547a","url":"build/js/GiftListing-ooNF4zZJ.js"},{"revision":"da7ede089750d0a0244ddd0000757b3d","url":"build/js/GiftStore-CK8hD1Ax.js"},{"revision":"fae35e0367f03bf304b714c545cbeabc","url":"build/js/GlobalCheckout-CWsQzSCh.js"},{"revision":"0fc5ea05b7daea6d386d76fe3255b3a9","url":"build/js/GrowthTrends-nH6D-W8r.js"},{"revision":"2cea4cf8967866ad244dedcf3288d3e7","url":"build/js/GuestLayout-DOJ4mz0j.js"},{"revision":"fb94fa8df10d226aa36fa44095bbd3c7","url":"build/js/HappyCreators-DN0QUEST.js"},{"revision":"12fd69f74ee11eba6bdb4fc517ad8aa4","url":"build/js/Header-CQssDsLH.js"},{"revision":"1ab622c758c7cf92fb1d5e2ac46b4278","url":"build/js/Hero-ChI9qLVe.js"},{"revision":"9cafefdc97298e4a8e51e001fa987c78","url":"build/js/iconBase-CnPoyA5S.js"},{"revision":"0c267266ba7b4184eb7af4b4350631e9","url":"build/js/Icons-Bn4KGhf4.js"},{"revision":"d12489ea06ac3ec420d000a57d4c8bc2","url":"build/js/ImageGenerationWithAI-Bm9pYgnh.js"},{"revision":"9331662e9896f3ec989af81f5562b32f","url":"build/js/index--jsOGrrD.js"},{"revision":"04d278238088e0dc2ebd05b2870d5f37","url":"build/js/index--sbBvyZf.js"},{"revision":"4688ff12e12d4d5ce099f867dcf75358","url":"build/js/index-B1sup4xW.js"},{"revision":"2086eb863028636722411b2705926454","url":"build/js/index-B858jvig.js"},{"revision":"fa57ae40143cc59da52657c0280b14b4","url":"build/js/index-BaPSiLiq.js"},{"revision":"6d295c5610d374420df396a1f257f608","url":"build/js/index-BoatWQm7.js"},{"revision":"33e8be4fb4c51020d632b079daaed877","url":"build/js/index-BoJG4RSA.js"},{"revision":"650eba58835a0b82f55eb26abb13f7f5","url":"build/js/index-C8BQZCVw.js"},{"revision":"e3de6a4e53c126326e6070fe4ed5f486","url":"build/js/index-CHJ4pFf_.js"},{"revision":"0712c3723cde3005154b895eb8e48400","url":"build/js/index-D4HYrip-.js"},{"revision":"0be52f54e12ddbd1a5df4b9c2c94dfce","url":"build/js/Index-DEsZD3do.js"},{"revision":"760a6fb5d3ba118caf8d5053ecb0cfa6","url":"build/js/index-DM_8LXV5.js"},{"revision":"2880cfd5f135992e623c74f5a0b545b7","url":"build/js/Index-DsO__Iwk.js"},{"revision":"aecd341d661f8e18390c205f24276998","url":"build/js/index-DtQKX-sj.js"},{"revision":"f4ec281a0a16aabd4d3204fff0072e63","url":"build/js/index-Dwnn-9Ja.js"},{"revision":"fd3b64c0a746b8bacaca142425a80a7d","url":"build/js/index-DYOjwQUr.js"},{"revision":"01aefde4121e6584a288eaaf20e8395e","url":"build/js/index-lmuvmiuC.js"},{"revision":"2766dd7924f1cf12e3006172a5b2d0d6","url":"build/js/index-OlUr_d2E.js"},{"revision":"b3b6bc0547bca846b0aac781570a8542","url":"build/js/InputError-UB1BaIAK.js"},{"revision":"24403a9e22b6303b3cdde3a582d75f28","url":"build/js/InputLabel-CGbX7wSX.js"},{"revision":"2a5389e7d208af66559a9fd41c7e75a3","url":"build/js/IntrosVideos-guiCNF6Z.js"},{"revision":"3a1c146770a710b840a9a6b617624666","url":"build/js/Item-BllYP2hD.js"},{"revision":"67e4befa91e206a3b39bee0a2c4c62cb","url":"build/js/JoinUs-DQKCktnC.js"},{"revision":"9c12d6cba3cfdb078ad210faa6bf6d7c","url":"build/js/LeaderboardStars-X-wmvb01.js"},{"revision":"687a6f23d3270b1056e473add3f7fe48","url":"build/js/LineChart-BBclDv-5.js"},{"revision":"53f3eb779f8f856c2d24d868259a21db","url":"build/js/LinkTwitter-Deg4ka8U.js"},{"revision":"14b503bb567ce51393f40d2dd580795d","url":"build/js/Lists-8DYDOvTq.js"},{"revision":"324a803c0167651fdf53baf0bbd50186","url":"build/js/LiveBar-B_FZhW4e.js"},{"revision":"aecec006c83ba0badfb4a65010ddef56","url":"build/js/LiveBarSection-DCTuCCqH.js"},{"revision":"4c057d12a21b6ebb2161b57dcf6e70c6","url":"build/js/LoaderButton-oa7Ey3PI.js"},{"revision":"b4bade432b6c934f155afad2efaa28a5","url":"build/js/LoadingScreen-BLQZJQ1S.js"},{"revision":"271d1a587596e93467e30a49b7579c48","url":"build/js/Login-DX9OTNT0.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"6ab34bbacce61e5c0c013f637921eab6","url":"build/js/MagicBellNotification-B-b50aZv.js"},{"revision":"199b1bbc98dfebb0f9219bc63de3f221","url":"build/js/MagicBellNotificationDisabled-DY9Hh0eE.js"},{"revision":"085fe18bd9205605ce358710497b3eb1","url":"build/js/MemberCheckout-Ch-OgkWn.js"},{"revision":"8cdfec575db35ff46422b29ae1b41f0b","url":"build/js/Membership_dashboard-C23Bg26M.js"},{"revision":"9aca3c6d949bfc9dc65cffd56a75c703","url":"build/js/Membership-C5fPvZII.js"},{"revision":"d4ea806aa48a0347c166980948939d1d","url":"build/js/Membership-swNqg4N8.js"},{"revision":"59a021f869d64302fecd9c4ba8ad5237","url":"build/js/MembershipLists-9K5RX9UL.js"},{"revision":"0a2c2e9cec6bac5a0638674b0d13c47d","url":"build/js/MembershipsLists-DPK2ePLR.js"},{"revision":"c8bf9ce7b71b0f85d8a3a885d47480e1","url":"build/js/MembershipTracker-DREM5eVK.js"},{"revision":"735448dfba30fc377000497c49292971","url":"build/js/MonthlyRevenue-DkUDoIiz.js"},{"revision":"aca859ddbb0f0423a0ebf17056a3da7f","url":"build/js/MyGoal-DRmct87c.js"},{"revision":"d29a16649a04df7f504e455c121fdd62","url":"build/js/MyShopProducts-DXto0m87.js"},{"revision":"8de44d4e1a991cbc96da9bffc3f38268","url":"build/js/navigation-rbxnjogb.js"},{"revision":"3a22f86b127c44f67d0fe70f07fc51a9","url":"build/js/Nocontent-DACsjJGo.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"b367cdb751427104361b73388f9f7d59","url":"build/js/NotForBusiness-DVmd84Hs.js"},{"revision":"b7a400dcef7622a10a9c5efe7dc93216","url":"build/js/NotFound-CBxLYRUZ.js"},{"revision":"265b56c77add81eb34866f59cb4e4788","url":"build/js/OldSubscribe-CRoGvbja.js"},{"revision":"59cb4ffc398c832928569b6a03737286","url":"build/js/OrderDetail-CHHPlEy_.js"},{"revision":"61d2cf7232eafca77bb6258af8334e9e","url":"build/js/OrdersLists-CFUYBQN0.js"},{"revision":"4644de1084c8a8178baccd31d42de581","url":"build/js/pagination-CxmRT4Kh.js"},{"revision":"4debf760dd8bde516b06e6d56f845209","url":"build/js/PaymentDashboard-CbMk8fog.js"},{"revision":"8ba8c9925e1ce15baa75d28ecf404d05","url":"build/js/PaymentSlider-CRUZu-Fc.js"},{"revision":"34402038efcd9335fdf15ce9b51c9228","url":"build/js/PlatformAnalytics-BscAKHQW.js"},{"revision":"4d66e8fa085d8f113e67c848c62ccb1b","url":"build/js/Popup-BMP2WpWe.js"},{"revision":"8ffec59a3b6e45feac12a07cff89362a","url":"build/js/Post-DWc2k1bO.js"},{"revision":"2560147a04a295f1c433340c8039d719","url":"build/js/PostLike-CWnng8vy.js"},{"revision":"e96480f24b9953d8801a9921c43022dd","url":"build/js/PriceFormat-DcrxQv2K.js"},{"revision":"9e0acbd43d8a7cd792ce52e8f006b617","url":"build/js/PrimaryButton-CyIaaKdW.js"},{"revision":"744564f9a91ad264f134c7048b20d0ee","url":"build/js/ProfileProduct-B6PFFz6s.js"},{"revision":"2c63e6535e8e7a9b214f5f9299f35a34","url":"build/js/ProfileProduct-Dv3vUo5R.js"},{"revision":"c76840e29d9918f99a2a198ad28d5a1b","url":"build/js/ProfileProductLists-B5l7kWhN.js"},{"revision":"d5f3180039f9077f3f4fecc87e97dae8","url":"build/js/ProfileProductLists-QyBHdXyz.js"},{"revision":"b2fb7b40b03657edc90058fea4115a5d","url":"build/js/ProfileSteps-CQtKDzRw.js"},{"revision":"745066b2067ca23a636e8815c2f1c233","url":"build/js/Promotions-De3R-J8W.js"},{"revision":"769a81e032dcde7b6d65ba49efc4d632","url":"build/js/PwaInstallPrompt-B_301Q2m.js"},{"revision":"9728fa891d1612563d0a2dbce6a8455f","url":"build/js/PwaTest-5i2kS8nb.js"},{"revision":"cd48e6900cbf8865de14a1025c6c85ed","url":"build/js/react-select.esm-BCttZnYv.js"},{"revision":"9b40c642c674a55b7b11bad537605b08","url":"build/js/RecentSupporters-CtW9gP26.js"},{"revision":"9ae8fc47acaec08c8285d8d62941a130","url":"build/js/Redirecting-DmEyudGP.js"},{"revision":"35bfd5dec8f287074a6cf27e5ab06fbf","url":"build/js/Register-C2f40S0w.js"},{"revision":"efd07818fe9f38a3a647cb90d011ef5f","url":"build/js/RemoveBill-CFL7-9zB.js"},{"revision":"001d0e56a93583fae7bdac1493356f34","url":"build/js/RemoveMembership-B0DjO0Dq.js"},{"revision":"6658c927835b3e9e3073a5da887d4ef5","url":"build/js/RemovePost-GEovuD1S.js"},{"revision":"a21b0ea109cfe7e28890606ae8b31185","url":"build/js/ResetPassword-jRfx6Joi.js"},{"revision":"3a77144b3fabd4cd443d36590a3c610c","url":"build/js/SafeTransition-brEP_zxB.js"},{"revision":"5ee0646512fd3a418651c8f18fa4e894","url":"build/js/SayThanks-DYgp4j_j.js"},{"revision":"23f7c35945a3f7775ce4baf1eca68ff2","url":"build/js/SecondaryButton-BZFzgoOD.js"},{"revision":"dbee82b033735ca04cd263b5daef2399","url":"build/js/SendTip-DOMqIiJG.js"},{"revision":"0e99109baca6578b9719bfb2cc010234","url":"build/js/ShareProfile-DMCbV0oe.js"},{"revision":"12b863ca82e4ccf456d2060afcdc9e7f","url":"build/js/ShopPage-DCeht1h6.js"},{"revision":"8a8cea16ad2d6d5d733cc61b773145c5","url":"build/js/ShopTracker-GMjtkYHR.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"bfe9087a4857ffe8a4509782ccdcff87","url":"build/js/SiteSubscription-C8WWWB8L.js"},{"revision":"990b4d57a96968a25a74151cfc2a6959","url":"build/js/Social-DXwcRuKO.js"},{"revision":"b241de96522d3bff5e53620824885eed","url":"build/js/SocialLinks-Yoc2oCdQ.js"},{"revision":"eb8adbd5a760901623eb62683648434c","url":"build/js/sortable.esm-DM0h8-_a.js"},{"revision":"2a1f534704d1c750bb1fcb00044e0525","url":"build/js/Stripe-C0Ez8bEM.js"},{"revision":"1db0fb75a6811e5d45a812f903727eae","url":"build/js/StripeIdentity-DlgYez4d.js"},{"revision":"936c0bc40f26ee06e484ef52687b9124","url":"build/js/SubCheckout-CsWdxkvV.js"},{"revision":"25cb793900474ff1e67aeee45af30790","url":"build/js/SubcriptionEarnings-glyCaWZ0.js"},{"revision":"16173a43388cf1fa933ad0da8543dcee","url":"build/js/Suspanded-DM21OE7e.js"},{"revision":"ae3403c88eb71f89bb2110c32d5f2182","url":"build/js/swiper-react-Wo5traW6.js"},{"revision":"45321e068fc62e79498b495d2e0db047","url":"build/js/TabbedDashboard-DWJbjAni.js"},{"revision":"5b214264797dc57a48ceadec36138343","url":"build/js/Terms-BRsBlYfT.js"},{"revision":"902a56316cb32c705b4fd6be43baf7b2","url":"build/js/Test-iMHRW7LH.js"},{"revision":"3ef48ea18693d5534803ac01cba1515d","url":"build/js/TextInput-00jn5yUG.js"},{"revision":"1aaa8e9d3e7095ab5cb934c057e44cae","url":"build/js/TFA-ONWA49Y9.js"},{"revision":"77db06e6cad3447802ffbec923481da2","url":"build/js/Thankyou-CsWr03Hd.js"},{"revision":"dced6ea722b214a61803af913f79ef2e","url":"build/js/ThankyouMessages-CH-e-K4H.js"},{"revision":"cf1acb88da2e13d9e8c6bb03ebae2be8","url":"build/js/ThankYouRye-DtHnAzH7.js"},{"revision":"3eacb2078b486d827ba7937f4c4d596d","url":"build/js/TimeFormat-CIuy_OUI.js"},{"revision":"d3e0fa75cc5f4b2553c1143d3246ebcd","url":"build/js/TipInner-XAknhB69.js"},{"revision":"608d7d9d3fc1aaddb141e3b04d820b92","url":"build/js/Tiplisting-C7iP5dH7.js"},{"revision":"29a84b47ee4f037616729b4c3d661498","url":"build/js/TipTracker-CDkLeHN5.js"},{"revision":"00ace2f08623cdc5c2750b56ed6e685b","url":"build/js/TopEarnBills-5sbYsTLa.js"},{"revision":"dbec41dcd2cfedec4f47f0dfdb00de16","url":"build/js/TopEarnWishes-B1qmmjGO.js"},{"revision":"af36ce8e0893639673b821202643b0cf","url":"build/js/TopSupporters-C9AhbN4k.js"},{"revision":"ed56cbe345954511da6fc7b6b9bc4270","url":"build/js/TopSupporters-DNZuBsNz.js"},{"revision":"8d32d169019453d7a51495b96631d758","url":"build/js/TrustBox-DLSkCR5Y.js"},{"revision":"1e1a1da478488019e154bf8e0b8970a8","url":"build/js/TweetNow-mK_pTErw.js"},{"revision":"2cbc6900d94d9bdc963ed7df902e8d6e","url":"build/js/UpdateAvatar-DzafyXYS.js"},{"revision":"5d5642078bd19254a1b0331e5bd07ea2","url":"build/js/UpdatePasswordForm-ZhPirJqy.js"},{"revision":"03a4103951348889275a3396b922291a","url":"build/js/UpdateProfileInformationForm-DmflBOUP.js"},{"revision":"e3085d71343dd773f8f10802240aeff5","url":"build/js/UpgradeStripeAccount-D8_PwQDH.js"},{"revision":"580f076124839f5903b17db74e34ba0e","url":"build/js/UploadcareEditor-B-xGN92K.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"63a2f74dbcb2982dd2f53a30032d2017","url":"build/js/uploader.module-BixebzEy.js"},{"revision":"7df8468b04dc47bf6d50e93c433273ac","url":"build/js/useDispatch-DrhaA23_.js"},{"revision":"9479d04d31024786a08470cdc245421b","url":"build/js/UserCarts-B3i54Bdw.js"},{"revision":"64bf9f1d318f8b7ac0774ae2df063224","url":"build/js/Userprofile-BwrmobQI.js"},{"revision":"3175defff749e8c384c853f92d2c5aa5","url":"build/js/USTERMS-DhdUrkOM.js"},{"revision":"c143059d7320674ca3813e68e6abce76","url":"build/js/vendor-inertia-fitlqVi3.js"},{"revision":"0f3d6b561872f34a128ff04cb7c55f41","url":"build/js/vendor-other-BkZyLspP.js"},{"revision":"3d8552eda87438036fca24acdc3b46bd","url":"build/js/vendor-react-Bce6zEeP.js"},{"revision":"f8f4a712824f25c2e386693c62570b62","url":"build/js/VerifyEmail-DNrOGc3u.js"},{"revision":"f3b19f8bcd999b5034d443be5719662e","url":"build/js/VersionUpdate-D5Olin6U.js"},{"revision":"19517c6a70bb6ddd91bf47bfe5b8a0a7","url":"build/js/VipSupporters-wJxAXO2a.js"},{"revision":"4615940802d4c1a9c013bbd04723e4a0","url":"build/js/Welcome-DE1Dcem1.js"},{"revision":"0626381c5dcf9e765e01d0c63450b856","url":"build/js/WhyLove-X7Jz6eWa.js"},{"revision":"1786d3f74fc4cf1a18a19a5c47d606db","url":"build/js/Wishlist-CpfaR0ol.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"81366c6288dfe57248c17e0be5026ade","url":"build/js/Wishlistbox-DiwI-ZeO.js"},{"revision":"8968f156b32a177825451b12313283c7","url":"build/js/WishlistGrid-mJx58enQ.js"},{"revision":"30a157fd779a7f616c36d51481af352e","url":"build/js/Wishtracker-lxeDyck4.js"},{"revision":"aab74fbaf717744251651a7510b81688","url":"build/js/Works-DlTCQq14.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
