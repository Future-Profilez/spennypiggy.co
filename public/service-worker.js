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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"42aca458ec316ca4cb61a0f1228f253b","url":"build/css/app-BQBymzkG.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"74eac91a84096dda36c6ea70eb68807d","url":"build/css/uploader-DA0FOkb5.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"37136e78a5cfb05197a7abe93d31366f","url":"build/js/Accountsetting-CwfH4lOm.js"},{"revision":"2cbdcfd4e11429f9c51388c78f6755ee","url":"build/js/AchievementSystem-D12-cYc8.js"},{"revision":"d6dfd012f5f819be637da0996c7323c5","url":"build/js/ActionRequired-Hzjp8UMJ.js"},{"revision":"a921bb94e9e7ad32feb475c13a27d5d0","url":"build/js/ActivateCard-Ydu6AaKq.js"},{"revision":"a68aeaa0ca1fada18af3cf5bde93d39e","url":"build/js/ActivateSubscription-8_h1fbXe.js"},{"revision":"975f3a2dce194165d8e2c441def1d374","url":"build/js/ActivityStatus-CEn1W_8z.js"},{"revision":"e023631c4d8eae310c0142c07ba0547d","url":"build/js/AddBills-Dg-H6XLg.js"},{"revision":"d34fd4c68fe23b0ef19be9709a8ca687","url":"build/js/AddCart-DkM_RiSz.js"},{"revision":"55f2201dcd8efd43ec8cce87101059af","url":"build/js/AddComment-DKdcBs08.js"},{"revision":"810a1489f5ed96f5e1c90845cc19d3d3","url":"build/js/AddGift-p4QTWUo-.js"},{"revision":"4432db2f31b9e1650602e80ac8209a1a","url":"build/js/AddGoal-BwIzX_3b.js"},{"revision":"1dc3f011491b5bf626ec9f343f2b1867","url":"build/js/AddIntro-C8LqAHs3.js"},{"revision":"33b54393736ea5c7185645f49b2cdaa2","url":"build/js/AddItem-DpOqp-mY.js"},{"revision":"b102a0ebd81280079c28314274d5477b","url":"build/js/AddMembership-BPYVIZJm.js"},{"revision":"bf04fc6f7e31c8b39e41407967811ec9","url":"build/js/AddPost-Dz1ND-RV.js"},{"revision":"c1fb999f2290e787928a72336ba6e389","url":"build/js/AddressForm-CP87Wi0Z.js"},{"revision":"f2cdfd8425b62ea908a54c74513a40cf","url":"build/js/AddRyeProduct-DQPU-01d.js"},{"revision":"832d8613225a12229c51e22003f93708","url":"build/js/AddShop-B47ZZkQy.js"},{"revision":"f123f6b3b760f3ad56f57b0de8814b22","url":"build/js/Alerts-BXinTmR2.js"},{"revision":"c376c8f07be6fd4659611ed4fb05480a","url":"build/js/AllCountries-zE3BBSul.js"},{"revision":"07be7f12d52572746bf34037fa33b5fd","url":"build/js/AllWishes-CLm-6Ruu.js"},{"revision":"f49e4bf45210bb4d959e5ad2a28a5ce5","url":"build/js/app-2cly8XlE.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"b89b20fa26dd8695854be8f5bb47b8ab","url":"build/js/AuthenticatedLayout-XK5F87qw.js"},{"revision":"0044ef34fbc9f1a706d61334216e1f87","url":"build/js/Avatar-D_NaGr9b.js"},{"revision":"305aa05f0427f64c609db4a8d38c8dfd","url":"build/js/Bill-ErGKP35R.js"},{"revision":"89ca82cd2e2e62c88d01ff0e3b180c9b","url":"build/js/BillCheckout-qdbYnkJb.js"},{"revision":"791d960e54967c8bc174a08a0f7b6aeb","url":"build/js/Billslist-DUBrcJzB.js"},{"revision":"67855b1e36a6c0ad217435cdd5a147e0","url":"build/js/BillsTracker-BiQrV1lO.js"},{"revision":"f6e96c63c5e8ca4ec30c96c0f3cb52d2","url":"build/js/Board-FO6H5HuZ.js"},{"revision":"5f8480a02e9c5d8fd3d9593eba041ac7","url":"build/js/BuyShopItem-DsOdF5zI.js"},{"revision":"a892db109bac39e8e727ec9413a55e5e","url":"build/js/Cart-BYdZyy8c.js"},{"revision":"b2579a98b14f55476a686e07f948fb1b","url":"build/js/CartItem-D09LXvKN.js"},{"revision":"2418786ade7b30a1b582409f8067b8ef","url":"build/js/CartItems-DddID3vA.js"},{"revision":"bed5aaa3df04dbd21328abcad790b9e9","url":"build/js/CartListing-DWVxyVYi.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"b1a3ac574397d3dd8fc25e7caef15b38","url":"build/js/CategoryLeaders-B6ZsW8Rd.js"},{"revision":"6c8a24252acdb4a734802a2b784e5ec4","url":"build/js/ChangeCurrency-BXOdLvib.js"},{"revision":"244182d2dd4aff6d4d48cc0c8ee682fc","url":"build/js/ChangeVat--uOKxqy7.js"},{"revision":"46558d18105c37c922b54029a064c5e2","url":"build/js/ChartDashboard-DIOfeXwZ.js"},{"revision":"9af0a85ce494baec55e74f0599c1ae53","url":"build/js/ComingNext-BujvDVqz.js"},{"revision":"355756cea0854f4a1c59a700d5126285","url":"build/js/Comment--KLhRlZs.js"},{"revision":"1b861a121558a33f6f407b94a0c3874f","url":"build/js/CommetsLists-DmLB4U7O.js"},{"revision":"881c2c955e365a196c34882da1f04588","url":"build/js/ConfirmPassword-CoPYltei.js"},{"revision":"b8a8297ebbf26f243aea6e2df73841d6","url":"build/js/Countries-CVrBA0m-.js"},{"revision":"948aff963cad04a3dbffb5760e29e03c","url":"build/js/CountriesShipping-DqNjIPDt.js"},{"revision":"9e5fd351fa2e70c586f53ec9dd76fbae","url":"build/js/CreatorActivityWidget-DFw0p7K5.js"},{"revision":"ac937dcb492c80f1cd8bd3d97f3ace0b","url":"build/js/CreatorSubscriptionWidget-C0vgaV_R.js"},{"revision":"24869fba583361214cd8d12f1f46708c","url":"build/js/CreatorVerification-BuLcdXrL.js"},{"revision":"e1c78cf26629480027c005b95bb50f05","url":"build/js/CreatorVerificationNew-CwMlXqL8.js"},{"revision":"7aba0bc3727a9e1054e121a495b3adce","url":"build/js/Dashboard-BA61zRb9.js"},{"revision":"ca28d42777b22c0e342bd68a03901d5a","url":"build/js/Dashboard-DnZXyWp1.js"},{"revision":"6730fda61030b62c499af796bcf5c9c5","url":"build/js/DeleteStripeAccount-D2S66jt3.js"},{"revision":"12a930b1b4abb7cda0d7359b53ca3e2b","url":"build/js/DeleteUserForm-DYxNKuiq.js"},{"revision":"81f51d4c7baaabe292ac534d69f83833","url":"build/js/DiagnosticPage-DojcudIm.js"},{"revision":"16f83acd7e2a13fc02a027c9580b4e4c","url":"build/js/Discover-BxbCXHwX.js"},{"revision":"331343fe7c0d572942893c4658409e6d","url":"build/js/Earnings-BUAifgRh.js"},{"revision":"6fcbd3b23b86b82b21320ad7fcfc885f","url":"build/js/Edit-4MbECEcV.js"},{"revision":"2d2a43f13ba0d81a5018bf4103a8d89a","url":"build/js/EditCategories-CyMNyIqy.js"},{"revision":"33303d2d899844e7e2b1e43206ef45cf","url":"build/js/EditMembership-DGm4dkoW.js"},{"revision":"d8cfecfa3df1528a3124c87b695b492c","url":"build/js/EditProfile-y0KY6EQe.js"},{"revision":"731955c215359fafd8c2850f0c9f3cec","url":"build/js/EnableCardCapabilities-CfPmVb9D.js"},{"revision":"a8e86bce5ece0cbc23a0dc6d4d8d1187","url":"build/js/EnterOTP-DXRp7a1K.js"},{"revision":"10871248d6622af86c245e3d29f40471","url":"build/js/ErrorPage-CJJsTrsQ.js"},{"revision":"f68ab6b592b5ee4d173ecfb1965edcb0","url":"build/js/FAQ-B2uamQKK.js"},{"revision":"a8295b77b8f8ab2567266cb37c7b0a08","url":"build/js/FeedList-DC0Y9a7F.js"},{"revision":"54715a97659084233e8bde7a88e9ed31","url":"build/js/floating-ui.dom-BVOOM_Tj.js"},{"revision":"734bbf351f6a6cd5c79f378fb778af5b","url":"build/js/FollowButton-t2fwvnrj.js"},{"revision":"68ea6e4e355a7e29c42d399bcc3275f9","url":"build/js/Footer-DXyluuo7.js"},{"revision":"55b8a902d0896c9a4ba3ae3512ef2139","url":"build/js/ForCreators-fittGX6i.js"},{"revision":"21d141d83b9d982ac4b3698abaffead0","url":"build/js/ForgotPassword-ByecS4nI.js"},{"revision":"4a7c4e7fa11c8558bb8a6b9022626133","url":"build/js/FunPart-P9KVdIb8.js"},{"revision":"5ed6118438d54d5d05fb0f5330b0d868","url":"build/js/GetCart-BMTIOQOi.js"},{"revision":"a3822f979713cb404ca73e7032c9efff","url":"build/js/GiftAddCart-C_mi4r2N.js"},{"revision":"3ffa75e09dbfa3a457b0030e4f66aa8a","url":"build/js/GiftEdit-DvLmlppi.js"},{"revision":"bccdb8883f3d52e7526006a6c8bac2ad","url":"build/js/Gifter-B1S83_UJ.js"},{"revision":"fe2dfc7ee6f92ee26dd82f2668501bf5","url":"build/js/GifterCardVerification-P4wS7NpU.js"},{"revision":"0dc8137f83d1bb881db474fe1afb7a37","url":"build/js/GifterFeed-C2hjQCR4.js"},{"revision":"fba84d85225a337844f195d5474a9f68","url":"build/js/GifterItems-BriQAGio.js"},{"revision":"08e177d309b44f1453b56477b673e7d3","url":"build/js/GifterMedia-C-7RxLuY.js"},{"revision":"db0a464fd875b32b9da4f60f82a5dcf6","url":"build/js/GifterMembership-C-AK0-c6.js"},{"revision":"28478cdf073487f16dd0bd3b1956f895","url":"build/js/GifterSubscriptions-DKoUVCFl.js"},{"revision":"aa77e68ee921edc950c7cdf2698480c6","url":"build/js/GifterTips-DvFRYD9f.js"},{"revision":"bd7846d0b95944b6bdc82674f785d167","url":"build/js/GiftListing-BTdJnZJ7.js"},{"revision":"68b47cc8c4998ce8527d3a1d575f0832","url":"build/js/GiftStore-B2C1wolS.js"},{"revision":"f92a17fff17023af399256c4ea35fe0a","url":"build/js/GlobalCheckout-CbUpUSQs.js"},{"revision":"63bfde95800bd731bdf260365d45d318","url":"build/js/GrowthTrends-W5C__cZg.js"},{"revision":"4494ab7e2af694f6cbbb5147f4ec9ae1","url":"build/js/GuestLayout-DBffEEKx.js"},{"revision":"5dd549cfb91073774a61b64ab95a9437","url":"build/js/HappyCreators-C_-wi1jk.js"},{"revision":"819f683c33083ef30b0a47188670e339","url":"build/js/Header-DZnQCcor.js"},{"revision":"253b7370e4cca20e029f55df46ada3af","url":"build/js/Hero-CKZygKZL.js"},{"revision":"095a51db72c5fd696812a89545248dcf","url":"build/js/iconBase-BUR7A0Hn.js"},{"revision":"d4f34be3b6c124305dc6b83ad3f9ea48","url":"build/js/Icons-BIpnddDr.js"},{"revision":"3864607b5fd8f0986183c1454ea173c2","url":"build/js/ImageGenerationWithAI-BUZF4qNr.js"},{"revision":"d158002a0a05dafe1d22c0d8ede405df","url":"build/js/index-8zdpuoYB.js"},{"revision":"98e8480b81856b6617b47c578cfd15b2","url":"build/js/index-9a0oJEoX.js"},{"revision":"bc7c7e5c0be5dea62b175a2f6dbfcc33","url":"build/js/index-aMXVarJD.js"},{"revision":"4a76fd150f2e7621ec263b09cc688212","url":"build/js/Index-B15UXNSC.js"},{"revision":"f11fd461255c565ebb022c4791490def","url":"build/js/index-Bg2ImPu7.js"},{"revision":"8128f3d155f01937fba7e32b46848356","url":"build/js/index-Bpwz9dcK.js"},{"revision":"213ddd09129b277aa7dd12b3d1dea413","url":"build/js/index-BqUpynrh.js"},{"revision":"0452f483dc9ef071712d37aa150e9619","url":"build/js/index-BVNrGY6d.js"},{"revision":"5b2796b7f3179e72befe631d29e4bafe","url":"build/js/index-BzfoLPY_.js"},{"revision":"ad20801f0506d8ae53fc3dcc76e454ab","url":"build/js/index-C8isVHtz.js"},{"revision":"64c6a8d65d38191a7256c0dd4679e8de","url":"build/js/index-CDAIDgSN.js"},{"revision":"ef188f11f47cb9d0d171c8cf8aa46073","url":"build/js/index-CDidnzmY.js"},{"revision":"a6135ad985b48530c72939ddd4ef347c","url":"build/js/index-COdjcUnB.js"},{"revision":"9178ca8d73295ddf0a83c0c73b717f30","url":"build/js/index-D0IOJo0b.js"},{"revision":"fbe03afc6e4df34151098e5ee2f7e32c","url":"build/js/index-De8muqvr.js"},{"revision":"3e99aa5339bf79af16c7026b40258b19","url":"build/js/index-DhTqgsWt.js"},{"revision":"5865a3556b41795cdb4e21b80f6a68bc","url":"build/js/InputError--BN7cKFi.js"},{"revision":"136796ba927aa4e1d22b51cbfa1e2762","url":"build/js/InputLabel-iHYji-JM.js"},{"revision":"ca2a711ac1d0a4b0a650812afbfdf811","url":"build/js/IntrosVideos-rZurYMzh.js"},{"revision":"4c0f6929c856da98a8bb6f0cff56f1e5","url":"build/js/Item-D-8zK9UG.js"},{"revision":"cce3bc468fa83fe2b186e112eba169e0","url":"build/js/JoinUs-DXhjBw5t.js"},{"revision":"48f8f37f448521964f5ae0bd0430dcdf","url":"build/js/LeaderboardStars-Cghw2xLl.js"},{"revision":"0f4f8bc8746663d338d63cd965297d6c","url":"build/js/LineChart-DHrWSww_.js"},{"revision":"fe1494f4fc914c7eb2d1fd46a81d76b7","url":"build/js/LinkTwitter-DQ_lPlTx.js"},{"revision":"c4e8e7f33d420be7e5cc5c76615d8d74","url":"build/js/Lists-CNxHE80b.js"},{"revision":"9dde376b9fc7105a67276741e4920c1c","url":"build/js/LiveBar-COPHngaR.js"},{"revision":"c67efea23f991b57a2a759218cf59241","url":"build/js/LiveBarSection-DDvA8qdU.js"},{"revision":"dc1b9135045cb9723f8f351d1794f686","url":"build/js/LoaderButton-k61hCgt-.js"},{"revision":"c4d4a1330f300829b7c6b38da05b3109","url":"build/js/LoadingScreen-Bgcemjbm.js"},{"revision":"972669b48b05fc2195870e5ec93eb5fa","url":"build/js/Login-DxwPDK7E.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"de10e7dd22bd16efa9b383e3563a7531","url":"build/js/MagicBellNotification-C0Tf-m27.js"},{"revision":"292f61fb94b258232b7b5d08e5f51f1d","url":"build/js/MagicBellNotificationDisabled-DMHg96H4.js"},{"revision":"d2f508dc3332c90ec0768dc7c50d4799","url":"build/js/MemberCheckout-BdHuG25L.js"},{"revision":"9013bcab23e214d1acafd32b1cf9eb71","url":"build/js/Membership_dashboard-Dge1KauG.js"},{"revision":"3a51bb42147e71e085d93a3c5ffea100","url":"build/js/Membership-BQGigKuI.js"},{"revision":"27b87cd0fe856bb29e4492c13ea2d040","url":"build/js/Membership-GjSwlrpt.js"},{"revision":"d1e3445002b891f828abb4202e8510d2","url":"build/js/MembershipLists-CrJF48nF.js"},{"revision":"be4065c7b8cc83cdb570a38d486a5465","url":"build/js/MembershipsLists-CrlfR2qb.js"},{"revision":"9ae10bd1dc8b3484563a56f6e798f89b","url":"build/js/MembershipTracker-CCXJHdKS.js"},{"revision":"6d49053c92c75812a52c2fe159800b3a","url":"build/js/MonthlyRevenue-A5VEQtH_.js"},{"revision":"55347b5e912267f3bf646b0fb63b7d9d","url":"build/js/MyGoal-BFDT9Zni.js"},{"revision":"b43927d366d058dac3e1fca06b5ad11c","url":"build/js/MyShopProducts-BtApxW9E.js"},{"revision":"6fd0e0fb8c6fdadaa24ecb0c53842976","url":"build/js/navigation-ASSTNeEW.js"},{"revision":"0ae1691e953a07c5c00b121dd3e1a0c2","url":"build/js/Nocontent-DIjaTAei.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"3decc969c2782d997be9a74349e84a42","url":"build/js/NotForBusiness-CfF4eTzV.js"},{"revision":"353197959961dae9b9cef33a83d8743b","url":"build/js/NotFound-B7U6ipWm.js"},{"revision":"12440d8d1d650a616bdf2ba795a6b9ec","url":"build/js/OldSubscribe-vCmzkLqU.js"},{"revision":"1b0351d2d4bdc8a934891b0dc644ba1f","url":"build/js/OrderDetail-CZGp_Kvu.js"},{"revision":"ebf2253d5a23f95338b213805f6ab349","url":"build/js/OrdersLists-Cj0Yicyz.js"},{"revision":"15918445ee9a0edbbc5796338811ffda","url":"build/js/pagination-CApDfiFP.js"},{"revision":"429fbfda94a0ff5b11b9cb5fd5fd6122","url":"build/js/PaymentDashboard-CU3MYUMh.js"},{"revision":"a9c372a0d6795a411345b8736a1c2bd9","url":"build/js/PaymentSlider-B88JANyx.js"},{"revision":"c4b712f5dc9dbc815c134b6cf76a1287","url":"build/js/PlatformAnalytics-QB5rF2tA.js"},{"revision":"1346c38c7481b6372801a46db59808fb","url":"build/js/Popup-agEOanEG.js"},{"revision":"fbf704afecf1e665037a90ff8a56ab7d","url":"build/js/Post-Bu6hz1xo.js"},{"revision":"e0bd71387630387b5ae004bccb2c8b80","url":"build/js/PostLike--DBybXZ_.js"},{"revision":"25bfc2dcbf6f84dd70852667a9fc428c","url":"build/js/PriceFormat-Bv3ynkFh.js"},{"revision":"b3d6bf097c14679c4753952570804ac6","url":"build/js/PrimaryButton-CCOj2neG.js"},{"revision":"d8282ec238cd34d235bb22abb3e537e9","url":"build/js/ProfileProduct-Bjz40uoZ.js"},{"revision":"c46265a22a404687c88fef71d4766756","url":"build/js/ProfileProduct-CLMxcjO-.js"},{"revision":"a8ed89d53f20efa05b0afd72dae1ae89","url":"build/js/ProfileProductLists-CpR3YO6_.js"},{"revision":"84c03deef2672b518f4e3a7289ccdca5","url":"build/js/ProfileProductLists-OefRAJEt.js"},{"revision":"8db66615594685e8cb3712ed3832d218","url":"build/js/ProfileSteps-oxrbvFxP.js"},{"revision":"c5fbeacacc45e50dbe24c725dc4d91ff","url":"build/js/Promotions-BS1TY1jr.js"},{"revision":"7ce31fc7f987cb858b7fea1ba11e3c77","url":"build/js/PwaInstallPrompt-6eyX6hN1.js"},{"revision":"880337424009971e9bdfc455d9f5dc6e","url":"build/js/PwaTest-Dm5T2rS3.js"},{"revision":"e5e58867f978fd65c83cd808780ec76a","url":"build/js/react-select.esm-DgYQF0yc.js"},{"revision":"2ee0697e9224b29bb7a3052e734699f1","url":"build/js/RecentSupporters-DarX24Fe.js"},{"revision":"04f54442a5c2688327013d055d6817c4","url":"build/js/Redirecting-j5yAc4Mp.js"},{"revision":"5fd8e865adae125c0ff2a66be407e101","url":"build/js/Register-Bysjc8_7.js"},{"revision":"bd336112875c1a3a7b218df01f7fa1d9","url":"build/js/RemoveBill-DbHNfC8n.js"},{"revision":"1abc0d931c5e551118096ccb13a7420b","url":"build/js/RemoveMembership-DQcAgZrj.js"},{"revision":"2c9308aa687f9a69774a46f669f69601","url":"build/js/RemovePost-_Jb7dyvO.js"},{"revision":"e9f4b15fa65aae57738d22a27e7100fb","url":"build/js/ResetPassword-DJkoSw7O.js"},{"revision":"b52a817ec1b5faed72b7dd8f69d02d5f","url":"build/js/SafeTransition-CkBlSe9U.js"},{"revision":"4c6e3c5c5822332867b9f8e8bb675d4c","url":"build/js/SayThanks-CO2klfgR.js"},{"revision":"cc07e57c1037c6f8729cb39a90730ff7","url":"build/js/SecondaryButton-Ds2wtjVS.js"},{"revision":"cb0bbf6f4c488e85910a166f17ccbce3","url":"build/js/SendTip-DpsmMXHB.js"},{"revision":"4ebb079a539eab1b7d969d14a4b626df","url":"build/js/ShareProfile-BM4a8dRv.js"},{"revision":"7ed77cd763b1bb2d985f945f9def7b98","url":"build/js/ShopPage-Cqwxd0GP.js"},{"revision":"9eb072c3ec23fdb14f6940150d0f7043","url":"build/js/ShopTracker-DXxlIVDH.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"3f7a8fb38ea06e4ac30c87aa47c6692a","url":"build/js/SiteSubscription-Y86lujnW.js"},{"revision":"246a11fd168671bf9436de3d9f75425c","url":"build/js/Social-Xbz2UEo6.js"},{"revision":"e0f1d0be8a399674d25ac691b892ae74","url":"build/js/SocialLinks-Bzf4zO7X.js"},{"revision":"471b70669ed66e5769ef7db9688328c6","url":"build/js/sortable.esm-7mGTegqh.js"},{"revision":"ea2e492134c090e5b38c2624ad4bccd7","url":"build/js/Stripe-BaBTDqtY.js"},{"revision":"7b0404e98ce1cbdff711df12d98319d0","url":"build/js/StripeIdentity-Dvm7q942.js"},{"revision":"c2c9c811de246334871a6a7789eee8dd","url":"build/js/SubCheckout-DeBIOwC8.js"},{"revision":"03165efd27826c5e1c25c89342abf927","url":"build/js/SubcriptionEarnings-Cu2V635z.js"},{"revision":"1543956922bd8228b4867bf8d1318eab","url":"build/js/Suspanded-BRE2nFGN.js"},{"revision":"4ffd37a3f76a2443a58f6afc84090b6d","url":"build/js/swiper-react-BwMGbLEK.js"},{"revision":"4af3effc0078852d12303dcf6a521617","url":"build/js/TabbedDashboard-DphJCzq2.js"},{"revision":"11f78e123e7ca054704fa1e9a97e95a3","url":"build/js/Terms-8IVfDjHY.js"},{"revision":"5a1ec68ffb23c6acf3f132ab184364ec","url":"build/js/Test-1ggwiRSL.js"},{"revision":"aaa6daf389ca6d7dabfa4a6f41c6665b","url":"build/js/TextInput-DkwM8zbY.js"},{"revision":"2cfad27440a4a5ed4b45b9647d5fe362","url":"build/js/TFA-DcQ0QjQj.js"},{"revision":"7e1723dccd472c6c0caa618d8112333a","url":"build/js/Thankyou--FfoHb9L.js"},{"revision":"3aa171e4e606de0fc15ca5f1d255af9d","url":"build/js/ThankyouMessages-C14wEVk1.js"},{"revision":"872b0cbaa14f21cfeb39ef1ab106e81a","url":"build/js/ThankYouRye-13g6fhCX.js"},{"revision":"2ce4660392ab0c068a6d428ff8a04b92","url":"build/js/TimeFormat-Cwyf8lMe.js"},{"revision":"bf3f10f76d2cec21973199f774a5227e","url":"build/js/TipInner-BZXyIhQm.js"},{"revision":"0cf56f889bc31353500080ea5c55c6aa","url":"build/js/Tiplisting-kGkP1sWP.js"},{"revision":"1561eaac28032db07f4c67a6d2506796","url":"build/js/TipTracker-2HVEA7Ss.js"},{"revision":"8ce2065bfb21a01ed9e93d54551a620a","url":"build/js/TopEarnBills-rHaUrO2z.js"},{"revision":"eecd0409893a48864245c389cd9f5a55","url":"build/js/TopEarnWishes-8L2tbUkY.js"},{"revision":"e4d33493efa3ca747df4904a5ee39c13","url":"build/js/TopSupporters-aXbHr6HE.js"},{"revision":"653d56a4121b42199ffee8f2eb531da9","url":"build/js/TopSupporters-C0ObE-TW.js"},{"revision":"5581b1c7b4e44e75d0ab740a8284f3e8","url":"build/js/TrustBox-BwnOTB2o.js"},{"revision":"9b67368932f3f2cefb749b0321b17e7b","url":"build/js/TweetNow-D8VSsQBv.js"},{"revision":"a27d86d853ba7d96894aede83fc927b3","url":"build/js/UpdateAvatar-Dqh_OSyy.js"},{"revision":"09c73ab12f3bae4ea5050b4b7dfa8e7d","url":"build/js/UpdatePasswordForm-J3w7wCYU.js"},{"revision":"f80454bb87954d7824d0f678d2c61659","url":"build/js/UpdateProfileInformationForm-BUszLV1P.js"},{"revision":"802fd563c03c83fe0b8bebcb5eac4afb","url":"build/js/UpgradeStripeAccount-C8Cf6ut5.js"},{"revision":"5b38ea3de27f12b91585432f5c8e7d30","url":"build/js/UploadcareEditor-CvoGn1dE.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"fe4f9148f7ae0f807762a29fc1fabb4f","url":"build/js/uploader.module-BIPMlfcx.js"},{"revision":"858c25bdef1a44a39b67033b27bd8359","url":"build/js/useDispatch-QRPixmQe.js"},{"revision":"f5d96db33b94ecf471c607678967ae70","url":"build/js/UserCarts-BeQxFP67.js"},{"revision":"0519a73da006279b3e42d4a2673372cf","url":"build/js/Userprofile-DSGj2kWM.js"},{"revision":"3c491b6569412e204fec13f906c444d3","url":"build/js/USTERMS-3br8_NrW.js"},{"revision":"8b59d57a8cad38360574ae225f55993b","url":"build/js/vendor-inertia-Cp1DH_N7.js"},{"revision":"64b112f46ec378e00436ef0ceba21d58","url":"build/js/vendor-other-Bp60Jx8P.js"},{"revision":"f3c3d659e0e045f3cf95264eae3e1578","url":"build/js/vendor-react-BFo20RMp.js"},{"revision":"e73e195e9f94337494fcc2e2f63b05be","url":"build/js/VerifyEmail-BDRK53A1.js"},{"revision":"3a90ae8081d0e03bf17028031b99ed64","url":"build/js/VersionUpdate-CNayrvLE.js"},{"revision":"48fa5711dbeb251e737c974aad4a04da","url":"build/js/VipSupporters-DXKnqsX8.js"},{"revision":"54df2e54742b2869d023851f1f0c9c11","url":"build/js/Welcome-Lm5pIhGO.js"},{"revision":"c26a6920c691e79742eac1657d5fcdab","url":"build/js/WhyLove-BHQcxqRJ.js"},{"revision":"113eaae2b6ab658b09e59bdec89362bd","url":"build/js/Wishlist-BlM9eEtZ.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"e74fbd16deb27d269fb3fab6ffd685a9","url":"build/js/Wishlistbox-C85EVIZa.js"},{"revision":"a5c9f8b53a542390b332ee8f07112b2e","url":"build/js/Wishtracker-B-xVwD4G.js"},{"revision":"86b682b3609cc8abf98f841c8bfc384a","url":"build/js/Works-CcWqgf5C.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
