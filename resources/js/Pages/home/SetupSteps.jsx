import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import TiltCard from '@/Components/animations/TiltCard';

/* Chapter 01 — the "set up in minutes" promise, made concrete as 3 steps.
 *
 * ⚠️ Step 3 must never say "No fees, ever." It is not true — there is a platform
 * fee and a monthly subscription — and an unqualified free claim is a Google Ads
 * policy flag on a page that runs paid acquisition. The honest version is the
 * stronger one anyway: the creator keeps 100% of the price they LISTED, because
 * the supporter's total is grossed up at checkout to cover the fees. */
const STEPS = [
    { n: '1', emoji: '🎯', title: 'Add your items', text: 'List your content, your custom work, your products. Big or small, it all lives on one page.', accent: '#E6EA7B' },
    { n: '2', emoji: '🔗', title: 'Share your link', text: 'One link for your bio. Fans see exactly what you love.', accent: '#FF007F' },
    { n: '3', emoji: '💸', title: 'Get paid', text: 'Secure, trackable income with protection built in. You keep 100% of your listed price — supporters cover the fees at checkout.', accent: '#05EFB8' },
];

export default function SetupSteps() {
    return (
        <section className="relative bg-transparent py-12 md:py-28 overflow-hidden">
            

            <div className="container relative z-10 px-4 mx-auto text-center">
                <FadeIn y={20}>
                    <span className="font-gulfs uppercase tracking-[0.3em] text-sm text-[#FF007F]">How it works</span>
                </FadeIn>
                <FadeIn y={24} delay={0.05}>
                    <h2 className="font-gulfs uppercase text-white text-3xl md:text-5xl lg:text-6xl leading-[0.9] tracking-tight mt-4 mb-5">
                        Set up in <span className="text-gradient-wishlist">minutes</span>
                    </h2>
                </FadeIn>
                <FadeIn y={20} delay={0.1}>
                    <p className="font-poppins text-gray-300 text-base md:text-xl max-w-xl mx-auto leading-relaxed mb-16 md:mb-24">
                        Three steps from empty page to getting paid. No store, no code, no fuss.
                    </p>
                </FadeIn>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 max-w-6xl mx-auto">
                    {/* flow line connecting the steps (desktop) */}
                    <div aria-hidden className="hidden md:block absolute top-0 left-[16%] right-[16%] h-[3px] bg-gradient-to-r from-[#E6EA7B] via-[#FF007F] to-[#05EFB8] opacity-40 z-0"></div>

                    {STEPS.map((s, i) => (
                        <StaggerItem key={i} index={i} stagger={0.12} y={32} className="relative z-10">
                            <TiltCard max={6} className="rounded-box h-full">
                                <div
                                    className="relative h-full rounded-box bg-[#0d0a16] border-2 p-7 md:p-8 pt-10 text-left flex flex-col"
                                    style={{ borderColor: s.accent }}
                                >
                                    <span
                                        className="absolute -top-6 left-7 w-12 h-12 rounded-full border-2 border-black flex items-center justify-center font-gulfs text-2xl text-black"
                                        style={{ background: s.accent }}
                                    >
                                        {s.n}
                                    </span>
                                    <span className="text-4xl mb-4 leading-none">{s.emoji}</span>
                                    <h3 className="font-gulfs uppercase text-white text-2xl mb-2 leading-tight">{s.title}</h3>
                                    <p className="font-poppins text-gray-400 text-sm md:text-base leading-relaxed">{s.text}</p>
                                </div>
                            </TiltCard>
                        </StaggerItem>
                    ))}
                </div>
            </div>
        </section>
    );
}
