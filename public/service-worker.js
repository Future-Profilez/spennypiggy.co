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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"d095f969f5c691952e904d619cd4d412","url":"build/js/vendor-react-DZtB8pF_.js"},{"revision":"5e0f0ef3fe476eb032096a3848550667","url":"build/js/vendor-other-DD7iGeYK.js"},{"revision":"a23d29010ac0d38bda50843f7e1ed141","url":"build/js/vendor-inertia-B-ChIme_.js"},{"revision":"bc5139edc9a38f8bf124394ef10e5850","url":"build/js/useDispatch-BxNA4sJK.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"d689727525a741197a32145941ecf5fd","url":"build/js/swiper-react-B3Izsj-y.js"},{"revision":"7741d7b96bd95ffa636e9c47c07febca","url":"build/js/sortable.esm-DzxU3NZs.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"3058938b479cd0d3191dcb786eb2d8f1","url":"build/js/react-select.esm-Bw1nBO4n.js"},{"revision":"58fa5004d63dec8ef06150c55a3f0ca5","url":"build/js/pagination-CoA-mTzR.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"a21420b082e755960faf278867853c51","url":"build/js/navigation-Cbu1UTjd.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"05b5c1d2b7554b471899aecddf3a33d4","url":"build/js/index-wNhawzsV.js"},{"revision":"cbfa49b8296b25ad7b8dd8f1ac5d0ecf","url":"build/js/index-sJ3fnLqy.js"},{"revision":"2d04c261fd3a40708e26e06165abbe75","url":"build/js/index-ZVrXCMDf.js"},{"revision":"7fca96b1d07caa9f3bf9d3f4a6b4384f","url":"build/js/index-DTXEviem.js"},{"revision":"6a3c4b372a654b50149356694e60d56e","url":"build/js/index-DT8mjLp9.js"},{"revision":"440d9a91f4a3b1d34e94a5612c83d846","url":"build/js/index-DDB-bpz-.js"},{"revision":"212f26963ddd1aefb0b8cfc59b218102","url":"build/js/index-DBPyZ7kS.js"},{"revision":"77cdc890f884e2bc68bce94608e836d7","url":"build/js/index-CzKI-yAX.js"},{"revision":"7896143b3fb1b5bde4b5fdcc6f9af900","url":"build/js/index-CqFclZtC.js"},{"revision":"255eaff0c9bac2ef1cd70fdb4e87723d","url":"build/js/index-C34okzcW.js"},{"revision":"1b1b6a2249155adc22460ef4a98403e2","url":"build/js/index-C1zyk9Sz.js"},{"revision":"7d550744401c7a1775edf56a727ef133","url":"build/js/index-C-y_y5vE.js"},{"revision":"807031cdcb578ee13638683436629105","url":"build/js/index-C-VXTAC2.js"},{"revision":"4ef109188bf1db8fc762f7c29769a3d2","url":"build/js/index-BrFZjbL4.js"},{"revision":"8ca9f43a4100defb7fe596ea59236f48","url":"build/js/index-BKoiml0-.js"},{"revision":"650fbe24f57031b497326177eeb121c6","url":"build/js/index-4U9qM-zo.js"},{"revision":"9aa4f031091ab63a7a7dcf7916d0633d","url":"build/js/index-3ng4Ruhn.js"},{"revision":"bcbde59e8d85437bdc3ac78b41294ccc","url":"build/js/index-0vWXOyg-.js"},{"revision":"dc90c4c2bf0e9525107a70fe6adcd903","url":"build/js/iconBase-BtUWgu0w.js"},{"revision":"a4d39b460c54138e0fd030b5d1f9637d","url":"build/js/floating-ui.dom-Gbe3dgxx.js"},{"revision":"bb3d566c246ea5c2bc9603349755a89d","url":"build/js/debounce-B_Wu5GhX.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"aa332b150cca93d147b0e67abccd47c8","url":"build/js/app-NWVhrTBj.js"},{"revision":"00a221732cf581c54c793058a413b365","url":"build/js/Works-Di4_qw7L.js"},{"revision":"4e169c8f51e6fea18271a2637b389b9a","url":"build/js/Wishtracker-C7Uqpq1d.js"},{"revision":"44278f5031897939530e9423b6d0006c","url":"build/js/Wishlistbox-Cb6xiqP_.js"},{"revision":"f8e9c4c04bd9e78ff135259fa8461552","url":"build/js/WishlistGrid-CjggYxjY.js"},{"revision":"1fc9e93f7d3f0a911dd1ad847e64fdba","url":"build/js/Wishlist-6zRjTxJ1.js"},{"revision":"19686d9a7a49cfffb5a13a36b4ee3923","url":"build/js/WhyLove-CJBdzhaZ.js"},{"revision":"d522c554dde85fca992aeb6fefa70721","url":"build/js/Welcome-DMIDgQYQ.js"},{"revision":"448bdebca4a8ca78f8c695c87c9e54a9","url":"build/js/VipSupporters-BFePtNep.js"},{"revision":"cb2716162464d028948d5fabee554b54","url":"build/js/VersionUpdate-DUMVYizm.js"},{"revision":"a2058b34e8b56259a6fc62c81c00aa84","url":"build/js/VerifyEmail-JvXsXzm1.js"},{"revision":"c4af0164074f87f96cb831fbc785ddec","url":"build/js/Userprofile-Bx3uj2qa.js"},{"revision":"92cd5df95593f67cad5e58d95d215fb5","url":"build/js/UserCarts-CjUocIAm.js"},{"revision":"de24182a99559bbc4f844e3c96e95935","url":"build/js/Uploader-BvERaYvF.js"},{"revision":"dc2f248cde15aee59aa3714e1f234901","url":"build/js/UploadcareEditor-CQ_gFcVb.js"},{"revision":"9bd7a45903fd5da4dac06776a288ef20","url":"build/js/UpgradeStripeAccount-BdKUf8Zd.js"},{"revision":"5451e1d1af57d1a6d33288a66d032216","url":"build/js/UpdateProfileInformationForm-DllloByu.js"},{"revision":"71158f21c6bee528be59c149637bee45","url":"build/js/UpdatePasswordForm-BvY7aqWL.js"},{"revision":"648a37ac1cc969adec1347c89f072656","url":"build/js/UpdateAvatar-Df6OO8JP.js"},{"revision":"5cd706547890093586a843ab5fa387be","url":"build/js/USTERMS-DiUpIlA9.js"},{"revision":"0b9b040a5e432425bee7acecd60ee28c","url":"build/js/TweetNow-9216mWp3.js"},{"revision":"4023cc9ff926abf4c05ffd44e6067988","url":"build/js/TrustBox-B-uJz68f.js"},{"revision":"3acb732ae274f0f4619d86a49f35f516","url":"build/js/TrendingCreators-BFVA-XFv.js"},{"revision":"c7f57440e96083225bd48e0863c4f0b1","url":"build/js/TopSupporters-DTjVOE3b.js"},{"revision":"8d192d1132c0ffa83add74bcc394da59","url":"build/js/TopSupporters-0WY4uTm2.js"},{"revision":"ee61623735f6746d02ad2e80407c4ed1","url":"build/js/TopEarners-CGtKqnbH.js"},{"revision":"25b51ef825e8eeed1ee85c8327ddf716","url":"build/js/TopEarnWishes-BosxgCEl.js"},{"revision":"b6c1dc5342b440e28397f9b1c5a28950","url":"build/js/TopEarnBills-MstmjHtL.js"},{"revision":"0de31c476f8825c76af3a9a701b9faaa","url":"build/js/TopBar-Dt0ZQfdL.js"},{"revision":"50cdae0bd40e4b946bfdc87ac474db13","url":"build/js/Tiplisting-CIxc_2no.js"},{"revision":"412e855460a420e22532b8aeb481806d","url":"build/js/TipTracker-7s7XS4dU.js"},{"revision":"8d527a15d587d41e30e9256b12ef5f41","url":"build/js/TipInner-BteFbdtG.js"},{"revision":"9f8ee2c4333b74e41804849a069a64e2","url":"build/js/TimeFormat-Cneydm_p.js"},{"revision":"ba2210e6cc42e7c28f873b6e2d72fd20","url":"build/js/ThankyouMessages-DLkjUXMS.js"},{"revision":"912e6afbc92112e62611dce258976b3a","url":"build/js/Thankyou-BzNcb_WR.js"},{"revision":"b306d731140558dd1c15efbd64bf4904","url":"build/js/ThankYouRye-XQ47zlVv.js"},{"revision":"355b019f045815d078b75dfd7ee0aa0a","url":"build/js/TextInput-CDyZ4wJe.js"},{"revision":"cc07bd418fb2eae28601fe9dfd4b332f","url":"build/js/TestIntercom-U9ZmfS8U.js"},{"revision":"e5334ae06e8c61bf3b7633a1916b413a","url":"build/js/Test-D1NC-cTM.js"},{"revision":"a2099f86371b37312dca9d0c6d430941","url":"build/js/Terms-Cs2jKrFr.js"},{"revision":"487c7cbf12d0b7645271851fec46d8dd","url":"build/js/TabbedDashboard-B4qsGvZ2.js"},{"revision":"3351008c86a6f43f1a53aecf98ef7734","url":"build/js/TFA-DMasU2jC.js"},{"revision":"455fa13d05cc87608e0be364bdf79ef3","url":"build/js/Suspanded-DA17vB90.js"},{"revision":"972b59fe3f01615d43762dd8aa15424a","url":"build/js/Success-1CIxiRUX.js"},{"revision":"ab83b4fc8e436a4a5840a1012a596baf","url":"build/js/SubcriptionEarnings-nvH32kin.js"},{"revision":"00991566ed80336a61a335cade1914fc","url":"build/js/SubCheckout-CJcMe1Al.js"},{"revision":"6bd22071f000749afdabc99202008955","url":"build/js/StripeSafe-Bt6msG1O.js"},{"revision":"d2234b9c287ec1c6209ad0fac3f97055","url":"build/js/StripeIdentity-qDY_ec1Z.js"},{"revision":"7d1e409b1b15e42c7854258fda75a72a","url":"build/js/Stripe-DStb2fVB.js"},{"revision":"ddcadbc87411d885c9eebf7d0cf61025","url":"build/js/SocialLinks-DiEvQWvE.js"},{"revision":"ea55ff8ba890ee690ac13f8873f3ac7b","url":"build/js/Social-DLPzkQ6E.js"},{"revision":"b3868306ee92d330b7057dd3892d4ec3","url":"build/js/SiteSubscription-CbF1-iWu.js"},{"revision":"f43961f9c3abc9ab70e1940e8668bfb9","url":"build/js/Show-DsGQg-SO.js"},{"revision":"ecdf7dd4d3fb1d0a4779e08d07d3aacf","url":"build/js/ShopTracker-BJqTd7W8.js"},{"revision":"73d0b1b5ff25f50c951ec1a7e19ae6ff","url":"build/js/ShopPage-Dot992mF.js"},{"revision":"c0e36c8b187331579cee5791fd89494e","url":"build/js/ShareProfile-euhzV5wu.js"},{"revision":"3e9bd23eb56a09c9a160158ce1dfb0a6","url":"build/js/Settings-BXjd6geL.js"},{"revision":"51967d50026aae2a3673aff39e1237e3","url":"build/js/SendTip-_YhQfHd9.js"},{"revision":"d79b1007678c340e373730282ae04b50","url":"build/js/SecondaryButton-DoUH55Hq.js"},{"revision":"39d38077365e4a3f8d6c3488eda0b038","url":"build/js/SayThanks-v6R5IOYb.js"},{"revision":"1de2c6320deb003a55b7fa773593c397","url":"build/js/SafeTransition-DBssAMek.js"},{"revision":"75ed1fb0c0d2f54b32a0d787a7f19ff6","url":"build/js/ResultsGrid-D2T5_l7q.js"},{"revision":"8bab0fb577135285a8e139e7c3027726","url":"build/js/ResetPassword-Cj7x-sKe.js"},{"revision":"81e11b9a32f7f5c57041151095daca66","url":"build/js/RemovePost-Bq9b6hwL.js"},{"revision":"c565100aef65c335cb16ce08d17ac1f5","url":"build/js/RemoveMembership-B5UXJrvM.js"},{"revision":"93bd187c5dd2cfaaf1524f148c32f010","url":"build/js/RemoveBill-Cy-kkdn9.js"},{"revision":"523d23af11a3730425e2417b09dbe49d","url":"build/js/Register-BFUcQf7s.js"},{"revision":"40d0c41e9a5f7300fc2076c23efee824","url":"build/js/ReferAndEarn-BV1dmC8t.js"},{"revision":"bcd2a1df284e987e709205e8ccd195ce","url":"build/js/Redirecting-DBaNB7_g.js"},{"revision":"3a7014ed0cd6cbfbf90e40242846c3e1","url":"build/js/RecentSupporters-DSty_qRr.js"},{"revision":"5977ee384b4261f3d5ab855fe24425de","url":"build/js/PwaTest-DQtnZZ4j.js"},{"revision":"e4ef9423d8e1c56079aedf66f62c73ae","url":"build/js/Promotions-BZnLu-Ck.js"},{"revision":"59d7f98d59abb6891020cf5292bc8771","url":"build/js/ProfileTaskLists-CsKHXSGs.js"},{"revision":"0aa14cfb08d54ce0ec6bd1856ba864c4","url":"build/js/ProfileTask-mHm64AZ5.js"},{"revision":"fe9d116180be3df64b7dbf5b4d6091d6","url":"build/js/ProfileSteps-COzsXRz6.js"},{"revision":"ec3e905a8bf6ad1464b24ff9afb8bd66","url":"build/js/ProfileProductLists-Dl9XFoO-.js"},{"revision":"4cc659a0a768dd344efc91fa7221d0bd","url":"build/js/ProfileProductLists-CWNYmYl3.js"},{"revision":"d9a6ed32772a7120d784bb6792750560","url":"build/js/ProfileProduct-CANOjkb0.js"},{"revision":"7232ff7fbeb692c8894ad8fc25e34de3","url":"build/js/ProfileProduct-BFh1imyC.js"},{"revision":"2b20ef4c2cfc8a093ce696ee62a86721","url":"build/js/PrimaryButton-BpH7fgpi.js"},{"revision":"e87ee70b61b7b83912b1b3ed34dec136","url":"build/js/PriceFormat-BoPktYyX.js"},{"revision":"6525ffa5c36c3a7036fafd2173dd64a5","url":"build/js/PostLike-CcHZfI_p.js"},{"revision":"b07db42e98f609dc2e733b359ac8c57a","url":"build/js/Post-BAbWcS3X.js"},{"revision":"50cf9d3b48541d8e67a8a6ee8dd246e3","url":"build/js/Popup-BcNbkcTz.js"},{"revision":"aaaef236bc510850bf98822981858cd7","url":"build/js/PlatformAnalytics-C_qA13ge.js"},{"revision":"f5eeb6545591859f61f29bc74d4170c0","url":"build/js/PaymentSlider-BYbFn0xF.js"},{"revision":"2dbb5575698efd5c4919db8da0a84d01","url":"build/js/PaymentDashboard-DwAcon3Z.js"},{"revision":"64dc15380483cbba9d6aa71e2b569b4e","url":"build/js/PaidTasksTerms-B1yxID6M.js"},{"revision":"b55b26ff737722a9e249f201d0d8ef9e","url":"build/js/PaidTasksAnnouncement-F72jY6GL.js"},{"revision":"988767ea20ba267815dd2ec09b574e73","url":"build/js/OrdersLists-CeZxteXS.js"},{"revision":"7b357842563490a0405a00f8951770f3","url":"build/js/OrderDetail-Cu583K3o.js"},{"revision":"d88314b576f64fbefccb60650057d8e5","url":"build/js/Order-BLFP25Wc.js"},{"revision":"a8917e37e13b627b570a735d00cbe03a","url":"build/js/OldSubscribe-D1rcAcEI.js"},{"revision":"206be24a4aaf2f6ffc932a250dcb1a86","url":"build/js/NotFound-Bz1U2-j_.js"},{"revision":"994280633746797c0a489c995ccef08a","url":"build/js/NotForBusiness-CBV4hpLm.js"},{"revision":"59bbbfb22781a771b08cdd69225ed96f","url":"build/js/Nocontent-hf1sdrk5.js"},{"revision":"91d3d254f31bae347734e6626be0a11a","url":"build/js/NewVerified-BJdYj1E2.js"},{"revision":"18e3336e0135f5ab95ce9db604922b5b","url":"build/js/MyShopProducts-CMIzG-gM.js"},{"revision":"56d84686300171c46f8202fe8acaa4bd","url":"build/js/MyGoal-qk-R1jFT.js"},{"revision":"a90ce2100bf02db2d1350755eaac9219","url":"build/js/MonthlyRevenue-DjUpLY_Y.js"},{"revision":"06629534008e4bd00131be70aab9c2bb","url":"build/js/MembershipsLists-B53duNrx.js"},{"revision":"cd42aa202e229fe3275e044603a68270","url":"build/js/Membership_dashboard-BbZNa2jR.js"},{"revision":"4a2e811a02266140884bd47a910de288","url":"build/js/MembershipTracker-JGuCRPCT.js"},{"revision":"032c676c728f8feeb1f78ab61f97adcf","url":"build/js/MembershipLists-m9aIxA0S.js"},{"revision":"3ea54155861274ed35577d2b8a1d3afd","url":"build/js/Membership-L0daRfyc.js"},{"revision":"fe9ca247eb23d259cc33f8af985e09b8","url":"build/js/Membership-D0jppUi_.js"},{"revision":"31e01046b4159d10648240ecb5eaa73c","url":"build/js/MemberCheckout-CVVw48St.js"},{"revision":"592239f7bdf264919c9381530d38d9d9","url":"build/js/MagicBellNotificationDisabled-CKWs5-uu.js"},{"revision":"6ac9ac3062cabd0e29da6d8b5b276cc2","url":"build/js/MagicBellNotification-5-xRCkNo.js"},{"revision":"969a3461f9398db3622d9cba690716db","url":"build/js/Login-1Y2lhFxG.js"},{"revision":"74cab189bc9bc483d447ebf3406c343c","url":"build/js/LoadingScreen-CKBFTz8K.js"},{"revision":"4631a7a71c2d5ab35b05bbaa16f07be6","url":"build/js/LoaderButton-Bu7PzuJL.js"},{"revision":"88e6284d73f92bcd0384fa5b8ce03905","url":"build/js/LiveBarSection-CED8vfp2.js"},{"revision":"ac2bfec053a50d9fafe39fbe43f94884","url":"build/js/Lists-DsCB5wEG.js"},{"revision":"cff770a60d45735b413aadcbb4da790a","url":"build/js/LinkTwitter-BnJMlqHM.js"},{"revision":"050798ce2de6cf80ccadc7cab87d8a56","url":"build/js/LineChart-BrPPb5dx.js"},{"revision":"a427434d17caac419c6b7f6977d01fb6","url":"build/js/LeaderboardStars-CW8f_VEh.js"},{"revision":"32fbd99261d5f5ec192a49a689ca45b2","url":"build/js/Keep100-21Sxpyc6.js"},{"revision":"274e72fb0e522284130c3e93634f9323","url":"build/js/JoinUs--j8bFU2o.js"},{"revision":"fc7f8c64fea8f12caabb8ca3be5dede7","url":"build/js/Item-CBgd3Q8z.js"},{"revision":"dd24d40aec6f6dc048668d93c38a435f","url":"build/js/IntrosVideos-AmrsnWfL.js"},{"revision":"003aa3a8d83901696c1a065003384926","url":"build/js/IntercomDebug-B_0B3SMQ.js"},{"revision":"2ce2187bdcba2c9d80efeb96550a3964","url":"build/js/InputLabel-DTXO4Qw1.js"},{"revision":"cf02faaa299c79dd7afe5db44e30938d","url":"build/js/InputError-CZnu9e5E.js"},{"revision":"c0907ee546672d8642fbe44d4d6a7277","url":"build/js/Index-niwqvAmu.js"},{"revision":"d104cf3efc12ce70cccb8bdb44159e2a","url":"build/js/Index-DRicjYQk.js"},{"revision":"06daa9a45ff36d0c5a2f7bad2f6500a1","url":"build/js/Index-D-3la8yU.js"},{"revision":"cb4b46905524033415f2d2ac2c6a0c75","url":"build/js/Index-BliC-A-g.js"},{"revision":"3542cec77e302795076c964b026931a0","url":"build/js/Index-Ab05dXj3.js"},{"revision":"28c075e8348e8c96067f666ae11636c0","url":"build/js/ImageGenerationWithAI-ikgCR5x5.js"},{"revision":"0645c547ed38fd4d29af06159b51c91d","url":"build/js/Icons-1cSOjjYQ.js"},{"revision":"f6927c4e80371557c5988d20a667ecad","url":"build/js/Hero-NGDLJ90_.js"},{"revision":"ad7b7526a478ea2e9799e5a6b6935e01","url":"build/js/Header-Cbucf_lq.js"},{"revision":"131946fc8f277ba063f81147a5cc22ed","url":"build/js/HappyCreators-COlbw-pl.js"},{"revision":"3caa8bb92e5b776f7e0ed6007bc16c7c","url":"build/js/GuestLayout-CaF4BPpU.js"},{"revision":"907688c3f4bdacdd5361fe76612d26c6","url":"build/js/GrowthTrends-BptJwBnQ.js"},{"revision":"c11a6a7af1745f339acb350e8ec908f1","url":"build/js/GlobalCheckout-CidkGt69.js"},{"revision":"12dadbb5e70be404a4da38c5e0723d30","url":"build/js/GifterTips-BCAg7mQP.js"},{"revision":"487f150935b871a071663829d427a9a2","url":"build/js/GifterSubscriptions-Cfpb245L.js"},{"revision":"4bdde14f337967a0f77ecb7ffb0dbd8a","url":"build/js/GifterMembership-DgkK3xnb.js"},{"revision":"91aa0fb75abc2166d8889473afd4c81e","url":"build/js/GifterMedia-D42Z-uNl.js"},{"revision":"a91a4549ed65b0d3fe7685025b273db7","url":"build/js/GifterItems-6UWvT0a_.js"},{"revision":"ef4e713773ac4573d0338f9862ff73cb","url":"build/js/GifterFeed-Ct85YnCp.js"},{"revision":"f72cb7f9dd6dde5326a4970f5426f984","url":"build/js/GifterCardVerification-CXfM5Xtr.js"},{"revision":"a087553ec0a81e4b1f62625a1513fbe4","url":"build/js/GifterBills-D5TSQNXS.js"},{"revision":"e28a6ae8f0f82f96e00a1552191e2d11","url":"build/js/Gifter-BzJg9nrU.js"},{"revision":"b15cfd877506d6dc6d11e9167762c1ee","url":"build/js/GiftStore-7moK6JMq.js"},{"revision":"6f6e74c49e19ffeb61dc72a60407ff4b","url":"build/js/GiftListing-3GnPx-8L.js"},{"revision":"f309095991abd3f59878cd02b056b287","url":"build/js/GiftEdit-Bwq1C-Zz.js"},{"revision":"915d41cc6c2066d528e8c7ee4d4075f4","url":"build/js/GiftAddCart-uk48m55g.js"},{"revision":"35531f51f56196d62a6bab36890c9484","url":"build/js/GetCart-CBt0W2Cq.js"},{"revision":"7f498f1c450e9cc721bcc38ebc161bdd","url":"build/js/FunPart-DbboMYfG.js"},{"revision":"aca18f06e2652c83082d725fbaea6f91","url":"build/js/FounderProgramAnnouncement-zjnbHjgs.js"},{"revision":"7ff91a273615ea3b687af3f0aa0061cc","url":"build/js/FounderBonus-VWWtgWpt.js"},{"revision":"45ec9c79dcb18b2228b755b5fd9b16b8","url":"build/js/FounderBadge-Cl4YbpMG.js"},{"revision":"2095afffe85bd29b651759d3d34bb36b","url":"build/js/ForgotPassword-BMF4NuIX.js"},{"revision":"684a07d5bea570bdb814e69b19e5e6a1","url":"build/js/ForCreators-YOw0jUVc.js"},{"revision":"bab3e0451880131623721c75418c4fe2","url":"build/js/Footer-hZ6j6p8d.js"},{"revision":"c5c55fe71f2e3371cc843666180dbfd8","url":"build/js/FollowButton-DJaxZn-F.js"},{"revision":"1be9896d1be35cd7bedfb5323b211e96","url":"build/js/FlashMessenger-Beviwc9b.js"},{"revision":"6cc7d0d51f7ca43b36620de191e0064f","url":"build/js/FiltersPanel-Bji5F1_C.js"},{"revision":"b95a34a2d7df4abbc450276e23eed372","url":"build/js/FeedList-6Aasc8Jv.js"},{"revision":"8409e5f52f96a90a652f248aedc2b527","url":"build/js/Features-Eo6FiCB8.js"},{"revision":"db55bedeaed16712c407c12b96f43bbd","url":"build/js/FeaturedCarousel-Kahr2zFh.js"},{"revision":"fc28f0bab7cd5c8de99b84028fafcb62","url":"build/js/FAQ-TiLtLKK9.js"},{"revision":"f3451cfa91828acc908c98ea8c30e851","url":"build/js/ErrorPage-BX9XxZbp.js"},{"revision":"3fee4477461d774bab86ba2e4af61d65","url":"build/js/EnterOTP-kaXqo73j.js"},{"revision":"be5dc64e252a64254226fec5737be8d5","url":"build/js/EnableCardCapabilities-2ozdA8P-.js"},{"revision":"48cb3f7231ad84743fc6098f83d750b6","url":"build/js/EditProfile-Ct0XyyjF.js"},{"revision":"57f3610b16331339da537a305eb2e219","url":"build/js/EditMembership-BvQCPEfc.js"},{"revision":"9a9ce8fb8ea846170835476590a8b49a","url":"build/js/EditCategories-C9zQVuwf.js"},{"revision":"cded12025c2b81809b5a80854a4b58b4","url":"build/js/Edit-BY6TF6e1.js"},{"revision":"a81e000c2e85a3bc2d24cc827fa9f297","url":"build/js/Edit-B4ulhyWK.js"},{"revision":"23c39cd7801e2f8cce058daec9051534","url":"build/js/Earnings-O_yataP6.js"},{"revision":"e208dbc5485d215b8ee3c26fa73fd189","url":"build/js/Disputes-Dz2Q82-J.js"},{"revision":"78f1bb546b5cd89850cf36335e05ced7","url":"build/js/Discover-YB1pdGjg.js"},{"revision":"64dbed01075b5374ba5e10be2f915ad8","url":"build/js/DiagnosticPage-DD2SgiHG.js"},{"revision":"a89002ebf60d25e8382292bbab6eb995","url":"build/js/DeleteUserForm-DNqQafIn.js"},{"revision":"f9a277eaf6c723ce8f09e9082a2be11d","url":"build/js/DeleteStripeAccount-B899CpiN.js"},{"revision":"14dc8a857cbffe35da0a0a882047d1ab","url":"build/js/Dashboard-__08fnWi.js"},{"revision":"48354cfee83c2fdc3554248fe809e49f","url":"build/js/Dashboard-0OWCdr3a.js"},{"revision":"92511210fa8064bb9dbbe1917b18931c","url":"build/js/CreatorVerificationNew-dSwg6Iiu.js"},{"revision":"53c8eafeab9caa80b2c3eeecd4f24ee9","url":"build/js/CreatorVerification-C-ja-Xsj.js"},{"revision":"330da417eab7fe05bf87d6df36351f1c","url":"build/js/CreatorSubscriptionWidget-DHNvxw22.js"},{"revision":"b05800809db59d85deb4388f82f59d13","url":"build/js/CreatorCard-nZl7iirb.js"},{"revision":"6a3bbe95f99997c7c4b491c0c859afb9","url":"build/js/CreatorActivityWidget-DlJK66QX.js"},{"revision":"deaa43daa1954f209811a6ee6500a743","url":"build/js/Create-B1SAg405.js"},{"revision":"b39ca545996d4cade09e1c9fddd51cfe","url":"build/js/CountriesShipping-BCw4Jna0.js"},{"revision":"35b3cd2b6b7704fb58e236871c691883","url":"build/js/Countries-XtUddx9n.js"},{"revision":"4f476df38c999e79879a02d795b7a611","url":"build/js/ConfirmPassword-CZrGEAcN.js"},{"revision":"8110ddea796551d640fea60d19f9d4cf","url":"build/js/CommetsLists-Bl_qMfnl.js"},{"revision":"1f1820a9a68e9f529bf12badc7f1fb92","url":"build/js/Comment-UiG_C_k4.js"},{"revision":"eaba6c397b1fc591ce8cc9a65971c274","url":"build/js/ComingNext-Dp0mF678.js"},{"revision":"102905f2b1b0a570068d5d6bcff34978","url":"build/js/ChartDashboard-ClOPV9VO.js"},{"revision":"ae749daed2bee362639b6fc412830a9e","url":"build/js/ChangeVat-C-R6ODe1.js"},{"revision":"1167bddf9cad0f7d9fa26257af09572d","url":"build/js/ChangeCurrency-cQY75HHF.js"},{"revision":"50d403ba64e774a69117c0fbb3acf465","url":"build/js/CategoryLeaders-G8CwRhhp.js"},{"revision":"94cdb1f808172f6341edee16d3d25f22","url":"build/js/CartListing-BPeV5U16.js"},{"revision":"29cfd3ec9c8b1b29777f995882cf399c","url":"build/js/CartItems-2IFq75lE.js"},{"revision":"c9bb970b81bfa7919f5edf8e134747fc","url":"build/js/CartItem-DJLmKLT_.js"},{"revision":"48b907a0e87ed3635018f709677c49d3","url":"build/js/Cart-DEp3byn9.js"},{"revision":"aa4cb48602add17526f0d8ac3a5fc006","url":"build/js/BuyShopItem-kWpkG2K2.js"},{"revision":"4ca5b25048fcda2124f09c5890163d9e","url":"build/js/Board-BQuStBtp.js"},{"revision":"61863d40960cbda8c2ebf3274e32689d","url":"build/js/Billslist-H0s_dO2u.js"},{"revision":"2efa7ab1738881719250b701fb08a928","url":"build/js/BillsTracker-D44KYjRt.js"},{"revision":"12a7ab537015731c54c0ad038a0db6a1","url":"build/js/BillCheckout-DzmljsXk.js"},{"revision":"1dc76fc9174ecd9d5dae93dcf5c1add9","url":"build/js/Bill-DKYqOcKs.js"},{"revision":"668e26fdff16974495202923bd173e0e","url":"build/js/Avatar-aScPd82k.js"},{"revision":"f969986864d4746577fa357878d08c3a","url":"build/js/AuthenticatedLayout-dvNvp8Lk.js"},{"revision":"60f5890c32361420194bae564c9b382a","url":"build/js/Analytics-iVjNyhAK.js"},{"revision":"54c1edb91070ed714990a55f28af21d9","url":"build/js/AllWishes-BZcQ0LkP.js"},{"revision":"0a0ebc88b0f79e1f5ef021ef7311f770","url":"build/js/AllCountries-BHdmEMVL.js"},{"revision":"63eac0ee7a3152099a97df72a1f69d1c","url":"build/js/Alerts-CzJqSZfm.js"},{"revision":"8b57fedd82a52fac1ef552b3b643843c","url":"build/js/AddressForm-Dnj5tmSg.js"},{"revision":"42faa9b65ce53c0b2e39e9be6d80781b","url":"build/js/AddShop-DZmNKaFm.js"},{"revision":"3903987193a866a53bcd77d59a0494db","url":"build/js/AddRyeProduct-DZXZUtPJ.js"},{"revision":"9a3d4e9b6f9adbb36001b9861c43a8f2","url":"build/js/AddPost-qIGpsJFq.js"},{"revision":"a85e08d495c4f2cb0b9a7a80ee8f8e89","url":"build/js/AddMembership-QDc8OcvR.js"},{"revision":"77b6d2af0e9d6d522dc5c3f2b4a08cc2","url":"build/js/AddItem-xnLxyXEr.js"},{"revision":"5a05652026a8f7d68819b6ef893c919e","url":"build/js/AddIntro-BaEThpcs.js"},{"revision":"aa85e4859e189c04b2fe57744733f60e","url":"build/js/AddGoal-NXDgeGIT.js"},{"revision":"a47b02eb5bd12f55fc19c58a3273fda9","url":"build/js/AddGift-D3Ns1pTI.js"},{"revision":"febd812c7839cfd18d61f746857e709c","url":"build/js/AddComment-CObU893F.js"},{"revision":"4efd1f9b9c0f6250bfb63f678c13a344","url":"build/js/AddCart-BUz6stIl.js"},{"revision":"f90f790619aba77c60c0d4964ea8f5ad","url":"build/js/AddBills-BoYN8GrH.js"},{"revision":"e51c1fb108cbda3724348f369ea65af5","url":"build/js/ActivityStatus-DZbv2Gzx.js"},{"revision":"a141d4b41b6328371b451617f437c6a8","url":"build/js/ActivateSubscription-CEeyWaLu.js"},{"revision":"65b88fa7ca66edd29c464c55d34575f1","url":"build/js/ActivateCard-BSc17Wh2.js"},{"revision":"b5b459fe60ed28d6398149f186b76a4f","url":"build/js/ActionRequired-BRRbW0We.js"},{"revision":"a1ef2330dba39c480efd76e235eb7794","url":"build/js/AchievementSystem-Bb6Flxo3.js"},{"revision":"cb8a501cf3bfac37240b20bab91424a9","url":"build/js/Accountsetting-C9kWSNh3.js"},{"revision":"ae38052bcddd2e022b5b5008067d56dc","url":"build/js/404-BXkgyIW6.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"6f7963d720e702a23e6be219582607a7","url":"build/images/risk_intolerant_vanguard_sharing_mint-BYuEKk9g.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"e049b555e473fc65d3cf4c573307b11d","url":"build/css/app-B9ZUG-B2.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
