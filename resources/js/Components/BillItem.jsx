import { lazy, memo, useMemo, Fragment, useState, useEffect } from "react";
import uploadedimg from "../../assets/img/uploadedimg.png";
import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const AddBills = lazy(() => import("@/Pages/bills/AddBills"));
import { Menu, Transition } from "@headlessui/react";
import RemoveBill from "@/Pages/bills/RemoveBill";
import { useAlerts } from "@/Components/Alerts";

function BillItem(props) {
    useAlerts();
    const { auth, platform_fee_percentage, transaction_fee_percentage } =
        usePage().props;
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
        const vatAmount = listedPrice * (parseFloat(vatPercent) || 0) / 100;
        const priceWithVat = listedPrice + vatAmount;
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.3;
        const platformFeeRate = (platform_fee_percentage || 17) / 100;
        const complianceFeeRate = (transaction_fee_percentage || 2) / 100;
        const adminFee = adminFeeInCurrency(curr);
        const totalDeductionRate =
            stripeFeeRate + platformFeeRate + complianceFeeRate;

        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays =
            (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        if (!isZeroDecimal) {
            return Math.ceil(totalSupporterPays * 100) / 100;
        }
        return Math.ceil(totalSupporterPays);
    };

    const isCreator = auth?.user?.id === itm?.user_id;

    const {
        attributes,
        listeners,
        isDragging,
        setNodeRef,
        transform,
    } = useSortable({ id: itm && itm.id });

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
    const [open, setOpen] = useState();

    const openAddtocart = useMemo(
        () => () => {
            setOpen(true);
            setTimeout(() => {
                setOpen();
            }, 1000);
        },
        [],
    );

    useEffect(() => {
        if (itemUID == itm.uuid) {
            setOpen(true);
        }
    }, [itemUID, itm.uuid]);

    const imageSrc = useMemo(() => itm?.perma_link || uploadedimg, [itm?.perma_link]);
    const periodDisplay = useMemo(() => (itm && itm.period) || "Monthly", [itm?.period]);

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            style={IsloggedIn ? style : stylenone}
            className={`relative billbox wish-item-box ${classes} ${isDragging ? "dragging" : ""} hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all `}
        >
            <div className="bg-white relative !rounded-box !border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] overflow-hidden w-full">
                {itm && itm.is_suspended == 1 ? (
                    <div className="absolute top-[100px] left-[0px] bg-red-600 text-white text-xs font-bold px-3 py-2 text-center shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] group/suspend cursor-help w-full z-[20]">
                        Suspended
                        {itm.suspend_reason && (
                            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 bg-black text-white text-[10px] p-2 rounded-box-sm pointer-events-none z-30">
                                Reason: {itm.suspend_reason}
                            </div>
                        )}
                    </div>
                ) : IsloggedIn && itm && itm.approved === 0 ? (
                    <div className="!bg-yellow-600 approvalmessge membership m-3 rounded-[20px]  p-3 py-2 mb-2 !text-white">
                        Bill item waiting for approval. Currently only you can see
                        this bill.
                    </div>
                ) : (
                    ""
                )}

                <div className="cursor-pointer relative !overflow-hidden !bg-white p-3 !pb-0">
                    <LazyLoadImage
                        alt="image"
                        effect="blur"
                        height={193}
                        src={imageSrc}
                        className=" !rounded-[20px] object-cover border-2 border-black w-full h-[180px] mx-auto"
                        width={220}
                    />

                    <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-black px-4 py-1.5 rounded-box-sm capitalize shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black whitespace-nowrap z-10">
                        {periodDisplay} Subscribable
                    </div>

                    {IsloggedIn && (
                        <Menu as="div" className="absolute top-8 right-8 z-10 inline-block text-left">
                            <div>
                                <Menu.Button className="edit-post pr-0 bg-transparent border-0 p-0 flex items-center">
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
                                <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-box bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                    <div className="px-1 py-1">
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
                    onClick={openAddtocart}
                    className="wishlistdetial cursor-pointer relative bg-[#fdfbf7] p-4 flex-grow"
                >
                    <div>
                        {itm.goal_label ? (
                            <p className="text-[11px] font-bold text-center text-gray-500 uppercase tracking-wide mb-0.5">
                                🎯 {itm.goal_label}
                            </p>
                        ) : null}
                        <h4 className="text-xl font-black !text-black text-center el1 uppercase tracking-wide">
                            {itm.name}
                        </h4>
                        <h5 className="text-center font-black text-2xl text-black mt-1 mb-1 titleprice">
                            {isCreator ? (
                                formatMultiPrice(itm.price, itm?.currency || "GBP")
                            ) : (
                                <div className="flex flex-col items-center">
                                    {formatMultiPrice(
                                        calculateTotalSupporterPays(
                                            itm.price,
                                            itm?.currency || "GBP",
                                            itm?.user?.vat_amount_percentage || 0,
                                        ),
                                        itm?.currency || "GBP",
                                    )}
                                    <div className="text-[10px] text-gray-600 font-bold mt-1 leading-tight text-center">
                                        *Includes platform and payment processing fees
                                    </div>
                                </div>
                            )}
                        </h5>
                    </div>
                    <p className="text-xs mt-3 text-center font-bold text-gray-800">
                        {periodDisplay} content membership · min. 3 posts/month
                    </p>
                    <div className="flex justify-center mt-5 mb-2">
                        {IsloggedIn ? (
                            <AddBills
                                classes="bg-[#FF007F] border-[3px] border-black text-white font-black uppercase text-[13px] md:text-sm py-2 px-6 rounded-box-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                                text="Manage subscription"
                                item={itm}
                                isEdit={true}
                            />
                        ) : (
                            <Link
                                method="get"
                                as="button"
                                href={route("bill.checkout", { uuid: itm.uuid })}
                                className="bg-[#FF007F] border-[3px] border-black text-white font-black uppercase text-[13px] md:text-sm py-2 px-6 rounded-box-sm shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                Subscribe
                            </Link>
                        )}
                    </div>
                    {itm.user ? (
                        <div className="flex items-center justify-center mt-3">
                            <span className="text-xs text-black font-black uppercase">
                                by
                            </span>
                            <Link
                                as="button"
                                method="get"
                                href={route("user.show", { username: itm.user.username })}
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
