import { Link, usePage } from "@inertiajs/react";

export default function CreatorDashboardTabs() {
    const { url } = usePage();

    const tabs = [
        {
            title: "Membership Dashboard",
            route: "/membership-dashboard",
            icon: "👑",
            color: "from-pink-500 to-purple-500",
        },
        {
            title: "Bill Dashboard",
            route: "/billing-dashboard",
            icon: "💳",
            color: "from-cyan-500 to-blue-500",
        },
        {
            title: "My Subscriptions",
            route: "/billing/my-subscriptions",
            icon: "📦",
            color: "from-emerald-500 to-green-500",
        },
    ];

    return (
        <div className="mb-8">
            <div className="flex flex-wrap gap-4">
                {tabs.map((tab, index) => {
                    const active = url.startsWith(tab.route);

                    return (
                        <Link
                            key={index}
                            href={tab.route}
                            className={`relative overflow-hidden rounded-[30px]  px-5 py-4 border transition-all duration-300 min-w-[210px] group ${active ? `bg-yellow-300 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]` : "bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:bg-gray-100 hover:translate-x-[-2px] hover:translate-y-[-2px]"}`}
                        >
                            <div className="flex items-center gap-3 relative z-10">
                                <div
                                    className={`w-12 h-12 rounded-[14px] flex items-center justify-center text-xl bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
                                >
                                    {tab.icon}
                                </div>

                                <div>
                                    <p
                                        className={`text-sm font-bold text-black`}
                                    >
                                        {tab.title}
                                    </p>

                                    <p
                                        className={`text-xs mt-1 text-gray-600 font-bold`}
                                    >
                                        Open Dashboard
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
