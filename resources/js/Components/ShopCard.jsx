import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import AddItem from "@/Pages/shop/AddItem";
import RewardHint from "@/Pages/discover/components/RewardHint";

export default function ShopCard({
    item,
    IsloggedIn = false,
    showCreator = false,
}) {
    const { auth, user } = usePage().props;
    const { formatMultiPrice, calculateTotalSupporterPays } = PriceFormat();

    const slug = (inputString = "") => {
        return inputString
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .trim()
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-");
    };

    const url = `/shop/item/${slug(item?.name)}/${item?.uuid}`;
    //`slot_limitation` is REMAINING stock (the server decrements it per sale).
    const hasStockLimit =
        item?.slot_limitation !== null && item?.slot_limitation !== undefined;
    const stockLeft = hasStockLimit ? Number(item.slot_limitation) : null;
    const isSoldOut = hasStockLimit && stockLeft <= 0;
    const isOwner = Number(auth?.user?.id) === Number(item?.user_id);
    const basePrice = parseFloat(item?.price || 0);
    const itemType = (item?.type || "").toLowerCase();
    const isPhysical = itemType === "physical";
    const productImage =
        item?.perma_link ||
        item?.image_url ||
        "https://ucarecdn.com/901c0a0e-e5de-4d7a-8ac3-de11a4632542/";

    const shippingPrice = isPhysical
        ? (() => {
              const shippingRates = item?.shop_shipping_info || [];
              // Worldwide rate only. Falling back to shippingRates[0] could quote a
              // domestic rate on the card and a higher one at checkout.
              const baselineRate = shippingRates.find(
                  (s) =>
                      s.country?.toLowerCase() === "all" ||
                      s.country?.toLowerCase() === "worldwide",
              );
              return parseFloat(baselineRate?.shipping_price || 0);
          })()
        : 0;

    const vatPercent = item?.user?.vat_amount_percentage ?? 0;
    const vatAmount = (basePrice * vatPercent) / 100;
    const basePriceWithShippingAndVat = basePrice + vatAmount + shippingPrice;
    const supporterPays =
        calculateTotalSupporterPays(
            basePriceWithShippingAndVat,
            item?.currency || "GBP",
        )?.total_supporter_pays ?? basePriceWithShippingAndVat;

    return (
        <article
            role="link"
            tabIndex={0}
            aria-label={item?.name}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === "") {
                    e.preventDefault();
                    router.visit(url);
                }
            }}
            onClick={() => router.visit(url)}
            className="cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F] focus-visible:ring-offset-2 max-w-sm w-full h-full bg-white border-[3px] border-black rounded-box hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all overflow-hidden flex flex-col"
        >
            <div className="p-3 md:p-4 h-full flex flex-col">
                <div className="relative">
                    {item?.is_suspended == 1 && (
                        <div className="absolute top-2 left-5 right-5 bg-red-600 border-2 border-black z-10 text-white text-xs font-black p-2 rounded-box-sm text-center">
                            SUSPENDED
                            {item?.suspend_reason && (
                                <div className="mt-1 text-[11px] font-bold normal-case">
                                    Reason: {item.suspend_reason}
                                </div>
                            )}
                        </div>
                    )}
                    {IsloggedIn && Number(item?.approved) === 0 && (
                        <div
                            className={`absolute left-5 right-5 bg-yellow-300 border-2 border-black z-10 text-black text-xs font-black p-2 rounded-box-sm text-center  ${isOwner && item?.is_suspended == 1 ? "top-16" : "top-2"}`}
                        >
                            {item?.moderation_reason
                                ? "Under review"
                                : "Waiting for approval"}
                            {item?.moderation_reason && (
                                <div className="mt-1 text-[11px] font-bold normal-case">
                                    {item.moderation_reason}
                                </div>
                            )}
                        </div>
                    )}
                    {isOwner &&
                        item?.edited_status == 0 &&
                        item?.edited_reason && (
                            <div
                                className={`absolute left-5 right-5 bg-red-100 border-2 border-red-500 z-10 text-red-700 text-xs font-black p-2 rounded-box-sm text-center shadow-[2px_2px_0px_0px_rgba(239,68,68,1)] ${isOwner && item?.is_suspended == 1 ? "top-16" : "top-12"}`}
                            >
                                Admin requested changes: {item.edited_reason}
                            </div>
                        )}
                    <div className="">
                        <div className="block border border-black rounded-box-sm overflow-hidden relative">
                            <span
                                className={`absolute top-2 left-2 text-[13px] px-3 py-1 rounded-box-sm border-2 border-black font-black uppercase  ${isPhysical ? "bg-blue-300" : "bg-green-300"}`}
                            >
                                {isPhysical ? "Physical" : "Digital"}
                            </span>
                            <img
                                className="object-cover h-[130px] sm:h-[160px] w-full"
                                src={productImage}
                                alt={item?.name || "Shop item"}
                            />
                            {isSoldOut && (
                                <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                                    <span className="bg-black text-white px-4 py-2 rounded-box-sm border-2 border-black font-black uppercase text-sm tracking-widest">
                                        Sold out
                                    </span>
                                </div>
                            )}
                            {item?.ai_generated == 1 && (
                                <div className="absolute bottom-2 left-2 z-1 bg-[#FF007F] border-2 border-black font-black rounded-box-sm px-2 py-1 text-[10px] text-black">
                                    MADE WITH AI
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-1 mt-2 sm:mt-4 mb-3 min-h-[94px]">
                    <div className="flex items-center gap-2">
                        <h2 className="text-sm line-clamp-1 sm:text-lg font-black text-black uppercase tracking-wide">
                            {item?.name}
                        </h2>
                    </div>
                    {showCreator && item?.user?.username && (
                        <Link
                            href={`/${item.user.username}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-xs sm:text-sm font-semibold text-gray-700 hover:text-black hover:underline w-fit"
                        >
                            by @{item.user.username}
                        </Link>
                    )}
                    <span className="text-[13px] sm:text-normal font-bold text-gray-700 line-clamp-2">
                        {item?.description}
                    </span>
                    <RewardHint item={item} className="mt-1 max-w-full" />
                </div>

                <div className="mt-auto">
                    <div className="mb-3 flex items-start justify-between min-h-[64px]">
                        <div className="flex flex-col">
                            <h2 className="font-black text-lg sm:text-2xl text-black">
                                {formatMultiPrice(
                                    isOwner ? basePrice : supporterPays,
                                    item?.currency || "GBP",
                                ) || "FREE"}
                            </h2>
                            {!isOwner && (
                                <span className="text-[13px] text-gray-500 font-normal mt-1 leading-tight">
                                    *Includes platform and payment processing
                                    fees
                                    {isPhysical
                                        ? shippingPrice > 0
                                            ? " and shipping"
                                            : ". Free shipping"
                                        : ""}
                                </span>
                            )}
                            {hasStockLimit && !isSoldOut && stockLeft <= 10 && (
                                <span className="text-[13px] font-black text-[#FF007F] mt-1 leading-tight">
                                    Only {stockLeft} left
                                </span>
                            )}
                        </div>
                    </div>

                    {isOwner ? (
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                        >
                            <AddItem
                                classes="font-black cursor-pointer bg-blue-300 border-2 border-black px-4 py-3 min-h-[44px] rounded-box-sm hover:bg-blue-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all text-black text-sm sm:text-base uppercase"
                                pre_title={item?.name}
                                title="Edit Item"
                                pre_description={item?.description}
                                pre_price={item?.price}
                                product_type={item?.type}
                                item={item}
                                isEdit={true}
                                IsloggedIn={IsloggedIn}
                            />
                        </div>
                    ) : (
                        <button
                            disabled={isSoldOut}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isSoldOut) return;
                                router.visit(url);
                            }}
                            className={`font-black border-2 border-black px-4 py-3 min-h-[44px] rounded-box-sm text-black text-sm sm:text-base uppercase ${isSoldOut ? "bg-gray-200 cursor-not-allowed opacity-70" : "bg-yellow-300 hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none cursor-pointer"} focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all`}
                        >
                            {isSoldOut ? "Sold out" : "Buy Now"}
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
