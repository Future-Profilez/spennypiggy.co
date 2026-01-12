import { Head, Link } from "@inertiajs/react";
import { useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import spennypiggy from "../../assets/img/logo.png";
import risk from "../../assets/risk_intolerant_vanguard_sharing_mint.png";

export default function Footer(props) {
    const { auth } = props;
   
    async function configIntercom() {
      window.intercomSettings = {
         api_base: "https://api-iam.intercom.io",
         app_id: "xomg14o9",
         custom_launcher_selector: ".livechat",
      };
      (function () {
         var w = window;
         var ic = w.Intercom;
         if (typeof ic === "function") {
            ic("reattach_activator");
            ic("update", w.intercomSettings);
         } else {
            var d = document;
            var i = function () {
                  i.c(arguments);
            };
            i.q = [];
            i.c = function (args) {
                  i.q.push(args);
            };
            w.Intercom = i;
            var l = function () {
                  var s = d.createElement("script");
                  s.type = "text/javascript";
                  s.async = true;
                  s.src =
                     "https://widget.intercom.io/widget/xomg14o9";
                  var x = d.getElementsByTagName("script")[0];
                  x.parentNode.insertBefore(s, x);
            };
            if (document.readyState === "complete") {
                  l();
            } else if (w.attachEvent) {
                  w.attachEvent("onload", l);
            } else {
                  w.addEventListener("load", l, false);
            }
         }
      })();
    }
    
    async function confgureGtag() {
        window.dataLayer = window.dataLayer || [];
        function gtag() {
            dataLayer.push(arguments);
        }
        gtag("js", new Date());
        gtag("config", "G-9F1M3QZZB3");
    }

    useEffect(() => {
        configIntercom();
    }, [auth && auth?.name]);
    useEffect(() => {
        confgureGtag();
    }, []);
    const date = new Date();
    return (
        <>
            <Head>
                {/* Google Analytics now loaded dynamically via lazy loading */}
            </Head>
            <footer className="bg-[#924DFF] text-white pt-10 pb-3 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
                        <div>
                            <div className="pb-4">
                                <Link href="/" className="block">
                                    <LazyLoadImage
                                        alt={"image"}
                                        height={70}
                                        effect="blur"
                                        src={spennypiggy}
                                        width={220}
                                        className="cursor-pointer"
                                    />
                                </Link>
                            </div>
                            <img
                                alt={"image"}
                                height={70}
                                effect="blur"
                                src={risk}
                                width={220}
                                className="cursor-pointer max-w-[200px] "
                            />
                        </div>
                         <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4">
                                HELP
                            </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li> <a target="_blank" href="https://spennypiggy.co" className="livechat intercom-dud02y e11rlguj1" > Live Chat</a> </li>
                                <li> <a target="_blank" href="https://intercom.help/spenny-piggy" > FAQ's </a> </li>
                                <li> <Link href={route("promotion-terms")}> Promotion Terms </Link> </li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4"> LEGAL </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=88583b44-9385-430c-aa79-3c41dc8a167e" target="blank" > Privacy policy </a> </li>
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=f11eb44f-4ddd-4d59-86d1-34c11e3fa80e" target="blank" > Cookies Policy </a> </li>
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=a1f91da2-10e4-49e8-88b6-fc716b2645ba" target="blank" > Return Policy </a> </li>
                                <li> <a href="https://ucarecdn.com/6b25399f-e259-4c19-bbdf-70308c5814ef/SPTERMSFINALVMAY2025.pdf" target="blank" > Terms & Conditions </a> </li>
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=9a437e57-fcc7-439f-a7e7-96b493a8c50f" target="blank" > Acceptable Use Policy </a> </li>
                                <li> <Link href={route("paid-tasks-terms")}> Paid Tasks Terms </Link> </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4">
                                GENERAL
                            </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li> <a target="_blank" href="https://blog.spennypiggy.co"> Blog </a> </li>
                                <li> <a target="_blank" href="https://app.termly.io/notify/88583b44-9385-430c-aa79-3c41dc8a167e"> DSAR Form </a> </li>
                                <li> <a target="_blank" href="https://app.termly.io/policy-viewer/policy.html?policyUUID=364c168c-44ab-467e-a98a-a22629fc31f8"> Disclaimer </a> </li>
                                <li> <a href="#" className="termly-display-preferences" > Consent Preferences </a> </li>
                            </ul>
                        </div>
                    </div>

                    <ul className="space-y-2 mt-8 md:flex justify-center gap-4 items-center font-poppins cursor-pointer">
                        <li className="mt-0" ><a className="!m-0 block" href="tel:02033552057"> 020 3355 2057</a> </li>
                        <li className="mt-0" ><a className="!m-0 block" href="mailto:support@spennypiggy.co">support@spennypiggy.co</a></li>
                        <li className="mt-0" ><a className="!m-0 block"  >55 Colmore Row, B3 2AA</a></li>
                    </ul>
                    <p className="border-t !border-gray-400 text-center text-xs mt-4 pt-4 px-4 md:px-20 text-white/80 font-poppins">
                        All trademarks, logos and brand names are the property
                        of their respective owners. All company, product and
                        service names used in this website are for
                        identification purposes only. Use of these names,
                        trademarks and brands does not imply endorsement.
                    </p>
                    <p className="border-t !border-gray-400 text-center text-xs mt-4 pt-4 px-4 md:px-20 text-white/80 font-poppins">
                            Copyright © {date && date.getFullYear()} Spenny Piggy
                    </p>
                </div>
            </footer>

        {/* <div className="bg-black p-12 w-full  h-[100px] ">
            <button className="main-button b ">
                Click ME
            </button>
            <button className="main-button p">
                Click ME
            </button>
            <button className="main-button b size-lg ">
                Click ME
            </button>
            <button className="main-button p size-lg">
                Click ME
            </button>
            <button className="main-button pure-pink">
                Click ME
            </button>
        </div> */}
        </>
    );
}
