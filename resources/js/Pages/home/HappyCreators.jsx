import FadeIn from "@/Components/animations/FadeIn";

/**
 * What creators say — three quotes, no carousel.
 *
 * 🚨 THE SWIPER IS GONE (22 Aug 2026). Three items behind a slider showed TWO of
 * them on desktop and ONE on a phone, so the page's whole body of social proof
 * was a third visible at a time and the rest was behind a swipe most readers
 * never make. It also pulled Swiper's JS and two stylesheets onto the heaviest
 * page on the site to lay out three cards. They are a grid now: everything is on
 * screen, and the section costs no JavaScript at all.
 *
 * 🚨 THE EYEBROW IS OURS, THE QUOTE IS THEIRS, AND THEY MUST STAY VISIBLY APART.
 * Each card is labelled with what the money DID — new decks, a better show, sales
 * from strangers — because that is the one thing all three quotes have in common
 * and the reason a stranger reads them. It is set as a small caps label above the
 * rule, never inside the quotation marks: a testimonial is a quotation, and
 * editing one is not an option (see the removed fourth quote below).
 *
 * ⚠️ THE DATE IS DELIBERATELY NOT RENDERED. Every quote here is dated Oct–Nov
 * 2023 and they used to be printed prominently, so the freshest social proof on
 * the site announced itself as roughly three years old — which reads as "nobody
 * has said anything good since". The quotes are still true; the stamp was the
 * only part doing damage. `date` is kept on the data so nothing is silently lost.
 * Restore it only alongside real, recent testimonials.
 *
 * ⚠️ The decorative hand image is gone with the slider. It was `hidden lg:block`
 * inside a wrapper carrying `lg:!mb-[-140px]`, a negative margin that pulled the
 * NEXT chapter up into this one — and this section now opens the closing chapter
 * rather than standing alone, so that overlap landed on the FAQ.
 */

/* One accent per card, in the house trio. Three cards is the one case where a
   colour per item still reads as a set rather than as confetti — and the accent
   is only ever on the label and its rule, never on the words a creator wrote. */
const QUOTES = [
    {
        id: 1,
        name: "Titch_dnb",
        date: "Nov 12, 2023, 04:00 pm",
        outcome: "Bought new decks",
        accent: "#FF007F",
        message:
            "Honestly, this site has been a game changer for me! I’ve been able to get new decks and keep creating the music I love, all funded by fans buying my content and backing my page!",
    },
    {
        id: 2,
        name: "ysheeblack",
        date: "Oct 26, 2023, 05:35 pm",
        outcome: "Upgraded the show",
        accent: "#05EFB8",
        message:
            "Girl… I never leave reviews but trust and believe this site is the goat! I’ve been able to upgrade my looks and put on such elevated shows! All thanks to my fans who love me! I didn’t realize how much! And I keep all the cash! Honestly, it’s crazy!",
    },
    {
        id: 3,
        name: "legitjustjack",
        date: "Nov 15, 2023, 04:15 am",
        outcome: "Sold to strangers",
        accent: "#E6EA7B",
        message:
            "I honestly didn’t realize how much I needed spenny piggy in my life! I’ve had loads of purchases come through already, from supporters I’d never even met! I didn’t realize how easy and simple it could be to get backed by my fans!",
    },
    /*
     * ⚠️ A FOURTH QUOTE WAS REMOVED, NOT REWRITTEN.
     *
     * It ran under the handle "@_thrasytrashybitch" and ended "…it's sexy AF to
     * look at too! x", on a page whose second-strongest claim is "Strictly SFW"
     * and which is read by Stripe reviewers. Both the handle and the sign-off cut
     * directly against the positioning the rest of the page is built on. Putting
     * different words in a named creator's mouth is not an option — a testimonial
     * is a quotation — so it is dropped rather than edited.
     *
     * Its substance ("getting to keep everything I earn") is already made by
     * quotes 1 and 2, so nothing is lost but the conflict.
     */
];

function QuoteCard({ quote }) {
    return (
        <figure className="flex h-full flex-col rounded-box border-2 border-white/10 bg-[#0d0a16] p-6 transition-colors duration-200 hover:bg-[#17102a] md:p-7">
            <figcaption>
                <span
                    className="block font-gulfs text-[12px] uppercase tracking-[0.22em]"
                    style={{ color: quote.accent }}
                >
                    {quote.outcome}
                </span>
                {/* The rule is the card's one piece of colour besides the label,
                    and it is deliberately short — a full-width bar reads as a
                    divider between two things rather than as an underline. */}
                <span
                    aria-hidden="true"
                    className="mt-2 block h-[3px] w-10"
                    style={{ backgroundColor: quote.accent }}
                />
            </figcaption>

            <blockquote className="mt-5 flex-1 font-poppins text-[15px] leading-[1.65] text-white/85 md:text-base">
                {quote.message}
            </blockquote>

            <figcaption className="mt-6 border-t border-white/10 pt-4 font-gulfs text-[15px] uppercase tracking-wide text-white">
                @{quote.name}
            </figcaption>
        </figure>
    );
}

export default function HappyCreators() {
    return (
        <section id="reviews" className="relative bg-transparent py-12 md:py-24">
            {/* No ambient orbs here. `PageCanvas` is the page's one light source — a
                per-section orb bloomed where its section was and faded before the
                next, which is what made scrolling read as a row of coloured stops
                instead of one continuous field. */}
            <div className="containerbox relative">
                <FadeIn y={30} duration={0.6}>
                    <h2 className="fading text-center font-gulfs text-3xl uppercase leading-tight text-white md:text-4xl lg:text-5xl">
                        Happy <span className="text-gradient-wishlist">Creators</span>
                    </h2>
                    <p className="mx-auto mt-4 max-w-xl text-center font-poppins text-[15px] leading-relaxed text-white/65 md:text-base">
                        Three creators, in their own words, on what their supporters
                        paid for.
                    </p>
                </FadeIn>

                <ul className="mt-10 grid gap-5 md:mt-14 md:grid-cols-2 lg:grid-cols-3">
                    {QUOTES.map((quote, i) => (
                        <li key={quote.id} className="h-full">
                            <FadeIn y={22} delay={0.08 * i} duration={0.55} className="h-full">
                                <QuoteCard quote={quote} />
                            </FadeIn>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
