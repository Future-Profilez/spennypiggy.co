import { Link, Head, router } from "@inertiajs/react";
import { lazy, Suspense, useEffect } from "react";
import Hero from './home/Hero';
// 🚨 EAGER, unlike every other section on this page. It sits directly beneath
// the hero — the second thing a visitor sees — so a lazy chunk would flash its
// Suspense placeholder inside the LCP window on the most valuable slot on the
// site. Client brief: Developer Master Plan, 19 Aug 2026, A1.
import DiscoverySection from './home/DiscoverySection';
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
/* `FeatureShowcase` is NOT imported here any more — see the chapter note below.
   The file stays in the repo; it is simply not part of this page. */
const WaysToGetPaid = lazy(() => import('./home/WaysToGetPaid'));
const AppShowcase = lazy(() => import('./home/AppShowcase'));
const PricingSection = lazy(() => import('./home/PricingSection'));

// Scroll-telling chapters for the fixed right-edge ChapterNav rail.
//
// ⚠️ Every id here must exist in the markup below. `act-build` was removed with
// the section it wrapped ("How it works", the SECOND one — see `NotForBusiness`
// in git history); leaving its entry would have left the rail with a stop that
// scrolls nowhere, and `route:list`-style checks do not exist for anchors.
const CHAPTERS = [
    { id: 'act-discover', label: 'Discover' },
    { id: 'act-sell', label: 'What you sell' },
    { id: 'act-setup', label: 'Set up' },
    { id: 'act-paid', label: 'Getting paid' },
    { id: 'act-earn', label: 'Earn more' },
    { id: 'act-app', label: 'The app' },
    { id: 'act-join', label: 'Join' },
];

export default function Home({ auth, user, founderBonus, trendingCreators, newVerifiedCreators, topEarners, topEarnersLabel, discovery, collections = [] }) {

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
            <meta property="og:image" content="https://spennypiggy.co/og-image.png" />
            <meta property="og:url" content="https://spennypiggy.co/" />
            <meta property="og:type" content="website" />
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content="Spenny Piggy — Exclusive Content, Memberships & More!" />
            <meta name="twitter:description" content="Keep 100% of what you earn. Sell content, memberships, paid tasks and your wishlist with fast payouts and Stripe-aligned safety." />
            <meta name="twitter:image" content="https://spennypiggy.co/og-image.png" />
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


            {/* 🚨 THE PAGE IS SEVEN CHAPTERS, AND THE ORDER IS THE ARGUMENT
                (22 Aug 2026, client direction). It ran to fifteen sections that
                named the products four separate times and put the bonus
                percentages before a visitor had been told what the platform IS.
                The rebuild answers the questions in the order a stranger asks
                them: who is here → what can I sell → how do I start → how does
                the money reach me → what else can I earn → how do I hear about it
                → sign me up.

                What merged, and why — do not re-split these without re-reading it:
                · `FeatureShowcase` IS GONE from this page. Its own docblock said it
                  restated `WaysToGetPaid` and that its only unique asset was three
                  mock-ups. The catalogue keeps the range; `LiveBarSection` keeps the
                  one picture of a creator page. The file is untouched and unrouted.
                · `CreatorShowcase` renders `compact` under the Discovery headline —
                  two browse surfaces with two headlines, back to back, was the page
                  asking the same question twice before it had made any argument.
                · `CustomPricingNote` moved OFF the top of the page and under
                  `PricingSection`, where it is the footnote it always was. It sold
                  bespoke rates to high earners before the standard price had been
                  named.
                · `PaymentSlider` (the card marks) now sits with `PayByBank`, the
                  section about how money arrives, instead of drifting mid-page.
                · `PaidTasksAnnouncement` sits inside the earn-more chapter. It is one
                  module with a full section while seven others get a tile; grouped
                  with the bonuses it at least reads as one argument. */}

            <ChapterNav chapters={CHAPTERS} />

            {/* 🚨 ONE <Suspense> USED TO WRAP EVERY SECTION BELOW, behind a single
                `h-20` fallback. React suspends a boundary until EVERY lazy child
                inside it resolves, so eighteen chunks became one waterfall and the
                code-splitting bought nothing — and an 80px placeholder was then
                replaced by ~15,000px of page, which made it the dominant layout-shift
                source on the site. One boundary per chapter, each with a fallback
                roughly the height of what it replaces, every one `aria-hidden`. */}

            {/* ── 01 · Discover — who is already here ──
                Client brief pins this "directly beneath the hero — the second thing a
                visitor sees". `DiscoverySection` carries `id="act-discover"` itself;
                `CreatorShowcase` keeps its own `act-proof` id for old deep links. */}
            <DiscoverySection discovery={discovery} />
            <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                <CreatorShowcase
                    compact
                    trending={trendingCreators}
                    newVerified={newVerifiedCreators}
                    topEarners={topEarners}
                    topEarnersLabel={topEarnersLabel}
                    collections={collections}
                />
            </Suspense>

            {/* ── 02 · What you sell — the explainer, then the whole range ──
                `LiveBarSection` answers "what IS this" and owns the page's one
                picture of a creator page; `WaysToGetPaid` is the catalogue, grouped
                by when the money arrives. */}
            <div id="act-sell">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                    <LiveBarSection />
                </Suspense>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                    <WaysToGetPaid />
                </Suspense>
            </div>

            {/* ── 03 · Set up in minutes ── */}
            <div id="act-setup">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                    <SetupSteps />
                </Suspense>
            </div>

            {/* ── 04 · Getting paid — the rails, the marks, then the price ── */}
            <div id="act-paid">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[80dvh]" />}>
                    <PayByBankAnnouncement />
                    <PaymentSlider />
                </Suspense>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                    <PricingSection />
                    <CustomPricingNote />
                </Suspense>
            </div>

            {/* ── 05 · Earn more — the bonus schemes ──
                🚨 `ReferEarnAnnouncement` WAS HERE AND IS DELIBERATELY GONE. It was
                ~850px making an argument `EarnMoreAnnouncement` had just made: that
                component's THIRD CARD *is* the creator referral bonus — same £50, same
                £1,000 threshold — so the page said it twice in two near-identical 3-up
                card grids. Its CTA was also a conversion leak: "Get Your Referral Link"
                sends a logged-OUT visitor into an account-gated dashboard. The
                component file is kept — /refer-and-earn is a real page — but do not
                re-add it here without first removing the card from EarnMore.

                🚨 `StablecoinTipsAnnouncement` WAS HERE AND IS DELIBERATELY GONE
                (21 Aug 2026). It ran ~1,090px under "NOTHING TO MAKE. NOTHING TO SEND."
                with body copy reading "no content, no goods and no service given in
                exchange" — the content-first position inverted, in display type, on the
                highest-traffic page on the site. The component and
                `constants/stablecoinTips` are untouched: that copy is transcribed from
                the client brief and is shared with `Pages/Bio/Show.jsx` and the
                `/creators/link-in-bio` ad page. Only the homepage placement is gone. */}
            <div id="act-earn">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[80dvh]" />}>
                    <EarnMoreAnnouncement founderBonus={founderBonus} />
                    <PaidTasksAnnouncement />
                </Suspense>
            </div>

            {/* ── 06 · The app · what installing actually buys you ──
                ⚠️ Renders NOTHING inside the installed app (`isInstalled()` guard in
                the component), so the standalone PWA does not advertise itself. */}
            <div id="act-app">
                <Suspense fallback={<div aria-hidden="true" className="min-h-[70dvh]" />}>
                    <AppShowcase />
                </Suspense>
            </div>

            {/* ── 07 · Join — proof, then the answers, then the ask ──
                `act-love` is kept as an id so old deep links still land, but the
                testimonials now open the closing chapter instead of standing alone:
                proof reads as the reason to sign up, not as a section of its own.

                ⚠️ `FeatureSuggestionSection` used to open this chapter, two sections
                before the close. It asks a stranger who has not signed up to do
                product management for us, and it is one of four CTAs on the page that
                lead AWAY from registering — placed at the exact point the page should
                be asking for the one thing it wants. It sits below the closing
                marquee, where someone who has read everything can still find it. */}
            <div id="act-join">
                <div id="act-love">
                    <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                        <Reveal delay={0.05}><HappyCreators /></Reveal>
                    </Suspense>
                </div>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[60dvh]" />}>
                    <FAQ />
                </Suspense>
                <Suspense fallback={<div aria-hidden="true" className="min-h-[50dvh]" />}>
                    <JoinUs />
                </Suspense>
                {/* ⚠️ The prop is `textClass`. This passed `textclassName`, which
                    `LiveBar` never reads — so this marquee's `!text-4xl font-gulfs`
                    has never applied and it has always rendered in the component's
                    default `font-GillSans`.

                    🚨 THE LINE IS NOT "KEEP 100%" ANY MORE. The marquee at the TOP of
                    this page already repeats that sentence fourteen times, and it is
                    also in SetupSteps, WaysToGetPaid, the testimonials and the FAQ.
                    Said seven ways in one scroll it stops being a promise and becomes
                    wallpaper. The closing marquee carries the ASK instead — this is
                    the last thing above the sign-up section. */}
                <LiveBar
                    reps={15}
                    classes={"py-3 bg-[#E6EA7B]"}
                    textClass={`!text-4xl font-gulfs mb-0 mx-4 uppercase`}
                    color={`bg-[#E6EA7B]`}
                    text={
                        <>
                          {/* ⚠️ NOT `text-[#FF007F]`. Brand pink on brand yellow
                              measures 2.95:1 — under AA Large even at this 36px
                              display size, and the marquee renders 15 copies of it.
                              The emphasis is carried by the underline and the
                              surrounding weight instead, which costs no contrast. */}
                          🐷 Your page takes <span className="text-black underline decoration-[#FF007F] decoration-4 underline-offset-[6px]">minutes</span> to build!
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
