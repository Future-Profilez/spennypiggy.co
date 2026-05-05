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
            <section className="bg-black py-20 md:py-32 relative overflow-hidden">
                {/* Background decorative elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-yellow-500/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse"></div>
                    <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-pink-600/20 rounded-full mix-blend-screen filter blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.05)_0%,transparent_70%)]"></div>
                </div>

                <div className="max-w-6xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <div className="flex items-center justify-center mb-8">
                            <div className="fading flex items-center justify-center w-fit bg-yellow-400/10 backdrop-blur-md rounded-full px-5 py-1.5 border border-yellow-400/20 shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                                <FaCrown className="text-yellow-400 mr-2 text-lg" />
                                <span className="text-yellow-400 font-gulfs uppercase tracking-widest text-[10px] md:text-xs">
                                    New Program Launch
                                </span>
                            </div>
                        </div>

                        <h2 className="fading m-auto text-4xl md:text-4xl lg:text-5xl font-gulfs text-white mb-6 leading-tight uppercase tracking-tight">
                            Join the <span className="text-gradient-founder drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">Founder</span> Program!
                        </h2>

                        <p className="fading m-auto pt-4 text-lg md:text-2xl text-gray-400 mb-12 max-w-3xl leading-relaxed font-poppins">
                            Earn <span className="text-yellow-400 font-semibold">{config.currencySymbol}{config.minMonthlyEarnings}</span> in your first 30 days and automatically qualify for a <span className="text-pink-500 font-semibold">{config.bonusPercentage}% monthly bonus</span>.
                            <br/>
                            <span className="text-sm md:text-base opacity-60 mt-4 block">
                                Join our exclusive founder community. Limited to the first <span className="text-green-400 font-semibold">{config.maxFounderSeats}</span> creators!
                            </span>
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                            {/* Card 1: Monthly Bonus */}
                            <div className="fading group bg-[#0d0d0d] p-5 md:p-6 rounded-[3.5rem] border border-white/5 flex items-center space-x-4 hover:bg-[#151515] transition-all duration-500">
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full group-hover:bg-yellow-400/30 transition-all duration-500"></div>
                                    <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                        <FaTrophy className="text-black text-xl md:text-2xl" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-bold text-base md:text-lg leading-tight">{config.bonusPercentage}% Monthly Bonus</h4>
                                    <p className="text-gray-500 text-[10px] md:text-xs leading-tight">Extra earnings on every support</p>
                                </div>
                            </div>

                            {/* Card 2: Founder Status */}
                            <div className="fading group bg-[#0d0d0d] p-5 md:p-6 rounded-[3.5rem] border border-white/5 flex items-center space-x-4 hover:bg-[#151515] transition-all duration-500">
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full group-hover:bg-pink-500/30 transition-all duration-500"></div>
                                    <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                        <FaCrown className="text-white text-xl md:text-2xl" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-bold text-base md:text-lg leading-tight">Founder Status</h4>
                                    <p className="text-gray-500 text-[10px] md:text-xs leading-tight">Exclusive profile badge & VIP</p>
                                </div>
                            </div>

                            {/* Card 3: Priority Qualification */}
                            <div className="fading group bg-[#0d0d0d] p-5 md:p-6 rounded-[3.5rem] border border-white/5 flex items-center space-x-4 hover:bg-[#151515] transition-all duration-500 md:col-span-2 lg:col-span-1">
                                <div className="relative shrink-0">
                                    <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full group-hover:bg-green-400/30 transition-all duration-500"></div>
                                    <div className="relative w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                        <FaGift className="text-black text-xl md:text-2xl" />
                                    </div>
                                </div>
                                <div className="text-left">
                                    <h4 className="text-white font-bold text-base md:text-lg leading-tight">Priority Qualification</h4>
                                    <p className="text-gray-500 text-[10px] md:text-xs leading-tight">Hit {config.currencySymbol}{config.minMonthlyEarnings} in 30 days</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
