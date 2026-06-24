import Authenticated from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import Nocontent from "@/includes/Nocontent";
import Avatar from "@/Components/Avatar";
import { useAlerts } from "@/Components/Alerts";
import Modal from "@/Components/Modal";

export default function BlockedUsers({ auth }) {
    const { blockedUsers } = usePage().props;
    const [users, setUsers] = useState(blockedUsers?.data || []);
    const { successAlert, errorAlert } = useAlerts();
    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUnblocking, setIsUnblocking] = useState(false);

    const handleUnblockClick = (item) => {
        setSelectedUser(item);
        setShowUnblockModal(true);
    };

    const confirmUnblock = async () => {
        if (!selectedUser || isUnblocking) {
            return;
        }

        setIsUnblocking(true);

        try {
            const res = await axios.delete(
                route("creator.security.unblock-user", selectedUser.blocked_id),
            );

            if (res.data.status) {
                setUsers((prev) =>
                    prev.filter(
                        (item) => item.blocked_id !== selectedUser.blocked_id,
                    ),
                );

                successAlert(
                    res.data.message || "User unblocked successfully.",
                );

                setShowUnblockModal(false);
                setSelectedUser(null);
            } else {
                errorAlert(res.data.message || "Something went wrong.");
            }
        } catch (error) {
            console.log(error);

            errorAlert(
                error?.response?.data?.message || "Failed to unblock user.",
            );
        } finally {
            setIsUnblocking(false);
        }
    };

    return (
        <Authenticated auth={auth.user} user={auth.user}>
            <div className="min-h-screen bg-gradient-to-b from-[#E4F8EC] via-[#BCEDCB] to-[#A2E4B8] py-10">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="mb-8">
                        <h1 className="text-4xl font-black text-gray-900">
                            Blocked Users
                        </h1>

                        <p className="text-gray-600 mt-2">
                            Manage people you've blocked.
                        </p>
                    </div>

                    {users.length ? (
                        <div className="space-y-5">
                            {users.map((item) => (
                                <div
                                    key={item.id}
                                    className="
                                    relative
                                    bg-white
                                    border-[3px]
                                    border-black
                                    rounded-[30px]
                                    p-4 md:p-5
                                    min-h-[120px]
                                    flex
                                    flex-col
                                    lg:flex-row
                                    lg:items-center
                                    lg:justify-between
                                    gap-5
                                    shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]
                                    transition-all
                                    duration-200
                                    hover:translate-x-[2px]
                                    hover:translate-y-[2px]
                                    hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                "
                                >
                                    {/* LEFT SIDE */}
                                    <div className="flex items-center gap-5 flex-1 min-w-0">
                                        <Avatar
                                            user={item.blocked_user}
                                            size="h-20 w-20"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 flex-wrap mt-2">
                                                <span
                                                    className="
                                                    px-3
                                                    py-1
                                                    rounded-full
                                                    bg-[#FFF0F7]
                                                    text-[#FF2D8B]
                                                    text-[11px]
                                                    font-black
                                                    uppercase
                                                    tracking-wide
                                                "
                                                >
                                                    🚫 Blocked
                                                </span>

                                                <p className="text-[#64748B] text-sm font-semibold">
                                                    Blocked on{" "}
                                                    {new Date(
                                                        item.created_at,
                                                    ).toLocaleDateString(
                                                        "en-GB",
                                                        {
                                                            day: "2-digit",
                                                            month: "short",
                                                            year: "numeric",
                                                        },
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE */}
                                    <button
                                        onClick={() => handleUnblockClick(item)}
                                        className="
                                            h-[56px]
                                            min-w-[190px]
                                            bg-[#FF2D8B]
                                            border-[3px]
                                            border-black
                                            rounded-[20px]
                                            text-white
                                            font-black
                                            text-sm
                                            uppercase
                                            tracking-wide
                                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                            hover:translate-x-[2px]
                                            hover:translate-y-[2px]
                                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                            transition-all
                                        "
                                    >
                                        Unblock User
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Nocontent text="No blocked users found." />
                    )}
                </div>
            </div>

            <Modal
                show={showUnblockModal}
                maxWidth="xl"
                onClose={() => {
                    setShowUnblockModal(false);
                    setSelectedUser(null);
                }}
            >
                <div
                    className="
                    bg-[#FFFDF9]
                    border-[4px]
                    border-black
                    rounded-[35px]
                    p-8
                    text-center
                    shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]
                "
                >
                    <div className="mb-5">
                        <div
                            className="
                            w-24
                            h-24
                            mx-auto
                            rounded-full
                            bg-[#FFF0F7]
                            border-[3px]
                            border-black
                            flex
                            items-center
                            justify-center
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                        "
                        >
                            <span className="text-5xl">🔓</span>
                        </div>
                    </div>

                    <h3 className="text-3xl font-black text-black mb-3 uppercase">
                        Unblock User
                    </h3>

                    <p className="text-[#5E6472] text-lg font-semibold mb-8">
                        Are you sure you want to unblock
                        <span className="font-bold text-gray-800">
                            {" "}
                            {selectedUser?.blocked_user?.name}
                        </span>
                        ?
                    </p>

                    <div className="flex justify-center gap-4">
                        <button
                            disabled={isUnblocking}
                            onClick={() => {
                                setShowUnblockModal(false);
                                setSelectedUser(null);
                            }}
                            className="
                            px-8
                            py-3
                            rounded-[20px]
                            bg-white
                            border-[3px]
                            border-black
                            font-black
                            uppercase
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            hover:translate-x-[2px]
                            hover:translate-y-[2px]
                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                            transition-all
                        "
                        >
                            Cancel
                        </button>

                        <button
                            onClick={confirmUnblock}
                            disabled={isUnblocking}
                            className="
                            px-8
                            py-3
                            min-w-[220px]
                            h-[60px]
                            flex
                            items-center
                            justify-center
                            rounded-[20px]
                            bg-[#FF2D8B]
                            border-[3px]
                            border-black
                            text-white
                            font-black
                            uppercase
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            hover:translate-x-[2px]
                            hover:translate-y-[2px]
                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                            transition-all
                            disabled:opacity-70
                            disabled:cursor-not-allowed
                        "
                        >
                            {isUnblocking ? (
                                <div className="flex items-center justify-center gap-2">
                                    <svg
                                        className="animate-spin h-5 w-5 flex-shrink-0"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="10"
                                            stroke="currentColor"
                                            strokeWidth="4"
                                        />
                                        <path
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V4a8 8 0 00-8 8z"
                                        />
                                    </svg>

                                    <span>Unblocking...</span>
                                </div>
                            ) : (
                                "Unblock User"
                            )}
                        </button>
                    </div>
                </div>
            </Modal>
        </Authenticated>
    );
}
