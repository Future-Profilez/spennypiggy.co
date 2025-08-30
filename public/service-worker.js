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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"4a74023cc30d6e1477565cd9434e461f","url":"build/assets/Accordion-ClowAb36.js"},{"revision":"77baa05d50ce85d3ea2b50e306df6a40","url":"build/assets/Accountsetting-BR1LqCmi.js"},{"revision":"91b12a489a4eff837831bb4472cc2ca7","url":"build/assets/AchievementSystem-CqRowb33.js"},{"revision":"1b71e3f042fbc5b74d533cfef173b7ff","url":"build/assets/ActionRequired-B1epjHvs.js"},{"revision":"f94b62292f4cc5fc03cabfdaece3d329","url":"build/assets/ActivateCard-Cqp-Q1Pm.js"},{"revision":"6e1c31cf5029a1eca2c0a040cc9551a5","url":"build/assets/ActivateSubscription-L2tYqMJK.js"},{"revision":"525f3630935728fc5272758b21a060de","url":"build/assets/AddBills-Dh_MFQPd.js"},{"revision":"a484f94a928c2ecd29849462269af530","url":"build/assets/AddCart-CinDrGhW.js"},{"revision":"5e25209d698154a092f7d6468bf84037","url":"build/assets/AddComment-DV0GgptC.js"},{"revision":"d72f7a35ed214ad92c5b2a9900e31a68","url":"build/assets/AddGift-CyjlU_4U.js"},{"revision":"35e241c7d6244953a8c096ddbbeb78bd","url":"build/assets/AddGoal-BT8miUME.js"},{"revision":"126fc203dc615f5e5807e683a9edaca7","url":"build/assets/AddIntro-CJUujEFH.js"},{"revision":"e4ece79269f1f7091d5e07966c3ef11e","url":"build/assets/AddItem-BEP5MBuM.js"},{"revision":"abbbe4d198fce893f09aa7de5e1a27e3","url":"build/assets/AddMembership-3-eUkz7b.js"},{"revision":"8d2fbe9f5a4854f35b1e58914855978f","url":"build/assets/AddPost-Bino3yEk.js"},{"revision":"8cc1c8f06391429551e368350d50666f","url":"build/assets/AddressForm-BhZVYBgc.js"},{"revision":"a1714449fa6e436d8fbd5d1126e46f76","url":"build/assets/AddRyeProduct-D6SoL5mN.js"},{"revision":"c3321e191ecde41a7777d11b6f41280c","url":"build/assets/AddShop-DHTuvcN5.js"},{"revision":"055fc31b775c030aeb190f7ad8d1ab9b","url":"build/assets/Alerts-CAxy2wU_.js"},{"revision":"fe251ef03ae50aad2d92008e8642338d","url":"build/assets/AllCountries-Bi36VVhK.js"},{"revision":"baa874b49fbd0361b57e47ac9264c340","url":"build/assets/AllWishes-Cgtr3lS-.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/assets/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/assets/amazon-Cd4bGo_L.png"},{"revision":"105f6a91904d74ddb5d3849643b01b54","url":"build/assets/app-BcbVOAss.css"},{"revision":"684b5eedaa62ecf0a53ac208c77050a8","url":"build/assets/app-CaTSbFag.js"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/assets/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/assets/asos-CIGR1i9R.png"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/assets/assertThisInitialized-Ctu0bbrq.js"},{"revision":"c205c8740c50ac2012d04924a919fe8c","url":"build/assets/AuthenticatedLayout-klHRYVvK.js"},{"revision":"7953ba11f7da3c374e6712e9b7c0a524","url":"build/assets/Avatar-C52L1MzW.js"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/assets/beauty-DCFqJTVd.png"},{"revision":"c5bc265b3b2af1030461a5e936dde626","url":"build/assets/Bill-CYNgA_el.js"},{"revision":"3e4811be8513af9850d311f877262e37","url":"build/assets/BillCheckout-Zlb-muZu.js"},{"revision":"01269e78e5ec932ae77bcbb47ced3b61","url":"build/assets/Billslist-DOizBi6t.js"},{"revision":"de4cbb5bee3daa9a62fe53096cb5f046","url":"build/assets/BillsTracker-DaxBFcGZ.js"},{"revision":"aba574fd86712d094aba2d491a85a824","url":"build/assets/Board-B5y69tAc.js"},{"revision":"68232cb48269fdc9a60c78e396502815","url":"build/assets/BottomBar-CjeQU8CT.js"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/assets/british-flag-BcogJXZ-.png"},{"revision":"08f40531ad87ff2eb25fe5243f194fa6","url":"build/assets/BuyShopItem-OgG9r0iL.js"},{"revision":"6f8cf5214fa38d96e32bbf3c822d9b4e","url":"build/assets/Cart-Z2lzHvDp.js"},{"revision":"883328c2e442cf30013fb296722b9263","url":"build/assets/CartItem-DEnncmZT.js"},{"revision":"4540ad9b01eb4f511ec25441beecd042","url":"build/assets/CartItems-CdZadcUj.js"},{"revision":"206454fa0e2aee6563d3ab5f261ac8e8","url":"build/assets/CartListing-DKMc50Sq.js"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/assets/cartproductimg-C1koo3C8.png"},{"revision":"050b9c954fd6f9ea1370fae798fbde19","url":"build/assets/cartproductimg-IopLElGc.js"},{"revision":"d8a269429afddd845bb5dab12c43cd7f","url":"build/assets/CategoryLeaders-CzMKGkzK.js"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"bc95825ccbefa128cde544e57fbc0ad7","url":"build/assets/ChangeCurrency-B5I2Q_bX.js"},{"revision":"8ea850ab3b58ced9a16841aad6a1b013","url":"build/assets/ChangeVat-DmASTJNh.js"},{"revision":"d8f813858eb80b319d8b8d83bc6178f0","url":"build/assets/ChartDashboard-BmwC7Rt-.js"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/assets/closeblacksm-DrNnW4fj.png"},{"revision":"8b36bf52287b506e578867c0968db0c2","url":"build/assets/Collapse-GhvtlLz9.js"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/assets/comingnext-jAz-GIeT.png"},{"revision":"c745d009f2daace520ac62e9e9314bf1","url":"build/assets/ComingNext-ULj8v769.js"},{"revision":"1e97afb83367ac22bf919f264595aa62","url":"build/assets/Comment-DO6N0OvM.js"},{"revision":"d44f36edc7e5f224ba13b9dc32910809","url":"build/assets/CommetsLists-DkJbeQ3E.js"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/assets/commingsoon-eOjyCKzm.png"},{"revision":"4071e4098aeed58f75a79e665e15a9f6","url":"build/assets/ConfirmPassword-D3mbH0sa.js"},{"revision":"4f6966af636be95e354c1f161999df4e","url":"build/assets/Countries-ByOSgTR-.js"},{"revision":"ec0bf0820b6e218229c35164c1032115","url":"build/assets/CountriesShipping-DBsGTZN5.js"},{"revision":"cab9997273b848c888a5de7a3bfb5bd0","url":"build/assets/CreatorVerification-BnsJFwGX.js"},{"revision":"961bee7fa90ed0cf302ca8cee5028b27","url":"build/assets/CreatorVerificationNew-Bt6gU97n.js"},{"revision":"6be17fb2dfb176a804ea8f8be855ce45","url":"build/assets/Dashboard-Cj6UNmlp.js"},{"revision":"3530e7a22898b01064d4d0a6e7b2f41f","url":"build/assets/DataKey-3fBJBbmc.js"},{"revision":"d8104f880aeea06ba29fabeb35bad05c","url":"build/assets/DeleteStripeAccount-BOiw8Hal.js"},{"revision":"b69d150d3fb273e790cfa5f7168a770a","url":"build/assets/DeleteUserForm-CmjkKyGy.js"},{"revision":"a8eb94d263e0a3aba2d0cacc0a2a5620","url":"build/assets/DiagnosticPage-4yEDbQhG.js"},{"revision":"1d2ee24311161270bf2204a3c6934f66","url":"build/assets/Discover-CjwLuSe0.js"},{"revision":"e379bc899e41b74be9fff2c75f6814dd","url":"build/assets/Dropdown-Cy4dLFsQ.js"},{"revision":"a0c30f52781bd0e77ae97d21c5de2a4d","url":"build/assets/DropdownButton-CK4FXPSe.js"},{"revision":"36c0982156e5865579a7f1b496645193","url":"build/assets/Earnings-Buk3fT0n.js"},{"revision":"5caf1320e15f23fc8896ac00a63d1161","url":"build/assets/Edit-BaPnHcUF.js"},{"revision":"82a7a01c995ffc23df06a6076737f8cd","url":"build/assets/EditCategories-chYXrK3a.js"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/assets/editicon-errcM8K5.png"},{"revision":"96d6c5b86d1b8f35a499dac07cfab578","url":"build/assets/EditMembership-BcJGIkFP.js"},{"revision":"3794ecbaabf4d82ed37ab1f4a77d0990","url":"build/assets/EditProfile-ZFXJbIjA.js"},{"revision":"d5999acc254771d89b9379d3a4a5c165","url":"build/assets/ElementChildren-D8677wJ0.js"},{"revision":"e0d3dbf040eada6c6aac4ed49e7ea65f","url":"build/assets/EnableCardCapabilities-Bht8LtCI.js"},{"revision":"5e555470df32498fe3e015ddb08af4e9","url":"build/assets/EnterOTP-BXjBOkM6.js"},{"revision":"b61bb8aee5b0f3197f847c5727a3907b","url":"build/assets/ErrorPage-CGNTkhcf.js"},{"revision":"9cbe6bcdf0e0dab23c8878fd414d116a","url":"build/assets/extends-CnzoikGv.js"},{"revision":"f9df9eee8b57c676a64b8b3430e1e47b","url":"build/assets/Fade-CmylXSWB.js"},{"revision":"2fb4ddfcfb3fa979bd1cfe42b94af829","url":"build/assets/FAQ-Bf7Jfeu7.js"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/assets/faqhand-BXWGoK2R.png"},{"revision":"bde472aa95f7ff399f02085768ad3e98","url":"build/assets/FeedList-C6GNxX83.js"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/assets/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/assets/flag-european-BCCzeLKH.png"},{"revision":"305e62ec194ee936826ed02fafed4203","url":"build/assets/floating-ui.dom-Cytwwgwi.js"},{"revision":"885163e01b4fd40564278080587ff3e9","url":"build/assets/FollowButton-BaFuTP8E.js"},{"revision":"079f708b17a55ecc77abf8a0518a1bbb","url":"build/assets/Footer-D_le9_Rj.js"},{"revision":"63cd73b31a8f662be2b9e578948b6c22","url":"build/assets/ForCreators-mHXZegVp.js"},{"revision":"d7384465af181093a87807c5fa9a5964","url":"build/assets/ForgotPassword-DWnROyD6.js"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/assets/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/assets/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/assets/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/assets/fundbasketimg01-DNZiLLCY.png"},{"revision":"f15de35580862a477ad32238c7efbf40","url":"build/assets/FunPart-DLR2O5_8.js"},{"revision":"3bd173e0a4bfadca7c0c55f62e5962aa","url":"build/assets/GetCart-DniZkNq7.js"},{"revision":"7897d02899d214a5cf8c7be1854282b3","url":"build/assets/GiftAddCart-BBwisqiU.js"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/assets/giftbasketimg01-UPFBeLeW.png"},{"revision":"17ce95bfa9380bbdf042368dd7101104","url":"build/assets/GiftEdit-CZu7d4GV.js"},{"revision":"5fdca48c8f046e666760fb075c937edb","url":"build/assets/Gifter-_yErMt4_.js"},{"revision":"b299f8b4a071ef304237e480b7bbee7c","url":"build/assets/GifterCardVerification-Bh-OQmFs.js"},{"revision":"1c81854d33cc4855f8df39cad60510de","url":"build/assets/GifterFeed-t33PG5N0.js"},{"revision":"b77343df7427b60c8d4607526a299cad","url":"build/assets/GifterItems-UQQ9IMzA.js"},{"revision":"7b06d3b525938b31c0bf4009921dc245","url":"build/assets/GifterMedia-Df1hJeAq.js"},{"revision":"30cb1c53c4c97f3534a0f3b5f1ee3940","url":"build/assets/GifterMembership-4IM8fYqL.js"},{"revision":"ff61580dad712c61fad1e8c277bc2588","url":"build/assets/GifterSubscriptions-I4OjWWom.js"},{"revision":"5768f2435f518c067bbc0c7081ecb6a0","url":"build/assets/GifterTips-Bd3fC17q.js"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/assets/giftimg-CbenuWDF.jpg"},{"revision":"de8159de1d25a286972d0857ce80e079","url":"build/assets/GiftListing-CmNtfPZR.js"},{"revision":"3158ffba71406a583c8239de242b5eed","url":"build/assets/GiftStore-Dpyc63yA.js"},{"revision":"9bbc8b73e2d5259748c1aab685b3a525","url":"build/assets/GlobalCheckout-SUXMZVk1.js"},{"revision":"e7bf18e018721d9caadbb45971f12fff","url":"build/assets/GrowthTrends-BFXPl6W_.js"},{"revision":"30a3bcd4982e9e80a581de8c6582cfc9","url":"build/assets/GuestLayout-Bet9GsYR.js"},{"revision":"b2e6d11da72177fdf2712f44ce42e838","url":"build/assets/HappyCreators-C312-5mv.js"},{"revision":"a6661f9a2d0e8f6a294a7a47ca7bef14","url":"build/assets/Header-CTFvceAC.js"},{"revision":"e6d8169ac6e9b0c7dee974b7a2679c14","url":"build/assets/Hero-ClY4ZtBH.js"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/assets/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/assets/HeroBg-CgSE7w-A.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/assets/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/assets/HeroBg-mobile-C7A97uu3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/assets/HeroWishlist-BvpIkzQT.png"},{"revision":"3257af4dd7cc89d64fdde49a850125e8","url":"build/assets/hook-bC6Y0YUR.js"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/assets/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/assets/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/assets/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/assets/huel-DnOlOTCl.png"},{"revision":"0d72f407fd0038d0611b1ee6cc0a0bc0","url":"build/assets/iconBase-BEIdslz5.js"},{"revision":"bd8051e4ae7b65c6a81af508eb423479","url":"build/assets/Icons-BVlJAO_V.js"},{"revision":"1b4fc486f50c0a7b8d1ca5557f6836ed","url":"build/assets/ImageGenerationWithAI-1yCn-OdH.js"},{"revision":"f927ecf3c8db3949a91d52c4e5ea17a6","url":"build/assets/index-63O0I0Wg.js"},{"revision":"0441156f272e40ee862c11ffdc53e122","url":"build/assets/index-B8RG-F3Y.js"},{"revision":"dad202afb7d41e50fcc8c2d51b5f2f23","url":"build/assets/index-C9AZ8v5M.js"},{"revision":"2d72d2302e688098186b2c347ae60555","url":"build/assets/index-CCY6hxUe.js"},{"revision":"a7770bc8c976c6218da2ec68e386537a","url":"build/assets/index-ChwwmJvt.js"},{"revision":"38b4c0455625b225d7fa687d2c10b1b7","url":"build/assets/index-Cq8EoWtD.js"},{"revision":"218f4472ce1302c97554b74c998c06c4","url":"build/assets/index-CyJp3WS4.js"},{"revision":"6ce4eaa816e974d40e3b9e76d96b6882","url":"build/assets/index-D5UihREM.js"},{"revision":"6d3914676eaf1d9a90a967e2fb5248e8","url":"build/assets/index-D7Z0QR7y.js"},{"revision":"c5b820088a9b3ee22700df1e365bb617","url":"build/assets/index-DA5e0c8Z.js"},{"revision":"cb8a51d188cb01b79c11bfde649aba6a","url":"build/assets/index-DbyDoivC.js"},{"revision":"98298d9d0474a7e8ee1c64203ac6a424","url":"build/assets/index-Dfcwb3GZ.js"},{"revision":"9914f2132b3337e3cedd66cec97577d0","url":"build/assets/index-dnbcuTab.js"},{"revision":"e524c986139990ed7103722803450b9e","url":"build/assets/index-Dqn_1dkP.js"},{"revision":"c039d62d97618e8905922e8196707d41","url":"build/assets/index-DSdAervY.js"},{"revision":"34600158f579ce4c65a48da1c0a14d49","url":"build/assets/index-h0YyK4fB.js"},{"revision":"2c2c467b7f25ea70f3bc698c4939cd07","url":"build/assets/index-NJ6xJT3h.js"},{"revision":"b29fa4e530cde53edd6b051f58f84dd2","url":"build/assets/inheritsLoose-3PWo7i2t.js"},{"revision":"02eeca49bd61826ed475614d30f3a34e","url":"build/assets/InputError-CnIcrIvO.js"},{"revision":"bf90ba8cb5f6501626eac5cc0d6334ed","url":"build/assets/InputLabel-C_SHsC51.js"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/assets/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/assets/instagram-DvC8l1Gh.png"},{"revision":"02c9e903adad888170fac3f850aa8301","url":"build/assets/IntrosVideos-Dq-a2e0n.js"},{"revision":"a2c2aa757dcd23a80f39111d8a951ed7","url":"build/assets/Item-BdNRTXFN.js"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/assets/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/assets/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/assets/joinBottomImage-BPCsUTyF.png"},{"revision":"ee6421c628f17c9cbf34ddbc0c9e2e8b","url":"build/assets/JoinUs-2mWktOUc.js"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/assets/kylie-BcKwDcm6.png"},{"revision":"94871ee930a17eb928bbb5c9cfdbf210","url":"build/assets/LeaderboardStars-BZ1S8XcQ.js"},{"revision":"989b86d793f0ed60c42ce19b059be3aa","url":"build/assets/LineChart-_jNmObDq.js"},{"revision":"0e31921a573b32c0f39bf322ef126349","url":"build/assets/LinkTwitter-prorCxIP.js"},{"revision":"eebc613e6512d466c2d733d50bd60126","url":"build/assets/Lists-cxfcxJbS.js"},{"revision":"ed049c787c74ffa7f83deebdfcb1b849","url":"build/assets/LiveBar-B6c96OLk.js"},{"revision":"19c30daeea26400c2aa35ebcee27b15e","url":"build/assets/LiveBarSection-DqqPiRLa.js"},{"revision":"023a8b1bf40554bca916d31c839150ef","url":"build/assets/LoaderButton-CVgiK5Fy.js"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/assets/loading-DKd4CxP-.gif"},{"revision":"a62202414001eb5e39c5cf392c065efe","url":"build/assets/LoadingScreen-xHADSOKc.js"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/assets/lockprofile-BXHexqRM.png"},{"revision":"c8be969fe3b860106600ef73d2a7e02c","url":"build/assets/Login-Bf4WkQ6c.js"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/assets/logo-BfA3DShe.png"},{"revision":"af6baaab72b428f97e9add96d3cd03c4","url":"build/assets/logo-YD7rJ-Ac.js"},{"revision":"88c1bbc17055e2e5913bea511741d327","url":"build/assets/MagicBellNotification-DozD_Pon.js"},{"revision":"d60edc83554b480ede7208ca7c00b067","url":"build/assets/MagicBellNotificationDisabled-B9hkaHWS.js"},{"revision":"6d4ce75f9fbfc7f0058e086a095cf57f","url":"build/assets/MemberCheckout-1GL3E4QK.js"},{"revision":"89e1495c30bc6f97b3885a8f926ce2e8","url":"build/assets/Membership_dashboard-CkDlnwYl.js"},{"revision":"5ac004f4e45f030544a0ed70371693b6","url":"build/assets/Membership-BiPdPlAl.js"},{"revision":"162585fc0285e7cf1e21e75291ebfd48","url":"build/assets/Membership-Bm2CHZ_u.js"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/assets/membership-img-D47G_pA3.png"},{"revision":"5748af5ea57e477a8df2463efaa4b2cd","url":"build/assets/MembershipLists-fBQ0zJwU.js"},{"revision":"677622839eafbb4072c20eeb051342be","url":"build/assets/MembershipsLists-DRY-Ohn6.js"},{"revision":"d48bead162b1b72687ad80faedefe864","url":"build/assets/MembershipTracker-C9KJGKZi.js"},{"revision":"e080c320fff8b598aab967d47bb1cb33","url":"build/assets/MonthlyRevenue-mqm4IKSh.js"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/assets/mouse-DINZi5et.png"},{"revision":"b5a8ed6993c8a6485efd9887f537a90b","url":"build/assets/MyGoal-CeOqI6EM.js"},{"revision":"87013138b11a0c7373c7cd55297cd3c9","url":"build/assets/MyShopProducts-CV2Xc4UV.js"},{"revision":"5a9934dcfc97750efcef11612271ea78","url":"build/assets/NavbarContext-BiHMsqyI.js"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/assets/navigation-CteQybwo.css"},{"revision":"cb41768308a8e92cedfad57d53b8a0c2","url":"build/assets/navigation-DoWXAJAh.js"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/assets/nike-DLThTltp.png"},{"revision":"3c185b6e72a50754437e8eda0a0f119c","url":"build/assets/Nocontent-QXCYqqJg.js"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/assets/noresultimg-CnfMO9_z.png"},{"revision":"5015f8ac3dd8a0f170dbe2ab65297f2e","url":"build/assets/noresultimg-FARQaBoV.js"},{"revision":"66454a727b9ced9ffea05b1891b8c34d","url":"build/assets/NotForBusiness-byTlUs1c.js"},{"revision":"8a075c2c57035a4463d1c3ebb8f0b1ee","url":"build/assets/NotFound-ZhvPMiqF.js"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/assets/nova-VIEvmjEk.png"},{"revision":"e9735af7b6090a788e630a8bb7203f7a","url":"build/assets/OldSubscribe-DD28Qdhu.js"},{"revision":"8c4eca08f4c9e9a5b745156477750eb7","url":"build/assets/OrderDetail-BsFa0rb3.js"},{"revision":"2faf9fb64dea32b5e305a8e35d65ba61","url":"build/assets/OrdersLists-DurXMs2X.js"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/assets/other-BKBJqoNV.png"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/assets/pagination-DE0q59Ew.css"},{"revision":"2b9ac38b8099376b85b9ca3855346b37","url":"build/assets/pagination-ijrVM4Xa.js"},{"revision":"8eb6c78ce1fe9d343083bdab2f2ae2f6","url":"build/assets/PaymentDashboard-DmStvoL7.js"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/assets/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/assets/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/assets/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/assets/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/assets/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/assets/PaymentIcon6-Dnmu-RS3.png"},{"revision":"974d09e90281083ea1a6be1a90469a5d","url":"build/assets/PaymentSlider-B9SUeZVs.js"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/assets/PaymentSlider-VUyWc9KG.css"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/assets/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/assets/plaid-C3YNig8l.jpg"},{"revision":"d0e0412aa1c3963b5def1550115b0b37","url":"build/assets/PlatformAnalytics-9omyZgQR.js"},{"revision":"3981924da902e48439843ec6f3f6d1d4","url":"build/assets/Popup-S5Kr5s0A.js"},{"revision":"8e7c154205c88b92bd9b165081bca949","url":"build/assets/Post-CmGv9EGg.js"},{"revision":"e04db931d54fa17a655759cbd1d8fa5a","url":"build/assets/PostLike-D4vpaVjp.js"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/assets/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"c4682fa27516e899df21273d9545c79d","url":"build/assets/PriceFormat-BVL7NufX.js"},{"revision":"60cd0f06fd785baa063be46df6081756","url":"build/assets/PrimaryButton-KWdwiGfI.js"},{"revision":"c93a6e5fa11b76574eef2a93e0e031aa","url":"build/assets/ProfileProduct-DFq53GsO.js"},{"revision":"f724805b912c77b9f67be8ffc3b2253f","url":"build/assets/ProfileProduct-DXUvhNwp.js"},{"revision":"46e05196cacca80ba74879af61205446","url":"build/assets/ProfileProductLists-C21ozC7J.js"},{"revision":"ae4161b8146898a1d3285d8c5a8c798b","url":"build/assets/ProfileProductLists-DaPYm23f.js"},{"revision":"2e8f58b3ea47cfe625bb30b6421b29d1","url":"build/assets/ProfileSteps-tLGbh8Gs.js"},{"revision":"abf933aca3b5eea70f308c3cba45f8d0","url":"build/assets/ProgressBar-D_pckDyw.js"},{"revision":"367423098b1e68a537b915a007cabe19","url":"build/assets/Promotions-DK_CNQrm.js"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/assets/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/assets/publish-CYFC99Bi.png"},{"revision":"0637baef7281369aab86da1982f6f480","url":"build/assets/react-select.esm-hJi7kuYl.js"},{"revision":"8e799f5d51b8737e3dc35e907eb0aaf5","url":"build/assets/RecentSupporters-CuULhenq.js"},{"revision":"6ac59719a54694472adf609dac40c3ed","url":"build/assets/Redirecting-CC6EIuzS.js"},{"revision":"36a5e35144aaec04142f4680d42f0220","url":"build/assets/Register-BZEQ6ETA.js"},{"revision":"956071685aded297707add28d83758c8","url":"build/assets/RemoveBill-D-5f2SaZ.js"},{"revision":"a9a0f93b7383b1cbb537feb7ce6ecd43","url":"build/assets/RemoveMembership-CMn44ebp.js"},{"revision":"b3409445be4ca297229e86af700a4548","url":"build/assets/RemovePost-BmsO4ll6.js"},{"revision":"0807df07e817e619b3437912cc049dfd","url":"build/assets/ResetPassword-D_yPpB0I.js"},{"revision":"d743b024c1c3620e0d2d8dd1228f2da8","url":"build/assets/SafeTransition-Csy0U7pS.js"},{"revision":"f0f1127ea277f8bbb7e94be3c986999a","url":"build/assets/SayThanks-CMSUsqdT.js"},{"revision":"e673844ed5eaa5731ef7951bdc1618b0","url":"build/assets/SecondaryButton-bCdeD25s.js"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/assets/seeksearch-CGztpZW3.png"},{"revision":"9aee444fc8a7294cc9226eb686d33e0d","url":"build/assets/SendTip-Ch2c2g0r.js"},{"revision":"5c829d5b30dc32721f17ca018b5d04bd","url":"build/assets/setPrototypeOf-DiOlr_ig.js"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/assets/setuppaymentimg01-CIwjGd16.png"},{"revision":"8d5ab24cafda5b9574fa74a6b1debd00","url":"build/assets/ShareProfile-mLqg68_h.js"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/assets/sharlinkimg-B-m5kVcL.png"},{"revision":"c8f51abe986b3d3cd595ad0eb15680e6","url":"build/assets/ShopPage-B3zEv8uX.js"},{"revision":"e1f3b19a89220f2dac369c108c1c23de","url":"build/assets/ShopTracker-DjUNoVAI.js"},{"revision":"295e73b048fb341a4e7b87ca0a5426e1","url":"build/assets/siteicon-C45idYI1.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/assets/siteicon-CeHS7aEc.png"},{"revision":"3830552c9796baec4d7f8147e6913bc3","url":"build/assets/SiteSubscription-DvPIbuqG.js"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/assets/social-bg-DGdPbRTx.png"},{"revision":"91215d77d9b52c9b64d03b708c85a7b7","url":"build/assets/Social-C6t4q53b.js"},{"revision":"2b84fe4f4a5aba8b561a1c78d9f59daa","url":"build/assets/SocialLinks-DBx80Qys.js"},{"revision":"de14f525bc35b3a20d6ada96c22c67c9","url":"build/assets/sortable.esm-CLqgZ2x5.js"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/assets/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/assets/ssl-DnZPu9aw.png"},{"revision":"b5d328eba02dd21938988ed30a9459fb","url":"build/assets/Stripe-HiCX2Lbc.js"},{"revision":"ea40e2e65cde6de2bb4e6a4cb456d5ee","url":"build/assets/StripeIdentity-BMH1RWNG.js"},{"revision":"a2ccfa305b13bba86ac8fc956cabae32","url":"build/assets/SubCheckout-BDJGV07N.js"},{"revision":"902ecbe48193540f61d697722fc86559","url":"build/assets/SubcriptionEarnings-Di1xsvOv.js"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/assets/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/assets/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/assets/supportors-img-CQS8-frF.png"},{"revision":"7cfea90b068ef8e95fcbed853ba6256f","url":"build/assets/Suspanded-2Lc1t23u.js"},{"revision":"2b197cf50b07199c0cdd61646ca9c282","url":"build/assets/swiper-react-8zVoodtL.js"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/assets/swiper-react-DV8PrLMj.css"},{"revision":"706a70c33638ef0f27dfbb9936acf5d9","url":"build/assets/TabbedDashboard-Bo1wSC6t.js"},{"revision":"7f0dc9d259fd97fc2cda4efc497a03cf","url":"build/assets/Tabs-DorNKTAV.js"},{"revision":"b6f6cccfd7030aa290d83961b1327544","url":"build/assets/Terms-BdPXUvvR.js"},{"revision":"223852663500fed987ba8a6008d19344","url":"build/assets/Test-BHXZjTDY.js"},{"revision":"32a12eb2ab97e62d8bc4da60a293856c","url":"build/assets/TextInput-DnPBff8U.js"},{"revision":"8940b4414a4d1a9024d1e2b8f2641992","url":"build/assets/TFA-gK1JkWbX.js"},{"revision":"df2a43cafe2b1e91e87f9a755cea9859","url":"build/assets/Thankyou-B4NS29mx.js"},{"revision":"39506fbd579a469ba91c35cd7d2dbffc","url":"build/assets/ThankyouMessages-Dp7JKyKm.js"},{"revision":"4bbf7eddeea56ecaec0e67db776c39a6","url":"build/assets/ThankYouRye-AndmGngP.js"},{"revision":"4ba03bd1e879d5c48cc729ad15366dba","url":"build/assets/ThemeProvider-BjnGuccY.js"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/assets/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/assets/tiktok-COEdX1Uc.png"},{"revision":"ddd0f30d5292098d793e88bd08262dc2","url":"build/assets/TimeFormat-Cs511_sS.js"},{"revision":"8310adb2fa98bb2b1c18163905240f9a","url":"build/assets/TipInner-Bk_C3T-z.js"},{"revision":"df73ea141c7ea42060bd036e0b4fc5fd","url":"build/assets/Tiplisting-C-1aSjU9.js"},{"revision":"37ac054fb68be05bfe485dcfcd532e45","url":"build/assets/TipTracker-Dxygc8LM.js"},{"revision":"52faccbd9f6c4281a6d337d6f64107aa","url":"build/assets/TopEarnBills-BzEKVPFG.js"},{"revision":"cf030c716007b93aeab0e3ebd084d7f9","url":"build/assets/TopEarnWishes-BPiit4t7.js"},{"revision":"d114a3a5cdbc1f39e6ea4974ea8f3f3c","url":"build/assets/TopSupporters-CWN4Dob_.js"},{"revision":"6b4d5572506eeaff39f730d3b52a427a","url":"build/assets/TopSupporters-DJWzBDo3.js"},{"revision":"967e517eb93352e15f71292e7f93c52a","url":"build/assets/TransitionWrapper-D6-7AIc1.js"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/assets/trust-hK0IhoQZ.png"},{"revision":"7b3526a95fba5697aec4b234d3db9d6f","url":"build/assets/TrustBox-DJPjTI1p.js"},{"revision":"47d4503001df3bcaf79671522444c367","url":"build/assets/TweetNow-FdnYtHRJ.js"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/assets/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/assets/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/assets/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/assets/uniqlo-Bxf7nI5n.png"},{"revision":"96d57fe99d1cb146812c153607f068a9","url":"build/assets/UpdateAvatar-B6BGW3PG.js"},{"revision":"38e0c44e73d964f7fde2774483a85a0e","url":"build/assets/UpdatePasswordForm-_Kmazllj.js"},{"revision":"7a1b32c099f5cb577ab607fce15b4179","url":"build/assets/UpdateProfileInformationForm-BmEaoaQ0.js"},{"revision":"79fcba0a08a09a1a9e6504ebca184c0c","url":"build/assets/UpgradeStripeAccount-CH0WTquu.js"},{"revision":"ee80f249947f7681baab7a4cf60cce84","url":"build/assets/UploadcareEditor-Kyy5f48Y.js"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/assets/uploadedimg-BhEeut8S.png"},{"revision":"c014a54ac507234cc3d6c506d8119cb0","url":"build/assets/uploadedimg-iAQ9Y4ys.js"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/assets/uploader-BQYCdP4p.css"},{"revision":"9b04b4f389e96b45bc707fe72e2fe629","url":"build/assets/uploader.module-C0vcc7fy.js"},{"revision":"b26addc68dc26a725b3cd08e572edbf1","url":"build/assets/useDispatch-D4sOxudb.js"},{"revision":"45a2f414cee32d5bbbcde52da6f6df05","url":"build/assets/useEventCallback-DUGx-1je.js"},{"revision":"2f3cd06d78e9383be7335a339742ba33","url":"build/assets/useMergedRefs-Cf-h09Qf.js"},{"revision":"bf6826ef95be95a270fbed545eabaacd","url":"build/assets/UserCarts-CLSr6axU.js"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/assets/userphoto-2kQnKrr1.png"},{"revision":"23726286721b0da24b35833b803f061c","url":"build/assets/Userprofile-OCrqAi7I.js"},{"revision":"b6f6cccfd7030aa290d83961b1327544","url":"build/assets/USTERMS-xlLN-YJZ.js"},{"revision":"3ee934adfbadafaf7b61b1ea5d410b08","url":"build/assets/VerifyEmail-CHmLuVag.js"},{"revision":"7c16986283f7642768cc5a71f4508077","url":"build/assets/VersionUpdate-DcLkOHF-.js"},{"revision":"f2c6fd3eb61b6b66904ad1953393fc4f","url":"build/assets/VipSupporters-C2TblM16.js"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/assets/vishitimg01-ClMBzIW7.png"},{"revision":"6b72eb52c2a7d6b4d71add3900d23cf9","url":"build/assets/warning-CpDnawIv.js"},{"revision":"85e8dc34e6dcf72ce3576fff0cadd675","url":"build/assets/Welcome-D8t9hPqB.js"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/assets/Welcome-DvB2Xm2x.css"},{"revision":"6258cad82b790a8d369f08ac01f3829d","url":"build/assets/WhyLove-B4ZEDapY.js"},{"revision":"2e0e95052356589b87286146feb022d7","url":"build/assets/Wishlist-Bp7dBexz.js"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/assets/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"1d50a5537d7282e36fc843ec7d60d108","url":"build/assets/wishlistbannerimg-DU_hurLo.js"},{"revision":"73d174c68e12683bd07965e3eae6f307","url":"build/assets/Wishlistbox-sce_k50x.js"},{"revision":"eb9cc5f21a659007cefbf9e8e10be0d3","url":"build/assets/Wishtracker-DvxTUeRo.js"},{"revision":"b8c6149c46917af187714c9ce5980571","url":"build/assets/Works-i4eNtz-k.js"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/assets/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/assets/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/assets/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/assets/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/assets/youtube-DDw5LQj8.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
