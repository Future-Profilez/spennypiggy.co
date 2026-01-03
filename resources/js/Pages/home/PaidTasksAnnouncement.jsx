import { Link } from "@inertiajs/react";
import { FaBolt, FaMagic, FaShieldAlt, FaRocket, FaStar, FaHeart } from 'react-icons/fa';

export default function PaidTasksAnnouncement() {
    return (
        <>
            <style jsx>{`
                .excited-gradient {
                    background: linear-gradient(120deg, #FF0080, #7928CA, #FF0080);
                    background-size: 200% 200%;
                    animation: gradientMove 6s ease infinite;
                }
                @keyframes gradientMove {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                .wiggle:hover {
                    animation: wiggle 0.5s ease-in-out infinite;
                }
                @keyframes wiggle {
                    0%, 100% { transform: rotate(-3deg); }
                    50% { transform: rotate(3deg); }
                }
                .pop-in {
                    animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                    opacity: 0;
                    transform: scale(0.5);
                }
                @keyframes popIn {
                    to { opacity: 1; transform: scale(1); }
                }
                .floating-shape {
                    animation: float 6s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-20px) rotate(10deg); }
                }
            `}</style>

            <div className="bg-black py-20 px-4 relative">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-yellow-400 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating-shape"></div>
                    <div className="absolute top-10 right-10 w-32 h-32 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-30 floating-shape" style={{animationDelay: '1s'}}></div>
                    <div className="absolute -bottom-10 left-1/2 w-64 h-64 bg-purple-600 rounded-full mix-blend-multiply filter blur-2xl opacity-30 floating-shape" style={{animationDelay: '2s'}}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    
                    {/* Header Section */}
                    <div className="text-center mb-16">
                        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <span className="bg-yellow-400 text-black font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] mb-4 inline-block">
                                ✨ New Feature ✨
                            </span>
                        </div>
                        
                        <h2 className="fading text-4xl md:text-5xl lg:text-6xl font-gulfs text-white mb-6 leading-none tracking-tight drop-shadow-2xl">
                            TURN YOUR SKILLS <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-pink-500 to-purple-500 animate-pulse">
                                INTO CASH! 💸
                            </span>
                        </h2>
                        
                        <p className="fading text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed">
                            Ready to level up? Whether it's selling digital goodies or fulfilling custom fan requests, <strong className="text-white">Paid Tasks</strong> makes it fun, fast, and 100% secure!
                        </p>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-4">
                        
                        {/* Card 1: Instant */}
                        <div className="bg-gray-900 border-4 mb-2 md:mb-0 border-pink-500 rounded-[30px] p-4 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#EC4899] md:shadow-[8px_8px_0px_0px_#EC4899]">
                            <div className="absolute -top-6 -right-6 bg-pink-500 text-white w-16 h-16 flex items-center justify-center rounded-full text-3xl shadow-lg wiggle transform rotate-12">
                                <FaBolt />
                            </div>
                            <h3 className="fading text-3xl font-gulfs text-white mb-4 uppercase">Instant<br/>Unlock</h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug">
                                Got an ebook, preset, or exclusive art? Upload it once, and let fans unlock it instantly!
                            </p>
                            <div className="fading bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-300 uppercase">Passive Income Mode</span>
                            </div>
                        </div>

                        {/* Card 2: Custom */}
                        <div className="bg-gray-900 border-4 mb-2 md:mb-0 border-yellow-400 rounded-[30px] p-4 md:p-8 relative group hover:-translate-y-3 transition-all duration-300  shadow-[4px_4px_0px_0px_#FACC15] md:shadow-[8px_8px_0px_0px_#FACC15]">
                            <div className="absolute -top-6 -right-6 bg-yellow-400 text-black w-16 h-16 flex items-center justify-center rounded-full text-3xl shadow-lg wiggle transform -rotate-12">
                                <FaMagic />
                            </div>
                            <h3 className="fading text-3xl font-gulfs text-white mb-4 uppercase">Custom<br/>Wishes</h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug">fading 
                                Fans can request specific tasks. You set the price and deadline. You're the boss!
                            </p>
                            <div className="fading bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-blue-400 animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-300 uppercase">Total Creative Control</span>
                            </div>
                        </div>

                        {/* Card 3: Safe */}
                        <div className="bg-gray-900 border-4 mb-2 md:mb-0 border-purple-500 rounded-[30px] p-4 md:p-8 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#A855F7] md:shadow-[8px_8px_0px_0px_#A855F7]">
                            <div className="absolute -top-6 -right-6 bg-purple-500 text-white w-16 h-16 flex items-center justify-center rounded-full text-3xl shadow-lg wiggle transform rotate-6">
                                <FaShieldAlt />
                            </div>
                            <h3 className="fading text-3xl font-gulfs text-white mb-4 uppercase">100%<br/>Safe</h3>
                            <p className="fading text-gray-400 text-lg mb-6 leading-snug">
                                We hold the funds securely. Plus, a 48h grace period means zero stress if life happens.
                            </p>
                            <div className="fading bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-pink-400 animate-pulse"></div>
                                <span className="text-sm font-bold text-gray-300 uppercase">Auto-Refund Guarantee</span>
                            </div>
                        </div>

                    </div>

                    {/* CTA Section */}
                    <div className="mt-20 text-center relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-32 bg-gradient-to-r from-pink-500 via-purple-500 to-yellow-500 rounded-full blur-3xl opacity-20"></div>
                        <Link  href="/task/dashboard" 
                            className="relative inline-flex items-center gap-4 bg-white text-black font-black text-normal md:text-xl py-3 px-12 rounded-full shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group overflow-hidden" >
                            <span className="relative z-10">Start Earning Now</span>
                            <FaRocket className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-300 via-pink-300 to-purple-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </Link>
                        <div className="mt-6 flex justify-center items-center gap-2 text-white/50 text-sm font-bold uppercase tracking-widest">
                            <FaHeart className="text-red-500 animate-pulse" /> Loved by 10,000+ Creators
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
