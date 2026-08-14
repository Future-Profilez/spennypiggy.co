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
                <FadeIn y={20}>
                <p className="uppercase pt-3 md:pt-5 text-center text-white text-CeraGR">
                    Built for creators of all platforms{" "}
                </p>
                </FadeIn>

                {/* All five carried `alt="image"`, which a screen reader reads out
                    five times and which tells nobody which platforms these are. */}
                <div className="flex flex-wrap justify-center mt-4 mb-20 text-white items-center creators-platforms">
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

                <FadeIn y={40} scale={0.95} duration={0.7}>
                {/* ⚠️ INK ON THIS CARD IS BLACK, NOT WHITE. White on #924DFF measures
                    4.44:1 and AA wants 4.5 — black is 4.73:1 and passes. That is the
                    project's already-documented rule for this exact violet (see the
                    filled step in StablecoinTipsAnnouncement), and this card is the
                    page's final CTA, so it is the worst place to be marginal.
                    `from-[#a557ff]` was also an off-palette fourth violet; the card
                    is now the one sanctioned #924DFF. */}
                <div className="px-3.5 sm:pt-16 sm:pb-20 w-full max-w-5xl bg-[#924DFF] rounded-box pt-6 sm:p-10 text-center">
                    <h2
                        className="headingSm font-gulfs !text-black !text-3xl sm:!text-[50px] stroke-none mb-6 text-center"
                    >
                        What are you waiting for?
                    </h2>
                    {/* ⚠️ "get showered with gifts" was the old gifting framing.
                        Every user-facing surface reads as a purchase of creator
                        content, and this is the loudest one on the site. The
                        free-period line is a config switch, not a fact — see
                        `constants/creatorSubscription`. */}
                    {/* `text-wh` is not a utility — it emitted nothing and the colour
                        was only inherited. */}
                    <p
                        className="mb-4 sm:mb-12 text-center text-black/80 !text-base font-poppins"
                    >
                        Build your Wishlist, share it with your fans, and get paid properly
                        for what you make.{FREE_UNTIL_FIRST_SALE ? ` ${SUBSCRIPTION_COPY.promise}.` : ''}
                    </p>

                    <div className="text-center flex flex-col items-center justify-center content-center w-full">
                        {/* ⚠️ This was the ONLY `font-anton` on the homepage — an
                            orphan typeface on the page's most important button,
                            which made the final CTA read as foreign to everything
                            above it. The display face here is `font-gulfs`.
                            Also given a real touch target and a focus ring: it had
                            neither, and it is the page's terminal action. */}
                        <Link
                            href={route("register")}
                            className="font-gulfs uppercase tracking-wide text-xl bg-white text-black rounded-full px-8 py-3 min-h-[44px] inline-flex items-center justify-center mb-4 transition-colors duration-200 hover:bg-white/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black motion-reduce:transition-none"
                        >
                            {/* One label for one action — see the note in
                                EarnMoreAnnouncement. The personality lives in the
                                headline above ("What are you waiting for?"); the
                                button just names the action. */}
                            Create your page
                        </Link>
                        <p className="text-center text-black/70 font-poppins text-xs sm:text-sm mb-4">
                            No commission. No hidden fees. No nudes. 🐷
                        </p>
                    </div>
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
