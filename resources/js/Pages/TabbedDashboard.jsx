import React, { useState, useMemo, useEffect, Suspense } from "react";
import { Head, usePage } from "@inertiajs/react";
import { useAlerts } from "@/Components/Alerts";
import Guest from "@/Layouts/GuestLayout";
import axios from "axios";

// Import the new components we created
import BottomNavigation from "@/Components/BottomNavigation";
import ProfileTabs from "@/Components/ProfileTabs";
import TabContent from "@/Components/TabContent";

// Import existing components
const Userprofile = React.lazy(() => import("@/wishlist/Userprofile"));
const ProfileSteps = React.lazy(() => import("./Profile/ProfileSteps"));
const LoadingScreen = React.lazy(() => import("@/includes/LoadingScreen"));

export default function TabbedDashboard(props) {
    const {
        auth,
        user,
        username,
        global_currency,
        slinks,
        wish_categories,
        items,
        selectedCategory,
    } = props;

    // State management
    const [activeTab, setActiveTab] = useState('about');
    const [wishitems, setWishitems] = useState(useMemo(() => items || [], [items]));
    const [IsloggedIn, setIsLoggedIn] = useState(
        (auth && auth.user && auth.user.username) == (user && user.username)
    );
    const [sLinks, setLinks] = useState(slinks || []);

    // Keep local sLinks state in sync when server props change
    useEffect(() => {
        setLinks(slinks || []);
    }, [slinks]);
    const [gifts, setGifts] = useState([]);
    const [giftsloading, setGiftsLoading] = useState(false);

    // Alerts (handled by FlashMessenger in layout)
    const { successAlert, errorAlert, infoAlert, warningAlert } = useAlerts();

    // Fetch gifts when tab changes to gifts
    const fetch_gifts = async (signal) => {
        setGiftsLoading(true);
        try {
            const resp = await axios.get(`/gift-items/${username}`, { signal });
            setGifts(resp?.data?.items);
        } catch (err) {
            console.error("error", err);
        } finally {
            setGiftsLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'gifts') {
            const controller = new AbortController();
            const { signal } = controller;
            fetch_gifts(signal);
            return () => controller.abort();
        }
    }, [activeTab, username]);

    // Flash messages now handled centrally by FlashMessenger in layout

    // Handle tab changes
    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
    };

    // Handle add button click based on active tab
    const handleAddClick = () => {
        // You can implement specific add actions for each tab here
        console.log(`Add clicked for ${activeTab} tab`);
        // Example: open modal or navigate to add form based on activeTab
    };

    return (
        <Guest
            user={user}
            username={username}
            IsloggedIn={IsloggedIn}
            auth={auth}
        >
            <Head title={`${user?.name || 'Profile'} Dashboard`} />
            
            <div className="min-h-screen bg-gray-100">
                {/* Profile Header Section */}
                <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 min-h-[300px]">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-10">
                        <div className="w-full h-full bg-cover bg-center" 
                             style={{
                                 backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23ffffff\" fill-opacity=\"0.1\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"4\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"
                             }}>
                        </div>
                    </div>

                    {/* Profile Steps (if needed) */}
                    <div className="relative z-10 pt-4 px-4">
                        <Suspense fallback={<div></div>}>
                            <ProfileSteps IsloggedIn={IsloggedIn} sLinks={sLinks} />
                        </Suspense>
                    </div>

                    {/* User Profile Section */}
                    <div className="relative z-10">
                        <Suspense fallback={<LoadingScreen />}>
                            <Userprofile IsloggedIn={IsloggedIn} />
                        </Suspense>
                    </div>
                </div>

                {/* Profile Tabs Navigation */}
                <ProfileTabs
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    showAddButton={IsloggedIn}
                    onAddClick={handleAddClick}
                />

                {/* Tab Content */}
                <TabContent
                    activeTab={activeTab}
                    user={user}
                    sLinks={sLinks}
                    wishitems={wishitems}
                    IsloggedIn={IsloggedIn}
                    username={username}
                    selectedCategory={selectedCategory}
                    wish_categories={wish_categories}
                    gifts={gifts}
                    giftsloading={giftsloading}
                    currency={global_currency}
                    auth={auth?.user}
                    itemid={null}
                    setuped={auth?.user?.stripe_details_submitted === 1}
                />

                {/* Bottom Navigation */}
                <BottomNavigation activeTab="home" />
            </div>
        </Guest>
    );
}
