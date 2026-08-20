import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import AddItem from "@/Pages/shop/AddItem";
import RewardHint from "@/Pages/discover/components/RewardHint";
import WaitlistButton from "@/Components/WaitlistButton";
import { creatorIdOf } from "@/utils/pricing";
import ItemStatusBadge from "@/Components/ItemStatusBadge";
import discoveryLink from "@/lib/discoveryLink";

export default function ShopCard({
    item,
    IsloggedIn = false,
    showCreator = false,
    /* Discovery attribution. Set ONLY by a Spenny-Piggy-chosen surface
       (Discover's grid and carousels); undefined on the creator's own shop,
       where the visit is their own traffic. */
    discoverySource,
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
            0,
            creatorIdOf(item),
        )?.total_supporter_pays ?? basePriceWithShippingAndVat;

    // EVERY state that applies. A shop item can carry three at once — suspended,
    // held for review, and an admin's change request — and the old markup stacked
    // all three as full blocks, which at two columns was taller than the product
    // itself. The badge ranks them and puts the rest behind a count.
    // ⚠️ `approved` here, not the wish table's `is_approved`: the two tables
    // genuinely differ, so this cannot be lifted into a shared helper blind.
    const statusNotices = [
        item?.is_suspended == 1 && {
            state: "suspended",
            reason: item?.suspend_reason,
        },
        IsloggedIn &&
            Number(item?.approved) === 0 && {
                // A reason means an admin looked and refused; none means nobody
                // has reached it yet. Different things for the creator to do.
                state: item?.moderation_reason ? "changes" : "in_review",
                reason: item?.moderation_reason || null,
            },
        isOwner &&
            item?.edited_status == 0 &&
            item?.edited_reason && {
                state: "changes",
                reason: item.edited_reason,
            },
    ].filter(Boolean);

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
            className="cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F] focus-visible:ring-offset-2 self-start max-w-sm w-full bg-white border-[3px] border-black rounded-box transition-colors duration-200 hover:bg-black/[0.03] overflow-hidden h-full flex flex-col"
        >
            <div className="p-2 sm:p-3 flex flex-col h-full">
                {/* Status notices.
                    🚨 These are in NORMAL FLOW, above the image — never absolutely
                    positioned over it. Three of them can be live at once and each
                    carries an admin-written reason of arbitrary length, so the old
                    hand-tuned `top-2 / top-12 / top-16` offsets could only ever
                    separate two: a suspended item with both a moderation reason and
                    an edit reason drew all three on the same pixels, over the type
                    badge and the product title. Stacking them costs vertical space
                    and cannot overlap, whatever the copy says. */}
                {statusNotices.length > 0 && (
                    <div className="mb-2 flex sm:mb-3">
                        <ItemStatusBadge
                            notices={statusNotices}
                            itemName={item?.name}
                        />
                    </div>
                )}

                {/* Image Section */}
                <div className="relative">
                    {/* Product Image */}
                    <div className="block border-[3px] border-black rounded-box-sm overflow-hidden relative bg-gray-50 aspect-[4/3]">
                        <span
                            className={`absolute top-1.5 left-1.5 text-[9px] px-1.5 py-0.5 sm:top-3 sm:left-3 sm:text-xs sm:px-3 sm:py-1.5 rounded-box-sm border-2 border-black font-black uppercase z-10 ${
                                isPhysical ? "bg-blue-300" : "bg-green-300"
                            }`}
                        >
                            {isPhysical ? "Physical" : "Digital"}
                        </span>

                        <img
                            className="object-cover w-full h-full"
                            src={productImage}
                            alt={item?.name || "Shop item"}
                        />

                        {isSoldOut && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                                <span className="bg-black text-white px-4 py-2 rounded-box-sm border-2 border-black font-black uppercase text-sm tracking-widest">
                                    Sold out
                                </span>
                            </div>
                        )}

                        {/* ⚠️ TOP-RIGHT, not bottom-left. This and the reward pill
                            were both pinned to `bottom-2 left-2` and drew on top of
                            each other on every AI-generated listing. The type badge
                            owns top-left, so this takes the only free corner. */}
                        {item?.ai_generated == 1 && (
                            <div className="absolute top-1.5 right-1.5 z-10 bg-[#FF007F] border-2 border-black font-black rounded-box-sm px-1 py-0.5 text-[8px] text-black sm:top-3 sm:right-3 sm:px-2 sm:py-1 sm:text-[12px]">
                                MADE WITH AI
                            </div>
                        )}
                    </div>
                </div>

                {/* The reward line is product INFORMATION, not a caption on the
                    picture, and its text is creator-written and of unknown length —
                    over the image it truncated to "You get: …", which says nothing.
                    In flow it can wrap. */}
                <RewardHint item={item} className="mt-1.5 max-w-full sm:mt-2" />

                {/* --- FIX: TITLE ON ITS OWN LINE, DESCRIPTION ON EXACTLY 1 LINE --- */}
                <div className="flex flex-col mt-2 sm:mt-3">
                    {/* Creator (Only visible if passed) */}
                    {showCreator && item?.user?.username && (
                        <Link
                            href={
                                discoverySource
                                    ? discoveryLink(
                                          item.user.username,
                                          discoverySource
                                      )
                                    : `/${item.user.username}`
                            }
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-semibold text-gray-700 hover:text-black hover:underline w-fit mb-0.5 truncate max-w-full sm:text-xs sm:mb-1"
                        >
                            by @{item.user.username}
                        </Link>
                    )}

                    {/* Title - Always 1 line */}
                    <h2 title={item?.name || "Untitled Product"} className="text-[13px] font-black text-black uppercase tracking-wide truncate sm:text-base">
                        {item?.name || "Untitled Product"}
                    </h2>

                    {/* ⚠️ Hidden at two columns. Already `truncate`, so in a ~170px
                        column it renders as three or four words and an ellipsis —
                        which tells a buyer nothing while costing a line. The title
                        and the reward line above it carry the description's job at
                        this width. */}
                    <p title={item?.description || "No description available"} className="hidden text-sm font-medium text-gray-700 truncate mt-0.5 sm:block">
                        {item?.description || "No description available"}
                    </p>
                </div>

                {/* PRICE + FEES + STOCK ROW */}
                {/* ⚠️ STACKED at two columns, side-by-side from `sm`. An
                    unconstrained right-hand column in a ~170px row is what pushed
                    "Only 4 left" outside the card — the documented rule from the
                    leaderboard rows. Stacking costs one line and cannot overflow. */}
                <div className="mt-2 flex flex-col gap-0.5 sm:mt-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0">
                    <div className="flex min-w-0 flex-col leading-tight">
                        <span className="font-black text-[17px] text-black sm:text-2xl">
                            {formatMultiPrice(
                                isOwner ? basePrice : supporterPays,
                                item?.currency || "GBP",
                            ) || "FREE"}
                        </span>
                        {/* ⚠️ Two wordings of ONE disclosure. The full sentence ran
                            to six lines in a 170px column and buried the price it
                            belongs to; checkout states it in full before anyone
                            pays. Never drop it — the price a logged-out visitor
                            sees IS the grossed-up one. */}
                        {!isOwner && (
                            <>
                                <span className="mt-0.5 text-[10px] font-normal leading-tight text-gray-500 sm:hidden">
                                    *Fees{isPhysical && shippingPrice > 0 ? " + shipping" : ""} included
                                    {isPhysical && shippingPrice === 0 && " · free shipping"}
                                </span>
                                <span className="mt-0.5 hidden text-[12px] font-normal text-gray-500 sm:inline">
                                    *Includes platform and payment processing fees
                                    {isPhysical && shippingPrice > 0 && " and shipping"}
                                    {isPhysical && shippingPrice === 0 && ". Free shipping"}
                                </span>
                            </>
                        )}
                    </div>

                    {hasStockLimit && !isSoldOut && stockLeft <= 10 && (
                        <span className="shrink-0 whitespace-nowrap text-[11px] font-black text-[#FF007F] sm:ml-2 sm:text-[13px]">
                            Only {stockLeft} left
                        </span>
                    )}
                </div>

                {/* BUTTON SECTION */}
                <div className="mt-auto pt-3">
                    {isOwner ? (
                        <div
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            className="w-full"
                        >
                            <AddItem
                                classes="font-black cursor-pointer bg-blue-300 border-[3px] border-black px-2 py-3 min-h-[44px] sm:px-4 rounded-box-sm hover:bg-blue-400 active:translate-x-[2px] active:translate-y-[2px] focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all text-black text-[11px] sm:text-sm uppercase w-full text-center "
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
                    ) : isSoldOut ? (
                        /* A sold-out card used to end here with a dead grey button —
                           every visitor after the last sale simply left, and the
                           creator never learned the demand existed. */
                        <WaitlistButton
                            shopUuid={item?.uuid}
                            initialWaiting={item?.is_waiting}
                            isGuest={!auth?.user}
                        />
                    ) : (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                router.visit(url);
                            }}
                            className="font-black border-2 border-black px-2 py-2 md:py-3 sm:px-4 rounded-[15px] text-black text-[11px] sm:text-base uppercase bg-yellow-300 hover:bg-yellow-400 active:translate-x-[2px] active:translate-y-[2px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-black transition-all"
                        >
                            Buy Now
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
}
