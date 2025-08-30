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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"ed888970f74f7656ca7e410f623d3d5a","url":"build/assets/Accordion-DeQ-fmPu.js"},{"revision":"43be3b66a1dd30cba4da685528ba87de","url":"build/assets/Accountsetting-CAp6auBa.js"},{"revision":"e59b288ec69a22245875f06c2bb6a21c","url":"build/assets/AchievementSystem-JTC5impV.js"},{"revision":"21bbf6483703e450ce1571658b48c16c","url":"build/assets/ActionRequired-CRVeCt6l.js"},{"revision":"265b99c0e84754627baf77e9dc77ccf5","url":"build/assets/ActivateCard-BzJ115V_.js"},{"revision":"ffa9d369fa06363330431bbb9d404c3f","url":"build/assets/ActivateSubscription-DVt05_Lp.js"},{"revision":"1df901721bc8c5827f20d52bc2a160ab","url":"build/assets/AddBills-BjMsQXAd.js"},{"revision":"e563324d5c077c1b314c60228db15be0","url":"build/assets/AddCart-ByPgyaCo.js"},{"revision":"bc8e093c4e8de0b21966aa6daac297d9","url":"build/assets/AddComment-6myiFJ4j.js"},{"revision":"644e76580b29e9205172ab680768dd81","url":"build/assets/AddGift-_NxdGjBD.js"},{"revision":"be961bd0103fa0b5183a9992f180e7d3","url":"build/assets/AddGoal-DVVdsqkg.js"},{"revision":"151c733ed3e6c45d8789d516b365b1cb","url":"build/assets/AddIntro-cMQxrMZL.js"},{"revision":"fdcdb3881eeb6e431c956b613534da63","url":"build/assets/AddItem-BCOyJZqW.js"},{"revision":"c83a647740d2edd635e34990b3148aea","url":"build/assets/AddMembership-DeSbO3oI.js"},{"revision":"52e6b5a4984f2854ed96ccb10f77e434","url":"build/assets/AddPost-DBTWsgku.js"},{"revision":"507da6eadc9164191a65c3b45836f4eb","url":"build/assets/AddressForm-CUgTEsTT.js"},{"revision":"c2e318226e55edf8b854bc487148ff66","url":"build/assets/AddRyeProduct-BuaI7ohn.js"},{"revision":"3839f651190f6630477180a58b8681af","url":"build/assets/AddShop-CzuA3WDJ.js"},{"revision":"9b5555cb9af11a107957ea0323797b0c","url":"build/assets/Alerts-CUg2hkWn.js"},{"revision":"c077e33a9a55d874bcb653c849277578","url":"build/assets/AllCountries-DnSzgIcK.js"},{"revision":"4e1e72d3b19ef48fa2d6d56c8b93f6e4","url":"build/assets/AllWishes-DYsaT_L8.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/assets/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/assets/amazon-Cd4bGo_L.png"},{"revision":"517fa2af4d159b9dc21fce665fce89a5","url":"build/assets/app-D9uu0tDB.css"},{"revision":"dfc6c496e6888d170dbacaee4d326047","url":"build/assets/app-DsPLTa-6.js"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/assets/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/assets/asos-CIGR1i9R.png"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/assets/assertThisInitialized-Ctu0bbrq.js"},{"revision":"8073829a8f1eaa7d3e6c8f55dbfb5316","url":"build/assets/AuthenticatedLayout-CAIHvSIo.js"},{"revision":"f1a64d457a7f39ce8fe52b7c8e081856","url":"build/assets/Avatar-DEVI4RYC.js"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/assets/beauty-DCFqJTVd.png"},{"revision":"8cc35c12fc21c20bf92443da2dfc829d","url":"build/assets/Bill-0rradcjF.js"},{"revision":"4f51a864b7dea55cd4d2b45bae8be08d","url":"build/assets/BillCheckout-CF_i_eE0.js"},{"revision":"df4fe27a9194d596229909f59372bec4","url":"build/assets/Billslist-C98tA1xu.js"},{"revision":"3b975c94cbec04b74ccfbe3f9af77f86","url":"build/assets/BillsTracker-Cp9HGVaZ.js"},{"revision":"94bd9e2d6b8450b7b772aa5af5d70773","url":"build/assets/Board-DY5lKmk4.js"},{"revision":"f0fded1d1931659fb24c51868bb6570b","url":"build/assets/BottomBar-onuG-wpH.js"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/assets/british-flag-BcogJXZ-.png"},{"revision":"e8974ff10dde6d49048fc942a8f9a6ad","url":"build/assets/BuyShopItem-CVLbY4r9.js"},{"revision":"9e66cffcee91c36e8490035c99553fed","url":"build/assets/Cart-ks3l5Vz9.js"},{"revision":"2739e96bb3147cb559a976e365e3560d","url":"build/assets/CartItem-PXoKzHmB.js"},{"revision":"a8255237f7e5b8ac5350da4e7c5633cd","url":"build/assets/CartItems-hOSV2yuI.js"},{"revision":"55bd52e7431693eb23be16d41970a3d9","url":"build/assets/CartListing-7Fh58qWX.js"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/assets/cartproductimg-C1koo3C8.png"},{"revision":"050b9c954fd6f9ea1370fae798fbde19","url":"build/assets/cartproductimg-IopLElGc.js"},{"revision":"3d472c53f044f60cc6ff466ab7f0c90a","url":"build/assets/CategoryLeaders-DGI0HwVi.js"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"924a7d8ba54a52b697b65e34748f384c","url":"build/assets/ChangeCurrency-Be6oi87M.js"},{"revision":"2fe9bb0535ff6dc985d185d2801aafde","url":"build/assets/ChangeVat-DIcLoZnh.js"},{"revision":"208388eec6365482ea097b10076ab8a7","url":"build/assets/ChartDashboard-gfDJGgkS.js"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/assets/closeblacksm-DrNnW4fj.png"},{"revision":"5fe9e46c2880136f12579809207a6cc4","url":"build/assets/Collapse-CT_IAxJS.js"},{"revision":"61850185e925ec87624485f4718fc341","url":"build/assets/ComingNext-DWdPouDk.js"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/assets/comingnext-jAz-GIeT.png"},{"revision":"990ed01a64e7d63f48477a1552602c6c","url":"build/assets/Comment--wDB_tyQ.js"},{"revision":"ad382d288a13ca4dda61d3cb3e27e8e0","url":"build/assets/CommetsLists-d7rN5tkn.js"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/assets/commingsoon-eOjyCKzm.png"},{"revision":"192af13e4536d58a4c83be85dc6024ce","url":"build/assets/ConfirmPassword-Bld2HMCN.js"},{"revision":"a22c33febdfc8e8a31728587ffbe1d45","url":"build/assets/Countries-JK9YP5D5.js"},{"revision":"f268f4639f61a3736fb0c19379953286","url":"build/assets/CountriesShipping-c7PbYkZe.js"},{"revision":"be608bbbbf2f7562fe92aeea11fd01f7","url":"build/assets/CreatorVerification-CCaeHqvg.js"},{"revision":"dfa0a45bc39a0473ca31bd7a37f5eb13","url":"build/assets/CreatorVerificationNew-BbkN7_YB.js"},{"revision":"9ef22f320438843a2c12ed1ebf3527f4","url":"build/assets/Dashboard-DMcJqoBu.js"},{"revision":"64d6f20e8d1d4e4f1775553d812e644a","url":"build/assets/DataKey-Byd4ugkM.js"},{"revision":"5f37debb94216ff0ff602641151cf646","url":"build/assets/DeleteStripeAccount-BwQPWIrq.js"},{"revision":"0f912564b86ee3e4e279d9032994586e","url":"build/assets/DeleteUserForm-DVIfnTcg.js"},{"revision":"96e2ebf32418d112a3c61d8807d21673","url":"build/assets/DiagnosticPage-3YDRkTWi.js"},{"revision":"afac6ebb98cc69997f438376480a5b21","url":"build/assets/Discover-VHWQIcPD.js"},{"revision":"54f9c267e31d9401734db0a055af03d0","url":"build/assets/Dropdown-0JDdGNYz.js"},{"revision":"cc606848d4c20d6c5cc8373bbfc19ef4","url":"build/assets/DropdownButton-DPi4juTb.js"},{"revision":"d1d2bfbef3efda357677bccdbc6efb39","url":"build/assets/Earnings-BR95lo_h.js"},{"revision":"5b210fa82d7e218bf509b6d49ee0698b","url":"build/assets/Edit-B1XGJBNY.js"},{"revision":"a64ad53cb7a23f32289da83888976328","url":"build/assets/EditCategories-BJv7xNCE.js"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/assets/editicon-errcM8K5.png"},{"revision":"70202258622eeb4439fc8665d117cc83","url":"build/assets/EditMembership-B-YFO4_6.js"},{"revision":"5c1ee602600527243c7ed2dcb64abcc9","url":"build/assets/EditProfile-BN3dS8dG.js"},{"revision":"bf907bff59084c7091d3e5ca768b8cac","url":"build/assets/ElementChildren-OuP3SETb.js"},{"revision":"86a3efb733c09bf4c79fe65925a930bc","url":"build/assets/EnableCardCapabilities-Cl6q5AV8.js"},{"revision":"9d0bdf48765001cbcefde4d7e63c8f4c","url":"build/assets/EnterOTP-udQgwEJ-.js"},{"revision":"6a4c6fd63fa4d0456c979c986c51c32b","url":"build/assets/ErrorPage-DujhYpP5.js"},{"revision":"9cbe6bcdf0e0dab23c8878fd414d116a","url":"build/assets/extends-CnzoikGv.js"},{"revision":"efc7cd88ccc6456152746226ca8214b5","url":"build/assets/Fade-Ddwk5EH0.js"},{"revision":"c133904ceb961e7b785e3217206dd79f","url":"build/assets/FAQ-BSDTWHiq.js"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/assets/faqhand-BXWGoK2R.png"},{"revision":"b012d69fb0b9c12e8b52d68e2a6265b1","url":"build/assets/FeedList-BXqnAtH9.js"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/assets/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/assets/flag-european-BCCzeLKH.png"},{"revision":"fad69b45b2808e55d938424a45914b59","url":"build/assets/floating-ui.dom-B5qI50Hs.js"},{"revision":"4b51b6c30b2b6fea211f0524800d9ad2","url":"build/assets/FollowButton-ClnkbXBd.js"},{"revision":"c663dbab039b5e6aa8b62f97c607279e","url":"build/assets/Footer-vMyORVcN.js"},{"revision":"e21a110164bcdd7cd5f663802b1acefc","url":"build/assets/ForCreators-BKAHYUVB.js"},{"revision":"42ac8336d7c090ab6039f67e319de0b1","url":"build/assets/ForgotPassword--Jzbxybc.js"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/assets/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/assets/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/assets/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/assets/fundbasketimg01-DNZiLLCY.png"},{"revision":"85b60012d2bab7bce89573e1c0403705","url":"build/assets/FunPart-B5o3BW6b.js"},{"revision":"2e5aab6694234b26e767f6812e02f9bb","url":"build/assets/GetCart-D9Z4nZT7.js"},{"revision":"a4a5fd06240e45250289933028b8960d","url":"build/assets/GiftAddCart-CreNtLAe.js"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/assets/giftbasketimg01-UPFBeLeW.png"},{"revision":"8e2560d31191e0d936cd5bf243f808dc","url":"build/assets/GiftEdit-li7PXIAO.js"},{"revision":"391b685e8bd115ea6529ff1fc76b51e8","url":"build/assets/Gifter-C4zAIi5q.js"},{"revision":"52de49c4f82805a5d338d300009fa413","url":"build/assets/GifterCardVerification-3A0XZ59o.js"},{"revision":"3922944ea0d2beb308efca92935105f2","url":"build/assets/GifterFeed-oETvCQX_.js"},{"revision":"c26b3151221b2ddab4c5f36df20ad406","url":"build/assets/GifterItems-DRe_xyBf.js"},{"revision":"53902e5aa693e0b98ff50df5902a99d7","url":"build/assets/GifterMedia-6Gkp3PLy.js"},{"revision":"06daadcccf15556da0daac9c0ff8344f","url":"build/assets/GifterMembership-CCEvjqw5.js"},{"revision":"86c735d3ddc11c108bd75e0478ddfbc5","url":"build/assets/GifterSubscriptions-B7H2Vhe5.js"},{"revision":"83b3fa9f07af9f1daedaafed063fac27","url":"build/assets/GifterTips-DBitRB84.js"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/assets/giftimg-CbenuWDF.jpg"},{"revision":"d42fabcbb038361d4179061e76561b1f","url":"build/assets/GiftListing-D-n2CGSv.js"},{"revision":"0e67305e2af732612710d222104662e1","url":"build/assets/GiftStore-DC4khhkA.js"},{"revision":"98f367e580cd788130e95aafc13fe069","url":"build/assets/GlobalCheckout-6QwvHsU9.js"},{"revision":"f2ce6128ef29b3a15dac7582314a39c1","url":"build/assets/GrowthTrends-C9aTuBP2.js"},{"revision":"2d9d4847bf6796c8acfdedc894e305b7","url":"build/assets/GuestLayout-BMyjwrLH.js"},{"revision":"bab031c1098d6a47175aef5a1c748d99","url":"build/assets/HappyCreators-9w-LNw3J.js"},{"revision":"8d0998fad4eb512c21505abd90819d88","url":"build/assets/Header-CW95s8eF.js"},{"revision":"db13c24cc9e3933ad0c76573f6f3f3d2","url":"build/assets/Hero-B2ewJ36z.js"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/assets/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/assets/HeroBg-CgSE7w-A.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/assets/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/assets/HeroBg-mobile-C7A97uu3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/assets/HeroWishlist-BvpIkzQT.png"},{"revision":"eb7e76671980c3b060f6886ce402f44a","url":"build/assets/hook-BRKmkVQX.js"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/assets/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/assets/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/assets/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/assets/huel-DnOlOTCl.png"},{"revision":"da6b48e9d5394c0f01aa65f84b9ce6a8","url":"build/assets/iconBase-DcZQaviE.js"},{"revision":"e69aba6f1529f0af97f8532e7ca72d3e","url":"build/assets/Icons-DnyYLqNt.js"},{"revision":"93cfd171b1affc1d781adf3e735013e0","url":"build/assets/ImageGenerationWithAI-5RBZooxw.js"},{"revision":"beef2f57dfd5537fdf8da73f8c902337","url":"build/assets/index-54l4E-yw.js"},{"revision":"66adabad6419c182753895791e35565e","url":"build/assets/index-B03zNyJ7.js"},{"revision":"15cd48829c7ac67b2e38b05651f5cdd3","url":"build/assets/index-b5djvuvX.js"},{"revision":"d8f44e9c78701c72b1a8dceb43f4f92a","url":"build/assets/index-BhV9aZRC.js"},{"revision":"a82d1fa7bc993bf1eab6a4c00c204b8c","url":"build/assets/index-CibIWgrL.js"},{"revision":"1e51369e11eb61344f0b2442755bcc16","url":"build/assets/index-Co1fn4U2.js"},{"revision":"0e9ca0b68bd84768041c8e6579ca883e","url":"build/assets/index-CtO3svXY.js"},{"revision":"2fc391d7f2e873e396a3c845c4b5666e","url":"build/assets/index-D_sp4nuZ.js"},{"revision":"f76d567efae4cfb177a207d324bf3402","url":"build/assets/index-D8gr7hB8.js"},{"revision":"65680e91e6ef89f2ce8bdbafa69cdff8","url":"build/assets/index-DaQKJFuN.js"},{"revision":"987d6d9352100c0565ab64a843172721","url":"build/assets/index-DWxO5Hel.js"},{"revision":"82562e8ece30ab0c7d452c92e1938236","url":"build/assets/index-DzJzdqBA.js"},{"revision":"60a9356154935aeb883617b658bc90bd","url":"build/assets/index-jtp0R2iC.js"},{"revision":"aaeb5906706834d62946bb51a4e2001d","url":"build/assets/index-JUB1yhBl.js"},{"revision":"ca525245e4fa7138d4198432889934ed","url":"build/assets/index-R-ykVG5Y.js"},{"revision":"d842b54d87852973074d9ddade3132bc","url":"build/assets/index-W0Z0HrAa.js"},{"revision":"fea1c5f015e7bab5bb33b43c5cdb6020","url":"build/assets/index-z8l5Otvu.js"},{"revision":"b29fa4e530cde53edd6b051f58f84dd2","url":"build/assets/inheritsLoose-3PWo7i2t.js"},{"revision":"90adc2e7c782cfb4eb70dd699138ab49","url":"build/assets/InputError-JnEcN1mV.js"},{"revision":"68570e59ee43d85a00e02a8de6bb8ba3","url":"build/assets/InputLabel-DqmT4wnP.js"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/assets/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/assets/instagram-DvC8l1Gh.png"},{"revision":"4214603dfceadcf93b88fd5d0cc35140","url":"build/assets/IntrosVideos-CUFJmfOb.js"},{"revision":"2a58fcaf5a36957861d1a2d8f6dda636","url":"build/assets/Item-Cv9DEQ83.js"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/assets/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/assets/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/assets/joinBottomImage-BPCsUTyF.png"},{"revision":"1e2042311ae93369fec4113323172204","url":"build/assets/JoinUs-BfUJ6ydv.js"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/assets/kylie-BcKwDcm6.png"},{"revision":"cd43f3047ee732ec8be5d68f0c0e7a52","url":"build/assets/LeaderboardStars-FTgDPJ_r.js"},{"revision":"fccdc3d0ea26f37ae4195160aa86409f","url":"build/assets/LineChart-DxvL6Cdq.js"},{"revision":"f4890b5c09764e3af5987d647d200690","url":"build/assets/LinkTwitter-CXWOlU6b.js"},{"revision":"118fce92581a4ac757a26bd7d924f392","url":"build/assets/Lists-BdDJD7ly.js"},{"revision":"6deded2961f232dcdfe7ecd23cc04126","url":"build/assets/LiveBar-DyM6DOiI.js"},{"revision":"2f07fe9a6dcec54b987ccc581f999bfc","url":"build/assets/LiveBarSection-DzaPEAnE.js"},{"revision":"b622c46b5575d12affbea25d87c0db33","url":"build/assets/LoaderButton-CpN3oTi5.js"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/assets/loading-DKd4CxP-.gif"},{"revision":"852ec39771f31627831b29125305e427","url":"build/assets/LoadingScreen-8dhGpHAf.js"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/assets/lockprofile-BXHexqRM.png"},{"revision":"4b78a5e8b20fd4a9319d15ad2e06dbb5","url":"build/assets/Login-Qo525Ojl.js"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/assets/logo-BfA3DShe.png"},{"revision":"af6baaab72b428f97e9add96d3cd03c4","url":"build/assets/logo-YD7rJ-Ac.js"},{"revision":"7bf1468651859a8d60acf0bfa40be044","url":"build/assets/MagicBellNotification-DJ4Li_t8.js"},{"revision":"35a5336a386b7227ab2711c22ac76785","url":"build/assets/MagicBellNotificationDisabled-QoJ6xSJ0.js"},{"revision":"75db43bf429c1c2fb141c0fe17308a17","url":"build/assets/MemberCheckout-BL-6UO-1.js"},{"revision":"2d40417b37092495a158620484990741","url":"build/assets/Membership_dashboard-B1UhNmd0.js"},{"revision":"f15fc8783b634f1dd153dbc264a72274","url":"build/assets/Membership-Bq2Csj60.js"},{"revision":"63c485a061937470ea7dddac93561c7f","url":"build/assets/Membership-BrxpM8BS.js"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/assets/membership-img-D47G_pA3.png"},{"revision":"a5bcf5decd38a02b94c46e7ff83aaa5f","url":"build/assets/MembershipLists-Dg0AswRP.js"},{"revision":"fb621ec68b1004268c9acb730f3fdacd","url":"build/assets/MembershipsLists-D_Gp37mI.js"},{"revision":"3f1ecab7fadf9bbc77b5a730ba27220e","url":"build/assets/MembershipTracker-Co335oNs.js"},{"revision":"f7e1fe10a614732f3555aa2ad8e1fcf5","url":"build/assets/MonthlyRevenue-C_yNzrbs.js"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/assets/mouse-DINZi5et.png"},{"revision":"e60a6c98b6961f38e629faff054caa5e","url":"build/assets/MyGoal-DRmkk7jo.js"},{"revision":"930fdde87c26ad0dd770ecf765045dcf","url":"build/assets/MyShopProducts-hK535l0T.js"},{"revision":"de8c165ded38d9abaab439fbf10b05c4","url":"build/assets/NavbarContext-MZqJWvsY.js"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/assets/navigation-CteQybwo.css"},{"revision":"58a76e90b082cb70e8a7472ffd740039","url":"build/assets/navigation-DT0zpyKv.js"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/assets/nike-DLThTltp.png"},{"revision":"ec9d4422947672025b079fe3a1fc91d2","url":"build/assets/Nocontent-gBDADLkc.js"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/assets/noresultimg-CnfMO9_z.png"},{"revision":"5015f8ac3dd8a0f170dbe2ab65297f2e","url":"build/assets/noresultimg-FARQaBoV.js"},{"revision":"01ebbbf04de8c22747068518e5690b81","url":"build/assets/NotForBusiness-BVn0Cylp.js"},{"revision":"5a931fd9c4fe74c5e0c5381fefa23850","url":"build/assets/NotFound-BVh3HWo8.js"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/assets/nova-VIEvmjEk.png"},{"revision":"57f4d9f01e07c66e0568b833ae65211b","url":"build/assets/OldSubscribe-BGITiRri.js"},{"revision":"76f8a2084ac5eba0c9a73b33c4797738","url":"build/assets/OrderDetail-CRz4-wjo.js"},{"revision":"c66092dde77a4684de5029d7b823c294","url":"build/assets/OrdersLists-C30kXieI.js"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/assets/other-BKBJqoNV.png"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/assets/pagination-DE0q59Ew.css"},{"revision":"57839af7f40d071c8e3ef5e3c9465f6d","url":"build/assets/pagination-DlAi67fK.js"},{"revision":"c1aaefe2ded36b2b6ad0d16339a7c400","url":"build/assets/PaymentDashboard-eYbeFnNP.js"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/assets/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/assets/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/assets/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/assets/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/assets/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/assets/PaymentIcon6-Dnmu-RS3.png"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/assets/PaymentSlider-VUyWc9KG.css"},{"revision":"905af427f640eac7790a12e48864ec6d","url":"build/assets/PaymentSlider-YgN4fBj5.js"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/assets/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/assets/plaid-C3YNig8l.jpg"},{"revision":"258b64ffa137dcfd2c2caa5131655df0","url":"build/assets/PlatformAnalytics-CNAx1jys.js"},{"revision":"768bc54c2fd339e7dfb64b691e952b13","url":"build/assets/Popup-B9yf9VmI.js"},{"revision":"9f8a400bc566862a86cead8ed3f0757e","url":"build/assets/Post-D_oFl0Ct.js"},{"revision":"97d0a092ca9b26a9f891528958947d18","url":"build/assets/PostLike-BBL54Vi6.js"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/assets/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"11b3aa1bfc53333a0b5c9f3789e58512","url":"build/assets/PriceFormat-DCYCwIWg.js"},{"revision":"7c4606ee74450acca1741237bc535fe9","url":"build/assets/PrimaryButton-BMrzsw_h.js"},{"revision":"8563f61642ab512cb48e269fc3d3f292","url":"build/assets/ProfileProduct-B4eonUd5.js"},{"revision":"a648127bc23a5230c652627fcdfd088a","url":"build/assets/ProfileProduct-B6xhlZGh.js"},{"revision":"c298a902d94f1e92850787b891c75679","url":"build/assets/ProfileProductLists-9zs81Spa.js"},{"revision":"4b5f77a8975c6e4615b3ef2167efc181","url":"build/assets/ProfileProductLists-DBcGrxUH.js"},{"revision":"231bf50a4ec2d982857ee83371baf3c2","url":"build/assets/ProfileSteps-wrFwroue.js"},{"revision":"f9fd3fe6de0255039682dae1f30c7163","url":"build/assets/ProgressBar-CMw4UWhF.js"},{"revision":"5faa60a5af08536c56039ae02653eed7","url":"build/assets/Promotions-CPI9J7nK.js"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/assets/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/assets/publish-CYFC99Bi.png"},{"revision":"1576a09eef9077063d12f253132c1174","url":"build/assets/react-select.esm-DiXiLR32.js"},{"revision":"76df1a33b8b5408b205990a044349539","url":"build/assets/RecentSupporters-DUGaB1Pv.js"},{"revision":"f28e4df89185d97a3a22099ef23f1fb9","url":"build/assets/Redirecting-iy6Ba39u.js"},{"revision":"c3236dcacbb30225a2e2a14924b4a81e","url":"build/assets/Register-CFgpBQD7.js"},{"revision":"1f0f309cdd10f8a883784f2cf58a4752","url":"build/assets/RemoveBill-V74k3Zzh.js"},{"revision":"a109b08fc5c5dc2ce7d0fcff303f47db","url":"build/assets/RemoveMembership-DRm2VYHq.js"},{"revision":"2d83cc2f60530938f0643930ec86a773","url":"build/assets/RemovePost-C_1UBzHU.js"},{"revision":"8b35c081f6971342b83641deb9f6232e","url":"build/assets/ResetPassword-B3-6QmMi.js"},{"revision":"6f85948b1e7ebf80dbb599461945c6f3","url":"build/assets/SafeTransition-B-uB4myA.js"},{"revision":"6c5f5bd00909e313e25dc1aa903b3c32","url":"build/assets/SayThanks-BPd_1ryO.js"},{"revision":"d04515f7564d776b0c9ee38d0ee1bd4d","url":"build/assets/SecondaryButton-BHb29Z0d.js"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/assets/seeksearch-CGztpZW3.png"},{"revision":"1709679befc5a115f6e3c05fae1982fc","url":"build/assets/SendTip-cXTd9uFt.js"},{"revision":"5c829d5b30dc32721f17ca018b5d04bd","url":"build/assets/setPrototypeOf-DiOlr_ig.js"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/assets/setuppaymentimg01-CIwjGd16.png"},{"revision":"c5f63c225676e284b4e695219f6a9a8b","url":"build/assets/ShareProfile-CR1nzLPF.js"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/assets/sharlinkimg-B-m5kVcL.png"},{"revision":"8dc2568cee119cf85e6d4c361d5cbadf","url":"build/assets/ShopPage-BL54ijKl.js"},{"revision":"f4663e5b7f244913290bd869b96d9707","url":"build/assets/ShopTracker-fHJGdeU2.js"},{"revision":"295e73b048fb341a4e7b87ca0a5426e1","url":"build/assets/siteicon-C45idYI1.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/assets/siteicon-CeHS7aEc.png"},{"revision":"4369a5a55a9528c1e91740dd72aea1d4","url":"build/assets/SiteSubscription-DKSPPZq6.js"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/assets/social-bg-DGdPbRTx.png"},{"revision":"e1876d3a5c22c95c1d46c0f9d430ce42","url":"build/assets/Social-DqUw-z9H.js"},{"revision":"b7c3c68f5d9cf7a658785b486e8b1028","url":"build/assets/SocialLinks-bPqSHOju.js"},{"revision":"12057bdb57602009beee3c5e91bdb477","url":"build/assets/sortable.esm-EwhZtEiO.js"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/assets/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/assets/ssl-DnZPu9aw.png"},{"revision":"c0f9832204b01af98f9280b68aec72a7","url":"build/assets/Stripe-CSTyM6Lm.js"},{"revision":"512ae5f922574f9c5d9ff531f8d4fb40","url":"build/assets/StripeIdentity-DnFkbqoS.js"},{"revision":"9ffb7d89c4efc496d1f49f8abd3d1133","url":"build/assets/SubCheckout-rGeFZtEY.js"},{"revision":"2064c403712b5c6361dfbad0a6816639","url":"build/assets/SubcriptionEarnings-B4Eehdin.js"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/assets/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/assets/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/assets/supportors-img-CQS8-frF.png"},{"revision":"cfe8f4f3fb8628beb05ea84aeb9ce3d7","url":"build/assets/Suspanded-CMrCMxH0.js"},{"revision":"cd6dcd63726edf08f48639c914706833","url":"build/assets/swiper-react-CRptGy16.js"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/assets/swiper-react-DV8PrLMj.css"},{"revision":"ef20bf52e2dec9eedc6b1d5d75523967","url":"build/assets/TabbedDashboard-B0VU3iNg.js"},{"revision":"3026add0c978ed7bc1719b12bdf7fee5","url":"build/assets/Tabs-vGeIdmvR.js"},{"revision":"114d09658e8d04dd6a5e6bd4b8419fdd","url":"build/assets/Terms-BtK7VRjW.js"},{"revision":"534e97804a52ce737ae6c4db8a2cea45","url":"build/assets/Test-BevmkzcG.js"},{"revision":"b0cab6eba4824df973c4d4a9a6d2cb7f","url":"build/assets/TextInput-MEzlcUiK.js"},{"revision":"a2118eb0d2c37008a80ed12d97899e95","url":"build/assets/TFA-CE49rr1j.js"},{"revision":"8bb3afba51aab20d052a97fc80591c15","url":"build/assets/Thankyou-2ZjcRLz2.js"},{"revision":"4a0a5d920cc0156acbb309d116f8401a","url":"build/assets/ThankyouMessages-BFagel2M.js"},{"revision":"3e502d5565643afaaf7624f4be50bf9f","url":"build/assets/ThankYouRye-_ruUQQro.js"},{"revision":"dc5cf937549ff8556ce3129e1cb0be64","url":"build/assets/ThemeProvider-BSesKsss.js"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/assets/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/assets/tiktok-COEdX1Uc.png"},{"revision":"46fd555a0f5807127e3b2cc6ce9d648e","url":"build/assets/TimeFormat-DHB2VnlB.js"},{"revision":"c6b647e5878642513f73249fe09da5bc","url":"build/assets/TipInner-M8OkXtni.js"},{"revision":"2a0f09db8aa9b8b4e199b7e3f3b5117a","url":"build/assets/Tiplisting-1zUkROnT.js"},{"revision":"fe8fe046bdcac11e70d938e837bd6de4","url":"build/assets/TipTracker-Cr_stXEN.js"},{"revision":"d2383b2ec8763d9c2fc799152a161517","url":"build/assets/TopEarnBills-hmrA4gxZ.js"},{"revision":"f6679dd2c6d469db81852cb1e4c04ff0","url":"build/assets/TopEarnWishes-DA3kZnHx.js"},{"revision":"1b44e4e1b3b6e36ce842f00a145a9829","url":"build/assets/TopSupporters-B4zA74qO.js"},{"revision":"b2e7fdace06b9bc81011b6b7d7a4f758","url":"build/assets/TopSupporters-CTclIEgs.js"},{"revision":"9fff1b2b7ed01a46a3c2d0008359904d","url":"build/assets/TransitionWrapper-DEPNitPC.js"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/assets/trust-hK0IhoQZ.png"},{"revision":"26efaebfcdd6223cfab2e36443676c30","url":"build/assets/TrustBox-CobwJqcX.js"},{"revision":"72cc9d65b795deea6d3b7f0bee6eafff","url":"build/assets/TweetNow-BHELcE0h.js"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/assets/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/assets/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/assets/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/assets/uniqlo-Bxf7nI5n.png"},{"revision":"ec7c9e81346543ed100c09c6778540c9","url":"build/assets/UpdateAvatar-C7cE1jSu.js"},{"revision":"f69afda0954352ac2c1d5f640c73cdf1","url":"build/assets/UpdatePasswordForm-CONbGHYH.js"},{"revision":"df51587435c42ef5d2a30f67b54595c7","url":"build/assets/UpdateProfileInformationForm-rafy74M-.js"},{"revision":"b9a4fa59dbca3636bdce6b63943f77e8","url":"build/assets/UpgradeStripeAccount-DT_e-P-X.js"},{"revision":"48e51fbd40d09416be5f7d7a46012882","url":"build/assets/UploadcareEditor-I0c9Twce.js"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/assets/uploadedimg-BhEeut8S.png"},{"revision":"c014a54ac507234cc3d6c506d8119cb0","url":"build/assets/uploadedimg-iAQ9Y4ys.js"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/assets/uploader-BQYCdP4p.css"},{"revision":"952b309b0d2d6ef29ea94a8aed825ddd","url":"build/assets/uploader.module-BghOPxaM.js"},{"revision":"dc469e90e7272d2da3b8f6cbdf17d207","url":"build/assets/useDispatch-fBSlicEc.js"},{"revision":"72a46622b1103c47ed3b52db74160df8","url":"build/assets/useEventCallback-C54aVgww.js"},{"revision":"4492f884ccdff6c10b560a683cb99076","url":"build/assets/useMergedRefs-BQWLCWdn.js"},{"revision":"4c7488454a90636ad1ff3c49d0529652","url":"build/assets/UserCarts-CDjuMaY1.js"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/assets/userphoto-2kQnKrr1.png"},{"revision":"584aa45ad61eb710827d086954f16744","url":"build/assets/Userprofile-Dzl-Iii_.js"},{"revision":"114d09658e8d04dd6a5e6bd4b8419fdd","url":"build/assets/USTERMS-BytCEYJ7.js"},{"revision":"f721dfbf72e8780007f25795b79874f6","url":"build/assets/VerifyEmail-BegaMrG7.js"},{"revision":"5bed454825ffb154340fe2293a72b996","url":"build/assets/VersionUpdate-UUKWAEi3.js"},{"revision":"9e1cb591548a028a26091f68b970fc01","url":"build/assets/VipSupporters-860VnWcS.js"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/assets/vishitimg01-ClMBzIW7.png"},{"revision":"ea8499f7d0ecba692ed0ec401b763804","url":"build/assets/warning-BZhFqSnN.js"},{"revision":"31f7b823d92a936a98b8f45afbaa6c67","url":"build/assets/Welcome-B93-4b94.js"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/assets/Welcome-DvB2Xm2x.css"},{"revision":"cb0741dd7de893feda4cb30796147d79","url":"build/assets/WhyLove-Bu9GKmVQ.js"},{"revision":"665a7b2138c28c9a033e3d91248cd492","url":"build/assets/Wishlist-CNXQe-wW.js"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/assets/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"1d50a5537d7282e36fc843ec7d60d108","url":"build/assets/wishlistbannerimg-DU_hurLo.js"},{"revision":"3cb502a045d54c9ee1875b1eefe7fc2e","url":"build/assets/Wishlistbox-I5SBti7N.js"},{"revision":"fe3b92920e24f2a52c1dce7a6bfe48c4","url":"build/assets/Wishtracker-dPGUe6Mk.js"},{"revision":"ac93db2c535d9e57165b6849ce8dd036","url":"build/assets/Works-BydxENxa.js"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/assets/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/assets/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/assets/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/assets/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/assets/youtube-DDw5LQj8.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
