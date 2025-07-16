import React, { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import faq from "../../../assets/new/faqhand.png";
import { Swiper, SwiperSlide } from "swiper/react";


export default function HappyCreators() {
    const [width, setWidth] = useState(window && window.innerWidth);
    function windowWidth() {
        const w = window && window.innerWidth;
        setWidth(w);
    }
    useEffect(() => {
        window.addEventListener("resize", windowWidth);
    }, []);

    const msg = [
        {
            id: 1,
            date: "Nov 12, 2023, 04:00 pm",
            name: "Titch_dnb",
            message:
                "Honestly, this site has been a game changer for me! I’ve been able to get new decks and keep creating the music I love! All thanks to my fans and anonymous gifts I’ve received!",
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
                "I honestly didn’t realize how much I needed spenny piggy in my life! I’ve had loads of gifts funded already and from random strangers! I didn’t realize how easy and simple it could be to get support from my fans!",
        },
        {
            id: 4,
            name: "_thrasytrashybitch",
            date: "Nov 08, 2023, 11:45 pm",
            message:
                "Getting to keep everything I earn has been crazy next level! This site has been key in supporting me and my goals!! Genuinely so so impressed! And it’s sexy AF to look at too! x",
        },
    ];

    return (
        <>
            {/* Old Code */}
            {/* <div id="reviews" className="happycreator py-5 lightpink-50">
                <div className="containerbox">
                    <h2 className="headingSm shadow-none text-dark stroke-none mb-3 text-center mb-6 max-width-1000 m-auto d-table">
                        Happy Creators
                    </h2>
                    <div className="creatorslider">
                        <Swiper
                            spaceBetween={20}
                            pagination={{ clickable: true }}
                            modules={[Pagination]}
                            slidesPerView={width < "1199" ? 1 : 2}
                        >
                            {msg &&
                                msg.map((m, i) => {
                                    return (
                                        <SwiperSlide key={`swiper-item-${i}`}>
                                            <div
                                                data-aos="fade-left"
                                                className="happyclientSec shadow-black-sm"
                                            >
                                                <div className="clientdetail">
                                                    <div className="clientname ps-0">
                                                        <strong className="font-CeraGRBold">
                                                            @{m.name}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <p>{m.message}</p>
                                                <div className="postdate">
                                                    {m.date}
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    );
                                })}
                        </Swiper>
                    </div>
                </div>
            </div> */}

            <div id="reviews" className="happycreator pt-12 pb-4 lg:pb-12 ">
                <div className="containerbox">
                    <h2 className="headingSm shadow-none text-light mb-6 font-gulfs stroke-none text-center max-width-1000 mx-auto block">
                        Happy Creators
                    </h2>

                    <div className="creatorslider">
                        <Swiper
                            spaceBetween={20}
                            pagination={{ clickable: true }}
                            modules={[Pagination]}
                            slidesPerView={width < "1199" ? 1 : 2}
                        >
                            {msg &&
                                msg.map((m, i) => (
                                    <SwiperSlide key={`swiper-item-${i}`}>
                                        <div
                                          data-aos="fade-left"
                                          className="min-h-[245px] rounded-[37.02px] bg-white p-[25px] shadow-[6px_6px_0_0_#F94F96]"
                                        >
                                            <div className="flex items-center content-center flex-wrap mb-3 w-full">
                                                <div className="pl-2.5">
                                                    <strong className="text-center text-lg not-italic font-normal leading-[120%] font-gulfs">
                                                        @{m.name}
                                                    </strong>
                                                </div>
                                            </div>
                                            <p className="font-poppins">{m.message}</p>
                                            <div className="text-base not-italic font-normal leading-[140%] mt-[30px] font-gulfs">
                                                {m.date}
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                        </Swiper>
                    </div>
                </div>
                <div  className="containerbox relative lg:!mb-[-160px]">
                    <div className="hidden lg:block relative bottom-[60px]
                    left-0 ">
                        <img src={faq} className="" alt="Decorative" />
                    </div>
                </div>
            </div>
        </>
    );
}
