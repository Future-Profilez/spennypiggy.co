import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import {
    PRICE_FORMATTED,
    FREE_UNTIL_FIRST_SALE,
    SUBSCRIPTION_COPY,
} from '@/constants/creatorSubscription';

/**
 * What the platform costs a creator.
 *
 * "No charge until your first sale" is the strongest thing this page can say and
 * it lived in 11px grey under the hero as an asterisk. It gets a section.
 *
 * ⚠️ NOTHING HERE IS RETYPED. The price and the promise come from
 * `constants/creatorSubscription`, which mirrors `config/creator_subscription.php`.
 * Hardcoding the figure is exactly how `creators/Disputes.jsx` came to advertise
 * a stale £4/month for months.
 *
 * ⚠️ The free period is a CONFIG SWITCH (`free_until_first_sale`), not a
 * permanent fact — the client's stated plan is to run it during the early phase
 * and revisit. Every sentence that depends on it is branched, so switching the
 * policy off changes this section rather than leaving it advertising something
 * the billing code no longer does.
 *
 * ⚠️ No supporter fee PERCENTAGE appears here. Rates differ per payment method
 * (card and bank are priced differently) and per creator (bespoke agreements
 * exist), so any single number printed on a landing page is wrong for someone.
 * The page states that supporters see their full total before paying, and links
 * to the breakdown.
 */

/** TODO: point at the fees article itself once its help-centre URL is known. */
const FEES_ARTICLE_URL = 'https://intercom.help/spenny-piggy';

const FIGURES = [
    {
        figure: FREE_UNTIL_FIRST_SALE ? '£0' : PRICE_FORMATTED,
        label: FREE_UNTIL_FIRST_SALE ? 'Until your first sale' : '+ VAT a month, flat',
        accent: '#05EFB8',
    },
    {
        figure: PRICE_FORMATTED,
        label: FREE_UNTIL_FIRST_SALE ? '+ VAT a month after that, flat' : 'Whatever you earn, same price',
        accent: '#E6EA7B',
    },
    {
        figure: '0%',
        label: 'Commission on your sales. Ever.',
        accent: '#FF007F',
    },
];

export default function PricingSection() {
    return (
        <section className="relative bg-transparent py-12 md:py-24 overflow-hidden">
            {/* No ambient orbs here. `PageCanvas` is the page's one light source —
                a per-section orb bloomed where its section was and faded before
                the next, which is what made scrolling read as a row of coloured
                stops instead of one continuous field. */}

            <div className="container relative z-10 px-4 mx-auto">
                <div className="max-w-3xl mx-auto text-center">
                    <FadeIn y={20}>
                        <span className="font-gulfs uppercase tracking-[0.3em] text-sm text-[#05EFB8]">
                            Pricing
                        </span>
                    </FadeIn>
                    <FadeIn y={24} delay={0.05}>
                        <h2 className="font-gulfs uppercase text-white text-3xl md:text-5xl leading-[0.95] tracking-tight mt-4 mb-6">
                            {FREE_UNTIL_FIRST_SALE
                                ? <>Free until you&rsquo;re <span className="text-gradient-wishlist">earning</span></>
                                : <>One flat <span className="text-gradient-wishlist">monthly price</span></>}
                        </h2>
                    </FadeIn>

                    <FadeIn y={20} delay={0.1}>
                        <div className="font-poppins text-gray-300 text-base md:text-xl leading-relaxed space-y-4 mb-10 md:mb-14">
                            {FREE_UNTIL_FIRST_SALE && (
                                <p>
                                    {SUBSCRIPTION_COPY.promise}. {SUBSCRIPTION_COPY.reassurance}
                                </p>
                            )}
                            <p>
                                {FREE_UNTIL_FIRST_SALE ? 'Once you’re earning, it’s' : 'It’s'}{' '}
                                <span className="text-white font-semibold">{PRICE_FORMATTED} + VAT a month</span>
                                {' '}&mdash; flat, whatever you make. That covers Stripe fees, content review,
                                fraud screening and compliance.
                            </p>
                            <p className="text-white font-semibold">
                                No commission. No percentage of your sales. Cancel any time.
                            </p>
                        </div>
                    </FadeIn>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 max-w-4xl mx-auto">
                    {FIGURES.map((f, i) => (
                        <StaggerItem key={f.label} index={i} stagger={0.1} y={28}>
                            <div
                                className="h-full rounded-box border-2 bg-[#0d0a16] p-6 md:p-7 text-center"
                                style={{ borderColor: f.accent }}
                            >
                                <p
                                    className="font-gulfs leading-none text-4xl md:text-5xl"
                                    style={{ color: f.accent }}
                                >
                                    {f.figure}
                                </p>
                                <p className="font-poppins text-white/60 text-sm leading-relaxed mt-3">
                                    {f.label}
                                </p>
                            </div>
                        </StaggerItem>
                    ))}
                </div>

                <FadeIn y={16} delay={0.1}>
                    <p className="font-poppins text-white/60 text-xs md:text-sm text-center max-w-2xl mx-auto mt-8 leading-relaxed">
                        Supporters cover a platform fee at checkout and see the full total before they pay
                        &mdash;{' '}
                        <a
                            href={FEES_ARTICLE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            // py-3 rather than py-2: this is the only tappable
                            // control in the section and 44px is the floor.
                            className="text-[#05EFB8] underline underline-offset-4 hover:text-white transition-colors inline-flex items-center gap-1 py-3"
                        >
                            full breakdown here <span aria-hidden="true">&rarr;</span>
                        </a>
                    </p>
                </FadeIn>
            </div>
        </section>
    );
}
