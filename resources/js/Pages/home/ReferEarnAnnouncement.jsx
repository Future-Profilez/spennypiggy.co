import { Link } from "@inertiajs/react";
import { FaUserPlus, FaPoundSign, FaShareAlt, FaRocket } from 'react-icons/fa';
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';

export default function ReferEarnAnnouncement() {
    return (
        <>
            <div className="bg-pink-600 pb-12 py-24 md:pb-24 md:py-24 px-4 relative overflow-x-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                    <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full mix-blend-multiply filter blur-xl opacity-20 floating-shape"></div>
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-2xl opacity-20 floating-shape" style={{animationDelay: '1s'}}></div>
                </div>

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-8 md:mb-16">
                        <FadeIn y={20} duration={0.5}>
                            <div className="fading inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                                <span className="bg-black text-white font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full shadow-[4px_4px_0px_0px_rgba(255,255,255,0.4)] mb-4 inline-block">
                                    🚀 Grow Together 🚀
                                </span>
                            </div>
                        </FadeIn>
                        
                        <FadeIn x={80} y={0} delay={0.1} duration={0.7}>
                            <h2 className="uppercase fading text-4xl md:text-5xl lg:text-6xl font-gulfs tracking-[2px] text-white mb-6 leading-none tracking-tight drop-shadow-[4px 4px 0px 0px rgb(255 0 127)]xl">
                                Refer Creators <br/>
                                <span className="text-black tracking-[2px]">
                                    Earn £50
                                </span> 💸
                            </h2>
                        </FadeIn>
                        
                        <FadeIn y={20} delay={0.2}>
                            <p className="fading text-xl md:text-2xl text-pink-100 max-w-3xl mx-auto font-medium leading-relaxed">
                                Invite creators to Spenny Piggy. When they sign up using your link and reach £1,000 in lifetime GMV, you earn a £50 Stripe payout.
                            </p>
                        </FadeIn>
                    </div>

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-2 md:px-4">
                        
                        <StaggerItem index={0} x={80} y={0} rotate={2} stagger={0.15} duration={0.6}>
                        <div className="fading bg-white border-4 mb-2 md:mb-0 border-black rounded-[30px]  p-6 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]">
                            <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl shadow-lg wiggle transform rotate-12">
                                <FaShareAlt />
                            </div>
                            <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">1. Share</h3>
                            <p className="text-gray-600 text-lg mb-6 leading-snug">
                                Get your unique referral link from your dashboard and share it with other creators.
                            </p>
                        </div>
                        </StaggerItem>

                        <StaggerItem index={1} x={80} y={0} rotate={-1} stagger={0.15} duration={0.6}>
                        <div className="fading bg-white border-4 mb-2 md:mb-0 border-black rounded-[30px]  p-6 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]">
                            <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl shadow-lg wiggle transform -rotate-12">
                                <FaUserPlus />
                            </div>
                            <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">2. They Join</h3>
                            <p className="text-gray-600 text-lg mb-6 leading-snug">
                                When a creator signs up using your link and starts earning on Spenny Piggy.
                            </p>
                        </div>
                        </StaggerItem>

                        <StaggerItem index={2} x={80} y={0} rotate={2} stagger={0.15} duration={0.6}>
                        <div className="fading bg-white border-4 mb-2 md:mb-0 border-black rounded-[30px]  p-6 relative group hover:-translate-y-3 transition-all duration-300 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000]">
                            <div className="absolute -top-6 -right-6 bg-black text-white w-12 h-12 flex items-center justify-center rounded-full text-xl shadow-lg wiggle transform rotate-6">
                                <FaPoundSign />
                            </div>
                            <h3 className="text-2xl font-gulfs text-black mb-2 uppercase">3. You Earn</h3>
                            <p className="text-gray-600 text-lg mb-6 leading-snug">
                                Once they reach £1,000 lifetime GMV, you get a £50 reward ready for Stripe payout.
                            </p>
                        </div>
                        </StaggerItem>

                    </div>

                    {/* CTA Section */}
                    <div className="mt-12 text-center relative">
                        <Link href="/refer-and-earn" 
                            className="relative inline-flex items-center gap-4 bg-black text-white font-black text-md md:text-lg py-3 px-6 md:py-4: mdpx-12 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 hover:rotate-1 transition-all duration-300 uppercase tracking-wide group" >
                            <span>Get Your Referral Link</span>
                            <FaRocket className="group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                        </Link>
                        <div className="mt-6 flex justify-center items-center gap-2 text-pink-200 text-sm font-bold uppercase tracking-widest">
                            No limit on how many creators you can refer!
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}