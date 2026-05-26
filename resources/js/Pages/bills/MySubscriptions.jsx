import { Head } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import CreatorDashboardTabs from "@/Components/CreatorDashboardTabs";
import LoadingScreen from "@/includes/LoadingScreen";
import axios from "axios";
import { useEffect, useState } from "react";
import Avatar from "../../Components/Avatar";

export default function MySubscriptions(props) {
    const { auth } = props;

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        bill_subscriptions: [],
        membership_subscriptions: [],
        stats: {},
    });

    const [cancelModal, setCancelModal] = useState(false);

    const [selectedSubscription, setSelectedSubscription] = useState(null);

    const [subscriptionTab, setSubscriptionTab] = useState("bills");

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
                    (item) =>
                        item.id === selectedSubscription.id
                            ? {
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

    <div className="flex items-center gap-3 mb-6">
        <button
            onClick={() => setSubscriptionTab("bills")}
            className={`
            px-5 py-3 rounded-[30px] 
            text-sm font-bold transition-all duration-300
            ${
                subscriptionTab === "bills"
                    ? "bg-blue-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-gray-100 hover:translate-x-[-2px] hover:translate-y-[-2px]"
            }
        `}
        >
            💳 Bill Subscriptions
        </button>

        <button
            onClick={() => setSubscriptionTab("memberships")}
            className={`
            px-5 py-3 rounded-[30px] 
            text-sm font-bold transition-all duration-300
            ${
                subscriptionTab === "memberships"
                    ? "bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                    : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-gray-100 hover:translate-x-[-2px] hover:translate-y-[-2px]"
            }
        `}
        >
            👑 Membership Subscriptions
        </button>
    </div>;

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
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gray-200">
                    <div className="containerbox m-auto">
                        <div className="py-8 md:py-16 w-full m-auto">
                        <CreatorDashboardTabs />

                        {/* HEADER */}

                        <div className="mb-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-yellow-300 flex items-center justify-center text-3xl border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    📦
                                </div>

                                <div>
                                    <h1 className="text-3xl md:text-4xl font-GillSans uppercase text-black">
                                        My Subscriptions
                                    </h1>

                                    <p className="text-gray-600 text-sm mt-1">
                                        Track memberships and creator
                                        subscriptions
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* STATS */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                            <div className="bg-white border-[3px] border-black rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6">
                                <p className="text-gray-600 text-sm">
                                    Active Subscriptions
                                </p>

                                <h2 className="text-4xl md:text-5xl font-black text-black mt-4">
                                    {data?.stats?.total_active_subscriptions ||
                                        0}
                                </h2>
                            </div>

                            <div className="bg-white border-[3px] border-black rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6">
                                <p className="text-gray-600 font-bold uppercase text-sm">
                                    Monthly Spend
                                </p>

                                <h2 className="text-4xl md:text-5xl font-black text-black mt-4">
                                    £
                                    {Number(
                                        data?.stats?.monthly_spend || 0,
                                    ).toLocaleString()}
                                </h2>
                            </div>

                            <div className="bg-white border-[3px] border-black rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all p-6">
                                <p className="text-gray-600 font-bold uppercase text-sm">
                                    Yearly Spend
                                </p>

                                <h2 className="text-4xl md:text-5xl font-black text-black mt-4">
                                    £
                                    {Number(
                                        data?.stats?.yearly_spend || 0,
                                    ).toLocaleString()}
                                </h2>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 mb-6">
                            <button
                                onClick={() => setSubscriptionTab("bills")}
                                className={`
                                px-5 py-3 rounded-[30px] 
                                text-sm font-bold transition-all duration-300
                                ${
                                    subscriptionTab === "bills"
                                        ? "bg-blue-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                                        : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-gray-100 hover:translate-x-[-2px] hover:translate-y-[-2px]"
                                }
                            `}
                            >
                                💳 Bill Subscriptions
                            </button>

                            <button
                                onClick={() =>
                                    setSubscriptionTab("memberships")
                                }
                                className={`
                                    px-5 py-3 rounded-[30px] 
                                    text-sm font-bold transition-all duration-300
                                    ${
                                        subscriptionTab === "memberships"
                                            ? "bg-yellow-300 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black"
                                            : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] text-black hover:bg-gray-100 hover:translate-x-[-2px] hover:translate-y-[-2px]"
                                    }
                                `}
                            >
                                👑 Membership Subscriptions
                            </button>
                        </div>

                        {/* TABLE */}

                        <div className="bg-white border-[3px] border-black rounded-[30px]  shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 hover:-translate-x-1 transition-all overflow-hidden">
                            <div className="p-6 border-b-[3px] border-black">
                                <h2 className="text-xl md:text-2xl font-GillSans uppercase text-black">
                                    {subscriptionTab === "bills"
                                        ? "Bill Subscriptions"
                                        : "Membership Subscriptions"}
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100 border-b-[3px] border-black">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-700">
                                                Creator
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-700">
                                                Plan
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-700">
                                                Amount
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-700">
                                                Type
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-700">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-gray-700">
                                                Action
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y-[3px] divide-black">
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
                                                    <tr
                                                        key={index}
                                                        className="hover:bg-white/[0.05] transition-all duration-300"
                                                    >
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
                                                            <p className="text-black font-semibold">
                                                                {plan}
                                                            </p>
                                                        </td>

                                                        {/* AMOUNT */}

                                                        <td className="px-6 py-5">
                                                            <p className="text-2xl font-black text-emerald-400">
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
                                                                    px-3 py-2 rounded-xl
                                                                    text-sm font-bold capitalize
                                                                    border
                                                                    ${
                                                                        subscriptionTab ===
                                                                        "bills"
                                                                            ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-400"
                                                                            : "bg-pink-500/10 border-pink-500/20 text-pink-400"
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
                                                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold">
                                                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>

                                                                {subscription?.end ==
                                                                1
                                                                    ? "Canceled"
                                                                    : "Active"}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            {subscription?.end ==
                                                            1 ? (
                                                                <div
                                                                    className="
                                                                    inline-flex items-center
                                                                    gap-2 px-4 py-2
                                                                    rounded-xl
                                                                    bg-red-500/10
                                                                    border border-red-500/20
                                                                    text-red-400
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
                                                                    px-4 py-2 rounded-xl
                                                                    bg-red-500/10
                                                                    border border-red-500/20
                                                                    text-red-400
                                                                    text-sm font-bold
                                                                    hover:bg-red-500/20
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
                                                        <div
                                                            className={`
                                                            w-24 h-24 rounded-3xl
                                                            flex items-center justify-center
                                                            text-5xl mb-6 border
                                                            ${
                                                                subscriptionTab ===
                                                                "bills"
                                                                    ? "bg-cyan-500/10 border-cyan-500/20"
                                                                    : "bg-pink-500/10 border-pink-500/20"
                                                            }
                                                        `}
                                                        >
                                                            {subscriptionTab ===
                                                            "bills"
                                                                ? "💳"
                                                                : "👑"}
                                                        </div>

                                                        <h3 className="text-xl md:text-2xl font-GillSans uppercase text-black mb-3">
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
                        rounded-3xl
                        bg-slate-900
                        border border-white/10
                        p-8
                        "
                    >
                        <div className="text-center">
                            <div
                                className="
                                w-24 h-24 mx-auto
                                rounded-3xl
                                bg-red-500/10
                                border border-red-500/20
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
                                text-gray-600 leading-relaxed
                                "
                            >
                                Your subscription will remain active until the
                                current billing period ends.
                            </p>

                            <div className="flex gap-3 mt-8">
                                <button
                                    onClick={() => setCancelModal(false)}
                                    className="
                                    flex-1 py-3 rounded-[30px] 
                                    bg-white/5 border border-white/10
                                    text-black font-bold
                                    "
                                >
                                    Keep Subscription
                                </button>

                                <button
                                    onClick={confirmCancelSubscription}
                                    className="
                                    flex-1 py-3 rounded-[30px] 
                                    bg-gradient-to-r
                                    from-red-500 to-pink-500
                                    text-black font-bold
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
