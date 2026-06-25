import { useEffect, useState } from "react";
import "swiper/css";
import "swiper/css/pagination";
import { Pagination } from "swiper/modules";
import faq from "../../../assets/new/faqhand.png";
import { Swiper, SwiperSlide } from "swiper/react";
import FadeIn from '@/Components/animations/FadeIn';


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
        {
            id: 4,
            name: "_thrasytrashybitch",
            date: "Nov 08, 2023, 11:45 pm",
            message:
                "Getting to keep everything I earn has been crazy next level! This site has been key in supporting me and my goals!! Genuinely so so impressed! And it’s sexy AF to look at too! x",
        },
    ];

    return (
        <section id="reviews" className="bg-transparent relative py-20 md:py-28">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-1/4 left-10 w-64 h-64 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
                <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-[#FF007F] rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float-delayed" style={{animationDelay: '1s'}}></div>
            </div>

            <div className="containerbox relative ">
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
                            slidesPerView={width < "1199" ? 1 : 2}
                        >
                            {msg &&
                                msg.map((m, i) => (
                                    <SwiperSlide key={`swiper-item-${i}`}>
                                        <div
                                           
                                          className="fading min-h-[245px] rounded-[30px]   bg-gray-900 border-2 border-gray-800 p-6 md:p-8 shadow-[4px_4px_0px_0px_#FF007F] md:shadow-[8px_8px_0px_0px_#FF007F] hover:translate-y-[-5px] transition-transform duration-300"
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
