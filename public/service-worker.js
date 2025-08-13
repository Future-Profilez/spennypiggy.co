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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/avif/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/avif/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"09e10cc9960d337e3a917a20204af07c","url":"build/css/app-ZkOwM5_b.css"},{"revision":"cd71d0f6e9b0236a2c521ee845495bcc","url":"build/css/bootstrap-vendor-CP7L432j.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"049c0d9fb0f80ec864a6366eb961f346","url":"build/css/vendor-BAZ39jDi.css"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/gif/loading-DKd4CxP-.gif"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/jpg/giftimg-CbenuWDF.jpg"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/jpg/plaid-C3YNig8l.jpg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/jpg/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"ef36799f9278aa19934f7d3f16af85cf","url":"build/js/Accountsetting-BW3CLwdF.js"},{"revision":"b057f57d50224ad60d331622109b2e31","url":"build/js/AchievementSystem-DW8JmZE4.js"},{"revision":"5b28be017629f5156dc0d4ce40e37420","url":"build/js/ActivateCard-DzQcS5vS.js"},{"revision":"349061c703bdfc6a8fee52813aa49d3c","url":"build/js/ActivateSubscription-DxaH_Ej4.js"},{"revision":"a9056fa3b31ffe0a3af1d5247664d204","url":"build/js/AddBills-DpHIX5or.js"},{"revision":"3c7a49e76bf135d0d1b4acab8943af33","url":"build/js/AddCart-CMbQciBF.js"},{"revision":"8f8355fa9be11679fbd9eb110ac91cce","url":"build/js/AddComment-BJ-7pnKD.js"},{"revision":"b477144b9bbd0f19593b5aef92eeaf06","url":"build/js/AddGift-D64CoItr.js"},{"revision":"46a51f20ec8b1091ed57da8efdd1a002","url":"build/js/AddGoal-D1hvObd1.js"},{"revision":"ce9a0b6148e7ac23c837a03220d32cde","url":"build/js/AddIntro-DQtGiXLR.js"},{"revision":"0cee2c697249dc7b8e8f07d33d5e3789","url":"build/js/AddItem-DGxITxOq.js"},{"revision":"62b920278235a20f6aeeaff5d1daac8b","url":"build/js/AddMembership-BkBwKsk-.js"},{"revision":"44e87cfa68d52cffccac7a8d56aa3017","url":"build/js/AddPost-BCr4aL-x.js"},{"revision":"6d68359c5c59127d81c86ee094ade906","url":"build/js/AddressForm-C-_iqacf.js"},{"revision":"7b1ded411ddaca4eae7093f17756516f","url":"build/js/AddRyeProduct-Dpv9__EH.js"},{"revision":"6e9c39ade8856d297a4c3a881cf197c0","url":"build/js/AddShop-fw7rC1uW.js"},{"revision":"fc5b6b4697134c09c159c221f8bf2728","url":"build/js/Alerts-XuXYykRb.js"},{"revision":"23bbdabde9cab8a74a0d93612ff1998f","url":"build/js/AllCountries-7_saVHCL.js"},{"revision":"00ccf018bf42b5ca54d3acc1eab9e1b9","url":"build/js/AllWishes-CVPEI10X.js"},{"revision":"7828f4768f408169cda34a4df7fc0ba3","url":"build/js/apollo-vendor-BuQiPbZK.js"},{"revision":"2b729f068c523027ee4c797a3c985332","url":"build/js/app-Q-eIpT61.js"},{"revision":"78bc899f3c5c58fd331c561587aae7b6","url":"build/js/app-store-BotLgg-l.js"},{"revision":"6b27480e93fa4af86cc4b3403a99ac0a","url":"build/js/AuthenticatedLayout-BvufYQ_g.js"},{"revision":"a10eb742128aec16f054c062bb076f98","url":"build/js/Avatar-TxYmkZJA.js"},{"revision":"a3fcbf83252c507c62b8f5168095e4c7","url":"build/js/Bill-BICfc3uR.js"},{"revision":"a54ab800295eb302a9ec7a07287c7adf","url":"build/js/BillCheckout-BGJgNL39.js"},{"revision":"4559de515891e4b4a9e12ac7d7eb0a94","url":"build/js/Billslist-Dr0Bmsdt.js"},{"revision":"d70d2032b4aa0050d8b10f993e2637dd","url":"build/js/BillsTracker-BhNIUMFD.js"},{"revision":"2f6eb47fd904c41f762c003df263b59d","url":"build/js/Board-CfQa8NZh.js"},{"revision":"52f1ce9b8fbe30f58bf0a251ae4d7514","url":"build/js/BottomBar-CckcbjVf.js"},{"revision":"20698f69c25524a03b7bb0bd4336f557","url":"build/js/BuyShopItem-CIgslbvQ.js"},{"revision":"a4665973717b17cde34a5c1bfb2ca5db","url":"build/js/Cart-BA33h_Ek.js"},{"revision":"6f12a0296cf80c203ae7ea5f4778a220","url":"build/js/CartItem-CEg3fTie.js"},{"revision":"1a9e8dcc7f9438fbe5f7ca43e4a9c73b","url":"build/js/CartItems-CGyRj9fI.js"},{"revision":"63bfb4987f29707a0c4d8981c4aa7c75","url":"build/js/CartListing-B_MU4nBr.js"},{"revision":"b507f3804e49f50daef0654aab2322db","url":"build/js/cartproductimg-zn72eeM8.js"},{"revision":"285ba708925f90bea8fb10190178d078","url":"build/js/CategoryLeaders-BgSEWVvD.js"},{"revision":"796843ba31846569a0d93e76d1b1d8c1","url":"build/js/ChangeCurrency-Lc60FJNi.js"},{"revision":"59329455b3ec39c39528103ac06b8ad6","url":"build/js/ChangeVat-C01pF3yi.js"},{"revision":"6ffccf5c8c0edf85bd30a1475f10ae4c","url":"build/js/Chart-DslnzOPZ.js"},{"revision":"8c9898ed4c4bf13fce87ea228b9530cb","url":"build/js/ChartDashboard-BIaLBrMA.js"},{"revision":"747409a8f8995cd71e4ea4616c9c498e","url":"build/js/charts-vendor-Bqo0XyBu.js"},{"revision":"2e675f709cafa075a5bc022e2b856d82","url":"build/js/ComingNext-BOqQHRKb.js"},{"revision":"42bbe979307a06d06de7eaf5c07b8c74","url":"build/js/Comment-0LFDPCcU.js"},{"revision":"4b28dc56391669053b5c408e9130d5af","url":"build/js/CommetsLists-BI9GFUkh.js"},{"revision":"684d62067950e6354cb7db35192a2fec","url":"build/js/ConfirmPassword-flr9jUUZ.js"},{"revision":"7ed784a2b9f3ab94c5a76ca21fbad4fa","url":"build/js/Countries-B41jM0-X.js"},{"revision":"898bf5914947bdd5929b4f4f86ac7644","url":"build/js/CountriesShipping-DEOeMWtM.js"},{"revision":"9186efaf3ed1eda3e6f66fa652949e50","url":"build/js/CreatorVerification-DiZtMLDT.js"},{"revision":"925f16d094da64eac7f9fc19fd8e925c","url":"build/js/Dashboard-CH24F-Re.js"},{"revision":"b3dd825cc54f0ba8b351fdb04f330a6d","url":"build/js/DataTable-Dy6IPjHE.js"},{"revision":"bb034deb04d4c72506f05c4f9f790315","url":"build/js/DeleteStripeAccount-s-PJKXQu.js"},{"revision":"2af2729c80f9922525bf2b6a76622b61","url":"build/js/DeleteUserForm-C6e9-noW.js"},{"revision":"3c06db273bd2a533791968a378d3a609","url":"build/js/DeviceID-BVGa2P3s.js"},{"revision":"6b10ec97cd5d9e590e1e1c68e2b97640","url":"build/js/DiagnosticPage-CethHX9a.js"},{"revision":"02be5a2a2e17eff10a2f21d67b0106b2","url":"build/js/Discover-BnYbdmB6.js"},{"revision":"c8d2374cac80cb802f63665c678570d6","url":"build/js/Earnings-Dasgj84e.js"},{"revision":"0a6cf69727bc9bf3b5738a4ac35d4384","url":"build/js/Edit-CUBRolte.js"},{"revision":"c8bf7372c52b43ca9a4ed5f5a06f4fa7","url":"build/js/EditCategories-BAHxIlPc.js"},{"revision":"d96bf68c29a3e30ea0f768469eb9272b","url":"build/js/EditMembership-BrOI_wIw.js"},{"revision":"f0a6c67ff7b262334da712c1fcdf92b4","url":"build/js/EditProfile-CH60fVGP.js"},{"revision":"a946c8fadb46ef3188ee7073fe8298c5","url":"build/js/EnableCardCapabilities-DsgOkUAg.js"},{"revision":"e660f7c507fed78cea7594a22f6960f5","url":"build/js/EnterOTP-yw7uU3v9.js"},{"revision":"b75c64d8338efcbd1099947c9a7dceae","url":"build/js/ErrorPage-CKDpXL4t.js"},{"revision":"b5b771e1174708d04d1b2436e48e4b66","url":"build/js/FAQ-DxuI_3a6.js"},{"revision":"1737a935f927e7bbd64c4d93e6eb2af0","url":"build/js/FeedList-oBJ30Pl8.js"},{"revision":"5384b9354bc0e9d8f1747963d3a3d3d2","url":"build/js/FollowButton-BAkynvtQ.js"},{"revision":"5cab0bf28ba6e039731bc1c08ad3306f","url":"build/js/Footer-Dr5pi5N2.js"},{"revision":"1ff23f380f8aa93304a85fc97494eb27","url":"build/js/ForCreators-C5bqpbMA.js"},{"revision":"81723cc4774f3a97058031d9d0b6ebfa","url":"build/js/ForgotPassword-D-F83_E3.js"},{"revision":"8abd42a256c67e5e07e7bbb2e1e1dd07","url":"build/js/FunPart-Dz99sXmE.js"},{"revision":"c986a4ee626559e1b5e5e599dab6c5b7","url":"build/js/GetCart-Crai1ECM.js"},{"revision":"eb67cb9491a6d493944227cf479e39af","url":"build/js/GiftAddCart-CqEPeXte.js"},{"revision":"0784b4486d2354a5bb88e67ec6236d35","url":"build/js/GiftEdit-BZKL765W.js"},{"revision":"d548fea562678f693977201d81021f18","url":"build/js/Gifter-B4wfDnVB.js"},{"revision":"093e7a8f07704f492228970029788d3f","url":"build/js/GifterCardVerification-DF0M5Pec.js"},{"revision":"98e293268388a13ebff201e6ba43bdb7","url":"build/js/GifterFeed-Ck9nX2O8.js"},{"revision":"eb368e25168e1d555a5de8eab3915628","url":"build/js/GifterItems-2H_3LuG5.js"},{"revision":"7c8ff86fd0a5c4a65cd61e92c50be7de","url":"build/js/GifterMedia-i9gjewjQ.js"},{"revision":"e19e37b3f435e70992beb8c0c0d855d2","url":"build/js/GifterMembership-D35957b0.js"},{"revision":"366a440d747ad020132005afbe540692","url":"build/js/GifterSubscriptions-XTJh2QYy.js"},{"revision":"9e88c38cf920bf4e7b219b2f539ef733","url":"build/js/GifterTips-CarLcNhh.js"},{"revision":"67039673d95c4ab55b1225d86d3506ff","url":"build/js/GiftListing-BTSefsmA.js"},{"revision":"8ca76de2a8ee60e7aed8b0b017f069a1","url":"build/js/GiftStore-XBQA2LWc.js"},{"revision":"f40dd6e6981189de5dbfac26834c647a","url":"build/js/GlobalCheckout-CpHGpsL0.js"},{"revision":"d0c4830aa24f0e37453cc51acf3a1ff6","url":"build/js/GrowthTrends-BG0qq34V.js"},{"revision":"04e965ae0f65abaef90c881de7e1805c","url":"build/js/GuestLayout-BoO1Ap8R.js"},{"revision":"7239669a689065c4b9977ba00595375b","url":"build/js/HappyCreators-BgP1-VW6.js"},{"revision":"7adfe4a175bbe3afdc320137860577d4","url":"build/js/Header-BvXpGSFN.js"},{"revision":"cc43311a73bd95a926f1f9a0400b95ec","url":"build/js/Hero-CzpGnaCb.js"},{"revision":"9e576be52c1169be33242237e61cce69","url":"build/js/Icons-DG1Uu-wx.js"},{"revision":"eb98a48544997343946ab2b8921aefda","url":"build/js/ImageEditor-DuhcAmQg.js"},{"revision":"ec75cb9f508f6e695396f5d4fdf7f660","url":"build/js/ImageGenerationWithAI-BDNru9CS.js"},{"revision":"37edb44c8591b3b8cbe9e4c72c371c85","url":"build/js/InputError-C1xtZFAC.js"},{"revision":"b18d3873cca518952f1bcba630d100e4","url":"build/js/InputLabel-BVOPNF8d.js"},{"revision":"f311066ae21f9c2cfaf8cc0a1e561c22","url":"build/js/IntrosVideos-BuY1dohe.js"},{"revision":"d748f448210b402746300a0c930b8182","url":"build/js/Item-CgW_PxXM.js"},{"revision":"7c519ae56ace14d05354318362f14844","url":"build/js/JoinUs-CbFBVwP1.js"},{"revision":"b463eec93502b2f42f21f21b7a7f2993","url":"build/js/LeaderboardStars-DSvcCF1k.js"},{"revision":"41ebdc55b885831cdd82d3d433ffe006","url":"build/js/LinkTwitter-CfJZ1DZp.js"},{"revision":"198a007f1f48ae3e8146cbef82bb729c","url":"build/js/Lists-CnfizDtl.js"},{"revision":"5169cc91ad75ed101215eb39f0bc93fb","url":"build/js/LiveBar-B21Qf2t5.js"},{"revision":"39f759be16a4d8c1b66cf154cc49c79c","url":"build/js/LiveBarSection-DGT-zSBE.js"},{"revision":"6dec33f800dd282be6aa5a1e8a5a92a8","url":"build/js/LoaderButton-OVrRuEwD.js"},{"revision":"ceab082830d319c2012cec39dfb307f4","url":"build/js/LoadingScreen-Cg0X6gba.js"},{"revision":"89e263b86353216ae48cf30941c2f79e","url":"build/js/Login-BSuhcQ2E.js"},{"revision":"4de3fb1065288a8b50268c93c31e34f6","url":"build/js/logo-DsNTEwr9.js"},{"revision":"bdf4447c726d18c69134d4f35db62e6f","url":"build/js/MagicBellNotification-CoYrXGhy.js"},{"revision":"f2bde9559f453fd9e7ab84ffeb8e4f7b","url":"build/js/MagicBellNotificationDisabled-Cgon0Obe.js"},{"revision":"0bf95f6d20b3c292095e1a5540a5bfb7","url":"build/js/MemberCheckout-DTz0OaRt.js"},{"revision":"da523208a92815aab7f4eeb61713e2bb","url":"build/js/Membership_dashboard-P7G6pfrR.js"},{"revision":"8f564d56ae01905095840bdbac60c964","url":"build/js/Membership-9rGXIzt2.js"},{"revision":"288fc64531711ce5650de894cfbf09cb","url":"build/js/Membership-B0Fp_lhQ.js"},{"revision":"93e74efc36dd1cf090baa48f7614bba7","url":"build/js/MembershipLists-5wvSWaNd.js"},{"revision":"6c5c00704e28453ac844047c8b58773f","url":"build/js/MembershipsLists-DpWpCdIR.js"},{"revision":"0546c24492817d1a868407b63f439956","url":"build/js/MembershipTracker-cfTEr4LZ.js"},{"revision":"8d292c815f19ae6ed448ea4a3f05dd7c","url":"build/js/MonthlyRevenue-CSQL_nhP.js"},{"revision":"be7b443cd1308ec9da3c824bf12f5021","url":"build/js/MyGoal-Bs8AMzJw.js"},{"revision":"a70d72472ae90ab3179545e81d4def25","url":"build/js/MyShopProducts-BHMfNpMd.js"},{"revision":"a7b1ff818aa94b6178b57629b9b1897e","url":"build/js/Nocontent-DuCL6TdD.js"},{"revision":"39ce4f34a686cd70885322c8c3dc0db8","url":"build/js/noresultimg-9TxkX0QR.js"},{"revision":"e4c1970ee40ec140924813efb1d13462","url":"build/js/NotForBusiness-BrVob1z0.js"},{"revision":"09254b1cc332ed532e8a6261a879a00a","url":"build/js/NotFound-8gdmUYmY.js"},{"revision":"b104557eb6e4577ce504ad61b579c592","url":"build/js/OldSubscribe-Bfxc0ql2.js"},{"revision":"96702f1c0293d36d57f8e743eb14f1ae","url":"build/js/OrderDetail-UJmdP3Q-.js"},{"revision":"114e818aef6f00b07a2d8d63e75d7575","url":"build/js/OrdersLists-CAwauCpo.js"},{"revision":"d96b569b22b21a4ca99b0db0f62d1cc6","url":"build/js/PaymentDashboard-CKRpyQdT.js"},{"revision":"0f93f788e947e4b7dd9bbc41d0cac68e","url":"build/js/PaymentSlider-CCPzwV4m.js"},{"revision":"70dbb1fde5cd643736ef7124ac378519","url":"build/js/PlatformAnalytics-B9H2x82O.js"},{"revision":"62b9b2825290ca11bd35dd762b1db636","url":"build/js/Popup-C79hDUhC.js"},{"revision":"fccd332015e9549aab6841901f835c9c","url":"build/js/Post-DAw6siZu.js"},{"revision":"3c412a4aecd5e60248e738eda98656c6","url":"build/js/PostLike-ClijK5px.js"},{"revision":"5c90dfb10946ab78458ce0c48e20c409","url":"build/js/PriceFormat-CnMygFU4.js"},{"revision":"d08f1b2b3e096e4287e75825b9444dd8","url":"build/js/PrimaryButton-ZCPf65Fz.js"},{"revision":"765252af571a3346079291413d19b069","url":"build/js/ProfileProduct-BdnWmvSA.js"},{"revision":"cb28b9d5e4eb37c4102288920cca79d3","url":"build/js/ProfileProduct-CauPeT90.js"},{"revision":"fc90da0645cf683f465f6b74173ef02b","url":"build/js/ProfileProductLists-C4yOnSvA.js"},{"revision":"6e154d7096f2f58c83db03b9ed3809d1","url":"build/js/ProfileProductLists-Z1XpzJpI.js"},{"revision":"5624cbbe494cc6ff7f88655b76f47777","url":"build/js/ProfileSteps-BTv-WwEt.js"},{"revision":"dd3cd7d26ba30f40b0992bfc0f4498ea","url":"build/js/Promotions-BFMx5DPr.js"},{"revision":"3016c4a1ae7be87a45558eb0088e2271","url":"build/js/react-vendor-DD4J5v33.js"},{"revision":"b818ff084ea3cde23e9084be681738a1","url":"build/js/RecentSupporters-CGyH8esj.js"},{"revision":"858880fdbe0be9e89a145973ae4a7951","url":"build/js/Redirecting-BFiDH2R2.js"},{"revision":"0a26cf470cf5ca9a3c8ea14369d182cd","url":"build/js/redux-vendor-jXnPGNgh.js"},{"revision":"d6532ef5cee1ef10bfdbeff1948657a4","url":"build/js/Register-UBfP0DOq.js"},{"revision":"11298841d37765861233ad412df9b235","url":"build/js/RemoveBill-DpX4LLWq.js"},{"revision":"5190deb34e5973d4ad32dae4415c9eed","url":"build/js/RemoveMembership-CZQbuvab.js"},{"revision":"192da157c3b007040c778016802f88f7","url":"build/js/RemovePost-DVErs2Jo.js"},{"revision":"2275c2aab5c4d3646234e847d949211a","url":"build/js/ResetPassword-YeJocLaW.js"},{"revision":"a81ae85e6a9570b4dcfb770dac2e2fc5","url":"build/js/SafeTransition-Dzno1enw.js"},{"revision":"98c244c22dcb55bae8a31f28082f2681","url":"build/js/SayThanks-DPni3eLr.js"},{"revision":"a9b28b5e5a071d2b9ae41e8ee5e32a51","url":"build/js/SecondaryButton-BMZHYVAC.js"},{"revision":"6cb38b6e56795186023c65629c400c54","url":"build/js/SendTip-BIpFfD7c.js"},{"revision":"f6d25560146c4b53ff6c40be97a88b37","url":"build/js/sentry-vendor-Dz3Cjyph.js"},{"revision":"297ccc174d7512eff57adc3012ea79c7","url":"build/js/ShareProfile-B0HEqwwh.js"},{"revision":"d11f6ad6d321fdc8913a942715675252","url":"build/js/ShopPage-BLfgagv8.js"},{"revision":"6538deeabdea83f7684693ba0392f534","url":"build/js/ShopTracker-6G0ZTbmZ.js"},{"revision":"78fa7f2c2dcff82eef49ad65696266ae","url":"build/js/siteicon-DHC6cSUY.js"},{"revision":"d50e70a3c02f3a9b80986d06f9f5145d","url":"build/js/SiteSubscription-B57j702u.js"},{"revision":"44e6ddac2c39de4263ef14e60ced21cd","url":"build/js/Social-0QBlUKyV.js"},{"revision":"d81dac737dd2c49ee8f78d4a88ce83a5","url":"build/js/SocialLinks-3W96Ef6y.js"},{"revision":"ade2ed64a38832df4618224d3030e5a0","url":"build/js/Stripe-EuVQdH63.js"},{"revision":"de93d4dfd72f0ad576bae0a1bc11eb9b","url":"build/js/StripeIdentity-5VnxUTaF.js"},{"revision":"17080b75c3b0c76cba91727a2e4e5cf6","url":"build/js/SubCheckout-C1VIyqck.js"},{"revision":"c53ae10aec7af26edef08936a543fa8d","url":"build/js/SubcriptionEarnings-Cs_Gh25_.js"},{"revision":"5ccccf578dbaf1dd061cbc580d7d36df","url":"build/js/Suspanded-DFFZiOMD.js"},{"revision":"16016a301cdcb02f9e2642eb1bbead69","url":"build/js/Terms-DPyXmuH-.js"},{"revision":"8d326d05e7af80178e0ac0d3f190ad03","url":"build/js/Test-CMUBVxlc.js"},{"revision":"122a3c9aa7f95439203dfcefee8629bc","url":"build/js/TextInput-Cf1kjyXP.js"},{"revision":"d3db4bf4f29502cef7258fe18ba1a7f0","url":"build/js/TFA-BahLFAkU.js"},{"revision":"35619b2f4a9ba1d3ba1cef3da4399161","url":"build/js/Thankyou-DWgKMwCf.js"},{"revision":"2c7f0747dc092ea4243b5b07a5b37e13","url":"build/js/ThankyouMessages-EzX2X1-b.js"},{"revision":"b1f764705c259336026c1a98793ffabe","url":"build/js/ThankYouRye-DzGxR4FP.js"},{"revision":"667b515e52c31d8fee285e1222e394b5","url":"build/js/TimeFormat-DmZOpTso.js"},{"revision":"18e46a172db44a296ad54ceddee2e7cf","url":"build/js/TipInner-wrx5dDDb.js"},{"revision":"1e7f0b3bef6195eb2c247d0a768115aa","url":"build/js/Tiplisting-BwGK25Iv.js"},{"revision":"8868667da2bd7ee6401d64fd46e865d5","url":"build/js/TipTracker-BNAGjCRj.js"},{"revision":"3f4ebec341ddcc95ecccbc421848da60","url":"build/js/TopEarnBills-DISSsYGj.js"},{"revision":"6d8bcd3aa76d9c6984db4e2ce32d4465","url":"build/js/TopEarnWishes-DVfqB3Zz.js"},{"revision":"24afee9cdf85a964209dda3c658d9f0f","url":"build/js/TopSupporters-2QS6jvC8.js"},{"revision":"7829b759483665baa60822ae89e78875","url":"build/js/TopSupporters-B4zhcdXk.js"},{"revision":"17d6c75ef0c0f61c0194adc2e42a6dff","url":"build/js/TrustBox-C41YDYbz.js"},{"revision":"102ff74886b816bfe94d44d35147609a","url":"build/js/TweetNow-Bw-K-1wu.js"},{"revision":"c4f8923cf7d6c87ea66ec0925809cc83","url":"build/js/UpdateAvatar-C4_YDP5n.js"},{"revision":"7dde527bf7d18bc752f6bbeceaec2247","url":"build/js/UpdatePasswordForm-CknI4BUR.js"},{"revision":"d6e13b81f7953111badcb308b3676777","url":"build/js/UpdateProfileInformationForm-D4ZVZN2I.js"},{"revision":"bcaaa1068f8958865839144b6bcbc940","url":"build/js/UpgradeStripeAccount-BPC8arUb.js"},{"revision":"ef38fce14fc101f5c4c88840f7fe7ba0","url":"build/js/UploadcareEditor-DHE5a-G7.js"},{"revision":"cdbcf79b9bae456c228975518917ce3d","url":"build/js/uploadedimg-BKNtbnhJ.js"},{"revision":"cb9e836e5dcff96948b483d48eccb12c","url":"build/js/uploader.module-suFcDcye.js"},{"revision":"8e5ba15806c12cca6694907b2d3527bd","url":"build/js/UserCarts-G4mzJuT0.js"},{"revision":"e4f6cabd3dc85931bbe93f950e982214","url":"build/js/USTERMS-DZpCB2QT.js"},{"revision":"322cfe1dd2959d3fb7002b8f796a856c","url":"build/js/vendor-Qu56ZfEu.js"},{"revision":"5b2661c73c29c503eede30208135b5e5","url":"build/js/VerifyEmail-DlV-kGD1.js"},{"revision":"5484f7786bd790b8903b82f0477eac90","url":"build/js/VersionUpdate-BxKqFIvq.js"},{"revision":"161dc68d1aeae89a1201c9b5d7f71339","url":"build/js/VideoPlayer-McElOqKl.js"},{"revision":"b3c39a2565a7a8cdb64af02898c6fe99","url":"build/js/VipSupporters-ypigaiyj.js"},{"revision":"17e3b7a3bf0dd3c8afd94efa78e9deb6","url":"build/js/web-vitals-CejvGPpS.js"},{"revision":"facdf8adaa7d690e734eba54c9133ac3","url":"build/js/Welcome-k69keksz.js"},{"revision":"953c8f37e810532f6e6a981b4fe24886","url":"build/js/WhyLove-zl-d_wUf.js"},{"revision":"4835a429e1675048855f1c43be12110c","url":"build/js/Wishlist-Kwa5pAEz.js"},{"revision":"8e2b8383dd3c34b005f66a4136cf9346","url":"build/js/wishlistbannerimg-DNVQmS3N.js"},{"revision":"e5fe4943739bcbabc1eea3e265b1457d","url":"build/js/Wishlistbox-BDiYUvfv.js"},{"revision":"a65f01cbdaee0ff4e6dc2a91626e68cb","url":"build/js/Wishtracker-BvFka1F0.js"},{"revision":"f9699858462c8d3bcac9b713f0b25ff0","url":"build/js/Works-CLYE7gZj.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/png/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/png/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/png/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/png/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/png/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/png/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/png/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/png/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/png/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/png/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/png/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/png/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/png/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/png/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/png/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/png/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/png/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/png/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/png/giftbasketimg01-UPFBeLeW.png"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/png/HeroBg-CgSE7w-A.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/png/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/png/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/png/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/png/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/png/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/png/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/png/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/png/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/png/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/png/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/png/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/png/kylie-BcKwDcm6.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/png/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/png/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/png/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/png/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/png/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/png/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/png/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/png/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/png/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/png/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/png/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/png/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/png/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/png/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/png/PCICompliance-qTSDRKZK.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/png/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/png/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/png/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/png/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/png/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/png/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/png/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/png/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/png/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/png/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/png/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/png/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/png/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/png/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/png/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/png/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/png/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/png/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/png/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/png/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/png/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/png/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/png/vishitimg01-ClMBzIW7.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/png/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/png/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/png/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/png/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/png/youtube-DDw5LQj8.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/webp/HeroBg-CbJjqro0.webp"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/webp/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/woff2/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/woff2/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/woff2/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/woff2/CeraGRMedium-QrW24R6m.woff2"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/woff2/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/woff2/newfont-BRfniQek.woff2"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
