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
                <div className="px-3.5 sm:pt-16 sm:pb-20 w-full max-w-5xl bg-gradient-to-br from-[#a557ff] to-[#924dff] rounded-[30px]    pt-6 sm:p-10 text-center shadow-lg">
                    <h2
                        
                        className="headingSm font-gulfs !text-white !text-3xl sm:!text-[50px] shadow-none stroke-none mb-6 text-center"
                    >
                        What are you waiting for?
                    </h2>
                    <p
                        
                        className="mb-4 sm:mb-16 text-center text-wh !text-base font-poppins"
                    >
                        Build your Wishlist, share it with your fans, and get
                        showered with gifts—no waiting, no hassle, just pure
                        love!
                    </p>

                    <div
                        
                        className="text-center flex items-center justify-center content-center w-full"
                    >
                        <Link
                            href={route("register")}
                            className="font-anton shadow-black font-medium uppercase text-xl bg-white rounded-full px-4 py-2 mb-4"
                        >
                            Join the Spenny Piggy party!{" "}
                        </Link>
                    </div>
                </div>
                </FadeIn>
            </section>
            <div className="bg-black w-full hidden md:flex justify-end  sm:mr-16">
                <img
                    src={bottomImg}
                    className="relative bottom-[-10px] z-[30] max-w-[140px] sm:max-w-[200px]"
                    alt="Decorative"
                />
            </div>

            {/* Old Code */}
            {/* <div className="joinus blackbg ">
                <h2 className="headingSm shadow-none stroke-none mb-3 text-center mb-6 ">
                    Join thousands of creators
                </h2>
                <p className=" mb-6 text-center mb-16 text-wh mb-5">
                    Create your wishlist, sell exclusive content or offer
                    bespoke memberships! Whatever it is, start accepting support
                    from your fans instantly!
                </p>
                <div className=" text-center flex items-center  justify-center content-center w-full">
                    <Link
                        href={route("register")}
                        className="btn-pink lg w-80 shadow-mint border-mint mb-4 mb-lg-0"
                    >
                        Join SpennyPiggy{" "}
                    </Link>
                </div>
            </div> */}
        </>
    );
}
