import { Link } from "@inertiajs/react";
import { route } from 'ziggy-js';
import instagram from "../../assets/new/instagram.png";
import youtube from "../../assets/new/youtube.png";
import twitch from "../../assets/new/twitch.png";
import tiktok from "../../assets/new/tiktok.png";
import x from "../../assets/new/x.png";
import bottomImg from "../../assets/new/joinBottomImage.png";
import { LazyLoadImage } from "react-lazy-load-image-component";
import FadeIn from '@/Components/animations/FadeIn';
import StaggerItem from '@/Components/animations/StaggerItem';
import { FREE_UNTIL_FIRST_SALE, SUBSCRIPTION_COPY } from '@/constants/creatorSubscription';

/* The three things this page promises and never charges for. Factored so the
   word "No" is said once in the visual and three times to a screen reader —
   see the sr-only line beside it. */
const NO_LIST = ['commission', 'hidden fees'];

export default function JoinUs() {
    return (
        <>
            {/* ⚠️ `bg-black` was removed from this section and the strip below it.
                `PageCanvas` paints ONE continuous field for the whole homepage and
                every other section is transparent — this was the only one that was
                not, so it cut a visible full-width horizontal seam across the page,
                on the finale, exactly where the canvas exists to prevent one.
                JoinUs is rendered only by Welcome.jsx, so nothing else relies on it
                bringing its own ground. */}
            <section className="w-full px-4 pb-16 pt-6 flex flex-col items-center">
                <FadeIn y={20} className="w-full max-w-5xl">
                {/* The label is a caption, not a heading — hairline rules either
                    side so it reads as the strip's title rather than a claim of
                    its own. `text-CeraGR` was not a utility (the class is
                    `font-CeraGR`), so this line has always rendered in the
                    inherited face. */}
                <div className="flex items-center gap-4 pt-3 md:pt-5">
                    <span aria-hidden="true" className="h-px flex-1 bg-white/20" />
                    <p className="uppercase text-center text-white/70 font-CeraGR text-xs tracking-[0.2em]">
                        Built for creators of all platforms
                    </p>
                    <span aria-hidden="true" className="h-px flex-1 bg-white/20" />
                </div>
                </FadeIn>

                {/* All five carried `alt="image"`, which a screen reader reads out
                    five times and which tells nobody which platforms these are. */}
                <div className="flex flex-wrap justify-center mt-6 mb-16 text-white items-center creators-platforms">
                    {[
                        { src: tiktok, name: 'TikTok' },
                        { src: x, name: 'X' },
                        { src: youtube, name: 'YouTube' },
                        { src: instagram, name: 'Instagram' },
                        { src: twitch, name: 'Twitch' },
                    ].map((platform, idx) => (
                        <StaggerItem key={platform.name} index={idx} stagger={0.08} y={20} className="px-4 py-2">
                            <LazyLoadImage
                                alt={platform.name}
                                src={platform.src}
                                width={190}
                            />
                        </StaggerItem>
                    ))}
                </div>

                <FadeIn y={40} scale={0.95} duration={0.7} className="w-full max-w-5xl">
                {/* ⚠️ INK ON THIS CARD IS BLACK, NOT WHITE. White on #924DFF measures
                    4.44:1 and AA wants 4.5 — black is 4.73:1 and passes. That is the
                    project's already-documented rule for this exact violet (see the
                    filled step in StablecoinTipsAnnouncement), and this card is the
                    page's final CTA, so it is the worst place to be marginal. */}
                {/* 🚨 NO ALPHA ON THE INK HERE. `#924DFF` is mid-luminance, so
                    full black caps at ~4.8:1 and there is no headroom to spend on
                    an opacity: `text-black/60` measured 3.01:1 on the eyebrow and
                    `text-black/80` measured 4.04:1 on the last paragraph before the
                    page's closing CTA — the worst-placed AA failure on the site.
                    Hierarchy here comes from size, weight and tracking, which cost
                    no contrast. Same rule as the toast palette and the promo card
                    grounds. */}
                <div className="w-full bg-[#924DFF] rounded-box p-6 sm:p-10 md:p-12">
                    <div className="md:grid md:grid-cols-12 md:gap-10 md:items-start">
                        <div className="md:col-span-7">
                            {/* Names the chapter this section closes (Welcome.jsx
                                calls it "Finale · Your turn") — structure, not
                                decoration. */}
                            <p className="font-CeraGRBold uppercase text-black text-xs tracking-[0.22em] mb-4">
                                Your turn
                            </p>
                            <h2 className="font-gulfs uppercase text-black text-3xl sm:text-5xl md:text-[54px] leading-[0.95] stroke-none mb-5">
                                What are you waiting for?
                            </h2>
                            {/* ⚠️ "get showered with gifts" was the old gifting framing.
                                Every user-facing surface reads as a purchase of creator
                                content, and this is the loudest one on the site. The
                                free-period line is a config switch, not a fact — see
                                `constants/creatorSubscription`. */}
                            <p className="text-black text-base font-poppins leading-[1.6] max-w-xl">
                                Build your Wishlist, share it with your fans, and get paid properly
                                for what you make.{FREE_UNTIL_FIRST_SALE ? ` ${SUBSCRIPTION_COPY.promise}.` : ''}
                            </p>
                        </div>

                        {/* The site's own sticker idiom (see the "Save £X" tag on
                            PaymentMethodSelector): a tilted white card, black line,
                            no shadow. This copy is the best line on the page and was
                            previously 12px at 70% opacity under the button. */}
                        <div className="mt-8 md:mt-0 md:col-span-5 flex md:justify-end">
                            <div className="-rotate-2 bg-white border-black rounded-box-sm px-5 py-4 sm:px-6 sm:py-5 w-full max-w-xs">
                                <div aria-hidden="true" className="flex items-start gap-4">
                                    <span className="font-gulfs uppercase text-black text-4xl sm:text-5xl leading-none">
                                        No
                                    </span>
                                    <ul className="flex-1 divide-y divide-black/15">
                                        {NO_LIST.map((item) => (
                                            <li
                                                key={item}
                                                className="font-CeraGRBold text-black text-sm sm:text-base leading-[1.5] py-1 first:pt-0 last:pb-0"
                                            >
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <p className="sr-only">No commission. No hidden fees.</p>
                            </div>
                        </div>
                    </div>

                    {/* The signature: the button says "create your page", so the card
                        shows the page. The whole plate is the link — the pill inside
                        is a span, because an anchor inside an anchor is invalid and
                        halves the target on a phone.
                        ⚠️ Pink fill takes BLACK type (5.56:1; white is 3.78:1 and
                        fails AA), and presses with brightness, never scale. */}
                    <Link
                        href={route("register")}
                        className="group block mt-8 md:mt-12 bg-black rounded-box-sm px-4 py-4 sm:px-6 sm:py-5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <span className="font-CeraGRBold text-white/60 text-lg sm:text-xl md:text-2xl tracking-tight">
                                spennypiggy.co/<span className="text-white">yourname</span>
                                <span
                                    aria-hidden="true"
                                    className="inline-block align-[-0.1em] ml-0.5 h-[1em] w-[3px] bg-[#FF007F] animate-pulse motion-reduce:animate-none"
                                />
                            </span>
                            <span className="font-gulfs uppercase tracking-wide text-lg sm:text-xl bg-[#FF007F] text-black rounded-full px-8 py-3 min-h-[44px] inline-flex items-center justify-center shrink-0 transition-[filter] duration-200 group-hover:brightness-110 group-active:brightness-95 motion-reduce:transition-none">
                                {/* One label for one action — see the note in
                                    EarnMoreAnnouncement. The personality lives in the
                                    headline; the button just names the action. */}
                                Create your page
                            </span>
                        </div>
                    </Link>
                </div>
                </FadeIn>
            </section>
            <div className="w-full hidden md:flex justify-end sm:mr-16">
                {/* `alt="Decorative"` is read aloud as the word "Decorative". A
                    decorative image takes an empty alt. */}
                <img
                    src={bottomImg}
                    className="relative bottom-[-10px] z-[30] max-w-[140px] sm:max-w-[200px]"
                    alt=""
                />
            </div>
        </>
    );
}
