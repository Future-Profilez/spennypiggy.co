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
precacheAndRoute([{"revision":"0542490e3b0e14e6b7633d4712086de7","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"b966f3b4b225ef11f23c936dbc876aec","url":"react-emergency-patch.js"},{"revision":"6dcbc0359d538c8c05e4f5e503623142","url":"react-emergency-patch-v2.js"},{"revision":"fb579e404c8c059148d3e5c1c297cec9","url":"react-emergency-patch-simple.js"},{"revision":"5151b6ba20822ebc99dd428afad13c09","url":"og-image.png"},{"revision":"e12052e5d73497f23d5e74aa1b92fe48","url":"offline.html"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"__logo.png"},{"revision":"d7530aa0b7587e627484c49fdf8f13f2","url":"__h2c.js"},{"revision":"16977d9b350b2eda40145ddebe86a855","url":"__cardtest.html"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"da0d1b810893e81afa6e08cdc563c310","url":"build/js/wishlistbannerimg-BwhrOAtl.js"},{"revision":"722106019ee8240842516a77ed414b17","url":"build/js/vendor-utils-BsG3DzZH.js"},{"revision":"51df37b2c4996bec13387efe5cc1423f","url":"build/js/vendor-uploadcare-Bo1mYtaH.js"},{"revision":"ba73ccdcad82c6a0354c11fd364cd52c","url":"build/js/vendor-ui-diX1SP76.js"},{"revision":"c1610ce6c42e1e930bcaafc8096040c0","url":"build/js/vendor-sentry-BLLLTmKu.js"},{"revision":"202a667af467ec6a4279639c39436c15","url":"build/js/vendor-core-D7mwu1kc.js"},{"revision":"eabeb26ecb6e993a6c2e9a3473029439","url":"build/js/vendor-charts-B04FSS-g.js"},{"revision":"b8c47406132d200c76c38ea8859cc20c","url":"build/js/useIsMobile-CwZfdMaw.js"},{"revision":"b6fe073e51d7f957b5ebbf3196d8e5fc","url":"build/js/useBundle-BPv0Tgt2.js"},{"revision":"da98efb453867ee59809c024ca384763","url":"build/js/use-transform-Calu-U6T.js"},{"revision":"84c8e70afd443a9e490e3abbbba50ee9","url":"build/js/use-spring-C7k2CTA9.js"},{"revision":"def1617e73ca0f2404fd383df199ab59","url":"build/js/use-scroll-kFAswD-E.js"},{"revision":"c2bdacb89d4a636116c8fba9215b3606","url":"build/js/uploader.module-BePTvlX9.js"},{"revision":"d85836a6bb7a5458f20d4f715126b942","url":"build/js/uploadedimg-Bi9errbB.js"},{"revision":"4bbf5cc49d6ad1e800baed6b62ab7550","url":"build/js/swiper-react-VPCAtjUc.js"},{"revision":"739636f00201720e2a645b1e8addba2d","url":"build/js/sortable.esm-BiBZ4qhy.js"},{"revision":"f573d863fe25ec6545d5e1a509ba3d84","url":"build/js/siteicon-CGcXVrPh.js"},{"revision":"4aacf256380e204f4cab7508ba00ccef","url":"build/js/rewards-DfWuZ2X5.js"},{"revision":"9592cd2180423661accb89841d10f8cd","url":"build/js/rankTier-9YsBkpH7.js"},{"revision":"0b2e187d4f02b8561427f2452af2bd26","url":"build/js/pagination-iveMel85.js"},{"revision":"f24ae0319563f211ac439d38c0b332c4","url":"build/js/objectSpread2-CAwati4y.js"},{"revision":"1e4ab61414ef37fad2666f9644ee7e52","url":"build/js/noresultimg-yFmARhzL.js"},{"revision":"908733538ff49d85a9117ab9b0492814","url":"build/js/navigation-tW8S0rkL.js"},{"revision":"9c99b2990aae59980d9adbfe8a2dc5ca","url":"build/js/lucide-m7Yq0IYk.js"},{"revision":"1d95302840b9412389714194a895385a","url":"build/js/logo-nxO0BDOD.js"},{"revision":"12a9c706b30874b65cb41963f714ace7","url":"build/js/index-pVDOevBU.js"},{"revision":"b24ee8c5f5199256a21f23cc4cdda3f6","url":"build/js/index-ZDxvsgrL.js"},{"revision":"0d5a4ed5d3bcdccd46bf6d077a2bd5f9","url":"build/js/index-RWG3-yhD.js"},{"revision":"4b6418eda225fa78affb27caaef03531","url":"build/js/index-DSUZRIyz.js"},{"revision":"127f79bd6448437d4c56a7a501280f0f","url":"build/js/index-Cu5Ly22E.js"},{"revision":"7a68c26e2c23b501565631c6ff043d10","url":"build/js/index-CY3WtVg8.js"},{"revision":"63f8367614f04c00dbbb6f94660e23ad","url":"build/js/index-CPmdj10h.js"},{"revision":"ebbe8b3c428315d84df47a9be37cdb04","url":"build/js/index-CEv5L-au.js"},{"revision":"019f875de97386f6de6cc9da919dc6e8","url":"build/js/index-BvOwSHSe.js"},{"revision":"b32c44b225a52bf0e0716a88d87b3b6a","url":"build/js/index-Bp6n8FzL.js"},{"revision":"c2605ea074adf97241abf1ed8788b139","url":"build/js/index-B-fk6kUH.js"},{"revision":"74a127a7a74282d4f6907f1cb744cd03","url":"build/js/identityError-CgHHIzv6.js"},{"revision":"6412b07dcef5553fe6bf40fb2355e3e8","url":"build/js/html2canvas.esm-BOxDzg29.js"},{"revision":"923e547b790fcbddcc142a577290af31","url":"build/js/formatDistanceToNow-hk5j-kqf.js"},{"revision":"8a0282aca418b6f22e22cec213c54524","url":"build/js/format-C34oiJU1.js"},{"revision":"32efe67f51aa680db9a26302ecd29bf3","url":"build/js/floating-ui.dom-C9M3bIaK.js"},{"revision":"83d2b98ac7129dbe3ad4a30d49f8e0ca","url":"build/js/exportCsv-6NX0ytpb.js"},{"revision":"a23f3473c8c3e5cd08c457eadb650934","url":"build/js/creatorSubscription-DvOmG8ge.js"},{"revision":"b1f4003ab3988cca60e8546e6d602ea5","url":"build/js/constants-DYUDLxSh.js"},{"revision":"6075462548a8e5e79d9207e3bb0e23dc","url":"build/js/cartproductimg-C0ao0Xea.js"},{"revision":"06dbcf7d978e35907cf4e971e6bdd612","url":"build/js/app-BZg0WBlE.js"},{"revision":"8de95137de3bb241bd02cc9298c32a3b","url":"build/js/YouBar-Bbu3r710.js"},{"revision":"7dc88a0c844d9694ccc19e0d775f66e9","url":"build/js/Wishlistbox-DAXaYF4L.js"},{"revision":"c77633731c3b02c9cf661cc5de8ec377","url":"build/js/WishlistShowcase-B9RZkuDr.js"},{"revision":"293b33232ac33c73cbfa3f07cf0629ee","url":"build/js/WishlistPreview-DFtghG_m.js"},{"revision":"db3818fb12f1fa6ae6e4d58a778301eb","url":"build/js/Wishlist-BKy2B2Re.js"},{"revision":"23a06ec3605324fc44cc751e04e076ac","url":"build/js/WhyLove-DEyds_ni.js"},{"revision":"a50e66855894aee26880e700adcdb3b2","url":"build/js/Welcome-D8oE2TH8.js"},{"revision":"8f64380f010667eb41c1e5ad7892dc54","url":"build/js/WatermarkStrip-BFCrbp-a.js"},{"revision":"322a664f8f9914b52a7da1849f3d31f5","url":"build/js/WaitlistButton-FXXRgH21.js"},{"revision":"e7485b869c406fc0b59bb6786a3240e2","url":"build/js/VipSupporters-WxUzXb1I.js"},{"revision":"612b5ac8be45b9cdde7d261907731202","url":"build/js/VerifyEmail-GDwxDKg-.js"},{"revision":"02257a4b1cd37da387a37d7ceac0446e","url":"build/js/UserSlice-ZEWAcIyz.js"},{"revision":"281b9181e5748d3a38cf20926fed89ca","url":"build/js/UserCarts-9_QB4bBT.js"},{"revision":"845a5da885b5ffa0ef32c1b6d4f563f5","url":"build/js/UsAddendum-BNnq4IjD.js"},{"revision":"97a8aeff417783c0df7503e490740ab2","url":"build/js/Uploader-TSxXC4Aj.js"},{"revision":"c5f3dd4cc90e4ac4128638b09955a26f","url":"build/js/UploadcareEditor-w2aeUZR-.js"},{"revision":"de8c19aa1655a08e47a4c6536baff999","url":"build/js/UpdateProfileInformationForm-DXA_22DO.js"},{"revision":"b34f4b9aece416d8013415e3ddd9f2b4","url":"build/js/UpdatePasswordForm-CDy4lpsj.js"},{"revision":"485519a73132f690a1c165abd63fc8bf","url":"build/js/UpdateAvatar-Dv8PrQTt.js"},{"revision":"3aef1bddd32bf021dc48867705654b96","url":"build/js/TwoFactorSetup-C3oTKjkN.js"},{"revision":"b92214aa9ef9065dbf15613882a11f08","url":"build/js/TweetNow-CP1hL_d0.js"},{"revision":"e514e8014d6e9afa6a2fc670f4a635d8","url":"build/js/Turnstile-DHLwo2YR.js"},{"revision":"3bfa86e9b6d13431e7b157d925fb8218","url":"build/js/TrustBox-BIqomwaz.js"},{"revision":"14a8027dcf487c9419d0be06efc9feff","url":"build/js/Transactions-BG7ZC-N8.js"},{"revision":"c19d1e03993afcf24f2a087003d7ce6b","url":"build/js/TopSupporters-Bo6o-HXc.js"},{"revision":"433f7b8ce0d509c7543c37cdb4fc8675","url":"build/js/TopSupporters-B_MtrW6V.js"},{"revision":"9c8ecd38e819dc087082ec81745ca6ee","url":"build/js/TopEarnWishes-CA5W29v6.js"},{"revision":"afd0a625faa7d105b7598f6e3ae0782f","url":"build/js/TopEarnShop-DOggZYy_.js"},{"revision":"5673f6aebb519801c6d5b09cd2d3a477","url":"build/js/TopEarnPiggyPots-D3u84a0W.js"},{"revision":"c8b783cdda32375e8ab8246a544d5f12","url":"build/js/TopEarnMemberships-DpUk8vuf.js"},{"revision":"d5b35428b45a22cf4923288415ca66ef","url":"build/js/TopEarnBills-BBpWISG7.js"},{"revision":"820f1fb57df720149326233531533ca6","url":"build/js/TopBar-Cq4CJTNg.js"},{"revision":"5471df0f383489a8720edae1c93e7347","url":"build/js/TipInner-DKoTtRPK.js"},{"revision":"0bcf781b82a9574f7b29b92275a94a34","url":"build/js/TimeFormat-DHrbSoo0.js"},{"revision":"2a9eca30521f0b34118b73bbd47253d2","url":"build/js/TiltCard-Ch5Krllk.js"},{"revision":"551573a377e31821109eecbe1f81f596","url":"build/js/Ticket-B6VzessC.js"},{"revision":"5daff4af8af0ec9d2ef648df01998cad","url":"build/js/Thankyou-DWjhsTOd.js"},{"revision":"2939c8998888e81e4389e2976e23b4e6","url":"build/js/ThankYouRye-BnAcu-AW.js"},{"revision":"a486bb8d22264be444aa608a3a6c19d7","url":"build/js/TextInput-CvjuoHgi.js"},{"revision":"f095f9a248fc735ff835f7212b38d3a8","url":"build/js/TestIntercom-I90nyVNc.js"},{"revision":"52831433e6200da0e98287b6fbcd52d3","url":"build/js/Test-eTBLtAYC.js"},{"revision":"ab779336cd36f29c1bbe4b288011815c","url":"build/js/TermsOfService-CjsEFFcT.js"},{"revision":"021542b919a3b5b94b2c6876c9088728","url":"build/js/TaskItem-DLtoEreq.js"},{"revision":"33f1d7f16d4b2e4810328c37b8eed0a0","url":"build/js/TFA-DY9yxklY.js"},{"revision":"d03ac917936b82f22e7b2340c18168db","url":"build/js/SystemDiagnostics-DyGsFE6W.js"},{"revision":"00bd3b544ef0a60bdf326bef1f7290be","url":"build/js/Suspanded-GIhqE7mm.js"},{"revision":"5c39176a43c6a2c8a0cab16134b20ce4","url":"build/js/SupporterTerms-1tPOH2sf.js"},{"revision":"b842d42b3b8c9dc35bbd974657faa12d","url":"build/js/SupportStory-BCkXdB6l.js"},{"revision":"307c4faab746a518f48dea41c3539faa","url":"build/js/SupportModal-D8D8cE3w.js"},{"revision":"b9efa56dc0b2cb3109aeb1f53b3e41ba","url":"build/js/SubscriptionEarnings-Cz6MC8qS.js"},{"revision":"8f08c927b706c2668e95a3eee785862e","url":"build/js/SubCheckout-C-kO2Evw.js"},{"revision":"eb59e300c913e87d85edd9c78cc935bf","url":"build/js/StripeSafe-D2r3OYUt.js"},{"revision":"ba97c8d246499ddd1e9f0495d1b6baa5","url":"build/js/StripeIdentity-CsTlG3v6.js"},{"revision":"7623017275ed23d3d32379664314b1f7","url":"build/js/Stripe-BNHKwNxC.js"},{"revision":"6292eb3022ec9d40a19bd02e09fa3db5","url":"build/js/Store-B6nzJJeW.js"},{"revision":"44e3478fbdd766826ba2fde126d45b2f","url":"build/js/StepTransition-CNaPEC34.js"},{"revision":"4ab944406627c85fd594f202cb9f16b2","url":"build/js/StepShell-Dx1Ojyl0.js"},{"revision":"ecb3b6211a6d966dc606d05efd341c92","url":"build/js/StatementDownloadCard-B1Ptx60T.js"},{"revision":"5e94fc1ca4d4f82ba74488ea9568ef76","url":"build/js/Statement-DwopcVvd.js"},{"revision":"e013fdf8b4f6fbfea2c62deeba77098c","url":"build/js/StaggerItem-k0fTzxbb.js"},{"revision":"c501c8016a05d933aaaf448c1ffa4f36","url":"build/js/SocialLinks-Y7rl1cTP.js"},{"revision":"61967a8bbcfc90420986d38226ee51fd","url":"build/js/Social-CzcW_fUW.js"},{"revision":"b3ac1a4c2b5d3e029b9a1a1a50b30bcb","url":"build/js/SiteSubscription-CeOjVFS-.js"},{"revision":"7a74d8c4e6b0db82253d2b115f1830c2","url":"build/js/SiteLink-Z7UGGGid.js"},{"revision":"4eee69ff7505840132e6a4ea17941c9a","url":"build/js/Show-TV8n4OdG.js"},{"revision":"0c4b937a2f23ba26cba744222bd64a7f","url":"build/js/Show-PAVGWbSK.js"},{"revision":"8bb2728270c283a3e7338f79b94889ea","url":"build/js/Show-DFVWgt39.js"},{"revision":"760e3ef26979668227e140849d5b826f","url":"build/js/Show--ujUadhh.js"},{"revision":"d5e03e23f1b8c7f014ac621931cc006b","url":"build/js/ShopPage-B3c1DNFZ.js"},{"revision":"38626ad660b65d466d2d027de7a88ee1","url":"build/js/ShopGuide-DlgTqIqp.js"},{"revision":"1f0df67b8cf24924a25f44b4522c214e","url":"build/js/ShopCard-KIEagZ5J.js"},{"revision":"126ab3961951ec7b1dcd38005ef2992c","url":"build/js/ShareProfile-BfFiWIua.js"},{"revision":"437d1e018211592d220e4acc948d5815","url":"build/js/ShareButton-BhCTr84Y.js"},{"revision":"f4e76f3ff529cc778409d3cf1db61675","url":"build/js/SetupSteps-DzDbeUDG.js"},{"revision":"a70d9b34efea2ce12683560cd7d305fb","url":"build/js/Settings-DdebNX2c.js"},{"revision":"7a541bc75a5b66329e64d003d9cecc9b","url":"build/js/SendTip-DjAgng_e.js"},{"revision":"8a8cb91703881eeda6fb4166ec21ceae","url":"build/js/SecondaryButton-t6M64tnz.js"},{"revision":"9963d2eb11a56dd748c78f4e93273249","url":"build/js/ScrollX-DhsqD8jl.js"},{"revision":"a01cb2e219cd907dfad65794e26db63b","url":"build/js/SafeTransition-DXlVMt8Z.js"},{"revision":"24014f5a13c7dbcfd357dc4031e4c607","url":"build/js/RoleChooser-DqLJAqJZ.js"},{"revision":"ecdc30378443933ce420dd44de6ee728","url":"build/js/RiskTestPanel-D9WYI-jp.js"},{"revision":"0886b52e5f0c43ab37dd151999084f21","url":"build/js/RewardSummary-iTbNOUp9.js"},{"revision":"50b38574742e6acbf089b089a7db286e","url":"build/js/RewardPreview-COR70wtZ.js"},{"revision":"945ed956043401d8cac6a63ab6fbecb8","url":"build/js/RewardMedia-Bz5Rx7Lq.js"},{"revision":"8a6a6b15adb925a5547fb9fd738ed78d","url":"build/js/RewardHint-BCv8xSkv.js"},{"revision":"73d4f69ea4a434fdf45f6a757892ff00","url":"build/js/RewardEditor-BkJbRrA0.js"},{"revision":"fcb55d22318ee8329de7c378eda3870a","url":"build/js/RewardBlock-BjOq6fBq.js"},{"revision":"d62770f2797001bb2091109512daed00","url":"build/js/ReviewStep-DZzmMkSJ.js"},{"revision":"b50ebde257127d3a71ee235ef69c0579","url":"build/js/ReviewHolds-DHAlH8Al.js"},{"revision":"7289364281e2f1f6b9622a6c2f22b2f7","url":"build/js/Reveal3D-CTSHRnZf.js"},{"revision":"1c2913b703450c700728e71a880ae4b9","url":"build/js/ReturnPolicy-DWeX4Mb3.js"},{"revision":"2a9fbb073e4a42efa5b16e17443ae0a5","url":"build/js/ResultsGrid-DUds3sAC.js"},{"revision":"040f44f5f17094fb71bff810ab98980e","url":"build/js/ResetPassword-BIy8jojU.js"},{"revision":"18ab910a54f7d834acf18cb9cffc8438","url":"build/js/ReportContentModal-DMbar8-L.js"},{"revision":"6abfebc43131804c323a741e2c925375","url":"build/js/RemovePost-tPzr2ZDC.js"},{"revision":"7043d1b2328f8a737155a3b17c235b8c","url":"build/js/RemoveMembership-DAlbQmws.js"},{"revision":"38b7351050d7d5e1c738c382599612e9","url":"build/js/RemoveBill-FIiDjw_C.js"},{"revision":"ba7f7db2080dbc6d9de45b6402a83d12","url":"build/js/Register-8K2oqYtM.js"},{"revision":"8e9146ef4ff8738383a321f132612ed6","url":"build/js/ReferralBanner-SDefHLqn.js"},{"revision":"4c422eb20998fdbe0d8c3d82687cd969","url":"build/js/ReferEarnAnnouncement-BFrd2hS_.js"},{"revision":"da64f6b77c95e78e1c27ac2ccc76941b","url":"build/js/ReferAndEarn-DwyiCbo5.js"},{"revision":"996c1c92551a5d91bb57a179b7c48aea","url":"build/js/Redirecting-DbfRlHSW.js"},{"revision":"1d228692d523837f76001376ee1a3b49","url":"build/js/RecentSupporters-BvTKpBAQ.js"},{"revision":"20fecf875f36d5513fe5331ca0fc694f","url":"build/js/ReactionsAndReply-D5nkIAvd.js"},{"revision":"7496707f9e76bc468fbc1166f7834044","url":"build/js/RankRow-BA6fPzwe.js"},{"revision":"fb696ebd7f46a1619f699b587f7d0364","url":"build/js/PwaTest-D9Hh2v9J.js"},{"revision":"d15630cd8a77619adcb85031accf224a","url":"build/js/PurchasesHub-BmbJNN_Y.js"},{"revision":"801367ed94217f62be88e5080f2e97d4","url":"build/js/Promotions-A7UAqukR.js"},{"revision":"e3e06ebfc5fe53e65d581bf4e359b69e","url":"build/js/ProgressRail-Bcs4G5Jq.js"},{"revision":"b17011e8ce43e16932a330d32183cb48","url":"build/js/ProfileTaskLists-Ce1uQ79j.js"},{"revision":"192d3cbc646a3e507af293243eb9f205","url":"build/js/ProfileTask-enWu7d5b.js"},{"revision":"bc549168efe0626c2c6fb471cfcba92e","url":"build/js/ProfileSteps-BcniWon6.js"},{"revision":"6af69c3d42ff7daa077ca5ffcc8517c5","url":"build/js/ProfileProductLists-ClQeRm50.js"},{"revision":"761842c64461248ec6b0bfda250b6ffd","url":"build/js/ProfileProduct-pGRVu71j.js"},{"revision":"9d9ab829a2ea01a813a2f8730c432396","url":"build/js/ProfileProduct-_mghI8_i.js"},{"revision":"dd4736d8df5f7862a6650000b9a78115","url":"build/js/PrimaryButton-a_vFaHg3.js"},{"revision":"6376967bf169e5e8d14d6f0c7b542bbc","url":"build/js/PriceFormat-tQ067z8t.js"},{"revision":"64c81d18f3a46c39bd990c6e7527517f","url":"build/js/PreviewCard-RP0bowAh.js"},{"revision":"ce2c633aa78a0b620615e17f19661c2f","url":"build/js/PostLike-CZmlZHOc.js"},{"revision":"0ce1c6fa50eeffe1c849acb8cc86cac9","url":"build/js/PostDetail-QWXoAPEi.js"},{"revision":"ae98b0cf656b1a42d508a6aa8225ac57","url":"build/js/Popup-eHm7tErU.js"},{"revision":"0e2ed60ee93f341dc306af4a1d58fe1e","url":"build/js/PolicyNotifications-BBabLNHZ.js"},{"revision":"65fb35987afd575c3f07f61d14947be7","url":"build/js/Podium-rI_mP5JQ.js"},{"revision":"889a7e31138b8b0c46dfb58821fd136d","url":"build/js/PlatformAnalytics-3N54E9bz.js"},{"revision":"7a5e3940c174c2e38add9db7d14dc3cf","url":"build/js/PiggyPotsGrid-_xR5BZru.js"},{"revision":"523a6c960057cec8ddade90b3610d2ed","url":"build/js/PiggyPotWidget-bFkurtT4.js"},{"revision":"4bca4eaf372ca5dcb4d3607963ed3d22","url":"build/js/PiggyPotSocialProof-xni_IoiC.js"},{"revision":"13d507aeeeee629b287c0123dac778ec","url":"build/js/PaymentsPolicy-C73Hb8Mi.js"},{"revision":"2ad2b9db651fa6b7bb9f3baeba42c8dd","url":"build/js/PaymentSlider-2t2g9RXR.js"},{"revision":"cc53b770a88c3661752efc4e09732b4d","url":"build/js/PaymentMethodSelector-CAbLGVra.js"},{"revision":"79195afb6a80fbacc2fede60d274d5ac","url":"build/js/PaymentDashboard-Dty8jRG4.js"},{"revision":"9b188c5aeb6fb640895e6740a293a535","url":"build/js/PayByBankAnnouncement-C8cyDft_.js"},{"revision":"9b846caf0ba17d55a7b61556c0ef5094","url":"build/js/Parallax-D-KYHmZU.js"},{"revision":"9130b3523558f50d466cf68ad7dce410","url":"build/js/PaidTasksTerms-DPdjBZmu.js"},{"revision":"52c2c72994522120e7dbbde4c06b63a1","url":"build/js/PaidTasksAnnouncement-Cc2KAeoB.js"},{"revision":"eda6beb51353e64201ed74673fa3729e","url":"build/js/PaidTask-C0SozuG-.js"},{"revision":"20fcb06b6ec2a7d369737c9a25abb341","url":"build/js/OrdersLists-OimbDcnK.js"},{"revision":"2d034e8268a356455cca0febd2034c37","url":"build/js/OrderDetail-hICj-USB.js"},{"revision":"2b28991a4a593e2aef8076c8b8a741c9","url":"build/js/Order-BARfwkng.js"},{"revision":"5ad2b10928d97dcb0b81553b47f7e310","url":"build/js/Opportunities-E1GGg05w.js"},{"revision":"3da071ddfce7cf1f694633f856db881f","url":"build/js/OnboardingNudge-m-CCqVQn.js"},{"revision":"b70bd5fa9301a5e5b61435b18fe6c155","url":"build/js/OldSubscribe-1Hf8nyrY.js"},{"revision":"e40232091b722f1665deb1a448e63ded","url":"build/js/OfferAnnouncement-CB8ldnGd.js"},{"revision":"4aee29a103220eb3020c9dc0b9e36aa9","url":"build/js/NotFound-z4OmLWmA.js"},{"revision":"b590ee8b69e3cd8030fdd9d34e70fe3d","url":"build/js/NotForBusiness-DlNAdeMB.js"},{"revision":"5db402042bdac6ed208094ec4a83c8c9","url":"build/js/Nocontent-BMnoejqg.js"},{"revision":"befd2695d389726d41613592355f7c3c","url":"build/js/MySubscriptions-JFbCGJur.js"},{"revision":"f84e83f3c1a237a369bb7869fb2303c5","url":"build/js/MyShopProducts-B8ogCADa.js"},{"revision":"d56706785b7cb4810db843c927d342ff","url":"build/js/MyGoal-BHh1I1Qn.js"},{"revision":"da67bd2d042f4dbd7125f00d2d152f98","url":"build/js/MovementChip-p9FMFPaC.js"},{"revision":"c42d2801ab8d83abbd23fe9ceafd8c00","url":"build/js/MorConsent-76Yewnuj.js"},{"revision":"7d2612ab8df996f069087f6c5c9bd2c8","url":"build/js/MorAgreement-CNMX-wy9.js"},{"revision":"32f213ed95a957236d1d23e1330a61f2","url":"build/js/MonthlyRevenue-Be9Aag_2.js"},{"revision":"c52e707dffdfa09727cca7702411e6e2","url":"build/js/Modal-BSGCCX9v.js"},{"revision":"a9ef572b82f38c4d7b77dd1f4a6e2d7e","url":"build/js/MembershipsLists-BxEyW4-m.js"},{"revision":"c915eff2af542a5661adfdcf7e308bfb","url":"build/js/Membership_dashboard-B2lCFldG.js"},{"revision":"d9f7e95ab99bf866fde22406627c958e","url":"build/js/MembershipDetails-CJwl5_fC.js"},{"revision":"5791e7b06a9bb02aeb52beab4a74ded2","url":"build/js/Membership-tJp2LC4w.js"},{"revision":"2fbad24a7dfb60f1193138b2c933a3a6","url":"build/js/Membership-BKrrWRe0.js"},{"revision":"eb96e0b291bb755fe5839ce92f27c56c","url":"build/js/MemberCheckout-vOVScUxJ.js"},{"revision":"6d6f822a8efaba114069d5235829d83d","url":"build/js/ManagePasskey-DqYcig6e.js"},{"revision":"c9fcc9b5a1823d63a2d19cd19dfa4394","url":"build/js/Magnetic-B1OsILiY.js"},{"revision":"7c25f829972fdec63e3d1ac8cf910030","url":"build/js/MagicBellNotification-CAT3ebXQ.js"},{"revision":"a6e0ff6c0493657e9056641b9f7188a2","url":"build/js/Login-BAox0qnb.js"},{"revision":"7e6ef0f6a7aee50e61915aef68c59258","url":"build/js/LoadingScreen-ZgN2vxiB.js"},{"revision":"407c7a49bddcd9923f9ba8f0f16bd89c","url":"build/js/LoaderButton-BwJzI6Y0.js"},{"revision":"a384f10b006a2a4a7b9dfc07162cf162","url":"build/js/LiveBarSection-ChH3clv5.js"},{"revision":"6bb1501dbdc0aa886f72807f04dce851","url":"build/js/LiveBar-Ca_7LUeK.js"},{"revision":"d12865db63f5ed311d3a69b1ae7fdaf1","url":"build/js/Lists-BJp0v0QJ.js"},{"revision":"d555055b0767293ac5af2e6b3084756d","url":"build/js/LinkTwitter-DvCtNzr6.js"},{"revision":"299690e0f0f3fbebe982fa878bcb0b37","url":"build/js/LegalLayout-DIYXPn2u.js"},{"revision":"303600971d0bff2427eba6c26ede07c6","url":"build/js/LeaderboardStars-BXylKX1_.js"},{"revision":"f18d621394fecdd9a28c564b44ec6cb4","url":"build/js/LazyVideo-BSlVepxP.js"},{"revision":"e11c3f81d8d4da202fdd92d2c28e7f0e","url":"build/js/Keep100-Cx3RqLgw.js"},{"revision":"84c10be48f5028d0d08bb48736b789c7","url":"build/js/JoinUs-DcVijWyB.js"},{"revision":"dbe1798e2eece8397d9ae1e03d5e5fe3","url":"build/js/ItemFunnelLine-D6Kq4GC3.js"},{"revision":"1e5c64b438358927db53acea26f929f7","url":"build/js/ItemBadges-DD95wPJF.js"},{"revision":"ecad309753711070d7c354b35ee18f1b","url":"build/js/Item-ByYFAdBB.js"},{"revision":"81029a0dc375452caddb45571e67db23","url":"build/js/Invite-N2DXUfC8.js"},{"revision":"99e2df1b99176b54b8a33417600144fc","url":"build/js/IntrosVideos-Ct9QppUa.js"},{"revision":"a1b81e5797a6b7e7d2f5c07ab6a0ee9d","url":"build/js/IntercomProvider-KMHI6jNy.js"},{"revision":"5333dff330c00f6f88d176ea2adf8e8f","url":"build/js/IntercomDebug-X9I3Bs8M.js"},{"revision":"f8ddb6b796a02aa0702f2ef5e31cdd69","url":"build/js/InputLabel-D9MG0u-F.js"},{"revision":"88575b5b3723e5bfd74c3bf1806e5c1b","url":"build/js/InputError-Dycg-pRl.js"},{"revision":"8a238b10a325fa5c3a1d0b7539b24f68","url":"build/js/Index-Yd1wuBiI.js"},{"revision":"ea864e7da93d33d0778a42e325c8b4ee","url":"build/js/Index-Dw_Enof9.js"},{"revision":"583321a5e8e0ae27ee058e63cd1a6864","url":"build/js/Index-DnX8YtoT.js"},{"revision":"c3e452c75cd8cfd5b65a65787f938ba7","url":"build/js/Index-DaTBzddD.js"},{"revision":"3a53dde7b7cdd57f2d992745599f982a","url":"build/js/Index-DPvsDVpk.js"},{"revision":"5bf7f2c75c8ad3b5b83f44caea0c348b","url":"build/js/Index-DDyX__FR.js"},{"revision":"38fba8a3493144b3e93b48738b9bc243","url":"build/js/Index-CyGE4oVg.js"},{"revision":"9e9b4a282fe7493d6451505fa9e624d1","url":"build/js/Index-BaNomSmG.js"},{"revision":"f6a635e1b5d9d4e38cf4c25e930a287f","url":"build/js/Index-BYVkKqpo.js"},{"revision":"e921172bc8b6fc42d458ad76e0e5873c","url":"build/js/Index-B3BMnCRd.js"},{"revision":"8988771ab1608ef1d49427218a680d02","url":"build/js/IdentityStep-C7zsX_4t.js"},{"revision":"c7750224c4837db23ae09d33287e6167","url":"build/js/Icons-ojIoEybV.js"},{"revision":"2960a7ee10719d434c35ad8fc93bd193","url":"build/js/Hub-B-hMdija.js"},{"revision":"8ec5fd62c08d4e3e6b5d7040fbe8e221","url":"build/js/HowSpennyPiggyWorks-BdbWOfpL.js"},{"revision":"a603f2ea205cc23eaf9e68cd9eb08e05","url":"build/js/History-Cs_MDCo-.js"},{"revision":"2dff1686730c671d7e20c3b347a712a0","url":"build/js/Hero-BU4uRDpf.js"},{"revision":"fdbed17818095c8f021ee39cfcf0b127","url":"build/js/Header-CH3GRzKW.js"},{"revision":"ed5cf8e49d05d91497719d88ed3b30b6","url":"build/js/HappyCreators-BFS4EpbG.js"},{"revision":"c23c149a71d2640ecb562d6cd0f5374b","url":"build/js/GuestLayout-DE2_X68E.js"},{"revision":"327411952f23dc833c5f0116ef6654ff","url":"build/js/GrowthTrends-CRHQiz5D.js"},{"revision":"0b8d765084723f7fb182a843b48e673d","url":"build/js/GoogleButton-CzRss5mZ.js"},{"revision":"d8ca7707f5d4676bdfc25ce43eee9e81","url":"build/js/GifterPurchasesTab-C2bBMG77.js"},{"revision":"055625d848f0f8d63940c38c853cfdc6","url":"build/js/GifterFeed-1-1UVBkH.js"},{"revision":"c53a2d3e9aa9ed5fdcab2289e63dfff9","url":"build/js/GifterCardVerification-BIZQ7lxM.js"},{"revision":"f453a0f70a4b1f0c0e6c16fc3e280d72","url":"build/js/Gifter-zrVcjDYl.js"},{"revision":"a5f8e7314e37c272811b2753c5579f1f","url":"build/js/GiftStore-DAdQLIn6.js"},{"revision":"34e7b22260032ad1497b637abd889d7c","url":"build/js/GiftListing-DiQMuFEK.js"},{"revision":"169984ea5145db332f14d0dc1da9327e","url":"build/js/GiftEdit-BOdTxNdD.js"},{"revision":"3a73aefca2acb580f96130f1d8a634cd","url":"build/js/GiftAddCart-ClNfjHmT.js"},{"revision":"b286509069df313d10247f6ed96ea1e8","url":"build/js/GetCart-DcGwdCX-.js"},{"revision":"3bf414c78a225ac7904d7a24aa6381f3","url":"build/js/FunPart-B2WAmlfA.js"},{"revision":"be9e98e417ff322ee457ef42836a14ae","url":"build/js/FounderProgressTracker-D0keT-4z.js"},{"revision":"ab0d0883adbf2952b229f4cd37db054d","url":"build/js/FounderProgramAnnouncement-DjRexOq0.js"},{"revision":"f7ab6abed18e4aff97e17c68bbbffb5b","url":"build/js/FounderBonus-DBtR0QR1.js"},{"revision":"61bfa335137de76e6c9602b7dca3b9bf","url":"build/js/FounderBadge-CD8fAUtS.js"},{"revision":"f33eed970a62ca7750d0ce901c03a323","url":"build/js/FormKit-V_HChQ3f.js"},{"revision":"3f736416f024f01c15f8cbe7a972096a","url":"build/js/ForgotPassword-Del0jBjh.js"},{"revision":"f3dc26279c79f09fc2810c2a6658e4da","url":"build/js/ForCreators-BQYya0v9.js"},{"revision":"344b0ce9533e636a6e68f3e61565830b","url":"build/js/Footer-Yjtas2CW.js"},{"revision":"02de0ae1905050520688d936a6463112","url":"build/js/FollowButton-Bvp2IvJU.js"},{"revision":"2780d04066d73dfd05acb493ba93df3b","url":"build/js/Field-D1O1oZr4.js"},{"revision":"f10893ec337129724fd871865fc95439","url":"build/js/FeedList-D_aoZKG-.js"},{"revision":"b9fa1a87666056445e1a373b952d68e9","url":"build/js/Features-B3d_D2kW.js"},{"revision":"f012f044ae0bb3cc0e23d87e9165d2e9","url":"build/js/FeaturedCarousel-D8Mrjrfy.js"},{"revision":"94593541746ab193866c08b589e45b34","url":"build/js/FeatureSuggestions-DJo05gRM.js"},{"revision":"c822b5a871987847564dae9c7e37830a","url":"build/js/FeatureSuggestionSection-CdNw0s4P.js"},{"revision":"48528dec61f374f656b737df3746fb41","url":"build/js/FeatureSuggestionModal-BoS6TJ3M.js"},{"revision":"7239814b91f9352fdc13b22adf0a4238","url":"build/js/FeatureSuggestionBanner-BAr1l5bQ.js"},{"revision":"2bb18c53db36a965cceb8131423a3fac","url":"build/js/FeatureShowcase-DIboldLo.js"},{"revision":"7f821e85e000bb80fa3cd6dca2c553d5","url":"build/js/FastStartBonusTerms-CAvB1dV0.js"},{"revision":"48a746230bef121e05e458eef9e5dba7","url":"build/js/FastStartBonus-PmzoqClT.js"},{"revision":"a4e4914f1a752b3d0926bad6aa299a7c","url":"build/js/FadeIn-D_1RVOPm.js"},{"revision":"016fb6683ca983670648181fd6bf0669","url":"build/js/FAQ-BqyEJbzG.js"},{"revision":"1058a02a0b9ed06afaaa9798d04a1da6","url":"build/js/Expenses-w2dcZVKg.js"},{"revision":"456127895b8419607e21087cc8e69fad","url":"build/js/ErrorPage-N6mBdC0Z.js"},{"revision":"75f958b9eaf40aa7b6248141df74577b","url":"build/js/ErrorBoundary-BafQdFGu.js"},{"revision":"4d731c933966fc7c399e014218f5daad","url":"build/js/EnterOTP-meY6R8il.js"},{"revision":"82e8142482c91bd16aee37a992a72591","url":"build/js/EnableCardCapabilities-BW9rQKbx.js"},{"revision":"66ab1fbe4680b35ec85374201ccb7274","url":"build/js/EditProfile-DHXmNEK7.js"},{"revision":"ce0b708728ed398530c9cd6dee7fecb4","url":"build/js/EditMembership-D3iu4sg2.js"},{"revision":"1ee10b7fdf92254ec5307aa83e10f12f","url":"build/js/EditCategories-0tIE5ZIJ.js"},{"revision":"eee44ae6bb40bee9f82de910b3eceac9","url":"build/js/Edit-B8DpihLD.js"},{"revision":"8ae8963d35eb1695836cbcd598a24cbb","url":"build/js/Edit-B6vrSIWD.js"},{"revision":"59f8b3dea6f77be85c068f656c90141c","url":"build/js/Earnings-DwXYVTQu.js"},{"revision":"1aabe0aa44219f4d5f810d52931e50a2","url":"build/js/EarnMoreAnnouncement-BBMr2BYI.js"},{"revision":"e226182bcc5b9ecfb1367c450a3282c2","url":"build/js/Disputes-41bi3XHl.js"},{"revision":"582c757f2fbf87b88c15fc6809b261aa","url":"build/js/DiscoverHero-CEiWMpBg.js"},{"revision":"0ef12f201f6aa12c5d5d7985b9d0be35","url":"build/js/Discover-D9ZpD9X1.js"},{"revision":"9d4ecb892c0d55fe5910afd6dcbbb10f","url":"build/js/DeleteUserForm-D2eLJRDD.js"},{"revision":"c23110f0c848655db4d4834d50788a34","url":"build/js/DeleteStripeAccount-APm56tcQ.js"},{"revision":"f7b3cca08fe2ad73b2d9e574a691fc9f","url":"build/js/Dashboard-CxqH-0U2.js"},{"revision":"9002b28ba4757b3229ff205e0712d680","url":"build/js/Dashboard-Bqt0a9n6.js"},{"revision":"d2b9ac9fe5b75a5ddebaa5905b29d674","url":"build/js/Dashboard-BfuV7-QA.js"},{"revision":"ce504874cc8b6dc8b5d569ca9f3c8813","url":"build/js/CredentialsStep-Dm5CsC68.js"},{"revision":"c2fefa8becdbcd9253e8b1856404648a","url":"build/js/CreatorVerification-BfLIhSMs.js"},{"revision":"6fe2bddd37ce04beb8da1a1abdfefefa","url":"build/js/CreatorSupporterContract-Xa1lH0n1.js"},{"revision":"0d25296d95de354ef03d419ffc6283bb","url":"build/js/CreatorShowcase-C4f3dIyj.js"},{"revision":"ad7a3f2504d0db6b1838debf36829448","url":"build/js/CreatorRiskBanner-BqJphjbO.js"},{"revision":"bf04334143380849fe75e80f539e4e2d","url":"build/js/CreatorProfileStep-Cv5UN7k6.js"},{"revision":"3a2f1249a27d5b6366b1ebe309f5a4e9","url":"build/js/CreatorGuideLinks-D8N6DnB7.js"},{"revision":"d79ace7c5f20c4e8faa34130cf5635da","url":"build/js/CreatorCard-BnOmbOTW.js"},{"revision":"b889d9bd4e9c2806be64c23002199c0d","url":"build/js/CreatorAgreement-QQfe5iuS.js"},{"revision":"092b0e91c41b942e2e48ce71649f0ec2","url":"build/js/CreatorActivityWidget-CACDI1qw.js"},{"revision":"a941c20e0f4c21bf342e9a12700410cc","url":"build/js/Create-R4JU1Vs5.js"},{"revision":"060825211245a008d0084e28a137bf06","url":"build/js/Create-BB1FJWUh.js"},{"revision":"f6702593cb5627b59aa9ad4a3856c72b","url":"build/js/CoverIdentity-Mi67qSfX.js"},{"revision":"2fa4a4e601e2cea3f4d23a0be1cb9df8","url":"build/js/Countries-C1g_KRt_.js"},{"revision":"7b5f70d34872f2e56074e4f040687678","url":"build/js/CopyrightPolicy-Bapn-2Fe.js"},{"revision":"c29a4af3df1a6f1ffb0374c49b0d67fa","url":"build/js/ContentPaymentFramework-D9LHvMmd.js"},{"revision":"e92cc5a3e4358e9d4a603a14ee549db0","url":"build/js/ConfirmPassword-E_jTKIUD.js"},{"revision":"081570aa693833b60ed6957ac26a697c","url":"build/js/ConfirmDestructive-9nqNsZqH.js"},{"revision":"0e30492430975a66c7ad9e7cc0ec5d78","url":"build/js/CommetsLists-b25AFA3P.js"},{"revision":"5a4aaa32be88fe37178d45a35775a002","url":"build/js/Comment-bGUBROPp.js"},{"revision":"65df0e6029548a8866c48d216d04cc3d","url":"build/js/ComingSoon-Ci4tL_uD.js"},{"revision":"317b5a157c05de7569a90546c6c78193","url":"build/js/ComingNext-6dgGFpmP.js"},{"revision":"ff2a741a9a4ac0c191fc21456d79b4e7","url":"build/js/Cinematic-BQQ1WtJG.js"},{"revision":"0a53f44d4efc008eb37a88534426cad1","url":"build/js/CheckoutLegalTerms-Bm1lcHP2.js"},{"revision":"d81f0adeac8f44104eb11dcd31eee416","url":"build/js/ChangeVat-D0CJJDU9.js"},{"revision":"863e8cd5b48244470d9a0e969ba9f927","url":"build/js/ChangeCurrency-D6BDazh9.js"},{"revision":"0f347d3beeda796c192eed297689371c","url":"build/js/Certificate-C_ziricc.js"},{"revision":"b665b5c6ddf976310943dbe3d0f90c3c","url":"build/js/CategoryLeaders-CcaMsC7t.js"},{"revision":"381d12a138577396e51abd944e87d6d7","url":"build/js/CartListing-B-zyl3kk.js"},{"revision":"c8a3f5587e2abb651836266334994258","url":"build/js/CartItems-CE18Xr8x.js"},{"revision":"c83e7b9c8b840874c1b2d15ea5903348","url":"build/js/CartItem-L4Lo4J4z.js"},{"revision":"8995deec997ec7f05acb1e2599adc4e2","url":"build/js/Cart-DkSORbGR.js"},{"revision":"0c4a8069e2f8a600b9b8bde4c7add3bd","url":"build/js/BuyShopItem-a38De36F.js"},{"revision":"43839aee85674fe457afc157ee3628fa","url":"build/js/BoardSkeleton-DLIS2BRV.js"},{"revision":"af2bcff7f5d79e81c2ab7b5ae999b9af","url":"build/js/Board-B3LJ4jaq.js"},{"revision":"d63b080a48588a04586f2375da842f69","url":"build/js/BlockedUsers-DojdbpQC.js"},{"revision":"0eff794c3502a3aef6198382b9dd0636","url":"build/js/Billslist-Dnpk22fF.js"},{"revision":"df6c879224bf2f49d5ee98ddaf1755c0","url":"build/js/Billing_dashboard-CRfY2_ZQ.js"},{"revision":"09d093405e6accbb9c2604d4247912c2","url":"build/js/BillDetails-CRIbu5os.js"},{"revision":"a5724a3713ebc4186976f5af1837d320","url":"build/js/BillCheckout-CuvOcdD8.js"},{"revision":"77d20cb4fef4e3cee378ecd7de64b842","url":"build/js/Bill-BuVZ99DX.js"},{"revision":"f47e1a5a5dc460483b997abf63b15aec","url":"build/js/Avatar-CfbiRAA9.js"},{"revision":"88306af4840270161493b6b08e04b91a","url":"build/js/Avatar-B3-9QUVw.js"},{"revision":"1624e2a3ec39206552baed52dcf51394","url":"build/js/AuthenticatedLayout-DGzPtRJF.js"},{"revision":"6388684eacb4ebdfc9ba0fe239e2f25d","url":"build/js/Analytics-DUUQEM4Q.js"},{"revision":"bd9213300aafb633ae7fca4dde3030ca","url":"build/js/AllMembershipPayments-CLzsV26Q.js"},{"revision":"b7eb0ca3348f0831c65e7f5ee27d1af5","url":"build/js/AllCountries-DtrQgfrm.js"},{"revision":"6c2ee88a6157c18795f59d69dffbf72b","url":"build/js/Alerts-DqohM2Si.js"},{"revision":"3e089f6edb4f78a99b81b47626cf5dab","url":"build/js/AddressForm-BtK1JDUa.js"},{"revision":"92c8e342024f1efb64f0d2eec999fe70","url":"build/js/AddShop-BakAxTfa.js"},{"revision":"83cd6be0d30e05b0b44ab8e3ed2ee33b","url":"build/js/AddPost-BkX_BL7f.js"},{"revision":"beda7fad667d956f7e29647ce38590c6","url":"build/js/AddMoreTile-DqXjYb03.js"},{"revision":"bbe368e230d85376fdf12dfaf3810ce3","url":"build/js/AddMembership-BXrE6_S0.js"},{"revision":"b7753ea516b24c15e531e1b8b3cd5d45","url":"build/js/AddItem-CsG0abn0.js"},{"revision":"644b2ae9a1154ea821a3282854d35d36","url":"build/js/AddIntro-BcIzOlYk.js"},{"revision":"9c82fb1c35fa57907f090a5be010231e","url":"build/js/AddGift-94lGOhIs.js"},{"revision":"69e37d6b055d28ff6ee54c6bef4f675a","url":"build/js/AddComment-C0jFLlJn.js"},{"revision":"409939b3da615651a80ce0c21da23534","url":"build/js/AddCart-BAkrZ-4f.js"},{"revision":"40789b19cf253c5dc0ff1608350c2539","url":"build/js/AddBills-BBoYnk7t.js"},{"revision":"5fb8457c74ed93a0aff63eccd67f956f","url":"build/js/ActivityStatus-DyfvjgZ-.js"},{"revision":"725d203ab4c8bcb06ca870a9ae849b67","url":"build/js/ActivityLogs-Do-ZY11j.js"},{"revision":"44448729226ddff1a67832682dbc708d","url":"build/js/ActivateSubscription-jxmPlUnq.js"},{"revision":"a5db57eb804c750690888401787c5cc5","url":"build/js/ActivateCard-CDkLCDzJ.js"},{"revision":"3595f0e7dcd1063697aec97f8f50916a","url":"build/js/ActionRequired-DR75U8SX.js"},{"revision":"45c3c9f2a9a33aff3baf99554a74ed1b","url":"build/js/Accountsetting-iIm5AzTN.js"},{"revision":"72009622ced7ed56bc89074d0a393f1f","url":"build/js/404-CC-gF_Ns.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"b25664330b12c815ce97dc0374e7e259","url":"build/images/wishlistbannerimg-DknpQwC_.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"d664b27cca7eaf4d64c41622b5bb9b6c","url":"build/images/user-DLV4cRY7.jpg"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"a94faa1a93034ed70c0024dbb3fc1120","url":"build/css/uploader-BqAXSLBe.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"59f64916d28441ff3708d6f6a9a88e6b","url":"build/css/retro-bottombar-CD1n0nll.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"e9f7c13a001497a198304d0f726ddaf4","url":"build/css/app-BNl-QMNC.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
