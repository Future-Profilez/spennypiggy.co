import { FaUniversity } from 'react-icons/fa';
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';

/**
 * Landing-page announcement for Pay by Bank / Open Banking.
 *
 * Signature: a boarding-pass ticket — the money "travels" straight from the
 * supporter's bank to the creator, cleared across UK / EU / US. The stub
 * carries region stamps (GBP · Pay by Bank / EUR · SEPA / USD · ACH); the
 * main pass shows the lower bank price. Editorial, distinctive, on-brand.
 * Neo-brutalist: dark, font-gulfs, #FF007F / #A2E4B8, hard shadows, mono data.
 */
export default function PayByBankAnnouncement() {
    const stamps = [
        { flag: '🇬🇧', code: 'GBP', rail: 'Pay by Bank', tilt: '-rotate-6' },
        { flag: '🇪🇺', code: 'EUR', rail: 'SEPA', tilt: 'rotate-3' },
        { flag: '🇺🇸', code: 'USD', rail: 'ACH', tilt: '-rotate-3' },
    ];

    return (
        <div
            className="bg-transparent py-20 md:py-28 px-4 relative overflow-x-hidden"
        >
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
                <div className="absolute top-10 right-10 w-40 h-40 bg-[#A2E4B8] rounded-full mix-blend-screen filter blur-2xl opacity-25 floating-shape"></div>
                <div className="absolute -bottom-10 left-1/4 w-64 h-64 bg-[#FF007F] rounded-full mix-blend-screen filter blur-2xl opacity-20 floating-shape" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="max-w-5xl mx-auto relative z-10">
                {/* Heading */}
                <div className="text-center mb-10 md:mb-16">
                    <FadeIn y={20} duration={0.5}>
                        <div className="inline-block transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                            <span className="bg-[#A2E4B8] text-black font-black px-4 py-1 uppercase tracking-widest text-sm rounded-full mb-4 inline-block">
                                🏦 New — Pay by Bank
                            </span>
                        </div>
                    </FadeIn>
                    <FadeIn x={-80} y={0} delay={0.1} duration={0.7}>
                        <h2 className="uppercase fading text-3xl md:text-4xl lg:text-6xl font-gulfs tracking-[2px] text-white mb-6 leading-none drop-">
                            Your money, <br />
                            <span className="uppercase text-gradient-wishlist tracking-[2px] animate-pulse">cleared for takeoff.</span> ✈️
                        </h2>
                    </FadeIn>
                    <FadeIn y={20} delay={0.2}>
                        <p className="fading text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed">
                            Pay straight from your bank across the UK, Europe and the US — lower fees, no card required.
                        </p>
                    </FadeIn>
                </div>

                {/* ── SIGNATURE: boarding pass ── */}
                <FadeIn y={30} delay={0.15} duration={0.7}>
                    <div className="relative">
                        {/* mint glow */}
                        <div className="pointer-events-none absolute -inset-3 bg-[#A2E4B8] opacity-15 blur-2xl rounded-[40px]" aria-hidden="true"></div>

                        <div className="max-w-[800px] m-auto relative grid md:grid-cols-[1fr_auto] bg-gray-900 border-[3px] border-[#A2E4B8] rounded-[26px] overflow-hidden">
                            {/* Main pass */}
                            <div className="p-6 md:p-9">
                                <div className="flex items-center justify-between mb-6">
                                    <span className="inline-flex items-center gap-2 text-[#A2E4B8] font-black uppercase tracking-widest text-sm">
                                        <FaUniversity /> Pay by Bank
                                    </span>
                                    <span className="text-black text-[11px] font-black uppercase tracking-widest bg-[#A2E4B8] rounded-full px-2.5 py-1">Boarding now</span>
                                </div>

                                {/* From → To → Fee */}
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-7">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">From</p>
                                        <p className="font-black text-white text-lg md:text-xl mt-1">🏦 Your bank</p>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">To</p>
                                        <p className="font-black text-white text-lg md:text-xl mt-1">🐷 The creator</p>
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Fees</p>
                                        <p className="font-black text-[#A2E4B8] text-lg md:text-lg mt-1 font-mono">Lower than card</p>
                                    </div>
                                </div>

                                {/* Price + method */}
                                <div className="flex flex-wrap items-end justify-between gap-4 pt-5 border-t-2 border-dashed border-white/15">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">You pay</p>
                                        <p className="mt-1 font-mono font-black text-white leading-none">
                                            <span className="text-4xl md:text-4xl">£115</span>
                                            <span className="text-lg text-gray-500 line-through ml-3">£121</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Method</p>
                                        <p className="mt-1 font-mono font-black text-white text-base md:text-lg tracking-widest">PAY BY BANK</p>
                                    </div>
                                </div>

                                {/* Barcode */}
                                <div
                                    className="mt-6 h-11 rounded-[3px] opacity-80"
                                    aria-hidden="true"
                                    style={{
                                        background:
                                            'repeating-linear-gradient(90deg,#fff 0 2px,transparent 2px 4px,#fff 4px 7px,transparent 7px 9px,#fff 9px 12px,transparent 12px 16px)',
                                    }}
                                ></div>
                                <p className="mt-2 font-mono text-[11px] tracking-[0.3em] text-gray-500">SPNYP · OPEN BANKING · NO CARD REQUIRED</p>
                            </div>

                            {/* Perforated stub with region stamps */}
                            <div className="relative bg-black p-6 md:p-7 flex md:flex-col flex-wrap gap-3 md:gap-4 justify-center border-t-[3px] md:border-t-0 md:border-l-[3px] border-dashed border-[#A2E4B8]">
                                {/* punched-hole notch on the perforation */}
                                <span aria-hidden="true" className="hidden md:block absolute -left-[13px] -top-[13px] w-6 h-6 rounded-full bg-black border-[3px] border-[#A2E4B8]"></span>
                                <span aria-hidden="true" className="hidden md:block absolute -left-[13px] -bottom-[13px] w-6 h-6 rounded-full bg-black border-[3px] border-[#A2E4B8]"></span>
                                {stamps.map((s, i) => (
                                    <StaggerItem key={s.code} index={i} y={16} rotate={0} stagger={0.12} duration={0.5}>
                                        <div className={`transform ${s.tilt} border-[3px] border-dashed border-[#A2E4B8] rounded-2xl px-4 py-2.5 text-center min-w-[96px]`}>
                                            <div className="text-2xl leading-none !text-white">{s.flag}</div>
                                            <div className="font-mono font-black text-[#A2E4B8] text-base leading-none mt-1 tracking-wide">{s.code}</div>
                                            <div className="text-white/70 text-[11px] font-black uppercase tracking-[0.14em] mt-1">{s.rail}</div>
                                        </div>
                                    </StaggerItem>
                                ))}
                            </div>
                        </div>
                    </div>
                </FadeIn>

                <p className="text-center pt-10 md:pt-14 text-white/70 font-medium">
                    Choose Pay by Bank at checkout for a lower price — the creator still receives exactly what they set.
                </p>
            </div>
        </div>
    );
}
