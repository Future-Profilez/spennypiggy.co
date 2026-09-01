import { Head } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import CreatorDashboardTabs from "@/Components/CreatorDashboardTabs";
import LoadingScreen from "@/includes/LoadingScreen";
import axios from "axios";
import { useEffect, useState } from "react";
import useHideBottomBar from "@/hooks/useHideBottomBar";
import Avatar from "../../Components/Avatar";
import DashboardHero from "@/Components/Dashboard/DashboardHero";
import { FiShoppingBag, FiFileText, FiDollarSign, FiCalendar, FiDownload } from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import { exportCsv, csvDateStamp } from "@/utils/exportCsv";

export default function MySubscriptions(props) {
    const { auth } = props;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        bill_subscriptions: [],
        membership_subscriptions: [],
        stats: {},
    });

    const [cancelModal, setCancelModal] = useState(false);

    // Centred at z-50 under a z-999999 bar: hide the bar while it is open.

    useHideBottomBar(Boolean(cancelModal));

    const [selectedSubscription, setSelectedSubscription] = useState(null);

    const [subscriptionTab, setSubscriptionTab] = useState("bills");

    // `end` is null/0 while a subscription is live, and is set (a cancellation date,
    // or the legacy `1` sentinel on old rows) once it has been cancelled/scheduled to
    // end. Checking `== 1` alone missed every subscription cancelled after the column
    // switched to storing a real date, so cancelled subs showed as active.
    const isEnded = (sub) => {
        const end = sub?.end;
        return end !== null && end !== undefined && end !== 0 && end !== "0" && end !== "";
    };

    const activeBillSubscriptions = data.bill_subscriptions.filter(
        (item) => !isEnded(item),
    ).length;

    const activeMembershipSubscriptions = data.membership_subscriptions.filter(
        (item) => !isEnded(item),
    ).length;

    // Whole days from now until a charge date (null if no/invalid date).
    const daysUntil = (dateStr) => {
        if (!dateStr) return null;
        const d = new Date(dateStr);
        if (isNaN(d)) return null;
        return Math.ceil((d - new Date()) / 86400000);
    };
    // A live subscription charging within the next 7 days.
    const isRenewingSoon = (sub) => {
        if (isEnded(sub)) return false;
        const days = daysUntil(sub?.upcoming_payment);
        return days !== null && days >= 0 && days <= 7;
    };
    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return isNaN(d)
            ? "—"
            : d.toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
              });
    };

    const handleExport = () => {
        const build = (subs, kind) =>
            subs.map((s) => [
                kind,
                (kind === "Bill" ? s?.bill?.user?.name : s?.membership?.user?.name) || "—",
                (kind === "Bill" ? s?.bill?.name : s?.membership?.level) || "—",
                `£${Number(s.amount || 0)}`,
                s.recurring_type || "—",
                isEnded(s) ? "Cancelled" : "Active",
                s.upcoming_payment ? formatDate(s.upcoming_payment) : "—",
            ]);
        const rows = [
            ...build(data.bill_subscriptions || [], "Bill"),
            ...build(data.membership_subscriptions || [], "Membership"),
        ];
        exportCsv(
            `my-subscriptions-${csvDateStamp()}.csv`,
            ["Type", "Creator", "Plan", "Amount", "Billing", "Status", "Next charge"],
            rows,
        );
    };

    const modalPlan = selectedSubscription
        ? subscriptionTab === "bills"
            ? selectedSubscription?.bill?.name
            : selectedSubscription?.membership?.level
        : "";

    const modalAmount = selectedSubscription
        ? Number(selectedSubscription.amount || 0).toLocaleString()
        : "0";

    const openCancelModal = (subscription) => {
        setSelectedSubscription(subscription);

        setCancelModal(true);
    };

    const confirmCancelSubscription = async () => {
        try {
            const endpoint =
                subscriptionTab === "bills"
                    ? "/billing/cancel-subscription"
                    : "/membership/cancel-subscription";

            await axios.post(endpoint, {
                payment_id: selectedSubscription.id,
            });

            setData((prev) => ({
                ...prev,

                bill_subscriptions: prev.bill_subscriptions.map((item) =>
                    item.id === selectedSubscription.id
                        ? {
                              ...item,
                              end: 1,
                          }
                        : item,
                ),

                membership_subscriptions: prev.membership_subscriptions.map(
                    (item) => item.id === selectedSubscription.id ? {
                                  ...item,
                                  end: 1,
                              }
                            : item,
                ),
            }));

            setCancelModal(false);
        } catch (error) {
            console.log(error);
        }
    };

    useEffect(() => {
        axios
            .get("/billing/api/my-subscriptions")
            .then((res) => {
                setData({
                    bill_subscriptions: res.data?.bill_subscriptions || [],

                    membership_subscriptions:
                        res.data?.membership_subscriptions || [],

                    stats: res.data?.stats || {},
                });

                setLoading(false);
            })
            .catch((err) => {
                console.log(err);

                setLoading(false);
            });
    }, []);

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title="My Subscriptions" />

            {loading ? (
                <div className="min-h-dvh bg-gray-50">
                    <div className="containerbox m-auto">
                        <div className="py-8 md:py-16 w-full m-auto">
                            {/* HEADER SKELETON */}
                            <div className="mb-8 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-box-sm bg-gray-300 animate-pulse" />
                                <div className="h-8 w-56 bg-gray-300 rounded-box-sm animate-pulse" />
                            </div>
                            {/* STAT CARDS SKELETON */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="bg-white border border-gray-100 rounded-box  duration-200 p-6"
                                    >
                                        <div className="h-3 w-32 bg-gray-200 rounded-box-sm animate-pulse" />
                                        <div className="h-9 w-20 bg-gray-200 rounded-box-sm animate-pulse mt-4" />
                                    </div>
                                ))}
                            </div>
                            {/* TABS SKELETON */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="h-11 w-44 bg-gray-200 rounded-box-sm animate-pulse" />
                                <div className="h-11 w-52 bg-gray-200 rounded-box-sm animate-pulse" />
                            </div>
                            {/* TABLE SKELETON */}
                            <div className="bg-white border border-gray-100 rounded-box  duration-200 p-6 space-y-4">
                                <div className="h-6 w-48 bg-gray-200 rounded-box-sm animate-pulse" />
                                {[...Array(4)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-14 w-full bg-gray-100 rounded-box-sm animate-pulse"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="min-h-dvh bg-gray-50">
                    <div className="containerbox m-auto">
                        <div className="py-8 md:py-16 w-full m-auto">
                        <CreatorDashboardTabs />

                        <DashboardHero
                            accent="pink"
                            Icon={FiShoppingBag}
                            sticker="My subscriptions"
                            label="Monthly spend"
                            amount={Number(data?.stats?.monthly_spend || 0)}
                            prefix="£"
                            stats={[
                                {
                                    label: "Bill subs",
                                    value: activeBillSubscriptions,
                                    Icon: FiFileText,
                                },
                                {
                                    label: "Membership subs",
                                    value: activeMembershipSubscriptions,
                                    Icon: FaCrown,
                                },
                                {
                                    label: "Yearly spend",
                                    value: `£${Number(
                                        data?.stats?.yearly_spend || 0,
                                    ).toLocaleString()}`,
                                    Icon: FiDollarSign,
                                },
                            ]}
                        />

                        {/* UPCOMING RENEWALS */}
                        {data?.stats?.upcoming_30d_count > 0 && (
                            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-100 rounded-box p-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-pink-50 flex items-center justify-center rounded-box-sm">
                                        <FiCalendar className="text-[#FF007F]" size="1.3rem" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">
                                            {data.stats.upcoming_30d_count} renewal
                                            {data.stats.upcoming_30d_count > 1 ? "s" : ""}{" "}
                                            in the next 30 days
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {data.stats.next_renewal_at
                                                ? `Next charge on ${formatDate(data.stats.next_renewal_at)}`
                                                : "Upcoming charges"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-2xl font-black text-black tabular-nums leading-none">
                                        £
                                        {Number(
                                            data.stats.upcoming_30d_total || 0,
                                        ).toLocaleString()}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Estimated upcoming spend
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            <button
                                onClick={() => setSubscriptionTab("bills")}
                                aria-pressed={subscriptionTab === "bills"}
                                className={`
                                inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-box-sm
                                text-sm font-bold transition-all duration-300
                                ${
                                    subscriptionTab === "bills"
 ? "bg-[#FF007F] border border-gray-100 text-black"
 : "bg-white border border-gray-100 text-black hover:bg-black/[0.04]"
                                }
                            `}
                            >
                                <FiFileText size="1rem" /> Bill Subscriptions
                            </button>

                            <button
                                onClick={() =>
                                    setSubscriptionTab("memberships")
                                }
                                aria-pressed={subscriptionTab === "memberships"}
                                className={`
                                    inline-flex items-center gap-2 px-5 py-3 min-h-[44px] rounded-box-sm
                                    text-sm font-bold transition-all duration-300
                                    ${
                                        subscriptionTab === "memberships"
 ? "bg-[#FF007F] border border-gray-100 text-black"
 : "bg-white border border-gray-100 text-black hover:bg-black/[0.04]"
                                    }
                                `}
                            >
                                <FaCrown size="0.95rem" /> Membership Subscriptions
                            </button>

                            <button
                                onClick={handleExport}
                                disabled={
                                    !(data.bill_subscriptions || []).length &&
                                    !(data.membership_subscriptions || []).length
                                }
                                aria-label="Export subscriptions to CSV"
                                className="sm:ml-auto inline-flex items-center gap-2 px-4 py-3 min-h-[44px] rounded-box-sm text-sm font-semibold bg-gray-900 text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                            >
                                <FiDownload size="0.95rem" /> Export
                            </button>
                        </div>

                        {/* TABLE */}

                        <div className="bg-white border border-gray-100 rounded-box  duration-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg md:text-xl font-bold tracking-tight text-gray-900">
                                    {subscriptionTab === "bills"
                                        ? "Bill Subscriptions"
                                        : "Membership Subscriptions"}
                                </h2>
                            </div>

                            {/* MOBILE CARD LIST */}
                            <div className="block lg:hidden divide-y divide-gray-100">
                                {(subscriptionTab === "bills"
                                    ? data.bill_subscriptions
                                    : data.membership_subscriptions
                                ).length > 0 ? (
                                    (subscriptionTab === "bills"
                                        ? data.bill_subscriptions
                                        : data.membership_subscriptions
                                    ).map((subscription, index) => {
                                        const creator =
                                            subscriptionTab === "bills"
                                                ? subscription?.bill?.user
                                                : subscription?.membership?.user;
                                        const plan =
                                            subscriptionTab === "bills"
                                                ? subscription?.bill?.name
                                                : subscription?.membership
                                                      ?.level;
                                        const isCanceled = isEnded(subscription);
                                        return (
                                            <div key={index} className="p-4">
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <Avatar user={creator} />
                                                    <div className="flex items-center gap-2">
                                                        {isRenewingSoon(subscription) && (
                                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-box-sm bg-amber-100 text-amber-700 text-[12px] font-semibold">
                                                                <FiCalendar size="0.8rem" />
                                                                {daysUntil(subscription.upcoming_payment) === 0
                                                                    ? "Renews today"
                                                                    : `Renews in ${daysUntil(subscription.upcoming_payment)}d`}
                                                            </span>
                                                        )}
                                                        <span
                                                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-box-sm border-2 text-xs font-bold ${isCanceled ? "bg-red-100 border-red-600 text-red-600" : "bg-emerald-100 border-emerald-700 text-emerald-700"}`}
                                                        >
                                                            <span
                                                                className={`w-2 h-2 rounded-full ${isCanceled ? "bg-red-500" : "bg-emerald-500"}`}
                                                            ></span>
                                                            {isCanceled
                                                                ? "Canceled"
                                                                : "Active"}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 mb-3">
                                                    <div className="col-span-2">
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Plan
                                                        </p>
                                                        <p className="font-black uppercase text-black">
                                                            {plan}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Amount
                                                        </p>
                                                        <p className="text-lg font-black text-emerald-700">
                                                            £
                                                            {Number(
                                                                subscription.amount,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[12px] uppercase tracking-wide text-gray-500 font-bold">
                                                            Type
                                                        </p>
                                                        <span className="inline-block mt-0.5 px-3 py-1 rounded-box-sm bg-pink-100 border border-gray-100 text-black text-xs font-bold capitalize">
                                                            {
                                                                subscription?.recurring_type
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                                {isCanceled ? (
                                                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-box-sm bg-red-100 border-2 border-red-600 text-red-600 text-sm font-bold">
                                                        Canceled
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            openCancelModal(
                                                                subscription,
                                                            )
                                                        }
                                                        className="min-h-[44px] w-full px-4 py-2 rounded-box-sm bg-red-100 border-2 border-red-600 text-red-600 text-sm font-bold hover:bg-red-200 transition-all duration-300"
                                                    >
                                                        Cancel Subscription
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="py-16 flex flex-col items-center justify-center text-center px-4">
                                        <div className="w-24 h-24 rounded-box-sm flex items-center justify-center mb-6 border border-gray-100 bg-pink-100 ">
                                            {subscriptionTab === "bills" ? (
                                                <FiFileText className="text-[#FF007F]" size="2.4rem" />
                                            ) : (
                                                <FaCrown className="text-[#FF007F]" size="2.2rem" />
                                            )}
                                        </div>
                                        <h3 className="text-xl font-GillSans uppercase text-black mb-3">
                                            No{" "}
                                            {subscriptionTab === "bills"
                                                ? "Bill"
                                                : "Membership"}{" "}
                                            Subscriptions
                                        </h3>
                                        <p className="text-gray-600 max-w-md">
                                            You don't have any active{" "}
                                            {subscriptionTab === "bills"
                                                ? "bill"
                                                : "membership"}{" "}
                                            subscriptions yet.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* DESKTOP TABLE */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    {(subscriptionTab === "bills"
                                        ? data.bill_subscriptions
                                        : data.membership_subscriptions
                                    ).length > 0 && (
                                        <thead className="bg-gray-100 border-b border-gray-100">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Creator
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Plan
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Amount
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Type
                                                </th>

                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-700">
                                                    Action
                                                </th>
                                            </tr>
                                        </thead>
                                    )}

                                    <tbody className="divide-y divide-gray-100">
                                        {(subscriptionTab === "bills"
                                            ? data.bill_subscriptions
                                            : data.membership_subscriptions
                                        ).length > 0 ? (
                                            (subscriptionTab === "bills"
                                                ? data.bill_subscriptions
                                                : data.membership_subscriptions
                                            ).map((subscription, index) => {
                                                const creator =
                                                    subscriptionTab === "bills"
                                                        ? subscription?.bill
                                                              ?.user
                                                        : subscription
                                                              ?.membership
                                                              ?.user;

                                                const plan =
                                                    subscriptionTab === "bills"
                                                        ? subscription?.bill
                                                              ?.name
                                                        : subscription
                                                              ?.membership
                                                              ?.level;

                                                return (
                                                    <tr key={index}>
                                                        {/* CREATOR */}

                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar
                                                                    user={
                                                                        creator
                                                                    }
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* PLAN */}

                                                        <td className="px-6 py-5">
                                                            <p className="text-black font-semibold uppercase">
                                                                {plan}
                                                            </p>
                                                        </td>

                                                        {/* AMOUNT */}

                                                        <td className="px-6 py-5">
                                                            <p className="text-2xl font-black text-emerald-700">
                                                                £
                                                                {Number(
                                                                    subscription.amount,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>

                                                        {/* TYPE */}

                                                        <td className="px-6 py-5">
                                                            <span
                                                                className={`
                                                                    px-3 py-2 rounded-box-sm
                                                                    text-sm font-bold capitalize
                                                                    border border-gray-100 text-black
                                                                    ${
                                                                        subscriptionTab ===
                                                                        "bills"
                                                                            ? "bg-pink-100"
                                                                            : "bg-white"
                                                                    }
                                                                `}
                                                            >
                                                                {
                                                                    subscription?.recurring_type
                                                                }
                                                            </span>
                                                        </td>

                                                        {/* STATUS */}

                                                        <td className="px-6 py-5">
                                                            <div className="flex flex-col items-start gap-1.5">
                                                                <span
                                                                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-box-sm border-2 text-sm font-bold ${isEnded(subscription) ? "bg-red-100 border-red-600 text-red-600" : "bg-emerald-100 border-emerald-700 text-emerald-700"}`}
                                                                >
                                                                    <span
                                                                        className={`w-2 h-2 rounded-full ${isEnded(subscription) ? "bg-red-500" : "bg-emerald-500"}`}
                                                                    ></span>

                                                                    {isEnded(
                                                                        subscription,
                                                                    )
                                                                        ? "Canceled"
                                                                        : "Active"}
                                                                </span>
                                                                {isRenewingSoon(
                                                                    subscription,
                                                                ) && (
                                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-box-sm bg-amber-100 text-amber-700 text-[12px] font-semibold">
                                                                        <FiCalendar size="0.8rem" />
                                                                        {daysUntil(
                                                                            subscription.upcoming_payment,
                                                                        ) === 0
                                                                            ? "Renews today"
                                                                            : `Renews in ${daysUntil(subscription.upcoming_payment)}d`}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            {isEnded(
                                                                subscription,
                                                            ) ? (
                                                                <div
                                                                    className="
                                                                    inline-flex items-center
                                                                    gap-2 px-4 py-2
                                                                    rounded-box-sm
                                                                    bg-red-100
                                                                    border-2 border-red-600
                                                                    text-red-600
                                                                    text-sm font-bold
                                                                "
                                                                >
                                                                    Canceled
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() =>
                                                                        openCancelModal(
                                                                            subscription,
                                                                        )
                                                                    }
                                                                    className="
                                                                    min-h-[44px]
                                                                    px-4 py-2 rounded-box-sm
                                                                    bg-red-100
                                                                    border-2 border-red-600
                                                                    text-red-600
                                                                    text-sm font-bold
                                                                    hover:bg-red-200
                                                                    transition-all duration-300
                                                                "
                                                                >
                                                                    Cancel
                                                                    Subscription
                                                                </button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="py-20"
                                                >
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="w-24 h-24 rounded-box-sm flex items-center justify-center mb-6 border border-gray-100 bg-pink-100 ">
                                                            {subscriptionTab ===
                                                            "bills" ? (
                                                                <FiFileText className="text-[#FF007F]" size="2.4rem" />
                                                            ) : (
                                                                <FaCrown className="text-[#FF007F]" size="2.2rem" />
                                                            )}
                                                        </div>

                                                        <h3 className="text-lg md:text-xl font-bold tracking-tight text-gray-900 mb-3">
                                                            No{" "}
                                                            {subscriptionTab ===
                                                            "bills"
                                                                ? "Bill"
                                                                : "Membership"}{" "}
                                                            Subscriptions
                                                        </h3>

                                                        <p className="text-gray-600 text-center max-w-md">
                                                            You don't have any
                                                            active{" "}
                                                            {subscriptionTab ===
                                                            "bills"
                                                                ? "bill"
                                                                : "membership"}{" "}
                                                            subscriptions yet.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    </div>
                </div>
            )}

            {cancelModal && (
                // bottom-bar-safe: useHideBottomBar(Boolean(cancelModal)) hides the bar while open
                <div
                    className="
                    fixed inset-0 z-50
                    flex items-center justify-center
                    bg-black/70 backdrop-blur-sm
                    "
                >
                    <div
                        className="
                        w-full max-w-md
                        rounded-box
                        bg-white
                        border border-gray-100
  duration-200 
                        p-8
                        "
                    >
                        <div className="text-center">
                            <div
                                className="
                                w-24 h-24 mx-auto
                                rounded-box-sm
                                bg-red-100
                                border-2 border-red-600
                                flex items-center justify-center
                                text-5xl mb-6
                                "
                            >
                                ⚠️
                            </div>

                            <h2
                                className="
                                text-3xl font-black text-black mb-4
                                "
                            >
                                Cancel Subscription?
                            </h2>

                            <p
                                className="
                                text-gray-600 leading-relaxed text-sm
                                "
                            >
                                Your subscription will remain active until the
                                current billing period ends.
                            </p>

                            <div className="mt-6 rounded-box-sm border border-gray-100 bg-[#fdfbf7] p-5 text-left text-sm ">
                                <p className="uppercase tracking-[0.24em] text-xs text-gray-500 font-bold">
                                    Selected Subscription
                                </p>
                                <p className="mt-3 font-black text-black text-lg">
                                    {modalPlan || "Unknown plan"}
                                </p>
                                <p className="mt-2 text-gray-700 font-semibold">
                                    Amount: £{modalAmount}
                                </p>
                                {selectedSubscription?.recurring_type && (
                                    <p className="mt-1 text-gray-600 text-xs uppercase tracking-wider">
                                        Type: {selectedSubscription.recurring_type}
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setCancelModal(false)}
                                    className="
                                    flex-1 py-3 rounded-box-sm min-h-[44px]
                                    bg-white border border-gray-100
                                    text-black font-bold
 
 hover:bg-black/[0.04] 
 transition-[background-color,box-shadow] duration-200
                                    "
                                >
                                    Keep Subscription
                                </button>

                                <button
                                    onClick={confirmCancelSubscription}
                                    className="
                                    flex-1 py-3 rounded-box-sm min-h-[44px]
                                    bg-red-600
                                    text-white font-bold border border-gray-100
 
 hover:brightness-110 
 transition-[filter,box-shadow] duration-200
                                    "
                                >
                                    Confirm Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Authenticated>
    );
}
