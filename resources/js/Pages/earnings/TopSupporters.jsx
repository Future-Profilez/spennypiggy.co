import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import { Link, usePage } from "@inertiajs/react";
import axios from "axios";
import * as React from "react";
import { useEffect } from "react";
import { useState } from "react";
import userphoto from "../../../assets/siteicon.png";

export default function TopSupporters({ earnType, className = "" }) {
    const { formatMultiPrice } = PriceFormat();
    const { auth, global_currency } = usePage().props;

    const [loading, setLoading] = useState(false);
    const [lists, setLists] = useState([]);
    const fetchingStats = () => {
        setLoading(true);
        axios
            .get(`/earnings/top-supporters/${earnType}`)
            .then((resp) => {
                setLists(resp.data.data);
                setLoading(false);
            })
            .catch((_err) => {
                console.error("error", _err);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchingStats();
    }, [earnType]);

    function SupporterItem({ item }) {
        return (
            <div className="flex gap-4 justify-between items-center py-3 border-b border-gray-50 last:border-0 group hover:bg-gray-50 px-2.5 -mx-2.5 rounded-box-sm transition-all duration-200">
                <Link
                    href={`/${item.username}`}
                    className="flex items-center gap-3 min-w-0 flex-1"
                >
                    <div className="relative shrink-0 border border-gray-100 rounded-full overflow-hidden w-11 h-11 bg-indigo-50/50">
                        <img
                            src={item.media || userphoto}
                            alt={item.name}
                            className="w-full h-full object-cover transition-[filter,opacity] duration-500 group-hover:brightness-[1.08]"
                        />
                    </div>
                    <div className="min-w-0 flex flex-col">
                        <h3 className="text-sm font-bold text-black/80 flex items-center gap-2 min-w-0">
                            <span className="truncate" title={item.name}>
                                {item.name}
                            </span>
                            {item.has_dispute ? (
                                <span className="shrink-0 text-[12px] font-extrabold uppercase tracking-wider bg-red-50 text-red-500 px-2 py-0.5 rounded-full border border-red-100/50">
                                    Disputed
                                </span>
                            ) : item.has_hold ? (
                                <span className="shrink-0 text-[12px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-500 px-2 py-0.5 rounded-full border border-amber-100/50">
                                    Hold
                                </span>
                            ) : null}
                        </h3>
                        <p className="text-[12px] text-black/60 font-semibold tracking-wider">
                            @{item.username}
                        </p>
                    </div>
                </Link>
                <div className="shrink-0 text-sm font-extrabold text-black bg-gray-50 px-3 py-1.5 rounded-box-sm whitespace-nowrap border border-gray-100 tabular-nums">
                    {formatMultiPrice(
                        item && item.amount,
                        global_currency || "gbp",
                    )}
                </div>
            </div>
        );
    }

    return (
        <section
            className={`bg-white rounded-box p-5 md:p-6 border-black overflow-hidden h-full flex flex-col ${className}`}
        >
            <div className="pb-4 mb-4 flex items-center justify-between gap-3 border-b-2 border-black/10">
                <h2 className="font-gulfs uppercase tracking-[0.1em] text-[13px] text-black">
                    Top Supporters
                </h2>
                <span className="border-2 border-black rounded-box-xs px-2.5 py-1 font-gulfs uppercase tracking-[0.08em] text-[11px] leading-none text-black">
                    VIP
                </span>
            </div>

            <div className="flex-grow">
                {loading ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-14 bg-gray-50 rounded-box-sm border border-gray-100"
                            />
                        ))}
                    </div>
                ) : lists && lists.length ? (
                    lists.map((item, index) => (
                        <SupporterItem key={index} item={item} />
                    ))
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                        <div className="w-14 h-14 bg-gray-50 border border-gray-100 rounded-full flex items-center justify-center mb-4 text-2xl">
                            ⭐
                        </div>
                        <p className="text-xs font-black text-black/60 uppercase tracking-widest">
                            No supporters found
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
