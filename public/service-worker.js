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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/avif/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/avif/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"f5f14f96cba4007e57767f6fd17f10df","url":"build/css/app-Dyp1uPRz.css"},{"revision":"46fe156d0f456d2d1c2ec861373e6a50","url":"build/css/bootstrap-vendor-ChLimcyK.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"049c0d9fb0f80ec864a6366eb961f346","url":"build/css/vendor-BAZ39jDi.css"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/gif/loading-DKd4CxP-.gif"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/jpg/giftimg-CbenuWDF.jpg"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/jpg/plaid-C3YNig8l.jpg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/jpg/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"45592907a980b75f5f0adeece640de71","url":"build/js/Accountsetting-CZqYrA4V.js"},{"revision":"7030032a24242028ccb7288cfb7b72a0","url":"build/js/AchievementSystem-BmgDOZSA.js"},{"revision":"b5482113e471f1b255ee71cbda83442d","url":"build/js/ActivateCard-OM-r2LTx.js"},{"revision":"1d54e4c52d10768cea5b69dd78dce66e","url":"build/js/ActivateSubscription-DuJPuM4-.js"},{"revision":"7f4672df6dd9817c42d97cb5f9dec65c","url":"build/js/AddBills-CdE16FUK.js"},{"revision":"01b0628739dc65363f880cbe45e4c710","url":"build/js/AddCart-BHBMBXm8.js"},{"revision":"3a259498e5c9314eb8b5f0ad8e65daa4","url":"build/js/AddComment-DhOiGNqM.js"},{"revision":"8d967a11022235b3e2a63ad6909c2d83","url":"build/js/AddGift-RYq-djp7.js"},{"revision":"cdef094aabce3277758050493d0b751b","url":"build/js/AddGoal-Bg8xdpxH.js"},{"revision":"3880652a70aa321155106429ac139f4f","url":"build/js/AddIntro-yGN7Xq8D.js"},{"revision":"4e945d40e5a2ece713512a05b000b876","url":"build/js/AddItem-CxSm_Ji_.js"},{"revision":"ea2a77142f97a9884834663e7bbd0465","url":"build/js/AddMembership-B1tliagB.js"},{"revision":"a3989623ba4c37edec1d7ac7a5f1f84b","url":"build/js/AddPost-Cx3HLRdg.js"},{"revision":"161d9baaa731381cbc888a3dfde82d4e","url":"build/js/AddressForm-q0bazveW.js"},{"revision":"66ba0edf560365b8e4e85bca9bfdc597","url":"build/js/AddRyeProduct-hVAitAbN.js"},{"revision":"e5b7187f377852590d60f7e91a89f8be","url":"build/js/AddShop-DTQqg0dn.js"},{"revision":"4a00eb6b4d3414c4640f5661e90fd722","url":"build/js/Alerts-BvlQGfZ6.js"},{"revision":"77563fe83a47904ab69953d8367c56f6","url":"build/js/AllCountries-D41v2wmi.js"},{"revision":"d8bc475b731ce3d8ad8b8db0a209a53a","url":"build/js/AllWishes-CIIjSfwT.js"},{"revision":"3ae7d4004dcc23dd2e50074a370209c2","url":"build/js/apollo-vendor-0DJq2opa.js"},{"revision":"ce68eb735a1942a2a5a78f6c7c76aa86","url":"build/js/app-PpkXnyZZ.js"},{"revision":"0d63276164d41a50fd1cb1ec9f5a008b","url":"build/js/app-store-CxUrxEC2.js"},{"revision":"efae1edc10c0f7ce6b130e252c6786a8","url":"build/js/AuthenticatedLayout-BtKOEGiB.js"},{"revision":"5105326daf7e390cd3f8a8d9d0b70e84","url":"build/js/Avatar-CQ3HAQLp.js"},{"revision":"b9aec92d393ab9e22f6200ebe57201e6","url":"build/js/Bill-CHUaFVkw.js"},{"revision":"e1ee58d145256312bfdc91b4d808fdbe","url":"build/js/BillCheckout-BoeYfeZr.js"},{"revision":"10584d2ffe4738cfb7896ca56449b16d","url":"build/js/Billslist-BgndAdu1.js"},{"revision":"5cde499bb78cbf5bbacda0009aa46c88","url":"build/js/BillsTracker-BmX_H81b.js"},{"revision":"3f0b3184417c94f328135edbb6857185","url":"build/js/Board-B9q-N7Nn.js"},{"revision":"c3d4f7243e8157b9c95da39f27c92995","url":"build/js/BottomBar-C_KxTcua.js"},{"revision":"31aa77406e2fb7843622efb17a8c4c9f","url":"build/js/BuyShopItem-tTkP6XxL.js"},{"revision":"959c0b0d235e1da6f1ae1079cc23623d","url":"build/js/Cart-Cd1OEAzd.js"},{"revision":"0ac156403ba2663913b8fc518e36571b","url":"build/js/CartItem-CrG7n_6u.js"},{"revision":"c03823facc92bc4f6b57b30e51b8136f","url":"build/js/CartItems-twcMpAO9.js"},{"revision":"921b0accd88e1e48f9dda1681ce7acba","url":"build/js/CartListing-fMPxwboH.js"},{"revision":"c7814f62aa6ae3144985410f50d3907f","url":"build/js/cartproductimg-CMV7Is1K.js"},{"revision":"1219b43262593c75e7b99517f9c2c27d","url":"build/js/CategoryLeaders-i_229ShF.js"},{"revision":"0893204d88da6a4cbc3a8faca29b781c","url":"build/js/ChangeCurrency-COw7T-mL.js"},{"revision":"595af07ce8eb4d79c83443f7fd716722","url":"build/js/ChangeVat-DkJAN3oJ.js"},{"revision":"e3ffb00ffddee0bfba698019f8100350","url":"build/js/Chart-RdKpcoWW.js"},{"revision":"acb225c4d992bd615ecc0e1c55e18248","url":"build/js/ChartDashboard-BxPUbvtq.js"},{"revision":"622cb19971fc8469bbfd40a8d751ffc8","url":"build/js/charts-vendor-B6DA6oGP.js"},{"revision":"c8e241dc1c29a4ba6d1bdb718ad9d49a","url":"build/js/ComingNext-sTUR-IHX.js"},{"revision":"f3df3b12f768ccb61329c1a62b9548fc","url":"build/js/Comment-DT98YIuY.js"},{"revision":"d05deab92d35041e86debb7b90b81596","url":"build/js/CommetsLists-4rwKgapZ.js"},{"revision":"d67099d8b9a7dfb1bd63cc3872c007d6","url":"build/js/ConfirmPassword-h0bYOCOW.js"},{"revision":"7c202a22d286e365cfcf2c313b6a8149","url":"build/js/Countries-dryP484f.js"},{"revision":"1d9192d34209dc74ea41b29cb175d629","url":"build/js/CountriesShipping-CO03l1nv.js"},{"revision":"c4c305c9cc53009f98c174f7487cfba9","url":"build/js/CreatorVerification-DWy3EWMw.js"},{"revision":"f213e53f37796b0cfe476f5de2a8a1d8","url":"build/js/Dashboard-C02TJo-p.js"},{"revision":"ea7fdfd9a6171676ec1924f47a478315","url":"build/js/DataTable-Dnou7ceE.js"},{"revision":"f52617aee8ff843594c10b09e99089ef","url":"build/js/DeleteStripeAccount-Dgxk06Ct.js"},{"revision":"2c37b162aa9637853d2d18c8768d1e42","url":"build/js/DeleteUserForm-D1KXKV17.js"},{"revision":"81c378315dbb5a51f76a3c0e259b0194","url":"build/js/DeviceID-G6asOSsc.js"},{"revision":"6d92c163940b859d32d85e2b9cb5fa49","url":"build/js/DiagnosticPage-DEqkRvLG.js"},{"revision":"15c78896d7723d6348065870e477bd53","url":"build/js/Discover-u4JdUe-L.js"},{"revision":"a684f5035fdb0f6bf91c237be6969fed","url":"build/js/Earnings-BV28K4QO.js"},{"revision":"6cd90922e17e9a265dd164cf494af515","url":"build/js/Edit-dtpqC6YW.js"},{"revision":"9e43e58451c08d08db539eb843bda351","url":"build/js/EditCategories-CRaHgEA-.js"},{"revision":"b9641c691a1a23043163c127a073e490","url":"build/js/EditMembership-noV0uqu7.js"},{"revision":"f1345e250f8453d64b2ce1d50693cd1e","url":"build/js/EditProfile-D5nk2Tod.js"},{"revision":"a4425be3bfd296754bb73cc8cdd2c167","url":"build/js/EnableCardCapabilities-oshZJ0Ru.js"},{"revision":"a856e8f4c7f3c5f43743c9df0b6117ae","url":"build/js/EnterOTP-Cwf08JDv.js"},{"revision":"991048524973b5ced2b132713d3b9a14","url":"build/js/ErrorPage-CkFE18t4.js"},{"revision":"37cd36f717415efb6a11512a164d3513","url":"build/js/FAQ-JAhEMa_E.js"},{"revision":"74fbccbbe28727614ddaaf1f742c798d","url":"build/js/FeedList-lPfJcZ_P.js"},{"revision":"e6998e9f85c0bb2fb0ff7ebea3c7d270","url":"build/js/FollowButton-BMjWUUhe.js"},{"revision":"283dd8e1dc0bab261879d40b6f2a2853","url":"build/js/Footer-BqRYOb8p.js"},{"revision":"44ecd42a5d6c335faf8c74b1397217f5","url":"build/js/ForCreators-C8WzHJc7.js"},{"revision":"4702408c5d52785cdca97f8fcb4c8385","url":"build/js/ForgotPassword-aJSpt8L9.js"},{"revision":"42abae435900879efc5068d233d6415d","url":"build/js/FunPart-Cih0XJ_i.js"},{"revision":"31c768596f26bd366c4d88f9100f4fbe","url":"build/js/GetCart-B-7vDWOd.js"},{"revision":"c229fa440f22994e680b8fd2cb9c5b86","url":"build/js/GiftAddCart-BescZprv.js"},{"revision":"27172fb9a8e31c68b4e3867d0bad1f56","url":"build/js/GiftEdit-BKmqrzrj.js"},{"revision":"2be34280383b6baa16553cb88b4fd168","url":"build/js/Gifter-DX7AuBsY.js"},{"revision":"f94ad1533ffdcfefe156c7a1862c1621","url":"build/js/GifterCardVerification-BigQfGEN.js"},{"revision":"93801dd1b3e3c54e1db76c60871c58da","url":"build/js/GifterFeed-BuXrDTCV.js"},{"revision":"5b661d787e333b17db2823659445cf78","url":"build/js/GifterItems-Cx4aPRGZ.js"},{"revision":"751ce69486a73db76ac2f346ac5d8686","url":"build/js/GifterMedia-CGdYTAZG.js"},{"revision":"628a0c2e1bcb5535cbbccd225ed818d0","url":"build/js/GifterMembership-BKc8ypax.js"},{"revision":"6612757d2664e3cf489ebb5cb02f3a6e","url":"build/js/GifterSubscriptions-Dr0z3MpE.js"},{"revision":"d3f3ba91484eeada4bc3736fab4104a3","url":"build/js/GifterTips-DPYZ7PXK.js"},{"revision":"f31657879953816c560f90becf2029c0","url":"build/js/GiftListing-Cyj9zTRy.js"},{"revision":"19b63c801101443ce98be6be16113332","url":"build/js/GiftStore-CZvJRj9t.js"},{"revision":"1ed569d616ac68194f2f166c9a960577","url":"build/js/GlobalCheckout-Qt8iEKpF.js"},{"revision":"e6a909da9ba884396297ac54296f9967","url":"build/js/GrowthTrends-DD-Caq49.js"},{"revision":"63837e3a39e8d054573edaa56720c453","url":"build/js/GuestLayout-QW9-1St4.js"},{"revision":"5037305058faf25acb58d2aaed972e7a","url":"build/js/HappyCreators-I6v9C74z.js"},{"revision":"46e20f66fd9bcc6cac309c3ac5be2d7f","url":"build/js/Header-D8OF8b4V.js"},{"revision":"fb47bb2bf0d23be92cbe9771ff94a090","url":"build/js/Hero-DgxB8DMb.js"},{"revision":"08c6caa82dfdcef06b0ba923597d28af","url":"build/js/Icons-a3Rf9GGe.js"},{"revision":"5d44fe5b87fab69383c65cdff82b125c","url":"build/js/ImageEditor-BWNlj6wl.js"},{"revision":"2c172e99087d66a6eb6996856390ff94","url":"build/js/ImageGenerationWithAI-BN_RT8X2.js"},{"revision":"f73111c0c6eddae24ea458478f26d874","url":"build/js/InputError-Cbow4P5C.js"},{"revision":"52c7f0424b4041f054fa8fc228648a30","url":"build/js/InputLabel-DHDLGImm.js"},{"revision":"daaf6922940b0f5c0c15ab4daa9e9798","url":"build/js/IntrosVideos-ZjMShIcd.js"},{"revision":"8034cfd1a9df9a5c9a06e383011fa55c","url":"build/js/Item-CutkvQ-I.js"},{"revision":"b3c700ff5786d74e07b388dfe815197c","url":"build/js/JoinUs-BnGSjipV.js"},{"revision":"145e03b856e003c4805e67b7a56bc20a","url":"build/js/LeaderboardStars-BVmVf4co.js"},{"revision":"8481719e557b005467da32bb338ced86","url":"build/js/LinkTwitter-CBE0IGVE.js"},{"revision":"c3f9c5d4597270dc3b41e6062c4a599d","url":"build/js/Lists-CabwDF8s.js"},{"revision":"2963158a0c82aa9666e7ee18e9bb73e6","url":"build/js/LiveBar-CLHEpvC4.js"},{"revision":"65e0498248b60268157bec40678872a4","url":"build/js/LiveBarSection-T4LvXpFn.js"},{"revision":"c1420308e3c43857658b1b81e212083a","url":"build/js/LoaderButton-Bo7r6oQh.js"},{"revision":"4be3634331e59b55014fecc94854fad4","url":"build/js/LoadingScreen-uSVskyzW.js"},{"revision":"1675b754395bbf160588f8d1d74c46f8","url":"build/js/Login-BmZoMUo7.js"},{"revision":"c94ba50865d3a8a9ccb5cab442a9a7ff","url":"build/js/logo-B5lL0K2o.js"},{"revision":"bd1800df0d99ecfc832f7024c7e91ca7","url":"build/js/MagicBellNotification-CY48jSXl.js"},{"revision":"960532804a5c620afa3c7de532084efe","url":"build/js/MagicBellNotificationDisabled-o9ywMjkn.js"},{"revision":"ab830d2cb394a673e0a39bc4b10a5483","url":"build/js/MemberCheckout-Dbj92dL1.js"},{"revision":"423b461ae728e525015aa276f9c882a4","url":"build/js/Membership_dashboard-C9jozJ5L.js"},{"revision":"0bdffcd884ec76c3ac53c9eea77d3f63","url":"build/js/Membership-BmYHBCGK.js"},{"revision":"091ee6a988574095703f1166f9130e5b","url":"build/js/Membership-DTtUCsbR.js"},{"revision":"34af1e717d79ce427a2f4801c3124223","url":"build/js/MembershipLists-Bzx9osSD.js"},{"revision":"19b08492294019bb0eb81c69ed28f644","url":"build/js/MembershipsLists-C0rmkAaz.js"},{"revision":"dccb1cd8f7b41d598a7264ca756f4aa9","url":"build/js/MembershipTracker-BA4TS9ZC.js"},{"revision":"ae46c76a2a6139c98149c3320b69b991","url":"build/js/MonthlyRevenue-BkD6oh_Y.js"},{"revision":"13da63144aa86969fc3a5b5855208d01","url":"build/js/MyGoal-DjQIuQxP.js"},{"revision":"4a2b4c9bd2783aa51fee5cc3ec7a4ae0","url":"build/js/MyShopProducts-CURZOdxe.js"},{"revision":"4c0b4c13f7739ea43ffd7b1db83ad74e","url":"build/js/Nocontent-5TQiNa-C.js"},{"revision":"f3f0f59ac880cc2222bf918c4c29a37d","url":"build/js/noresultimg-B_g4pD0M.js"},{"revision":"9e2bedacbc7d10e0b5f6612eccdfbb1c","url":"build/js/NotForBusiness-vpZxmTLV.js"},{"revision":"4054cc914f85bde43431507760363461","url":"build/js/NotFound-e72jiiXz.js"},{"revision":"4e080aaf3b5d61d50d7c9cb4adddafb4","url":"build/js/OldSubscribe-B6XsKJhN.js"},{"revision":"245dcfa68329b14cc087397a34187608","url":"build/js/OrderDetail-Cm94EKIM.js"},{"revision":"f18bc6f2e9f31268f8f4f8d92b03dbf3","url":"build/js/OrdersLists-JqZzzBM3.js"},{"revision":"e8da1a36914348b254fbfc7dac9401ca","url":"build/js/PaymentDashboard-B_eLRh7A.js"},{"revision":"14a82c208a12ffb0659eed02f90b4296","url":"build/js/PaymentSlider-BIVcSqRZ.js"},{"revision":"16f60a56dabf23ce9be0a1e88e65e728","url":"build/js/PlatformAnalytics-CjO0yLTs.js"},{"revision":"18b8ac3f4e5ff9c0d9ca07525e572156","url":"build/js/Popup-7XsMo8_n.js"},{"revision":"2a3214ca135be565a55900c90e4bc597","url":"build/js/Post-BGyjca6o.js"},{"revision":"3fa0cf3debb2fb906bc32d59d1953dc7","url":"build/js/PostLike-CpfGZK5t.js"},{"revision":"0344cac1ff1337092126f3d47d24e36b","url":"build/js/PriceFormat-DTnCZlz5.js"},{"revision":"1f92a3eb96a4c50f118b403edd7d831c","url":"build/js/PrimaryButton-DTrSlmng.js"},{"revision":"d155c1dc05734f8df649b07a104f7e9d","url":"build/js/ProfileProduct-B_CraKwv.js"},{"revision":"22d9b82ce1eafd2d46b30acbab681c75","url":"build/js/ProfileProduct-B-Q6p3ub.js"},{"revision":"85f22e0ae6222336da47178990f7c267","url":"build/js/ProfileProductLists-BMXMUczv.js"},{"revision":"3032fd2020fe27b06998fd4470f6a293","url":"build/js/ProfileProductLists-BuLpocds.js"},{"revision":"8f268ac62a800b33e9ab602cecb8cc96","url":"build/js/ProfileSteps-CilK-LIe.js"},{"revision":"a657cefba4e2ccaf8758461363a938e6","url":"build/js/Promotions-BB6eYLbY.js"},{"revision":"b4476b93de9213b8a2f1e0bf2c44b990","url":"build/js/react-vendor-CnWuRBXn.js"},{"revision":"e1ec88bf72ce933c15e56a0cb3df9f1a","url":"build/js/RecentSupporters-BHeKlPVg.js"},{"revision":"5ec71899a8dfc21d84c6d4d4a8271fb3","url":"build/js/Redirecting-Bf6scsYq.js"},{"revision":"4e617a84a27aecdbb993b7b65d47c8cc","url":"build/js/redux-vendor-WCXp5lj4.js"},{"revision":"8351e35c7585ab02b862835bc2f16ced","url":"build/js/Register-DfCufAQE.js"},{"revision":"2984c770504fd43f4668521d62115f9a","url":"build/js/RemoveBill-Co56YcGQ.js"},{"revision":"c245238d812aae357e15089b2ad3d416","url":"build/js/RemoveMembership-CwCM_fpj.js"},{"revision":"691595321b162ff2d7142be1c02c7f5e","url":"build/js/RemovePost-BMZp4JsL.js"},{"revision":"0726876def48c278b25f7ab95b08d9f9","url":"build/js/ResetPassword-CiD6OTJI.js"},{"revision":"e9e652fd7cf45edbc015c6c77f4ba16f","url":"build/js/SafeTransition-DaIkiGzu.js"},{"revision":"f711af47657655fd4d4f7793cca554e4","url":"build/js/SayThanks-YPDEhn_m.js"},{"revision":"87a37ea5d5f4a2455b4cdd6406d8e8b2","url":"build/js/SecondaryButton-Bj_vqz4o.js"},{"revision":"6f898dbed7a2791d0b6bab6d7c51752d","url":"build/js/SendTip-BtiM5NxZ.js"},{"revision":"9586b406fe3c45a5f5062c556f3ec1a3","url":"build/js/sentry-vendor-DlnfM9lf.js"},{"revision":"7aacec4ec8246a9ccf74045624766a5d","url":"build/js/ShareProfile-Bk8wuc9g.js"},{"revision":"f97e878aa6be77c3f368175e895e8e56","url":"build/js/ShopPage-DL-yfT-I.js"},{"revision":"480cac5532c2a0a31470e5147d870afb","url":"build/js/ShopTracker-BJGyhmrO.js"},{"revision":"d841a26a9cb475a8e3a17e972ef00ee2","url":"build/js/siteicon-DsSyz8LR.js"},{"revision":"f1250c86ba71f3645d5be700e9b71044","url":"build/js/SiteSubscription-DpyTL279.js"},{"revision":"059dd833eebe1ec0250ec483486bcc3e","url":"build/js/Social-KbSZ6DD2.js"},{"revision":"cc61adac3d84699f6755f0da1309ce05","url":"build/js/SocialLinks-CAQABG14.js"},{"revision":"7eca4088e5e5406efd9bdc7f8bd13f81","url":"build/js/Stripe-BJnmmrEv.js"},{"revision":"66d29b0add87006d898b30f2ebd2c21b","url":"build/js/StripeIdentity-WI6to1Xp.js"},{"revision":"0654dffc4dd279eccc39be2a6a5277ea","url":"build/js/SubCheckout-BV-xZGxv.js"},{"revision":"f3717987d619a99f26a47deb30e8dced","url":"build/js/SubcriptionEarnings-Bsh-5_Sj.js"},{"revision":"3410409fb511b02892a51b00426d6c29","url":"build/js/Suspanded-DmzYt9y7.js"},{"revision":"05b78d46b6576a3079aff9baa68e90a2","url":"build/js/Terms-BaFOjPUm.js"},{"revision":"ac9964faad76befd2cd3dd5cb75a68d5","url":"build/js/Test-BBTALmVq.js"},{"revision":"da9ee1db38550b52bdc7f202ed175295","url":"build/js/TextInput-BwUD8kkU.js"},{"revision":"b1902be6f33f36ef49b8445248427eef","url":"build/js/TFA-BzRsa8on.js"},{"revision":"b612bdb48dc75e1db47a1ba5f4425da5","url":"build/js/Thankyou-DpXNjgPk.js"},{"revision":"67334a24b33e5989a601317311656565","url":"build/js/ThankyouMessages-RYWhzbRw.js"},{"revision":"fccf383d39e7118cd9f3bc73ba445a4a","url":"build/js/ThankYouRye-1wF6zj2v.js"},{"revision":"06a05086df42f0e41c76df985c112acf","url":"build/js/TimeFormat-flmJcGwz.js"},{"revision":"7d78fc7b696ec858db6c702c7283a27a","url":"build/js/TipInner-DOfGvV-S.js"},{"revision":"d4b3cccf4f9d8867e8c85f6a5f2c3d39","url":"build/js/Tiplisting-CGF-jTyU.js"},{"revision":"770328976631907231671852d1edce4b","url":"build/js/TipTracker-BYtLVdmx.js"},{"revision":"5d376bf8505d04f273f2b48b0c94be2a","url":"build/js/TopEarnBills-DzOQIwFE.js"},{"revision":"1a735fbadff1290a96352a6e473bf388","url":"build/js/TopEarnWishes-C5Ypu9ag.js"},{"revision":"574226f99feefaaf55146cb9f75f4e46","url":"build/js/TopSupporters-C00Xa1LQ.js"},{"revision":"6c89ec740a076775564631207e8eebc5","url":"build/js/TopSupporters-D_-ZidgR.js"},{"revision":"d9af5b3e9899024d526d71bfb25f15f9","url":"build/js/TrustBox-D1AgiPmh.js"},{"revision":"2835df49cf1e22e808c504bf7dd54a98","url":"build/js/TweetNow-BvDJjC1P.js"},{"revision":"802bca32c825b7845a44bebb7e90390b","url":"build/js/UpdateAvatar-D9flBhtv.js"},{"revision":"17b03c8a7afabb044d5d24e879d98f9e","url":"build/js/UpdatePasswordForm-_c_Vrybg.js"},{"revision":"2611242ebb102e49dc2ec83f2316308b","url":"build/js/UpdateProfileInformationForm-Da5MfKO_.js"},{"revision":"37875a380e71727ec67ca08428991969","url":"build/js/UpgradeStripeAccount-CFxGJXhr.js"},{"revision":"329fabdad84d6f66ac39038c85f1b815","url":"build/js/UploadcareEditor-ByfxLucq.js"},{"revision":"8a1a299af522d1961c0ff0cda31b26a4","url":"build/js/uploadedimg-BMa4JKzP.js"},{"revision":"f0ccde1efbd5ef62e451593f383ae0ec","url":"build/js/uploader.module-CPZAVpZ6.js"},{"revision":"1f32e76048d7dd51d524e2654119a38d","url":"build/js/UserCarts-iouTEfvy.js"},{"revision":"fef018e7a96b732ca19af3fed86fd660","url":"build/js/USTERMS-CqW7KGBJ.js"},{"revision":"c94c90bfcabc3ab7973ae626c7716309","url":"build/js/vendor-CKEN7PSI.js"},{"revision":"dbe29188b98bc9adba5916d1d9853b3e","url":"build/js/VerifyEmail-DKwTRzAA.js"},{"revision":"b0021985db400021198b4d8f5afdcc9c","url":"build/js/VersionUpdate-43BiPrZ3.js"},{"revision":"4c76fa335ab17249d19e68c657ea836f","url":"build/js/VideoPlayer-DDs8yLdO.js"},{"revision":"166fe70fdd6f1f3e141b59230279e73c","url":"build/js/VipSupporters-DV8-jn-w.js"},{"revision":"b897e1eeb33500ed5bef2a8f4ed3dc5e","url":"build/js/web-vitals-C2hUMa4u.js"},{"revision":"63f1b2b0006b0ed850a75027d9ffb70f","url":"build/js/Welcome-CfO1tMsc.js"},{"revision":"229ce495c64b36fe8dc169deb29a42a7","url":"build/js/WhyLove-DosCc1vY.js"},{"revision":"049289d8836c177dca90891bd3ab83ba","url":"build/js/Wishlist-aoxgC8Ax.js"},{"revision":"4c09a2a9d1cb2d6ebb1ab964cb8a7c9f","url":"build/js/wishlistbannerimg-PNm9VNvH.js"},{"revision":"d9ec04369183812ab34b7bcfdd1799f1","url":"build/js/Wishlistbox-C48kUHZa.js"},{"revision":"dc63ba8288848fbdc1bdd3ee6018c157","url":"build/js/Wishtracker-CVEW56Qy.js"},{"revision":"3d172259465f825ba307490633fd2c4c","url":"build/js/Works-BBcQihmx.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/png/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/png/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/png/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/png/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/png/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/png/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/png/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/png/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/png/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/png/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/png/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/png/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/png/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/png/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/png/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/png/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/png/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/png/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/png/giftbasketimg01-UPFBeLeW.png"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/png/HeroBg-CgSE7w-A.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/png/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/png/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/png/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/png/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/png/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/png/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/png/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/png/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/png/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/png/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/png/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/png/kylie-BcKwDcm6.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/png/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/png/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/png/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/png/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/png/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/png/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/png/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/png/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/png/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/png/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/png/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/png/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/png/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/png/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/png/PCICompliance-qTSDRKZK.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/png/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/png/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/png/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/png/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/png/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/png/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/png/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/png/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/png/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/png/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/png/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/png/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/png/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/png/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/png/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/png/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/png/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/png/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/png/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/png/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/png/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/png/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/png/vishitimg01-ClMBzIW7.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/png/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/png/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/png/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/png/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/png/youtube-DDw5LQj8.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/webp/HeroBg-CbJjqro0.webp"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/webp/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/woff2/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/woff2/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/woff2/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/woff2/CeraGRMedium-QrW24R6m.woff2"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/woff2/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/woff2/newfont-BRfniQek.woff2"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
