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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"579e4fe29b455f8e6c6f62fc5ece3c7f","url":"build/css/app-5xNOV2PH.css"},{"revision":"46fe156d0f456d2d1c2ec861373e6a50","url":"build/css/bootstrap-vendor-ChLimcyK.css"},{"revision":"211f9b1ac84d91a04d4d43a78604e9c2","url":"build/css/home-COO0ZGvn.css"},{"revision":"05f40a9010caf9d963da630b2466060d","url":"build/css/index-BOFHmxjT.css"},{"revision":"9e4bfe6784f5f92d571940988d4d2e34","url":"build/css/react-vendor-BfM8lyvV.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"049c0d9fb0f80ec864a6366eb961f346","url":"build/css/vendor-BAZ39jDi.css"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/gif/loading-DKd4CxP-.gif"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/jpg/giftimg-CbenuWDF.jpg"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/jpg/plaid-C3YNig8l.jpg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/jpg/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"215398686b59c28b48984162512f131d","url":"build/js/Accountsetting-C_HUkaKx.js"},{"revision":"c892ac049b229e39c111ad5193b615e8","url":"build/js/AchievementSystem-BJd9-J3x.js"},{"revision":"310f3db8652d1aff37ce51a93d52e2ef","url":"build/js/ActivateCard-ZgFjd0nF.js"},{"revision":"b3c1994be5f55c7cee9e3f9d78022be6","url":"build/js/ActivateSubscription-BsqrP095.js"},{"revision":"49d33e635124ed714dcb9b97ac7fae12","url":"build/js/AddBills-BfmNK-Fl.js"},{"revision":"68876897b7188b075ca92744858a52fa","url":"build/js/AddCart-DnYWsEez.js"},{"revision":"6419c4c7c3edd1ed80a412c4f83c55bb","url":"build/js/AddComment-CzrWPupA.js"},{"revision":"3abbb26985e383c715b483749ca6a63a","url":"build/js/AddGift-CwAKnpE3.js"},{"revision":"0cf1f96dc778a6bd950cfa2f48eca34e","url":"build/js/AddGoal-Bu-oPQjk.js"},{"revision":"887cf45af93abb6b8c679fa98f8a4868","url":"build/js/AddIntro-CfTchh15.js"},{"revision":"2d128cc7416cd6b4ea54885b5878988c","url":"build/js/AddItem-CQrIMtNu.js"},{"revision":"564e84c338901312e0d4cd1618a73046","url":"build/js/AddMembership-CsaP3Y2t.js"},{"revision":"93fa8fb286917cc1b2eefc6109a86a07","url":"build/js/AddPost-Bf59dwNo.js"},{"revision":"fb3dbf3db994c8009281fe177ccc09bc","url":"build/js/AddressForm-B4nEkCGz.js"},{"revision":"94107eb36a26bc65ec4f92ba043fa2ce","url":"build/js/AddRyeProduct-D9C0Huv7.js"},{"revision":"0e69589b397eeb0bfaaf639dbebd68af","url":"build/js/AddShop-CbMjRCoO.js"},{"revision":"891672c3c04543778cf5242496255520","url":"build/js/Alerts-CeFw2TZM.js"},{"revision":"0239d954d1c8e25d031569645b5e4d20","url":"build/js/AllCountries-DqNN3nrj.js"},{"revision":"e4bc3ea0be56026115a8a54b8ffe28bb","url":"build/js/AllWishes-_7Z4GPPC.js"},{"revision":"628fe1e0ccb1b9bc7b0d3e2c4a15b130","url":"build/js/apollo-vendor-DNz0cfaM.js"},{"revision":"7812edd831402bb7b89b24b9d996437c","url":"build/js/app-C4xZCGX5.js"},{"revision":"e486e0e84c8ffc5550a903db0498b555","url":"build/js/app-store-BzqB1THL.js"},{"revision":"8d1d36c2ef06cbb9f3c2e1a75fc3ba21","url":"build/js/AuthenticatedLayout-CcP_mx9n.js"},{"revision":"09008be3b1b32adce9781a03579d0f29","url":"build/js/Avatar-DPIM7wz0.js"},{"revision":"d6618376825d6330b72e3fe518fff77d","url":"build/js/Bill-CUk7wx2N.js"},{"revision":"f9a84a44a1510a0a5900003a0243415b","url":"build/js/BillCheckout-Ch1nFjhN.js"},{"revision":"bbd9c8079fbaa40172f2d77e78619c3d","url":"build/js/Billslist-BRhsc2a6.js"},{"revision":"9fcddb860185714ecfaf55a15448bd3a","url":"build/js/BillsTracker-C3rpb2Ml.js"},{"revision":"83b713052335439753e9ac0165a2819b","url":"build/js/Board-CV70AyHB.js"},{"revision":"0d039fccb02159e7a1b16058da9dd4db","url":"build/js/BottomBar-b9uxmdSc.js"},{"revision":"63eef5be71e1e03c7f53ede948a7dbfb","url":"build/js/BuyShopItem-B6loFCOU.js"},{"revision":"f25859a0af2c8b4ac753d85f12777815","url":"build/js/Cart-C-COCwDp.js"},{"revision":"4111e07e6b5e0b462ecfbf1585fd7f4d","url":"build/js/CartItem-BU62Jy8t.js"},{"revision":"16129f7f6bc611799406813dd7367b5d","url":"build/js/CartItems-BvP8jlBg.js"},{"revision":"75cd7245f9c3fea1129afd36a42c86bc","url":"build/js/CartListing-BHVZ8_Ud.js"},{"revision":"c7814f62aa6ae3144985410f50d3907f","url":"build/js/cartproductimg-CMV7Is1K.js"},{"revision":"b1878811390b588ad5880d7cac392b04","url":"build/js/CategoryLeaders-Bkjj3VLF.js"},{"revision":"5b8ab43cee014cf13207c8f9eda9219d","url":"build/js/ChangeCurrency-Di_zBBLC.js"},{"revision":"113e9ac88d80ecfd975c7d850682d64e","url":"build/js/ChangeVat-B0mh8fuk.js"},{"revision":"0560231842ff3c4efba1e67e31bfb301","url":"build/js/ChartDashboard-fZIdnqnO.js"},{"revision":"2efcb25f611736cf59c7d3e4b5f5dc4c","url":"build/js/charts-vendor-B9n03d7p.js"},{"revision":"8ef324a6305b1aa5f99e1898b69559d7","url":"build/js/ComingNext-R2ESFzMD.js"},{"revision":"92e9d957229f29b2fdad05ecb83deee3","url":"build/js/Comment-DxZS-B2f.js"},{"revision":"5dbfdf0f2927e33f9f482c9299543f49","url":"build/js/CommetsLists-DoUw0jNL.js"},{"revision":"fff13eee8ea476709a39100095bfc0a1","url":"build/js/CompetitionStats-TnF_-inn.js"},{"revision":"8b28420e71814fd16a6ebef1f35b1082","url":"build/js/ConfirmPassword-DcXQTtB9.js"},{"revision":"6a76d4a50e719448cda9b67c24b2a9c4","url":"build/js/Countries-D1WJw3P2.js"},{"revision":"cd558235785b271a666ba4fc5eaa29b9","url":"build/js/CountriesShipping-BEjaFznT.js"},{"revision":"2310b0a1d53d9119efc52c176143092b","url":"build/js/CreatorVerification-DeEqQJFr.js"},{"revision":"e7eb5735768e8490f9ed79532c0565f0","url":"build/js/Dashboard-DrIPp1cS.js"},{"revision":"b03aec773ed7952f0b922ee3075b1476","url":"build/js/DeleteStripeAccount-DXxifj7j.js"},{"revision":"43156358ce12800ab825a39122285d7c","url":"build/js/DeleteUserForm-lmqxyD4s.js"},{"revision":"dc9c9e8ecca38c377be0316a8f1a48cc","url":"build/js/DeviceID-DB2Vqvuy.js"},{"revision":"47ffb328d037f9e300536f76898b4243","url":"build/js/Discover-9kNGeNWR.js"},{"revision":"5f2e631ad8fd837d813fb55c1a8ab372","url":"build/js/Earnings-BMwEfe92.js"},{"revision":"5fbb28c50d624ffbe715b8f40d67316b","url":"build/js/Edit-CcBfpWwb.js"},{"revision":"4bcf561da23439c70f9b771d86a3132b","url":"build/js/EditCategories-Ds6iYHbr.js"},{"revision":"1597ee24be6ca005bac9d9ff29912a23","url":"build/js/EditMembership-BkCv5IMK.js"},{"revision":"00292522717ff1cd951171ce06bc3de5","url":"build/js/EditProfile-CawGKtoA.js"},{"revision":"50632939f1902a26b95f4899536f706b","url":"build/js/EnableCardCapabilities-BKDP-iIX.js"},{"revision":"6fd420708efb3043864f940664bf9129","url":"build/js/EnterOTP-Bu9CGqxX.js"},{"revision":"9893353c22e3ad707119d87a58eccff1","url":"build/js/ErrorPage-DTHtEMm8.js"},{"revision":"9def574c328a85ac7866c52e3748784f","url":"build/js/FAQ-B9qtg9ff.js"},{"revision":"73af831a928bcf05e20253d58e27e71e","url":"build/js/FeedList-BrrD_mnu.js"},{"revision":"92a0fa0f245abf31ccf4c677e2867289","url":"build/js/FollowButton-DG-D4TN7.js"},{"revision":"82d850a6d9bcbf58c0406dbf99ef796f","url":"build/js/Footer-B2BzGsri.js"},{"revision":"bdd40c0b078a7f1b77348645138e73f3","url":"build/js/ForCreators-DKvsWmsO.js"},{"revision":"fe93dadb7e79a9fca68fc505104a90c2","url":"build/js/ForgotPassword-TlcLMLjl.js"},{"revision":"23d862ab013965cb783676002434108b","url":"build/js/FunPart-DD1GUAn4.js"},{"revision":"938016df190539626501ac94fd729fd1","url":"build/js/GetCart-ChWcS0pb.js"},{"revision":"b9a644de1020c171e623e4461a6ab127","url":"build/js/GiftAddCart-DXiNuSzu.js"},{"revision":"b0c7aa2fb1d98ccbf226c4c3d50207ed","url":"build/js/GiftEdit-BiCn6zx1.js"},{"revision":"19ac4ddadee2587a3b7b0fd3dcc3817f","url":"build/js/Gifter-RICPeGck.js"},{"revision":"279eaf7cdc52ba8a882e1e7f42d71637","url":"build/js/GifterCardVerification-DOf6qoZU.js"},{"revision":"04814606ddc60734770801afe3488ee6","url":"build/js/GifterFeed-DRllxPgS.js"},{"revision":"636f1490151fd5228e9fd250488f50f5","url":"build/js/GifterItems-2CNGw5kF.js"},{"revision":"8203f4087fba64f2feb4be88e1fa057f","url":"build/js/GifterMedia-Ce0G0b6x.js"},{"revision":"71fed4d2202b0337f1e2c64b6c2a507a","url":"build/js/GifterMembership-BK8Ej9EC.js"},{"revision":"60b596961d3bfbe0fef5a2293532f260","url":"build/js/GifterSubscriptions-BdIZ1d0a.js"},{"revision":"230fcfc20c3da0d546adae2b677cdbec","url":"build/js/GifterTips-DPu81Msz.js"},{"revision":"2619ccc0001795c9eebf3a3907b092b0","url":"build/js/GiftListing-D0w_5RD2.js"},{"revision":"fdba3c7a7ca84895833d03928cc5330c","url":"build/js/GiftStore-DYdTrF8v.js"},{"revision":"f45554d71043cd44c5962e26b031d76d","url":"build/js/GlobalCheckout-BxQUEo7F.js"},{"revision":"fa39c3ca1031a85185622513ada482bb","url":"build/js/GrowthTrends-e3JkneKh.js"},{"revision":"e3942d831047a360071228654a1fbf10","url":"build/js/GuestLayout-CpRsIS0U.js"},{"revision":"ceff102ace6861d5ffc3305561c614cc","url":"build/js/HappyCreators-CDLGa7IA.js"},{"revision":"007165cbaad1952540f955775538c6c0","url":"build/js/Header-DJLvr6yU.js"},{"revision":"0e4b219b04120e4cd308820ba5b00e31","url":"build/js/Hero-C0Pryp4C.js"},{"revision":"1a738e9807113a20f0e5e54e7b807174","url":"build/js/Icons-DDoPAyE5.js"},{"revision":"5e6bbb0831da569a739e0f691a0aee45","url":"build/js/ImageGenerationWithAI-D6qIln9D.js"},{"revision":"61c9e5ffdeba6d4e752e09167c056be2","url":"build/js/InputError-Bgs8Em7d.js"},{"revision":"8efeb3c0694437549ce582aad4da87cd","url":"build/js/InputLabel-B-jOXSGu.js"},{"revision":"ab8d8f6f884a1a522f01094ccb520806","url":"build/js/IntrosVideos-B6tF4jC1.js"},{"revision":"fdfaceb371bfa78136f73428035793e2","url":"build/js/Item-Eo1dorNj.js"},{"revision":"234de5f9b00db0cf6649797c0f5ab107","url":"build/js/JoinUs-5gDkYAHb.js"},{"revision":"233494755f3cea20cb0efd7dbd2081aa","url":"build/js/LeaderboardStars-Dv2vr74d.js"},{"revision":"ba5c1ffcd81f6924143656c03273795c","url":"build/js/LinkTwitter-Boh3Dd-F.js"},{"revision":"4ae277f1f1e30720f33b01e81cba4ac9","url":"build/js/Lists-C3EseyJh.js"},{"revision":"cb47dd585967aef083cc43511389bfab","url":"build/js/LiveBar-Bi-tfSKD.js"},{"revision":"fb89a8426a39c2eb147668670ee49404","url":"build/js/LiveBarSection-BeyMqhXZ.js"},{"revision":"032c2e58a4e7e0636b8749a341b633e6","url":"build/js/LoaderButton-DkBTNcSg.js"},{"revision":"b5831673ab7a5bffa4dbf1ddd9eb6d86","url":"build/js/LoadingScreen-Cl03731N.js"},{"revision":"55257f315fc42d39dab1a1d54c25ea2c","url":"build/js/Login-BoJkDfu-.js"},{"revision":"c94ba50865d3a8a9ccb5cab442a9a7ff","url":"build/js/logo-B5lL0K2o.js"},{"revision":"292f2c8f5780fce5f5c21960df1bce49","url":"build/js/MagicBellNotification-hQzTQrpc.js"},{"revision":"aae2b67f3c7565395b2ec5cc1456a45a","url":"build/js/MemberCheckout-DG0jTJdp.js"},{"revision":"1b59802f46e9e85fdf7b4fec848c4dad","url":"build/js/Membership_dashboard-DJK0gHax.js"},{"revision":"314816006943d5cde1e2bae511df8c69","url":"build/js/Membership-BwMbX-jh.js"},{"revision":"223f00848840fef0bef23a1f136666f9","url":"build/js/Membership-CPFYWKU9.js"},{"revision":"94dcaaf82a444045c474374425e3cd38","url":"build/js/MembershipLists-BlokihFx.js"},{"revision":"1fb6223d19ef16e160fc8ce59a381c3f","url":"build/js/MembershipsLists-CI4l4iex.js"},{"revision":"cbb7d15db53e0fa3f8d202257a081272","url":"build/js/MembershipTracker-DSfpR74P.js"},{"revision":"7c1f2d9ed2cd0f34df723c0eba2c9d90","url":"build/js/MonthlyRevenue-Bne4tMHa.js"},{"revision":"a3ed110692e94875158c1dd3a30915d3","url":"build/js/MyGoal-Dt0umsKR.js"},{"revision":"ed4b344dcaa4d45a4fd9d7f12d4c115a","url":"build/js/MyShopProducts-VTLKHkua.js"},{"revision":"6ac8432f43c1b62760bb05c2c1b6a904","url":"build/js/Nocontent-B4sZzMhJ.js"},{"revision":"f3f0f59ac880cc2222bf918c4c29a37d","url":"build/js/noresultimg-B_g4pD0M.js"},{"revision":"f0ff900aed51103db8d1f5c52aaa5e36","url":"build/js/NotForBusiness--IWt-mrn.js"},{"revision":"04fdf97051e7c65d98cd5b733aa8af6e","url":"build/js/NotFound-Dty4J-jK.js"},{"revision":"ff7f3e25a3a42453172a10065b39e7aa","url":"build/js/OldSubscribe-D5s8Kws3.js"},{"revision":"3e2eb263f117b249a8f9249a9e8f59b4","url":"build/js/OrderDetail-37NhnQP6.js"},{"revision":"e1f622bd96b03c424f9e2d4cca2ee90e","url":"build/js/OrdersLists-DJT0XEFR.js"},{"revision":"82b934d9867d3df74d0a75707b72b216","url":"build/js/PaymentDashboard-BXwQKalL.js"},{"revision":"cb50ab3b538ecb5be8d60116e2032e42","url":"build/js/PaymentSlider-CL-oI0OB.js"},{"revision":"da88e1004b4ef7919555231fd7f8be0a","url":"build/js/PlatformAnalytics-ynIV6vMH.js"},{"revision":"3d78d997fa03dc3afdf4771db611332b","url":"build/js/Popup-DVE_d0Mz.js"},{"revision":"39196063fdb02ad1338998ee65e005cc","url":"build/js/Post-CmJkshoP.js"},{"revision":"f376a4eff4394159ca8cd1ad767abbb7","url":"build/js/PostLike--jSwYoNZ.js"},{"revision":"aed201bb77e03ffac02b1139d57c40bb","url":"build/js/PriceFormat-JmKqYQuf.js"},{"revision":"14342d6c6d9c968f8fbd509b9cde5363","url":"build/js/PrimaryButton-tzYNTPyB.js"},{"revision":"29f89887447d6ba8dff4ae073c388892","url":"build/js/ProfileProduct-DGs7WO9O.js"},{"revision":"76757e91932d43606c1a372af4f5f8d1","url":"build/js/ProfileProduct-DUx1rEEl.js"},{"revision":"dadfb200ccbbc7ff92befd090c1a6d03","url":"build/js/ProfileProductLists-f9eX0FIl.js"},{"revision":"cadf8cbda73180283a6fbf3366728b8d","url":"build/js/ProfileProductLists-htPNiTbD.js"},{"revision":"d1c7c9bd8163ec1c5e9aee0516636a71","url":"build/js/ProfileSteps-D9YpjxxK.js"},{"revision":"c43d55f224bafa829cad4f3600335348","url":"build/js/Promotions-Cizhv0e1.js"},{"revision":"fe69975d17857fc6709cb547898f5bfa","url":"build/js/react-vendor-DSUPSVPo.js"},{"revision":"a5d53c700103c6ff5ab1c41500161a22","url":"build/js/RecentSupporters-CQhJeYxX.js"},{"revision":"c2b4879315c008721c1256f4340bc1a9","url":"build/js/Redirecting-B2Mk-j7Z.js"},{"revision":"262a31b6f109d541b796501b4b2d64f0","url":"build/js/redux-vendor-DkYi0sIi.js"},{"revision":"6ca31ab397a97601004c2c97f233ef5b","url":"build/js/Register-DrdzW8k2.js"},{"revision":"fd63b04acc92588f86e56b4d145114f7","url":"build/js/RemoveBill-DD_cBJt1.js"},{"revision":"5cbc75d2d0d3e533eb9f08ae2fc25c37","url":"build/js/RemoveMembership-BySIMMWw.js"},{"revision":"677d31f466acecd3a648ceb486fc0d0a","url":"build/js/RemovePost-gqrjJsdN.js"},{"revision":"019a2799045a0cf6f184c8e3117923e3","url":"build/js/ResetPassword-BMIezLkI.js"},{"revision":"52c8a0fcfb15d3d3e99c929575b0f337","url":"build/js/SayThanks-Lib_8PBf.js"},{"revision":"75f115e2247c1318b3010022454fec3b","url":"build/js/SecondaryButton-DWPpP1ar.js"},{"revision":"5f6bfe8c9315cd6949e5671c9052174e","url":"build/js/SendTip-DCjv5DkZ.js"},{"revision":"10a00f05e5600c60c1adccf1a2d4da40","url":"build/js/sentry-vendor-lMNL82AL.js"},{"revision":"d6e50342790b632a273b96faa6bf4a40","url":"build/js/ShareProfile-CGhnE6Lq.js"},{"revision":"7955a9b893c922642aff5f7bef78810a","url":"build/js/ShopPage-BfSgowW7.js"},{"revision":"e1cde2b5edbecf7a71992131154ba36a","url":"build/js/ShopTracker-DKnGGiJy.js"},{"revision":"d841a26a9cb475a8e3a17e972ef00ee2","url":"build/js/siteicon-DsSyz8LR.js"},{"revision":"31958566c24f2d47a2be54db4fc25f11","url":"build/js/SiteSubscription-CntJ8BOl.js"},{"revision":"69ebaca6974d726f5fb87f07372ea031","url":"build/js/Social-19cOvNkV.js"},{"revision":"14a5f51330120402dfd244ae9d5afe44","url":"build/js/SocialLinks-BzBA83__.js"},{"revision":"f8cb698944b01d149c68d57a4fae69cc","url":"build/js/Stripe-BTm3u5yA.js"},{"revision":"c086ccc769bb767e80cae68246d453f5","url":"build/js/StripeIdentity-Dnb4RSY2.js"},{"revision":"99eca72ad66ba03fd7b4fe39d4ca6c57","url":"build/js/SubCheckout-BzFj6l02.js"},{"revision":"7317dc58a8a829d5a25310e796daa0a8","url":"build/js/SubcriptionEarnings-BAdKotP3.js"},{"revision":"154e68b4b830ed1991c244127a334417","url":"build/js/Suspanded-D50bxX4g.js"},{"revision":"e5e2a41334a09115d77197b04c4128c0","url":"build/js/Terms-s1CGiROp.js"},{"revision":"db1432d6d433903c903c1de2bb8a7782","url":"build/js/Test-4jXvn25s.js"},{"revision":"ccbe26382daf672c542baaa90d114437","url":"build/js/TextInput-BArbr1q9.js"},{"revision":"dcf9f018aa505bebdccab14b38f83ecd","url":"build/js/TFA-BzIwu-z0.js"},{"revision":"53bbcfcd096c88321403dbfec078d542","url":"build/js/Thankyou-Bm5L7EvB.js"},{"revision":"c0f4c895d3774b7e0f263f9151a0521e","url":"build/js/ThankyouMessages-D9autbo3.js"},{"revision":"f2a6d70e8390b328dbd7e2e0601444ac","url":"build/js/ThankYouRye-MJsDPCi5.js"},{"revision":"7c25c757900ce5812d8e130b8d589977","url":"build/js/TimeFormat-CNyVWBrI.js"},{"revision":"fde19c912924da50f3593f13bf41c044","url":"build/js/TipInner-ButXT65a.js"},{"revision":"53dda929fb56a9206320228efae368e1","url":"build/js/Tiplisting-ZAmKYXch.js"},{"revision":"65ddc98992cfc1160b3bcd6474bb50a2","url":"build/js/TipTracker-BLNTuzPP.js"},{"revision":"0a09003f4469771d5979837f00fdf862","url":"build/js/TopEarnBills-CzaZuBls.js"},{"revision":"0ffec5dad93ee53bdb0e91e2e64c6c48","url":"build/js/TopEarnWishes-CNQXZUMq.js"},{"revision":"4e579fb495bd1c36299bdce5b19b066e","url":"build/js/TopSupporters-BSY8F2Nl.js"},{"revision":"aadaf74d3de3e45d9c874e7a3ec18305","url":"build/js/TopSupporters-D5T_1LdA.js"},{"revision":"60b547864a2c7673891489431e03a488","url":"build/js/TrustBox-CdF2kwo5.js"},{"revision":"68c8b947f93226427e95f660e004c481","url":"build/js/TweetNow-CqyyFp0U.js"},{"revision":"2d9babf60fb3cc710e8ba81d65c532df","url":"build/js/UpdateAvatar-9PvqC8O3.js"},{"revision":"283a8c3be5a1facd7dac99704a41343a","url":"build/js/UpdatePasswordForm-DEUfSG2s.js"},{"revision":"7276c9ce8139d9b970b8fa3b11e3a599","url":"build/js/UpdateProfileInformationForm-DKIzlTOx.js"},{"revision":"a044694eb8b194b15e1cbab58c94a4f1","url":"build/js/UpgradeStripeAccount-DZWIdLkq.js"},{"revision":"2e24d5a040f925ca216c195aa288eb7b","url":"build/js/UploadcareEditor-BigYN4nb.js"},{"revision":"8a1a299af522d1961c0ff0cda31b26a4","url":"build/js/uploadedimg-BMa4JKzP.js"},{"revision":"fba4e843fdb3aa433c120243df5e3ce2","url":"build/js/uploader.module-Cg1tZbVr.js"},{"revision":"88beb2e4bf13919070ef6e31cbf42611","url":"build/js/UserCarts-OGJ6XOTp.js"},{"revision":"28c38dbf421af54863d90ddba9a835c2","url":"build/js/USTERMS-BXW-McHj.js"},{"revision":"e055d5721fc8a7817042b3930b5ff6a8","url":"build/js/vendor-BHA0k_P9.js"},{"revision":"0d7ee016df8617af92be5ff630d84149","url":"build/js/VerifyEmail-2e6k1202.js"},{"revision":"f91afd8d43a7c0ea456ba151dd56ba44","url":"build/js/VersionUpdate-Eli8uZRa.js"},{"revision":"0dc0403ba70fdd58278c598c26712201","url":"build/js/VipSupporters-V5B3aB4J.js"},{"revision":"f30ec90b8e3c2bfb6fc350c1f0023baf","url":"build/js/Welcome-D3O9YyGR.js"},{"revision":"7f0963347692c7f2856c52f48ffe991a","url":"build/js/WhyLove-Dxkdxbpf.js"},{"revision":"eaeb84bde1b410382eb7f800a3342a1c","url":"build/js/Wishlist-D24yQ0qk.js"},{"revision":"4c09a2a9d1cb2d6ebb1ab964cb8a7c9f","url":"build/js/wishlistbannerimg-PNm9VNvH.js"},{"revision":"2c28c82c78b1f4f1caf9174c0defaf44","url":"build/js/Wishlistbox-DK7uxKB-.js"},{"revision":"cbd2bda6ee8edb8bdc559bed954b9b0e","url":"build/js/Wishtracker-CNQDyBqD.js"},{"revision":"cce530a3cd871d3ac0d97898731360be","url":"build/js/Works-Cl-hn6tw.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/png/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/png/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/png/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/png/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/png/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/png/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/png/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/png/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/png/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/png/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/png/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/png/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/png/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/png/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/png/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/png/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/png/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/png/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/png/giftbasketimg01-UPFBeLeW.png"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/png/HeroBg-CgSE7w-A.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/png/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/png/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/png/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/png/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/png/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/png/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/png/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/png/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/png/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/png/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/png/kylie-BcKwDcm6.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/png/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/png/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/png/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/png/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/png/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/png/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/png/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/png/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/png/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/png/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/png/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/png/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/png/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/png/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/png/PCICompliance-qTSDRKZK.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/png/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/png/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/png/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/png/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/png/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/png/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/png/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/png/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/png/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/png/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/png/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/png/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/png/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/png/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/png/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/png/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/png/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/png/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/png/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/png/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/png/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/png/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/png/vishitimg01-ClMBzIW7.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/png/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/png/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/png/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/png/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/png/youtube-DDw5LQj8.png"},{"revision":"3b3ca401f4baf59a460d855f9131d6ce","url":"build/woff/CeraGRBold-Bd3y0W8Q.woff"},{"revision":"9c6eb595687f4964ffd90b9ddb0284cb","url":"build/woff/CeraGRMedium-BaNrRRue.woff"},{"revision":"a2859ba3d890532398fa223454a7dc8d","url":"build/woff/newfont-D5h_Awp9.woff"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/woff2/CeraGRBold-D5ePNs0e.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/woff2/CeraGRMedium-DoVttStx.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/woff2/newfont-BRfniQek.woff2"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
