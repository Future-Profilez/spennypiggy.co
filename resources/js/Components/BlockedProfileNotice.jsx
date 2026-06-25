import { Ban, Unlock } from "lucide-react";
import { router } from "@inertiajs/react";
import { useState } from "react";
import axios from "axios";
import Modal from "@/Components/Modal";
import { useAlerts } from "@/Components/Alerts";

export default function BlockedProfileNotice({
    blockedByMe = false,
    username,
    userId,
    onUnblock = null,
}) {
    const confirmUnblock = async () => {
        if (isUnblocking) return;

        setIsUnblocking(true);

        try {
            const res = await axios.delete(
                route("creator.security.unblock-user", userId),
            );

            if (res.data.status) {
                successAlert(res.data.message);

                setShowModal(false);

                router.reload({
                    preserveScroll: true,
                });
            } else {
                errorAlert(res.data.message);
            }
        } catch (error) {
            errorAlert(
                error?.response?.data?.message ?? "Failed to unblock creator.",
            );
        } finally {
            setIsUnblocking(false);
        }
    };

    const { successAlert, errorAlert } = useAlerts();
    const [showModal, setShowModal] = useState(false);
    const [isUnblocking, setIsUnblocking] = useState(false);

    const restrictions = [
        "Support this creator",
        "Send Tip Jar payments",
        "Purchase Wishes",
        "Buy Shop Items",
        "Purchase Tasks",
        "Purchase Memberships",
        "Pay Bills",
        "Join Piggy Pots",
        "Send Gifts",
        "Send Messages",
        "View product details",
        "Complete purchases",
    ];

    return (
        <>
            <div className="bg-white border-[4px] border-black rounded-[30px] p-8 md:p-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-red-100 border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <Ban
                            className="w-11 h-11 text-[#EF4444]"
                            strokeWidth={2.5}
                        />
                    </div>
                </div>

                {/* Title */}
                <h2 className="font-gulfs text-[34px] text-center mt-6 uppercase leading-tight">
                    {blockedByMe
                        ? "You Blocked This Creator"
                        : "Interaction Unavailable"}
                </h2>

                {/* Description */}
                <p className="max-w-2xl mx-auto mt-5 text-center text-[17px] font-semibold text-[#5B6474]">
                    {blockedByMe ? (
                        <>
                            You chose to block this creator. While the block
                            remains active you cannot purchase, support or
                            interact with anything on this profile.
                        </>
                    ) : (
                        <>
                            This creator has blocked your account. Interactions
                            with this profile are currently unavailable.
                        </>
                    )}
                </p>

                {/* Restriction Box */}
                <div className="mt-8 rounded-[24px] border-[3px] border-black bg-gradient-to-b from-white to-[#F7F8FC] p-7 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h4 className="font-black text-lg mb-5">
                        While this block is active you cannot:
                    </h4>

                    <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                        {restrictions.map((item) => (
                            <div
                                key={item}
                                className="flex items-center gap-3 font-semibold text-[#4B5563]"
                            >
                                <span className="text-red-500 text-lg">🚫</span>

                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {blockedByMe && (
                    <>
                        <div className="mt-6 text-center text-sm text-gray-500 font-semibold">
                            You can restore access to this creator at any time.
                        </div>

                        <div className="mt-5 flex justify-center">
                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="
                            flex
                            items-center
                            gap-2
                            px-8
                            py-3
                            rounded-[18px]
                            bg-[#10B981]
                            hover:bg-[#059669]
                            text-white
                            font-black
                            border-[3px]
                            border-black
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            hover:translate-x-[2px]
                            hover:translate-y-[2px]
                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                            transition-all
                            duration-200
                            "
                            >
                                <Unlock className="w-5 h-5" />
                                Unblock Creator
                            </button>
                        </div>
                    </>
                )}
            </div>
            <Modal
                show={showModal}
                onClose={() => {
                    if (!isUnblocking) {
                        setShowModal(false);
                    }
                }}
            >
                <div className="p-8 text-center">
                    <div className="mx-auto w-24 h-24 rounded-full bg-red-100 border-[3px] border-black flex items-center justify-center shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                        <Unlock className="w-10 h-10 text-green-600" />
                    </div>

                    <h2 className="font-gulfs text-3xl mt-6">
                        Unblock Creator?
                    </h2>

                    <p className="mt-4 text-gray-600 font-semibold">
                        Once you unblock this creator you'll immediately regain
                        access to their profile, wishes, memberships, shop items
                        and other interactions.
                    </p>

                    <div className="flex gap-4 justify-center mt-8">
                        <button
                            disabled={isUnblocking}
                            onClick={() => {
                                if (!isUnblocking) {
                                    setShowModal(false);
                                }
                            }}
                            className="px-8 py-3 rounded-[18px] border-[3px] border-black bg-white font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            Cancel
                        </button>

                        <button
                            disabled={isUnblocking}
                            onClick={confirmUnblock}
                            className="min-w-[190px] flex justify-center items-center gap-2 px-8 py-3 rounded-[18px] bg-[#10B981] hover:bg-[#059669] border-[3px] border-black text-white font-black shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-70"
                        >
                            {isUnblocking ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                    >
                                        <circle
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className="opacity-25"
                                        />
                                        <path
                                            d="M4 12a8 8 0 018-8"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                            className="opacity-100"
                                        />
                                    </svg>

                                    <span>Unblocking...</span>
                                </>
                            ) : (
                                <>
                                    <Unlock size={20} />
                                    Unblock Creator
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
            ;
        </>
    );
}
