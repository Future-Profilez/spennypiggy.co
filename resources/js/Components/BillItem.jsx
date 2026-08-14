import { lazy, memo, useMemo, Fragment, useState, useEffect } from "react";
import uploadedimg from "../../assets/img/uploadedimg.png";
import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { feeRatesFor, creatorIdOf, STRIPE_FEE_RATE, STRIPE_FIXED_FEE } from "@/utils/pricing";
const AddBills = lazy(() => import("@/Pages/bills/AddBills"));
import { Menu, Transition } from "@headlessui/react";
import RemoveBill from "@/Pages/bills/RemoveBill";
import { useAlerts } from "@/Components/Alerts";
import RewardHint from "@/Pages/discover/components/RewardHint";
import ScheduledBadge from "@/Components/ScheduledBadge";
import ItemStatusBadge from "@/Components/ItemStatusBadge";

function BillItem(props) {
    useAlerts();
    const { auth, platform_fee_percentage, transaction_fee_percentage } =
        usePage().props;
    const __pageProps = usePage().props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const { itm, itemid, IsloggedIn, classes } = props;

    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            "BIF",
            "CLP",
            "DJF",
            "GNF",
            "JPY",
            "KMF",
            "KRW",
            "MGA",
            "PYG",
            "RWF",
            "UGX",
            "VND",
            "VUV",
            "XAF",
            "XOF",
            "XPF",
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
        const listedPrice = parseFloat(String(price || 0).replace(/,/g, ""));
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        const vatAmount = (listedPrice * (parseFloat(vatPercent) || 0)) / 100;
        const priceWithVat = listedPrice + vatAmount;
        const stripeFeeRate = STRIPE_FEE_RATE;
        const stripeFixedFee = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;
        // Per-creator: a creator on a bespoke platform rate must be QUOTED
        // what checkout will CHARGE them. The global props cannot express that.
        const __rates = feeRatesFor(creatorIdOf(itm), __pageProps);
        const platformFeeRate = __rates.platform / 100;
        const complianceFeeRate = __rates.compliance / 100;
        const adminFee = adminFeeInCurrency(curr);
        const totalDeductionRate =
            stripeFeeRate + platformFeeRate + complianceFeeRate;

        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays =
            (priceWithVat + stripeFixedFee + adminFee) /
            (1 - totalDeductionRate);
        if (!isZeroDecimal) {
            return Math.ceil(totalSupporterPays * 100) / 100;
        }
        return Math.ceil(totalSupporterPays);
    };

    const isCreator = auth?.user?.id === itm?.user_id;

    const { attributes, listeners, isDragging, setNodeRef, transform } =
        useSortable({ id: itm && itm.id });

    const style = useMemo(
        () => ({
            transform: CSS.Translate.toString(transform),
        }),
        [transform],
    );

    const stylenone = useMemo(
        () => ({
            transform: "",
        }),
        [],
    );

    const [itemUID, setItemUID] = useState(itemid);
    const [editing, setEditing] = useState();

    const openEdit = useMemo(
        () => () => {
            setEditing(true);
            // Cleared back to undefined so a second click re-opens it.
            setTimeout(() => {
                setEditing();
            }, 1000);
        },
        [],
    );

    /* The owner is looking at their own listing — the checkout page is the one
       thing they cannot act on. Everyone else subscribes. */
    const onCardClick = useMemo(
        () => () => {
            if (IsloggedIn) {
                openEdit();

                return;
            }
            router.visit(route("bill.checkout", { uuid: itm.uuid }));
        },
        [IsloggedIn, openEdit, itm.uuid],
    );

    useEffect(() => {
        if (itemUID && itemUID == itm.uuid && IsloggedIn) {
            openEdit();
        }
    }, [itemUID, itm.uuid, IsloggedIn, openEdit]);

    const imageSrc = useMemo(
        () => itm?.perma_link || uploadedimg,
        [itm?.perma_link],
    );
    const periodDisplay = useMemo(
        () => (itm && itm.period) || "Monthly",
        [itm?.period],
    );

    /**
     * ⚠️ Suspended outranks waiting-for-review: a suspended listing that is also
     * unapproved is a SUSPENDED listing, and "waiting for approval" would be
     * false. ⚠️ Note the column here is `approved`, not the wish card's
     * `is_approved` — the two tables genuinely differ, so this cannot be lifted
     * into a shared helper without checking each one.
     */
    const billStatusNotices = [
        Number(itm?.is_suspended) === 1 && {
            state: "suspended",
            reason: itm?.suspend_reason,
        },
        IsloggedIn &&
            Number(itm?.approved) === 0 && { state: "in_review", reason: null },
    ].filter(Boolean);

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={IsloggedIn ? style : stylenone}
            className={`relative billbox wish-item-box ${classes} ${isDragging ? "dragging" : ""} transition-colors duration-200 hover:bg-black/[0.03]`}
        >
            <div className="bg-white relative !rounded-box !border-[3px] border-black overflow-hidden w-full">
                {/* 🚨 Same two faults the wish card had, and the same fix.
                    The approval notice carried `approvalmessge membership`,
                    which `home.css:531` pins `position:absolute; top:0; left:0`
                    — so it painted over the card whatever margin it was given.
                    The suspend banner was worse: hardcoded `top-[100px]` with a
                    hover-only tooltip carrying the reason, so on a phone (no
                    hover) the reason was UNREACHABLE, and the 100px offset is a
                    guess that lands wherever the card's content happens to be. */}
                {billStatusNotices.length > 0 && (
                    <div className="px-3 pt-3">
                        <ItemStatusBadge
                            notices={billStatusNotices}
                            itemName={itm?.name}
                        />
                    </div>
                )}

                {/* Not on sale yet, however finished it looks. */}
                {itm?.publish_at && (
                    <div className="px-3 pb-2">
                        <ScheduledBadge publishAt={itm.publish_at} />
                    </div>
                )}

                <div
                    onClick={onCardClick}
                    className="cursor-pointer relative !overflow-hidden !bg-white p-2.5 !pb-0"
                >
                    <LazyLoadImage
                        alt={itm?.name || ""}
                        effect="blur"
                        height={193}
                        src={imageSrc}
                        className="!rounded-box object-cover border-2 border-black w-full h-[130px] sm:h-[150px] mx-auto"
                        width={220}
                    />

                    <div className="absolute bottom-[10px] left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[9px] font-black px-2 py-0.5 rounded-box-sm capitalize border-2 border-black whitespace-nowrap z-10 sm:bottom-[14px] sm:px-3 sm:py-1 sm:text-[12px]">
                        {periodDisplay} Subscribable
                    </div>

                    {IsloggedIn && (
                        <Menu
                            as="div"
                            /* The image is a click target now — without this the
                               dots menu would also open the edit sheet behind it. */
                            onClick={(e) => e.stopPropagation()}
                            className="absolute top-6 right-6 z-10 inline-block text-left"
                        >
                            <div>
                                <Menu.Button
                                    aria-label="Bill options"
                                    className="edit-post pr-0 bg-transparent border-0 p-0 flex items-center"
                                >
                                    <div className="dots">
                                        <span className="bg-white"></span>
                                        <span className="bg-white"></span>
                                        <span className="bg-white"></span>
                                    </div>
                                </Menu.Button>
                            </div>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-box bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-1 py-1">
                                        <Menu.Item>
                                            {({ active }) => (
                                                <button
                                                    type="button"
                                                    onClick={openEdit}
                                                    className={`${active ? "bg-pink-100" : ""} group flex w-full items-center rounded-box-sm px-2 py-2 text-sm`}
                                                >
                                                    Edit Bill
                                                </button>
                                            )}
                                        </Menu.Item>
                                        <Menu.Item>
                                            {({ active }) => (
                                                <div
                                                    className={`${active ? "bg-pink-100" : ""} group flex w-full items-center rounded-box-sm px-2 py-2 text-sm`}
                                                >
                                                    <RemoveBill
                                                        classes="w-full text-left"
                                                        uuid={itm.uuid}
                                                        text="Remove Bill"
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
                    role="button"
                    tabIndex={0}
                    aria-label={
                        IsloggedIn
                            ? `Edit ${itm?.name || "bill"}`
                            : itm?.name
                              ? `View ${itm.name}`
                              : "View bill"
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            onCardClick();
                        }
                    }}
                    className="wishlistdetial cursor-pointer relative bg-[#fdfbf7] p-3 flex-grow"
                >
                    <div>
                        {itm.goal_label ? (
                            <p className="max-w-full truncate text-[10px] font-bold text-center text-black/60 uppercase tracking-wide mb-0.5 sm:text-[12px]">
                                🎯 {itm.goal_label}
                            </p>
                        ) : null}
                        <h4 className="text-[13px] font-black !text-black text-center el1 uppercase tracking-wide leading-tight sm:text-lg">
                            {itm.name}
                        </h4>
                        <h5 className="text-center font-black text-[17px] text-black mt-0.5 mb-0.5 titleprice sm:text-2xl">
                            {isCreator ? (
                                formatMultiPrice(
                                    itm.price,
                                    itm?.currency || "GBP",
                                )
                            ) : (
                                <div className="flex flex-col items-center">
                                    {formatMultiPrice(
                                        calculateTotalSupporterPays(
                                            itm.price,
                                            itm?.currency || "GBP",
                                            itm?.user?.vat_amount_percentage ||
                                                0,
                                        ),
                                        itm?.currency || "GBP",
                                    )}
                                    <div className="text-[12px] text-black/80 font-bold mt-1 leading-tight text-center">
                                        *Includes platform and payment
                                        processing fees
                                    </div>
                                </div>
                            )}
                        </h5>
                    </div>
                    <RewardHint item={itm} className="mt-1.5 max-w-full" />

                    {/* Sits UNDER the reward line: it describes how the reward
                        is delivered, so it reads as a footnote to it, not as
                        the item's own subtitle. */}
                    {/* ⚠️ Hidden at two columns. It is the same sentence on every
                        bill card, so it distinguishes nothing, and at ~170px it
                        wraps to three lines — the same reason the wish card's
                        "Exclusive content · instant download" gives way. The
                        period is already on the badge over the image. */}
                    <p className="mt-1 hidden text-[12px] text-center font-semibold text-black/60 uppercase tracking-wide sm:block">
                        {periodDisplay} content membership · min. 3 posts/month
                    </p>

                    <div
                        className="flex justify-center mt-2.5 mb-1"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {IsloggedIn ? (
                            /* ONE instance drives all three entry points — its
                               own button, the card click and the dots menu.
                               A second hidden <AddBills> would be a second
                               sheet with its own form state. */
                            <AddBills
                                classes="bg-[#FF007F] border-[3px] border-black text-white font-black uppercase text-[11px] py-1 px-2 sm:text-[12px] sm:py-1.5 sm:px-4 rounded-box-sm transition-colors duration-200 hover:brightness-110 active:brightness-95"
                                text="Edit bill"
                                item={itm}
                                isEdit={true}
                                openPop={editing}
                            />
                        ) : (
                            <Link
                                method="get"
                                as="button"
                                href={route("bill.checkout", {
                                    uuid: itm.uuid,
                                })}
                                className="bg-[#FF007F] border-[3px] border-black text-black font-black uppercase text-xs py-2 px-6 rounded-box-sm transition-colors duration-200 hover:brightness-110 active:brightness-95"
                            >
                                Subscribe
                            </Link>
                        )}
                    </div>
                    {itm.user ? (
                        <div
                            className="flex items-center justify-center mt-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <span className="text-xs text-black font-black uppercase">
                                by
                            </span>
                            <Link
                                as="button"
                                method="get"
                                href={route("user.show", {
                                    username: itm.user.username,
                                })}
                                className="ml-1 text-xs font-black uppercase text-[#FF007F] underline hover:opacity-90"
                            >
                                @{itm.user.username}
                            </Link>
                        </div>
                    ) : (
                        ""
                    )}
                </div>
            </div>
        </div>
    );
}

export default memo(BillItem, (prevProps, nextProps) => {
    return (
        prevProps.itm?.id === nextProps.itm?.id &&
        prevProps.itm?.name === nextProps.itm?.name &&
        prevProps.itm?.price === nextProps.itm?.price &&
        prevProps.itm?.currency === nextProps.itm?.currency &&
        prevProps.itm?.period === nextProps.itm?.period &&
        prevProps.itm?.approved === nextProps.itm?.approved &&
        prevProps.itm?.perma_link === nextProps.itm?.perma_link &&
        prevProps.IsloggedIn === nextProps.IsloggedIn &&
        prevProps.itemid === nextProps.itemid &&
        prevProps.classes === nextProps.classes
    );
});
