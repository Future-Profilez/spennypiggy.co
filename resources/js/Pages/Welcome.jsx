import {  Pagination  } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/pagination';
import { Link, Head } from "@inertiajs/react";
import React from "react";
import addwishlistimg from "../../assets/img/addwishlistimg.png";
import sharewishimg01 from "../../assets/img/sharewishimg01.png";
import receivegiftimg from "../../assets/img/receivegiftimg.png";
import thankfansimg from "../../assets/img/thankfansimg.png";
import payoutimg from "../../assets/img/payoutimg.png";
import fraudprotecicon from "../../assets/img/fraudprotecicon.png";
import twowayicon from "../../assets/img/twowayicon.png";
import userimg from "../../assets/img/userimg.png";
import Guest from "@/Layouts/GuestLayout";
import { useState, useEffect } from "react";

export default function Home({ auth, laravelVersion, user }) {

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
          "id": 1,
          "date":'Nov 12, 2023, 04:00 pm',
          "name": "Titch_dnb",
          "message": "Honestly, this site has been a game changer for me! I’ve been able to get new decks and keep creating the music I love! All thanks to my fans and anonymous gifts I’ve received!"
        },
        {
          "id": 2,
          "name": "ysheeblack",
          "date":'Oct 26, 2023, 05:35 pm',
          "message": "Girl… I never leave reviews but trust and believe this site is the goat! I’ve been able to upgrade my looks and put on such elevated shows! All thanks to my fans who love me! I didn’t realize how much! And I keep all the cash! Honestly, it’s crazy!"
        },
        {
          "id": 3,
          "name": "legitjustjack",
          "date":'Nov 15, 2023, 04:15 am',
          "message": "I honestly didn’t realize how much I needed spenny piggy in my life! I’ve had loads of gifts funded already and from random strangers! I didn’t realize how easy and simple it could be to get support from my fans!"
        },
        {
          "id": 4,
          "name": "mattangove",
          "date":'Nov 08, 2023, 11:45 pm',
          "message": "Getting to keep everything I earn has been crazy next level! This site has been key in supporting me and my goals!! Genuinely so so impressed! And it’s sexy AF to look at too! x"
        }
      ]
      

    return (
        <Guest auth={auth.user} user={auth.user}>
            <Head title="Welcome" />
            <div>
                <div className="homepromotion"></div>

                <div className="heroSec">
                    <div className="containerbox">
                        <div className="welcome">
                            <div className="welcomeLeft">
                                <h2 className="welcomeHeading shadow-yellow font-GillSans text-uppercase mb-1">
                                   Oink! Oink! <br /> B*tch{" "}
                                </h2>
                                <h3 className="welcomeTitle shadow-yellow text-uppercase font-GillSans mb-20">
                                    Get Your Lifestyle funded! 🎁
                                </h3>
                                <div className="mt-6 wishlistbtn wishlistbtnFixed rotate-btn">
                                   {auth?.user?.username ? <Link href={`/${auth && auth?.user && auth?.user?.username || ''}`} className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint" > Create Wishlist </Link>
                                   :  <Link href="/login" className="btn-pink wishlistbutton lg w-2/5 shadow-mint border-mint" > Create Wishlist </Link>
                                   }
                                </div>
                                <div className="itsfree mt-4 ps-24">
                                    It’s Free 🎉
                                </div>
                            </div>
                            <div className="welcomeRt">
                                <img src={addwishlistimg} alt="img" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="funpart">
                    <div className="containerbox">
                        <h2 className="headingMd text-shadow-black">
                            let’s dive into <br /> the fun part{" "}
                        </h2>
                        <div className="funboxs mintbg shadow-black border-black mb-10">
                            <div className="funboximg">
                                <img src={sharewishimg01} alt="img" />
                            </div>

                            <div className="funcnt">
                                <h3 className="headingSm text-shadow-black mb-3">
                                    Create & share <br /> your Wishlist
                                </h3>
                                <p className="text-CeraGR">
                                    Join Spenny Piggy, add items to your
                                    Wishlist and start sharing your page just in
                                    minutes!
                                </p>
                            </div>
                        </div>

                        <div className="funboxs pinkbg shadow-black border-black mb-10">
                            <div className="funcnt">
                                <h3 className="headingSm text-shadow-black mb-3 text-purple">
                                    Receive gifts <br /> from your fans
                                </h3>
                                <p className="text-CeraGR text-wh">
                                    Cash Gift, Secret Gift, Surprise Gift,
                                    Crowdfunding Gifts! There are many ways your
                                    fans can support you on Spenny Piggy
                                </p>
                            </div>
                            <div className="funboximg">
                                <img src={receivegiftimg} alt="img" />
                            </div>
                        </div>

                        <div className="funboxs bluebg shadow-black border-black mb-10">
                            <div className="funboximg">
                                <img src={thankfansimg} alt="img" />
                            </div>

                            <div className="funcnt">
                                <h3 className="headingSm text-shadow-black mb-3 text-pink">
                                    Thank your <br /> fans!
                                </h3>
                                <p className="text-CeraGR text-wh">
                                    Showcase your gift with a shout-out on your
                                    socials or thank your fans directly on
                                    Spenny Piggy via a personal text or video
                                    message.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="whylove pinkbg">
                    <div className="containerbox">
                        <div className="whylovebox">
                            <h2 className="headingMd text-shadow-black text-mint text-center w-full mb-16">
                                Why we love <br /> Spenny piggy
                            </h2>
                            <div className="loveboxes">
                                <img src={payoutimg} alt="img" />
                                <h3 className="headingSm text-shadow-black text-mint">
                                    100% payout
                                </h3>
                                <p className="text-wh">
                                    We're all about creators, so they get every
                                    cent they earn - no middlemen.
                                </p>
                            </div>

                            <div className="loveboxes">
                                <img src={fraudprotecicon} alt="img" />
                                <h3 className="headingSm text-shadow-black text-mint">
                                    Fraud <br /> protection
                                </h3>
                                <p className="text-wh">
                                    Your earnings are secure with us; we've got
                                    your back.
                                </p>
                            </div>

                            <div className="loveboxes">
                                <img src={twowayicon} alt="img" />
                                <h3 className="headingSm text-shadow-black text-mint">
                                    Two way <br /> anonymity
                                </h3>
                                <p className="text-wh">
                                    Privacy for both fans and creators - because
                                    discretion matters.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="happycreator mintbg">
                    <div className="containerbox">
                        <h2 className="headingMd text-shadow-black text-pink text-center mb-10">
                            Happy Creators
                        </h2>
                        <div className="creatorslider">
                            <Swiper
                                spaceBetween={0}
                                pagination={{ clickable: true }}
                                modules={[Pagination]}
                                slidesPerView={width < "1199" ? 1 : 3}
                                >
                                {msg && msg.map((m , i)=>{ 
                                    return <>
                                         <SwiperSlide>
                                            <div className="happyclientSec">
                                                {/* <div className="clientdetail">
                                                    <img src={userimg} alt />
                                                    <div className="clientname">
                                                        <strong className="font-CeraGRBold">
                                                            Dave Turner
                                                        </strong>
                                                        @DaveTheRave
                                                    </div>
                                                </div> */}
                                                <div className="clientdetail">
                                                    <div className="clientname ps-0">
                                                        <strong className="font-CeraGRBold">
                                                            @{m.name}
                                                        </strong>
                                                    </div>
                                                </div>
                                                <p>
                                                {m.message}
                                                </p>
                                                <div className="postdate">
                                                   {m.date}
                                                </div>
                                            </div>
                                        </SwiperSlide>
                                    </>
                                })}
                            </Swiper>
                        </div>
                    </div>
                </div>

                <div class="joinus blackbg ">
                    <h2 class="headingMd shadow-yellow mb-3 text-center mb-6 ">
                        Join thousands of creators
                    </h2>
                    <p class="text-CeraGR mb-6 text-center mb-16 font-CeraGRBold text-wh mb-5">
                        Create your wishlist and start receiving gift's from your
                        fans right away!
                    </p>
                    <div class="1text-center rotate-btn text-center flex items-center  justify-center content-center w-full">
                        <Link href={route("register")}
                            className="btn-pink lg w-80 shadow-mint border-mint" >Join SpennyPiggy </Link>
                    </div>
                </div>

            </div>
        </Guest>
    );
}
