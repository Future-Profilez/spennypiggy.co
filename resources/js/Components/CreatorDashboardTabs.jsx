import { Link, usePage } from "@inertiajs/react";
import { FaCrown } from "react-icons/fa6";
import { FiRefreshCw, FiShoppingBag } from "react-icons/fi";

export default function CreatorDashboardTabs() {
    const { url } = usePage();

    const tabs = [
        {
            title: "Memberships",
            subtitle: "Your tiers & members",
            route: "/membership-dashboard",
            Icon: FaCrown,
        },
        {
            title: "Recurring content",
            subtitle: "Your bills & revenue",
            route: "/billing-dashboard",
            Icon: FiRefreshCw,
        },
        {
            title: "My subscriptions",
            subtitle: "What you support",
            route: "/billing/my-subscriptions",
            Icon: FiShoppingBag,
        },
    ];

    return (
        <div className="mb-8">
            <div
                className="flex flex-wrap gap-3"
                role="tablist"
                aria-label="Creator finance dashboards"
            >
                {tabs.map((tab) => {
                    const active = url.startsWith(tab.route);
                    const { Icon } = tab;

                    return (
                        <Link
                            key={tab.route}
                            href={tab.route}
                            role="tab"
                            aria-selected={active}
                            aria-current={active ? "page" : undefined}
                            className={`group rounded-box px-4 py-3 min-h-[44px] flex-1 min-w-[190px] transition-all duration-200 ${
                                active
                                    ? "bg-[#FF007F] shadow-[0_14px_30px_-12px_rgba(255,0,127,0.55)]"
                                    : "bg-white ring-1 ring-gray-200/80 shadow-[0_6px_18px_-10px_rgba(0,0,0,0.15)] hover:ring-gray-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-12px_rgba(0,0,0,0.2)]"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-11 h-11 shrink-0 rounded-box-sm flex items-center justify-center transition-colors ${
                                        active
                                            ? "bg-white/20"
                                            : "bg-pink-50 group-hover:bg-pink-100"
                                    }`}
                                >
                                    <Icon
                                        className={active ? "text-white" : "text-[#FF007F]"}
                                        size="1.2rem"
                                    />
                                </div>

                                <div className="text-left">
                                    <p
                                        className={`text-sm font-semibold leading-tight ${
                                            active ? "text-white" : "text-gray-900"
                                        }`}
                                    >
                                        {tab.title}
                                    </p>
                                    <p
                                        className={`text-xs mt-0.5 leading-tight ${
                                            active ? "text-white/75" : "text-gray-500"
                                        }`}
                                    >
                                        {tab.subtitle}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
