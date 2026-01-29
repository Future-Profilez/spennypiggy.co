import { lazy } from "react";
import ShareProfile from "./ShareProfile";
import { useState } from "react";
import uploadedimg from "../../assets/img/uploadedimg.png";
import { useEffect } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";
import Wishlist from "@/Pages/Auth/Wishlist";
import PriceFormat from "@/includes/PriceFormat";
const AddCart = lazy(() => import("./AddCart"));
import Dropdown from "react-bootstrap/Dropdown";
import DropdownButton from "react-bootstrap/DropdownButton";
import PinWish from "@/includes/PinWish";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import RemoveWish from "./RemoveWish";
import { trackSearchClick } from "@/includes/Analytics";
import { Link, usePage } from "@inertiajs/react";

export default function Wishlistbox(props) {
    const { ziggy } = usePage().props;
    const { format, formatMultiPrice } = PriceFormat();
    const {
        imagesize,
        currency,
        itm,
        itemid,
        auth,
        IsloggedIn,
        fetchingcats,
        categories,
        setuped,
        classes,
        showall,
        key,
        trackClick,
    } = props;

    console.log("itm",itm)
    const {
        attributes,
        listeners,
        isDragging,
        index,
        over,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: itm && itm.id });

    const style = {
        transform: CSS.Translate.toString(transform),
    };

    const stylenone = {
        transform: "",
    };

    const [itemUID, setItemUID] = useState(itemid);
    const [open, setOpen] = useState();
    const openAddtocart = () => {
        setOpen(true);
        setTimeout(() => {
            setOpen();
        }, 1000);
    };

    useEffect(() => {
        if (itemUID == itm.uuid) {
            setOpen(true);
        }
    }, [itemUID]);

    const getPercentage = (actual, paid) => {
        const r = (paid / actual) * 100;
        return r.toFixed(1);
    };

    const processingFee = 
        ((itm?.price || 0) * (window.platformFeePercentage || 20)) / 100;

    return (
        <div
            key={key}
            style={IsloggedIn ? style : stylenone}
            className={`wish-item-box !p-0 ${classes} ${
                isDragging ? "dragging" : ""
            }`}
        >
            <div className=" rounded-3xl shadow-pinks overflow-hidden   relative border-3 md:border-4 border-[#F94F97] w-full ">
                {IsloggedIn && itm && itm.is_approved === 0 && (
                    <div className="approvalmessge membership m-2 mt-5 rounded-3 p-3 py-2 mb-2">
                        {itm.edited_reason && itm.edited_reason.trim() !== "" ? (
                            <>
                                <p className="font-semibold text-sm mb-1">Edit requested by admin reason : </p>
                                <p className="text-sm opacity-90">{itm.edited_reason}</p>
                            </>
                        ) : (
                            <p>
                                Wish item waiting for approval. Currently only you can see this wish.
                            </p>
                        )}
                    </div>
                )}
                {IsloggedIn ? (
                    <>
                        <div
                            className="movesvg"
                            ref={setNodeRef}
                            {...listeners}
                            {...attributes} >
                            <svg
                                fill="#000000"
                                viewBox="0 0 16 16"
                                xmlns="http://www.w3.org/2000/svg" >
                                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" strokeLinejoin="round" ></g>
                                <g id="SVGRepo_iconCarrier">
                                    <path d="m15.46 7-3.2-2.19-.71 1 2.29 1.57H8.62V2.16l1.57 2.29 1-.71L9 .54a1.25 1.25 0 0 0-2 0l-2.22 3.2 1 .71 1.59-2.29v5.22H2.16l2.29-1.57-.71-1L.54 7a1.25 1.25 0 0 0 0 2l3.2 2.19.71-1-2.29-1.57h5.21v5.22l-1.56-2.29-1 .71L7 15.46a1.25 1.25 0 0 0 2.06 0l2.19-3.2-1-.71-1.63 2.29V8.62h5.22l-2.29 1.57.71 1L15.46 9a1.25 1.25 0 0 0 0-2z"></path>
                                </g>
                            </svg>
                        </div>
                        <Wishlist
                            currency={currency}
                            setuped={setuped}
                            openPop={open}
                            item={itm}
                            editpop={true}
                        />
                    </>
                ) : (
                    <AddCart
                        showall={showall}
                        currency={currency}
                        IsloggedIn={IsloggedIn}
                        auth={auth}
                        item={itm}
                        uuid={itm.uuid}
                        action={open}
                    />
                )}
                {IsloggedIn ? (
                    <DropdownButton
                        className="wishedit"
                        id="dropdown-basic-button"
                        title={
                            <div className="dots">
                                <span className="bg-white"></span>
                                <span className="bg-white"></span>
                                <span className="bg-white"></span>
                            </div>
                        }
                    >
                        <Dropdown.Item>
                            <RemoveWish uuid={itm.uuid} text="Remove Wish" />
                        </Dropdown.Item>
                    </DropdownButton>
                ) : (
                    ""
                )}
                <div
                    onClick={openAddtocart}
                    className={`h-[110px] sm:h-[150px] md:h-[200px] wishbox overflow-hidden cursor-pointer ${imagesize}`}
                >
                    <LazyLoadImage
                        alt={"image"}
                        effect="blur"
                        height={193}
                        className={`block w-full h-full object-cover `}
                        src={itm?.perma_link ? itm?.perma_link : uploadedimg}
                        width={243}
                    />
                </div>

                <div
                    onClick={openAddtocart}
                    className="wishlistdetial cursor-pointer relative bg-white" >
                    <div>
                        <h4 className={`text-lg  !text-gray-800 text-center capitalize ${
                                itm.subscription !== "0" ? "el1" : "el2"
                            }`} > {itm.wishname}
                        </h4>
                        <h5 className="text-center font-bold font-poppins  text-black my-2 titleprice">
                            {/* {console.log("processingFee", itm?.currency)} */}
                            {IsloggedIn ? (
                                <>
                                    {formatMultiPrice(
                                        itm.price,
                                        itm?.currency || "GBP"
                                    )}
                                </>
                            ) : (
                                <>
                                    {formatMultiPrice((parseInt(itm.price)+parseInt(processingFee || 0)), itm?.currency || 'USD', 'adminfee')} 
                                    {/* {formatMultiPrice(parseInt(itm.price) + parseInt(processingFee || 0), itm?.currency || "GBP", "adminfee")} */} 
                                </>
                            )}
                            {IsloggedIn ? (
                                <button className="tooltipbtn">
                                    ?<p>*just not including service fee.</p>
                                </button>
                            ) : (
                                <button className="tooltipbtn">
                                    ?<p>*including service fee.</p>
                                </button>
                            )}
                        </h5>
                    </div>
                    {itm.subscription == "2" ? (
                        <div className="crowd pt-2">
                            <ProgressBar
                                now={itm.fullfill_amount}
                                max={itm.price}
                            />
                            <p className="mt-1 mb-0 text-small text-center">
                                {getPercentage(itm.price, itm.fullfill_amount)}%
                                granted
                            </p>
                        </div>
                    ) : (
                        ""
                    )}

                    {itm && itm.subscription == 1 ? (
                        <div className="bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded-full absolute top-[-35px] right-2">
                            Subscribable
                        </div>
                    ) : (
                        ""
                    )}

                    <div className="absolute top-1 left-1 text-xl">👀</div>
                    <div className="absolute bottom-2 right-2 text-xl">⭐</div>
                    <div className="flex justify-center items-center mt-3 ">
                        <ShareProfile
                            username={itm.wishname}
                            custom={`${ziggy?.url}/${itm?.user?.username}/wishes?item=${itm.uuid}`} >
                            <div className=" bg-yellow-400 hover:bg-yellow-500 text-black font-bold text-[13px] md:text-normal py-2 px-4 rounded-full shadow">
                                Share Link
                            </div>
                        </ShareProfile>
                    </div>
                    {itm.user ? (
                        <div className="flex px-2 mt-3 justify-center">
                            {itm?.user ? (
                                <>
                                    <p className="text-xs font-semibold text-black me-1">
                                        By
                                    </p>
                                    <Link
                                        method="get"
                                        as="button"
                                        href={route("user.show", {
                                            username: itm.user.username,
                                        })}
                                        className="text-xs text-[#F94F97] underline hover:opacity-90"
                                    >
                                        @{itm.user.username}
                                    </Link>
                                </>
                            ) : (
                                <>
                                    <p className="text-xs font-semibold text-black me-1">
                                        By @Unavailable
                                    </p>
                                </>
                            )}
                        </div>
                    ) : (
                        ""
                    )}
                </div>
            </div>
        </div>
    );
}

// <div className="bg-white rounded-3xl shadow-pink  sshadow-lg relative border-2 border-[#F94F97] w-full max-w-[250px]">

//                                                 <div className="flex justify-center ">
//                                                     <img src="https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/" alt="Piggy Bank Illustration" className="w-full rounded-[20px]" />
//                                                 </div>
//                                                 <div className="p-4">
//                                                     <div className="text-lg   text-gray-800 text-center">Naveen Tehrpariya</div>
//                                                     <div className="text-center font-bold font-poppins  text-black my-2">US$45.00</div>
//                                                     <div className="text-center mt-4">
//                                                         <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded-full shadow">
//                                                         Special Link
//                                                         </button>
//                                                     </div>
//                                                 </div>

//                                                 <div className="absolute top-2 left-2 text-xl">👀</div>
//                                                 <div className="absolute bottom-2 right-2 text-xl">⭐</div>
//                                                 </div>
