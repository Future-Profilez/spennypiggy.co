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
const AddCart = lazyRetry(() => import("./AddCart"));
import { Menu, Transition } from "@headlessui/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import RemoveWish from "./RemoveWish";
import { Link, usePage } from "@inertiajs/react";
import discoveryLink from "@/lib/discoveryLink";
import SaveButton from "@/Components/SaveButton";
import ScheduledBadge from "@/Components/ScheduledBadge";
import ItemStatusBadge from "@/Components/ItemStatusBadge";
import lazyRetry from "@/utils/lazyRetry";

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
        /* Discovery attribution. Set ONLY by a surface Spenny Piggy chose to
           put this creator on (Discover's grid and carousels). Left undefined
           on the creator's own profile and anywhere the supporter already
           picked them — tagging those would inflate the one number the
           Discovery report exists to make credible. */
        discoverySource,
    } = props;

    const effectiveAuth = auth || globalAuth;
    const isCreator = Number(effectiveAuth?.user?.id) === Number(itm?.user_id);

    /**
     * EVERY state that applies, not just the worst — a listing can be suspended
     * AND carry an admin's change request, and hiding the second leaves the
     * creator fixing one problem while the other keeps it off sale. The badge
     * ranks them and shows the rest behind a count.
     *
     * ⚠️ Only the signed-in owner is told any of this: the approval branch is
     * gated on `IsloggedIn`, and a supporter never receives a held listing at all
     * (the profile query filters them out), so a public viewer must never be
     * shown a chip about somebody else's moderation state.
     */
    const editedReason = (itm?.edited_reason || "").trim();
    const statusNotices = [
        Number(itm?.is_suspended) === 1 && {
            state: "suspended",
            reason: itm?.suspend_reason,
        },
        IsloggedIn &&
            Number(itm?.is_approved) === 0 && {
                // A reason means an admin looked and refused; no reason means
                // nobody has reached it yet. Two different things to do.
                state: editedReason ? "changes" : "in_review",
                reason: editedReason || null,
            },
    ].filter(Boolean);

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
    const [editing, setEditing] = useState();
    /* The edit form is a full uploader-carrying form — one per card would be
       paid for on every render of a creator's whole wishlist. Mount on first
       use and keep it after that. */
    const [editMounted, setEditMounted] = useState(false);
    const openAddtocart = () => {
        setOpen(true);
        setTimeout(() => {
            setOpen();
        }, 1000);
    };

    /* Same clear-after-open contract as openAddtocart: Popup only reacts to a
       literal true, so the flag is cleared back to undefined a moment later or
       a second click on an already-closed modal would do nothing. */
    const openEdit = () => {
        setEditMounted(true);
        setEditing(true);
        setTimeout(() => {
            setEditing();
        }, 1000);
    };

    /* The owner is looking at their own listing — a basket popup is the one
       thing they cannot act on. Everyone else buys. */
    const onCardClick = IsloggedIn ? openEdit : openAddtocart;

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
            } ${!isDragging && !isOverlay ? "transition-[filter] duration-200 hover:brightness-[0.98]" : ""}`}
        >
            <div className="bg-[#fdfbf7] rounded-box overflow-hidden relative border-[3px] border-black w-full h-full flex flex-col">
                {/* Owner only: a scheduled wish looks exactly like a live one here, and
                    nobody can buy it yet. */}
                {isCreator && itm?.publish_at && (
                    <div className="px-4 pt-4">
                        <ScheduledBadge publishAt={itm.publish_at} />
                    </div>
                )}

                {/* Status Messages */}
                {/* 🚨 The status is a CHIP the creator taps, not a block of text
                    on the card. It used to carry `approvalmessge membership`,
                    and `home.css:531` gives that pair
                    `position:absolute; top:0; left:0` — so the notice was never
                    in flow whatever margin it was given, and painted over the
                    image, the drag handle, the save button and the kebab. An
                    admin's reason is also arbitrary-length, so any inline form
                    is one long sentence away from pushing this card's price and
                    CTA out of step with its neighbour in the row. The chip is a
                    fixed height whatever the message says. */}

                {/* 🚨 In NORMAL FLOW, not `absolute top-18`. That offset was tuned
                    for a card with nothing above the image — with an approval or
                    edit-reason block rendered, the banner landed on top of it, and
                    a suspend reason of any length made it worse. */}

                {/* Image.
                    🚨 The drag handle and the action buttons live INSIDE this box,
                    not on the card. Anchored to the card they sat at `top-4` — the
                    same pixels as the first status message in flow above the image,
                    so on any wish awaiting approval the move icon and the kebab menu
                    were drawn straight through the admin's reason text. Anchored to
                    the image they are correct whatever renders above it. */}
                <div className="relative">
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
                    {/* 🚨 `!IsloggedIn`, not `IsloggedIn && !isCreator`. On this
                        card `IsloggedIn` means OWNER VIEW — it is what switches
                        the CTA between "Share link" and "Unlock" — so the old
                        condition read "owner view AND not the creator", which is
                        a contradiction. `isCreator` was resolving false (the
                        parent passes `auth` in a shape where `effectiveAuth.user`
                        is not the signed-in user), so the owner was shown a
                        save-for-later heart on their OWN listing. Save is
                        buy-later intent; it only makes sense to someone who could
                        buy it. */}
                    {!IsloggedIn && itm?.id && (
                        <SaveButton
                            productType="wish"
                            itemId={itm.id}
                            creatorId={itm?.user_id}
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
                                <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right divide-y divide-gray-100 rounded-box-sm bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={openEdit}
                                                    className={`${active ? "bg-pink-100" : ""} group flex w-full items-center rounded-box-sm px-2 py-2 text-sm text-black`}
                                                >
                                                    Edit Wish
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <div
                                                    className={`${active ? "bg-pink-100" : ""} group flex w-full items-center rounded-box-sm px-2 py-2 text-sm text-black`}
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

                    <div
                        onClick={onCardClick}
                        /* The picture is the product. At two columns it was the
                           only thing that had been shrunk without earning it —
                           the card's other cuts removed duplicate or boilerplate
                           TEXT, whereas a smaller image just makes the listing
                           harder to recognise. */
                        className={`h-[132px] sm:h-[150px] wishbox overflow-hidden cursor-pointer p-1.5 sm:p-2.5`}
                    >
                        <LazyLoadImage
                            alt={itm?.wishname || "Wish image"}
                            effect="blur"
                            className="block w-full h-full object-cover rounded-box-sm overflow-hidden border-[3px] border-black"
                            src={itm?.perma_link ? itm?.perma_link : uploadedimg}
                        />
                    </div>

                    {/* Anchored to the IMAGE's lower edge, not to the card — and
                        that distinction is what makes an overlay safe here. The
                        documented rule is that anything pinned to the CARD
                        collides the moment an optional block renders above it;
                        this sits inside the box it labels, so nothing can push
                        onto it. It also reclaims the row it used to occupy above
                        the picture.
                        ⚠️ Bottom-LEFT: the drag handle owns top-left and the save
                        button and kebab own top-right, so the lower edge is the
                        only corner of this image with nothing in it. */}
                    {statusNotices.length > 0 && (
                        <div
                            className="absolute bottom-2.5 left-2.5 right-2.5 z-10 flex sm:bottom-4 sm:left-4 sm:right-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <ItemStatusBadge
                                notices={statusNotices}
                                itemName={itm?.wishname}
                                block={false}
                            />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div
                    onClick={onCardClick}
                    className="wishlistdetial cursor-pointer flex-1 flex flex-col px-2 pb-2.5 sm:px-3 sm:pb-3"
                >
                    {/* Badges & Labels */}
                    <div className="flex flex-col items-center gap-1 mt-1.5 sm:mt-2">
                        <ItemBadges
                            createdAt={itm?.created_at}
                            className="justify-center"
                        />

                        {/* The goal label is context, never what is being bought —
                            one line at this width, truncated rather than wrapped. */}
                        {itm.goal_label && (
                            <p className="max-w-full truncate text-center text-[10px] font-bold uppercase tracking-wide text-gray-500 sm:text-[12px]">
                                🎯 {itm.goal_label}
                            </p>
                        )}

                        {isSubscribable && (
                            <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black sm:px-3 sm:py-1 sm:text-[12px]">
                                Subscribable
                            </span>
                        )}
                    </div>

                    {/* Title — two lines are RESERVED, not just allowed. Creators
                        name items whatever they like, so one card wrapping to two
                        lines used to shift its price, CTA and byline out of step
                        with every other card in the row. */}
                    <h4
                        title={itm.wishname}
                        /* ONE line at two columns (client direction), two from `sm`.
                           ⚠️ The reserved height goes with it — `min-h` existed to
                           stop a two-line name shifting that card's price and CTA
                           out of step with its neighbour, and at one line the
                           clamp already guarantees it. Keep `min-h` matched to the
                           clamp: reserving two lines while clamping to one leaves
                           a dead row under every title. */
                        className="mt-0.5 line-clamp-1 min-h-[17px] text-center text-[13px] font-black uppercase leading-tight !text-black sm:line-clamp-2 sm:min-h-[45px] sm:text-lg"
                    >
                        {itm.wishname}
                    </h4>

                    {/* Price */}
                    <div className="text-center mt-1 sm:mt-1.5">
                        <h5 className="font-black font-poppins text-[17px] text-black sm:text-2xl">
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

                        {/* ⚠️ Two wordings of the same disclosure, not two rules.
                            The full sentence runs to three lines in a 147px column
                            and buries the price it belongs to; the short form says
                            the same thing and the checkout states it in full before
                            anyone pays. Never drop it entirely — the price shown to
                            a logged-out visitor IS the grossed-up one. */}
                        {!IsloggedIn && (
                            <>
                                <p className="mt-0.5 text-[10px] font-normal leading-tight text-gray-500 sm:hidden">
                                    *Fees included
                                </p>
                                <p className="mt-0.5 hidden text-[12px] font-normal leading-tight text-gray-500 sm:block">
                                    *Includes platform and payment processing fees
                                </p>
                            </>
                        )}
                    </div>

                    {/* 🚨 TWO "You get" blocks used to render together — this one
                        and `RewardHint` directly below it, which is the house
                        component for exactly this question and is already on the
                        bill, membership, shop and task cards. At two columns there
                        is no room for the duplicate, so the creator's free-text
                        `description` is the one that gives way: `RewardHint` reads
                        the reward contract (`reward_title`/`reward_description`),
                        which is what the supporter is actually buying. */}
                    {itm?.description && (
                        <div className="mt-1.5 hidden rounded-box-sm border border-gray-200 bg-gray-50 px-2.5 py-1 sm:block">
                            <p className="text-[12px] font-medium text-gray-700 text-center line-clamp-2">
                                <span className="font-bold">You get:</span>{" "}
                                {itm.description}
                            </p>
                        </div>
                    )}

                    {/* Reward Hint — the ONE "what do I get" line at this width. */}
                    <RewardHint item={itm} className="mt-1.5 max-w-full" />

                    {/* ⚠️ Hidden at two columns because it is BOILERPLATE — the
                        identical sentence on every wish card, so it distinguishes
                        nothing while costing three wrapped lines in a 147px column.
                        It stays from `sm`, where it reads as a footnote to the
                        reward line above it. */}
                    <p className="mt-1 hidden text-center text-[12px] font-semibold uppercase tracking-wide text-black/60 sm:block">
                        Exclusive content · instant download
                    </p>

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

                    {/* Action Button — mt-auto pins this and the byline below it to
                        the card's floor, so the row shares one CTA line whatever
                        optional blocks rendered above. */}
                    <div className="mt-auto flex items-center justify-center pt-2 sm:pt-2.5">
                        {IsloggedIn ? (
                            <ShareProfile
                                username={itm.wishname}
                                custom={`${ziggy?.url}/${itm?.user?.username}/wishes?item=${itm.uuid}`}
                            >
                                {/* ⚠️ Full width at two columns — a `max-w` here
                                    leaves the button floating in a 147px column
                                    with dead space either side, and the target is
                                    already the narrowest it should get. */}
                                {/* ⚠️ Shorter at two columns, but NOT below the
                                    44px touch floor on the buyer's button below —
                                    this one is the creator's own share action on
                                    their own card, where a miss costs nothing and
                                    the row's height is the thing being managed. */}
                                <button className="w-full rounded-box-sm border-[3px] border-black bg-yellow-300 px-2 py-1 text-[11px] font-black uppercase text-black transition-colors hover:bg-yellow-400 sm:max-w-[130px] sm:px-4 sm:py-2 sm:text-[12px]">
                                    Share Link
                                </button>
                            </ShareProfile>
                        ) : (
                            <button
                                onClick={openAddtocart}
                                className="w-full rounded-box-sm border-[3px] border-black bg-yellow-300 px-2 py-2 text-[11px] font-black uppercase text-black transition-colors hover:bg-yellow-400 sm:max-w-[170px] sm:px-6 sm:py-2.5 sm:text-xs"
                            >
                                Unlock
                            </button>
                        )}
                    </div>

                    {/* Creator Info */}
                    {itm.user && (
                        <div className="mt-1.5 flex items-center justify-center gap-1 border-t border-gray-200 pt-1.5 sm:mt-2">
                            <span className="text-[10px] font-bold text-gray-600 sm:text-xs">
                                By
                            </span>
                            <Link
                                href={
                                    discoverySource
                                        ? discoveryLink(
                                              itm.user.username,
                                              discoverySource
                                          )
                                        : route("user.show", {
                                              username: itm.user.username,
                                          })
                                }
                                className="min-w-0 truncate text-[10px] font-bold uppercase text-[#FF007F] transition-opacity hover:underline hover:opacity-80 sm:text-xs"
                            >
                                @{itm.user.username}
                            </Link>
                        </div>
                    )}
                </div>

                {/* ⚠️ Decoration only, and hidden at two columns: both are
                    absolutely positioned against the CARD, so at 171px the eyes
                    land on the status notices and the star on the byline — the
                    documented rule that anything anchored to the card rather than
                    to the thing it labels collides the moment an optional block
                    renders. */}
                <div className="absolute top-1 left-1 hidden text-xl sm:block">👀</div>
                <div className="absolute bottom-2 right-2 hidden text-xl sm:block">⭐</div>
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
            {/* ⚠️ Rendered OUTSIDE the dropdown on purpose: inside a Menu.Item
                the menu closes on click and unmounts the modal before it can
                open — the same fault the post editor had. */}
            {IsloggedIn && editMounted && (
                <Wishlist
                    editpop
                    hidetrigger
                    openPop={editing}
                    item={itm}
                    currency={currency}
                    setuped={setuped}
                />
            )}

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
