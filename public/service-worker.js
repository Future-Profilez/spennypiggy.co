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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"f165507ddbd29ce47ec7a3861510f8f0","url":"build/css/app-D0H8k9qz.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/images/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/images/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/images/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"7c7008d5588c0dfc02866a59c203dc9f","url":"build/js/Accountsetting-DEkute9P.js"},{"revision":"d130e30371d8bd5e7b0b19bb79dfec8f","url":"build/js/AchievementSystem-DTtX9NYo.js"},{"revision":"d07e3fb40eda8de30f0c376570826035","url":"build/js/ActionRequired-Cw9GlMsI.js"},{"revision":"63efd5657c05bdc2bdeef811a6821c5c","url":"build/js/ActivateCard-DDpdX_TK.js"},{"revision":"6a9c8bfd115a7a3b61f6ebae2e711c1f","url":"build/js/ActivateSubscription-BUUYBXjI.js"},{"revision":"c83353557ad93956ea6b98b550ad79e0","url":"build/js/AddBills-JjM0cCqY.js"},{"revision":"5b6ada4d347dc1a760e8cbd11decb95e","url":"build/js/AddCart-CD6YHkRI.js"},{"revision":"459055dd7732de05c756258d594d5fe7","url":"build/js/AddComment-BL-hYviN.js"},{"revision":"f4b216ac76e5487f670fcb550671ce9c","url":"build/js/AddGift-JOprB3tF.js"},{"revision":"43a1a05cdd3c895a3d0d5ea889ac9be3","url":"build/js/AddGoal-DBLGgQNZ.js"},{"revision":"30e8f58d350171cf8c61e46321db12fb","url":"build/js/AddIntro-CDFY1_lR.js"},{"revision":"6a50ffda40481788a003fa089c02527d","url":"build/js/AddItem-BUDVVGjR.js"},{"revision":"e39a17330b77b27be2d5bcb32456ec65","url":"build/js/AddMembership-BtUMRhxI.js"},{"revision":"898de7110696828873f2cc009323c224","url":"build/js/AddPost-DJABZpQq.js"},{"revision":"b9ceac860805ec1919363a6c3053e225","url":"build/js/AddressForm-BQdni4ma.js"},{"revision":"00990a451b17d2b2cc0535692ae3d951","url":"build/js/AddRyeProduct-BfraTQzv.js"},{"revision":"43857c51ea836ab719f0bf96682b881a","url":"build/js/AddShop-BLIU-SGI.js"},{"revision":"08753049ff62a91a3facfc28ef56b47d","url":"build/js/Alerts-D1Nq9I7T.js"},{"revision":"d68927fed2b442514efe0b16c69d2659","url":"build/js/AllCountries-LVsNTIps.js"},{"revision":"7aa6a39c586d702378bcdf54381df0d1","url":"build/js/AllWishes-C4-D3Zrr.js"},{"revision":"f0fd7cb78ba4d10ee5297133ef943be9","url":"build/js/app-DYKFB-kr.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"f78105e7adf28008f13741b0c933e884","url":"build/js/AuthenticatedLayout-oAxvdis3.js"},{"revision":"56a1161aa685cfae63b8840475b189fc","url":"build/js/Avatar-B35uf1jq.js"},{"revision":"0179245bd8bb57097d57e7ee9fbc4d12","url":"build/js/Bill-CPGE8BCt.js"},{"revision":"bce667dd15ed889de8a395a95a2d6967","url":"build/js/BillCheckout-FU_ANSHv.js"},{"revision":"cac07198b68ac73c537b03d040a92f5b","url":"build/js/Billslist-C4yMjesn.js"},{"revision":"b72ac1f9ed0006a71a0f37054e9866f1","url":"build/js/BillsTracker-DGkTpRcV.js"},{"revision":"522d0f61959cfccf5da267376575d2a2","url":"build/js/Board-LvoK8KQv.js"},{"revision":"2b5bb538989996f616f5ceeaf4061d22","url":"build/js/BottomBar-fi1ZzKtc.js"},{"revision":"4a5076d2586467c7dec48ee1a57d9f7b","url":"build/js/BuyShopItem-CtNyXz8v.js"},{"revision":"71beb7fd927c9bf7892a860e637d325b","url":"build/js/Cart-CkG9FxHN.js"},{"revision":"8cb47ab8d1c923999f3c124d02473a2e","url":"build/js/CartItem-DhB0a212.js"},{"revision":"21173ce3116403b7e8ee533c75c5d759","url":"build/js/CartItems-_5IOl9CK.js"},{"revision":"e3127075252ad431053d5ad5ac773404","url":"build/js/CartListing-CVqP4hCl.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"a35728e608fcde88646d601d943b280e","url":"build/js/CategoryLeaders-X1Q8aUz3.js"},{"revision":"aeb753b66b96e39599d4e93cc5e2513e","url":"build/js/ChangeCurrency-CtSucYXQ.js"},{"revision":"6f8cd0d718487e1ebd164cb53933abb9","url":"build/js/ChangeVat-DqlNGxya.js"},{"revision":"6bab935870ac9c65c7d872787a7a3841","url":"build/js/ChartDashboard-fIou3nBk.js"},{"revision":"2055bc9661aec5b22a5992affdfb7184","url":"build/js/ComingNext-RHccVCGg.js"},{"revision":"71a87930db211d1637f2e0c6f25b3e49","url":"build/js/Comment-BRznQ4-9.js"},{"revision":"e8967b3b7b3fc8d3044acf5bbc04c287","url":"build/js/CommetsLists-Dl0kk563.js"},{"revision":"337834fe3c7324965d1ea826934b9fdf","url":"build/js/ConfirmPassword-CqKfpMkl.js"},{"revision":"ff471c3e8ffd9b8d9768fa0af684bb20","url":"build/js/Countries-bJ94jijC.js"},{"revision":"89acaea39bae63705b8c8dbbf6a5c131","url":"build/js/CountriesShipping-jXYq7Z3a.js"},{"revision":"f4c469e6d537a47f1d77869462fbc37f","url":"build/js/CreatorVerification-B6D2EhoX.js"},{"revision":"f5a8d723268c231f8c121933ff49bfef","url":"build/js/CreatorVerificationNew-DRx5evhl.js"},{"revision":"210c9c6a54c1bd49916b19e6feb64008","url":"build/js/Dashboard-C6eh3blo.js"},{"revision":"fe64aee22638317dc57021214d3351b6","url":"build/js/DeleteStripeAccount-DFExaNlt.js"},{"revision":"f5d47da9a0a3c77e79d7cb71cebf7425","url":"build/js/DeleteUserForm-BORKj_5f.js"},{"revision":"3cc8bd2008f972b07629016971468a61","url":"build/js/DiagnosticPage-iKESOg9Q.js"},{"revision":"7ff117183bf3262305c2032e4d0a94f1","url":"build/js/Discover-CHyjwQBs.js"},{"revision":"4d653b2e998a07373eb864d4c91382f8","url":"build/js/Earnings-juNSWmQX.js"},{"revision":"be114a62cafd39d993649666c17b938a","url":"build/js/Edit-CjN35zwr.js"},{"revision":"4b3fff545965398fcbedf39688a41bc6","url":"build/js/EditCategories-Bj3uBVPs.js"},{"revision":"7933e3a9adcb304dfc56882b72e11dc3","url":"build/js/EditMembership-Be2k4qnT.js"},{"revision":"ba965f3aa95acc294c85bed2ddb04e24","url":"build/js/EditProfile-D8S-TIQ8.js"},{"revision":"85bd605c0d67b5868a8240b1c431b2a5","url":"build/js/EnableCardCapabilities-GxmRUzTP.js"},{"revision":"0d529af2e13188a47e9e3541022865a8","url":"build/js/EnterOTP-BHNu69bZ.js"},{"revision":"18b503284aadeabfe7e7372c35435dbe","url":"build/js/ErrorPage-D52yjoi3.js"},{"revision":"2fd0e95fa86d051b4e0795a788e69c85","url":"build/js/FAQ-B5U7hu4O.js"},{"revision":"b210ac0af86debed4f85d53d0571e11d","url":"build/js/FeedList-B3zTHn2t.js"},{"revision":"80dc7c238cf6657ba1144951c0635e08","url":"build/js/floating-ui.dom-BQ2rfQug.js"},{"revision":"b969f42fda4803571c1085d5a892d8f7","url":"build/js/FollowButton-HAcSZV4H.js"},{"revision":"5fa364f4cf280d80a3ea836025eb0dae","url":"build/js/Footer-CvYjwsXo.js"},{"revision":"e0a6f48a96feec992f28b58e1e3b2055","url":"build/js/ForCreators-D_bf8Xh2.js"},{"revision":"161426759d0e501aca0c7ae8fa26ed06","url":"build/js/ForgotPassword-_OxJJPjJ.js"},{"revision":"225039e374d1b68dcfb669f5ff9ecd4c","url":"build/js/FunPart-BhdJTXOb.js"},{"revision":"e1bb7731b2385324cf0c0c885d8c6b58","url":"build/js/GetCart-CuXQ_fbo.js"},{"revision":"d347f57f55fec98b434c29373e51abc3","url":"build/js/GiftAddCart-xrQN08aC.js"},{"revision":"d0ebd548cf0d1a68df3a316b9b5b65d6","url":"build/js/GiftEdit-B4mjm9Qv.js"},{"revision":"aec365e82f84f1e9a0dee6b50f732dfb","url":"build/js/Gifter-BlflgX3y.js"},{"revision":"0c35cd1faa89a3890574869ac595cb6c","url":"build/js/GifterCardVerification-dbbWiBHi.js"},{"revision":"91a51f7831c64107bfba84f7e2abc580","url":"build/js/GifterFeed-B8sf6TS4.js"},{"revision":"f11033a4a358ce454a6e8970918f9dca","url":"build/js/GifterItems-BidZMer8.js"},{"revision":"5fb94cee01b3868837de8d4a1ec3481b","url":"build/js/GifterMedia-CeqTTZSG.js"},{"revision":"7f43e1de0d379dd72c999107f9f70fb1","url":"build/js/GifterMembership-aiXc0c_P.js"},{"revision":"d652a760c7c0e31a277060b933b9b89c","url":"build/js/GifterSubscriptions-BLhJxY0d.js"},{"revision":"7974a0cb7b71375acd7bee934f502482","url":"build/js/GifterTips-FdPupUKk.js"},{"revision":"c53ca4967730d83e431bfdfe4481bd10","url":"build/js/GiftListing-Bs-FsAWY.js"},{"revision":"d60f021b33226ad341e64d571f18f604","url":"build/js/GiftStore-CK7Jg0Dc.js"},{"revision":"11f32549c55b3b18f263b28763097368","url":"build/js/GlobalCheckout-DUN6ztXQ.js"},{"revision":"2d2c7a464a592bc320c2b89794cf3065","url":"build/js/GrowthTrends-CQd6CDJO.js"},{"revision":"26bd2507e2210f829de7d51f3fd1d6e3","url":"build/js/GuestLayout-uPpgb1dN.js"},{"revision":"735d8a524a1a65bb26c9482ff1cc6b09","url":"build/js/HappyCreators-BZmPgfQ5.js"},{"revision":"bc39e6fa5ca48926e3f815b7e4a4b4df","url":"build/js/Header-BJlKtenf.js"},{"revision":"55ea6c313cb71044ffdbb3c8f3e892d4","url":"build/js/Hero-BsTTSdoC.js"},{"revision":"4385f100f342435d6c42b220098736b2","url":"build/js/iconBase-u4bnSdnx.js"},{"revision":"3ddf1830c56805dc1f132c060ace9921","url":"build/js/Icons-8UWJdZZ-.js"},{"revision":"53eee87408058e540d26b079c911a703","url":"build/js/ImageGenerationWithAI-DVSWqVuv.js"},{"revision":"a2ad231ebf7b6b45f05eb073ec45f995","url":"build/js/index-B64iTPRF.js"},{"revision":"b1b6ac630baa35630abfadc71f6688c5","url":"build/js/index-B6Kut7UW.js"},{"revision":"16b8ac640fee4260b703033ce2feabd2","url":"build/js/index-Bhb9_Mmy.js"},{"revision":"e259a12e1bf0f5f78fae5f79f66e8ea7","url":"build/js/index-BJz3J6Cw.js"},{"revision":"3e7e52ebf7156826e6ed83e2c2eb6a87","url":"build/js/index-Buu5lhzc.js"},{"revision":"cc0ef98890b73e163cf86a775d7e06c8","url":"build/js/index-C18F0p52.js"},{"revision":"9906b2e091dc6496f0cf5588d6af5261","url":"build/js/index-C2KrQ6f1.js"},{"revision":"5b639b4eef7a3bdeb94fad897dd2914a","url":"build/js/index-Ca0Wt9qS.js"},{"revision":"09adb8a653a4dd59aa93a5f79c6a68ef","url":"build/js/index-CeYw_vqL.js"},{"revision":"faa8358fea0e1bcba9c010de216e1f5e","url":"build/js/index-D3V4Uu6w.js"},{"revision":"2274797ad394dfd32fa924dd90158410","url":"build/js/index-DOs5XGJE.js"},{"revision":"ba7912a90c416f628a2db8c3df5973d1","url":"build/js/index-Dq1HV7Uz.js"},{"revision":"7f55e978b53003cd2eb6c4b289fd527f","url":"build/js/index-hgi3Ucoj.js"},{"revision":"d76c517579b9729db59dba00c41337c5","url":"build/js/index-Q_P7acur.js"},{"revision":"6ea65760af8d97777ba31dce7fcc4f83","url":"build/js/InputError-BcGcqLwR.js"},{"revision":"1616bc8448c456e109603f7ec51ca6af","url":"build/js/InputLabel-BDExbD1I.js"},{"revision":"c56ad02a5dd57b9aad0c05edfa9a4076","url":"build/js/IntrosVideos-TY2dVC1i.js"},{"revision":"4d5110958119d2cd8ae589c8bc13bd11","url":"build/js/Item-2uSA6hLx.js"},{"revision":"a3094b05f21387839903f58df92ce67f","url":"build/js/JoinUs-BqGbnNud.js"},{"revision":"60a62d1c9981dd5b95934e64a39c6051","url":"build/js/LeaderboardStars-yxF3sKxW.js"},{"revision":"cfd89151639895ce2456aa94e732b25c","url":"build/js/LineChart-CqIN9p_g.js"},{"revision":"7a488165c829a8278f2a00ff4ff25fa1","url":"build/js/LinkTwitter-DM8NBd_O.js"},{"revision":"83ef8fc1480f9f7c05278a742893fd83","url":"build/js/Lists-B-WjVNkH.js"},{"revision":"5f37c48f9b619469f915b2717b5b6b99","url":"build/js/LiveBar-BqpxZuUu.js"},{"revision":"4ac478da7c48d13a673be990bac90535","url":"build/js/LiveBarSection-Ca1jbs4N.js"},{"revision":"1c3204be6f97366df0f6d53a5b730201","url":"build/js/LoaderButton-Bi6fZY92.js"},{"revision":"b1535cc1a02df73beed761f9184ec91b","url":"build/js/LoadingScreen-Ek9Uyssr.js"},{"revision":"102c9a12f5a87acf90bd1c281ab1bae2","url":"build/js/Login-luS2Clxw.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"b568eac7012a374dde60b660a1c0fddb","url":"build/js/MagicBellNotification-CurNPoRy.js"},{"revision":"f12450c3aec5c8c3badb1344d386fbf6","url":"build/js/MagicBellNotificationDisabled-PCoDo3AY.js"},{"revision":"82f57e6ea385459868f7e131dd79d49a","url":"build/js/MemberCheckout-BDblqypB.js"},{"revision":"721c89181cd3c462766fa17eebaddb21","url":"build/js/Membership_dashboard-BMs3ru84.js"},{"revision":"47d0e249253d8438f31ffed5826c6c75","url":"build/js/Membership-7yrcssK8.js"},{"revision":"9eb29c252fdf55651c952549b55e22f1","url":"build/js/Membership-C9kUdajo.js"},{"revision":"b822a3e0df6542ec6b14d2bcd63539ad","url":"build/js/MembershipLists-BUjZBrqJ.js"},{"revision":"9907b838d0f46e5afc88b14a0e1a06ee","url":"build/js/MembershipsLists-BeSh_51N.js"},{"revision":"df81f7634452a26b1ccd9fc7a35f102e","url":"build/js/MembershipTracker-BU_lSvpA.js"},{"revision":"bcd490a0a7ebd6d5ed02ccb4808ef393","url":"build/js/MonthlyRevenue-DFIpYMCg.js"},{"revision":"b15e149f3fd8507f218876a395d262ce","url":"build/js/MyGoal-B2hwLyHY.js"},{"revision":"9672f1711b52c7a9e67c5981bc8d6147","url":"build/js/MyShopProducts-VXGimkjF.js"},{"revision":"b3c4ac79a6236d9788aaa36e215d6cde","url":"build/js/navigation-U_BLIYmS.js"},{"revision":"9ebffec50ad2b19368e16007d667274b","url":"build/js/Nocontent-BqMxOlAS.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"96287a1f1b3fd9b994160b1b49828c6b","url":"build/js/NotForBusiness-CJlDHfDs.js"},{"revision":"2af5dda4d2f8211ab0f2fa47e61467c2","url":"build/js/NotFound-BKJFLr3f.js"},{"revision":"ea4182960562f9b58b06581687b1ce21","url":"build/js/OldSubscribe-D9UGGWxz.js"},{"revision":"eab92f0a6cde43c9f890b0d21760645b","url":"build/js/OrderDetail-B-c4fqmM.js"},{"revision":"f1d1fa5862962dab30514da749c0c43b","url":"build/js/OrdersLists-CcS4lx9j.js"},{"revision":"30cb2f5e348bdea63f47595001fb91ea","url":"build/js/pagination-DhoD4xSr.js"},{"revision":"4b6b66a10d8a0cd46115116ecec13ecb","url":"build/js/PaymentDashboard-yUnFCKuR.js"},{"revision":"4b0998472092941057554ebaf8fae45a","url":"build/js/PaymentSlider-B0U2LPvL.js"},{"revision":"b50e081fee2f069185f630480cd45cef","url":"build/js/PlatformAnalytics-Mp9objc0.js"},{"revision":"d15e03a2a7d1ebcbf89a2c99084a9879","url":"build/js/Popup-Lhfm0-SN.js"},{"revision":"05f0f37909d69a39a0bd17a1cbdede34","url":"build/js/Post-gNIVz0uq.js"},{"revision":"67c9cc15815217d183c400ed4e74ba48","url":"build/js/PostLike-C12MQ8e3.js"},{"revision":"5418c348519c2683a5bae4402490ed8c","url":"build/js/PriceFormat-1m5jXkC7.js"},{"revision":"596755dce651efbba6fefbd856989a3d","url":"build/js/PrimaryButton-BhZStBWF.js"},{"revision":"11f14f9d635eb04006732152534c3ac8","url":"build/js/ProfileProduct-4-H9nRfb.js"},{"revision":"51676e456dd4d29d8c5bacf35750d40f","url":"build/js/ProfileProduct-BnEkO59q.js"},{"revision":"90e7d1d55c762280ebb2dfa2e39f95d9","url":"build/js/ProfileProductLists-BJckcSY3.js"},{"revision":"88773f106ab4374057f3e5cb73f45b15","url":"build/js/ProfileProductLists-jiwXuoVV.js"},{"revision":"8f4e18a8f2a2baf3f7d8fa8ab170e23c","url":"build/js/ProfileSteps-DXB6u5nT.js"},{"revision":"31a3a3dc0f74047784dff06c6040901b","url":"build/js/Promotions-BGZSt5ow.js"},{"revision":"39d1f8bfd0723f2eee71f827f8b6c93c","url":"build/js/react-select.esm-BihMXBYC.js"},{"revision":"74fbf49e001436fcdba9cc7dbf4600e9","url":"build/js/RecentSupporters-DhM9yf-b.js"},{"revision":"81a82d89dc56651a09f29cf6ca15b8fb","url":"build/js/Redirecting-DAiSBWD7.js"},{"revision":"345d73413e4ae3511623dd5b2f38d70b","url":"build/js/Register-CROGMK-K.js"},{"revision":"574327e186216b10af442332f2f87e3d","url":"build/js/RemoveBill-iwdCsflN.js"},{"revision":"5e3c4e6f7957e08191f5be75f1a9f421","url":"build/js/RemoveMembership-DIPsI-cK.js"},{"revision":"4ed0e866481bbac769eeb58c9667344c","url":"build/js/RemovePost-D4Q36imT.js"},{"revision":"c2de6d2254e576ba45592d7f89c8d8bc","url":"build/js/ResetPassword-CYhLQQE2.js"},{"revision":"c23318f2b4854fd822ae2a7bd003b605","url":"build/js/SafeTransition-Szwxnb70.js"},{"revision":"380f8366f26dad46be369353f4a7d84b","url":"build/js/SayThanks-CMzeijAU.js"},{"revision":"247e9c57743599e4c7f9e757502cf734","url":"build/js/SecondaryButton-17aVPKQy.js"},{"revision":"e5afc1b631e3ef332d1b3c42e7652339","url":"build/js/SendTip-BqjsjMH8.js"},{"revision":"f8d66bf0e4a1220dec5e88649347c5fb","url":"build/js/ShareProfile-2gsednVz.js"},{"revision":"f896796eac0ab606108baa00275d9e99","url":"build/js/ShopPage-xPdbxBYj.js"},{"revision":"241ad89238c2c62bcf6b2fe036a904d4","url":"build/js/ShopTracker-BHDYAQv9.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"022595f3561b2c7689951160722fe644","url":"build/js/SiteSubscription-CBCXPOC4.js"},{"revision":"dbd57b7b24915e57b8c4e7d91ba2070e","url":"build/js/Social-ChFR7hdc.js"},{"revision":"20572577e747a4f8a0a8d353b924e714","url":"build/js/SocialLinks-BcHVJzrA.js"},{"revision":"d121423d33e4602597bee485bd0c2a41","url":"build/js/sortable.esm-Dpr8QPeZ.js"},{"revision":"feddebc3c2f8e2a1b4db3f74b74f462e","url":"build/js/Stripe-B0yIP3Ug.js"},{"revision":"4b4ee809f537a7b2a149ad55d7289b2a","url":"build/js/StripeIdentity-DOUOVl1F.js"},{"revision":"17d502794af7910ed59f96b0b9cb2b85","url":"build/js/SubCheckout-fvGwV4sj.js"},{"revision":"ece835ca26598239fb6f8f3958314307","url":"build/js/SubcriptionEarnings-B8WTRC4R.js"},{"revision":"712c395f49b979033426ec61ab6921f5","url":"build/js/Suspanded-Ws2u-RHw.js"},{"revision":"32e558976a2bc57f40afb1eccc0309d5","url":"build/js/swiper-react-djSt03Go.js"},{"revision":"c857f06f8999d6c83f76d06a10b3b98e","url":"build/js/TabbedDashboard-CMdc4JkL.js"},{"revision":"4aa733b63055b023fb711953e8c1baa7","url":"build/js/Terms-B2ouyk3L.js"},{"revision":"7562ce599a1b39dda6927e04b62dd27e","url":"build/js/Test-BYeWySrA.js"},{"revision":"6f64f459d238bbc06235e24a98c9e45a","url":"build/js/TextInput-CZQDHgqz.js"},{"revision":"fabf2c2ace7d58e503b75b5a99d0dc99","url":"build/js/TFA-WwUknV9k.js"},{"revision":"4bb63d1fa02c150f650c4187412c8905","url":"build/js/Thankyou-ea1WUADS.js"},{"revision":"48cf1b9d25ef5016ed9d45e5c3ceae59","url":"build/js/ThankyouMessages-jl8v03Yq.js"},{"revision":"6b86abda31a74521ec97bed2951af779","url":"build/js/ThankYouRye-BoiYH0_w.js"},{"revision":"aa64836b11a68cc5bfa5222ee6f5235a","url":"build/js/TimeFormat-Dgu9-mXH.js"},{"revision":"cbd58894884dfec57dd02b46dfae5d15","url":"build/js/TipInner-CaTjQ9Ve.js"},{"revision":"760d85d91ef680bbcce2756a95733883","url":"build/js/Tiplisting-DOh4Uyq5.js"},{"revision":"14d7b25c2696d53086a973b27f4c8d5c","url":"build/js/TipTracker-CjNOYjRa.js"},{"revision":"e27dcf7fc519320e8ca78f41f8f4ea5f","url":"build/js/TopEarnBills-DzLxx322.js"},{"revision":"24dd8e814ef3af3b93a62e03a6a14cd0","url":"build/js/TopEarnWishes-Cq0wFNes.js"},{"revision":"675afd509df63d482b05aca0c882d95e","url":"build/js/TopSupporters-CKKUShFp.js"},{"revision":"1cb5a58f99496ae698eae0fcd579ee6f","url":"build/js/TopSupporters-RBcJjHnF.js"},{"revision":"a9e25a7d27677b395d627f2f9d3c024e","url":"build/js/TrustBox-B7Ks4hz3.js"},{"revision":"e3e4f98b7c537f14c4f48c72c8c6d096","url":"build/js/TweetNow-Bk8l86ss.js"},{"revision":"8314915c8c4a1c717f7d0d7059ac38d4","url":"build/js/UpdateAvatar-DdpTLxtQ.js"},{"revision":"a1acf02bc892809f6dc7e55abae493e2","url":"build/js/UpdatePasswordForm-CBpnrZD7.js"},{"revision":"2614c7e8a1e3266ef25ef5c50b82447d","url":"build/js/UpdateProfileInformationForm-D1hClgtF.js"},{"revision":"2e985ceadf775cd166412acc312f3370","url":"build/js/UpgradeStripeAccount-CSHBlCQD.js"},{"revision":"25afa079633fea3a6fb2aabf801d1f11","url":"build/js/UploadcareEditor-B8yHVR97.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"b6d07f7ede0eac5c2baac4f7db6ab22e","url":"build/js/uploader.module-Bo9xnzy_.js"},{"revision":"7eaad169ab34a282a8b2c4a08d3113c4","url":"build/js/useDispatch-7C91XwFO.js"},{"revision":"381ddff2820b5ec991a926779d36640c","url":"build/js/UserCarts-pmFS8CSr.js"},{"revision":"b43da0956fcaf5f01819c31ef7867fe2","url":"build/js/Userprofile-B_ZWTmxX.js"},{"revision":"4aa733b63055b023fb711953e8c1baa7","url":"build/js/USTERMS-Cs0bv-z9.js"},{"revision":"5835a01dfc96c8480a2382b18c8bf235","url":"build/js/vendor-inertia-BFlkdK8-.js"},{"revision":"abf4e07021911a99ec7e4362269e3448","url":"build/js/vendor-other-BplRC7BX.js"},{"revision":"27957d80174ee82bb9061417dc4ce7fb","url":"build/js/vendor-react-AcILzlX6.js"},{"revision":"73dd633571653027f775bb23f73701db","url":"build/js/VerifyEmail-V4m-L2rN.js"},{"revision":"271baee06d6a828660e4cdd2b73d029b","url":"build/js/VersionUpdate-B76-_-8Y.js"},{"revision":"fbea88bcb16c62357751cc0463cd1796","url":"build/js/VipSupporters-CPBGTNtZ.js"},{"revision":"6f5034f3dbebadd73e5da86f6c7a97f8","url":"build/js/Welcome-DLbp5F5N.js"},{"revision":"6d2b6808ba84524563e9b7ea18cc8a13","url":"build/js/WhyLove-aaBIWRWy.js"},{"revision":"e5b088d806468b5bbf40f5e8bbb87f11","url":"build/js/Wishlist-5J2Lx43k.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"0e3900b8da757cabc09f38e07cae99f1","url":"build/js/Wishlistbox-DegUv7HJ.js"},{"revision":"c3485297b78ccb68e8c5cd98534502ce","url":"build/js/Wishtracker-qc5snnee.js"},{"revision":"87f8066dec5b1253e5b7cd99a57124c3","url":"build/js/Works-BnR-G_Je.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
