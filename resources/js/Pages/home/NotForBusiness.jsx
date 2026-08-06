import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';

/* Chapter 04 — the three steps, told with the numeral as the artwork. */
const STEPS = [
    {
        accent: '#FF007F',
        eyebrow: 'Set up',
        title: 'Build your page',
        description:
            'Add your Wishlist, or open a storefront for exclusive content, services and products. Everything lives on one link.',
        outcome: 'Live in minutes',
    },
    {
        accent: '#E6EA7B',
        eyebrow: 'Share',
        title: 'List what you actually want',
        description:
            'Add anything from any store. Supporters unlock and buy it, delivered straight to your door.',
        outcome: 'Any store, any price',
    },
    {
        accent: '#05EFB8',
        eyebrow: 'Celebrate',
        title: 'Unlock and say thank you',
        description:
            'Show off what you unlocked with a shout-out on socials, or send a personal thank-you right on Spenny Piggy.',
        outcome: 'Supporters come back',
    },
];

export default function NotForBusiness() {
    return (
        <section className="relative py-12 md:py-28 px-4 bg-transparent overflow-x-hidden">
            <div aria-hidden className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-0 w-72 h-72 bg-[#FF007F] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-float"></div>
                <div className="absolute bottom-1/4 right-0 w-72 h-72 bg-[#05EFB8] rounded-full mix-blend-screen filter blur-[100px] opacity-20 animate-float-delayed" style={{ animationDelay: '1s' }}></div>
            </div>

            <div className="max-w-6xl mx-auto relative z-10">
                <FadeIn y={30} duration={0.6}>
                    <div className="text-center mb-14 md:mb-20">
                        <span className="font-poppins uppercase tracking-[0.3em] text-xs md:text-sm text-[#E6EA7B]">
                            Three steps
                        </span>
                        <h2 className="text-3xl md:text-4xl lg:text-5xl font-gulfs text-white mt-4 uppercase tracking-tight leading-tight">
                            How it works
                        </h2>
                    </div>
                </FadeIn>

                <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                    {/* the spine runs between the cards, so it only exists where they sit side by side */}
                    <div
                        aria-hidden
                        className="hidden md:block absolute left-[12%] right-[12%] top-1/2 h-[3px] bg-gradient-to-r from-[#FF007F] via-[#E6EA7B] to-[#05EFB8] opacity-30 z-0"
                    ></div>

                    {STEPS.map((step, index) => (
                        <StaggerItem
                            key={step.title}
                            index={index}
                            y={32}
                            stagger={0.15}
                            duration={0.6}
                            className="relative z-10"
                        >
                            <article
                                className="group relative h-full overflow-hidden rounded-[24px] border-2 bg-[#0d0a16] p-7 md:p-8 text-left transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none"
                                style={{ borderColor: step.accent }}
                            >
                                {/* the numeral is the artwork — outlined, bleeding off the corner */}
                                <span
                                    aria-hidden
                                    className="pointer-events-none absolute -top-8 -right-3 select-none font-gulfs leading-none text-[9rem] md:text-[11rem] opacity-[0.18] transition-opacity duration-300 group-hover:opacity-30 motion-reduce:transition-none"
                                    style={{
                                        color: 'transparent',
                                        WebkitTextStroke: `2px ${step.accent}`,
                                    }}
                                >
                                    {index + 1}
                                </span>

                                <span
                                    className="relative font-poppins uppercase tracking-[0.24em] text-[11px]"
                                    style={{ color: step.accent }}
                                >
                                    Step {index + 1} · {step.eyebrow}
                                </span>

                                <h3 className="relative mt-4 font-gulfs uppercase text-white text-xl lg:text-2xl leading-tight tracking-tight">
                                    {step.title}
                                </h3>

                                <p className="relative mt-3 font-poppins text-white/70 text-sm lg:text-base leading-relaxed">
                                    {step.description}
                                </p>

                                <p
                                    className="relative mt-6 pt-4 border-t border-white/10 font-poppins text-xs uppercase tracking-[0.16em]"
                                    style={{ color: step.accent }}
                                >
                                    {step.outcome}
                                </p>
                            </article>
                        </StaggerItem>
                    ))}
                </div>
            </div>
        </section>
    );
}
