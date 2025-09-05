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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"89727f27c51e5b10384af30e54e0d122","url":"build/css/app-CfSi8XnG.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"90a2c759528ae6f28f4a5a2391c4d535","url":"build/css/uploader-BQYCdP4p.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"build/images/PaymentIcon2-BJUK1AyF.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"build/images/PaymentIcon4-CHadhKHQ.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"build/images/PaymentIcon5-CdbBpjz-.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"73563d724658be58cef0a4432d379e9e","url":"build/js/Accountsetting-dy0p3IB_.js"},{"revision":"06226578ae4f95397fecb3a85aa68613","url":"build/js/AchievementSystem-CPP9d0Cx.js"},{"revision":"164ff1908caf5781f8d6b52920191bae","url":"build/js/ActionRequired-Cjp_mJx2.js"},{"revision":"4f738bfb08f5ea3c0f735a36583f44e9","url":"build/js/ActivateCard-Vsly99hA.js"},{"revision":"da800f41a9b847422062cc9ab1d2889d","url":"build/js/ActivateSubscription-C7VnEdAg.js"},{"revision":"53a63ce048635479158734714d384ac8","url":"build/js/ActivityStatus-Dok9CezV.js"},{"revision":"34b46bce5e7de56686721f4f01cbf3dd","url":"build/js/AddBills-CcOjMAq8.js"},{"revision":"0feaf01e26c85f88ab0e7a9574959c14","url":"build/js/AddCart-BxAHEzBx.js"},{"revision":"e0857b546c4e196259c8ed775eb03508","url":"build/js/AddComment-wIJNthbS.js"},{"revision":"0fac3c6aa83cbe31886204b6e409d26e","url":"build/js/AddGift-CawbxQb6.js"},{"revision":"f054d1c5c3ff3674e73fa216fe88b23e","url":"build/js/AddGoal-BWBmt05L.js"},{"revision":"ba83d652806b376d5d343019ed4e3607","url":"build/js/AddIntro-DN4vQbET.js"},{"revision":"ec9a77e478af310e079a16e531297168","url":"build/js/AddItem-CQmC5FG-.js"},{"revision":"22229ca96dac9ce3f7a58db222c1a2aa","url":"build/js/AddMembership-CTCpAI08.js"},{"revision":"94dbbcf4faa1f2fe5e50276137083cdc","url":"build/js/AddPost-J2GmoHy7.js"},{"revision":"ee4946eb008883eae7c7cea10115010d","url":"build/js/AddressForm-C1BZlPfo.js"},{"revision":"c60872b3fa960e564fff7bdf52fe5518","url":"build/js/AddRyeProduct-DS9d6Pc7.js"},{"revision":"c4c926b8f4f613df8e0905225478b8cb","url":"build/js/AddShop-CH7EoDEI.js"},{"revision":"53a27facd908e3aac32054039fcb2a37","url":"build/js/Alerts-N92ElE4H.js"},{"revision":"a9235886be618793e2737ba9cbd9740a","url":"build/js/AllCountries-8IoSv_5F.js"},{"revision":"c9f65afa0088ef508e83aac0761f7aac","url":"build/js/AllWishes-D1Rvsx_D.js"},{"revision":"05e8596a2ef40879132425de5e058b88","url":"build/js/app-CvadJkPx.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"eecdea1b73f56b077f3a9a9493174d99","url":"build/js/AuthenticatedLayout-lvr0ETKS.js"},{"revision":"39cf765c5c47c26bb6ba67aca7811342","url":"build/js/Avatar-DwwxHoiM.js"},{"revision":"2c14a1ccf53319eb47dcaf22cebdfd1a","url":"build/js/Bill-6H78Zwqx.js"},{"revision":"41066023b93877b79304e448507dd61c","url":"build/js/BillCheckout-DFw2Ozwb.js"},{"revision":"f5bdd090695bed173467824b8995b543","url":"build/js/Billslist-C5LI6D77.js"},{"revision":"3f2352b199bf6eec03a26261fb419892","url":"build/js/BillsTracker-CQGjxNRd.js"},{"revision":"434dc695f7bce19cbe80ab93eb0d11d7","url":"build/js/Board-Bhn1BxqS.js"},{"revision":"57a5414b19c97622f9f3089119f073af","url":"build/js/BottomBar-CsG-xAZJ.js"},{"revision":"d2a2467ad2548696de41f2c3f7ef139f","url":"build/js/BuyShopItem-BkLMDj8f.js"},{"revision":"734307b338218c3344a7a6bb6bfb0612","url":"build/js/Cart-BOQku4NT.js"},{"revision":"114b5fa9bf193066f9e73c9447a99f36","url":"build/js/CartItem-g6vwdwju.js"},{"revision":"56346c5b74b16e340e53543e522d8607","url":"build/js/CartItems-D3BDtJSQ.js"},{"revision":"c2029678b084b5bcbc0ca322c2ee5ac1","url":"build/js/CartListing-BpNLoaJO.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"69b7c5412a1486bd82f71abe1ea22f14","url":"build/js/CategoryLeaders-CBOI0TTB.js"},{"revision":"148aa3524f6e7779b36dd54fb23175bc","url":"build/js/ChangeCurrency-CzJwW5sQ.js"},{"revision":"353e07f58ac1e41e70ac9d35a033a4d3","url":"build/js/ChangeVat-B2C9yneJ.js"},{"revision":"aeef7bceb10c7a57857d638270b4832a","url":"build/js/ChartDashboard-i3RIaRMG.js"},{"revision":"cb476ef22df31e287965bc64da90e3e6","url":"build/js/ComingNext-CoZy2o_C.js"},{"revision":"beae304d4099346c8a5f053b389a1865","url":"build/js/Comment-ZSA1wWru.js"},{"revision":"7c02cde15d2f0afe0572ae337230f55b","url":"build/js/CommetsLists-PPtPez2g.js"},{"revision":"4cf6b28c8a6e5016d2d9c577eec3e5b5","url":"build/js/ConfirmPassword-D_Hb0YSM.js"},{"revision":"38bd5ff8c2341c259599c5a5ed2769c4","url":"build/js/Countries-cwI5AQ7I.js"},{"revision":"622e75671292e38609a0daac457133ae","url":"build/js/CountriesShipping-CTYhr_Wo.js"},{"revision":"621de3e0c556ca82b8d64bfeb5cd29eb","url":"build/js/CreatorActivityWidget-D1_eBTtx.js"},{"revision":"f381a240cc82c884ffee046d3f959d4d","url":"build/js/CreatorVerification-DOuNxlmi.js"},{"revision":"da3d7c0b5cef35f752f04602f5d9b861","url":"build/js/CreatorVerificationNew-CLDAmstJ.js"},{"revision":"5301b929b6e01bfbc12869ec7df17ff2","url":"build/js/Dashboard-DR4VTjJt.js"},{"revision":"d8804c61d1f521f4de6fb70c7708aec9","url":"build/js/DeleteStripeAccount-B65QPU4-.js"},{"revision":"0452e33d5e8f8560c0ec4ce0aa66aca9","url":"build/js/DeleteUserForm-BUiKqBUq.js"},{"revision":"1f4bc9300fc1b2b0a3280794894f21df","url":"build/js/DiagnosticPage-Dx0bp1Vs.js"},{"revision":"8c349d3bd4ea2305104f099f7d2fe3ba","url":"build/js/Discover-DYG6YbiL.js"},{"revision":"28c791de22b0a3afc2f3f7d8d0a83f36","url":"build/js/Earnings-CUvwQbEc.js"},{"revision":"56a288c3c0d0259137b84df92c89494d","url":"build/js/Edit-BN_LrzIB.js"},{"revision":"fb31c94f93bb397ca6b8fecd970eb35e","url":"build/js/EditCategories-DK5J2jO_.js"},{"revision":"13840b9916db386265e88ad3a8b06c29","url":"build/js/EditMembership-ByytsCOK.js"},{"revision":"f319564c07e828cf2d6e787ebfb0baff","url":"build/js/EditProfile-BMsuKb1y.js"},{"revision":"74be929c2d810ae5faeec5263ad7532e","url":"build/js/EnableCardCapabilities-BLbkGOjS.js"},{"revision":"dc6f0c8da5d9c12ed6ad6adee33a4164","url":"build/js/EnterOTP-CNxFjbA0.js"},{"revision":"c20155b2efa6c5e6c76dff1dba43e406","url":"build/js/ErrorPage-DKQ8YItr.js"},{"revision":"4ff572336f23e5e3b3ebecd0ff9b16cb","url":"build/js/FAQ-DGpIG8WQ.js"},{"revision":"58a05447c7dc3b15e86392dfc2ea2c76","url":"build/js/FeedList-COAXaf8e.js"},{"revision":"27f30da09567d2e77f749edb3ebf580d","url":"build/js/floating-ui.dom-D_V-nUPr.js"},{"revision":"295b4dc61e6b24afe3a9cf86c779b946","url":"build/js/FollowButton-BnUKvNab.js"},{"revision":"fe7ab674b2e84a611dd471748c20e00d","url":"build/js/Footer-IwUTyOYv.js"},{"revision":"abb795cf3eda34bc02b0c13c71e8c84d","url":"build/js/ForCreators-BjCHcChM.js"},{"revision":"a33cff171ff4a5776d1696195ececfc7","url":"build/js/ForgotPassword-DlIVc-ka.js"},{"revision":"6ce3a86579de5b1be92529046acbfc41","url":"build/js/FunPart-Be9on6c2.js"},{"revision":"82450238e106d45373ba78177ffcfb25","url":"build/js/GetCart-BjfRB0OC.js"},{"revision":"8813d35092eebf52ab10ae49fbdca51a","url":"build/js/GiftAddCart-ChdAlU-C.js"},{"revision":"6f4063687b5d017ca5c60022422bfe65","url":"build/js/GiftEdit-AfzLAy1p.js"},{"revision":"c0b0622c6cba292f8009db79faaa591d","url":"build/js/Gifter-DilUQU0E.js"},{"revision":"08aa011649a191bef2b4aa78b16822f9","url":"build/js/GifterCardVerification-DKXsdifw.js"},{"revision":"a488627f453ffd77f3a5a28bca5602c8","url":"build/js/GifterFeed-bY0QYYfQ.js"},{"revision":"502d53d0560542799f71e4436443c97e","url":"build/js/GifterItems-BF8WLCsf.js"},{"revision":"b5dc907e322afcd3ff2cfa5b61429325","url":"build/js/GifterMedia-CsN8zGB3.js"},{"revision":"179a906b9ad022276e76250af5122623","url":"build/js/GifterMembership-C1WhN-nz.js"},{"revision":"8912582e7b1d49278efac06a14fb2b4d","url":"build/js/GifterSubscriptions-3m61r9tk.js"},{"revision":"0dedc8de97c3eee6fcc03fd7ad873e29","url":"build/js/GifterTips-Bed7SpCy.js"},{"revision":"8790a53ac9843dbdbced94f990cf8ce7","url":"build/js/GiftListing-D5zDRPli.js"},{"revision":"bcee8fdf6760608ed88a82372c017917","url":"build/js/GiftStore-OA9IrM3_.js"},{"revision":"be6ec4fdc91ca97e5954e5aa062b4443","url":"build/js/GlobalCheckout-CSiiTk88.js"},{"revision":"b63303047671b50a4c1841e3c6ddf5d0","url":"build/js/GrowthTrends-DYSKQMLK.js"},{"revision":"201fb0323ed8f17bd365edd41f6d60c9","url":"build/js/GuestLayout-DEwTSapo.js"},{"revision":"35119206e41ea4d43f5a17271353f21a","url":"build/js/HappyCreators-97lIGOqD.js"},{"revision":"cfb86ccb0a6d3fbeb5203885f8095ed5","url":"build/js/Header-DO4x1Zl5.js"},{"revision":"87a8f252cffb579a3dab2102414efba6","url":"build/js/Hero-BbVDtnBQ.js"},{"revision":"5fc0d2290acc4211958bb6362c7e2a14","url":"build/js/iconBase-C6PuoNFC.js"},{"revision":"fcc9cacfda1c07f2ce18d38fc5259347","url":"build/js/Icons-DRrdEkIF.js"},{"revision":"75958ed82e85fa8430569b673d031911","url":"build/js/ImageGenerationWithAI-DMjtHrOw.js"},{"revision":"2b9d3d6b8bee7712b57f6ca47303b3e5","url":"build/js/index-8riZpPbR.js"},{"revision":"30cd7cd8a1f76b45d9d87b44b73a3d53","url":"build/js/index-BDPC8erB.js"},{"revision":"2828a92c4b885a2733c105a15094e7e4","url":"build/js/index-ByevgSUn.js"},{"revision":"fc28c03962a51f9f99c1d1c3b12bb578","url":"build/js/index-CHfgqgxd.js"},{"revision":"92d8400d9965a53bed7af6df88d6397c","url":"build/js/index-cq3gujP-.js"},{"revision":"7756c71e6dddc18503138aa1ae1aa589","url":"build/js/index-CUMIueKe.js"},{"revision":"75c102b9dfa09679fa20e45c85a1fce6","url":"build/js/index-DA_mXU2T.js"},{"revision":"cea3a9bb446a2166023da531772a7384","url":"build/js/index-DeTlGiDG.js"},{"revision":"ea4aef6066bd1a6a5609e41d7ef0a36f","url":"build/js/index-DJeQfmdT.js"},{"revision":"2748b59681d981e32a4df8ba5c2f0078","url":"build/js/index-DzYT420P.js"},{"revision":"030bb21831a31d3868b027bcb7b6c7de","url":"build/js/index-gzK1Hv1j.js"},{"revision":"8fd0888ce76b7d9e172dc8d6a426bb26","url":"build/js/index-LWRc2LVQ.js"},{"revision":"9c67960a5d65ea40972083e9d89bf06c","url":"build/js/index-MiGTHhBh.js"},{"revision":"3b343889c3e651350f9ecbd73b545467","url":"build/js/index-q-fIdXxs.js"},{"revision":"7d6b82def3abcc7cb653a01399b30922","url":"build/js/InputError-DxIs0Ser.js"},{"revision":"1889a1ffe9ace750b76b8af97f184e62","url":"build/js/InputLabel-DpCPJFdq.js"},{"revision":"ff3b64e5d7c6c913d2eb32542c10f86d","url":"build/js/IntrosVideos-CYJwVlDi.js"},{"revision":"847a7a582e6f97c65374d547dd12ea54","url":"build/js/Item-wF90cGWZ.js"},{"revision":"43a853baa88368f273d353f7cd0e0cd1","url":"build/js/JoinUs-BM8VpS-X.js"},{"revision":"fcbeb83666bb684cd65a4b16a2d1df5f","url":"build/js/LeaderboardStars-kuoVjd61.js"},{"revision":"e4c07c72fe7b6f229d12e96ad7164236","url":"build/js/LineChart-D5tGQOIV.js"},{"revision":"a0b78e97e7bd6893325602c873a17417","url":"build/js/LinkTwitter-CHSpEF7W.js"},{"revision":"eb4edd024ca18b9e5c0db270b6dbc4de","url":"build/js/Lists-Ch_xo1z3.js"},{"revision":"19e8a374a3630e7f46032dd87ab2b955","url":"build/js/LiveBar-84aTfP3v.js"},{"revision":"4b1299edc6b359519a97f2b792fda4ca","url":"build/js/LiveBarSection-880bfD4X.js"},{"revision":"4266bd3a1fb1217eea9b0b272fc7b99b","url":"build/js/LoaderButton-CKaKflR5.js"},{"revision":"c5449bb4be93cb77d506e5061c1f23ee","url":"build/js/LoadingScreen-Cu2nCAqk.js"},{"revision":"426a1f982dbea175227916b029b56dd2","url":"build/js/Login-BmFsCaUx.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"f71cd9b7954c75c4bb6704648d280c69","url":"build/js/MagicBellNotification-Co43DP3K.js"},{"revision":"672b514ed0b2938f68845f763cc77de6","url":"build/js/MagicBellNotificationDisabled-ks0NLWYt.js"},{"revision":"da9b7e9f6f351c186ca1ddef13b8d960","url":"build/js/MemberCheckout-D6GCZIRs.js"},{"revision":"c738a3fe85b099bafd78d47c5170bfdb","url":"build/js/Membership_dashboard-BDMcUHNZ.js"},{"revision":"37b9bbdbaf4af5c6e5468a80902f9e5f","url":"build/js/Membership-BZG9C502.js"},{"revision":"b8389ef508b285c378eebd0dce5c7fdd","url":"build/js/Membership-CIOIAOKY.js"},{"revision":"191e771e0315404c0fa3c8cae7cbeccd","url":"build/js/MembershipLists-D-5So_n9.js"},{"revision":"b15b8f8f0de2ec635630dc77432bd7cb","url":"build/js/MembershipsLists-BHdFKDcE.js"},{"revision":"644c09ff4554f3f99d20a316b02e36d8","url":"build/js/MembershipTracker-DxngeSm3.js"},{"revision":"70a655520aecde80b173d034dfbef18b","url":"build/js/MonthlyRevenue-CzSApKqR.js"},{"revision":"8d5f2f58d55972e800eb1521fbd4f84a","url":"build/js/MyGoal-KyvMxcil.js"},{"revision":"28942398bb579b5affc45a9694319c11","url":"build/js/MyShopProducts-Bc-P880Y.js"},{"revision":"0eaadfbe9471390787fd41a2dd95f361","url":"build/js/navigation-DdeYz6z0.js"},{"revision":"f7d6b382c5260e8d971d71bbaecd7281","url":"build/js/Nocontent-aamr3hI4.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"163af19ecf7249b1e1b0b565e2c1c621","url":"build/js/NotForBusiness-CkiQxq3m.js"},{"revision":"8a03473a8b48f197673b697d9dc6667d","url":"build/js/NotFound-S_3j6Krg.js"},{"revision":"4bf5efa54d4e9ca2078f669a197f61c5","url":"build/js/OldSubscribe-VycFkptO.js"},{"revision":"e97b297b30f45cd722cce3923c803ad7","url":"build/js/OrderDetail-Dhz4dcsV.js"},{"revision":"088e3b9871ce09845e4d97f691e60b78","url":"build/js/OrdersLists-BvuzPRiW.js"},{"revision":"52c2a4a74b265e5d9ae9ae6b65bd2f91","url":"build/js/pagination-d43Vpvxj.js"},{"revision":"740e1fb75d708b7dbd97bbe8463369f0","url":"build/js/PaymentDashboard-CGy90F8Z.js"},{"revision":"6390169e87f2ffd2890902eb40392f00","url":"build/js/PaymentSlider-yMlJzTKo.js"},{"revision":"28a7af6967f236424ebf697248d899d8","url":"build/js/PlatformAnalytics-NrrGOQd0.js"},{"revision":"1df7e068302dbbf4b97eb906e36f31bc","url":"build/js/Popup-BzAy5mRU.js"},{"revision":"c1f81c8b006b81aa842569db46dd8a84","url":"build/js/Post-PJAV3lKa.js"},{"revision":"a63a2aaba0bb34cc93137e3a5506dadf","url":"build/js/PostLike-C8HlcLhh.js"},{"revision":"d4c53ce7a6ab66ae3b02a1b6e0a8ffb4","url":"build/js/PriceFormat--Y4m-RUn.js"},{"revision":"339f4a229da72364eff5b7b84fe1b390","url":"build/js/PrimaryButton-3O19TmJ0.js"},{"revision":"da88238baab5014318378910ac0d105d","url":"build/js/ProfileProduct-C-_tNEME.js"},{"revision":"98c59fa63662a31d33676f91fa851e63","url":"build/js/ProfileProduct-JU5JWjJn.js"},{"revision":"a11e99386d0d905a027aa485b576c211","url":"build/js/ProfileProductLists-BOYr04HE.js"},{"revision":"a7019effa97a5218cbf1618447f176fe","url":"build/js/ProfileProductLists-Cezo_JDw.js"},{"revision":"252c13259b09319e470b6d8bb3f1f343","url":"build/js/ProfileSteps-x3nqzvK2.js"},{"revision":"45a85e20613c61ee935250319add67d3","url":"build/js/Promotions-F8coDo29.js"},{"revision":"2f52c7c45ea690518d235fe9cdd9831f","url":"build/js/react-select.esm-BwvEQ-uQ.js"},{"revision":"324b5579b625bf6e9cd4c9dfdd6845a3","url":"build/js/RecentSupporters-B2GiGPxa.js"},{"revision":"9afa03d6d0c116a20d55c80e93c12e3c","url":"build/js/Redirecting-BPjHvON2.js"},{"revision":"0559558f9c8fde179bb398e8ab7c3f19","url":"build/js/Register-BzcQhLE9.js"},{"revision":"a58338dedf163d99521b2665b1f3d007","url":"build/js/RemoveBill-NLL73RV4.js"},{"revision":"9bdff43291396142a9088fd3d69860f5","url":"build/js/RemoveMembership-CZ2lrPBY.js"},{"revision":"29f4d1d86676f7cd0bc8dab55baf3102","url":"build/js/RemovePost-CKsKtRFr.js"},{"revision":"b6fa0fdb69e2757bf47c15cb4ba19cd6","url":"build/js/ResetPassword-BtmrfS93.js"},{"revision":"caa0a74b969e47db28cdbb458546d558","url":"build/js/SafeTransition-V7b9o5nR.js"},{"revision":"f2470ea582c9e345863a12e4a2f0083d","url":"build/js/SayThanks-SPV6s5Ni.js"},{"revision":"4f5310382edad947a2538c5e51ab1900","url":"build/js/SecondaryButton-D_3rWfS1.js"},{"revision":"03cf2b4e0c0fbb8bce8e4630e314232b","url":"build/js/SendTip-Dv-hrLl8.js"},{"revision":"d41a280275eea3a816d949384eb4080c","url":"build/js/ShareProfile-BTvzx8HT.js"},{"revision":"e52ee0188f8e7fcc19ecd9c77af5d022","url":"build/js/ShopPage-BTt_LE-J.js"},{"revision":"15d05b6496925729959da89d12dde782","url":"build/js/ShopTracker-Dgd8diPE.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"f12986fec25dc9814e6fb63e67deb2d6","url":"build/js/SiteSubscription-BKKQE_CK.js"},{"revision":"b1a850778403e5fc6f9c47324e7789cd","url":"build/js/Social-Bn0CQhyP.js"},{"revision":"52876a6e5a70adae6895a1f41c25498c","url":"build/js/SocialLinks-Dqg3MCs8.js"},{"revision":"e192f7467e425b336b0d84e563c34a66","url":"build/js/sortable.esm-DgHwFWvS.js"},{"revision":"be002027dd0e4b9bea2f62031da60367","url":"build/js/Stripe-BY05-DiW.js"},{"revision":"3412e30f0f4bdcd782b42ad462c7a116","url":"build/js/StripeIdentity-Bozv4TVW.js"},{"revision":"7d8cb4c84c62a474c0d5b6b713168440","url":"build/js/SubCheckout-CszMHPMW.js"},{"revision":"c5ee50b6465db27965ecd30903003dc6","url":"build/js/SubcriptionEarnings-CqoY2jF7.js"},{"revision":"1f98a4f2ce377a8e67af6d96f16d619d","url":"build/js/Suspanded-DepUcmjX.js"},{"revision":"35c47a916f36b50e2ec18a6df831b283","url":"build/js/swiper-react-ab45HxJ_.js"},{"revision":"dd88572325a7ff2f25431ad878667785","url":"build/js/TabbedDashboard-B5s_afzC.js"},{"revision":"f7783ddd67680ba11f9b6f928ab40f4b","url":"build/js/Terms-Dza-ER7t.js"},{"revision":"814a044a3131fb92a3d6ebef6e0936ee","url":"build/js/Test-BShWHAU8.js"},{"revision":"795666db85931462372fe4c9a97a26b3","url":"build/js/TextInput-BST2MbCJ.js"},{"revision":"9dad8443d2c9adcb0303b7eecb7cf6da","url":"build/js/TFA-6ufdYSUQ.js"},{"revision":"e8ded9e8202ba047b3a9448e8c41e64c","url":"build/js/Thankyou-CkqlOMMX.js"},{"revision":"2b621e7d3ac687b3096ce25de0ee78bb","url":"build/js/ThankyouMessages-CMXJHM2z.js"},{"revision":"ecf1b226e736b1fba2ffdcf88c4c1df5","url":"build/js/ThankYouRye-Dw5MWiVn.js"},{"revision":"30c102e34adb45029bb7222b9cf6a61f","url":"build/js/TimeFormat-BqiyDO7S.js"},{"revision":"63ff9265f43da294ec6075ce6fb70203","url":"build/js/TipInner-CdixJrgN.js"},{"revision":"a02d6da1ecd5c31c5dbbc2888950cf53","url":"build/js/Tiplisting-DKxV1IHC.js"},{"revision":"087245aaaa17695ae6f474d811fc430d","url":"build/js/TipTracker-DfcOraDt.js"},{"revision":"b868f11a1bfba506b374c4da0286ed94","url":"build/js/TopEarnBills-Bz46Twv2.js"},{"revision":"ecef4e4ad34b58ea4e0b775aa2f7ac9d","url":"build/js/TopEarnWishes-DkQfiKWT.js"},{"revision":"2895a9415e196a6916ea83f02981d7c7","url":"build/js/TopSupporters-BMYTcA8F.js"},{"revision":"5074789bc0aef27d90e8177249f1531e","url":"build/js/TopSupporters-CndQK5TM.js"},{"revision":"58c52e89dde57acce26391cb6cb49be2","url":"build/js/TrustBox-Bw8d_mK5.js"},{"revision":"db762ebf50efe6794cd761eb21417665","url":"build/js/TweetNow-D8zsx4Fi.js"},{"revision":"a0a1c18752c256b6cd800a8eb96b3ce4","url":"build/js/UpdateAvatar-DC04dIEi.js"},{"revision":"cbd8e0a8c61f7a1c51d17957c1a948ae","url":"build/js/UpdatePasswordForm-QaGE2EXH.js"},{"revision":"47f36735f55612eea8b09c4279b000f2","url":"build/js/UpdateProfileInformationForm-wH3Lze-F.js"},{"revision":"59c1d89d1cf19d5587d64cf7e22131fa","url":"build/js/UpgradeStripeAccount-Cf9lEy1Q.js"},{"revision":"2e92f343ff54c6fd6dbcc715792ff037","url":"build/js/UploadcareEditor-DS1iZw6c.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"a375c8c4fcc49bdff15dcc469f0756e0","url":"build/js/uploader.module-aG4mVq_N.js"},{"revision":"f0920476d83889a45145d4e07d4fdbe5","url":"build/js/useDispatch-MPcrDEyW.js"},{"revision":"09075217a667bd1402b8f63cc1a3fab8","url":"build/js/UserCarts-YdHJ9FAW.js"},{"revision":"3563a826cfc9a55c050172121754c482","url":"build/js/Userprofile-CBKGfVSW.js"},{"revision":"f7783ddd67680ba11f9b6f928ab40f4b","url":"build/js/USTERMS-BA4o_95M.js"},{"revision":"78913b888457858de154de8ed4740f69","url":"build/js/vendor-inertia-Zk9Is2um.js"},{"revision":"d29c0abd1b72cdf6c81f8a2217074532","url":"build/js/vendor-other-CxsWzC41.js"},{"revision":"8f60d5d4b83ea003f8acc8353a218343","url":"build/js/vendor-react-Btb1ZzMN.js"},{"revision":"a31700353d36088eb54adf39171b4690","url":"build/js/VerifyEmail-CBpJN7Sw.js"},{"revision":"1109976d67cdb485953fbfa3cab2a414","url":"build/js/VersionUpdate-DzDjHC_d.js"},{"revision":"fad6e07294e4ebaf671b555cd840607c","url":"build/js/VipSupporters-C-m6_XIK.js"},{"revision":"d14a7d6808e0ae7cde49448ac691bdb7","url":"build/js/Welcome-DqrCkxtL.js"},{"revision":"d49a14a93424124a28986e503a662c6a","url":"build/js/WhyLove-BSp0CjO0.js"},{"revision":"9af9257a867281f7d59909f2d669b0bf","url":"build/js/Wishlist-DbZNkuz7.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"95aa0d3bf46056a2962c2d3c6db79937","url":"build/js/Wishlistbox-BwtYza03.js"},{"revision":"24099c9311cb0408a1443eda603c16ab","url":"build/js/Wishtracker-BVm1vQ5X.js"},{"revision":"cdd0dac1c42640ce2a25fd22845c8f29","url":"build/js/Works-Dvw59gnE.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
