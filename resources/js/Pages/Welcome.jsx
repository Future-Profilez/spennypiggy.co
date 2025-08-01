import { Link, Head } from "@inertiajs/react";
import React from 'react';
import Hero from './home/Hero';
import Guest from '@/Layouts/GuestLayout';
import ComingNext from "./home/ComingNext";
import LiveBarSection from "./home/LiveBarSection";
import ForCreators from "./home/ForCreators";
const LiveBar = React.lazy(() => import('@/includes/LiveBar'));
const FunPart = React.lazy(() => import('./home/FunPart'));
const WhyLove = React.lazy(() => import('./home/WhyLove'));
const HappyCreators = React.lazy(() => import('./home/HappyCreators'));
const JoinUs = React.lazy(() => import('@/Components/JoinUs'));
import seek from "../../assets/img/seeksearch.png";
import fill from "../../assets/img/fillbank.png";
import fun1 from "../../assets/new/Fun1.png";
import fun2 from "../../assets/new/Fun2.png";
import fun3 from "../../assets/new/Fun3.png";
import commingsoon from "../../assets/img/commingsoon.png";
import lockprofile from "../../assets/img/lockprofile.png";
import Membership from "./home/Membership";
import NotForBusiness from "./home/NotForBusiness";
import FAQ from "./home/FAQ";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import SitelinksSearchBox from "@/global/SiteLink";
import PaymentSlider from "./home/PaymentSlider";
export default function Home({ auth, user }) {

    useEffect(()=>{
        AOS && AOS.init({
            offset:100, // offset (in px) from the original trigger point
            // delay: 1000, // values from 0 to 3000, with step 50ms
            duration: 400,
            once: false,
        });
    },[]);


    // https://ucarecdn.com/b8140316-a9b0-4833-af41-3bc5841a0ce6/-/preview/900x300/-/text_align/center/center/-/font/11/000000/-/text/80px90p/100p,100p/spennypiggy.co~sNAVEENFP/-/text_align/center/center/-/font/19/000000/-/text/100px100p/100p,100p/NAVEEN/-/overlay/50ee2983-6aa8-4f34-9ee4-f28b2930d82b/30px30p/20p,50p/


    // const image =`https://ucarecdn.com/d73ea5dd-5c7d-4291-ac5e-be3ddc9d9ad0/-/preview/900x300/`;

    // const text1 =`-/font/20/ffffff/-/text_align/left/center/-/text/54px10p/65p,42p/Naveen Tehrpariya/`;

    // const text2 =`-/font/13/ffffff/-/text_align/left/center/-/text/70px10p/100p,55p/spennypiggy.co~sjustjacksfdsfsdf/`;

    // const overlay =`-/overlay/50ee2983-6aa8-4f34-9ee4-f28b2930d82b/20px20p/10p,50p/`;


    const appEnv = import.meta.env.VITE_APP_ENV;
    console.log("Sentry enabled in ENV:", appEnv);

    return <>


        <div className="overflow-hidden" >
        <Guest auth={auth.user} user={auth.user}>
        <LiveBar reps={15} classes={'blackbg barouter'} text={"🤑 Keep 100% of what you earn! ⚡️Fast & Easy Payment’s through 🍎 Pay! "} />
        <Hero auth={auth} />
        <LiveBarSection />
        <PaymentSlider/>
        {/* <ForCreators /> */}

        {/* <FunPart classes={``}
        img={seek}
        imgbg={`bluebg`}
        textbg={`lightpink-50`}
        heading={`Seek & Search`}
        text={`Looking for your favorite creator or their wishlist? Seek & Search makes it easy. Whether you're eager to support your beloved content creators or find the perfect gift, our intuitive search feature lets you quickly locate creators or their wishlists with just a few clicks. Dive into the world of creativity and generosity today with Seek & Search!`}
        /> */}


        {/* <FunPart classes={`border-top-0`}
        img={fill} reverse={true}
        imgbg={`pinkbg`} eclasses={``}
        textbg={`lightyellow`}
        heading={`Receive Support with 100% payout`}
        text={`All Creators on Spenny Piggy receive 100%, and the profile piggy bank provides a fast and easy way for fans to directly support you!`}
        /> */}

        {/* <FunPart classes={``}
        img={commingsoon}
        imgbg={`mintbg`}
        textbg={`lightpink-50`}
        heading={`Your Profile Shop, the creative way to sell`}
        text={`Think ebooks, art commissions, 1-1 zoom calls and everything else in between. Anything that probably doesn’t have a place on shopify, Your profile shop is the place to start selling direct to your fans whilst enhancing your earnings potential.`}
        /> */}


        {/* <FunPart classes={`border-top-0`}
        img={lockprofile} reverse={true}
        imgbg={`yellowbg`} eclasses={``}
        textbg={`lightyellow`}
        heading={`Fraud Protection and Privacy Options`}
        text={`All the data on Spenny Piggy is hosted on Google Servers in the UK.
        All of your data on Spenny Piggy is secured by TLS (SSL) 256-bit encryption.
        All the creator & Fan information stays private and is not shared between parties. `}
        /> */}

        <FunPart classes={`border-top-0`}
        img={fun1} reverse={true}
        mainbg={`bg-[#EFEA7B]`} eclasses={``}
        textbg={`bg-[#EFEA7B]`}
        heading={`Effortlessly add your dream items, share your page, and get going in minutes!`}
        />

        <FunPart classes={`border-top-0`}
        img={fun2} reverse={false}
        mainbg={`bg-[#F94F96]`} eclasses={``}
        textbg={`bg-[#F94F96]`}
        heading={`Let your fans spoil you with gifts from any online store!`}
        />

        <FunPart classes={`border-top-0`}
        img={fun3} reverse={true}
        mainbg={`bg-[#EFEA7B]`} eclasses={``}
        textbg={`bg-[#EFEA7B]`}
        heading={`Build your profile shop! the creative way to sell anything that probably doesn’t have a place on shopify...`}
        />

        <Membership />

        <NotForBusiness />

        <WhyLove />

        <HappyCreators />
        <FAQ />

        <JoinUs />
        <LiveBar
                reps={15}
                classes={"py-3 bg-[#E6EA7B]"}
                textclassName={`!text-4xl font-gulfs mb-0 mx-4 text-uppercase`}
                color={`bg-[#E6EA7B]`}
                text={
                    <>
                      ❤️ Keep <span className="text-[#F94F96]">100%</span> of what you Earn!
                    </>
                  }
                />
        <SitelinksSearchBox />
        </Guest>
        </div>
    </>
}
