import axios from "axios";
import { useState, useEffect } from "react";
import { Link } from "@inertiajs/react";
import LoadingScreen from "@/includes/LoadingScreen";
import Nocontent from "@/includes/Nocontent";
import PriceFormat from "@/includes/PriceFormat";
import Membership from "./../membership/Membership";

export default function MembershipLists({ username }) {
    const [handleTab, setHandleTab] = useState("memberships");
    const { formatMultiPrice } = PriceFormat();

    const ITEM = ({ itm }) => {
        return (
            <>
                <div className="relative group overflow-hidden rounded-[30px]   bg-[#1A1B23]/40 border border-white/20 transition-all duration-500 hover:border-white/20 hover:bg-[#1A1B23]/60 hover:-translate-y-1">
                    <div className="aspect-[16/9] overflow-hidden">
                        {handleTab == "memberships" ? (
                            <img
                                src={itm?.membership?.perma_link || ""}
                                alt="image"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        ) : (
                            <img
                                src={itm?.wish_item?.perma_link || ""}
                                alt="image"
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1B23] via-transparent to-transparent opacity-60"></div>
                    </div>

                    <div className="p-6 relative">
                        <Link
                            href={`${itm?.owner?.username || ""}`}
                            className="flex items-center gap-3 mb-6 group/author"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-[#05EFB8] to-[#8C52FF] rounded-[30px]   blur opacity-0 group-hover/author:opacity-40 transition duration-500"></div>
                                <img
                                    className="relative h-12 w-12 rounded-[30px]   object-cover border border-white/10"
                                    src={`${itm?.owner?.avatar || ""}`}
                                />
                            </div>
                            <div>
                                <p className="text-white font-bold text-sm mb-0 group-hover/author:text-[#05EFB8] transition-colors">
                                    {" "}
                                    {itm?.owner?.name || ""}{" "}
                                </p>
                                <p className="text-white/40 text-[10px] font-black tracking-widest uppercase">
                                    @{itm?.owner?.username || ""}
                                </p>
                            </div>
                        </Link>

                        <div className="mb-6">
                            {handleTab == "memberships" ? (
                                <h4 className="text-white font-black text-lg tracking-tight capitalize">
                                    {itm.membership?.level || ""}
                                </h4>
                            ) : (
                                <h4 className="text-white font-black text-lg tracking-tight capitalize">
                                    {itm.wish_item?.name || ""}
                                </h4>
                            )}
                            <p className="text-white/40 text-[10px] font-black tracking-widest uppercase mt-1">
                                {handleTab == "memberships"
                                    ? "Membership Level"
                                    : "Subscription"}
                            </p>
                        </div>

                        <div className="space-y-3 pt-6 border-t border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">
                                    Price
                                </span>
                                <strong className="text-[#05EFB8] font-black text-sm">
                                    {formatMultiPrice(
                                        parseInt(
                                            (itm && itm.amount) +
                                                (itm && itm.tax),
                                        ),
                                        itm && itm.currency,
                                    )}
                                </strong>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-white/40 text-[10px] font-black tracking-widest uppercase">
                                    Duration
                                </span>
                                <strong className="text-white/70 font-black text-[10px] tracking-widest uppercase">
                                    Monthly
                                </strong>
                            </div>
                            <div className="pt-3">
                                <Link
                                    href={`/support/${itm?.owner?.username || ""}/${username || ""}`}
                                    className="button rounded-[30px]  px-3 text-[11px] uppercase"
                                >
                                    View Story
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );
    };

    const CATITEM = ({ type }) => {
        const [loading, setLoading] = useState(false);
        const [subs, setsubs] = useState([]);

        const fetch = (signal) => {
            setLoading(true);
            axios
                .get(`/gifter-${type}/${username}`, { signal })
                .then((resp) => {
                    if (type == "memberships") {
                        setsubs(resp.data.membership || []);
                    } else {
                        setsubs(resp.data.subscriptions || []);
                    }
                    setLoading(false);
                })
                .catch((_err) => {
                    const isCanceled =
                        (signal && signal.aborted) ||
                        _err?.code === "ERR_CANCELED" ||
                        _err?.message === "canceled" ||
                        _err?.name === "CanceledError";
                    if (isCanceled) {
                        return;
                    }
                    console.error(`${type} error`, _err);
                    setLoading(false);
                });
        };

        useEffect(() => {
            const controller = new AbortController();
            const { signal } = controller;
            fetch(signal);
            return () => controller.abort();
        }, []);

        return (
            <>
                {loading ? (
                    <LoadingScreen />
                ) : (
                    <>
                        {subs && subs.length ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 pt-8">
                                {subs.map((item, i) => {
                                    return (
                                        <div
                                            className="mb-4"
                                            key={`memberships-${i}`}
                                        >
                                            <ITEM itm={item} />
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex justify-center items-center w-full pt-16">
                                <Nocontent text="Nothing to see !!" />
                            </div>
                        )}
                    </>
                )}
            </>
        );
    };

    return (
        <>
            <div className="m-auto">
                <div className="flex justify-center items-center">
                    <button
                        onClick={() => setHandleTab(`memberships`)}
                        className={`${handleTab !== "memberships" ? "bg-gray-500 opacity-[0.6]" : "opacity-[1]"} button  rounded-[30px]   mx-1 px-3 text-[11px] uppercase `}
                    >
                        Memberships
                    </button>
                    <button
                        onClick={() => setHandleTab("subscriptions")}
                        className={`${handleTab !== "subscriptions" ? "bg-gray-500 opacity-[0.6]" : "opacity-[1]"} button  rounded-[30px]   mx-1 px-3 text-[11px] uppercase `}
                    >
                        Subscriptions
                    </button>
                </div>

                {handleTab == "memberships" ? (
                    <CATITEM type={handleTab} />
                ) : (
                    <CATITEM type={handleTab} />
                )}
            </div>
        </>
    );
}
