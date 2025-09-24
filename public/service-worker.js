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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"59724508c66fa401f732a742419fc85b","url":"build/css/app-DXUvn59a.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"1b00e09b1e97408c4848550c9c92cfe0","url":"build/js/404-XyCLsrS6.js"},{"revision":"761c89255e5c2f0eef06c7d061052fea","url":"build/js/Accountsetting-lmbcHlKH.js"},{"revision":"3aa05da08976e8806a5b6e1fe570c397","url":"build/js/AchievementSystem-CaPQgMcI.js"},{"revision":"defb9828fae52f3bfa944fb78f5038b9","url":"build/js/ActionRequired-BPhatATm.js"},{"revision":"da04e16f7f1dfe5a08ed51de69943bed","url":"build/js/ActivateCard-DmHHiyFc.js"},{"revision":"41c0653e3cfca7eb7728f4e1bd1b567b","url":"build/js/ActivateSubscription-CsCDZalY.js"},{"revision":"98dc4536db34acf6fb51fc4e06b051fe","url":"build/js/ActivityStatus-CBUFSr9R.js"},{"revision":"416b1e4a5f60b3cce8ada524516eb7d8","url":"build/js/AddBills-C4e3M-hO.js"},{"revision":"922a7a1b69f44a49e5a8db70ab318faf","url":"build/js/AddCart-D2dUOx4v.js"},{"revision":"a3afdf71acc7f05854a93e5b792318de","url":"build/js/AddComment-Bz52artF.js"},{"revision":"fd5ebff257278b18f246196642c942c6","url":"build/js/AddGift-C26H-128.js"},{"revision":"49254fa53e5520cd8165ca6b982bd23d","url":"build/js/AddGoal-BrcEy6kR.js"},{"revision":"bc2a14e63d6f880662414d03aa3b6ba7","url":"build/js/AddIntro-Cj0BBUXY.js"},{"revision":"4894e34e4c669005412f9efa9b59f774","url":"build/js/AddItem-CZNsCNAb.js"},{"revision":"c81eab7dcadd3fd6cf1da97c7cb37dfd","url":"build/js/AddMembership-Clzw9Gzy.js"},{"revision":"c70a1635c7790078ebd0c809c96a92a2","url":"build/js/AddPost-DEh-7ghI.js"},{"revision":"f08be3aa006178fc95ec8a07a5791f56","url":"build/js/AddressForm-D2sifDOq.js"},{"revision":"29ed9fa221027eb7a6c06af95d1fe5ec","url":"build/js/AddRyeProduct-DKOmh2dx.js"},{"revision":"573ec7107ebc5180f4e176e184803511","url":"build/js/AddShop-ByFJ8N2k.js"},{"revision":"08f65abeffa1d3d387a36a89b0b4d3ee","url":"build/js/Alerts-UK3_pxxV.js"},{"revision":"7001c41f8836aca01480c627022d6d33","url":"build/js/AllCountries-Ck7B5wh5.js"},{"revision":"73da4aa21df6f58d58f8abf4fbe0ec23","url":"build/js/AllWishes-B5SL68ms.js"},{"revision":"960045792ce5c267c579a7d6bc341d66","url":"build/js/app-BdLFwVb6.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"2c2481a37d67dbca88c56209868eee58","url":"build/js/AuthenticatedLayout-CT8Og6ir.js"},{"revision":"2360eb24cb0988af6901f31e4e688846","url":"build/js/Avatar-me135eAI.js"},{"revision":"2e91162960925c7fc7e809287018c616","url":"build/js/Bill-DGxonA4b.js"},{"revision":"d3766016f46d04bdd6511635e09e8482","url":"build/js/BillCheckout-DttbvfzS.js"},{"revision":"2dac9dbb59d825898448fb4cbfe55ad3","url":"build/js/Billslist-RDkmHLwu.js"},{"revision":"3f01d55ce582ea697d115880ecda548e","url":"build/js/BillsTracker-D9886ai7.js"},{"revision":"ac7c15e6744297f0deffc42cf4954e16","url":"build/js/Board-DHKi1ehF.js"},{"revision":"a97bbd3ca7c94385a26c8903be684484","url":"build/js/BuyShopItem-DayypznP.js"},{"revision":"d52d3cf76969e793e2e7b220ce90b10b","url":"build/js/Cart-C1NuWKZB.js"},{"revision":"085b8ced9fab74c05c95e3be50a0225c","url":"build/js/CartItem-BAI2I_qa.js"},{"revision":"c4d7a2aa2c143a4fe195fef9928f5da7","url":"build/js/CartItems-UN-91r--.js"},{"revision":"4151c47d30bbd4d5fea6c508c7f016c3","url":"build/js/CartListing-Cg-p9NVX.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"056e6eb864d9ad3b83c339c28c3913c1","url":"build/js/CategoryLeaders-D_nj1hbN.js"},{"revision":"8c4e90ee393b46d25334095692eae88c","url":"build/js/ChangeCurrency-Istkf9Ga.js"},{"revision":"5ecb465fcaec45b64dfcacde33fb37e1","url":"build/js/ChangeVat-BmYIBNZK.js"},{"revision":"ea745ea6cd0bf81472b3589ba7f112e7","url":"build/js/ChartDashboard-DIgdRDUf.js"},{"revision":"2c8acdfa690260a8c7186aeac7a2ce30","url":"build/js/ComingNext-BDQLgA3J.js"},{"revision":"22be162b2260a73eb08c4f3e61240a11","url":"build/js/Comment-CMnUgK0G.js"},{"revision":"41629d4ebb865a0c4ea435ed9e5b7f9c","url":"build/js/CommetsLists-DjnTrdpX.js"},{"revision":"f1ea1be27772b442d4a8c3e2fd0e9240","url":"build/js/ConfirmPassword-C188vv4y.js"},{"revision":"e53ba35d438b01d539612dd891edc5df","url":"build/js/Countries-c6kFgjZL.js"},{"revision":"72747e409ab5bab55fb2fa86c5588982","url":"build/js/CountriesShipping-ClYu4l-o.js"},{"revision":"8bde75406eadbf8e08c6e41dff0952f8","url":"build/js/CreatorActivityWidget-D3_DpiML.js"},{"revision":"362c8f03268b483e5737f86542a265d7","url":"build/js/CreatorSubscriptionWidget-kHH8ZGzF.js"},{"revision":"45d85c8941d7eff99897b6536bdc675f","url":"build/js/CreatorVerification-DZs2hTR1.js"},{"revision":"9b68c3d3e0db396d7f4c6ae75719c1d9","url":"build/js/CreatorVerificationNew-By-Zgyip.js"},{"revision":"387359a7802d76dafe041c369fb23448","url":"build/js/Dashboard-BJ6Gjtgi.js"},{"revision":"122f6ae374ace61982e7a5ccb38025ef","url":"build/js/Dashboard-znQzi81D.js"},{"revision":"516879f7828708048393422df87da841","url":"build/js/DeleteStripeAccount-BFUT_GRw.js"},{"revision":"6c1b8bcb99d9f2177f8a6d82cc3f3c58","url":"build/js/DeleteUserForm-D9pBDrnm.js"},{"revision":"058f101921b6dd054ed1fa13dade679f","url":"build/js/DiagnosticPage-Cta7pEKg.js"},{"revision":"f68e0c4f6fc6938719bf319d3d10a8b7","url":"build/js/Discover-BPPP6Lzh.js"},{"revision":"233e76dbcbf5cb83d3a563112acefcb7","url":"build/js/Earnings-DfXS3LSf.js"},{"revision":"4f5e9840ebe3c434a9f9363629f74256","url":"build/js/Edit-vk2zoY2i.js"},{"revision":"cfba1e03e313a0c0ccb16bacdf29db89","url":"build/js/EditCategories-mimuI85E.js"},{"revision":"097aedb3687de94ff2446a6e835e9598","url":"build/js/EditMembership-BpBu5NZg.js"},{"revision":"eb247ec658574ef5b99894a7e1b1ecce","url":"build/js/EditProfile-cqbM5HDx.js"},{"revision":"484dcd4266bdc2c7b580d750bc498df2","url":"build/js/EnableCardCapabilities-g93nu4ve.js"},{"revision":"2efc9faadbbe99ce2057d3a8bc9c840a","url":"build/js/EnterOTP-DgBxnfyR.js"},{"revision":"8cdd2bad1a8230fcfa92f3b041c1f63d","url":"build/js/ErrorPage-BptIxRaE.js"},{"revision":"585e4653183eee3f833394f1d31f73b2","url":"build/js/FAQ-DBITRgP1.js"},{"revision":"cbfe07273aefea4be450189f90576153","url":"build/js/FeedList-B6uxEbBO.js"},{"revision":"dfc14ec7d676bcf035f0dc5f4a11babd","url":"build/js/floating-ui.dom-fMU5dBXD.js"},{"revision":"9efc467a82e2dbe9c63467c74a46626d","url":"build/js/FollowButton-k_yczqBl.js"},{"revision":"ca983a925d0670aacbc2137a27049833","url":"build/js/Footer-v5lvixUy.js"},{"revision":"702aa877e37b2a21d39f85aa0cb53d0f","url":"build/js/ForCreators-6nyS2Zwb.js"},{"revision":"d30f33f2b3829b6eff3bbb39ae023410","url":"build/js/ForgotPassword-CGe9LGfb.js"},{"revision":"df99e0959dc6a317f29fc366475d08a6","url":"build/js/FunPart-D-nPPUt2.js"},{"revision":"fabfdc927dd9d5488498c2f3c1bd5292","url":"build/js/GetCart-BxVihViY.js"},{"revision":"e0004008b883ce17f0787f7ddf0eb85c","url":"build/js/GiftAddCart-DmDVPvzf.js"},{"revision":"d24b29a527661e866c0ae12bd90482ed","url":"build/js/GiftEdit-D4HhSxld.js"},{"revision":"f4481763125cfb408c9ce7ba8d4a2b09","url":"build/js/Gifter-CNAgnqfj.js"},{"revision":"3aeb1ab2a06199218ea99c4c064ab8f1","url":"build/js/GifterCardVerification-C41j7uQl.js"},{"revision":"47406e533db8a86fa7d5a7bd023577ba","url":"build/js/GifterFeed-DqzdMniF.js"},{"revision":"26001b3d95080931e1af137f82830856","url":"build/js/GifterItems-CxRTk0w0.js"},{"revision":"6b74e5a8976429583b1b5a7d9bc2aa60","url":"build/js/GifterMedia-D6_Vtvig.js"},{"revision":"e56697dd8546fb877e3db7585bfb882a","url":"build/js/GifterMembership-C6oPR9uj.js"},{"revision":"23c6001e516501b9f2811f81c1538a94","url":"build/js/GifterSubscriptions-u3qj4QpO.js"},{"revision":"c7bf032cfe7a2104cfe73fe2338e0841","url":"build/js/GifterTips-G1SfIGhP.js"},{"revision":"5cacdd8509c9caa78348c645c4744f16","url":"build/js/GiftListing-CF0u7myi.js"},{"revision":"db3300a28c42f393ebfb3fbf04332426","url":"build/js/GiftStore-CcwTNEI4.js"},{"revision":"44b94fe9037fe34c7d5842c022bd4f47","url":"build/js/GlobalCheckout-9yLl7-qH.js"},{"revision":"18a787654d0a6b1131119b42454cb6cf","url":"build/js/GrowthTrends-CMpXgs-h.js"},{"revision":"b68f3beebbeb2408d7ba50820cb01203","url":"build/js/GuestLayout-DQz7WtgG.js"},{"revision":"8fbc2b53ab4908d306dabb373d2d4d9f","url":"build/js/HappyCreators-CVQImgpL.js"},{"revision":"b27e86e1be88c6c4b7a9841e12e33433","url":"build/js/Header-CotGzZL8.js"},{"revision":"6e3734f853ce0a4b3e69f2fd5909b9f9","url":"build/js/Hero-CYbskwuQ.js"},{"revision":"4e55c88ebc7d90ee97fa4318c22f9806","url":"build/js/iconBase-UXji-As5.js"},{"revision":"a3110e3b43f370ce8a57af99695ee661","url":"build/js/Icons-BbiDOKIv.js"},{"revision":"8fc54a70574ace734e023a1c628172e7","url":"build/js/ImageGenerationWithAI-BJ-qyiRm.js"},{"revision":"0339f99e26c9110ab167aa64605232ab","url":"build/js/index--qlfnLKR.js"},{"revision":"dbe46b52f08edb28dfa9769474f32344","url":"build/js/index-2oFPUMqx.js"},{"revision":"44b7c083ee80bd6adbb639ecd81ccb2a","url":"build/js/index-6zU-Sw5z.js"},{"revision":"f7a64beb7b18242caa176298997d705c","url":"build/js/Index-Bhuzg-bE.js"},{"revision":"3e540fcdc3deee5cc32aabe5d6a4a55a","url":"build/js/index-BQvBrBHk.js"},{"revision":"f137e1f1ef3d36ed41bce1c2999e4735","url":"build/js/index-BS4Xzjxf.js"},{"revision":"1a54e0ddec721da72bd900f6fc7d7caa","url":"build/js/index-BTTkFrGd.js"},{"revision":"213f6cf2ddd53506c779ab640fede0d3","url":"build/js/index-Ca_yyhZq.js"},{"revision":"2ddb6d292773945efbe9ec44290e374d","url":"build/js/index-CAdXYCaM.js"},{"revision":"8ba861bb29a009ea7ef15a56a0f27464","url":"build/js/index-CAxlqgDZ.js"},{"revision":"6c5943f90167563b8ddc34d946dfde8c","url":"build/js/index-CLd4JU6o.js"},{"revision":"54513783a22d739616af155bb7ac3c92","url":"build/js/index-CvDUV9vo.js"},{"revision":"3fe7f956b4ac7e5a81a2cdca236bd110","url":"build/js/index-CX66wC8a.js"},{"revision":"7e36cc6de2e1767e74958bcd651d46a4","url":"build/js/Index-DNAbUA-S.js"},{"revision":"8d017c72e3fb576e7c5efc67c8d33c22","url":"build/js/index-DNK2kAX0.js"},{"revision":"a79f08640a3bbbe46cebe052110ae7a0","url":"build/js/index-V8E8kiCx.js"},{"revision":"855a0aff2711982f2184008acd7a2b65","url":"build/js/index-ySu_evCY.js"},{"revision":"dc0dd3c952c0e019a8dd5c0e2d3bf350","url":"build/js/InputError-D7-VR9ka.js"},{"revision":"1f54f02aa4d4b22e04c1f68f22e7be61","url":"build/js/InputLabel-BNQKCDwx.js"},{"revision":"6f8fda98eca2d943dc1cafee4cb0741b","url":"build/js/IntrosVideos-CFPVvLTC.js"},{"revision":"d9cb519bd4d4a3af4caba540d43066d0","url":"build/js/Item-CcmI5gAS.js"},{"revision":"247d3c27a1bf4dfa69a9e2ed5081e326","url":"build/js/JoinUs-DRC15DU-.js"},{"revision":"6abf1b53321609452c42aa4345cf4549","url":"build/js/LeaderboardStars-DAD_O26S.js"},{"revision":"61d7067a58f49c41d800080240c451da","url":"build/js/LineChart-CHshmFFD.js"},{"revision":"f33e67dc7a9616838431bcf1a38e64d5","url":"build/js/LinkTwitter-DZDNV0AS.js"},{"revision":"969e768dafb9c4dea2e2b94dc0b31eca","url":"build/js/Lists-OkgQTfvN.js"},{"revision":"fdb0868351c030651ad61ea64a71212e","url":"build/js/LiveBar-DQRWSbhl.js"},{"revision":"0079ed436363fad3289419b98c80fd58","url":"build/js/LiveBarSection-DeQme_-W.js"},{"revision":"a20ea816ec9e163d9ee665e72af7090f","url":"build/js/LoaderButton-nYA8DW3N.js"},{"revision":"bf775d31c8d2fbaad97fe004b7530325","url":"build/js/LoadingScreen-S-RqwEsF.js"},{"revision":"5cca4e32696243a1f919daaef5b47e7c","url":"build/js/Login-Z_tc_WBf.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"685123fd8a183488e4dc36434dcbf7d1","url":"build/js/MagicBellNotification-BrcrNwJ_.js"},{"revision":"c1d7e0e852201b5828103cfe3bf0a1f8","url":"build/js/MagicBellNotificationDisabled-DXr0Nwte.js"},{"revision":"9961e47638552142bc32c4693ea8c2c1","url":"build/js/MemberCheckout-CE_T_urA.js"},{"revision":"a8293c62f38fb6e77f0acbcf3368a183","url":"build/js/Membership_dashboard-BGYJUzLg.js"},{"revision":"77d70e14029f4aff45abf670e23eb004","url":"build/js/Membership-Ba2Bfhrl.js"},{"revision":"21995fc27aa256b9159d324e89dc6450","url":"build/js/Membership-Dax_D3PB.js"},{"revision":"e8e91b7876f235d783b3c705aa886752","url":"build/js/MembershipLists-BitxaTCC.js"},{"revision":"b9fe062bda0bd042969595ec19c3d2ca","url":"build/js/MembershipsLists-BhAEGSSO.js"},{"revision":"0121dc8fa8571c1e18717f6161b19653","url":"build/js/MembershipTracker-DwZWJ04O.js"},{"revision":"5a52bcaf2fae0e610678f8cdf657086f","url":"build/js/MonthlyRevenue-3ZhYonZK.js"},{"revision":"4c67a967086b766124678a9c0ad6945a","url":"build/js/MyGoal-B3K0wrjP.js"},{"revision":"a24db2e99cbd6589ef4fea9d19c53c8d","url":"build/js/MyShopProducts-N0cVFnJv.js"},{"revision":"ab50c9d32533c6ca51180098009fb8ac","url":"build/js/navigation-6ODboJy7.js"},{"revision":"9cfc804cca7d6d1cb973d5df8dbfba04","url":"build/js/Nocontent-DrKyD4v6.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"1b62641a099f0960c89854e01659c500","url":"build/js/NotForBusiness-DkL_YlsG.js"},{"revision":"4ddd436c51c6c3166de64980a9e3a2ec","url":"build/js/NotFound-D3MA9Hgb.js"},{"revision":"67785fc99100af6ab0e824a30e119504","url":"build/js/OldSubscribe-CkosG-fD.js"},{"revision":"a3e7739bbcd458534ddf0c3edd7d52f9","url":"build/js/OrderDetail-Bbn1Bl9Q.js"},{"revision":"50a646540e8fd1eb1d8c31ab974bb723","url":"build/js/OrdersLists-B4LoI_df.js"},{"revision":"26dacf526a6255cbb66627d95bf16815","url":"build/js/pagination-BUuwiOAA.js"},{"revision":"cb5d7eb489a2aae053c70f0ef33c38f6","url":"build/js/PaymentDashboard-CAKSpSKK.js"},{"revision":"7b66625b3bc477cb8144a4c88327920e","url":"build/js/PaymentSlider-Dmb88lLN.js"},{"revision":"94bf3c17b00f4ab5fc535b664449ccc6","url":"build/js/PlatformAnalytics-DUhGnUUP.js"},{"revision":"98b84b5a7f1cf8fd75315a24dfc127cc","url":"build/js/Popup-CRvNL92q.js"},{"revision":"25321540a440e184f4407a2f7b9d955c","url":"build/js/Post-C0gj1aEs.js"},{"revision":"162841763227ef2d642a9854d08cfe45","url":"build/js/PostLike-CxPCGoff.js"},{"revision":"cf7654f370ee51d129a0f4326ac423af","url":"build/js/PriceFormat-C_orQANi.js"},{"revision":"e2b353241176aa5b831375ac84239d51","url":"build/js/PrimaryButton-CehGIM5F.js"},{"revision":"1862216bf9ee4b89ca24a5d1b32148fd","url":"build/js/ProfileProduct-BIlBL9w2.js"},{"revision":"659d660c115e7a09f6cba159e5aaaa3f","url":"build/js/ProfileProduct-DURIT6UP.js"},{"revision":"bcb77f8bc15af37eddc3c939c0932788","url":"build/js/ProfileProductLists-BLxeufCd.js"},{"revision":"5d8b8bae062035894343566c95eecd46","url":"build/js/ProfileProductLists-BYzcxUx4.js"},{"revision":"86c28d9ec19ba6eb529748e0b93e2fd3","url":"build/js/ProfileSteps-gzIKU3t_.js"},{"revision":"91bddec3dbf50dd16a84bdcb98fc015c","url":"build/js/Promotions-DKo7qJ0I.js"},{"revision":"7c910aabcdb1d3d9a4daea2c97d0c282","url":"build/js/PwaInstallPrompt-c-rOtvpf.js"},{"revision":"957853a8e05c606985e864b5f5d7d1a0","url":"build/js/PwaTest-98G74uja.js"},{"revision":"9d42fa8454fd63cbf33a50cde65e5b7e","url":"build/js/react-select.esm-b4a7Qqgi.js"},{"revision":"d49893c83a52d224a0d1d01e6c933cc8","url":"build/js/RecentSupporters-C7Nabpe4.js"},{"revision":"e5affd092e98283e9c6ca68f37d2f440","url":"build/js/Redirecting-D2rc0jCn.js"},{"revision":"2fb278ae38b05ceb8289a46e9236104b","url":"build/js/Register-CAZ1TySv.js"},{"revision":"19b436fdb9c09cf76766e0a33535a278","url":"build/js/RemoveBill-DFCZP1yc.js"},{"revision":"d4f467f84ebd02e684405dd150ce1f62","url":"build/js/RemoveMembership-CI8DFhNn.js"},{"revision":"9673291c1d6f111f578104d3d722982b","url":"build/js/RemovePost-CfPK6mrk.js"},{"revision":"cf0dcd7bc3404c7aba1959c83a12a952","url":"build/js/ResetPassword-CLiCPxyY.js"},{"revision":"f57f18fad7c1db43a2a7accf304b1aa4","url":"build/js/SafeTransition-OPJNkqKB.js"},{"revision":"ea84df1700619b07c7141bbe409677d6","url":"build/js/SayThanks-BLzCIc1G.js"},{"revision":"b906e1a423b5be5eaba0c1ebdff71262","url":"build/js/SecondaryButton-CJi1Uv-z.js"},{"revision":"8ba1c6d7775a5ede037973f5954d0bcf","url":"build/js/SendTip-1FOzaCKE.js"},{"revision":"4948a044c1661eb7b3bc44e70110cc22","url":"build/js/ShareProfile-mq0GtDf5.js"},{"revision":"ab28ac6e5989b4d79f27c118da51914a","url":"build/js/ShopPage-DOCzHR6I.js"},{"revision":"1fba8f957cab1fe772903a6a8ab9cb67","url":"build/js/ShopTracker-B1bj8Fyw.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"e2172e1ea873ebbc7116d1354b08c25c","url":"build/js/SiteSubscription-DHlLnePD.js"},{"revision":"4897760843855b903732420077ee7aeb","url":"build/js/Social-FkURehx4.js"},{"revision":"75692f21b90cfc37926b651b68a6a8c2","url":"build/js/SocialLinks-T-dCig-y.js"},{"revision":"501adbfd970e64c751bc8c01555eac9a","url":"build/js/sortable.esm-cq8fIw6M.js"},{"revision":"3e60a0e95d550c9193bcfd5ae80116ef","url":"build/js/Stripe-BIjOFRVj.js"},{"revision":"476be74f90922a7818fbadb779531bfd","url":"build/js/StripeIdentity-sOMYzSjM.js"},{"revision":"b4a7a6738d577cae549fe4afd64e6027","url":"build/js/SubCheckout-Bg1o4fFw.js"},{"revision":"dc84c3b19d583beae2bf6459004119e6","url":"build/js/SubcriptionEarnings-B67W5Hqj.js"},{"revision":"1ece17675bca6fefd3207b50bca5de25","url":"build/js/Suspanded-C5Xt6Jcu.js"},{"revision":"7620613d51e5d3060b6d9876e1762d9b","url":"build/js/swiper-react-ar9R6Zkr.js"},{"revision":"1fafa46d793aa44d53e2de5774313d33","url":"build/js/TabbedDashboard-BkkdFJQo.js"},{"revision":"98397c5300101f22b2899d3f6b511712","url":"build/js/Terms-DU0PceN0.js"},{"revision":"3dfcfaa8e8c34999c4783283342dff24","url":"build/js/Test-qadmPQS6.js"},{"revision":"36783998b33a81d2f15f5bacb008bab9","url":"build/js/TextInput-BG0X1y5E.js"},{"revision":"3386eaebe59fbece58a91dcceb2e9cc0","url":"build/js/TFA-DYg5hQMb.js"},{"revision":"3c723f301d4ca2ad5e10713a9e38cb4b","url":"build/js/Thankyou-btn1dHf0.js"},{"revision":"50057bc6e3471bb3db5686d3dae5842c","url":"build/js/ThankyouMessages-B2FVxCG8.js"},{"revision":"a61ade6e27b7a1f8dd8cb92e6f6c3c52","url":"build/js/ThankYouRye-Bto4uDij.js"},{"revision":"cfe51a9f9224c2c0eae4cb468f90444e","url":"build/js/TimeFormat-4Re_cjtE.js"},{"revision":"9157b62579129a01362622b5e09c44a1","url":"build/js/TipInner-B5DdN6DC.js"},{"revision":"2e29ce3a491970e10b0b669e9b47b38a","url":"build/js/Tiplisting-D35MSJWR.js"},{"revision":"92712c886b501d726e260a256608a9ed","url":"build/js/TipTracker-DpJSa54D.js"},{"revision":"edb1afa207272c5e801abde99db882d9","url":"build/js/TopEarnBills--8ZiwQ1Z.js"},{"revision":"a87ba031aca4306ce06c5f51d4dab60d","url":"build/js/TopEarnWishes-CaZxupGj.js"},{"revision":"cc34409398f0c0ed340c5134158e8126","url":"build/js/TopSupporters-B_vuQ6Cc.js"},{"revision":"74a6811fbc82fa9bf27444b335f94283","url":"build/js/TopSupporters-CRJy-gB1.js"},{"revision":"368dead1eff8b7f7f8b81801063a0fe5","url":"build/js/TrustBox-BiXlRxFm.js"},{"revision":"254ec194f86d3a168a45bc1041a35bd0","url":"build/js/TweetNow-DWdmldda.js"},{"revision":"3451fef0ad804f01d3c29d9e6b151e9d","url":"build/js/UpdateAvatar-DoAeIEnb.js"},{"revision":"032ef7a21df85be67029b7b88cdc4247","url":"build/js/UpdatePasswordForm-Nyxl-y_X.js"},{"revision":"1932f974789e054e850e68c1a62f29eb","url":"build/js/UpdateProfileInformationForm-C5ZCS963.js"},{"revision":"bd9d08e9c9b756156f2eb2c63ea2af16","url":"build/js/UpgradeStripeAccount-Bm9XtkiC.js"},{"revision":"b31733c135c424ab380c6bb60f252780","url":"build/js/UploadcareEditor-C1NnHBqO.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"084f881b711473d117a3420d888551f0","url":"build/js/uploader.module-Cv0OjfYd.js"},{"revision":"0686a0dc29d888d429b4bb9d0838f52e","url":"build/js/useDispatch-DSUbHHHa.js"},{"revision":"0efb7e8edc82ae1ad29bb9993ca15bfb","url":"build/js/UserCarts-Cs_4GMhH.js"},{"revision":"3d90636fcb4587810743b4b223e8cba1","url":"build/js/Userprofile-B1EIIwAV.js"},{"revision":"69f2f3815b94209cf55229e18ab1eeae","url":"build/js/USTERMS-1t4vy0AU.js"},{"revision":"ab3abd7bf274fa8b8936d348cc32a232","url":"build/js/vendor-inertia-C3wMlmYt.js"},{"revision":"7b42edf7ae9be750e5c811badabaa675","url":"build/js/vendor-other-CUx1NP1Q.js"},{"revision":"ef767b402445925a1856a47202a581c8","url":"build/js/vendor-react-B3pTFEbv.js"},{"revision":"fd7ee257d11283bb45256464e8ea3151","url":"build/js/VerifyEmail-DsXanf9w.js"},{"revision":"de423d61c73f450934680be494899c03","url":"build/js/VersionUpdate-BmtubquL.js"},{"revision":"809a7049dc0a9a2dcc96fa5d5092a551","url":"build/js/VipSupporters-CZskqqmG.js"},{"revision":"9d89c81493a2e73c84c6f63e37a1763a","url":"build/js/Welcome-DU2n7jLH.js"},{"revision":"38f040e14f9230dd613489380b501b9d","url":"build/js/WhyLove-ju1Oa7od.js"},{"revision":"0bd8ad7b7adeb407c83e58eb830e400f","url":"build/js/Wishlist-Bgy45EeV.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"129154cf76db9b6a2937fab9af6883cc","url":"build/js/Wishlistbox-8UyuRCXB.js"},{"revision":"dfd3942666a9acb6d27ea974b5062f9e","url":"build/js/WishlistGrid-kkmFlSCO.js"},{"revision":"270cdaa23c46088fdc1e2ee8589903ed","url":"build/js/Wishtracker-CpGq0Suk.js"},{"revision":"011839cc16f61219d256a068165f4f9a","url":"build/js/Works-CRNaYoLM.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
