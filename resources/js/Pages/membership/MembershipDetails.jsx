import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import Avatar from "@/Components/Avatar";
import { FaCrown } from "react-icons/fa6";

import axios from "axios";
import { useEffect, useState } from "react";

export default function MembershipDetails(props) {
    const { auth, uuid } = props;

    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        membership: {},
        supporters_list: [],
        stats: {},
    });

    useEffect(() => {
        axios
            .get(`/membership/api/details/${uuid}`)
            .then((res) => {
                setData({
                    membership: res.data?.membership || {},

                    supporters_list: res.data?.supporters_list || [],

                    stats: res.data?.stats || {},
                });

                setLoading(false);
            })
            .catch((err) => {
                console.log(err);

                setLoading(false);
            });
    }, []);

    const fmtDate = (d) =>
        new Date(d).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title="Membership Details" />

            {loading ? (
                <div className="min-h-dvh bg-gray-200">
                    <div className="max-w-[1500px] mx-auto px-4 py-8 animate-pulse">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 rounded-box bg-gray-300 border-[3px] border-black" />
                            <div className="space-y-3">
                                <div className="h-8 w-64 rounded-box-sm bg-gray-300" />
                                <div className="h-4 w-80 rounded-box-sm bg-gray-300" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                            {[0, 1, 2].map((i) => (
                                <div
                                    key={i}
                                    className="h-40 rounded-box bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                                />
                            ))}
                        </div>
                        <div className="h-96 rounded-box bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
                    </div>
                </div>
            ) : (
                <div className="min-h-dvh bg-gray-200">
                    <div className="w-full max-w-[1500px] mx-auto px-4 py-8">
                        {/* HEADER */}
                        <div className="mb-8">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                                <div className="flex items-center gap-5">
                                    <div className="w-16 h-16 rounded-box bg-yellow-300 border-[3px] border-black flex items-center justify-center text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                        <FaCrown size="1.75rem" />
                                    </div>

                                    <div>
                                        <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight">
                                            {data.membership?.title}
                                        </h1>

                                        <p className="text-gray-700 mt-2 text-sm">
                                            Full membership supporter analytics
                                            and recurring revenue insights
                                        </p>

                                        <div className="flex flex-wrap items-center gap-3 mt-4">
                                            <span className="px-3 py-2 rounded-box-sm bg-pink-200 border-2 border-black text-black text-xs font-bold uppercase capitalize">
                                                {data.membership?.type ||
                                                    "monthly"}
                                            </span>

                                            <span className="px-3 py-2 rounded-box-sm bg-emerald-300 border-2 border-black text-black text-xs font-bold uppercase">
                                                Active Membership
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <Link
                                    href="/membership-dashboard"
                                    className="inline-flex items-center gap-2 px-5 py-2 rounded-box-sm bg-white border-2 border-black text-black font-bold shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-x-1 hover:-translate-y-1 transition-all duration-300 min-h-[44px]"
                                >
                                    ← Back to Dashboard
                                </Link>
                            </div>
                        </div>

                        {/* STATS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-8">
                            <div className="rounded-box bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-700 uppercase text-xs tracking-widest font-bold">
                                    Total Supporters
                                </p>
                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    {data.stats?.supporters || 0}
                                </h2>
                                <p className="text-emerald-600 mt-3 text-xs font-bold uppercase">
                                    Active Members
                                </p>
                            </div>

                            <div className="rounded-box bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-700 uppercase text-xs tracking-widest font-bold">
                                    Total Revenue
                                </p>
                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    £
                                    {Number(
                                        data.stats?.revenue || 0,
                                    ).toLocaleString()}
                                </h2>
                                <p className="text-[#FF007F] mt-3 text-xs font-bold uppercase">
                                    Lifetime Earnings
                                </p>
                            </div>

                            <div className="rounded-box bg-white border-[3px] border-black p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="text-gray-700 uppercase text-xs tracking-widest font-bold">
                                    Next Month Estimate
                                </p>
                                <h2 className="text-3xl md:text-4xl font-black text-black mt-4">
                                    £
                                    {Number(
                                        data.stats?.estimated_next_month || 0,
                                    ).toLocaleString()}
                                </h2>
                                <p className="text-[#FF007F] mt-3 text-xs font-bold uppercase">
                                    Recurring Projection
                                </p>
                            </div>
                        </div>

                        {/* SUPPORTERS */}
                        <div className="rounded-box bg-white border-[3px] border-black overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="p-6 border-b-[3px] border-black">
                                <h2 className="text-2xl md:text-3xl font-black text-black">
                                    Supporters List
                                </h2>
                                <p className="text-gray-700 mt-2 text-sm">
                                    All members subscribed to this tier
                                </p>
                            </div>

                            {/* Mobile card list */}
                            <div className="block lg:hidden">
                                {data.supporters_list.length > 0 ? (
                                    data.supporters_list.map(
                                        (supporter, index) => (
                                            <div
                                                key={index}
                                                className="p-4 border-b-2 border-black/10 last:border-b-0"
                                            >
                                                <div className="flex items-center justify-between gap-3 mb-3">
                                                    <Avatar
                                                        user={supporter.user}
                                                    />
                                                    <span className="text-xl font-black text-black">
                                                        £
                                                        {Number(
                                                            supporter.amount,
                                                        ).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                                    <span className="px-3 py-1.5 rounded-box-sm bg-pink-200 border-2 border-black text-black font-bold uppercase capitalize">
                                                        {supporter.recurring_type ||
                                                            "monthly"}
                                                    </span>
                                                    <span className="px-3 py-1.5 rounded-box-sm bg-emerald-300 border-2 border-black text-black font-bold uppercase capitalize">
                                                        {supporter.status}
                                                    </span>
                                                    <span className="text-gray-700 font-semibold ml-auto">
                                                        {fmtDate(
                                                            supporter.created_at,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        ),
                                    )
                                ) : (
                                    <div className="py-12 text-center text-gray-700 text-sm">
                                        No supporters yet.
                                    </div>
                                )}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                                                Supporter
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                                                Amount
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-black uppercase tracking-wider">
                                                Joined
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y-2 divide-black/10">
                                        {data.supporters_list.length > 0 ? (
                                            data.supporters_list.map(
                                                (supporter, index) => (
                                                    <tr key={index}>
                                                        <td className="px-6 py-5">
                                                            <div className="flex items-center gap-4">
                                                                <Avatar
                                                                    user={
                                                                        supporter.user
                                                                    }
                                                                />
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <p className="text-lg font-black text-black">
                                                                £
                                                                {Number(
                                                                    supporter.amount,
                                                                ).toLocaleString()}
                                                            </p>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="px-3 py-2 rounded-box-sm bg-pink-200 border-2 border-black text-black text-xs font-bold uppercase capitalize">
                                                                {supporter.recurring_type ||
                                                                    "monthly"}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-box-sm bg-emerald-300 border-2 border-black text-black text-xs font-bold uppercase capitalize">
                                                                <span className="w-2 h-2 rounded-full bg-black"></span>
                                                                {
                                                                    supporter.status
                                                                }
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-5">
                                                            <p className="text-black font-semibold text-sm">
                                                                {fmtDate(
                                                                    supporter.created_at,
                                                                )}
                                                            </p>
                                                        </td>
                                                    </tr>
                                                ),
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-16 text-center"
                                                >
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-16 h-16 rounded-box bg-gray-200 border-2 border-black flex items-center justify-center text-black mb-4">
                                                            <FaCrown size="1.5rem" />
                                                        </div>
                                                        <h3 className="text-xl font-black text-black">
                                                            No Supporters Yet
                                                        </h3>
                                                        <p className="text-gray-700 mt-2 text-sm">
                                                            This membership has
                                                            no subscribers yet.
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
            )}
        </Authenticated>
    );
}
