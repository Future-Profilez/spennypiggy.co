
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
            errorAlert("You must be logged in to follow.");
            return;
        }

        if (auth?.user?.id === targetUserId) {
            errorAlert("You cannot follow yourself.");
            return;
        }

        setLoading(true);

        router.post(
            route("user.follow.unfollow"),
            { user_id: targetUserId },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFollowing((prev) => !prev); // Correctly toggles status
                },
                onError: (errors) => {
                    // errorAlert(errors?.flash?.error || "Something went wrong.");
                },
                onFinish: () => {
                    setLoading(false);
                },
            }
        );
    };

    return (
        <button onClick={handleFollowToggle} disabled={loading}
            className={`uppercase text-sm font-gulfs rounded-full px-4 pt-[10px] pb-[7px] me-3 ${isFollowing ? "!bg-gray-300 " : "btn-shadow  bg-voilet text-white"}`} > {isFollowing ? "Following" : "Follow"}
        </button>
    );
};

export default FollowButton;
