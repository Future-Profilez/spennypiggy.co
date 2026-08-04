import React, { Suspense } from "react";
import LoadingScreen from "@/includes/LoadingScreen";

// Lazy load existing components from your codebase
const WishlistGrid = React.lazy(() => import("@/Components/WishlistGrid"));
const MembershipsLists = React.lazy(
    () => import("@/Pages/membership/MembershipsLists"),
);
const Billslist = React.lazy(() => import("@/Pages/bills/Billslist"));
const ProfileProductLists = React.lazy(
    () => import("@/Pages/shop/profile/ProfileProductLists"),
);
const GiftListing = React.lazy(() => import("@/Pages/rye/GiftListing"));
const SecurityZone = React.lazy(() => import("@/Components/SecurityZone"));

// About Tab Component
const AboutTab = ({ user, sLinks }) => (
    <div className="p-4 space-y-4">
        {user?.bio ? (
            <div className="bg-white rounded-[30px]   p-4 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">About</h3>
                <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            </div>
        ) : (
            <div className="bg-gray-50 rounded-[30px]   p-6 text-center">
                <p className="text-gray-500">No bio added yet.</p>
            </div>
        )}

        {sLinks && sLinks.length > 0 && (
            <>
                {/* Simple Social Links */}
                <div className="bg-white rounded-[30px]   p-4 shadow-sm">
                    <h3 className="font-semibold text-lg mb-3">Social Links</h3>
                    <div className="flex flex-wrap gap-2">
                        {sLinks.map((link, index) => (
                            <a
                                key={index}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                                {link.platform}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-[30px]   p-8 shadow-2xl transition-all hover:border-white/10 group">
                        <h3 className="text-sm font-black text-white/40 tracking-[0.25em] uppercase mb-8 flex items-center gap-4">
                            <div className="w-8 h-[1px] bg-gradient-to-r from-[#8C52FF] to-transparent"></div>
                            Socials
                        </h3>

                        <div className="flex flex-col gap-4">
                            {sLinks.map((link, index) => (
                                <a
                                    key={index}
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-5 bg-white/5 rounded-[30px]   border border-white/20 text-white/70 hover:bg-white/10 hover:text-white transition-all group/link"
                                >
                                    <span className="font-black text-[10px] tracking-[0.2em] uppercase">
                                        {link.platform}
                                    </span>
                                    <div className="w-10 h-10 flex items-center justify-center rounded-[30px]   bg-white/5 group-hover/link:bg-[#05EFB8]/20 group-hover/link:text-[#05EFB8] transition-all">
                                        →
                                    </div>
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </>
        )}
    </div>
);

// Wishes Tab Component
const WishesTab = ({
    wishitems,
    IsloggedIn,
    username,
    selectedCategory,
    wish_categories,
    currency,
    auth,
    itemid,
    setuped,
}) => (
    <div className="min-h-dvh">
        <Suspense fallback={<LoadingScreen />}>
            <WishlistGrid
                wishitems={wishitems}
                IsloggedIn={IsloggedIn}
                username={username}
                selectedCategory={selectedCategory}
                wish_categories={wish_categories}
                currency={currency}
                auth={auth}
                itemid={itemid}
                setuped={setuped}
            />
        </Suspense>
    </div>
);

// Memberships Tab Component
const MembershipsTab = ({ IsloggedIn, username }) => (
    <div className="min-h-dvh">
        <Suspense fallback={<LoadingScreen />}>
            <MembershipsLists IsloggedIn={IsloggedIn} username={username} />
        </Suspense>
    </div>
);

// Bills Tab Component
const BillsTab = ({ IsloggedIn, username }) => (
    <div className="min-h-dvh">
        <Suspense fallback={<LoadingScreen />}>
            <Billslist IsloggedIn={IsloggedIn} username={username} />
        </Suspense>
    </div>
);

// Shop Tab Component
const ShopTab = ({ IsloggedIn, username }) => (
    <div className="min-h-dvh">
        <Suspense fallback={<LoadingScreen />}>
            <ProfileProductLists IsloggedIn={IsloggedIn} username={username} />
        </Suspense>
    </div>
);

// Gifts Tab Component
const GiftsTab = ({ gifts, giftsloading }) => (
    <div className="min-h-dvh">
        <Suspense fallback={<LoadingScreen />}>
            <GiftListing gifts={gifts} loading={giftsloading} />
        </Suspense>
    </div>
);

// Security Tab Component
const SecurityTab = () => (
    <div className="p-4 min-h-dvh">
        <Suspense fallback={<LoadingScreen />}>
            <div className="bg-white rounded-[30px]  p-6 shadow-sm border-2 border-black">
                <SecurityZone />
            </div>
        </Suspense>
    </div>
);

// Main TabContent Component
export default function TabContent({
    activeTab,
    user,
    sLinks,
    wishitems,
    IsloggedIn,
    username,
    selectedCategory,
    wish_categories,
    gifts,
    giftsloading,
    currency,
    auth,
    itemid,
    setuped,
}) {
    const renderTabContent = () => {
        switch (activeTab) {
            case "about":
                return <AboutTab user={user} sLinks={sLinks} />;
            case "wishes":
                return (
                    <WishesTab
                        wishitems={wishitems}
                        IsloggedIn={IsloggedIn}
                        username={username}
                        selectedCategory={selectedCategory}
                        wish_categories={wish_categories}
                        currency={currency}
                        auth={auth}
                        itemid={itemid}
                        setuped={setuped}
                    />
                );
            case "memberships":
                return (
                    <MembershipsTab
                        IsloggedIn={IsloggedIn}
                        username={username}
                    />
                );
            case "bills":
                return <BillsTab IsloggedIn={IsloggedIn} username={username} />;
            case "shop":
                return <ShopTab IsloggedIn={IsloggedIn} username={username} />;
            case "gifts":
                return <GiftsTab gifts={gifts} giftsloading={giftsloading} />;
            case "security":
                return <SecurityTab />;
            default:
                return <AboutTab user={user} sLinks={sLinks} />;
        }
    };

    return <div className="flex-1 pb-20">{renderTabContent()}</div>;
}
