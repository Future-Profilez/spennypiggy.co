import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";

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
            (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);

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
        <div className="bg-[#fdfbf7] rounded-[35px] mb-4 p-6 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all border-[3px] !border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <div className="md:flex justify-between items-center">
                <div className="">
                    <Link
                        href={url}
                        className="text-2xl text-black line-clamp-1 font-black capitalize tracking-wide"
                    >
                        {task.title}
                    </Link>
                    <p className="text-sm text-gray-700 font-bold !my-3 line-clamp-2">
                        {task.description}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        {task?.is_suspended == 1 && (
                            <div className="relative group/suspend cursor-help">
                                <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-red-600 text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
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
                            <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                Pending Approval
                            </span>
                        )}
                        {task?.status && String(task.status).trim() !== "" && (
                            <span
                                className={`uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black ${
                                    task.status === "active"
                                        ? "bg-[#A2E4B8] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                        : "bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                }`}
                            >
                                {task.status}
                            </span>
                        )}
                        <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-blue-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {task.type} Delivery
                        </span>
                        {task?.sla_hours ? (
                            <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-yellow-300 text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                {task.sla_hours} Hours
                            </span>
                        ) : (
                            ""
                        )}
                        <span className="uppercase inline-flex items-center px-3 py-1 rounded-xl text-xs font-black border-[3px] border-black bg-[#b892ff] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {task.category || "Paid Task"}
                        </span>
                    </div>
                    {task.suspend_reason && (
                        <div className="mt-4 text-red-500 text-[14px] pointer-events-none z-10">
                            Suspension Reason: {task.suspend_reason}
                        </div>
                    )}
                </div>
                <div className="text-start ps-0 md:!ps-6 mt-6 md:mt-0">
                    <div className="min-w-[100px] gap-4 flex flex-wrap md:!flex-nowrap items-center justify-end">
                        <div className="flex flex-col items-end">
                            <p className="text-2xl sm:text-2xl font-black text-black">
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
                                <span className="block text-xs text-gray-500 font-bold mt-0 leading-tight text-right">
                                    *Includes platform and payment processing fees
                                </span>
                            )}
                        </div>
                        {!IsloggedIn ? (
                            <div className="">
                                <Link
                                    href={`/task/${task.uuid}`}
                                    className="whitespace-nowrap text-sm sm:text-base inline-block px-6 py-3 bg-yellow-300 border-[3px] border-black text-black font-black uppercase tracking-wider rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                                >
                                    <>
                                        {task.type === "instant"
                                            ? "Pay to Access 🔓"
                                            : "Pay to Assign 📝"}{" "}
                                    </>
                                </Link>
                            </div>
                        ) : (
                            ""
                        )}
                    </div>
                </div>
            </div>
            {isRejected ? (
                <p className="!pt-3 block text-red-600 font-bold">
                    Action Required: {reviewMessage}
                </p>
            ) : isPending ? (
                <p className="!pt-3 block text-yellow-700 font-bold">
                    Under Review: {reviewMessage}
                </p>
            ) : (
                ""
            )}
        </div>
    );
}
