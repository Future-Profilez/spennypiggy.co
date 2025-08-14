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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/avif/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/avif/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"46fe156d0f456d2d1c2ec861373e6a50","url":"build/css/bootstrap-vendor-ChLimcyK.css"},{"revision":"f5f14f96cba4007e57767f6fd17f10df","url":"build/css/main-Dyp1uPRz.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"049c0d9fb0f80ec864a6366eb961f346","url":"build/css/vendor-BAZ39jDi.css"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/gif/loading-DKd4CxP-.gif"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/jpg/giftimg-CbenuWDF.jpg"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/jpg/plaid-C3YNig8l.jpg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/jpg/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"7dfed28128713f74a0111716ef2eab12","url":"build/js/Accountsetting-lH9lL_nC.js"},{"revision":"e2cf39c10534d6ceabe2a0296af968a9","url":"build/js/AchievementSystem-DVH8ZpLp.js"},{"revision":"925a325c1858c365cef9ca70d84e03d3","url":"build/js/ActivateCard-BFT69nBH.js"},{"revision":"67bf57d93051b6154f08b2045759850f","url":"build/js/ActivateSubscription-xID3jQlA.js"},{"revision":"168590f824211848ceeae94a92c81bc4","url":"build/js/AddBills-DJV_1WX6.js"},{"revision":"8558527a1af583279408359cbaa5daeb","url":"build/js/AddCart-Bn9qV9R9.js"},{"revision":"ede68bb24311cfafbfb7b30b2a721b7e","url":"build/js/AddComment-DUcyHu1f.js"},{"revision":"a42ac0afb48c541443425fcce3424698","url":"build/js/AddGift-BWMIlm9l.js"},{"revision":"57465839e093283d62f19f13f71c8f03","url":"build/js/AddGoal-dduJEg26.js"},{"revision":"99f76c47f560ad72168de5b8c6d2eda3","url":"build/js/AddIntro-Dajw-FTu.js"},{"revision":"aa9ec295e2e8f3a872ba3a862b62441d","url":"build/js/AddItem-DZe7E-T4.js"},{"revision":"5e3b7f414f678865b39dac380870a397","url":"build/js/AddMembership--UPZywdh.js"},{"revision":"a3cbc9c286f4a57c6d6e9e6b0897b41c","url":"build/js/AddPost-BE1gqfX-.js"},{"revision":"094ed5c23224d908e944742c3a8705c2","url":"build/js/AddressForm-CZEZ2IDF.js"},{"revision":"20b173d65e0628a4a46cf06e64b8fd78","url":"build/js/AddRyeProduct-DTWIeRg3.js"},{"revision":"39f05cc1ff9342b6170bcebc77c517ec","url":"build/js/AddShop-C1C0WQ77.js"},{"revision":"b5da8c87b083e8756dd571615c699600","url":"build/js/Alerts-BPprbg0n.js"},{"revision":"80b7f9e44f47f5cf021e1a326e175cc3","url":"build/js/AllCountries-BoPBXb3a.js"},{"revision":"21166e688a661005f7e0c748c196c814","url":"build/js/AllWishes-DwbEE8Qm.js"},{"revision":"c1d5c455d7837a99028af2063ead4090","url":"build/js/apollo-vendor-DKcDt_z1.js"},{"revision":"39446994d21c051870559b1e32960dca","url":"build/js/app-BccRZLKA.js"},{"revision":"a5be787a43376cf4132880a3ef7cb50b","url":"build/js/app-store-C_zrJWGW.js"},{"revision":"6d51c9da3c574d995d496421909ee8ec","url":"build/js/AuthenticatedLayout-gCeqdVjX.js"},{"revision":"15cb24d5f1f349f037093b60bc3d33f6","url":"build/js/Avatar-Dq-sCPPm.js"},{"revision":"00514c4209073517e7f61d417b47eb0f","url":"build/js/Bill-ownRlalM.js"},{"revision":"6f3431023d2da6d4a7257975ecc653c2","url":"build/js/BillCheckout-CN8uYB5R.js"},{"revision":"71e443ac88660d326cfdd4da633ff91f","url":"build/js/Billslist-BH9zklb_.js"},{"revision":"dd8bd74167c7c51e465b2d74c777e4bb","url":"build/js/BillsTracker-C4jhK7Ra.js"},{"revision":"49265fbbf15868859ab79876950003c6","url":"build/js/Board-DS3rn7_4.js"},{"revision":"a6155050c777defca0b1581de1558406","url":"build/js/BottomBar-rrCQ-gtB.js"},{"revision":"9a678a59a6eb64e1627e95a2f4df9676","url":"build/js/BuyShopItem-CKVInxCP.js"},{"revision":"ff4ad01621ff5071b8754b13665c36fc","url":"build/js/Cart-qRiM6UWu.js"},{"revision":"706c4ba70ad1c1c130cc7fcf641d9297","url":"build/js/CartItem-D2hY8jk0.js"},{"revision":"e69fd5448799833825d1a3fde60229b8","url":"build/js/CartItems-BBNK-Rbg.js"},{"revision":"72fa77893a2d196c67b4c68ace3f547e","url":"build/js/CartListing-x2pKrQIK.js"},{"revision":"c7814f62aa6ae3144985410f50d3907f","url":"build/js/cartproductimg-CMV7Is1K.js"},{"revision":"c8725bea22ead5e7dbea79e3dbdce4c1","url":"build/js/CategoryLeaders-B4qA8UOl.js"},{"revision":"b1cd278b14fd66c8ffe13e184f3aa550","url":"build/js/ChangeCurrency-cvsMcjBg.js"},{"revision":"0c43bc66622931457587ec4e9eb483d3","url":"build/js/ChangeVat-B5lwjpJe.js"},{"revision":"0d14bb6df83cf6869357ed388de59a24","url":"build/js/Chart-D17U9_07.js"},{"revision":"ce44c3f28794906f6f203d2eabba6ba6","url":"build/js/ChartDashboard-DC3BgHLK.js"},{"revision":"959348f3d1880c74473910c4bef9a5a6","url":"build/js/charts-vendor-CY_yQHkV.js"},{"revision":"ee376d8f507d169d1fc379a54c9f583f","url":"build/js/ComingNext-v-m92BNb.js"},{"revision":"afa3512130e07962cbc5848ad9123f2b","url":"build/js/Comment-BhHlG6ZA.js"},{"revision":"f9d70d0c1102f41b168acb595d79e9c0","url":"build/js/CommetsLists-CRqcK2V1.js"},{"revision":"ee22c2f9aaf508e06a73e4d273657a2b","url":"build/js/ConfirmPassword--kXjqOUD.js"},{"revision":"6767468e08e3399b94724fe4e9e9df71","url":"build/js/Countries-CJcTeb1J.js"},{"revision":"d53f84dd8519f9c43718b1f6052d654b","url":"build/js/CountriesShipping-C3XBzVY5.js"},{"revision":"2f1f39feb95441e8d2f1f2d0e9b7ef02","url":"build/js/CreatorVerification-DUWIMW8d.js"},{"revision":"1689d3c19fb09af8da32c734decc6cf2","url":"build/js/Dashboard-BgWEbsXS.js"},{"revision":"338c29a983f67f15ccafba7c196eac2e","url":"build/js/DataTable-k0asy949.js"},{"revision":"3971d644766b4474dafc453ee7efe080","url":"build/js/DeleteStripeAccount-DDEWDtQq.js"},{"revision":"f7a6b510fffacbb7c5b4be82fc4941fc","url":"build/js/DeleteUserForm-PBLxZNyv.js"},{"revision":"e335910dd6cea371fe1dc613c16ab91b","url":"build/js/DeviceID-BBh-dYw9.js"},{"revision":"ae0435b463579c595d8035767f6f5a95","url":"build/js/DiagnosticPage--9TWYlvC.js"},{"revision":"cc6300493f26c52c3653847ba8437ead","url":"build/js/Discover-C4yvam-L.js"},{"revision":"b6f311f60f08c4e6cedd7267f42f190b","url":"build/js/Earnings-D__fxq62.js"},{"revision":"de9ff48c5b8998a8ba89538b6367b32d","url":"build/js/Edit-k1zPLDKB.js"},{"revision":"ec97f4436e57132f390e2e0e3e4c6e5e","url":"build/js/EditCategories-Ch2ujEpI.js"},{"revision":"07ad78d52b8e5a11e48289353c00cb21","url":"build/js/EditMembership-CurwEJmo.js"},{"revision":"1a38eff1a37a9c5f4feeda3a1858d8e3","url":"build/js/EditProfile-CjTy0suH.js"},{"revision":"7c481a52601a1afb4f5276eb56dfc983","url":"build/js/EnableCardCapabilities-B-6mLOoj.js"},{"revision":"ec6d7fe6a06455543f4009c35548b8e4","url":"build/js/EnterOTP-D_KBkD-5.js"},{"revision":"caca767d0b37b2bf019c3f8ca07e94dc","url":"build/js/ErrorPage-S2I7vFPx.js"},{"revision":"56c3e66b71c63c7f956cb6b29428f082","url":"build/js/FAQ-QPQwc0Nj.js"},{"revision":"13e7ec1d13f8186ad5b6412962c11f71","url":"build/js/FeedList-Dlz0bayw.js"},{"revision":"27c92766416429b91dbe983a10118d1f","url":"build/js/FollowButton-B1KhcjSg.js"},{"revision":"6a95c64882014167f18468eb8ae376c4","url":"build/js/Footer-BQsqHq9G.js"},{"revision":"3ce5ee77932008094c09cfa3a2fa1b26","url":"build/js/ForCreators-CIkZTC6s.js"},{"revision":"7178cfbfc8a85f15263db054b6790bf2","url":"build/js/ForgotPassword-BJ53tfiq.js"},{"revision":"79af168188df4f5e401c272b0de60079","url":"build/js/FunPart-CqOXtf97.js"},{"revision":"b9a1511ed4ccc0aaa16be58ef95af53e","url":"build/js/GetCart-BUuxOtx0.js"},{"revision":"922752704a20af887509b324e2dc8f3f","url":"build/js/GiftAddCart-BYopx8zv.js"},{"revision":"44b641c28b97f4ecac8a12c3165d0f46","url":"build/js/GiftEdit-DD2cpeaC.js"},{"revision":"f7242d8f6d1b341b05d54c4429bbfe6a","url":"build/js/Gifter-CwGktkhA.js"},{"revision":"d2c0e94db63e07452c4dbc3c692b661d","url":"build/js/GifterCardVerification-Bk_LvpLC.js"},{"revision":"c4a379e6f2c2d446249c27174fcfe241","url":"build/js/GifterFeed-D1wdFZtF.js"},{"revision":"f4b145349afbc9a8cbe284955b1ad829","url":"build/js/GifterItems-Cu9wYroU.js"},{"revision":"8ac9d8e2d35dd42b6beb969387218004","url":"build/js/GifterMedia-CUjoNNxI.js"},{"revision":"f64e6af3ae885725007108e1f3095fed","url":"build/js/GifterMembership-D3LyyCB9.js"},{"revision":"171262a6e73ded8edcc31cd45d0a6156","url":"build/js/GifterSubscriptions-DczmKW-3.js"},{"revision":"91a0a5d58867f9cc779e5f8525b690f1","url":"build/js/GifterTips-l27PH6-M.js"},{"revision":"eabd3108553c057f768580335c863ad7","url":"build/js/GiftListing-OV5hbdP-.js"},{"revision":"69f18eabaf9de412bf425ca37a4397b0","url":"build/js/GiftStore-B7iFRCy9.js"},{"revision":"0917375ca1805ff34c7d30b54e079bf9","url":"build/js/GlobalCheckout-pJZhtWvc.js"},{"revision":"7f20b4eccfd12f0ae9ab46e6e9443a7d","url":"build/js/GrowthTrends-Dre2ZZ8A.js"},{"revision":"95b528374c75b3cfc9f4e19fd394ea14","url":"build/js/GuestLayout-D3lBes6n.js"},{"revision":"c180cf1abd84666e4fbe5addb2dd935b","url":"build/js/HappyCreators-CUXOCNf6.js"},{"revision":"46a6730547d0285c056ce4101faf3cbf","url":"build/js/Header-CxgFe1g0.js"},{"revision":"8205478d1206e20be6c8b66a97593d71","url":"build/js/Hero-mZEOzGFs.js"},{"revision":"345b34296d246cecef1fd9f80f5e934d","url":"build/js/Icons-Bt56VAgE.js"},{"revision":"b123d8709b745c70a51f0f950db3057a","url":"build/js/ImageEditor-BcNbRWMq.js"},{"revision":"62c4eb9d4b4773b80c1298ab1cae0a61","url":"build/js/ImageGenerationWithAI-BlpBM8g5.js"},{"revision":"8c315df5173654c24ce9a4d1d3a951d6","url":"build/js/InputError-C_gNW8kV.js"},{"revision":"a2e6ed563d4421a61c3f8b0ff5a71923","url":"build/js/InputLabel-BUseqWIH.js"},{"revision":"61c2b7544a2a5a9fccf0e06323382aa8","url":"build/js/IntrosVideos-CaQKAisx.js"},{"revision":"1dfedd016bc25dbfa523a830b3b53d0e","url":"build/js/Item-BVv_9hNP.js"},{"revision":"4d56348c307b7b1a83f7917eb6b81299","url":"build/js/JoinUs-DJlUPZ8l.js"},{"revision":"f2e0541d69bdf3fdac0e7d497eb133a6","url":"build/js/LeaderboardStars-OPGU0gh1.js"},{"revision":"76ebbea103789c2c01f81c240c2be19d","url":"build/js/LinkTwitter-Q-qxwmqL.js"},{"revision":"0fff23732d1e7ae10f1cb3bf6fa421d0","url":"build/js/Lists-Di5MdJUJ.js"},{"revision":"2771307d2c5358ad27600669c70917a2","url":"build/js/LiveBar-CoVj3Rln.js"},{"revision":"aaa7fad64b5da48a5109ef3f4b9ec421","url":"build/js/LiveBarSection-ClsZ9zkZ.js"},{"revision":"cc0014868176cf139223fcf6f2697435","url":"build/js/LoaderButton-B2o1GRvQ.js"},{"revision":"26c6d83a3edae17fcfabd25d36b148d3","url":"build/js/LoadingScreen-Dt2kLE_U.js"},{"revision":"2e0d6fed1959ce2ebe8d2a7c0f306f6f","url":"build/js/Login--kAqhPy0.js"},{"revision":"c94ba50865d3a8a9ccb5cab442a9a7ff","url":"build/js/logo-B5lL0K2o.js"},{"revision":"99d521405c866b8879f84f9ca1501455","url":"build/js/MagicBellNotification-CN9Fw97i.js"},{"revision":"bddcab50a8f1d64bf6ef1a68a1f4c8a1","url":"build/js/MagicBellNotificationDisabled-BmFUcv2z.js"},{"revision":"abecd1abc5a069250db7209f499a4d8d","url":"build/js/main-Dq_0uaK6.js"},{"revision":"a507068d16b69900805f63e1154fab17","url":"build/js/MemberCheckout-Dya482Wu.js"},{"revision":"a6362817fae26fb7d782b18940dc517e","url":"build/js/Membership_dashboard-CelXs59i.js"},{"revision":"0c40f27b8bd1ae269b4364cfc1f8b2d8","url":"build/js/Membership-D8SAL-1N.js"},{"revision":"8caa14c345944998444e0e26e00eb713","url":"build/js/Membership-DsrGxIBr.js"},{"revision":"55fe1f56a736562ee8c68754fa684b5b","url":"build/js/MembershipLists-DU4bk3Lt.js"},{"revision":"001355dc619fa168b75f5ff8bcd575fd","url":"build/js/MembershipsLists-CvdxuCEx.js"},{"revision":"31483d4c4a39dff8b33e4bca14290055","url":"build/js/MembershipTracker-DAULflEK.js"},{"revision":"4e4f0a336084cfdeba82d0a229ae28bf","url":"build/js/MonthlyRevenue-CIOMNnZc.js"},{"revision":"2f748d5257603f81f54e5e824027825c","url":"build/js/MyGoal-CgOxZvci.js"},{"revision":"6fab2d33a48b648e310f3778cbce0c2b","url":"build/js/MyShopProducts-BUXfTqfl.js"},{"revision":"ef353d64851b0e652b7bd54ff9748a3b","url":"build/js/Nocontent-DXxXAhKD.js"},{"revision":"f3f0f59ac880cc2222bf918c4c29a37d","url":"build/js/noresultimg-B_g4pD0M.js"},{"revision":"23ff681557a99b1043a48f5c2595c385","url":"build/js/NotForBusiness-2vSGbTqB.js"},{"revision":"fb8da6af70d79c58ad9d261e4f960b36","url":"build/js/NotFound-D8lMXypu.js"},{"revision":"2ecdf57d1ce4d844c7fce34af1e8d7e2","url":"build/js/OldSubscribe-DwX2gy5i.js"},{"revision":"8ca190a9b406bcd5c3d19fcdfd93ae08","url":"build/js/OrderDetail-oV4YAiXB.js"},{"revision":"73047cf55ecf9c3edbd94797de69aef3","url":"build/js/OrdersLists-BqlMFasJ.js"},{"revision":"d1b2a429499559e8d47d639b653a91b3","url":"build/js/PaymentDashboard-D0VETVlo.js"},{"revision":"99806d7c354712d187653efe8a0c0528","url":"build/js/PaymentSlider-snENFrXU.js"},{"revision":"44760ede6856de2bdc173574863603c0","url":"build/js/PlatformAnalytics-CQ3YoXRj.js"},{"revision":"63ab5a16b4360525b2feff75ebda3bc0","url":"build/js/Popup-Blpzo0yd.js"},{"revision":"5ff5832ef8da17461c835f0cd6de73ca","url":"build/js/Post-G6kHSSN6.js"},{"revision":"e41bc8beced42297100b317a525011ad","url":"build/js/PostLike-DZ9IHOgH.js"},{"revision":"6035b409879f4f961cfe0d32b4b4f474","url":"build/js/PriceFormat-D8BEM7H0.js"},{"revision":"7492810df1f163e872b6d8ef8bc62785","url":"build/js/PrimaryButton-FKzZpLkP.js"},{"revision":"f814840edd18cb0ebe415db982de9e5c","url":"build/js/ProfileProduct-B-Ja40F6.js"},{"revision":"f5e5f012d21d955a64da2e578106efcf","url":"build/js/ProfileProduct-C6vFTDkD.js"},{"revision":"dd941dfcd04def593824aab5a2525787","url":"build/js/ProfileProductLists-CPXnVqG7.js"},{"revision":"9c522d7f2c3653729227df658cc1ff2b","url":"build/js/ProfileProductLists-DuhXQLfO.js"},{"revision":"33fe5260cf4a34da0929977e247f61f1","url":"build/js/ProfileSteps-ZAZmkZWz.js"},{"revision":"8fa92d950411c9d40fbb95b567a7bfee","url":"build/js/Promotions-DnJXClQd.js"},{"revision":"1ce1200000d9384e14c69a9cd50ec913","url":"build/js/react-vendor-CIXxc9eP.js"},{"revision":"402d899a445b8bc84e0c2193fc27d504","url":"build/js/RecentSupporters-CuZqkbyE.js"},{"revision":"7bb02980087da025b9cb3714aff3b2b9","url":"build/js/Redirecting-BDLkySyR.js"},{"revision":"93071d64d20d8b14be4b08adb4b280bc","url":"build/js/redux-vendor-DCbYtV9n.js"},{"revision":"983251b1ff89a2506975c9deb0f30643","url":"build/js/Register-Bh3NWSoK.js"},{"revision":"52345f47d012ba675b5ccc56852260dc","url":"build/js/RemoveBill-DbS169lS.js"},{"revision":"a5ef9d09eeb02cfb1463b89b8518295c","url":"build/js/RemoveMembership-x-h6EffU.js"},{"revision":"378008f8f198fd55842079cb866b270e","url":"build/js/RemovePost-DmORCta4.js"},{"revision":"ebfea006d19395800213f41fa981bb3e","url":"build/js/ResetPassword-BvkMNtp2.js"},{"revision":"a3a09440c7fe484c25d0f64d95c32ba2","url":"build/js/SafeTransition-BaSfavkR.js"},{"revision":"f89d194b695d0b02c3520af4adef0302","url":"build/js/SayThanks-C2cULxJJ.js"},{"revision":"e68a34a1a1ca5658a87259bfe3444633","url":"build/js/SecondaryButton-BYSlF3QB.js"},{"revision":"63d1b4ce9856e98e027bf9326039eab1","url":"build/js/SendTip-Dq2byzdB.js"},{"revision":"e934b2de2c6626ec462b4217959443d9","url":"build/js/sentry-vendor-_T0YkUWY.js"},{"revision":"bca704337b5ab8ccb17e35f74e0e4dac","url":"build/js/ShareProfile-Bjw0flxS.js"},{"revision":"aefcbc4ee996cae1cc94350f251d6770","url":"build/js/ShopPage-CzbkUFm3.js"},{"revision":"101a79f25ed8525261757306b5624ba1","url":"build/js/ShopTracker-B97xkST5.js"},{"revision":"d841a26a9cb475a8e3a17e972ef00ee2","url":"build/js/siteicon-DsSyz8LR.js"},{"revision":"7508c2cf79233e46acaa950403bea5d7","url":"build/js/SiteSubscription-1CtTOYMS.js"},{"revision":"50c8c9d76a1ea9ecea81b58d01c89867","url":"build/js/Social-Lgnu4j-G.js"},{"revision":"7efd8fc71f637aa49fe3c8b0f749b6da","url":"build/js/SocialLinks-TX3LQMjf.js"},{"revision":"29ba3716cbf268286fc74d932a55df08","url":"build/js/Stripe-Br3tl7MV.js"},{"revision":"629a434e185820a26688a3ace7b38677","url":"build/js/StripeIdentity-Di_zyH-S.js"},{"revision":"f5efef767fdab41e475ea4fd3ddc29d1","url":"build/js/SubCheckout-Q7UkX3s2.js"},{"revision":"1b1fc00f72341fa8d3792a3e31ea8541","url":"build/js/SubcriptionEarnings-D0u9HEQy.js"},{"revision":"b9a097b4cc052e2def4513ccc9649fc4","url":"build/js/Suspanded-CvBlM6Fp.js"},{"revision":"c9cf13da6f11c4c6969b18b3497e188e","url":"build/js/Terms-CiZ9Gfrs.js"},{"revision":"91bbfb12d3cf96113ab96a20a65bf476","url":"build/js/Test-DKGLbCe5.js"},{"revision":"d14dd9be9287d6a0a902bd32ebe4f3d6","url":"build/js/TextInput-BA4iGwQa.js"},{"revision":"cdebef1ba11290934a39487a42927134","url":"build/js/TFA-5fQAwQl_.js"},{"revision":"5620eb2249555fd09cc123843e308680","url":"build/js/Thankyou-n752dlsK.js"},{"revision":"61eeb80077dcac7129d60ed9e4c4cf06","url":"build/js/ThankyouMessages-CkuXwBXa.js"},{"revision":"6c17f8355ef0da5cb4fbdfdee6ec8fdb","url":"build/js/ThankYouRye-Dmy2fFyX.js"},{"revision":"85ae1927428d9d6a4d73b6ecbba87206","url":"build/js/TimeFormat-kYP1VYR2.js"},{"revision":"66d096595c610bed7a1528c53991e539","url":"build/js/TipInner-C9VwDkmY.js"},{"revision":"e20b054a1c5480a33bb90ee0b7037391","url":"build/js/Tiplisting-BTRhWBQd.js"},{"revision":"7a0b0117967cc2341fdc29c57afd5f90","url":"build/js/TipTracker-MNUikWNb.js"},{"revision":"8dd95adc5037a35223009309ad2d0e46","url":"build/js/TopEarnBills-BFuxAKRZ.js"},{"revision":"9ef118de99da385a6e3fc6c2a69a0e5a","url":"build/js/TopEarnWishes-CQlTxnDV.js"},{"revision":"0432607a74bc974a2f2aed258d9b4157","url":"build/js/TopSupporters-BCW54gH4.js"},{"revision":"bd0fa41668c344fc7927a56cc8624234","url":"build/js/TopSupporters-BY8ek-Ts.js"},{"revision":"799eadfab7c55619c03c569b5b0df7a3","url":"build/js/TrustBox-D6YSLgEg.js"},{"revision":"61ef0bfdde062487b7f66f32855c4e01","url":"build/js/TweetNow-B9lp0IAN.js"},{"revision":"d083ea93708ab3e5df894cf660df0414","url":"build/js/UpdateAvatar-CjeDzssB.js"},{"revision":"fcab69880db9f28a193eff1cbaa6e33c","url":"build/js/UpdatePasswordForm-jinf5Lg8.js"},{"revision":"b5c50d1fa6ac74e15cd4fd09e3108a10","url":"build/js/UpdateProfileInformationForm-DJZvDByE.js"},{"revision":"c46c5f043fced8b420ebdd6d4a40f07b","url":"build/js/UpgradeStripeAccount-K5NxE8zZ.js"},{"revision":"a4ddd07e04d2bb6a71ea959564a5bee9","url":"build/js/UploadcareEditor-BVnyn4wP.js"},{"revision":"8a1a299af522d1961c0ff0cda31b26a4","url":"build/js/uploadedimg-BMa4JKzP.js"},{"revision":"9d5ced8c1008945665891d4eff6dd26a","url":"build/js/uploader.module-Zlx0P0NX.js"},{"revision":"e51dc58c6bcf0b7937afb7cdb9fc7045","url":"build/js/UserCarts-B9ks_u6v.js"},{"revision":"c6bbf7e82fc8e4bb6401cd56439ee3d7","url":"build/js/USTERMS-C3MQEgS3.js"},{"revision":"9add93df4c0b91a12ca304ef12943ac6","url":"build/js/vendor-DDjs9iC0.js"},{"revision":"afbf7c3dc428275d76deb91af846ecb9","url":"build/js/VerifyEmail-CuyZ9k-T.js"},{"revision":"40f14643c9320ac675071712d5942fff","url":"build/js/VersionUpdate-D5-h4KOy.js"},{"revision":"1c1dbead33085b67bf3f9b071bb2d138","url":"build/js/VideoPlayer-CVxr-5my.js"},{"revision":"71dfb3fc768c29e5fdb10f57c377e289","url":"build/js/VipSupporters-C2ys7gHV.js"},{"revision":"22da4127a3e7c131e75f9fe1aeb2e167","url":"build/js/web-vitals-D1hvhLHT.js"},{"revision":"b95160ccb8106e34cc6d981e11cd29e3","url":"build/js/Welcome-Z3Z-YBsS.js"},{"revision":"2fc76e9f4196be87b9c764337b840ff1","url":"build/js/WhyLove-CfyOauyl.js"},{"revision":"538a412b4ee9b07bb8e082bb5c35fe66","url":"build/js/Wishlist-DjWRjhk6.js"},{"revision":"4c09a2a9d1cb2d6ebb1ab964cb8a7c9f","url":"build/js/wishlistbannerimg-PNm9VNvH.js"},{"revision":"e5da5304be5747e8a2169da87da4a9a0","url":"build/js/Wishlistbox-qecwoWWg.js"},{"revision":"0fc766d03a9b5ea8836e8fd1fd2a38ca","url":"build/js/Wishtracker-Ce23ycvd.js"},{"revision":"9e9ba2793c6025ea411c42a3460eee45","url":"build/js/Works-CRGEGoXI.js"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/png/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/png/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/png/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/png/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/png/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/png/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/png/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/png/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/png/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/png/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/png/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/png/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/png/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/png/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/png/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/png/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/png/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/png/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/png/giftbasketimg01-UPFBeLeW.png"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/png/HeroBg-CgSE7w-A.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/png/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/png/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/png/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/png/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/png/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/png/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/png/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/png/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/png/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/png/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/png/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/png/kylie-BcKwDcm6.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/png/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/png/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/png/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/png/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/png/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/png/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/png/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/png/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/png/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/png/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/png/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/png/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/png/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/png/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/png/PCICompliance-qTSDRKZK.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/png/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/png/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/png/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/png/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/png/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/png/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/png/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/png/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/png/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/png/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/png/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/png/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/png/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/png/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/png/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/png/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/png/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/png/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/png/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/png/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/png/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/png/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/png/vishitimg01-ClMBzIW7.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/png/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/png/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/png/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/png/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/png/youtube-DDw5LQj8.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/webp/HeroBg-CbJjqro0.webp"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/webp/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/woff2/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/woff2/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/woff2/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/woff2/CeraGRMedium-QrW24R6m.woff2"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/woff2/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/woff2/newfont-BRfniQek.woff2"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
