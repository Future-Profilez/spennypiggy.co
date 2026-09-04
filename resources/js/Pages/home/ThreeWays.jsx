import FadeIn from '@/Components/animations/FadeIn';
import PillarCards from '@/Components/PillarCards';

/**
 * The three shapes a creator's income can take, opening the "what you sell" act.
 *
 * 🚨 IT SITS ABOVE `WaysToGetPaid`, NOT INSIDE IT, AND THAT IS THE POINT.
 * Client note, 4 Sep 2026: what separates this platform from a gifting site is
 * that a creator is paid in more than one shape — a monthly membership, a price
 * for a specific request, and a straight sale. That argument was being made by
 * a seven-card catalogue in which Memberships was the SEVENTH card and Paid
 * requests the fourth, so a visitor met the differentiator only if they read to
 * the end of it.
 *
 * Three shapes first, then the seven products underneath. The catalogue still
 * does its job; it just no longer has to carry the argument as well.
 *
 * ⚠️ NO BACKGROUND ON THE SECTION. `PageCanvas` is the page's one field and a
 * section that paints its own cuts it in half — the rule in `PageCanvas`'s own
 * docblock. The white block inside is a BLOCK, which is where solid colour is
 * allowed to live.
 */
export default function ThreeWays({ pillars = [] }) {
    if (pillars.length === 0) return null;

    return (
        <section className="relative overflow-hidden bg-transparent py-12 md:py-20">
            <div className="container relative z-10 mx-auto px-4">
                <div className="mb-8 md:mb-12">
                    <FadeIn y={20}>
                        <span className="font-gulfs text-xs uppercase tracking-[0.3em] text-[#05EFB8] md:text-sm">
                            Three shapes &middot; one account
                        </span>
                    </FadeIn>
                    <FadeIn y={24} delay={0.05}>
                        <h2 className="mb-5 mt-4 font-gulfs text-3xl uppercase leading-[0.95] tracking-tight text-white md:text-5xl">
                            Not a gifting site.
                            <br />
                            <span className="text-gradient-wishlist">
                                A place you get paid.
                            </span>
                        </h2>
                    </FadeIn>
                    <FadeIn y={20} delay={0.1}>
                        <p className="max-w-3xl font-poppins text-base leading-relaxed text-gray-300 md:text-xl">
                            Money arrives here in three shapes, and most
                            creators use more than one at a time. Everything
                            below is a version of one of them.
                        </p>
                    </FadeIn>
                </div>

                <FadeIn y={24} delay={0.15}>
                    <PillarCards pillars={pillars} />
                </FadeIn>
            </div>
        </section>
    );
}
