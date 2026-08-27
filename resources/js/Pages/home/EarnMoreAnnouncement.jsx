import { Link } from "@inertiajs/react";
import { FaBolt, FaCrown, FaUserFriends, FaCheck, FaArrowRight } from "react-icons/fa";
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import TiltCard from '@/Components/animations/TiltCard';
import Magnetic from '@/Components/animations/Magnetic';
// 🚨 EIGHT FIGURES ON THIS PAGE WERE TYPED INTO JSX (21 Aug 2026) while this file
// existed and was already imported by three lower-traffic ad pages. Its own
// docblock says it: "A number that is wrong here is a number in an advert." The
// homepage is the biggest advert on the site and was the one page not reading it.
// One of the eight was materially wrong — see the Founder card below.
import { FOUNDER, FAST_START, GROWTH, REFERRAL, money, percent } from '@/constants/creatorBonuses';

export default function EarnMoreAnnouncement({ founderBonus, growthBonus }) {
    const spotsRemaining = founderBonus?.founderSpotsRemaining;
    const maxSeats = founderBonus?.maxFounderSeats ?? 150;

    /* 🚨 THE WHOLE BLOCK IS GATED ON THE SERVER PROP, not on the constants.
       `GROWTH` is a mirror of the config and is always importable, so keying on
       it would advertise the scheme while `growth_bonus.enabled` is false — and
       /growth-bonus 404s in that state, which is a CTA into nothing. The prop is
       only sent when the feature is live. */
    const growthLive = !!growthBonus;
    const growthTotal = growthBonus?.maxTotal ?? GROWTH.maxTotal;
    const growthSpend = growthBonus?.activationGmv ?? GROWTH.activationGmv;
    const growthReward = growthBonus?.firstReward ?? GROWTH.firstReward;
    const growthWindow = growthBonus?.windowDays ?? GROWTH.windowDays;
    const growthLeft = growthBonus?.seatsRemaining;
    const growthSeats = growthBonus?.maxSeats ?? GROWTH.seats;

    return (
        <section
            className="py-12 md:py-28 px-4 relative overflow-x-hidden overflow-y-visible"
        >
            {/* No decorative orbs. `bg-white mix-blend-multiply` over yellow is yellow
                (invisible), `bg-[#FF007F] mix-blend-multiply` over yellow is a dirty
                orange smudge, and the black radial muted the middle of the band — so
                the three of them only ever made a flat colour look blotchy. A band's
                strength is that it is one confident, even block of colour. */}

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-10 md:mb-14">
                    <FadeIn x={-60} y={0} duration={0.6}>
                        {/* Static tilt is the design; the hover straighten is not —
                            rotate-on-hover is the same banned gimmick as scale. */}
                        <div className="inline-block transform -rotate-2">
                            <span className="bg-[#E6EA7B] text-black font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full mb-4 inline-block">
                                Bonuses & Rewards
                            </span>
                        </div>
                    </FadeIn>
                    <FadeIn x={60} y={0} delay={0.1} duration={0.7}>
                        <h2 className="uppercase text-3xl md:text-4xl lg:text-5xl font-gulfs tracking-[2px] text-white mb-4 leading-none">
                            Earn More With <br />
                            <span className="text-[#FF007F] tracking-[2px]">Spenny Piggy</span>
                        </h2>
                    </FadeIn>
                    <FadeIn y={20} delay={0.2}>
                        <p className="text-base md:text-2xl text-white/65 max-w-3xl mx-auto font-medium leading-relaxed">
                            More rewards. More bonuses. More reasons to join.
                        </p>
                    </FadeIn>
                </div>

                {/* ── Creator Growth Bonus — the lead offer ──
                    🚨 ONE ELEMENT, NOT TWO. The brief asks for a landing-page callout AND a
                    card in the Bonuses section; drawn as two they would be the same offer
                    stated twice in one scroll, which is precisely why `ReferEarnAnnouncement`
                    and `StablecoinTipsAnnouncement` were removed from this page. A full-width
                    lead card above the three is the callout and the card.

                    ⚠️ The £100 is the creator's LISTED SALE VALUE — a £100 listing counts as
                    £100 (client decision, 26 Aug 2026; terms clause 2.1). It was gross
                    customer spend until then, when this block was careful to say "sales"
                    rather than "earn"; all three cards on this screen now share a base. */}
                {growthLive && (
                    <div className="px-2 md:px-4 mb-6 md:mb-10">
                        <FadeIn y={20} duration={0.6}>
                        <div className="bg-[#8C52FF] border-black rounded-box p-6 md:p-10 relative">
                            <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
                                <div className="lg:flex-1">
                                    <span className="inline-block bg-black text-white font-black px-3 py-1 uppercase tracking-widest text-[11px] rounded-box-xs mb-4">
                                        New · Growth Bonus
                                    </span>
                                    <h3 className="text-3xl md:text-5xl font-gulfs text-black uppercase leading-none mb-3">
                                        Earn up to {money(growthTotal)}<br />as you grow
                                    </h3>
                                    <p className="text-black/75 text-base md:text-xl leading-snug max-w-xl">
                                        Earn {money(growthSpend)} within your first {growthWindow} days
                                        and we add {money(growthReward)}. Keep hitting milestones and unlock up
                                        to {money(growthTotal)} in total.
                                    </p>
                                </div>

                                {/* The first step, worked. "Up to £1,000" is the last of eleven
                                    rungs and needs £25,000 of sales behind it — quoted alone it
                                    reads as a sign-up reward. */}
                                <div className="lg:w-[280px] shrink-0 bg-[#E6EA7B] border-black rounded-box-sm p-5">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-black/60 mb-3">
                                        Your first step
                                    </p>
                                    <div className="flex items-baseline justify-between gap-3 mb-2">
                                        <span className="text-black/70 font-bold uppercase text-xs">You earn</span>
                                        <span className="font-gulfs text-2xl text-black">{money(growthSpend)}</span>
                                    </div>
                                    {/* 🚨 THE RULE IS INLINE, NOT `border-t-2 border-black`.
                                        `resources/css/index.css` redefines `.border-black` as the
                                        full `border: 2px solid` SHORTHAND, so pairing it with a
                                        side utility draws a box on ALL FOUR sides — which is
                                        exactly what shipped here: the "We add £25" row rendered
                                        as a framed box instead of a divider. An inline border
                                        cannot be dropped or widened by the compiler. */}
                                    <div
                                        className="flex items-baseline justify-between gap-3 pt-3 mt-1"
                                        style={{ borderTop: "2px solid #000" }}
                                    >
                                        <span className="text-black font-black uppercase text-xs">We add</span>
                                        <span className="font-gulfs text-2xl text-black">{money(growthReward)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-wrap items-center gap-3">
                                <Link
                                    href="/growth-bonus"
                                    className="inline-flex min-h-[48px] items-center gap-2 bg-black text-white font-black py-3 px-6 rounded-box-sm uppercase tracking-wide transition-[filter] duration-200 hover:brightness-125 active:brightness-90"
                                >
                                    See the milestones
                                    <FaArrowRight />
                                </Link>
                                {/* ⚠️ A real count, not copy — it is the figure the seat claim
                                    enforces. Absent rather than invented when the server did
                                    not send one. */}
                                {typeof growthLeft === "number" && (
                                    <span className="inline-flex items-center bg-black/10 text-black font-black px-4 py-2 rounded-full uppercase tracking-widest text-xs">
                                        {Math.max(0, growthLeft)} of {growthSeats} places left
                                    </span>
                                )}
                            </div>
                        </div>
                        </FadeIn>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-10 px-2 md:px-4">
                    <StaggerItem index={0} x={80} y={0} rotate={2} stagger={0.15} duration={0.6}>
                    <TiltCard max={8} className="rounded-box h-full">
                    <div className="bg-[#E6EA7B] border-black rounded-box p-6 md:p-8 relative group h-full">
                        <div className="absolute -top-4 -right-3 md:-top-6 md:-right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl wiggle border-black transform rotate-6">
                            <FaBolt />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Fast Start Bonus</h3>
                        <p className="text-black/70 text-lg mb-5 leading-snug">
                            Earn an extra {percent(FAST_START.rate)} on everything you make during your first {FAST_START.windowDays} days.
                        </p>
                        <ul className="space-y-2 text-black/75 font-semibold">
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> No minimum earnings</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Paid automatically with weekly payouts</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Available to every creator</li>
                        </ul>
                    </div>
                    </TiltCard>
                    </StaggerItem>

                    <StaggerItem index={1} x={80} y={0} rotate={-1} stagger={0.15} duration={0.6}>
                    <TiltCard max={8} className="rounded-box h-full">
                    <div className="bg-[#05EFB8] border-black rounded-box p-6 md:p-8 relative group h-full">
                        <div className="absolute -top-4 -right-3 md:-top-6 md:-right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl wiggle border-black transform -rotate-6">
                            <FaCrown />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Founder&#39;s Bonus</h3>
                        <p className="text-black/70 text-lg mb-5 leading-snug">
                            First {FOUNDER.seats} creators only. Earn {money(FOUNDER.qualifyingNet)} in your first {FOUNDER.windowDays} days
                            and unlock an extra {percent(FOUNDER.monthlyRate)} on your earnings every month for 12 months,
                            up to {money(FOUNDER.monthlyCap)} a month.
                        </p>
                        <ul className="space-y-2 text-black/75 font-semibold">
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Limited founder spots</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Exclusive reward programme</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Built for ambitious creators</li>
                        </ul>
                        {typeof spotsRemaining === "number" ? (
                            <div className="mt-5 inline-flex items-center gap-2 bg-[#E6EA7B] text-black font-black px-4 py-2 rounded-full uppercase tracking-widest text-xs">
                                Founder Spots Remaining: {Math.max(0, spotsRemaining)} / {maxSeats}
                            </div>
                        ) : null}
                    </div>
                    </TiltCard>
                    </StaggerItem>

                    <StaggerItem index={2} x={80} y={0} rotate={2} stagger={0.15} duration={0.6}>
                    <TiltCard max={8} className="rounded-box h-full">
                    <div className="bg-[#FF007F] border-black rounded-box p-6 md:p-8 relative group h-full">
                        <div className="absolute -top-4 -right-3 md:-top-6 md:-right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl wiggle border-black transform rotate-12">
                            <FaUserFriends />
                        </div>
                        {/* ⚠️ INK ON A PINK FILL IS BLACK. White on #FF007F is 3.78:1
                            and fails AA at this size; black is 5.56:1. The yellow and
                            mint cards beside this one already take black, so this was
                            also the only card in the row reading in a different ink. */}
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Creator Referral Bonus</h3>
                        <p className="text-black/80 text-lg mb-5 leading-snug">
                            Refer creators and earn {money(REFERRAL.amount)} when they reach {money(REFERRAL.qualifyingGmv)} in earnings.
                        </p>
                        <ul className="space-y-2 text-black font-semibold">
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Unlimited referrals</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> No cap on rewards</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-black shrink-0" /> Earn while helping others grow</li>
                        </ul>
                    </div>
                    </TiltCard>
                    </StaggerItem>
                </div>

                <FadeIn y={20} delay={0.3}>
                <div className="mt-12 text-center">
                    <div className="text-white/70 font-black text-lg md:text-xl">
                        Creators keep 100% of what they earn.
                    </div>
                    <div className="text-white font-gulfs uppercase tracking-wider text-2xl md:text-3xl mt-2">
                        We&#39;ll Pay You To Create.
                    </div>
                    <div className="mt-8">
                        <Magnetic strength={0.3}>
                        <Link
                            href="/register"
                            className="relative inline-flex min-h-[48px] items-center gap-3 bg-[#E6EA7B] text-black font-black text-base md:text-lg py-3 px-7 rounded-full transition-[filter] duration-200 hover:brightness-95 active:brightness-90 uppercase tracking-wide group"
                        >
                            {/* ⚠️ ONE LABEL FOR ONE ACTION. The homepage had four
                                for /register — "Create your page", "Start Selling
                                for Free", "Join the Spenny Piggy party!" and the
                                header's "Sign Up" — read in sequence while
                                scrolling, so the same destination looked like four
                                different offers. The in-page CTAs now all read
                                "Create your page", matching the hero. (The header
                                keeps "Sign Up": it is persistent chrome, read once
                                and conventionally labelled, not part of the scroll.) */}
                            <span>Create your page</span>
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                        </Magnetic>
                    </div>
                </div>
                </FadeIn>
            </div>
        </section>
    );
}

