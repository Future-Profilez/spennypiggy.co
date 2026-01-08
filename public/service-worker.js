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
precacheAndRoute([{"revision":"9422cfbb42d4bd75e69d5bdbad9400e8","url":"sw-register.js"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"siteicon.png"},{"revision":"efd76e0053c0122c55584f415bd3afae","url":"react-emergency-patch.js"},{"revision":"33e8e7566fed41a23647eace444b288c","url":"react-emergency-patch-v2.js"},{"revision":"149b3768c15d7df0bab9c90ebafb7c53","url":"react-emergency-patch-simple.js"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"logo.png"},{"revision":"3f68c67b3f764641b5fd79f6504acde3","url":"favicon.ico"},{"revision":"22355ce90ca986539056366ff45f1855","url":"favicon-32x32.png"},{"revision":"9af3667025121db51663ccc08313e13d","url":"favicon-16x16.png"},{"revision":"891787fc14ab5d8292c7a5c046ed9fb6","url":"default4.png"},{"revision":"d6dd8a0e2087c84dbea28d45c3bdc6ab","url":"default3.png"},{"revision":"43657f016b6318e83183d27a1cdb3980","url":"default2.png"},{"revision":"f06a77a849b42031b8af701fed527aa3","url":"apple-touch-icon.png"},{"revision":"fe891b6ccadef5dcefc1090687a18096","url":"android-chrome-512x512.png"},{"revision":"0a5e7d4241c0a7b729c3322da8de70b5","url":"android-chrome-192x192.png"},{"revision":"059eadeb774c695f3b288e1091db9ca3","url":"Favicon.svg"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"resources/assets/new/youtube.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"resources/assets/new/x.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"resources/assets/new/uniqlo.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"resources/assets/new/twitch.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"resources/assets/new/tiktok.png"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"resources/assets/new/other.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"resources/assets/new/nova.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"resources/assets/new/nike.png"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"resources/assets/new/kylie.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"resources/assets/new/joinBottomImage.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"resources/assets/new/instagram.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"resources/assets/new/huel.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"resources/assets/new/howitworks3.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"resources/assets/new/howitworks2.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"resources/assets/new/howitworks1.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"resources/assets/new/faqhand.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"resources/assets/new/beauty.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"resources/assets/new/asos.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"resources/assets/new/apple.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"resources/assets/new/amazon.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"resources/assets/new/alo.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"resources/assets/new/Support.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"resources/assets/new/PaymentIcon6.png"},{"revision":"208ea4b4a0973f69724b1e7498038886","url":"resources/assets/new/PaymentIcon5.png"},{"revision":"4e256dfe23b6506cbf8bceb628765ccb","url":"resources/assets/new/PaymentIcon4.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"resources/assets/new/PaymentIcon3.png"},{"revision":"a12042e83fd565155bc42ae5cf0ede1d","url":"resources/assets/new/PaymentIcon2.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"resources/assets/new/PaymentIcon1.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"resources/assets/new/HeroWishlist.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"resources/assets/new/HeroBg.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"resources/assets/new/HeroBg.png"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"resources/assets/new/HeroBg.avif"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"resources/assets/new/HeroBg-mobile.webp"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"resources/assets/new/HeroBg-mobile.png"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"resources/assets/new/HeroBg-mobile.avif"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"resources/assets/new/Fun3.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"resources/assets/new/Fun2.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"resources/assets/new/Fun1.png"},{"revision":"abf33107cc4f6fb48c4111cfabf6ac6c","url":"resources/assets/img/youtube.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"resources/assets/img/yourwishlist01.png"},{"revision":"5d0eea2853bb88f733356ff55f91e972","url":"resources/assets/img/x.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"resources/assets/img/wishlistbannerimg.jpg"},{"revision":"9b40cf2b8a684ac4e17c9cdd78857e8b","url":"resources/assets/img/welcomeheading.svg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"resources/assets/img/vishitimg01.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"resources/assets/img/userphoto.png"},{"revision":"5a0b1d5de0c841d45288c6a7f9d6b4fc","url":"resources/assets/img/userimg.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"resources/assets/img/uploadedimg.png"},{"revision":"2eafa29bf74f63313f9358fa6bef6cdb","url":"resources/assets/img/twowayicon.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"resources/assets/img/twitterpost.png"},{"revision":"9231e2b84cc9ad3b4c1c2e4e938cf178","url":"resources/assets/img/twitch.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"resources/assets/img/trust.png"},{"revision":"33b133b3efdc3ea4f3f0e8ee444eead5","url":"resources/assets/img/tiktok.png"},{"revision":"560a7abaa0e85340859c6e9eb3e6c7d0","url":"resources/assets/img/thankfansimg.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"resources/assets/img/supportors-img.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"resources/assets/img/subscribers-img.png"},{"revision":"1c71ee7f8b18bb4c556004c9aea42868","url":"resources/assets/img/submiticon.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"resources/assets/img/ssl.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"resources/assets/img/spennys.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/spenny-piggy.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"resources/assets/img/sharlinkimg.png"},{"revision":"5c79438888bd035ac6f4ae5a9a320870","url":"resources/assets/img/sharewishimg01.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"resources/assets/img/setuppaymentimg01.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"resources/assets/img/seeksearch.png"},{"revision":"3d568fe453757306c5b4b9b2e4ec4530","url":"resources/assets/img/receivegiftimg.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"resources/assets/img/publish.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"resources/assets/img/proud.png"},{"revision":"56782b5dae9a0446ffbdbd0f6617566f","url":"resources/assets/img/profileimg.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"resources/assets/img/plaid.jpg"},{"revision":"f01ecd42b20a35d93e7bd6a454d2a588","url":"resources/assets/img/payoutimg.png"},{"revision":"e243fbd8755e8f1c3e568624f2a121d0","url":"resources/assets/img/not3.png"},{"revision":"d3f5c762875ed86aa81bf270a5424d29","url":"resources/assets/img/not2.png"},{"revision":"86e59aa35f31f7734e63988587a2da03","url":"resources/assets/img/not1.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"resources/assets/img/noresultimg.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"resources/assets/img/mouse.png"},{"revision":"71a03c8911bb15cdd19a964a0844040a","url":"resources/assets/img/miniplantimg.jpg"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"resources/assets/img/membership-img.png"},{"revision":"c39d4fea0f0fe08d2dd7ce4170ce76d5","url":"resources/assets/img/logonew.png"},{"revision":"ab7a1a81f04f22a4083d11d90343be02","url":"resources/assets/img/logo.svg"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"resources/assets/img/logo.png"},{"revision":"29463511d587ba1001f544d75bcf1786","url":"resources/assets/img/logo.jpg"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"resources/assets/img/lockprofile.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"resources/assets/img/loading.gif"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"resources/assets/img/itsfree.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"resources/assets/img/itsfree-mob.png"},{"revision":"d87b72a2782ca47c584eb3f03a078ba7","url":"resources/assets/img/instagram.png"},{"revision":"50a1984ed3686fd9264aac5c952f2ced","url":"resources/assets/img/herobanner.png"},{"revision":"9e0504ed5f2306da72a0d7fa04cc2769","url":"resources/assets/img/giftright.png"},{"revision":"cdb7f60fce9b3cad16fe0010e2a55e6d","url":"resources/assets/img/giftleft.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"resources/assets/img/giftimg.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"resources/assets/img/giftbasketimg01.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"resources/assets/img/fundbasketimg01.png"},{"revision":"f24302b4284caf2d519af3ded7235451","url":"resources/assets/img/fraudprotecicon.png"},{"revision":"d911e17ada29494efdfa68956cdf5ffc","url":"resources/assets/img/footlogo.png"},{"revision":"e98efa422f9b978844621528bde1d0ce","url":"resources/assets/img/footbannersm.svg"},{"revision":"cca7d61849045a9f485217e2fbc2e48b","url":"resources/assets/img/footbannermd.svg"},{"revision":"38bc9305c189643f3a345518d74ea213","url":"resources/assets/img/footbannerimg01.svg"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"resources/assets/img/flag-european.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"resources/assets/img/fillbank.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"resources/assets/img/editicon.png"},{"revision":"3e212eebd5ad8e18f6f3a2cb2ec2f202","url":"resources/assets/img/defaultuserimg.jpg"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"resources/assets/img/commingsoon.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"resources/assets/img/comingnext.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"resources/assets/img/closeblacksm.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"resources/assets/img/cartproductimg.png"},{"revision":"8e35b4cf048d3bbfbd3b1e9315fd4296","url":"resources/assets/img/cartbannerimg.jpg"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"resources/assets/img/british-flag.png"},{"revision":"9decc8e8c613ffa7ff995e265bb8977b","url":"resources/assets/img/addwishlistimg.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"resources/assets/img/PREMIUMMEMBERSHIP.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"resources/assets/img/PCICompliance.png"},{"revision":"5da20d5b55f6324948a946a9849f504a","url":"img/logo.png"},{"revision":"54ba5791a2e2ad08aaf465b8fd699ca5","url":"img/gift-icon.png"},{"revision":"628da79320f179fa48fa4adc11484af3","url":"img/emaillogo.png"},{"revision":"cb8bb345432486e662ce52f3f67533bc","url":"build/js/wishlistbannerimg-D0JM64Hn.js"},{"revision":"d80d5ff9ac1e122f1a3a6afe4d22be4a","url":"build/js/vendor-react-Nge5g0v4.js"},{"revision":"aaea4271b88e39289438a92d837a7621","url":"build/js/vendor-other-B6U7VpnD.js"},{"revision":"ad4f1b22087fce01b976f3a51b9946bb","url":"build/js/vendor-inertia-PBkQfbV5.js"},{"revision":"204bac112b16f20a246b7e06414413cd","url":"build/js/useDispatch-DQ-xxxwa.js"},{"revision":"1721aea2fb698782c6efa859b40ad063","url":"build/js/uploader.module-m3YRcxYZ.js"},{"revision":"a55a6e1cd6ff2b69cc443df43d1cfcc4","url":"build/js/uploadedimg-Di7q6Dmc.js"},{"revision":"df1d3288f82d6be3f86ee52fae9f4984","url":"build/js/swiper-react-Co-8VgVP.js"},{"revision":"8ea1abca27bf2adc7c12a8b209dc8027","url":"build/js/sortable.esm-C6gSrYvs.js"},{"revision":"904d92d25a78816969277705ba6b54e9","url":"build/js/siteicon-DB1exKfC.js"},{"revision":"fe7c0d8722b996dab9e1a698317950cc","url":"build/js/react-select.esm-BBKBIBeB.js"},{"revision":"2811dd71ce05ec9f12f6ac1382349327","url":"build/js/pagination-D3hNm-4a.js"},{"revision":"bd688ef3e8118badbf3ab13415c91c06","url":"build/js/noresultimg-D3ortv-T.js"},{"revision":"b6c9edb18743f2147acb53ef75e38d67","url":"build/js/navigation-BSgEzSW9.js"},{"revision":"cc4f7bb3c7799521a45386b913f758ae","url":"build/js/logo-C7YazojE.js"},{"revision":"b2bd205d5b0295b763feecd7842f56d0","url":"build/js/index-ykBab3LZ.js"},{"revision":"b61918708153b56b685dedb5a9d97df2","url":"build/js/index-rhC-t5fi.js"},{"revision":"afbbce38e0b5a5b8f774b2a7db46eba0","url":"build/js/index-mtFdSihR.js"},{"revision":"2c1f81f0b658d1f6255187ed6742a3db","url":"build/js/index-bOYmY7GN.js"},{"revision":"248b2c4939b84f80b7883f4d3f8b98b2","url":"build/js/index-XO28OJh4.js"},{"revision":"bf0b0b0a8d9a681f3938268c3e0be732","url":"build/js/index-DK5syNVc.js"},{"revision":"34232683cf9899407caad6b4a3fe1803","url":"build/js/index-DJ0Ldl-q.js"},{"revision":"ba01ca87da0db2b93db39b5128203ada","url":"build/js/index-D6MSsGnV.js"},{"revision":"c1e6eb387ab3e4a4118009f28edb24de","url":"build/js/index-D2eRrke2.js"},{"revision":"f99e67c146d874842abc4a3ac80ef8e5","url":"build/js/index-CirTdnkT.js"},{"revision":"b18a935de2499c943fd6c0948fc0c87d","url":"build/js/index-CQyKGAQE.js"},{"revision":"5facae1d9a0ea002824b635674938608","url":"build/js/index-CBxb_Ke6.js"},{"revision":"034879f4b8709ca68e48e0466fdc0e0e","url":"build/js/index-BjgrvFTB.js"},{"revision":"4566c820b1038927149f8f9460cf2192","url":"build/js/index-BUTmTXW_.js"},{"revision":"f14e7f2722a3246bc9e15d26fcaf05aa","url":"build/js/index-BMgpOZ-U.js"},{"revision":"758cf73eecee1676f1520e429ad85061","url":"build/js/index-BD49YpOH.js"},{"revision":"e9fbbb00d992c981b0f9b52d9f82cb2f","url":"build/js/index-B9CRn6cA.js"},{"revision":"d42dc9b6fc8d50fc966f2b58825f0463","url":"build/js/index-8TF78Tkn.js"},{"revision":"8c9c00e87c72d66a29e9c7e988a90530","url":"build/js/iconBase-C0mPaP9N.js"},{"revision":"7bf1416f13a6306e2d7b93e6ee689db3","url":"build/js/floating-ui.dom-Ceqd-oAB.js"},{"revision":"f49ea91f085e44fab882a657e7cb8742","url":"build/js/debounce-DX9e5Hrt.js"},{"revision":"5ad6fa8ea9db2757fc3d4d3f9dc7d25a","url":"build/js/clsx-DQJ8k6jq.js"},{"revision":"0ff9324316faca7fcf3ec7cbd1175f3d","url":"build/js/cartproductimg-DIUpbNeY.js"},{"revision":"4f4fceed1b5cd4961fe68bf09f97574f","url":"build/js/assertThisInitialized-Ctu0bbrq.js"},{"revision":"8f96e20593d35d8f40bf101d4e99f90c","url":"build/js/app-BmDcvvxy.js"},{"revision":"c5d3ec4c21b02b83f07dec7e80d31882","url":"build/js/Works-BbVgmrS6.js"},{"revision":"4d53786c4199f07a8c28836293c04e4b","url":"build/js/Wishtracker-CuELScZ8.js"},{"revision":"2a386e490c7738053876f7c3a8e2843f","url":"build/js/Wishlistbox-BBX_zf_d.js"},{"revision":"a9cfff0285dc5fab4fadf908bdf3f15c","url":"build/js/WishlistGrid-BMnRhO3W.js"},{"revision":"5ba8124f86e1a5e89282b39c83634a24","url":"build/js/Wishlist-Dv91sq7q.js"},{"revision":"54dd9030b4183973ea4cd930fe4d05cd","url":"build/js/WhyLove-yebsDOZv.js"},{"revision":"3158b9e398302951b7f4af786085b2b5","url":"build/js/Welcome-DukqwXEu.js"},{"revision":"72c152b76a322bd3fbe25ebd02778f88","url":"build/js/VipSupporters-AdOP-IhE.js"},{"revision":"86cd7b9a5f5475efc1584bf4c0ae198b","url":"build/js/VersionUpdate-BMiGnxsb.js"},{"revision":"4ea68e9a3279fc962ffe936a16cc987e","url":"build/js/VerifyEmail-BYu5YQW-.js"},{"revision":"060ad9ac27d26ecec65e7f1d3b4cf95d","url":"build/js/Userprofile-DHvakdat.js"},{"revision":"6a8aa58904ed0d77fef542fe95cef983","url":"build/js/UserCarts-Bpvm9N23.js"},{"revision":"dbde8b23bff6deba06ea4293eb1a749a","url":"build/js/Uploader-BHinBxkV.js"},{"revision":"f9704c54c2f5a930123f88539ea036bc","url":"build/js/UploadcareEditor-DxCexg_Q.js"},{"revision":"28eb916a6a9841860ed35cc1e379da93","url":"build/js/UpgradeStripeAccount-BesrNeVY.js"},{"revision":"02b840d0549414a55b8b96839a531320","url":"build/js/UpdateProfileInformationForm-CBYv7wMO.js"},{"revision":"95236d0dbd17804ba7611c0cf30744cd","url":"build/js/UpdatePasswordForm-BrVZrMf_.js"},{"revision":"997cdb5ab7cb727f306db4baac3bdeed","url":"build/js/UpdateAvatar-CqiFRAYr.js"},{"revision":"fd30f540744416d3b2cb031d14982ac1","url":"build/js/USTERMS-DBw0zC_Q.js"},{"revision":"262dbc6afa631805ee9f60906b49e7c4","url":"build/js/TweetNow-DM2-Rm6Y.js"},{"revision":"e0d831dc6940ca890d01bf871cd32943","url":"build/js/TrustBox-CPkbARi6.js"},{"revision":"86002b3ffadbd7a3dc4105abced83788","url":"build/js/TrendingCreators-CR6JwF4L.js"},{"revision":"f5ef23b9aa3e2b1f6d8d9d6f009b3237","url":"build/js/TopSupporters-B8AFRK65.js"},{"revision":"252d4573241d5ebec6fa0118ce1767c4","url":"build/js/TopSupporters-63AGDlrT.js"},{"revision":"36f0e9038fb5b341a0793ce73f9139da","url":"build/js/TopEarners-Bv15XbBy.js"},{"revision":"02372e835154a014fe1d2a6a0af113a7","url":"build/js/TopEarnWishes-BIo5QAkx.js"},{"revision":"38081b34c725eb3fa4f85039a4920cfc","url":"build/js/TopEarnBills-Be02vZpe.js"},{"revision":"b89ab56cebdecf6f6fc80bf141db835c","url":"build/js/TopBar-BCA2cxJ7.js"},{"revision":"d3d8528c30f23a15d307d87108af6b82","url":"build/js/Tiplisting-C5v4V_5u.js"},{"revision":"4788b2c64214a275f6dbd62721ca5daf","url":"build/js/TipTracker-V1VjS6ki.js"},{"revision":"c7c7202ede6f34508fd6ddb5f83dcedd","url":"build/js/TipInner-V8jRXO4w.js"},{"revision":"ae3dc828f12a39ec8733f0d2bddd961f","url":"build/js/TimeFormat-Cj2xLxdl.js"},{"revision":"97bfc6b46c2e9d516a9ab09bc572a0ad","url":"build/js/ThankyouMessages-CQxlZNTQ.js"},{"revision":"62907188a30fc3804a3c415b20d12ade","url":"build/js/Thankyou-Bcr2osVs.js"},{"revision":"6d3c3fc20aa043ca566a575160094c2c","url":"build/js/ThankYouRye-za9nSJ4f.js"},{"revision":"fb2c3d49ccc96d7112b9eaeb19a30738","url":"build/js/TextInput-BRX83s9s.js"},{"revision":"4dac4d6f86b7c3ec57854889fdbf87ac","url":"build/js/TestIntercom-B0Zax7ni.js"},{"revision":"a0bd5211555eaa21a1bbce628958191a","url":"build/js/Test-DzL7fYlD.js"},{"revision":"9b3ba2e036c861b73a5e4bb12ad2ac1a","url":"build/js/Terms-BX2CmsbI.js"},{"revision":"30b1cac849b3f0d15a7f1c89d7580bd6","url":"build/js/TabbedDashboard-w-4Voz6J.js"},{"revision":"da044b091ec59bbaf2b5f7017733035f","url":"build/js/TFA-Bqzp1dYy.js"},{"revision":"1f6ad00e6582c7f222cb2c70c15c9684","url":"build/js/Suspanded-bJb5TF7d.js"},{"revision":"703747ef3bc50f9f4d2a75df2e9cfbd8","url":"build/js/Success-Cf2hM2ck.js"},{"revision":"de0ffbc9477e181c697cc7720458b205","url":"build/js/SubcriptionEarnings-DsZTdwwb.js"},{"revision":"7de4712864de65caf4d3df646ae48737","url":"build/js/SubCheckout-XTeogZW8.js"},{"revision":"3220a0cc969c247f8d59706a22e0f173","url":"build/js/StripeIdentity-B3BOyfuA.js"},{"revision":"faaaebc7a28d540aefbf11eac7a1e683","url":"build/js/Stripe-gdRx46E7.js"},{"revision":"4a662d0f034afa854bb9654b13f90579","url":"build/js/SocialLinks-v1AxU-Sb.js"},{"revision":"885167e27e4c4b515a82d2f13f3f8d7d","url":"build/js/Social-DvK4LtIe.js"},{"revision":"e01b4a9837371b216b043ade7d084475","url":"build/js/SiteSubscription-S-3Te6r8.js"},{"revision":"686bd00ed3cba547d5c000f58fe5e279","url":"build/js/Show-CMkAZmpd.js"},{"revision":"e2cd2887221fd0f8829bdecaffa0f32a","url":"build/js/ShopTracker-EUuLSvpl.js"},{"revision":"f11a75158f2aa0aa3155542756451de3","url":"build/js/ShopPage-Cy9SvGsA.js"},{"revision":"b1fe3c327132e8b29dfff0dd8efe3d71","url":"build/js/ShareProfile-CYTXCV7k.js"},{"revision":"4ac03edba411941e7b3fcfd12048ed34","url":"build/js/Settings-ojPTBlsQ.js"},{"revision":"87cd0a48d31ad042fd6c7c5f5a82aa2a","url":"build/js/SendTip-C9hciWm9.js"},{"revision":"779c7ea29e504bac72333e462f6455bc","url":"build/js/SecondaryButton-BQF_bdJA.js"},{"revision":"4520587b8f3ec0dd0f7f79857a98270b","url":"build/js/SayThanks-CNH-w2OZ.js"},{"revision":"ee95bc2052057fafa3cb742b60097ef9","url":"build/js/SafeTransition-QkUC40T7.js"},{"revision":"40db5f6e13903ee8bce9313b4fca0416","url":"build/js/ResultsGrid-CWt4-sEc.js"},{"revision":"54ba4b4005a4c993b37e9c5f9bb69485","url":"build/js/ResetPassword-CrGTpun1.js"},{"revision":"763620c27686b3ed6c0a1e102a9e632e","url":"build/js/RemovePost-DsfMo7yc.js"},{"revision":"eafe1d560942c825539d0a3f8cf9a38a","url":"build/js/RemoveMembership-B5t-rN2D.js"},{"revision":"9b69509b83b893c2460b7ed2e71e5ee5","url":"build/js/RemoveBill-CA4_CYC4.js"},{"revision":"d19e2a3b8a18da9c72fce78a901a53c8","url":"build/js/Register-CF1vSHvw.js"},{"revision":"ec8ebbe6edbad2d09f086217a52f67b6","url":"build/js/ReferAndEarn-sw6JCZtW.js"},{"revision":"15620ca37f081b154105a62bb7f00856","url":"build/js/Redirecting-CB_qfOtB.js"},{"revision":"51c9ec740a6d3f90e38d39151016a23b","url":"build/js/RecentSupporters-BP_c_-Le.js"},{"revision":"859a201b33207a03b4255330b73d2c42","url":"build/js/PwaTest-DVdmv0u8.js"},{"revision":"3b44dc20b01794c4143731999d595a8c","url":"build/js/Promotions-C6BLcAbk.js"},{"revision":"60c5c88f7886b88ff5d9e254ab968ba5","url":"build/js/ProfileTaskLists-C-ZnuBWp.js"},{"revision":"a9f8f53142ef3812b8a29505d2cdd61c","url":"build/js/ProfileTask-wCH7qfwf.js"},{"revision":"bdf9af366cf946796bc80d6e4025b830","url":"build/js/ProfileSteps-DPFpQNgn.js"},{"revision":"2476d6e485906e28cf1ee1b17d211949","url":"build/js/ProfileProductLists-DeaFyTsX.js"},{"revision":"feb035dd4bd492bb2ec0a4369494b99f","url":"build/js/ProfileProductLists-DK9UI-Wo.js"},{"revision":"0f732dd51c7df33aa8d9522d2dbaa3f8","url":"build/js/ProfileProduct-C-PkMHlY.js"},{"revision":"38300b1b42cf7716f6e06206a2cfb054","url":"build/js/ProfileProduct-BP-OSW-v.js"},{"revision":"94224372da69dc58dd5816b5f30c8c23","url":"build/js/PrimaryButton-BzviMX-q.js"},{"revision":"4b63d0991345daae0c6782d01d5ade6a","url":"build/js/PriceFormat-CXcImLq8.js"},{"revision":"e22109b997dd5dd0d92b8de7848b615e","url":"build/js/PostLike-C7zJVBlK.js"},{"revision":"9b75d218547db978af11fce2a3e259dc","url":"build/js/Post-BuWeqPAt.js"},{"revision":"b9e21d62e5dfe9009f467a6e5ad7a208","url":"build/js/Popup-CaE63lmQ.js"},{"revision":"def0a838c9335e25565e5b5d553ccbcf","url":"build/js/PlatformAnalytics-BOqqfgVp.js"},{"revision":"c8d63e605d94f885789b03de60f6c383","url":"build/js/PaymentSlider-4qSP6nCR.js"},{"revision":"d422d60d2956db3164d18b4d5b310cb1","url":"build/js/PaymentDashboard-BQGAGkV3.js"},{"revision":"c6ffc44964a1c48684673f33294d34ba","url":"build/js/PaidTasksTerms-Dukqm5px.js"},{"revision":"ceea1fe0db9ae47795ea715893fb838b","url":"build/js/PaidTasksAnnouncement-DeOURQJX.js"},{"revision":"3d6ff514d76aeedcbeca2e965442dbe1","url":"build/js/OrdersLists-CYJTwZ7B.js"},{"revision":"3e20df435fdd24f3b070669df9b05634","url":"build/js/OrderDetail-BSO2zoLf.js"},{"revision":"8f4df5298e5c77d602c10e9291e329a3","url":"build/js/Order-Cl8uH9GU.js"},{"revision":"1fc28f48f106b06fc94a5aaf5508e75a","url":"build/js/OldSubscribe-BxvGtyli.js"},{"revision":"8bfbeb172475fc7640862a45b6faa72a","url":"build/js/NotFound-Lfd_q9rG.js"},{"revision":"018180ad028913009aac6123d7dc27a8","url":"build/js/NotForBusiness-D1sQyG2B.js"},{"revision":"e79f756009eab7816689e3bf9776aefc","url":"build/js/Nocontent-18dXA7wD.js"},{"revision":"49a9aa78c099dbcd1464dfb0a06aec7f","url":"build/js/NewVerified-394mcRGJ.js"},{"revision":"5bf49bf3f53cd7952110c893cdefcde3","url":"build/js/MyShopProducts-BswxquKJ.js"},{"revision":"8c955dde73323276ea83f8d76f9526b4","url":"build/js/MyGoal-D5uXNR2K.js"},{"revision":"11681306baeec389c2bba81a77e7fb4c","url":"build/js/MonthlyRevenue-8unSp0k0.js"},{"revision":"6dbe06f59241a77a250ab3961dd17ed3","url":"build/js/MembershipsLists-_sLb6h8m.js"},{"revision":"3378fb24258454fb09ebc4cbab73e4de","url":"build/js/Membership_dashboard-ChpN0-l7.js"},{"revision":"836bce8115675fb74b6a6a350b5bc618","url":"build/js/MembershipTracker-kPyawqIx.js"},{"revision":"76558f37e10e78281e2f8ea159394c0f","url":"build/js/MembershipLists-CjB37Iuc.js"},{"revision":"6375d637668c376f84ff1eb1806046c2","url":"build/js/Membership-vpwDTYPQ.js"},{"revision":"56893b67623aeb576e61e8dc24513e59","url":"build/js/Membership-CQE04_Mv.js"},{"revision":"6debd53e97af3c7aedbb2e2697de84a0","url":"build/js/MemberCheckout-D3LNT70C.js"},{"revision":"c864999644679218830d632f99fab603","url":"build/js/MagicBellNotificationDisabled-92ZDvi14.js"},{"revision":"cb7fa750b77a3990575f51aa546fe5db","url":"build/js/MagicBellNotification-Bdq1Lou5.js"},{"revision":"c71271bbade0c6205622d0adc26e58b6","url":"build/js/Login-BHdLjTLm.js"},{"revision":"119ba453fa4d99c2f305122cb88c083f","url":"build/js/LoadingScreen-D1mIn4mp.js"},{"revision":"bfe1004e1011de088d965eced78887eb","url":"build/js/LoaderButton-fNrSvLHn.js"},{"revision":"571d71977f69356ede4c493f1bd2aa24","url":"build/js/LiveBarSection-BWcC9IVB.js"},{"revision":"0967050f408c146e6446221d75497f35","url":"build/js/Lists-DdJQ9Wf8.js"},{"revision":"ceb57fdfd49c37f351a8b97c95337ef9","url":"build/js/LinkTwitter-BrnMf14V.js"},{"revision":"7c912cef2eece97c2857f41a56c781f4","url":"build/js/LineChart-CcjM2por.js"},{"revision":"396e33a5d0eab0d4ac6f5507dc1ec2ea","url":"build/js/LeaderboardStars-KvfB-s83.js"},{"revision":"0a737777b4668ed624f6c042526d7105","url":"build/js/JoinUs-T8Z_EryK.js"},{"revision":"fddb113c8ba5513a30653c8726baf085","url":"build/js/Item-BfQPEWsW.js"},{"revision":"488f4795412b4be3768394eef10f6e1b","url":"build/js/IntrosVideos-OzROup66.js"},{"revision":"72f76c54889350da87ebd991ac27862d","url":"build/js/IntercomDebug-Cza3DDyv.js"},{"revision":"3d83043aff82172b2ca4d48e87debf1f","url":"build/js/InputLabel-7DZohQub.js"},{"revision":"acfb6b76865b604a43b5120667fa5671","url":"build/js/InputError-H-bUZSIb.js"},{"revision":"ac39f6b244885c3576a0a1b395f0630c","url":"build/js/Index-Dfehh_Nt.js"},{"revision":"97d97cdf1e38d372a23eff6073ede737","url":"build/js/Index-DQkmIvsc.js"},{"revision":"fb085aa76328a9b2f666f82bf78bd6db","url":"build/js/Index-CbeRmlMv.js"},{"revision":"7278fe282b347ddddfc540eb78f1bfe6","url":"build/js/Index-9OR8ux0l.js"},{"revision":"0faf2d541e650e138e75c01ee8957e82","url":"build/js/ImageGenerationWithAI-B4jWFdSl.js"},{"revision":"9375b588aa2bf07296afa00cb733fbcb","url":"build/js/Icons-DxGv6K9j.js"},{"revision":"e51441a949a2a24dbc8bf2831b568888","url":"build/js/Hero-Ctbx0Cda.js"},{"revision":"b3c6c7b0f390859ff2fea8aca628a24a","url":"build/js/Header-CaDmnJEc.js"},{"revision":"75db2c40b3d2d9f9a605ec293c1027a9","url":"build/js/HappyCreators-Bmd6zgsX.js"},{"revision":"2f09404462fd92dfccd4ac4efe839470","url":"build/js/GuestLayout-DRXOTicp.js"},{"revision":"9ce23ebd625b3efecdd4d78af4b95cb1","url":"build/js/GrowthTrends-DuJKHUvs.js"},{"revision":"0ac2c5844e9e5f2d75959bd021c8fa92","url":"build/js/GlobalCheckout-BPQQXiP5.js"},{"revision":"2735294f2c8c1dbf090fc531a6bfbc28","url":"build/js/GifterTips-O9nip1yD.js"},{"revision":"343775d190b1f21ab9b439de5765c8a6","url":"build/js/GifterSubscriptions-By0Eypxt.js"},{"revision":"282f309e140e476eba77dffb04a1afc1","url":"build/js/GifterMembership-CrHceaNg.js"},{"revision":"9592b30a0d5d6f5fc0858c8b829602f3","url":"build/js/GifterMedia-CycTO54L.js"},{"revision":"8d16f72ddef1d0f2ad6a9d947a287bda","url":"build/js/GifterItems-C7R_XQtI.js"},{"revision":"0b48276357e105ec264449341ec304b3","url":"build/js/GifterFeed-tnBN3fPi.js"},{"revision":"4448188e5289b7ecd16c107e2bb36f54","url":"build/js/GifterCardVerification-CA-nx44y.js"},{"revision":"34f0f089f4776cbf250ee5198555af31","url":"build/js/GifterBills-BsauyT8L.js"},{"revision":"cff84ecc90e2db72b8da9a46941778f6","url":"build/js/Gifter-Dzm7HsUQ.js"},{"revision":"e45749da97383ee8c1d23380486cf9ca","url":"build/js/GiftStore-B4PcMXc6.js"},{"revision":"92c75141382a4314b801071a4d3bc424","url":"build/js/GiftListing-Cp9TV3H6.js"},{"revision":"3e0371cccf0e4c5bcedeb8246c0cee45","url":"build/js/GiftEdit-BpFK1Jw1.js"},{"revision":"cae49b079e6ab14ea4079def495d9d18","url":"build/js/GiftAddCart-fDehD2xr.js"},{"revision":"27363e27f709b65861665fa5b60497cf","url":"build/js/GetCart-B2vUlR1C.js"},{"revision":"da31605480f244d9e5c5f90fd65853c1","url":"build/js/FunPart-CGbh1Ddx.js"},{"revision":"e96e45451a473fa85f23e7c094819217","url":"build/js/FounderProgramAnnouncement-DYD_DD3U.js"},{"revision":"beac31a478f4e06d2e8a2765150d614b","url":"build/js/FounderBadge-CR-jTXdC.js"},{"revision":"8df25d7cc39f4bcb346f1deb20e70c64","url":"build/js/ForgotPassword-DXls7NKq.js"},{"revision":"3a6a1fc5a09619b75b6b86cd1c7d9684","url":"build/js/ForCreators-Db9pTfn9.js"},{"revision":"7a63acfd981f1be58d909a20d79c5cc1","url":"build/js/Footer-Bq4TI4kn.js"},{"revision":"052ce177512f6187ef5959c07956b2d2","url":"build/js/FollowButton-D1wuyF9Z.js"},{"revision":"379b5513098c860881dfd3c9f28b4679","url":"build/js/FlashMessenger-D5EU3lMj.js"},{"revision":"e8d7d4b2ab62ab51c6f0ed8792d3d628","url":"build/js/FiltersPanel-B739gI5B.js"},{"revision":"02925392e4582c13d707535f08cb4812","url":"build/js/FeedList-BnSwiBLi.js"},{"revision":"3827a0e5d23936ba1d89b42269b204df","url":"build/js/FeaturedCarousel-DqfjUfC_.js"},{"revision":"f0c40d4b5c9e1f4d740ec7742a2b670c","url":"build/js/FAQ-CZKhVtWD.js"},{"revision":"57baa188ba2c00b09b272ffbe1b7209e","url":"build/js/ErrorPage-CosQFw4T.js"},{"revision":"973359f37a0c161ac738d77e0f0aea31","url":"build/js/EnterOTP-Dz1geNBw.js"},{"revision":"0e739a269091aad9bfc9f736fc8c275b","url":"build/js/EnableCardCapabilities-DM1JGMlt.js"},{"revision":"6b0feb77b371199578b72a7b8568faaf","url":"build/js/EditProfile-BXBg32nl.js"},{"revision":"36fc2bf50dbd6807e8a554c7ad3b32a6","url":"build/js/EditMembership-CVdbAuaE.js"},{"revision":"a50e623927df5887affc139ca8206766","url":"build/js/EditCategories-JmQYM_nI.js"},{"revision":"e3322c70840d552b8729b7c79d503928","url":"build/js/Edit-GzBd_CwB.js"},{"revision":"caae92b53b1f03304bb34b1a0993eaae","url":"build/js/Edit-BPdrLsmp.js"},{"revision":"9553f64b2d197cbd58d0bf7699bf85ed","url":"build/js/Earnings-CLqqI-b0.js"},{"revision":"e5c142d85f94ab6954ca94109c3d015a","url":"build/js/Discover-vGXp5571.js"},{"revision":"fa0a1840280d97492797038b43778f89","url":"build/js/DiagnosticPage-DnZ-dALZ.js"},{"revision":"56f66d61443098b1617c6646c18367b1","url":"build/js/DeleteUserForm-Cg315tC8.js"},{"revision":"a38231d24f85636554128c0bc4f9b537","url":"build/js/DeleteStripeAccount-ChoTFk4V.js"},{"revision":"e07e3eae043439c6df8521764b2c860a","url":"build/js/Dashboard-Fh9JC8Im.js"},{"revision":"fea1eb892c7316c87177c8ab6839a2e0","url":"build/js/Dashboard-CPmjYWJ3.js"},{"revision":"5c41ea3106aaa0ec2ef3cb3134f610ee","url":"build/js/CreatorVerificationNew-CKgH9i3l.js"},{"revision":"4bbd1921bbfd1cf0c12a1360453f9a30","url":"build/js/CreatorVerification-Z5Pff_1A.js"},{"revision":"e7a27add6bbce7d264b3f05323abf635","url":"build/js/CreatorSubscriptionWidget-D2IGfI3E.js"},{"revision":"0411480d376401806680f46fe9c73563","url":"build/js/CreatorCard-B40wWucn.js"},{"revision":"0e47c47414f5b4cc9d149b6e794e6b5f","url":"build/js/CreatorActivityWidget-CBI-NFmJ.js"},{"revision":"8b9b8769c9bea2509aabdcbf2ba5af72","url":"build/js/Create-URRIOAWL.js"},{"revision":"697234dfebd6fadb398d31eaf36ee00a","url":"build/js/CountriesShipping-CceHT29i.js"},{"revision":"77cdfd1bef6be3d724cd3ef638b3ea61","url":"build/js/Countries-CgK4MBoo.js"},{"revision":"ca7db27bb6462cdf08adce6b4ef4d49d","url":"build/js/ConfirmPassword-DAjoNzfl.js"},{"revision":"c4e4a4c1550469f41f9a7546e13bf9c8","url":"build/js/CommetsLists-N46xdmH1.js"},{"revision":"56bc715478fee51fc0dcae7e8bc65d9d","url":"build/js/Comment-CJjIhToX.js"},{"revision":"c94fffd264f3ab539465f96cef7b6d44","url":"build/js/ComingNext-BPzmdCCl.js"},{"revision":"295c3675aedb1808b9732bf1140ac606","url":"build/js/ChartDashboard-CB6aTfpK.js"},{"revision":"0e932babda4541f55082f19e35c24b41","url":"build/js/ChangeVat-OHpySCHJ.js"},{"revision":"8e0e00408890d7e62947812258d2429f","url":"build/js/ChangeCurrency-C_tovXnc.js"},{"revision":"a9eab77bd85757cbff4a5df095d1ac41","url":"build/js/CategoryLeaders-1Qnx8D7t.js"},{"revision":"9777c233e4f18ecf9ab0a44dc38fc3d6","url":"build/js/CartListing-DMSamRws.js"},{"revision":"367ea60bcc0ba5ac43205ef17779a074","url":"build/js/CartItems-DKRiKNTY.js"},{"revision":"bb62c06233af400a85c144664840948c","url":"build/js/CartItem-C4nLwfya.js"},{"revision":"8f00e128f5e9c0b3e9ef9061b5e25ea7","url":"build/js/Cart-DKlRkolC.js"},{"revision":"7a1dedbd03bde23e8d3eef7ad9600425","url":"build/js/BuyShopItem-BlF1XvFx.js"},{"revision":"be7eb40ec470e1c11e28bef2ee28a9fe","url":"build/js/Board-QgMc_oZN.js"},{"revision":"f11f528deaf7fcb61979013bd19525a7","url":"build/js/Billslist-9-lPE2PQ.js"},{"revision":"92067eac6015198d98d8c1d77154a7c5","url":"build/js/BillsTracker-ph-r4GXZ.js"},{"revision":"23b724239f5b22298e28d19631323918","url":"build/js/BillCheckout-BWP5nxvu.js"},{"revision":"c7ceeb63753e796d8f0cb1cd5815a704","url":"build/js/Bill-DV4VzKPQ.js"},{"revision":"17ba3e04febc016e89a8ec9334a3d2aa","url":"build/js/Avatar-CIZWCkZX.js"},{"revision":"505505ebcbe3920a7b39c6782d70f054","url":"build/js/AuthenticatedLayout-B9prllAt.js"},{"revision":"7506e0d184e25c0b3096b4bbfe18d04f","url":"build/js/Analytics-BszKwizX.js"},{"revision":"912c5237eb235ed6661e3c66cf4aa912","url":"build/js/AllWishes-C6QAAfYU.js"},{"revision":"e6ff458cf6708b4cbe18ab3587fce606","url":"build/js/AllCountries-CAlimWPq.js"},{"revision":"8fc9a1d309411bbd5bb740ecde6e5ebd","url":"build/js/Alerts-W6v7rI4c.js"},{"revision":"13e47ae2c57089e1a9c384463648bec7","url":"build/js/AddressForm-DXEO3I70.js"},{"revision":"6ebe899411f358d97419c2fbc46d7ffe","url":"build/js/AddShop-Ckpmyq5N.js"},{"revision":"031a405b524d0a48a5498692704bb83b","url":"build/js/AddRyeProduct-DoowZcV3.js"},{"revision":"97c1bbe9773ebaff0e333b16be91f342","url":"build/js/AddPost-BHhH290T.js"},{"revision":"3859796939f963c011d0b4734f4cf1e2","url":"build/js/AddMembership-DlFxjISM.js"},{"revision":"d78e4bc0fe6621ff621886ef94299a1c","url":"build/js/AddItem-DMr9gV5-.js"},{"revision":"d97f930c8bb3d409d280ff7bb52794db","url":"build/js/AddIntro-CZbs3rGZ.js"},{"revision":"30cb9f9d1af775b09f80a8d59e03a22a","url":"build/js/AddGoal-CpM9dLQp.js"},{"revision":"c8ec7682c31ddfc629bda6f003c6ea0b","url":"build/js/AddGift-D6gHP_Xe.js"},{"revision":"09501866d79b7c86cd0350cff60a6eb2","url":"build/js/AddComment-Bj7TmSt4.js"},{"revision":"68cd1935eb4021bc1bc188d3b0f968f6","url":"build/js/AddCart-BPe2rI9a.js"},{"revision":"0ac70c7e1345fe3403ded1a8b005d148","url":"build/js/AddBills-iNe6Rp2O.js"},{"revision":"bba6c62a70cd5081b27bdef06c602e4b","url":"build/js/ActivityStatus-HQVQVy67.js"},{"revision":"308298cb1ea30670a1b2e7260cc0dadd","url":"build/js/ActivateSubscription-B329a15D.js"},{"revision":"f0db008484811745d73e26d9dcf68a4d","url":"build/js/ActivateCard-DGsyrZq9.js"},{"revision":"f03744c8df8472eb3d665e215fdb5b4f","url":"build/js/ActionRequired-Cybxx_fY.js"},{"revision":"e305c2b9ec6df9fb08f20618804eefbe","url":"build/js/AchievementSystem-By4toKHg.js"},{"revision":"d38fc297d446d41f6c68b106dec34c9b","url":"build/js/Accountsetting-Ci0oxyPw.js"},{"revision":"db23f9ec9429543c7cf4464cefd8d365","url":"build/js/404-Dnnlg8j7.js"},{"revision":"e6d12afb9c853d709fd6f3b3e435111a","url":"build/images/youtube-DDw5LQj8.png"},{"revision":"91c63fb4f677b5121fa19e29032a43a2","url":"build/images/yourwishlist01-Bv-ImBfJ.png"},{"revision":"ca6bf9acf1cb8c71ec57e2ff492f4918","url":"build/images/x-D1QobfAh.png"},{"revision":"3798bb84cc89dd4a568fffad020151e8","url":"build/images/wishlistbannerimg-DSgxBtNu.jpg"},{"revision":"28c7ccf470495930dc80c987edf0312c","url":"build/images/vishitimg01-ClMBzIW7.png"},{"revision":"56c01d960ec651d97d3fc99881d06015","url":"build/images/userphoto-2kQnKrr1.png"},{"revision":"5282d7295dd8b6b0de40e7b10d24d1dd","url":"build/images/uploadedimg-BhEeut8S.png"},{"revision":"cba71702e9772d07eb3ab7320601f676","url":"build/images/uniqlo-Bxf7nI5n.png"},{"revision":"8114363d58e2f13606776b5d0242d435","url":"build/images/twitterpost-CwsXCYvD.png"},{"revision":"96fb00767e1d7a31e820182cd9cdc42e","url":"build/images/twitch-C2hhmhLl.png"},{"revision":"afb8dd4ce77b7af41db90e80369a1745","url":"build/images/trust-hK0IhoQZ.png"},{"revision":"ff7f6dfb2e4c2976774295663ecf8930","url":"build/images/tiktok-CmXIKDPc.png"},{"revision":"b1cec1f4701189627473ecd5e2967363","url":"build/images/supportors-img-CQS8-frF.png"},{"revision":"e3bf6a718f558a9d385ce73293389b6f","url":"build/images/subscribers-img-CICUnn2I.png"},{"revision":"5231cb6bbb1494e6d3959731ed39b34d","url":"build/images/ssl-DnZPu9aw.png"},{"revision":"85277ae0fa9f02368b51513dd1d9988a","url":"build/images/spennys-QKaelW4q.png"},{"revision":"ef4f11f1fd1c2d9bd1560a6580f18fcf","url":"build/images/social-bg-DGdPbRTx.png"},{"revision":"e2580b027d1c52144ff01c47f4a1f371","url":"build/images/siteicon-CeHS7aEc.png"},{"revision":"3427267e9359f5e626e3e607faec5cf2","url":"build/images/sharlinkimg-B-m5kVcL.png"},{"revision":"34f4d39adb8fe7a6f43c89e4f9ab2531","url":"build/images/setuppaymentimg01-CIwjGd16.png"},{"revision":"2d05bda9f0eb258a86bcd614c58744f4","url":"build/images/seeksearch-CGztpZW3.png"},{"revision":"33e5f7a4b02658aca6a7cf1ac9031f0d","url":"build/images/publish-CYFC99Bi.png"},{"revision":"371cd7d7178e81528ffa9f7b2cbab3e2","url":"build/images/proud-B4T3qkHx.png"},{"revision":"f75b3fe3fbb23f471858331e5bb19908","url":"build/images/plaid-C3YNig8l.jpg"},{"revision":"2e14b4dfd9ac93ed8b388a2c342f2fc3","url":"build/images/other-BKBJqoNV.png"},{"revision":"ed6627d54a64aead2bee77cb56f91edc","url":"build/images/nova-VIEvmjEk.png"},{"revision":"6a91a778863b131c5c68e2954b644b59","url":"build/images/noresultimg-CnfMO9_z.png"},{"revision":"088474c0abd89fa32d7dd4a21bf336c8","url":"build/images/nike-DLThTltp.png"},{"revision":"ef69b79ece73f8ad708a3028d20e207f","url":"build/images/mouse-DINZi5et.png"},{"revision":"e382f54ea7fd8c4162a53826e3573124","url":"build/images/membership-img-D47G_pA3.png"},{"revision":"e7a23ec568613b5b22be537a2ec71113","url":"build/images/logo-BfA3DShe.png"},{"revision":"3be127f433cf2d9824aaef1cfee06de4","url":"build/images/lockprofile-BXHexqRM.png"},{"revision":"45aa76a89e29d0b713d5435f9d183f05","url":"build/images/loading-DKd4CxP-.gif"},{"revision":"660483c24c1557b7822408b021ebb05a","url":"build/images/kylie-BcKwDcm6.png"},{"revision":"367a325bdc3fc9cdded658ad3e674eb5","url":"build/images/joinBottomImage-BPCsUTyF.png"},{"revision":"cf907f36b1ead9153a7ae8b9625785a9","url":"build/images/itsfree-mob-BdOy0svF.png"},{"revision":"c5ad813c40b5877e6fcd93431b7fbe8b","url":"build/images/itsfree-DmZDJQm5.png"},{"revision":"deb046c5eace6d33766ff2b14a8bb7d7","url":"build/images/instagram-DvC8l1Gh.png"},{"revision":"57692988c3e7b1aa8154820c9a225a7b","url":"build/images/huel-DnOlOTCl.png"},{"revision":"6a40fd1d8efc4972d40c884d30ce118f","url":"build/images/howitworks3-BRisRMQ1.png"},{"revision":"0aee0cbdd3da50b3df5afa6d1452564b","url":"build/images/howitworks2-BVS06r0S.png"},{"revision":"4f350c408e488b36e2b076f2911e5075","url":"build/images/howitworks1-CXiXTdFw.png"},{"revision":"a9f81ab05545223de7195832f8eca224","url":"build/images/giftimg-CbenuWDF.jpg"},{"revision":"ce0af01074044c4b76e76d5df520d57a","url":"build/images/giftbasketimg01-UPFBeLeW.png"},{"revision":"f29059873c0f1404220059db49f81335","url":"build/images/fundbasketimg01-DNZiLLCY.png"},{"revision":"185ebf700d44a7ff0a36a0b2c5d179c4","url":"build/images/flag-european-BCCzeLKH.png"},{"revision":"520a8dd15b8b4ea5e521efdcb9f3ff8a","url":"build/images/fillbank-CqRu24Vo.png"},{"revision":"37b70962047c5bd8e4fe08c24cf295d1","url":"build/images/faqhand-BXWGoK2R.png"},{"revision":"00383acdd9c964f978345248b5dfa879","url":"build/images/editicon-errcM8K5.png"},{"revision":"c6912178cadcf74241239b7e890861d4","url":"build/images/commingsoon-eOjyCKzm.png"},{"revision":"e664153053f1385d4805ecbed2d37af5","url":"build/images/comingnext-jAz-GIeT.png"},{"revision":"e74b36fafb3303820e1fa34167c50711","url":"build/images/closeblacksm-DrNnW4fj.png"},{"revision":"e25f1c7b9cab2229f73677bef658a88a","url":"build/images/cartproductimg-C1koo3C8.png"},{"revision":"af1c0ea6e913549d9c8792cc537d619d","url":"build/images/british-flag-BcogJXZ-.png"},{"revision":"f99541e6fb17d4b53ff8eac812e83a01","url":"build/images/beauty-DCFqJTVd.png"},{"revision":"686feddf8a3ba2bed86a8bece3c0e5de","url":"build/images/asos-CIGR1i9R.png"},{"revision":"895a22c2513c2140ffd0239469cd4264","url":"build/images/apple-Cdm1sU91.png"},{"revision":"f05404d5698ff1d60f754be4957d6038","url":"build/images/amazon-Cd4bGo_L.png"},{"revision":"9ad6d4c2fbc3e347878476c1bc68b8f6","url":"build/images/alo-KVTsT1zJ.png"},{"revision":"b6a719cdcfa23d8a49599ca0402af079","url":"build/images/Support-lrPSB2XC.png"},{"revision":"b32ebc1d68304a3f4274263d122d1372","url":"build/images/PaymentIcon6-Dnmu-RS3.png"},{"revision":"fd00a8106121da67fd9803528d24eca9","url":"build/images/PaymentIcon3-xBRNnK8D.png"},{"revision":"438cd7d493d1fdae4695d49125c069f5","url":"build/images/PaymentIcon1-CnS4Hmbs.png"},{"revision":"200d549e38788b511b33a6048ec61515","url":"build/images/PREMIUMMEMBERSHIP-BsFrui0Q.png"},{"revision":"d062b7cb5a0b397f5141fd2d1e1c1720","url":"build/images/PCICompliance-qTSDRKZK.png"},{"revision":"6171e705a1fb4824b0c6259333f760b5","url":"build/images/HeroWishlist-BvpIkzQT.png"},{"revision":"661f5474eb135a1f5dedf10259b59f6a","url":"build/images/HeroBg-mobile-C7A97uu3.png"},{"revision":"76b8bb84807513420a60d10be23d843a","url":"build/images/HeroBg-mobile-BrX8Wyco.webp"},{"revision":"da982fa1cd416f4bd606fc57013b3ed4","url":"build/images/HeroBg-CgSE7w-A.png"},{"revision":"4511b0d46f7fb9027bfd57afcc1387d0","url":"build/images/HeroBg-CbJjqro0.webp"},{"revision":"25b74e9611d89f31de2a5e3061a8437e","url":"build/images/Fun3-CTF4GJxL.png"},{"revision":"82aaad31298d683cc72ddc026d84dae6","url":"build/images/Fun2-D2x8rwJt.png"},{"revision":"6a5cfaf0d9e863c31554b8d7930f3fb5","url":"build/images/Fun1-DDq1R1Kv.png"},{"revision":"c2d609bcf620e5454c807a909c0ab1b0","url":"build/css/uploader-B6JQUsUA.css"},{"revision":"66e0f6741af75138090fe3da4b4a299e","url":"build/css/swiper-react-DV8PrLMj.css"},{"revision":"823ff80cfcb0e4c0b943d318d5fc6d09","url":"build/css/pagination-DE0q59Ew.css"},{"revision":"221f5725c5188867e585b0676ed6a7ff","url":"build/css/navigation-CteQybwo.css"},{"revision":"900b7184a06d1d6a7db0ab6be95342dc","url":"build/css/app-otav8exe.css"},{"revision":"d80e46b71f8b6b0accfd1477ef6eee7f","url":"build/css/Welcome-DvB2Xm2x.css"},{"revision":"639caebe6a7b0bb9152efd15fb359dc6","url":"build/css/PaymentSlider-VUyWc9KG.css"},{"revision":"50a03561de83412f01352b355a8f3c3f","url":"build/assets/newfont-BbOIne1V.woff2"},{"revision":"725d23ba19f0eea43a8332db33b0c6f0","url":"build/assets/newfont-BRfniQek.woff2"},{"revision":"c9520ec39095b027c9b827bd17f57079","url":"build/assets/HeroBg-mobile-GCavCQQZ.avif"},{"revision":"86dfd368a7f029fa1e317eafc68a32b8","url":"build/assets/HeroBg-D5giMcpd.avif"},{"revision":"65f0e24ec93f3b055e9d92c34ddbc293","url":"build/assets/CeraGRMedium-QrW24R6m.woff2"},{"revision":"80d47aa9444b6ec5cffe49083381664d","url":"build/assets/CeraGRMedium-DoVttStx.woff2"},{"revision":"3bb9599cb7a4d65a32debe5edc5d6d49","url":"build/assets/CeraGRBold-Dj1hafPQ.woff2"},{"revision":"5d5fefa7fbdb1aa718b1d285eb005b98","url":"build/assets/CeraGRBold-D5ePNs0e.woff2"}]);

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
