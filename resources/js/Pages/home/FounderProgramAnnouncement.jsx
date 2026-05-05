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
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch">
                            {/* Card 1: Monthly Bonus */}
                            <div className="fading group relative bg-[#0d0d0d] p-6 md:p-8 rounded-[3.5rem] border border-white/5 flex flex-col items-center text-center hover:bg-[#151515] transition-all duration-500 h-full overflow-hidden">
                                {/* Glass reflection effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                                
                                <div className="relative shrink-0 mb-6">
                                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full group-hover:bg-yellow-400/30 transition-all duration-500"></div>
                                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
                                        <FaTrophy className="text-black text-2xl md:text-3xl" />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col relative z-10">
                                    <h4 className="text-white font-bold text-lg md:text-xl mb-4 tracking-tight">{config.bonusPercentage}% Monthly Bonus</h4>
                                    <p className="text-gray-400 text-sm md:text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                        Boost your earnings with a permanent {config.bonusPercentage}% monthly bonus on all revenue. Every tip, membership, and sale automatically triggers an extra payout, rewarding your hard work with more money every month.
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Founder Status */}
                            <div className="fading group relative bg-[#0d0d0d] p-6 md:p-8 rounded-[3.5rem] border border-white/5 flex flex-col items-center text-center hover:bg-[#151515] transition-all duration-500 h-full overflow-hidden">
                                {/* Glass reflection effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                                
                                <div className="relative shrink-0 mb-6">
                                    <div className="absolute inset-0 bg-pink-500/20 blur-xl rounded-full group-hover:bg-pink-500/30 transition-all duration-500"></div>
                                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                                        <FaCrown className="text-white text-2xl md:text-3xl" />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col relative z-10">
                                    <h4 className="text-white font-bold text-lg md:text-xl mb-4 tracking-tight">Founder Status</h4>
                                    <p className="text-gray-400 text-sm md:text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                        Gain exclusive recognition with a unique founder badge, priority search ranking, and VIP support. This prestigious status establishes your authority and highlights your role as a leading creator in our community.
                                    </p>
                                </div>
                            </div>

                            {/* Card 3: Priority Qualification */}
                            <div className="fading group relative bg-[#0d0d0d] p-6 md:p-8 rounded-[3.5rem] border border-white/5 flex flex-col items-center text-center hover:bg-[#151515] transition-all duration-500 md:col-span-2 lg:col-span-1 h-full overflow-hidden">
                                {/* Glass reflection effect */}
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none"></div>
                                
                                <div className="relative shrink-0 mb-6">
                                    <div className="absolute inset-0 bg-green-400/20 blur-xl rounded-full group-hover:bg-green-400/30 transition-all duration-500"></div>
                                    <div className="relative w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-emerald-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
                                        <FaGift className="text-black text-2xl md:text-3xl" />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col relative z-10">
                                    <h4 className="text-white font-bold text-lg md:text-xl mb-4 tracking-tight">Priority Qualification</h4>
                                    <p className="text-gray-400 text-sm md:text-base leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                        Earn {config.currencySymbol}{config.minMonthlyEarnings.toLocaleString()} in your first 30 days to automatically unlock lifetime bonuses and rewards. Act fast—only {config.maxFounderSeats} seats are available for this exclusive program.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
