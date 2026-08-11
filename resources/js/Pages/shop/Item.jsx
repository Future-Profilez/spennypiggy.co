import Guest from "@/Layouts/GuestLayout";
import { Head, Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useRef } from "react";
import PriceFormat from "../../includes/PriceFormat";
import { creatorIdOf } from "@/utils/pricing";
import BuyShopItem from "./BuyShopItem";
import { 
    ChevronLeftIcon 
} from "@animateicons/react/lucide";
import { Percent } from "lucide-react";
import WaitlistButton from "@/Components/WaitlistButton";
import ShareButton from "@/Components/ShareButton";
import axios from "axios";

export default function ShopDetailItem(props) {
    const { vat_percent, auth, user, shop, card_capabilities } = props;
    const [IsloggedIn, setIsLoggedIn] = useState(
        (auth && auth.user && auth.user.username) ==
            (shop && shop.user && shop && shop.user.username),
    );
    // Prefer the server-built share link: it is canonical (no session_id or stray
    // query on it) and carries the utm source, so a share the creator sends is
    // attributable instead of landing in the funnels as `direct`.
    const url = shop?.share?.url || window.location.href;
    const [open, setOpen] = useState();

    useEffect(() => {
        if (props.payment_id && props.opened == 0) {
            setOpen(true);
            if (shop.success_page_type == "url") {
                window.open(shop && shop.success_page_value, "_blank");
            }
        }
    }, []);

    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();

    const isOwner = Number(auth?.user?.id) === Number(shop?.user_id);
    const vatPercentage = shop?.user?.vat_amount_percentage || 0;
    const itemCurrency = (shop?.currency || shop?.user?.default_currency || "GBP").toUpperCase();

    const price = shop.price;

    const [currentCountry, setCurrentCountry] = useState();
    const getIp = async () => {
        try {
            const resp = await axios.get("/api/user-country");
            const code = resp.data?.country_code;
            if (code) {
                setCurrentCountry(code);
                getShippingPrice(code);
            }
        } catch (err) {
            // Silently fall back — shipping price will use default
            getShippingPrice("GB");
        }
    };

    const [shippingPrice, setShippingPrice] = useState(() => {
        if (shop?.type === 'physical') {
            const shippingRates = shop.shop_shipping_info || [];
            const baselineRate = shippingRates.find(s => 
                s.country?.toLowerCase() === 'all' || 
                s.country?.toLowerCase() === 'worldwide'
            ) || shippingRates[0];
            return parseFloat(baselineRate?.shipping_price || 0);
        }
        return 0;
    });
    const [shippingUnknown, setShippingUnknown] = useState(false);
    const getShippingPrice = (c) => {
        if (!c) return;
        axios
            .get(`/shop/shipping-price/${shop.uuid}?country=${encodeURIComponent(c)}`)
            .then((resp) => {
                setShippingUnknown(false);
                setShippingPrice(resp.data && resp.data.shipping_price);
            })
            .catch(() => {
                // Say so, rather than leaving a stale figure on screen as if it were live.
                setShippingUnknown(true);
            });
    };

    // The destination the buyer picks — not the country their IP resolved to — is
    // what the quote and the purchase request must use.
    const handleCountryChange = (code) => {
        if (!code || code === currentCountry) return;
        setCurrentCountry(code);
        getShippingPrice(code);
    };

    useEffect(() => {
        getIp();
    }, []); // run once on mount — shop.uuid won't change after render

    const vatAmountSpecial = (parseFloat(shop?.special_member_price) || 0) * vatPercentage / 100;
    const baseSpecialPriceToGrossUp = (parseFloat(shop?.special_member_price) || 0) + vatAmountSpecial + (parseFloat(shippingPrice) || 0);

    const vatAmountRegular = (parseFloat(price) || 0) * vatPercentage / 100;
    const baseRegularPriceToGrossUp = (parseFloat(price) || 0) + vatAmountRegular + (parseFloat(shippingPrice) || 0);

    return (
        <>
            <Guest auth={auth.user} user={user}>
                <div className="bg-gray-200 min-h-dvh">
                    <div className="container mx-auto px-4 m-auto">
                        <div className="py-6 md:py-14 max-w-[900px] m-auto pb-[calc(96px+env(safe-area-inset-bottom))] md:pb-14">
                            <Head title={shop.name || "Spenny Piggy Shop"} />
                            <div className="product-details max-w-[700px] px-2 mx-auto">
                                <button
                                    className="flex md:hidden items-center text-xl mb-4 "
                                    onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = `/${shop?.user?.username || ''}`))} >
                                    <span className="mt-1">
                                        <ChevronLeftIcon size={24} />
                                    </span>{" "}
                                    Back
                                </button>
                                <nav
                                    className="hidden md:flex mb-4"
                                    aria-label="Breadcrumb"
                                >
                                    <ol className="inline-flex flex-wrap items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
                                        <li className="inline-flex items-center">
                                            <Link
                                                href={`/${shop.user && shop.user.username}`}
                                                className="inline-flex items-center text-base font-medium text-gray-700  "
                                            >
                                                {shop.user && shop.user.name}
                                            </Link>
                                        </li>
                                        <li>
                                            <div className="flex items-center">
                                                <svg
                                                    className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                                                    aria-hidden="true"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 6 10"
                                                >
                                                    <path
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="m1 9 4-4-4-4"
                                                    />
                                                </svg>
                                                <p className="ml-1 text-base font-medium text-gray-700 md:ml-2">
                                                    Shop
                                                </p>
                                            </div>
                                        </li>
                                        <li aria-current="page">
                                            <div className="flex items-center">
                                                <svg
                                                    className="rtl:rotate-180 w-3 h-3 text-gray-400 mx-1"
                                                    aria-hidden="true"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    fill="none"
                                                    viewBox="0 0 6 10"
                                                >
                                                    <path
                                                        stroke="currentColor"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth="2"
                                                        d="m1 9 4-4-4-4"
                                                    />
                                                </svg>
                                                <span className="ml-1 text-base font-medium text-gray-500 md:ml-2">
                                                    {shop.name}
                                                </span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>

                                {props.my_purchases && props.my_purchases.length > 0 && (
                                    <div className="my-4 border-t border-gray-200 pt-4">
                                        <h3 className="text-md font-semibold text-gray-800 mb-3">Your Purchases</h3>
                                        <div className="space-y-3">
                                            {props.my_purchases.map(purchase => (
                                                <div key={purchase.id} className="bg-gray-50 !rounded-box p-4 px-6 flex justify-between items-center text-sm">
                                                    <div>
                                                        <p className="font-medium text-lg text-gray-700">Order #{(purchase.uuid || purchase.id || '').toString().substring(0, 8) || 'â€”'}</p>
                                                        <p className="text-normal text-gray-500 capitalize">Status: {purchase.status}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        <div className="font-black text-xl mb-1">
                                                            {purchase.total_paid || purchase.gross_amount || purchase.amount ? formatMultiPrice(
                                                                purchase.total_paid ||
                                                                calculateTotalSupporterPays(
                                                                    ((Number(purchase.gross_amount || purchase.amount || 0)) + 
                                                                    (Number(purchase.tax_amount || 0)) + 
                                                                    (Number(purchase.vat_tax_amount || 0)) + 
                                                                    (Number(purchase.shipping_amount || 0))), 
                                                                    purchase.currency || 'GBP'
                                                                ).total_supporter_pays, 
                                                                purchase.currency || 'GBP'
                                                            ) : "FREE"}
                                                        </div>
                                                        <Link href={`/shop?type=purchases`} className="text-[#FF007F] font-medium hover:underline text-normal">
                                                            View Details
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {isOwner && shop.edited_status == 0 && shop.edited_reason && (
                                    <div className="mb-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-box-sm font-medium text-sm">
                                        <strong>Admin requested changes:</strong> {shop.edited_reason}
                                    </div>
                                )}
                                {shop?.is_suspended == 1 && (
                                    <div className="mb-4 bg-red-50 border-2 border-red-500 text-red-800 px-4 py-3 rounded-box-sm font-medium text-sm">
                                        <strong className="uppercase">Suspended</strong>
                                        <div className="mt-1">
                                            {shop?.suspend_reason
                                                ? `Reason: ${shop.suspend_reason}`
                                                : "This shop item has been suspended by admin."}
                                        </div>
                                    </div>
                                )}

                                <div className="w-full relative">
                                    <img
                                        className="w-full max-h-[400px] object-cover rounded-box"
                                        alt={shop.name || "Product image"}
                                        src={shop.perma_link}
                                    />
                                    {shop.ai_generated == 1 ? (
                                        <div className="absolute bottom-2 left-2 z-10 bg-black shadow-sm rounded-box-sm px-2 py-1 text-[8px] text-white">
                                            MADE WITH AI{" "}
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </div>

                                <div className="flex items-center gap-3 pt-4 pb-3">
                                    {/* h1, not h2: this is the page's subject. The whole page
                                        had no h1 at all, which weakens it in search even with
                                        correct OpenGraph — the task page already gets this
                                        right. Styling is unchanged. */}
                                    <h1 className="font-GillSans uppercase text-3xl">
                                        {shop.name}
                                    </h1>
                                    <span className={`px-3 py-1 rounded-box-sm border-2 border-black text-xs font-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${shop.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                                        {shop.type === 'physical' ? 'Physical' : 'Digital'}
                                    </span>
                                </div>
                                <p className=" text-lg lg:leading-tight leading-normal text-gray-600">
                                    {shop.description}
                                </p>

                                {shop.type === 'physical' && shop.shipping_information && (
                                    <div className="mt-4 p-5 bg-blue-50 border-[1px] border-gray-300 rounded-box animate-in fade-in slide-in-from-top-2 duration-500">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-xl">🚚</span>
                                            <h3 className="text-sm font-black uppercase tracking-widest text-blue-800">Shipping Information</h3>
                                        </div>
                                        <p className="text-sm font-bold text-blue-900 leading-relaxed italic">
                                            "{shop.shipping_information}"
                                        </p>
                                    </div>
                                )}

                                <p className=" text-base lg:leading-tight leading-normal text-black mt-3 mb-2">
                                    Category : {" "}
                                    <span className="capitalize">
                                        {shop?.category
                                            ?.map((c) => c?.category?.category)
                                            .filter(Boolean)
                                            .join(", ") || "Not Available"}
                                    </span>
                                </p>

                                {shop &&
                                shop.is_member == 0 &&
                                shop.special_member_price ? (
                                    <div className="special-discount flex items-center bg-gray-100 border-gray-200 my-3 rounded-box p-3 ">
                                        <div className="discount-tag w-[50px] h-[50px] mr-2 flex items-center justify-center">
                                            <Percent size={32} className="text-[#FF007F]" />
                                        </div>
                                        <div className="w-full pr-4 discount-text sm:flex items-center justify-between">
                                            <div className="pr-3">
                                                <h2 className="font-bold text-base">
                                                    Only{" "}
                                                    {formatMultiPrice(
                                                        calculateTotalSupporterPays(
                                                            baseSpecialPriceToGrossUp,
                                                            shop?.currency || "GBP",
                                                            0,
                                                            creatorIdOf(shop)
                                                        ).total_supporter_pays,
                                                        shop?.currency || "GBP",
                                                    )}{" "}
                                                    for members
                                                </h2>
                                                <p className="mb-1 font-normal text-[13px]">
                                                    Become a member to get a
                                                    discount and other exclusive
                                                    benefits.
                                                </p>
                                            </div>
                                            <div className="py-2 ">
                                                <Link
                                                    href={`/${shop.user && shop.user.username}/memberships`}
                                                    className="button sm Join whitespace-nowrap"
                                                >
                                                    Join Membership
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    ""
                                )}

                                <div className="w-full">
                                    {/* The OS share sheet — on a phone this is where
                                        sharing actually happens, and it covers apps
                                        (Instagram, Messages, Signal) that have no
                                        web share URL at all. */}
                                    <ShareButton share={shop?.share} className="mb-4 mt-4" />
                                </div>



                                {/* `slot_limitation` is REMAINING stock — the server decrements it on each sale. */}
                                {shop.slot_limitation != null && Number(shop.slot_limitation) > 0 ? (
                                    <div className="my-2">
                                        <span className=" text-pink text-lg font-light ">
                                            Only {Number(shop.slot_limitation)} Left
                                        </span>
                                    </div>
                                ) : (
                                    ""
                                )}
                                
                                {shippingUnknown && shop.type === 'physical' && (
                                    <p className="text-sm font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-box-sm px-3 py-2 my-2">
                                        Shipping couldn't be calculated right now — it will be confirmed at checkout.
                                    </p>
                                )}

                                <div className="!py-4 sm:flex items-center justify-between">
                                    <div className=" mb-3">
                                        <h3 className="text-3xl font-bold flex flex-col ">
                                            <div className="flex">
                                                <div className="flex">

                                                    
                                                    {shop &&
                                                    shop.is_member == 1 &&
                                                    shop.special_member_price ? (
                                                        <>
                                                            {isOwner ? (
                                                                <div className="flex flex-col">
                                                                    <div className="flex items-baseline">
                                                                        <span>{formatMultiPrice(shop?.special_member_price, itemCurrency)}</span>
                                                                        <span className="line-through text-gray-400 text-xl ml-2">
                                                                            {formatMultiPrice(price, itemCurrency)}
                                                                        </span>
                                                                    </div>
                                                                    {parseFloat(shippingPrice) > 0 && (
                                                                        <span className="text-sm text-gray-500 font-normal mt-1">+ {formatMultiPrice(shippingPrice, itemCurrency)} shipping</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex flex-col">
                                                                        <div className="flex items-baseline">
                                                                            <span>{formatMultiPrice(calculateTotalSupporterPays(baseSpecialPriceToGrossUp, itemCurrency, 0, creatorIdOf(shop)).total_supporter_pays, itemCurrency)}</span>
                                                                            <span className="line-through text-gray-400 text-xl ml-2">
                                                                                {formatMultiPrice(calculateTotalSupporterPays(baseRegularPriceToGrossUp, itemCurrency, 0, creatorIdOf(shop)).total_supporter_pays, itemCurrency)}
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-sm font-bold text-green-600 mt-1 uppercase tracking-wide flex items-center gap-1">
                                                                            <Percent size={18} className="text-lg" /> Member Discount Applied
                                                                        </span>
                                                                        <span className="!text-[14px] text-gray-500 font-normal mt-1 leading-tight">
                                                                            *Includes platform and payment processing fees{shop?.type === 'physical' ? (parseFloat(shippingPrice) > 0 ? " and shipping" : ". Free shipping") : ""}. You will be charged in {itemCurrency}.
                                                                        </span>
                                                                    </div>
                                                            )}
                                                        </>
                                                    ) : price > 0 ? (
                                                        isOwner ? (
                                                            <div className="flex flex-col">
                                                                <span>{formatMultiPrice(price, itemCurrency)}</span>
                                                                {parseFloat(shippingPrice) > 0 && (
                                                                    <span className="text-sm text-gray-500 font-normal mt-1">+ {formatMultiPrice(shippingPrice, itemCurrency)} shipping</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <div className="flex items-baseline">
                                                                    <span className="text-4xl font-bold">
                                                                        {formatMultiPrice(
                                                                            calculateTotalSupporterPays(
                                                                                baseRegularPriceToGrossUp,
                                                                                itemCurrency,
                                                                                0,
                                                                                creatorIdOf(shop)
                                                                            ).total_supporter_pays,
                                                                            itemCurrency
                                                                        )}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[14px] text-gray-500 font-normal mt-1 leading-tight">
                                                                    *Includes platform and payment processing fees{shop?.type === 'physical' ? (parseFloat(shippingPrice) > 0 ? " and shipping" : ". Free shipping") : ""}. You will be charged in {itemCurrency}.
                                                                </span>
                                                            </div>
                                                        )
                                                    ) : (
                                                        "Free"
                                                    )}
                                                    
                                                </div>
                                            </div>
                                        </h3>
                                    </div>
                                </div>
                                
                                <div>
                                    {IsloggedIn ? (
                                        // The owner used to get a dead end here — no edit, no way back to their shop.
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link
                                                href="/shop?type=products"
                                                className="w-full sm:w-auto text-center font-black uppercase bg-yellow-300 border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm shadow-[4px_4px_0px_#000] transition-all hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none active:translate-x-[4px] active:translate-y-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                                            >
                                                Manage in my shop
                                            </Link>
                                            <Link
                                                href="/shop?type=orders"
                                                className="w-full sm:w-auto text-center font-black uppercase bg-white border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm shadow-[4px_4px_0px_#000] transition-all hover:shadow-[2px_2px_0px_#000] hover:translate-x-[2px] hover:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                                            >
                                                View orders
                                            </Link>
                                        </div>
                                    ) : (
                                        <>
                                            {shop.slot_limitation != null &&
                                            Number(shop.slot_limitation) <= 0 ? (
                                                /* A dead "SOLD" button was the end of the road for
                                                   every visitor who arrived after the last sale. */
                                                <WaitlistButton
                                                    shopUuid={shop.uuid}
                                                    initialWaiting={shop.is_waiting}
                                                    isGuest={!auth?.user}
                                                    className="w-full sm:w-auto sm:min-w-[220px]"
                                                />
                                            ) : (
                                                <>
                                                    <BuyShopItem
                                                        card_capabilities={
                                                            card_capabilities
                                                        }
                                                        shippingPrice={
                                                            shippingPrice
                                                        }
                                                        country={currentCountry}
                                                        onCountryChange={handleCountryChange}
                                                        vat_percent={
                                                            vat_percent
                                                        }
                                                        opened={props.opened}
                                                        isPaid={
                                                            props.payment_id
                                                        }
                                                        open={open}
                                                        s={shop}
                                                        text={"Buy This Item"}
                                                        classes="w-full sm:w-auto btn-pink !text-[16px] md !px-6 py-3 mb-3"
                                                    />
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </Guest>
        </>
    );
}
