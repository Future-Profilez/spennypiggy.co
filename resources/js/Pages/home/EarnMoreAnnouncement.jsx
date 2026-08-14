import { Link } from "@inertiajs/react";
import { FaBolt, FaCrown, FaUserFriends, FaCheck, FaArrowRight } from "react-icons/fa";
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import TiltCard from '@/Components/animations/TiltCard';
import Magnetic from '@/Components/animations/Magnetic';

export default function EarnMoreAnnouncement({ founderBonus }) {
    const spotsRemaining = founderBonus?.founderSpotsRemaining;
    const maxSeats = founderBonus?.maxFounderSeats ?? 150;

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
                        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
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

                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-10 px-2 md:px-4">
                    <StaggerItem index={0} x={80} y={0} rotate={2} stagger={0.15} duration={0.6}>
                    <TiltCard max={8} className="rounded-box h-full">
                    <div className="bg-[#E6EA7B] border-[3px] border-black rounded-box p-6 md:p-8 relative group h-full">
                        <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl wiggle border-[3px] border-black transform rotate-6">
                            <FaBolt />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Fast Start Bonus</h3>
                        <p className="text-black/70 text-lg mb-5 leading-snug">
                            Earn an extra 5% on everything you make during your first 30 days.
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
                    <div className="bg-[#05EFB8] border-[3px] border-black rounded-box p-6 md:p-8 relative group h-full">
                        <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl wiggle border-[3px] border-black transform -rotate-6">
                            <FaCrown />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Founder&#39;s Bonus</h3>
                        <p className="text-black/70 text-lg mb-5 leading-snug">
                            First 150 creators only. Earn £2,500 in your first 30 days and unlock an extra 10% on your earnings every month for 12 months.
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
                    <div className="bg-[#FF007F] border-[3px] border-black rounded-box p-6 md:p-8 relative group h-full">
                        <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl wiggle border-[3px] border-black transform rotate-12">
                            <FaUserFriends />
                        </div>
                        {/* ⚠️ INK ON A PINK FILL IS BLACK. White on #FF007F is 3.78:1
                            and fails AA at this size; black is 5.56:1. The yellow and
                            mint cards beside this one already take black, so this was
                            also the only card in the row reading in a different ink. */}
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Creator Referral Bonus</h3>
                        <p className="text-black/80 text-lg mb-5 leading-snug">
                            Refer creators and earn £50 when they reach £1,000 in earnings.
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
                            className="relative inline-flex items-center gap-3 bg-[#E6EA7B] text-black font-black text-base md:text-lg py-3 px-7 rounded-full hover:scale-105 transition-all duration-300 uppercase tracking-wide group"
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

