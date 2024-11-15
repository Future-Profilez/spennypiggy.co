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
import commingsoon from "../../assets/img/commingsoon.png";
import lockprofile from "../../assets/img/lockprofile.png";
import Membership from "./home/Membership";
import NotForBusiness from "./home/NotForBusiness";
import FAQ from "./home/FAQ";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import SitelinksSearchBox from "@/global/SiteLink";
export default function Home({ auth, user }) {

    useEffect(()=>{
        AOS && AOS.init({
            offset:100, // offset (in px) from the original trigger point
            // delay: 1000, // values from 0 to 3000, with step 50ms
            duration: 400, 
            once: false,
        });
    },[]);


    return <>
        <div className="overflow-hidden" >
        <LiveBar reps={15} classes={'pb-2 pb-md-0 blackbg barouter'} text={"🚨 KEEP 100% OF EVERYTHING YOU EARN 🚨"} />
        <Guest auth={auth.user} user={auth.user}>
        <Hero auth={auth} />
        <LiveBarSection />
        <ForCreators />

        <FunPart classes={``} 
        img={seek} 
        imgbg={`bluebg`} 
        textbg={`lightpink-50`}
        heading={`Seek & Search`}
        text={`Looking for your favorite creator or their wishlist? Seek & Search makes it easy. Whether you're eager to support your beloved content creators or find the perfect gift, our intuitive search feature lets you quickly locate creators or their wishlists with just a few clicks. Dive into the world of creativity and generosity today with Seek & Search!`}
        />


        <FunPart classes={`border-top-0`} 
        img={fill} reverse={true}
        imgbg={`pinkbg`} eclasses={``}
        textbg={`lightyellow`} 
        heading={`Receive Support with 100% payout`}
        text={`All Creators on Spenny Piggy receive 100%, and the profile piggy bank provides a fast and easy way for fans to directly support you!`}
        />


        <Membership />



        <FunPart classes={``} 
        img={commingsoon} 
        imgbg={`mintbg`} 
        textbg={`lightpink-50`}
        heading={`Your Profile Shop, the creative way to sell`}
        text={`Think ebooks, art commissions, 1-1 zoom calls and everything else in between. Anything that probably doesn’t have a place on shopify, Your profile shop is the place to start selling direct to your fans whilst enhancing your earnings potential.`}
        />


        <FunPart classes={`border-top-0`} 
        img={lockprofile} reverse={true}
        imgbg={`yellowbg`} eclasses={``}
        textbg={`lightyellow`} 
        heading={`Fraud Protection and Privacy Options`}
        text={`All the data on Spenny Piggy is hosted on Google Servers in the UK.
        All of your data on Spenny Piggy is secured by TLS (SSL) 256-bit encryption.
        All the creator & Fan information stays private and is not shared between parties. `}
        />

        <NotForBusiness />

        <WhyLove />

        <HappyCreators />
        <FAQ />

        <JoinUs />
        <SitelinksSearchBox />
        </Guest>
        </div>
    </>
}
