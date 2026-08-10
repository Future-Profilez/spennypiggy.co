import FadeIn from '@/Components/animations/FadeIn';
import WatermarkStrip from '@/Components/animations/WatermarkStrip';

export default function WhyLove() {
    return (
        <>
            <section className="bg-transparent py-12 md:py-28 relative overflow-hidden">
                <WatermarkStrip text="Stores" from={150} to={-350} opacity={0.18} className="top-4" />
                 {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    {/* Held at the same ~20% the other dark sections use. At 30–40% this
                        section bloomed far brighter than its neighbours, so the seams either
                        side of it read as a step change rather than a continuous page. */}
                    <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#FF007F] opacity-20 rounded-full mix-blend-screen filter blur-[100px] animate-float"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[#05EFB8] opacity-[0.18] rounded-full mix-blend-screen filter blur-[120px] animate-float-delayed"></div>
                </div>

                <div className="container relative px-4 mx-auto">
                    <FadeIn y={30} duration={0.6}>
                    <h2 className="fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-6 uppercase leading-none drop-shadow-lg">
                        Add From Your <span className="text-gradient-wishlist drop-shadow-none">Favourite Stores</span>
                    </h2>
                    </FadeIn>
                    <FadeIn y={20} delay={0.15}>
                    <p className="fading text-gray-300 text-base md:text-xl max-w-3xl mx-auto font-poppins leading-relaxed mb-8 md:mb-12 text-center">
                        Drop a link to anything you want onto one page. Your supporters
                        unlock and buy what's on your list, delivered straight to your door.
                    </p>
                    </FadeIn>

                    {/* The paste bar — the actual mechanic, shown rather than described.
                        This replaced a wall of eleven third-party logos (Amazon, Nike,
                        Apple, Sephora…). Two reasons, and the first is not a design one:
                        `App\Rules\NoExpenseOrBrandName` REJECTS a creator's listing for
                        naming any of those brands, so the homepage was advertising what
                        the platform's own validation refuses — and grayscale logos imply
                        partnerships that do not exist. Borrowed credibility also reads as
                        borrowed; the mechanic is ours and is the stronger claim. */}
                    <FadeIn y={24} delay={0.25}>
                    <div className="fading mx-auto max-w-2xl">
                        <div className="flex items-center gap-3 rounded-box border border-white/12 bg-white/[0.04] px-5 py-4 backdrop-blur-sm">
                            <span className="font-poppins text-xs uppercase tracking-[0.2em] text-[#05EFB8]">
                                Paste
                            </span>
                            <span className="h-4 w-px bg-white/15" />
                            <span className="truncate font-mono text-sm text-white/55">
                                https://anystore.com/the-thing-you-want
                            </span>
                            <span
                                aria-hidden
                                className="ml-auto hidden shrink-0 font-gulfs text-lg text-[#FF007F] sm:block"
                            >
                                →
                            </span>
                        </div>
                        <p className="mt-4 text-center font-poppins text-sm text-white/45">
                            Any online store. No catalogue, no integrations, no limits.
                        </p>
                    </div>
                    </FadeIn>
                </div>
            </section>
        </>
    );
}
