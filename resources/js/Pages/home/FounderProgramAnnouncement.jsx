import { Link } from "@inertiajs/react";
import { FaCrown, FaTrophy, FaGift, FaArrowRight, FaStar } from 'react-icons/fa';

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
            <section className="bg-[#050505] py-24 md:py-32 px-4 relative overflow-hidden">
                {/* Creative Animated Background */}
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-yellow-500/10 rounded-full mix-blend-screen blur-[100px] animate-pulse"></div>
                    <div className="absolute top-[40%] right-[-10%] w-[30%] h-[30%] bg-pink-500/10 rounded-full mix-blend-screen blur-[100px] animate-pulse" style={{animationDelay: '1.5s'}}></div>
                    <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] bg-purple-500/10 rounded-full mix-blend-screen blur-[120px] animate-pulse" style={{animationDelay: '3s'}}></div>
                    
                    {/* Floating particles */}
                    <div className="absolute top-[20%] left-[15%] text-yellow-400/30 animate-bounce"><FaStar size={12} /></div>
                    <div className="absolute top-[30%] right-[20%] text-pink-400/30 animate-bounce" style={{animationDelay: '1s'}}><FaStar size={16} /></div>
                    <div className="absolute bottom-[25%] left-[30%] text-purple-400/30 animate-bounce" style={{animationDelay: '2s'}}><FaStar size={10} /></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Header Area */}
                    <div className="text-center mb-20">
                        <div className="fading inline-flex items-center gap-2 px-6 py-2 rounded-full bg-yellow-400/10 border border-yellow-400/20 mb-8 backdrop-blur-md">
                            <FaCrown className="text-yellow-400 text-sm animate-pulse" />
                            <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">New Program Launch</span>
                        </div>

                        <h2 className="fading text-5xl md:text-7xl lg:text-[80px] font-gulfs text-white mb-8 leading-[1.1] uppercase tracking-wide">
                            Join the <br className="md:hidden" />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600 drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                                Founder
                            </span> Program!
                        </h2>

                        <p className="fading text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-light leading-relaxed">
                            Earn <span className="text-yellow-400 font-bold">{config.currencySymbol}{config.minMonthlyEarnings}</span> in your first 30 days and automatically qualify for a <span className="text-[#FF007F] font-bold">{config.bonusPercentage}% monthly bonus</span>.
                        </p>
                        
                        <p className="fading text-sm md:text-base text-gray-500 mt-6 uppercase tracking-[0.2em] font-medium">
                            Join our exclusive founder community. Limited to the first <span className="text-green-400 font-bold">{config.maxFounderSeats}</span> creators!
                        </p>
                    </div>

                    {/* Creative Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 px-2 md:px-4 mt-12 md:mt-24">
                        
                        {/* Card 1 */}
                        <div className="fading group relative bg-[#0d0d0d] rounded-[2.5rem] p-8 md:p-10 border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-4">
                            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/0 to-yellow-500/0 group-hover:from-yellow-500/10 group-hover:to-transparent rounded-[2.5rem] transition-all duration-500 pointer-events-none"></div>
                            
                            <div className="relative w-20 h-20 mx-auto bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(250,204,21,0.3)] group-hover:shadow-[0_0_50px_rgba(250,204,21,0.5)] group-hover:scale-110 transition-all duration-500">
                                <FaTrophy className="text-black text-3xl" />
                            </div>
                            
                            <h3 className="text-white text-xl md:text-2xl font-bold text-center mb-4 group-hover:text-yellow-400 transition-colors duration-300">{config.bonusPercentage}% Monthly Bonus</h3>
                            <p className="text-gray-400 text-center leading-relaxed text-sm md:text-base">
                                Boost your earnings with a permanent {config.bonusPercentage}% monthly bonus on all revenue. Every tip, membership, and sale automatically triggers an extra payout.
                            </p>
                        </div>

                        {/* Card 2 - Elevated for dynamic layout */}
                        <div className="fading group relative bg-[#0d0d0d] rounded-[2.5rem] p-8 md:p-10 border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-4 md:-translate-y-12">
                            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:to-transparent rounded-[2.5rem] transition-all duration-500 pointer-events-none"></div>
                            
                            <div className="relative w-20 h-20 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(168,85,247,0.3)] group-hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] group-hover:scale-110 transition-all duration-500">
                                <FaCrown className="text-white text-3xl" />
                            </div>
                            
                            <h3 className="text-white text-xl md:text-2xl font-bold text-center mb-4 group-hover:text-purple-400 transition-colors duration-300">Founder Status</h3>
                            <p className="text-gray-400 text-center leading-relaxed text-sm md:text-base">
                                Gain exclusive recognition with a unique founder badge, priority search ranking, and VIP support. Establish your authority as a leading creator.
                            </p>
                        </div>

                        {/* Card 3 */}
                        <div className="fading group relative bg-[#0d0d0d] rounded-[2.5rem] p-8 md:p-10 border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-4">
                            <div className="absolute inset-0 bg-gradient-to-b from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-transparent rounded-[2.5rem] transition-all duration-500 pointer-events-none"></div>
                            
                            <div className="relative w-20 h-20 mx-auto bg-green-400 rounded-full flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(74,222,128,0.3)] group-hover:shadow-[0_0_50px_rgba(74,222,128,0.5)] group-hover:scale-110 transition-all duration-500">
                                <FaGift className="text-black text-3xl" />
                            </div>
                            
                            <h3 className="text-white text-xl md:text-2xl font-bold text-center mb-4 group-hover:text-green-400 transition-colors duration-300">Priority Access</h3>
                            <p className="text-gray-400 text-center leading-relaxed text-sm md:text-base">
                                Earn {config.currencySymbol}{config.minMonthlyEarnings.toLocaleString()} in your first 30 days to automatically unlock lifetime bonuses. Act fast—only {config.maxFounderSeats} seats available.
                            </p>
                        </div>

                    </div>

                    {/* CTA Button */}
                    <div className="mt-16 md:mt-24 text-center">
                        <Link href="/founder/bonus" className="fading inline-flex items-center gap-3 bg-white text-black font-bold uppercase tracking-wider text-sm md:text-base py-4 px-10 rounded-full hover:bg-yellow-400 hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] group">
                            <span>Learn More About Founder Bonus</span>
                            <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
