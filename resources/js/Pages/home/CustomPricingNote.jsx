import { useCallback } from 'react';
import FadeIn from '@/Components/animations/FadeIn';

/**
 * "Custom pricing available to high earners."
 *
 * A full band under the hero. It speaks to a handful of people — a creator
 * already earning enough to negotiate — but it has to be found by them at a
 * glance while everyone else scrolls past, so it is loud rather than discreet.
 *
 * ⚠️ THIS SECTION NO LONGER HAS A BAND COLOUR, and the note that used to sit
 * here ("MINT IS THIS SECTION'S OWN COLOUR… black hero → this → yellow") is
 * void. `PageCanvas` replaced every full-bleed band with one continuous dark
 * field, so the section is transparent and its contrast decisions are now made
 * against dark, not mint. Every colour choice below was re-derived on that
 * basis; do not restore a `bg-*` here — a section with its own background cuts
 * the canvas and reintroduces the seams it removed.
 *
 * ⚠️ It advertises a NEGOTIATION, not a product. No percentages anywhere:
 * publishing a number turns a case-by-case arrangement into an expectation, and
 * the real rates differ per creator AND per payment method (see
 * CreatorFeeResolver). The oversized % is the subject's glyph, not a figure.
 *
 * ⚠️ Copy is a Stripe-facing surface — the content-first ban list applies here
 * in full (no gift / tip / donation / fundraise / bill wording).
 */
export default function CustomPricingNote() {
    /**
     * ⚠️ Intercom is NOT loaded for logged-out visitors (see
     * IntercomProviderFixed — it returns early with "no Intercom" when there is
     * no authenticated user), and the landing page is mostly read by exactly
     * those people. So "drop us a chat" would be a dead CTA for the audience it
     * is aimed at.
     *
     * Open the messenger when it genuinely exists, and fall back to the support
     * address the footer already uses. A prefilled subject means whoever picks
     * it up knows why they were written to.
     */
    const startChat = useCallback((event) => {
        if (typeof window !== 'undefined' && typeof window.Intercom === 'function') {
            event.preventDefault();
            window.Intercom('showNewMessage', "I'd like to talk about custom pricing.");
        }
        // Otherwise the anchor's own mailto href takes over — no preventDefault.
    }, []);

    return (
        <section
            className="relative overflow-hidden px-4 py-12 md:py-24"
            aria-labelledby="custom-pricing-note"
        >
            {/*
             * The signature: the subject's own glyph, oversized and bled off the
             * right edge. It is the one thing that says "this band is about a
             * rate" without printing a rate, which the product rule forbids.
             */}
            <span
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 top-1/2 -translate-y-1/2 select-none font-gulfs leading-none text-white/[0.055] md:-right-16"
                style={{ fontSize: 'clamp(230px, 42vw, 560px)' }}
            >
                %
            </span>

            {/*
             * One column, left. The % owns the right half — a button floating on
             * top of it left a long dead gap between the sentence and the action,
             * and put the CTA's shadow over the graphic.
             */}
            <div className="relative z-10 mx-auto max-w-6xl">
                <div className="max-w-[640px]">
                    <div className="min-w-0">
                        <FadeIn y={16} duration={0.5}>
                            <div className="inline-block -rotate-2">
                                <span className="inline-block rounded-full bg-black px-4 py-1 font-gulfs text-[12px] uppercase tracking-widest text-white">
                                    For high earners
                                </span>
                            </div>
                        </FadeIn>

                        <FadeIn y={20} delay={0.08} duration={0.6}>
                            <h2
                                id="custom-pricing-note"
                                className="mt-5 font-gulfs text-3xl uppercase leading-none tracking-[2px] text-white md:text-5xl lg:text-[56px]"
                            >
                                Custom pricing
                                <br />
                                {/*
                                 * Pink carries the accent as a RULE, not as ink —
                                 * the hero's own device under "WISHLIST". On the
                                 * old mint band this was forced (pink on mint is
                                 * 2.53:1, below even the 3:1 large-text floor); on
                                 * the dark canvas pink text would now pass at
                                 * 5.56:1, but the rule is kept because it matches
                                 * the hero and keeps one accent doing one job.
                                 */}
                                <span className="inline-block border-b-[6px] border-[#FF007F] pb-1 md:border-b-8">
                                    for high earners
                                </span>
                            </h2>
                        </FadeIn>

                        <FadeIn y={20} delay={0.16} duration={0.6}>
                            <p className="mt-5 max-w-[34ch] text-base font-medium leading-relaxed text-white/65 md:text-xl">
                                Already earning at scale? We agree bespoke supporter fees
                                case by case.
                            </p>
                        </FadeIn>
                    </div>

                    <FadeIn y={20} delay={0.24} duration={0.6} className="mt-8">
                        {/*
                         * 🚨 THIS BUTTON WAS BLACK ON BLACK. The rationale that put
                         * it there — "the page's CTA pill is pink, which on a mint
                         * band is two brand colours fighting" — inverted the day
                         * `PageCanvas` removed the mint band, and the button was
                         * never revisited. Measured live it rendered
                         * `background-color: rgb(0,0,0)` with `border-color:
                         * rgb(0,0,0)` over a near-black canvas: the single action
                         * aimed at the platform's highest-value creators was the
                         * most recessive element in its own section.
                         *
                         * ⚠️ Pink fill takes BLACK ink, never white. White on
                         * #FF007F is 3.78:1 and fails AA; black is 5.56:1 and
                         * passes. Same rule as the `WaysToGetPaid` payout terminus,
                         * which is the page's other filled pink block.
                         */}
                        <a
                            href="mailto:support@spennypiggy.co?subject=Custom%20pricing%20enquiry"
                            onClick={startChat}
                            /* ⚠️ No hover lift and no hover scale. A bare
                               `hover:-translate-y-1` with no offset-shadow partner is
                               the same "grow on hover" gimmick the client removed
                               site-wide; a filled accent signals hover by brightness. */
                            className="group inline-flex min-h-[48px] w-full shrink-0 items-center justify-center gap-3 rounded-full border-[3px] border-[#FF007F] bg-[#FF007F] px-7 py-3 font-gulfs text-base uppercase tracking-wide text-black transition-[filter] duration-200 hover:brightness-110 active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white motion-reduce:transition-none sm:w-auto md:text-lg"
                        >
                            Drop us a chat
                            <span
                                aria-hidden="true"
                                className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                            >
                                &rarr;
                            </span>
                        </a>
                    </FadeIn>
                </div>
            </div>
        </section>
    );
}
