import { usePage, router } from "@inertiajs/react";
import SocialLinks from "@/includes/SocialLinks";
import { Tab } from "@headlessui/react";
import { useState, useEffect, Fragment } from "react";
import GifterFeed from "./GifterFeed";
import GifterPurchasesTab from "./GifterPurchasesTab";
import ActivateCard from "./ActivateCard";
import { Ban, Unlock } from "lucide-react";
import Modal from "@/Components/Modal";
import { useAlerts } from "@/Components/Alerts";

export default function Gifter({ IsloggedIn, sLinks, blockData, username }) {
    const pageProps = usePage().props || {};
    const { successAlert, errorAlert } = useAlerts();
    const { auth, user, itemid } = pageProps;
    const isBlocked = blockData?.blocked;
    const blockedByMe = blockData?.blocked_by_me;
    // Owner viewing their own profile — gates the private "Purchases" tab.
    const isOwner = !!(auth?.user?.id && user?.id && auth.user.id === user.id);

    const categories = [
        "about",
        "feed",
        ...(isOwner ? ["purchases"] : []),
    ];
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const tabParam = urlParams.get("tab");
        if (tabParam) {
            const index = categories.indexOf(tabParam.toLowerCase());
            if (index !== -1) {
                setSelectedIndex(index);
            }
        }
    }, []);

    const AboutScreen = () => {
        const shouldShowAboutSection =
            user?.bio_approved === 1 ||
            (IsloggedIn && user?.bio_approved === 0 && user?.bio) ||
            (IsloggedIn && user?.bio_approved === 2 && user?.edit_bio_reason);

        return (
            <div className="about-sec m-auto max-w-4xl">
                {shouldShowAboutSection && (
                    <div className="relative mb-10 rounded-[30px]  overflow-hidden bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                        <div className="p-8 md:p-12 relative">
                            <div className="">
                                <h3 className="text-sm font-black text-black tracking-widest uppercase mb-4 flex items-center gap-4">
                                    About Me
                                </h3>
                                <p className="text-black text-lg md:text-xl leading-relaxed font-bold">
                                    {user && user.bio
                                        ? user.bio
                                        : "The overall effect is both humbling and inspiring in its clarity."}
                                </p>

                                <div className="mt-8 pt-8 border-t-[3px] border-black/20">
                                    <SocialLinks
                                        textcolor="text-black hover:text-black transition-all duration-300"
                                        links={sLinks}
                                    />
                                </div>
                            </div>

                            {IsloggedIn &&
                            user?.bio_approved === 0 &&
                            user?.bio ? (
                                <div className="mt-10 p-6 rounded-xl bg-yellow-100 border-[3px] border-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-yellow-800 font-black text-xs tracking-widest uppercase mb-2">
                                        Under Review
                                    </p>
                                    <p className="text-gray-900 font-bold text-sm leading-relaxed">
                                        Your bio is currently pending approval
                                        by the admin.
                                    </p>
                                </div>
                            ) : null}

                            {IsloggedIn &&
                            user?.bio_approved === 2 &&
                            user?.edit_bio_reason ? (
                                <div className="mt-10 p-6 rounded-xl bg-red-400 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-black font-black text-xs tracking-widest uppercase mb-2">
                                        Review Required
                                    </p>
                                    <p className="text-gray-900 font-bold text-sm leading-relaxed">
                                        {user?.edit_bio_reason}
                                    </p>
                                </div>
                            ) : null}

                            {IsloggedIn && sLinks?.status === 0 ? (
                                <div className="mt-10 p-6 rounded-xl bg-yellow-100 border-[3px] border-yellow-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-yellow-800 font-black text-xs tracking-widest uppercase mb-2">
                                        Social Links Under Review
                                    </p>
                                    <p className="text-gray-900 font-bold text-sm leading-relaxed">
                                        Your updated social links are currently
                                        pending approval by the admin.
                                    </p>
                                </div>
                            ) : null}

                            {IsloggedIn &&
                            sLinks?.status === 2 &&
                            sLinks?.reason ? (
                                <div className="mt-10 p-6 rounded-xl bg-red-400 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-black font-black text-xs tracking-widest uppercase mb-2">
                                        Social Links Review Required
                                    </p>
                                    <p className="text-gray-900 font-bold text-sm leading-relaxed">
                                        {sLinks?.reason}
                                    </p>
                                </div>
                            ) : null}

                            {IsloggedIn &&
                            sLinks?.status === 3 &&
                            sLinks?.reason ? (
                                <div className="mt-10 p-6 rounded-xl bg-red-400 border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                    <p className="text-black font-black text-xs tracking-widest uppercase mb-2">
                                        Social Links Edit Requested
                                    </p>
                                    <p className="text-gray-900 font-bold text-sm leading-relaxed">
                                        {sLinks?.reason}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Supporter Offerings Card */}
                {IsloggedIn && (
                    <div className="relative group mb-10">
                        <div className="relative p-8 md:p-12 rounded-[30px]  bg-white border-[3px] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <div>
                                    <h3 className="text-xs font-black text-black tracking-widest uppercase mb-4 flex items-center gap-4">
                                        <div className="w-8 h-[3px] bg-[#FF007F] border border-black"></div>
                                        Your Exclusive Benefits
                                    </h3>
                                    <p className="text-black text-2xl font-black tracking-wide">
                                        As a SpennyPiggy Supporter, you enjoy:
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    {
                                        title: "Zero Wait Time",
                                        desc: "Priority support responses for all your inquiries.",
                                        icon: "⚡",
                                    },
                                    {
                                        title: "Exclusive Badges",
                                        desc: "Unique identifiers that showcase your impact.",
                                        icon: "🎖️",
                                    },
                                    {
                                        title: "Creator Access",
                                        desc: "Direct early access to content and special drops.",
                                        icon: "🔓",
                                    },
                                    {
                                        title: "Impact Tracking",
                                        desc: "Detailed breakdown of how your support helps.",
                                        icon: "📊",
                                    },
                                    {
                                        title: "Private Feed",
                                        desc: "A unified feed of all creators you support.",
                                        icon: "📱",
                                    },
                                    {
                                        title: "Custom Flair",
                                        desc: "Unique visual styles for your profile and comments.",
                                        icon: "✨",
                                    },
                                ].map((benefit, i) => (
                                    <div
                                        key={i}
                                        className="p-6 rounded-[30px]  bg-white/5 border-[3px] border-black/20 hover:bg-white/10 hover:border-black/40 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-300"
                                    >
                                        <div className="text-3xl mb-4 drop-shadow-md">
                                            {benefit.icon}
                                        </div>
                                        <h4 className="text-black font-black text-sm uppercase tracking-widest mb-2">
                                            {benefit.title}
                                        </h4>
                                        <p className="text-black font-bold text-xs leading-relaxed">
                                            {benefit.desc}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [isUnblocking, setIsUnblocking] = useState(false);

    const unblockUser = () => {
        setShowUnblockModal(true);
    };

    const confirmUnblock = async () => {
        if (isUnblocking) return;

        setIsUnblocking(true);

        try {
            const res = await axios.delete(
                route("creator.security.unblock-user", user.id),
            );

            if (res.data.status) {
                successAlert(
                    res.data.message || "User unblocked successfully.",
                );

                setShowUnblockModal(false);

                router.reload();
            } else {
                errorAlert(res.data.message);
            }
        } catch (error) {
            errorAlert(
                error?.response?.data?.message || "Failed to unblock user.",
            );
        } finally {
            setIsUnblocking(false);
        }
    };

    return (
        <div
            className={`relative z-1 min-h-screen pb-20 bg-[#A2E4B8] ${
                IsloggedIn ? "IsloggedIn" : ""
            }`}
        >
            <div className="max-w-[1400px] mx-auto pt-8">
                {isBlocked ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white border-[4px] border-black rounded-[30px] p-8 md:p-10 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-red-100 border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                                    <Ban className="w-10 h-10 text-red-600" />
                                </div>
                            </div>

                            {/* Title */}
                            <h2 className="font-gulfs text-3xl text-center mt-6 uppercase">
                                {blockedByMe
                                    ? "You Blocked This User"
                                    : "You Cannot Interact With This User"}
                            </h2>

                            {/* Description */}
                            <div className="max-w-xl mx-auto mt-6 text-center">
                                {blockedByMe ? (
                                    <>
                                        <p className="text-xl font-black text-gray-900">
                                            🚫 You blocked this user.
                                        </p>

                                        <p className="mt-4 text-gray-600 font-semibold ">
                                            You can still browse this user's
                                            public profile, but following,
                                            messaging, sending gifts and tips
                                            are disabled until you unblock them.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-xl font-black text-gray-900">
                                            🚫 This user has blocked you.
                                        </p>

                                        <p className="mt-4 text-gray-600 font-semibold">
                                            This user has blocked you. You can
                                            view their public profile, but all
                                            interactions are currently
                                            unavailable.
                                        </p>
                                    </>
                                )}
                            </div>

                            {/* Unblock Button */}
                            {blockedByMe && (
                                <div className="mt-8 flex justify-center">
                                    <button
                                        onClick={unblockUser}
                                        className="
                                            flex
                                            items-center
                                            gap-2
                                            bg-[#32C766]
                                            hover:bg-[#28b45a]
                                            border-[3px]
                                            border-black
                                            rounded-[18px]
                                            px-8
                                            py-3
                                            font-black
                                            text-white
                                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                            hover:translate-x-[2px]
                                            hover:translate-y-[2px]
                                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                            transition-all
                                        "
                                    >
                                        <Unlock className="w-5 h-5" />
                                        Unblock User
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Existing Gifter UI */}

                        {IsloggedIn ? (
                            <>
                                <div className="max-w-4xl mx-auto">
                                    <ActivateCard />
                                </div>
                                <div className="inlinetab ">
                                    <Tab.Group
                                        selectedIndex={selectedIndex}
                                        onChange={setSelectedIndex}
                                    >
                                        <Tab.List className="flex items-center justify-center gap-3 md:gap-4 mb-4 md:mb-12 overflow-x-auto scrollbar-hide p-2 pt-1">
                                            {[
                                                "About",
                                                "Feed",
                                                ...(isOwner ? ["Purchases"] : []),
                                            ].map((category, idx) => (
                                                <Tab
                                                    key={category}
                                                    as={Fragment}
                                                >
                                                    {({ selected }) => (
                                                        <button
                                                            className={`relative focus:border-0 focus:outline-none text-sm md:text-base 
                                                font-black tracking-widest uppercase transition-all duration-300 whitespace-nowrap
                                                py-2 px-6 border-[3px] border-black rounded-[30px]  
                                                ${selected ? "text-black bg-yellow-300 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] translate-x-[-1px] translate-y-[-1px]" : "text-black bg-white hover:bg-yellow-100 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]"} 
                                            `}
                                                        >
                                                            {category}
                                                        </button>
                                                    )}
                                                </Tab>
                                            ))}
                                        </Tab.List>

                                        <Tab.Panels>
                                            <Tab.Panel className="focus:outline-none">
                                                <div className="max-w-4xl mx-auto">
                                                    <AboutScreen />
                                                </div>
                                            </Tab.Panel>
                                            <Tab.Panel className="focus:outline-none">
                                                <div className="w-full max-w-[700px] mx-auto ">
                                                    <GifterFeed
                                                        username={
                                                            (user &&
                                                                user.username) ||
                                                            ""
                                                        }
                                                    />
                                                </div>
                                            </Tab.Panel>

                                            {isOwner && (
                                                <Tab.Panel className="focus:outline-none">
                                                    <GifterPurchasesTab />
                                                </Tab.Panel>
                                            )}
                                        </Tab.Panels>
                                    </Tab.Group>
                                </div>
                            </>
                        ) : (
                            <div className="max-w-4xl mx-auto pt-10">
                                <AboutScreen />
                            </div>
                        )}
                    </>
                )}
            </div>
            {showUnblockModal && (
                <Modal
                    show={showUnblockModal}
                    onClose={() => setShowUnblockModal(false)}
                >
                    <div className="p-8 text-center">
                        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-100 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            <Unlock className="w-10 h-10 text-green-600" />
                        </div>

                        <h2 className="font-gulfs text-3xl uppercase">
                            Unblock User
                        </h2>

                        <p className="mt-4 text-gray-600 font-semibold leading-7">
                            Are you sure you want to unblock this user?
                        </p>

                        <div className="mt-6 rounded-[18px] border-[3px] border-black bg-[#F8F9FC] p-5 text-left">
                            <p className="font-black mb-3">
                                Once unblocked you'll be able to:
                            </p>

                            <ul className="space-y-2 font-semibold text-gray-700">
                                <li>✅ View this user's activity</li>
                                <li>✅ Follow this user again</li>
                                <li>✅ Interact with their public profile</li>
                            </ul>
                        </div>

                        <div className="mt-8 flex justify-center gap-4">
                            <button
                                onClick={() => setShowUnblockModal(false)}
                                disabled={isUnblocking}
                                className="px-7 py-3 rounded-[18px] border-[3px] border-black bg-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmUnblock}
                                disabled={isUnblocking}
                                className="px-7 py-3 rounded-[18px] border-[3px] border-black bg-[#32C766] text-white font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[2px] hover:shadow-none transition-all disabled:opacity-60"
                            >
                                {isUnblocking
                                    ? "Unblocking..."
                                    : "Unblock User"}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
