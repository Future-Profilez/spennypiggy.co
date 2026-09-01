import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import Footer from '../../includes/Footer';
import LiveBar from '../../includes/LiveBar';
import spennypiggy from '../../../assets/img/logo.png';
import { FaBolt, FaBriefcase, FaBox, FaCheckCircle, FaDollarSign, FaFire, FaGift, FaHeart, FaStar, FaUsers } from 'react-icons/fa';
import Header from '@/includes/Header';

const PRIDE_LIVEBAR_ITEMS = [
 "🏳️‍🌈 GET PAID TO BE YOU ",
 "STOP POSTING FOR FREE ",
 "💅 LIKES ARE CUTE, PAYOUTS ARE CUTER ",
 "💸 MONETISE THE ATTENTION ",
];

export default function PrideLanding() {
    const [scrolled, setScrolled] = useState(false);
    const scrolledRef = useRef(false);

    useEffect(() => {
        const handleScroll = () => {
            const next = window.scrollY > 50;
            if (next === scrolledRef.current) return;
            scrolledRef.current = next;
            setScrolled(next);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const getUTMLink = (baseRoute) => {
        return `${route(baseRoute)}?utm_source=pride_qr&utm_medium=tshirt&utm_campaign=pride_creator_signup`;
    };

    const features = useMemo(() => {
        return [
            { icon: FaGift, color: "from-[#FF007F] to-[#ff4da6]", title: "Wishlists", desc: "Let fans buy you exactly what you want. No shipping address needed." },
            { icon: FaDollarSign, color: "from-[#00F0FF] to-[#0099ff]", title: "Tips & Payments", desc: "Direct financial support from your community. Fast payouts." },
            { icon: FaBox, color: "from-[#7000FF] to-[#b366ff]", title: "Digital Goods", desc: "Sell exclusive content, photos, guides, and downloadable files." },
            { icon: FaUsers, color: "from-[#FFB800] to-[#ffda66]", title: "Memberships", desc: "Recurring monthly revenue from your most loyal VIP fans." },
            { icon: FaBriefcase, color: "from-[#FF0055] to-[#ff6699]", title: "Paid Tasks", desc: "Accept custom requests, shoutouts, and paid commissions safely." },
        ];
    }, []);

    return (
        <div className="pride-page min-h-dvh bg-[#050505] text-white font-poppins selection:bg-[#FF007F] selection:text-white relative">
            <Head title="Pride - Spenny Piggy | Get Paid For It" />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 y2k-grid"></div>
                <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#FF007F]/20 blur-[100px] hidden md:block"></div>
                <div className="absolute top-[30%] right-[-20%] w-[400px] h-[400px] rounded-full bg-[#7000FF]/20 blur-[120px] hidden md:block"></div>
                <div className="absolute bottom-[-10%] left-[10%] w-[300px] h-[300px] rounded-full bg-[#00F0FF]/15 blur-[100px] hidden md:block"></div>
            </div>

 {/* <header className={`hidden fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'py-3 bg-[#050505]/80 backdrop-blur-xl border-b border-white/10 ' : 'py-4 bg-transparent'}`}>
                <div className="max-w-6xl mx-auto px-4 md:px-6 flex justify-between items-center">
                    <Link href="/" className="relative group">
 <div className="absolute -inset-2 bg-gradient-to-r from-[#FF007F] to-[#00F0FF] rounded-box blur opacity-0 group-hover:opacity-30 transition duration-500"></div>
                        <img src={spennypiggy} alt="Spenny Piggy" className="h-10 md:h-14 relative z-10" />
                    </Link>
 <a href={getUTMLink('register')} className="flex items-center gap-1.5 md:gap-2 px-4 py-2 md:px-6 md:py-2.5 text-[12px] md:text-xs font-black uppercase tracking-widest text-white bg-transparent border-2 border-[#FF007F] rounded-box hover:bg-[#FF007F] hover:text-black transition-all duration-300 ">
                        Start Earning <FaFire className="w-4 h-4 md:w-3.5 md:h-3.5" />
                    </a>
                </div>
            </header> */}

            <Header />

            {/* Scrolling Marquee Top using LiveBar */}
 <div className="relative z-20 mt-[20px] md:mt-[20px] w-full transform -rotate-1 ">
                <LiveBar
                    livebartest={PRIDE_LIVEBAR_ITEMS}
                    classes="w-full"
                    color="bg-gradient-to-r from-[#FF007F] via-[#7000FF] to-[#00F0FF]"
                    textClass="mx-4 text-black font-black uppercase tracking-widest text-[14px] md:text-sm whitespace-nowrap mb-0"
                />
            </div>

            {/* Hero Section */}
            <section className="containerbox mx-auto">
 <div className="relative z-10 pt-12 md:pt-16 pb-14 px-3 text-center ">
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-60">
                    <FaStar className="text-[#FF007F] w-6 h-6 absolute top-0 left-[15%] animate-pulse motion-reduce:animate-none" />
                    <FaStar className="text-[#00F0FF] w-8 h-8 absolute top-16 right-[15%] animate-pulse delay-150 motion-reduce:animate-none" />
                    <FaHeart className="text-[#7000FF] w-5 h-5 absolute bottom-10 left-[25%] animate-bounce motion-reduce:animate-none" />
                </div>
                
                {/* 100% Sticker */}
                <div className="absolute -top-1 right-2
                md:right-[15%] lg:right-[20%] z-20
 transform rotate-12">
 {/* One padding. `p-4 … p-3` on the same element is a dead class
 and a reader has to work out which one won. */}
 <div className="p-3 bg-[#FFB800] text-black font-black uppercase text-center rounded-full border-4 border-black w-24 h-24 md:w-28 md:h-28 flex items-center justify-center animate-pulse motion-reduce:animate-none">
 <span className="leading-tight text-[12px]">Keep<br/><span className="text-sm ">100%</span><br/>Earnings!</span>
                    </div>
                </div>

 <div className="inline-block mb-5 px-6 py-2 rounded-box border border-white/20 bg-white/5 backdrop-blur-md">
                    <span className="text-[14px] md:text-sm font-bold tracking-widest uppercase bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] to-[#00F0FF]">
                        ✨ The Ultimate Creator Infrastructure ✨
                    </span>
                </div>
 {/* `text-6xl` (60px) at 390px pushed "THINK YOU'RE" onto three ragged
 lines inside a 326px measure. 48px is the base; the big sizes
 resume the moment there is room for them. */}
                <h1 className="font-gulfs text-5xl sm:text-6xl lg:text-7xl leading-[1.1] tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-300 mb-3 drop-shadow-xl">
                    THINK YOU'RE <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#FF007F] via-[#ff4da6] to-[#FF007F] neon-text-pink">SEXY?</span>
                </h1>
                <h2 className="font-poppins font-black italic text-3xl md:text-4xl mt-3 mb-8 text-[#00F0FF] neon-text-blue transform -rotate-1">
                    GET PAID FOR IT.
                </h2>
                <p className="text-xl md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                    Your face has operating costs. Stop giving away your content to algorithms and <span className="text-white font-bold border-b-2 border-[#FF007F]">start building your empire.</span>
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <a href={getUTMLink('register')} className="group relative w-full sm:w-auto">
 <div className="absolute -inset-1 bg-gradient-to-r from-[#FF007F] to-[#7000FF] rounded-box blur opacity-70 group-hover:opacity-100 transition duration-200"></div>
 <div className="relative px-8 py-4 text-lg md:text-base font-black uppercase tracking-widest text-white bg-black rounded-box border border-white/10 group-hover:bg-[#FF007F] group-hover:border-[#FF007F] group-hover:text-black transition-all duration-300 flex items-center justify-center gap-2">
                            Start Earning <FaBolt className="w-6 h-6 md:w-5 md:h-5 group-hover:animate-bounce motion-reduce:animate-none" />
                        </div>
                    </a>
                </div>
            </div>
            </section>

            {/* QR Campaign Section - Polaroid Style */}
            <section className="relative z-10 py-10 px-6">
                <div className="max-w-xl mx-auto">
 <div className="glass-card rounded-box p-1.5 transform rotate-1 ">
 <div className="border border-white/10 rounded-box p-8 md:p-8 py-10 text-center bg-gradient-to-b from-white/5 to-transparent relative ">
                            {/* Decorative tape */}
 <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/20 backdrop-blur-md transform -rotate-2 rounded-full "></div>
 
                            <FaHeart className="w-14 h-14 md:w-12 md:h-12 text-[#FF007F] mx-auto mb-5 animate-pulse motion-reduce:animate-none drop-shadow-[0_0_10px_rgba(255,0,127,0.6)]" />
                            <h3 className="fading font-gulfs text-4xl md:text-4xl tracking-wider mb-4 leading-tight">SCANNED THIS <br/> FROM PRIDE?</h3>
 <div className="fading bg-black/50 inline-block px-6 py-3 md:px-5 md:py-2.5 rounded-box mb-8 border border-white/10">
                                <p className="text-xl md:text-xl text-[#00F0FF] font-black italic">"Good. That means the shirt worked."</p>
                            </div>
                            <br/>
 <a href={getUTMLink('register')} className="fading inline-flex items-center gap-2 px-8 py-4 md:px-6 md:py-3 text-base md:text-sm font-bold uppercase tracking-wider text-black bg-white rounded-box hover:bg-gray-200 transition-all ">
                                Claim My Creator Page
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pride Messaging Section */}
            <section className="relative z-10 py-16 px-6 bg-gradient-to-b from-transparent via-[#FF007F]/10 to-transparent border-y border-white/5 mt-8">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="fading font-gulfs text-4xl md:text-5xl tracking-wider mb-6 leading-tight">
                        PRIDE IS <span className="text-[#FF007F]">PROTEST.</span><br/>
                        PRIDE IS <span className="text-[#7000FF]">POWER.</span><br/>
                        PRIDE IS <span className="text-[#00F0FF]">BUSINESS.</span>
                    </h2>
                    <p className="fading text-xl md:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed font-medium">
                        We celebrate LGBTQ+ creators and queer entrepreneurship. Support local LGBTQ+ talent. Get spoiled professionally, because <span className="text-white font-bold italic">likes don't pay the bills.</span>
                    </p>
                </div>
            </section>

            {/* Monetisation Features (Neon Grid) */}
            <section id="how-it-works" className="relative z-10 py-16 px-6">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="fading font-gulfs text-4xl md:text-5xl tracking-wider mb-5">HOW TO SECURE THE BAG</h2>
 <p className="fading text-white/60 text-lg md:text-lg font-medium">Turn your audience into multiple income streams instantly.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, idx) => (
 <div key={idx} className="fading glass-card rounded-box p-8 md:p-6 transition-colors duration-200 group relative ">
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                                
                                <div className="relative z-10">
 <div className={`w-14 h-14 md:w-12 md:h-12 rounded-box-sm flex items-center justify-center mb-5 md:mb-4 bg-gradient-to-br ${feature.color} transition-[filter] duration-300 group-hover:brightness-110`}>
                                        <feature.icon className="text-white w-7 h-7 md:w-6 md:h-6" />
                                    </div>
                                    <h3 className="text-2xl md:text-xl font-black mb-3 md:mb-2">{feature.title}</h3>
 <p className="text-white/60 text-base md:text-base leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Founder Bonus Section */}
            <section className="relative z-10 py-12 px-6">
                <div className="max-w-5xl mx-auto">
 <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] border border-[#FFB800]/50 rounded-box p-8 md:p-10 relative ">
 <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB800]/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                            <div className="flex-1 text-center md:text-left">
 <div className="fading inline-block px-4 py-1 rounded-box bg-[#FFB800]/20 text-[#FFB800] font-bold text-xs uppercase tracking-widest mb-5 border border-[#FFB800]/30">
                                    Limited Time Offer
                                </div>
                                <h3 className="fading font-gulfs text-4xl md:text-4xl text-white mb-5 uppercase tracking-wider">
                                    30-DAY <span className="text-[#FFB800]">FOUNDER</span> BONUS
                                </h3>
                                <p className="fading text-gray-300 text-lg md:text-lg mb-8 leading-relaxed">
                                    Join now and get exclusive onboarding incentives. We heavily reward our early creators who bring their audience to the platform.
                                </p>
 <ul className=" text-left grid grid-cols-1 gap-4 md:grid-cols-2 mx-auto md:mx-0">
 <li className="fading flex items-center min-h-[100px] gap-4 bg-white/5 p-4 rounded-box border border-white/10">
 <div className="bg-[#FFB800]/20 p-2 rounded-box-sm "><FaCheckCircle className="text-[#FFB800] w-6 h-6" /></div>
                                        <span className="font-bold text-base md:text-base">Special bonus on your first 30 days</span>
                                    </li>
 <li className="fading flex items-center min-h-[100px] gap-4 bg-white/5 p-4 rounded-box border border-white/10 border-l-4 border-l-[#FFB800]">
 <div className="bg-[#FFB800]/20 p-2 rounded-box-sm "><FaDollarSign className="text-[#FFB800] w-6 h-6" /></div>
                                        <span className="font-bold text-base md:text-base text-[#FFB800]">Up to 10% extra a month! For 12 months.</span>
                                    </li>
 <li className="fading flex items-center min-h-[100px] gap-4 bg-white/5 p-4 rounded-box border border-white/10">
 <div className="bg-[#FFB800]/20 p-2 rounded-box-sm "><FaCheckCircle className="text-[#FFB800] w-6 h-6" /></div>
                                        <span className="font-bold text-base md:text-base">Priority VIP creator support</span>
                                    </li>
 <li className="fading flex items-center min-h-[100px] gap-4 bg-white/5 p-4 rounded-box border border-white/10">
 <div className="bg-[#FFB800]/20 p-2 rounded-box-sm "><FaCheckCircle className="text-[#FFB800] w-6 h-6" /></div>
                                        <span className="font-bold text-base md:text-base">Exclusive Founder badge on profile</span>
                                    </li>
                                </ul>
                            </div>
                            {/* <div className="w-full md:w-1/3 flex justify-center">
 <div className="w-48 h-48 bg-gradient-to-tr from-[#FFB800] to-[#FF007F] rounded-box p-1.5 animate-pulse ">
 <div className="w-full h-full bg-[#050505] rounded-box flex items-center justify-center">
                                        <img src={spennypiggy} alt="Piggy" className="w-28 drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                                    </div>
                                </div>
                            </div> */}
                        </div>
                    </div>
                </div>
            </section>

            {/* LGBTQ+ Business Positioning */}
            <section className="relative z-10 py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
 <div className="fading inline-block mb-6 p-4 rounded-box bg-[#FF007F]/10 border border-[#FF007F]/30">
                        <FaStar className="w-8 h-8 text-[#FF007F]" />
                    </div>
                    <h2 className="fading uppercase text-4xl md:text-5xl font-black mb-6 leading-tight">
                        Your identity is not the product.<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007F] to-[#7000FF]">Your creativity is.</span>
                    </h2>
                    <p className="fading text-xl md:text-xl text-gray-300 max-w-2xl mx-auto font-medium">
                        Spenny Piggy is the infrastructure for LGBTQ+ creators. We handle the payments, risk, and platform mechanics so you can focus on being absolutely iconic.
                    </p>
                </div>
            </section>

            {/* Conversion Block */}
            <section className="relative z-10 py-24 px-6 text-center">
                <h2 className="fading font-gulfs text-5xl md:text-5xl tracking-wide mb-4 text-white drop-shadow-lg">
                    STILL POSTING FOR FREE?
                </h2>
                <h3 className="fading font-poppins font-black italic text-3xl md:text-4xl text-[#FF007F] mb-10 neon-text-pink">
                    BESTIE. IN THIS ECONOMY?
                </h3>
                <a href={getUTMLink('register')} className="fading group relative inline-block">
 <div className="absolute -inset-1.5 bg-gradient-to-r from-[#FF007F] via-[#7000FF] to-[#00F0FF] rounded-box blur-md opacity-70 group-hover:opacity-100 animate-pulse transition duration-200"></div>
 <div className="relative px-10 py-5 text-xl md:text-xl font-black uppercase tracking-widest text-black bg-white rounded-box transition-colors duration-200 group-hover:bg-white/90">
                        Create My Spenny Piggy
                    </div>
                </a>
            </section>

            {/* Footer */}
            <div className="relative z-10 border-t border-white/10 bg-black/50">
                <Footer />
            </div>

            {/* Sticky Mobile CTA — bottom-bar-safe: this page mounts no layout, so no bottom bar exists here */}
 <div className={`fixed bottom-0 left-0 w-full p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-[#050505]/90 backdrop-blur-xl border-t border-[#FF007F]/30 z-50 transform transition-transform duration-500 md:hidden flex flex-col items-center justify-center ${scrolled ? 'translate-y-0' : 'translate-y-full'}`}>
 <p className="text-[12px] text-[#00F0FF] font-bold mb-1.5 uppercase tracking-widest text-center">Hot people deserve revenue streams</p>
 <a href={getUTMLink('register')} className="w-full py-3 text-center font-black text-sm uppercase tracking-widest text-black bg-gradient-to-r from-[#FF007F] to-[#ff4da6] rounded-box transition-[filter] duration-200 active:brightness-95">
                    Start Earning
                </a>
            </div>
        </div>
    );
}
