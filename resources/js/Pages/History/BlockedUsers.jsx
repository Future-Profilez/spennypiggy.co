import Authenticated from "@/Layouts/AuthenticatedLayout";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useState } from "react";
import Nocontent from "@/includes/Nocontent";
import Avatar from "@/Components/Avatar";
import { useAlerts } from "@/Components/Alerts";
import Modal from "@/Components/Modal";
import {
    Ban,
    ShieldAlert,
    AlertCircle,
    Clock,
    UserX,
    ChevronDown,
    ChevronUp,
} from "lucide-react";

export default function BlockedUsers({ auth }) {
    const { blockedUsers } = usePage().props;
    const [users, setUsers] = useState(blockedUsers?.data || []);
    const { successAlert, errorAlert } = useAlerts();
    const [showUnblockModal, setShowUnblockModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isUnblocking, setIsUnblocking] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

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

    const toggleExpand = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    // Get reason badge color and icon
    const getReasonDetails = (reason) => {
        const reasons = {
            "Spam or unwanted messages": {
                color: "bg-orange-100 text-orange-700 border-orange-300",
                icon: <AlertCircle size={14} className="text-orange-500" />,
            },
            "Harassment or bullying": {
                color: "bg-red-100 text-red-700 border-red-300",
                icon: <ShieldAlert size={14} className="text-red-500" />,
            },
            "Inappropriate content": {
                color: "bg-purple-100 text-purple-700 border-purple-300",
                icon: <Ban size={14} className="text-purple-500" />,
            },
            "Scam or fraudulent activity": {
                color: "bg-yellow-100 text-yellow-700 border-yellow-300",
                icon: <AlertCircle size={14} className="text-yellow-500" />,
            },
            "Fake account": {
                color: "bg-blue-100 text-blue-700 border-blue-300",
                icon: <UserX size={14} className="text-blue-500" />,
            },
            "Personal reasons": {
                color: "bg-gray-100 text-gray-700 border-gray-300",
                icon: <AlertCircle size={14} className="text-gray-500" />,
            },
        };
        return (
            reasons[reason] || {
                color: "bg-gray-100 text-gray-700 border-gray-300",
                icon: <AlertCircle size={14} className="text-gray-500" />,
            }
        );
    };

    return (
        <Authenticated auth={auth.user} user={auth.user}>
            <div className="min-h-screen bg-gradient-to-b from-[#E4F8EC] via-[#BCEDCB] to-[#A2E4B8] py-10">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white border-[3px] border-black rounded-[20px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <UserX size={28} className="text-red-500" />
                            </div>
                            <h1 className="text-4xl font-black text-gray-900">
                                Blocked Users
                            </h1>
                            {users.length > 0 && (
                                <span className="bg-red-500 text-white font-black text-sm px-4 py-1 rounded-full border-[2px] border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                    {users.length}
                                </span>
                            )}
                        </div>

                        <p className="text-gray-600 mt-2 font-semibold ml-1">
                            Manage people you've blocked and review your
                            decisions.
                        </p>
                    </div>

                    {users.length ? (
                        <div className="space-y-4">
                            {users.map((item) => {
                                const reasonDetails = getReasonDetails(
                                    item.reason,
                                );
                                const isExpanded = expandedId === item.id;

                                return (
                                    <div
                                        key={item.id}
                                        className="
                                        relative
                                        bg-white
                                        border-[3px]
                                        border-black
                                        rounded-[30px]
                                        p-4 md:p-5
                                        transition-all
                                        duration-200
                                        shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                        hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                        hover:translate-x-[2px]
                                        hover:translate-y-[2px]
                                    "
                                    >
                                        {/* Main Content - Always Visible */}
                                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                            {/* LEFT SIDE */}
                                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                                <div className="relative flex-shrink-0">
                                                    <Avatar
                                                        user={item.blocked_user}
                                                        size="h-16 w-16 md:h-20 md:w-20"
                                                        className="border-[3px] border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                                                    />
                                                    <div className="absolute -bottom-1 -right-1 bg-red-500 border-2 border-black rounded-full p-1">
                                                        <Ban
                                                            size={12}
                                                            className="text-white"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    

                                                    <div className="flex items-center gap-3 flex-wrap mt-1.5">
                                                        {/* Reason Badge */}
                                                        <span
                                                            className={`
                                                            inline-flex items-center gap-1.5
                                                            px-3 py-1
                                                            rounded-full
                                                            border-2
                                                            text-[11px] font-black
                                                            uppercase tracking-wide
                                                            ${reasonDetails.color}
                                                        `}
                                                        >
                                                            {reasonDetails.icon}
                                                            {item.reason ||
                                                                "No reason provided"}
                                                        </span>

                                                        {/* Date Badge */}
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 border-2 border-gray-300 text-[11px] font-black text-gray-600 uppercase tracking-wide">
                                                            <Clock
                                                                size={14}
                                                                className="text-gray-500"
                                                            />
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
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT SIDE - Actions */}
                                            <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                                                {/* Expand/Collapse Button */}
                                                <button
                                                    onClick={() =>
                                                        toggleExpand(item.id)
                                                    }
                                                    className="
                                                    h-[48px] w-[48px]
                                                    flex items-center justify-center
                                                    bg-gray-100
                                                    border-[3px] border-black
                                                    rounded-[16px]
                                                    shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                                                    hover:translate-x-[2px] hover:translate-y-[2px]
                                                    hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                    transition-all
                                                    text-gray-700
                                                    hover:bg-gray-200
                                                "
                                                    title="View details"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronUp
                                                            size={20}
                                                            strokeWidth={3}
                                                        />
                                                    ) : (
                                                        <ChevronDown
                                                            size={20}
                                                            strokeWidth={3}
                                                        />
                                                    )}
                                                </button>

                                                {/* Unblock Button */}
                                                <button
                                                    onClick={() =>
                                                        handleUnblockClick(item)
                                                    }
                                                    className="
                                                    h-[48px] min-w-[150px] md:min-w-[180px]
                                                    flex items-center justify-center gap-2
                                                    bg-[#FF2D8B]
                                                    border-[3px] border-black
                                                    rounded-[16px]
                                                    text-white font-black text-sm uppercase tracking-wide
                                                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                                                    hover:translate-x-[2px] hover:translate-y-[2px]
                                                    hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                                                    transition-all
                                                    hover:bg-[#FF007F]
                                                "
                                                >
                                                    <UserX
                                                        size={16}
                                                        className="rotate-180"
                                                    />
                                                    Unblock
                                                </button>
                                            </div>
                                        </div>

                                        {/* Expanded Details Section */}
                                        {isExpanded && (
                                            <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Block Reason Detail */}
                                                    <div className="bg-gray-50 border-2 border-black rounded-[16px] p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <ShieldAlert
                                                                size={18}
                                                                className="text-red-500"
                                                            />
                                                            <h4 className="font-black text-sm uppercase text-gray-700">
                                                                Block Reason
                                                            </h4>
                                                        </div>
                                                        <p className="text-gray-800 font-semibold text-sm">
                                                            {item.reason ||
                                                                "No reason provided"}
                                                        </p>
                                                    </div>

                                                    {/* Block Date Detail */}
                                                    <div className="bg-gray-50 border-2 border-black rounded-[16px] p-4">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Clock
                                                                size={18}
                                                                className="text-blue-500"
                                                            />
                                                            <h4 className="font-black text-sm uppercase text-gray-700">
                                                                Blocked Date
                                                            </h4>
                                                        </div>
                                                        <p className="text-gray-800 font-semibold text-sm">
                                                            {new Date(
                                                                item.created_at,
                                                            ).toLocaleDateString(
                                                                "en-GB",
                                                                {
                                                                    weekday:
                                                                        "long",
                                                                    day: "2-digit",
                                                                    month: "long",
                                                                    year: "numeric",
                                                                    hour: "2-digit",
                                                                    minute: "2-digit",
                                                                },
                                                            )}
                                                        </p>
                                                    </div>

                                                    {/* Blocked User Info */}
                                                    <div className="bg-gray-50 border-2 border-black rounded-[16px] p-4 md:col-span-2">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <UserX
                                                                size={18}
                                                                className="text-purple-500"
                                                            />
                                                            <h4 className="font-black text-sm uppercase text-gray-700">
                                                                Blocked User
                                                                Information
                                                            </h4>
                                                        </div>
                                                        <div className="flex items-center gap-4">
                                                            <Avatar
                                                                user={
                                                                    item.blocked_user
                                                                }
                                                                size="h-12 w-12"
                                                                className="border-2 border-black"
                                                            />
                                                            
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white border-[3px] border-black rounded-[30px] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-12 text-center">
                            <div className="w-24 h-24 mx-auto bg-gray-100 border-[3px] border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-4">
                                <UserX size={40} className="text-gray-400" />
                            </div>
                            <p className="text-xl font-black text-gray-700 uppercase">
                                No Blocked Users
                            </p>
                            <p className="text-gray-500 font-semibold mt-2">
                                You haven't blocked anyone yet.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Unblock Confirmation Modal */}
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
                    p-6 md:p-8
                    text-center
                    shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                "
                >
                    <div className="mb-5">
                        <div
                            className="
                            w-24 h-24
                            mx-auto
                            rounded-full
                            bg-[#FFF0F7]
                            border-[3px] border-black
                            flex items-center justify-center
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            relative
                        "
                        >
                            <span className="text-5xl">🔓</span>
                            <div className="absolute -top-1 -right-1 bg-green-500 border-2 border-black rounded-full p-1">
                                <svg
                                    className="w-4 h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="3"
                                        d="M5 13l4 4L19 7"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <h3 className="text-3xl font-black text-black mb-2 uppercase">
                        Unblock User
                    </h3>

                    <p className="text-[#5E6472] text-lg font-semibold mb-2">
                        Are you sure you want to unblock
                    </p>
                    <p className="text-2xl font-black text-gray-900 mb-1">
                        {selectedUser?.blocked_user?.name}
                    </p>
                    <p className="text-gray-500 font-semibold text-sm mb-6">
                        @{selectedUser?.blocked_user?.username}
                    </p>

                    {/* Show block reason in modal */}
                    {selectedUser?.reason && (
                        <div className="bg-gray-50 border-2 border-black rounded-[20px] p-4 mb-6 text-left">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldAlert
                                    size={18}
                                    className="text-red-500"
                                />
                                <span className="font-black text-sm uppercase text-gray-700">
                                    Block Reason
                                </span>
                            </div>
                            <p className="text-gray-800 font-semibold">
                                {selectedUser.reason}
                            </p>
                            <p className="text-gray-400 text-xs font-semibold mt-1">
                                Blocked on{" "}
                                {new Date(
                                    selectedUser.created_at,
                                ).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "long",
                                    year: "numeric",
                                })}
                            </p>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                        <button
                            disabled={isUnblocking}
                            onClick={() => {
                                setShowUnblockModal(false);
                                setSelectedUser(null);
                            }}
                            className="
                            px-8 py-3
                            rounded-[20px]
                            bg-white
                            border-[3px] border-black
                            font-black uppercase
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            hover:translate-x-[2px] hover:translate-y-[2px]
                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                            transition-all
                            disabled:opacity-50
                            disabled:cursor-not-allowed
                            min-w-[140px]
                        "
                        >
                            Cancel
                        </button>

                        <button
                            onClick={confirmUnblock}
                            disabled={isUnblocking}
                            className="
                            px-8 py-3
                            min-w-[180px]
                            flex items-center justify-center gap-2
                            rounded-[20px]
                            bg-[#FF2D8B]
                            border-[3px] border-black
                            text-white font-black uppercase
                            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                            hover:translate-x-[2px] hover:translate-y-[2px]
                            hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                            transition-all
                            disabled:opacity-70
                            disabled:cursor-not-allowed
                            hover:bg-[#FF007F]
                        "
                        >
                            {isUnblocking ? (
                                <>
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
                                </>
                            ) : (
                                <>
                                    <UserX size={18} className="rotate-180" />
                                    Unblock User
                                </>
                            )}
                        </button>
                    </div>

                    <p className="text-xs text-gray-400 font-semibold mt-4">
                        This action will restore all interactions with this
                        user.
                    </p>
                </div>
            </Modal>
        </Authenticated>
    );
}
