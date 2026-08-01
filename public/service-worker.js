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
precacheAndRoute([{"revision":"0542490e3b0e14e6b7633d4712086de7","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"b966f3b4b225ef11f23c936dbc876aec","url":"react-emergency-patch.js"},{"revision":"6dcbc0359d538c8c05e4f5e503623142","url":"react-emergency-patch-v2.js"},{"revision":"fb579e404c8c059148d3e5c1c297cec9","url":"react-emergency-patch-simple.js"},{"revision":"5151b6ba20822ebc99dd428afad13c09","url":"og-image.png"},{"revision":"e12052e5d73497f23d5e74aa1b92fe48","url":"offline.html"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"__logo.png"},{"revision":"d7530aa0b7587e627484c49fdf8f13f2","url":"__h2c.js"},{"revision":"2ffbd0f6d2fff09dadb47661f21b4886","url":"__cardtest.html"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"6000ecf6346a571d37aa6fa49d789f41","url":"build/js/wishlistbannerimg-NS5UjTM5.js"},{"revision":"b642cac6733499f6c76d7681fdd8631f","url":"build/js/vendor-utils-CntoPDqQ.js"},{"revision":"fe2d219e943670adf524b0d970e71287","url":"build/js/vendor-uploadcare-BDoaWJnB.js"},{"revision":"bfdaa3936670553986c955515f94bf76","url":"build/js/vendor-ui-gA9543TQ.js"},{"revision":"e70b1e2163bdf9952a221a9ffaf08410","url":"build/js/vendor-sentry-Ce0nzLH8.js"},{"revision":"779c4ce725b925c4358908a0ca0c831b","url":"build/js/vendor-core-BYgqvWPV.js"},{"revision":"24c9b1aaf8d42c4283ac793516e803f2","url":"build/js/vendor-charts-BBBRhKPX.js"},{"revision":"122f5e906d4caa01294bd3ec8a72f6d5","url":"build/js/useIsMobile-C2LHD1G7.js"},{"revision":"e05683432e3aa12d28dc29bb4d29d4b6","url":"build/js/useBundle-3mHQa36h.js"},{"revision":"e269a6ad227115ddead84e3d65e8c329","url":"build/js/use-transform-9xNSndxn.js"},{"revision":"03aa29988c38a560183ae70fb030f68c","url":"build/js/use-spring-qgtN-V7l.js"},{"revision":"84f3f782ee1a361f5b70afb817d67559","url":"build/js/use-scroll-DOhifVr2.js"},{"revision":"1011a490f921f8d639a3d274169accdf","url":"build/js/uploader.module-WPwqfN-p.js"},{"revision":"229d197d43beac0d609d326577b22fad","url":"build/js/uploadedimg-D1VcuZCU.js"},{"revision":"a3190283bc6bce8cd0b8f61542ccc0d4","url":"build/js/swiper-react-BISWe8Oo.js"},{"revision":"3a9275835b7a312c9d51c251feab510e","url":"build/js/sortable.esm-CKODKpDw.js"},{"revision":"c3ce91c754120df86ebebb52766440b0","url":"build/js/siteicon-Cyo5bMMW.js"},{"revision":"baa4e23a5130829943ac1e132f28e4fc","url":"build/js/rewards-BMrZWIuC.js"},{"revision":"ab37da4c641c1d8f00f72175c012251a","url":"build/js/rankTier-CSxoltpN.js"},{"revision":"0f3e2004b6b2d812f434113d24e0e113","url":"build/js/pagination-CJG6fZaq.js"},{"revision":"ead2e0874cf7204460da1f17aa252d21","url":"build/js/objectSpread2-NJXvI9oq.js"},{"revision":"2e1e435271d1e905fe1bdd12b1f198a4","url":"build/js/noresultimg-DAx_V9WP.js"},{"revision":"11c10dbbe0533b9efe14926df78f22b1","url":"build/js/navigation-CaYVtIkj.js"},{"revision":"dd5282ce72b047ea5e63fdde6f395141","url":"build/js/lucide-QGuFU2xM.js"},{"revision":"896cf4691f5dbd5b9dc159950b551936","url":"build/js/logo-C7Bb5Y0p.js"},{"revision":"1aec0f0e8cf27b9490fde69538f86467","url":"build/js/index-Kccfeczc.js"},{"revision":"c968ccd86843ca4ac56e7f879fc9726f","url":"build/js/index-Ddx7oR95.js"},{"revision":"3e7cdb6bc5e9f9ef51644f4070442456","url":"build/js/index-DTiX_B6D.js"},{"revision":"8ddef89b7bb57c1b860fe909409caae9","url":"build/js/index-CHATvERe.js"},{"revision":"464055b762a6dabbb0e58b1b9d037003","url":"build/js/index-C3pB4vud.js"},{"revision":"a79c5f8e97c39c386aa200d3c1a77493","url":"build/js/index-BsLKdd3h.js"},{"revision":"b69ccbb1429ba79ae27d848f3369a896","url":"build/js/index-BpYNDQFk.js"},{"revision":"a1a42f1f6912ece46822fd6feb77c717","url":"build/js/index-BnpDr8Is.js"},{"revision":"b3ac5279911c370e0c122674fe3acffd","url":"build/js/index-BgPUKxUU.js"},{"revision":"9f3cd633704552102d408c4f0907e376","url":"build/js/index-BZCmkbwI.js"},{"revision":"591fb47a136d75adcf67f669a53c0926","url":"build/js/index-0Yj3tqF6.js"},{"revision":"582546d80b7922eae5eddb5a6d12042a","url":"build/js/identityError-C4amBx3V.js"},{"revision":"53e5a947ae7edfd632e3a7814e70e4b8","url":"build/js/html2canvas.esm-BR9HutOZ.js"},{"revision":"4ec9536b7411d9c209c4167251260163","url":"build/js/formatDistanceToNow-BmHAjpcM.js"},{"revision":"2826bb009c601e14129744b42dc4833b","url":"build/js/format-B4tVp76K.js"},{"revision":"33628f9adfd4606d30123b1db31e600b","url":"build/js/floating-ui.dom-DUIavVAj.js"},{"revision":"27da43434e51900c1bbe8605a126762b","url":"build/js/exportCsv-BuqYoXxq.js"},{"revision":"edcbab0be2e9499520a2197e745a12a7","url":"build/js/creatorSubscription-D3qQ-QeL.js"},{"revision":"e49383337bb7c87eb45b650683a0a87a","url":"build/js/constants-DGqHWX9W.js"},{"revision":"f12984cfca8646401c8d3fd7b3a50988","url":"build/js/cartproductimg-2CiKhdaO.js"},{"revision":"3ef23024a8f782258e1637799e29be14","url":"build/js/app-GFzxq05f.js"},{"revision":"017920c07e25d3c095f7bcb06b422aaa","url":"build/js/YouBar-FpvrRaHZ.js"},{"revision":"0323371ca6fed94f24c1da0797d409e9","url":"build/js/Wishlistbox-CiTK0CEg.js"},{"revision":"930fc2a453a2b4398f64d34bd26d4a3f","url":"build/js/WishlistShowcase-BSwWVYWg.js"},{"revision":"3c4c5f420176083fd326ef2a738205d0","url":"build/js/WishlistPreview-WWyFgmhI.js"},{"revision":"fdbf12b89f744f4018b05c0ca2ba5276","url":"build/js/Wishlist-leOlLzGt.js"},{"revision":"50ab12dde61f82acbbea7378a0ac9e4a","url":"build/js/WhyLove-BAYY5Nva.js"},{"revision":"0a32c2d088cd7e6eab033558e7d15355","url":"build/js/Welcome-DsoDJsSM.js"},{"revision":"86e6c2ecaa70ee30cdd82c68017fccb6","url":"build/js/WatermarkStrip-CxnUnB8K.js"},{"revision":"1c4ade354b02b4e7fa6a4393f0b2678b","url":"build/js/WaitlistButton-Cu4emrOM.js"},{"revision":"fcfac194aed55a66a81c9e0f62d804e3","url":"build/js/VipSupporters-Cm_7qjKK.js"},{"revision":"d92f4d08d7a0d47b97259afff3300bfa","url":"build/js/VerifyEmail-Beosddhl.js"},{"revision":"b77bca4663dc5f59bb60fb5bcc9171b2","url":"build/js/UserSlice-Cjnpa8FY.js"},{"revision":"65c567cc4845507bef3cdf82c9a23936","url":"build/js/UserCarts-C74uN2jD.js"},{"revision":"a6413d37bea324b1ac451d48fe01c707","url":"build/js/UsAddendum-CgphvTDk.js"},{"revision":"8a4fda4fe71dccc6b7634af2bae8fe05","url":"build/js/Uploader-BaBXuzL8.js"},{"revision":"038b88253b75c65ec547d21d0f12a6fc","url":"build/js/UploadcareEditor-DaF4MF-i.js"},{"revision":"d21af541c52a4b716a0b614b19acf0f7","url":"build/js/UpdateProfileInformationForm-4jKJR-rP.js"},{"revision":"3b0e64fc13a71af9b09adac22130fb59","url":"build/js/UpdatePasswordForm-ccHZcCPq.js"},{"revision":"66c2edaee4e20019a4a20e3b3f026fb2","url":"build/js/UpdateAvatar-vCe449cf.js"},{"revision":"4d13c860e2388853918c3831f80da92f","url":"build/js/TwoFactorSetup-CLrl3iSu.js"},{"revision":"b3dcbc478bbfbea9f4b97ce94e0533fa","url":"build/js/TweetNow-D_IuIEfO.js"},{"revision":"5311ce8cf27027bfd5c65b1395caf253","url":"build/js/Turnstile-D3YVppMv.js"},{"revision":"f17b59fd4b77f8315a57eaea30780ee9","url":"build/js/TrustBox-4lfZ7cv9.js"},{"revision":"36d7f723d2e9cb5ec1cff5ec30d33fec","url":"build/js/Transactions-DGOSqLiQ.js"},{"revision":"ed269b70d6b558a0e035670482c2a4f5","url":"build/js/TopSupporters-_nr1lTYk.js"},{"revision":"9b4800544c385e85758f1d297e77936e","url":"build/js/TopSupporters-DO8GTbXk.js"},{"revision":"087001d4a2af466705dd59a77e2500a0","url":"build/js/TopEarnWishes-BC1JyGR7.js"},{"revision":"0b8ad53a2a609a93379ca6d00086b8b5","url":"build/js/TopEarnShop-emgomz_S.js"},{"revision":"7b934f5b1da7ffb46dae0e0c3f241a27","url":"build/js/TopEarnPiggyPots-Di2buVar.js"},{"revision":"5b56d9bacde7fa01e0fdc261ae04863d","url":"build/js/TopEarnMemberships-BKlt_kdW.js"},{"revision":"64ad700aa03742b54e106242baae805b","url":"build/js/TopEarnBills-BdoSKph8.js"},{"revision":"183efd994377004ef5bfd4fc9c18dc67","url":"build/js/TopBar-BzAjRvr1.js"},{"revision":"e6633baa205f9c71514d615d00ed355b","url":"build/js/TipInner-DRPjSfHW.js"},{"revision":"0dbd65f83110aba85b7c780deadaf16c","url":"build/js/TimeFormat-hK-QIZVg.js"},{"revision":"c1b286a7804a836c90523ab3922466a3","url":"build/js/TiltCard-CPf0cimi.js"},{"revision":"9c0b5f15b1f683f67ad375f3db8ea19c","url":"build/js/Ticket-CHMyL16e.js"},{"revision":"d951eaf6ce18f97b7eeb6725e1dfa270","url":"build/js/Thankyou-BeoPWoHC.js"},{"revision":"63051e82fdebcdb76f6053cdc595b283","url":"build/js/ThankYouRye-AUUegkGM.js"},{"revision":"fc93fb6d61e850ba61831102c4a3463c","url":"build/js/TextInput-BFhbr-8d.js"},{"revision":"73615c0864619c926b023056dcfb2833","url":"build/js/TestIntercom-D0fZQT3p.js"},{"revision":"282a8dd22ae36f40485a0de720e48dfa","url":"build/js/Test-BVAirEPt.js"},{"revision":"7cb6d721bc01ce93806b0fcd5490a945","url":"build/js/TermsOfService-Dr2cyk6m.js"},{"revision":"6147e480da626f2eda1a4a71d6ee2874","url":"build/js/TaskItem-BHQGZtR3.js"},{"revision":"cfe5168b7f9e9a77ac5643f31172b529","url":"build/js/TFA-D_fdRByQ.js"},{"revision":"e7458faa97aec7fcd8f9529b1b153fac","url":"build/js/SystemDiagnostics-Lfk6SAW3.js"},{"revision":"23d64cdb1cef9e7503d185345da51f15","url":"build/js/Suspanded-COHUdLwz.js"},{"revision":"b0dd8ffe7e6c9c5ba2f6bb83ba77c49e","url":"build/js/SupporterTerms-DAenm-dQ.js"},{"revision":"5feca65956d0181c1ea8ad26ed9d42bf","url":"build/js/SupportStory-ueuu5Cs0.js"},{"revision":"9731930d6f30007988dbd32c2f90804c","url":"build/js/SupportModal-DlAuRxms.js"},{"revision":"ad1695ebdc322c3ac18e476b65fde883","url":"build/js/SubscriptionEarnings-Dg4_dpOF.js"},{"revision":"51811402bfb87db1311a8af981b9c497","url":"build/js/SubCheckout-CPVCnrAR.js"},{"revision":"63bdbc9801f9627d2346c25abc68c048","url":"build/js/StripeSafe-BLVIom-V.js"},{"revision":"bfba726e5849f2477f47ec096691e766","url":"build/js/StripeIdentity-0iDCVsnt.js"},{"revision":"88d1f67852accb45f09644ab616cae88","url":"build/js/Stripe-bb_S8269.js"},{"revision":"cdbde9d43ef34cd57b7a3da885a9536e","url":"build/js/Store-C04Ro9qi.js"},{"revision":"8b051b5abe2933c4e8d83a57a719ee32","url":"build/js/StepTransition-Bjg5U7wi.js"},{"revision":"5f3668b5324abeef116116d418effac4","url":"build/js/StepShell-CvoQJmL5.js"},{"revision":"0a4c6324b63d568010022e42bc3a3e95","url":"build/js/StatementDownloadCard-DW-V9C94.js"},{"revision":"78153aee5dd13a0d2190ff09df13bd50","url":"build/js/Statement-DxjhSzir.js"},{"revision":"0be3c968bbefd11c1c6f820a088c0663","url":"build/js/StaggerItem-C1--CXO5.js"},{"revision":"9db1e4b4e5e9ef9f7f1286e1cc890af0","url":"build/js/SocialLinks-DZ81suFI.js"},{"revision":"64aa71af4751789d9717c7aec58cf84f","url":"build/js/Social-Dv-sGWRJ.js"},{"revision":"6a7d4859d6020943b824bb915a606493","url":"build/js/SiteSubscription-BCgfmshm.js"},{"revision":"839d3356fbbcbb90efc02ab8c87a6595","url":"build/js/SiteLink-1Dl0z3xM.js"},{"revision":"f9da598040fee982879cc88ea96d42bd","url":"build/js/Show-BSkMPPmt.js"},{"revision":"0e138cb47f6dc371a98ad8f5902c417b","url":"build/js/Show-BGxClsJF.js"},{"revision":"d8d0f10153415c9c2ea65776ffdb0bb6","url":"build/js/Show-B4N12gc5.js"},{"revision":"452d293a56bc3951b68d1a60aeb2f26d","url":"build/js/Show-B1X_BEKt.js"},{"revision":"23c36a1aedbe3c007a02169429ee4a76","url":"build/js/ShopPage-Ci9FMBLT.js"},{"revision":"46d86fdd251258eb13e119b9c00cd958","url":"build/js/ShopGuide-CoET64W4.js"},{"revision":"2c23bbe9e345e00ec8cb66d990a04ce7","url":"build/js/ShopCard-gp8Huwt8.js"},{"revision":"dca5e3d13c2215146b199d2f4ec07ef7","url":"build/js/ShareProfile-BojLuAxH.js"},{"revision":"6437770f6c67fcd2ef227f59f88394b8","url":"build/js/ShareButton-CnjJKlMb.js"},{"revision":"54c0393ed94ae27dc062d2e2441e61e8","url":"build/js/SetupSteps-CPt5Mi8K.js"},{"revision":"6946b30af4da3c0ec844aa0c445f34b7","url":"build/js/Settings-DL7j0k-T.js"},{"revision":"578132b8e0fd0a45a3f7e1e2f6c58b6e","url":"build/js/SendTip-B3mGUjCI.js"},{"revision":"ba91adf34b6b7935b6a3a2eb704096fd","url":"build/js/SecondaryButton-B-DTHEDI.js"},{"revision":"dd615a9e9444dbdeb87da321ac42e8c1","url":"build/js/ScrollX-BVGQ87V0.js"},{"revision":"fba172cc7d0f088d6037ca63a34445d5","url":"build/js/SafeTransition-BHSzkpUC.js"},{"revision":"4627dab07799fd1c34f576ca994d3ae8","url":"build/js/RoleChooser-tNfdGDEu.js"},{"revision":"2858af124c77d833eba892fcfa1b342e","url":"build/js/RiskTestPanel-uR5aQGG6.js"},{"revision":"ddc8cba0b5084d557d8753d1855ea8a8","url":"build/js/RewardSummary-DIW1-YQQ.js"},{"revision":"beefb58afd5a2ffccddea754e595be71","url":"build/js/RewardPreview-MNlW7KE3.js"},{"revision":"cbf4708eea8393049cb1ca648c71d4ca","url":"build/js/RewardMedia-DxWiUAOO.js"},{"revision":"e9bd4c143a2822ee05a7a0a898ac0f01","url":"build/js/RewardHint-COG7ak4h.js"},{"revision":"87cd6d519f81b8c788686ee68189310c","url":"build/js/RewardEditor-56hNBtnz.js"},{"revision":"d071ead1cec3b49ad87d8bbbb19e8ef7","url":"build/js/RewardBlock-B2U_P2n7.js"},{"revision":"552235be2d086af095513c37bab7346d","url":"build/js/ReviewStep-Bu5HyVCi.js"},{"revision":"560e3598b83d68219a06866ae41162d5","url":"build/js/ReviewHolds-MOxzkDUO.js"},{"revision":"a250d35445a7062ff3eb0fffb2514d4d","url":"build/js/Reveal3D-B0wi6M1X.js"},{"revision":"56f07f0877d86aab13039c095afb752f","url":"build/js/ReturnPolicy-C3O9PSQN.js"},{"revision":"94491cf9ee1774e253e0d1e033765631","url":"build/js/ResultsGrid-CUS6Z1Nu.js"},{"revision":"89a07f85101b630740afc3d2c6755093","url":"build/js/ResetPassword-CD70nso_.js"},{"revision":"50edf497af73e5a7bacff65473dcca37","url":"build/js/ReportContentModal-B0Odq7Ux.js"},{"revision":"0c19b6df08838a9105b3515cf7ccb1dc","url":"build/js/RemovePost-Cma_faqM.js"},{"revision":"6faed2cb4984a7d92f9ae7e9e5760a45","url":"build/js/RemoveMembership-CqJtWb50.js"},{"revision":"17ef4bf5470f1496eb315eb77a4b936a","url":"build/js/RemoveBill-BnMH9KCS.js"},{"revision":"66a88dce97885e2a65cf2d1614daf7bd","url":"build/js/Register-B06lJQ3s.js"},{"revision":"71347b67b35bbcdec59edd5d50d464a5","url":"build/js/ReferralBanner-BhiCXwqP.js"},{"revision":"4c8a7113a36fd62d491aac886724ef85","url":"build/js/ReferEarnAnnouncement-B8fIl15B.js"},{"revision":"1c67f59923c3a63dfd329bf5d0a2e512","url":"build/js/ReferAndEarn-BurUgbBk.js"},{"revision":"4f931092e63c95baa4de66d8804987d5","url":"build/js/Redirecting-CvC9DNui.js"},{"revision":"a44d2859a9a1c9b80e9b36101f55e0f8","url":"build/js/RecentSupporters-DqwUKfoH.js"},{"revision":"d4c5d454e656f58416ce9503fdc5917c","url":"build/js/ReactionsAndReply-BQTxpuHW.js"},{"revision":"f411ebc3ff51a975d5b163db4d8c1f65","url":"build/js/RankRow-v5QDkNsI.js"},{"revision":"5f407c2a4941e4ce37b58614ed937d28","url":"build/js/PwaTest-DFQlE5oj.js"},{"revision":"37bda961d050d019c550286a9a137c3f","url":"build/js/PurchasesHub-C4XlsYTU.js"},{"revision":"6eb23e3a883dfa3f396d766fe9ac9d3f","url":"build/js/Promotions-CmNWWhsX.js"},{"revision":"82b3fda2a01670b7fa56cae88125d20f","url":"build/js/ProgressRail-CxrwvH7W.js"},{"revision":"7cf2ca90120b4243e48bb6334fdc3a65","url":"build/js/ProfileTaskLists-Cqy7efOP.js"},{"revision":"7c761f240674749ae69dc112c7e032a0","url":"build/js/ProfileTask-Cc7eokQb.js"},{"revision":"7c94dbccff1fe2de08e4170721e9da63","url":"build/js/ProfileSteps-iTI6Uae0.js"},{"revision":"7c722519e55c8ef9f27782ed47d7e5a5","url":"build/js/ProfileProductLists-uUQXItSM.js"},{"revision":"2b1c85722b624efe3b705c1f43849e1d","url":"build/js/ProfileProduct-e_eTO5Im.js"},{"revision":"61a57bf796a8a42dba97d3ae9de2c2c0","url":"build/js/ProfileProduct-Dk2SOUsg.js"},{"revision":"0075fc616ea3826c1ec904900e169d19","url":"build/js/PrimaryButton-Ca-uaHbY.js"},{"revision":"9c7c6544a7a4ab7c7351cb54f737b3e8","url":"build/js/PriceFormat-Dmsv8WaY.js"},{"revision":"c7dae98c07ba4a3f0fb30cdb4d1e8e2f","url":"build/js/PreviewCard-pEg-sMKk.js"},{"revision":"13444d3a1ad3aafea04d43521a3b3111","url":"build/js/PostLike-B9zYrudP.js"},{"revision":"0d0a5532afecd93f6ef35704852a4ef8","url":"build/js/PostDetail-DireuU2Q.js"},{"revision":"542d84e98a433195f6b7c641c4e626e1","url":"build/js/Popup-CwvA5vqh.js"},{"revision":"fc7592951450a21e6145dfb06f0e2095","url":"build/js/PolicyNotifications-CB2NjbvS.js"},{"revision":"5e9231da442dc4596ee6a957265e5670","url":"build/js/Podium-CyCi0OJ1.js"},{"revision":"129a503805a4dca6f7b9cde0ec10ed83","url":"build/js/PlatformAnalytics-Bcr7F7Cj.js"},{"revision":"4f199eebc5fd096b8bf5a8f588640afc","url":"build/js/PiggyPotsGrid-Dk6YXyqi.js"},{"revision":"090f6de98c09a5e0a010e3608f07c2e4","url":"build/js/PiggyPotWidget-CrXc37Km.js"},{"revision":"c2f875c2642e056cdf081a6ee2001c91","url":"build/js/PiggyPotSocialProof-C8glGcGY.js"},{"revision":"62e1650c5fbe13d5caeed03f02e6973c","url":"build/js/PaymentsPolicy-6xSonS_i.js"},{"revision":"be3ac5138c45040ec4367fe429f2d5ee","url":"build/js/PaymentSlider-C6yEpXTq.js"},{"revision":"0295699d4f196a8f6e63b5b9b9a6954f","url":"build/js/PaymentMethodSelector-Dtvo5Z80.js"},{"revision":"a5add591c3b09cae4e9976f4b163b477","url":"build/js/PaymentDashboard-Clo4lKPJ.js"},{"revision":"03aeb66d751a2b03ddce0cb9683e79e8","url":"build/js/PayByBankAnnouncement-u_wDtkKh.js"},{"revision":"ece7ed78c3428d639cc6927dc68c10f5","url":"build/js/Parallax-BkokYjwW.js"},{"revision":"872485ae8c57e98656a5fa7a933f5394","url":"build/js/PaidTasksTerms-DNPrTGnn.js"},{"revision":"53f283403886308793b9c56d7fef06b8","url":"build/js/PaidTasksAnnouncement-CV1fiRtC.js"},{"revision":"7a58607b76a58df6f53b460d3cd29649","url":"build/js/PaidTask-tYSPVuqQ.js"},{"revision":"6de07d732eb68dd4a5975cc9301e2ac6","url":"build/js/OrdersLists-Cre3eawi.js"},{"revision":"e057c1fa4405d33dfd72ad2527cf81c1","url":"build/js/OrderDetail-ZXvO1MxO.js"},{"revision":"5b41a4fcc24647b32b23523332fb46b8","url":"build/js/Order-DxeiZA_L.js"},{"revision":"6794affd52e5e890e66f457151db6e86","url":"build/js/Opportunities-BdvrwALv.js"},{"revision":"6a3ef2f8699c67274169a248187180eb","url":"build/js/OnboardingNudge-Dbc8Kep5.js"},{"revision":"93f7a5fa06b30eb4f0cceef720e2e564","url":"build/js/OldSubscribe-X6LQin1v.js"},{"revision":"db9fb9620904327857efaab772b6c66d","url":"build/js/OfferAnnouncement-CxB0mRLu.js"},{"revision":"bc3b25cd3387f7003bf3c2aebc995253","url":"build/js/NotFound-BoVP8bB6.js"},{"revision":"8b4f16476f9a48523bbac84a7befb4c7","url":"build/js/NotForBusiness-Be9nty-U.js"},{"revision":"fcbe14e4409163699fa366da74699032","url":"build/js/Nocontent-DUWQVmhm.js"},{"revision":"313e35149f19c5720df4a27e1d0f1bb5","url":"build/js/MySubscriptions-CbdHElmK.js"},{"revision":"42d6a72a354ff105ebb66506e01a4994","url":"build/js/MyShopProducts-BNK0qCUe.js"},{"revision":"9abad59f0042ba7acc801fa8fc4425fb","url":"build/js/MyGoal-m3oKKtHq.js"},{"revision":"1d20c35b8d8bc6f845d7b5f90d81466b","url":"build/js/MovementChip-C_rF4Kch.js"},{"revision":"f297cae2a0c8f7f8d7da38667b282878","url":"build/js/MorConsent-BsOHNp_T.js"},{"revision":"d74415f5d7c8dadea849b001d241b198","url":"build/js/MorAgreement-Cp_otvnO.js"},{"revision":"97d7a609232246c30f2b69a563f035b3","url":"build/js/MonthlyRevenue-DPnyuRvi.js"},{"revision":"ea841c22586e4fd0a977db0b9be5d2df","url":"build/js/Modal-ZpF5OYVP.js"},{"revision":"9b93325d629c92918a93b0e739bb2565","url":"build/js/MembershipsLists-CuB9cllr.js"},{"revision":"4a93351d8e4e124b4bbbf73c0e70d0a8","url":"build/js/Membership_dashboard-Bmcs-RpJ.js"},{"revision":"eac55a6ea910de540ce29b39600931bf","url":"build/js/MembershipDetails-C72uq764.js"},{"revision":"6a87468c73d19dd55c52ccfd40f7dc4d","url":"build/js/Membership-QXqNzkEu.js"},{"revision":"796cca679387aab06b630a4575974831","url":"build/js/Membership-B8TpVTJ0.js"},{"revision":"76a3ef4d000495dcdf9de966c8c0f57c","url":"build/js/MemberCheckout-DdoKL-DN.js"},{"revision":"99f3970d97d5f1e27c4b9c3b5779f9e8","url":"build/js/ManagePasskey-Cm1MxiC_.js"},{"revision":"7e8530b787b71e8dd05ce27506bd5b01","url":"build/js/Magnetic-LQBJO1zH.js"},{"revision":"2f45db05f1b9f831cae3e0c8240379e3","url":"build/js/MagicBellNotification-BAZBvnrK.js"},{"revision":"e15be0d14b6547e2ea92994262a13aab","url":"build/js/Login-B-QHvG41.js"},{"revision":"824765905c12486363aa372c9defe2d5","url":"build/js/LoadingScreen-pMtUcdlW.js"},{"revision":"d54b0f3551d943eacf5da77ada7d341a","url":"build/js/LoaderButton-zEPPUwce.js"},{"revision":"daf63edf7db55d4ea9f1b81eed6f245a","url":"build/js/LiveBarSection-DILuZXFn.js"},{"revision":"c12d9b5b133e1ddd1e5e0e0bc2094419","url":"build/js/LiveBar-Dj9LsqLa.js"},{"revision":"39420f98fca80d929be1dbe0675ad312","url":"build/js/Lists-Ht9TQDtW.js"},{"revision":"4ddc1f33535a07714a319cf3e023e4c5","url":"build/js/LinkTwitter-BE0dn99P.js"},{"revision":"1cfac2d27c7f10eb8e36c55b5738c84c","url":"build/js/LegalLayout-BBt5Jdy6.js"},{"revision":"84c1ef68e4e3afcf0c9e01a205ed08cb","url":"build/js/LeaderboardStars-DrhB5ZhL.js"},{"revision":"a60e73fa7519c638ab67d6a60aaa6dfc","url":"build/js/LazyVideo-BALA85aG.js"},{"revision":"3dfc9198978d6f19fbf7f977b2c945f8","url":"build/js/Keep100-6VyUOjTn.js"},{"revision":"e1f03a883177be223715a8c96cda206f","url":"build/js/JoinUs-_fPQGCg6.js"},{"revision":"0b2af7dc90411eec84ed8c53f381ade8","url":"build/js/ItemFunnelLine-B8p8p4nr.js"},{"revision":"1a49af08ea01764309f94f4824239515","url":"build/js/ItemBadges-DaDZUZa0.js"},{"revision":"e7aae9a4a45e34b24562c4b4ffbc9d25","url":"build/js/Item-CrYIq_qm.js"},{"revision":"a0ba6d71d27567d4109687032f3259a7","url":"build/js/Invite-BplrWSQr.js"},{"revision":"f9610c65aef12d145e5a82950b5f1e0c","url":"build/js/IntrosVideos-CK6KJIe-.js"},{"revision":"4fd432e92ca63290dac081cd4b875a97","url":"build/js/IntercomProvider-BFfvgFBi.js"},{"revision":"72589522565f5b49f37b7a898f1c8080","url":"build/js/IntercomDebug-DYMge7O7.js"},{"revision":"76f2fba46c2222b77eebac3957b7add5","url":"build/js/InputLabel-krFL35D7.js"},{"revision":"1222810279f34904e74ad21ca376fb49","url":"build/js/InputError-Xshcs8OY.js"},{"revision":"ece32c330b637b98a49446599d532fdb","url":"build/js/Index-Dvs9xSir.js"},{"revision":"42a6a5a807c39d98ec2f09f101abfdc0","url":"build/js/Index-DoNzlI2K.js"},{"revision":"8d1fd0897e949dbbe98c0961bd190d00","url":"build/js/Index-DHvhdxUj.js"},{"revision":"b00ff11d0bbee173c9619468a30e210d","url":"build/js/Index-CeKrJr0g.js"},{"revision":"294af0e224db1785ede06208fa5322e4","url":"build/js/Index-CcODKQGx.js"},{"revision":"3ee1190f173c4b3bae5fc45566646731","url":"build/js/Index-CWaDin96.js"},{"revision":"66cb5b2f2b8c0458abba4087b83f66de","url":"build/js/Index-BoApB9fB.js"},{"revision":"4decc075f3a8e75013b063ed555cdb7f","url":"build/js/Index-BgV3hGgC.js"},{"revision":"6afa0a845cb06ec51f4a29214d0e7e84","url":"build/js/Index-BJZbd7fq.js"},{"revision":"52522f4c769023ab43be497675e2e9ca","url":"build/js/Index-BCL0KI99.js"},{"revision":"b3af5dda685b8f2e371745d9d8d21da9","url":"build/js/IdentityStep-CUt42FIo.js"},{"revision":"f07112307fb9be31d821cdfbaa1b20f7","url":"build/js/Icons-D_QwjpNx.js"},{"revision":"0637eeb2df5531aea8e42e07a649c947","url":"build/js/Hub-6oNM70fw.js"},{"revision":"d37bdc113ff5f1335c5ec824acb01b69","url":"build/js/HowSpennyPiggyWorks-2Hhp0vcX.js"},{"revision":"7a1ac15edeff20a0a2a1bfa312326944","url":"build/js/History-BOnYMWP5.js"},{"revision":"7be88506ab816fe09238e6e84971823f","url":"build/js/Hero-Bg32oBUv.js"},{"revision":"9e0120995876a0f4309d48d36c4792f5","url":"build/js/Header-BazEO2Br.js"},{"revision":"33982aef3562af368888ea782d9c53b4","url":"build/js/HappyCreators-zYAyMozE.js"},{"revision":"a89c437eaec4467f4b1e8970022d5f47","url":"build/js/GuestLayout-DlUa2lw0.js"},{"revision":"e935a76f1ea3d20611df37e626ecb4f8","url":"build/js/GrowthTrends-Dk1BXdTv.js"},{"revision":"16f2bbd4eef10ba64b4336c6835e698a","url":"build/js/GoogleButton-hErtV-C2.js"},{"revision":"7afffd961f3b22a5ebae161ee21259d9","url":"build/js/GifterPurchasesTab-DHpB4wtt.js"},{"revision":"14eb94446df553aee651b6604a12af50","url":"build/js/GifterFeed-CR-BCCqa.js"},{"revision":"711983e5d04f0ed28ab98a16131f5e69","url":"build/js/GifterCardVerification-miHeT18c.js"},{"revision":"ec914f878ebccad8bcf7a19e6e684590","url":"build/js/Gifter-DHwhWCsx.js"},{"revision":"f500653618591f7fc30611c4f2a6fcdc","url":"build/js/GiftStore-BV309TEk.js"},{"revision":"ee324140e23c2431c4a6377730815a96","url":"build/js/GiftListing-JFac2xyj.js"},{"revision":"20ed5b25f673d32ecbf817c8d0f6cecf","url":"build/js/GiftEdit-BQSJOfcy.js"},{"revision":"c96bf87d8cc3e673c90d3c624e1270d3","url":"build/js/GiftAddCart-C3Ql0ZWo.js"},{"revision":"c64736c7f452edcfc3feea0c11699947","url":"build/js/GetCart-CQ1ncp74.js"},{"revision":"784b5d7256540f33fc9097037ea613be","url":"build/js/FunPart-fnRhSwnW.js"},{"revision":"79f8afa9b18c2064a50d6f6c74519025","url":"build/js/FounderProgressTracker-DIxvCJHK.js"},{"revision":"2e21cbb48f401133d0b7fee5e601932c","url":"build/js/FounderProgramAnnouncement-C0lJHIO3.js"},{"revision":"93fb9263066810356b7a812d880e4aa4","url":"build/js/FounderBonus-18WBq8y9.js"},{"revision":"56641cc42319cf969e35b05c7e5cdc8e","url":"build/js/FounderBadge--CM3Sw5O.js"},{"revision":"ebb86d08dd465078cac280aa7b8a1b7e","url":"build/js/FormKit-6Hh67xo5.js"},{"revision":"3cf8590e3ab90fc90817bfa19ede7005","url":"build/js/ForgotPassword-DhDf00m8.js"},{"revision":"dac1053d9a8efb89a47c93523a112b47","url":"build/js/ForCreators-DHME3isP.js"},{"revision":"c43e54900759b44ee6ee72f30b2d7161","url":"build/js/Footer-qV8SQ3FF.js"},{"revision":"ca67420feb4f67af2b7d72449ff28c29","url":"build/js/FollowButton-JirmBZ7G.js"},{"revision":"52b038dbf06b97889083196188945abf","url":"build/js/Field-ONNRY8i7.js"},{"revision":"7c36e4e92b4ebd9cb9687223b7934a90","url":"build/js/FeedList-14diK-63.js"},{"revision":"91370fe69a8b7fa44ad6ac889a3dc70e","url":"build/js/Features-CCLbieEf.js"},{"revision":"f0db35523b73bacd1431c3900de33d7a","url":"build/js/FeaturedCarousel-Dq24y-KF.js"},{"revision":"8e39ceb8a73750a2835aad69f0df9161","url":"build/js/FeatureSuggestions-0lxFskIq.js"},{"revision":"90dfb4cfa066dd1515f25bd8a61d1e9b","url":"build/js/FeatureSuggestionSection-DRhbHFFa.js"},{"revision":"1d969efce5038004a2e92628a7f73503","url":"build/js/FeatureSuggestionModal-CoFFHNrD.js"},{"revision":"ef7c34bb32adf0d2a02300a54cedd5c0","url":"build/js/FeatureSuggestionBanner-BhTivdOI.js"},{"revision":"1df91631e7efa998eb7be90211898859","url":"build/js/FeatureShowcase-B1bAVokJ.js"},{"revision":"d1212969f058f40c7c25ea505ba5a7d6","url":"build/js/FastStartBonusTerms-Dk0rXYoU.js"},{"revision":"8587899083b5de1feed19ae29b5536a2","url":"build/js/FastStartBonus-BAwjkC05.js"},{"revision":"81b0e6157fd3272b7a879bb9c1eb4da6","url":"build/js/FadeIn-DqbRPXVC.js"},{"revision":"ad5ffac7ec5fadcd2cfc14a3de891b21","url":"build/js/FAQ-DKml8qJj.js"},{"revision":"aabade25044191a9838a5aef90e4dafe","url":"build/js/Expenses-DegO1S1i.js"},{"revision":"abd1ef9abd3dd679be1eb0df6825e9a8","url":"build/js/ErrorPage-DW2ppCim.js"},{"revision":"13758c64536d754f3e9b8745a2b6fafd","url":"build/js/ErrorBoundary-DegN3Egm.js"},{"revision":"75f2b434f79986a43192f2b88e526d0c","url":"build/js/EnterOTP-BSmgLxse.js"},{"revision":"ff10dc87d4b2e1c19522ac8a0698c9cc","url":"build/js/EnableCardCapabilities-Deg0-OP0.js"},{"revision":"b2538ff60334e189cc4c876e546c64f8","url":"build/js/EditProfile-CACNlqx4.js"},{"revision":"e575b49c9747fb528ed6e03171ab825f","url":"build/js/EditMembership-DtLeK6Cp.js"},{"revision":"67f11f0a92bd248fa84916a4c1f6d74b","url":"build/js/EditCategories-ERf6WDK2.js"},{"revision":"7696ea2202ed7d49367710d9730ef0be","url":"build/js/Edit-DKmltax5.js"},{"revision":"0ccba24a57ea7e93947fb99cef0e9adc","url":"build/js/Edit-CC54p_OH.js"},{"revision":"c80d384597f57d81a244482cc38bab50","url":"build/js/Earnings-BbRP1pta.js"},{"revision":"5cb11d1a6a67113357d77d130b0832b7","url":"build/js/EarnMoreAnnouncement-C1UXa4C0.js"},{"revision":"6c22ca2af05677871a65ae3ddd95d315","url":"build/js/Disputes-DDgooohG.js"},{"revision":"90b3f5fb4a175fe34a2683e75cd98349","url":"build/js/DiscoverHero-CIy6u7D3.js"},{"revision":"6053308f56d8f6a28ecae47a2e11a45f","url":"build/js/Discover-DjAmLlpq.js"},{"revision":"9e6da4532ab72d6e497bc8952bb246c1","url":"build/js/DeleteUserForm-BxoUsrhs.js"},{"revision":"310560b6f32c7ced54140d27f9cbcd1d","url":"build/js/DeleteStripeAccount-_96q4kjy.js"},{"revision":"8f3dde5944d53b31f676ab4ee89a4e21","url":"build/js/Dashboard-WV_3pfmE.js"},{"revision":"60a3db9e744367652c522d6079ec9c71","url":"build/js/Dashboard-D23qvgva.js"},{"revision":"9138342728112b2e6a50ff17a2abd570","url":"build/js/Dashboard-C9wchiMH.js"},{"revision":"6872a7600b53dc892d2719bc39beb13c","url":"build/js/CredentialsStep-B2YQHCAF.js"},{"revision":"aa07b619f6ba478798ec8ee095e69525","url":"build/js/CreatorVerification-CsAdRX1v.js"},{"revision":"4c5d857054efd96c59d8e8d2ada70f47","url":"build/js/CreatorSupporterContract-DW-dUuFz.js"},{"revision":"4a49ec48b9456ac3583538e76bcbe77e","url":"build/js/CreatorShowcase-DHRUd7yh.js"},{"revision":"6b2f45ba9d6df1398ccc625c876af919","url":"build/js/CreatorRiskBanner-DMF26TFj.js"},{"revision":"fe528626678862fed1a421d90ae90835","url":"build/js/CreatorProfileStep-Dxqtr-At.js"},{"revision":"b657a9d1a80ae36ab24b5f0c3e54f7fa","url":"build/js/CreatorGuideLinks-Dp-x9TIb.js"},{"revision":"284e46a9eb6a731d0df3ed7fc97dc7a5","url":"build/js/CreatorCard-DRfCbwuM.js"},{"revision":"ada9e0c3d7b148444876f818c1df39b0","url":"build/js/CreatorAgreement-iTt7xE0D.js"},{"revision":"a4b97cf69d4890ebb9e26b2eae9734bf","url":"build/js/CreatorActivityWidget-F8cNmw0R.js"},{"revision":"7cba3d0a5057d5496a472ddbe2666e76","url":"build/js/Create-DT3r_OLY.js"},{"revision":"50a52116ddfa89f4963c4489ee066f56","url":"build/js/Create-B_7oyTgL.js"},{"revision":"db8884804817e68ce9a33fa436647c9e","url":"build/js/CoverIdentity-B33PmUTb.js"},{"revision":"59c48f66d89d369078b175645df72b32","url":"build/js/Countries-DawwHXmc.js"},{"revision":"a3db7f46bc0894e7ae7f7a6cda61abf7","url":"build/js/CopyrightPolicy-DyH33hAk.js"},{"revision":"560a06b238f804b6ee8c1b910d4645ec","url":"build/js/ContentPaymentFramework-BxWYrwG3.js"},{"revision":"f9cd9d1542d94a6009ca09d79c22caf3","url":"build/js/ConfirmPassword-Ctcolj05.js"},{"revision":"edca45f6ae98aef90cc4bf9623a410fe","url":"build/js/ConfirmDestructive-Bp2T9D6E.js"},{"revision":"573a03512138ef730b2791852f59b38c","url":"build/js/CommetsLists-CBjYxGe3.js"},{"revision":"7c771031475c999826f800968a313fbc","url":"build/js/Comment-CC278czo.js"},{"revision":"6f728422f80a5b6550b4e24c11a75665","url":"build/js/ComingSoon-Bxk6_I2H.js"},{"revision":"1854bf4f15166bf25b0d7fcabec6e323","url":"build/js/ComingNext-DmBNfrR_.js"},{"revision":"9afeef48d632e681cba1983a190695b8","url":"build/js/Cinematic-C7C5G3-w.js"},{"revision":"b231890f8e36d1938ca6f7e760f874f0","url":"build/js/CheckoutLegalTerms-C29zViPU.js"},{"revision":"0051d473eda518f472c583c86e6e60b4","url":"build/js/ChangeVat-lPYlkg7n.js"},{"revision":"edd549df179f5b8db1e755b30c037325","url":"build/js/ChangeCurrency-BlkR-6X9.js"},{"revision":"11bc261fd40c1a28aaf760806a8a23ab","url":"build/js/Certificate-no5zNbz2.js"},{"revision":"9a777bd597bf3e1caae5649cc86cbf2c","url":"build/js/CategoryLeaders-C2tGneTl.js"},{"revision":"e7e0b11696c050448ce9f2462d5a391b","url":"build/js/CartListing-D0COLvOE.js"},{"revision":"ca149a3b0345ae931ba6dbd54fd263fa","url":"build/js/CartItems-CmoMcKtz.js"},{"revision":"71217fb3fc2cdbbce55a05d103abc6a5","url":"build/js/CartItem-BArzELO6.js"},{"revision":"2a35af05ecc3c2c05b64bc0982e47cc5","url":"build/js/Cart-CLfsOD2O.js"},{"revision":"42e187b50c5eeaa6f65fe13ca893e663","url":"build/js/BuyShopItem-Cq_0yHbu.js"},{"revision":"61484d69cda7b73585f75f8d20a37fd9","url":"build/js/BoardSkeleton--3gWA6dB.js"},{"revision":"cb48d142d250b9b2c66196e5c5ce3902","url":"build/js/Board-D0gm3Wzr.js"},{"revision":"a2f47272915e4b399d398ad108d7bcbc","url":"build/js/BlockedUsers-B1_4Uxt_.js"},{"revision":"a997d5c0d6112762eb0a7e0ca7d2567c","url":"build/js/Billslist-DnxMBAIs.js"},{"revision":"ad689d043b2346225ab377216aceb069","url":"build/js/Billing_dashboard-fZXLwcB6.js"},{"revision":"d220d4b4eeb86016c2b01a170e84a089","url":"build/js/BillDetails-ucSGdfM4.js"},{"revision":"b96456978a0ec83aeb0ef55b67c4b54b","url":"build/js/BillCheckout-BH0WUX0w.js"},{"revision":"68bdb7c0a2211f3061ed1af1a4391b1e","url":"build/js/Bill-CfzItyfI.js"},{"revision":"a4e06bbd74b703d2bba12b383af3f85e","url":"build/js/Avatar-NNT_x0kh.js"},{"revision":"f17cec6132b4cee00b45ba190d5142e6","url":"build/js/Avatar-CT7EBpUr.js"},{"revision":"4a88c1713e0a499e25c9cb61ac6c8814","url":"build/js/AuthenticatedLayout-5R7YVKbN.js"},{"revision":"e4675a3db250f59fee18078480bd0f9b","url":"build/js/Analytics-DtzhJ89I.js"},{"revision":"de4458430ebc4d680c4c5ec96e91a2be","url":"build/js/AllMembershipPayments-Tbsss44p.js"},{"revision":"7ef47de0b539cbb63065266d4594a91a","url":"build/js/AllCountries-1tsr4k13.js"},{"revision":"0cf01a958510516c714864497de59bab","url":"build/js/Alerts-DmG6xBg8.js"},{"revision":"3452876070757f5729d2b4dcd3e0d245","url":"build/js/AddressForm-otJgEhkn.js"},{"revision":"cecb746ec20aa9b718d20a260c3d9fd1","url":"build/js/AddShop-Bw_X7-V3.js"},{"revision":"752425336565017d3b17fd98608cb73d","url":"build/js/AddPost-KeqK-2lL.js"},{"revision":"9ed86a80a89efa1e2cfcc621f3d2bf07","url":"build/js/AddMoreTile-JE6hgutS.js"},{"revision":"155ac8325e867456defd2277b50685d2","url":"build/js/AddMembership-aa-lTQP7.js"},{"revision":"f193517aa04931383365f60d7a48d9a1","url":"build/js/AddItem-CypOlLnA.js"},{"revision":"aa18b5061cd9459b9e6f6761e6fd5f02","url":"build/js/AddIntro-SwfIxQ85.js"},{"revision":"e5b270fcc82705f95f6f183fbd54971a","url":"build/js/AddGift-DcSKDmR-.js"},{"revision":"fa163c2841c1878f542857844f4acc12","url":"build/js/AddComment-C1TjAOwY.js"},{"revision":"c4019daf95e5f65d8321899fdc4dac9b","url":"build/js/AddCart-DF8URLUu.js"},{"revision":"65445ed37f5114a24da90077e6a1f369","url":"build/js/AddBills-DWGQmsG5.js"},{"revision":"bb2770382b24df3d63f456065e541894","url":"build/js/ActivityStatus-DqOjM4Y8.js"},{"revision":"e9dad95c98ab8c6f164c974c4f93453c","url":"build/js/ActivityLogs-DLNo5MbA.js"},{"revision":"7d0e2f729d065f7f896b466e1d1917e6","url":"build/js/ActivateSubscription-6lE9OiUM.js"},{"revision":"1caf8b3fe6f320554a572403a413a3e7","url":"build/js/ActivateCard-DeVQWb4O.js"},{"revision":"8ff00c440bd6dd7e413e15ac384ad327","url":"build/js/ActionRequired-BmsRezbV.js"},{"revision":"2b1bf8278bf94a3268c2dd9e1ea3e8d0","url":"build/js/Accountsetting-6EI11Z-I.js"},{"revision":"8193672dbdf58b2054834f969f5ad3cb","url":"build/js/404-CPQTV-rW.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"b25664330b12c815ce97dc0374e7e259","url":"build/images/wishlistbannerimg-DknpQwC_.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"d664b27cca7eaf4d64c41622b5bb9b6c","url":"build/images/user-DLV4cRY7.jpg"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"a94faa1a93034ed70c0024dbb3fc1120","url":"build/css/uploader-BqAXSLBe.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"59f64916d28441ff3708d6f6a9a88e6b","url":"build/css/retro-bottombar-CD1n0nll.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"775c655b99341ca4476bfee5608a413a","url":"build/css/app-Dz52Lo7H.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
      const { matchPrecache } = workbox.precaching;
      return (await matchPrecache('/offline.html')) || caches.match('/offline.html');
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
