import { useCallback } from 'react';
import FadeIn from '@/Components/animations/FadeIn';

/**
 * "Custom pricing available to high earners."
 *
 * A quiet strip near the top of the landing page, not a section. It speaks to a
 * handful of people — a creator already earning enough to negotiate — and giving
 * it a full section would push the pitch aimed at everyone else further down.
 *
 * ⚠️ It advertises a NEGOTIATION, not a product. Deliberately no percentages:
 * publishing a number turns a case-by-case arrangement into an expectation, and
 * the rates differ per creator and per payment method. The conversation is the
 * call to action.
 *
 * ⚠️ Copy is a Stripe-facing surface — the content-first ban list applies here in
 * full (no gift / tip / donation / fundraise / bill wording).
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
     * address the footer already uses. A prefilled subject means whoever picks it
     * up knows why they were written to.
     */
    const startChat = useCallback((event) => {
        if (typeof window !== 'undefined' && typeof window.Intercom === 'function') {
            event.preventDefault();
            window.Intercom('showNewMessage', "I'd like to talk about custom pricing.");
        }
        // Otherwise the anchor's own mailto href takes over — no preventDefault.
    }, []);

    return (
        <section className="px-4 py-6 md:py-8" aria-labelledby="custom-pricing-note">
            <FadeIn y={16} duration={0.4}>
                <div className="mx-auto flex max-w-4xl flex-col items-start gap-3 rounded-box border-[3px] border-black bg-white p-5 shadow-[6px_6px_0px_0px_#05EFB8] sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:p-6">
                    <div className="min-w-0">
                        <span className="mb-2 inline-block rounded-full bg-[#E6EA7B] px-3 py-1 text-[11px] font-black uppercase tracking-widest text-black">
                            For high earners
                        </span>
                        <h2
                            id="custom-pricing-note"
                            className="text-[17px] font-black leading-snug text-black md:text-[19px]"
                        >
                            Custom pricing available to high earners.
                        </h2>
                        <p className="mt-1 text-[14px] text-black/70">
                            Already earning at scale? We agree bespoke rates case by case.
                        </p>
                    </div>

                    {/* ≥44px touch target, and it reads as one action on a phone. */}
                    <a
                        href="mailto:support@spennypiggy.co?subject=Custom%20pricing%20enquiry"
                        onClick={startChat}
                        className="inline-flex min-h-[44px] w-full shrink-0 items-center justify-center rounded-box-sm border-[3px] border-black bg-[#FF007F] px-5 py-2.5 text-[14px] font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black motion-reduce:transition-none sm:w-auto"
                    >
                        Drop us a chat
                    </a>
                </div>
            </FadeIn>
        </section>
    );
}
