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
precacheAndRoute([{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"da81f385102b73be3df298c6298cbca6","url":"build/css/app-zRQjHZxw.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"build/images/instagram---7I1059.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"build/images/tiktok-COEdX1Uc.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"build/images/twitch-DtjSTsP8.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"build/images/x-BvBJEWcT.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"build/images/youtube-BGvK1VJR.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"a50561b37339dc741a6299352eba00ff","url":"build/js/404-OsCZz6dC.js"},{"revision":"b71fcf5360648c9df18318d761d4e95f","url":"build/js/Accountsetting-Dr1jJXVs.js"},{"revision":"c318dec0b8e5e87a2106852d444e155c","url":"build/js/AchievementSystem-BrfKLXW0.js"},{"revision":"63f843bc7e1516a0bf58bf1ebe7ca607","url":"build/js/ActionRequired-CvkbfJ3S.js"},{"revision":"bb52ae235b81f228bef349d57dfebc1d","url":"build/js/ActivateCard-BHrOtVpw.js"},{"revision":"3a4c5a415f2ed1a3688518ac8bfb1685","url":"build/js/ActivateSubscription-B67GVPJL.js"},{"revision":"3df6a518112eaac66ab2a6477687a574","url":"build/js/ActivityStatus-DjboNReZ.js"},{"revision":"fa7654dcdf22b289bf4e9498a78f2862","url":"build/js/AddBills-IJn7p5Vf.js"},{"revision":"e126bbf369de8b183449f2e4d0b20e12","url":"build/js/AddCart-ClWEH1ds.js"},{"revision":"a1b2aa46783c28e89b5632619cb36a4d","url":"build/js/AddComment-C28Hzgal.js"},{"revision":"e7229f0b252e0def181dbc312eb7be37","url":"build/js/AddGift-BEV1tefj.js"},{"revision":"1abbd7152ec76d7094f3553bfce56ff3","url":"build/js/AddGoal-PvtVdErH.js"},{"revision":"49b17f05845ba100e0386939aed15fa8","url":"build/js/AddIntro-_MUJOoO9.js"},{"revision":"c6b2a4072cd0163882858d665e7584d1","url":"build/js/AddItem-DLYefuRf.js"},{"revision":"d3679c9640be26cae6294a3cb5d720e0","url":"build/js/AddMembership-HUzWPB_r.js"},{"revision":"62e9576be4fc7458f78a5a9ca541915c","url":"build/js/AddPost-D8Yk9yXL.js"},{"revision":"cd328d6133fe6c50655d19d2d1424ad1","url":"build/js/AddressForm-BSGiU7mk.js"},{"revision":"d34431d6af509cd656dc0fa07b48836e","url":"build/js/AddRyeProduct-D7ZZXr1d.js"},{"revision":"72e96fe98af7d407bd7c67131fd2dad0","url":"build/js/AddShop-j42LziA5.js"},{"revision":"50318c411100d4c8b69954da00ff8feb","url":"build/js/Alerts-99-LCI5O.js"},{"revision":"7d81a60fa806c5318639cab8cf19f90b","url":"build/js/AllCountries-BD0NFDeE.js"},{"revision":"85f4688119177cc08567fd39d15841a1","url":"build/js/AllWishes-Ckbs3niB.js"},{"revision":"fa0c85cd348afdbdc56bdcf2792cc58b","url":"build/js/app-DytSPHSf.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"9b31bc6eb3da1543246d94ce01556584","url":"build/js/AuthenticatedLayout-CCa5Hi7S.js"},{"revision":"be2212af13230616a271b6f8696b688f","url":"build/js/Avatar-DYbD7y-9.js"},{"revision":"dd3a474aa5ead60b4628f831b48e2368","url":"build/js/Bill-DnlqTd5t.js"},{"revision":"371751863722bc5909a095a3c07f298e","url":"build/js/BillCheckout-Cj7vikfA.js"},{"revision":"d856191730b46cb917c4fdf8652776f0","url":"build/js/Billslist-BWStlvgL.js"},{"revision":"60cb855ce851f96c3589c1bed1bfbb8b","url":"build/js/BillsTracker-Cfj8UGuB.js"},{"revision":"85a9fbb443661a260b1bca4c12a4ae6b","url":"build/js/Board-DzAu8Pp_.js"},{"revision":"ccb6b4fe1ce2c7bab607648f393cece7","url":"build/js/BuyShopItem-Dr7bWOhE.js"},{"revision":"35b22aac2128fd3c5a0638287b077686","url":"build/js/Cart-By2yxuEJ.js"},{"revision":"e32377c76d164638fea05dbd8ef84170","url":"build/js/CartItem-CDthUQZx.js"},{"revision":"c9ef47969d80615237fde644fac48298","url":"build/js/CartItems-BrvpvKOL.js"},{"revision":"7ff27e5ab9020ffb6592b694626dcd15","url":"build/js/CartListing-CWRBd-8C.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"d0ec76507adc042e668f58f0eff0aff5","url":"build/js/CategoryLeaders-y83NNtkK.js"},{"revision":"9e318739018edeb0e45e3e06df37fae7","url":"build/js/ChangeCurrency-FpRcdJf_.js"},{"revision":"f051547afea4eccfa3b59eb24f8ee2a8","url":"build/js/ChangeVat-kZEjNKPa.js"},{"revision":"5ac40c1b587c67be577939289ab4e8c1","url":"build/js/ChartDashboard-BV_7KCPu.js"},{"revision":"d41e6e20ce4cb5b7948b04211b8d3428","url":"build/js/ComingNext-tYcjMMne.js"},{"revision":"ee5823bb37d37546378c6b9ba7075147","url":"build/js/Comment-CwlIbXMx.js"},{"revision":"6ce34ed9cdd8d92b7e46bdcab86dbafc","url":"build/js/CommetsLists-Dwz36gg4.js"},{"revision":"8833f0350f01ec91430b3aad49f7134c","url":"build/js/ConfirmPassword-DzPelV7Q.js"},{"revision":"35154327bada62dc0522a9cde087601d","url":"build/js/Countries-CxTnvskL.js"},{"revision":"e6ac544369389933af8049afe9038cfe","url":"build/js/CountriesShipping-C7qg4zbB.js"},{"revision":"94161b615912ac9d999160d1628e302c","url":"build/js/CreatorActivityWidget-DQOTPhTM.js"},{"revision":"2f893eac96f70b76ee50c419beeced88","url":"build/js/CreatorSubscriptionWidget-CrqQ0tZZ.js"},{"revision":"6759fdbe80237871b455d5874dcd2e8a","url":"build/js/CreatorVerification-B-DFZBza.js"},{"revision":"f43cf37c071090cd6cfacffd94d5e809","url":"build/js/CreatorVerificationNew-e_aiILSV.js"},{"revision":"76bf1420e64c70513f5e6566177aec61","url":"build/js/Dashboard-Ck3MGSth.js"},{"revision":"2a5bbf88b1c525bf593d69c7fe768f21","url":"build/js/Dashboard-TSk6Jaud.js"},{"revision":"635014f8f4aea74b6b766a40f006deac","url":"build/js/DeleteStripeAccount-fs5prfBu.js"},{"revision":"cf02786aa38e0247a1579bc420f6a9e9","url":"build/js/DeleteUserForm-CRK2jb7S.js"},{"revision":"fd3162a541d0bf154e3edd7dc5e645f8","url":"build/js/DiagnosticPage-CX1WJmuT.js"},{"revision":"896094d8263fe9e0354d877ef7c1e847","url":"build/js/Discover-C1W6TDOg.js"},{"revision":"150a20947ce5545d6685c7cf48e8b85f","url":"build/js/Earnings-ByubtOD_.js"},{"revision":"8507eade1ad11368a702b17c1fb096a8","url":"build/js/Edit-D0JWdxc5.js"},{"revision":"35ec89426bc46cf04afe52d7b2f1d4ee","url":"build/js/EditCategories-C9TyPdPG.js"},{"revision":"2f05fee3d3788e6c446891f20c17e475","url":"build/js/EditMembership-BacC7C7T.js"},{"revision":"0deed3f183e83df06e76b0d76e18afad","url":"build/js/EditProfile-BhjfRVC-.js"},{"revision":"c98df680b2f2363f86ddce473b6d2c18","url":"build/js/EnableCardCapabilities-QLm6aSG9.js"},{"revision":"b3455e5a6245cbb10e5b7fe30e2bc5c6","url":"build/js/EnterOTP-C2LM0QGc.js"},{"revision":"12096d8a8f95ccb58b5b743c6a3c9de1","url":"build/js/ErrorPage-18Ltrt8V.js"},{"revision":"9328739032cc37ecb60a11b1bd6e3250","url":"build/js/FAQ-DYd4w2Ax.js"},{"revision":"5817aa81d7791e13347649ee9b08a246","url":"build/js/FeedList-DQ1u2S4q.js"},{"revision":"bbf574f054e024671d83f539124d1736","url":"build/js/FlashMessenger-CackpL0A.js"},{"revision":"2954cb873485bedfb9b7ea9f585bb5f7","url":"build/js/floating-ui.dom-BKte_Y7q.js"},{"revision":"f1931c5a9782c30aae6602369f289c9d","url":"build/js/FollowButton-BLF48RCl.js"},{"revision":"f14d564343d57cc54a3f58f0a0176896","url":"build/js/Footer-tlfb3rbk.js"},{"revision":"503cf2c0387e43414343a4526aa1d7dd","url":"build/js/ForCreators-CJcUCug4.js"},{"revision":"ac8dd876440ee5b9a1fc72b5fff6144c","url":"build/js/ForgotPassword-E9frsEeI.js"},{"revision":"b2f78cf1d69c8db9aba770f939b46a48","url":"build/js/FunPart-BG_0MrIb.js"},{"revision":"e994a958bd4c4f9a2204ba081e72ea6b","url":"build/js/GetCart-DxbJ5m5-.js"},{"revision":"00e60441a45311a386841566fb71f8fd","url":"build/js/GiftAddCart-DGPc2eXc.js"},{"revision":"82b882047519bc454314c2b225c97bc2","url":"build/js/GiftEdit-C3zDTE9f.js"},{"revision":"9805c1400f066c28d3d05db4793a0363","url":"build/js/Gifter-CaOfF7UU.js"},{"revision":"b19ae745e3a130171e38561488fde210","url":"build/js/GifterCardVerification-DwPKeUEl.js"},{"revision":"8f6aacdcb7c665bba95da68d71f946ee","url":"build/js/GifterFeed-qlls-WyM.js"},{"revision":"7b069217129cc63fef06af0c35e4b1c0","url":"build/js/GifterItems-H5ns1CoZ.js"},{"revision":"98fe31fe9fa15888f937675a0dc212d1","url":"build/js/GifterMedia-DVqWF8go.js"},{"revision":"b2c66a9a816da362e85374104f8a5d3c","url":"build/js/GifterMembership-1Y4qiDDu.js"},{"revision":"a2162182e0cca8ce9d61b8512057a1c1","url":"build/js/GifterSubscriptions-CZJjvNTi.js"},{"revision":"ecffd5cbcbb0bdd49a763120c86de707","url":"build/js/GifterTips-BAPQL2UP.js"},{"revision":"4e1a34517ba2c1224e774b4d3b73443f","url":"build/js/GiftListing-B-8K-Rwb.js"},{"revision":"fd6ca45b124e23c94d6213c6f78132d6","url":"build/js/GiftStore-CDZXllG9.js"},{"revision":"4317c666af16dad7ded750dd3fcc399a","url":"build/js/GlobalCheckout-DFspP-S_.js"},{"revision":"689d3079ee0e2eee8334414d77e819d8","url":"build/js/GrowthTrends-DENffgd4.js"},{"revision":"18c4ca5e6c60d46c513e30a321845671","url":"build/js/GuestLayout-fW3hc1dC.js"},{"revision":"945c9b82f31c1464e387cdb80f78381d","url":"build/js/HappyCreators-DKSW--bI.js"},{"revision":"0e5565981562ec117cf415ac0bad6d3d","url":"build/js/Header-Cbusffga.js"},{"revision":"020ee1365044fd1074470e737666ad6d","url":"build/js/Hero-HDoSVUMV.js"},{"revision":"d91887dea10541a9da6b7cfa52a49b38","url":"build/js/iconBase-_q1t-nNs.js"},{"revision":"c459254ccf585e1ceb192f3b23e67be8","url":"build/js/Icons-Dxfq-W2d.js"},{"revision":"abd487c6985aa12836f21484b635e270","url":"build/js/ImageGenerationWithAI-BS1diheZ.js"},{"revision":"ccda67d77a61c7d828af144be096fb21","url":"build/js/index-4biSTpxI.js"},{"revision":"badbb792a37eec75e342022eeb5135d5","url":"build/js/index-50x1gRSe.js"},{"revision":"6770787d2130a5bf3154673d663921cd","url":"build/js/index-AdCgp9yf.js"},{"revision":"bdf98e410eb30228c8d29905551c3fdc","url":"build/js/index-BdkEX77t.js"},{"revision":"9c5d1002d24def1339a61867435905fb","url":"build/js/Index-bM_JfA9U.js"},{"revision":"bc4ccfbb88b6caa023c7fee3d82fe7df","url":"build/js/index-BpupipRg.js"},{"revision":"7a2f59968ef2a81181e2f18bbc48ec3f","url":"build/js/index-BPYcuKht.js"},{"revision":"30c59ab31fc46f70553377efb618c1c6","url":"build/js/index-Bv4UXcGP.js"},{"revision":"8350440753a1da93c807bd617f0ca687","url":"build/js/index-C7e7Gbot.js"},{"revision":"83714a3878f18b0e98775dd995a3f189","url":"build/js/index-CJhpSmyf.js"},{"revision":"761e5db5dc4f7cb26697de97f704781e","url":"build/js/index-DdQvUER8.js"},{"revision":"ce69d96232f9482e17039923771db32d","url":"build/js/index-DnOoXUpx.js"},{"revision":"0eb167fdf5c0a19333796174a5293922","url":"build/js/index-DnoRqWAD.js"},{"revision":"f341487dc4205f1df01a7142b398795c","url":"build/js/index-DXaqy4ex.js"},{"revision":"40b4c9b0d3b3cc04cf4045571a690fd3","url":"build/js/Index-DXIykehB.js"},{"revision":"b4ab18d6b3ce79d5c6316b506fd439f1","url":"build/js/index-hlprXHM3.js"},{"revision":"902fe00fe12310df384a3ce1bde369eb","url":"build/js/index-MRfY_sH7.js"},{"revision":"5c73d93d305b184ec25a9357df9150a3","url":"build/js/index-wDhyhEil.js"},{"revision":"5934e6f1f40dddf7a4d6b5a4cf01c6c5","url":"build/js/InputError-CK0Ekg7r.js"},{"revision":"458468dd64b939fdd42ae1615da66a50","url":"build/js/InputLabel-Dy4Nttjq.js"},{"revision":"b04d452d605801d975873b83271a3587","url":"build/js/IntrosVideos-7d_eJkr4.js"},{"revision":"97c4cad29b4f659f43e181c869799077","url":"build/js/Item-9ZzImqW1.js"},{"revision":"704f077078b279dfe1a7cfb475552f0b","url":"build/js/JoinUs-Bme9BOK5.js"},{"revision":"805fffb6d638c5d63b8efce2d6667509","url":"build/js/LeaderboardStars-DUvqyIr8.js"},{"revision":"f5a4fc8d6383f033d9029adaa5855ae5","url":"build/js/LineChart-DJHCmGiv.js"},{"revision":"6f20c2c0c16f7a291a63c983d5914229","url":"build/js/LinkTwitter-B-TBTv4T.js"},{"revision":"ad9d394353e8ec0ebb271623b20c4820","url":"build/js/Lists-QdGB5eJJ.js"},{"revision":"d4611d651ddd796cd5ad63b086d7c90b","url":"build/js/LiveBar-C2blVB23.js"},{"revision":"722d4ea2c223d8ff182427894bf996df","url":"build/js/LiveBarSection-CMMeHYPB.js"},{"revision":"e932d4fbcb52471a56fea237278557b9","url":"build/js/LoaderButton-Do7xO7RC.js"},{"revision":"9ca6b9a2ccc77c684584ef09449c246c","url":"build/js/LoadingScreen-_uEe8JwE.js"},{"revision":"68578e4e65326eb15a45e486eadc68e8","url":"build/js/Login-C6IBFuYs.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"8aa59c58d6ed25031a8819cf7e3a3f7c","url":"build/js/MagicBellNotification-DeYHNf_q.js"},{"revision":"9026428a9bade0743addd42d07f11df3","url":"build/js/MagicBellNotificationDisabled-CiUHtNKb.js"},{"revision":"c8322909d4cbb6e8c3feeb0a13db5c92","url":"build/js/MemberCheckout-DfiDMIaz.js"},{"revision":"0a2e71e5761b4121e55c736c00321742","url":"build/js/Membership_dashboard-BwihFvQr.js"},{"revision":"da34934c9d87c0cc3c8c8b2a4124bd06","url":"build/js/Membership-C2bmcLQQ.js"},{"revision":"aead3c9dce445ef46591b3a53973779e","url":"build/js/Membership-DysqwtZD.js"},{"revision":"340d84b3a1b7e1ec5f714b911f4f7ebc","url":"build/js/MembershipLists-By6Z2TEe.js"},{"revision":"839dabf74d7af92ad051ab159af41092","url":"build/js/MembershipsLists-BMSTC-Fy.js"},{"revision":"338a2046c14cb55a09710279a7339c4f","url":"build/js/MembershipTracker-3OAjq1yX.js"},{"revision":"ad08030689d1dbdbaad421632aae9057","url":"build/js/MonthlyRevenue-OdJQQ5nH.js"},{"revision":"456c3780d040c4b1ae412034f029de0b","url":"build/js/MyGoal-BcTyOWCN.js"},{"revision":"d5a2fd498476f24c5178466cd233173d","url":"build/js/MyShopProducts-BV2STi76.js"},{"revision":"7bfa795da79645ef8bcd3a74e52d2d19","url":"build/js/navigation-CG8U1M1i.js"},{"revision":"5c750271fda7927f0e5c7904237b36e2","url":"build/js/Nocontent-8pG511BS.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"783260f9923554151ce395ad2d80561e","url":"build/js/NotForBusiness-B3mDV_U3.js"},{"revision":"2079bd27d98fb8fda0ec7f9633e21a49","url":"build/js/NotFound-D57rrp1j.js"},{"revision":"589da47f809c281058de70cb1eb890d4","url":"build/js/OldSubscribe-BG0NIvRh.js"},{"revision":"4851d9d99e0c9e239a323905c388fb3d","url":"build/js/OrderDetail-DDjltlNn.js"},{"revision":"b0b05dac433e9166e29f64a3be53a598","url":"build/js/OrdersLists-BV9bOW09.js"},{"revision":"e187d2274f7484115d36edf6d57bde5a","url":"build/js/pagination-3ZQqMqm_.js"},{"revision":"ce5896d6fadb8d448b01572961bf26e3","url":"build/js/PaymentDashboard-CELjo_e7.js"},{"revision":"08c3af8a09d10a093df01e8a34e6a791","url":"build/js/PaymentSlider-CxYUqK5a.js"},{"revision":"b106e929db9e9ed76f5f1737f573f321","url":"build/js/PlatformAnalytics-LqoSx3gC.js"},{"revision":"d69f4b1a0c2b5ab3645c7bba34281827","url":"build/js/Popup-Dql3brIk.js"},{"revision":"d265e4ef9f9ab846cc039475f05feb75","url":"build/js/Post-D2VNbi_g.js"},{"revision":"c97d45a8cc37893beea0064a9958decd","url":"build/js/PostLike-D32EqIho.js"},{"revision":"010fa5bbaedb0be9be81e671daee725c","url":"build/js/PriceFormat-DUNEpnem.js"},{"revision":"79da42d72d72f68f2af70cc806988bcb","url":"build/js/PrimaryButton-BSfSZJIh.js"},{"revision":"14c9ea31f600d7f3d6b93bfa333e20df","url":"build/js/ProfileProduct-CkFfllOF.js"},{"revision":"c6d9d0dfba3e831516bc286ae5e8bc6d","url":"build/js/ProfileProduct-DRum-sUy.js"},{"revision":"3254cdcdd74f378558b83f26e9bff8e3","url":"build/js/ProfileProductLists-BpqV2mIL.js"},{"revision":"f8e8837ede757489fbb6d14a74010024","url":"build/js/ProfileProductLists-DLozZ4NT.js"},{"revision":"e91571877633005f72240101a205e5b3","url":"build/js/ProfileSteps-Cz3crCMD.js"},{"revision":"86b77ee2227c56e91e91a83c818c6579","url":"build/js/Promotions-DQbikinf.js"},{"revision":"ae1b5b79c8103248918bb22abb9155cc","url":"build/js/PwaTest-BBpDQwjr.js"},{"revision":"d50c9389d8501c51cb7c7193f31b5f51","url":"build/js/react-select.esm-D35L4Zkp.js"},{"revision":"f17c57c900f27e0451db876a88ac95fd","url":"build/js/RecentSupporters-BBJ1K-SF.js"},{"revision":"a5bbbbe882e76b60e51f477ef81a550c","url":"build/js/Redirecting-B3wiAqFs.js"},{"revision":"8c4a0abe69d67c4d2cfd8cfa2f7b95a6","url":"build/js/Register-Pbencc9S.js"},{"revision":"86a875a8800109794623d028454098da","url":"build/js/RemoveBill-OYvVEu8q.js"},{"revision":"99553e3c2dfc6f54013b6a33def1aa92","url":"build/js/RemoveMembership-C19DbQfv.js"},{"revision":"ca09824d59b7f26aed156ddfab08dea9","url":"build/js/RemovePost-B652elo2.js"},{"revision":"0b728751c3d815c9f5fed31612799e17","url":"build/js/ResetPassword-3I736u1C.js"},{"revision":"0d0a17fc72ab638bb02d0410a4b84f15","url":"build/js/SafeTransition-CyJcAYlq.js"},{"revision":"4eb0955a0e5a2f9f41277dd9afeb88c0","url":"build/js/SayThanks-Dv38GCK7.js"},{"revision":"2303fd464b4eb1ca99a99be00e97d03c","url":"build/js/SecondaryButton-aVXkycvn.js"},{"revision":"983a81849be1793c2b1da5dda4f49156","url":"build/js/SendTip-DeaGYZaT.js"},{"revision":"ffd2e05508412882793db3012882e22f","url":"build/js/ShareProfile-DNNWuZKb.js"},{"revision":"359c4528e5f1c47c6d543d166133198d","url":"build/js/ShopPage-CRhXz8M6.js"},{"revision":"c11266e007197ba367e23ca64dbb5fee","url":"build/js/ShopTracker-EkEByj60.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"dcbf0b99cdc68ebe6a2d20451bc52bab","url":"build/js/SiteSubscription-CQZNfNNP.js"},{"revision":"cb4e402fec6231fa0346b735e9bf222e","url":"build/js/Social-Cnqek8Js.js"},{"revision":"94ac00be2cf0a0187ff4a40a96cd0e79","url":"build/js/SocialLinks-dXGNJ5N8.js"},{"revision":"c032aa16959abdbabc3cc45e25f37af4","url":"build/js/sortable.esm-C3j85nku.js"},{"revision":"0a17e817abb4b0961e745ad2ad40cf9a","url":"build/js/Stripe-BMZnDvYq.js"},{"revision":"bcc9b2a6bef46d4c2a496f64906410c7","url":"build/js/StripeIdentity-C15E2NUJ.js"},{"revision":"899fcc4bb5f7b1c4809d4816559e5d42","url":"build/js/SubCheckout-BNxSWzJW.js"},{"revision":"94b963f329bf26e3089767e283563a39","url":"build/js/SubcriptionEarnings-D-WbJpGF.js"},{"revision":"5b58fbee6ccea9c9bce422510d8ab9d5","url":"build/js/Suspanded-CBmG6cNl.js"},{"revision":"b0ddaaea6571a31f99aff14ef0e2c7de","url":"build/js/swiper-react-CmCiZ5wS.js"},{"revision":"d1dc4e8a2868ade66a531b7826a84c82","url":"build/js/TabbedDashboard-BC9QgnmO.js"},{"revision":"c0ca6dd222db18649bc86d47355b2daa","url":"build/js/Terms-BlntZ-XH.js"},{"revision":"725566a17719360357c03586557b8c02","url":"build/js/Test-DkIDp-fF.js"},{"revision":"c574659c5220643019752404b20e8c94","url":"build/js/TextInput-D6WMpwW2.js"},{"revision":"64e409a9443e9c243d251e79bfd2fc67","url":"build/js/TFA-CLlc6fN4.js"},{"revision":"bff38719c0a8ab9577712f932780890f","url":"build/js/Thankyou-CN1Y1iZF.js"},{"revision":"2312a6176ab36b2f2939b7f0b29e8b0b","url":"build/js/ThankyouMessages-JDEb4nkN.js"},{"revision":"d450cedfab70d3d76dd8f8555c6fbc54","url":"build/js/ThankYouRye-kOCRC_Qy.js"},{"revision":"b617d8e1e568ff775987bb73c3551a0a","url":"build/js/TimeFormat-totiFUIR.js"},{"revision":"7adb3dd6346ffb0d4d267e2626998e39","url":"build/js/TipInner-CErUDDqK.js"},{"revision":"f39d0785c8de878152d91851d1c5a5e0","url":"build/js/Tiplisting-CKw8ncc3.js"},{"revision":"ce92d76c3815faea3f6e5a1b6ebdac6c","url":"build/js/TipTracker-COVbBKUh.js"},{"revision":"289c35f735027361c4daa9164728fe85","url":"build/js/TopEarnBills-Db0cpY43.js"},{"revision":"2774be04c0bf82b58e423ce735dd5b8e","url":"build/js/TopEarnWishes-Dvd7awaZ.js"},{"revision":"386b988c88708734b52aec549451f4b8","url":"build/js/TopSupporters-CRVKWs2W.js"},{"revision":"5cfaeff1992d008db1baca5900c48186","url":"build/js/TopSupporters-DvqJUwvE.js"},{"revision":"77c571c82e25592d0e236e8878bba205","url":"build/js/TrustBox-Bm4lL-WK.js"},{"revision":"0cd27b2c690d9bc2b38c05e1cf2f6a0b","url":"build/js/TweetNow-Bpy-_ZsY.js"},{"revision":"70b3288d1c9a70c56b3abd0059b9d188","url":"build/js/UpdateAvatar-UnloKjot.js"},{"revision":"bcc1de293d54485cc4bbf5d8e66cf838","url":"build/js/UpdatePasswordForm-u3Z5okVi.js"},{"revision":"7cbdb397cf8801ed9c334342a6287262","url":"build/js/UpdateProfileInformationForm-x4_BZ77z.js"},{"revision":"a8837f2af52cdcc5b339f4f1350b9c96","url":"build/js/UpgradeStripeAccount-D14q52bq.js"},{"revision":"270ee00f250a5082e8a02101967ed439","url":"build/js/UploadcareEditor-D00UpZgp.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"b2e71a7e3260e49a556ded4afbaa5b79","url":"build/js/uploader.module-B1_flUe-.js"},{"revision":"cdf5cf884379fb481e5f31d74cb915be","url":"build/js/useDispatch-Ve1cRIH3.js"},{"revision":"6a2cb9b35eb2ed29aac013ed0692fe38","url":"build/js/UserCarts-DOaPKyZb.js"},{"revision":"45b72b23bc57e3b2998d6da52d51381c","url":"build/js/Userprofile-DkDv33PA.js"},{"revision":"5fad9e0368fa9646138816884fcd73be","url":"build/js/USTERMS-Cr7C6eX3.js"},{"revision":"95ca1a940eeaa705ec5ab6e5b8d22d54","url":"build/js/vendor-inertia-B0gN9-jw.js"},{"revision":"3a0c62bdb13820b942fa3f66abf49fa9","url":"build/js/vendor-other-DUKlal67.js"},{"revision":"23429022c41659863839aab8d9abc5b6","url":"build/js/vendor-react-BBFuw5Uv.js"},{"revision":"792b909014218c09ae5c7461518a9fde","url":"build/js/VerifyEmail-Dpk3fiIV.js"},{"revision":"7231f69adb5872b9e7476b4fd076a9da","url":"build/js/VersionUpdate-B736qwIE.js"},{"revision":"4eeb34a3d42a0525c41290f8e8350b6e","url":"build/js/VipSupporters-FuDIiKgB.js"},{"revision":"6a091b3505b47a1323dd40abcb48971b","url":"build/js/Welcome-BM5qhOag.js"},{"revision":"932c306a79e50294ec72027e3c4cd8b3","url":"build/js/WhyLove-nVpKtbPD.js"},{"revision":"8127611759318688a8b00f3753be63db","url":"build/js/Wishlist-CSwH-ET7.js"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"63579499a7b68cc6783517c1ee2cdff5","url":"build/js/Wishlistbox-C5yCi9OH.js"},{"revision":"c5d4d0a561466550584a06a41f7c70dc","url":"build/js/WishlistGrid-Cp57-fPk.js"},{"revision":"c633e659a0393437ff1d1226dd935d4d","url":"build/js/Wishtracker-g4sm8dKc.js"},{"revision":"df10db8b646ceb4157c884e3c9c780c3","url":"build/js/Works-BeZ_Muef.js"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"80db4b9cdb872658c4530a24e17131af","url":"react-emergency-patch-v2.js"},{"revision":"b5aec4061f7c0fb48b2fae8a756a5449","url":"react-emergency-patch.js"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"ee1f47252255da09aa0f48b75fa9e458","url":"storage/content/vTlBIrqMv6mV4MaN9CGsBLyE1lpIxMXFN8gJWMOJ.jpg"},{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"}]);

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
