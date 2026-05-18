import { useEffect, useState } from "react";
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
        <section id="reviews" className="bg-black relative   pt-24 pb-24">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
                <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="containerbox relative ">
                <h2 className="fading text-2xl md:text-3xl lg:text-4xl font-gulfs text-white text-center mb-2 uppercase leading-tight">
                    Happy <span className="text-gradient-wishlist">Creators</span>
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
                                           
                                          className="fading min-h-[245px] rounded-[30px]  bg-gray-900 border border-gray-800 p-[25px] shadow-[6px_6px_0_0_#FF007F] hover:translate-y-[-5px] transition-transform duration-300"
                                        >
                                            <div className="flex items-center content-center flex-wrap mb-3 w-full">
                                                <div className="pl-2.5">
                                                    <strong className="text-center text-lg not-italic uppercase font-normal leading-[120%] tracking-wide font-gulfs text-white">
                                                        @{m.name}
                                                    </strong>
                                                </div>
                                            </div>
                                            <p className="font-poppins text-gray-300">{m.message}</p>
                                            <div className="text-base not-italic font-normal leading-[140%] mt-[30px] font-gulfs text-gray-400">
                                                {m.date}
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                        </Swiper>
                    </div>
                </div>
                <div  className="containerbox relative lg:!mb-[-140px] z-1">
                    <div className="hidden lg:block relative bottom-[60px] left-0 pointer-events-none">
                        <img src={faq} className="" alt="Decorative" />
                    </div>
                </div>
        </section>
    );
}
