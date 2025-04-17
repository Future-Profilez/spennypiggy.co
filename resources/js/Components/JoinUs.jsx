import React from "react";
import { Link } from "@inertiajs/react";
import instagram from "../../assets/new/instagram.png";
import youtube from "../../assets/new/youtube.png";
import twitch from "../../assets/new/twitch.png";
import tiktok from "../../assets/new/tiktok.png";
import x from "../../assets/new/x.png";
import bottomImg from "../../assets/new/joinBottomImage.png";
import { LazyLoadImage } from "react-lazy-load-image-component";

export default function JoinUs() {
    return (
        <>
            <section className="w-full px-4 pb-16 bg-black flex flex-col items-center">
                <p className="uppercase pt-3 md:pt-5 text-center text-white text-CeraGR">
                    Built for creators of all platforms{" "}
                </p>

                <div className="flex flex-wrap justify-center mt-4 mb-20 text-white items-center creators-platforms">
                    {[tiktok, x, youtube, instagram, twitch].map((src, idx) => (
                        <div key={idx} data-aos="zoom-in" className="px-4 py-2">
                            <LazyLoadImage
                                alt="image"
                                useIntersectionObserver={true}
                                effect="blur"
                                className=""
                                src={src}
                                width={190}
                            />
                        </div>
                    ))}
                </div>

                <div className="px-3.5 pt-16 pb-20 w-full max-w-5xl bg-gradient-to-br from-[#a557ff] to-[#924dff] rounded-3xl p-10 text-center shadow-lg">
                    <h2
                        data-aos="zoom-out-up"
                        className="headingSm font-gulfs text-light shadow-none stroke-none mb-6 text-center"
                    >
                        What are you waiting for?
                    </h2>
                    <p
                        data-aos="zoom-out-up"
                        className="mb-16 text-center text-wh !text-base font-poppins"
                    >
                        Build your Wishlist, share it with your fans, and get
                        showered with gifts—no waiting, no hassle, just pure
                        love!
                    </p>

                    <div
                        data-aos="zoom-out-up"
                        className="text-center flex items-center justify-center content-center w-full"
                    >
                        <Link
                            href={route("register")}
                            className="font-anton font-medium uppercase text-xl bg-white rounded-full px-4 py-2 mb-4"
                        >
                            Join the Spenny Piggy party!{" "}
                        </Link>
                    </div>
                </div>
            </section>
            <div className="flex justify-end relative bottom-[-10px] z-50 sm:mr-16">
                <img
                    src={bottomImg}
                    className=""
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
