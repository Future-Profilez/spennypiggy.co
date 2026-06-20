import { Link, Head } from "@inertiajs/react";
import { lazy, Suspense } from "react";
import Hero from './home/Hero';
import Guest from '@/Layouts/GuestLayout';
import LiveBar from '@/includes/LiveBar';
import StackedCard from '@/Components/animations/StackedCard';
import ScrollProgressBar from '@/Components/animations/ScrollProgressBar';
import FadeIn from '@/Components/animations/FadeIn';
import WishlistPreview from './home/WishlistPreview';

const FUN_CARDS = [
    {
        variant: 'wishlist',
        reverse: true,
        bg: 'bg-[#EFEA7B]',
        textcolor: 'text-black',
        heading: 'Effortlessly add your dream items, share your page, and get going in minutes!',
    },
    {
        variant: 'gifts',
        reverse: false,
        bg: 'bg-[#FF007F]',
        textcolor: '',
        heading: 'Let your fans spoil you with gifts from any online store!',
    },
    {
        variant: 'shop',
        reverse: true,
        bg: 'bg-[#EFEA7B]',
        textcolor: 'text-black',
        heading: "Build your profile shop! the creative way to sell anything that probably doesn't have a place on shopify...",
    },
];

// Lazy load components that are "below the fold"
const ComingNext = lazy(() => import("./home/ComingNext"));
const LiveBarSection = lazy(() => import("./home/LiveBarSection"));
const ForCreators = lazy(() => import("./home/ForCreators"));
const FunPart = lazy(() => import('./home/FunPart'));
const WhyLove = lazy(() => import('./home/WhyLove'));
const HappyCreators = lazy(() => import('./home/HappyCreators'));
const FeatureSuggestionSection = lazy(() => import('./home/FeatureSuggestionSection'));
const JoinUs = lazy(() => import('@/Components/JoinUs'));
const Membership = lazy(() => import("./home/Membership"));
const NotForBusiness = lazy(() => import("./home/NotForBusiness"));
const FAQ = lazy(() => import("./home/FAQ"));
const SitelinksSearchBox = lazy(() => import("@/global/SiteLink"));
const PaymentSlider = lazy(() => import("./home/PaymentSlider"));
const EarnMoreAnnouncement = lazy(() => import("./home/EarnMoreAnnouncement"));
const FounderProgramAnnouncement = lazy(() => import("./home/FounderProgramAnnouncement"));
const PaidTasksAnnouncement = lazy(() => import("./home/PaidTasksAnnouncement"));
const TrendingCreators = lazy(() => import('./home/TrendingCreators'));
const NewVerified = lazy(() => import('./home/NewVerified'));
const TopEarners = lazy(() => import('./home/TopEarners'));
const ReferEarnAnnouncement = lazy(() => import('./home/ReferEarnAnnouncement'));
export default function Home({ auth, user, founderBonus, trendingCreators, newVerifiedCreators, topEarners, topEarnersLabel }) {

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
            <ScrollProgressBar />
            <LiveBar reps={15} classes={'blackbg barouter'}
                livebartest={[
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!",
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!",
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!",
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!",
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!",
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!",
                    "🤑 Keep 100% of what you earn!",
                    "⚡️Fast & Easy Payment's through 🍎 Pay!"
                ]}
             />
            <Hero auth={auth} />
            
            <Suspense fallback={<div className="h-20" />}>
                <EarnMoreAnnouncement founderBonus={founderBonus} />
                <PaidTasksAnnouncement />
                <ReferEarnAnnouncement />
                <FounderProgramAnnouncement founderBonus={founderBonus} />
                <LiveBarSection />

                {/* Social-proof sections glide up as they enter the viewport. */}
                {trendingCreators && trendingCreators.length > 0 ? <FadeIn y={60} duration={0.7}><TrendingCreators creators={trendingCreators} /></FadeIn> : ''}
                {newVerifiedCreators && newVerifiedCreators.length > 0 ? <FadeIn y={60} duration={0.7}><NewVerified creators={newVerifiedCreators} /></FadeIn> : ''}
                {topEarners && topEarners.length > 0 ? <FadeIn y={60} duration={0.7}><TopEarners creators={topEarners} periodLabel={topEarnersLabel} /></FadeIn> : ''}

                <PaymentSlider/>
                <div className="md:pb-[12vh]">
                    {FUN_CARDS.map((card, i) => (
                        <StackedCard
                            key={i}
                            index={i}
                            totalCards={FUN_CARDS.length}
                            topOffset="12vh"
                            className="mb-6 md:mb-0"
                        >
                            <FunPart
                                classes={`border-top-0 md:rounded-[40px] overflow-hidden md:mx-8 md:border-4 md:border-black md:shadow-[0_-20px_60px_rgba(0,0,0,0.7)]`}
                                reverse={card.reverse}
                                mainbg={card.bg} eclasses={``}
                                textbg={card.bg} textcolor={card.textcolor || undefined}
                                heading={card.heading}
                                mockup={<WishlistPreview variant={card.variant} />}
                            />
                        </StackedCard>
                    ))}
                </div>
                {/* Statement sections rise slow and heavy; testimonials settle softly. */}
                <FadeIn y={48} duration={0.9}><Membership /></FadeIn>
                <NotForBusiness />
                <FadeIn y={48} duration={0.9}><WhyLove /></FadeIn>
                <FadeIn y={24} duration={0.7}><HappyCreators /></FadeIn>
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
                          ❤️ Keep <span className="text-[#FF007F]">100%</span> of what you Earn!
                        </>
                    }
                />
                <SitelinksSearchBox />
            </Suspense>
        </Guest>
    </>
}
