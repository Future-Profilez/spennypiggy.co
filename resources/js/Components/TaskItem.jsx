import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";
import RewardHint from "@/Pages/discover/components/RewardHint";

export default function TaskItem({ task, IsloggedIn, profileUser }) {
    const { auth, platform_fee_percentage, transaction_fee_percentage } =
        usePage().props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
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
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.3;
        const platformFeeRate = (platform_fee_percentage || 17) / 100;
        const complianceFeeRate = (transaction_fee_percentage || 2) / 100;
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

    const isCreator = auth?.user?.id === (profileUser?.id || task.creator_id);
    const vatPercentage = profileUser?.vat_amount_percentage || 0;
    const vatAmount =
        (parseFloat(String(task.price || 0).replace(/,/g, "")) +
            parseFloat(String(task.tax_amount || 0).replace(/,/g, ""))) *
        (vatPercentage / 100);

    return (
        <div className="flex h-full flex-col bg-[#fdfbf7] rounded-box p-5 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-[3px] !border-black">
            <Link
                href={url}
                className="text-lg sm:text-xl text-black line-clamp-1 font-black capitalize tracking-wide"
            >
                {task.title}
            </Link>
            <p className="text-sm text-gray-700 font-bold !mt-2 line-clamp-2">
                {task.description}
            </p>
            <RewardHint item={task} className="mt-2 max-w-full" />
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {task?.is_suspended == 1 && (
                    <div className="relative group/suspend cursor-help">
                        <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 border-black bg-red-600 text-white">
                            Suspended
                        </span>
                        {task.suspend_reason && (
                            <div className="absolute top-full left-0 mt-2 w-48 bg-black text-white text-[10px] p-2 rounded-lg opacity-0 group-hover/suspend:opacity-100 transition-opacity pointer-events-none z-10">
                                Reason: {task.suspend_reason}
                            </div>
                        )}
                    </div>
                )}
                {isPending && task?.is_suspended != 1 && (
                    <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 border-black bg-yellow-300 text-black">
                        Pending Approval
                    </span>
                )}
                {task?.status && String(task.status).trim() !== "" && (
                    <span
                        className={`uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 border-black ${
                            task.status === "active"
                                ? "bg-[#A2E4B8] text-black"
                                : "bg-yellow-300 text-black"
                        }`}
                    >
                        {task.status}
                    </span>
                )}
                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 border-black bg-blue-300 text-black">
                    {task.type} Delivery
                </span>
                {task?.sla_hours ? (
                    <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 border-black bg-yellow-300 text-black">
                        {task.sla_hours} Hours
                    </span>
                ) : (
                    ""
                )}
                <span className="uppercase inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-black border-2 border-black bg-[#b892ff] text-black">
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
                            <span className="mt-1 block text-[10px] font-bold leading-tight text-gray-500">
                                Includes platform & processing fees
                            </span>
                        )}
                    </div>
                    {!IsloggedIn ? (
                        <Link
                            href={`/task/${task.uuid}`}
                            className="shrink-0 whitespace-nowrap text-xs sm:text-sm inline-block px-4 py-2.5 bg-yellow-300 border-[3px] border-black text-black font-black uppercase tracking-wider rounded-box-sm hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
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
                    <p className="!pt-3 block text-red-600 font-bold text-sm">
                        Action Required: {reviewMessage}
                    </p>
                ) : isPending ? (
                    <p className="!pt-3 block text-yellow-700 font-bold text-sm">
                        Under Review: {reviewMessage}
                    </p>
                ) : (
                    ""
                )}
            </div>
        </div>
    );
}
