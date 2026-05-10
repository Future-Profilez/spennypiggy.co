import { useEffect, Fragment } from "react";
import { useState } from "react";
import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";
import dummy from "../../assets/img/uploadedimg.png";
import EditMembership from "@/Pages/membership/EditMembership";
import { Menu, Transition } from "@headlessui/react";
import RemoveMembership from "@/Pages/membership/RemoveMembership";
import { useAlerts } from "@/Components/Alerts";

const rewards_lists = [
    { title: "Green Circle Insta", value: "green_circle_insta" },
    { title: "Insta Broadcast", value: "insta_broadcast" },
    { title: "⁠Telegram Group", value: "telegram_group" },
    { title: " ⁠X Community ", value: "x_community" },
    { title: "⁠Monthly Content Bundle", value: "monthly_content_bundle" },
    { title: "Weekly Content Bundle", value: "weekly_content_bundle" },
    { title: "⁠Weekly DM chat", value: "weekly_DM_chat" },
    { title: "Monthly DM chat", value: "monthly_DM_chat" },
    { title: "Monthly Video call", value: "monthly_video_call" },
    { title: "Weekly Video call", value: "weekly_video_call" },
];

export default function MembershipItem({ item, IsloggedIn, showAllBenefits = false }) {
    const { auth, platform_fee_percentage, transaction_fee_percentage } =
        usePage().props;
    const { formatMultiPrice, adminFeeInCurrency } = PriceFormat();
    const [rewards, setrewards] = useState(
        item?.rewards ? JSON.parse(item.rewards) : [],
    );
    const [isExpanded, setIsExpanded] = useState(false);
    useAlerts();

    const getRewardTitle = (e) => {
        const reward = rewards_lists.filter((r) => r?.value == e);
        return reward && reward[0] && reward[0].title;
    };

    useEffect(() => {
        setrewards(item?.rewards ? JSON.parse(item.rewards) : []);
        setIsExpanded(false);
    }, [item]);

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
        const stripeFeeRate = 0.029;
        const stripeFixedFee = isZeroDecimal ? 0 : 0.3;
        const platformFeeRate = (platform_fee_percentage || 17) / 100;
        const complianceFeeRate = (transaction_fee_percentage || 2) / 100;
        const adminFee = adminFeeInCurrency(curr);
        const totalDeductionRate =
            stripeFeeRate + platformFeeRate + complianceFeeRate;

        if (totalDeductionRate >= 1) {
            return priceWithVat;
        }

        const totalSupporterPays =
            (priceWithVat + stripeFixedFee + adminFee) / (1 - totalDeductionRate);
        if (!isZeroDecimal) {
            return Math.ceil(totalSupporterPays * 100) / 100;
        }
        return Math.ceil(totalSupporterPays);
    };

    const tierThemes = {
        gold: {
            bg: "bg-[#FFD700]",
            text: "text-black",
        },
        silver: {
            bg: "bg-[#E5E7EB]",
            text: "text-black",
        },
        bronze: {
            bg: "bg-[#F97316]",
            text: "text-white",
        },
        platinum: {
            bg: "bg-[#F3F4F6]",
            text: "text-black",
        },
        lifetime: {
            bg: "bg-[#22C55E]",
            text: "text-white",
        },
        default: {
            bg: "bg-white",
            text: "text-black",
        },
    };

    const isCreator = auth?.user?.id === item?.user_id;
    const theme = tierThemes[item?.level?.toLowerCase()] || tierThemes.default;
    const shouldShowAllBenefits = showAllBenefits || isExpanded;
    const visibleRewards = shouldShowAllBenefits ? rewards : rewards.slice(0, 2);
    const remainingBenefits = Math.max((rewards?.length || 0) - 2, 0);

    return (
        <div className={`${item?.status == 0 ? "inactive-item" : ""} h-full group/card`}>
            <div className="relative flex flex-col h-full bg-white rounded-[30px] border-[3px] border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 overflow-hidden">
                <div className="p-6 relative bg-[#fdfbf7]">
                    {item?.is_suspended == 1 && (
                        <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg z-10 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)] group/suspend cursor-help">
                            Suspended
                            {item.suspend_reason && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-black text-white text-[10px] p-2 rounded-lg opacity-0 group-hover/suspend:opacity-100 transition-opacity pointer-events-none">
                                    Reason: {item.suspend_reason}
                                </div>
                            )}
                        </div>
                    )}
                    {IsloggedIn && item?.approved == 0 && item?.is_suspended != 1 && (
                        <div className="absolute top-3 left-3 bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded-lg z-10 shadow-[0px_2px_0px_0px_rgba(0,0,0,1)]">
                            Pending Approval
                        </div>
                    )}
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col">
                            <span
                                className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest border-2 border-black rounded-full mb-3 w-max ${theme.bg} ${theme.text} shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                            >
                                Tier
                            </span>
                            <h3 className="text-2xl font-black uppercase tracking-tight leading-none text-gray-900">
                                {item?.level}
                            </h3>
                        </div>
                        <div className="w-14 h-14 rounded-2xl border-[3px] border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] overflow-hidden shrink-0 group-hover/card:-rotate-3 transition-transform">
                            <img
                                src={item?.perma_link || dummy}
                                alt={item?.level}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-black tracking-tighter text-black">
                            {isCreator
                                ? formatMultiPrice(item?.price, item?.currency)
                                : formatMultiPrice(
                                      calculateTotalSupporterPays(
                                          item?.price,
                                          item?.currency,
                                          item?.user?.vat_amount_percentage || 0,
                                      ),
                                      item?.currency,
                                  )}
                        </span>
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">
                            / mo
                        </span>
                    </div>

                    {IsloggedIn && (
                        <div className="absolute top-4 right-4">
                            <Menu as="div" className="relative">
                                <Menu.Button className="p-1.5 rounded-full bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-50 transition-colors">
                                    <div className="flex gap-[3px]">
                                        <span className="bg-black w-1 h-1 rounded-full"></span>
                                        <span className="bg-black w-1 h-1 rounded-full"></span>
                                        <span className="bg-black w-1 h-1 rounded-full"></span>
                                    </div>
                                </Menu.Button>
                                <Transition
                                    as={Fragment}
                                    enter="transition ease-out duration-100"
                                    enterFrom="transform opacity-0 scale-95"
                                    enterTo="transform opacity-100 scale-100"
                                    leave="transition ease-in duration-75"
                                    leaveFrom="transform opacity-100 scale-100"
                                    leaveTo="transform opacity-0 scale-95"
                                >
                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right bg-white border-[3px] border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-50 focus:outline-none overflow-hidden">
                                        <div className="p-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <RemoveMembership
                                                        classes={`w-full text-left px-3 py-2.5 text-xs font-black uppercase rounded-lg ${active ? "bg-red-50 text-red-600" : "text-gray-900 hover:bg-gray-100"}`}
                                                        uuid={item?.uuid}
                                                        text="Cancel Membership"
                                                    />
                                                )}
                                            </Menu.Item>
                                        </div>
                                    </Menu.Items>
                                </Transition>
                            </Menu>
                        </div>
                    )}
                </div>

                <div className="h-0 border-t-[3px] border-black border-dashed opacity-20 mx-6"></div>

                <div className="p-6 flex-grow flex flex-col bg-[#fdfbf7]">
                    <div className="flex-grow">
                        <h4 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4">
                            Includes:
                        </h4>
                        <ul className="space-y-3">
                            {rewards && rewards.length > 0 ? (
                                visibleRewards.map((r, i) => (
                                    <li key={`reward-${i}`} className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0 text-pink-500">
                                            <svg
                                                width="18"
                                                height="18"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="3"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </div>
                                        <span className="text-sm font-bold text-gray-700 leading-snug">
                                            {getRewardTitle(r)}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-sm font-bold text-gray-500 italic">
                                    Standard Access Benefits
                                </li>
                            )}
                        </ul>
                        {!showAllBenefits && remainingBenefits > 0 && !isExpanded && (
                            <div className="mt-4">
                                <div className="border-t-[2px] border-dashed border-black/30 mb-3"></div>
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(true)}
                                    className="text-xs font-black uppercase tracking-wider text-gray-700 hover:text-pink-600 transition-colors"
                                >
                                    + {remainingBenefits} more benefits (View all)
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8">
                        {IsloggedIn ? (
                            <EditMembership
                                classes="w-full py-3.5 bg-white border-[3px] border-black text-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                                item={item}
                            />
                        ) : (
                            <Link
                                method="get"
                                as="button"
                                href={route("membership.checkout", { uuid: item?.uuid })}
                                className={`w-full py-3.5 ${theme.bg} ${theme.text} border-[3px] border-black font-black uppercase text-xs tracking-widest rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2`}
                            >
                                Join Tier
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                    <polyline points="12 5 19 12 12 19"></polyline>
                                </svg>
                            </Link>
                        )}

                        {item.user && (
                            <div className="mt-4 text-center">
                                <Link
                                    href={route("user.show", { username: item.user.username })}
                                    className="text-[10px] font-bold uppercase text-gray-400 hover:text-pink-600 transition-colors tracking-widest"
                                >
                                    @{item.user.username}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
