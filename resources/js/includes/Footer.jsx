import { Head, Link } from "@inertiajs/react";
import { useEffect } from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import spennypiggy from "../../assets/img/logo.png";

export default function Footer(props) {
    const { auth } = props;
   
    async function configIntercom() {
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
                    <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
                        <div>
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4"> LEGAL </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=88583b44-9385-430c-aa79-3c41dc8a167e" target="blank" > Privacy policy </a> </li>
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=f11eb44f-4ddd-4d59-86d1-34c11e3fa80e" target="blank" > Cookies Policy </a> </li>
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=a1f91da2-10e4-49e8-88b6-fc716b2645ba" target="blank" > Return Policy </a> </li>
                                <li> <a href="https://ucarecdn.com/6b25399f-e259-4c19-bbdf-70308c5814ef/SPTERMSFINALVMAY2025.pdf" target="blank" > Terms & Conditions </a> </li>
                                <li> <a href="https://app.termly.io/policy-viewer/policy.html?policyUUID=9a437e57-fcc7-439f-a7e7-96b493a8c50f" target="blank" > Acceptable Use Policy </a> </li>
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
                            <h3 className="font-gulfs text-light text-lg md:text-3xl md:mb-4">
                                CONTACT
                            </h3>
                            <ul className="space-y-2 font-poppins cursor-pointer">
                                <li> <a href="tel:02033552057"> 020 3355 2057</a> </li>
                                <li>
                                <a href="mailto:support@spennypiggy.co">
                                support@spennypiggy.co
                                </a></li>
                                <li>55 Colmore Row, B3 2AA</li>
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
                        <p className="text-sm font-poppins">
                            Copyright © {date && date.getFullYear()} Spenny Piggy
                        </p>
                    </div>

                    <p className="border-t border-white text-center text-xs mt-4 pt-4 px-4 md:px-20 text-white/80 font-poppins">
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