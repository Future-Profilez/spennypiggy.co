import { Head, Link } from "@inertiajs/react";
import { route } from 'ziggy-js';
import { useEffect, useState } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { FaTwitter, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";
import spennypiggy from "../../assets/img/logo.png";
import risk from "../../assets/risk_intolerant_vanguard_sharing_mint.png";
import FeatureSuggestionModal from "../Components/FeatureSuggestionModal";

export default function Footer(props) {
    const { auth } = props;
    const [showSuggestionModal, setShowSuggestionModal] = useState(false);

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
    const [IsPWA, setIsPWA] = useState(false);
    useEffect(() => {
        // Check is website is opened in PWA app or not
        if(navigator){
            setIsPWA(navigator.standalone);
        }
    }, []);


    return (
        <>
            <Head>
                {/* Google Analytics now loaded dynamically via lazy loading */}
            </Head>
            <footer className={`bg-[#0A0A0A] text-white pt-8 md:pt-20 pb-30 md:pb-12 relative overflow-hidden ${IsPWA ? "hidden" : ""}`}>
                <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#924DFF]/10 blur-[150px] rounded-full -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#F94F96]/10 blur-[150px] rounded-full translate-y-1/2"></div>

                <div className="containerbox mx-auto relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-8">
                        {/* Brand Section - Left Side */}
                        <div className="space-y-2">
                            <div className="space-y-8">
                                <Link href="/" className="inline-block transform hover:scale-105 transition-transform duration-300">
                                    <LazyLoadImage
                                        alt="Spenny Piggy Logo"
                                        height={110}
                                        src={spennypiggy}
                                        width={300}
                                        className="cursor-pointer max-w-[160px] md:max-w-[200px]"
                                    />
                                </Link>
                                <p className="text-gray-200 font-poppins text-md leading-relaxed ">
                                    The ultimate platform for creators to connect with fans, manage wishlists, and grow their community with <span className="text-[#EFEA7B] font-bold underline decoration-[#924DFF] decoration-4 underline-offset-4">100% payouts</span>.
                                </p>
                            </div>
                            
                            <div className="flex flex-wrap gap-4 pt-4">
                                {[
                                    { icon: FaTwitter, href: "https://x.com/spennypiggy", color: "hover:bg-[#1DA1F2]" },
                                    { icon: FaInstagram, href: "https://www.instagram.com/spennypiggy", color: "hover:bg-[#E4405F]" },
                                    { icon: FaTiktok, href: "https://www.tiktok.com/@spennypiggy", color: "hover:bg-[#000000] hover:border-white/20" },
                                    { icon: FaYoutube, href: "https://m.youtube.com/channel/UCC1GASMLYEjW46dHuKZZMZQ", color: "hover:bg-[#FF0000]" }
                                ].map((social, index) => (
                                    <a
                                        key={index}
                                        href={social.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`w-12 h-12 flex items-center justify-center rounded-[14px] bg-white/5 border-2 border-white/10 transition-all duration-300 ${social.color} hover:scale-110 shadow-2xl hover:border-transparent`}
                                    >
                                        <social.icon size={28} />
                                    </a>
                                ))}
                            </div>

                            <div className="pt-6">
                                <img
                                    alt="Risk Disclaimer"
                                    height={100}
                                    src={risk}
                                    width={260}
                                    className="rounded-[10px] max-w-[160px] md:max-w-[200px] shadow-xl border border-white/5 hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                        </div>

                        {/* Navigation Columns - Right Side Balanced */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                            <div className="">
                                <h3 className="font-gulfs text-[#924DFF] text-2xl md:text-3xl tracking-wide md:tracking-widest uppercase transform origin-left">Help</h3>
                                <ul className="space-y-3 font-poppins text-normal pt-4">
                                    <li><a target="_blank" href="https://spennypiggy.co" className="livechat text-gray-400 hover:text-white transition-colors  duration-300 block">Live Chat</a></li>
                                    <li><a target="_blank" href="https://intercom.help/spenny-piggy" className="text-gray-400 hover:text-white transition-colors  duration-300 block">FAQ's</a></li>
                                    <li><Link href={route("promotion-terms")} className="text-gray-400 hover:text-white transition-colors  duration-300 block">Promotion Terms</Link></li>
                                    <li>
                                        <button 
                                            onClick={() => setShowSuggestionModal(true)}
                                            className="text-gray-400 hover:text-white transition-colors duration-300 block text-left w-full"
                                        >
                                            Suggest a Feature
                                        </button>
                                    </li>
                                     <li><a target="_blank" href="https://blog.spennypiggy.co" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors  duration-300 block">Blog</a></li>
                                    <li><a target="_blank" href="https://app.termly.io/notify/88583b44-9385-430c-aa79-3c41dc8a167e" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors  duration-300 block">DSAR Form</a></li>
                                    <li><a target="_blank" href="https://app.termly.io/policy-viewer/policy.html?policyUUID=364c168c-44ab-467e-a98a-a22629fc31f8" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors  duration-300 block">Disclaimer</a></li>
                                    <li><a href="#" className="termly-display-preferences text-gray-400 hover:text-white transition-colors  duration-300 block">Consent</a></li>
                                </ul> 
                            </div>

                            <div className="">
                                <h3 className="font-gulfs text-[#F94F96] text-2xl md:text-3xl tracking-wide md:tracking-widest uppercase transform rotate-1 origin-left">Legal</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-1 gap-x-4 gap-y-2 pt-4">
                                    {[
                                        { name: "Privacy Policy", href: "https://app.termly.io/policy-viewer/policy.html?policyUUID=88583b44-9385-430c-aa79-3c41dc8a167e", external: true },
                                        { name: "Cookies Policy", href: "https://app.termly.io/policy-viewer/policy.html?policyUUID=f11eb44f-4ddd-4d59-86d1-34c11e3fa80e", external: true },
                                        { name: "Terms & Conditions", route: "terms-and-conditions" },
                                        { name: "Creator Agreement", route: "creator-agreement" },
                                        { name: "Supporter Terms", route: "supporter-terms" },
                                        { name: "Contract", route: "creator-supporter-contract" },
                                        { name: "MoR Agreement", route: "mor-agreement" },
                                        { name: "Payments", route: "reserves-and-payments-policy" },
                                        { name: "Paid Tasks", route: "paid-tasks-terms" },
                                        { name: "Return Policy", route: "return-policy" },
                                        { name: "US Addendum", route: "us-addendum" }
                                    ].map((item, index) => (
                                        <div key={index}>
                                            {item.external ? (
                                                <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-base font-poppins  duration-300 block">{item.name}</a>
                                            ) : (
                                                <Link href={route(item.route)} className="text-gray-400 hover:text-white transition-colors text-base font-poppins  duration-300 block">{item.name}</Link>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* <div className="">
                                <h3 className="font-gulfs text-[#EFEA7B] text-2xl md:text-3xl tracking-widest uppercase transform -rotate-1 origin-left">General</h3>
                                <ul className="space-y-5 font-poppins text-normal pt-4">
                                    <li><a target="_blank" href="https://blog.spennypiggy.co" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors  duration-300 block">Blog</a></li>
                                    <li><a target="_blank" href="https://app.termly.io/notify/88583b44-9385-430c-aa79-3c41dc8a167e" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors  duration-300 block">DSAR Form</a></li>
                                    <li><a target="_blank" href="https://app.termly.io/policy-viewer/policy.html?policyUUID=364c168c-44ab-467e-a98a-a22629fc31f8" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors  duration-300 block">Disclaimer</a></li>
                                    <li><a href="#" className="termly-display-preferences text-gray-400 hover:text-white transition-colors  duration-300 block">Consent</a></li>
                                </ul>
                            </div> */}
                        </div>
                    </div>

                    {/* Contact Bar - High Impact */}
                    <div className="py-8 md:py-16 ">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:text-center md:px-8">
                            <div className="space-y-1">
                                <p className="text-[#924DFF] font-gulfs text-lg uppercase trackind-[0.1em] md:tracking-[0.15em]">Call the Piggy</p>
                                <a href="tel:02033552057" className="text-normal sm:text-xl font-poppins font-black hover:text-[#924DFF] transition-all duration-300 hover:scale-105 inline-block">020 3355 2057</a>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#F94F96] font-gulfs text-lg uppercase trackind-[0.1em] md:tracking-[0.15em]">Drop an Email</p>
                                <a href="mailto:support@spennypiggy.co" className="text-normal sm:text-xl font-poppins font-black hover:text-[#F94F96] transition-all duration-300 hover:scale-105 inline-block">support@spennypiggy.co</a>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[#EFEA7B] font-gulfs text-lg uppercase trackind-[0.1em] md:tracking-[0.15em]">Our Office</p>
                                <p className="text-normal sm:text-xl font-poppins font-black hover:scale-105 transition-transform duration-300 cursor-default">55 Colmore Row, B3 2AA</p>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section */}
                    <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
                        <div className="max-w-3xl">
                            <p className="text-sm text-gray-500 font-poppins leading-relaxed">
                                All trademarks, logos and brand names are the property of their respective owners. All company, product and service names used in this website are for identification purposes only. Use of these names, trademarks and brands does not imply endorsement.
                            </p>
                        </div>
                        <div className="flex flex-col items-center lg:items-end gap-2">
                            <p className="text-xl font-gulfs text-white tracking-wider uppercase">Spenny Piggy</p>
                            <p className="text-sm text-gray-400 font-poppins">
                                Copyright © {date && date.getFullYear()} . All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            <FeatureSuggestionModal 
                show={showSuggestionModal} 
                onClose={() => setShowSuggestionModal(false)} 
                auth={auth}
            />
        </>
    );
}

