import { lazy, memo, useMemo, Fragment } from "react";
import { useState } from "react";
import uploadedimg from "../../../assets/img/uploadedimg.png";
import { useEffect } from "react";
import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
const AddBills = lazy(() => import("./AddBills"));
import { Menu, Transition } from "@headlessui/react";
import RemoveBill from "./RemoveBill";
import { useAlerts } from "@/Components/Alerts";

function Bill(props) {
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { auth } = usePage().props;
    const { format, formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const { itm, itemid, IsloggedIn, classes, key } = props;

    // Helper to identify zero decimal currencies
    const isZeroDecimalCurrency = (curr) => {
        const zeroDecimalCurrencies = [
            'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 
            'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF'
        ];
        return zeroDecimalCurrencies.includes(curr?.toUpperCase());
    };

    // Calculate total price including all fees (Gross-Up Logic matching Helpers.php)
    const calculateTotalSupporterPays = (price, curr, vatPercent = 0) => {
        const listedPrice = parseFloat(price || 0);
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        
        // Calculate VAT if applicable (Client Rule: Add VAT before other fees)
        const vatAmount = listedPrice * (vatPercent || 0) / 100;
        const priceWithVat = listedPrice + vatAmount;

        // Constants must match backend configuration (Helpers.php)
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.30;
        const platformFeeRate = 0.15; 
        const complianceFeeRate = 0.02; 
        const adminFee = adminFeeInCurrency(curr); 

        const totalDeductionRate = stripeFeeRate + platformFeeRate + complianceFeeRate;
        
        if (totalDeductionRate >= 1) return priceWithVat;

        const totalSupporterPays = (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        
        return totalSupporterPays;
    };

    const isCreator = auth?.user?.id === itm?.user_id;
    const vatPercentage = itm?.user?.vat_amount_percentage || 0;

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

    // Memoize expensive calculations
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

    // Memoize formatted price to avoid recalculation
    const formattedPrice = useMemo(
        () => formatMultiPrice(itm.price, itm?.currency || "GBP"),
        [formatMultiPrice, itm.price, itm?.currency],
    );

    // Memoize image source
    const imageSrc = useMemo(
        () => itm?.perma_link || uploadedimg,
        [itm?.perma_link],
    );

    // Memoize period display
    const periodDisplay = useMemo(
        () => (itm && itm.period) || "Monthly",
        [itm?.period],
    );

    return (
        <>
            <div
                key={key}
                style={IsloggedIn ? style : stylenone}
                className={` relative billbox wish-item-box ${classes} ${isDragging ? "dragging" : ""}`}
            >
                <div className="wishlistcntbox mb-3 sm:mb-4 bg-white relative !rounded-[25px] md:rounded-[30px] !border-2  overflow-hidden w-full">
                    {IsloggedIn && itm && itm.approved === 0 ? (
                        <div className="approvalmessge membership m-3 rounded-[30px] md:rounded-[40px]   p-3 py-2 mb-2 ">
                            Bill item waiting for approval. Currently only you
                            can see this bill.
                        </div>
                    ) : (
                        ""
                    )}

                    <div className="wishlistimg cursor-pointer relative">
                        <LazyLoadImage
                            alt="image"
                            effect="blur"
                            height={193}
                            src={imageSrc}
                            className="object-cover w-full"
                            width={220}
                        />

                        {/* Badge */}
                        <div
                            className="
                          absolute bottom-3 left-1/2 -translate-x-1/2
                          bg-yellow-400 text-black text-xs font-semibold
                          px-3 py-1 rounded-full capitalize
                          shadow-md
                          whitespace-nowrap
                        "
                        >
                            {periodDisplay} Subscribable
                        </div>

                        {IsloggedIn && (
                            <Menu as="div" className="absolute top-2 right-3 z-10 inline-block text-left">
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
                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right divide-y divide-gray-100 rounded-[30px] md:rounded-[40px]  bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-1 py-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <div className={`${active ? 'bg-pink-100' : ''} group flex w-full items-center rounded-[30px] md:rounded-[40px]  px-2 py-2 text-sm`}>
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
                        className="wishlistdetial cursor-pointer relative"
                    >
                        <div>
                            <h4
                                className={`text-lg  !text-gray-800 text-center el1 `}
                            >
                                {itm.name}
                            </h4>

                            <h5 className="text-center font-bold font-poppins  text-black my-2 titleprice">
                                {isCreator ? (
                                    formatMultiPrice(itm.price, itm?.currency || "GBP")
                                ) : (
                                    <div className="flex flex-col items-center">
                                        {formatMultiPrice(
                                            calculateTotalSupporterPays(
                                                itm.price, 
                                                itm?.currency || "GBP",
                                                vatPercentage
                                            ), 
                                            itm?.currency || "GBP"
                                        )}
                                        <div className="text-[10px] text-gray-500 font-normal mt-1 leading-tight text-center">
                                            * Includes all fees
                                        </div>
                                    </div>
                                )}
                            </h5>
                        </div>
                        <p className=" text-[12px] mt-3 text-center">
                            Pay bill and gain access to member only posts
                        </p>
                        <div className="flex justify-center mt-2">
                            {IsloggedIn ? (
                                <AddBills
                                    classes="bg-[var(--pink)] hover:opacity-[0.8] text-white text-[13px] md:text-normal py-2 px-4 rounded-full shadow"
                                    text="Update Bill"
                                    item={itm}
                                    isEdit={true}
                                />
                            ) : (
                                <Link
                                    method="get"
                                    as="button"
                                    href={route("bill.checkout", {
                                        uuid: itm.uuid,
                                    })}
                                    className="bg-[var(--pink)] hover:opacity-[0.8] text-white text-[13px] md:text-normal py-2 px-4 rounded-full shadow"
                                >
                                    Pay Bill
                                </Link>
                            )}
                        </div>
                        {itm.user ? (
                            <div className="flex items-center justify-center mt-2">
                                {itm?.user ? (
                                    <>
                                        <span className="text-xs text-gray-700 font-medium">
                                            by
                                        </span>
                                        <Link
                                            as="button"
                                            method="get"
                                            href={route("user.show", {
                                                username: itm.user.username,
                                            })}
                                            className="ml-1 text-xs text-[#F94F97] underline hover:opacity-90"
                                        >
                                            @{itm.user.username}
                                        </Link>
                                    </>
                                ) : (
                                    <span className="text-xs text-gray-500">
                                        Creator Unavailable
                                    </span>
                                )}
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

// Export with memo and comparison function
export default memo(Bill, (prevProps, nextProps) => {
    // Only re-render if these specific props change
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
