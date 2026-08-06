import { Link } from "@inertiajs/react";
import { FaCrown, FaTrophy, FaGift, FaArrowRight, FaStar } from 'react-icons/fa';
import FadeIn from '@/Components/animations/FadeIn';
import ScrollX from '@/Components/animations/ScrollX';
import WatermarkStrip from '@/Components/animations/WatermarkStrip';
import Parallax from '@/Components/animations/Parallax';
import TiltCard from '@/Components/animations/TiltCard';
import Magnetic from '@/Components/animations/Magnetic';

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
            <section className="bg-transparent py-12 md:py-28 px-4 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-[#E6EA7B] rounded-full mix-blend-screen filter blur-xl opacity-30 floating-shape"></div>
                    <div className="absolute top-10 right-10 w-32 h-32 bg-[#FF007F] rounded-full mix-blend-screen filter blur-xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
                    <div className="absolute -bottom-10 left-1/2 w-64 h-64 bg-[#05EFB8] rounded-full mix-blend-screen filter blur-2xl opacity-30 floating-shape" style={{animationDelay: '2s'}}></div>
                </div>

                {/* Giant outlined watermark strip — scrubs sideways with scroll */}
                <WatermarkStrip text="Founder" from={-150} to={-150} opacity={0.22} className="top-6 md:top-2" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8 md:mb-16">
                        <FadeIn y={20} duration={0.5}>
                        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <span className="bg-[#E6EA7B] text-black font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full mb-4 inline-block">
                                👑 NEW PROGRAM LAUNCH 👑
                            </span>
                        </div>
                        </FadeIn>

                        {/* Heading lines scrub in opposite directions with the scroll */}
                        <h2 className="uppercase fading text-3xl md:text-4xl lg:text-5xl font-gulfs tracking-[2px] text-white mb-6 leading-none drop-">
                            <span className="block">JOIN THE</span>
                            <span className="block mt-2">
                                <span className="uppercase text-[#E6EA7B] tracking-[2px] drop-shadow-[0_0_25px_rgba(230,234,123,0.45)]">
                                    FOUNDER
                                </span>{' '}PROGRAM!
                            </span>
                        </h2>

                        <p className="fading text-sm md:text-lg text-gray-400 mt-4 uppercase tracking-widest font-bold">
                            Earn <span className="text-[#E6EA7B] font-bold">{config.currencySymbol}{config.minMonthlyEarnings}</span> in your first 30 days and automatically qualify for a <span className="text-[#FF007F] font-bold">{config.bonusPercentage}% monthly bonus</span>.
                        </p>
                        <p className="fading text-sm md:text-lg text-gray-400 mt-1 uppercase tracking-widest font-bold">
                            Join our exclusive founder community. Limited to the first <span className="text-[#05EFB8]">{config.maxFounderSeats}</span> creators!
                        </p>
                    </div>

                    {/* Cards Grid — outer cards drift horizontally with scroll, middle drifts vertically */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-10 px-2 md:px-4 mt-12 md:mt-16 items-stretch">

                        {/* Card 1: Monthly Bonus */}
                        <ScrollX from={-45} to={0} rotate={2} fade className="h-full">
                        <TiltCard max={8} className="rounded-[30px] h-full">
                        <div className="bg-[#0d0a16] border-2 mb-2 md:mb-0 border-[#E6EA7B] rounded-[30px] p-6 md:p-8 relative group flex flex-col h-full">
                            <div className="absolute -top-6 -right-6 bg-[#E6EA7B] text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl wiggle transform rotate-12">
                                <FaTrophy />
                            </div>
                            <h3 className="fading text-xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none">{config.bonusPercentage}% Monthly<br/><span className="text-[#E6EA7B]">Bonus</span></h3>
                            <p className="fading text-gray-400 text-base md:text-lg mb-6 leading-snug flex-grow">
                                Boost your earnings with a permanent {config.bonusPercentage}% monthly bonus on all revenue. Every membership, sale, and unlock automatically triggers an extra payout.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px] p-3 flex items-center gap-3 w-fit mt-auto">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#E6EA7B] animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-300 uppercase">Extra Payouts</span>
                            </div>
                        </div>
                        </TiltCard>
                        </ScrollX>

                        {/* Card 2: Founder Status (drifts vertically, sits lower) */}
                        <Parallax speed={22} className="h-full md:mt-12">
                        <TiltCard max={8} className="rounded-[30px] h-full">
                        <div className="bg-[#0d0a16] border-2 mb-2 md:mb-0 border-[#FF007F] rounded-[30px] p-6 md:p-8 relative group flex flex-col h-full">
                            <div className="absolute -top-6 -right-6 bg-[#FF007F] text-white w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl wiggle transform -rotate-12">
                                <FaCrown />
                            </div>
                            <h3 className="fading text-xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none">Founder<br/><span className="text-[#FF007F]">Status</span></h3>
                            <p className="fading text-gray-400 text-base md:text-lg mb-6 leading-snug flex-grow">
                                Gain exclusive recognition with a unique founder badge, priority search ranking, and VIP support. Establish your authority as a leading creator.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px] p-3 flex items-center gap-3 w-fit mt-auto">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#FF007F] animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-300 uppercase">VIP Perks</span>
                            </div>
                        </div>
                        </TiltCard>
                        </Parallax>

                        {/* Card 3: Priority Qualification */}
                        <ScrollX from={45} to={0} rotate={-2} fade className="h-full md:col-span-3 lg:col-span-1">
                        <TiltCard max={8} className="rounded-[30px] h-full">
                        <div className="bg-[#0d0a16] border-2 mb-2 md:mb-0 border-[#05EFB8] rounded-[30px] p-6 md:p-8 relative group flex flex-col h-full">
                            <div className="absolute -top-6 -right-6 bg-[#05EFB8] text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl wiggle transform rotate-6">
                                <FaGift />
                            </div>
                            <h3 className="fading text-xl md:text-3xl font-gulfs text-white mb-4 uppercase leading-none">Priority<br/><span className="text-[#05EFB8]">Access</span></h3>
                            <p className="fading text-gray-400 text-base md:text-lg mb-6 leading-snug flex-grow">
                                Earn {config.currencySymbol}{config.minMonthlyEarnings.toLocaleString()} in your first 30 days to automatically unlock lifetime bonuses and rewards. Act fast—only {config.maxFounderSeats} seats available.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px] p-3 flex items-center gap-3 w-fit mt-auto">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#05EFB8] animate-pulse"></div>
                                <span className="text-xs md:text-sm font-bold text-gray-300 uppercase">Limited Seats</span>
                            </div>
                        </div>
                        </TiltCard>
                        </ScrollX>

                    </div>

                    {/* Brutalist CTA Button */}
                    <div className="mt-10 md:mt-24 text-center relative z-10">
                        <Magnetic strength={0.3}>
                        <Link href="/founder/bonus"
                            className="relative inline-flex items-center gap-3 md:gap-4 bg-[#E6EA7B] text-black font-black text-sm md:text-lg py-3 px-7 md:py-4 md:px-12 rounded-full border-2 border-[#E6EA7B] hover: hover:translate-y-[6px] hover:translate-x-[6px] transition-all duration-300 uppercase tracking-wide group">
                            <span>Learn More About Founder Bonus</span>
                            <FaArrowRight className="text-base md:text-2xl group-hover:translate-x-1 transition-transform" />
                        </Link>
                        </Magnetic>
                    </div>
                </div>
            </section>
        </>
    );
}
