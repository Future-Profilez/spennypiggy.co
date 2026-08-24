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
    const [IsloggedIn, setIsLoggedIn] = useState((auth && auth.user && auth.user.username) == 
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
    console.log("shippingPrice", shippingPrice);
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
                        {/* On a phone the buy control is a fixed bar at the foot of the
                            screen, so the column reserves its height (bar + the bottom
                            nav bar, which only exists for a signed-in account). */}
                        <div className={`pt-4 md:py-14 max-w-[900px] m-auto md:pb-14 ${IsloggedIn ? "pb-[calc(96px+env(safe-area-inset-bottom))]" : "pb-[calc(150px+env(safe-area-inset-bottom))]"}`}>
                            <Head title={shop.name || "Spenny Piggy Shop"} />
                            <div className="product-details max-w-[700px] mx-auto">
                                <button
                                    aria-label="Go back"
                                    className="flex md:hidden items-center gap-1 -ml-3 px-3 min-h-[44px] text-lg font-bold rounded-box-sm mb-3 transition-colors hover:bg-black/[0.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                                    onClick={() => (window.history.length > 1 ? window.history.back() : (window.location.href = `/${shop?.user?.username || ''}`))} >
                                    <ChevronLeftIcon size={22} />
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
                                                className="inline-flex items-center text-base font-bold text-black/80 hover:text-black"
                                            >
                                                {shop.user && shop.user.name}
                                            </Link>
                                        </li>
                                        <li>
                                            <div className="flex items-center">
                                                <svg
                                                    className="rtl:rotate-180 w-3 h-3 text-black/60 mx-1"
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
                                                <p className="ml-1 text-base font-medium text-black/60 md:ml-2">
                                                    Shop
                                                </p>
                                            </div>
                                        </li>
                                        <li aria-current="page">
                                            <div className="flex items-center">
                                                <svg
                                                    className="rtl:rotate-180 w-3 h-3 text-black/60 mx-1"
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
                                                <span className="ml-1 text-base font-medium text-black/60 md:ml-2">
                                                    {shop.name}
                                                </span>
                                            </div>
                                        </li>
                                    </ol>
                                </nav>

                                {props.my_purchases && props.my_purchases.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-black/60 mb-2">Your Purchases</h3>
                                        <div className="space-y-2">
                                            {props.my_purchases.map(purchase => (
                                                <div key={purchase.id} className="bg-white border-2 border-black rounded-box-sm p-3 sm:px-5 sm:py-4 flex flex-wrap gap-2 justify-between items-center text-sm">
                                                    <div className="min-w-0">
                                                        <p className="font-black text-base truncate">Order #{(purchase.uuid || purchase.id || '').toString().substring(0, 8) || '—'}</p>
                                                        <p className="text-[13px] text-black/60 capitalize">Status: {purchase.status}</p>
                                                    </div>
                                                    <div className="flex flex-col items-end shrink-0">
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
                                                        <Link href={`/shop?type=purchases`} className="text-[#FF007F] font-bold hover:underline text-[13px]">
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

                                {/* One white panel, framed like the ShopCard this page is
                                    opened from. The detail page used to be loose text on the
                                    grey ground, which on a phone read as an unfinished page. */}
                                <div className="md:bg-white md:border-[3px] md:border-black md:rounded-box md:p-6">
                                {/* Aspect-locked, so the column does not jump when the image
                                    lands — the img had no height until it loaded. Same 4:3
                                    frame the listing card uses. */}
                                <div className="w-full relative aspect-[4/3] bg-gray-50 border-2 border-black rounded-box-sm overflow-hidden">
                                    <img
                                        className="absolute inset-0 w-full h-full object-cover"
                                        alt={shop.name || "Product image"}
                                        src={shop.perma_link}
                                        decoding="async"
                                    />
                                    {shop.ai_generated == 1 ? (
                                        <div className="absolute top-2 right-2 z-10 bg-[#FF007F] text-black border-2 border-black rounded-box-sm px-2 py-1 text-[11px] font-black uppercase">
                                            Made with AI
                                        </div>
                                    ) : (
                                        ""
                                    )}
                                </div>

                                <div className="flex flex-wrap items-start gap-2 pt-4 pb-2">
                                    {/* h1, not h2: this is the page's subject. The whole page
                                        had no h1 at all, which weakens it in search even with
                                        correct OpenGraph — the task page already gets this
                                        right. */}
                                    <h1 className="font-GillSans uppercase text-[26px] leading-[1.05] md:text-3xl break-words min-w-0 flex-1">
                                        {shop.name}
                                    </h1>
                                    <span className={`shrink-0 mt-1 px-2.5 py-1 rounded-box-sm border-2 border-black text-[11px] font-black uppercase ${shop.type === 'physical' ? 'bg-blue-300' : 'bg-green-300'}`}>
                                        {shop.type === 'physical' ? 'Physical' : 'Digital'}
                                    </span>
                                </div>
                                <p className="text-base md:text-lg leading-[1.55] text-black/80">
                                    {shop.description}
                                </p>

                                {shop.type === 'physical' && shop.shipping_information && (
                                    <div className="mt-4 p-4 bg-[#FAFAFA] border-2 border-black rounded-box-sm">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg" aria-hidden="true">🚚</span>
                                            <h2 className="text-[11px] font-black uppercase tracking-widest text-black/60">Shipping</h2>
                                        </div>
                                        <p className="text-sm font-bold leading-[1.5]">
                                            {shop.shipping_information}
                                        </p>
                                    </div>
                                )}

                                <p className="text-sm leading-[1.5] text-black/60 mt-4">
                                    <span className="font-black uppercase tracking-widest text-[11px]">Category</span>{" "}
                                    <span className="capitalize text-black/80">
                                        {shop?.category
                                            ?.map((c) => c?.category?.category)
                                            .filter(Boolean)
                                            .join(", ") || "Not Available"}
                                    </span>
                                </p>

                                {shop &&
                                shop.is_member == 0 &&
                                shop.special_member_price ? (
                                    <div className="special-discount flex items-start gap-3 bg-[#FAFAFA] border-2 border-black my-4 rounded-box-sm p-3 sm:p-4">
                                        <div className="discount-tag w-8 h-8 shrink-0 flex items-center justify-center">
                                            <Percent size={28} className="text-[#FF007F]" />
                                        </div>
                                        <div className="w-full min-w-0 discount-text sm:flex sm:items-center sm:justify-between sm:gap-3">
                                            <div className="sm:pr-3">
                                                <h2 className="font-black text-base">
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
                                                <p className="font-normal text-[13px] leading-[1.5] text-black/60">
                                                    Become a member to get a
                                                    discount and other exclusive
                                                    benefits.
                                                </p>
                                            </div>
                                            <div className="mt-3 sm:mt-0 shrink-0">
                                                <Link
                                                    href={`/${shop.user && shop.user.username}/memberships`}
                                                    className="flex w-full sm:w-auto items-center justify-center whitespace-nowrap min-h-[44px] px-5 rounded-box-sm border-2 border-black bg-yellow-300 font-black uppercase text-sm transition-colors hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
                                    <ShareButton share={shop?.share} className="mt-4" />
                                </div>

                                {/* `slot_limitation` is REMAINING stock — the server decrements it on each sale. */}
                                {shop.slot_limitation != null && Number(shop.slot_limitation) > 0 ? (
                                    <div className="mt-4">
                                        <span className="inline-flex items-center bg-[#FF007F] text-black border-2 border-black rounded-box-sm px-2.5 py-1 text-[11px] font-black uppercase tracking-wide">
                                            Only {Number(shop.slot_limitation)} left
                                        </span>
                                    </div>
                                ) : (
                                    ""
                                )}

                                {shippingUnknown && shop.type === 'physical' && (
                                    <p className="text-sm font-bold text-amber-800 bg-amber-50 border-2 border-amber-500 rounded-box-sm px-3 py-2 mt-4">
                                        Shipping couldn't be calculated right now — it will be confirmed at checkout.
                                    </p>
                                )}


                                {/* Price. Flattened out of five nested flex wrappers, and the
                                    small print moved onto the ink ramp — `text-gray-500` is
                                    3.97:1 on this page and is banned on a payment surface. */}
                                <div className="mt-5 pt-4 border-t-2 border-black/10 text-3xl font-black">
                                    {shop &&
                                    shop.is_member == 1 &&
                                    shop.special_member_price ? (
                                        isOwner ? (
                                            <div className="flex flex-col">
                                                <div className="flex flex-wrap items-baseline gap-x-2">
                                                    <span className="tabular-nums">{formatMultiPrice(shop?.special_member_price, itemCurrency)}</span>
                                                    <span className="line-through text-black/60 text-xl tabular-nums">
                                                        {formatMultiPrice(price, itemCurrency)}
                                                    </span>
                                                </div>
                                                {parseFloat(shippingPrice) > 0 && (
                                                    <span className="text-sm text-black/60 font-normal mt-1">+ {formatMultiPrice(shippingPrice, itemCurrency)} shipping</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <div className="flex flex-wrap items-baseline gap-x-2">
                                                    <span className="text-[34px] leading-none md:text-4xl tabular-nums">{formatMultiPrice(calculateTotalSupporterPays(baseSpecialPriceToGrossUp, itemCurrency, 0, creatorIdOf(shop)).total_supporter_pays, itemCurrency)}</span>
                                                    <span className="line-through text-black/60 text-xl tabular-nums">
                                                        {formatMultiPrice(calculateTotalSupporterPays(baseRegularPriceToGrossUp, itemCurrency, 0, creatorIdOf(shop)).total_supporter_pays, itemCurrency)}
                                                    </span>
                                                </div>
                                                <span className="text-[13px] font-black text-green-700 mt-2 uppercase tracking-wide flex items-center gap-1">
                                                    <Percent size={16} /> Member discount applied
                                                </span>
                                                <span className="text-[13px] text-black/60 font-normal mt-1 leading-[1.45]">
                                                    *Includes platform and payment processing fees{shop?.type === 'physical' ? (parseFloat(shippingPrice) > 0 ? " and shipping" : ". Free shipping") : ""}. You will be charged in {itemCurrency}.
                                                </span>
                                            </div>
                                        )
                                    ) : price > 0 ? ( isOwner ? (
                                            <div className="flex flex-col">
                                                <span className="tabular-nums">{formatMultiPrice(price, itemCurrency)}</span>
                                                {parseFloat(shippingPrice) > 0 && (
                                                    <span className="text-sm text-black/60 font-normal mt-1">+ {formatMultiPrice(shippingPrice, itemCurrency)} shipping</span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col">
                                                <span className="text-[34px] leading-none md:text-4xl tabular-nums">
                                                    {formatMultiPrice(calculateTotalSupporterPays(baseRegularPriceToGrossUp,itemCurrency,0,creatorIdOf(shop)).total_supporter_pays,itemCurrency)}
                                                </span>
                                                <span className="text-[13px] text-black/60 font-normal mt-1 leading-[1.45]">
                                                    *Includes platform and payment processing fees{shop?.type === 'physical' ? (parseFloat(shippingPrice) > 0 ? " and shipping" : ". Free shipping") : ""}. You will be charged in {itemCurrency}.
                                                </span>
                                            </div>
                                        )
                                    ) : (
                                        "Free"
                                    )}
                                </div>
                                </div>

                                {/* 🚨 On a phone this is a fixed bar at the foot of the screen:
                                    the buy control used to sit below the image, the description,
                                    the shipping note and the price, so on a 390px screen the one
                                    thing the page exists for was two scrolls down. It clears the
                                    bottom nav bar when that bar is present (signed-in only). */}
                                <div className={IsloggedIn
                                    ? "mt-6"
                                    : "fixed inset-x-0 bottom-0 z-40 border-t-2 border-black px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))] [body:has(.retro-bottom-bar)_&]:bottom-[calc(var(--sp-bottombar-h)+var(--sp-bottombar-inset))] [body:has(.retro-bottom-bar)_&]:pb-3 md:static md:z-auto md:border-0 md:bg-transparent md:p-0 md:mt-6"}>
                                    {/* The price scrolls out of view long before the bar does,
                                        so the bar carries it. Phone only — on desktop the price
                                        block above is always on screen beside the button. */}
                                    {!IsloggedIn && price > 0 && (
                                        <div className="flex items-baseline justify-between gap-3 mb-2 md:hidden">
                                            <span className="text-[11px] font-black uppercase tracking-widest text-black/60">
                                                {shop?.type === 'physical' && parseFloat(shippingPrice) > 0 ? 'Total incl. shipping' : 'Total'}
                                            </span>
                                            <span className="text-xl font-black tabular-nums">
                                                {formatMultiPrice(
                                                    calculateTotalSupporterPays(
                                                        shop.is_member == 1 && shop.special_member_price
                                                            ? baseSpecialPriceToGrossUp
                                                            : baseRegularPriceToGrossUp,
                                                        itemCurrency,
                                                        0,
                                                        creatorIdOf(shop)
                                                    ).total_supporter_pays,
                                                    itemCurrency
                                                )}
                                            </span>
                                        </div>
                                    )}
                                    {IsloggedIn ? (
                                        // The owner used to get a dead end here — no edit, no way back to their shop.
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <Link
                                                href="/shop?type=products"
                                                className="w-full sm:w-auto text-center font-black uppercase bg-yellow-300 border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
                                            >
                                                Manage in my shop
                                            </Link>
                                            <Link
                                                href="/shop?type=orders"
                                                className="w-full sm:w-auto text-center font-black uppercase bg-white border-[3px] border-black px-6 py-3 min-h-[44px] rounded-box-sm transition-all hover:translate-x-[2px] hover:translate-y-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-black"
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
                                                    className="w-full md:w-auto md:min-w-[220px]"
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
                                                        classes="w-full md:w-auto btn-pink !text-[16px] !px-6 py-3 text-white"
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
