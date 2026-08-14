import { usePage, router } from "@inertiajs/react";
import SocialLinks from "@/includes/SocialLinks";
import { Tab } from "@headlessui/react";
import { useState, useEffect, Fragment } from "react";
import GifterFeed from "./GifterFeed";
import GifterPurchasesTab from "./GifterPurchasesTab";
import ActivateCard from "./ActivateCard";
import { Ban, Unlock, CircleUserRound, Rss, ShoppingBag } from "lucide-react";
import SupporterLevel from "@/Components/Gifter/SupporterLevel";
import CreatorsBacked from "@/Components/Gifter/CreatorsBacked";
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

    const categories = ["about", "feed", ...(isOwner ? ["purchases"] : [])];
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

    // Four review states rendered four near-identical blocks. One shape.
    const Notice = ({ tone, title, children }) => (
        <div
            className={`rounded-box-sm border p-4 ${
                tone === "warn"
                    ? "border-[#E5A800]/40 bg-[#FFF8E1]"
                    : "border-[#D92D20]/30 bg-[#FEF3F2]"
            }`}
        >
            <p
                className={`text-[12px] font-black uppercase tracking-[0.14em] ${
                    tone === "warn" ? "text-[#8A6100]" : "text-[#B42318]"
                }`}
            >
                {title}
            </p>
            <p className="mt-1.5 text-[13px] font-semibold leading-relaxed text-gray-700">
                {children}
            </p>
        </div>
    );

    const AboutScreen = () => {
        // A bio only shows when it is approved, or to the owner while it is in
        // review. There is deliberately NO placeholder body text — inventing a
        // sentence for someone's profile is worse than showing nothing.
        const showBio =
            (user?.bio_approved === 1 && user?.bio) ||
            (IsloggedIn && user?.bio_approved === 0 && user?.bio) ||
            (IsloggedIn && user?.bio_approved === 2 && user?.edit_bio_reason);

        const notices = [];
        if (IsloggedIn && user?.bio_approved === 0 && user?.bio)
            notices.push({
                key: "bio-review",
                tone: "warn",
                title: "Bio under review",
                body: "Your bio is waiting for admin approval. It stays hidden from visitors until then.",
            });
        if (IsloggedIn && user?.bio_approved === 2 && user?.edit_bio_reason)
            notices.push({
                key: "bio-edit",
                tone: "bad",
                title: "Bio needs an edit",
                body: user.edit_bio_reason,
            });
        if (IsloggedIn && sLinks?.status === 0)
            notices.push({
                key: "links-review",
                tone: "warn",
                title: "Social links under review",
                body: "Your updated links are waiting for admin approval.",
            });
        if (IsloggedIn && sLinks?.status === 2 && sLinks?.reason)
            notices.push({
                key: "links-edit",
                tone: "bad",
                title: "Social links need an edit",
                body: sLinks.reason,
            });
        if (IsloggedIn && sLinks?.status === 3 && sLinks?.reason)
            notices.push({
                key: "links-req",
                tone: "bad",
                title: "Social links edit requested",
                body: sLinks.reason,
            });

        const hasLinks =
            sLinks &&
            Object.keys(sLinks).some(
                (k) => !["status", "reason", "id"].includes(k) && sLinks[k],
            );

        return (
            <div className="about-sec flex flex-col gap-4">
                {/* What this person has actually done — the reason to look at
                    a supporter profile at all. */}
                <SupporterLevel isOwner={isOwner} />

                {/* Owner-only; the component self-hides on a visitor's payload. */}
                <CreatorsBacked />

                {notices.length > 0 && (
                    <div className="flex flex-col gap-3">
                        {notices.map((n) => (
                            <Notice key={n.key} tone={n.tone} title={n.title}>
                                {n.body}
                            </Notice>
                        ))}
                    </div>
                )}

                {(showBio || hasLinks) && (
                    <div className="rounded-box border border-black/10 bg-white p-4 sm:p-5 md:border-2 md:border-black">
                        {showBio && (
                            <>
                                <h3 className="text-[12px] font-black uppercase tracking-[0.16em] text-black">
                                    About me
                                </h3>
                                <p className="mt-3 text-[15px] font-semibold leading-relaxed text-gray-800">
                                    {user?.bio}
                                </p>
                            </>
                        )}

                        {hasLinks && (
                            <div
                                className={
                                    showBio
                                        ? "mt-4 border-t border-black/10 pt-4"
                                        : ""
                                }
                            >
                                <h3 className="mb-3 text-[12px] font-black uppercase tracking-[0.16em] text-black">
                                    Find me on
                                </h3>
                                <SocialLinks
                                    textcolor="text-black hover:text-black transition-colors"
                                    links={sLinks}
                                />
                            </div>
                        )}
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
            className={`relative z-1 min-h-dvh pb-20 bg-[#A2E4B8] ${
                IsloggedIn ? "IsloggedIn" : ""
            }`}
        >
            <div className="mx-auto max-w-[1400px] pt-4">
                {isBlocked ? (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white border-2 border-black rounded-box p-8 md:p-10">
                            {/* Icon */}
                            <div className="flex justify-center">
                                <div className="w-20 h-20 rounded-full bg-red-100 border-2 border-black flex items-center justify-center">
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

                                        <p className="mt-4 text-black/80 font-semibold ">
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

                                        <p className="mt-4 text-black/80 font-semibold">
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
                                            rounded-box-sm
                                            px-8
                                            py-3
                                            font-black
                                            text-white
                                            min-h-[44px]
                                            transition-colors
                                            duration-200
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
                                {/* ActivateCard returns null unless verification
                                    is actually needed, and an empty wrapper still
                                    applies its own margin — a phantom 16px above
                                    the tabs on every normal profile. */}
                                <div className="mx-auto max-w-4xl empty:hidden [&:not(:empty)]:mb-4">
                                    <ActivateCard />
                                </div>
                                <div className="inlinetab ">
                                    <Tab.Group
                                        selectedIndex={selectedIndex}
                                        onChange={setSelectedIndex}
                                    >
                                        <div className="relative pb-2">
                                            <div className="relative flex w-full items-center gap-3 py-2">
                                                <Tab.List className="flex min-w-0 flex-1 gap-2 overflow-x-auto scrollbar-hide px-0 pb-2 pt-1">
                                                    {[
                                                        {
                                                            label: "About",
                                                            Icon: CircleUserRound,
                                                        },
                                                        {
                                                            label: "Feed",
                                                            Icon: Rss,
                                                        },
                                                        ...(isOwner
                                                            ? [
                                                                  {
                                                                      label: "Purchases",
                                                                      Icon: ShoppingBag,
                                                                  },
                                                              ]
                                                            : []),
                                                    ].map(({ label, Icon }) => (
                                                        <Tab
                                                            key={label}
                                                            as={Fragment}
                                                        >
                                                            {({ selected }) => (
                                                                <button
                                                                    aria-pressed={
                                                                        selected
                                                                    }
                                                                    className={`relative min-w-max touch-manipulation select-none whitespace-nowrap rounded-box-sm border-2 border-black px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-colors duration-200 focus:outline-none md:text-sm ${
                                                                        selected
                                                                            ? "bg-yellow-300 text-black"
                                                                            : "bg-white text-black hover:bg-yellow-100"
                                                                    }`}
                                                                >
                                                                    <span className="flex items-center gap-1.5">
                                                                        <Icon
                                                                            size={
                                                                                15
                                                                            }
                                                                            strokeWidth={
                                                                                2.5
                                                                            }
                                                                            className="shrink-0"
                                                                        />
                                                                        {label}
                                                                    </span>
                                                                </button>
                                                            )}
                                                        </Tab>
                                                    ))}
                                                </Tab.List>
                                            </div>
                                        </div>

                                        <Tab.Panels>
                                            <Tab.Panel className="focus:outline-none">
                                                <div className="mx-auto max-w-4xl">
                                                    <AboutScreen />
                                                </div>
                                            </Tab.Panel>
                                            <Tab.Panel className="focus:outline-none">
                                                <div className="mx-auto w-full max-w-4xl">
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
                                                    <div className="mx-auto max-w-4xl">
                                                        <GifterPurchasesTab />
                                                    </div>
                                                </Tab.Panel>
                                            )}
                                        </Tab.Panels>
                                    </Tab.Group>
                                </div>
                            </>
                        ) : (
                            <div className="mx-auto max-w-4xl">
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
                        <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-100 border-2 border-black flex items-center justify-center">
                            <Unlock className="w-10 h-10 text-green-600" />
                        </div>

                        <h2 className="font-gulfs text-3xl uppercase">
                            Unblock User
                        </h2>

                        <p className="mt-4 text-black/80 font-semibold leading-[1.6]">
                            Are you sure you want to unblock this user?
                        </p>

                        <div className="mt-6 rounded-box-sm border-2 border-black bg-[#F8F9FC] p-5 text-left">
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
                                className="px-7 py-3 rounded-box-sm border-2 border-black bg-white font-black transition-opacity hover:opacity-90"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={confirmUnblock}
                                disabled={isUnblocking}
                                className="px-7 py-3 rounded-box-sm border-2 border-black bg-[#32C766] text-white font-black transition-opacity hover:opacity-90 disabled:opacity-60"
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
