import { lazy, Suspense } from "react";
import ItemBadges from "@/Components/ItemBadges";
import RewardHint from "@/Pages/discover/components/RewardHint";
import ShareProfile from "./ShareProfile";
import { useState, Fragment } from "react";
import uploadedimg from "../../assets/img/uploadedimg.png";
import { useEffect } from "react";
import CustomProgressBar from "@/Components/CustomProgressBar";
import Wishlist from "@/Pages/Auth/Wishlist";
import PriceFormat from "@/includes/PriceFormat";
import { creatorIdOf } from "@/utils/pricing";
const AddCart = lazy(() => import("./AddCart"));
import { Menu, Transition } from "@headlessui/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import RemoveWish from "./RemoveWish";
import { Link, usePage } from "@inertiajs/react";
import SaveButton from "@/Components/SaveButton";

export default function Wishlistbox(props) {
    const { ziggy, auth: globalAuth } = usePage().props;
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();
    const {
        imagesize,
        currency,
        itm,
        itemid,
        auth,
        IsloggedIn,
        setuped,
        classes,
        showall,
        isOverlay,
    } = props;

    const effectiveAuth = auth || globalAuth;
    const isCreator = Number(effectiveAuth?.user?.id) === Number(itm?.user_id);

    const sortableId = itm?.id || itm?.uuid;

    const {
        attributes,
        listeners,
        isDragging,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: sortableId });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 0 : 1,
    };

    const [open, setOpen] = useState();
    const openAddtocart = () => {
        setOpen(true);
        setTimeout(() => {
            setOpen();
        }, 1000);
    };

    useEffect(() => {
        if (itemid == itm.uuid) {
            setOpen(true);
        }
    }, [itemid]);

    const getPercentage = (actual, paid) => {
        const r = (paid / actual) * 100;
        return r.toFixed(1);
    };

    const supporterPrice =
        calculateTotalSupporterPays(
            parseFloat(itm?.price || 0) *
                (1 + (itm?.user?.vat_amount_percentage || 0) / 100),
            itm?.currency || "GBP",
            0,
            creatorIdOf(itm),
        )?.total_supporter_pays || itm?.price;

    const isSubscribable = itm?.subscription == 1;

    return (
        <div
            style={
                isOverlay
                    ? { cursor: "grabbing", width: "100%", display: "block" }
                    : IsloggedIn
                      ? style
                      : {}
            }
            className={`wish-item-box !p-0 ${classes} ${
                isDragging ? "dragging opacity-30" : ""
            } ${!isDragging && !isOverlay ? "hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all" : ""}`}
        >
            <div className="bg-[#fdfbf7] rounded-[30px] overflow-hidden relative border-[3px] border-black w-full h-full flex flex-col">
                {/* Status Messages */}
                {IsloggedIn && itm && itm.is_approved === 0 && (
                    <div className="approvalmessge membership m-4 rounded-[20px] !text-[12px] p-4">
                        {itm.edited_reason &&
                        itm.edited_reason.trim() !== "" ? (
                            <>
                                <p className="font-semibold mb-1 text-red-600">
                                    Edit requested by admin reason:
                                </p>
                                <p className="opacity-90">
                                    {itm.edited_reason}
                                </p>
                            </>
                        ) : (
                            <p>
                                Wish item waiting for approval. Currently only
                                you can see this wish.
                            </p>
                        )}
                    </div>
                )}

                {itm && itm.is_suspended == 1 && (
                    <div className="absolute top-18 w-full bg-red-600 text-white text-xs font-bold px-3 py-2 text-center z-20">
                        Suspended
                        {itm.suspend_reason && (
                            <div className="mt-1 text-[10px]">
                                {itm.suspend_reason}
                            </div>
                        )}
                    </div>
                )}

                {/* Drag Handle */}
                {IsloggedIn && (
                    <div
                        className={`movesvg absolute !top-4 !left-4 ${isOverlay ? "cursor-grabbing" : "cursor-grab"} z-10`}
                        ref={setNodeRef}
                        {...listeners}
                        {...attributes}
                    >
                        <svg
                            fill="#000000"
                            viewBox="0 0 16 16"
                            xmlns="http://www.w3.org/2000/svg"
                            className="w-5 h-5"
                        >
                            <path d="m15.46 7-3.2-2.19-.71 1 2.29 1.57H8.62V2.16l1.57 2.29 1-.71L9 .54a1.25 1.25 0 0 0-2 0l-2.22 3.2 1 .71 1.59-2.29v5.22H2.16l2.29-1.57-.71-1L.54 7a1.25 1.25 0 0 0 0 2l3.2 2.19.71-1-2.29-1.57h5.21v5.22l-1.56-2.29-1 .71L7 15.46a1.25 1.25 0 0 0 2.06 0l2.19-3.2-1-.71-1.63 2.29V8.62h5.22l-2.29 1.57.71 1L15.46 9a1.25 1.25 0 0 0 0-2z" />
                        </svg>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    {IsloggedIn && !isCreator && itm?.id && (
                        <SaveButton
                            productType="wish"
                            itemId={itm.id}
                            initialSaved={itm.is_saved}
                        />
                    )}

                    {IsloggedIn && (
                        <Menu
                            as="div"
                            className="relative inline-block text-left"
                        >
                            <Menu.Button className="flex flex-col gap-1 p-2 bg-white/80 backdrop-blur-sm rounded-full border-2 border-black hover:bg-white transition-colors">
                                <span className="block w-1 h-1 bg-black rounded-full"></span>
                                <span className="block w-1 h-1 bg-black rounded-full"></span>
                                <span className="block w-1 h-1 bg-black rounded-full"></span>
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
                                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-[20px] bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <div
                                                    className={`${active ? "bg-pink-100" : ""} group flex w-full items-center rounded-[20px] px-2 py-2 text-sm text-gray-900`}
                                                >
                                                    <RemoveWish
                                                        uuid={itm.uuid}
                                                        text="Remove Wish"
                                                    />
                                                </div>
                                            )}
                                        </Menu.Item>
                                    </div>
                                </Menu.Items>
                            </Transition>
                        </Menu>
                    )}
                </div>

                {/* Image */}
                <div
                    onClick={openAddtocart}
                    className={`h-[160px] sm:h-[200px] wishbox overflow-hidden cursor-pointer p-3`}
                >
                    <LazyLoadImage
                        alt={itm?.wishname || "Wish image"}
                        effect="blur"
                        className="block w-full h-full object-cover rounded-[20px] overflow-hidden border-[3px] border-black"
                        src={itm?.perma_link ? itm?.perma_link : uploadedimg}
                    />
                </div>

                {/* Content */}
                <div
                    onClick={openAddtocart}
                    className="wishlistdetial cursor-pointer flex-1 flex flex-col px-4 pb-4"
                >
                    {/* Badges & Labels */}
                    <div className="flex flex-col items-center gap-1 mt-2">
                        <ItemBadges
                            createdAt={itm?.created_at}
                            className="justify-center"
                        />

                        {itm.goal_label && (
                            <p className="text-center text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                                🎯 {itm.goal_label}
                            </p>
                        )}

                        {isSubscribable && (
                            <span className="bg-yellow-400 text-black text-[10px] font-bold px-3 py-1 rounded-full">
                                Subscribable
                            </span>
                        )}
                    </div>

                    {/* Title */}
                    <h4 className="text-xl font-black !text-black uppercase text-center mt-1">
                        {itm.wishname}
                    </h4>

                    {/* Content Type Badge */}
                    <p className="text-center text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                        Exclusive content · instant download
                    </p>

                    {/* Price */}
                    <div className="text-center mt-3">
                        <h5 className="font-black font-poppins text-3xl text-black">
                            {IsloggedIn
                                ? formatMultiPrice(
                                      itm.price,
                                      itm?.currency || "GBP",
                                  )
                                : formatMultiPrice(
                                      supporterPrice,
                                      itm?.currency || "GBP",
                                  )}
                        </h5>

                        {!IsloggedIn && (
                            <p className="text-[10px] text-gray-500 font-normal mt-0.5 leading-tight">
                                *Includes platform and payment processing fees
                            </p>
                        )}
                    </div>

                    {/* "You get" Section */}
                    {itm?.description && (
                        <div className="mt-2 py-1.5 px-3 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-xs font-medium text-gray-700 text-center">
                                <span className="font-bold">You get:</span>{" "}
                                {itm.description}
                            </p>
                        </div>
                    )}

                    {/* Reward Hint */}
                    <RewardHint item={itm} className="mt-2 max-w-full" />

                    {/* Progress Bar for Subscription */}
                    {itm.subscription == "2" && (
                        <div className="crowd pt-2 mt-2">
                            <CustomProgressBar
                                now={itm.fullfill_amount}
                                max={itm.price}
                            />
                            <p className="mt-1 mb-0 text-sm text-center">
                                {getPercentage(itm.price, itm.fullfill_amount)}%
                                granted
                            </p>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-center items-center mt-4">
                        {IsloggedIn ? (
                            <ShareProfile
                                username={itm.wishname}
                                custom={`${ziggy?.url}/${itm?.user?.username}/wishes?item=${itm.uuid}`}
                            >
                                <button className="bg-yellow-300 hover:bg-yellow-400 text-black font-black uppercase text-sm py-3 px-8 rounded-[14px] border-[3px] border-black hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-full max-w-[200px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none">
                                    Share Link
                                </button>
                            </ShareProfile>
                        ) : (
                            <button
                                onClick={openAddtocart}
                                className="bg-yellow-300 hover:bg-yellow-400 text-black font-black uppercase text-sm py-3 px-8 rounded-[14px] border-[3px] border-black hover:translate-x-[2px] hover:translate-y-[2px] transition-all w-full max-w-[200px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-none"
                            >
                                Unlock
                            </button>
                        )}
                    </div>

                    {/* Creator Info */}
                    {itm.user && (
                        <div className="flex justify-center items-center gap-1 mt-3 pt-2 border-t border-gray-200">
                            <span className="text-xs font-bold text-gray-600">
                                By
                            </span>
                            <Link
                                href={route("user.show", {
                                    username: itm.user.username,
                                })}
                                className="text-xs font-bold text-[#FF007F] hover:underline uppercase hover:opacity-80 transition-opacity"
                            >
                                @{itm.user.username}
                            </Link>
                        </div>
                    )}
                </div>

                {/* Decorative Elements */}
                <div className="absolute top-1 left-1 text-xl">👀</div>
                <div className="absolute bottom-2 right-2 text-xl">⭐</div>
            </div>

            {/*
              * 🚨 AddCart was imported and NEVER rendered, so every "Unlock" button
              * on a wish card did nothing at all — no modal, no request, no console
              * error. There was no working path to put a wish in the basket.
              *
              * `action={open}` is the same contract the rye twin (GiftListing) uses:
              * `openAddtocart` sets it true, then clears it back to undefined a
              * moment later so the NEXT click is a fresh true and Popup's effect
              * fires again. undefined is neither true nor false, so clearing it does
              * not close the modal the supporter is looking at.
              */}
            <Suspense fallback={null}>
                <AddCart
                    action={open}
                    uuid={itm?.uuid}
                    item={itm}
                    currency={currency}
                    showall={showall}
                    IsloggedIn={IsloggedIn}
                />
            </Suspense>
        </div>
    );
}
