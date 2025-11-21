import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import spennypiggy from "../../assets/img/logo.png";

export default function Footer(props) {
    const { auth } = props;
    const { props: pageProps } = usePage();
    const intercom = pageProps?.intercom || {};
   
    async function configIntercom() {
        setTimeout(() => {
            const appId = intercom?.appId || "xomg14o9";
            const boot = intercom?.boot || {
                api_base: "https://api-iam.intercom.io",
                app_id: appId,
                custom_launcher_selector: ".livechat",
            };
            window.intercomSettings = boot;
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
                        s.defer = true;
                        s.src = `https://widget.intercom.io/widget/${appId}`;
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
        }, 1000);
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
    }, [intercom?.appId, JSON.stringify(intercom?.boot), auth?.user?.id]);
    useEffect(() => {
        confgureGtag();
    }, []);


    const date = new Date();
    
    // Function to show Intercom messenger
    const showIntercom = () => {
        if (window.Intercom) {
            window.Intercom('show');
        }
    };
    
    return (
        <>
            <Head>
                {/* Google Analytics now loaded dynamically via lazy loading */}
            </Head>

            {/* Floating Intercom Button */}
            <div className="fixed bottom-6 right-6 z-50">
                <button
                    onClick={showIntercom}
                    className="bg-[#8C52FF] hover:bg-[#7a45e6] text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
                    title="Live Chat Support"
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="currentColor"/>
                        <path d="M12 11C11.45 11 11 11.45 11 12C11 12.55 11.45 13 12 13C12.55 13 13 12.55 13 12C13 11.45 12.55 11 12 11Z" fill="currentColor"/>
                        <path d="M16 11C15.45 11 15 11.45 15 12C15 12.55 15.45 13 16 13C16.55 13 17 12.55 17 12C17 11.45 16.55 11 16 11Z" fill="currentColor"/>
                        <path d="M8 11C7.45 11 7 11.45 7 12C7 12.55 7.45 13 8 13C8.55 13 9 12.55 9 12C9 11.45 8.55 11 8 11Z" fill="currentColor"/>
                    </svg>
                </button>
            </div>

            <footer className="bg-[#924DFF] text-white pt-10 pb-3 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4"> LEGAL </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li className="fading"> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=88583b44-9385-430c-aa79-3c41dc8a167e" target="blank" > Privacy policy </a> </li>
                                <li className="fading"> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=f11eb44f-4ddd-4d59-86d1-34c11e3fa80e" target="blank" > Cookies Policy </a> </li>
                                <li className="fading"> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=a1f91da2-10e4-49e8-88b6-fc716b2645ba" target="blank" > Return Policy </a> </li>
                                <li className="fading"> <a href="https://ucarecdn.com/6b25399f-e259-4c19-bbdf-70308c5814ef/SPTERMSFINALVMAY2025.pdf" target="blank" > Terms & Conditions </a> </li>
                                <li className="fading"> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=9a437e57-fcc7-439f-a7e7-96b493a8c50f" target="blank" > Acceptable Use Policy </a> </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4">
                                GENERAL
                            </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li className="fading"> <a target="_blank" href="https://blog.spennypiggy.co"> Blog </a> </li>
                                <li className="fading"> <a target="_blank" href="https://app.termly.io/notify/88583b44-9385-430c-aa79-3c41dc8a167e"> DSAR Form </a> </li>
                                <li className="fading"> <a target="_blank" href="https://app.termly.io/policy-viewer/policy.html?policyUUID=364c168c-44ab-467e-a98a-a22629fc31f8"> Disclaimer </a> </li>
                                <li className="fading"> <a href="#" className="termly-display-preferences" > Consent Preferences </a> </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4">
                                HELP
                            </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li className="fading"> <a href="#" className="livechat" onClick={(e) => { e.preventDefault(); if (window.Intercom) { window.Intercom('show'); } }}> Live Chat</a> </li>
                                <li className="fading"> <a target="_blank" href="https://intercom.help/spenny-piggy" > FAQ's </a> </li>
                                <li className="fading"> <Link href={route("promotion-terms")}> Promotion Terms </Link> </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4">
                                CONTACT
                            </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li className="fading"> <a href="tel:02033552057"> 020 3355 2057</a> </li>
                                <li className="fading">
                                <a href="mailto:support@spennypiggy.co">
                                support@spennypiggy.co
                                </a></li>
                                <li className="fading">55 Colmore Row, B3 2AA</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center mt-4 sm:mt-2 space-y-4 ">
                        <Link href="/">
                            <LazyLoadImage
                                alt={"image"}
                                height={70}

                                effect="blur"
                                src={spennypiggy}
                                width={220}
                                className="cursor-pointer"
                            />
                        </Link>
                        <p className="text-sm font-poppins ">
                            Copyright © {date && date.getFullYear()} Spenny Piggy
                        </p>
                    </div>

                    <p className=" border-t border-white text-center text-xs mt-4 pt-4 px-4 md:px-20 text-white/80 font-poppins">
                        All trademarks, logos and brand names are the property
                        of their respective owners. All company, product and
                        service names used in this website are for
                        identification purposes only. Use of these names,
                        trademarks and brands does not imply endorsement.
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
