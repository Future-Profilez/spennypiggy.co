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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"a8eb7403a7253a73de2d5f47baa03b21","url":"build/css/app-C7-7P8DR.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"74eac91a84096dda36c6ea70eb68807d","url":"build/css/uploader-DA0FOkb5.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"8c7e681f782df36331fd3a6edb7247fa","url":"build/js/Accountsetting-CGoSvSKz.js"},{"revision":"c0a366af89151bfcc5405b14fe6dec26","url":"build/js/AchievementSystem-CQFVjYHU.js"},{"revision":"aa7c0276da5fa1a2995869bb0b0df177","url":"build/js/ActionRequired-ai6U_RKv.js"},{"revision":"7fbf4843125a4c8e698cabd7907d14f2","url":"build/js/ActivateCard-CgbV3v6A.js"},{"revision":"74d7328597d647dbb0e473d40a806037","url":"build/js/ActivateSubscription-CLIQV1_W.js"},{"revision":"3c38121ff07bcbd985a90d65defbdf32","url":"build/js/ActivityStatus-BsjPoxRE.js"},{"revision":"fc09efb7950b50bd03674f2bbbe9cfd4","url":"build/js/AddBills-pWMsKVoS.js"},{"revision":"9fb73bf4a98341746ea6aee8dd7ded78","url":"build/js/AddCart-C7_-bwzk.js"},{"revision":"f9e65979787883a101352bc7dcd6e5f5","url":"build/js/AddComment-CXju3joW.js"},{"revision":"670f183fb0f1cd1c86552a4e96a85424","url":"build/js/AddGift-BtTgNhpm.js"},{"revision":"a0fadaa1170699b850622b72aa886c8b","url":"build/js/AddGoal-vydj3Tma.js"},{"revision":"b15b4e63242c6935ebed2913230c2c85","url":"build/js/AddIntro-BOlu8Nto.js"},{"revision":"77886afc738455f26f055dacbfae1498","url":"build/js/AddItem-DsCk99ve.js"},{"revision":"e81a0b97bb83c8a6f5868c48171af007","url":"build/js/AddMembership-CooQGm1O.js"},{"revision":"b00c0f1108c369a18f36db0e3e5afe00","url":"build/js/AddPost-qOL93blZ.js"},{"revision":"79116080a48bff235cc38b39fb8b725c","url":"build/js/AddressForm-iuazsOnY.js"},{"revision":"1b30dc85d58a5748c76b50d5074a20e9","url":"build/js/AddRyeProduct-B9EW7Wy7.js"},{"revision":"31ba541515c70d540ac5b14f620232b2","url":"build/js/AddShop-DNhLFFHR.js"},{"revision":"3a4a781fcb9edf04e35bba5dc04e68c5","url":"build/js/Alerts-DzfaAMHD.js"},{"revision":"b2ec3334731e64f8745aa81ad291a8cd","url":"build/js/AllCountries-dylhZ2Z_.js"},{"revision":"2ae6dcd0bcf143b58e38dbeed769d7df","url":"build/js/AllWishes-D-MPwh91.js"},{"revision":"145df66e0f5d40860b84cd4c626a5313","url":"build/js/app-Ccr63VZr.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"fd196df43dc46b2234ea6520da8a3682","url":"build/js/AuthenticatedLayout-EVj3PB6C.js"},{"revision":"2f42b81bf67202aadcee0a857a4d1002","url":"build/js/Avatar-BpJ-Lwcq.js"},{"revision":"57320e0f79969276b6b11657bacb9432","url":"build/js/Bill-zX-W4ZM2.js"},{"revision":"e72e23f829510f9dce3e51fb6b205b2f","url":"build/js/BillCheckout-Cvxd3ull.js"},{"revision":"b1c3a28a44f59ece117a42be099723db","url":"build/js/Billslist-CXFCFyoB.js"},{"revision":"407fc4144445642e2162525e8ee2f58b","url":"build/js/BillsTracker-8hUhLAsl.js"},{"revision":"f1a6cf2d502f4a6b7faf24d9da62aa0c","url":"build/js/Board-BHFq5P-P.js"},{"revision":"20f1beb61c09dd46dfa4fed55fff5a93","url":"build/js/BuyShopItem-DRFtUC0Z.js"},{"revision":"8eda5ea461988b5332ddbbaa65c38ef9","url":"build/js/Cart-n8EICpvH.js"},{"revision":"2885238006a800838f5b50e9c180755a","url":"build/js/CartItem-BOnic__B.js"},{"revision":"9370ded3ccc65772d55606eab1f11aba","url":"build/js/CartItems-oMoWuu7M.js"},{"revision":"3af1b1910d9a338a01685f98a82ea520","url":"build/js/CartListing-COFEWf6a.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"59ea02fb63a1a21359a461c52a54f315","url":"build/js/CategoryLeaders-BBGFWJy_.js"},{"revision":"a2dcd80ee26d918fb652ae3960e1be82","url":"build/js/ChangeCurrency-D071TFJ5.js"},{"revision":"7966ea7fe09bb5cfe72d58cd819b0b2d","url":"build/js/ChangeVat-BqJbJzNX.js"},{"revision":"b53624dd29f10ee2cb0bc492e596586a","url":"build/js/ChartDashboard-DhHaISy8.js"},{"revision":"767711e902cfe8f75a2c98f2de8da4d0","url":"build/js/ComingNext-DL-ZE8lM.js"},{"revision":"560daa205ba2fbe57ff25c7edd04dcf4","url":"build/js/Comment-CL_gCyjr.js"},{"revision":"8bea415b714d29aba9a99a43cd4a80bf","url":"build/js/CommetsLists-BQxqflk_.js"},{"revision":"ce85da8ac7469ed33890a3b2201576b8","url":"build/js/ConfirmPassword-DtZfB58B.js"},{"revision":"079a5a9a593f71b31e59c6088e11c700","url":"build/js/Countries-CnkVhkH-.js"},{"revision":"09248772d641c1d1df54df4837f2d00e","url":"build/js/CountriesShipping-BfCC1TBc.js"},{"revision":"9dfb4b6371f129b250ad2d955fa24d6c","url":"build/js/CreatorActivityWidget-Bo-n5gRN.js"},{"revision":"10b335999d51b0ca4e2f1d43af8e4142","url":"build/js/CreatorSubscriptionWidget-BVJ_AJoH.js"},{"revision":"972385668cc43c0824bc4a736a2e3616","url":"build/js/CreatorVerification-CEN6q8MV.js"},{"revision":"611cde563e792629607ded7128f3cf82","url":"build/js/CreatorVerificationNew-DV_XbsV2.js"},{"revision":"d25bbe24dcea649760bfcc346e45d1c0","url":"build/js/Dashboard-BVjpq-7y.js"},{"revision":"fc918351d45e3d39b9a5bcb69ddd8c38","url":"build/js/Dashboard-CN9Catof.js"},{"revision":"cc97f8438d2f4cab581e184d2521430d","url":"build/js/DeleteStripeAccount-CYl-qGf6.js"},{"revision":"0e8af600b18315f5129052898dee06cc","url":"build/js/DeleteUserForm-DQLbk1zi.js"},{"revision":"8c887cbe3cd36728020ccaa6dc6e162d","url":"build/js/DiagnosticPage-DCeJ4Wo6.js"},{"revision":"f97d3a5aa91d5a5b4ae6548c0535064a","url":"build/js/Discover-D-xvWb4N.js"},{"revision":"4f6ce27315a9913d677085e9bfd4d723","url":"build/js/Earnings-z2EWAy-Z.js"},{"revision":"1e83e2df0373e8636c27735f1e68a7ef","url":"build/js/Edit-CBAQYW8b.js"},{"revision":"78fe653754ec9450fa0e28259ea566c8","url":"build/js/EditCategories-BLt2k7hP.js"},{"revision":"d36e0871f1b522a759023f2574ce61fd","url":"build/js/EditMembership-fEwJRLWI.js"},{"revision":"fdc5defdda8b85825ad50eaf8e8dc307","url":"build/js/EditProfile-BTfbs_8x.js"},{"revision":"c3324f02f125f5286f40a141b87c5133","url":"build/js/EnableCardCapabilities-Cq-0xaIG.js"},{"revision":"2890265b5226adfdb56ada8fe3566794","url":"build/js/EnterOTP-WPXPyeQe.js"},{"revision":"2ce4517098ce8112fdebdef953d12b8f","url":"build/js/ErrorPage-Cyxr44w8.js"},{"revision":"1577773718dc1d14ca3568a4a530ba55","url":"build/js/FAQ-Idh6i22T.js"},{"revision":"9216eb798e1e1cff323a904b5f5730a2","url":"build/js/FeedList-CJ5HCiQl.js"},{"revision":"e5b1343386983519889f5eeeb0cc0ed1","url":"build/js/floating-ui.dom-BXvm85GY.js"},{"revision":"0f27813357c157f2b72eba32de233cc5","url":"build/js/FollowButton-BTaTV-s-.js"},{"revision":"a4a0f585416e3c3d97fc3803edc9ff04","url":"build/js/Footer-C0Tj_7T4.js"},{"revision":"111adaafaa419806b3a53c17b1ff1c4f","url":"build/js/ForCreators-B5k9NH_h.js"},{"revision":"193ef9e818708bca63ca9ae16e19ee83","url":"build/js/ForgotPassword-BewOWGK9.js"},{"revision":"4845f68bd87f2a001adede630862f964","url":"build/js/FunPart-9_8Kkb4Z.js"},{"revision":"7de91d2f9c62056a7824892f834fb7b0","url":"build/js/GetCart-D7xzuN2C.js"},{"revision":"a672e3a33ba018690258b9a8ca2c4121","url":"build/js/GiftAddCart-BrXuf0ms.js"},{"revision":"8fb73089cfd424147b1abc30a560ebe0","url":"build/js/GiftEdit-BTQb9XXN.js"},{"revision":"688003e3a8f1dcd5d823cb0874034512","url":"build/js/Gifter-Bn2YeQCn.js"},{"revision":"53fc0f56346ddade0979fe1c2d40c51f","url":"build/js/GifterCardVerification-Sl1hpkP4.js"},{"revision":"baa367880ccc50ad5623ce42d5258cb9","url":"build/js/GifterFeed-DquBM6Id.js"},{"revision":"21559d809fd9f47e8d974ffe11d204bb","url":"build/js/GifterItems-CympCs8d.js"},{"revision":"29cef6cbd19e6038f8437ef2f09e030e","url":"build/js/GifterMedia-XkE8CRI-.js"},{"revision":"06e8e480462d9d68f0a57bc382f93619","url":"build/js/GifterMembership-jLgEodX2.js"},{"revision":"c0e2f45f5a1bb89f66cf7012565f7045","url":"build/js/GifterSubscriptions-Cg4ignO1.js"},{"revision":"3c01df6ef969a2edff8eabb781301a39","url":"build/js/GifterTips-BH0NGvrR.js"},{"revision":"f28098b4c354eb008a0070781f3eb7a0","url":"build/js/GiftListing-BGgrl7tj.js"},{"revision":"a929f3dfc5fbaa597300d049f3026031","url":"build/js/GiftStore-DFGDNnp2.js"},{"revision":"eb607c9f774032907e4e63de60efbd1c","url":"build/js/GlobalCheckout-pM1Z6Uqr.js"},{"revision":"3b6638b433b651037ad5c72db330ecf0","url":"build/js/GrowthTrends-C_R6bSd2.js"},{"revision":"e7145f149855586010de7a54574db9da","url":"build/js/GuestLayout-C07T-Dlt.js"},{"revision":"9df90e3dac28ffdb0aee9f56bd0f5577","url":"build/js/HappyCreators-BQdE2gvT.js"},{"revision":"4153fa40e210e660c9a4edf405e8f029","url":"build/js/Header-DHAOGmpp.js"},{"revision":"3b2f803ca2d6e68cdb7428d3dd7edae1","url":"build/js/Hero-BXGAQIwz.js"},{"revision":"850bb51392c807b660ddefb9d8618856","url":"build/js/iconBase-Bh0kGim9.js"},{"revision":"fa3ecba73eb8de23f76cacc5d4e12cde","url":"build/js/Icons-CMHcEQcE.js"},{"revision":"8aa858d54c3e0c892d37f22cebd6ec2d","url":"build/js/ImageGenerationWithAI-DLXNdQ61.js"},{"revision":"54df599f0a55b64933356cc3285f269b","url":"build/js/index-_W7kPDG0.js"},{"revision":"c77afb4b5c8c6b1abfd9cdcd66934b89","url":"build/js/index-BDt1jE_Y.js"},{"revision":"9b3f2292583fe5b6310ab2ef80cae39c","url":"build/js/index-BOGeqV7y.js"},{"revision":"0d6f29b311ee7647a947a6360397c257","url":"build/js/index-BveONokY.js"},{"revision":"498dc79bf3672d2d49075e8bdb249771","url":"build/js/index-BZlsoiMx.js"},{"revision":"8213acf6e0d812c21ab6dcca2295ad96","url":"build/js/index-C3IM6PP-.js"},{"revision":"fceca49adc089bf475db5f957beac8dc","url":"build/js/index-CDVFbySD.js"},{"revision":"9d0bd9b2351f6cf2fa2bebe23e72fdd9","url":"build/js/index-Cy29P-Aj.js"},{"revision":"86c4b7e18443d4014753b2fb42ba5f48","url":"build/js/index-D9b_pGSr.js"},{"revision":"75237bca057fb68811263ffbd99e07dd","url":"build/js/index-DwUy7jqo.js"},{"revision":"d7dbba168ff5a94522c9b9455b283eea","url":"build/js/index-NVR-dYwK.js"},{"revision":"edad3899ad0031c968491f815dab7ac5","url":"build/js/index-OA7KsfOj.js"},{"revision":"adbf3112c27bfb4ef51c6f6109852001","url":"build/js/index-TIS7BGzU.js"},{"revision":"405b5af76908a14c336a2bb060e933fb","url":"build/js/index-TNE4FdEk.js"},{"revision":"e3bf3f747b2aa061c8a8429522d60996","url":"build/js/InputError-DndQC3wt.js"},{"revision":"10f1eac0c189745a3213ce99f2194a98","url":"build/js/InputLabel-JbyONSu7.js"},{"revision":"6551d6a0d329227a5db58d2a680277dd","url":"build/js/IntrosVideos-BzYR67jP.js"},{"revision":"2020d93d78c59bee46f6782e236c3334","url":"build/js/Item-Dj32t6qk.js"},{"revision":"7d377df179abc3ead38117c3d07987fc","url":"build/js/JoinUs-BJJ5mqJN.js"},{"revision":"86a4c507cb99fde354f0efc7001738e1","url":"build/js/LeaderboardStars-BTl_o7Fa.js"},{"revision":"91761ea05a238646e081f13e132f76f5","url":"build/js/LineChart-Bw4dNq4P.js"},{"revision":"facd5bcdac4c77fa991ec50e0d5bf7c8","url":"build/js/LinkTwitter-E_6Q-YFV.js"},{"revision":"3fae69128a574b3d819e21a622d7937b","url":"build/js/Lists-DHGfKIbW.js"},{"revision":"3fe4906d4dafd691a652413930a44171","url":"build/js/LiveBar-DDa5jxuC.js"},{"revision":"4b45c7fe18f4993ca2c2e4ca5b6b2e7a","url":"build/js/LiveBarSection-C0FPWX7A.js"},{"revision":"44f3675feaebe4397c6095834d6a5a72","url":"build/js/LoaderButton-CyFMacRk.js"},{"revision":"89c413894c2148946a9e88270f152e65","url":"build/js/LoadingScreen-Bmte2IhJ.js"},{"revision":"d956f88a513f7c4cf6fedb6f757d3362","url":"build/js/Login-0cU_DOB1.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"22ed76c473c57bd496cce62ed76881e5","url":"build/js/MagicBellNotification-qOF4Dgck.js"},{"revision":"763ba993d4b4ad8b8a71d6046f235d64","url":"build/js/MagicBellNotificationDisabled-B31FTRr5.js"},{"revision":"320e3aa33de9c256adc26cab1d84c39a","url":"build/js/MemberCheckout-XrJxV6Gs.js"},{"revision":"3043bea64c88241636f8264fcbb7ba48","url":"build/js/Membership_dashboard-tIFRMSpF.js"},{"revision":"3076afa493fdacb0b32d8afe254820ae","url":"build/js/Membership-BP6ZhxZy.js"},{"revision":"b112a48e9bf05e8b89af459685987fca","url":"build/js/Membership-t2tYAfT5.js"},{"revision":"2bd1bdf529aea50eabbaebedfbd46795","url":"build/js/MembershipLists-Boe_sLMR.js"},{"revision":"f08c641e631aebcecb4f2e6077d9862c","url":"build/js/MembershipsLists-BmZsr7Nz.js"},{"revision":"50dd251305521c4efac9382435175990","url":"build/js/MembershipTracker-Dq86WQNE.js"},{"revision":"284fd929f774275d60003584a74a8779","url":"build/js/MonthlyRevenue-CWByeCUa.js"},{"revision":"5b809ef306848f42211117d780eb9a2e","url":"build/js/MyGoal-DPhS9aGv.js"},{"revision":"da34bcaede170a708d012a7af619b9d8","url":"build/js/MyShopProducts-CRHl6blL.js"},{"revision":"347526ca6b69d6e424fc55fc29cef7d9","url":"build/js/navigation-VU1g_88a.js"},{"revision":"989c79fdb6fe372f7b8a010e2f898ae2","url":"build/js/Nocontent-B91-s3KV.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"2997177b6ba0b6fb4f652606e5a368a1","url":"build/js/NotForBusiness-D5xFffZV.js"},{"revision":"b5fa6519e4dc8d8d56255580eea531c2","url":"build/js/NotFound-BUw2WncN.js"},{"revision":"f08e35dc813a16a7f5fa08c46a2032b7","url":"build/js/OldSubscribe-t6E29cSl.js"},{"revision":"ae420a59577ee7d440fdf5c1a092773c","url":"build/js/OrderDetail-lWKpcMDV.js"},{"revision":"6fab7a77751fbe3ad612626320cd6a3d","url":"build/js/OrdersLists-BMqvzQAr.js"},{"revision":"6cf450a28e8bdc41802ebf61b6104c9a","url":"build/js/pagination-DMqb0DfX.js"},{"revision":"006163b857da7a6e7fc935d6906949c7","url":"build/js/PaymentDashboard-BKr5tawP.js"},{"revision":"f4a4d6bab8d6a519bf6a9b730078ac21","url":"build/js/PaymentSlider-BMqvW4cj.js"},{"revision":"1644858f8ec35b9a3cc63de060555384","url":"build/js/PlatformAnalytics-DCm9vBcG.js"},{"revision":"88588a410367b1b90bbca8a508f0614c","url":"build/js/Popup-34DuO2fe.js"},{"revision":"37b377d4481609b980892515f6bea7ad","url":"build/js/Post-DLmhx5pJ.js"},{"revision":"caeef6040632c405684b539213843629","url":"build/js/PostLike-Cx5qJ4Sb.js"},{"revision":"f8d41254d3c9097c1e62abd2b511a047","url":"build/js/PriceFormat-oxNNa-e4.js"},{"revision":"6392c60aa91ce48b444e70fa042ddc51","url":"build/js/PrimaryButton-DfIm9hzb.js"},{"revision":"d7e3c4c7d05fb899ff90a3b4dd350976","url":"build/js/ProfileProduct-BT3U-blk.js"},{"revision":"841bd77e883ab06f1daa3e7f4232a6ed","url":"build/js/ProfileProduct-OVzXPlI9.js"},{"revision":"a1979cad2bb959fc3e7e3ab1bddaa910","url":"build/js/ProfileProductLists-B0-rf1L8.js"},{"revision":"d0ffdfd05f9b04d5963d3eddb101e24c","url":"build/js/ProfileProductLists-CK07N_re.js"},{"revision":"7f8ba59370f18d85ab1fb3db01f1cf30","url":"build/js/ProfileSteps-DYWERA20.js"},{"revision":"4345a6d9aeaa90604e12f7f918f44842","url":"build/js/Promotions-BhGeeC02.js"},{"revision":"031c6c1f7494e69657dfcebec54570d5","url":"build/js/PwaInstallPrompt-XecQNzVk.js"},{"revision":"7e67102f9701f8936aa46fef86f06963","url":"build/js/PwaTest-C38nQyTD.js"},{"revision":"c3e017eff8f4bd7e7e2b86995296e832","url":"build/js/react-select.esm-DLgP1H3O.js"},{"revision":"74f0d1e9450e23358357a47132119eef","url":"build/js/RecentSupporters-Dn3DuPdL.js"},{"revision":"721753689c62f0356c90c3a526b374c9","url":"build/js/Redirecting-Wj9NqKfr.js"},{"revision":"be0ff69914e855837fb9d6182ab5c2ba","url":"build/js/Register-jlSym7wL.js"},{"revision":"abc9fa7acc843dfdd44f5ed215bc2bdc","url":"build/js/RemoveBill-CNrlWSQq.js"},{"revision":"a191f8feb924dd049eed2b044260b291","url":"build/js/RemoveMembership-Cknyaru1.js"},{"revision":"8dbaac5944c642fda6c74cb2e6d2484b","url":"build/js/RemovePost-C2xK2uZi.js"},{"revision":"1be5eb9f7189a9551eaeddb8be2a8a77","url":"build/js/ResetPassword-CzlN7Ewy.js"},{"revision":"8e4fb8c62e1f7dc7d370fd18563afe55","url":"build/js/SafeTransition-gEnMeJzG.js"},{"revision":"aa108e174118c14531f070cd8170cd12","url":"build/js/SayThanks-l1cFjP6b.js"},{"revision":"bae87bb40560ce06f85f61f5a7543f33","url":"build/js/SecondaryButton-D2DrrDR2.js"},{"revision":"0e1f61d14b01bc0ae4f70c851b6bd913","url":"build/js/SendTip-DjhOVz8j.js"},{"revision":"105aeb1f52db40b9e3abd971b50c674f","url":"build/js/ShareProfile-F3uc2IT8.js"},{"revision":"ec34c83ef4c4cb56405404d78df33c62","url":"build/js/ShopPage-zco4T8Wq.js"},{"revision":"02cf60573a4af576e9a6fde07deac9a1","url":"build/js/ShopTracker-ecJZuD41.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"90e01b8ef9ffcf35fbe278e57aaecc89","url":"build/js/SiteSubscription-CmWBlF-r.js"},{"revision":"85d0b9a37ce7f8775fce2cdd7f3967e9","url":"build/js/Social-DW9N9ZS9.js"},{"revision":"d1907ee3a3cb0e4b563c7b6751127805","url":"build/js/SocialLinks-CYucAvRB.js"},{"revision":"193589c82671630ad8798cba319e3791","url":"build/js/sortable.esm-9FmFZCMe.js"},{"revision":"6cf057f7f949a4c2c390c7f71285ed62","url":"build/js/Stripe-Ku9yzwIA.js"},{"revision":"898b6aa48ea9103544552568f5b6ed1c","url":"build/js/StripeIdentity-r8gR3lC7.js"},{"revision":"fdde7f4791394b29759da650eec262e7","url":"build/js/SubCheckout-D_D8Y0io.js"},{"revision":"9f6d6a7036df9bcb7951b3594804e3e8","url":"build/js/SubcriptionEarnings-p-FMk9i1.js"},{"revision":"8dbd6eb96ae364e4caa90a5ac0f53878","url":"build/js/Suspanded-CJvhiiED.js"},{"revision":"4cd76862d27957bf1fb7dc61b307d010","url":"build/js/swiper-react-B5bfTl9G.js"},{"revision":"04b3903b57b9ed73bf66a88a85b3fcd0","url":"build/js/TabbedDashboard-T-pkypi8.js"},{"revision":"f8e56360e194dab8943140b6e7d8ce00","url":"build/js/Terms-BYGP9xKr.js"},{"revision":"6154272500b0e770a389e78aa971e797","url":"build/js/Test-BSH-ZfNb.js"},{"revision":"cb17213e244d91d8a9616ac290dce9cf","url":"build/js/TextInput-LQyuPfL6.js"},{"revision":"b5e9c9197a6ddd12a638a45fefd4f524","url":"build/js/TFA-BDCEPNY5.js"},{"revision":"385f30e7f55fca4b24f12cf8d811745c","url":"build/js/Thankyou-ByPIYqjc.js"},{"revision":"76a3a7af721e1d0927cafb2ed2dca713","url":"build/js/ThankyouMessages-OREuQgxw.js"},{"revision":"522c0e1eb75db73ec99453df0e4e2162","url":"build/js/ThankYouRye-Bjolx8pj.js"},{"revision":"59e52621d670becbe2237d55819565b3","url":"build/js/TimeFormat-cCUUJ0Hb.js"},{"revision":"64415ac73c324ca538a4c2dbd19505dd","url":"build/js/TipInner-CAyMeJ7i.js"},{"revision":"1c9c03067ec8ca798834d6ed67378e42","url":"build/js/Tiplisting-BnfQHio2.js"},{"revision":"0f49a33a21a26a113a98a48bfd257d0d","url":"build/js/TipTracker-Y8b0kJbY.js"},{"revision":"94f0d176fe7a2344152afd7f6ff7d6a1","url":"build/js/TopEarnBills-DMCWP_Di.js"},{"revision":"b2861b7264dd1018b8b443e60ab2d026","url":"build/js/TopEarnWishes-DDNhd-h6.js"},{"revision":"1005b57db5a883ec99f862c494c12d5f","url":"build/js/TopSupporters-BxJaGn5f.js"},{"revision":"d1f7adb7bd725aed36020ab052d585bb","url":"build/js/TopSupporters-CZ0B77d_.js"},{"revision":"ca6c33bd7d5d0873d4bc1634a413d419","url":"build/js/TrustBox-ainXpMiN.js"},{"revision":"ffdbeca21afcdc26f60ed5259df7e697","url":"build/js/TweetNow-PuJ7mrsc.js"},{"revision":"477acce8a134aacfb7c3c445b5174592","url":"build/js/UpdateAvatar-COlO7ttY.js"},{"revision":"99406f217d76cab47a8f698c27328173","url":"build/js/UpdatePasswordForm-DA3F3UOr.js"},{"revision":"6c36b68a7d0c0fcfba94c294c2f9336e","url":"build/js/UpdateProfileInformationForm-XK2ESRrA.js"},{"revision":"8e25cdc16cbda33e3105a61e5f4e021c","url":"build/js/UpgradeStripeAccount-BMTx5xGz.js"},{"revision":"c2f8c84b3dff3a6bd9f3e0927e0a7610","url":"build/js/UploadcareEditor-CpJjvTV8.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"da0db421bb000972cdef711e46862ddb","url":"build/js/uploader.module-SOdFLXIt.js"},{"revision":"7d04fa6d2e5cf42740d0311b40f285eb","url":"build/js/useDispatch-DZzqV4jJ.js"},{"revision":"01385a1b631a44cd62cca840416d5e0f","url":"build/js/UserCarts-BNo_YrMv.js"},{"revision":"fea1c2ab7c578c225d2c7b6402c84a0f","url":"build/js/Userprofile-CiT9JqXZ.js"},{"revision":"f1838dfa3b55ece9800f72dcfeccbff5","url":"build/js/USTERMS-C7c0ULe_.js"},{"revision":"bc8a32550d297a2a904293f637e55c85","url":"build/js/vendor-inertia-p756QhNc.js"},{"revision":"830866256dbd2a34e9c5bb71d6baf11a","url":"build/js/vendor-other-83VvcYKA.js"},{"revision":"7615ac1d4077e1b0f82282885e0b0cc9","url":"build/js/vendor-react-BppRT5ET.js"},{"revision":"25ac87614780394df58cf7cca2f86058","url":"build/js/VerifyEmail-B6hqCCpe.js"},{"revision":"1670dc568f7582aa7072f7bc746244fa","url":"build/js/VersionUpdate-7xyzZ40P.js"},{"revision":"6570b6358671f01e72386c411c405709","url":"build/js/VipSupporters-BYhNhlJN.js"},{"revision":"638f3feffe89b2b007733141dca21cdf","url":"build/js/Welcome-DevyHRb3.js"},{"revision":"a8d6b2568365e40d2b34fdf1dc1cc4c6","url":"build/js/WhyLove-BjQPTuJP.js"},{"revision":"2bf0eebca20b10afa95a52a3a54b9517","url":"build/js/Wishlist-BqhL7_ts.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"8164c66744e8f8b33c1ff728d5cc7c7b","url":"build/js/Wishlistbox-BeIEjS9y.js"},{"revision":"2c95f46ae658ef0cfe7149c892ceb68a","url":"build/js/Wishtracker-2EZjDbm0.js"},{"revision":"7b37c6cc5d244fcefbe7e6e9fc6d5a13","url":"build/js/Works-Ds7MbAWH.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
