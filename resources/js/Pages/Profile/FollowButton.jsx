import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAlerts } from "@/Components/Alerts";
import { router, usePage } from "@inertiajs/react";
import toast from "react-hot-toast";

const FollowButton = ({ targetUserId, isInitiallyFollowing }) => {
    const [isFollowing, setIsFollowing] = useState(isInitiallyFollowing);
    const [loading, setLoading] = useState(false);
    const { successAlert, errorAlert, errorsHandling } = useAlerts();
    const { auth } = usePage().props;

    const handleFollowToggle = () => {
        if (!auth?.user) {
            toast.error("You must be logged in to follow.");
            return;
        }

        setLoading(true);

        router.post(
            route("user.follow.unfollow"),
            { user_id: targetUserId },
            {
                preserveScroll: true,
                onSuccess: (page) => {
                    setIsFollowing((prev) => !prev); // Toggle status
                },
                onError: (errors) => {
                    errorAlert(errors?.msg || "Something went wrong.");
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    };

    return (
        <button
            onClick={handleFollowToggle}
            disabled={loading}
            className={`uppercase text-sm font-gulfs btn-shadow rounded-full px-4 pt-[10px] pb-[7px] me-3 ${
                isFollowing? "!bg-gray-300" : "bg-whites bg-voilet text-white"  }`}
        >
            {loading ? isFollowing? "Unfollowing...": "Following...": isFollowing? "Following": "Follow"}
        </button>
    );
};

export default FollowButton;
