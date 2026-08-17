import { Disclosure, Transition } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import { PRICE_FORMATTED, FREE_UNTIL_FIRST_SALE, SUBSCRIPTION_COPY } from '@/constants/creatorSubscription';
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

  return (
    <>
    <div
      id={`faq`}
      className='bg-transparent py-12 md:py-28 relative'
    >
      {/* No ambient orbs here. `PageCanvas` is the page's one light source —
      a per-section orb bloomed where its section was and faded before
      the next, which is what made scrolling read as a row of coloured
      stops instead of one continuous field. */}

      <div className='containerbox relative  ' >
          <FadeIn y={30} duration={0.6}>
          <h2 className='fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white mb-12 uppercase leading-tight text-center' >
            Frequently Asked <span className="text-gradient-wishlist">Questions</span>
          </h2>
          </FadeIn>
          <div className='max-w-4xl mx-auto' >
              <div className='flex flex-col gap-4 md:gap-6' >
                  {faqs && faqs.map((f, i)=>{
                    return (
                      <StaggerItem key={i} index={i} stagger={0.1}>
                      <Disclosure defaultOpen={i === 0}>
                        {({ open }) => (
                          /* `bg-gray-900` is a banned cool gray (#111827 carries a
                             blue cast against the page's true black); the card ink
                             is #0d0a16, as everywhere else on this page.
                             ⚠️ A `{/* … *\/}` JSX comment is ILLEGAL here — as the
                             first item inside a parenthesised arrow return it parses
                             as a block, not a comment, and takes the whole module
                             down with "Unexpected token, expected ','". */
                          <div className={`bg-[#0d0a16] border-2 border-[#FF007F] rounded-box-sm md:rounded-box overflow-hidden`}>
                            {/* 🚨 `focus:outline-none` with NO replacement ring. This
                                accordion is the only keyboard-operable control on the
                                homepage, so a keyboard user had no visible position
                                anywhere on the page. WCAG 2.4.7. `text-yellow-400` is
                                also off-palette — the allocated yellow is #E6EA7B. */}
                            <Disclosure.Button className={`flex w-full justify-between px-4 py-4 md:px-6 md:py-6 text-left text-md md:text-xl font-gulfs uppercase tracking-wide focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#FF007F] ${open ? 'text-[#E6EA7B]' : 'text-white'}`}>
                              <span className="pr-4">{f.title}</span>
                              {/* `shrink-0` — without it a long question squeezes the
                                  chevron out of round, which is the whole affordance. */}
                              <ChevronUpIcon
                                className={`${
                                  open ? 'rotate-180 transform' : ''
                                } h-6 w-6 shrink-0 text-[#FF007F] transition-transform duration-200`}
                              />
                            </Disclosure.Button>
                            <Transition
                                enter="transition duration-100 ease-out"
                                enterFrom="transform scale-95 opacity-0"
                                enterTo="transform scale-100 opacity-100"
                                leave="transition duration-75 ease-out"
                                leaveFrom="transform scale-100 opacity-100"
                                leaveTo="transform scale-95 opacity-0"
                            >
                              {/* Padding must match the button's, or the question sits
                                  at 16px and its answer at 24px on a phone — the
                                  question and answer stop reading as one column. */}
                              <Disclosure.Panel className="px-4 pb-4 md:px-6 md:pb-6 text-base md:text-lg text-gray-300 leading-relaxed">
                                {f.description}
                              </Disclosure.Panel>
                            </Transition>
                          </div>
                        )}
                      </Disclosure>
                      </StaggerItem>
                    )
                  })}
              </div>
          </div>
      </div>
    </div>
    </>
  );
};
