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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"686916b6e7224522e4c110f1b07bdb31","url":"build/css/app-CRrmVdqV.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"3b14f684599061028f6c976c327ea8c6","url":"build/js/404-BoEJJFEd.js"},{"revision":"8c9a5cc52fdc5853d36fc9527f11a5c6","url":"build/js/Accountsetting-B3A2vCTp.js"},{"revision":"2acc51771ac9b14f28a5afa73bb7f48b","url":"build/js/AchievementSystem-DPdFJ85g.js"},{"revision":"7aa79a2df997a24b836442806fcadbe2","url":"build/js/ActionRequired-DwiKxSc9.js"},{"revision":"7d6702f6b79d21c5c765fd8b9c1e4e11","url":"build/js/ActivateCard-DZW55fBD.js"},{"revision":"d01715ca110bed7b700f228a530806c7","url":"build/js/ActivateSubscription-DxzABC_F.js"},{"revision":"cff04f401aafe3fcf02925decd15841c","url":"build/js/ActivityStatus-BYgeGVHD.js"},{"revision":"9924c085e5d31b49536a806aaf0f66a6","url":"build/js/AddBills-CHHL_19o.js"},{"revision":"809e3bd182776d976bdb3a8c1a2cc4f7","url":"build/js/AddCart-Dmjw9yVr.js"},{"revision":"ce9fc9f9a9b4f97aa9dd24cfe05e323a","url":"build/js/AddComment-Dr0BRVKa.js"},{"revision":"d9c2783b651dd22d24bfa612b7e8e39f","url":"build/js/AddGift-AzWCmaQ1.js"},{"revision":"1fc32e7f6e5c638428da71f97f0a2408","url":"build/js/AddGoal-D_fNUrOH.js"},{"revision":"f50261de33568f089121e13982be074a","url":"build/js/AddIntro-Ck1x77LJ.js"},{"revision":"e675e8194649ab2011abcc33a8124251","url":"build/js/AddItem-BiilJ3r2.js"},{"revision":"524f680e0a8794341a351c277d1c1749","url":"build/js/AddMembership-BL2CDBlr.js"},{"revision":"edbc1f7fb9fb4ec8cd2ec82d71ae5011","url":"build/js/AddPost-Bn6_6pBV.js"},{"revision":"0add0cae65bfe4dfb09760e8c5d64160","url":"build/js/AddressForm-_QLgxlqh.js"},{"revision":"8cdaa7037dfb55aec9214fc39d9df74a","url":"build/js/AddRyeProduct-BhRLgECa.js"},{"revision":"d156e50e91a3f73a0d936ff9d2abf99f","url":"build/js/AddShop-BQls3-vG.js"},{"revision":"a9968429b77ad4439ec53c8544b6926b","url":"build/js/Alerts-x1tcpRCM.js"},{"revision":"8b69c8a160b431afe14eaa4cec2f22e4","url":"build/js/AllCountries-D5vk_3Fj.js"},{"revision":"f527188e9fda0fa375e3ffc111ab001e","url":"build/js/AllWishes-Xyw4ulhf.js"},{"revision":"8917e7f7471c1ffa9e889f61e97a3dfb","url":"build/js/app-CIgT2lFu.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"71c09c1ac401a190de55a175aaa69a2f","url":"build/js/AuthenticatedLayout-CZpNvCpw.js"},{"revision":"76374420d209409de304450e8d3ffe2b","url":"build/js/Avatar-fK6xCKAd.js"},{"revision":"a382ff4744fead27191afeef9f4d71b4","url":"build/js/Bill-BEq2aLtT.js"},{"revision":"ebebfb12786662f64338494e9d9b6ed7","url":"build/js/BillCheckout-DmelkNQN.js"},{"revision":"32b2c3eeb4cd852001d69f3683637ebf","url":"build/js/Billslist-B10Ee7RV.js"},{"revision":"c8306d12343ddf5d3db19786c6f268bf","url":"build/js/BillsTracker-Bo2Oy99S.js"},{"revision":"098df055b9ff72fc07f055129a6f7988","url":"build/js/Board-GIpPlkLH.js"},{"revision":"9f307043e41d06bb0ac76a23839d8327","url":"build/js/BuyShopItem-DJQPfvIj.js"},{"revision":"9d99d6ff5724501376ac7e24f73f527f","url":"build/js/Cart-CM7lHE96.js"},{"revision":"3a4599e6a9c375f06dada121d552e5c4","url":"build/js/CartItem-CNpHaHnP.js"},{"revision":"861b249ad4636952d974ea85addf9944","url":"build/js/CartItems-CSaOc2tc.js"},{"revision":"73c25e58e735ba2f9f331dda5788e916","url":"build/js/CartListing-TcDZ0pY1.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"d74e37ebc2ede02983e2c54f21fbb0b4","url":"build/js/CategoryLeaders-D2HEACkX.js"},{"revision":"2ead75bffdd39105d7140db41e152e7c","url":"build/js/ChangeCurrency-DF2Ou94j.js"},{"revision":"847d813de28993ad3f3366f74158ca53","url":"build/js/ChangeVat-CnZoQXi8.js"},{"revision":"d5ae57687e76da5cdf6ca21053ebaf55","url":"build/js/ChartDashboard-Bzvy-Plj.js"},{"revision":"82fb9f336db36271d3c13152991f685f","url":"build/js/ComingNext-DrWm0--Z.js"},{"revision":"711e55b249ee8bb54a53dd0326dc6c63","url":"build/js/Comment-BjQx6FO0.js"},{"revision":"2182e157a668c80e04d35327d655ba67","url":"build/js/CommetsLists-C-X3Y_pn.js"},{"revision":"a53e86a721bd107a821203e00accccf2","url":"build/js/ConfirmPassword-DiKhDCxz.js"},{"revision":"8992532d87c0fb2cac669400b3daa319","url":"build/js/Countries-BxBBEKyF.js"},{"revision":"7b9d1be63d589f2cd6739a2ecb230c05","url":"build/js/CountriesShipping-BVDCp0jo.js"},{"revision":"c42fcd6ca7f5d6bb07897751dcd993d7","url":"build/js/CreatorActivityWidget-Biqmn3gw.js"},{"revision":"94162147f30d7d6cd34c2452f60af01e","url":"build/js/CreatorSubscriptionWidget-GCs__0HY.js"},{"revision":"e8ae6f0a5752af85953f71a586f2c835","url":"build/js/CreatorVerification-BLrhE48v.js"},{"revision":"38b58a66f7c5811f46e835521af835e8","url":"build/js/CreatorVerificationNew-yUsnhO2K.js"},{"revision":"dc31d6159469b27ecbffc905bbb02b98","url":"build/js/Dashboard-Be17Ncsj.js"},{"revision":"05e88dca4526b5c2a76dac288079035f","url":"build/js/Dashboard-IAIQyCsD.js"},{"revision":"b8a85369de59bd590f18e855be32804c","url":"build/js/DeleteStripeAccount-C1V1li7S.js"},{"revision":"dc5e2b3867724be2492187b7e7edab22","url":"build/js/DeleteUserForm-Bb96F0eD.js"},{"revision":"0df99ae30bf882e04b9f31463a95ab27","url":"build/js/DiagnosticPage-DQX3fGN_.js"},{"revision":"39a2bfad6480d0e35538db2460f64d78","url":"build/js/Discover-DilOHWP4.js"},{"revision":"4eff2c2b3b1ef548006eee7fb4af3802","url":"build/js/Earnings-Ddx3h3nD.js"},{"revision":"25556739313ef817dd56ec674b2be92d","url":"build/js/Edit-42QgF38e.js"},{"revision":"49ed1b7e3ef033e65a8bc6e442d72ba5","url":"build/js/EditCategories-Cl63wEnZ.js"},{"revision":"674995201d65658d76a8236e777c5c63","url":"build/js/EditMembership-DtiPa0Ow.js"},{"revision":"d7660d4bd6c27fde97d9423270155188","url":"build/js/EditProfile-DYGsf-ao.js"},{"revision":"7b33fddf9f54c01b21f304c1993e2c3d","url":"build/js/EnableCardCapabilities-CpLCh-Zm.js"},{"revision":"bf364a548ba3a352ae70d4b7b466ed2d","url":"build/js/EnterOTP-vo8snqjp.js"},{"revision":"ec432c2ea5c9f57946f4a15e7b2c8cd2","url":"build/js/ErrorPage-BdZOgIDG.js"},{"revision":"b51d0ab46922e8b7d34ad5f845a03bfe","url":"build/js/FAQ-Bejqjx-0.js"},{"revision":"1d61b27cc99001e404d67d3ec1446400","url":"build/js/FeedList-hXHhQIxM.js"},{"revision":"480e2f02b438ea4925f4f163907665c3","url":"build/js/FlashMessenger-6S8aHF_v.js"},{"revision":"9f3c6f8ab20410cc507e9243823d4558","url":"build/js/floating-ui.dom-B2hXPUJ6.js"},{"revision":"ebf452447e8e6add0434ee880ba34aac","url":"build/js/FollowButton-Dgkll1GD.js"},{"revision":"9744171471c02cc83b65d8522e0682e3","url":"build/js/Footer-KQxuy13q.js"},{"revision":"9a5e42c27da9e6bec31da5e0c72946ec","url":"build/js/ForCreators-3uE8jOnE.js"},{"revision":"2cfad7159538287489d06cf324f516b0","url":"build/js/ForgotPassword-RJF8dPEE.js"},{"revision":"98c7e47fbb52506e7b2c01a78a192746","url":"build/js/FounderBadge-BIfb_uXJ.js"},{"revision":"d75f757c52c20ca74575f58ab3b3c86e","url":"build/js/FounderProgramAnnouncement-B2HryLlS.js"},{"revision":"6bc6211ffb5171a1583f6bd239cc276d","url":"build/js/FunPart-DgI_0vDn.js"},{"revision":"d494a5bc02f27dc2602e307b5226dfa3","url":"build/js/GetCart-C_PD6lNI.js"},{"revision":"67a0aa9b448bdf61952a9cea9b3bb7be","url":"build/js/GiftAddCart-DrwkgH_T.js"},{"revision":"bdead58a7637889571844413d568e90d","url":"build/js/GiftEdit-DbVQD4Pg.js"},{"revision":"682a5eab544b9892f9a61b1b2d393206","url":"build/js/Gifter-Kexy5ss9.js"},{"revision":"05acf1bd56b737380c9e7ea7ba95fa66","url":"build/js/GifterCardVerification-BNYhTrlE.js"},{"revision":"2034ba20819169d51302454e511e6b6c","url":"build/js/GifterFeed-DRDTKzWa.js"},{"revision":"9f611e8fe66ac32f499c83ad83b14a02","url":"build/js/GifterItems-BwWHvP7z.js"},{"revision":"df5352180200c8036857efbcf2e81daa","url":"build/js/GifterMedia-DXxT35Go.js"},{"revision":"1a6188134c1e76c9495840e39d74baaf","url":"build/js/GifterMembership-CtJxiLdz.js"},{"revision":"3e420e3c8078f698a79f4fa0d06e0aff","url":"build/js/GifterSubscriptions-DKxqHbWc.js"},{"revision":"78dd19799350b77900ee4baa3f29396b","url":"build/js/GifterTips-B4dn1UaU.js"},{"revision":"cbc1be46a6032eba18169a4197210636","url":"build/js/GiftListing-B1GJ1Gek.js"},{"revision":"76558793a18e1db46042ace9ff16a91d","url":"build/js/GiftStore-Dtx16SrO.js"},{"revision":"af085af1628cea972d8c37315289ddb4","url":"build/js/GlobalCheckout-B27bXu0k.js"},{"revision":"25348cf4d62fc16ef3fc900e311de490","url":"build/js/GrowthTrends-xyW-iVbN.js"},{"revision":"eb08832d09bfe3f28158851a3c6c8399","url":"build/js/GuestLayout-qi5ENJlC.js"},{"revision":"0d2897b7b2ba93e0c7bd3e7d6cc2512e","url":"build/js/HappyCreators-BaYFptYE.js"},{"revision":"02e07bd37c57fe37622d7e71414c40eb","url":"build/js/Header-B0_FQNry.js"},{"revision":"1594ae12d9df5fa97f2ddc9c7b464f3e","url":"build/js/Hero-C7i29o1A.js"},{"revision":"7f1f0cd68bef3b82c58c45a432201572","url":"build/js/iconBase-DxFaYTwF.js"},{"revision":"6b0d2921fd759eac56e402300909c86c","url":"build/js/Icons-DJaADGFK.js"},{"revision":"37398f555986f25d2e43b94f67167f0d","url":"build/js/ImageGenerationWithAI-CpM-J78R.js"},{"revision":"8b8cc8389d87814a070955680615a104","url":"build/js/index-0fTT4ffZ.js"},{"revision":"d4994e7609004a638fcdc63fe5dc7523","url":"build/js/index-B0sJe8OQ.js"},{"revision":"3922d8fa2c597e675e895dcc1a87062a","url":"build/js/index-BhgZJwrg.js"},{"revision":"81289c85e850bf205d0fbd2c0c0ff322","url":"build/js/index-BIFNIt3S.js"},{"revision":"4850a3e4b054ee04a43e222bc73e87e8","url":"build/js/index-BLeXJ5iq.js"},{"revision":"d363a1a8644291365ecb823acf627808","url":"build/js/Index-BrlWy0-F.js"},{"revision":"151c26a7bcf980e085f84f701e7dba50","url":"build/js/Index-BSEyZ6WB.js"},{"revision":"f8c4e0b4a4c771c11824e416c62bc28a","url":"build/js/index-BVok8aXS.js"},{"revision":"bde0aa86cfc83735d2c4f5acde1d969e","url":"build/js/index-Ch0LZPI4.js"},{"revision":"6d325f7e16801f606ec1678ec452aae9","url":"build/js/index-Cxuwe3Qp.js"},{"revision":"a76461d7cfec2b7783f95219817bd9bf","url":"build/js/index-Dbdw0Yx3.js"},{"revision":"5ed89cd206159f6fa774631de51c41ad","url":"build/js/index-DcgL0VYh.js"},{"revision":"bb96096808a9bddc6f275aabb15decab","url":"build/js/index-Deg77_eb.js"},{"revision":"4f1cfab82c3006777587a3ca35fbcf5b","url":"build/js/index-DmznaXYe.js"},{"revision":"22d0cbe708df5a171f86c88bfda0deb2","url":"build/js/index-Dn6b2zqk.js"},{"revision":"92a5a440e3f40b5e90dbfefbd3ac7c3d","url":"build/js/index-DtprzYDP.js"},{"revision":"4cf123f776aaf21fc82502a7b008f899","url":"build/js/index-Dy12LzR4.js"},{"revision":"aa3b7b214e5c1d53755b4e466c6731c7","url":"build/js/Index-EcNvr1yY.js"},{"revision":"3ebe6ecf1050dce6be1c81304200c9ed","url":"build/js/index-HaoUdwuQ.js"},{"revision":"ee073cc0701859c7bee3bbc51dbc7058","url":"build/js/index-PfgVSJNI.js"},{"revision":"f90dcdf70c8ecc174cc400cd5626856d","url":"build/js/InputError-DCyQ2BcT.js"},{"revision":"ea7dc9ee618e5fe1e47f75cc191046a3","url":"build/js/InputLabel-amiGNLZ0.js"},{"revision":"cbef9529a92231dd3675e2f94d50f16f","url":"build/js/IntrosVideos-DBm-uhky.js"},{"revision":"c46ec865fcfab9144ef57c5f249eeb9f","url":"build/js/Item-XDi749En.js"},{"revision":"be19593aef5fd4a600da621eab862257","url":"build/js/JoinUs-oTprGX2c.js"},{"revision":"6d516e367c87d49e28c79587e7d0e482","url":"build/js/LeaderboardStars-BzOV6fUF.js"},{"revision":"2a298469cf7ebbdd8c2a3decbc148d60","url":"build/js/LineChart-qT-Sapyd.js"},{"revision":"5e638e313d39566534e888e9dc515d8a","url":"build/js/LinkTwitter-Cuw9_cJm.js"},{"revision":"0dcc8bd3c21e507f1e47a740bec9851c","url":"build/js/Lists-xsDkvC6J.js"},{"revision":"f83e876ea6936c5d1548f0df04c7371b","url":"build/js/LiveBar-DQEFliMh.js"},{"revision":"1aa9f28ddbbe6ced39d494714db0e582","url":"build/js/LiveBarSection-Vfsf_NfG.js"},{"revision":"51ef961b32c5d76a8de5738b6dec7955","url":"build/js/LoaderButton-BFSoepZi.js"},{"revision":"aa7ad740d80a0b5619c0c6d36c7ebdc9","url":"build/js/LoadingScreen-B0rj6gN9.js"},{"revision":"7163035438cc7caac4737bc648643e85","url":"build/js/Login-8cVM8CQm.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"a1b810cf2e86915ea6e78c37e4f1ac81","url":"build/js/MagicBellNotification-tee07Ycl.js"},{"revision":"417e2715bd24c83b7406c894c8294125","url":"build/js/MagicBellNotificationDisabled-C4gjNiWb.js"},{"revision":"5314d6265631a30a070fb6ac6ddbd1b6","url":"build/js/MemberCheckout-T5XfK6rI.js"},{"revision":"87163db57d9e5f908471205eeeb209b5","url":"build/js/Membership_dashboard-B0VL4sOH.js"},{"revision":"9c47dc325f2673e4e7e78b0557c742db","url":"build/js/Membership-C2b0XQiP.js"},{"revision":"3333b3cefe9986d36d3aa127c4780240","url":"build/js/Membership-YC_syXme.js"},{"revision":"437b00cc63a4c4be21fc3713f645ae86","url":"build/js/MembershipLists-BsJiqia8.js"},{"revision":"935bd55af715833f930a8080e8c0d938","url":"build/js/MembershipsLists-BF_YzSOs.js"},{"revision":"9895c2f97ae87e1ae3623f7556c3e1c0","url":"build/js/MembershipTracker-Dmui-k_4.js"},{"revision":"d0d88ef85adcd527f14e1df08bf07601","url":"build/js/MonthlyRevenue-CXFh_UT5.js"},{"revision":"27ca6c1e1369fa2a511567926fef3a10","url":"build/js/MyGoal-DweHLiTn.js"},{"revision":"ab749089ed5a337d4f68b80e23d4d0a4","url":"build/js/MyShopProducts-Dmwtw3Lf.js"},{"revision":"6327e64ebfee0cfcd9295ff4380fb09c","url":"build/js/navigation-DAqnuXHx.js"},{"revision":"c794385f3ef8a996e6d3c559836d29fe","url":"build/js/Nocontent-CR0tY9km.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"912dba8e94ff055fd55be784c0f6c894","url":"build/js/NotForBusiness-Dr4bPQG3.js"},{"revision":"7ba4c7a39f2615720ce9529275dd83e9","url":"build/js/NotFound-DHbKU3KW.js"},{"revision":"6bd7cee696c78d9d8531f42fed697f49","url":"build/js/OldSubscribe-BSV4_Tta.js"},{"revision":"7477d4eb825ecebceb9d428a617469a2","url":"build/js/OrderDetail-DFBgvCMH.js"},{"revision":"8852370ea247371d7cd1dbdff0ca2ae7","url":"build/js/OrdersLists-BI2p1XxY.js"},{"revision":"8062c63c755c114577a470d44cfa1886","url":"build/js/pagination-EpKTCjss.js"},{"revision":"d46a4f7d3af0e7002300925f48b35714","url":"build/js/PaymentDashboard-CZAKp3nF.js"},{"revision":"930cb77f57f4926e2ffd77ce418e7d7c","url":"build/js/PaymentSlider-BPyB3Nrs.js"},{"revision":"bf551de4572a2547480ffbc017e56d8a","url":"build/js/PlatformAnalytics-BQagbX9m.js"},{"revision":"bc53530a337bc637b2ec3e5181d883c3","url":"build/js/Popup-DPakBu2F.js"},{"revision":"608542eb7e1c292f20beff0763dd7735","url":"build/js/Post-Bd0KYeN1.js"},{"revision":"73d359f1ae9b0fb63d176a17eefa889b","url":"build/js/PostLike-D7ClMM4D.js"},{"revision":"f951a388d52851a332a936cc5fdd5ea5","url":"build/js/PriceFormat-CXPjGbWn.js"},{"revision":"a95d1830a95ef3b2bd87a93d1a25f132","url":"build/js/PrimaryButton-DHdiGqdC.js"},{"revision":"75eed69656daf5111e3a00bb51ac3f0c","url":"build/js/ProfileProduct-HcY_bPpd.js"},{"revision":"9bc6037096e9cdbbe6e4206d1cae4356","url":"build/js/ProfileProduct-RRgIcuQQ.js"},{"revision":"d9e4c0b3efc3a507b6a275934ffb71ff","url":"build/js/ProfileProductLists-J0tL3O_u.js"},{"revision":"b547f453a208d54fcaa4dce09e7a8f4f","url":"build/js/ProfileProductLists-KSgDvLV-.js"},{"revision":"d96a21e7262c5efe61b689c5c3661832","url":"build/js/ProfileSteps-Bc3FOryZ.js"},{"revision":"9a24e10d74a5aa2aee7665bb3f20afe1","url":"build/js/Promotions-5S-bLdJQ.js"},{"revision":"8ef9dd1d7e7b4121829b270fb2d00592","url":"build/js/PwaTest-Dsc49-VO.js"},{"revision":"f664373fc39076f18b5db53f2f3de3b1","url":"build/js/react-select.esm-Dppnj-8n.js"},{"revision":"3a64dfa42449500cc3bbcf6888ced582","url":"build/js/RecentSupporters-Ck_p05F4.js"},{"revision":"35754e60a4d350157628931d5ecaa988","url":"build/js/Redirecting-CXDy7g6x.js"},{"revision":"0629d418871311178f36c0ee61422042","url":"build/js/Register-DrCkwWLW.js"},{"revision":"3593ecbaf9a28ba8080832dc82c5b823","url":"build/js/RemoveBill-ezY-qZKY.js"},{"revision":"70761ffbdd49229421a4a33046bf77f4","url":"build/js/RemoveMembership-C9CpAolp.js"},{"revision":"e08992d8d6732c13bf70a19866ec209e","url":"build/js/RemovePost-qLf5YSkI.js"},{"revision":"105eca766d360edd4b42670a6ee7d385","url":"build/js/ResetPassword-Di9OlPJ4.js"},{"revision":"25fa8999253abd100b8e6d8229cf69f0","url":"build/js/SafeTransition-BI5V_747.js"},{"revision":"9aafc2828fff8064220f1bb4f863e286","url":"build/js/SayThanks-Bskfnfp_.js"},{"revision":"95a8600ee0a446e6548509c01eac87f6","url":"build/js/SecondaryButton-30vY1oYs.js"},{"revision":"cb2a918cf656435f09f859c3058f0eeb","url":"build/js/SendTip-CwFqI_J2.js"},{"revision":"8fd1dfb9919b9a28ae8891d1fb1e6c92","url":"build/js/Settings-Cm9UctJd.js"},{"revision":"2a162df5ceb12c380ba4cf8fe2522850","url":"build/js/ShareProfile-kQECrPm7.js"},{"revision":"c7d496ddebce0d6a545065bc773e8768","url":"build/js/ShopPage-CChqypUO.js"},{"revision":"39e45d04d4ddc8ac398ac6fa0d501b0b","url":"build/js/ShopTracker-DtDZMnVA.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"144975a30cdb13b71543b100ca22eb3d","url":"build/js/SiteSubscription-DWqg5kOz.js"},{"revision":"aa682f010ea29a0a4124835739374f49","url":"build/js/Social-B-ZnAIOK.js"},{"revision":"21608e60ca1659076b2d33b12bf7dd5d","url":"build/js/SocialLinks-aJ-XwTuR.js"},{"revision":"8e2fb768bc2bf15da978ebb60bac1fc8","url":"build/js/sortable.esm-BWA-z-bw.js"},{"revision":"22dc6569882d6df4f80cbf0254cf309f","url":"build/js/Stripe-SRDkhPF7.js"},{"revision":"68fc5e4f4df75b3a3bce7273344a61d8","url":"build/js/StripeIdentity-rO69eQrG.js"},{"revision":"c6d2a17a0ab0ea857876f8e2d48a8d82","url":"build/js/SubCheckout-CoWQgJV-.js"},{"revision":"dc72de0f4ab5783deb183a98d26eb466","url":"build/js/SubcriptionEarnings-CFri_bBd.js"},{"revision":"917ac9de4a39be6711f9e218a91fdcc8","url":"build/js/Suspanded-mX4PvhE6.js"},{"revision":"0c6086ecc95e4bfd08ca45609a4c7f74","url":"build/js/swiper-react-BwsbSL12.js"},{"revision":"2c1e3bb7a2e76c249aea9e4339cd7bb5","url":"build/js/TabbedDashboard-DoMeHsYz.js"},{"revision":"f3dd42f861b615108c2b785362b13ebf","url":"build/js/Terms-BGdm9cPB.js"},{"revision":"165c91024f435640c5ba50a432b99042","url":"build/js/Test-BZK_GIX4.js"},{"revision":"d216b1b7fd1025a86bae5f71b582a4a7","url":"build/js/TextInput-DoQrFCH-.js"},{"revision":"e599b0b18e7ae26eeed7cf2020787608","url":"build/js/TFA-BopvMlDO.js"},{"revision":"35e196d8288c35808ad9f3771d070458","url":"build/js/Thankyou-CQwk5Qwc.js"},{"revision":"d1e867d484529c3602c0d37957643176","url":"build/js/ThankyouMessages-DVyZrJh_.js"},{"revision":"f88aaa9a62cdebb49db778bbcc0865c8","url":"build/js/ThankYouRye-D7RpeoN2.js"},{"revision":"e3f3f8af19743c6388d39db30528a3d0","url":"build/js/TimeFormat-0DRbJhc7.js"},{"revision":"ed0f21e246b81300d92f6ce774ed9e63","url":"build/js/TipInner-BF-sIcqz.js"},{"revision":"b7a514748d601806b3b648bf84376f89","url":"build/js/Tiplisting-BR32H4A_.js"},{"revision":"dd1d71e97dbdc3c72e15e373935b3907","url":"build/js/TipTracker-BieluL74.js"},{"revision":"226ab4bf8523e98b561769ee3638ce34","url":"build/js/TopEarnBills-WZNX7jXg.js"},{"revision":"b9760b63f7810e7c18557038a00d8f91","url":"build/js/TopEarnWishes-C4XOFa0J.js"},{"revision":"3c139dfbc7dac562ae69dde1d3f4f2b6","url":"build/js/TopSupporters-Dco9oeFl.js"},{"revision":"1581b599f2309e4cbff367ef0969ab62","url":"build/js/TopSupporters-UwQoWiqN.js"},{"revision":"f6ba36835584c93eef87c44cef266dee","url":"build/js/TrustBox-D7Ppxpn6.js"},{"revision":"66e020feb4fc9575b27517178729947c","url":"build/js/TweetNow-Bc4a_Zvk.js"},{"revision":"24a81fe146b03033996d91765c701409","url":"build/js/UpdateAvatar-ceE-UlqW.js"},{"revision":"496b3b7cffc9e910b75839c4a290d5aa","url":"build/js/UpdatePasswordForm-BqU-iyU6.js"},{"revision":"f40ee68ba0148a56c03a9bb55b2e0d06","url":"build/js/UpdateProfileInformationForm-CFsdIoMI.js"},{"revision":"1e398b702c255b5e9b06990da51621d0","url":"build/js/UpgradeStripeAccount-BlsHbt-s.js"},{"revision":"f0aeac911e40cf6c7049c211efb8dd69","url":"build/js/UploadcareEditor-DT8bZwf_.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"f75e0f247019509a2a5988ad3ca55a88","url":"build/js/uploader.module-Brz9MP5s.js"},{"revision":"27f6d8b475d25838188f8f73454f1a82","url":"build/js/useDispatch-CYg8WZep.js"},{"revision":"4ece409cc8e11117578c4672df66e148","url":"build/js/UserCarts-BpKp7WXo.js"},{"revision":"71b4cd41a60fd3fd270b5cb74038fe92","url":"build/js/Userprofile-ByjyEEJc.js"},{"revision":"773f346e21ec2d759dbf5f8a30da6641","url":"build/js/USTERMS-BmKDqUTT.js"},{"revision":"aaadaddb4f7ab9230d91d082263d46c1","url":"build/js/vendor-inertia-CpQZyJai.js"},{"revision":"940f9259ac83a3713a7435edcbac9cb7","url":"build/js/vendor-other-Bu4Vbs1B.js"},{"revision":"03f3f7208933fc5e349c20e1c6853e3a","url":"build/js/vendor-react-CVzLKgea.js"},{"revision":"094fbe82153e3bf6efd95170dc9422ad","url":"build/js/VerifyEmail-Bo2zqLYJ.js"},{"revision":"c81a633517597480c3d004665a05a5fa","url":"build/js/VersionUpdate-DiFhlBv7.js"},{"revision":"042f6a5467aca6691adf90706ef76a9e","url":"build/js/VipSupporters-Cfl0wHVl.js"},{"revision":"e28c2bf25a330d2f8a9c9d90ebdc1b1a","url":"build/js/Welcome-COdw4fuH.js"},{"revision":"d41ad2a59ee619a44d016a6a132337ad","url":"build/js/WhyLove-D6aGdBPg.js"},{"revision":"a8616825603f158c243d41911e3d09bf","url":"build/js/Wishlist-DvLR-yQ1.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"08688dbabfc15ea8b2bb732b0c935993","url":"build/js/Wishlistbox-BX8XUaV-.js"},{"revision":"539cc3d3698f530030b1f4cb226748af","url":"build/js/WishlistGrid-B2WZkD0s.js"},{"revision":"a86e1cd08236281b954f51741064ef8a","url":"build/js/Wishtracker-OqLcGUu4.js"},{"revision":"3365e9cc29fbbac22ea407a261911f1a","url":"build/js/Works-fXHcErCn.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
