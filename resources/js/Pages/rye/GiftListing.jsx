import ShareProfile from "@/wishlist/ShareProfile";
import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import { useState } from "react";
import GiftAddCart from "./GiftAddCart";
import GiftEdit from "./GiftEdit";

export default function GiftListing({ details, user, IsloggedIn }) {
     const [open, setOpen] = useState();
     const[data,setData]=useState();
     const openAddtocart = () => {
        setOpen(true);
        setTimeout(() => {
            setOpen();
        }, 1000); // Adjust the delay as needed
    };

    return (
        <div
            className="wishlistcntbox mb-3 mb-sm-4 whbg relative shadow-voilet"
        >
            {IsloggedIn ?
            <>
            <GiftEdit data={details} action={open} user={user} IsloggedIn={IsloggedIn} />
            </>
            :
            <GiftAddCart data={details} action={open} user={user} IsloggedIn={IsloggedIn}/>
            }
            <Swiper
                spaceBetween={0}
                slidesPerView={1}
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: false,
                }}
                loop={true}
                modules={[Autoplay]}
            >
                {details?.images &&
                    details?.images?.map((item, index) => (
                        <SwiperSlide key={index}>
                            <LazyLoadImage
                                alt={"image"}
                                useIntersectionObserver={true}
                                effect="blur"
                                height={280}
                                src={item?.url || ""}
                                className="w-full object-fit cursor-pointer"
                                onClick={openAddtocart}
                            />
                        </SwiperSlide>
                    ))}
            </Swiper>
            <div className="wishlistdetial cursor-pointer relative" onClick={openAddtocart}>
                <div>
                    <h4
                        className={`fon-bold text-dark capitalize line-clamp-2`}
                    >
                        {details.title}
                    </h4>
                    <h5 className="font-CeraGRBold text-dark titleprice">
                        {details.price.displayValue}
                        <button className="tooltipbtn">
                            ?<p>*just not including service fee.</p>
                        </button>
                    </h5>
                </div>
            </div>
            <div className="sharelinks">
                <ShareProfile custom={details.url}>
                    <div className="text-pink font-GillSans">Share Link</div>
                </ShareProfile>
            </div>
        </div>
    );
}
