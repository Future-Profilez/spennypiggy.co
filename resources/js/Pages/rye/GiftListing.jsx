import ShareProfile from "@/wishlist/ShareProfile";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useState, Fragment } from "react";
import GiftAddCart from "./GiftAddCart";
import GiftEdit from "./GiftEdit";
import { Menu, Transition } from '@headlessui/react';
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";

export default function GiftListing({
    details,
    user,
    IsloggedIn,
    auth,
    gift,
    fetch_gifts,
}) {
    const [open, setOpen] = useState();
    const { successAlert, errorAlert, errorsHandling } = useAlerts();

    const openAddtocart = () => {
        setOpen(true);
        setTimeout(() => {
            setOpen();
        }, 1000); // Adjust the delay as needed
    };

    const DeleteItem = async (id) => {
        try {
            const removeItem = await axios.get(`/delete-creator-products/${id}`);
            if (removeItem?.data?.status) {
                successAlert(removeItem?.data?.message);
                fetch_gifts();
            } else {
                errorAlert(removeItem?.data?.message);
            }
        } catch (error) {
            errorAlert("An unknown error occured");
        }
    };

    return (
        <div
            className={`wishlistcntbox mb-3 sm:mb-4 whbg relative
                ${gift?.deleted_at !== null ? "opacity-50" : ""}
                 shadow-voilet`}
        >
            {IsloggedIn && (
                <div className="absolute top-2 right-2 z-10 opacity-100">
                    <Menu as="div" className="relative inline-block text-left">
                        <Menu.Button className="wishedit flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-full focus:outline-none">
                            <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                            <span className="w-1.5 h-1.5 bg-gray-900 rounded-full"></span>
                        </Menu.Button>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute right-8 mt-[-40px] w-40 origin-top-right divide-y divide-gray-100 rounded-[30px]  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <div className="px-1 py-1">
                                    <Menu.Item>
                                        {({ active }) => (
                                            <button
                                                className={`${
                                                    active ? 'bg-pink-500 text-white' : 'text-gray-900'
                                                } group flex w-full items-center rounded-[30px]  px-2 py-2 text-sm`}
                                                onClick={() => {
                                                    DeleteItem(gift?.uuid);
                                                }}
                                            >
                                                {gift?.deleted_at === null
                                                    ? "Disable Item"
                                                    : "Enable Item"}
                                            </button>
                                        )}
                                    </Menu.Item>
                                </div>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                </div>
            )}
            {IsloggedIn ? (
                <>
                    {/* <GiftEdit
                        data={details}
                        action={open}
                        user={user}
                        IsloggedIn={IsloggedIn}
                        auth={auth}
                    /> */}
                </>
            ) : (
                <GiftAddCart
                    data={details}
                    action={open}
                    user={user}
                    IsloggedIn={IsloggedIn}
                    auth={auth}
                />
            )}
            {/* <Swiper
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

                                effect="blur"
                                height={280}
                                src={item?.url || ""}
                                className="w-full object-fit cursor-pointer"
                                onClick={openAddtocart}
                            />
                        </SwiperSlide>
                    ))}
            </Swiper> */}
            <div className="relative w-full h-[280px] overflow-hidden">
                <LazyLoadImage
                    alt="image"

                    effect="blur"
                    src={(details?.images && details?.images[0]?.url) || ""}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={openAddtocart}
                />
            </div>

            <div
                className="wishlistdetial cursor-pointer relative"
                onClick={openAddtocart}
            >
                <div>
                    <h4
                        className={`font-bold text-dark capitalize line-clamp-2`}
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
