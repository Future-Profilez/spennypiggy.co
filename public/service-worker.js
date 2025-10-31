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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"757e3fa0ddbb98a15d57f9003f6c1123","url":"build/css/app-B2hJkcw6.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"70a5194b7aa4da0cc0c407891448ad34","url":"build/js/404-CoUxRBTG.js"},{"revision":"a722e718c8cb33ad0326b8325befa149","url":"build/js/Accountsetting-B-pi3TPj.js"},{"revision":"41483adaa377f604f82746a606172f6e","url":"build/js/AchievementSystem-Bugxd_7C.js"},{"revision":"5952ae05aa4e9525aec4d0232170be5d","url":"build/js/ActionRequired-BrhEy_a8.js"},{"revision":"d9ae0280eee15eb74a9bda51ecc8ea03","url":"build/js/ActivateCard-DLuEyWDC.js"},{"revision":"d0dc17001da70336af7b69e56bb955e4","url":"build/js/ActivateSubscription-RjIDjrik.js"},{"revision":"ea6c084aad7a0fa47d3cdafcb0a4d4fe","url":"build/js/ActivityStatus-BRmdCgmT.js"},{"revision":"cff44138ca653fd1bdaecc855ac00db9","url":"build/js/AddBills-CZpT9atT.js"},{"revision":"3e09ce32758dbedbcfbd15031e201d2b","url":"build/js/AddCart-DhgTCIlp.js"},{"revision":"ddebb6247dce1adc0a50548cfc16af90","url":"build/js/AddComment-BWLxiKFA.js"},{"revision":"93c533cdda91bf428d78e1f7ae84475a","url":"build/js/AddGift-D3On3udo.js"},{"revision":"0d1bd34e59d15c601cc272185ddda20b","url":"build/js/AddGoal-B60swDrG.js"},{"revision":"dce2516f81561952807fafa8dd68b4dd","url":"build/js/AddIntro-CHrMtD64.js"},{"revision":"d70da35e61f9926fe45034ff1cd1bdd3","url":"build/js/AddItem-BbhrNf9s.js"},{"revision":"eb1bcaac346a7a09796eacf8567e1e88","url":"build/js/AddMembership-VY0NKfXq.js"},{"revision":"a438afc82b5c115086c8fd5a27fb94b1","url":"build/js/AddPost-BLsN30ac.js"},{"revision":"a284aebda5e6600984136e065d8cfa5f","url":"build/js/AddressForm-BOEQW7Hj.js"},{"revision":"b20ffa4218e5b0f0c2c88c267c3bc2d7","url":"build/js/AddRyeProduct-dBV216q_.js"},{"revision":"41d92dfc656150125a1848efcc89028f","url":"build/js/AddShop--yfKZtpV.js"},{"revision":"0de0d9a590e2099e3cf9bc45b2c221c7","url":"build/js/Alerts-CfHoo01d.js"},{"revision":"7660f6e2d32cb9309eab796ffcdde6d6","url":"build/js/AllCountries-Ck2OnFsZ.js"},{"revision":"67c0182d4e94a07700522ba819eba53c","url":"build/js/AllWishes-BwbHiWwh.js"},{"revision":"8c1dfc7b50cb0d4e30c210c40860ed19","url":"build/js/app-BSIj8ws7.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"296a396cb4b8afa3c46248f7096cc3e0","url":"build/js/AuthenticatedLayout-C7WNGu8M.js"},{"revision":"af03eaa0e4ca8385e3137807fc0dfa43","url":"build/js/Avatar-BZou1zta.js"},{"revision":"0cb4053110ff69d37c960460ec8873e1","url":"build/js/Bill-Oj2J8dJe.js"},{"revision":"7414742b9114a6a167239eefb98aa846","url":"build/js/BillCheckout-CCWIgNly.js"},{"revision":"9d05b2d1e50dd75de4beddff0a43bafb","url":"build/js/Billslist-CoF7I9U8.js"},{"revision":"5243bb4d8ac35d73c73e3bad01e3c2d9","url":"build/js/BillsTracker-fx8eJqiF.js"},{"revision":"8aa97b76a74af809d5264452c0373eed","url":"build/js/Board-Dd8FcRZj.js"},{"revision":"f7cfa09a69b59dcd2636e878409e7109","url":"build/js/BuyShopItem-Ayy2K-iE.js"},{"revision":"f052a7cf8c71a86c64c9d0c401db4de2","url":"build/js/Cart-fmTrVvdo.js"},{"revision":"45f3ff8e4bf070f17c61839e16412d33","url":"build/js/CartItem-vnNcPyBw.js"},{"revision":"9bfca319b6b97ec231c934005811b328","url":"build/js/CartItems-D88aZcUM.js"},{"revision":"95298448f4c56828d93487bca293de20","url":"build/js/CartListing-DSmCA25y.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"dc82a51ea01acc1fef895597a1879cab","url":"build/js/CategoryLeaders-DiC9gM7J.js"},{"revision":"078dc6b7e548963bf14c08aa3780d6d8","url":"build/js/ChangeCurrency-DHNMdYfq.js"},{"revision":"37d37aa327f6e45ba99ef104471850e1","url":"build/js/ChangeVat-DnTUrRf9.js"},{"revision":"f40a9435e5fc3f6eb599b983effa96fb","url":"build/js/ChartDashboard-BsB4oVIq.js"},{"revision":"7139a8b94e7f6f5df00f7d9f7a563259","url":"build/js/ComingNext-DnAKC7k7.js"},{"revision":"3b38a23fd0caa57029c172cc3b340fa7","url":"build/js/Comment-BK9S2I1_.js"},{"revision":"e4934d5ecb8a0fc1efcdfde589774222","url":"build/js/CommetsLists-RcsIR4GL.js"},{"revision":"a4806d69de668cef02ca87d6c9f0b4b6","url":"build/js/ConfirmPassword-DRzkILcj.js"},{"revision":"1de9d3bbb1f56924796e13688bae69a2","url":"build/js/Countries-BsBWaidY.js"},{"revision":"cebda176779563cfa884368f47dcf71f","url":"build/js/CountriesShipping-BFtzjgso.js"},{"revision":"c2a9a1ff7e1a4653036ff150f6b84d1d","url":"build/js/CreatorActivityWidget-BzIDVTeV.js"},{"revision":"5f8c7008897e8fdbd060c5db8c157a99","url":"build/js/CreatorSubscriptionWidget-Yyjmhe-G.js"},{"revision":"ee7d3f97ae8db9bb758175c5ed0d26e2","url":"build/js/CreatorVerification-D0WcAad9.js"},{"revision":"ce359cacf19a1acd6016ab71d1323d9d","url":"build/js/CreatorVerificationNew-IR9Fn2cd.js"},{"revision":"5d11aa806f4bf94dd09553ce6e0eb73c","url":"build/js/Dashboard-bzuUeESW.js"},{"revision":"0c4d2cd63dfab5f79381cc0259f0632e","url":"build/js/Dashboard-C7dgS7fS.js"},{"revision":"4271ddbd566a7cb391b8fc2bcfee9879","url":"build/js/DeleteStripeAccount-C0x4tUsF.js"},{"revision":"579ea883c960112c99008eb8b9de422c","url":"build/js/DeleteUserForm-CajNiwBh.js"},{"revision":"605fe8f559c154d5aa6f3a3b8a50bc0d","url":"build/js/DiagnosticPage-DHVcJVl2.js"},{"revision":"a24738d71d2fc8e5f543f97ebfc27a7d","url":"build/js/Discover-EBtTQ4EC.js"},{"revision":"9b9059323c217c5ebfbe32e81f9a53d3","url":"build/js/Earnings-3V2fBEgl.js"},{"revision":"a33be3c234f5796cb54f475de9ad7b2d","url":"build/js/Edit-DsXBQorf.js"},{"revision":"b84a105cb30bdc1c9eea91547a033086","url":"build/js/EditCategories-DGKuqiUR.js"},{"revision":"7e06fe66ae73c90e38acd6d3c0a75f09","url":"build/js/EditMembership-DgjE5cbA.js"},{"revision":"2130fd76bb9a72b5834d7e6db37d25f9","url":"build/js/EditProfile-DwA1DXlY.js"},{"revision":"bdb7621ac86a15de8b1cbaaf698d78f1","url":"build/js/EnableCardCapabilities-DaFVbMUS.js"},{"revision":"cc340ce9f31fef801f38294123270cb7","url":"build/js/EnterOTP-Cyy09TuM.js"},{"revision":"32438bf22aff07e05808637b3685b42f","url":"build/js/ErrorPage-CUlkyEUm.js"},{"revision":"c216672ec8ea9d71ff8de055e9a95fd2","url":"build/js/FAQ-CIXynuQi.js"},{"revision":"c672dc6d4d32712bb99e03098f851bdd","url":"build/js/FeedList-COjr4_I2.js"},{"revision":"59ec429e0f7bd1cb17163150db36541d","url":"build/js/FlashMessenger-BpC7PkX5.js"},{"revision":"11c93eca6581cc2f699e006147433a5c","url":"build/js/floating-ui.dom-C_Td2r5y.js"},{"revision":"45ae9cccb4e8cb3003fa0e05d9a99994","url":"build/js/FollowButton-BDZ5oqhY.js"},{"revision":"0d8a0f053567f4b73c21c2831e4c7db8","url":"build/js/Footer-4HA3nArm.js"},{"revision":"2ecf283e8907f0e9523f2eae6fd17a6d","url":"build/js/ForCreators-DrCju80B.js"},{"revision":"d1357d844730a999aa7765097b804f05","url":"build/js/ForgotPassword-CRCq3iFo.js"},{"revision":"cb100b39d5a7c1ec968015a2b815af0f","url":"build/js/FounderBadge-ha67Ro-8.js"},{"revision":"b10300343be76c4d38ee9d6942638d0b","url":"build/js/FounderProgramAnnouncement-l00CiChv.js"},{"revision":"037ba57c2c76c36b54c62ab2daca52c4","url":"build/js/FunPart-D0Su-iYl.js"},{"revision":"b04d478d8c2cc98b1074664be25e5469","url":"build/js/GetCart-1hBV9Zbj.js"},{"revision":"0e7d22f57ba118ddf1ab6466fc0c3c90","url":"build/js/GiftAddCart-DWs5vyIP.js"},{"revision":"9e886cb7bd9ebc15d846a28311f23e5a","url":"build/js/GiftEdit-C_utmbNB.js"},{"revision":"aa8dae04860c68e1f245deab7fb21603","url":"build/js/Gifter-BiGSM_pJ.js"},{"revision":"301868c3cb00bd41449ec83aa86be5fc","url":"build/js/GifterCardVerification-Ba_rAawD.js"},{"revision":"d2d990858451d3f93f8275783f3bcea3","url":"build/js/GifterFeed-pLZqcu6e.js"},{"revision":"28b10c8d89be00ded0181e1a6ca04f88","url":"build/js/GifterItems-K7MV153P.js"},{"revision":"86fb5e25bbff3c5fbd0a1d8f1b299867","url":"build/js/GifterMedia-DObBoLuS.js"},{"revision":"5aab561f95287a76ddedec4b3c619fd4","url":"build/js/GifterMembership-D6l1yNrP.js"},{"revision":"3aa8dff882e12bb4a745ca741e4e4810","url":"build/js/GifterSubscriptions-DxJ02CKH.js"},{"revision":"4eecd2a902b1f9609cfc2f0d0c867301","url":"build/js/GifterTips-CYpbkALG.js"},{"revision":"327cccc5728c917a6e1f537f074b4335","url":"build/js/GiftListing-DUV9A7oN.js"},{"revision":"075c7921dceebd1769aaf102000a7e8c","url":"build/js/GiftStore-D5DhM_0C.js"},{"revision":"401a36b28c3c5a2560af44f9f96aa979","url":"build/js/GlobalCheckout-LcsQ2Y_Y.js"},{"revision":"2025105e2c96702a3f305d64e11270b3","url":"build/js/GrowthTrends-ByzTlF8Z.js"},{"revision":"dea4b835b160e9995c200f119ee5e14c","url":"build/js/GuestLayout-K2FmLJ1x.js"},{"revision":"c12f1e4aa298ccc91b442ceb7fe414b7","url":"build/js/HappyCreators-CWmJfYCj.js"},{"revision":"dd4b6de3864491f5802f475661902945","url":"build/js/Header-Dwl1MzO0.js"},{"revision":"95bb6df8e7db1241fde129dfae3de788","url":"build/js/Hero-DNIWCSeE.js"},{"revision":"24092dd14729f5026eb366b0ee175830","url":"build/js/iconBase-B4y3yEyB.js"},{"revision":"6492e5d64c244bb846a42b5646f8d5d1","url":"build/js/Icons-Cf5qpC-z.js"},{"revision":"6acc3bd6521604a185c27bf7221c57be","url":"build/js/ImageGenerationWithAI-BU-UNMYw.js"},{"revision":"8ddcd895af9e9df6c6e6393c856dbaf3","url":"build/js/index-B-Gy34ZM.js"},{"revision":"a8686c4f65b9b3a82c4589e45923fd58","url":"build/js/index-BEscCEby.js"},{"revision":"6e70bbdef4d407be1bf575ff294dc0bd","url":"build/js/Index-BhoJwY9o.js"},{"revision":"e68c9f88ef21253e21f3d9132e195108","url":"build/js/index-BN9cUZxt.js"},{"revision":"19e4c8da3a2287b2d68177edc06598d0","url":"build/js/Index-Cd0svEn-.js"},{"revision":"208dc1ded4daa4f190cbdb1da9411f28","url":"build/js/index-CPgYu2De.js"},{"revision":"208e955fe43725c64e03b8ed82fa3a5d","url":"build/js/index-CR_5N9NJ.js"},{"revision":"0c1451efba19ba445dd5f4dc3c4c94a0","url":"build/js/index-CsIWlz0c.js"},{"revision":"ccf4c3d738e5bbb1a573d556ccdcc634","url":"build/js/index-Cuac-CZr.js"},{"revision":"78e0cecea18a5cf08e35a5adfe8b3dfe","url":"build/js/index-Cw76_luq.js"},{"revision":"e67f48486173d20ccdcf7e5940112d82","url":"build/js/Index-CwjMs1LB.js"},{"revision":"55a0ae0489b2dd7793ee01f15e1bbd5b","url":"build/js/index-DaJ8KCCO.js"},{"revision":"24cb7929605120bae5ab30f73102e164","url":"build/js/index-DDmkWhmc.js"},{"revision":"0bd93849f8c07a6a9b4b10ccf1cb270b","url":"build/js/index-Dqlvz8ZL.js"},{"revision":"1fefc4df3ff47117825f9a8d2f539545","url":"build/js/index-DWP7Tgux.js"},{"revision":"b729f4a293ca243f028c88a829b83bb4","url":"build/js/index-DWzhekCT.js"},{"revision":"651d5ab9ccc487b4c9b8aa7cfd2633ca","url":"build/js/index-E0M4c67F.js"},{"revision":"516284d4db1cd9a62e6193ce7b361e6a","url":"build/js/index-OHt5jKB3.js"},{"revision":"c6b4ba4b6596eaff51bf2a7ef7bae6e2","url":"build/js/index-sCwNmXeu.js"},{"revision":"93978f0a22a972cd5d32efbd8cca2a65","url":"build/js/index-VzG5KlK1.js"},{"revision":"d64393dcd4095c1938a7c2d5593766df","url":"build/js/InputError-uOZx_49-.js"},{"revision":"846b1716134f8bc825f8df2121257d3e","url":"build/js/InputLabel-D1Ti8Tff.js"},{"revision":"63f7603ce75efd364911b62b5c50f7fe","url":"build/js/IntrosVideos-DLzIH3rM.js"},{"revision":"29d6d59fdde3c810318bc6811d276538","url":"build/js/Item-Ds_jiU69.js"},{"revision":"4af02867d122f337f0fb99ef52bce0ce","url":"build/js/JoinUs-CkgW779x.js"},{"revision":"09482976ea580067dbf20ad94ec17a06","url":"build/js/LeaderboardStars-BnomV2jd.js"},{"revision":"fd5e961d287344ee73ef2f92ea031b9b","url":"build/js/LineChart-gpxUeNUS.js"},{"revision":"3e17a10b5c361e79385f7a8cd0c15cf9","url":"build/js/LinkTwitter-BlABRP7j.js"},{"revision":"48ebcb4d87394ab75cbe5cc7213632cb","url":"build/js/Lists-CQN454OQ.js"},{"revision":"6bed0c3dad351f612183e105701bcee2","url":"build/js/LiveBar-C6tYGtkb.js"},{"revision":"483dbec5f3a90284bf2029992eed63b8","url":"build/js/LiveBarSection-B26SdEcR.js"},{"revision":"b09b6ef55d5438f787c38348dc3c2042","url":"build/js/LoaderButton-DnWe4r4f.js"},{"revision":"5c02c22333b3ac5da0b57fc48c82b4e7","url":"build/js/LoadingScreen-CSG4zejK.js"},{"revision":"f6b4cb52d477546084ce1d9735774ce9","url":"build/js/Login-PslFU-Z5.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"0bdcaa36212e9000b5656f1b224437ef","url":"build/js/MagicBellNotification-DfaaW6LG.js"},{"revision":"421eb185e4b2f4319ed790cfc090f370","url":"build/js/MagicBellNotificationDisabled-BdjMVN8a.js"},{"revision":"616c89abb93b42de64bdd220d454a265","url":"build/js/MemberCheckout-DtnrP8Om.js"},{"revision":"a116298485d734ee56de353308bb6560","url":"build/js/Membership_dashboard-E_8bu4zG.js"},{"revision":"7c62ea1570e52a5ac521e33673b44187","url":"build/js/Membership-BR3OCkCA.js"},{"revision":"e4b1686572d374734bcdcd37131fbe78","url":"build/js/Membership-cq0SpxsT.js"},{"revision":"a1a2422b982d0b32f5afe2d0a5084927","url":"build/js/MembershipLists-DzFRyyZd.js"},{"revision":"7a9049c7b2f5c6ac1cf87f1f91f44553","url":"build/js/MembershipsLists-BE9mtDn5.js"},{"revision":"8b56c683c5bee1c53d09d78301fa4034","url":"build/js/MembershipTracker-Sn6Kl2uh.js"},{"revision":"83c95cbb2f78766d7493268b45810d72","url":"build/js/MonthlyRevenue-BpaESDXu.js"},{"revision":"c3279015944d0d36d81a1cfa942ec685","url":"build/js/MyGoal-D_lk-7XW.js"},{"revision":"6c54837fb92f1a4a16450601fedcc3c6","url":"build/js/MyShopProducts-6PnyNslX.js"},{"revision":"c89d97dba3eed7dcac4ec586638863eb","url":"build/js/navigation-DgqEtLHq.js"},{"revision":"25541b2398184af74a7581a0ef1f977a","url":"build/js/Nocontent-C04X-Ohy.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"5a73e50c3c5b8a95c312531098931c41","url":"build/js/NotForBusiness-BtZyZ44c.js"},{"revision":"bc3c3e9aa6c9f330a5fd673d126861a9","url":"build/js/NotFound-B0ejh-Ah.js"},{"revision":"4792dc6edf0403a5027382a8c5a388bc","url":"build/js/OldSubscribe-BJhn6j80.js"},{"revision":"4b2a81ced9688921d04effe2f21b05b2","url":"build/js/OrderDetail-Cb22yo5H.js"},{"revision":"efb6bd2b4c32ced988304e7e599cc7c2","url":"build/js/OrdersLists-B_eK2SLS.js"},{"revision":"7966e56cf923002fb59c91319b3aece5","url":"build/js/pagination-b2YGPHBF.js"},{"revision":"de2e0c3bd3835769b621fdfc47c9b4f8","url":"build/js/PaymentDashboard-dHCqZMui.js"},{"revision":"687963f44026846ccb82426ac9e0c34b","url":"build/js/PaymentSlider-BH3lde6E.js"},{"revision":"2cf1c2cb0d61a4bb3b02d3cffa2a6b31","url":"build/js/PlatformAnalytics-CBNfFDqr.js"},{"revision":"ff62648f84c4f43a58a868023a72d93d","url":"build/js/Popup-DqDpNeR8.js"},{"revision":"aac3ad92044081b9a3f402ed8043df7e","url":"build/js/Post-8bLKkVFS.js"},{"revision":"7d2ac6282fcac76d7b9a022be7f36dea","url":"build/js/PostLike-DCJ6eLz5.js"},{"revision":"b2a36272e8d2a08d8ffdb81f7c209a77","url":"build/js/PriceFormat-QZMH2Jbm.js"},{"revision":"8ff52f55cdae026ea2937abba863a86b","url":"build/js/PrimaryButton-Cs0STT1I.js"},{"revision":"dee4310a7df3724ade35bbe00c71c0b8","url":"build/js/ProfileProduct-CuYajwk0.js"},{"revision":"805416be84f3d5b7308173c57f72ae95","url":"build/js/ProfileProduct-DMjtViuz.js"},{"revision":"b9710579f14907089318faceffda8bd6","url":"build/js/ProfileProductLists-BfMpRmtO.js"},{"revision":"98e4e4c4087b1e7d354d554879af5e03","url":"build/js/ProfileProductLists-CChSPfcY.js"},{"revision":"bbce62d0fde520e0f69ca0eb2d05c20d","url":"build/js/ProfileSteps-B0_kdS3C.js"},{"revision":"5d13ddae45964fe24c7bc824551ea715","url":"build/js/Promotions-Sbz8c2t0.js"},{"revision":"a34c551d257cbd5df914fb223d0df0ce","url":"build/js/PwaTest-anlbsc6v.js"},{"revision":"eda948d9cb6383399d7eddf797604c42","url":"build/js/react-select.esm-BfCpOk1x.js"},{"revision":"b9802a211783bbc58ddf621e4f58da57","url":"build/js/RecentSupporters-BRca3IbM.js"},{"revision":"b1985bf6027a9b34c61d8232e4d24b9c","url":"build/js/Redirecting-DCU9EqKu.js"},{"revision":"2ad198b1397609a25581b8d3a2cd9598","url":"build/js/Register-aXRdfVrm.js"},{"revision":"bc628c91cbb2bde64897241083947a7c","url":"build/js/RemoveBill-snttiSOE.js"},{"revision":"cd3b0d4b65b096066429626cfe93cf26","url":"build/js/RemoveMembership-C81T2wkH.js"},{"revision":"c330c5e2ac56512cd3155aa8a686ac68","url":"build/js/RemovePost-Cx4rIAvd.js"},{"revision":"1f07e1976dcb2f1c6d90120af55910f9","url":"build/js/ResetPassword-Cin2bHGf.js"},{"revision":"c29084977c63d22eb7588642d08e1273","url":"build/js/SafeTransition-97YvvNa5.js"},{"revision":"08800be2f5c14f975a8f931be158b763","url":"build/js/SayThanks-Dh59uLjy.js"},{"revision":"78c61cdbfc92f1bf207ae0669e316163","url":"build/js/SecondaryButton-CnPdsOyY.js"},{"revision":"df0ad9bfac320c136a1d666d74ff148b","url":"build/js/SendTip-D9KIR-Z4.js"},{"revision":"28f4e8f09c09d93afa7b76291e839c8e","url":"build/js/Settings-CovgRZ7r.js"},{"revision":"da9ed4f39df0e8f61ff20e90fefd607d","url":"build/js/ShareProfile-QCXqHvy7.js"},{"revision":"c1240413981fbb82c3b8cf96bb55841e","url":"build/js/ShopPage-M0LMD0TH.js"},{"revision":"25c194979e0a97b50dd4a200f1ac691a","url":"build/js/ShopTracker-Bj7YrGF5.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"44f71c3195cf5a30d0fbeb8b9aa61c37","url":"build/js/SiteSubscription-CZUCexHh.js"},{"revision":"259ebf49110d6c7eae7c883f4590af39","url":"build/js/Social-cmppXYqc.js"},{"revision":"b082201027065f6b050d98b507d1a35a","url":"build/js/SocialLinks-CiDWZkBu.js"},{"revision":"42b83725b9ccc04a2a85d865970c3c8b","url":"build/js/sortable.esm-D8ix2gnL.js"},{"revision":"7b4f3033d3059a5dd3d9d5c59bd4afde","url":"build/js/Stripe-B6bWnlgK.js"},{"revision":"53a2109665b3933243bd5061cc570603","url":"build/js/StripeIdentity-Bg3OSewg.js"},{"revision":"0b02f287d96c293d5797d8d1babaa182","url":"build/js/SubCheckout-Be5GJKgA.js"},{"revision":"3de3a19baf6c2484baa7b3c31a32e361","url":"build/js/SubcriptionEarnings-CJYaT2w-.js"},{"revision":"9335ff428e273c7a2dc28e4baa81ffb8","url":"build/js/Suspanded-DiaVbcQJ.js"},{"revision":"58e4fc4b4ed820eac1da5bda8224f5fe","url":"build/js/swiper-react-DPI5qoQJ.js"},{"revision":"7276d34367a632b30ee0895e33e9313e","url":"build/js/TabbedDashboard-umVC9wEk.js"},{"revision":"b8580f59a32c20a27b5585bb4e25412e","url":"build/js/Terms-7nIP_LDb.js"},{"revision":"9b43da38fe51b0d3f9da33f50228ae14","url":"build/js/Test-aqIP1roI.js"},{"revision":"ee68b42c3c49a8479f6453bce4ae72e4","url":"build/js/TextInput-DPilCDJv.js"},{"revision":"2cdf969a5847f4669d6e2742742f3290","url":"build/js/TFA-B7vVRN0Y.js"},{"revision":"464069922eb416a8142682c4b1f51137","url":"build/js/Thankyou-DdeZzJVK.js"},{"revision":"779100f16eaa36b6691a49d357880f4f","url":"build/js/ThankyouMessages-ivL7aCsG.js"},{"revision":"1040e009817b8615e798d06574625d68","url":"build/js/ThankYouRye-_g7l3Y0B.js"},{"revision":"41665df295c9478e66756bf247631498","url":"build/js/TimeFormat-CmY_WKSG.js"},{"revision":"e49aa1e5a62a8d334a315a276b9997bd","url":"build/js/TipInner-NCag4nZn.js"},{"revision":"a8467199d5b717e0647d41a0cb93eb81","url":"build/js/Tiplisting-DO-bbWAO.js"},{"revision":"6d042407cfd658bf6ab8b3985fa09c2b","url":"build/js/TipTracker-CLObKxvE.js"},{"revision":"95768d09bad38d7aa50d25aa83f81f55","url":"build/js/TopEarnBills-DD-x3S3n.js"},{"revision":"4c56fa004496dc9a6ef1c1654e766017","url":"build/js/TopEarnWishes-xJ5ZMUXQ.js"},{"revision":"8924ae7279ce07bf4e242f8cedee42f2","url":"build/js/TopSupporters-COmhmoYO.js"},{"revision":"d17c64e88273fc669a6569c874f60e25","url":"build/js/TopSupporters-QJjaHbJT.js"},{"revision":"04123cd93f2163cafb004f8eb7d25114","url":"build/js/TrustBox-EcArJEzM.js"},{"revision":"d218ce44b37b48dd9ce25f1de8ca575f","url":"build/js/TweetNow-CBSPlqv3.js"},{"revision":"0c4ee739961fb7a357a3c0219e41ef87","url":"build/js/UpdateAvatar-Dxl8MxGZ.js"},{"revision":"58dd3b0d3343fba92ff18ba252a946ea","url":"build/js/UpdatePasswordForm-BWYlR1LC.js"},{"revision":"d04939463c5526a08ebbb0e624f8255d","url":"build/js/UpdateProfileInformationForm-D64hm18B.js"},{"revision":"c1665e251eef20008a8ba5e2eb712a7c","url":"build/js/UpgradeStripeAccount-3PQ0841F.js"},{"revision":"d179497cf6b50fabbaa177288848e0b4","url":"build/js/UploadcareEditor-DPtymZxJ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"4cce6c763b65bcfc23ad64e0f7637bfe","url":"build/js/uploader.module-BkB-AF0M.js"},{"revision":"fb1af7914b07d765440fe2dcdbc4decf","url":"build/js/useDispatch-LSTf6ptc.js"},{"revision":"577350423e27f2e57a83d81673c5bed0","url":"build/js/UserCarts-DIreMACY.js"},{"revision":"8d070258f456f2cfeb7b96db33ff91e7","url":"build/js/Userprofile-BdJz5AjF.js"},{"revision":"ee3e5e89d9021ef6b6dca89d65138df9","url":"build/js/USTERMS-UzI_voC5.js"},{"revision":"575bb973e9966ca3d8e853f53c9d1035","url":"build/js/vendor-inertia-ConTwdTt.js"},{"revision":"afca34696215c79c40be103752e5f226","url":"build/js/vendor-other-BXhwYdKf.js"},{"revision":"4cf9f74e6c2aceb7c9ff7e6675c8685c","url":"build/js/vendor-react-Dzcdh8Y-.js"},{"revision":"9a969c5e46d68e43682997d8c8a74c41","url":"build/js/VerifyEmail-DKXLSW3M.js"},{"revision":"1561cd30cdfb3641a7b99bb81e3656de","url":"build/js/VersionUpdate-BcxJEahv.js"},{"revision":"dc977d2105994151b1c3b14600266ac2","url":"build/js/VipSupporters-4_n4ZTBr.js"},{"revision":"52f6806b2376fe680b63c1a8d47f876f","url":"build/js/Welcome-CnXkOhDU.js"},{"revision":"990a8630d292e71653c784097f97d166","url":"build/js/WhyLove-B-2v_U3S.js"},{"revision":"aa8d3ab9f134fb369ae88a5aaf69facb","url":"build/js/Wishlist-BoqBmlIh.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"e310b62ba6d546b20a970ee602d66527","url":"build/js/Wishlistbox-DVTu1gyS.js"},{"revision":"e418e926374157936bfe0fbfd017317e","url":"build/js/WishlistGrid-CbcZ5xHn.js"},{"revision":"94ea1c88ef40e2db3610ce66a6b466e8","url":"build/js/Wishtracker-BoCDrmbS.js"},{"revision":"a0447c7d02d9479a9edc0d9b617de710","url":"build/js/Works-zqtGV81s.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
