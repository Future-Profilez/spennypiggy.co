import { Link, Head, router } from "@inertiajs/react";
import { lazy, Suspense, useEffect } from "react";
import Hero from './home/Hero';
import Guest from '@/Layouts/GuestLayout';
import LiveBar from '@/includes/LiveBar';
import ScrollProgressBar from '@/Components/animations/ScrollProgressBar';
import { ChapterNav, Reveal } from '@/Components/cinematic/Cinematic';
import PageCanvas from '@/Components/cinematic/PageCanvas';

// ⚠️ `FUN_CARDS` was removed here (10 Aug 2026). It was dead — declared, never
// rendered — but carried the store-item copy the page is being cleared of
// ("Let your fans unlock and buy the things on your list, from any store"),
// which is both an unbuilt feature and wording `App\Rules\NoExpenseOrBrandName`
// rejects on a real listing. Dead copy is the copy that gets pasted back in.

// Lazy load components that are "below the fold"
//
// ⚠️ `ComingNext`, `ForCreators`, `FunPart` and `FounderProgramAnnouncement` were
// lazy-imported here and rendered NOWHERE (the last was commented out below).
// They are removed rather than left declared: `ComingNext` still carries "Gifts
// shipped directly to your door!" and "Receive physical Gifts from Fans" — the
// unbuilt store wishlist plus banned gifting vocabulary, one uncommented line
// away from shipping. That is exactly the hazard this file's own header warns
// about: dead copy is the copy that gets pasted back in.
const LiveBarSection = lazy(() => import("./home/LiveBarSection"));
const HappyCreators = lazy(() => import('./home/HappyCreators'));
const FeatureSuggestionSection = lazy(() => import('./home/FeatureSuggestionSection'));
const JoinUs = lazy(() => import('@/Components/JoinUs'));
const FAQ = lazy(() => import("./home/FAQ"));
const SitelinksSearchBox = lazy(() => import("@/global/SiteLink"));
const PaymentSlider = lazy(() => import("./home/PaymentSlider"));
const CustomPricingNote = lazy(() => import("./home/CustomPricingNote"));
const EarnMoreAnnouncement = lazy(() => import("./home/EarnMoreAnnouncement"));
const PaidTasksAnnouncement = lazy(() => import("./home/PaidTasksAnnouncement"));
const PayByBankAnnouncement = lazy(() => import("./home/PayByBankAnnouncement"));
const CreatorShowcase = lazy(() => import('./home/CreatorShowcase'));
const SetupSteps = lazy(() => import('./home/SetupSteps'));
const FeatureShowcase = lazy(() => import('./home/FeatureShowcase'));
const WaysToGetPaid = lazy(() => import('./home/WaysToGetPaid'));
const PricingSection = lazy(() => import('./home/PricingSection'));
const StablecoinTipsAnnouncement = lazy(() => import('./home/StablecoinTipsAnnouncement'));

// Scroll-telling chapters for the fixed right-edge ChapterNav rail.
//
// ⚠️ Every id here must exist in the markup below. `act-build` was removed with
// the section it wrapped ("How it works", the SECOND one — see `NotForBusiness`
// in git history); leaving its entry would have left the rail with a stop that
// scrolls nowhere, and `route:list`-style checks do not exist for anchors.
const CHAPTERS = [
    { id: 'act-proof', label: 'Proof' },
    { id: 'act-earn', label: 'Earn' },
    { id: 'act-setup', label: 'Set up' },
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
            {/* 🚨 OUTSIDE the `relative z-10` wrapper, deliberately. That wrapper
                is a stacking context with z-index 10, so anything inside it — however
                high its own z-index — competes with the fixed header (z-100) as
                z-10 and loses. The bar carried z-110 and was still painted behind
                the header at every scroll position, which is why it was never
                visible. A z-index only ranks against siblings in its own context. */}
            <ScrollProgressBar />

            <div className="relative">
            <PageCanvas />
            <div className="relative z-10">
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

            {/* 🚨 ONE <Suspense> USED TO WRAP ALL EIGHTEEN SECTIONS BELOW, behind a
                single `h-20` fallback. That did two bad things at once:

                1. React suspends a boundary until EVERY lazy child inside it has
                   resolved — so eighteen separate chunks became one waterfall
                   barrier and the code-splitting bought nothing.
                2. An 80px placeholder was then replaced by ~15,000px of page, which
                   made it the dominant layout-shift source on the site.

                One boundary per chapter, each with a fallback roughly the height of
                what it replaces. Chapters now stream in independently and each
                placeholder is close enough to its content that CLS stays small.
                Every fallback is `aria-hidden` — a screen reader should hear the
                section, not the spacer standing in for it. */}

            {/* ── Chapter 03 · The proof ── */}
            <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                <CreatorShowcase
                    trending={trendingCreators}
                    newVerified={newVerifiedCreators}
                    topEarners={topEarners}
                    topEarnersLabel={topEarnersLabel}
                />
            </Suspense>

            {/* ── Chapter 01 · Earn more — announcements enter as cinematic curtain reveals ──
                Order is the client's, 10 Aug 2026: the three bonus schemes read
                together (bonuses, then the referral bonus), pricing answers the
                question they raise, and the two payment rails sit side by side. */}
            <div id="act-earn">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[80dvh]" />}>
                    <PaidTasksAnnouncement />
                    <EarnMoreAnnouncement founderBonus={founderBonus} />
                </Suspense>
                {/* 🚨 `ReferEarnAnnouncement` WAS HERE AND IS DELIBERATELY GONE.
                    It was ~850px making an argument `EarnMoreAnnouncement` had
                    just made one section earlier: that component's THIRD CARD
                    *is* the creator referral bonus — same £50, same £1,000
                    threshold, same "unlimited referrals" — so the page said it
                    twice in a row, in two near-identical 3-up card grids a
                    visitor could not tell apart while scrolling.

                    Its CTA was also a conversion leak: "Get Your Referral Link"
                    sends a logged-OUT visitor (this page's whole audience) into
                    an account-gated dashboard for a programme that pays only
                    once a referred creator reaches £1,000 in sales.

                    The component file is kept — /refer-and-earn is a real page
                    and can still use it. Do not re-add it to the homepage
                    without first removing the card from EarnMore. */}
                <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                    <PricingSection />
                </Suspense>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[80dvh]" />}>
                    <PayByBankAnnouncement />
                    <StablecoinTipsAnnouncement />
                </Suspense>
            </div>

            <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                <LiveBarSection />
                <PaymentSlider />
            </Suspense>

            {/* ── Chapter 02 · Set up in minutes — sticky-stack story cards ──
                The ways-to-earn rail sits between the three setup steps and the
                feature showcase: it is the answer to "paid for what, exactly?",
                which the steps raise and the showcase then demonstrates. */}
            <div id="act-setup">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                    <SetupSteps />
                    <WaysToGetPaid />
                </Suspense>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[80dvh]" />}>
                    <FeatureShowcase />
                </Suspense>
            </div>

            {/* ── Chapter 05 · Why creators love it ── */}
            <div id="act-love">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                    <Reveal delay={0.05}><HappyCreators /></Reveal>
                </Suspense>
            </div>

            {/* ── Finale · Your turn ──
                ⚠️ `FeatureSuggestionSection` used to open this chapter, two
                sections before the close. It asks a stranger who has not signed
                up to do product management for us, and it is one of four CTAs on
                the page that lead AWAY from registering — placed at the exact
                point the page should be asking for the one thing it wants. It
                now sits below the closing marquee, where someone who has already
                read everything can still find it. */}
            <div id="act-join">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                    <FAQ />
                </Suspense>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[50dvh]" />}>
                    <JoinUs />
                </Suspense>
                {/* ⚠️ The prop is `textClass`. This passed `textclassName`, which
                    `LiveBar` never reads — so this marquee's `!text-4xl font-gulfs`
                    has never applied and it has always rendered in the component's
                    default `font-GillSans`. React does not warn on an unknown prop
                    to a function component, which is why it survived. */}
                <LiveBar
                    reps={15}
                    classes={"py-3 bg-[#E6EA7B]"}
                    textClass={`!text-4xl font-gulfs mb-0 mx-4 uppercase`}
                    color={`bg-[#E6EA7B]`}
                    text={
                        <>
                          ❤️ Keep <span className="text-[#FF007F]">100%</span> of what you Earn!
                        </>
                    }
                />
            </div>

            {/* Moved out of the finale — see the note on `act-join` above. */}
            <Suspense fallback={<div aria-hidden="true" className="min-h-[40dvh]" />}>
                <FeatureSuggestionSection auth={auth} />
            </Suspense>

            <Suspense fallback={null}>
                <SitelinksSearchBox />
            </Suspense>
            </div>
            </div>
        </Guest>
    </>
}
