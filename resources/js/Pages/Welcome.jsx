import { Link, Head } from "@inertiajs/react";
import { useEffect } from "react";
import Hero from './home/Hero';
import Guest from '@/Layouts/GuestLayout';
import ComingNext from "./home/ComingNext";
import LiveBarSection from "./home/LiveBarSection";
import ForCreators from "./home/ForCreators";
import LiveBar from '@/includes/LiveBar';
import FunPart from './home/FunPart';
import WhyLove from './home/WhyLove';
import HappyCreators from './home/HappyCreators';
import FeatureSuggestionSection from './home/FeatureSuggestionSection';
import JoinUs from '@/Components/JoinUs';
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
import SitelinksSearchBox from "@/global/SiteLink";
import PaymentSlider from "./home/PaymentSlider";
import FounderProgramAnnouncement from "./home/FounderProgramAnnouncement";
import PaidTasksAnnouncement from "./home/PaidTasksAnnouncement";
import TrendingCreators from './home/TrendingCreators';
import NewVerified from './home/NewVerified';
import TopEarners from './home/TopEarners';
export default function Home({ auth, user, founderBonus, trendingCreators, newVerifiedCreators, topEarners, topEarnersLabel }) {

    useEffect(()=>{},[]);


    // https://ucarecdn.com/b8140316-a9b0-4833-af41-3bc5841a0ce6/-/preview/900x300/-/text_align/center/center/-/font/11/000000/-/text/80px90p/100p,100p/spennypiggy.co~sNAVEENFP/-/text_align/center/center/-/font/19/000000/-/text/100px100p/100p,100p/NAVEEN/-/overlay/50ee2983-6aa8-4f34-9ee4-f28b2930d82b/30px30p/20p,50p/


    // const image =`https://ucarecdn.com/d73ea5dd-5c7d-4291-ac5e-be3ddc9d9ad0/-/preview/900x300/`;

    // const text1 =`-/font/20/ffffff/-/text_align/left/center/-/text/54px10p/65p,42p/Naveen Tehrpariya/`;

    // const text2 =`-/font/13/ffffff/-/text_align/left/center/-/text/70px10p/100p,55p/spennypiggy.co~sjustjacksfdsfsdf/`;

    // const overlay =`-/overlay/50ee2983-6aa8-4f34-9ee4-f28b2930d82b/20px20p/10p,50p/`;


    const appEnv = import.meta.env.VITE_APP_ENV;

    return <>
        <Head title="Spenny Piggy — Exclusive Content, Memberships & More!">
            <link rel="canonical" href="/" />
            <meta name="description" content="Keep 100% of what you earn. Real gifting, paid tasks, bills and memberships with fast payouts and Stripe-aligned safety." />
            <meta property="og:title" content="Spenny Piggy — Exclusive Content, Memberships & More!" />
            <meta property="og:description" content="Keep 100% of what you earn. Real gifting, paid tasks, bills and memberships with fast payouts and Stripe-aligned safety." />
            <meta property="og:image" content="/siteicon.png" />
            <meta property="og:url" content="https://spennypiggy.co/" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Spenny Piggy — Exclusive Content, Memberships & More!" />
            <meta name="twitter:description" content="Keep 100% of what you earn. Real gifting, paid tasks, bills and memberships with fast payouts and Stripe-aligned safety." />
            <meta name="twitter:image" content="/siteicon.png" />
        </Head>

        <Guest auth={auth.user} user={auth.user}>
        <LiveBar reps={15} classes={'blackbg barouter'} text={"🤑 Keep 100% of what you earn! ⚡️Fast & Easy Payment's through 🍎 Pay! "} />
        <Hero auth={auth} />
        <PaidTasksAnnouncement />
        <FounderProgramAnnouncement founderBonus={founderBonus} />
        <LiveBarSection />

        {trendingCreators && trendingCreators.length > 0 ? <TrendingCreators creators={trendingCreators} /> : ''}
        
        {newVerifiedCreators && newVerifiedCreators.length > 0 ? <NewVerified creators={newVerifiedCreators} /> : ''}
        
        {topEarners && topEarners.length > 0 ? <TopEarners creators={topEarners} periodLabel={topEarnersLabel} /> : ''}

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

        <FunPart 
            classes={`border-top-0`}
            img={fun1} reverse={true}
            mainbg={`bg-[#EFEA7B]`} eclasses={``}
            textbg={`bg-[#EFEA7B]`} textcolor='text-black'
            heading={`Effortlessly add your dream items, share your page, and get going in minutes!`}
        />

        <FunPart 
            classes={`border-top-0`}
            img={fun2} reverse={false}
            mainbg={`bg-[#F94F96]`} eclasses={``}
            textbg={`bg-[#F94F96]`}
            heading={`Let your fans spoil you with gifts from any online store!`}
        />
        <FunPart 
            classes={`border-top-0`}
            img={fun3} reverse={true}
            mainbg={`bg-[#EFEA7B]`} eclasses={``}
            textbg={`bg-[#EFEA7B]`} textcolor='text-black'
            heading={`Build your profile shop! the creative way to sell anything that probably doesn’t have a place on shopify...`}
        />

        <Membership />

        <NotForBusiness />

        <WhyLove />

        <HappyCreators />
        <FeatureSuggestionSection auth={auth} />
        <FAQ />

        <JoinUs />
        <LiveBar
                reps={15}
                classes={"py-3 bg-[#E6EA7B]"}
                textclassName={`!text-4xl font-gulfs mb-0 mx-4 uppercase`}
                color={`bg-[#E6EA7B]`}
                text={
                    <>
                      ❤️ Keep <span className="text-[#F94F96]">100%</span> of what you Earn!
                    </>
                  }
                />
        <SitelinksSearchBox />
        </Guest>
    </>
}
