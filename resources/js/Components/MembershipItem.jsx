import { useEffect, Fragment } from "react";
import { useState } from "react";
import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";
import dummy from "../../assets/img/uploadedimg.png";
import EditMembership from "@/Pages/membership/EditMembership";
import { Menu, Transition } from "@headlessui/react";
import RemoveMembership from "@/Pages/membership/RemoveMembership";
import { useAlerts } from "@/Components/Alerts";
import RewardHint from "@/Pages/discover/components/RewardHint";
import { feeRatesFor, creatorIdOf, STRIPE_FEE_RATE, STRIPE_FIXED_FEE } from "@/utils/pricing";
import SaveButton from "@/Components/SaveButton";

const rewards_lists = [
    { title: "Green Circle Insta", value: "green_circle_insta" },
    { title: "Insta Broadcast", value: "insta_broadcast" },
    { title: "⁠Telegram Group", value: "telegram_group" },
    { title: " ⁠X Community", value: "x_community" },
    { title: "⁠Monthly Content Bundle", value: "monthly_content_bundle" },
    { title: "Weekly Content Bundle", value: "weekly_content_bundle" },
    { title: "⁠Weekly DM chat", value: "weekly_DM_chat" },
    { title: "Monthly DM chat", value: "monthly_DM_chat" },
    { title: "Monthly Video call", value: "monthly_video_call" },
    { title: "Weekly Video call", value: "weekly_video_call" },
];

export default function MembershipItem({
    item,
    IsloggedIn,
    showAllBenefits = false,
}) {
    const { auth, platform_fee_percentage, transaction_fee_percentage } =
        usePage().props;
    const __pageProps = usePage().props;
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
        const stripeFeeRate = STRIPE_FEE_RATE;
        const stripeFixedFee = isZeroDecimal ? 0 : STRIPE_FIXED_FEE;
        // Per-creator: a creator on a bespoke platform rate must be QUOTED
        // what checkout will CHARGE them. The global props cannot express that.
        const __rates = feeRatesFor(creatorIdOf(item), __pageProps);
        const platformFeeRate = __rates.platform / 100;
        const complianceFeeRate = __rates.compliance / 100;
        const adminFee = adminFeeInCurrency(curr);
        const totalDeductionRate =
            stripeFeeRate + platformFeeRate + complianceFeeRate;

        if (totalDeductionRate >= 1) {
            return priceWithVat;
        }

        const totalSupporterPays =
            (priceWithVat + stripeFixedFee + adminFee) /
            (1 - totalDeductionRate);
        if (!isZeroDecimal) {
            return Math.ceil(totalSupporterPays * 100) / 100;
        }
        return Math.ceil(totalSupporterPays);
    };

    // The tier's colour is its identity, so it owns the whole card head rather than
    // a stray pill. Platinum reads as the top rung (near-black) — as flat tints
    // it and silver were within a hair of each other and told tiers apart badly.
    const tierThemes = {
        gold: { bg: "bg-[#FFD700]", text: "text-black", ink: "text-black/60" },
        silver: {
            bg: "bg-[#D8DCE3]",
            text: "text-black",
            ink: "text-black/60",
        },
        bronze: {
            bg: "bg-[#F97316]",
            text: "text-white",
            ink: "text-white/75",
        },
        platinum: {
            bg: "bg-[#12131A]",
            text: "text-white",
            ink: "text-white/60",
        },
        lifetime: {
            bg: "bg-[#22C55E]",
            text: "text-white",
            ink: "text-white/75",
        },
        default: {
            bg: "bg-[#A2E4B8]",
            text: "text-black",
            ink: "text-black/60",
        },
    };

    const isCreator = auth?.user?.id === item?.user_id;
    const theme = tierThemes[item?.level?.toLowerCase()] || tierThemes.default;
    const shouldShowAllBenefits = showAllBenefits || isExpanded;
    const visibleRewards = shouldShowAllBenefits
        ? rewards
        : rewards.slice(0, 2);
    const remainingBenefits = Math.max((rewards?.length || 0) - 2, 0);

    return (
        <div
            className={`${item?.status == 0 ? "inactive-item" : ""} h-full group/card`}
        >
            <div className="relative flex flex-col h-full bg-white rounded-box border-[3px] border-black transition-colors duration-200 hover:bg-black/[0.03] overflow-hidden">
                {/* Tier head — the colour IS the tier, so the name sits in it */}
                <div className={`relative ${theme.bg} ${theme.text} px-5 py-4`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                            <span
                                className={`block text-[12px] font-black uppercase tracking-[0.2em] ${theme.ink}`}
                            >
                                Membership tier
                            </span>
                            <h3 className="mt-1 text-2xl font-black uppercase leading-none tracking-tight line-clamp-1">
                                {item?.level}
                            </h3>
                        </div>

                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border-[3px] border-black bg-white transition-transform group-hover/card:-rotate-6">
                            <img
                                src={item?.perma_link || dummy}
                                alt={item?.level}
                                className="h-full w-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Status flags live on the head so the body stays about the offer */}
                    {(item?.is_suspended == 1 ||
                        (IsloggedIn && item?.approved == 0)) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {item?.is_suspended == 1 && (
                                <span className="group/suspend relative cursor-help rounded-full border-2 border-black bg-red-600 px-3 py-1 text-[12px] font-black uppercase tracking-wider text-white">
                                    Suspended
                                    {item.suspend_reason && (
                                        <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-56 rounded-box-sm bg-black p-2 text-[12px] normal-case tracking-normal text-white group-hover/suspend:block">
                                            Reason: {item.suspend_reason}
                                        </span>
                                    )}
                                </span>
                            )}
                            {IsloggedIn &&
                                item?.approved == 0 &&
                                item?.is_suspended != 1 && (
                                    <span className="group/approval relative cursor-help rounded-full border-2 border-black bg-yellow-400 px-3 py-1 text-[12px] font-black uppercase tracking-wider text-black">
                                        Pending approval
                                        {item?.edited_reason && (
                                            <span className="pointer-events-none absolute left-0 top-full z-30 mt-2 hidden w-64 rounded-box-sm bg-black p-3 text-[12px] normal-case leading-relaxed tracking-normal text-white group-hover/approval:block">
                                                <span className="mb-1 block font-bold text-yellow-300">
                                                    Edit reason
                                                </span>
                                                {item.edited_reason}
                                            </span>
                                        )}
                                    </span>
                                )}
                        </div>
                    )}

                    {IsloggedIn && (
                        <div className="absolute right-3 top-3">
                            <Menu as="div" className="relative">
                                <Menu.Button
                                    aria-label="Membership options"
                                    className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-black bg-white transition-colors hover:bg-gray-100"
                                >
                                    <div className="flex gap-[3px]">
                                        <span className="h-1 w-1 rounded-full bg-black"></span>
                                        <span className="h-1 w-1 rounded-full bg-black"></span>
                                        <span className="h-1 w-1 rounded-full bg-black"></span>
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
                                    <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right overflow-hidden rounded-box border-[3px] border-black bg-white focus:outline-none z-50">
                                        <div className="p-1">
                                            <Menu.Item>
                                                {({ active }) => (
                                                    <RemoveMembership
                                                        classes={`w-full text-left px-3 py-2.5 text-xs font-black uppercase rounded-box-sm ${active ? "bg-red-50 text-red-600" : "text-gray-900 hover:bg-gray-100"}`}
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

                {/* Offer */}
                <div className="flex flex-grow flex-col bg-[#fdfbf7] px-5 pb-5 pt-4">
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-[34px] font-black leading-none tracking-tighter text-black">
                            {isCreator
                                ? formatMultiPrice(item?.price, item?.currency)
                                : formatMultiPrice(
                                      calculateTotalSupporterPays(
                                          item?.price,
                                          item?.currency,
                                          item?.user?.vat_amount_percentage ||
                                              0,
                                      ),
                                      item?.currency,
                                  )}
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wide text-black/60">
                            / month
                        </span>
                    </div>
                    {/* ⚠️ ON THE FEE LINE, not in the head. The head's right side
                        already carries the tier avatar AND the owner dots menu at
                        `right-3 top-3`; this row is inside `!isCreator`, so it is
                        guaranteed visitor-only space. */}
                    {!isCreator && (
                        <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="text-[12px] font-semibold text-black/60">
                                Includes platform &amp; processing fees
                            </p>
                            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                <SaveButton productType="membership" itemId={item?.id} creatorId={item?.user_id} />
                            </div>
                        </div>
                    )}

                    <div className="my-4 border-t-2 border-dashed border-black/15"></div>

                    <div className="flex-grow">
                        <h4 className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-black/60">
                            What you get
                        </h4>
                        {/* The instant welcome reward — distinct from the ongoing
                            perks below, so a buyer sees they get something the
                            moment they join, not only over time. */}
                        <RewardHint item={item} className="mb-3 max-w-full" />
                        <ul className="space-y-2.5">
                            {rewards && rewards.length > 0 ? (
                                visibleRewards.map((r, i) => (
                                    <li
                                        key={`reward-${i}`}
                                        className="flex items-start gap-2.5"
                                    >
                                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF007F]/10 text-[#FF007F]">
                                            <svg
                                                width="11"
                                                height="11"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            >
                                                <polyline points="20 6 9 17 4 12"></polyline>
                                            </svg>
                                        </span>
                                        <span className="text-[13px] font-bold leading-snug text-gray-700">
                                            {getRewardTitle(r)}
                                        </span>
                                    </li>
                                ))
                            ) : (
                                <li className="text-[13px] font-bold italic text-black/60">
                                    Standard access benefits
                                </li>
                            )}
                        </ul>
                        {!showAllBenefits &&
                            remainingBenefits > 0 &&
                            !isExpanded && (
                                <button
                                    type="button"
                                    onClick={() => setIsExpanded(true)}
                                    className="mt-3 text-[12px] font-black uppercase tracking-wider text-black/60 underline decoration-dotted underline-offset-4 transition-colors hover:text-[#FF007F]"
                                >
                                    Show {remainingBenefits} more
                                </button>
                            )}
                    </div>

                    <div className="mt-5">
                        {IsloggedIn ? (
                            <EditMembership
                                classes="w-full py-3 bg-white border-2 border-black text-black font-black uppercase text-xs tracking-widest rounded-box-sm transition-colors hover:bg-gray-100"
                                item={item}
                            />
                        ) : (
                            <Link
                                method="get"
                                as="button"
                                href={route("membership.checkout", {
                                    uuid: item?.uuid,
                                })}
                                className="flex w-full items-center justify-center gap-2 rounded-box-sm border-2 border-black bg-[#FF007F] py-3 text-xs font-black uppercase tracking-widest text-black transition-colors duration-200 hover:brightness-110 active:brightness-95"
                            >
                                Join {item?.level}
                                <svg
                                    width="15"
                                    height="15"
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
                    </div>
                </div>
            </div>
        </div>
    );
}
