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
                                    bg-white
                                    rounded-[35px]
                                    border-2
                                    border-black/10
                                    p-5 md:p-6
                                    flex
                                    flex-col
                                    lg:flex-row
                                    lg:items-center
                                    lg:justify-between
                                    gap-5
                                    shadow-[0_8px_25px_rgba(0,0,0,0.08)]
                                    transition-all
                                    duration-300
                                    hover:-translate-y-1
                                    hover:shadow-[0_15px_35px_rgba(0,0,0,0.12)]
                                "
                                >
                                    {/* LEFT SIDE */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <Avatar
                                            user={item.blocked_user}
                                            size="h-20 w-20"
                                        />

                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span
                                                    className="
                                                    px-3
                                                    py-1
                                                    rounded-full
                                                    bg-red-100
                                                    text-red-600
                                                    text-xs
                                                    font-bold
                                                "
                                                >
                                                    BLOCKED
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-3">
                                                <span className="text-xs text-red-500 font-semibold">
                                                    Blocked on{" "}
                                                    {new Date(
                                                        item.created_at,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* RIGHT SIDE */}
                                    <button
                                        onClick={() => handleUnblockClick(item)}
                                        className="
                                        h-[56px]
                                        min-w-[180px]
                                        rounded-[20px]
                                        bg-gradient-to-r
                                        from-[#FF2D8B]
                                        to-[#FF5B6D]
                                        text-white
                                        font-black
                                        text-sm
                                        uppercase
                                        tracking-wide
                                        transition-all
                                        duration-300
                                        hover:scale-105
                                        shadow-lg
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
                onClose={() => {
                    setShowUnblockModal(false);
                    setSelectedUser(null);
                }}
            >
                <div className="p-8 text-center">
                    <div className="mb-5">
                        <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                            <span className="text-4xl">🔓</span>
                        </div>
                    </div>

                    <h3 className="text-2xl font-black text-gray-900 mb-3">
                        Unblock User
                    </h3>

                    <p className="text-gray-500 mb-8">
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
                                px-6
                                py-3
                                rounded-[20px]
                                border
                                border-gray-300
                                font-bold
                                hover:bg-gray-100
                                transition
                                disabled:opacity-50
                                disabled:cursor-not-allowed
                            "
                        >
                            Cancel
                        </button>

                        <button
                            onClick={confirmUnblock}
                            disabled={isUnblocking}
                            className="
                            px-6
                            py-3
                            min-w-[180px]
                            rounded-[20px]
                            bg-gradient-to-r
                            from-[#FF2D8B]
                            to-[#FF5B6D]
                            text-white
                            font-bold
                            shadow-lg
                            transition
                            disabled:opacity-70
                            disabled:cursor-not-allowed
                            flex
                            items-center
                            justify-center
                            gap-2
                        "
                        >
                            {isUnblocking ? (
                                <>
                                    <svg
                                        className="animate-spin h-5 w-5"
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
                                    Unblocking...
                                </>
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
