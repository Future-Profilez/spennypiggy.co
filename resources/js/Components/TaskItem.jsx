import PriceFormat from "@/includes/PriceFormat";
import { Link, router, usePage } from "@inertiajs/react";
import RewardHint from "@/Pages/discover/components/RewardHint";
import { supporterFeeCaption } from "@/lib/fees";
import { feeRatesFor, creatorIdOf, supporterTotal } from "@/utils/pricing";
import ScheduledBadge from "@/Components/ScheduledBadge";
import SaveButton from "@/Components/SaveButton";
import GetHelpButton from "@/Components/Help/GetHelpButton";

export default function TaskItem({ task, IsloggedIn, profileUser }) {
    const { auth, platform_fee_percentage, transaction_fee_percentage } =
        usePage().props;
    const __pageProps = usePage().props;
    const { formatMultiPrice, adminFeeInCurrency, supporterFixedFee } = PriceFormat();
    const url = `/task/${task.uuid}`;
    const approvalStatus = Number(task?.is_approved);
    const isRejected = approvalStatus === 2;
    const isApproved = approvalStatus === 1 || task?.is_approved === true;
    const isPending = !isApproved && !isRejected;
    const reviewMessage =
        task?.moderation_reason ||
        task?.reason ||
        task?.is_approved_reason ||
        "Item is currently under review. Please check again after 30 minutes.";

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

    const calculateTotalSupporterPays = (price, curr, vatAmount = 0) => {
        const listedPrice = parseFloat(price || 0);
        const vat = parseFloat(vatAmount || 0);
        const isZeroDecimal = isZeroDecimalCurrency(curr);
        const priceWithVat = listedPrice + vat;
        // 🚨 THE FORMULA LIVES IN ONE PLACE (`utils/pricing`), NEVER HERE. This
        // surface carried its own copy of the legacy gross-up, so when the
        // platform moved to an all-in supporter fee on 11 Sep 2026 it went on
        // quoting the old, higher total while checkout charged the new one —
        // with nothing wrong in any log. `feeRatesFor` carries the live model
        // alongside the rates, so a call site cannot pick the wrong arithmetic.
        const __rates = feeRatesFor(creatorIdOf(task) ?? profileUser?.id, __pageProps);

        return supporterTotal(priceWithVat, {
            ...__rates,
            adminFee: adminFeeInCurrency(curr),
            fixedFee: supporterFixedFee(curr),
            isZeroDecimal,
        });
    };

    const isCreator = auth?.user?.id === (profileUser?.id || task.creator_id);
    const vatPercentage = profileUser?.vat_amount_percentage || 0;
    const vatAmount =
        (parseFloat(String(task.price || 0).replace(/,/g, "")) +
            parseFloat(String(task.tax_amount || 0).replace(/,/g, ""))) *
        (vatPercentage / 100);

    return (
        // The whole card opens the task, matching ShopCard. Only the title was
        // clickable before, so a tap anywhere else — the description, the price, the
        // image area — did nothing at all, which reads as a broken card.
        <div
            role="link"
            tabIndex={0}
            aria-label={task.title}
            onClick={() => router.visit(url)}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.visit(url);
                }
            }}
            className="cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-[#FF007F] focus-visible:ring-offset-2 flex h-full flex-col bg-[#fdfbf7] rounded-box p-5 transition-colors duration-200 hover:bg-black/[0.03] border-[2px] !border-black"
        >
            {/* ⚠️ A ROW, not an absolutely-placed heart. This card has no image and
                no `relative` root, and the title is `line-clamp-1` — an overlay in the
                corner would sit on top of the last word of a long title. Laying them
                out side by side lets the title shrink instead. */}
            <div className="flex items-start justify-between gap-3">
                <Link
                    href={url}
                    // The card already navigates; without this the inner link fires a
                    // second visit to the same URL.
                    onClick={(e) => e.stopPropagation()}
                    className="text-lg sm:text-xl text-black line-clamp-1 font-black capitalize tracking-wide"
                >
                    {task.title}
                </Link>
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                    <SaveButton
                        productType="task"
                        itemId={task?.id}
                        creatorId={profileUser?.id || task?.creator_id}
                    />
                </div>
            </div>
            <p className="text-sm text-gray-700 font-bold !mt-2 line-clamp-2">
                {task.description}
            </p>
            <RewardHint item={task} className="mt-2 max-w-full" />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {task?.is_suspended == 1 && (
                    <div className="relative group/suspend cursor-help">
                        <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border-2 border-black bg-red-600 text-white">
                            Suspended
                        </span>
                        {task.suspend_reason && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-black text-white text-[12px] p-2 rounded-box-sm opacity-0 group-hover/suspend:opacity-100 transition-opacity pointer-events-none z-10">
                                Reason: {task.suspend_reason}
                            </div>
                        )}
                    </div>
                )}
                {isPending && task?.is_suspended != 1 && (
                    <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border-2 border-black bg-yellow-300 text-black">
                        Pending Approval
                    </span>
                )}
                {task?.status && String(task.status).trim() !== "" && (
                    <span
                        className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border-2 border-black ${
                            task.status === "active"
                                ? "bg-[#A2E4B8] text-black"
                                : "bg-yellow-300 text-black"
                        }`}
                    >
                        {task.status}
                    </span>
                )}
                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border-2 border-black bg-blue-300 text-black">
                    {task.type} Delivery
                </span>
                {task?.sla_hours ? (
                    <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border-2 border-black bg-yellow-300 text-black">
                        {task.sla_hours} Hours
                    </span>
                ) : (
                    ""
                )}
                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-black border-2 border-black bg-[#b892ff] text-black">
                    {task.category || "Paid Task"}
                </span>
            </div>
            {task.suspend_reason && (
                <div className="mt-3 text-red-500 text-[13px] pointer-events-none z-10">
                    Suspension Reason: {task.suspend_reason}
                </div>
            )}

            {/* Footer: price + CTA pinned to the card bottom */}
            <div className="mt-auto pt-4">
                <div className="flex items-end justify-between gap-3 border-t border-black/10 pt-3">
                    <div className="min-w-0">
                        <p className="text-xl sm:text-2xl font-black leading-none text-black">
                            {isCreator
                                ? formatMultiPrice(
                                      task.price,
                                      task.currency || "USD",
                                  )
                                : formatMultiPrice(
                                      calculateTotalSupporterPays(
                                          task.price,
                                          task.currency || "USD",
                                          vatAmount,
                                      ),
                                      task.currency || "USD",
                                  )}
                        </p>
                        {!isCreator && (
                            <span className="mt-1 block text-[12px] font-bold leading-tight text-gray-500">
                                {supporterFeeCaption(__pageProps)}
                            </span>
                        )}
                    </div>
                    {!IsloggedIn ? (
                        <Link
                            href={`/task/${task.uuid}`}
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 whitespace-nowrap text-xs sm:text-sm inline-block px-4 py-2.5 bg-yellow-300 border-[3px] border-black text-black font-black uppercase tracking-wider rounded-box-sm transition-colors duration-200 hover:brightness-105"
                        >
                            {task.type === "instant"
                                ? "Pay to Access 🔓"
                                : "Pay to Assign 📝"}
                        </Link>
                    ) : (
                        ""
                    )}
                </div>
                {isRejected ? (
                    <div className="!pt-3">
                        <p className="block text-red-600 font-bold text-sm">
                            Action Required: {reviewMessage}
                        </p>
                        {IsloggedIn ? (
                            <div className="mt-2">
                                <GetHelpButton code="moderation_hold" source="tasks" sourceId={task?.uuid} />
                            </div>
                        ) : null}
                    </div>
                ) : isPending ? (
                    <div className="!pt-3">
                        <p className="block text-yellow-700 font-bold text-sm">
                            Under Review: {reviewMessage}
                        </p>
                        {/* `IsloggedIn` here means the OWNER is viewing (documented). */}
                        {IsloggedIn && task?.moderation_reason ? (
                            <div className="mt-2">
                                <GetHelpButton code="moderation_hold" source="tasks" sourceId={task?.uuid} />
                            </div>
                        ) : null}
                    </div>
                ) : (
                    ""
                )}

                {/* Not on sale yet, however finished it looks. */}
                {task?.publish_at && (
                    <ScheduledBadge publishAt={task.publish_at} className="mt-3" />
                )}
            </div>
        </div>
    );
}
