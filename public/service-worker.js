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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c23d4ef89ff480a02199abbf95dc044b","url":"build/css/app-DkkP9tkb.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"2732b27e8501b7c55a03d27b1c6dce80","url":"build/js/404-DlKvrnnI.js"},{"revision":"71d3bdf5bdc29796457797b9bcc4adae","url":"build/js/Accountsetting--Nubbk7k.js"},{"revision":"9b3521c4d1fc800d53208420fb5fd787","url":"build/js/AchievementSystem-CmmRvT7G.js"},{"revision":"7666b0ed49216bf867aaf55bc6497cb3","url":"build/js/ActionRequired-BirNaMG2.js"},{"revision":"4ae471abbc8e1bee84237a72b1204ed1","url":"build/js/ActivateCard-B7-QK55Y.js"},{"revision":"6a1a091b59d88bbd6ab73482f1df45d7","url":"build/js/ActivateSubscription-DLZMDWI0.js"},{"revision":"9ab70dcfa33390d376f341aee6a4aa0c","url":"build/js/ActivityStatus-Bgzm2BrI.js"},{"revision":"a2821b484d7796960d954f18d0a6e5fe","url":"build/js/AddBills-B2-OI8CP.js"},{"revision":"3286546f220777a72d5735d674f1fc72","url":"build/js/AddCart-y7a9165D.js"},{"revision":"f0915b53cbe070a6aebcf136265fa128","url":"build/js/AddComment-f6lusXW2.js"},{"revision":"b0768e07215cd4accf8621b49f9c15b5","url":"build/js/AddGift-UW3orFdX.js"},{"revision":"df3c91bcb69606598097c39b50d32760","url":"build/js/AddGoal-DCX1jROr.js"},{"revision":"a76bba01a2296ff43aeec44081733489","url":"build/js/AddIntro-B_FCmsGe.js"},{"revision":"6e81d0613676182bec12f99e2a0c1645","url":"build/js/AddItem-CuKcdMZZ.js"},{"revision":"b9f2644f362bfc83df9d16fdb3f64aa9","url":"build/js/AddMembership-CDvRoICy.js"},{"revision":"e228e8e3f2d73f1cfad0f08b0a1d169a","url":"build/js/AddPost-C-gpqdyX.js"},{"revision":"e2dd6d5ca9396419070dbf9c298b19c1","url":"build/js/AddressForm-Dk22W7S4.js"},{"revision":"2dd3b5d7f85663b10e2da692ca27c1d9","url":"build/js/AddRyeProduct-Bc2fN9Y1.js"},{"revision":"d798d355e6ab3d24ba7d04427a76653b","url":"build/js/AddShop-DL758fcZ.js"},{"revision":"0f32054c5e8f591b776d442c356d3470","url":"build/js/Alerts-DTqHEy6_.js"},{"revision":"e9b5743fcef95620b4d0f15cfdd7c552","url":"build/js/AllCountries-HlkOzoE9.js"},{"revision":"2cbc51aa010aa2525a96bc6023f524dd","url":"build/js/AllWishes-mMhPVj3X.js"},{"revision":"b5d89141133162095c815e01df8850af","url":"build/js/app-JKbxQc7Q.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"e6b5263347148ed710d5f49dad0183f7","url":"build/js/AuthenticatedLayout-BjrNIvpZ.js"},{"revision":"a9e1e9f3a76f486eb0b038f0ef376fff","url":"build/js/Avatar-CVpjyhYu.js"},{"revision":"ed33e53b9ff481e295d73a3e2177b865","url":"build/js/Bill-D3TpziSh.js"},{"revision":"361cd8a8ebe651dbab4e20c6f6b1a967","url":"build/js/BillCheckout-25rdvbys.js"},{"revision":"50c6213ac0d5dd9660a3f867d6db1a15","url":"build/js/Billslist-DNvLoaKm.js"},{"revision":"d6669d9b92a6e07584a44abdf1ed7e98","url":"build/js/BillsTracker-C4CTnlO3.js"},{"revision":"fb0debe53358431755a16d67717d1c10","url":"build/js/Board-TylaDFwq.js"},{"revision":"884e55044c396fa1115e2ca077a0296a","url":"build/js/BuyShopItem-BQlfSl_d.js"},{"revision":"99ba77787c7c74b284a9b6f171bf0c18","url":"build/js/Cart-OPO278jB.js"},{"revision":"08ca2e9dad71e64a06a884f0b8d67dce","url":"build/js/CartItem-iBF1eIqu.js"},{"revision":"c97af26f433a43dcc001f201d56e0577","url":"build/js/CartItems-Bizx7CQw.js"},{"revision":"a21154fc95898810ac8ef01af96a1799","url":"build/js/CartListing-kxhTPygf.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"ffc6cd2a24254c105c0eec9532ac87ab","url":"build/js/CategoryLeaders-Du2bcmm0.js"},{"revision":"ca51f5d0e5f42fcf984b5222e43d641d","url":"build/js/ChangeCurrency-BYaJy7YU.js"},{"revision":"70eafdb908d0f55af0ea9065490da486","url":"build/js/ChangeVat-CBiSJ3-l.js"},{"revision":"d2ac728ee50a14ad134688a5d43d3174","url":"build/js/ChartDashboard-Dz7MEKbL.js"},{"revision":"b38d84fd23fecdf1cbd651d15baa43d9","url":"build/js/ComingNext-CR0neVTS.js"},{"revision":"b00fa4b8d536900b7bbaddf163d16783","url":"build/js/Comment-C-mqXWmp.js"},{"revision":"e30ee0a45966af2fcf17d36b066b1ba6","url":"build/js/CommetsLists-A18xBb2-.js"},{"revision":"ea0225aa4d6b5bb807791daa9b2ff85d","url":"build/js/ConfirmPassword-Da_Idb4w.js"},{"revision":"5a012c27a7061d18e7ca5e5859dec545","url":"build/js/Countries-rhFPmhvN.js"},{"revision":"a927f9023012f700ac71d1f596a7b423","url":"build/js/CountriesShipping-WwivJOuI.js"},{"revision":"4d045070f90652ae2f195bb186f6ce6f","url":"build/js/CreatorActivityWidget-BHqe-0ik.js"},{"revision":"6fc8dc0e35158620487d2e305abc5001","url":"build/js/CreatorSubscriptionWidget-BtSghpxx.js"},{"revision":"2a1443ebe7956b2aa115e17733813e4a","url":"build/js/CreatorVerification-B4SYUPj2.js"},{"revision":"afc599a45b7894475fd3abc0fd70a839","url":"build/js/CreatorVerificationNew-DD595RPO.js"},{"revision":"19c42918d0bf9e2ef9605b00874371cf","url":"build/js/Dashboard-BA-pR2O-.js"},{"revision":"635efd4ddfcf7d2fe28db454931c8694","url":"build/js/Dashboard-DokbPTmD.js"},{"revision":"30ea2d761beaa9d9b42bfe5391128b9d","url":"build/js/DeleteStripeAccount-BzcLHEYz.js"},{"revision":"20e21a0ec6f36e807b4f613dddb04f73","url":"build/js/DeleteUserForm-UjdS1t1d.js"},{"revision":"aaef3aea6ad53fa80b73c225d39c5a72","url":"build/js/DiagnosticPage-D_COxA9r.js"},{"revision":"6652bbeaf7c572eab57555d611b03102","url":"build/js/Discover-D6zNQ42f.js"},{"revision":"aa0f762661bf8b547488252a1d299b98","url":"build/js/Earnings-50zdMgmJ.js"},{"revision":"464691f0fda5f283fc689220b1d4cd2f","url":"build/js/Edit-c1-2zPBr.js"},{"revision":"f198688c84f6f9022323cc23a86ef5dc","url":"build/js/EditCategories-B4_MZAce.js"},{"revision":"13deffcbd38b5c1473b2d923b664813d","url":"build/js/EditMembership-DQf9DGvW.js"},{"revision":"4b7cdf8fccde5aed0d1b1532cf0cb77e","url":"build/js/EditProfile-Dwj1XpXw.js"},{"revision":"b6368f90f701edaa1ceb329881239b07","url":"build/js/EnableCardCapabilities-DKsX3Hd1.js"},{"revision":"cc946ad909752fe6a067714ea5fd1e45","url":"build/js/EnterOTP-k-8dD6qI.js"},{"revision":"8893ac60265a56aee128bfa40ecaa518","url":"build/js/ErrorPage-CuLWP6Au.js"},{"revision":"36a1c76928b26f9bcd318f5a7fc4ec77","url":"build/js/FAQ-Be7UCSFo.js"},{"revision":"4b61b1844de5a5d75079e41d3b05b65b","url":"build/js/FeedList-6S7AattC.js"},{"revision":"c6a4e03a2f90f6fe1070210891564849","url":"build/js/FlashMessenger-J91rXfRP.js"},{"revision":"503f972bc144e243331bab42f4a8ae39","url":"build/js/floating-ui.dom-Cq2y9XK9.js"},{"revision":"d5d44c970e18d1e1fa41503300e0b6ca","url":"build/js/FollowButton-B2fs0jFD.js"},{"revision":"e6e4a0ae9ad90488b5ab5e413d7fdcda","url":"build/js/Footer-CzN7klEH.js"},{"revision":"73548d155c4b3100ff62398cfa762ba0","url":"build/js/ForCreators-D3ZUVgmv.js"},{"revision":"c91faebf57f956dfbebcb7d1b2ab0fc0","url":"build/js/ForgotPassword-DPuIcnhy.js"},{"revision":"3b83bdb1abcb615d9c47e6489f6f95ae","url":"build/js/FounderBadge-cZi8pCya.js"},{"revision":"639959e1c0669110932d1fadab5ea477","url":"build/js/FunPart-DsD3Ps07.js"},{"revision":"9b10f9e98f911e494f447604b37bd194","url":"build/js/GetCart-j-de6dnD.js"},{"revision":"5666fc8ba4fababa1ab50da610f77a3b","url":"build/js/GiftAddCart-B1q8UiKX.js"},{"revision":"cb98ac956d72faabb74107b2dd045bc2","url":"build/js/GiftEdit-eY57jPw4.js"},{"revision":"216885802fab04c9bbabe48d5def3ad9","url":"build/js/Gifter-BXjtITWZ.js"},{"revision":"880c28f9fcce661ad4f39c086cd016d3","url":"build/js/GifterCardVerification-DBgIZk01.js"},{"revision":"3d763e866b7a3412bfba014a0e63711a","url":"build/js/GifterFeed-DuKnvCAW.js"},{"revision":"af2d9dffc2caa784ff871a956fbc8546","url":"build/js/GifterItems-uSYH9boh.js"},{"revision":"7a855845aefedde21bcd686303af2e26","url":"build/js/GifterMedia-BPPRS-TC.js"},{"revision":"479ae24bc6b2e5a651113f6837eb56dc","url":"build/js/GifterMembership-B-2MxW7u.js"},{"revision":"85339dcadad1926836a0258e62d5c081","url":"build/js/GifterSubscriptions--U2hbIY_.js"},{"revision":"1eedb9b79034de0f76b2e7656a0cc350","url":"build/js/GifterTips-BwcLn1wj.js"},{"revision":"f181090cc2a60ca2d402a01833212a04","url":"build/js/GiftListing-C8Cl1GAL.js"},{"revision":"d82c1f30a1d3b09a62bd33e77962af2b","url":"build/js/GiftStore-BRmnJYG2.js"},{"revision":"191e30ddb7b49e43080d0c43a31fbc92","url":"build/js/GlobalCheckout-BZMGv4Zd.js"},{"revision":"e746adc91d4f48d24c262380d1a698f0","url":"build/js/GrowthTrends-BT8I8WUf.js"},{"revision":"a0dd98a11bc1b181062663451c301013","url":"build/js/GuestLayout-KFkiu7LN.js"},{"revision":"0f8c4c467fdeb6a143389f1e49e8914a","url":"build/js/HappyCreators-DTmlPp-I.js"},{"revision":"18229483d2b42ed49164811f017a2f73","url":"build/js/Header-Dfb5UH7e.js"},{"revision":"5756aee5c9f40e7dace77965ddb33ebd","url":"build/js/Hero-RkrisY94.js"},{"revision":"56ff4be1b11f2c99e143594f9d8bd61e","url":"build/js/iconBase-BAIuH9uQ.js"},{"revision":"12cee1209bbdf34216eed3e4eae0df48","url":"build/js/Icons-t-hi6Hsb.js"},{"revision":"f754b306de91a76986efa2052d068de1","url":"build/js/ImageGenerationWithAI-CHiRl9Uf.js"},{"revision":"87b0fc0bddc902745b2ef259a17f1147","url":"build/js/Index-BAWE9r-Z.js"},{"revision":"7a722c1ddfbf9b54e29e8aaf6ff1dac4","url":"build/js/index-BEJXFvBM.js"},{"revision":"40bfd934fc3f160cb0167a4e8bf8754f","url":"build/js/index-BFXhRVBG.js"},{"revision":"bdb2ca9f6ea60ca266dd80f3ea7f80d9","url":"build/js/Index-Bhi0lXa_.js"},{"revision":"655371343243cfdbbdd1bed281f2790e","url":"build/js/index-BNkTDKOd.js"},{"revision":"b7c9ed4314e59e26d96fbbdbc920f35f","url":"build/js/index-BNVmtAwh.js"},{"revision":"dbbecd3820de6e70e2dca6d9cdd26405","url":"build/js/index-BWtPy7RV.js"},{"revision":"1266f36998ac19f65665e60c2e519847","url":"build/js/index-bx-r3sF7.js"},{"revision":"e2998f09dde63f2f3fc18f9e4e9335db","url":"build/js/index-Bxu_r2hj.js"},{"revision":"b3a9f7db42c7f11590a757be9afcdc41","url":"build/js/index-CFJwiCCf.js"},{"revision":"c7c4ccf5777704b789dc883d7aa208bd","url":"build/js/index-CNPjGl1M.js"},{"revision":"f29ede81ea4431e3d029ce54991e975c","url":"build/js/index-CnWJZUU4.js"},{"revision":"189865962d5a828c536580ae010131e8","url":"build/js/index-CNXRRRw-.js"},{"revision":"df2b7ca5b9dfbcb5524d82d481f21380","url":"build/js/index-CwyBoGS5.js"},{"revision":"cf79d91690662338faea2f9cf02dd8db","url":"build/js/index-D0pzCw08.js"},{"revision":"2b21604ec103deaba39a1452058cc319","url":"build/js/index-DmJMqPzW.js"},{"revision":"62715ba1638ddb13e58f9516e7902e2f","url":"build/js/Index-DsajQBri.js"},{"revision":"3d5ca37492c5cc668ae4d99982dc9e75","url":"build/js/index-G0gUB6Zc.js"},{"revision":"1e31f604b4f149c5d0055f19b1c241cc","url":"build/js/index-pjGvugwH.js"},{"revision":"d91c381e908bc0f4038b02ee1cdb5cad","url":"build/js/index-yRVi4url.js"},{"revision":"552b6a0cfd7b231b48d2429c2d6b9dd8","url":"build/js/InputError-Bf1OmLd3.js"},{"revision":"09dc65dc00ad9fbff3135668b9d86363","url":"build/js/InputLabel-pMcLwdz8.js"},{"revision":"a8df79a9cea27ffb345e0a14dfa12dce","url":"build/js/IntrosVideos-ZxRrSZTd.js"},{"revision":"7ba9e9b14f66b7ec80dc5adecb5d398b","url":"build/js/Item-biwQGR8_.js"},{"revision":"c87a04e012fccc38d759c2c99475cdac","url":"build/js/JoinUs-B3cNvPvq.js"},{"revision":"5bc04c37b84055b0e6b2bc7522fd6e64","url":"build/js/LeaderboardStars-CpFDqBbA.js"},{"revision":"151f7a8b66d61cf3b4e871e348592d49","url":"build/js/LineChart-iogGVuvm.js"},{"revision":"8603edada1ee62e4122e2743a43ce936","url":"build/js/LinkTwitter-Bdw8zhww.js"},{"revision":"4c9e526c394c5af6ac7baa8a46068649","url":"build/js/Lists-B81j7wmK.js"},{"revision":"36f7c15b270791f4540e6e4146eb6298","url":"build/js/LiveBar-DZq7kizW.js"},{"revision":"c495c4858eb5fd646d4f08932228e8ad","url":"build/js/LiveBarSection-DUP_EFld.js"},{"revision":"f7b1ad64e5fc3bedfd0499b4cff99ec3","url":"build/js/LoaderButton-Cqds3261.js"},{"revision":"ab5ce725fff7f6923a151cd9757bccf0","url":"build/js/LoadingScreen-CvD8ISQX.js"},{"revision":"48b96bab041f6aa0fac6d0723c0692d1","url":"build/js/Login-BtvG_5NR.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"1915cb0a7ecf0470389d5a5d3d4ab9dc","url":"build/js/MagicBellNotification-BtiGA0Gl.js"},{"revision":"f3e09f6c2836a4112ebcd4007741a4dc","url":"build/js/MagicBellNotificationDisabled-B6zz1HIT.js"},{"revision":"3f8afdb726b12e36a6f33364a671bea1","url":"build/js/MemberCheckout-6AKmYTVw.js"},{"revision":"a3c1ce65fb9fc2f29a8b9ad8856d3fd2","url":"build/js/Membership_dashboard-XLNEv2pj.js"},{"revision":"463786968367d19aa2c3861509e1dd08","url":"build/js/Membership-9XFN8ZPy.js"},{"revision":"c4193263cfc6bacf7fe9b603be65000e","url":"build/js/Membership-CdyAvGBG.js"},{"revision":"f69081c386c7fd3d66ce4d6ffe10410d","url":"build/js/MembershipLists-BBI5SNVt.js"},{"revision":"ba03a762cade9100ae585e743f1a89ed","url":"build/js/MembershipsLists-CHaKzdXI.js"},{"revision":"160d1a782971575889835a3f1a04fa02","url":"build/js/MembershipTracker-C6O3wbV9.js"},{"revision":"077f69aca5ee318221b5d64a18e69747","url":"build/js/MonthlyRevenue-pJg4OHGi.js"},{"revision":"6a2ca09e6b0b91b7296d5b8fe1972d3b","url":"build/js/MyGoal-CkPBpJ6f.js"},{"revision":"f09d32bd15ac261a31ed81fcbdc7105b","url":"build/js/MyShopProducts-CwPr3ht_.js"},{"revision":"cbe917e7c367cee50dbbf2a8abbf536e","url":"build/js/navigation-dy9dBK9y.js"},{"revision":"d48d65f7a1f57db6c27c5468345b3fb2","url":"build/js/Nocontent-B0Jq0gbr.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"9a6ddf7f0050fdd5cb74f39871324b4d","url":"build/js/NotForBusiness-C0ALyfJb.js"},{"revision":"171995b38c0f2c7838aba90708d918ed","url":"build/js/NotFound-BmHQoEm_.js"},{"revision":"d743fffcf5a38e8ddac5f3e9c476ca0e","url":"build/js/OldSubscribe-DGs22T30.js"},{"revision":"ffcf7ac821271a438a064a403cc7739f","url":"build/js/OrderDetail-Cu0e9itb.js"},{"revision":"34f04f9b599d4a11a6fb38d8b6cfb7ec","url":"build/js/OrdersLists-4W5-zYm6.js"},{"revision":"ec29744b88bef33f26f6778a4279b2e7","url":"build/js/pagination-CWJiaMN6.js"},{"revision":"e7b4d75b238c0417dd0f44feb584f3c3","url":"build/js/PaymentDashboard-C42BcdAe.js"},{"revision":"085cd9e4381a2a42468d61b00686f0ad","url":"build/js/PaymentSlider-Cdxk88g1.js"},{"revision":"3d82759a87f175f9e3001c001b34ab2b","url":"build/js/PlatformAnalytics-C8VBbulq.js"},{"revision":"98225d847157d613e01bf89fc8082265","url":"build/js/Popup-Rs6ryr6v.js"},{"revision":"939a42e8f844c33921fd3897fb30f219","url":"build/js/Post-QIJ6aBSl.js"},{"revision":"07db14bf36c1394f9c04903a6e4590a9","url":"build/js/PostLike-Bbr-D2yU.js"},{"revision":"a1a4ef92dd8c10e61fb8297ef04aec87","url":"build/js/PriceFormat-CRvnYPKh.js"},{"revision":"2e7dbdbd005b6583ba9241616e05fda6","url":"build/js/PrimaryButton-DE9XodeZ.js"},{"revision":"217df71bb19361914082277825bb3a36","url":"build/js/ProfileProduct-Bn_kIhxa.js"},{"revision":"8911eca2ad40b9f7624eac03d8c8cf16","url":"build/js/ProfileProduct-CfiLT-6I.js"},{"revision":"a82ec6816ea0f34e9523914b1d04a7ce","url":"build/js/ProfileProductLists-_whR1EtX.js"},{"revision":"63ce11642ae5c09ab407a7eb934f098b","url":"build/js/ProfileProductLists-kj74zUXe.js"},{"revision":"921ac202ec7acc5bda1e5a9b25732a47","url":"build/js/ProfileSteps-V59VomFc.js"},{"revision":"2f07f8611734a2c564df189143cf89b1","url":"build/js/Promotions-CsTrsHE9.js"},{"revision":"7ec554dca2ac21851ea09f300d2f05f1","url":"build/js/PwaTest-D-6AoZIh.js"},{"revision":"d926161aeaaf47d5a01bb077f4a73020","url":"build/js/react-select.esm-DDpyhKnY.js"},{"revision":"e143dd055e5da65fa6acb90b14fbdb75","url":"build/js/RecentSupporters-CGrug1zI.js"},{"revision":"e12069e53a1d676f2319d5efe3b61ff7","url":"build/js/Redirecting-B_IwS6ot.js"},{"revision":"98fe4b57f3b5ff9d4f76bc5f209f5b69","url":"build/js/Register-B_-HuPHy.js"},{"revision":"f4e056eb1e0ab3906605ed6e4477467a","url":"build/js/RemoveBill-OkpoafYu.js"},{"revision":"3c9d7b9388bdf09f2c7f00d5562afa78","url":"build/js/RemoveMembership-D47Z8y8R.js"},{"revision":"4902358e7ae113b18fa28d16e1f609a4","url":"build/js/RemovePost-D85fa9kC.js"},{"revision":"c671114228c300ce85a9ca089763fd39","url":"build/js/ResetPassword-CQXugPR7.js"},{"revision":"5fd5ae8b037567b38718699b03215997","url":"build/js/SafeTransition-tzscocPF.js"},{"revision":"2382dd4978d390a89d102ed08b1afa85","url":"build/js/SayThanks-COS7i6JA.js"},{"revision":"ea065d050f5f4acd54df1398f7c2c732","url":"build/js/SecondaryButton-B1hBw59T.js"},{"revision":"886fe25c10f8f94f267b017c81e6eafe","url":"build/js/SendTip-D16vAB3E.js"},{"revision":"86627a17551c3b1cd3bbc231d6585e99","url":"build/js/ShareProfile-BUePr7rD.js"},{"revision":"30b1ec4cbf33deadfe482692fb9aaa58","url":"build/js/ShopPage-BcYinC72.js"},{"revision":"cc1d72d95ffb3aeb102ba37b898ebf84","url":"build/js/ShopTracker-0ALQ1ytR.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"7a64547c8c9b2df0762f5a6fa60caa24","url":"build/js/SiteSubscription-DcmR0vnL.js"},{"revision":"6c4372eafb119218ee231a0d706362fe","url":"build/js/Social-CqVmNtN0.js"},{"revision":"021af4a1860118de340839d408750f46","url":"build/js/SocialLinks-Ce_lHh3i.js"},{"revision":"87f025168af701fbe3e7a1de7134ddc8","url":"build/js/sortable.esm-CvZkeNM-.js"},{"revision":"ad73f59725d6e4f7cc03d8317cefa1b7","url":"build/js/Stripe-CR6GckGN.js"},{"revision":"f6c61502f7be1c74b860109fe9a17bbd","url":"build/js/StripeIdentity-BC77QqKh.js"},{"revision":"fc2216ac1a51fc42182e92e4d133b1f4","url":"build/js/SubCheckout-yIfJWQAt.js"},{"revision":"d53ff1b6a9af33e96612fdbd202e0dac","url":"build/js/SubcriptionEarnings-Cica0Hsc.js"},{"revision":"bc04f46ab733f3030280d08b94552831","url":"build/js/Suspanded-CwPHf4rs.js"},{"revision":"7f2de34f1d4080d7eb0b7f88900e4110","url":"build/js/swiper-react-B9Vwspv-.js"},{"revision":"c91aec9936f64f41a5260e51b757f6d0","url":"build/js/TabbedDashboard-7djmd7qM.js"},{"revision":"729cc02ed897b116b7f473fe9f493091","url":"build/js/Terms-Bw8Wx5QA.js"},{"revision":"1d619867670074e2d234b90d4258154d","url":"build/js/Test-IJ-sKBJG.js"},{"revision":"7d001d829eac4d3b0d1201c454c10453","url":"build/js/TextInput-DjkxBJ-n.js"},{"revision":"9cf3a9e35c82c6e39733262ace668910","url":"build/js/TFA-Ba0l73AD.js"},{"revision":"f478c3205e3429702c0efd060d552867","url":"build/js/Thankyou-592kvCiU.js"},{"revision":"b5a1c960ef1928973b1efaa916288f7d","url":"build/js/ThankyouMessages-Ctcij2QQ.js"},{"revision":"eeaed56229be2c7c1c516567f534d5d3","url":"build/js/ThankYouRye-BfYNqOX8.js"},{"revision":"c98c8e65000ea94c0bb922bb9242c6b8","url":"build/js/TimeFormat-pcMmkRg0.js"},{"revision":"c9c914521ceaaac663263efab70a61ca","url":"build/js/TipInner-BcaFk6-0.js"},{"revision":"a6a2574cb66c38d52761c98e45b4578b","url":"build/js/Tiplisting-BwIE7Ji9.js"},{"revision":"6754acccac03ce5adefc423f4d1bbdad","url":"build/js/TipTracker-5g47uAl4.js"},{"revision":"79c92e492985d3a22cc602e825a65a6a","url":"build/js/TopEarnBills-CHcQ8RPL.js"},{"revision":"319a08fbc9c874b5860b0ae31bfe12dd","url":"build/js/TopEarnWishes-IHUB61Vx.js"},{"revision":"12d27dbaf57ec35062ee87fc8502d3f9","url":"build/js/TopSupporters-DNeXhNE9.js"},{"revision":"5fcd90b3dd7f6cdaf7659aacea7e8af0","url":"build/js/TopSupporters-ILy5nprL.js"},{"revision":"c6cac9ff74a924c290eadfad5fef56d8","url":"build/js/TrustBox-D17s1OUc.js"},{"revision":"9f5e7990b9fdc32805a0539cc719bf49","url":"build/js/TweetNow-CmIcY3yM.js"},{"revision":"ed0c77bdcff13587112a906e3cba4240","url":"build/js/UpdateAvatar-CgfbDrlp.js"},{"revision":"df3932bbc21cf53530af7125312be44c","url":"build/js/UpdatePasswordForm-R6rjVC20.js"},{"revision":"c79f2a2099784e35d0fcc7819b248b42","url":"build/js/UpdateProfileInformationForm-DwE5XNaP.js"},{"revision":"4ce43c4fd5b45d1f02df900da7166ba1","url":"build/js/UpgradeStripeAccount-S7Ntdh4-.js"},{"revision":"4b9c31adc53b72846dc0eb845cf3e1ed","url":"build/js/UploadcareEditor-xNyKE1ka.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"587daade14fd43aba4eccce65634fc70","url":"build/js/uploader.module-DIM99GvO.js"},{"revision":"3620985eb5da02c6878963c021d9b501","url":"build/js/useDispatch-5aKK-03d.js"},{"revision":"702685ac9d58ad7840a82f2e0fa67bbd","url":"build/js/UserCarts-aXdRg7VE.js"},{"revision":"a8d572ce1369e81a424b0cdeae0eb274","url":"build/js/Userprofile-DTbGEw7e.js"},{"revision":"00154ce8d156eea6f20cf23a39c84ed8","url":"build/js/USTERMS-Fbf3p6aa.js"},{"revision":"1fa0fb4e7e7d61422ee92a7fb16e6945","url":"build/js/vendor-inertia-rS1U5H0U.js"},{"revision":"101ab86231e562c537206fe02aacd200","url":"build/js/vendor-other-CzI2QIHY.js"},{"revision":"1237ffcf3815c4afcaaba68d148c1f33","url":"build/js/vendor-react-QMGiX4Ws.js"},{"revision":"929e8e9c7309bddf05e9bbcd4821d0b4","url":"build/js/VerifyEmail-qFKqIdiv.js"},{"revision":"bdfb5cfdc01d78bf460be41d49038776","url":"build/js/VersionUpdate-B6pEL7FB.js"},{"revision":"717628c8b11e5d94ba941b2a4fbf5b91","url":"build/js/VipSupporters-2u-Z50Vp.js"},{"revision":"10b6ad4201631176042e2226d6761a89","url":"build/js/Welcome-CVG_0-i-.js"},{"revision":"140ee1839cb4fba716a9e6b5f184f392","url":"build/js/WhyLove-DbcrgVme.js"},{"revision":"e34c9793df3fd3bd7e83a4dd71c95360","url":"build/js/Wishlist-unmJ3TOl.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"afc47e41c791a338cc3783c9670c99c2","url":"build/js/Wishlistbox-OOs4bIUk.js"},{"revision":"87b24a25a56d38921bde3c908fdb134c","url":"build/js/WishlistGrid-Dc-oUyV5.js"},{"revision":"141bad9babcee58fe9ff133dbe9eece2","url":"build/js/Wishtracker-BAjEcM_W.js"},{"revision":"01978304444fc569e2a4f70002ebf3fa","url":"build/js/Works-DRdMqDwP.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
