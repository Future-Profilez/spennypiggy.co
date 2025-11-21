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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"7531a5dd03165d4c1bf3ccd20d444491","url":"build/css/app-DImVvrZe.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"57dd4ad3c641eacc388a1766c03ab736","url":"build/js/404-DYYWCT53.js"},{"revision":"2d92dd05ae279c58ff969ed221937c03","url":"build/js/Accountsetting-CR3wp49a.js"},{"revision":"fb9a47d9a1df189fe175f37ed8622ac1","url":"build/js/AchievementSystem-BnJtKa1W.js"},{"revision":"08089e898565a5f3a88c6823c4076464","url":"build/js/ActionRequired-jJ3l3UBG.js"},{"revision":"61a07bff6d51cb89e2f66a7d43dd027b","url":"build/js/ActivateCard-C6WGF6JH.js"},{"revision":"4b20f849d7d7da336e7a21c13b61ebf3","url":"build/js/ActivateSubscription-j-CnkcjI.js"},{"revision":"e106b650594bd9a3703d814020d8a8d2","url":"build/js/ActivityStatus-CQrhkva7.js"},{"revision":"39760217cf5abb9b628fed26e67a1665","url":"build/js/AddBills-COn7iB5N.js"},{"revision":"6d6ae8d8a28ef833b28e176581681220","url":"build/js/AddCart-MpNQ_GqW.js"},{"revision":"39226e1afe9be89199cccb74bd639ba5","url":"build/js/AddComment-CaAXWD2k.js"},{"revision":"620f4518e2d224e45c01d6babe463131","url":"build/js/AddGift-VJ1I1HQY.js"},{"revision":"e749766adbbbf73ba597baa3f873812e","url":"build/js/AddGoal-gHFE0Ruv.js"},{"revision":"e8eb2622ad617dc8684d49e5226aca54","url":"build/js/AddIntro-Cjd5mcBQ.js"},{"revision":"6c0503cb9235fb16a03dd31484e6a78d","url":"build/js/AddItem-CvqWolda.js"},{"revision":"b29e7a3cfa2deaeb77ca8dfeb91305e8","url":"build/js/AddMembership-D5kKjm-i.js"},{"revision":"44edf5d38f086e6d1206cc6e339dfc43","url":"build/js/AddPost-BIikkPJw.js"},{"revision":"c86d1333543096ce7c74e895fe877d25","url":"build/js/AddressForm-Cdt8Xy29.js"},{"revision":"07b7b4d118aec69a250c0540df315a9d","url":"build/js/AddRyeProduct-BbLwi0s5.js"},{"revision":"99cf7372d078072b1c943f469d384454","url":"build/js/AddShop-BuHZbGEW.js"},{"revision":"67f57c5ef2ddfa60ff5d84001ef1b0b5","url":"build/js/Alerts-BpPBY72V.js"},{"revision":"23cf602d534afcd1c1526b1570743a7b","url":"build/js/AllCountries-BuyPebQY.js"},{"revision":"01f55a0a16b3ec4f076b0ee4c538dca9","url":"build/js/AllWishes-ChvY9FNn.js"},{"revision":"c552f84ae8ee56a446c0f7c2af95b476","url":"build/js/app-_fIEJZ2j.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"004748c23dd571185c67b1e6251ce078","url":"build/js/AuthenticatedLayout-OCzGq3zj.js"},{"revision":"41c9d7af299df6f67cedfdb0f9e63dd3","url":"build/js/Avatar-C74PuhU1.js"},{"revision":"52495a51ce7f5a4b6914d0c15a9ce1df","url":"build/js/Bill-GX9gHsxS.js"},{"revision":"fe853ef563138fdd4c4ca9a38aa9dd5c","url":"build/js/BillCheckout-BLgjPDOI.js"},{"revision":"aebac1149a3918d5783de36e066c6768","url":"build/js/Billslist-BEuNlfe9.js"},{"revision":"a4af67e887a4269a789b57827b85e4f6","url":"build/js/BillsTracker-Do5Py45S.js"},{"revision":"56fb96ab0f162af9cd916b4c7916dd84","url":"build/js/Board-Ct8KezD1.js"},{"revision":"166adba1eb055b7e92f699acb65d062e","url":"build/js/BuyShopItem-s5uDCJDM.js"},{"revision":"1482a9f3add0987885c1f11d73b36a20","url":"build/js/Cart-CrdoXjki.js"},{"revision":"51e81d8c12886f9d6f65d2ccd791766a","url":"build/js/CartItem-C-GtotLV.js"},{"revision":"a0887ee9450e0f228a2a009e25241ba1","url":"build/js/CartItems-B8hRGccX.js"},{"revision":"dfd5d417572660169081edac2070aa81","url":"build/js/CartListing-giGzyYMl.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"a27ebae54004afe73b4f4b97574a7e52","url":"build/js/CategoryLeaders-Dpgcw-LH.js"},{"revision":"644ded740a7fe23e654b29ff69463a33","url":"build/js/ChangeCurrency-BU-xKanL.js"},{"revision":"ed817676d0485cfd18871dcb70f29516","url":"build/js/ChangeVat-BJ_h8hSn.js"},{"revision":"1b0f4bb4b7023d8300c9fda1f53df655","url":"build/js/ChartDashboard-BcJ1ElQZ.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"c71b6a31c24d2bf33c1c35d3111c2b1f","url":"build/js/ComingNext-DcTJwNU4.js"},{"revision":"bcf1fad5830f8e2321b6cb5cd617f618","url":"build/js/Comment-BdR9zbni.js"},{"revision":"af35c1148b065a4445630ce5f47cbc07","url":"build/js/CommetsLists-QDC_D5q_.js"},{"revision":"e9b948f43d3ec800cbbb820b29799df7","url":"build/js/ConfirmPassword-BvD263nI.js"},{"revision":"2ae0ec181c088a9213ee06239035e3d8","url":"build/js/Countries-oRjMwMEq.js"},{"revision":"c97dda0d79875db1393c5657622986d2","url":"build/js/CountriesShipping-BrL6EGKL.js"},{"revision":"9625d8235f3db55ce9571c0825fd86bd","url":"build/js/CreatorActivityWidget-DfNYXYNP.js"},{"revision":"d1711a65db87c70c943baba004794e4b","url":"build/js/CreatorSubscriptionWidget-C-vf4jDf.js"},{"revision":"f144f6b4fe646831be49b53d0b46bab0","url":"build/js/CreatorVerification-CJpDWhMk.js"},{"revision":"8b180dd41aff0cde6c33c0509e8559be","url":"build/js/CreatorVerificationNew-BMvNWIMK.js"},{"revision":"5cd8385451595acab745feab628c2c1c","url":"build/js/Dashboard-Cr90JofN.js"},{"revision":"162b723e6bc313e9f6f84e9da1dc2803","url":"build/js/Dashboard-Deh2TFSp.js"},{"revision":"1660aa352b05cced4050eaa69727e771","url":"build/js/DeleteStripeAccount-CeM9Sqms.js"},{"revision":"9aa823910e3439fec2c10cbc729c6cc0","url":"build/js/DeleteUserForm-B7CzoMuq.js"},{"revision":"ba28aa724b844e5aa72e40bfd60a0474","url":"build/js/DiagnosticPage-DusGyR8y.js"},{"revision":"77c31a75bdf9a13767bb098cc783f07a","url":"build/js/Discover-DDRjHZDa.js"},{"revision":"6a2a7f666bc1cb1e24a5a8e0d6b73415","url":"build/js/Earnings-Bae67l3D.js"},{"revision":"290f23bcc77d8414f32e76a12a0cf341","url":"build/js/Edit-CydmyfMg.js"},{"revision":"4d4f6e948686dc43ee08bb922e4901a0","url":"build/js/EditCategories-BqhRumB4.js"},{"revision":"68356c664b6606e4524f803483d6a82f","url":"build/js/EditMembership-CUb30qbB.js"},{"revision":"e15b2e6322c233c1da116f7f55b9aa36","url":"build/js/EditProfile-BTeOYrkY.js"},{"revision":"d965eee0320aa676d98012740941ea5e","url":"build/js/EnableCardCapabilities-CbTRH-Qt.js"},{"revision":"bfe7172fd8673ff4800f15838279d1fb","url":"build/js/EnterOTP-Cxw7pPn5.js"},{"revision":"365e9b9cd12b836f09d816396d21afcc","url":"build/js/ErrorPage-B03xGBIo.js"},{"revision":"2d08e30f51123d417865e702fad344f9","url":"build/js/FAQ-C4HpV6yx.js"},{"revision":"d5035a2f8be2ede9d4e5f397ebb290c1","url":"build/js/FeedList-_zSxGjHB.js"},{"revision":"ff97f6a32f1d95b94f30246091a0bef6","url":"build/js/FlashMessenger-CCpzjaNO.js"},{"revision":"9bae4bd9ecafb06fd7bffe58200c5a45","url":"build/js/floating-ui.dom-Cb6PNCph.js"},{"revision":"789d5a85c9891582ef4ed07007388c7a","url":"build/js/FollowButton-Y0VRzZe-.js"},{"revision":"b8ab63308bba8dd4e0401a4bd4877c2d","url":"build/js/Footer-qkDHD385.js"},{"revision":"7f519077fc18b45eb73dc9016124bfe6","url":"build/js/ForCreators-CcetXuey.js"},{"revision":"3d09fe48b228efc34dac869109799722","url":"build/js/ForgotPassword-Du4Dd5XC.js"},{"revision":"d0bd29638014d03b2017381e9bcdc954","url":"build/js/FounderBadge-8z3sji_T.js"},{"revision":"b4d88ab9b7cf76046612713817edb754","url":"build/js/FounderProgramAnnouncement-DnGG83YI.js"},{"revision":"898b80ea56f95d66fe75c00090101a1f","url":"build/js/FunPart-CFhr54FL.js"},{"revision":"acd487b0cf87669e7a19b52a0b4cd6cc","url":"build/js/GetCart-CNY0-QYv.js"},{"revision":"ab711e131ce629af87c988b69d1bf3f2","url":"build/js/GiftAddCart-Cbls4GHJ.js"},{"revision":"79b8fc56e3c31f07419524fd7b8d368a","url":"build/js/GiftEdit-BNciLdJk.js"},{"revision":"d0565e88771bbb2a9681a391d037fa56","url":"build/js/Gifter-BPnI_zTu.js"},{"revision":"3a8f4c5ac25493ac1bbfc848b390b0d1","url":"build/js/GifterBills-DL1k-WKm.js"},{"revision":"9bbbff616e30c86c04c0a8ae67532043","url":"build/js/GifterCardVerification-Dv1TCh1R.js"},{"revision":"24573faa6ec5822e1bc31cd741416532","url":"build/js/GifterFeed-CXvWCLOP.js"},{"revision":"57c6bf8bc7728899e6f3fa1509b24d9c","url":"build/js/GifterItems-ARp-gvRe.js"},{"revision":"a2011ec315ef72570d695bda98d1d23e","url":"build/js/GifterMedia-XxBFp2S_.js"},{"revision":"27cbad1b29f3ff66351ad6e7c24bbba5","url":"build/js/GifterMembership-C6TZ24jD.js"},{"revision":"fa9d632df302e5fce1ff6cf1956c3ee3","url":"build/js/GifterSubscriptions-B022sGfp.js"},{"revision":"d571b5480c55dfb3e4211bcd2c8319ff","url":"build/js/GifterTips-yWxtgj4W.js"},{"revision":"4d894bd30bc3917e83204c8adb9e6b9c","url":"build/js/GiftListing-C6YbbQSY.js"},{"revision":"be41cd4eb828193bacf26d9d7727eeb5","url":"build/js/GiftStore-DmVxZB77.js"},{"revision":"b02211ac1a8a7e33e57546a1fad7cc65","url":"build/js/GlobalCheckout-BKDKRvvk.js"},{"revision":"1a729169562927220d4f059e6dd1b3d1","url":"build/js/GrowthTrends-BXZ9ob89.js"},{"revision":"b8e47d58953e0d2c656bbccc4a63f64b","url":"build/js/GuestLayout-Lt-8_BTk.js"},{"revision":"89af319d12070f73bd22f80711fffcc9","url":"build/js/HappyCreators-DroM0Sby.js"},{"revision":"6362559287008930160e153badb1c58e","url":"build/js/Header-0D4e1Tx0.js"},{"revision":"071f2f319c697c9d3b8031e0ff7ca55f","url":"build/js/Hero-B4-aWFAB.js"},{"revision":"afa5a6a5a5b9532c848514e13485210d","url":"build/js/iconBase-B16XyV9S.js"},{"revision":"d1f271ac049e9f4045264d92bfbbea8f","url":"build/js/Icons-DqeAgolz.js"},{"revision":"f768639081dcc6850e591c4e2179efa2","url":"build/js/ImageGenerationWithAI-DwN0znJO.js"},{"revision":"73425856cc257aa2334f50eb41b9a69b","url":"build/js/index-BKdU5Vea.js"},{"revision":"2eb960607bc32894ceef2b4eebbe19ab","url":"build/js/index-BKffxpVb.js"},{"revision":"2da0391e4a78fc96a0676e1ea7421fe8","url":"build/js/index-BYBouZwk.js"},{"revision":"f8d2148ea0011760060225755ee5ef12","url":"build/js/index-C-YVk3i0.js"},{"revision":"5a5a7a8e2e813762b008c2b61114b51f","url":"build/js/Index-C9JFLr42.js"},{"revision":"b394c300f80f4dd7b9bf50efa07deb4a","url":"build/js/index-CD-p0gIl.js"},{"revision":"f61ceba2cb48855f52093e858ceec0e9","url":"build/js/index-CezHjXtN.js"},{"revision":"78895f4f9cdd5ea68ebbb70532b08cd0","url":"build/js/index-CK62UKsC.js"},{"revision":"8da7b0a5ce593baf553c55ee57b6fefe","url":"build/js/index-CMqPovM9.js"},{"revision":"a53a7db48320d18f5d940c963d91b7bc","url":"build/js/index-CVPFEOjm.js"},{"revision":"bfe41810e7f92541986fb176308c2f9d","url":"build/js/index-CxNOlIOH.js"},{"revision":"8364c701e0d04378644aa54fa6039238","url":"build/js/index-DCLpSG3A.js"},{"revision":"379f911a3fbe8d897eaddfddf122476f","url":"build/js/index-Dkl6KB6b.js"},{"revision":"daf69c42c6e33be8415961f9882647b0","url":"build/js/Index-DSSrG3n5.js"},{"revision":"a15583534c4b76aa504618bd87c7ac00","url":"build/js/Index-DYlmTbJk.js"},{"revision":"67a9daba00ba4833207a1e407353277b","url":"build/js/index-DZ0scL8-.js"},{"revision":"16284e7886918607d103fbc9cfb0491c","url":"build/js/index-e6Q9DNJ4.js"},{"revision":"b84fdc2ce7debac0b7ba596254f19435","url":"build/js/index-njnZXFlN.js"},{"revision":"353d69b107eb574555b8d8d665bd4c52","url":"build/js/index-UOsrMyi4.js"},{"revision":"4be1cec21ad323f5d6ee985a6e8adcdb","url":"build/js/index-VYfwTA0A.js"},{"revision":"85105c28930daa4d324e241aadcceead","url":"build/js/index-XHtbuidz.js"},{"revision":"440d05e2c124fb5f984f46f4d6987ff3","url":"build/js/InputError-gn1U4C8p.js"},{"revision":"0ee9f2a416793fc9f8774543adc70c14","url":"build/js/InputLabel-nnndeUk0.js"},{"revision":"e3c3fb4fcee287490ffd04a196c538d0","url":"build/js/IntercomDebug-DmmHNUI7.js"},{"revision":"1dc73a09e2efaa165e23a168956d97ec","url":"build/js/IntrosVideos-CvX_8rY-.js"},{"revision":"34f1688964ba9025d614f1ed29317eb9","url":"build/js/Item-DHCW3m9C.js"},{"revision":"22f9eed980313632a2d0493c51a4bdf3","url":"build/js/JoinUs-22wqP-3-.js"},{"revision":"f14369e1b60b4faac6be37430a859d6b","url":"build/js/LeaderboardStars-Dr8dA01C.js"},{"revision":"ffefd999646197ac31506a0a426b4ba0","url":"build/js/LineChart-PweKODsZ.js"},{"revision":"d18f847dc310754df7f489e32ea0785f","url":"build/js/LinkTwitter-jfTOImjl.js"},{"revision":"c6b6c0916949162b3c91c6d7dbee10d3","url":"build/js/Lists-DnYepgSh.js"},{"revision":"0f969b17718e1eb5060ee92756e319e5","url":"build/js/LiveBarSection-BY0h4fIa.js"},{"revision":"55a068daa9aeeaa9aa90fea26d886daa","url":"build/js/LoaderButton-B2CYW-W8.js"},{"revision":"f1e11845d51dcdd51e53b8caee10d109","url":"build/js/LoadingScreen-Y3935u-F.js"},{"revision":"781df12a8129ded989a4837d8b10f2d9","url":"build/js/Login-NVdoSbPx.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"7fc1f8b2aae16cb0a693bf7fb1ba9f60","url":"build/js/MagicBellNotification-BIXWr1xa.js"},{"revision":"d7e3b6440f5336cbf017bb7bbe142572","url":"build/js/MagicBellNotificationDisabled-Cd2VR9yC.js"},{"revision":"1a0a96390b45213889c354854aceaa65","url":"build/js/MemberCheckout-BUTnZ5jl.js"},{"revision":"31ed38f650742c68cf70c1b9a89031be","url":"build/js/Membership_dashboard-NwbRP59d.js"},{"revision":"206168f41d6105ec7118cbacefaafbb6","url":"build/js/Membership-BuEAbxao.js"},{"revision":"7160706ffc2a77f4fc9a4d8442255bb7","url":"build/js/Membership-DN7gvpas.js"},{"revision":"dafac25dc58c7d71b38872ae3748638f","url":"build/js/MembershipLists-Dci_n8JC.js"},{"revision":"e08623bdfc61b06fb2c3c80293ae8c6f","url":"build/js/MembershipsLists-CaQxNtUO.js"},{"revision":"9dbadaae4dfe0a9319d37ac6b3d264e8","url":"build/js/MembershipTracker-FyO6U__Z.js"},{"revision":"7b61b2bf900379fdacf0b8bfaf60c8ee","url":"build/js/MonthlyRevenue-CwuviK8v.js"},{"revision":"a89e78ea071887bdb3aec3c78495f6ad","url":"build/js/MyGoal-DwgmAAVy.js"},{"revision":"b14b2298a3e06a86e9defccba521c220","url":"build/js/MyShopProducts-BW7vnCbb.js"},{"revision":"f1f0ed67a0e6cd96723ad4cd85a35b47","url":"build/js/navigation-LYcIpAZ6.js"},{"revision":"9bf64f14f3c34133eba90b865729ecae","url":"build/js/Nocontent-B73aslnt.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"b70a0ae38a99135d64c45611b8cd6132","url":"build/js/NotForBusiness-CiJyDVEj.js"},{"revision":"e38ce0e924c37d399ad451ce4b6a0d91","url":"build/js/NotFound-diXQKcZH.js"},{"revision":"cab1f4905c8d1719c2f885d93b32b22f","url":"build/js/OldSubscribe-CTv_LNcB.js"},{"revision":"d98f006e46783fbcd40e74f2a1996b28","url":"build/js/OrderDetail-D10-jXv7.js"},{"revision":"9cc5e091ebcf856fe4752a492bb40b75","url":"build/js/OrdersLists-5onEE9we.js"},{"revision":"0d346ec5f232a07b6f9861527e62e896","url":"build/js/pagination-BEg3ZeR8.js"},{"revision":"cc3e5e3ba8c5e2144d14a4ed7e9cf276","url":"build/js/PaymentDashboard-Bdg5nfja.js"},{"revision":"f6b6a0ccde914bbbf2f64303bf66b1a8","url":"build/js/PaymentSlider-CTxyi_LR.js"},{"revision":"4bf427656bfe3dca291caddfb184ae99","url":"build/js/PlatformAnalytics-OuY60Amz.js"},{"revision":"ba11634189883aca2b5a7e7b7eacda9d","url":"build/js/Popup-PyYJ9VEk.js"},{"revision":"0fc17c2004c72af422f85fb20c074c5d","url":"build/js/Post-CqBiZfGK.js"},{"revision":"9d8f4a7369d564af5560f288bd3b3c58","url":"build/js/PostLike-D6y0ieEc.js"},{"revision":"1377b9e310ac8e46662d34d69813e86f","url":"build/js/PriceFormat-GKHQ_mCl.js"},{"revision":"8a19921402474040fa81fcd555ba53dd","url":"build/js/PrimaryButton-Dh8nHFV6.js"},{"revision":"80d448d8f4a5095eb7ddbd65ea661cf4","url":"build/js/ProfileProduct-CRGKRLdE.js"},{"revision":"786a7b2fa8a09faeacc42a372e4fe7bc","url":"build/js/ProfileProduct-qfWnbEeu.js"},{"revision":"a6d88cb6c8ae2c2fdec53d2527d4a422","url":"build/js/ProfileProductLists-7fSD3nT3.js"},{"revision":"1e18399466d2565de4cd78b63927eabf","url":"build/js/ProfileProductLists-DaL1U_1T.js"},{"revision":"901ab481e2cbb8285f6c9245522bd760","url":"build/js/ProfileSteps-B7x1l2lq.js"},{"revision":"1f0abb19590e37c8f09acda8d77c20fe","url":"build/js/Promotions-uPLyHwWe.js"},{"revision":"385e5979efff7d787d788f22f9c53921","url":"build/js/PwaTest-B76c_NDb.js"},{"revision":"07669c32fe6142e32cb7c35654a41a01","url":"build/js/react-select.esm-D2lbaaO_.js"},{"revision":"09427189db33ba03c348433d54c4dcaf","url":"build/js/RecentSupporters-CNSqZ_I-.js"},{"revision":"fa366e477cb4800827e16d0eeb1f3d09","url":"build/js/Redirecting-mBV4uwZO.js"},{"revision":"d338d11e08eebd442b636f2f8bcd9d32","url":"build/js/Register-CpjrvZBC.js"},{"revision":"1b843c15d0b3d0d4b8daa98e8a8bf9e7","url":"build/js/RemoveBill-BhsUg_-8.js"},{"revision":"a11459ea7d855e4e88a9684970cfd5c7","url":"build/js/RemoveMembership-BRi0XNqy.js"},{"revision":"55f5183075f77d37a60bb8b4a68c833a","url":"build/js/RemovePost-DwOmn7dh.js"},{"revision":"7317bc1b5ad0e4cec355a24f56fa0f11","url":"build/js/ResetPassword-DFyakyqi.js"},{"revision":"f9f726b177a5787961fcbb8ca3659b90","url":"build/js/SafeTransition-BytvVhq9.js"},{"revision":"4a611dbd6d07171857ebb9038c54aabb","url":"build/js/SayThanks-eqP5DngO.js"},{"revision":"922a661b9fb638d4ce04e2bcb842dfa4","url":"build/js/SecondaryButton-Cv2l3SBd.js"},{"revision":"0a26716f898d2bfe76ce69a7504bd25d","url":"build/js/SendTip-BntzrMfr.js"},{"revision":"b28486940eebb4683543bc97335fc2e3","url":"build/js/Settings-D4ayyq4l.js"},{"revision":"04cc152722581cb750bbfee7bbe5a1da","url":"build/js/ShareProfile-C4bAh_W9.js"},{"revision":"24fb99707d721f6a04fdfee8c807b91c","url":"build/js/ShopPage-4LxKIiEF.js"},{"revision":"4eb8cb7751d62e32c0b11a1217a6c711","url":"build/js/ShopTracker-D_isUxvo.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"d53c14f142bb3976d7a6cc0f1b3e9d0b","url":"build/js/SiteSubscription-BDh3H9kR.js"},{"revision":"0d266587178aca429c15b3d9c9c057f9","url":"build/js/Social-h-iuyYJq.js"},{"revision":"dc410c961783b8b11a1dcd42ee6f806d","url":"build/js/SocialLinks-KBYoz6sF.js"},{"revision":"01d8e99052dbc8352d0357c6c823db21","url":"build/js/sortable.esm-C-3UrZGd.js"},{"revision":"3a41bab1aa5103b0736f8fb0be9d386b","url":"build/js/Stripe-Cf-D7cu5.js"},{"revision":"49d10ae88dc5fa59fb4854eb86dd6f8d","url":"build/js/StripeIdentity-DZ5CGeJq.js"},{"revision":"28a2ef52383483cf6f572017634051cf","url":"build/js/SubCheckout-DDuqVFuo.js"},{"revision":"29da02546246d11e9ddf01345bcadae4","url":"build/js/SubcriptionEarnings-DH-IFq9V.js"},{"revision":"8c3991fd8c997da374f8cec6727647f0","url":"build/js/Suspanded-CiOXgJXY.js"},{"revision":"c648a9f001793fe3eb89941d2380c998","url":"build/js/swiper-react-BjPFVHBI.js"},{"revision":"946d45800a1d01849c8f87a4a5b55b31","url":"build/js/TabbedDashboard-5iexkwy9.js"},{"revision":"606e476f438817ac3e7ac60ae54b2121","url":"build/js/Terms-CgWuaiP4.js"},{"revision":"9aa5c496c829f074e6cce6087ee74491","url":"build/js/Test-BcQiYIQ0.js"},{"revision":"e88909025600868cddaf8eccdaf22013","url":"build/js/TestIntercom-BSqr1QKz.js"},{"revision":"c20d0c8cc01b8a8d7e8c041449572037","url":"build/js/TextInput-DRB-dO8Y.js"},{"revision":"92cd8efadd9f7125f32b6a98168dd438","url":"build/js/TFA-BPVZ4GLV.js"},{"revision":"bddc1e9369aacd831d39214b195d289a","url":"build/js/Thankyou-CAz5vewF.js"},{"revision":"a9e5dcab187a73c6ee145a2caca1e1f6","url":"build/js/ThankyouMessages-D0WjAEnv.js"},{"revision":"b65ca6bf4d57a0e43cabb43680ad5ba0","url":"build/js/ThankYouRye-CKhe_09O.js"},{"revision":"813ebd679968e2be3db0b6304844251b","url":"build/js/TimeFormat-D3fP3rsz.js"},{"revision":"7f1affe69c00ba180e10eb17dc1f3345","url":"build/js/TipInner-BIk_xaj-.js"},{"revision":"06411c824647d212069c6b0d6b60f1bd","url":"build/js/Tiplisting-xTV1O6KR.js"},{"revision":"8399ce54af87725c013f6c7574b89116","url":"build/js/TipTracker-BnLcs3v6.js"},{"revision":"9b8c9524e91baa8bf7886e93f6b23cc3","url":"build/js/TopEarnBills-B32tsIai.js"},{"revision":"7f3ff649a1d2639370d76a8027b9acce","url":"build/js/TopEarnWishes-DzGFc4g-.js"},{"revision":"6c0a5949daa387c1fd4610d15ba881da","url":"build/js/TopSupporters-BB_R5Ky1.js"},{"revision":"576fdd22010487c476e641a1d75a5bdd","url":"build/js/TopSupporters-C7MT-W81.js"},{"revision":"76982281a5a6c5b6a29116181db45e9a","url":"build/js/TrustBox-DfnMRGvw.js"},{"revision":"3384d329de4ffc27e5ba825b5dfe1e44","url":"build/js/TweetNow-DcsHURo5.js"},{"revision":"0804227d0af55edfa23a1c422f01f614","url":"build/js/UpdateAvatar-B12sBhrB.js"},{"revision":"609f4e69ab4e5a4e4ddc6e2afc3dbd9f","url":"build/js/UpdatePasswordForm-nBsoVAq3.js"},{"revision":"1ea9a8f1e85f102a1a240be39b820f23","url":"build/js/UpdateProfileInformationForm-CfcMpo4q.js"},{"revision":"4b3accce4797b7c0e9b6d32b2a9ad9f5","url":"build/js/UpgradeStripeAccount-JpA_1tid.js"},{"revision":"9cc0134ddef263957b678c4e36b9f866","url":"build/js/UploadcareEditor-B7n6dgpo.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"6b6f6c66e90971624d1de7950d87122c","url":"build/js/uploader.module-BBVTH-bf.js"},{"revision":"a4239dda0bb65c38e686469b9a0f297c","url":"build/js/useDispatch-CBzr2Qf2.js"},{"revision":"f59043c52689f88fadb7c0f1cb3000e0","url":"build/js/UserCarts-CsSiTqGZ.js"},{"revision":"00a6af651845f3b7b1155676b3ac4db8","url":"build/js/Userprofile-C6cD3oUd.js"},{"revision":"f5eceec2c85973a3d71ca610dd5fbbe6","url":"build/js/USTERMS-BpyvWjT-.js"},{"revision":"fcdaf8371d84294045052272bfcbd0d8","url":"build/js/vendor-inertia-Dj0BMCLK.js"},{"revision":"5b3f17a919208d433e460c8372c52900","url":"build/js/vendor-other-2Jl14Elu.js"},{"revision":"98171f4c030bc88174ccd2876cf98acc","url":"build/js/vendor-react-HXbQ58lr.js"},{"revision":"5a5395ce2dcc0501263b179aafd27190","url":"build/js/VerifyEmail-DIDqQIBl.js"},{"revision":"792655272e49ad228f38bdcedc5efca4","url":"build/js/VersionUpdate-iyvGytXT.js"},{"revision":"32ac6875b82d4ed7e19906cb8f8f6949","url":"build/js/VipSupporters-DrCKgh3Q.js"},{"revision":"41bc55a0f792fc4d8a9138fcaabbed89","url":"build/js/Welcome-BQZvf4uW.js"},{"revision":"fd176019ac8390492f5f9f0bd02562e5","url":"build/js/WhyLove-CowQ5uVa.js"},{"revision":"64ac170eb066fb8c1911213446a62e7d","url":"build/js/Wishlist-DPa-dxEf.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"602d419f9f6c99a2845e62a772fa0311","url":"build/js/Wishlistbox-BJyKwLrs.js"},{"revision":"da3a576efe34eea331caaec9e74b5647","url":"build/js/WishlistGrid-BvoCTP9_.js"},{"revision":"d338c692b75e3c0a08a85c2f12a3951b","url":"build/js/Wishtracker-DNPdqQkq.js"},{"revision":"ed58e18280c48250a7a387e8387d72a0","url":"build/js/Works-DmxyIj8l.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
