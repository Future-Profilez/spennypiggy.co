import { useState } from 'react';
import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import FadeIn from '@/Components/animations/FadeIn';
import { PRICE_FORMATTED, FREE_UNTIL_FIRST_SALE } from '@/constants/creatorSubscription';
import { STABLECOIN_TIPS_ANNOUNCED, STABLECOIN_TIPS_LIVE } from '@/constants/stablecoinTips';

/**
 * ⚠️ THIS IS A PUBLIC STATEMENT OF PRICING AND PAYOUT TERMS. The version it
 * replaced said "service fee, starting at just 8%", "£29.99 per month", and a
 * "2-day roll" / "7-day roll" payout timing — none of which have been true for a
 * long time, all of it published, and all of it findable in search.
 *
 * ⚠️ The price and the free-period promise are READ FROM CONFIG, never retyped.
 * The free period is a switch (`creator_subscription.free_until_first_sale`), so
 * the answer branches on it rather than asserting it.
 *
 * ⚠️ Stablecoin Tips is ANNOUNCED, NOT BUILT. Its sentences are gated on the
 * announcement flag and are written in future tense until the feature is live.
 * They deliberately do NOT claim it settles faster than the weekly payout run —
 * the agreed specification says Coinflow payouts should follow the normal Friday
 * rhythm where practical, and whether that is even supported is unconfirmed.
 *
 * LAYOUT (rebuilt): a question RAIL with one ANSWER SLAB, not eight identical
 * accordion cards. Eight bordered cards gave every question the same weight and
 * ~2,600px of scroll; the rail shows the whole set at once, so a reader can see
 * that their question is here before deciding to read anything. The slab is the
 * only light-filled block in the section — that is the section's one bold move,
 * so everything around it stays hairline-quiet (house rule: depth is a LINE).
 *
 * ⚠️ ONE `active` INDEX DRIVES BOTH LAYOUTS. Below `lg` the same buttons render
 * as an accordion with the slab inline; at `lg` the slab moves to a sticky right
 * column. Two renderings, one state — they cannot disagree about what is open.
 */
export default function FAQ() {
  const costAnswer = FREE_UNTIL_FIRST_SALE
    ? `Nothing until your first sale. After that it's ${PRICE_FORMATTED} + VAT a month — flat, whatever you earn, cancel any time. There's no commission on your sales. Supporters cover the platform fee at checkout and see the full total before they pay.`
    : `${PRICE_FORMATTED} + VAT a month — flat, whatever you earn, cancel any time. There's no commission on your sales. Supporters cover the platform fee at checkout and see the full total before they pay.`;

  const payoutAnswer = 'Every Friday. Your earnings run Friday to Thursday and go out the following Friday, usually landing in your bank on Monday. Paid straight into your own Stripe account, in your name.'
    + (STABLECOIN_TIPS_ANNOUNCED
      ? (STABLECOIN_TIPS_LIVE
        ? ' Stablecoin Tips settle on their own rail, separately from your Stripe earnings.'
        : ' Stablecoin Tips are coming, and will settle on their own rail, separately from your Stripe earnings.')
      : '');

  const currencyAnswer = 'You can set your display currency, and supporters can view prices in theirs. Bank payments are available across the UK, parts of Europe and the US, depending on the method.'
    + (STABLECOIN_TIPS_ANNOUNCED ? ' Stablecoin Tips are in USDC.' : '');

  const faqs = [
    {
      "title": "What is Spenny Piggy?",
      "description": "The Everything Wishlist — and a whole lot more. Sell exclusive content, run memberships, take custom requests, and sell your own products, all from one page and one link. You set your prices and you keep 100% of them."
    },
    {
      // Second by design: the answer a creator and a payment reviewer both want,
      // visible without expanding anything.
      "title": "Is this a SFW platform?",
      "description": "Yes — strictly, and it's actively enforced. No nudity, no explicit content, no exceptions. Every upload is reviewed by a real person before it goes live, and every creator is identity-verified with a passport before they can earn a penny. Adult creators are welcome here for their SFW work; what you do elsewhere is your business. It's also why our payments stay switched on when other creator platforms lose theirs."
    },
    {
      "title": "How do I get paid?",
      "description": payoutAnswer
    },
    {
      "title": "How much does it cost?",
      "description": costAnswer
    },
    {
      "title": "What currencies do you offer?",
      "description": currencyAnswer
    },
    {
      "title": "Do I need a business to start?",
      "description": "No. Most creators start as individuals and register once they approach their country's tax threshold. Your full earnings history is exportable whenever you need it."
    },
    {
      "title": "How long does verification take?",
      "description": "We review 11am–6pm, seven days a week. Most creators are live within a day or two."
    },
    {
      "title": "Can I use this alongside other platforms?",
      "description": "Yes. Nothing here is exclusive."
    }
  ];

  const [active, setActive] = useState(0);
  const reduce = useReducedMotion();

  /**
   * The one light-filled block in the section. `showTitle` is false in the
   * accordion, where the question is already sitting directly above it —
   * printing it twice reads as a rendering fault, not as emphasis.
   */
  const Answer = ({ faq, showTitle }) => (
    <div className='rounded-box bg-[#E6EA7B] px-5 py-6 md:px-8 md:py-9'>
      <p className='font-gulfs text-[11px] uppercase tracking-[0.28em] text-black/55'>
        Answer
      </p>
      {showTitle && (
        <h3 className='mt-3 font-gulfs text-xl md:text-2xl uppercase leading-[1.15] text-black'>
          {faq.title}
        </h3>
      )}
      <p className={`${showTitle ? 'mt-4' : 'mt-3'} text-base md:text-lg leading-[1.6] text-black/80`}>
        {faq.description}
      </p>
    </div>
  );

  return (
    <div
      id={`faq`}
      className='bg-transparent py-12 md:py-28 relative'
    >
      {/* No ambient orbs here. `PageCanvas` is the page's one light source —
      a per-section orb bloomed where its section was and faded before
      the next, which is what made scrolling read as a row of coloured
      stops instead of one continuous field. */}

      <div className='containerbox relative'>
        <div className='grid grid-cols-1 lg:grid-cols-[minmax(0,0.95fr)_1.05fr] gap-10 lg:gap-16'>

          {/* ── Rail ─────────────────────────────────────────────── */}
          <div>
            <FadeIn y={30} duration={0.6}>
              <h2 className='fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white uppercase leading-tight'>
                Frequently Asked <span className='text-gradient-wishlist'>Questions</span>
              </h2>
              <p className='mt-4 text-base md:text-lg leading-[1.6] text-gray-400'>
                Pick a question. The answer opens beside it.
              </p>
            </FadeIn>

            <div className='mt-8 md:mt-10 border-t border-white/12'>
              {faqs.map((f, i) => {
                const open = active === i;
                return (
                  <div key={i} className='border-b border-white/12'>
                    <button
                      type='button'
                      aria-expanded={open}
                      onClick={() => setActive(i)}
                      className={`group flex w-full items-start gap-4 rounded-box-sm px-3 py-4 md:px-4 md:py-5 text-left font-gulfs text-base md:text-lg uppercase tracking-wide transition-colors duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#FF007F] ${
                        open
                          ? 'bg-white/[0.06] text-white'
                          : 'text-white/55 hover:bg-white/[0.03] hover:text-white/80'
                      }`}
                    >
                      {/* The marker IS the state — a filled pink square on the
                          live question, an outline on the rest. No chevron: at
                          lg the panel is not below the button, so a chevron
                          would point at nothing. */}
                      <span
                        className={`mt-[6px] h-3 w-3 shrink-0 border-2 transition-colors duration-200 ${
                          open ? 'border-[#FF007F] bg-[#FF007F]' : 'border-white/30 bg-transparent'
                        }`}
                      />
                      <span className='min-w-0'>{f.title}</span>
                    </button>

                    {/* Accordion body — below lg only. */}
                    {open && (
                      <div className='lg:hidden px-1 pb-5'>
                        <Answer faq={f} showTitle={false} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className='mt-8 text-base leading-[1.6] text-gray-400'>
              Not answered here?{' '}
              <Link
                href='/help'
                className='font-gulfs uppercase text-[#E6EA7B] underline underline-offset-4 transition-opacity duration-200 hover:opacity-70 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F]'
              >
                Search the Help Centre
              </Link>
            </p>
          </div>

          {/* ── Slab (lg and up) ─────────────────────────────────── */}
          <div className='hidden lg:block'>
            <div className='lg:sticky lg:top-28'>
              <motion.div
                key={active}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              >
                <Answer faq={faqs[active]} showTitle={true} />
              </motion.div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
