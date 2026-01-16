import { Link } from "@inertiajs/react";
import { FaCrown, FaTrophy, FaGift, FaArrowRight } from 'react-icons/fa';
import { LazyLoadImage } from 'react-lazy-load-image-component';

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
            <section className="bg-black py-16 md:py-24 relative ">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute top-10 right-10 w-96 h-96 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape"></div>
                    <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-purple-900/10 to-transparent"></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 relative ">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="mb-8">
                                <div className="fading inline-flex items-center bg-gray-900/80 backdrop-blur-sm rounded-full px-6 py-2 mb-6 border border-yellow-400/30 shadow-[0_0_15px_rgba(250,204,21,0.2)] wiggle">
                                    <FaCrown className="text-yellow-400 mr-2 text-xl" />
                                    <span className=" text-white font-gulfs uppercase tracking-wider text-sm md:text-base">
                                        New Program Launch
                                </span>
                            </div>
                            <h2 className="fading m-auto text-2xl md:text-4xl lg:text-5xl font-gulfs text-white mb-6 leading-none uppercase">
                                Join the <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-500">Founder</span> Program!
                            </h2>
                            <p className="fading m-auto pt-6 text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl leading-relaxed font-poppins">
                                    Earn <span className="text-yellow-400 font-bold">{config.currencySymbol}{config.minMonthlyEarnings}</span> in your first 30 days from joining and automatically qualify for a <span className="text-pink-500 font-bold">{config.bonusPercentage}% bonus</span> up to {config.currencySymbol}{config.maxBonusPerMonth}! 
                                    <br/><br/>
                                    Join our exclusive founder program with special recognition and benefits. Only <span className="text-green-400 font-bold">{config.maxFounderSeats}</span> creators can join!
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                <div className="fading  bg-black p-3 rounded-[25px] border !border-pink-500/30 flex items-center space-x-4 shadow-[4px_4px_0_0_#ec4899] hover:translate-y-[-4px] transition-transform duration-300 wiggle">
                                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shrink-0">
                                        <FaTrophy className="text-purple-900 text-xl" />
                                    </div>
                                    <span className="text-white font-medium text-lg">{config.bonusPercentage}% bonus on monthly earnings</span>
                                </div>
                                <div className="fading  bg-black p-3 rounded-[25px] border !border-pink-500/30 flex items-center space-x-4 shadow-[4px_4px_0_0_#ec4899] hover:translate-y-[-4px] transition-transform duration-300 wiggle">
                                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center shrink-0">
                                        <FaCrown className="text-white text-xl" />
                                    </div>
                                    <span className="text-white font-medium text-lg">Founder badge & recognition</span>
                                </div>
                                <div className="fading  bg-black p-3 rounded-[25px] border !border-pink-500/30 flex items-center space-x-4 shadow-[4px_4px_0_0_#ec4899] hover:translate-y-[-4px] transition-transform duration-300 md:col-span-2 wiggle">
                                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shrink-0">
                                        <FaGift className="text-green-900 text-xl" />
                                    </div>
                                    <span className="text-white font-medium text-lg">Automatic qualification at {config.currencySymbol}{config.minMonthlyEarnings} in first 30 days</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}