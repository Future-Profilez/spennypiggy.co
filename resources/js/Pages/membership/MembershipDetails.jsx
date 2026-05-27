import { Head, Link } from "@inertiajs/react";
import Authenticated from "@/Layouts/AuthenticatedLayout";
import LoadingScreen from "@/includes/LoadingScreen";
import Avatar from "@/Components/Avatar";

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

    return (
        <Authenticated auth={auth?.user || ""}>
            <Head title="Membership Details" />

            {loading ? (
                <LoadingScreen />
            ) : (
                <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
                    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
                        {/* HEADER */}

                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
                            <div className="flex items-center gap-5">
                                <div className="w-24 h-24 rounded-[30px]  bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center text-5xl shadow-[0_10px_50px_rgba(236,72,153,0.35)]">
                                    👑
                                </div>

                                <div>
                                    <div className="flex flex-wrap items-center gap-3 mb-3">
                                        <h1 className="text-5xl font-black text-white tracking-tight">
                                            {data.membership?.title}
                                        </h1>

                                        <span className="px-4 py-2 rounded-[30px]  bg-pink-500/10 border border-pink-500/20 text-pink-300 text-sm font-bold capitalize">
                                            {data.membership?.type || "monthly"}
                                        </span>

                                        <span className="px-4 py-2 rounded-[30px]  bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-bold">
                                            Active Membership
                                        </span>
                                    </div>

                                    <p className="text-slate-400 text-lg">
                                        Full membership supporter analytics and
                                        recurring revenue insights
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/membership-dashboard"
                                className="
                                    inline-flex items-center gap-2
                                    px-5 py-3 rounded-[30px] 
                                    bg-white/5 border border-white/10
                                    text-white hover:bg-white/10
                                    transition-all duration-300
                                "
                            >
                                ← Back to Dashboard
                            </Link>
                        </div>

                        {/* STATS */}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                            <div className="rounded-[32px] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 p-6">
                                <p className="text-slate-400 text-sm">
                                    Total Supporters
                                </p>

                                <h2 className="text-5xl font-black text-white mt-4">
                                    {data.stats?.supporters || 0}
                                </h2>
                            </div>

                            <div className="rounded-3xl bg-emerald-500/10 border border-emerald-500/20 p-6">
                                <p className="text-emerald-300 text-sm">
                                    Total Revenue
                                </p>

                                <h2 className="text-5xl font-black text-white mt-4">
                                    £
                                    {Number(
                                        data.stats?.revenue || 0,
                                    ).toLocaleString()}
                                </h2>
                            </div>

                            <div className="rounded-3xl bg-cyan-500/10 border border-cyan-500/20 p-6">
                                <p className="text-cyan-300 text-sm">
                                    Next Month Estimate
                                </p>

                                <h2 className="text-5xl font-black text-white mt-4">
                                    £
                                    {Number(
                                        data.stats?.estimated_next_month || 0,
                                    ).toLocaleString()}
                                </h2>
                            </div>
                        </div>

                        {/* SUPPORTERS */}

                        <div className="rounded-[32px] bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/10 overflow-hidden">
                            <div className="p-6 border-b border-white/10">
                                <h2 className="text-2xl font-black text-white">
                                    Supporters List
                                </h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/10">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs uppercase text-slate-300">
                                                Supporter
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase text-slate-300">
                                                Amount
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase text-slate-300">
                                                Type
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase text-slate-300">
                                                Status
                                            </th>

                                            <th className="px-6 py-4 text-left text-xs uppercase text-slate-300">
                                                Joined
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-white/10">
                                        {data.supporters_list.map(
                                            (supporter, index) => (
                                                <tr
                                                    key={index}
                                                    className="hover:bg-white/[0.05] transition-all duration-300"
                                                >
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
                                                        <p className="text-2xl font-black text-emerald-400">
                                                            £
                                                            {Number(
                                                                supporter.amount,
                                                            ).toLocaleString()}
                                                        </p>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span className="px-3 py-2 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 text-sm capitalize">
                                                            {supporter.recurring_type ||
                                                                "monthly"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5">
                                                        <span className="px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm capitalize">
                                                            {supporter.status}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-5 text-slate-300">
                                                        {new Date(
                                                            supporter.created_at,
                                                        ).toLocaleDateString(
                                                            "en-GB",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            },
                                                        )}
                                                    </td>
                                                </tr>
                                            ),
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
