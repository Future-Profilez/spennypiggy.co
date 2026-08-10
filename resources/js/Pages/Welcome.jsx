import { Link, Head, router } from "@inertiajs/react";
import { lazy, Suspense, useEffect } from "react";
import Hero from './home/Hero';
import Guest from '@/Layouts/GuestLayout';
import LiveBar from '@/includes/LiveBar';
import StackedCard from '@/Components/animations/StackedCard';
import ScrollProgressBar from '@/Components/animations/ScrollProgressBar';
import WishlistPreview from './home/WishlistPreview';
import { ChapterNav, ActIntro, Reveal, Parallax } from '@/Components/cinematic/Cinematic';
import PageCanvas from '@/Components/cinematic/PageCanvas';

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
        heading: 'Let your fans unlock and buy the things on your list, from any store.',
        story: [
            { title: 'Pick anything', text: 'Add items from any store to your page — no catalogue, no limits.' },
            { title: 'Fans unlock it', text: 'They buy the things you actually want, straight from your list.' },
            { title: 'You get paid', text: 'Secure, trackable income with protection built in.' },
        ],
    },
    {
        variant: 'shop',
        reverse: true,
        bg: 'bg-[#EFEA7B]',
        textcolor: 'text-black',
        heading: "Build your profile shop — the creative way to sell anything that doesn't fit a regular store.",
        story: [
            { title: 'Open your shop', text: 'Digital or physical, services or one-offs — your rules.' },
            { title: 'Price it your way', text: 'From a fiver to a feature drop, you set the number.' },
            { title: 'Deliver and earn', text: 'Every sale tracks a deliverable, so payouts stay clean.' },
        ],
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
const NotForBusiness = lazy(() => import("./home/NotForBusiness"));
const FAQ = lazy(() => import("./home/FAQ"));
const SitelinksSearchBox = lazy(() => import("@/global/SiteLink"));
const PaymentSlider = lazy(() => import("./home/PaymentSlider"));
const CustomPricingNote = lazy(() => import("./home/CustomPricingNote"));
const EarnMoreAnnouncement = lazy(() => import("./home/EarnMoreAnnouncement"));
const FounderProgramAnnouncement = lazy(() => import("./home/FounderProgramAnnouncement"));
const PaidTasksAnnouncement = lazy(() => import("./home/PaidTasksAnnouncement"));
const PayByBankAnnouncement = lazy(() => import("./home/PayByBankAnnouncement"));
const ReferEarnAnnouncement = lazy(() => import('./home/ReferEarnAnnouncement'));
const CreatorShowcase = lazy(() => import('./home/CreatorShowcase'));
const SetupSteps = lazy(() => import('./home/SetupSteps'));
const FeatureShowcase = lazy(() => import('./home/FeatureShowcase'));

// Scroll-telling chapters for the fixed right-edge ChapterNav rail.
const CHAPTERS = [
    { id: 'act-proof', label: 'Proof' },
    { id: 'act-earn', label: 'Earn' },
    { id: 'act-setup', label: 'Set up' },
    { id: 'act-build', label: 'Build' },
    { id: 'act-love', label: 'Love' },
    { id: 'act-join', label: 'Join' },
];

export default function Home({ auth, user, founderBonus, trendingCreators, newVerifiedCreators, topEarners, topEarnersLabel }) {

    useEffect(() => {
        // PWA Mode: If logged in, redirect directly to profile page
        const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                      window.navigator.standalone || 
                      document.referrer.includes('android-app://');
        
        const username = auth?.user?.username;
        if (isPWA && username && (window.location.pathname === '/' || window.location.pathname === '')) {
            router.visit(`/${username}`, { replace: true });
        }
    }, [auth]);

    // https://ucarecdn.com/b8140316-a9b0-4833-af41-3bc5841a0ce6/-/preview/900x300/-/text_align/center/center/-/font/11/000000/-/text/80px90p/100p,100p/spennypiggy.co~sNAVEENFP/-/text_align/center/center/-/font/19/000000/-/text/100px100p/100p,100p/NAVEEN/-/overlay/50ee2983-6aa8-4f34-9ee4-f28b2930d82b/30px30p/20p,50p/


    // const image =`https://ucarecdn.com/d73ea5dd-5c7d-4291-ac5e-be3ddc9d9ad0/-/preview/900x300/`;

    // const text1 =`-/font/20/ffffff/-/text_align/left/center/-/text/54px10p/65p,42p/Naveen Tehrpariya/`;

    // const text2 =`-/font/13/ffffff/-/text_align/left/center/-/text/70px10p/100p,55p/spennypiggy.co~sjustjacksfdsfsdf/`;

    // const overlay =`-/overlay/50ee2983-6aa8-4f34-9ee4-f28b2930d82b/20px20p/10p,50p/`;


    const appEnv = import.meta.env.VITE_APP_ENV;

    return <>
        <Head title="Spenny Piggy — Exclusive Content, Memberships & More!">
            <link rel="canonical" href="/" />
            <meta name="description" content="Keep 100% of what you earn. Sell content, memberships, paid tasks and your wishlist with fast payouts and Stripe-aligned safety." />
            <meta property="og:title" content="Spenny Piggy — Exclusive Content, Memberships & More!" />
            <meta property="og:description" content="Keep 100% of what you earn. Sell content, memberships, paid tasks and your wishlist with fast payouts and Stripe-aligned safety." />
            <meta property="og:image" content="/siteicon.png" />
            <meta property="og:url" content="https://spennypiggy.co/" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Spenny Piggy — Exclusive Content, Memberships & More!" />
            <meta name="twitter:description" content="Keep 100% of what you earn. Sell content, memberships, paid tasks and your wishlist with fast payouts and Stripe-aligned safety." />
            <meta name="twitter:image" content="/siteicon.png" />
        </Head>

        <Guest auth={auth.user} user={auth.user}>
            {/* One background for the whole page. Everything below it is transparent —
                see PageCanvas: a section with its own background colour cuts the field
                and reintroduces the seams this replaced. */}
            <div className="relative">
            <PageCanvas />
            <div className="relative z-10">
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

            {/* Aimed at a handful of creators, so it sits under the hero rather
                than inside it — visible early without displacing the pitch that
                every other visitor came for. */}
            <Suspense fallback={null}>
                <CustomPricingNote />
            </Suspense>

            <ChapterNav chapters={CHAPTERS} />

            <Suspense fallback={<div className="h-20" />}>
                {/* ── Chapter 03 · The proof ── */}
                <CreatorShowcase
                    trending={trendingCreators}
                    newVerified={newVerifiedCreators}
                    topEarners={topEarners}
                    topEarnersLabel={topEarnersLabel}
                />

                {/* ── Chapter 01 · Earn more — announcements enter as cinematic curtain reveals ── */}
                <div id="act-earn">
                    <EarnMoreAnnouncement founderBonus={founderBonus} />
                    <PayByBankAnnouncement />
                    <PaidTasksAnnouncement />
                    <ReferEarnAnnouncement />
                    {/* <FounderProgramAnnouncement founderBonus={founderBonus} /> */}
                </div>

                <LiveBarSection />
                <PaymentSlider />

                {/* ── Chapter 02 · Set up in minutes — sticky-stack story cards ── */}
                <div id="act-setup">
                    <SetupSteps />
                    <FeatureShowcase />
                </div>

                {/* ── Chapter 04 · Build your world ── */}
                <div id="act-build">
                    <Parallax amount={50}><NotForBusiness /></Parallax>
                </div>

                {/* ── Chapter 05 · Why creators love it ── */}
                <div id="act-love">
                    <Reveal><WhyLove /></Reveal>
                    <Reveal delay={0.05}><HappyCreators /></Reveal>
                </div>

                {/* ── Finale · Your turn ── */}
                <div id="act-join">
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
                </div>
                <SitelinksSearchBox />
            </Suspense>
            </div>
            </div>
        </Guest>
    </>
}
