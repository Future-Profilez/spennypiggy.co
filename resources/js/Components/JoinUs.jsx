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
            <section className="w-full px-4 pb-16 pt-6 bg-black flex flex-col items-center">
                <FadeIn y={20}>
                <p className="uppercase pt-3 md:pt-5 text-center text-white text-CeraGR">
                    Built for creators of all platforms{" "}
                </p>
                </FadeIn>

                <div className="flex flex-wrap justify-center mt-4 mb-20 text-white items-center creators-platforms">
                    {[tiktok, x, youtube, instagram, twitch].map((src, idx) => (
                        <StaggerItem key={idx} index={idx} stagger={0.08} y={20} className="px-4 py-2">
                            <LazyLoadImage
                                alt="image"
                                className=""
                                src={src}
                                width={190}
                            />
                        </StaggerItem>
                    ))}
                </div>

                <FadeIn y={40} scale={0.95} duration={0.7}>
                <div className="px-3.5 sm:pt-16 sm:pb-20 w-full max-w-5xl bg-gradient-to-br from-[#a557ff] to-[#924dff] rounded-[30px] pt-6 sm:p-10 text-center">
                    <h2
                        
                        className="headingSm font-gulfs !text-white !text-3xl sm:!text-[50px] shadow-none stroke-none mb-6 text-center"
                    >
                        What are you waiting for?
                    </h2>
                    {/* ⚠️ "get showered with gifts" was the old gifting framing.
                        Every user-facing surface reads as a purchase of creator
                        content, and this is the loudest one on the site. The
                        free-period line is a config switch, not a fact — see
                        `constants/creatorSubscription`. */}
                    <p

                        className="mb-4 sm:mb-12 text-center text-wh !text-base font-poppins"
                    >
                        Build your Wishlist, share it with your fans, and get paid properly
                        for what you make.{FREE_UNTIL_FIRST_SALE ? ` ${SUBSCRIPTION_COPY.promise}.` : ''}
                    </p>

                    <div

                        className="text-center flex flex-col items-center justify-center content-center w-full"
                    >
                        <Link
                            href={route("register")}
                            className="font-anton font-medium uppercase text-xl bg-white rounded-full px-4 py-2 mb-4"
                        >
                            Join the Spenny Piggy party!{" "}
                        </Link>
                        <p className="text-center text-white/80 font-poppins text-xs sm:text-sm mb-4">
                            No commission. No hidden fees. No nudes. 🐷
                        </p>
                    </div>
                </div>
                </FadeIn>
            </section>
            <div className="bg-black w-full hidden md:flex justify-end sm:mr-16">
                <img
                    src={bottomImg}
                    className="relative bottom-[-10px] z-[30] max-w-[140px] sm:max-w-[200px]"
                    alt="Decorative"
                />
            </div>
        </>
    );
}
