import { Link } from "@inertiajs/react";
import { FaBolt, FaCrown, FaUserFriends, FaCheck, FaArrowRight } from "react-icons/fa";

export default function EarnMoreAnnouncement({ founderBonus }) {
    const spotsRemaining = founderBonus?.founderSpotsRemaining;
    const maxSeats = founderBonus?.maxFounderSeats ?? 150;

    return (
        <section className="bg-[#E6EA7B] py-12 md:py-20 lg:py-28 px-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-10 left-10 w-40 h-40 bg-white rounded-full mix-blend-multiply filter blur-2xl opacity-25 floating-shape"></div>
                <div className="absolute bottom-10 right-10 w-72 h-72 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-2xl opacity-15 floating-shape" style={{ animationDelay: "1s" }}></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.10)_0%,transparent_70%)]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-10 md:mb-14">
                    <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                        <span className="bg-black text-white font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] mb-4 inline-block">
                            Bonuses & Rewards
                        </span>
                    </div>
                    <h2 className="uppercase text-4xl md:text-5xl lg:text-6xl font-gulfs tracking-[2px] text-black mb-4 leading-none">
                        Earn More With <br />
                        <span className="text-[#FF007F] tracking-[2px]">Spenny Piggy</span>
                    </h2>
                    <p className="text-lg md:text-2xl text-black/80 max-w-3xl mx-auto font-medium leading-relaxed">
                        More rewards. More bonuses. More reasons to join.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-4">
                    <div className="bg-white border-4 border-black rounded-[30px] p-6 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]">
                        <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl shadow-lg wiggle transform rotate-6">
                            <FaBolt />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Fast Start Bonus</h3>
                        <p className="text-gray-700 text-lg mb-5 leading-snug">
                            Earn an extra 5% on everything you make during your first 30 days.
                        </p>
                        <ul className="space-y-2 text-gray-700 font-semibold">
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> No minimum earnings</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Paid automatically with weekly payouts</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Available to every creator</li>
                        </ul>
                    </div>

                    <div className="bg-white border-4 border-black rounded-[30px] p-6 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]">
                        <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl shadow-lg wiggle transform -rotate-6">
                            <FaCrown />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Founder&#39;s Bonus</h3>
                        <p className="text-gray-700 text-lg mb-5 leading-snug">
                            First 150 creators only. Earn £2,500 in your first 30 days and unlock an extra 10% on your earnings every month for 12 months.
                        </p>
                        <ul className="space-y-2 text-gray-700 font-semibold">
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Limited founder spots</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Exclusive reward programme</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Built for ambitious creators</li>
                        </ul>
                        {typeof spotsRemaining === "number" ? (
                            <div className="mt-5 inline-flex items-center gap-2 bg-black text-white font-black px-4 py-2 rounded-full uppercase tracking-widest text-xs">
                                Founder Spots Remaining: {Math.max(0, spotsRemaining)} / {maxSeats}
                            </div>
                        ) : null}
                    </div>

                    <div className="bg-white border-4 border-black rounded-[30px] p-6 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]">
                        <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl shadow-lg wiggle transform rotate-12">
                            <FaUserFriends />
                        </div>
                        <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">Creator Referral Bonus</h3>
                        <p className="text-gray-700 text-lg mb-5 leading-snug">
                            Refer creators and earn £50 when they reach £1,000 in earnings.
                        </p>
                        <ul className="space-y-2 text-gray-700 font-semibold">
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Unlimited referrals</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> No cap on rewards</li>
                            <li className="flex items-center gap-2"><FaCheck className="text-[#FF007F]" /> Earn while helping others grow</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <div className="text-black font-black text-lg md:text-xl">
                        Creators keep 100% of what they earn.
                    </div>
                    <div className="text-black font-gulfs uppercase tracking-wider text-2xl md:text-3xl mt-2">
                        We&#39;ll Pay You To Get Spoiled.
                    </div>
                    <div className="mt-8">
                        <Link
                            href="/register"
                            className="relative inline-flex items-center gap-3 bg-black text-white font-black text-md md:text-lg py-3 px-6 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.25)] hover:scale-105 transition-all duration-300 uppercase tracking-wide group"
                        >
                            <span>Start Free Creator Trial</span>
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}

