import ShareProfile from "@/wishlist/ShareProfile";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useState } from "react";
import GiftAddCart from "./GiftAddCart";
import GiftEdit from "./GiftEdit";
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
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
            className={`wishlistcntbox mb-3 mb-sm-4 whbg relative
                ${gift?.deleted_at !== null ? "opacity-50" : ""}
                 shadow-voilet`}
        >
            {IsloggedIn && (
                <div className="absolute top-2 right-2 z-10 opacity-100">
                    <DropdownButton
                        className="wishedit"
                        id="dropdown-basic-button"
                        title={
                            <div className="flex flex-col items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-dark rounded-full"></span>
                                <span className="w-1.5 h-1.5 bg-dark rounded-full"></span>
                                <span className="w-1.5 h-1.5 bg-dark rounded-full"></span>
                            </div>
                        }
                    >
                        <Dropdown.Item>
                            <button
                                onClick={() => {
                                    DeleteItem(gift?.uuid);
                                }}
                            >
                                {gift?.deleted_at === null
                                    ? "Disable Item"
                                    : "Enable Item"}
                            </button>
                        </Dropdown.Item>
                    </DropdownButton>
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
