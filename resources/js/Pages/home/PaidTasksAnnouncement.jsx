import { Link, usePage } from "@inertiajs/react";
import { FaBolt, FaMagic, FaShieldAlt, FaRocket } from 'react-icons/fa';

export default function PaidTasksAnnouncement() {
    const { auth } = usePage().props;
    const isCreator = auth && auth.user && auth.user.role === 1;

    return (
        <>
            <div className="bg-black pb-12 py-24 md:pb-24 md:py-24 px-4 relative">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating-shape"></div>
                    <div className="absolute top-10 right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
                    <div className="absolute -bottom-10 left-1/2 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-2xl opacity-30 floating-shape" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8 md:mb-16">
                        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <span className="bg-yellow-400 text-black font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] mb-4 inline-block">
                                ✨ New Feature ✨
                            </span>
                        </div>
                        
                        <h2 className="uppercase fading text-4xl md:text-5xl lg:text-6xl font-gulfs tracking-[2px] text-white mb-6 leading-none tracking-tight drop-shadow-[4px_4px_0px_0px_#FF007F]xl">
                            Get Paid for Requests <br/>
                            <span className="uppercase text-gradient-wishlist tracking-[2px] animate-pulse">
                                On Your Terms 
                            </span> 💸
                        </h2>
                        
                        <p className="fading text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto font-medium leading-relaxed">
                            Supporters pay before requesting a task. You approve, set the rules, and deliver on your own time.
                            Late delivery? Refunds follow your terms — enforced automatically.
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-4">
                        
                        {/* Card 1: Instant */}
                        <div className="bg-gray-900 border-2 mb-2 md:mb-0 border-[#FF007F] rounded-[30px]  p-4 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#EC4899] md:shadow-[8px_8px_0px_0px_#EC4899]">
                            <div className="absolute -top-6 -right-6 bg-pink-500 text-white w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg wiggle transform rotate-12">
                                <FaBolt />
                            </div>
                            <h3 className="fading text-xl  md:text-3xl  font-gulfs text-white mb-2 md:mb-2 uppercase">Instant <br/>Access</h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug">
                                Upload once. Get paid every time.
                                Supporters access content instantly — no back-and-forth, no delivery stress.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px]  p-3 flex items-center gap-3">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-300 uppercase">Passive income mode </span>
                            </div>
                        </div>

                        {/* Card 2: Custom */}
                        <div className="bg-gray-900 border-2 mb-2 md:mb-0 border-yellow-400 rounded-[30px]  p-4 md:p-8 relative group hover:-translate-y-3 transition-all duration-300  shadow-[4px_4px_0px_0px_#FACC15] md:shadow-[8px_8px_0px_0px_#FACC15]">
                            <div className="absolute -top-6 -right-6 bg-yellow-400 text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg wiggle transform -rotate-12">
                                <FaMagic />
                            </div>
                            <h3 className="fading text-xl  md:text-3xl  font-gulfs text-white mb-2 md:mb-2 uppercase">Paid <br/> Tasks (Custom Requests)</h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug">
                                Supporters want something custom?
                                They pay first. You decide the rest.
                                Approve what you want, set the rules, and deliver when it works for you.
                                No chasing. No awkwardness.
                            </p>
                            <div className="fading bg-gray-800 rounded-[30px]  p-3 flex items-center gap-3">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-blue-400 animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-300 uppercase">Full control. Zero pressure.
                                </span>
                            </div>
                        </div>

                        {/* Card 3: Safe */}
                        <div className="bg-gray-900 border-2 mb-2 md:mb-0 border-purple-500 rounded-[30px]  p-4 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#A855F7] md:shadow-[8px_8px_0px_0px_#A855F7]">
                            <div className="absolute -top-6 -right-6 bg-purple-500 text-white w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl shadow-lg wiggle transform rotate-6">
                                <FaShieldAlt />
                            </div>
                            <h3 className="fading text-xl  md:text-3xl  font-gulfs text-white mb-2 md:mb-2 uppercase">Funds <br/> Protected </h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug">
                                
                                
                                Paid first. Always.
You set the timeline, the rules, and the vibe.

If a task isn’t delivered on time, refunds are handled according to your terms — automatically.
 


                            </p>
                            <div className="fading bg-gray-800 rounded-[30px]  p-3 flex items-center gap-3">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#FF007F] animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-300 uppercase">PLATFORM-ENFORCED RULES
                                </span>
                            </div>
                        </div>

                    </div>

                    <p className="text-center  pt-6 md:pt-12 text-white">Clear rules reduce disputes — no awkward reminders, no unpaid “promises”.</p>

                    {/* CTA Section */}
                    {isCreator && (
                        <div className="mt-8 md:mt-12 lg:mt-20 text-center relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-full blur-3xl opacity-20"></div>
                            <Link  href="/task/dashboard" 
                                className="relative inline-flex items-center gap-4 bg-white text-black font-black text-base md:text-xl py-3 px-12 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden" >
                                <span className="relative z-10">Turn Requests Into Income</span>
                                <FaRocket className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                                <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </Link>
                            <div className="mt-6 flex justify-center items-center gap-2 text-white/50 text-sm font-bold uppercase tracking-widest">
                                ❤️ Built for creators who are tired of unpaid requests
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
