import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import faq from "../../../assets/new/faqhand.png";
import { Swiper, SwiperSlide } from "swiper/react";
import FadeIn from '@/Components/animations/FadeIn';


export default function HappyCreators() {
    /**
     * ⚠️ Three faults here, all fixed: the listener was added with NO cleanup (a
     * new one on every mount, never removed); `window.innerWidth` was read during
     * state initialisation, which throws under SSR; and the consumer below
     * compared this number against the STRING "1199", so the comparison was
     * doing type coercion rather than what it looked like.
     */
    const [width, setWidth] = useState(() =>
        typeof window === "undefined" ? 1200 : window.innerWidth
    );
    useEffect(() => {
        if (typeof window === "undefined") return;
        const onResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", onResize);
        return () => window.removeEventListener("resize", onResize);
    }, []);

    const msg = [
        {
            id: 1,
            date: "Nov 12, 2023, 04:00 pm",
            name: "Titch_dnb",
            message:
                "Honestly, this site has been a game changer for me! I’ve been able to get new decks and keep creating the music I love, all funded by fans buying my content and backing my page!",
        },
        {
            id: 2,
            name: "ysheeblack",
            date: "Oct 26, 2023, 05:35 pm",
            message:
                "Girl… I never leave reviews but trust and believe this site is the goat! I’ve been able to upgrade my looks and put on such elevated shows! All thanks to my fans who love me! I didn’t realize how much! And I keep all the cash! Honestly, it’s crazy!",
        },
        {
            id: 3,
            name: "legitjustjack",
            date: "Nov 15, 2023, 04:15 am",
            message:
                "I honestly didn’t realize how much I needed spenny piggy in my life! I’ve had loads of purchases come through already, from supporters I’d never even met! I didn’t realize how easy and simple it could be to get backed by my fans!",
        },
        /*
         * ⚠️ A FOURTH QUOTE WAS REMOVED, NOT REWRITTEN.
         *
         * It ran under the handle "@_thrasytrashybitch" and ended "…it's sexy AF
         * to look at too! x", on a page whose second-strongest claim is "Strictly
         * SFW" and which is read by Stripe reviewers. Both the handle and the sign
         * -off cut directly against the positioning the rest of the page is built
         * on. Putting different words in a named creator's mouth is not an option
         * — a testimonial is a quotation — so it is dropped rather than edited.
         *
         * Its substance ("getting to keep everything I earn") is already made by
         * quotes 1 and 2, so nothing is lost but the conflict.
         */
    ];

    return (
        <section
            id="reviews"
            className="bg-transparent relative py-12 md:py-28"
        >
            {/* No ambient orbs here. `PageCanvas` is the page's one light source —
            a per-section orb bloomed where its section was and faded before
            the next, which is what made scrolling read as a row of coloured
            stops instead of one continuous field. */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            </div>

            <div className="containerbox relative">
                <FadeIn y={30} duration={0.6}>
                <h2 className="fading text-3xl md:text-4xl lg:text-5xl font-gulfs text-white text-center mb-2 uppercase leading-tight">
                    Happy <span className="text-gradient-wishlist">Creators</span>
                </h2>
                </FadeIn>

                <FadeIn y={20} delay={0.15}>
                <div className="creatorslider">
                        <Swiper
                            spaceBetween={20}
                            pagination={{ clickable: true }}
                            modules={[Pagination]}
                            slidesPerView={width < 1199 ? 1 : 2}
                        >
                            {msg &&
                                msg.map((m, i) => (
                                    <SwiperSlide key={`swiper-item-${i}`}>
                                        {/* ⚠️ `bg-gray-900` is the banned cool gray — #111827
                                            carries a blue cast against this page's true
                                            black, and every other card here is #0d0a16.
                                            The bare hover lift is gone too: no offset-shadow
                                            partner, so it was a scale-gimmick by another
                                            name. A card signals hover with its own surface. */}
                                        <div
                                          className="fading h-full min-h-[245px] rounded-box bg-[#0d0a16] border-2 border-white/10 p-6 md:p-8 transition-colors duration-200 hover:bg-[#17102a]"
                                        >
                                            <div className="flex items-center content-center flex-wrap mb-3 w-full">
                                                <div className="pl-2.5">
                                                    <strong className="text-center text-lg not-italic uppercase font-normal leading-[120%] tracking-wide font-gulfs text-white">
                                                        @{m.name}
                                                    </strong>
                                                </div>
                                            </div>
                                            <p className="font-poppins text-white/80">{m.message}</p>
                                            {/* ⚠️ THE DATE IS DELIBERATELY NOT RENDERED.
                                                Every quote below is dated Oct–Nov 2023 and
                                                they were being printed prominently, so the
                                                freshest social proof on the site announced
                                                itself as roughly three years old — which
                                                reads as "nobody has said anything good
                                                since". The quotes are still true; the
                                                stamp was the only part doing damage.
                                                Restore this only alongside real, recent
                                                testimonials. `date` is kept on the data so
                                                nothing is silently lost. */}
                                        </div>
                                    </SwiperSlide>
                                ))}
                    </Swiper>
                    </div>
                </FadeIn>
                </div>
                <div  className="containerbox relative lg:!mb-[-140px] z-1">
                    <div className="hidden lg:block relative bottom-[60px] left-0 pointer-events-none">
                        <img src={faq} className="" alt="Decorative" loading="lazy" decoding="async" />
                    </div>
                </div>
        </section>
    );
}
