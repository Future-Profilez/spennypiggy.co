import { Link, usePage } from "@inertiajs/react";

export default function CreatorDashboardTabs() {
    const { url } = usePage();

    const tabs = [
        {
            title: "Bill Dashboard",
            route: "/billing-dashboard",
            icon: "💳",
            color: "from-cyan-500 to-blue-500",
        },
        {
            title: "Membership Dashboard",
            route: "/membership-dashboard",
            icon: "👑",
            color: "from-pink-500 to-purple-500",
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
                        <Link key={index} href={tab.route} className={`relative overflow-hidden rounded-2xl px-5 py-4 border transition-all duration-300 min-w-[210px] group ${active ? `bg-gradient-to-r ${tab.color} border-white/20 shadow-lg` : "bg-white/5 border-white/10 hover:bg-white/10"}`}>
                            <div className="flex items-center gap-3 relative z-10">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${active ? "bg-white/20" : "bg-white/10"}`}>
                                    {tab.icon}
                                </div>

                                <div>
                                    <p className={`text-sm font-bold ${active ? "text-white" : "text-slate-200" }`}>
                                        {tab.title}
                                    </p>

                                    <p className={`text-xs mt-1 ${active ? "text-white/80" : "text-slate-400"}`}>
                                        Open Dashboard
                                    </p>
                                </div>
                            </div>

                            {active && (
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-sm" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
