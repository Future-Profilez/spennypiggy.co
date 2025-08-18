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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"de33fe08206ae112e3e5cc6e95750961","url":"build/assets/Accordion-FVgpqeGK.js"},{"revision":"eb69907e3d0a60b0ab678f0c444140c6","url":"build/assets/Accountsetting-BeIY-FJk.js"},{"revision":"03ed0898e9b293838a394e0b056978e8","url":"build/assets/AchievementSystem-CwiyQg6T.js"},{"revision":"4dfabca2391e856e94b473da4508f708","url":"build/assets/ActivateCard-xilszYHz.js"},{"revision":"a61ae80b837e3d4b520880f5c66076f6","url":"build/assets/ActivateSubscription-DWbfoCoQ.js"},{"revision":"3a53fda2310e96ae24fa54d0bdd4e2db","url":"build/assets/AddBills-BEzbHm4A.js"},{"revision":"b94e30767636affd06c19232e0a9b2c8","url":"build/assets/AddCart-D0md9bta.js"},{"revision":"538c1c6bee2afab70aa481e7c4907b82","url":"build/assets/AddComment-CDDwCZhH.js"},{"revision":"5cbdc312afe0c16bceba01421431bc2b","url":"build/assets/AddGift-DeYYOk74.js"},{"revision":"6a0b7bfb57c300a057a4acb00912e2f4","url":"build/assets/AddGoal-DTAQ1Dft.js"},{"revision":"e1f1937df1027c6f40501028b2fc0610","url":"build/assets/AddIntro-D4HqBYu-.js"},{"revision":"28d0977f9d88553ae34e55d8c2f916c8","url":"build/assets/AddItem-11bAlFbj.js"},{"revision":"872f9044d9e4e909bae729c2c78938b2","url":"build/assets/AddMembership-CxlF0-zg.js"},{"revision":"6be9930d36eb586722fcbf7d598c074e","url":"build/assets/AddPost-oF04ka4-.js"},{"revision":"24635dd8d3b30ac482579c99cc239875","url":"build/assets/AddressForm-Bu4MUyXz.js"},{"revision":"3bd550d04e22e2ed95fbdab820841e11","url":"build/assets/AddRyeProduct-DFUq0OaE.js"},{"revision":"4914bdc94a1cd21079ee78c87aee7d70","url":"build/assets/AddShop-CDsAN7u8.js"},{"revision":"77e20f33606f36ff950cf3b81e4ebdaf","url":"build/assets/Alerts-BiR1Sdz5.js"},{"revision":"1075c05c36ddb46fc6998b69fff4e087","url":"build/assets/AllCountries-BOt0973k.js"},{"revision":"53588b75dc074dcae0f693b9582568de","url":"build/assets/AllWishes-BCyTgoA4.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/assets/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/assets/amazon-Cd4bGo_L.png"},{"revision":"17636f587d92473d29115d202cf11213","url":"build/assets/app-BhA1aE-Z.js"},{"revision":"f289cfad85f09249628d1098ec02c48b","url":"build/assets/app-DQDQn5_A.css"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/assets/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/assets/asos-CIGR1i9R.png"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/assets/assertThisInitialized-Ctu0bbrq.js"},{"revision":"138d58c3822287f6e60b77b4b261d3dc","url":"build/assets/AuthenticatedLayout-DjKGEMr3.js"},{"revision":"05acb47ad409b364acf2f6bdd74f1033","url":"build/assets/Avatar-C3CeAOQh.js"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/assets/beauty-DCFqJTVd.png"},{"revision":"7ac2e89bcd0e514f6199ac17a4c2e1a8","url":"build/assets/Bill-fPMNvDQe.js"},{"revision":"c4492902c42a335530a0e8ed238af30a","url":"build/assets/BillCheckout-C61rWdqP.js"},{"revision":"72614e07a65f3a8586275d5a82bfade3","url":"build/assets/Billslist-DKRwh06V.js"},{"revision":"34adc783236f7721d592b1c7425a63e8","url":"build/assets/BillsTracker-G2_vlYhD.js"},{"revision":"b1ee18ca42701a60bd83852df8ddfc97","url":"build/assets/Board-C7wk-MVh.js"},{"revision":"9045d6472d0e3befae0f9859c6f84d23","url":"build/assets/BottomBar-DhUQ-uJ5.js"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/assets/british-flag-BcogJXZ-.png"},{"revision":"181865d998bb50f900d40c8c4d3ba79b","url":"build/assets/BuyShopItem-C3qliOrr.js"},{"revision":"c019e57e75e07451c2a4caf10ed644a5","url":"build/assets/Cart-BhUNdZ1p.js"},{"revision":"449c248aed6873b17b5ce982be9c80dd","url":"build/assets/CartItem-CwHy0fgh.js"},{"revision":"01bd03d5e0839947238275fad82c7fbb","url":"build/assets/CartItems-C1KQnmTW.js"},{"revision":"6dfd1a3add3714d21319f29bdffcdae7","url":"build/assets/CartListing-BQM-xIzw.js"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/assets/cartproductimg-C1koo3C8.png"},{"revision":"050b9c954fd6f9ea1370fae798fbde19","url":"build/assets/cartproductimg-IopLElGc.js"},{"revision":"b7cb54033573c6c1b149394b469fbec5","url":"build/assets/CategoryLeaders-BRKcotUV.js"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"c078eef62ea2faaef86a0bc406d5a01b","url":"build/assets/ChangeCurrency-fyLFXHn7.js"},{"revision":"b47e211237dd253d8716174898c79125","url":"build/assets/ChangeVat-Cy3G944a.js"},{"revision":"692f8d9df8ac94eef59e5d77e3c5fc8c","url":"build/assets/ChartDashboard-XMS3M8hR.js"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/assets/closeblacksm-DrNnW4fj.png"},{"revision":"64ffacb175ebc41742979b082349af11","url":"build/assets/Collapse-CNtB3MBW.js"},{"revision":"30e6e19cdf3b69975711ca96d3ca4741","url":"build/assets/ComingNext-BVF-McaJ.js"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/assets/comingnext-jAz-GIeT.png"},{"revision":"41753fd35ffbed95465e3039fe131f34","url":"build/assets/Comment-1eRKA9TG.js"},{"revision":"7d1ac11467b581ba1af10bd82f6c496d","url":"build/assets/CommetsLists-DeTc5VPU.js"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/assets/commingsoon-eOjyCKzm.png"},{"revision":"67b935a0ee564661664599746686aa58","url":"build/assets/ConfirmPassword-cbNQH3ul.js"},{"revision":"43d2e9726239545b68df640cc2b05c4c","url":"build/assets/Countries-Cg1XXjwd.js"},{"revision":"e61ee73f25da9e4188760b3d8524e83a","url":"build/assets/CountriesShipping-BNMPFyfi.js"},{"revision":"8a161955b394a8ee9d3c9f69e5d72c85","url":"build/assets/CreatorVerification-B8oB8frl.js"},{"revision":"79610407f8487cc37586da3057d1d102","url":"build/assets/CreatorVerificationNew-s1o-_Eu_.js"},{"revision":"5d0b994bbb83d1c7d37d15e9b8ecc33d","url":"build/assets/Dashboard-v-HBb2WA.js"},{"revision":"f58f4130d9d8fdf851e6637ec0126869","url":"build/assets/DataKey-C4iLSJ1W.js"},{"revision":"3125e2c6ae673ac5fd123e68821a9b95","url":"build/assets/DeleteStripeAccount-CIgjH4TL.js"},{"revision":"3deb153377752198585e3c9d40448ba8","url":"build/assets/DeleteUserForm-CyrbtWxa.js"},{"revision":"7b950d71d73ec1f4d0b8091e91ef7534","url":"build/assets/DeviceID-aJCddKQH.js"},{"revision":"01e589c0f3a069cca21f5219d08cdccc","url":"build/assets/DiagnosticPage-DnalAgjZ.js"},{"revision":"3c1fc4d62dd614369b1e653aa8e47a4c","url":"build/assets/Discover-BrCZfUu5.js"},{"revision":"fcdb5298ec0bfc68b76f23d69a93df84","url":"build/assets/Dropdown-2kt6kjSg.js"},{"revision":"0621baa6f9da28f1376cd5936158ee93","url":"build/assets/DropdownButton-DVD2ua5G.js"},{"revision":"97c5617e0a74ab077b65611e72aabedb","url":"build/assets/Earnings-BvjCWx_0.js"},{"revision":"60fff76bbce386af0752c05dc3cdfa05","url":"build/assets/Edit-DA1r76g1.js"},{"revision":"e36345af7783a333b6e46d50d8d90311","url":"build/assets/EditCategories-5GGY7ULr.js"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/assets/editicon-errcM8K5.png"},{"revision":"c42aa5867616b9721d4005e04c4d054c","url":"build/assets/EditMembership-DB-gl4Nv.js"},{"revision":"a93f25706c0b34a24a03cf1866358147","url":"build/assets/EditProfile-BGl_-XOx.js"},{"revision":"fe6c0fbf861412fb87d64cd18a459d58","url":"build/assets/ElementChildren-CQuywaRY.js"},{"revision":"bcef268ec08b139b59fa5b9b5b0f6f97","url":"build/assets/EnableCardCapabilities-BdG2gtRg.js"},{"revision":"27f0452879fa324b6ac60fb74e9dfbad","url":"build/assets/EnterOTP-DBE_1kBk.js"},{"revision":"0f64bfc306b92e1194d8114a4092a0ef","url":"build/assets/ErrorPage-frcE6gMK.js"},{"revision":"9cbe6bcdf0e0dab23c8878fd414d116a","url":"build/assets/extends-CnzoikGv.js"},{"revision":"cd6efbabda069729958bc3068e66da45","url":"build/assets/Fade-_ht7ingX.js"},{"revision":"6851fc8435223c820c584ec3a80f7c84","url":"build/assets/FAQ-RsxZUhtH.js"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/assets/faqhand-BXWGoK2R.png"},{"revision":"ad0909f3c4752fad57a6af4e27503bad","url":"build/assets/FeedList-DkjrvAaU.js"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/assets/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/assets/flag-european-BCCzeLKH.png"},{"revision":"0923a1eca65d148abbfdcc61f3a933ef","url":"build/assets/floating-ui.dom-CKBbKPZO.js"},{"revision":"70b0abb5fbeef2176a06c6ff6d0a8d3b","url":"build/assets/FollowButton-CIxxYC0y.js"},{"revision":"a084e76266bcd9b0f50d39d4877cf1af","url":"build/assets/Footer-BdLdTTYQ.js"},{"revision":"4317c3e06108d4bbdbe2eb10209a1679","url":"build/assets/ForCreators-n-b6ZcTx.js"},{"revision":"cc8a3e10d2aca62286c315c4b29afcd0","url":"build/assets/ForgotPassword-CsImeZJu.js"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/assets/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/assets/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/assets/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/assets/fundbasketimg01-DNZiLLCY.png"},{"revision":"671ef09989c5d00ede0ccef174f8ef8e","url":"build/assets/FunPart-vKuvlBdz.js"},{"revision":"3ee4273df67f023aecce86266940bbdf","url":"build/assets/GetCart-DpkbR2Ps.js"},{"revision":"fc5780783931bc81d02f173d74425276","url":"build/assets/GiftAddCart-U9hcgv8P.js"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/assets/giftbasketimg01-UPFBeLeW.png"},{"revision":"f6b48bc97f9870643da14184646ed5f7","url":"build/assets/GiftEdit-BZctvJ27.js"},{"revision":"f69cbff78bb45634dbdff7f4bff11a4b","url":"build/assets/Gifter-D-Y-zIvK.js"},{"revision":"e767d74311e910f47e2f5a67b3d85b9b","url":"build/assets/GifterCardVerification-DzlzZ_a_.js"},{"revision":"796d2eeb8cfb39345b18102e7c15ea83","url":"build/assets/GifterFeed-BqFIYUCl.js"},{"revision":"b98c3845bf5d59ff3b9e4867e7804af6","url":"build/assets/GifterItems-CPc4cMkS.js"},{"revision":"604beae3e169859ea6c6522a1681e73c","url":"build/assets/GifterMedia-BoTUsdp7.js"},{"revision":"885bbdf93259eded8f6c3808ca9fb790","url":"build/assets/GifterMembership-BZ0pmrGF.js"},{"revision":"c0f6b34c8fc95e4688a3d44798f69b01","url":"build/assets/GifterSubscriptions-DgsBhj94.js"},{"revision":"53549b926c749ff7d6791a65e305b3dd","url":"build/assets/GifterTips-CaKrDzGJ.js"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/assets/giftimg-CbenuWDF.jpg"},{"revision":"adc538730162c8bcca1762ca0e268497","url":"build/assets/GiftListing-CoikefhD.js"},{"revision":"b001ddd705f91e15ca2e70b56458c01c","url":"build/assets/GiftStore-CzD5FfQ-.js"},{"revision":"769d311586befef59ec167193ef9f2fb","url":"build/assets/GlobalCheckout-DkQaDsfT.js"},{"revision":"457d6a1b4c44350f4d1ebfef75b6f886","url":"build/assets/GrowthTrends-Bms_u-oM.js"},{"revision":"15f5dfbba110a70b88887b8c5c05108c","url":"build/assets/GuestLayout-O77_wz_k.js"},{"revision":"37ab4d93120baf75d554836e74acd517","url":"build/assets/HappyCreators-B51hnzs8.js"},{"revision":"f4c5ac9f83ebe42ea4377df5fa167af8","url":"build/assets/Header-NoEn7sFE.js"},{"revision":"c8c1997cd484546a5ef5a55adfc2f441","url":"build/assets/Hero-xmE31zJZ.js"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/assets/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/assets/HeroBg-CgSE7w-A.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/assets/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/assets/HeroBg-mobile-C7A97uu3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/assets/HeroWishlist-BvpIkzQT.png"},{"revision":"6a8b819540414e899af67870c0af3e5b","url":"build/assets/hook-CAs8wpNQ.js"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/assets/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/assets/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/assets/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/assets/huel-DnOlOTCl.png"},{"revision":"e91326613e4d1be8bf2998f55fa1d41f","url":"build/assets/iconBase-Dnvf_zhz.js"},{"revision":"d647e8a8711be22debe2e4d84b72ed18","url":"build/assets/Icons-fk8NCPWQ.js"},{"revision":"4ade2096ce2f6f99b0d52d534b0fbffe","url":"build/assets/ImageGenerationWithAI-DEuWrLDY.js"},{"revision":"dccd1b3024c3a697da030a6cef790aec","url":"build/assets/index-990k1uf0.js"},{"revision":"c7d87546a0f9e5274b4619c666a0468f","url":"build/assets/index-BI9MN77i.js"},{"revision":"71fabd45f13c7cfc7550ee9c26a0884e","url":"build/assets/index-BmsQXA6g.js"},{"revision":"cff22a6104d23b5a985b602ec995ef2c","url":"build/assets/index-BPDKMu3G.js"},{"revision":"846d3527b8b1df25f69b4f570a810273","url":"build/assets/index-c3nE-Y2L.js"},{"revision":"a4de7e3dc5f52964730aa998a8eb7c0e","url":"build/assets/index-C3ZV-Rwb.js"},{"revision":"3dbcef245dd930017948de187f6f5724","url":"build/assets/index-CdeAU9yE.js"},{"revision":"fc605c21d02bdfbbb088882540495275","url":"build/assets/index-CjC8k2Rp.js"},{"revision":"54b3612fb6504ffe9d2fb3440e0b42c0","url":"build/assets/index-CqRuBCDe.js"},{"revision":"a889f2a68f9766fecd3fdabfedfe6c53","url":"build/assets/index-CxCOcb_B.js"},{"revision":"6fd5d00824dfd6a444fefb9caaeda4d3","url":"build/assets/index-D1-gOcTD.js"},{"revision":"bea16054e073c4f03d26b87c3ac207dd","url":"build/assets/index-DrlNqDrH.js"},{"revision":"9f87cf4c641191bac90b17df44445211","url":"build/assets/index-DtJYuoJg.js"},{"revision":"bab6c84e5778be010ccb4b42ea94e51d","url":"build/assets/index-DTpns2G7.js"},{"revision":"0ecad8e8a601d6cd1d0e8b81755f3731","url":"build/assets/index-hS-VjrtD.js"},{"revision":"75fc5266731b97d1d89f2d5184f20d87","url":"build/assets/index-MC1r_e0r.js"},{"revision":"d9dbff2ae10c706a1ef65a48946c3b21","url":"build/assets/index-MhyY1h3h.js"},{"revision":"bd2f8ff60a461d94c5b0758695d33e68","url":"build/assets/inheritsLoose-D74G4V3s.js"},{"revision":"e6f0da6622cc48d7a7bf9dd8e47181a2","url":"build/assets/InputError-BSQoO3g6.js"},{"revision":"ae30ca19601a280bf619eba522eac578","url":"build/assets/InputLabel-CqZptowy.js"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/assets/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/assets/instagram-DvC8l1Gh.png"},{"revision":"db5799c23d39121f75831df1672e56db","url":"build/assets/IntrosVideos-B3Xa4edB.js"},{"revision":"33b3422986b3ee83418330df231ad401","url":"build/assets/Item-BurVr_B7.js"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/assets/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/assets/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/assets/joinBottomImage-BPCsUTyF.png"},{"revision":"53066e82f2e90e5d2315a95a91ebd4a1","url":"build/assets/JoinUs-DZ3X4usI.js"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/assets/kylie-BcKwDcm6.png"},{"revision":"2ced993c894a9f351e3430525800127d","url":"build/assets/LeaderboardStars-D8f5-uOi.js"},{"revision":"dc3ef918bcbb81cca442c4a5f8ea9295","url":"build/assets/LineChart-BH9TB2Ue.js"},{"revision":"df99910596362d361918eb0859bf1c01","url":"build/assets/LinkTwitter-6zukY-2H.js"},{"revision":"039efdf95b3baa096cf76515818095be","url":"build/assets/Lists-DHc31GKE.js"},{"revision":"cd978b7bb635ea00ed8177a2e05b17a4","url":"build/assets/LiveBar-COasMtw_.js"},{"revision":"240bc4a8d8530e1fc7a15854214157fc","url":"build/assets/LiveBarSection-cb__EqTD.js"},{"revision":"c356c57447f31a7e446118ef7ce5a7e8","url":"build/assets/LoaderButton-CXA4ieEq.js"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/assets/loading-DKd4CxP-.gif"},{"revision":"6ceb64d6d16f2b39141ad0714270811a","url":"build/assets/LoadingScreen-BNgLPrLG.js"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/assets/lockprofile-BXHexqRM.png"},{"revision":"e8e3fabd0d06143c04ed588d1b24b89a","url":"build/assets/Login-BWWLDj4L.js"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/assets/logo-BfA3DShe.png"},{"revision":"af6baaab72b428f97e9add96d3cd03c4","url":"build/assets/logo-YD7rJ-Ac.js"},{"revision":"ba053d1f9542bcae14a90be9cc14fc3c","url":"build/assets/MagicBellNotification-BaCNndmo.js"},{"revision":"2d579d5c11c121dd462ae17047d03cc5","url":"build/assets/MagicBellNotificationDisabled-C0eDglnv.js"},{"revision":"1375e4ba136ca4f9d8c4a12d285afa9f","url":"build/assets/MemberCheckout-BqJ94uYp.js"},{"revision":"0fe7d46f7548f3c039f220b2a1a20f2a","url":"build/assets/Membership_dashboard-Q-Gv5Nw9.js"},{"revision":"4afec040fb9d435a58e8343e72c7bb30","url":"build/assets/Membership-C2UvOm2-.js"},{"revision":"c6ca20007423c962b218eb6d529b57db","url":"build/assets/Membership-Cxlx01Wq.js"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/assets/membership-img-D47G_pA3.png"},{"revision":"df340e67d5c3d3dd1ef3c1a2cbaa8ff7","url":"build/assets/MembershipLists-DGiCxDPj.js"},{"revision":"8fc270a3133fdf5bcea18124f9d7c35c","url":"build/assets/MembershipsLists-DYrJl0o8.js"},{"revision":"42d744112b2e9b6e7270ea7c697de651","url":"build/assets/MembershipTracker-DLWlE1h3.js"},{"revision":"da9a1dbd21dd319d9edf5d2fa3a422b8","url":"build/assets/MonthlyRevenue-HOtjXNlf.js"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/assets/mouse-DINZi5et.png"},{"revision":"af196d1baa16a55c8adff03c257c2eb1","url":"build/assets/MyGoal-BMcwU3vq.js"},{"revision":"7bdb7b7ad895e3ccf3063178f3a2e46e","url":"build/assets/MyShopProducts-CboucDV2.js"},{"revision":"1ceb4b02d2a00992f6158b8949cc0d15","url":"build/assets/NavbarContext-Qt36kJ8i.js"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/assets/navigation-CteQybwo.css"},{"revision":"fca3858538f27989f0f799a74b58b2fe","url":"build/assets/navigation-YO5Wkffh.js"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/assets/nike-DLThTltp.png"},{"revision":"de814030fb676be9075eaf5cd7a43cc6","url":"build/assets/Nocontent-30WMZpvl.js"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/assets/noresultimg-CnfMO9_z.png"},{"revision":"5015f8ac3dd8a0f170dbe2ab65297f2e","url":"build/assets/noresultimg-FARQaBoV.js"},{"revision":"182dbfaeb531c302296430773ba6d3b9","url":"build/assets/NotForBusiness-_nRekFgI.js"},{"revision":"472621e84f24bafbd1f082f93212457b","url":"build/assets/NotFound-0K5tyM_c.js"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/assets/nova-VIEvmjEk.png"},{"revision":"2fbd518620c8805bcb7e6b53c60ed219","url":"build/assets/OldSubscribe-QGnNmbhI.js"},{"revision":"7f9599e1749e2ab957919b3ae748ff33","url":"build/assets/OrderDetail-bfMaaH-H.js"},{"revision":"1d95104dfa1b85dec6573183b1eb3e27","url":"build/assets/OrdersLists-B97X-8W1.js"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/assets/other-BKBJqoNV.png"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/assets/pagination-DE0q59Ew.css"},{"revision":"8ffa79ca4ce701a7c94c1b478bec18e7","url":"build/assets/pagination-Dzri0AMQ.js"},{"revision":"20b91df4f7817ae6c7962dc5efa17c96","url":"build/assets/PaymentDashboard-CMB_Nu1K.js"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/assets/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/assets/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/assets/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/assets/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/assets/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/assets/PaymentIcon6-Dnmu-RS3.png"},{"revision":"1b3484c562a0d46caa765222c347e7dc","url":"build/assets/PaymentSlider-CJXmvvCy.js"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/assets/PaymentSlider-VUyWc9KG.css"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/assets/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/assets/plaid-C3YNig8l.jpg"},{"revision":"0330847125995407a1e440ffab32325a","url":"build/assets/PlatformAnalytics-DMlm9xeW.js"},{"revision":"f7d2c44bb8d859749235e3bc519827d8","url":"build/assets/Popup-BbZYXf3B.js"},{"revision":"5de252ad954fa1198f749454e3881481","url":"build/assets/Post-g0uftHK_.js"},{"revision":"c4d319550bfa97a6fca8337416695c83","url":"build/assets/PostLike-C08ZcvV3.js"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/assets/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"fb8ef4df8e5028bb0758da9259dda5f0","url":"build/assets/PriceFormat-iSoLJ1uk.js"},{"revision":"066b28440a518466ec58d1f831281ab3","url":"build/assets/PrimaryButton-D_oFwCjI.js"},{"revision":"8a326a409a42a362e174a30f8b0460a0","url":"build/assets/ProfileProduct-BLUJSSgt.js"},{"revision":"79ab9489a859598ac5f3d4bb7b7e5bbd","url":"build/assets/ProfileProduct-Cl6crOmh.js"},{"revision":"c3d9325271de21d4c99c7d96e9fcd99d","url":"build/assets/ProfileProductLists-D1NP1TvQ.js"},{"revision":"60ea719859e586d6b5934568c3311736","url":"build/assets/ProfileProductLists-D6iAKLu9.js"},{"revision":"1d15290dad17eb3e132fc012d23e0afc","url":"build/assets/ProfileSteps-DSqaBVAf.js"},{"revision":"b498e64ebb1482461d1605e8a2a2649e","url":"build/assets/ProgressBar-hiLtmdFN.js"},{"revision":"011f61715c6c4e8ca3897e6253db74a0","url":"build/assets/Promotions-fmIm3eGF.js"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/assets/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/assets/publish-CYFC99Bi.png"},{"revision":"7f05ff92f26b083df274111113f96455","url":"build/assets/react-select.esm-CceLAsMZ.js"},{"revision":"c1fd6458baab6c35fdc324e3919a92f1","url":"build/assets/RecentSupporters-DTwLTHLd.js"},{"revision":"889e2fd6caf7d79f4bb5c45725f96468","url":"build/assets/Redirecting-DoBFXPTo.js"},{"revision":"f25b554caad3cbd7707105e03de1505c","url":"build/assets/Register-Bz9ghBlz.js"},{"revision":"63c078f776e8c6825633be66eaad7117","url":"build/assets/RemoveBill-CpDPtZBk.js"},{"revision":"0925e049ffdaa16bf0b47e43fab72308","url":"build/assets/RemoveMembership-BTqFnJRm.js"},{"revision":"c94410cdb2016f6077f69b45a1f2ece2","url":"build/assets/RemovePost-CliTR8bt.js"},{"revision":"97b33c3277be0ebbfc4ee45cb75ee915","url":"build/assets/ResetPassword-BXBBamg0.js"},{"revision":"6f4e6f7eedee19e5fe55a67b468834a6","url":"build/assets/SafeTransition-BnYqMm0z.js"},{"revision":"aa1f9cc3aa1d6d220356428b431d1fb3","url":"build/assets/SayThanks-Dx8IR5SX.js"},{"revision":"bd87136be7f80d488ff0ccc7f07cd003","url":"build/assets/SecondaryButton-Dihz5fAN.js"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/assets/seeksearch-CGztpZW3.png"},{"revision":"c33ca1549f0e2475c735a0674bdc0bd2","url":"build/assets/SendTip-BxA-KHQk.js"},{"revision":"5c829d5b30dc32721f17ca018b5d04bd","url":"build/assets/setPrototypeOf-DiOlr_ig.js"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/assets/setuppaymentimg01-CIwjGd16.png"},{"revision":"46d5bf0dacc3199e16d695ac356b93c8","url":"build/assets/ShareProfile-i6rliwdz.js"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/assets/sharlinkimg-B-m5kVcL.png"},{"revision":"e44ddd7e3ba7f2e159f68f7eb4e6d17d","url":"build/assets/ShopPage-DtGWMF4r.js"},{"revision":"b9400256cc250873296849397f2404ca","url":"build/assets/ShopTracker-CS1Fk3RI.js"},{"revision":"295e73b048fb341a4e7b87ca0a5426e1","url":"build/assets/siteicon-C45idYI1.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/assets/siteicon-CeHS7aEc.png"},{"revision":"25d195ec80004e49df26800ef3c39d8b","url":"build/assets/SiteSubscription-D8QH3QHY.js"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/assets/social-bg-DGdPbRTx.png"},{"revision":"1acf87f1f58f440cb0328a09223b8a70","url":"build/assets/Social-BkIlN3j6.js"},{"revision":"b49b3d18092848aaad1f95f71e542120","url":"build/assets/SocialLinks-D7It8HPJ.js"},{"revision":"cf5fce793ef903198671404654513084","url":"build/assets/sortable.esm-DzI4NBnf.js"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/assets/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/assets/ssl-DnZPu9aw.png"},{"revision":"d5bb0ca767bd93f2703704a25c670539","url":"build/assets/Stripe-D2bYsjNX.js"},{"revision":"97fa9db81300e93f09e15c314d5deb96","url":"build/assets/StripeIdentity-CjAgf9eO.js"},{"revision":"1a153bbc7bde7c19a0857558daf128e4","url":"build/assets/SubCheckout-p1PVYM2x.js"},{"revision":"34c7b808fd9009e4f42791c1a19a900e","url":"build/assets/SubcriptionEarnings-0VozUS0V.js"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/assets/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/assets/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/assets/supportors-img-CQS8-frF.png"},{"revision":"08a86c83d268ea405f8e0f16783adf54","url":"build/assets/Suspanded-BfOhl1lE.js"},{"revision":"e3db06485a36c495dff5eca876df0ab0","url":"build/assets/swiper-react-BlYwKZTg.js"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/assets/swiper-react-DV8PrLMj.css"},{"revision":"ab80aaf4dd7cac1a6d757f15dc337715","url":"build/assets/TabbedDashboard-CiZAiRao.js"},{"revision":"e511a02eec5dc4b5be09c75dbdc0f315","url":"build/assets/Tabs-DxxL-Qkl.js"},{"revision":"3032c5bcacd9b9a019fb948339ccce54","url":"build/assets/Terms-BoKcPpEE.js"},{"revision":"1232a01020b9ed824e47cfea485b4b3f","url":"build/assets/Test-BbdBFNmb.js"},{"revision":"06681a52722973da5278be09e0366e41","url":"build/assets/TextInput-BtNqE2yl.js"},{"revision":"ddc58aacaae37f6eeda6032441cb2ded","url":"build/assets/TFA-yb9RbKHq.js"},{"revision":"e1b67b32f1d900791381f526ffd26c12","url":"build/assets/Thankyou-DDfIBJYv.js"},{"revision":"8321c9d8d5858eb3369df108d7af8b99","url":"build/assets/ThankyouMessages-CEafZmkh.js"},{"revision":"9947ffb251827893e9c67947a7f3f22f","url":"build/assets/ThankYouRye-DlCfMOyo.js"},{"revision":"f9dd2aac165a747e7475729b48a8327c","url":"build/assets/ThemeProvider-DFVp7hcC.js"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/assets/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/assets/tiktok-COEdX1Uc.png"},{"revision":"36ea813b9b553da01594b880488a9e50","url":"build/assets/TimeFormat-D4UDUp_D.js"},{"revision":"45a7b2cdcacca538270ae1ac0dc3f0b4","url":"build/assets/TipInner-BXdwJ-Fh.js"},{"revision":"67077b1701a0a3c4f49e8619a3638ca3","url":"build/assets/Tiplisting-DlB0FjBA.js"},{"revision":"8d3dc83a93662d7701124366be765972","url":"build/assets/TipTracker-9N9xvomz.js"},{"revision":"bcb955545ce60fd89207bbe113aed938","url":"build/assets/TopEarnBills-788qA6Rb.js"},{"revision":"1f058ab2a74febda54576abd5107d6c2","url":"build/assets/TopEarnWishes-CjUnUywc.js"},{"revision":"f08039f9a765dc34c1a75fa64dd188dd","url":"build/assets/TopSupporters-gVCYXXiP.js"},{"revision":"1aed9b3775e8ee16293481e411e4ecd9","url":"build/assets/TopSupporters-ncSV4Ppf.js"},{"revision":"d2dd7df92a747b9d5b71935e035cec0b","url":"build/assets/TransitionWrapper-DqDChBbX.js"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/assets/trust-hK0IhoQZ.png"},{"revision":"00c3f94b9d5467181a72b655b77ca696","url":"build/assets/TrustBox-C2WeiVk1.js"},{"revision":"eaad5202c1d4faa46229786132d0a25a","url":"build/assets/TweetNow-BRIHLoGm.js"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/assets/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/assets/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/assets/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/assets/uniqlo-Bxf7nI5n.png"},{"revision":"edd343d9195b7bb05dcd52b8cd255b58","url":"build/assets/UpdateAvatar-Cys2i4_6.js"},{"revision":"aeedbb9b9f6209c958676d999fcc0855","url":"build/assets/UpdatePasswordForm-BiYgH2PH.js"},{"revision":"8a8585a0892c182dfe5f704101883040","url":"build/assets/UpdateProfileInformationForm-B4sqYHLJ.js"},{"revision":"067ce7c791b573b97d3d4664bcb165df","url":"build/assets/UpgradeStripeAccount-Bgw0r5UY.js"},{"revision":"3c3aa80a9cd17e08a56afce6fc4beb4e","url":"build/assets/UploadcareEditor-vDrzIaJ_.js"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/assets/uploadedimg-BhEeut8S.png"},{"revision":"c014a54ac507234cc3d6c506d8119cb0","url":"build/assets/uploadedimg-iAQ9Y4ys.js"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/assets/uploader-BQYCdP4p.css"},{"revision":"4af06783481865890f69e826ca47d6e2","url":"build/assets/uploader.module-BD-2PPA_.js"},{"revision":"14867c20b8ab5c8abf9187a90c64b75e","url":"build/assets/useDispatch-WJDWr3uZ.js"},{"revision":"409532b068e04dddc0b098216639a858","url":"build/assets/useEventCallback-WUCV3ZCa.js"},{"revision":"b6c48eb56a6a75525edc1c4b35f68b02","url":"build/assets/useMergedRefs-CJdMvCpA.js"},{"revision":"0b6a898eec8f9deb7824a595730275a6","url":"build/assets/UserCarts-DOliZgn3.js"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/assets/userphoto-2kQnKrr1.png"},{"revision":"05e7a203a409ea2e0eac790985bbae75","url":"build/assets/Userprofile-CMYjaEl0.js"},{"revision":"3032c5bcacd9b9a019fb948339ccce54","url":"build/assets/USTERMS-D1fDVmVk.js"},{"revision":"12e090570d8cc2a8b8eda93a8189cbe1","url":"build/assets/VerifyEmail-ueUUaDPN.js"},{"revision":"e67dc724d24038f1c6f2bdcaa79e0456","url":"build/assets/VersionUpdate-DxrxDAbP.js"},{"revision":"047dcc92c4a31aecb6130d9660dff2e4","url":"build/assets/VipSupporters-icBi8lgv.js"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/assets/vishitimg01-ClMBzIW7.png"},{"revision":"a6c76b57bd28b4fc4fc5496247932373","url":"build/assets/warning-CGs6-e0D.js"},{"revision":"f2407b25263406b9c68285acb60efd46","url":"build/assets/Welcome-B0tudT9D.js"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/assets/Welcome-DvB2Xm2x.css"},{"revision":"8b36aeb96dce217de884ea25f8742f0f","url":"build/assets/WhyLove-CTQsrzDd.js"},{"revision":"f737fe8c233c002f4d7d285a8c463602","url":"build/assets/Wishlist-MCcf426I.js"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/assets/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"1d50a5537d7282e36fc843ec7d60d108","url":"build/assets/wishlistbannerimg-DU_hurLo.js"},{"revision":"1ee246565e2dae477f86903415975ef5","url":"build/assets/Wishlistbox-DsU_HA2e.js"},{"revision":"03682b79a20bcf3afad4e211d464a809","url":"build/assets/Wishtracker-BYvfGjal.js"},{"revision":"fd92717a02faf9818e742fa6ab3a1dca","url":"build/assets/Works-9UVQSGC9.js"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/assets/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/assets/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/assets/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/assets/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/assets/youtube-DDw5LQj8.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
