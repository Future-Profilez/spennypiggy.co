import { Link, Head } from '@inertiajs/react';
import React from 'react';

import addwishlistimg from '../../assets/img/addwishlistimg.png';
import sharewishimg01 from '../../assets/img/sharewishimg01.png';
import receivegiftimg from '../../assets/img/receivegiftimg.png';
import thankfansimg from '../../assets/img/thankfansimg.png';
import payoutimg from '../../assets/img/payoutimg.png';
import fraudprotecicon from '../../assets/img/fraudprotecicon.png';
import twowayicon from '../../assets/img/twowayicon.png';
import userimg from '../../assets/img/userimg.png';
// import Footer from '../../includes/Footer.js';
// import { Outlet, Link } from "react-router-dom";

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import Guest from '@/Layouts/GuestLayout';

export default function Home({ auth, laravelVersion, phpVersion }) {
    return (
        <>
        <Guest>
            <Head title="Welcome" />
            {/* <div className="sm:fixed sm:top-0 sm:right-0 p-6 text-right">
                {auth.user ? (
                    <Link
                        href={route('dashboard')}
                        className="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500"
                    >
                        Dashboard
                    </Link>
                ) : (
                    <>
                        <Link
                            href={route('login')}
                            className="font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500"
                        >
                            Log in
                        </Link>

                        <Link
                            href={route('register')}
                            className="ml-4 font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white focus:outline focus:outline-2 focus:rounded-sm focus:outline-red-500"
                        >
                            Register
                        </Link>
                    </>
                )}
            </div> */}
            <div className='heroSec'>
                <div className='containerbox'>
                <div className='welcome'>
                    <div className='welcomeLeft'>
                    <h2 className='headingLg mb-12'>Delight in Intimate Surprises</h2>
                    <div className='mt-6 wishlistbtn rotate-btn'>
                        <a href='#' className='btn-pink-lg'>Create Wishlist</a>
                    </div>
                    </div>
                    <div className='welcomeRt'>
                    <img src={addwishlistimg} alt="img" />
                    </div>
                </div>
                </div>
            </div>

            <div className='funpart'>
            <div className='containerbox'>
                <h2 className='headingMd'>let’s dive into <br/> fun part</h2>
                <div className='funboxs mintbg shadow-voilet border-blue mb-10'>
                <div className='funboximg'>
                    <img src={sharewishimg01} alt='img' />
                    </div>

                    <div className='funcnt'>
                    <h3 className='headingSm mb-3'>Create & share <br/>your Wishlist</h3>
                    <p className='text-CeraGR'>Join Whoyouinto, add items to your Wishlist and <br/> start sharing your page just in minutes!</p>
                    </div>
                </div>


                <div className='funboxs pinkbg shadow-black border-black mb-10'>
                    <div className='funcnt'>
                    <h3 className='headingSm mb-3 text-mint'>Receive gifts <br/> from your fans</h3>
                    <p className='text-CeraGR text-wh'>Cash Gift, Secret Gift, Surprise Gift, Crowdfunding Gifts! There are many ways your fans can support you on Whoyouinto</p>
                    </div>
                    <div className='funboximg'>
                    <img src={receivegiftimg} alt='img' />
                    </div>
                </div>


                <div className='funboxs bluebg shadow-black border-black mb-10'>
                <div className='funboximg'>
                    <img src={thankfansimg} alt='img' />
                    </div>

                    <div className='funcnt'>
                    <h3 className='headingSm mb-3 text-mint'>Thank your <br/>fans!</h3>
                    <p className='text-CeraGR text-wh'>Showcase your gift with a shout-out on your socials or thank your fans directly on Whoyouinto via a personal text or video message.</p>
                    </div>
                </div>
                </div>
                </div>
            <div className='whylove pinkbg'>
            <div className='containerbox'>
                <div className='whylovebox'>
                    <h2 className='headingMd text-mint text-center'>Why we love <br/> Spenny piggy</h2>
                    <div className='loveboxes'>
                    <img src={payoutimg} alt="img" />
                    <h3 className='headingSm text-mint'>100% payout</h3>
                    <p className='text-wh'>We're all about creators, so they get every <br/> cent they earn - no middlemen.</p>
                    </div>

                    <div className='loveboxes'>
                    <img src={fraudprotecicon} alt="img" />
                    <h3 className='headingSm text-mint'>Fraud <br/> protection</h3>
                    <p className='text-wh'>Your earnings are secure with us; we've got your back.</p>
                    </div>

                    <div className='loveboxes'>
                    <img src={twowayicon} alt="img" />
                    <h3 className='headingSm text-mint'>Two way <br/> anonymity</h3>
                    <p className='text-wh'>Privacy for both fans and creators – because discretion matters.</p>
                    </div>
                </div>
                </div>
            </div>


            <div className='happycreator mintbg'>
                <div className='containerbox'>
                    <h2 className='headingMd text-pink text-center mb-10'>Happy Creators</h2>
                    <div className='creatorslider'>
                    <Swiper
                    spaceBetween={0}
                    slidesPerView={3}
                    onSlideChange={() => console.log('slide change')}
                    onSwiper={(swiper) => console.log(swiper)}>

                    <SwiperSlide>
                    <div className='happyclientSec'>
                        <div className='clientdetail'>
                            <img src={userimg} alt />
                            <div className='clientname'>
                            <strong className='font-CeraGRBold'>Dave Turner</strong>
                            @DaveTheRave
                            </div>
                            </div>
                            <p>“I've been a loyal fan for years, but this platform takes it to a whole new level. Two-way anonymity lets us interact intimately, while the fraud protection eases our minds. It's a win-win for everyone, making the fan-creator relationship more exciting and secure”</p>
                            <div className='postdate'>Oct 23, 2023,  04:00 pm</div>

                    </div>
                    </SwiperSlide>

                    <SwiperSlide>
                    <div className='happyclientSec'>
                        <div className='clientdetail'>
                            <img src={userimg} alt />
                            <div className='clientname'>
                            <strong>Dave Turner</strong>
                            @DaveTheRave
                            </div>
                            </div>
                            <p>“I've been a loyal fan for years, but this platform takes it to a whole new level. Two-way anonymity lets us interact intimately, while the fraud protection eases our minds. It's a win-win for everyone, making the fan-creator relationship more exciting and secure”</p>
                            <div className='postdate'>Oct 23, 2023,  04:00 pm</div>

                    </div>
                    </SwiperSlide>
                    <SwiperSlide>
                    <div className='happyclientSec'>
                        <div className='clientdetail'>
                            <img src={userimg} alt />
                            <div className='clientname'>
                            <strong>Dave Turner</strong>
                            @DaveTheRave
                            </div>
                            </div>
                            <p>“I've been a loyal fan for years, but this platform takes it to a whole new level. Two-way anonymity lets us interact intimately, while the fraud protection eases our minds. It's a win-win for everyone, making the fan-creator relationship more exciting and secure”</p>
                            <div className='postdate'>Oct 23, 2023,  04:00 pm</div>

                    </div>
                    </SwiperSlide>
                    <SwiperSlide>
                    <div className='happyclientSec'>
                        <div className='clientdetail'>
                            <img src={userimg} alt />
                            <div className='clientname'>
                            <strong>Dave Turner</strong>
                            @DaveTheRave
                            </div>
                            </div>
                            <p>“I've been a loyal fan for years, but this platform takes it to a whole new level. Two-way anonymity lets us interact intimately, while the fraud protection eases our minds. It's a win-win for everyone, making the fan-creator relationship more exciting and secure”</p>
                            <div className='postdate'>Oct 23, 2023,  04:00 pm</div>
                    </div>
                    </SwiperSlide>
                    </Swiper>
                    </div>
                </div>
            </div>

            <div class="joinus lightpink">
                <h2 class="headingMd mb-3 text-center mb-6">Join thousands creators</h2>
                <p class="text-CeraGR mb-6 text-center mb-12 font-CeraGRBold">Create your Wishlist and start receiving gifts from your fans right away!</p>
                <div class="1text-center rotate-btn text-center flex items-center  justify-center content-center w-full">
                <a href="#" class="btn-pink-lg">Join Whoyouinto</a>
                </div>
            </div>
        </Guest>
        </>
    );
}
