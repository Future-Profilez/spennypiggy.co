import { Link } from "@inertiajs/react";
import { FaCrown, FaTrophy, FaGift, FaArrowRight, FaStar } from 'react-icons/fa';
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';

export default function FounderProgramAnnouncement({ founderBonus }) {
    // Default values in case founderBonus is not provided
    const defaultConfig = {
        minMonthlyEarnings: 2500,
        bonusPercentage: 10,
        maxBonusPerMonth: 1000,
        maxFounderSeats: 150,
        currencySymbol: '£'
    };

    const config = founderBonus || defaultConfig;

    return (
        <>
            <section className="bg-black pb-12 py-24 md:pb-24 md:py-24 px-4 relative overflow-x-hidden overflow-y-visible">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating-shape"></div>
                    <div className="absolute top-10 right-10 w-32 h-32 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
                    <div className="absolute -bottom-10 left-1/2 w-64 h-64 bg-green-500 rounded-full mix-blend-multiply filter blur-2xl opacity-30 floating-shape" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8 md:mb-16">
                        <FadeIn y={20} duration={0.5}>
                        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <span className="bg-yellow-400 text-black font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] mb-4 inline-block">
                                👑 NEW PROGRAM LAUNCH 👑
                            </span>
                        </div>
                        </FadeIn>
                        
                        <FadeIn x={-80} y={0} delay={0.1} duration={0.7}>
                        <h2 className="uppercase fading text-4xl md:text-5xl lg:text-6xl font-gulfs tracking-[2px] text-white mb-6 leading-none tracking-tight drop-shadow-[4px_4px_0px_0px_#FF007F]">
                            JOIN THE <br className="md:hidden" />
                            <span className="uppercase text-yellow-400 tracking-[2px] animate-pulse">
                                FOUNDER
                            </span> PROGRAM!
                        </h2>
                        </FadeIn>
                        
                        
                        <p className="fading text-sm md:text-lg text-gray-400 mt-4 uppercase tracking-widest font-bold">
                            Earn <span className="text-yellow-400 font-bold">{config.currencySymbol}{config.minMonthlyEarnings}</span> in your first 30 days and automatically qualify for a <span className="text-[#FF007F] font-bold">{config.bonusPercentage}% monthly bonus</span>.
                        </p>
                        <p className="fading text-sm md:text-lg text-gray-400 mt-1 uppercase tracking-widest font-bold">
                            Join our exclusive founder community. Limited to the first <span className="text-green-400">{config.maxFounderSeats}</span> creators!
                        </p>
                    </div>

                    {/* Cards Grid - Staggered Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-4 mt-12 md:mt-16 items-stretch">
                        
                        {/* Card 1: Monthly Bonus */}
                        <StaggerItem index={0} x={-80} y={0} rotate={-2} stagger={0.15} duration={0.6}>
                        <div className="bg-gray-900 border-2 mb-2 md:mb-0 border-yellow-400 rounded-[30px] p-6 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#FACC15] md:shadow-[8px_8px_0px_0px_#FACC15] flex flex-col h-full">
                            <div className="absolute -top-6 -right-6 bg-yellow-400 text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg wiggle transform rotate-12">
                                <FaTrophy />
                            </div>
                            <h3 className="fading text-xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none">{config.bonusPercentage}% Monthly<br/><span className="text-yellow-400">Bonus</span></h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug flex-grow">
                                Boost your earnings with a permanent {config.bonusPercentage}% monthly bonus on all revenue. Every tip, membership, and sale automatically triggers an extra payout.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px] p-3 flex items-center gap-3 w-fit mt-auto">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-yellow-400 animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-300 uppercase">Extra Payouts</span>
                            </div>
                        </div>
                        </StaggerItem>

                        {/* Card 2: Founder Status (Staggered Down) */}
                        <StaggerItem index={1} x={-80} y={0} rotate={1} stagger={0.15} duration={0.6}>
                        <div className="bg-gray-900 border-2 mb-2 md:mb-0 border-[#FF007F] rounded-[30px] p-6 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#FF007F] md:shadow-[8px_8px_0px_0px_#FF007F] md:mt-12 flex flex-col h-full">
                            <div className="absolute -top-6 -right-6 bg-[#FF007F] text-white w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg wiggle transform -rotate-12">
                                <FaCrown />
                            </div>
                            <h3 className="fading text-xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none">Founder<br/><span className="text-[#FF007F]">Status</span></h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug flex-grow">
                                Gain exclusive recognition with a unique founder badge, priority search ranking, and VIP support. Establish your authority as a leading creator.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px] p-3 flex items-center gap-3 w-fit mt-auto">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#FF007F] animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-300 uppercase">VIP Perks</span>
                            </div>
                        </div>
                        </StaggerItem>

                        {/* Card 3: Priority Qualification */}
                        <StaggerItem index={2} x={-80} y={0} rotate={-2} stagger={0.15} duration={0.6}>
                        <div className="bg-gray-900 border-2 mb-2 md:mb-0 border-green-400 rounded-[30px] p-6 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#4ADE80] md:shadow-[8px_8px_0px_0px_#4ADE80] flex flex-col h-full md:col-span-3 lg:col-span-1">
                            <div className="absolute -top-6 -right-6 bg-green-400 text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg wiggle transform rotate-6">
                                <FaGift />
                            </div>
                            <h3 className="fading text-xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none">Priority<br/><span className="text-green-400">Access</span></h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug flex-grow">
                                Earn {config.currencySymbol}{config.minMonthlyEarnings.toLocaleString()} in your first 30 days to automatically unlock lifetime bonuses and rewards. Act fast—only {config.maxFounderSeats} seats available.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px] p-3 flex items-center gap-3 w-fit mt-auto">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-300 uppercase">Limited Seats</span>
                            </div>
                        </div>
                        </StaggerItem>

                    </div>

                    {/* Brutalist CTA Button */}
                    <div className="mt-16 md:mt-24 text-center relative z-10">
                        <Link href="/founder/bonus" 
                            className="relative inline-flex items-center gap-4 bg-yellow-400 text-black font-black text-base md:text-lg py-4 px-10 md:px-12 rounded-full shadow-[6px_6px_0px_0px_#FF007F] border-2 border-yellow-400 hover:shadow-[0px_0px_0px_0px_#FF007F] hover:translate-y-[6px] hover:translate-x-[6px] transition-all duration-300 uppercase tracking-wide group">
                            <span>Learn More About Founder Bonus</span>
                            <FaArrowRight className="text-xl md:text-2xl group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
