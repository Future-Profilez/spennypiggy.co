import { Link, usePage } from "@inertiajs/react";
import { FaBolt, FaMagic, FaShieldAlt, FaRocket } from 'react-icons/fa';
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';

export default function PaidTasksAnnouncement() {
    const { auth } = usePage().props;
    const isCreator = auth && auth.user && auth.user.role === 1;
    return (
        <>
            <section
            className="relative bg-transparent py-12 md:py-28 px-4 overflow-x-hidden"
        >

                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-8 md:mb-16">
                        <FadeIn y={20} duration={0.5}>
                            <span className="inline-block bg-[#E6EA7B] text-black font-gulfs px-4 py-1 uppercase tracking-[3px] text-[11px] rounded-full border-2 border-black mb-4">
                                ✨ New Feature ✨
                            </span>
                        </FadeIn>

                        <FadeIn x={-80} y={0} delay={0.1} duration={0.7}>
                            <h2 className="font-gulfs uppercase text-white tracking-tight text-3xl md:text-4xl lg:text-5xl mb-6 leading-none">
                                Get Paid for Requests <br/>
                                On Your Terms 💸
                            </h2>
                        </FadeIn>

                        <FadeIn y={20} delay={0.2}>
                            <p className="text-xl md:text-2xl text-white/70 max-w-4xl mx-auto font-medium leading-relaxed">
                                Supporters pay before requesting a task. You approve, set the rules, and deliver on your own time.
                                Late delivery? Refunds follow your terms — enforced automatically.
                            </p>
                        </FadeIn>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 md:gap-y-10 px-2 md:px-4">

                        <StaggerItem index={0} x={-80} y={0} rotate={-2} stagger={0.15} duration={0.6}>
                        <div className="h-full bg-[#0d0a16] border-2 mb-2 md:mb-0 border-[#FF007F] rounded-[24px] p-6 md:p-8 relative group hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300 motion-reduce:hover:transform-none motion-reduce:">
                            <div className="absolute -top-6 -right-6 bg-[#FF007F] text-white w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl wiggle transform rotate-12">
                                <FaBolt />
                            </div>
                            <h3 className="font-gulfs uppercase text-white tracking-tight text-xl md:text-3xl mb-2 md:mb-2">Instant <br/>Access</h3>
                            <p className="text-white/70 text-lg mb-6 leading-snug">
                                Upload once. Get paid every time.
                                Supporters access content instantly — no back-and-forth, no delivery stress.
                            </p>
                            <div className="bg-[#0d0a16] border-2 border-[#FF007F] rounded-full p-3 flex items-center gap-3">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#05EFB8]"></div>
                                <span className="font-gulfs uppercase tracking-[3px] text-[11px] text-[#FF007F]">Passive income mode </span>
                            </div>
                        </div>
                        </StaggerItem>

                        {/* Card 2: Custom */}
                        <StaggerItem index={1} x={-80} y={0} rotate={1} stagger={0.15} duration={0.6}>
                        <div className="h-full bg-[#0d0a16] border-2 mb-2 md:mb-0 border-[#E6EA7B] rounded-[24px] p-6 md:p-8 relative group hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300 motion-reduce:hover:transform-none motion-reduce:">
                            <div className="absolute -top-6 -right-6 bg-[#E6EA7B] text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl wiggle transform -rotate-12">
                                <FaMagic />
                            </div>
                            <h3 className="font-gulfs uppercase text-white tracking-tight text-xl md:text-3xl mb-2 md:mb-2">Paid <br/> Tasks (Custom Requests)</h3>
                            <p className="text-white/70 text-lg mb-6 leading-snug">
                                Supporters want something custom?
                                They pay first. You decide the rest.
                                Approve what you want, set the rules, and deliver when it works for you.
                                No chasing. No awkwardness.
                            </p>
                            <div className="bg-[#0d0a16] border-2 border-[#E6EA7B] rounded-full p-3 flex items-center gap-3">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#05EFB8]"></div>
                                <span className="font-gulfs uppercase tracking-[3px] text-[11px] text-[#E6EA7B]">Full control. Zero pressure.
                                </span>
                            </div>
                        </div>
                        </StaggerItem>

                        {/* Card 3: Safe */}
                        <StaggerItem index={2} x={-80} y={0} rotate={-2} stagger={0.15} duration={0.6}>
                        <div className="h-full bg-[#0d0a16] border-2 mb-2 md:mb-0 border-[#05EFB8] rounded-[24px] p-6 md:p-8 relative group hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300 motion-reduce:hover:transform-none motion-reduce:">
                            <div className="absolute -top-6 -right-6 bg-[#05EFB8] text-black w-12 h-12 md:w-16 md:h-16 flex items-center justify-center rounded-full text-xl md:text-3xl wiggle transform rotate-6">
                                <FaShieldAlt />
                            </div>
                            <h3 className="font-gulfs uppercase text-white tracking-tight text-xl md:text-3xl mb-2 md:mb-2">Funds <br/> Protected </h3>
                            <p className="text-white/70 text-lg mb-6 leading-snug">


                                Paid first. Always.
You set the timeline, the rules, and the vibe.

If a task isn’t delivered on time, refunds are handled according to your terms — automatically.



                            </p>
                            <div className="bg-[#0d0a16] border-2 border-[#05EFB8] rounded-full p-3 flex items-center gap-3">
                                <div className="w-3 h-3 min-w-3 min-h-3 rounded-full bg-[#FF007F]"></div>
                                <span className="font-gulfs uppercase tracking-[3px] text-[11px] text-[#05EFB8]">PLATFORM-ENFORCED RULES
                                </span>
                            </div>
                        </div>
                        </StaggerItem>

                    </div>

                    <p className="text-center pt-6 md:pt-12 text-white/70">Clear rules reduce disputes — no awkward reminders, no unpaid “promises”.</p>

                    {/* CTA Section */}
                    {isCreator && (
                        <div className="mt-8 md:mt-12 lg:mt-20 text-center relative">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg h-32 bg-[#FF007F] rounded-full blur-3xl opacity-10"></div>
                            <Link  href="/task/dashboard"
                                className="relative inline-flex items-center gap-4 bg-white text-black font-gulfs uppercase tracking-tight text-base md:text-xl py-3 px-4 md:px-12 rounded-full border-2 border-black hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all duration-300 group" >
                                <span className="relative z-10">Turn Requests Into Income</span>
                                <FaRocket className="relative z-10 text-2xl group-hover:translate-x-2 group-hover:-translate-y-2 transition-transform" />
                            </Link>
                            <div className="mt-6 flex justify-center items-center gap-2 text-white/50 text-sm font-bold uppercase tracking-widest">
                                ❤️ Built for creators who are tired of unpaid requests
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
