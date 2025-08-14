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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/avif/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/avif/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"f5f14f96cba4007e57767f6fd17f10df","url":"build/css/app-Dyp1uPRz.css"},{"revision":"46fe156d0f456d2d1c2ec861373e6a50","url":"build/css/bootstrap-vendor-ChLimcyK.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"049c0d9fb0f80ec864a6366eb961f346","url":"build/css/vendor-BAZ39jDi.css"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/gif/loading-DKd4CxP-.gif"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/jpg/giftimg-CbenuWDF.jpg"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/jpg/plaid-C3YNig8l.jpg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/jpg/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"13a4bb67053afb79cbca54e46e84b369","url":"build/js/Accountsetting-CJaGvL9X.js"},{"revision":"b9e7d06ff946c160dfc774d64b04af49","url":"build/js/AchievementSystem-DRTB-D0o.js"},{"revision":"90b10012b72df0eb6f1d63317d78c313","url":"build/js/ActivateCard-URAP-Fff.js"},{"revision":"64dcf9309b481b5f0e2b41eb279eed00","url":"build/js/ActivateSubscription-B2YvckZu.js"},{"revision":"614ce278c707f459b8258b00a73c992a","url":"build/js/AddBills-BS00uORT.js"},{"revision":"4da231025ad352f8979ab42192750d67","url":"build/js/AddCart-CKRDbmWu.js"},{"revision":"58c6dee310bd2a04e40f212b1e216b74","url":"build/js/AddComment-COcVGjw-.js"},{"revision":"0a35fd32cd724a4277787e2539b6b87a","url":"build/js/AddGift-CX453x7A.js"},{"revision":"1ca0b59299b5204d2ada71faef04249e","url":"build/js/AddGoal-CVY-adKW.js"},{"revision":"cf5f994ca50097bec01155845fbfb3bf","url":"build/js/AddIntro-CosNMq_z.js"},{"revision":"cdcd266803a39b667e1d8fe1c0118c4f","url":"build/js/AddItem-Ezo4W3s6.js"},{"revision":"8057010403a07ea17aaf59c7f09a5ae9","url":"build/js/AddMembership-JxWmvdbP.js"},{"revision":"4a01d28e00d2bd85fb67d952879d33ce","url":"build/js/AddPost-BKGXybht.js"},{"revision":"3a6d978d449c47b8038f047b6594d6f1","url":"build/js/AddressForm-CRsEz8hT.js"},{"revision":"7c7515c749ec88dc8c352eaa83418188","url":"build/js/AddRyeProduct-Df9I1_Zc.js"},{"revision":"bd1f5cf4bbfe66ac46fbc118c9ef48c9","url":"build/js/AddShop-BwqN9rYJ.js"},{"revision":"a39f15e9ad2f67a3784896e552176dc5","url":"build/js/Alerts-D2lNNYBH.js"},{"revision":"e7beea23be4674f1ad4184a4479a73b2","url":"build/js/AllCountries-B2C-CoC2.js"},{"revision":"719e3c70538fed99ad1257b274bc78e9","url":"build/js/AllWishes-DNQn14-J.js"},{"revision":"a1061a5977b969105415bf4474362b67","url":"build/js/apollo-vendor-BMHm63R-.js"},{"revision":"97d7786b3503b4c9e26932c37c897bdf","url":"build/js/app-BAy-LH_k.js"},{"revision":"b46ea415a76bb5a24777cde049c72b76","url":"build/js/app-store-j5twloTZ.js"},{"revision":"7cb41ac0fda1c44f26c48e8bb64fb4f3","url":"build/js/AuthenticatedLayout-e3V3o8RY.js"},{"revision":"8314e871a353566164945d0877c266ec","url":"build/js/Avatar-BTGAcC60.js"},{"revision":"f965e399b5225bb307d77e5c94362d80","url":"build/js/Bill-Mer2L3gF.js"},{"revision":"f52edf09bcbf463cf280f4064382599e","url":"build/js/BillCheckout-Dk6CwRZw.js"},{"revision":"8f5009bcf9327bc85429c6067c317eb0","url":"build/js/Billslist-C-DH21eC.js"},{"revision":"b4f52fac7efbc79a7e79684629c60ba6","url":"build/js/BillsTracker-ZlkFygyn.js"},{"revision":"5e632df9b62b2de0b7c50304095f3c1a","url":"build/js/Board-Bv1By_Rz.js"},{"revision":"2f631f80d839eab371d1d8f02b9686b7","url":"build/js/BottomBar-Cw1VWc6K.js"},{"revision":"693385c3133007035e2ede163e08a55d","url":"build/js/BuyShopItem-4iSJltbf.js"},{"revision":"10c64babf1b280d7d0ea0f27dafc6cc8","url":"build/js/Cart-B40NDsBG.js"},{"revision":"0bc9984a871d3440d291230241575c7e","url":"build/js/CartItem-CFn6FTuH.js"},{"revision":"442b7978d89009aa7d60a99a7bfeca6f","url":"build/js/CartItems-B_7Yz-St.js"},{"revision":"9e3d7cf899c56f2b4329cacfb3d4137b","url":"build/js/CartListing-C_yHnypn.js"},{"revision":"c7814f62aa6ae3144985410f50d3907f","url":"build/js/cartproductimg-CMV7Is1K.js"},{"revision":"b002bedd89d186e6c10ecbfc393fc74b","url":"build/js/CategoryLeaders-BB9WH6gx.js"},{"revision":"60236fb4fc81714986c037c52b7f9a37","url":"build/js/ChangeCurrency-D1KL47J8.js"},{"revision":"1c82dbcc29cf6e47c07a896fc1eb7d9b","url":"build/js/ChangeVat-C2ZyIR6e.js"},{"revision":"cfa3c39094ed9ea5ed0c10e813e9c4eb","url":"build/js/Chart-DAmVqDV1.js"},{"revision":"5ef3ca740cb70d843abc5ff68335b7e0","url":"build/js/ChartDashboard-D0oOwGBS.js"},{"revision":"d8f71307b0af8aaf348bb15a5924707c","url":"build/js/charts-vendor-D4LacIld.js"},{"revision":"cbba5fc061209ffa9683b6a62205f6b2","url":"build/js/ComingNext-BqH5knFS.js"},{"revision":"b0b797a894535e194f565dbcd9ef114b","url":"build/js/Comment-DkIC5kCQ.js"},{"revision":"d039833ec363a4738315d8f85e0f6e66","url":"build/js/CommetsLists-TPyF55Iu.js"},{"revision":"b2a53e76446dc8c69c6be2daec593334","url":"build/js/ConfirmPassword-AFPeU83a.js"},{"revision":"86fcdf305d91c984ad9f89c7756896b6","url":"build/js/Countries-CMdW4doW.js"},{"revision":"0461e3b6f0e152da225f9c5b856592c1","url":"build/js/CountriesShipping-BL2TJm-r.js"},{"revision":"cffe77501a1f9c08da9185e054105703","url":"build/js/CreatorVerification-BLxmXJ7X.js"},{"revision":"ca6d2fb458125928b1b4a9b373266a47","url":"build/js/Dashboard-C1iFNd-B.js"},{"revision":"30d622d4c4f4934b436877078ec9afa3","url":"build/js/DataTable-CHw-X-yv.js"},{"revision":"907aa7a9f3b43500cde060f332e32f67","url":"build/js/DeleteStripeAccount-CbCxOySm.js"},{"revision":"ff28c6cf26e2d21ee1e8a2b3641aef23","url":"build/js/DeleteUserForm-BqAV-906.js"},{"revision":"58131aafbb2c2dc3b33bccfb7825f54c","url":"build/js/DeviceID-XbzAcNQ0.js"},{"revision":"d0632530485fd9d48ff85e300088c137","url":"build/js/DiagnosticPage-CZbwPL2D.js"},{"revision":"e56a85d97d0d2ec87d5ff1b9e13e6253","url":"build/js/Discover-DUfEoEas.js"},{"revision":"716b38834b9f650d1a4d452fd07c810a","url":"build/js/Earnings-DMGNmeki.js"},{"revision":"e265ea457ad0bb77f590eb863fd81f26","url":"build/js/Edit-BiUTPU08.js"},{"revision":"ac329f9db3c16b6154294d91203ebfc3","url":"build/js/EditCategories-DEEUYxIe.js"},{"revision":"ecbac80166b9c78c7cede9ec59c92176","url":"build/js/EditMembership-CelEQ_5o.js"},{"revision":"e80448695cd40d64c15e694272cb4ec0","url":"build/js/EditProfile-fc9JQqW3.js"},{"revision":"5b16d028ce054c4778cea85c8e007220","url":"build/js/EnableCardCapabilities-D4dYTQsG.js"},{"revision":"12cbb976107aae8ebdace26a718e2ea5","url":"build/js/EnterOTP-D8aqVtcO.js"},{"revision":"abfe5b022b4c5a120aa162e269a4afb4","url":"build/js/ErrorPage-C1oyrAnq.js"},{"revision":"e0267fc5f9085c0a6b67a86b18702f73","url":"build/js/FAQ-U4fYpto-.js"},{"revision":"2e18b112ef3c6cc043835383a2985d79","url":"build/js/FeedList-B_rKBcep.js"},{"revision":"8e83d429ccac73624c14dc48271db6f7","url":"build/js/FollowButton-BLAY702K.js"},{"revision":"747240484a986d82f142e9549fb802e9","url":"build/js/Footer-D_q-dIVk.js"},{"revision":"c9c43d07ce0409afcf6d2bf6c691721e","url":"build/js/ForCreators-DSi-WEti.js"},{"revision":"db5c9b657ad9b47154c89aebd589c0d3","url":"build/js/ForgotPassword-DWHeO16K.js"},{"revision":"b43b979498041a4d5f14175b5760a44c","url":"build/js/FunPart-C6E3ySWr.js"},{"revision":"187b5799605b610aed47ddb04b356243","url":"build/js/GetCart-ChsRfxLP.js"},{"revision":"7b085d8a70d43c425451fb153cd89b4c","url":"build/js/GiftAddCart-DX9XDOMo.js"},{"revision":"dd7bc92d8f420cf41390e12986315882","url":"build/js/GiftEdit-CaYcTZxT.js"},{"revision":"234a5d55a6d30f387084d6ba0f50757c","url":"build/js/Gifter-B-ObQhck.js"},{"revision":"f993570faeaf2b22bb9936d01b764f6d","url":"build/js/GifterCardVerification-_1PaldTG.js"},{"revision":"9fd5f4091d7e1d30d443ac536621968e","url":"build/js/GifterFeed-B8c4ppiJ.js"},{"revision":"dd7d713ced13318f3410fc5c7b466eb4","url":"build/js/GifterItems-CCxHDJir.js"},{"revision":"4c49ade32ec6d3f829af6eeeadac2b3a","url":"build/js/GifterMedia-Cpqx5-sb.js"},{"revision":"3cf55369f455fdbc5ebf2df09fe08295","url":"build/js/GifterMembership-CtvUarso.js"},{"revision":"6d3a33a9d480f69b7feddeed9acc24ab","url":"build/js/GifterSubscriptions-BEXylqal.js"},{"revision":"450eb5ab671ced473f380e11ed9af421","url":"build/js/GifterTips-PdjnujrC.js"},{"revision":"aa56c815ef91030ab53ebba6c773b686","url":"build/js/GiftListing-BVoQMIgB.js"},{"revision":"35cd36380589110a2f6adf39c81fb686","url":"build/js/GiftStore-Dtjqxu_p.js"},{"revision":"ac93e976bc0219e48b2c6a9e7e6881cf","url":"build/js/GlobalCheckout-CtISNcRi.js"},{"revision":"063f7d5f293a849d9559aaba038941bd","url":"build/js/GrowthTrends-BLriOm9r.js"},{"revision":"686fd115afb17ec092e86c338f30f029","url":"build/js/GuestLayout-BxL8ySc2.js"},{"revision":"e822ed28c34e98fc8a24b3f96ecc1b67","url":"build/js/HappyCreators-DMe52QKJ.js"},{"revision":"c817400cf6473f6855f276d0b3ee9d63","url":"build/js/Header-w6lO3drf.js"},{"revision":"f0d3a48192156e25f8310b2163df86d0","url":"build/js/Hero-CvUQ-0je.js"},{"revision":"a63fc739eb360b43f2e8aa6c58d2fbed","url":"build/js/Icons-BAhSK_jF.js"},{"revision":"5fdb2ab2f5ae5424237e7921bf732ef6","url":"build/js/ImageEditor-7qA-NRvx.js"},{"revision":"68c4be2b2a81c2541b8fbbdc829d50ed","url":"build/js/ImageGenerationWithAI-qPySNJI7.js"},{"revision":"0ceec8397823db45b93e4bd175b042d7","url":"build/js/InputError-D7zGZCLT.js"},{"revision":"99d73926112ca70c0ae7829804dd50c0","url":"build/js/InputLabel-Bl5hm755.js"},{"revision":"836b61f14d7a23175aaf5f666adc5635","url":"build/js/IntrosVideos-CXxQwA70.js"},{"revision":"14fc10b0f4d9833eb2f28e352667e971","url":"build/js/Item-CSEzgrXr.js"},{"revision":"8a5e736dd5599f03b7c4f00b7a34c8cf","url":"build/js/JoinUs-DCU4F4sa.js"},{"revision":"612cc30cb11c51861d9dbcf8a9307fac","url":"build/js/LeaderboardStars-BrybzkZM.js"},{"revision":"42f0fcb4dad2bd731d2708062d85677a","url":"build/js/LinkTwitter-0R6bxdYQ.js"},{"revision":"f65c7c45c0ab5a7575a0c32bca27f5b7","url":"build/js/Lists-q4pvfhAD.js"},{"revision":"6ceac10f6180cdc9024110cc25b7ed49","url":"build/js/LiveBar-CIjDP07J.js"},{"revision":"74f7d318f5852a64b49d3f33cb9d5213","url":"build/js/LiveBarSection-D2Y1Abro.js"},{"revision":"4e788c17870b5a5ddb79421c021edf89","url":"build/js/LoaderButton-Datvc9Un.js"},{"revision":"4b5ff58f4bd59a856b06dadb8099f0eb","url":"build/js/LoadingScreen-BiCFtk1O.js"},{"revision":"d8376d84d6eb7725e337f22e59e2da75","url":"build/js/Login-xpkCmEyD.js"},{"revision":"c94ba50865d3a8a9ccb5cab442a9a7ff","url":"build/js/logo-B5lL0K2o.js"},{"revision":"bbbc7cadc37f7a2858dad87c7a7fb9d4","url":"build/js/MagicBellNotification-B3gsa6Z9.js"},{"revision":"c441ceaa3ad85c6fabec54fdab6fdca0","url":"build/js/MagicBellNotificationDisabled-3jtADAVR.js"},{"revision":"2710ced05a6903e01522902a7a1359e6","url":"build/js/MemberCheckout-DDbVe890.js"},{"revision":"8fb3fecb2a5e853078fb08a00a5454da","url":"build/js/Membership_dashboard-CxY3JtPM.js"},{"revision":"6b741442d4a4ecfdf499a69dae42758a","url":"build/js/Membership-BS9JUGIQ.js"},{"revision":"5a46372869320502c716bbc44f52c679","url":"build/js/Membership-BXJcXthi.js"},{"revision":"4f006a0bb65b3da02b640607ca5ceff4","url":"build/js/MembershipLists-C3kp8_Tu.js"},{"revision":"32b67110ce46a103d3826af3660f79d9","url":"build/js/MembershipsLists-jsSCwXGN.js"},{"revision":"c7d25ef1aa26b16c3fd45215799a30de","url":"build/js/MembershipTracker-dXKPcCLp.js"},{"revision":"ba2358d25c530b2f6bd28a7e50487d4f","url":"build/js/MonthlyRevenue-DF9ska8E.js"},{"revision":"266ff87a4090bb7712b060fe29b4972b","url":"build/js/MyGoal-DyBVkh4Z.js"},{"revision":"3910d9fb3b440bbc8f3c74635195143c","url":"build/js/MyShopProducts-BGUYmRrE.js"},{"revision":"0da9f7fd754c63e0046d090caad13a9f","url":"build/js/Nocontent-JXByG0XW.js"},{"revision":"f3f0f59ac880cc2222bf918c4c29a37d","url":"build/js/noresultimg-B_g4pD0M.js"},{"revision":"704570fafe033c7006ec700ba50f1b74","url":"build/js/NotForBusiness-CfC_6KSN.js"},{"revision":"e4373c2c8d067719576f707756888445","url":"build/js/NotFound-CyJDCQl4.js"},{"revision":"fc24c14c9a766b4d21879cc6b171f066","url":"build/js/OldSubscribe-B1KZD7ZZ.js"},{"revision":"bb91c2a44441f07eb01de12ce22c7f6c","url":"build/js/OrderDetail-BVdKvgF6.js"},{"revision":"03df5e3a6432f33f5cd536c31180a903","url":"build/js/OrdersLists-Bm33zdkt.js"},{"revision":"5d78f34ce9ea8f1cbd9992b7fee6f4be","url":"build/js/PaymentDashboard-7_Ln74D7.js"},{"revision":"1c6cc397409384c9969d65d8210705c0","url":"build/js/PaymentSlider-B4cb5h4A.js"},{"revision":"1e7571d059c1633b25c21c973e2f98d9","url":"build/js/PlatformAnalytics-CuHo02Nx.js"},{"revision":"cfaee577b132cb7ad785d47374f7a8e6","url":"build/js/Popup-DFm2hoOJ.js"},{"revision":"fe5531734ed75b401f6605b83f1ecf68","url":"build/js/Post-D5x-sfcj.js"},{"revision":"5f1f9fb45738e90cc014d8e83f067f04","url":"build/js/PostLike-ObAXxcgp.js"},{"revision":"7b346a45b347b073be6166a40a39afc9","url":"build/js/PriceFormat-h8P5m5cb.js"},{"revision":"62a892dcf7839c4bb1450de46f0deca8","url":"build/js/PrimaryButton-D2OQUII9.js"},{"revision":"d290db98640e48eaea243118a1431806","url":"build/js/ProfileProduct-BVZWiQBe.js"},{"revision":"731d297a00fa0ecad96f03531a1e88d0","url":"build/js/ProfileProduct-DpfZVbLv.js"},{"revision":"7dab98b2fa73247025bebcb12e048f83","url":"build/js/ProfileProductLists-8rD7ob74.js"},{"revision":"f44644989ebc521c066e2d1ef307d4fd","url":"build/js/ProfileProductLists-CT1nXZH4.js"},{"revision":"9414ed5a455ed8053a828d951579d459","url":"build/js/ProfileSteps-DewmDbJZ.js"},{"revision":"7f172992f9be370bc6e239fba18a2ac6","url":"build/js/Promotions-Bo-h0QXb.js"},{"revision":"97fcdf3055c5e29771e277cfc540f5ea","url":"build/js/react-vendor-BpH2kNBS.js"},{"revision":"9bb3a05fc631c48b16b6b43cb4ed2c4d","url":"build/js/RecentSupporters-BuJ4-NNA.js"},{"revision":"0d4d6d4ec0a0917872812f967508ea36","url":"build/js/Redirecting-Bk6TZ7Sw.js"},{"revision":"92506087bf87048a84ab180d82718c86","url":"build/js/redux-vendor-o67s6u2j.js"},{"revision":"67fad8c2ebac959a4cf0559bba88a2f0","url":"build/js/Register-DzqHscTF.js"},{"revision":"dcc877b8008fe61278b238d3a2b8a6df","url":"build/js/RemoveBill-C99MphSa.js"},{"revision":"53bec1b99827be22ca544b97bbb1af3c","url":"build/js/RemoveMembership-lDxn3bjN.js"},{"revision":"b25c1bd782ad7cd786a46edd178771a0","url":"build/js/RemovePost-CZoEQtmc.js"},{"revision":"681837293f17cd1f2fe2bf7e20445524","url":"build/js/ResetPassword-CwZEbJlu.js"},{"revision":"86969643711fb6d3d3eae3458b9ef1a8","url":"build/js/SafeTransition-DMrVMCim.js"},{"revision":"cb584c3db03468d023857504e33871ea","url":"build/js/SayThanks-Dj-a_zh4.js"},{"revision":"d376ded4ba8c6b942e80f4f5f229affd","url":"build/js/SecondaryButton-B05lp8w8.js"},{"revision":"cce4610daae170c8419cc7ad2a7793f4","url":"build/js/SendTip-BQxlSaNt.js"},{"revision":"9586b406fe3c45a5f5062c556f3ec1a3","url":"build/js/sentry-vendor-DlnfM9lf.js"},{"revision":"a3793581bdca6c8ffacab6537b36a0bf","url":"build/js/ShareProfile-BLvDfuB2.js"},{"revision":"ff62d1bc041843e478cf7161233fa387","url":"build/js/ShopPage-CaiioJZI.js"},{"revision":"0cff61f72308ce7a64492f40a9ac3956","url":"build/js/ShopTracker-CbYqGBzh.js"},{"revision":"d841a26a9cb475a8e3a17e972ef00ee2","url":"build/js/siteicon-DsSyz8LR.js"},{"revision":"2d5820857cadb3f76f3e878fd03dfa61","url":"build/js/SiteSubscription-034LsGfr.js"},{"revision":"85ec558a1a2b1e43813f2eb3e088cd30","url":"build/js/Social-C6SMH3yy.js"},{"revision":"348caa738105a332bfae186bd56b1968","url":"build/js/SocialLinks-BopuSX7S.js"},{"revision":"00f48bdcad390865358b4e75c56ac5d7","url":"build/js/Stripe-BTieW8yi.js"},{"revision":"cdc81604f579b6b333decb2f77f526c3","url":"build/js/StripeIdentity-BAuGU4YW.js"},{"revision":"414fdfb6f22f443e7ce30eb0511ce0df","url":"build/js/SubCheckout-CHGIJhax.js"},{"revision":"693bcd91d9eb71d02f651fbe2db65678","url":"build/js/SubcriptionEarnings-DuCTJuPo.js"},{"revision":"45efb52ee01879be95a6f7e67de27a57","url":"build/js/Suspanded-C2nRW3l3.js"},{"revision":"d22ddeea0058cddf1d4a89a34605ee4b","url":"build/js/Terms-BEXVtI5V.js"},{"revision":"4142f346fd066f24dacb72f338c67802","url":"build/js/Test-dKbEzZQD.js"},{"revision":"1dc824ca5a2e932a4b0909b8e0bf8871","url":"build/js/TextInput-Cm5Y_0sL.js"},{"revision":"a41be50a03e9ae0c4487aa795763074c","url":"build/js/TFA-BuBcONUE.js"},{"revision":"dc4a4b77a514b32a9624bcc9358a91ed","url":"build/js/Thankyou-BLexPRIV.js"},{"revision":"8854cc3dcf8bdd1cde3b4e439bcd3a6b","url":"build/js/ThankyouMessages-BQh2ZzQ6.js"},{"revision":"5c5eabda9f3a156ff11754bff0e62d13","url":"build/js/ThankYouRye-BwbQhuZv.js"},{"revision":"654c302bd540077ea51ff211a0d656c4","url":"build/js/TimeFormat-CBefWL15.js"},{"revision":"dcd2295102515a8b294946284547f202","url":"build/js/TipInner-Dt_Zs9rR.js"},{"revision":"892cee3ac2f901eb5ea865f2cadc2f26","url":"build/js/Tiplisting-DNMk6DUf.js"},{"revision":"cb0cc8c0366f3e830ab2757241857848","url":"build/js/TipTracker-B67Nb1tI.js"},{"revision":"8a4b0cfc772d07d9fe599931b59bd64a","url":"build/js/TopEarnBills-nE9u4x8R.js"},{"revision":"956a11da55f0c50b9c24840abbc5c127","url":"build/js/TopEarnWishes-C1ZYHkqj.js"},{"revision":"b631c60ba07a644e8d67adaefae5e0f0","url":"build/js/TopSupporters-C2VgmmUH.js"},{"revision":"dcb0c751b894e7c6285eb98b7e6cdddd","url":"build/js/TopSupporters-DIJz6KJy.js"},{"revision":"ae6f1a5a0ee0e884c82b809015d2aedc","url":"build/js/TrustBox-CXDhp931.js"},{"revision":"1b66e724455d7a5c0953b68fe585a3ba","url":"build/js/TweetNow-XU741rud.js"},{"revision":"a7dce3d971409a36ad4f17001412285d","url":"build/js/UpdateAvatar-DtpdHwkL.js"},{"revision":"eec672bbff802827e84bc873d6519f57","url":"build/js/UpdatePasswordForm-BNs6Vgrt.js"},{"revision":"397eade4ea8cd5968da59e27a3f45b8d","url":"build/js/UpdateProfileInformationForm-6arEB5rs.js"},{"revision":"786e136c74f2961bd379ee0d7fafd2f7","url":"build/js/UpgradeStripeAccount-CAQCMr3I.js"},{"revision":"bf1c8598af3e329e64ffeba5fbeb3295","url":"build/js/UploadcareEditor-KTnENmIM.js"},{"revision":"8a1a299af522d1961c0ff0cda31b26a4","url":"build/js/uploadedimg-BMa4JKzP.js"},{"revision":"cb534388caf9b76c6f649b92c26c8720","url":"build/js/uploader.module-2jfAScZl.js"},{"revision":"cc91e49706aebb5ee040e01e705cab8a","url":"build/js/UserCarts-Ca_ToC-M.js"},{"revision":"a21ad5460a87e81494eafff51ec93f29","url":"build/js/USTERMS-D4HFWsyN.js"},{"revision":"57d12ca22a695158eee75c9d6c6f43cc","url":"build/js/vendor-D5Ad4wjg.js"},{"revision":"a02d8185b3c8a26f28fd0ca9754d165f","url":"build/js/VerifyEmail-CU7Qnk8i.js"},{"revision":"0ed5791e2fbcb6c031a73ac77386c0dd","url":"build/js/VersionUpdate-CM6AioA-.js"},{"revision":"cfbd90a5acfced091f3bebbd5ddfe5ec","url":"build/js/VideoPlayer-G3OvIpfr.js"},{"revision":"f5569a3e75570449a5c6ae1b7943a740","url":"build/js/VipSupporters-Ds5PQTxu.js"},{"revision":"d894ebe78a1949e660375411f4168ce3","url":"build/js/web-vitals-BoJbDIip.js"},{"revision":"604fadbc16738d300d3e8a3da08b020d","url":"build/js/Welcome-LUeeXa48.js"},{"revision":"0cb282a788f8162512eb73578140d96f","url":"build/js/WhyLove-Cl7BR8y6.js"},{"revision":"735eae84c2473530e5ee3256e6045e7a","url":"build/js/Wishlist-DP_dUdk_.js"},{"revision":"4c09a2a9d1cb2d6ebb1ab964cb8a7c9f","url":"build/js/wishlistbannerimg-PNm9VNvH.js"},{"revision":"250f390c85b1adaa5cce6dbc3b2c9486","url":"build/js/Wishlistbox-DR5lXNsj.js"},{"revision":"90a981f4e37683da4077204088e7b103","url":"build/js/Wishtracker-CxeSkoZt.js"},{"revision":"3d28b8b822d7b9ba853488d6286e495b","url":"build/js/Works-Cz0RgYf9.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/png/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/png/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/png/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/png/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/png/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/png/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/png/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/png/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/png/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/png/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/png/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/png/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/png/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/png/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/png/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/png/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/png/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/png/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/png/giftbasketimg01-UPFBeLeW.png"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/png/HeroBg-CgSE7w-A.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/png/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/png/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/png/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/png/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/png/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/png/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/png/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/png/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/png/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/png/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/png/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/png/kylie-BcKwDcm6.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/png/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/png/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/png/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/png/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/png/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/png/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/png/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/png/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/png/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/png/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/png/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/png/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/png/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/png/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/png/PCICompliance-qTSDRKZK.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/png/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/png/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/png/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/png/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/png/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/png/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/png/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/png/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/png/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/png/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/png/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/png/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/png/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/png/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/png/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/png/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/png/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/png/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/png/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/png/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/png/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/png/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/png/vishitimg01-ClMBzIW7.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/png/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/png/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/png/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/png/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/png/youtube-DDw5LQj8.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/webp/HeroBg-CbJjqro0.webp"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/webp/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/woff2/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/woff2/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/woff2/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/woff2/CeraGRMedium-QrW24R6m.woff2"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/woff2/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/woff2/newfont-BRfniQek.woff2"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
